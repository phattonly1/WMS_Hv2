"use server";

import { createClient } from "@/utils/supabase/server";
import type { MapMarker, Station, StationMaster } from "./stationData";

const NIER_WATER_API_BASE =
	process.env.NIER_WATER_API_BASE || "https://water.nier.go.kr";

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
// 국립환경과학원(NIER) 실시간 수질 데이터 조회 및 48시간 누적 캐시 액션
// ============================================================
import {
	getAllNierStationCodes,
	getNierStationCode,
	type RealtimeWaterQuality,
	type WaterQualityAverageMap,
	type WaterQualityMetricKey,
} from "./nierStationMap";

const CACHE_BUCKET = "items";
const CACHE_OBJECT_PATH = "_cache/nier_48h_cache.json";
const MAX_HISTORY_HOURS = 48;

const METRIC_KEYS: WaterQualityMetricKey[] = [
	"wqi",
	"wtrtp",
	"ph",
	"doc",
	"ec",
	"tur",
	"toc",
	"tn",
	"tp",
	"chla",
];

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

// 특정 측정소 24~48시간 시계열 이력 메모리 캐시 (stationCode -> { hourKey, data })
const cachedHistoryMap: Record<
	string,
	{
		hourKey: string;
		data: {
			latest: RealtimeWaterQuality | null;
			history: RealtimeWaterQuality[];
		};
	}
> = {};

// 매시 12분 기준 시간대 키 산출 헬퍼 (현재 시각 - 12분, KST 기준)
// NIER 데이터가 매시 10~15분 사이에 갱신되므로 12분 이후부터 새 시간대 키로 전환
function getHourlySyncKey(): string {
	const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000 - 12 * 60 * 1000);
	const y = kstNow.getUTCFullYear();
	const m = String(kstNow.getUTCMonth() + 1).padStart(2, "0");
	const d = String(kstNow.getUTCDate()).padStart(2, "0");
	const h = String(kstNow.getUTCHours()).padStart(2, "0");
	return `${y}-${m}-${d}-${h}`;
}

function getKstDateStrings(): { todayHyphen: string; yesterdayHyphen: string } {
	const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
	const pad = (n: number) => String(n).padStart(2, "0");
	const todayHyphen = `${kstNow.getUTCFullYear()}-${pad(kstNow.getUTCMonth() + 1)}-${pad(kstNow.getUTCDate())}`;
	const kstYest = new Date(kstNow.getTime() - 24 * 60 * 60 * 1000);
	const yesterdayHyphen = `${kstYest.getUTCFullYear()}-${pad(kstYest.getUTCMonth() + 1)}-${pad(kstYest.getUTCDate())}`;
	return { todayHyphen, yesterdayHyphen };
}

// 시계열 배열로부터 전일 평균(전일 레코드가 부족하면 최신 제외한 직전 기록 평균) 산출
function computePrevAvgFromHistory(
	records: RealtimeWaterQuality[],
): WaterQualityAverageMap {
	if (!records || records.length === 0) return {};
	const { yesterdayHyphen } = getKstDateStrings();

	// 1순위: 어제 날짜("YYYY-MM-DD")에 해당하는 시간별 레코드들
	let targetRecords = records.filter((r) =>
		r.measureDt?.startsWith(yesterdayHyphen),
	);

	// 2순위: 아직 어제 날짜 데이터가 충분히 안 쌓인 경우, 가장 최신 1건을 제외한 이전 누적 레코드들 사용
	if (targetRecords.length === 0) {
		targetRecords = records.length > 1 ? records.slice(0, -1) : records;
	}

	const avgMap: WaterQualityAverageMap = {};
	for (const key of METRIC_KEYS) {
		const validNums = targetRecords
			.map((r) => r[key])
			.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
		if (validNums.length > 0) {
			const sum = validNums.reduce((a, b) => a + b, 0);
			avgMap[key] = Number((sum / validNums.length).toFixed(4));
		} else {
			avgMap[key] = null;
		}
	}
	return avgMap;
}

