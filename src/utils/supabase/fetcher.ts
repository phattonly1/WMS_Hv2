import { createClient } from "./client";
import type { Station } from "@/app/map/stationData";

export async function fetchStations(): Promise<Station[]> {
	const supabase = createClient();

	const [
		{ data: masterData, error: masterErr },
		{ data: assetData, error: assetErr },
		{ data: markerData, error: markerErr },
	] = await Promise.all([
		supabase
			.from("stations_master")
			.select("*")
			.eq("status", "현재")
			.order("name"),
		supabase
			.from("station_assets")
			.select("station_id, model, status")
			.order("install_date", { ascending: false }),
		supabase.from("map_markers").select("*").order("name"),
	]);

	if (masterErr || assetErr || markerErr) {
		const err = masterErr || assetErr || markerErr;
		console.error("fetchStations error:", err);
		throw err;
	}

	if (!masterData || !assetData || !markerData) {
		return [];
	}

	const assetsByStation: Record<string, string[]> = {};
	for (const a of assetData as { station_id?: string; model?: string; status?: string }[]) {
		const sId = a.station_id;
		const model = a.model;
		if (!sId || !model) continue;
		const existing = assetsByStation[sId] ?? [];
		const modelStr = a.status === "종료" ? `${model} (X)` : model;
		if (!existing.includes(modelStr)) {
			existing.push(modelStr);
		}
		assetsByStation[sId] = existing;
	}

	const masters: Station[] = (masterData as Record<string, unknown>[]).map((m) => {
		const sId = String(m.station_id || m.id);
		const instruments = assetsByStation[sId] ?? [];

		return {
			id: sId,
			name: String(m.name || ""),
			lat: Number(m.lat) || 0,
			lng: Number(m.lng) || 0,
			type: m.type as Station["type"],
			river: m.river as Station["river"],
			office: typeof m.office === "string" ? m.office : undefined,
			address: typeof m.address === "string" ? m.address : undefined,
			description: typeof m.description === "string" ? m.description : undefined,
			facility_type: typeof m.facility_type === "string" ? m.facility_type : undefined,
			install_date: typeof m.install_date === "string" ? m.install_date : undefined,
			instruments,
			features: Array.isArray(m.features) ? (m.features as string[]) : [],
			history: Array.isArray(m.history) ? (m.history as { date: string; desc: string }[]) : [],
			angle: 0,
		};
	});

	const markers: Station[] = (markerData as Record<string, unknown>[]).map((mk) => ({
		id: String(mk.id),
		name: String(mk.name || ""),
		lat: Number(mk.lat) || 0,
		lng: Number(mk.lng) || 0,
		type: mk.type as Station["type"],
		river: mk.river as Station["river"],
		related_station_id: typeof mk.related_station_id === "string" ? mk.related_station_id : undefined,
		angle: Number(mk.angle) || 0,
		color: typeof mk.color === "string" ? mk.color : undefined,
		description: typeof mk.description === "string" ? mk.description : undefined,
	}));

	return [...masters, ...markers];
}

// 소모품 목록 가져오기
export async function fetchSupplies() {
	const supabase = createClient();
	const { data, error } = await supabase
		.from("supplies")
		.select("*")
		.order("name", { ascending: true });

	if (error) {
		console.error("fetchSupplies error:", error);
		throw error;
	}
	// DB의 category를 UI의 device로 매핑
	return (data || []).map((item) => ({
		...item,
		device: item.category || "미분류",
	}));
}

// 소모품 로그 가져오기
export async function fetchLogs(type: "REQ" | "OUT" | "OUT_RETURN") {
	const supabase = createClient();
	let query = supabase
		.from("supply_logs")
		.select("*")
		.order("created_at", { ascending: false })
		.limit(100);

	if (type === "OUT_RETURN") {
		query = query.in("type", ["OUT", "RETURN"]);
	} else {
		query = query.eq("type", type);
	}

	const { data, error } = await query;

	if (error) {
		console.error("fetchLogs error:", error);
		throw error;
	}
	return data || [];
}
