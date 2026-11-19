"use client";

import {
	Building2,
	ChevronLeft,
	ChevronRight,
	Eye,
	List,
	MapPin,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import {
	RIVER_CONFIG,
	RIVER_ICONS,
	type Station,
} from "../stationData";
import {
	NATIONAL_STATION_ORDER_NAMES,
	SMALL_STATION_ORDER_NAMES,
} from "../stations/stationOrder";

export interface StationListModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectStation: (station: Station) => void;
	stations: Station[];
	searchTerm?: string;
	searchResults?: Station[];
}

type ListCategoryId =
	| "bukhan"
	| "namhan_wonju"
	| "namhan_han"
	| "imjin"
	| "pyeongtaek";

interface CategoryInfo {
	id: ListCategoryId;
	label: string;
	color: string;
}

const WONJU_SMALL_NAMES = [
	"대가리천",
	"장평천",
	"구안천",
	"동진천",
	"요도천",
	"원곡천",
	"영덕천",
	"앙성천",
	"전천",
	"원주천",
];

const isWonjuNamhan = (s: Station) => {
	if (s.river !== "namhan" && s.river !== "han") return false;
	if (s.type === "small") {
		return WONJU_SMALL_NAMES.some((n) => s.name.includes(n));
	}
	return s.office === "원주지방환경청";
};

const CATEGORIES: CategoryInfo[] = [
	{ id: "bukhan", label: "북한강", color: RIVER_CONFIG.bukhan.color },
	{ id: "namhan_wonju", label: "남한강(원주)", color: RIVER_CONFIG.namhan.color },
	{ id: "namhan_han", label: "남한강·본류", color: RIVER_CONFIG.han.color },
	{ id: "imjin", label: "임진강", color: RIVER_CONFIG.imjin.color },
	{ id: "pyeongtaek", label: "평택호", color: RIVER_CONFIG.pyeongtaek.color },
];

/**
 * 하단 검색바 위에 플로팅으로 열리는 일체형 측정소 목록/검색 모달
 */
