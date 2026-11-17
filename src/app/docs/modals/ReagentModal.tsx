"use client";

import { Check, Copy, FlaskConical, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { matchChosung } from "@/utils/hangul";
import { STATIONS, type StationData } from "./reagent/data";
import {
	CATEGORY_CONFIG,
	getReagentsForStation,
	groupAllReagents,
} from "./reagent/utils";

interface ReagentModalProps {
	isOpen: boolean;
	onClose: () => void;
	sharedSearchQuery?: string;
}

export default function ReagentModal({
	isOpen,
	onClose,
	sharedSearchQuery = "",
}: ReagentModalProps) {
	const [activeTab, setActiveTab] = useState<"stations" | "all">("stations");
	const [localSearchTerm, setLocalSearchTerm] = useState("");
	const [selectedStation, setSelectedStation] = useState<StationData | null>(
		null,
	);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const searchTerm = sharedSearchQuery || localSearchTerm;

	const handleCopyRecipe = (recipe: string, id: string) => {
		navigator.clipboard.writeText(recipe);
		setCopiedId(id);
		setTimeout(() => setCopiedId(null), 1500);
	};

	const filteredStations = useMemo(() => {
		if (!searchTerm.trim()) return STATIONS;
		const q = searchTerm.trim();
		return STATIONS.filter((s) => matchChosung(s.name, q));
	}, [searchTerm]);

	const allGroupedReagents = useMemo(() => {
		const groups = groupAllReagents();
		if (!searchTerm.trim()) return groups;
		const q = searchTerm.trim();

		return groups
			.map((g) => ({
				...g,
				items: g.items.filter(
					(r) =>
						matchChosung(r.name, q) ||
						matchChosung(r.category, q) ||
						(r.manufacturer && matchChosung(r.manufacturer, q)) ||
						r.steps.some((step) => matchChosung(step, q)),
				),
			}))
			.filter((g) => g.items.length > 0);
	}, [searchTerm]);

	const stationReagents = useMemo(() => {
		if (!selectedStation) return [];
		return getReagentsForStation(selectedStation);
	}, [selectedStation]);

	return (
		<Modal
			isOpen={isOpen}
			onClose={() => {
				setSelectedStation(null);
				setLocalSearchTerm("");
				onClose();
			}}
			title={selectedStation ? selectedStation.name : "시약"}
			subtitle={selectedStation ? "조제법" : undefined}
			icon={FlaskConical}
			size="half"
			onBack={selectedStation ? () => setSelectedStation(null) : undefined}
			headerAction={
				!selectedStation ? (
					<div className="flex items-center p-0.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px] font-bold">
						<button
							type="button"
							onClick={() => setActiveTab("stations")}
							className={`px-2 py-0.5 rounded-md transition-colors ${
								activeTab === "stations"
									? "bg-white dark:bg-[#16161c] text-[#0f172a] dark:text-white shadow-2xs"
									: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
							}`}
						>
							측정소 ({STATIONS.length})
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("all")}
							className={`px-2 py-0.5 rounded-md transition-colors ${
								activeTab === "all"
									? "bg-white dark:bg-[#16161c] text-[#0f172a] dark:text-white shadow-2xs"
									: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
							}`}
						>
							전체 조제법
						</button>
					</div>
				) : (
					<span className="text-[10px] font-semibold tabular-nums text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
						{stationReagents.reduce((acc, g) => acc + g.reagents.length, 0)}종 시약
					</span>
				)
			}
		>
			<div className="space-y-2">
				{selectedStation ? (
					/* 측정소 상세 시약 목록 */
					<div className="space-y-2">
						{/* 장비 정보 인라인 요약 바 */}
						<div className="px-2 py-1.5 rounded-lg bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
							<span className="inline-flex items-center gap-1">
								<span className="text-[#64748b] dark:text-[#a1a1aa]">TOC</span>
								<b className="text-[#0f172a] dark:text-white">{selectedStation.toc?.equipment || "-"}</b>
							</span>
							<span className="inline-flex items-center gap-1">
								<span className="text-[#64748b] dark:text-[#a1a1aa]">TN</span>
								<b className="text-[#0f172a] dark:text-white">{selectedStation.tn?.equipment || "-"}</b>
							</span>
							<span className="inline-flex items-center gap-1">
								<span className="text-[#64748b] dark:text-[#a1a1aa]">TP</span>
								<b className="text-[#0f172a] dark:text-white">{selectedStation.tp?.equipment || "-"}</b>
							</span>
							<span className="inline-flex items-center gap-1">
								<span className="text-[#64748b] dark:text-[#a1a1aa]">생물</span>
								<b className="text-[#0f172a] dark:text-white">
									{selectedStation.bio ? Object.keys(selectedStation.bio).join(", ") : "없음"}
								</b>
							</span>
						</div>

						{/* 시약 목록 */}
						<div className="space-y-2">
							{stationReagents.map((group) => {
								const config = CATEGORY_CONFIG[group.category] ??
									CATEGORY_CONFIG.TOC ?? {
										badgeBg: "bg-blue-500/10",
										badgeText: "text-blue-600 dark:text-blue-400",
										badgeBorder: "border-blue-500/20",
									};
								return (
									<div key={group.category} className="space-y-1">
										<div className="flex items-center gap-1.5 px-0.5">
											<span className="text-xs font-bold text-[#0f172a] dark:text-white">
												{group.category}
											</span>
											<span className="text-[10px] tabular-nums text-blue-600 dark:text-blue-400">
												({group.reagents.length})
											</span>
										</div>

										<div className="space-y-1">
											{group.reagents.map((r) => (
												<div
													key={`${group.category}-${r.name}`}
													className="p-2 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] space-y-1"
												>
													<div className="flex items-center justify-between gap-2">
														<div className="flex items-center gap-1.5 min-w-0">
															<span
																className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${config.badgeBg} ${config.badgeText} border ${config.badgeBorder}`}
															>
																{r.category}
															</span>
															<h4 className="text-xs font-bold text-[#0f172a] dark:text-white truncate">
																{r.name}
															</h4>
														</div>
														<span className="text-[10px] text-[#64748b] dark:text-[#a1a1aa] shrink-0">
															{r.usage}
														</span>
													</div>

													<div className="space-y-0.5 bg-white dark:bg-[#09090b] p-1.5 rounded-lg border border-[#e2e8f0] dark:border-[#222228] text-xs">
														{r.steps.map((step) => (
															<div
																key={step}
																className="flex items-start justify-between gap-2 text-[#334155] dark:text-[#d4d4d8]"
															>
																<span className="break-keep">{step}</span>
																<button
																	type="button"
																	onClick={() =>
																		handleCopyRecipe(step, `${r.name}-${step}`)
																	}
																	className="text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white shrink-0 p-0.5"
																	title="복사"
																>
																	{copiedId === `${r.name}-${step}` ? (
																		<Check
																			size={12}
																			className="text-emerald-500 dark:text-emerald-400"
																		/>
																	) : (
																		<Copy size={12} />
																	)}
																</button>
															</div>
														))}
													</div>
												</div>
											))}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				) : (
					/* 메인: 측정소별 or 전체 시약 */
					<div className="space-y-2">
						{activeTab === "stations" ? (
							<div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
								{filteredStations.map((station) => (
									<button
										key={station.name}
										type="button"
										onClick={() => setSelectedStation(station)}
										className="px-2 py-2 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/40 text-left transition-colors flex items-center justify-between"
									>
										<div className="flex items-center gap-1.5 min-w-0">
											<MapPin size={11} className="text-blue-600 dark:text-blue-400 shrink-0" />
											<span className="text-xs font-bold text-[#0f172a] dark:text-white truncate break-keep">
												{station.name}
											</span>
										</div>
									</button>
								))}
							</div>
						) : (
							<div className="space-y-2.5">
								{allGroupedReagents.length === 0 ? (
									<div className="py-12 text-center text-xs text-[#64748b] dark:text-[#a1a1aa]">
										일치하는 시약 조제법이 없습니다.
									</div>
								) : (
									allGroupedReagents.map((group) => (
										<div key={group.category} className="space-y-1">
											<h4 className="text-xs font-bold text-[#0f172a] dark:text-white px-0.5">
												{group.category} ({group.items.length})
											</h4>
											<div className="space-y-1">
												{group.items.map((r) => (
													<div
														key={`${group.category}-${r.name}-${r.manufacturer}`}
														className="p-2 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] space-y-1"
													>
														<div className="flex items-center justify-between gap-2">
															<span className="text-xs font-bold text-[#0f172a] dark:text-white">
																{r.name}
															</span>
															<span className="text-[10px] text-[#64748b] dark:text-[#a1a1aa]">
																{r.manufacturer}
															</span>
														</div>
														<div className="bg-white dark:bg-[#09090b] p-1.5 rounded-lg text-xs text-[#334155] dark:text-[#d4d4d8] space-y-0.5 border border-[#e2e8f0] dark:border-[#222228]">
															{r.steps.map((s) => (
																<p key={s}>{s}</p>
															))}
														</div>
													</div>
												))}
											</div>
										</div>
									))
								)}
							</div>
						)}
					</div>
				)}
			</div>
		</Modal>
	);
}
