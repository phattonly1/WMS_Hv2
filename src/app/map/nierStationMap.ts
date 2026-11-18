// 국립환경과학원(NIER) 물환경정보시스템 수질자동측정소 매핑 및 실시간 데이터 타입 정의

interface NierStationInfo {
	code: string; // NIER WQAMN_CODE (예: S01001)
	name: string; // NIER WQAMN_NM
	stationName: string; // 우리 시스템 측정소명 (예: 가평 측정소)
	river: "han" | "bukhan" | "namhan" | "imjin" | "pyeongtaek";
	address: string;
}

// 가동 중인 23개 측정소 매핑 테이블
const NIER_STATION_MAP: Record<string, NierStationInfo> = {
	"가평 측정소": {
		code: "S01001",
		name: "가평",
		stationName: "가평 측정소",
		river: "bukhan",
		address: "경기도 가평군 청평면 북한강로 1537",
	},
	"강천 측정소": {
		code: "S01011",
		name: "강천",
		stationName: "강천 측정소",
		river: "namhan",
		address: "경기도 여주시 강천면 섬강로 287",
	},
	"경안천 측정소": {
		code: "S01003",
		name: "경안천",
		stationName: "경안천 측정소",
		river: "han",
		address: "경기도 광주시 퇴촌면 산수로 969",
	},
	"구리 측정소": {
		code: "S01004",
		name: "구리",
		stationName: "구리 측정소",
		river: "han",
		address: "경기도 구리시 아차산로 34",
	},
	"능서 측정소": {
		code: "S01020",
		name: "능서",
		stationName: "능서 측정소",
		river: "namhan",
		address: "경기도 여주시 능서면 영릉로 452",
	},
	"단양 측정소": {
		code: "S01018",
		name: "단양",
		stationName: "단양 측정소",
		river: "namhan",
		address: "충청북도 단양군 영춘면 강변우회로 252",
	},
	"달천 측정소": {
		code: "S01021",
		name: "달천",
		stationName: "달천 측정소",
		river: "namhan",
		address: "충청북도 충주시 살미면 팔봉 향산길 460",
	},
	"미산 측정소": {
		code: "S01016",
		name: "미산",
		stationName: "미산 측정소",
		river: "imjin",
		address: "경기도 연천군 미산면 어삼로 231",
	},
	"복하천 측정소": {
		code: "S01022",
		name: "복하천",
		stationName: "복하천 측정소",
		river: "namhan",
		address: "경기도 여주시 흥천면 금대울로 254",
	},
	"서상 측정소": {
		code: "S01010",
		name: "서상",
		stationName: "서상 측정소",
		river: "bukhan",
		address: "강원도 춘천시 서면 서상로 470",
	},
	"신천 측정소": {
		code: "S01013",
		name: "신천",
		stationName: "신천 측정소",
		river: "imjin",
		address: "경기도 연천군 청산면 청신로 171",
	},
	"양평 측정소": {
		code: "S01025",
		name: "양평",
		stationName: "양평 측정소",
		river: "namhan",
		address: "경기도 양평군 옥천면 경강로 1520",
	},
	"여주 측정소": {
		code: "S01005",
		name: "여주",
		stationName: "여주 측정소",
		river: "namhan",
		address: "경기도 여주시 주내로 597",
	},
	"원주 측정소": {
		code: "S01006",
		name: "원주",
		stationName: "원주 측정소",
		river: "namhan",
		address: "강원도 원주시 소초면 검엉터길 109",
	},
	"의암호 측정소": {
		code: "S01012",
		name: "의암호",
		stationName: "의암호 측정소",
		river: "bukhan",
		address: "강원도 춘천시 서면 박사로 646",
	},
	"인제 측정소": {
		code: "S01015",
		name: "인제",
		stationName: "인제 측정소",
		river: "bukhan",
		address: "강원도 인제군 북면 구미동길 43-49",
	},
	"청미천 측정소": {
		code: "S01023",
		name: "청미천",
		stationName: "청미천 측정소",
		river: "namhan",
		address: "경기도 여주시 점동면 점동로 574-3",
	},
	"충주 측정소": {
		code: "S01014",
		name: "충주",
		stationName: "충주 측정소",
		river: "namhan",
		address: "충청북도 충주시 동량면 지등로 244-1",
	},
	"평창강 측정소": {
		code: "S01007",
		name: "평창강",
		stationName: "평창강 측정소",
		river: "namhan",
		address: "충청북도 제천시 송학면 후탄안길 59",
	},
	"포천 측정소": {
		code: "S01017",
		name: "포천",
		stationName: "포천 측정소",
		river: "imjin",
		address: "경기도 포천군 영중면 사은다리 1길 32",
	},
	"한탄강 측정소": {
		code: "S01009",
		name: "한탄강",
		stationName: "한탄강 측정소",
		river: "imjin",
		address: "경기도 연천군 전곡읍 전은길 98-68",
	},
	"화천 측정소": {
		code: "S01019",
		name: "화천",
		stationName: "화천 측정소",
		river: "bukhan",
		address: "강원도 화천군 하남면 위라리길 9",
	},
	"흥천 측정소": {
		code: "S01002",
		name: "흥천",
		stationName: "흥천 측정소",
		river: "namhan",
		address: "경기도 여주시 흥천면 이여로 1278-1",
	},
};