export function StationListModal({
	isOpen,
	onClose,
	onSelectStation,
	stations,
	searchTerm = "",
	searchResults = [],
}: StationListModalProps) {
	const [activeCatIndex, setActiveCatIndex] = useState<number>(0);

	const getOrderIndex = (name: string, orderList: string[]) => {
		const short = name.replace(/\s*(수질자동)?(측정소|감시망)$/g, "").trim();
		const idx = orderList.findIndex(
			(target) => short === target || short.startsWith(target),
		);
		return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
	};

	const allTargetStations = useMemo(() => {
		return stations
			.filter((s) => s.type === "station" || s.type === "small")
			.sort((a, b) => {
				const orderA = getOrderIndex(
					a.name,
					a.type === "station"
						? NATIONAL_STATION_ORDER_NAMES
						: SMALL_STATION_ORDER_NAMES,
				);
				const orderB = getOrderIndex(
					b.name,
					b.type === "station"
						? NATIONAL_STATION_ORDER_NAMES
						: SMALL_STATION_ORDER_NAMES,
				);
				if (orderA !== orderB) return orderA - orderB;
				return a.name.localeCompare(b.name, "ko");
			});
	}, [stations]);

	const activeCategory = CATEGORIES[activeCatIndex];
	const prevCategory =
		CATEGORIES[(activeCatIndex - 1 + CATEGORIES.length) % CATEGORIES.length];
	const nextCategory =
		CATEGORIES[(activeCatIndex + 1) % CATEGORIES.length];

	const matchesCategory = (s: Station, catId?: ListCategoryId) => {
		if (!catId) return false;
		if (catId === "namhan_wonju") return isWonjuNamhan(s);
		if (catId === "namhan_han")
			return (s.river === "namhan" || s.river === "han") && !isWonjuNamhan(s);
		return s.river === catId;
	};

	const nationalStations = useMemo(() => {
		return allTargetStations.filter(
			(s) => s.type === "station" && matchesCategory(s, activeCategory?.id),
		);
	}, [allTargetStations, activeCategory?.id]);

	const smallStations = useMemo(() => {
		return allTargetStations.filter(
			(s) => s.type === "small" && matchesCategory(s, activeCategory?.id),
		);
	}, [allTargetStations, activeCategory?.id]);

	const isSearching = searchTerm.trim().length > 0;
	const formatShortName = (name: string) =>
		name.replace(/\s*(수질자동)?(측정소|감시망)$/g, "").trim() || name;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={isSearching ? "측정소 검색" : "측정소 목록"}
			subtitle={
				isSearching
					? `${searchResults.length}개소`
					: activeCategory?.label
			}
			icon={List}
			size="half"
			headerAction={
				!isSearching && (
					<div className="flex items-center gap-1.5 text-[10px] font-semibold tabular-nums">
						<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[#64748b] dark:text-[#a1a1aa]">
							<span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
							<span>국가 {nationalStations.length}</span>
						</span>
						<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[#64748b] dark:text-[#a1a1aa]">
							<span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
							<span>소규모 {smallStations.length}</span>
						</span>
					</div>
				)
			}
			contentClassName="!p-0 overflow-hidden"
		>
			{/* 본문 영역 */}
			{isSearching ? (
						/* 검색 결과 목록 */
						<div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#09090b]">
							<div className="flex-1 overflow-y-auto overscroll-contain p-2 space-y-1">
								{searchResults.length === 0 ? (
									<div className="py-16 text-center text-xs text-[#64748b] dark:text-[#71717a]">
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
												className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-[#111115] hover:bg-[#f1f5f9] dark:hover:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/40 flex items-center gap-2.5 text-left transition-all active:scale-[0.99] group shadow-xs"
											>
												<div
													className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
													style={{ backgroundColor: riverConf.color }}
												>
													<Icon size={12} strokeWidth={2.5} />
												</div>

												<div className="flex-1 min-w-0 flex items-center justify-between gap-2">
													<span className="text-xs font-bold text-[#0f172a] dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
														{station.name}
													</span>
													<div className="text-[10px] text-[#64748b] dark:text-[#a1a1aa] flex items-center gap-1 shrink-0">
														<span
															className={
																isNational
																	? "text-blue-600 dark:text-blue-400 font-bold"
																	: "text-cyan-600 dark:text-cyan-400 font-bold"
															}
														>
															{isNational ? "국가망" : "소규모"}
														</span>
														<span>·</span>
														<span>{riverConf.label}</span>
													</div>
												</div>

												<Eye
													size={13}
													className="text-[#94a3b8] dark:text-[#52525b] group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 transition-colors"
												/>
											</button>
										);
									})
								)}
							</div>
						</div>
					) : (
						/* 수계별 탐색 뷰 (2열 독립 스크롤 + 하단 수계 전환바) */
						<div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#09090b]">
							{/* 2열 독립 분할 스크롤 영역 (국가망 | 소규모) */}
							<div className="flex-1 grid grid-cols-2 divide-x divide-[#e2e8f0] dark:divide-[#222228] min-h-0">
								{/* 좌측: 국가 측정망 */}
								<div className="flex flex-col min-h-0">
									<div className="flex-1 overflow-y-auto overscroll-contain p-1.5">
										{nationalStations.length === 0 ? (
											<div className="py-12 text-center text-[11px] text-[#64748b] dark:text-[#71717a]">
												해당 없음
											</div>
										) : (
											<div className="grid grid-cols-2 gap-x-1.5 gap-y-2.5">
												{nationalStations.map((station, idx) => (
													<button
														key={station.id || `nat-${station.name}-${idx}`}
														type="button"
														onClick={() => {
															onSelectStation(station);
															onClose();
														}}
														className="h-12 px-1.5 rounded-xl bg-[#f8fafc] dark:bg-[#111115] hover:bg-[#f1f5f9] dark:hover:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/40 flex flex-col items-center justify-center gap-1 text-center transition-all active:scale-95 group"
													>
														<Building2
															size={13}
															strokeWidth={2.3}
															className="text-blue-500/80 dark:text-blue-400/80 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 transition-colors"
														/>
														<span className="text-[11px] font-bold text-[#0f172a] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-none truncate max-w-full">
															{formatShortName(station.name)}
														</span>
													</button>
												))}
											</div>
										)}
									</div>
								</div>

								{/* 우측: 소규모 감시망 */}
								<div className="flex flex-col min-h-0">
									<div className="flex-1 overflow-y-auto overscroll-contain p-1.5">
										{smallStations.length === 0 ? (
											<div className="py-12 text-center text-[11px] text-[#64748b] dark:text-[#71717a]">
												해당 없음
											</div>
										) : (
											<div className="grid grid-cols-2 gap-x-1.5 gap-y-2.5">
												{smallStations.map((station, idx) => (
													<button
														key={station.id || `sml-${station.name}-${idx}`}
														type="button"
														onClick={() => {
															onSelectStation(station);
															onClose();
														}}
														className="h-12 px-1.5 rounded-xl bg-[#f8fafc] dark:bg-[#111115] hover:bg-[#f1f5f9] dark:hover:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-cyan-500/40 flex flex-col items-center justify-center gap-1 text-center transition-all active:scale-95 group"
													>
														<MapPin
															size={13}
															strokeWidth={2.3}
															className="text-cyan-500/80 dark:text-cyan-400/80 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 shrink-0 transition-colors"
														/>
														<span className="text-[11px] font-bold text-[#0f172a] dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-none truncate max-w-full">
															{formatShortName(station.name)}
														</span>
													</button>
												))}
											</div>
										)}
									</div>
								</div>
							</div>

							{/* 하단 수계 전환 퀵 내비게이터 바 (원형 순환 Infinite Loop) */}
							<div className="grid grid-cols-3 items-center bg-[#f8fafc] dark:bg-[#16161c] border-t border-[#e2e8f0] dark:border-[#222228] text-xs font-semibold select-none shrink-0 h-9">
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
										<span className="truncate">{activeCategory?.label}</span>
										<span className="text-[10px] tabular-nums text-[#64748b] dark:text-[#71717a] shrink-0">
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
						</div>
					)}
		</Modal>
	);
}
