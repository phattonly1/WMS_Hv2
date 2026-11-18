import { NextResponse } from "next/server";
import {
	getAllNierStationCodes,
	type NierRollingCachePayload,
	type RealtimeWaterQuality,
	type WaterQualityAverageMap,
	type WaterQualityMetricKey,
} from "@/app/map/nierStationMap";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CACHE_BUCKET = "cache";
const CACHE_OBJECT_PATH = "nier_48h_cache.json";
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

// 매시 10분~14분 사이에 Supabase pg_cron이 트리거하면
// NIER 1회 스냅샷을 수집해 Supabase Storage (cache/nier_48h_cache.json)에 48시간 누적 저장
export async function GET() {
	try {
		const supabaseUrl =
			process.env.NEXT_PUBLIC_SUPABASE_URL ||
			"https://ymtjoyootbkszgmjywzb.supabase.co";
		const supabaseKey =
			process.env.SUPABASE_SERVICE_ROLE_KEY ||
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdGpveW9vdGJrc3pnbWp5d3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTg5MjcsImV4cCI6MjA4MzI3NDkyN30.c94f8z0m9k2-3wU2hW3k0_N_1mN7k7pW8vY5wJ8e_6I";

		const pad = (n: number) => String(n).padStart(2, "0");
		const kst = new Date(Date.now() + 9 * 3600 * 1000 - 12 * 60 * 1000);
		const hourKey = `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())}-${pad(kst.getUTCHours())}`;

		const kstYest = new Date(Date.now() + 9 * 3600 * 1000 - 24 * 3600 * 1000);
		const yestPrefix = `${kstYest.getUTCFullYear()}-${pad(kstYest.getUTCMonth() + 1)}-${pad(kstYest.getUTCDate())}`;

		const kstCutoff = new Date(Date.now() + 9 * 3600 * 1000 - 48 * 3600 * 1000);
		const cutoffMeasureDt = `${kstCutoff.getUTCFullYear()}-${pad(kstCutoff.getUTCMonth() + 1)}-${pad(kstCutoff.getUTCDate())} ${pad(kstCutoff.getUTCHours())}h`;

		// 1. 기존 cache/nier_48h_cache.json 로드
		let existing: Partial<NierRollingCachePayload> = {
			stations: {},
			prevAvgByCode: {},
		};
		try {
			const r = await fetch(
				`${supabaseUrl}/storage/v1/object/public/${CACHE_BUCKET}/${CACHE_OBJECT_PATH}?t=${Date.now()}`,
				{ cache: "no-store" },
			);
			if (r.ok) {
				existing = (await r.json()) as NierRollingCachePayload;
			}
		} catch {
			// ignore read error
		}

		// 2. NIER 최신 1시간 스냅샷 1회 호출
		const nierRes = await fetch(
			"https://water.nier.go.kr/web/autoWaterData/listJson",
			{
				method: "POST",
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					Referer: "https://water.nier.go.kr/web",
					"X-Requested-With": "XMLHttpRequest",
					"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
				},
				body: "a=1",
				cache: "no-store",
			},
		);

		if (!nierRes.ok) {
			return NextResponse.json(
				{ ok: false, error: `NIER HTTP ${nierRes.status}` },
				{ status: 502 },
			);
		}

		const nierJson = (await nierRes.json()) as {
			atoWaterData?: Record<string, unknown>[];
		};
		const list = nierJson.atoWaterData || [];
		const codes = new Set(getAllNierStationCodes());

		const parseVal = (v: unknown): number | null => {
			if (v === null || v === undefined || v === "") return null;
			const n = Number(String(v).trim());
			return Number.isNaN(n) ? null : n;
		};

		const stations: Record<string, RealtimeWaterQuality[]> = {
			...(existing.stations || {}),
		};
		const prevAvgByCode: Record<string, WaterQualityAverageMap> = {
			...(existing.prevAvgByCode || {}),
		};

		for (const item of list) {
			const code = typeof item.WQAMN_CODE === "string" ? item.WQAMN_CODE : "";
			if (!codes.has(code)) continue;

			const raw = String(item.MESURE_DT || "");
			const measureDt =
				raw.length >= 10
					? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)} ${raw.slice(8, 10)}h`
					: typeof item.MSR_DATE_FMT === "string"
						? item.MSR_DATE_FMT
						: "";

			const rec: RealtimeWaterQuality = {
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

			const arr = Array.isArray(stations[code]) ? [...stations[code]!] : [];
			const existingIdx = arr.findIndex((r) => r.measureDt === rec.measureDt);
			if (existingIdx >= 0) {
				arr[existingIdx] = rec;
			} else {
				arr.push(rec);
			}

			arr.sort((a, b) => a.measureDt.localeCompare(b.measureDt));
			const within48h = arr.filter(
				(r) => !r.measureDt || r.measureDt >= cutoffMeasureDt,
			);
			const trimmed = (within48h.length > 0 ? within48h : arr).slice(
				-MAX_HISTORY_HOURS,
			);
			stations[code] = trimmed;

			let targets = trimmed.filter((r) => r.measureDt?.startsWith(yestPrefix));
			if (targets.length === 0) {
				targets = trimmed.length > 1 ? trimmed.slice(0, -1) : trimmed;
			}

			const avg: WaterQualityAverageMap = {};
			for (const k of METRIC_KEYS) {
				const nums = targets
					.map((r) => r[k])
					.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
				avg[k] =
					nums.length > 0
						? Number(
								(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(4),
							)
						: null;
			}
			prevAvgByCode[code] = avg;
		}

		const payload: NierRollingCachePayload = {
			lastHourKey: hourKey,
			updatedAt: new Date().toISOString(),
			stations,
			prevAvgByCode,
		};

		// 3. Supabase Storage (cache/nier_48h_cache.json) 업로드
		const up = await fetch(
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

		return NextResponse.json({
			ok: up.ok,
			status: up.status,
			lastHourKey: payload.lastHourKey,
			updatedAt: payload.updatedAt,
			stationCount: Object.keys(stations).length,
		});
	} catch (err: unknown) {
		return NextResponse.json(
			{
				ok: false,
				error: err instanceof Error ? err.message : "Sync failed",
			},
			{ status: 500 },
		);
	}
}
