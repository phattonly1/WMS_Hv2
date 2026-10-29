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
// 국립환경과학원(NIER) 실시간 수질 데이터 조회 액션
// ============================================================
import {
	getNierStationCode,
	type RealtimeWaterQuality,
} from "./nierStationMap";

// 23개 전체 가동 측정소의 최신 실시간 수질 데이터를 일괄 조회 (지도 마커용)
// NIER 메인 대시보드 전용 엔드포인트(/web/autoWaterData/listJson)를 사용하여 단 1회 요청으로 전 측정소 수신
// 매시 정각+1분(01분) 기준 1시간 단위 캐싱 (01분 진입 시 새 시간대 데이터로 갱신)
let cachedRealtimeMap: Record<string, RealtimeWaterQuality> | null = null;
let cachedHourKey: string = "";

// 특정 측정소 24~48시간 시계열 이력 메모리 캐시 (stationCode -> { hourKey, data })
const cachedHistoryMap: Record<
	string,
	{ hourKey: string; data: { latest: RealtimeWaterQuality | null; history: RealtimeWaterQuality[] } }
> = {};

// 매 정각+1분(01분) 기준 현재 시간대 키 산출 헬퍼 (현재 시각 - 1분)
// 예: 03:01 ~ 04:00 -> 'YYYY-MM-DD-03', 04:01 진입 시 -> 'YYYY-MM-DD-04'로 자동 전환
function getHourlySyncKey(): string {
	const shifted = new Date(Date.now() - 1 * 60 * 1000);
	return `${shifted.getFullYear()}-${shifted.getMonth() + 1}-${shifted.getDate()}-${shifted.getHours()}`;
}

export async function getAllStationsRealtimeWaterQuality(): Promise<
	Record<string, RealtimeWaterQuality>
> {
	try {
		const currentHourKey = getHourlySyncKey();

		// 같은 시간대(매 정각+1분 기준 1시간 단위)에 이미 가져온 데이터가 있으면 0ms로 즉시 반환
		if (
			cachedRealtimeMap &&
			cachedHourKey === currentHourKey &&
			Object.keys(cachedRealtimeMap).length > 0
		) {
			return cachedRealtimeMap;
		}

		const res = await fetch(
			"https://water.nier.go.kr/web/autoWaterData/listJson",
			{
				method: "POST",
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
					Referer: "https://water.nier.go.kr/web",
					Accept: "application/json, text/javascript, */*; q=0.01",
					"X-Requested-With": "XMLHttpRequest",
					"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
				},
				body: "a=1",
				cache: "no-store", // 갱신 시점(매시 01분)은 위의 currentHourKey 인메모리 캐시로 정확히 제어
			},
		);

		if (!res.ok) {
			return cachedRealtimeMap || {};
		}

		const data = (await res.json()) as { atoWaterData?: Record<string, unknown>[] };
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
			let measureDt = typeof item.MSR_DATE_FMT === "string" ? item.MSR_DATE_FMT : "";
			if (item.MESURE_DT && String(item.MESURE_DT).length >= 10) {
				const raw = String(item.MESURE_DT);
				measureDt = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)} ${raw.slice(8, 10)}h`;
			}

			byCode[code] = {
				stationCode: code,
				stationName: typeof item.WQAMN_NM === "string" ? item.WQAMN_NM : "",
				measureDt,
				grade: typeof item.WQI_GRD_NM === "string" ? item.WQI_GRD_NM : null, // "우수", "양호", "보통", "주의", "불량", "점검중"
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

		if (Object.keys(byCode).length > 0) {
			cachedRealtimeMap = byCode;
			cachedHourKey = currentHourKey;
		}

		return byCode;
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
	// 매 정각+1분 기준 메모리 캐시 확인 (있으면 0ms 즉시 반환)
	if (
		cachedHistoryMap[stationCode] &&
		cachedHistoryMap[stationCode].hourKey === currentHourKey
	) {
		return cachedHistoryMap[stationCode].data;
	}

	try {
		// 오늘 날짜 및 어제 날짜 구하기 (YYYYMMDD)
		const now = new Date();
		const pad = (n: number) => String(n).padStart(2, "0");
		const todayStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;

		const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
		const yesterdayStr = `${yesterday.getFullYear()}${pad(yesterday.getMonth() + 1)}${pad(yesterday.getDate())}`;

		// 미확정 실시간 시간별 데이터 조회 (querySn=61)
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
			"https://water.nier.go.kr/web/autoMeasure/noConfirm/toastList",
			{
				method: "POST",
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
					Referer:
						"https://water.nier.go.kr/web/autoMeasure/noConfirm?pMENU_NO=574",
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

		// 파싱 및 변환
		const history: RealtimeWaterQuality[] = rawList
			.map((item) => {
				const parseNum = (val: unknown) => {
					if (val === null || val === undefined || val === "") return null;
					const n = Number(val);
					return Number.isNaN(n) ? null : n;
				};

				return {
					stationCode: typeof item.WQAMN_CODE === "string" ? item.WQAMN_CODE : stationCode,
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

		// 최신 유효 레코드 (null이 아닌 실제 측정값이 있는 마지막 레코드)
		const validRecords = history.filter(
			(r) =>
				r.ph !== null ||
				r.wtrtp !== null ||
				r.doc !== null ||
				r.toc !== null ||
				r.wqi !== null,
		);
		const latest: RealtimeWaterQuality | null =
			validRecords.length > 0 ? (validRecords[validRecords.length - 1] ?? null) : null;

		// 미래 빈 슬롯(아직 측정되지 않은 미래 시간)을 제외하고,
		// 실제 측정이 완료된 최근 24개 시간대(24h) 레코드만 정확히 산출
		const trimmedHistory = validRecords.slice(-24);

		const result = {
			latest,
			history: trimmedHistory,
		};

		if (history.length > 0) {
			cachedHistoryMap[stationCode] = {
				hourKey: currentHourKey,
				data: result,
			};
		}

		return result;
	} catch (err: unknown) {
		console.error("getRealtimeWaterQuality error:", err);
		return {
			latest: null,
			history: [],
			error: err instanceof Error ? err.message : "실시간 수질 조회 중 오류가 발생했습니다.",
		};
	}
}
