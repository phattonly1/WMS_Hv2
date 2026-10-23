import { useCallback, useEffect, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import { toast } from "sonner";
import { getChosung } from "@/utils/hangul";
import {
	deleteMapMarker,
	upsertMapMarker,
	upsertStationMaster,
} from "./actions";
import type { MapFilters, Station } from "./stationData";

export function useMapState(
	stations: Station[],
	refresh?: () => Promise<any> | undefined,
) {
	const [searchTerm, setSearchTerm] = useState("");
	const [searchResults, setSearchResults] = useState<Station[]>([]);
	const [isSat, setIsSat] = useState(false);
	const [isInverted, setIsInverted] = useState(false);
	const [isTracking, setIsTracking] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [selectedStation, setSelectedStation] = useState<Station | null>(null);
	const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

	// 로컬스토리지에서 지도 색반전 상태 복원
	useEffect(() => {
		try {
			const saved = localStorage.getItem("wms_map_inverted");
			if (saved === "true") {
				setIsInverted(true);
			}
		} catch {
			// ignore
		}
	}, []);

	const toggleInvert = useCallback(() => {
		setIsInverted((prev) => {
			const next = !prev;
			try {
				localStorage.setItem("wms_map_inverted", String(next));
			} catch {
				// ignore
			}
			return next;
		});
	}, []);

	// 에디터 모드 상태
	const [isEditMode, setIsEditMode] = useState(false);
	const [isAddingStation, setIsAddingStation] = useState(false);
	const [isAddingArrow, setIsAddingArrow] = useState(false);
	const [isAddingPoi, setIsAddingPoi] = useState(false);
	const [editingStation, setEditingStation] = useState<Station | null>(null);

	const [filters, setFilters] = useState<MapFilters>({
		station: true,
		small: true,
		poi: true,
		arrow: "none",
		rivers: {
			bukhan: true,
			namhan: true,
			han: true,
			imjin: true,
			pyeongtaek: true,
		},
		highlightedRiver: null,
	});

	const mapRef = useRef<MapRef | null>(null);
	const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (moveTimeoutRef.current) {
				clearTimeout(moveTimeoutRef.current);
			}
		};
	}, []);

	// 레이어 토글 (일반 벡터 <-> 위성)
	const toggleLayer = useCallback(() => {
		setIsSat((prev) => !prev);
	}, []);

	// GPS 내 위치 추적
	const toggleGPS = useCallback(() => {
		if (isTracking) {
			setIsTracking(false);
			return;
		}

		if (!navigator.geolocation) {
			toast.error("GPS 기능을 지원하지 않는 브라우저입니다.");
			return;
		}

		setIsTracking(true);
		navigator.geolocation.getCurrentPosition(
			(p) => {
				const { latitude, longitude } = p.coords;
				if (mapRef.current) {
					mapRef.current.flyTo({
						center: [longitude, latitude],
						zoom: 15,
						duration: 1200,
					});
				}
				setIsTracking(false);
			},
			(err) => {
				toast.error(`현재 위치를 가져오지 못했습니다: ${err.message}`);
				setIsTracking(false);
			},
		);
	}, [isTracking]);

	// 검색 (station / small 대상, 수계 및 망 필터 반영)
	useEffect(() => {
		const term = searchTerm.trim().toLowerCase();
		if (!term) {
			setSearchResults((prev) => (prev.length === 0 ? prev : []));
			return;
		}
		const matched = stations.filter((s) => {
			if (s.path) return false;
			if (s.type !== "station" && s.type !== "small") return false;
			if (s.river && filters.rivers && filters.rivers[s.river] === false)
				return false;
			const isVisible = filters[s.type] ?? true;
			if (!isVisible) return false;
			return (
				s.name.toLowerCase().includes(term) || getChosung(s.name).includes(term)
			);
		});
		setSearchResults(matched.slice(0, 10));
	}, [searchTerm, filters, stations]);

	// 위치 이동 (부드러운 카메라 flyTo)
	const moveToStation = useCallback(
		(station: Station) => {
			const map = mapRef.current;
			if (!map || !station.lat || !station.lng) return;

			if (moveTimeoutRef.current) {
				clearTimeout(moveTimeoutRef.current);
			}

			map.flyTo({
				center: [Number(station.lng), Number(station.lat)],
				zoom: 14.5,
				duration: 900,
			});

			setSearchTerm("");
			setSearchResults([]);
			moveTimeoutRef.current = setTimeout(() => {
				if (!isEditMode) {
					setSelectedStation(station);
				} else {
					setEditingStation(station);
				}
			}, 900);
		},
		[isEditMode],
	);

	// 줌 및 시야 조작
	const zoomIn = useCallback(() => {
		mapRef.current?.zoomIn({ duration: 300 });
	}, []);

	const zoomOut = useCallback(() => {
		mapRef.current?.zoomOut({ duration: 300 });
	}, []);

	const resetView = useCallback(() => {
		mapRef.current?.flyTo({
			center: [127.5, 37.52],
			zoom: 8.8,
			pitch: 0,
			bearing: 0,
			duration: 1000,
		});
	}, []);

	// --- 에디터 액션 핸들러 (새 테이블 연동) ---

	// 1. 마커 드래그 위치 갱신
	const updateStationLocation = async (
		station: Station,
		lat: number,
		lng: number,
	) => {
		try {
			if (station.type === "station" || station.type === "small") {
				const result = await upsertStationMaster({
					id: station.id,
					station_id: station.id,
					name: station.name,
					lat,
					lng,
					river: station.river,
					type: station.type,
					status: "현재",
				});
				if (!result?.error && result?.success) {
					toast.success(`${station.name} 위치가 저장되었습니다.`);
					if (refresh) refresh();
				} else {
					toast.error(
						`위치 업데이트 실패: ${result?.error || "알 수 없는 오류"}`,
					);
				}
			} else {
				const result = await upsertMapMarker({
					id: station.id,
					name: station.name,
					lat,
					lng,
					type: station.type,
					river: station.river,
					angle: station.angle || 0,
				});
				if (!result?.error && result?.success) {
					toast.success(`${station.name} 위치가 이동되었습니다.`);
					if (refresh) refresh();
				} else {
					toast.error(`위치 이동 실패: ${result?.error || "알 수 없는 오류"}`);
				}
			}
		} catch {
			toast.error("위치 업데이트 중 오류 발생");
		}
	};

	// 2. 새 흐름 화살표 추가 (map_markers)
	const handleAddArrow = async (lat: number, lng: number) => {
		const name = prompt(
			"흐름 명칭을 입력하세요 (예: 한강 흐름 A, 경안천 합류 →)",
		);
		if (!name) return;

		try {
			const result = await upsertMapMarker({
				name,
				lat,
				lng,
				type: "arrow",
				river: "han",
				color: "#10b981",
				angle: 0,
				arrow_type: name.includes("→") ? "junction" : "default",
				category: "하천흐름",
				reg_no: 1,
			});

			if (!result?.error && result?.success) {
				setIsAddingArrow(false);
				toast.success("흐름 화살표가 추가되었습니다.");
				if (refresh) refresh();
			} else {
				toast.error(`추가 실패: ${result?.error || "알 수 없는 오류"}`);
			}
		} catch {
			toast.error("추가 중 오류 발생");
		}
	};

	// 3. 새 관심지점(POI) 추가 (map_markers)
	const handleAddPoi = async (lat: number, lng: number) => {
		const name = prompt("관심지점 명칭을 입력하세요 (예: 팔당댐, 암사취수장)");
		if (!name) return;

		try {
			const result = await upsertMapMarker({
				name,
				lat,
				lng,
				type: "poi",
				river: "han",
				color: "#ef4444",
				category: "댐/보",
				reg_no: 1,
				description: `${name} 주요 수질 관리 관심지점`,
			});

			if (!result?.error && result?.success) {
				setIsAddingPoi(false);
				toast.success("관심지점이 추가되었습니다.");
				if (refresh) refresh();
			} else {
				toast.error(`추가 실패: ${result?.error || "알 수 없는 오류"}`);
			}
		} catch {
			toast.error("추가 중 오류 발생");
		}
	};

	// 4. 새 측정소 추가 (stations_master)
	const handleAddStation = async (lat: number, lng: number) => {
		const name = prompt("측정소 이름을 입력하세요 (예: 신규 측정소)");
		if (!name) return;

		try {
			const result = await upsertStationMaster({
				station_id: `ST_${Date.now()}`,
				name,
				lat,
				lng,
				type: "station",
				river: "namhan",
				office: "한강유역환경청",
				status: "현재",
				install_date: new Date().toISOString().slice(0, 10),
				description: `${name}은(는) 신규 등록된 수질자동측정소입니다.`,
			});

			if (!result?.error && result?.success) {
				setIsAddingStation(false);
				toast.success("측정소가 등록되었습니다.");
				if (refresh) refresh();
			} else {
				toast.error(`등록 실패: ${result?.error || "알 수 없는 오류"}`);
			}
		} catch {
			toast.error("등록 중 오류 발생");
		}
	};

	// 5. 화살표 회전각 수정 (arrow 마커 전용)
	const updateAngle = async (station: Station, newAngle: number) => {
		if (station.type !== "arrow") return;
		try {
			const result = await upsertMapMarker({
				id: station.id,
				name: station.name,
				lat: station.lat,
				lng: station.lng,
				type: station.type,
				river: station.river,
				angle: newAngle,
			});

			if (!result?.error && result?.success) {
				toast.success(`${station.name} 방향이 ${newAngle}° 로 변경되었습니다.`);
				if (editingStation?.id === station.id) {
					setEditingStation((prev) =>
						prev ? { ...prev, angle: newAngle } : null,
					);
				}
				if (refresh) refresh();
			} else {
				toast.error(
					`방향 업데이트 실패: ${result?.error || "알 수 없는 오류"}`,
				);
			}
		} catch {
			toast.error("방향 업데이트 중 오류 발생");
		}
	};

	// 6. 삭제 (map_markers 삭제)
	const handleDeleteStation = async (station: Station) => {
		if (!confirm(`'${station.name}'을(를) 정말 삭제하시겠습니까?`)) return;

		try {
			if (station.type === "arrow" || station.type === "poi") {
				const result = await deleteMapMarker(station.id!);
				if (!result?.error && result?.success) {
					toast.success(`${station.name}이(가) 삭제되었습니다.`);
					setEditingStation(null);
					setSelectedStation(null);
					if (refresh) refresh();
				} else {
					toast.error(`삭제 실패: ${result?.error || "알 수 없는 오류"}`);
				}
			} else {
				toast.error("측정소는 측정소 관리 페이지에서 변경/종료할 수 있습니다.");
			}
		} catch {
			toast.error("삭제 중 오류 발생");
		}
	};

	return {
		searchTerm,
		setSearchTerm,
		searchResults,
		isSat,
		isInverted,
		toggleInvert,
		isTracking,
		isSidebarOpen,
		setIsSidebarOpen,
		selectedStation,
		setSelectedStation,
		isAdminMenuOpen,
		setIsAdminMenuOpen,
		filters,
		setFilters,
		mapRef,
		toggleLayer,
		toggleGPS,
		moveToStation,
		zoomIn,
		zoomOut,
		resetView,
		// 에디터 모드
		isEditMode,
		setIsEditMode,
		isAddingStation,
		setIsAddingStation,
		isAddingArrow,
		setIsAddingArrow,
		isAddingPoi,
		setIsAddingPoi,
		editingStation,
		setEditingStation,
		updateStationLocation,
		handleAddArrow,
		handleAddPoi,
		handleAddStation,
		updateAngle,
		handleDeleteStation,
	};
}
