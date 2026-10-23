"use client";

import { Database, Folder, FolderOpen, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { getChosung } from "@/utils/hangul";
import {
	getStationColor,
	groupStationsByRiver,
	RIVER_CONFIG,
	type RiverType,
	type Station,
	type StationType,
} from "../../stationData";

interface StationSidebarProps {
	stations: Station[];
	selectedId?: string | undefined;
	onSelect: (id: string) => void;
	onClose?: () => void;
}

const TYPE_PRIORITY: Record<StationType, number> = {
	station: 1,
	small: 2,
	arrow: 3,
	poi: 99,
};

export const StationSidebar = ({
	stations,
	selectedId,
	onSelect,
	onClose,
}: StationSidebarProps) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedRivers, setExpandedRivers] = useState<Set<RiverType>>(
		new Set(["han", "bukhan", "namhan", "imjin", "pyeongtaek"]),
	);

	const toggleRiver = (river: RiverType) => {
		const next = new Set(expandedRivers);
		if (next.has(river)) next.delete(river);
		else next.add(river);
		setExpandedRivers(next);
	};

	const filteredStations = useMemo(() => {
		const query = searchQuery.toLowerCase().trim();
		if (!query) return stations;

		return stations.filter(
			(s) =>
				s.name.toLowerCase().includes(query) ||
				getChosung(s.name).includes(query),
		);
	}, [stations, searchQuery]);

	const groupedByRiver = useMemo(() => {
		return groupStationsByRiver(filteredStations);
	}, [filteredStations]);

	return (
		<div className="flex flex-col h-full bg-white dark:bg-slate-950 font-sans">
			{/* Search Input Area */}
			<div className="px-3 py-4 space-y-4">
				<div className="flex items-center gap-2">
					<div className="relative group flex-1">
						<Search
							size={14}
							className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
						/>
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="측정소 검색 (초성)"
							className="w-full h-10 pl-10 pr-9 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 focus:border-indigo-500/30 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:font-normal placeholder:text-slate-400/50 text-slate-900 dark:text-white"
						/>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery("")}
								className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
							>
								<X size={12} />
							</button>
						)}
					</div>
					{onClose && (
						<button
							onClick={onClose}
							className="md:hidden w-10 h-10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 transition-all active:scale-95 border border-slate-200 dark:border-white/10 shadow-sm"
							title="목록 닫기"
						>
							<X size={16} strokeWidth={2.5} />
						</button>
					)}
				</div>

				<div className="px-1 flex items-center justify-between pointer-events-none opacity-60">
					<h2 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
						<Database size={10} strokeWidth={2.5} /> Data Registry
					</h2>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar pb-24">
				{(
					["bukhan", "namhan", "han", "imjin", "pyeongtaek"] as RiverType[]
				).map((river) => {
					const rawStations = groupedByRiver[river];
					if (rawStations.length === 0) return null;

					// ... [Same logic for sorting parents and POIs]
					const parents = rawStations.filter(
						(s) => s.type === "station" || s.type === "small",
					);
					parents.sort((a, b) => {
						const pA = TYPE_PRIORITY[a.type] || 99;
						const pB = TYPE_PRIORITY[b.type] || 99;
						if (pA !== pB) return pA - pB;
						return a.name.localeCompare(b.name, "ko");
					});
					const renderList = parents.map((p) => ({
						station: p,
						isPoiChild: false,
					}));

					const config = RIVER_CONFIG[river];
					const isExpanded = expandedRivers.has(river);

					return (
						<div key={river} className="mb-1 group/river">
							<button
								onClick={() => toggleRiver(river)}
								className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border active:scale-[0.98] shadow-sm ${
									isExpanded
										? "bg-white dark:bg-white/[0.05] text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-white/10"
										: "bg-slate-50 dark:bg-white/[0.02] text-slate-400 dark:text-slate-500 border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5"
								}`}
							>
								<div className="flex items-center gap-2">
									{isExpanded ? (
										<FolderOpen size={14} strokeWidth={2.5} />
									) : (
										<Folder size={14} strokeWidth={2.5} />
									)}
									<span>{config.label}</span>
								</div>
								<span
									className={`ml-auto px-1.5 py-0.5 rounded-lg text-[9px] font-black tabular-nums border ${
										isExpanded
											? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600"
											: "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400"
									}`}
								>
									{rawStations.length}
								</span>
							</button>

							{isExpanded && (
								<div className="mt-1 ml-4 border-l-2 border-slate-100 dark:border-white/5 pl-1.5 space-y-1 animate-in fade-in slide-in-from-left-1 duration-300">
									{renderList.map(({ station, isPoiChild }) => (
										<button
											key={station.id || station.name}
											onClick={() => {
												onSelect(station.id!);
												onClose?.();
											}}
											className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2.5 group/item ${
												selectedId === station.id
													? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
													: "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-white"
											}`}
										>
											{isPoiChild && (
												<div className="w-3.5 h-3.5 border-l-2 border-b-2 border-slate-100 dark:border-white/10 rounded-bl shrink-0 -mt-2 ml-1" />
											)}
											<div
												className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm"
												style={{ backgroundColor: getStationColor(station) }}
											/>
											<span className="truncate font-bold tracking-tight">
												{station.name}
											</span>
											{station.type === "station" && (
												<span
													className={`ml-auto text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter shrink-0 ${selectedId === station.id ? "bg-white/20 text-white" : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-500/10"}`}
												>
													국가
												</span>
											)}
											{station.type === "small" && (
												<span
													className={`ml-auto text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter shrink-0 ${selectedId === station.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10"}`}
												>
													소규모
												</span>
											)}
											{station.type === "arrow" && (
												<span
													className={`ml-auto text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter shrink-0 ${selectedId === station.id ? "bg-white/20 text-white" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/10"}`}
												>
													방향
												</span>
											)}
										</button>
									))}
								</div>
							)}
						</div>
					);
				})}

				{filteredStations.length === 0 && (
					<div className="text-center py-20 px-4">
						<div className="w-16 h-16 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
							<Search
								size={24}
								className="text-slate-300 dark:text-slate-600"
							/>
						</div>
						<p className="text-[11px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">
							NO DATA FOUND
						</p>
					</div>
				)}
			</div>
		</div>
	);
};
