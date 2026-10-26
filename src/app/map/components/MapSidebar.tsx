"use client";

import {
	Building2,
	ChevronLeft,
	ChevronRight,
	Eye,
	List,
	X,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { motion, useDragControls } from "framer-motion";
import {
	type MapFilters,
	RIVER_CONFIG,
	RIVER_ICONS,
	type RiverType,
	type Station,
} from "../stationData";

export interface MapSidebarProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectStation: (station: Station) => void;
	stations: Station[];
	filters?: MapFilters;
	setFilters?: React.Dispatch<React.SetStateAction<MapFilters>>;
	searchTerm?: string;
	setSearchTerm?: (term: string) => void;
	searchResults?: Station[];
	keyboardOffset?: number;
	visibleHeight?: number | null;
}

interface CategoryInfo {
	id: RiverType;
	label: string;
	color: string;
}

const CATEGORIES: CategoryInfo[] = [
	{ id: "bukhan", label: "북한강", color: RIVER_CONFIG.bukhan.color },
	{ id: "namhan", label: "남한강", color: RIVER_CONFIG.namhan.color },
	{ id: "han", label: "한강본류", color: RIVER_CONFIG.han.color },
	{ id: "imjin", label: "임진강", color: RIVER_CONFIG.imjin.color },
	{ id: "pyeongtaek", label: "평택호", color: RIVER_CONFIG.pyeongtaek.color },
];

/**
 * 하단 검색바 위에 플로팅으로 열리는 일체형 측정소 목록/검색 패널
 */