// Supabase Storage에서 48시간 누적 JSON 읽기 (1줄/1파일 캐시)
async function loadRollingCacheFromStorage(): Promise<NierRollingCachePayload | null> {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseKey =
		process.env.SUPABASE_SERVICE_ROLE_KEY ||
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	if (!supabaseUrl || !supabaseKey) return null;

	try {
		const res = await fetch(
			`${supabaseUrl}/storage/v1/object/public/${CACHE_BUCKET}/${CACHE_OBJECT_PATH}?t=${Date.now()}`,
			{
				method: "GET",
				cache: "no-store",
			},
		);
		if (!res.ok) return null;
		const parsed = (await res.json()) as NierRollingCachePayload;
		if (parsed && parsed.stations && typeof parsed.stations === "object") {
			return parsed;
		}
		return null;
	} catch {
		return null;
	}
}

// Supabase Storage에 48시간 누적 JSON 덮어쓰기 (단 1개 파일로 유지)
async function saveRollingCacheToStorage(
	payload: NierRollingCachePayload,
): Promise<void> {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseKey =
		process.env.SUPABASE_SERVICE_ROLE_KEY ||
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	if (!supabaseUrl || !supabaseKey) return;

	try {
		await fetch(
			`${supabaseUrl}/storage/v1/object/${CACHE_BUCKET}/${CACHE_OBJECT_PATH}`,
			{
				method: "POST",
				headers: {
					apikey: supabaseKey,
					Authorization: `Bearer ${supabaseKey}`,
					"Content-Type": "application/json",
					"x-upsert": "true",
				},
				body: JSON.stringify(payload),
				cache: "no-store",
			},
		);
	} catch (err) {
		console.error("saveRollingCacheToStorage error:", err);
	}
}

// NIER /web/autoWaterData/listJson 1회 호출하여 최신 스냅샷 가져오기
async function fetchNierLatestSnapshot(): Promise<
	Record<string, RealtimeWaterQuality>
