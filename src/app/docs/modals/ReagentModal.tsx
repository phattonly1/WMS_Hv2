"use client";

import { Check, Copy, FlaskConical, MapPin, Search } from "lucide-react";
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
}

export default function ReagentModal({ isOpen, onClose }: ReagentModalProps) {
	const [activeTab, setActiveTab] = useState<"stations" | "all">("stations");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedStation, setSelectedStation] = useState<StationData | null>(
		null,
	);
	const [copiedId, setCopiedId] = useState<string | null>(null);

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
		return groupAllReagents();
	}, []);

	const stationReagents = useMemo(() => {
		if (!selectedStation) return [];
		return getReagentsForStation(selectedStation);
	}, [selectedStation]);

	return (
		<Modal
			isOpen={isOpen}
			onClose={() => {
				setSelectedStation(null);
				setSearchTerm("");
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
			maxWidth="max-w-3xl"
			onBack={selectedStation ? () => setSelectedStation(null) : undefined}
		>
			<div className="space-y-4">
				{selectedStation ? (
					/* 측정소 상세 시약 목록 */
					<div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
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
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f8fafc] dark:bg-[#09090b] border border-[#e2e8f0] dark:border-[#222228]">
								<button
									type="button"
									onClick={() => setActiveTab("stations")}
									className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
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
									className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
										activeTab === "all"
											? "bg-white dark:bg-[#16161c] text-[#0f172a] dark:text-white shadow-sm"
											: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
									}`}
								>
									전체 시약 조제법
								</button>
							</div>
						</div>

						{activeTab === "stations" ? (
							<div className="space-y-3">
								<div className="relative flex items-center w-full h-10 px-3 bg-[#f8fafc] dark:bg-[#09090b] rounded-xl border border-[#e2e8f0] dark:border-[#222228] focus-within:border-blue-500/50">
									<Search size={14} className="text-[#64748b] dark:text-[#a1a1aa] shrink-0 mr-2" />
									<input
										type="text"
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										placeholder="측정소명 검색 (예: 달천, 평창강, ㄷㅊ)..."
										className="w-full bg-transparent text-xs text-[#0f172a] dark:text-white placeholder-[#64748b] dark:placeholder-[#a1a1aa] focus:outline-none"
									/>
								</div>

								<div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
									{filteredStations.map((station) => (
										<button
											key={station.name}
											type="button"
											onClick={() => setSelectedStation(station)}
											className="p-3 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/40 text-left transition-colors flex items-center justify-between"
										>
											<div className="flex items-center gap-2 min-w-0">
												<MapPin size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
												<span className="text-xs font-bold text-[#0f172a] dark:text-white truncate break-keep">
													{station.name}
												</span>
											</div>
										</button>
									))}
								</div>
							</div>
						) : (
							<div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
								{allGroupedReagents.map((group) => (
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
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</Modal>
	);
}
