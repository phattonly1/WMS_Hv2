"use server";

import { createClient } from "@/utils/supabase/server";
import type { MapMarker, Station, StationMaster } from "./stationData";

// 측정소 추가/수정 (stations_master 및 map_markers 대응)
export async function upsertStation(stationData: Partial<Station>) {
	const supabase = await createClient();

	const { id, ...rest } = stationData;
	const isMarker = rest.type === "arrow" || rest.type === "poi";

	if (isMarker) {
		const markerItem: Record<string, unknown> = {
			name: rest.name,
			lat: Number(rest.lat),
			lng: Number(rest.lng),
			type: rest.type,
			river: rest.river,
			angle: Number(rest.angle) || 0,
			color: rest.color || null,
		};
		const res = id
			? await supabase
					.from("map_markers")
					.update(markerItem)
					.eq("id", id)
					.select()
			: await supabase.from("map_markers").insert(markerItem).select();

		if (res.error) {
			console.error("upsertStation(map_markers) DB error:", res.error);
			return { error: res.error.message };
		}
		return { success: true, id: res.data?.[0]?.id };
	}

	const item: Record<string, unknown> = {
		name: rest.name,
		lat: Number(rest.lat),
		lng: Number(rest.lng),
		type: rest.type,
		river: rest.river,
		status: rest.is_deleted ? "종료" : "현재",
	};

	if (rest.office !== undefined) item.office = rest.office;
	if (rest.address !== undefined) item.address = rest.address;
	if (rest.facility_type !== undefined) item.facility_type = rest.facility_type;
	if (rest.install_date !== undefined) item.install_date = rest.install_date;
	if (rest.description !== undefined) item.description = rest.description;
	if (rest.features) item.features = rest.features;
	if (rest.instruments) item.instruments = rest.instruments;
	if (rest.history) item.history = rest.history;

	const isUuid =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
			id || "",
		);
	const query = supabase.from("stations_master");
	let res;
	if (id) {
		let updateQuery = query.update(item);
		if (isUuid) {
			updateQuery = updateQuery.or(`id.eq.${id},station_id.eq.${id}`);
		} else {
			updateQuery = updateQuery.eq("station_id", id);
		}
		const updateRes = await updateQuery.select();

		if (updateRes.data && updateRes.data.length > 0) {
			res = updateRes;
		} else {
			item.station_id = id.startsWith("ST_") ? id : `ST_${Date.now()}`;
			res = await supabase.from("stations_master").insert(item).select();
		}
	} else {
		item.station_id = `ST_${Date.now()}`;
		res = await supabase.from("stations_master").insert(item).select();
	}

	if (res.error) {
		console.error("upsertStation DB error:", res.error);
		return { error: res.error.message };
	}

	if (!res.data || res.data.length === 0) {
		console.error("upsertStation: 0 rows affected:", id);
		return { error: "데이터가 반영되지 않았습니다. 권한을 확인해주세요." };
	}

	const firstRow = res.data[0];
	return {
		success: true,
		id:
			(firstRow as { station_id?: string; id?: string }).station_id ||
			(firstRow as { id?: string }).id,
	};
}

// ============================================================
// 측정소 마스터 (stations_master) 액션
// ============================================================
export async function upsertStationMaster(data: Partial<StationMaster>) {
	const supabase = await createClient();
	const { id, ...item } = data;

	const matchKey = id || (item as { station_id?: string }).station_id;
	const isUuid =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
			matchKey || "",
		);

	let res;
	if (matchKey) {
		const updateRes = await supabase
			.from("stations_master")
			.update(item)
			.eq(isUuid ? "id" : "station_id", matchKey)
			.select();

		if (updateRes.data && updateRes.data.length > 0) {
			res = updateRes;
		} else {
			res = await supabase.from("stations_master").insert(item).select();
		}
	} else {
		res = await supabase.from("stations_master").insert(item).select();
	}

	if (res.error) {
		console.error("upsertStationMaster error:", res.error);
		return { error: res.error.message };
	}
	return { success: true, data: res.data?.[0] };
}

// ============================================================
// 지도 보조 마커 (map_markers: 흐름 + POI) 액션
// ============================================================
export async function upsertMapMarker(data: Partial<MapMarker>) {
	const supabase = await createClient();
	const { id, ...item } = data;

	const res = id
		? await supabase.from("map_markers").update(item).eq("id", id).select()
		: await supabase.from("map_markers").insert(item).select();

	if (res.error) {
		console.error("upsertMapMarker error:", res.error);
		return { error: res.error.message };
	}
	return { success: true, data: res.data?.[0] };
}

export async function deleteMapMarker(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.from("map_markers").delete().eq("id", id);
	if (error) return { error: error.message };
	return { success: true };
}

// ============================================================
// 국립환경과학원(NIER) 실시간 수질 48시간 누적 캐시 조회 액션 (Supabase pg_cron 연동)
// ============================================================
import {
	getNierStationCode,
	type RealtimeWaterQuality,
	type WaterQualityAverageMap,
} from "./nierStationMap";

