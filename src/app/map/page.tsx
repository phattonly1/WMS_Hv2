"use client";

import {
	Check,
	ChevronDown,
	ChevronLeft,
	Crosshair,
	Database,
	Droplets,
	Eye,
	EyeOff,
	Layers,
	List,
	Map as MapIcon,
	MapPin,
	Search,
	Settings,
	SlidersHorizontal,
	SunMoon,
	Table2,
	Trash2,
	X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useStations } from "@/utils/supabase/hooks";
import { StationBottomSheet } from "./components/StationBottomSheet";
import { StationListModal } from "./components/StationListModal";
import { WaterQualityChartModal } from "./components/WaterQualityChartModal";
import {
	getNierStationCode,
	getRealtimeWaterQuality,
	type RealtimeWaterQuality,
	type WaterQualityMetricKey,
} from "./nierStationMap";
import { RIVER_CONFIG, type Station, TYPE_CONFIG } from "./stationData";
import { useMapState } from "./useMapState";

// 지도 컴포넌트 비동기 로드 (SSR 방지 및 번들 최적화)
const MapLibreView = dynamic(() => import("./MapLibreView"), {
	ssr: false,
	loading: () => (
		<div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 dark:bg-slate-950 font-sans">
			<div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
			<p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
				벡터 지도를 로딩 중...
			</p>
		</div>
	),
});