> {
	const res = await fetch(`${NIER_WATER_API_BASE}/web/autoWaterData/listJson`, {
		method: "POST",
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			Referer: `${NIER_WATER_API_BASE}/web`,
			Accept: "application/json, text/javascript, */*; q=0.01",
			"X-Requested-With": "XMLHttpRequest",
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
		},
		body: "a=1",
		cache: "no-store",
	});

	if (!res.ok) return {};

	const data = (await res.json()) as {
		atoWaterData?: Record<string, unknown>[];
	};
	const list: Record<string, unknown>[] = data.atoWaterData || [];

	const parseVal = (val: unknown): number | null => {
		if (val === null || val === undefined || val === "") return null;
		const n = Number(String(val).trim());
		return Number.isNaN(n) ? null : n;
	};

	const byCode: Record<string, RealtimeWaterQuality> = {};

	for (const item of list) {
		const code = typeof item.WQAMN_CODE === "string" ? item.WQAMN_CODE : "";
		if (!code) continue;

		// MESURE_DT 예: "20261030010000" -> "2026-10-30 01h"
		let measureDt =
			typeof item.MSR_DATE_FMT === "string" ? item.MSR_DATE_FMT : "";
		if (item.MESURE_DT && String(item.MESURE_DT).length >= 10) {
			const raw = String(item.MESURE_DT);
			measureDt = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)} ${raw.slice(8, 10)}h`;
		}

		byCode[code] = {
			stationCode: code,
			stationName: typeof item.WQAMN_NM === "string" ? item.WQAMN_NM : "",
			measureDt,
			grade: typeof item.WQI_GRD_NM === "string" ? item.WQI_GRD_NM : null,
			wqi: parseVal(item.WQI),
			wtrtp: parseVal(item.STTUS_WTRTP),
			ph: parseVal(item.STTUS_PH),
			ec: parseVal(item.STTUS_EC),
			doc: parseVal(item.STTUS_DOC),
			toc: parseVal(item.STTUS_TOC),
			tn: parseVal(item.STTUS_TN),
			tp: parseVal(item.STTUS_TP),
			tur: parseVal(item.STTUS_TUR),
			chla: parseVal(item.STTUS_CHLA),
		};
	}

	return byCode;
}

// 실시간 1회 스냅샷을 48시간 누적 캐시에 병합 & 저장 (크론 및 온디맨드 공용)
export async function syncNierRealtimeSnapshotToRollingCache(
	forceFetch = false,
): Promise<{
	realtimeMap: Record<string, RealtimeWaterQuality>;
	rollingState: NierRollingCachePayload | null;
}> {
	const currentHourKey = getHourlySyncKey();

	// 1. 인메모리 캐시가 현재 시간대와 일치하면 즉시 반환
	if (
		!forceFetch &&
		cachedRealtimeMap &&
		cachedRollingState &&
		cachedHourKey === currentHourKey &&
		Object.keys(cachedRealtimeMap).length > 0
	) {
		return {
			realtimeMap: cachedRealtimeMap,
			rollingState: cachedRollingState,
		};
	}

	// 2. Supabase Storage에서 기존 48시간 누적 파일 로드
	let existingCache = cachedRollingState;
	if (!existingCache || existingCache.lastHourKey !== currentHourKey) {
		const storageCache = await loadRollingCacheFromStorage();
		if (storageCache) {
			existingCache = storageCache;
		}
	}

	// 만약 Storage에 이미 누군가(또는 크론이) 이번 시간대 데이터를 누적해 두었다면 NIER 호출 생략!
	if (
		!forceFetch &&
		existingCache &&
		existingCache.lastHourKey === currentHourKey &&
		Object.keys(existingCache.stations).length > 0
	) {
		const mapFromStorage: Record<string, RealtimeWaterQuality> = {};
		for (const [code, historyArr] of Object.entries(existingCache.stations)) {
			if (historyArr && historyArr.length > 0) {
				const latestItem = historyArr[historyArr.length - 1]!;
				const prevAvg =
					existingCache.prevAvgByCode?.[code] ??
					computePrevAvgFromHistory(historyArr);
				mapFromStorage[code] = {
					...latestItem,
					prevAvg,
				};
			}
		}

		if (Object.keys(mapFromStorage).length > 0) {
			cachedRollingState = existingCache;
			cachedRealtimeMap = mapFromStorage;
			cachedHourKey = currentHourKey;
			return {
				realtimeMap: mapFromStorage,
				rollingState: existingCache,
			};
		}
	}

	// 3. 이번 시간대 최초 수집: NIER listJson 단 1회 호출
	const snapshotByCode = await fetchNierLatestSnapshot();
	if (Object.keys(snapshotByCode).length === 0) {
		return {
			realtimeMap: cachedRealtimeMap || {},
			rollingState: existingCache || null,
		};
	}

	const our23Codes = new Set(getAllNierStationCodes());
	const nextStations: Record<string, RealtimeWaterQuality[]> = {
		...(existingCache?.stations || {}),
	};
	const nextPrevAvgByCode: Record<string, WaterQualityAverageMap> = {
		...(existingCache?.prevAvgByCode || {}),
	};

	// 23개 측정소(및 응답된 측정소) 시계열 배열에 이번 시간 데이터 1건 누적 후 최대 48개 유지
	for (const [code, latestRecord] of Object.entries(snapshotByCode)) {
		// 용량 최적화를 위해 우리 23개 측정소 위주로 48시간 시계열 누적
		if (!our23Codes.has(code)) continue;

		const prevList = Array.isArray(nextStations[code])
			? [...nextStations[code]!]
			: [];
		const cleanRecord: RealtimeWaterQuality = { ...latestRecord };
		delete cleanRecord.prevAvg;

		if (prevList.length > 0) {
			const lastIdx = prevList.length - 1;
			if (prevList[lastIdx]?.measureDt === cleanRecord.measureDt) {
				prevList[lastIdx] = cleanRecord;
			} else {
				prevList.push(cleanRecord);
			}
		} else {
			prevList.push(cleanRecord);
		}

		// 측정일시 오름차순 정렬 및 최근 48시간 슬라이스
		prevList.sort((a, b) => a.measureDt.localeCompare(b.measureDt));
		const trimmed = prevList.slice(-MAX_HISTORY_HOURS);
		nextStations[code] = trimmed;

		// 전일(또는 누적) 평균 재계산
		const avg = computePrevAvgFromHistory(trimmed);
		nextPrevAvgByCode[code] = avg;
	}

	// 최신 스냅샷 맵에 prevAvg 주입
	const enrichedRealtimeMap: Record<string, RealtimeWaterQuality> = {};
	for (const [code, item] of Object.entries(snapshotByCode)) {
		enrichedRealtimeMap[code] = {
			...item,
			prevAvg: nextPrevAvgByCode[code] || undefined,
		};
	}

	const nextPayload: NierRollingCachePayload = {
		lastHourKey: currentHourKey,
		updatedAt: new Date().toISOString(),
		stations: nextStations,
		prevAvgByCode: nextPrevAvgByCode,
	};

	cachedRollingState = nextPayload;
	cachedRealtimeMap = enrichedRealtimeMap;
	cachedHourKey = currentHourKey;

	// 비동기로 Supabase Storage 단일 JSON 파일에 덮어쓰기
	void saveRollingCacheToStorage(nextPayload);

	return {
		realtimeMap: enrichedRealtimeMap,
		rollingState: nextPayload,
	};
}

export async function getAllStationsRealtimeWaterQuality(): Promise<
	Record<string, RealtimeWaterQuality>
> {
	try {
		// 지도를 켤 때는 NIER를 호출하지 않고 Storage에 저장된 최신 48시간 캐시만 즉시 읽어서 반환
		const currentHourKey = getHourlySyncKey();
		if (
			cachedRealtimeMap &&
			cachedRollingState &&
			cachedHourKey === currentHourKey &&
			Object.keys(cachedRealtimeMap).length > 0
		) {
			return cachedRealtimeMap;
		}

		// Storage에서 누적 캐시 파일 로드
		const storageCache = await loadRollingCacheFromStorage();
		if (storageCache && storageCache.stations) {
			const mapFromStorage: Record<string, RealtimeWaterQuality> = {};
			for (const [code, historyArr] of Object.entries(storageCache.stations)) {
				if (historyArr && historyArr.length > 0) {
					const latestItem = historyArr[historyArr.length - 1]!;
					const prevAvg =
						storageCache.prevAvgByCode?.[code] ??
						computePrevAvgFromHistory(historyArr);
					mapFromStorage[code] = {
						...latestItem,
						prevAvg,
					};
				}
			}

			if (Object.keys(mapFromStorage).length > 0) {
				cachedRollingState = storageCache;
				cachedRealtimeMap = mapFromStorage;
				cachedHourKey = currentHourKey;
				return mapFromStorage;
			}
		}

		// Storage에도 데이터가 전혀 없을 때만 최후의 안전장치(Fallback)로 1회 호출
		const { realtimeMap } = await syncNierRealtimeSnapshotToRollingCache(false);
		return realtimeMap;
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

	const currentHourKey = getHourlySyncKey();
	if (
		cachedHistoryMap[stationCode] &&
		cachedHistoryMap[stationCode].hourKey === currentHourKey
	) {
		return cachedHistoryMap[stationCode].data;
	}

	try {
		// 1차: 이미 누적된 48시간 캐시(인메모리 또는 Supabase Storage) 확인
		const { rollingState } = await syncNierRealtimeSnapshotToRollingCache(false);
		const accumulated = rollingState?.stations?.[stationCode] || [];

		// 누적된 데이터가 12시간 이상 충분히 쌓여 있으면 NIER toastList 크롤링 없이 즉시 반환!
		if (accumulated.length >= 12) {
			const prevAvg =
				rollingState?.prevAvgByCode?.[stationCode] ??
				computePrevAvgFromHistory(accumulated);
			const trimmedHistory = accumulated.slice(-24);
			const latestRaw =
				trimmedHistory.length > 0
					? trimmedHistory[trimmedHistory.length - 1]!
					: null;
			const result = {
				latest: latestRaw ? { ...latestRaw, prevAvg } : null,
				history: trimmedHistory,
			};
			cachedHistoryMap[stationCode] = {
				hourKey: currentHourKey,
				data: result,
			};
			return result;
		}

		// 2차 (초기 누적 12시간 미만일 때만 1회 백필): NIER 미확정 시간별 데이터 조회 (querySn=61)
		const now = new Date();
		const pad = (n: number) => String(n).padStart(2, "0");
		const todayStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;

		const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
		const yesterdayStr = `${yesterday.getFullYear()}${pad(yesterday.getMonth() + 1)}${pad(yesterday.getDate())}`;

		const body = new URLSearchParams({
			pMENU_NO: "574",
			page: "1",
			pageSize: "48",
			querySn: "61",
			queryTp: "autoMe",
			confirmNum: "1",
			station_code: stationCode,
			ATTR_2: yesterdayStr,
			ATTR_3: todayStr,
		});

		const res = await fetch(
			`${NIER_WATER_API_BASE}/web/autoMeasure/noConfirm/toastList`,
			{
				method: "POST",
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
					Referer: `${NIER_WATER_API_BASE}/web/autoMeasure/noConfirm?pMENU_NO=574`,
					Accept: "application/json, text/javascript, */*; q=0.01",
					"X-Requested-With": "XMLHttpRequest",
					"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
				},
				body: body.toString(),
				cache: "no-store",
			},
		);

		if (!res.ok) {
			return {
				latest: null,
				history: [],
				error: `HTTP ${res.status}: 데이터 조회 실패`,
			};
		}

		const data = (await res.json()) as { list?: Record<string, unknown>[] };
		const rawList: Record<string, unknown>[] = data.list || [];

		const history: RealtimeWaterQuality[] = rawList
			.map((item) => {
				const parseNum = (val: unknown) => {
					if (val === null || val === undefined || val === "") return null;
					const n = Number(val);
					return Number.isNaN(n) ? null : n;
				};

				return {
					stationCode:
						typeof item.WQAMN_CODE === "string" ? item.WQAMN_CODE : stationCode,
					stationName: typeof item.WQAMN_NM === "string" ? item.WQAMN_NM : "",
					measureDt: typeof item.MESURE_DT === "string" ? item.MESURE_DT : "",
					grade: typeof item.WQI_GRADE === "string" ? item.WQI_GRADE : null,
					wqi: parseNum(item.WQI),
					wtrtp: parseNum(item.IEM_WTRTP),
					ph: parseNum(item.IEM_PH),
					doc: parseNum(item.IEM_DOC),
					ec: parseNum(item.IEM_EC),
					tur: parseNum(item.IEM_TUR),
					toc: parseNum(item.IEM_TOC),
					tn: parseNum(item.IEM_TN),
					tp: parseNum(item.IEM_TP),
					chla: parseNum(item.IEM_CHLA),
				};
			})
			.filter((item) => item.measureDt !== "");

		const validRecords = history.filter(
			(r) =>
				r.ph !== null ||
				r.wtrtp !== null ||
				r.doc !== null ||
				r.toc !== null ||
				r.wqi !== null,
		);

		const prevAvg = computePrevAvgFromHistory(validRecords);
		const latestRaw =
			validRecords.length > 0
				? (validRecords[validRecords.length - 1] ?? null)
				: null;
		const latest: RealtimeWaterQuality | null = latestRaw
			? { ...latestRaw, prevAvg }
			: null;

		const trimmedHistory = validRecords.slice(-24);

		const result = {
			latest,
			history: trimmedHistory,
		};

		if (validRecords.length > 0) {
			cachedHistoryMap[stationCode] = {
				hourKey: currentHourKey,
				data: result,
			};

			// 백필된 48시간 데이터를 Storage 누적 캐시에도 반영하여 다음번엔 크롤링하지 않도록 저장
			if (cachedRollingState) {
				cachedRollingState.stations[stationCode] = validRecords.slice(
					-MAX_HISTORY_HOURS,
				);
				cachedRollingState.prevAvgByCode[stationCode] = prevAvg;
				void saveRollingCacheToStorage(cachedRollingState);
			}
		}

		return result;
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