const CACHE_BUCKET = "cache";
const CACHE_OBJECT_PATH = "nier_48h_cache.json";
const MAX_HISTORY_HOURS = 48;

// Supabase Storage 1-파일 누적 캐시 페이로드 구조
export interface NierRollingCachePayload {
	lastHourKey: string;
	updatedAt: string;
	// 측정소 코드 -> 최근 최대 48시간 시계열 배열 (시간 오름차순)
	stations: Record<string, RealtimeWaterQuality[]>;
	// 측정소 코드 -> 전일(또는 누적 24h) 평균값
	prevAvgByCode: Record<string, WaterQualityAverageMap>;
}

// 서버 인메모리 1차 캐시
let cachedRollingState: NierRollingCachePayload | null = null;
let cachedRealtimeMap: Record<string, RealtimeWaterQuality> | null = null;
let cachedHourKey: string = "";

// 매시 12분 기준 시간대 키 산출 헬퍼 (현재 시각 - 12분, KST 기준)
function getHourlySyncKey(): string {
	const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000 - 12 * 60 * 1000);
	const y = kstNow.getUTCFullYear();
	const m = String(kstNow.getUTCMonth() + 1).padStart(2, "0");
	const d = String(kstNow.getUTCDate()).padStart(2, "0");
	const h = String(kstNow.getUTCHours()).padStart(2, "0");
	return `${y}-${m}-${d}-${h}`;
}

// Supabase Storage에서 48시간 누적 JSON 읽기
async function loadRollingCacheFromStorage(): Promise<NierRollingCachePayload | null> {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	if (!supabaseUrl) return null;

	const currentHourKey = getHourlySyncKey();
	if (cachedRollingState && cachedHourKey === currentHourKey) {
		return cachedRollingState;
	}

	try {
		const res = await fetch(
			`${supabaseUrl}/storage/v1/object/public/${CACHE_BUCKET}/${CACHE_OBJECT_PATH}?t=${Date.now()}`,
			{
				method: "GET",
				cache: "no-store",
			},
		);
		if (!res.ok) return cachedRollingState;
		const parsed = (await res.json()) as NierRollingCachePayload;
		if (parsed && parsed.stations && typeof parsed.stations === "object") {
			cachedRollingState = parsed;
			cachedHourKey = currentHourKey;
			return parsed;
		}
		return cachedRollingState;
	} catch {
		return cachedRollingState;
	}
}

export async function getAllStationsRealtimeWaterQuality(): Promise<
	Record<string, RealtimeWaterQuality>
> {
	try {
		const currentHourKey = getHourlySyncKey();
		if (
			cachedRealtimeMap &&
			cachedHourKey === currentHourKey &&
			Object.keys(cachedRealtimeMap).length > 0
		) {
			return cachedRealtimeMap;
		}

		const storageCache = await loadRollingCacheFromStorage();
		if (storageCache?.stations) {
			const mapFromStorage: Record<string, RealtimeWaterQuality> = {};
			for (const [code, historyArr] of Object.entries(storageCache.stations)) {
				if (historyArr && historyArr.length > 0) {
					const latestItem = historyArr[historyArr.length - 1]!;
					mapFromStorage[code] = {
						...latestItem,
						prevAvg: storageCache.prevAvgByCode?.[code],
					};
				}
			}

			if (Object.keys(mapFromStorage).length > 0) {
				cachedRealtimeMap = mapFromStorage;
				return mapFromStorage;
			}
		}

		return cachedRealtimeMap || {};
	} catch (err) {
		console.error("getAllStationsRealtimeWaterQuality error:", err);
		return cachedRealtimeMap || {};
	}
}

export async function getRealtimeWaterQuality(
	stationNameOrCode: string,
): Promise<{
	latest: RealtimeWaterQuality | null;
	history: RealtimeWaterQuality[];
	error?: string;
}> {
	const stationCode = getNierStationCode(stationNameOrCode);
	if (!stationCode) {
		return {
			latest: null,
			history: [],
			error: `측정소 코드 매핑 실패: ${stationNameOrCode}`,
		};
	}

	try {
		const rollingState = await loadRollingCacheFromStorage();
		const accumulated = rollingState?.stations?.[stationCode] || [];

		if (accumulated.length === 0) {
			return { latest: null, history: [] };
		}

		const prevAvg = rollingState?.prevAvgByCode?.[stationCode];
		const trimmedHistory = accumulated.slice(-MAX_HISTORY_HOURS);
		const latestRaw = trimmedHistory[trimmedHistory.length - 1] ?? null;

		return {
			latest: latestRaw ? { ...latestRaw, prevAvg } : null,
			history: trimmedHistory,
		};
	} catch (err: unknown) {
		console.error("getRealtimeWaterQuality error:", err);
		return {
			latest: null,
			history: [],
			error:
				err instanceof Error
					? err.message
					: "실시간 수질 조회 중 오류가 발생했습니다.",
		};
	}
}