export function MapSidebar({
	isOpen,
	onClose,
	onSelectStation,
	stations,
	searchTerm = "",
	searchResults = [],
	keyboardOffset = 0,
	visibleHeight = null,
}: MapSidebarProps) {
	const [activeCatIndex, setActiveCatIndex] = useState<number>(0);

	const allTargetStations = useMemo(() => {
		return stations
			.filter((s) => s.type === "station" || s.type === "small")
			.sort((a, b) => a.name.localeCompare(b.name, "ko"));
	}, [stations]);

	const activeCategory = CATEGORIES[activeCatIndex];
	const prevCategory =
		CATEGORIES[(activeCatIndex - 1 + CATEGORIES.length) % CATEGORIES.length];
	const nextCategory =
		CATEGORIES[(activeCatIndex + 1) % CATEGORIES.length];

	const nationalStations = useMemo(() => {
		return allTargetStations.filter(
			(s) => s.river === activeCategory?.id && s.type === "station",
		);
	}, [allTargetStations, activeCategory?.id]);

	const smallStations = useMemo(() => {
		return allTargetStations.filter(
			(s) => s.river === activeCategory?.id && s.type === "small",
		);
	}, [allTargetStations, activeCategory?.id]);

	const isSearching = searchTerm.trim().length > 0;
	const dragControls = useDragControls();

	if (!isOpen) return null;

	// 가상 키보드가 올라왔을 때 남은 가용 높이에 맞춰 모달 최대 높이를 동적으로 계산
	// 하단바 영역(약 66px)과 상단 안전 여백(14px)을 제외한 높이
	const dynamicHeight =
		keyboardOffset > 0 && visibleHeight
			? `${Math.max(200, visibleHeight - 80)}px`
			: undefined;

	return (
		<>
			{/* 배경 클릭 시 닫히는 투명 딤 레이어 (하단바는 z-[1100]이므로 클릭 가능 유지) */}
			<div
				className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-[2px] transition-opacity pointer-events-auto touch-none overscroll-none"
				onClick={onClose}
				onTouchMove={(e) => e.preventDefault()}
				aria-hidden="true"
			/>

			{/* 하단바 바로 윗공간에 안착하는 플로팅 측정소 목록 패널 */}
			<div
				style={{
					bottom:
						keyboardOffset > 0 ? `${keyboardOffset + 66}px` : undefined,
				}}
				className="fixed bottom-[calc(env(safe-area-inset-bottom)+70px)] inset-x-3.5 z-[1050] pointer-events-none flex flex-col items-center transition-[bottom] duration-150 ease-out"
			>
				<motion.div
					drag="y"
					dragControls={dragControls}
					dragListener={false}
					dragConstraints={{ top: 0 }}
					dragElastic={{ top: 0, bottom: 0.5 }}
					onDragEnd={(_e, info) => {
						if (info.offset.y > 70 || info.velocity.y > 350) {
							onClose();
						}
					}}
					initial={{ y: 60, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 60, opacity: 0 }}
					transition={{ type: "spring", damping: 28, stiffness: 320 }}
					style={{
						height: dynamicHeight,
						maxHeight: dynamicHeight,
					}}
					className="pointer-events-auto w-full max-w-md h-[80dvh] max-h-[80dvh] rounded-3xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] text-[#0f172a] dark:text-[#f4f4f5] flex flex-col overflow-hidden overscroll-contain transition-[height,max-height,background-color,border-color] duration-150 ease-out"
				>
					{/* 모바일 상단 드래그 핸들 (터치로 쓸어내려 닫기) */}
					<div
						onPointerDown={(e) => dragControls.start(e)}
						onClick={onClose}
						className="w-full pt-3 pb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing sm:hidden select-none"
						aria-hidden="true"
					>
						<div className="w-10 h-1.5 rounded-full bg-black/20 dark:bg-white/20 hover:bg-black/30 dark:hover:bg-white/30 transition-colors" />
					</div>

					{/* 패널 헤더 */}
					<div
						onPointerDown={(e) => {
							if ((e.target as HTMLElement).closest("button")) return;
							dragControls.start(e);
						}}
						className="px-4 py-3 border-b border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#16161c] flex items-center justify-between shrink-0 select-none"
					>
						<div className="flex items-center gap-2">
							<div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
								<List size={14} strokeWidth={2.4} />
							</div>
							<div>
								<h3 className="text-xs font-bold text-[#0f172a] dark:text-white tracking-tight">
									{isSearching ? "측정소 검색 결과" : "측정소 위치 바로가기"}
								</h3>
								<p className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa]">
									{isSearching
										? `검색어: "${searchTerm}" (${searchResults.length}개소)`
										: "수계별 측정망 2열 목록"}
								</p>
							</div>
						</div>

						<button
							type="button"
							onClick={onClose}
							aria-label="닫기"
							className="w-7 h-7 rounded-lg bg-[#f1f5f9] dark:bg-[#111115] hover:bg-black/5 dark:hover:bg-white/10 border border-[#e2e8f0] dark:border-[#222228] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white flex items-center justify-center transition-all active:scale-95"
						>
							<X size={14} strokeWidth={2.5} />
						</button>
					</div>

					{/* 본문 영역 */}
					{isSearching ? (
						/* 검색 결과 목록 */
						<div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#09090b]">
							<div className="flex-1 overflow-y-auto overscroll-contain p-2.5 space-y-1.5">
								{searchResults.length === 0 ? (
									<div className="py-20 text-center text-xs text-[#64748b] dark:text-[#71717a] font-mono">
										'{searchTerm}' 일치하는 측정소가 없습니다.
									</div>
								) : (
									searchResults.map((station, idx) => {
										const riverConf = RIVER_CONFIG[station.river] || {
											label: "기타",
											color: "#2563eb",
										};
										const Icon = RIVER_ICONS[station.river] || Building2;
										const isNational = station.type === "station";

										return (
											<button
												key={station.id || `search-${station.name}-${idx}`}
												type="button"
												onClick={() => {
													onSelectStation(station);
													onClose();
												}}
												className="w-full px-3 py-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#111115] hover:bg-[#f1f5f9] dark:hover:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/40 flex items-center gap-2.5 text-left transition-all active:scale-[0.99] group shadow-xs"
											>
												<div
													className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
													style={{ backgroundColor: riverConf.color }}
												>
													<Icon size={13} strokeWidth={2.5} />
												</div>

												<div className="flex-1 min-w-0">
													<div className="text-xs font-bold text-[#0f172a] dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
														{station.name}
													</div>
													<div className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] flex items-center gap-1.5 mt-0.5">
														<span
															className={
																isNational
																	? "text-blue-600 dark:text-blue-400 font-bold"
																	: "text-cyan-600 dark:text-cyan-400 font-bold"
															}
														>
															{isNational ? "국가망" : "소규모"}
														</span>
														<span>•</span>
														<span>{riverConf.label}</span>
													</div>
												</div>

												<Eye
													size={14}
													className="text-[#94a3b8] dark:text-[#52525b] group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 transition-colors"
												/>
											</button>
										);
									})
								)}
							</div>
						</div>
					) : (
						/* 수계별 탐색 뷰 (2열 독립 스크롤) */
						<div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#09090b]">
							{/* 수계 전환 퀵 내비게이터 바 (원형 순환 Infinite Loop) */}
							<div className="grid grid-cols-3 items-center bg-[#f8fafc] dark:bg-[#16161c] border-b border-[#e2e8f0] dark:border-[#222228] text-xs font-mono select-none shrink-0 h-10">
								<button
									type="button"
									onClick={() =>
										setActiveCatIndex(
											(activeCatIndex - 1 + CATEGORIES.length) %
												CATEGORIES.length,
										)
									}
									className="h-full flex items-center justify-center gap-1 text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-colors px-2 border-r border-[#e2e8f0] dark:border-[#222228] active:scale-95 cursor-pointer"
								>
									<ChevronLeft size={15} strokeWidth={2.5} />
									<span className="truncate">
										{prevCategory?.label || "이전"}
									</span>
								</button>

								<div className="h-full flex items-center justify-center px-2 text-center border-r border-[#e2e8f0] dark:border-[#222228] font-bold text-[#0f172a] dark:text-white">
									<span
										className="truncate flex items-center gap-1"
										style={{ color: activeCategory?.color }}
									>
										<span>{activeCategory?.label}</span>
										<span className="text-[10px] font-mono text-[#64748b] dark:text-[#71717a]">
											({activeCatIndex + 1}/{CATEGORIES.length})
										</span>
									</span>
								</div>

								<button
									type="button"
									onClick={() =>
										setActiveCatIndex((activeCatIndex + 1) % CATEGORIES.length)
									}
									className="h-full flex items-center justify-center gap-1 text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-colors px-2 active:scale-95 cursor-pointer"
								>
									<span className="truncate">
										{nextCategory?.label || "다음"}
									</span>
									<ChevronRight size={15} strokeWidth={2.5} />
								</button>
							</div>

							{/* 2열 독립 분할 스크롤 영역 (국가망 | 소규모) */}
							<div className="flex-1 grid grid-cols-2 divide-x divide-[#e2e8f0] dark:divide-[#222228] min-h-0">
								{/* 좌측: 국가 측정망 */}
								<div className="flex flex-col min-h-0">
									<div className="px-3 py-1.5 bg-[#f8fafc] dark:bg-[#111115] border-b border-[#e2e8f0] dark:border-[#222228] flex items-center justify-between shrink-0">
										<div className="flex items-center gap-1.5">
											<span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
											<span className="text-[11px] font-bold text-[#0f172a] dark:text-white tracking-tight">
												국가망
											</span>
										</div>
										<span className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa]">
											{nationalStations.length}개소
										</span>
									</div>

									<div className="flex-1 overflow-y-auto overscroll-contain p-1.5 space-y-1">
										{nationalStations.length === 0 ? (
											<div className="py-12 text-center text-[11px] font-mono text-[#64748b] dark:text-[#71717a]">
												해당 없음
											</div>
										) : (
											nationalStations.map((station, idx) => (
												<button
													key={station.id || `nat-${station.name}-${idx}`}
													type="button"
													onClick={() => {
														onSelectStation(station);
														onClose();
													}}
													className="w-full px-2.5 py-2 rounded-lg bg-[#f8fafc] dark:bg-[#111115] hover:bg-[#f1f5f9] dark:hover:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/30 flex items-center justify-between text-left transition-all active:scale-[0.98] group"
												>
													<span className="text-xs font-semibold text-[#0f172a] dark:text-[#f4f4f5] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
														{station.name}
													</span>
													<Eye
														size={12}
														className="text-[#94a3b8] dark:text-[#52525b] group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 ml-1 transition-colors"
													/>
												</button>
											))
										)}
									</div>
								</div>

								{/* 우측: 소규모 감시망 */}
								<div className="flex flex-col min-h-0">
									<div className="px-3 py-1.5 bg-[#f8fafc] dark:bg-[#111115] border-b border-[#e2e8f0] dark:border-[#222228] flex items-center justify-between shrink-0">
										<div className="flex items-center gap-1.5">
											<span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
											<span className="text-[11px] font-bold text-[#0f172a] dark:text-white tracking-tight">
												소규모
											</span>
										</div>
										<span className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa]">
											{smallStations.length}개소
										</span>
									</div>

									<div className="flex-1 overflow-y-auto overscroll-contain p-1.5 space-y-1">
										{smallStations.length === 0 ? (
											<div className="py-12 text-center text-[11px] font-mono text-[#64748b] dark:text-[#71717a]">
												해당 없음
											</div>
										) : (
											smallStations.map((station, idx) => (
												<button
													key={station.id || `sml-${station.name}-${idx}`}
													type="button"
													onClick={() => {
														onSelectStation(station);
														onClose();
													}}
													className="w-full px-2.5 py-2 rounded-lg bg-[#f8fafc] dark:bg-[#111115] hover:bg-[#f1f5f9] dark:hover:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-cyan-500/30 flex items-center justify-between text-left transition-all active:scale-[0.98] group"
												>
													<span className="text-xs font-semibold text-[#0f172a] dark:text-[#f4f4f5] group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
														{station.name}
													</span>
													<Eye
														size={12}
														className="text-[#94a3b8] dark:text-[#52525b] group-hover:text-cyan-600 dark:group-hover:text-cyan-400 shrink-0 ml-1 transition-colors"
													/>
												</button>
											))
										)}
									</div>
								</div>
							</div>
						</div>
					)}
				</motion.div>
			</div>
		</>
	);
}
