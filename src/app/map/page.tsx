"use client";

import {
	ArrowUp,
	Check,
	ChevronLeft,
	Crosshair,
	Database,
	Eye,
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
import { useStations } from "@/utils/supabase/hooks";
import { MapSidebar } from "./components/MapSidebar";

import { StationBottomSheet } from "./components/StationBottomSheet";
import { RIVER_CONFIG, TYPE_CONFIG } from "./stationData";
import { useMapState } from "./useMapState";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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
	// 하단 필터 팝오버 상태
	const [isFilterOpen, setIsFilterOpen] = useState(false);

	const {
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
		// 에디터 상태 및 액션
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
		isFilterOpen || isSidebarOpen || isAdminMenuOpen || selectedStation,
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
			{/* 1-1. 하단 통합 1줄 바 (왼쪽 필터 + 중간 검색 + 오른쪽 목록)   */}
			{/* ============================================================ */}
			{!isEditMode && !isUiHidden && (
				<div className="absolute bottom-[calc(env(safe-area-inset-bottom)+14px)] inset-x-3.5 z-[1100] pointer-events-none flex flex-col items-center">
					{/* 통합 1줄 바 컨테이너 (바텀시트와 동일한 Frosted Island Glass 적용) */}
					<div className="pointer-events-auto w-full max-w-md h-12 rounded-2xl bg-white/80 dark:bg-[#111115]/90 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-black/[0.08] dark:border-white/10 flex items-center px-1.5 gap-1.5">
						{/* 1. 왼쪽: 필터 버튼 (아이콘 전용) */}
						<button
							onClick={() => {
								setIsSidebarOpen(false);
								setIsAdminMenuOpen(false);
								setSelectedStation(null);
								setIsFilterOpen(!isFilterOpen);
							}}
							aria-label="레이어 필터 열기"
							title="필터"
							className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all shrink-0 border ${
								isFilterOpen
									? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs"
									: "bg-white/60 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border-black/[0.06] dark:border-white/10 text-slate-800 dark:text-slate-200"
							}`}
						>
							<SlidersHorizontal size={17} strokeWidth={2.5} />
						</button>

						{/* 2. 중간: 검색창 (바텀시트 요약 칩 스타일) */}
						<div
							onClick={() => {
								setIsFilterOpen(false);
								setIsAdminMenuOpen(false);
								setSelectedStation(null);
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
									setIsFilterOpen(false);
									setIsAdminMenuOpen(false);
									setSelectedStation(null);
									setIsSidebarOpen(true);
								}}
								onFocus={() => {
									setIsFilterOpen(false);
									setIsAdminMenuOpen(false);
									setSelectedStation(null);
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
										setIsFilterOpen(false);
										setIsAdminMenuOpen(false);
										setSelectedStation(null);
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

						{/* 3. 오른쪽: 관리도구 */}
						<div className="flex items-center gap-1.5 shrink-0">
							<ThemeToggle />
							<button
								onClick={() => {
									setIsFilterOpen(false);
									setIsSidebarOpen(false);
									setSelectedStation(null);
									setIsAdminMenuOpen(!isAdminMenuOpen);
								}}
								aria-label="관리 도구 열기"
								title="관리 도구"
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
					<div className="pointer-events-auto w-full max-w-sm h-12 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-slate-200/80 dark:border-white/10 grid grid-cols-3 items-center p-1.5 gap-1.5">
						{/* 1. 완료 버튼 */}
						<button
							onClick={() => {
								setIsEditMode(false);
								setIsAddingStation(false);
								setIsAddingArrow(false);
								setIsAddingPoi(false);
								setEditingStation(null);
							}}
							aria-label="편집 모드 종료"
							className="h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center gap-1 text-[11.5px] font-black transition-all active:scale-95 shadow-sm"
						>
							<Check size={14} strokeWidth={3} />
							<span>완료</span>
						</button>

						{/* 2. 흐름 추가 버튼 */}
						<button
							onClick={() => {
								setIsAddingArrow(!isAddingArrow);
								setIsAddingStation(false);
								setIsAddingPoi(false);
							}}
							className={`h-9 rounded-xl font-black text-[11.5px] flex items-center justify-center gap-1 transition-all active:scale-95 border ${
								isAddingArrow
									? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
									: "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-white/15"
							}`}
						>
							{isAddingArrow ? (
								<X size={14} strokeWidth={3} />
							) : (
								<ArrowUp size={14} strokeWidth={3} />
							)}
							<span>흐름</span>
						</button>

						{/* 4. 관심 추가 버튼 */}
						<button
							onClick={() => {
								setIsAddingPoi(!isAddingPoi);
								setIsAddingStation(false);
								setIsAddingArrow(false);
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
			{isEditMode && (isAddingArrow || isAddingStation || isAddingPoi) && (
				<div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1101] pointer-events-none px-4 w-full max-w-sm">
					<div
						className={`${
							isAddingStation
								? "bg-indigo-600"
								: isAddingArrow
									? "bg-emerald-600"
									: "bg-rose-600"
						} text-white px-4 py-2.5 rounded-2xl text-xs font-black text-center shadow-2xl animate-bounce border border-white/20`}
					>
						{isAddingStation
							? "지도를 탭하여 새 측정소를 추가하세요"
							: isAddingArrow
								? "지도를 탭하여 새 흐름 화살표를 추가하세요"
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
				isEditMode={isEditMode}
				isAddingStation={isAddingStation}
				isAddingArrow={isAddingArrow}
				isAddingPoi={isAddingPoi}
				onAddStation={handleAddStation}
				onAddArrow={handleAddArrow}
				onAddPoi={handleAddPoi}
				onUpdateStationLocation={updateStationLocation}
				editingStation={editingStation}
				setEditingStation={setEditingStation}
			/>

			{/* ============================================================ */}
			{/* 4. 우측 플로팅 GPS 버튼 (모달 열림 시 뒤로가기와 동일하게 숨김)*/}
			{/* ============================================================ */}
			{!isEditMode && !isUiHidden && !isAnyModalOpen && (
				<div className="absolute bottom-[calc(env(safe-area-inset-bottom)+76px)] right-3.5 z-[1050] flex flex-col items-center gap-2 pointer-events-auto">
					{/* GPS 내 위치 추적 단독 유지 */}
					<button
						onClick={toggleGPS}
						aria-label="GPS 추적"
						title="내 위치 추적"
						style={{
							backgroundColor: isTracking
								? "#f43f5e"
								: "rgba(255, 255, 255, 0.15)",
							backdropFilter: "blur(6px)",
							WebkitBackdropFilter: "blur(6px)",
							color: isTracking ? "#ffffff" : "#09090b",
						}}
						className={`w-10 h-10 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-white/40 flex items-center justify-center active:scale-95 transition-all ${
							isTracking ? "animate-pulse" : "hover:bg-white/30"
						}`}
					>
						<Crosshair size={20} strokeWidth={2.8} />
					</button>
				</div>
			)}

			{/* ============================================================ */}
			{/* 4-1. 인터페이스 숨김 모드 복원 버튼 (우상단 동일 위치)      */}
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
			{/* 5. 관리자 액션 모달 (공통 M3 Modal 규격 전역 참조)          */}
			{/* ============================================================ */}
			<Modal
				isOpen={!isEditMode && isAdminMenuOpen}
				onClose={() => setIsAdminMenuOpen(false)}
				title="관리 도구"
				subtitle="측정망 편집 및 제원 관리 센터"
				icon={Settings}
			>
				<div className="grid grid-cols-2 gap-2.5">
					{/* 1. 지도 레이어 (위성 / 일반) 토글 */}
					<button
						type="button"
						onClick={() => {
							toggleLayer();
							setIsAdminMenuOpen(false);
						}}
						className={`aspect-[1.25/1] rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all active:scale-95 ${
							isSat
								? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
								: "bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/5 text-[#0f172a] dark:text-white border-[#e2e8f0] dark:border-[#222228]"
						}`}
					>
						<div
							className={`w-8 h-8 rounded-xl flex items-center justify-center ${
								isSat
									? "bg-white/20 text-white"
									: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
							}`}
						>
							<Layers size={16} strokeWidth={2.4} />
						</div>
						<div className="text-center">
							<span className="text-xs font-bold tracking-tight block">
								{isSat ? "위성지도" : "일반지도"}
							</span>
							<span
								className={`text-[10px] font-mono block ${isSat ? "text-blue-100" : "text-[#64748b] dark:text-[#a1a1aa]"}`}
							>
								{isSat ? "ON (일반으로 전환)" : "VWorld 영상 전환"}
							</span>
						</div>
					</button>

					{/* 2. 기기 통계 요약 */}
					<Link
						href="/map/stations?tab=summary"
						onClick={() => setIsAdminMenuOpen(false)}
						className="aspect-[1.25/1] rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-[#e2e8f0] dark:border-[#222228] bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/5 text-[#0f172a] dark:text-white transition-all active:scale-95"
					>
						<div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
							<Table2 size={16} strokeWidth={2.4} />
						</div>
						<div className="text-center">
							<span className="text-xs font-bold tracking-tight block">
								기기 통계
							</span>
							<span className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] block">
								항목별 집계표
							</span>
						</div>
					</Link>

					{/* 3. 측정망 지도 편집 */}
					<button
						type="button"
						onClick={() => {
							setIsEditMode(true);
							setIsAdminMenuOpen(false);
						}}
						className="aspect-[1.25/1] rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-[#e2e8f0] dark:border-[#222228] bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/5 text-[#0f172a] dark:text-white transition-all active:scale-95"
					>
						<div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
							<MapIcon size={16} strokeWidth={2.4} />
						</div>
						<div className="text-center">
							<span className="text-xs font-bold tracking-tight block">
								지도 편집
							</span>
							<span className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] block">
								위치·각도 조정
							</span>
						</div>
					</button>

					{/* 4. 측정소 제원 관리 */}
					<Link
						href={
							selectedStation
								? `/map/stations?id=${selectedStation.id}`
								: "/map/stations"
						}
						onClick={() => setIsAdminMenuOpen(false)}
						className="aspect-[1.25/1] rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-[#e2e8f0] dark:border-[#222228] bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/5 text-[#0f172a] dark:text-white transition-all active:scale-95"
					>
						<div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
							<Database size={16} strokeWidth={2.4} />
						</div>
						<div className="text-center">
							<span className="text-xs font-bold tracking-tight block">
								제원 관리
							</span>
							<span className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] block">
								장비 등록·연혁
							</span>
						</div>
					</Link>

					{/* 5. 지도 색반전 (브라우저 강제 다크/반전 보정) 토글 - 하단 가로 전폭 배치 */}
					<button
						type="button"
						onClick={toggleInvert}
						className={`col-span-2 py-3 px-4 rounded-2xl flex items-center justify-between border transition-all active:scale-95 ${
							isInverted
								? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20"
								: "bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/5 text-[#0f172a] dark:text-white border-[#e2e8f0] dark:border-[#222228]"
						}`}
					>
						<div className="flex items-center gap-2.5">
							<div
								className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
									isInverted
										? "bg-white/20 text-white"
										: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
								}`}
							>
								<SunMoon size={16} strokeWidth={2.4} />
							</div>
							<div className="text-left">
								<span className="text-xs font-bold tracking-tight block">
									{isInverted ? "색반전 켜짐 (보정 활성화)" : "지도 색반전"}
								</span>
								<span
									className={`text-[10px] font-mono block ${
										isInverted ? "text-indigo-100" : "text-[#64748b] dark:text-[#a1a1aa]"
									}`}
								>
									{isInverted ? "클릭 시 원본 색상으로 복원" : "브라우저 강제 반전 보정"}
								</span>
							</div>
						</div>
						<span
							className={`text-xs font-mono font-bold ${
								isInverted ? "text-white" : "text-indigo-600 dark:text-indigo-400"
							}`}
						>
							{isInverted ? "ON" : "OFF"}
						</span>
					</button>
				</div>
			</Modal>

			{/* ============================================================ */}
			{/* 5-1. 표시 레이어 필터 모달 (공통 M3 Modal 규격 전역 참조)    */}
			{/* ============================================================ */}
			<Modal
				isOpen={!isEditMode && isFilterOpen}
				onClose={() => setIsFilterOpen(false)}
				title="표시 레이어 설정"
				subtitle="지도에 노출할 시설 및 수계 선택"
				icon={SlidersHorizontal}
			>
				<div className="space-y-4">
					{/* 1. 시설/망 유형 (3구 타일) */}
					<div className="space-y-1.5">
						<span className="text-[11px] font-mono uppercase tracking-wider text-[#64748b] dark:text-[#a1a1aa] ml-0.5 block">
							측정망 유형
						</span>
						<div className="grid grid-cols-3 gap-1.5">
							<button
								type="button"
								onClick={() =>
									setFilters({ ...filters, station: !filters.station })
								}
								className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 ${
									filters.station
										? "bg-blue-600 text-white border-blue-500 shadow-sm"
										: "bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/5 text-[#0f172a] dark:text-[#a1a1aa] border-[#e2e8f0] dark:border-[#222228]"
								}`}
							>
								<div
									className={`w-6 h-6 rounded-lg flex items-center justify-center ${
										filters.station
											? "bg-white/20 text-white"
											: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
									}`}
								>
									<MapPin size={13} strokeWidth={2.5} />
								</div>
								<span className="text-xs font-bold">국가망</span>
							</button>

							<button
								type="button"
								onClick={() =>
									setFilters({ ...filters, small: !filters.small })
								}
								className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 ${
									filters.small
										? "bg-cyan-600 text-white border-cyan-500 shadow-sm"
										: "bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/5 text-[#0f172a] dark:text-[#a1a1aa] border-[#e2e8f0] dark:border-[#222228]"
								}`}
							>
								<div
									className={`w-6 h-6 rounded-lg flex items-center justify-center ${
										filters.small
											? "bg-white/20 text-white"
											: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
									}`}
								>
									<MapPin size={13} strokeWidth={2.5} />
								</div>
								<span className="text-xs font-bold">소규모</span>
							</button>

							<button
								type="button"
								onClick={() =>
									setFilters({ ...filters, poi: !filters.poi })
								}
								className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 ${
									filters.poi
										? "bg-rose-600 text-white border-rose-500 shadow-sm"
										: "bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/5 text-[#0f172a] dark:text-[#a1a1aa] border-[#e2e8f0] dark:border-[#222228]"
								}`}
							>
								<div
									className={`w-6 h-6 rounded-lg flex items-center justify-center ${
										filters.poi
											? "bg-white/20 text-white"
											: "bg-rose-500/10 text-rose-600 dark:text-rose-400"
									}`}
								>
									<MapPin size={13} strokeWidth={2.5} />
								</div>
								<span className="text-xs font-bold">관심지점</span>
							</button>
						</div>
					</div>

					{/* 2. 하천 흐름 화살표 */}
					<div className="space-y-1.5">
						<span className="text-[11px] font-mono uppercase tracking-wider text-[#64748b] dark:text-[#a1a1aa] ml-0.5 block">
							흐름 화살표
						</span>
						<div className="grid grid-cols-3 gap-1.5">
							<button
								type="button"
								onClick={() => setFilters({ ...filters, arrow: "none" })}
								className={`py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 ${
									filters.arrow === "none"
										? "bg-[#222228] text-white border-white/20 shadow-sm"
										: "bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/5 text-[#0f172a] dark:text-[#a1a1aa] border-[#e2e8f0] dark:border-[#222228]"
								}`}
							>
								<div className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/5 text-[#64748b] dark:text-[#a1a1aa]">
									<X size={12} strokeWidth={2.5} />
								</div>
								<span className="text-xs font-bold">숨김</span>
							</button>

							<button
								type="button"
								onClick={() => setFilters({ ...filters, arrow: "no-name" })}
								className={`py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 ${
									filters.arrow === "no-name"
										? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
										: "bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/5 text-[#0f172a] dark:text-[#a1a1aa] border-[#e2e8f0] dark:border-[#222228]"
								}`}
							>
								<div
									className={`w-6 h-6 rounded-lg flex items-center justify-center ${
										filters.arrow === "no-name"
											? "bg-white/20 text-white"
											: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
									}`}
								>
									<ArrowUp size={13} strokeWidth={3} />
								</div>
								<span className="text-xs font-bold">화살표만</span>
							</button>

							<button
								type="button"
								onClick={() => setFilters({ ...filters, arrow: "name" })}
								className={`py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 ${
									filters.arrow === "name"
										? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
										: "bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/5 text-[#0f172a] dark:text-[#a1a1aa] border-[#e2e8f0] dark:border-[#222228]"
								}`}
							>
								<div
									className={`w-6 h-6 rounded-lg flex items-center justify-center ${
										filters.arrow === "name"
											? "bg-white/20 text-white"
											: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
									}`}
								>
									<ArrowUp size={13} strokeWidth={3} />
								</div>
								<span className="text-xs font-bold">+지명표시</span>
							</button>
						</div>
					</div>

					{/* 3. 5대 수계 활성화 */}
					<div className="space-y-1.5 pt-3 border-t border-[#e2e8f0] dark:border-[#222228]">
						<div className="flex items-center justify-between px-0.5">
							<span className="text-[11px] font-mono uppercase tracking-wider text-[#64748b] dark:text-[#a1a1aa]">
								수계 표시 활성화
							</span>
							<button
								type="button"
								onClick={() => {
									const allOn = Object.values(filters.rivers).every(Boolean);
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
								className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
							>
								{Object.values(filters.rivers).every(Boolean)
									? "전체해제"
									: "전체선택"}
							</button>
						</div>

						<div className="grid grid-cols-5 gap-1.5">
							{(
								[
									"bukhan",
									"namhan",
									"han",
									"imjin",
									"pyeongtaek",
								] as const
							).map((rv) => {
								const conf = RIVER_CONFIG[rv];
								const isActive = filters.rivers[rv];
								return (
									<button
										key={rv}
										type="button"
										onClick={() => {
											setFilters({
												...filters,
												rivers: {
													...filters.rivers,
													[rv]: !isActive,
												},
											});
										}}
										style={{
											backgroundColor: isActive ? conf.color : undefined,
										}}
										className={`py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border ${
											isActive
												? "text-white border-transparent shadow-sm"
												: "bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/5 text-[#0f172a] dark:text-[#a1a1aa] border-[#e2e8f0] dark:border-[#222228]"
										}`}
									>
										<span
											className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : "bg-[#94a3b8] dark:bg-[#52525b]"}`}
										/>
										<span className="text-[10.5px] font-bold tracking-tight truncate w-full px-0.5 text-center">
											{conf.label.replace("수계", "").replace("본류", "")}
										</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* 4. 수계 흐름 강조 */}
					<div className="space-y-1.5 pt-3 border-t border-[#e2e8f0] dark:border-[#222228]">
						<div className="flex items-center justify-between px-0.5">
							<span className="text-[11px] font-mono uppercase tracking-wider text-[#64748b] dark:text-[#a1a1aa]">
								수계 흐름 강조 (굵기·채도 극대화)
							</span>
							{filters.highlightedRiver && (
								<button
									type="button"
									onClick={() =>
										setFilters({ ...filters, highlightedRiver: null })
									}
									className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
								>
									강조 해제
								</button>
							)}
						</div>

						<div className="grid grid-cols-5 gap-1">
							{(
								[
									"bukhan",
									"namhan",
									"han",
									"imjin",
									"pyeongtaek",
								] as const
							).map((rv) => {
								const conf = RIVER_CONFIG[rv];
								const isHigh = filters.highlightedRiver === rv;
								return (
									<button
										key={`high-${rv}`}
										type="button"
										onClick={() => {
											setFilters({
												...filters,
												highlightedRiver: isHigh ? null : rv,
											});
										}}
										style={{
											borderColor: isHigh ? conf.color : undefined,
											backgroundColor: isHigh
												? `${conf.color}25`
												: undefined,
											color: isHigh ? conf.color : undefined,
										}}
										className={`py-1.5 rounded-xl text-[10px] font-bold transition-all active:scale-95 border ${
											isHigh
												? "shadow-sm ring-1 ring-offset-0"
												: "bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/5 text-[#0f172a] dark:text-[#a1a1aa] border-[#e2e8f0] dark:border-[#222228]"
										}`}
									>
										{conf.label.replace("수계", "").replace("본류", "")}
									</button>
								);
							})}
						</div>
					</div>
				</div>
			</Modal>

			{/* ============================================================ */}
			{/* 6. 에디터 하단 선택 노드 각도/삭제 조절 패널                 */}
			{/* ============================================================ */}
			{isEditMode && editingStation && (
				<div className="absolute bottom-[calc(env(safe-area-inset-bottom)+70px)] inset-x-3.5 z-[1600] animate-in slide-in-from-bottom-5 duration-300 max-w-md mx-auto pointer-events-auto">
					<div className="p-4 flex flex-col gap-3.5 border border-[#222228] rounded-2xl bg-[#111115] shadow-2xl w-full">
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
								{(editingStation.type === "arrow" ||
									editingStation.type === "poi") && (
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

						{/* 각도 조절 슬라이더 (15도 단위) */}
						{(editingStation.type === "arrow" ||
							editingStation.type === "station" ||
							editingStation.type === "small") && (
							<div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl space-y-2 border border-slate-100 dark:border-white/5">
								<div className="flex justify-between items-center">
									<span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
										회전 각도: {editingStation.angle || 0}°
									</span>
									<div className="flex items-center gap-1">
										<button
											onClick={() => {
												const current = editingStation.angle || 0;
												const next = (current - 15 + 360) % 360;
												setEditingStation({ ...editingStation, angle: next });
												updateAngle(editingStation, next);
											}}
											className="px-1.5 py-0.5 rounded-md text-[10px] font-bold border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 active:scale-95"
											title="-15도 회전"
										>
											-15°
										</button>
										<button
											onClick={() => {
												const current = editingStation.angle || 0;
												const next = (current + 15) % 360;
												setEditingStation({ ...editingStation, angle: next });
												updateAngle(editingStation, next);
											}}
											className="px-1.5 py-0.5 rounded-md text-[10px] font-bold border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 active:scale-95"
											title="+15도 회전"
										>
											+15°
										</button>
										<div className="w-px h-3 bg-slate-200 dark:bg-white/10 mx-0.5" />
										{[0, 90, 180, 270].map((deg) => (
											<button
												key={deg}
												onClick={() => {
													setEditingStation({ ...editingStation, angle: deg });
													updateAngle(editingStation, deg);
												}}
												className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
													(editingStation.angle || 0) === deg
														? "bg-indigo-600 text-white border-indigo-600"
														: "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10"
												}`}
											>
												{deg}°
											</button>
										))}
									</div>
								</div>
								<input
									type="range"
									min="0"
									max="360"
									step="15"
									value={editingStation.angle || 0}
									onChange={(e) => {
										const angle = parseInt(e.target.value, 10);
										setEditingStation({ ...editingStation, angle });
									}}
									onMouseUp={() =>
										updateAngle(editingStation, editingStation.angle || 0)
									}
									onTouchEnd={() =>
										updateAngle(editingStation, editingStation.angle || 0)
									}
									className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
								/>
							</div>
						)}
					</div>
				</div>
			)}

			{/* ============================================================ */}
			{/* 7. 측정소 사이드바 (필터 & 수계별 목록)                       */}
			{/* ============================================================ */}
			<MapSidebar
				isOpen={isSidebarOpen}
				onClose={() => setIsSidebarOpen(false)}
				onSelectStation={moveToStation}
				stations={stations}
				filters={filters}
				setFilters={setFilters}
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				searchResults={searchResults}
			/>

			{/* ============================================================ */}
			{/* 8. 모바일 인터랙티브 바텀 시트 (선택 시 슬라이드 업)         */}
			{/* ============================================================ */}
			{!isEditMode && !isUiHidden && selectedStation && (
				<StationBottomSheet
					station={selectedStation}
					onClose={() => setSelectedStation(null)}
				/>
			)}
		</div>
	);
}
