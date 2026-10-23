"use server";

import { createClient } from "@/utils/supabase/server";
import type { MapMarker, Station, StationMaster } from "./stationData";

// 모든 측정소 및 보조 마커 조회 (stations_master + station_assets + map_markers 병렬 조회)
export async function getStations(): Promise<Station[]> {
	const supabase = await createClient();
	const [
		{ data: masterData, error: masterErr },
		{ data: assets, error: assetErr },
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
		console.error("측정소 조회 에러:", err);
		return [];
	}

	if (!masterData || !assets || !markerData) {
		return [];
	}

	const assetsByStation: Record<string, string[]> = {};
	for (const a of assets as {
		station_id?: string;
		model?: string;
		status?: string;
	}[]) {
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

	const masters: Station[] = (masterData as Record<string, unknown>[]).map(
		(m) => {
			const stationId = String(m.station_id || m.id);
			return {
				id: stationId,
				name: String(m.name || ""),
				lat: Number(m.lat) || 0,
				lng: Number(m.lng) || 0,
				type: m.type as Station["type"],
				river: m.river as Station["river"],
				features: Array.isArray(m.features) ? (m.features as string[]) : [],
				instruments: assetsByStation[stationId] ?? [],
				history: Array.isArray(m.history)
					? (m.history as { date: string; desc: string }[])
					: [],
				color: typeof m.color === "string" ? m.color : undefined,
				angle: 0,
				office: typeof m.office === "string" ? m.office : undefined,
				address: typeof m.address === "string" ? m.address : undefined,
				facility_type:
					typeof m.facility_type === "string" ? m.facility_type : undefined,
				install_date:
					typeof m.install_date === "string" ? m.install_date : undefined,
				description:
					typeof m.description === "string" ? m.description : undefined,
			};
		},
	);

	const markers: Station[] = (markerData as Record<string, unknown>[]).map(
		(mk) => ({
			id: String(mk.id),
			name: String(mk.name || ""),
			lat: Number(mk.lat) || 0,
			lng: Number(mk.lng) || 0,
			type: mk.type as Station["type"],
			river: mk.river as Station["river"],
			related_station_id:
				typeof mk.related_station_id === "string"
					? mk.related_station_id
					: undefined,
			angle: Number(mk.angle) || 0,
			color: typeof mk.color === "string" ? mk.color : undefined,
			description:
				typeof mk.description === "string" ? mk.description : undefined,
		}),
	);

	return [...masters, ...markers];
}

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