export default function MapPage() {
	const { stations, refresh } = useStations();

	// 인터페이스 숨김(클린 지도 뷰) 상태
	const [isUiHidden, setIsUiHidden] = useState(false);
	// 통합 설정 모달 활성 탭 (표시 설정 / 관리 도구)
	const [settingsTab, setSettingsTab] = useState<"display" | "admin">(
		"display",
	);
	// 마커 수질 칩 상세 지표 커스텀 팝오버 열림 상태
	const [isDetailChipOpen, setIsDetailChipOpen] = useState(false);

	// 실시간 수질 24시간 차트 모달 대상 측정소 및 데이터 상태
	const [chartStation, setChartStation] = useState<Station | null>(null);
	const [chartInitialMetric, setChartInitialMetric] = useState<
		WaterQualityMetricKey | undefined
	>(undefined);
	const [chartData, setChartData] = useState<{
		latest: RealtimeWaterQuality | null;
		history: RealtimeWaterQuality[];
	} | null>(null);
	const [isLoadingChart, setIsLoadingChart] = useState(false);

	// 수질 모달 오픈 핸들러 (지도 마커/바텀시트와 동일한 localStorage 최신값 및 prevAvg 우선 반영)
	const handleOpenWaterQuality = async (
		st: Station,
		initialMetric?: WaterQualityMetricKey,
	) => {
		setChartInitialMetric(initialMetric);
		setChartStation(st);

		let cachedLatest: RealtimeWaterQuality | null = null;
		try {
			const code = getNierStationCode(st.name);
			const cachedRaw =
				typeof window !== "undefined"
					? window.localStorage.getItem("wms_nier_realtime_wq")
					: null;
			if (code && cachedRaw) {
				const parsed = JSON.parse(cachedRaw);
				cachedLatest =
					(parsed?.data?.[code] as RealtimeWaterQuality | undefined) || null;
			}
		} catch {
			// ignore cache error
		}

		if (cachedLatest) {
			setChartData((prev) => ({
				latest: cachedLatest,
				history: prev?.latest?.stationCode === cachedLatest?.stationCode ? prev.history : [],
			}));
		}

		setIsLoadingChart(true);
		try {
			const res = await getRealtimeWaterQuality(st.name);
			const freshLatest = res.latest;
			setChartData({
				// 서버(Storage)에 더 최신 시간대 데이터가 있으면 서버값을 우선 사용하고, 동일 시간대면 캐시된 prevAvg를 보완
				latest:
					freshLatest &&
					(!cachedLatest ||
						freshLatest.measureDt >= cachedLatest.measureDt)
						? {
								...cachedLatest,
								...freshLatest,
								prevAvg: freshLatest.prevAvg ?? cachedLatest?.prevAvg,
							}
						: cachedLatest,
				history: res.history,
			});
		} catch {
			if (!cachedLatest) setChartData(null);
		} finally {
			setIsLoadingChart(false);
		}
	};

	const {
		searchTerm,
		setSearchTerm,
		searchResults,
		isSat,
		isInverted,
		toggleInvert,
		isTracking,
		userLocation,
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
		// 에디터 상태 및 액션
		isEditMode,
		setIsEditMode,
		isAddingStation,
		setIsAddingStation,
		isAddingPoi,
		setIsAddingPoi,
		editingStation,
		setEditingStation,
		updateStationLocation,
		handleAddPoi,
		handleAddStation,
		handleDeleteStation,
	} = useMapState(stations, refresh);

	// 검색창 포커스 여부
	const [_isSearchFocused, _setIsSearchFocused] = useState(false);

	// URL 쿼리 파라미터로 edit mode 진입 지원 (?mode=edit)
	useEffect(() => {
		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			if (params.get("mode") === "edit") {
				setIsEditMode(true);
			}
		}
	}, [setIsEditMode]);

	// 타이틀 설정
	useEffect(() => {
		document.title = isEditMode
			? "측정망 편집 - 한강수계 수질자동측정망"
			: "측정망 지도 - 한강수계 수질자동측정망";
	}, [isEditMode]);

	// 모달 또는 시트가 하나라도 열려 있는지 여부
	const isAnyModalOpen = Boolean(
		isSidebarOpen || isAdminMenuOpen || selectedStation || chartStation,
	);

	return (
		<div
			id="main-content"
			className="fixed inset-0 w-full h-dvh bg-slate-50 dark:bg-slate-950 overflow-hidden overscroll-none font-sans select-none"
		>
			<div aria-live="polite" aria-atomic="true" className="sr-only">
				{searchTerm ? `검색 결과 ${searchResults.length}건이 있습니다.` : ""}
			</div>

			{/* ============================================================ */}
			{/* 1. 상단 좌측 뒤로가기 버튼 (모달 열림 시 숨김 처리)          */}
			{/* ============================================================ */}
			{!isEditMode && !isUiHidden && !isAnyModalOpen && (
				<div className="absolute top-[calc(env(safe-area-inset-top)+10px)] left-3.5 z-[1100] pointer-events-auto">
					<Link
						href="/dashboard"
						aria-label="대시보드로 돌아가기"
						prefetch={false}
						className="w-10 h-10 rounded-2xl bg-white/70 dark:bg-[#111115]/85 backdrop-blur-xl text-slate-800 dark:text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-black/[0.08] dark:border-white/10 flex items-center justify-center hover:bg-white dark:hover:bg-[#111115] active:scale-95 transition-all"
					>
						<ChevronLeft size={22} strokeWidth={2.8} />
					</Link>
				</div>
			)}

			{/* ============================================================ */}
			{/* 1-1. 하단 통합 1줄 바 (왼쪽 GPS + 중간 검색·목록 + 오른쪽 설정) */}
			{/* ============================================================ */}
			{!isEditMode && !isUiHidden && (
				<div className="absolute bottom-[calc(env(safe-area-inset-bottom)+14px)] inset-x-3.5 z-[1100] pointer-events-none flex flex-col items-center">
					{/* 통합 1줄 바 컨테이너 (바텀시트와 동일한 Frosted Island Glass 적용) */}
					<div className="pointer-events-auto w-full max-w-md h-12 rounded-2xl bg-white/80 dark:bg-[#111115]/90 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-black/[0.08] dark:border-white/10 flex items-center px-1.5 gap-1.5">
						{/* 1. 왼쪽: GPS 내 위치 추적 버튼 */}
						<button
							type="button"
							onClick={toggleGPS}
							aria-label="GPS 추적"
							title="내 위치 추적"
							className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all shrink-0 border ${
								isTracking
									? "bg-rose-500 text-white border-rose-400 shadow-xs animate-pulse"
									: "bg-white/60 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border-black/[0.06] dark:border-white/10 text-slate-800 dark:text-slate-200"
							}`}
						>
							<Crosshair size={17} strokeWidth={2.5} />
						</button>

						{/* 2. 중간: 검색창 (바텀시트 요약 칩 스타일) */}
						<div
							onClick={() => {
								setIsAdminMenuOpen(false);
								setSelectedStation(null);
								setChartStation(null);
								setIsSidebarOpen(true);
							}}
							className="flex-1 flex items-center gap-1.5 min-w-0 pl-2.5 pr-1.5 h-9 bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 border border-black/[0.06] dark:border-white/10 rounded-xl cursor-text transition-colors"
						>
							<Search
								size={16}
								strokeWidth={2.5}
								className="text-slate-700 dark:text-slate-300 shrink-0"
							/>
							<input
								id="map-search"
								type="text"
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value);
									setIsAdminMenuOpen(false);
									setSelectedStation(null);
									setChartStation(null);
									setIsSidebarOpen(true);
								}}
								onFocus={() => {
									setIsAdminMenuOpen(false);
									setSelectedStation(null);
									setChartStation(null);
									setIsSidebarOpen(true);
								}}
								placeholder="측정소명/초성 검색"
								className="w-full bg-transparent border-none outline-none text-xs font-semibold text-[#0f172a] dark:text-white placeholder:text-[#64748b] dark:placeholder:text-[#a1a1aa]"
							/>
							{searchTerm ? (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										setSearchTerm("");
									}}
									className="w-5 h-5 rounded-full bg-slate-900/10 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white flex items-center justify-center active:scale-95 transition-all shrink-0"
									aria-label="검색어 지우기"
								>
									<X size={12} strokeWidth={2.5} />
								</button>
							) : (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										setIsAdminMenuOpen(false);
										setSelectedStation(null);
										setChartStation(null);
										setIsSidebarOpen(true);
									}}
									title="측정소 목록"
									aria-label="측정소 목록 열기"
									className="w-7 h-7 rounded-lg bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-slate-800 dark:text-slate-200 flex items-center justify-center active:scale-90 transition-all shrink-0 border border-black/[0.06] dark:border-white/10"
								>
									<List size={15} strokeWidth={2.5} />
								</button>
							)}
						</div>

						{/* 2. 오른쪽: 테마 + 통합 지도 설정/관리 */}
						<div className="flex items-center gap-1.5 shrink-0">
							<ThemeToggle className="!w-9 !h-9 !rounded-xl !bg-white/60 dark:!bg-white/10 hover:!bg-white dark:hover:!bg-white/20 !border-black/[0.06] dark:!border-white/10" />
							<button
								onClick={() => {
									setIsSidebarOpen(false);
									setSelectedStation(null);
									setChartStation(null);
									setIsDetailChipOpen(false);
									setIsAdminMenuOpen(!isAdminMenuOpen);
								}}
								aria-label="지도 설정 및 관리 도구 열기"
								title="지도 설정 · 관리"
								className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all border ${
									isAdminMenuOpen
										? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs"
										: "bg-white/60 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border-black/[0.06] dark:border-white/10 text-slate-800 dark:text-slate-200"
								}`}
							>
								<Settings size={17} strokeWidth={2.5} />
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ============================================================ */}
			{/* 2. 에디터 모드 하단 툴바                                      */}
			{/* ============================================================ */}
			{isEditMode && (
				<div className="absolute bottom-[calc(env(safe-area-inset-bottom)+14px)] inset-x-3.5 z-[1100] pointer-events-none flex flex-col items-center">
					<div className="pointer-events-auto w-full max-w-xs h-12 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-slate-200/80 dark:border-white/10 grid grid-cols-2 items-center p-1.5 gap-1.5">
						{/* 1. 완료 버튼 */}
						<button
							onClick={() => {
								setIsEditMode(false);
								setIsAddingStation(false);
								setIsAddingPoi(false);
								setEditingStation(null);
							}}
							aria-label="편집 모드 종료"
							className="h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center gap-1 text-[11.5px] font-black transition-all active:scale-95 shadow-sm"
						>
							<Check size={14} strokeWidth={3} />
							<span>완료</span>
						</button>

						{/* 2. 관심 추가 버튼 */}
						<button
							onClick={() => {
								setIsAddingPoi(!isAddingPoi);
								setIsAddingStation(false);
							}}
							className={`h-9 rounded-xl font-black text-[11.5px] flex items-center justify-center gap-1 transition-all active:scale-95 border ${
								isAddingPoi
									? "bg-rose-600 text-white border-rose-500 shadow-sm"
									: "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-white/15"
							}`}
						>
							{isAddingPoi ? (
								<X size={14} strokeWidth={3} />
							) : (
								<MapPin size={14} strokeWidth={3} />
							)}
							<span>관심</span>
						</button>
					</div>
				</div>
			)}

			{/* 에디터 안내 배너 */}
			{isEditMode && (isAddingStation || isAddingPoi) && (
				<div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1101] pointer-events-none px-4 w-full max-w-sm">
					<div
						className={`${
							isAddingStation ? "bg-indigo-600" : "bg-rose-600"
						} text-white px-4 py-2.5 rounded-2xl text-xs font-black text-center shadow-2xl animate-bounce border border-white/20`}
					>
						{isAddingStation
							? "지도를 탭하여 새 측정소를 추가하세요"
							: "지도를 탭하여 새 관심지점을 추가하세요"}
					</div>
				</div>
			)}

			{/* ============================================================ */}
			{/* 3. 메인 지도 (MapLibre Vector Map)                           */}
			{/* ============================================================ */}
			<MapLibreView
				stations={stations}
				filters={filters}
				selectedStation={selectedStation}
				setSelectedStation={setSelectedStation}
				mapRef={mapRef}
				isSat={isSat}
				isInverted={isInverted}
				userLocation={userLocation}
				isEditMode={isEditMode}
				isAddingStation={isAddingStation}
				isAddingPoi={isAddingPoi}
				onAddStation={handleAddStation}
				onAddPoi={handleAddPoi}
				onUpdateStationLocation={updateStationLocation}
				editingStation={editingStation}
				setEditingStation={setEditingStation}
			/>

			{/* ============================================================ */}
			{/* 4. 인터페이스 숨김 모드 복원 버튼 (우상단 동일 위치)        */}
			{/* ============================================================ */}
			{!isEditMode && isUiHidden && (
				<div className="absolute top-[calc(env(safe-area-inset-top)+10px)] right-3.5 z-[1300] pointer-events-auto animate-in fade-in duration-200">
					<button
						onClick={() => setIsUiHidden(false)}
						aria-label="인터페이스 표시"
						title="UI 표시"
						style={{
							backgroundColor: "rgba(255, 255, 255, 0.5)",
							backdropFilter: "blur(16px)",
							WebkitBackdropFilter: "blur(16px)",
						}}
						className="h-10 px-3.5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-white/60 dark:border-white/20 flex items-center gap-1.5 text-slate-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition-all"
					>
						<Eye
							size={16}
							strokeWidth={2.5}
							className="text-indigo-600 dark:text-indigo-400"
						/>
						<span className="text-xs font-black tracking-tight">UI 표시</span>
					</button>
				</div>
			)}

			{/* ============================================================ */}
			{/* 5. 통합 지도 설정 및 관리 모달 (2탭: 표시 설정 / 관리 도구)   */}
			{/* ============================================================ */}
			<Modal
				isOpen={!isEditMode && isAdminMenuOpen}
				onClose={() => {
					setIsAdminMenuOpen(false);
					setIsDetailChipOpen(false);
				}}
				title="지도 설정"
				icon={Settings}
				size="half"
				headerAction={
					<div className="flex items-center p-0.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px] font-bold">
						<button
							type="button"
							onClick={() => {
								setSettingsTab("display");
								setIsDetailChipOpen(false);
							}}
							className={`px-2 py-0.5 rounded-md transition-colors ${
								settingsTab === "display"
									? "bg-white dark:bg-[#16161c] text-[#0f172a] dark:text-white shadow-2xs"
									: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
							}`}
						>
							표시 설정
						</button>
						<button
							type="button"
							onClick={() => {
								setSettingsTab("admin");
								setIsDetailChipOpen(false);
							}}
							className={`px-2 py-0.5 rounded-md transition-colors ${
								settingsTab === "admin"
									? "bg-white dark:bg-[#16161c] text-[#0f172a] dark:text-white shadow-2xs"
									: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
							}`}
						>
							관리 도구
						</button>
					</div>
				}
			>
				{settingsTab === "display" ? (
					<div className="flex-1 flex flex-col justify-between gap-2 text-[11px]">
						{/* 1단. 마커 수질 칩 표시 (4열 정사각형 타일) */}
						<div className="space-y-1 relative">
							<div className="flex items-center justify-between px-0.5 leading-none">
								<span className="text-[10px] font-semibold text-[#64748b] dark:text-[#94a3b8]">
									마커 수질 칩
								</span>
								<span className="text-[9px] text-[#94a3b8] dark:text-[#71717a]">
									단일 선택
								</span>
							</div>

							<div className="grid grid-cols-5 gap-1.5">
								<button
									type="button"
									onClick={() => {
										setFilters({ ...filters, waterChip: "default" });
										setIsDetailChipOpen(false);
									}}
									className={`h-[47px] sm:h-[55px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border ${
										filters.waterChip === "default"
											? "bg-blue-600 text-white font-bold border-blue-500 shadow-xs"
											: "bg-[#f8fafc] dark:bg-[#18181b] text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-white border-[#d7dfe9] dark:border-[#2a2a32]"
									}`}
								>
									<Droplets size={15} strokeWidth={2.4} />
									<span className="text-[10px] font-bold leading-none">
										기본
									</span>
								</button>

								<button
									type="button"
									onClick={() => {
										setFilters({ ...filters, waterChip: "toc" });
										setIsDetailChipOpen(false);
									}}
									className={`h-[47px] sm:h-[55px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border ${
										filters.waterChip === "toc"
											? "bg-sky-600 text-white font-bold border-sky-500 shadow-xs"
											: "bg-[#f8fafc] dark:bg-[#18181b] text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-white border-[#d7dfe9] dark:border-[#2a2a32]"
									}`}
								>
									<span className="text-[11px] font-black leading-none tracking-tight">
										TOC
									</span>
									<span className="text-[9px] font-semibold opacity-80 leading-none">
										유기탄소
									</span>
								</button>

								<button
									type="button"
									onClick={() => {
										setFilters({ ...filters, waterChip: "ec" });
										setIsDetailChipOpen(false);
									}}
									className={`h-[47px] sm:h-[55px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border ${
										filters.waterChip === "ec"
											? "bg-sky-600 text-white font-bold border-sky-500 shadow-xs"
											: "bg-[#f8fafc] dark:bg-[#18181b] text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-white border-[#d7dfe9] dark:border-[#2a2a32]"
									}`}
								>
									<span className="text-[11px] font-black leading-none tracking-tight">
										EC
									</span>
									<span className="text-[9px] font-semibold opacity-80 leading-none">
										전도도
									</span>
								</button>

								<button
									type="button"
									onClick={() => setIsDetailChipOpen(!isDetailChipOpen)}
									className={`h-[47px] sm:h-[55px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border px-1 ${
										filters.waterChip !== "default" &&
										filters.waterChip !== "toc" &&
										filters.waterChip !== "ec" &&
										filters.waterChip !== "none"
											? "bg-sky-600 text-white font-bold border-sky-500 shadow-xs"
											: "bg-[#f8fafc] dark:bg-[#18181b] text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-white border-[#d7dfe9] dark:border-[#2a2a32]"
									}`}
								>
									<div className="flex items-center gap-0.5">
										<SlidersHorizontal size={13} strokeWidth={2.4} />
										<ChevronDown
											size={11}
											strokeWidth={2.5}
											className={`transition-transform duration-200 ${
												isDetailChipOpen ? "rotate-180" : ""
											}`}
										/>
									</div>
									<span className="text-[10px] font-bold leading-none truncate max-w-full">
										{filters.waterChip !== "default" &&
										filters.waterChip !== "toc" &&
										filters.waterChip !== "ec" &&
										filters.waterChip !== "none"
											? {
													tp: "총인",
													tn: "총질소",
													wtrtp: "수온",
													wqi: "WQI",
													ph: "pH",
													doc: "DO",
													tur: "탁도",
													chla: "Chl-a",
												}[filters.waterChip]
											: "상세"}
									</span>
								</button>

								<button
									type="button"
									onClick={() => {
										setFilters({ ...filters, waterChip: "none" });
										setIsDetailChipOpen(false);
									}}
									className={`h-[47px] sm:h-[55px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border ${
										filters.waterChip === "none"
											? "bg-[#27272a] text-white font-bold border-white/20 shadow-xs"
											: "bg-[#f8fafc] dark:bg-[#18181b] text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-white border-[#d7dfe9] dark:border-[#2a2a32]"
									}`}
								>
									<EyeOff size={15} strokeWidth={2.4} />
									<span className="text-[10px] font-bold leading-none">
										숨김
									</span>
								</button>
							</div>

							{/* 상세 지표 팝오버 메뉴 (2x4 정사각형 타일) */}
							{isDetailChipOpen && (
								<div className="absolute top-full left-0 right-0 mt-1.5 z-30 p-1.5 bg-white dark:bg-[#16161c] border border-[#d7dfe9] dark:border-[#2a2a32] rounded-xl shadow-xl shadow-black/20 animate-in fade-in zoom-in-95 duration-150">
									<div className="grid grid-cols-4 gap-1.5">
										{(
											[
												{ key: "tp", code: "TP", label: "총인" },
												{ key: "tn", code: "TN", label: "총질소" },
												{ key: "wtrtp", code: "수온", label: "°C" },
												{ key: "wqi", code: "WQI", label: "수질점수" },
												{ key: "ph", code: "pH", label: "수소이온" },
												{ key: "doc", code: "DO", label: "용존산소" },
												{ key: "tur", code: "탁도", label: "NTU" },
												{ key: "chla", code: "Chl-a", label: "클로로필" },
											] as const
										).map((item) => {
											const isSelected = filters.waterChip === item.key;
											return (
												<button
													key={item.key}
													type="button"
													onClick={() => {
														setFilters({
															...filters,
															waterChip: item.key,
														});
														setIsDetailChipOpen(false);
													}}
													className={`h-[62px] sm:h-[72px] px-1 rounded-xl flex flex-col items-center justify-center gap-1 text-center transition-all active:scale-95 border ${
														isSelected
															? "bg-sky-600 text-white border-sky-500 font-bold shadow-xs"
															: "bg-[#f8fafc] dark:bg-[#111115] hover:bg-black/5 dark:hover:bg-white/5 text-[#334155] dark:text-[#cbd5e1] border-[#d7dfe9] dark:border-[#2a2a32]"
													}`}
												>
													<span className="text-[11px] font-black leading-none tracking-tight">
														{item.code}
													</span>
													<span
														className={`text-[9px] font-semibold leading-none truncate max-w-full ${
															isSelected ? "text-sky-100" : "opacity-70"
														}`}
													>
														{item.label}
													</span>
												</button>
											);
										})}
									</div>
								</div>
							)}
						</div>

						{/* 2단. 지도 · 측정망 (5열 정사각형 타일) */}
						<div className="space-y-1">
							<span className="text-[10px] font-semibold text-[#64748b] dark:text-[#94a3b8] block px-0.5 leading-none">
								지도 · 측정망
							</span>
							<div className="grid grid-cols-5 gap-1.5">
								<button
									type="button"
									onClick={toggleLayer}
									className={`h-[47px] sm:h-[55px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border ${
										isSat
											? "bg-blue-600 text-white font-bold border-blue-500 shadow-xs"
											: "bg-[#f8fafc] dark:bg-[#18181b] text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-white border-[#d7dfe9] dark:border-[#2a2a32]"
									}`}
								>
									<Layers size={15} strokeWidth={2.4} />
									<span className="text-[10px] font-bold leading-none">
										{isSat ? "위성" : "일반"}
									</span>
								</button>

								<button
									type="button"
									onClick={toggleInvert}
									className={`h-[47px] sm:h-[55px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border ${
										isInverted
											? "bg-indigo-600 text-white font-bold border-indigo-500 shadow-xs"
											: "bg-[#f8fafc] dark:bg-[#18181b] text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-white border-[#d7dfe9] dark:border-[#2a2a32]"
									}`}
								>
									<SunMoon size={15} strokeWidth={2.4} />
									<span className="text-[10px] font-bold leading-none">
										색반전
									</span>
								</button>

								<button
									type="button"
									onClick={() =>
										setFilters({ ...filters, station: !filters.station })
									}
									className={`h-[47px] sm:h-[55px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border ${
										filters.station
											? "bg-blue-600 text-white font-bold border-blue-500 shadow-xs"
											: "bg-[#f8fafc] dark:bg-[#18181b] text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-white border-[#d7dfe9] dark:border-[#2a2a32]"
									}`}
								>
									<MapPin size={15} strokeWidth={2.4} />
									<span className="text-[10px] font-bold leading-none">
										국가
									</span>
								</button>

								<button
									type="button"
									onClick={() =>
										setFilters({ ...filters, small: !filters.small })
									}
									className={`h-[47px] sm:h-[55px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border ${
										filters.small
											? "bg-teal-600 text-white font-bold border-teal-500 shadow-xs"
											: "bg-[#f8fafc] dark:bg-[#18181b] text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-white border-[#d7dfe9] dark:border-[#2a2a32]"
									}`}
								>
									<MapPin size={15} strokeWidth={2.4} />
									<span className="text-[10px] font-bold leading-none">
										소규모
									</span>
								</button>

								<button
									type="button"
									onClick={() =>
										setFilters({ ...filters, poi: !filters.poi })
									}
									className={`h-[47px] sm:h-[55px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border ${
										filters.poi
											? "bg-rose-600 text-white font-bold border-rose-500 shadow-xs"
											: "bg-[#f8fafc] dark:bg-[#18181b] text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-white border-[#d7dfe9] dark:border-[#2a2a32]"
									}`}
								>
									<MapPin size={15} strokeWidth={2.4} />
									<span className="text-[10px] font-bold leading-none">
										관심
									</span>
								</button>
							</div>
						</div>

						{/* 3단. 수계 표시 및 흐름 강조 (5열 정사각형 타일) */}
						<div className="space-y-1">
							<div className="flex items-center justify-between px-0.5 leading-none">
								<div className="flex items-center gap-1.5">
									<span className="text-[10px] font-semibold text-[#64748b] dark:text-[#94a3b8]">
										수계 표시 · 강조
									</span>
									<span className="text-[8.5px] text-[#94a3b8] dark:text-[#71717a]">
										(끔➔켬➔강조)
									</span>
								</div>
								<div className="flex items-center gap-2">
									{filters.highlightedRiver && (
										<button
											type="button"
											onClick={() =>
												setFilters({ ...filters, highlightedRiver: null })
											}
											className="text-[9px] font-semibold text-amber-500 hover:underline"
										>
											강조 해제
										</button>
									)}
									<button
										type="button"
										onClick={() => {
											const allOn = Object.values(filters.rivers).every(
												Boolean,
											);
											setFilters({
												...filters,
												rivers: {
													bukhan: !allOn,
													namhan: !allOn,
													han: !allOn,
													imjin: !allOn,
													pyeongtaek: !allOn,
												},
											});
										}}
										className="text-[9.5px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
									>
										{Object.values(filters.rivers).every(Boolean)
											? "전체 해제"
											: "전체 선택"}
									</button>
								</div>
							</div>

							<div className="grid grid-cols-5 gap-1.5">
								{(
									["bukhan", "namhan", "han", "imjin", "pyeongtaek"] as const
								).map((rv) => {
									const conf = RIVER_CONFIG[rv];
									const isActive = filters.rivers[rv];
									const isHigh = filters.highlightedRiver === rv;

									const handleRiverClick = () => {
										setFilters((prev) => {
											const currentActive = prev.rivers[rv];
											const currentHigh = prev.highlightedRiver === rv;

											if (!currentActive) {
												return {
													...prev,
													rivers: { ...prev.rivers, [rv]: true },
													highlightedRiver:
														prev.highlightedRiver === rv
															? null
															: prev.highlightedRiver,
												};
											} else if (currentActive && !currentHigh) {
												return {
													...prev,
													rivers: { ...prev.rivers, [rv]: true },
													highlightedRiver: rv,
												};
											} else {
												return {
													...prev,
													rivers: { ...prev.rivers, [rv]: false },
													highlightedRiver:
														prev.highlightedRiver === rv
															? null
															: prev.highlightedRiver,
												};
											}
										});
									};

									return (
										<button
											key={rv}
											type="button"
											onClick={handleRiverClick}
											style={{
												backgroundColor: isHigh
													? conf.color
													: isActive
														? `${conf.color}20`
														: undefined,
												borderColor: isHigh
													? conf.color
													: isActive
														? `${conf.color}80`
														: undefined,
												color: isHigh
													? "#ffffff"
													: isActive
														? conf.color
														: undefined,
											}}
											className={`h-[47px] sm:h-[55px] rounded-xl flex flex-col items-center justify-center gap-1.5 border transition-all active:scale-95 relative select-none ${
												isHigh
													? "font-black shadow-md ring-2 ring-white/50 ring-offset-1 dark:ring-offset-black"
													: isActive
														? "font-bold shadow-xs"
														: "bg-[#f8fafc] dark:bg-[#18181b] text-[#94a3b8] dark:text-[#71717a] border-[#d7dfe9] dark:border-[#2a2a32]"
											}`}
										>
											{isHigh ? (
												<span className="text-xs leading-none">★</span>
											) : (
												<span
													className="w-2.5 h-2.5 rounded-full shrink-0"
													style={{
														backgroundColor: isActive
															? conf.color
															: "#94a3b8",
														opacity: isActive ? 1 : 0.4,
													}}
												/>
											)}
											<span className="text-[10px] tracking-tight leading-none truncate max-w-full px-0.5">
												{conf.label.replace("수계", "").replace("본류", "")}
											</span>
										</button>
									);
								})}
							</div>
						</div>
					</div>
				) : (
					<div className="flex-1 flex flex-col justify-between gap-2">
						<div className="grid grid-cols-3 gap-2 py-1">
							{/* 1. 측정망 지도 편집 */}
							<button
								type="button"
								onClick={() => {
									setIsEditMode(true);
									setIsAdminMenuOpen(false);
								}}
								className="aspect-[1/1] rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-[#d7dfe9] dark:border-[#2a2a32] bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/5 text-[#0f172a] dark:text-white transition-all active:scale-95 px-1.5"
							>
								<div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
									<MapIcon size={16} strokeWidth={2.4} />
								</div>
								<div className="text-center">
									<span className="text-xs font-bold tracking-tight block">
										지도 편집
									</span>
									<span className="text-[9.5px] text-[#64748b] dark:text-[#a1a1aa] block">
										위치·관심지점
									</span>
								</div>
							</button>

							{/* 2. 기기 통계 요약 */}
							<Link
								href="/map/stations?tab=summary"
								onClick={() => setIsAdminMenuOpen(false)}
								className="aspect-[1/1] rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-[#d7dfe9] dark:border-[#2a2a32] bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/5 text-[#0f172a] dark:text-white transition-all active:scale-95 px-1.5"
							>
								<div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
									<Table2 size={16} strokeWidth={2.4} />
								</div>
								<div className="text-center">
									<span className="text-xs font-bold tracking-tight block">
										기기 통계
									</span>
									<span className="text-[9.5px] text-[#64748b] dark:text-[#a1a1aa] block">
										항목별 집계표
									</span>
								</div>
							</Link>

							{/* 3. 측정소 제원 관리 */}
							<Link
								href={
									selectedStation
										? `/map/stations?id=${selectedStation.id}`
										: "/map/stations"
								}
								onClick={() => setIsAdminMenuOpen(false)}
								className="aspect-[1/1] rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-[#d7dfe9] dark:border-[#2a2a32] bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/5 text-[#0f172a] dark:text-white transition-all active:scale-95 px-1.5"
							>
								<div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
									<Database size={16} strokeWidth={2.4} />
								</div>
								<div className="text-center">
									<span className="text-xs font-bold tracking-tight block">
										제원 관리
									</span>
									<span className="text-[9.5px] text-[#64748b] dark:text-[#a1a1aa] block">
										장비·연혁
									</span>
								</div>
							</Link>
						</div>

						{/* 공간정보 및 데이터 출처 (Attribution) */}
						<div className="pt-1.5 border-t border-[#d7dfe9]/80 dark:border-[#2a2a32]/80 flex items-center justify-between gap-1 text-[9.5px] text-[#94a3b8] dark:text-[#71717a] leading-none">
							<span className="font-medium tracking-tight">공간정보 출처</span>
							<div className="flex items-center gap-1.5">
								<span>지도: 국토교통부 VWorld</span>
								<span className="opacity-40">•</span>
								<span>하천: HDX (OSM)</span>
							</div>
						</div>
					</div>
				)}
			</Modal>

			{/* ============================================================ */}
			{/* 6. 에디터 하단 선택 노드 정보/삭제 패널                      */}
			{/* ============================================================ */}
			{isEditMode && editingStation && (
				<div className="absolute bottom-[calc(env(safe-area-inset-bottom)+70px)] inset-x-3.5 z-[1600] animate-in slide-in-from-bottom-5 duration-300 max-w-md mx-auto pointer-events-auto">
					<div className="p-4 flex flex-col gap-3.5 border border-[#2a2a32] rounded-2xl bg-[#111115] shadow-2xl w-full">
						<div className="flex justify-between items-start">
							<div className="space-y-1 min-w-0">
								<div className="flex items-center gap-1.5">
									<span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 uppercase tracking-wider">
										{TYPE_CONFIG[editingStation.type]?.label ||
											editingStation.type}
									</span>
									<span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
										{RIVER_CONFIG[editingStation.river]?.label ||
											editingStation.river}
									</span>
								</div>
								<h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
									{editingStation.name}
								</h3>
								<p className="text-[10px] text-slate-400 font-mono">
									{editingStation.lat.toFixed(5)},{" "}
									{editingStation.lng.toFixed(5)}
								</p>
							</div>

							<div className="flex gap-1.5 shrink-0">
								{editingStation.type === "poi" && (
									<button
										onClick={() => handleDeleteStation(editingStation)}
										className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-all active:scale-95"
										title="삭제"
									>
										<Trash2 size={16} strokeWidth={2.5} />
									</button>
								)}
								<button
									onClick={() => setEditingStation(null)}
									className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-all active:scale-95"
									title="닫기"
								>
									<X size={16} strokeWidth={2.5} />
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ============================================================ */}
			{/* 7. 측정소 목록 및 검색 모달                                  */}
			{/* ============================================================ */}
			<StationListModal
				isOpen={isSidebarOpen}
				onClose={() => setIsSidebarOpen(false)}
				onSelectStation={moveToStation}
				stations={stations}
				searchTerm={searchTerm}
				searchResults={searchResults}
			/>

			{/* ============================================================ */}
			{/* 8. 모바일 인터랙티브 바텀 시트 (선택 시 슬라이드 업, 차트 모달 열릴 땐 숨김) */}
			{/* ============================================================ */}
			{!isEditMode && !isUiHidden && selectedStation && !chartStation && (
				<StationBottomSheet
					station={selectedStation}
					onClose={() => setSelectedStation(null)}
					onOpenWaterQuality={handleOpenWaterQuality}
				/>
			)}

			{/* ============================================================ */}
			{/* 9. 실시간 수질 24시간 추이 차트 모달 (독립 최상위 레벨)       */}
			{/* ============================================================ */}
			{chartStation && (
				<WaterQualityChartModal
					isOpen={!!chartStation}
					onClose={() => {
						setChartStation(null);
						setChartInitialMetric(undefined);
					}}
					stationName={chartStation.name}
					initialMetric={chartInitialMetric}
					data={chartData}
					isLoading={isLoadingChart}
				/>
			)}
		</div>
	);
}
