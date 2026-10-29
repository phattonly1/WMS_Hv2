"use client";

import { setWorkerUrl } from "maplibre-gl";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Map, { Layer, type MapRef, Marker, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

// Next.js 번들 환경에서 Web Worker 경로 명시 설정
if (typeof window !== "undefined") {
	setWorkerUrl("/maplibre-gl-worker.mjs");
}

// 마커 호버 스타일 주입 (호버된 마커 DOM 컨테이너를 다른 마커들보다 항상 최상위로 올림)
const MARKER_HOVER_STYLE = `
  .maplibregl-marker:has(.group:hover) {
    z-index: 99999 !important;
  }
`;

import { getAllStationsRealtimeWaterQuality } from "./actions";
import {
	ArrowMarker,
	PoiMarker,
	SmallMarker,
	StationMarker,
} from "./components/VectorMarkers";
import { MAP_STYLES } from "./mapStyles";
import {
	getNierStationCode,
	type RealtimeWaterQuality,
} from "./nierStationMap";
import { getStationColor, type MapFilters, type Station } from "./stationData";

interface MapLibreViewProps {
	stations: Station[];
	filters: MapFilters;
	selectedStation: Station | null;
	setSelectedStation: (station: Station | null) => void;
	mapRef: React.MutableRefObject<MapRef | null>;
	isSat?: boolean;
	isInverted?: boolean;
	// 에디터 모드
	isEditMode?: boolean;
	isAddingStation?: boolean;
	isAddingArrow?: boolean;
	isAddingPoi?: boolean;
	onAddStation?: (lat: number, lng: number) => Promise<void>;
	onAddArrow?: (lat: number, lng: number) => Promise<void>;
	onAddPoi?: (lat: number, lng: number) => Promise<void>;
	onUpdateStationLocation?: (
		station: Station,
		lat: number,
		lng: number,
	) => Promise<void>;
	editingStation?: Station | null;
	setEditingStation?: (station: Station | null) => void;
}

export default function MapLibreView({
	stations,
	filters,
	selectedStation,
	setSelectedStation,
	mapRef,
	isSat = false,
	isInverted = false,
	isEditMode = false,
	isAddingStation = false,
	isAddingArrow = false,
	isAddingPoi = false,
	onAddStation,
	onAddArrow,
	onAddPoi,
	onUpdateStationLocation,
	editingStation: _editingStation,
	setEditingStation,
}: MapLibreViewProps) {
	// 국가 표준 GIS 하천망 GeoJSON 데이터 상태
	const [gisRiversData, setGisRiversData] = useState<any>(null);

	// 매시 30분 기준 시간대 키 생성 헬퍼 (02:30 ~ 03:29 동일 키)
	const getRealtimeHourKey = useCallback(() => {
		const shifted = new Date(Date.now() - 30 * 60 * 1000);
		return `${shifted.getFullYear()}-${shifted.getMonth() + 1}-${shifted.getDate()}-${shifted.getHours()}`;
	}, []);

	// 23개 측정소 실시간 수질 데이터 상태 (초기값으로 localStorage 즉시 조회하여 깜빡임/네트워크 0회 달성)
	const [waterQualityMap, setWaterQualityMap] = useState<
		Record<string, RealtimeWaterQuality>
	>(() => {
		if (typeof window === "undefined") return {};
		try {
			const cachedRaw = window.localStorage.getItem("wms_nier_realtime_wq");
			if (!cachedRaw) return {};
			const parsed = JSON.parse(cachedRaw);
			const shifted = new Date(Date.now() - 30 * 60 * 1000);
			const currentKey = `${shifted.getFullYear()}-${shifted.getMonth() + 1}-${shifted.getDate()}-${shifted.getHours()}`;
			if (
				parsed &&
				parsed.hourKey === currentKey &&
				parsed.data &&
				Object.keys(parsed.data).length > 0
			) {
				return parsed.data;
			}
		} catch {
			// ignore storage error
		}
		return {};
	});

	useEffect(() => {
		fetch("/data/han_rivers.geojson")
			.then((res) => res.json())
			.then((data) => setGisRiversData(data))
			.catch((err) => console.error("Failed to load han_rivers.geojson:", err));

		// localStorage에 현재 시간대(매시 30분 기준) 데이터가 이미 있으면 서버 호출 생략
		const currentKey = getRealtimeHourKey();
		try {
			const cachedRaw = window.localStorage.getItem("wms_nier_realtime_wq");
			if (cachedRaw) {
				const parsed = JSON.parse(cachedRaw);
				if (
					parsed?.hourKey === currentKey &&
					parsed?.data &&
					Object.keys(parsed.data).length > 0
				) {
					setWaterQualityMap(parsed.data);
					return;
				}
			}
		} catch {
			// ignore storage error
		}

		// 캐시가 없거나 시간대(30분 경과)가 바뀐 경우에만 서버 호출 후 localStorage 저장
		getAllStationsRealtimeWaterQuality()
			.then((data) => {
				if (data && Object.keys(data).length > 0) {
					setWaterQualityMap(data);
					try {
						window.localStorage.setItem(
							"wms_nier_realtime_wq",
							JSON.stringify({
								hourKey: currentKey,
								data,
								savedAt: Date.now(),
							}),
						);
					} catch {
						// ignore quota error
					}
				}
			})
			.catch((err) =>
				console.error("Failed to load realtime water quality:", err),
			);
	}, [getRealtimeHourKey]);
	// 수계 경로(Polyline) GeoJSON FeatureCollection 변환
	const polylinesGeoJSON = useMemo(() => {
		const features = stations
			.filter((s) => s.path && s.path.length > 0)
			.map((s) => ({
				type: "Feature" as const,
				properties: {
					id: s.id,
					name: s.name,
					color: getStationColor(s),
				},
				geometry: {
					type: "LineString" as const,
					// Leaflet [lat, lng] -> MapLibre [lng, lat]
					coordinates: (s.path || []).map(([lat, lng]) => [lng, lat]),
				},
			}));

		return {
			type: "FeatureCollection" as const,
			features,
		};
	}, [stations]);

	// 지도 클릭 핸들러 (노드 추가 또는 빈 공간 클릭 시 측정소 선택 해제)
	const handleMapClick = useCallback(
		(e: any) => {
			const { lng, lat } = e.lngLat;
			if (isAddingArrow && onAddArrow) {
				onAddArrow(lat, lng);
			} else if (isAddingPoi && onAddPoi) {
				onAddPoi(lat, lng);
			} else if (isAddingStation && onAddStation) {
				onAddStation(lat, lng);
			} else {
				// 빈 지도 영역 클릭 시 선택된 측정소 정보창 닫기 및 기본 뷰 복귀
				if (!isEditMode) {
					setSelectedStation(null);
				}
			}
		},
		[
			isAddingArrow,
			isAddingPoi,
			isAddingStation,
			onAddArrow,
			onAddPoi,
			onAddStation,
			isEditMode,
			setSelectedStation,
		],
	);

	// 일반 마커 필터링
	const visibleStations = useMemo(() => {
		return stations.filter((s) => {
			if (s.path) return false;
			if (Number.isNaN(Number(s.lat)) || Number.isNaN(Number(s.lng)))
				return false;

			if (isEditMode) return true; // 편집 모드에서는 전체 마커 노출

			// 1. 수계 필터링 확인 (선택 해제된 수계는 숨김)
			if (s.river && filters.rivers && filters.rivers[s.river] === false) {
				return false;
			}

			// 2. 수계흐름 화살표 마커: GIS 유선 도입으로 상시 비활성화(숨김)
			if (s.type === "arrow") {
				return false;
			}

			// 3. 관심지점(POI): 상시 비활성화(숨김), 측정소 선택 시 해당 측정소 관련 POI만 노출
			if (s.type === "poi") {
				if (!selectedStation) return false;
				if (s.id === selectedStation.id) return true;
				if (
					selectedStation.type === "poi" &&
					s.related_station_id &&
					s.related_station_id === selectedStation.related_station_id
				) {
					return true;
				}
				// 선택된 측정소의 id 또는 name과 매칭
				if (
					s.related_station_id &&
					s.related_station_id === selectedStation.id
				) {
					return true;
				}
				// 명칭 괄호 매칭 (예: "오염원 (흥천 2.3km)" -> "흥천")
				const cleanSelectedName = selectedStation.name
					.replace(/소규모|국가망|측정소/g, "")
					.trim();
				if (s.name.includes(cleanSelectedName)) {
					return true;
				}
				return false;
			}

			return filters[s.type as keyof typeof filters] ?? true;
		});
	}, [stations, filters, isEditMode, selectedStation]);

	return (
		<div className="relative w-full h-full">
			{/* 마커 호버 스타일 주입 (호버된 마커 컨테이너를 타 마커/POI보다 최상위로 올림) */}
			<style>{MARKER_HOVER_STYLE}</style>

			{/* 지도 캔버스 타일 및 마커 색반전 주입 */}
			{isInverted && (
				<style>{`
					.maplibregl-canvas,
					.maplibregl-marker {
						filter: invert(1) hue-rotate(180deg) contrast(0.95);
					}
				`}</style>
			)}
			<Map
				ref={mapRef}
				initialViewState={{
					longitude: 127.5,
					latitude: 37.52,
					zoom: 8.8,
				}}
				mapStyle={
					isSat ? (MAP_STYLES.satellite as any) : (MAP_STYLES.vworldBase as any)
				}
				style={{ width: "100%", height: "100%" }}
				onClick={handleMapClick}
				cursor={
					isAddingStation || isAddingArrow || isAddingPoi ? "crosshair" : "grab"
				}
				maxZoom={22}
				minZoom={6}
				attributionControl={false}
				touchZoomRotate={true}
				doubleClickZoom={true}
				dragPan={true}
				scrollZoom={true}
				onLoad={(e) => {
					const map = e.target;
					// 핀치 줌 제스처 및 스크롤 줌 속도를 추가로 2배(총 4배) 상향
					if (map.touchZoomRotate) {
						map.touchZoomRotate.disableRotation(); // 모바일 조작 시 의도치 않은 회전 방지 및 줌 집중
					}
					if (map.scrollZoom) {
						map.scrollZoom.setWheelZoomRate(1 / 100); // 휠 줌 감도 대폭 상향
						map.scrollZoom.setZoomRate(1 / 25); // 제스처 줌 변화율 대폭 상향 (기본 대비 4배)
					}
				}}
			>
				{/* ============================================================ */}
				{/* 1. 국가 표준 하천망(GIS) 벡터 유선 레이어                      */}
				{/* ============================================================ */}
				{gisRiversData && (
					<Source id="gis-han-rivers" type="geojson" data={gisRiversData}>
						{/* 1-1. 수계별 은은한 베이스 유선 라인 (하천 중심선) */}
						<Layer
							id="gis-river-base-glow"
							type="line"
							filter={[
								"all",
								["!=", ["get", "river"], "none"],
								// 수계 필터 연동 (활성화된 수계만 렌더링)
								[
									"match",
									["get", "river"],
									"bukhan",
									Boolean(filters.rivers.bukhan),
									"namhan",
									Boolean(filters.rivers.namhan),
									"han",
									Boolean(filters.rivers.han),
									"imjin",
									Boolean(filters.rivers.imjin),
									"pyeongtaek",
									Boolean(filters.rivers.pyeongtaek),
									true,
								],
							]}
							paint={{
								"line-color": [
									"match",
									["get", "river"],
									"bukhan",
									"#06b6d4", // 북한강 (청록)
									"namhan",
									"#2563eb", // 남한강 (블루)
									"han",
									"#2563eb", // 한강본류 (인디고)
									"imjin",
									"#f59e0b", // 임진강 (오렌지)
									"pyeongtaek",
									"#10b981", // 평택호 (에메랄드)
									"#2563eb",
								],
								"line-width": [
									"interpolate",
									["linear"],
									["zoom"],
									7,
									filters.highlightedRiver
										? [
												"case",
												["==", ["get", "river"], filters.highlightedRiver],
												5.0,
												1.2,
											]
										: 2.0,
									11,
									filters.highlightedRiver
										? [
												"case",
												["==", ["get", "river"], filters.highlightedRiver],
												8.5,
												2.5,
											]
										: 4.0,
									14,
									filters.highlightedRiver
										? [
												"case",
												["==", ["get", "river"], filters.highlightedRiver],
												12.0,
												4.0,
											]
										: 6.5,
								],
								"line-opacity": filters.highlightedRiver
									? [
											"case",
											["==", ["get", "river"], filters.highlightedRiver],
											0.95,
											0.25,
										]
									: 0.75,
								"line-blur": filters.highlightedRiver
									? [
											"case",
											["==", ["get", "river"], filters.highlightedRiver],
											0.8,
											0.2,
										]
									: 0.5,
							}}
						/>

						{/* 1-2. 물빛 코어 라인 (선명한 중앙 흐름선) */}
						<Layer
							id="gis-river-core"
							type="line"
							filter={[
								"all",
								["!=", ["get", "river"], "none"],
								[
									"match",
									["get", "river"],
									"bukhan",
									Boolean(filters.rivers.bukhan),
									"namhan",
									Boolean(filters.rivers.namhan),
									"han",
									Boolean(filters.rivers.han),
									"imjin",
									Boolean(filters.rivers.imjin),
									"pyeongtaek",
									Boolean(filters.rivers.pyeongtaek),
									true,
								],
							]}
							paint={{
								"line-color": "#ffffff",
								"line-width": [
									"interpolate",
									["linear"],
									["zoom"],
									7,
									filters.highlightedRiver
										? [
												"case",
												["==", ["get", "river"], filters.highlightedRiver],
												2.0,
												0.5,
											]
										: 0.8,
									11,
									filters.highlightedRiver
										? [
												"case",
												["==", ["get", "river"], filters.highlightedRiver],
												3.8,
												1.0,
											]
										: 1.8,
									14,
									filters.highlightedRiver
										? [
												"case",
												["==", ["get", "river"], filters.highlightedRiver],
												5.5,
												1.5,
											]
										: 2.5,
								],
								"line-opacity": filters.highlightedRiver
									? [
											"case",
											["==", ["get", "river"], filters.highlightedRiver],
											1.0,
											0.3,
										]
									: 0.85,
							}}
						/>

						{/* 1-3. 흐름 대시 점선 (유량 파동 질감) */}
						<Layer
							id="gis-river-flow-dash"
							type="line"
							filter={[
								"all",
								["!=", ["get", "river"], "none"],
								[
									"match",
									["get", "river"],
									"bukhan",
									Boolean(filters.rivers.bukhan),
									"namhan",
									Boolean(filters.rivers.namhan),
									"han",
									Boolean(filters.rivers.han),
									"imjin",
									Boolean(filters.rivers.imjin),
									"pyeongtaek",
									Boolean(filters.rivers.pyeongtaek),
									true,
								],
							]}
							paint={{
								"line-color": "#ffffff",
								"line-width": [
									"interpolate",
									["linear"],
									["zoom"],
									7,
									filters.highlightedRiver
										? [
												"case",
												["==", ["get", "river"], filters.highlightedRiver],
												2.5,
												0.8,
											]
										: 1.2,
									11,
									filters.highlightedRiver
										? [
												"case",
												["==", ["get", "river"], filters.highlightedRiver],
												4.5,
												1.5,
											]
										: 2.5,
									14,
									filters.highlightedRiver
										? [
												"case",
												["==", ["get", "river"], filters.highlightedRiver],
												6.5,
												2.2,
											]
										: 3.8,
								],
								"line-dasharray": [1, 3],
								"line-opacity": filters.highlightedRiver
									? [
											"case",
											["==", ["get", "river"], filters.highlightedRiver],
											0.95,
											0.2,
										]
									: 0.7,
							}}
						/>
					</Source>
				)}

				{/* 2. 기존 수계 Polyline (호환성 유지) */}
				{polylinesGeoJSON.features.length > 0 && (
					<Source id="river-paths" type="geojson" data={polylinesGeoJSON}>
						<Layer
							id="river-line"
							type="line"
							paint={{
								"line-color": ["get", "color"],
								"line-width": 4.5,
								"line-opacity": 0.85,
							}}
						/>
					</Source>
				)}

				{/* 3. 측정소/포인트 마커 렌더링 */}
				{visibleStations.map((station) => {
					const lat = Number(station.lat);
					const lng = Number(station.lng);
					const color = getStationColor(station);
					const isSelected = selectedStation?.id === station.id;

					return (
						<Marker
							key={station.id || `${station.name}-${lat}-${lng}`}
							latitude={lat}
							longitude={lng}
							anchor="center"
							draggable={Boolean(isEditMode)}
							onDragEnd={(e) => {
								if (onUpdateStationLocation) {
									onUpdateStationLocation(station, e.lngLat.lat, e.lngLat.lng);
								}
							}}
							onClick={(e) => {
								e.originalEvent.stopPropagation();
								if (isEditMode) {
									setEditingStation?.(station);
								} else if (station.type !== "arrow") {
									setSelectedStation(station);
								}
							}}
						>
							{station.type === "station" && (
								<StationMarker
									station={station}
									color={color}
									isSelected={isSelected}
									chipMode={filters.waterChip}
									waterQuality={
										getNierStationCode(station.name)
											? waterQualityMap[getNierStationCode(station.name)!]
											: null
									}
								/>
							)}
							{station.type === "small" && (
								<SmallMarker
									station={station}
									color={color}
									isSelected={isSelected}
								/>
							)}
							{station.type === "poi" && (
								<PoiMarker
									station={station}
									color={color}
									isSelected={isSelected}
								/>
							)}
							{station.type === "arrow" && (
								<ArrowMarker
									station={station}
									showLabel={filters.arrow === "name"}
								/>
							)}
						</Marker>
					);
				})}
			</Map>
		</div>
	);
}
