"use server";

import { createClient } from "@/utils/supabase/server";
import type { MapMarker, Station, StationMaster } from "./stationData";

// 측정소 추가/수정 (stations_master 및 map_markers 대응)
export async function upsertStation(stationData: Partial<Station>) {
	const supabase = await createClient();

	const { id, ...rest } = stationData;
	const isMarker = rest.type === "poi";

	if (isMarker) {
		const markerItem: Record<string, unknown> = {
			name: rest.name,
			lat: Number(rest.lat),
			lng: Number(rest.lng),
			type: rest.type,
			river: rest.river,
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
// 지도 보조 마커 (map_markers: POI) 액션
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