// 측정소명 또는 약칭으로 NIER 코드를 찾는 헬퍼 함수
export function getNierStationCode(nameOrStationId: string): string | null {
	if (!nameOrStationId) return null;
	// 1. 정확한 이름 매칭 (예: "가평 측정소")
	if (NIER_STATION_MAP[nameOrStationId]) {
		return NIER_STATION_MAP[nameOrStationId].code;
	}
	// 2. "측정소" 붙여서 매칭 (예: "가평")
	const withSuffix = `${nameOrStationId.trim()} 측정소`;
	if (NIER_STATION_MAP[withSuffix]) {
		return NIER_STATION_MAP[withSuffix].code;
	}
	// 3. 코드 자체로 매칭 (예: "S01001")
	for (const info of Object.values(NIER_STATION_MAP)) {
		if (info.code === nameOrStationId) return info.code;
	}
	return null;
}

// 가동 중인 23개 측정소 코드 배열 반환
export function getAllNierStationCodes(): string[] {
	return Object.values(NIER_STATION_MAP).map((info) => info.code);
}

export type WaterQualityMetricKey =
	| "wqi"
	| "wtrtp"
	| "ph"
	| "doc"
	| "ec"
	| "tur"
	| "toc"
	| "tn"
	| "tp"
	| "chla";

export type WaterQualityAverageMap = Partial<
	Record<WaterQualityMetricKey, number | null>
>;

// 실시간 수질 데이터 응답 타입
export interface RealtimeWaterQuality {
	stationCode: string;
	stationName: string;
	measureDt: string; // 예: "2026-10-30 01h"
	grade?: string | null; // 예: "좋음", "보통"
	wqi?: number | null; // 수질지수 (0~100)
	wtrtp?: number | null; // 수온 (°C)
	ph?: number | null; // 수소이온농도 (pH)
	doc?: number | null; // 용존산소 (DO, mg/L)
	ec?: number | null; // 전기전도도 (EC, µS/cm)
	tur?: number | null; // 탁도 (NTU)
	toc?: number | null; // 총유기탄소 (TOC, mg/L)
	tn?: number | null; // 총질소 (TN, mg/L)
	tp?: number | null; // 총인 (TP, mg/L)
	chla?: number | null; // 클로로필-a (Chl-a, µg/L)
	prevAvg?: WaterQualityAverageMap; // 전일(또는 누적 24h) 평균값
}

// ============================================================
// Supabase Storage (cache/nier_48h_cache.json) 직접 조회 (Vercel 서버 경유 없이 즉시 로드)
// ============================================================
const CACHE_BUCKET = "cache";
const CACHE_OBJECT_PATH = "nier_48h_cache.json";
const MAX_HISTORY_HOURS = 48;

export interface NierRollingCachePayload {
	lastHourKey: string;
	updatedAt: string;
	stations: Record<string, RealtimeWaterQuality[]>;
	prevAvgByCode: Record<string, WaterQualityAverageMap>;
}

let cachedRollingState: NierRollingCachePayload | null = null;
let cachedRealtimeMap: Record<string, RealtimeWaterQuality> | null = null;
let cachedHourKey = "";

function getHourlySyncKey(): string {
	const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000 - 12 * 60 * 1000);
	const y = kstNow.getUTCFullYear();
	const m = String(kstNow.getUTCMonth() + 1).padStart(2, "0");
	const d = String(kstNow.getUTCDate()).padStart(2, "0");
	const h = String(kstNow.getUTCHours()).padStart(2, "0");
	return `${y}-${m}-${d}-${h}`;
}

async function loadRollingCacheFromStorage(): Promise<NierRollingCachePayload | null> {
	const supabaseUrl =
		process.env.NEXT_PUBLIC_SUPABASE_URL ||
		"https://ymtjoyootbkszgmjywzb.supabase.co";

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
