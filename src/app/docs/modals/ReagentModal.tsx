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
			title={
				selectedStation ? `${selectedStation.name} 측정소 시약` : "시약 관리"
			}
			subtitle={
				selectedStation
					? "측정소별 장비 맞춤 조제법"
					: "수질자동측정망 시약 조제 매뉴얼"
			}
			icon={FlaskConical}
			onBack={selectedStation ? () => setSelectedStation(null) : undefined}
			sheetClassName="h-[45dvh] max-h-[45dvh] sm:h-auto sm:max-h-[85vh] rounded-3xl"
		>
			<div className="space-y-4">
				{selectedStation ? (
					/* 측정소 상세 시약 목록 */
					<div className="space-y-4">
						{/* 장비 정보 요약 카드 */}
						<div className="p-3.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
							<div>
								<span className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] block">
									TOC 장비
								</span>
								<span className="font-bold text-[#0f172a] dark:text-white truncate block">
									{selectedStation.toc?.equipment || "-"}
								</span>
							</div>
							<div>
								<span className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] block">
									TN 장비
								</span>
								<span className="font-bold text-[#0f172a] dark:text-white truncate block">
									{selectedStation.tn?.equipment || "-"}
								</span>
							</div>
							<div>
								<span className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] block">
									TP 장비
								</span>
								<span className="font-bold text-[#0f172a] dark:text-white truncate block">
									{selectedStation.tp?.equipment || "-"}
								</span>
							</div>
							<div>
								<span className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] block">
									생물감시
								</span>
								<span className="font-bold text-[#0f172a] dark:text-white truncate block">
									{selectedStation.bio
										? Object.keys(selectedStation.bio).join(", ")
										: "없음"}
								</span>
							</div>
						</div>

						{/* 시약 목록 */}
						<div className="space-y-3">
							{stationReagents.map((group) => {
								const config = CATEGORY_CONFIG[group.category] ??
									CATEGORY_CONFIG.TOC ?? {
										badgeBg: "bg-blue-500/10",
										badgeText: "text-blue-600 dark:text-blue-400",
										badgeBorder: "border-blue-500/20",
									};
								return (
									<div key={group.category} className="space-y-2">
										<div className="flex items-center gap-1.5 px-1">
											<span className="text-xs font-bold text-[#0f172a] dark:text-white">
												{group.category}
											</span>
											<span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">
												({group.reagents.length})
											</span>
										</div>

										<div className="space-y-2">
											{group.reagents.map((r) => (
												<div
													key={`${group.category}-${r.name}`}
													className="p-3.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] space-y-2"
												>
													<div className="flex items-center justify-between gap-2">
														<div className="flex items-center gap-2">
															<span
																className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${config.badgeBg} ${config.badgeText} border ${config.badgeBorder}`}
															>
																{r.category}
															</span>
															<h4 className="text-xs font-bold text-[#0f172a] dark:text-white">
																{r.name}
															</h4>
														</div>
														<span className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa]">
															{r.usage}
														</span>
													</div>

													<div className="space-y-1 bg-white dark:bg-[#09090b] p-2.5 rounded-lg border border-[#e2e8f0] dark:border-[#222228] text-xs font-mono">
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
					/* 메인 탭: 측정소별 or 전체 시약 */
					<div className="space-y-3.5">
						{/* 탭 버튼 */}
						<div className="grid grid-cols-2 gap-1.5 p-1 w-full rounded-xl bg-[#f8fafc] dark:bg-[#09090b] border border-[#e2e8f0] dark:border-[#222228]">
							<button
								type="button"
								onClick={() => setActiveTab("stations")}
								className={`w-full py-1.5 rounded-lg text-xs font-bold text-center transition-colors ${
									activeTab === "stations"
										? "bg-white dark:bg-[#16161c] text-[#0f172a] dark:text-white shadow-sm"
										: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
								}`}
							>
								측정소별 ({STATIONS.length})
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("all")}
								className={`w-full py-1.5 rounded-lg text-xs font-bold text-center transition-colors ${
									activeTab === "all"
										? "bg-white dark:bg-[#16161c] text-[#0f172a] dark:text-white shadow-sm"
										: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
								}`}
							>
								전체 시약 조제법
							</button>
						</div>

						{activeTab === "stations" ? (
							<div className="space-y-3">
								<div className="grid grid-cols-3 gap-2">
									{filteredStations.map((station) => (
										<button
											key={station.name}
											type="button"
											onClick={() => setSelectedStation(station)}
											className="px-2.5 py-2.5 sm:p-3 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/40 text-left transition-colors flex items-center justify-between"
										>
											<div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
												<MapPin size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
												<span className="text-xs font-bold text-[#0f172a] dark:text-white truncate break-keep">
													{station.name}
												</span>
											</div>
										</button>
									))}
								</div>
							</div>
						) : (
							<div className="space-y-4">
								{allGroupedReagents.length === 0 ? (
									<div className="py-12 text-center text-xs text-[#64748b] dark:text-[#a1a1aa] font-mono">
										일치하는 시약 조제법이 없습니다.
									</div>
								) : (
									allGroupedReagents.map((group) => (
										<div key={group.category} className="space-y-2">
											<h4 className="text-xs font-bold text-[#0f172a] dark:text-white px-1">
												{group.category} ({group.items.length})
											</h4>
											<div className="space-y-2">
												{group.items.map((r) => (
													<div
														key={`${group.category}-${r.name}-${r.manufacturer}`}
														className="p-3 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] space-y-1.5"
													>
														<div className="flex items-center justify-between gap-2">
															<span className="text-xs font-bold text-[#0f172a] dark:text-white">
																{r.name}
															</span>
															<span className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa]">
																{r.manufacturer}
															</span>
														</div>
														<div className="bg-white dark:bg-[#09090b] p-2 rounded-lg text-xs font-mono text-[#334155] dark:text-[#d4d4d8] space-y-0.5 border border-[#e2e8f0] dark:border-[#222228]">
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
