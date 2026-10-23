"use client";

import {
	Building2,
	Calendar,
	Database,
	History,
	Home,
	Info,
	MapPin,
	Waves,
	X,
} from "lucide-react";
import { useState } from "react";
import {
	EQUIPMENT_PRESETS,
	RIVER_CONFIG,
	type Station,
	TYPE_CONFIG,
} from "../../stationData";

interface StationFormProps {
	station: Station;
	onChange?: (updated: Station) => void;
}

const EQUIP_STYLE: Record<string, { label: string; bg: string }> = {
	일반항목: { label: "일반", bg: "bg-indigo-600" },
	TOC: { label: "TOC", bg: "bg-emerald-500" },
	TN: { label: "TN", bg: "bg-indigo-600" },
	TP: { label: "TP", bg: "bg-indigo-600" },
	Bio: { label: "Bio", bg: "bg-amber-500" },
	VOCs: { label: "VOCs", bg: "bg-purple-500" },
};

export const StationForm = ({ station, onChange }: StationFormProps) => {
	const [activeTab, setActiveTab] = useState<"specs" | "instruments">("specs");

	const handleChange = (field: keyof Station, value: any) => {
		onChange?.({ ...station, [field]: value });
	};

	// --- Equipment Management ---
	const instruments = station.instruments || [];

	const tabs = [
		{ id: "specs" as const, label: "기본 제원", icon: Info, count: null },
		{
			id: "instruments" as const,
			label: "측정 장비",
			icon: Database,
			count: instruments.length,
		},
	];

	return (
		<div className="w-full font-sans space-y-3">
			{/* 상단 세그먼트 탭 바 */}
			<div className="max-w-7xl mx-auto w-full">
				<div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-white/5 shadow-2xs">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						const isActive = activeTab === tab.id;
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setActiveTab(tab.id)}
								className={`h-8.5 px-3.5 rounded-lg flex items-center gap-1.5 transition-all select-none active:scale-95 text-xs font-black ${
									isActive
										? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10"
										: "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
								}`}
							>
								<Icon size={13} strokeWidth={2.5} />
								<span>{tab.label}</span>
								{tab.count !== null && (
									<span
										className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold leading-tight ${
											isActive
												? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
												: "bg-slate-200/70 dark:bg-white/10 text-slate-500 dark:text-slate-400"
										}`}
									>
										{tab.count}
									</span>
								)}
							</button>
						);
					})}
				</div>
			</div>

			{/* 탭별 콘텐츠 영역 */}
			<div className="max-w-7xl mx-auto w-full">
				{/* 1. 기본 제원 탭 (정돈된 프리미엄 통합 카드) */}
				{activeTab === "specs" && (
					<section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-3 sm:p-4 shadow-xs space-y-3">
						{/* 명칭 인풋 & 소속/수계 뱃지 행 */}
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-0.5">
									측정소 기본 정보
								</span>
								<div className="flex items-center gap-1 shrink-0">
									<span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5">
										{TYPE_CONFIG[station.type]?.label || station.type}
									</span>
									<span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
										{RIVER_CONFIG[station.river]?.label || station.river}
									</span>
								</div>
							</div>

							<div className="relative">
								<input
									type="text"
									value={station.name}
									onChange={(e) => handleChange("name", e.target.value)}
									className="w-full h-9 px-3 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-black focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-white"
									placeholder="측정소 명칭을 입력하세요"
								/>
							</div>
						</div>

						{/* 핵심 기본 제원 (관할청, 수계, 시설형태, 설치일, 주소) */}
						<div className="space-y-1.5 p-2 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/5">
							{/* 4분할 그리드: 관할청 / 수계 / 시설형태 / 설치일 */}
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
								{/* 1. 관할청 */}
								<div className="p-2 rounded-lg bg-white dark:bg-slate-900/70 border border-slate-200/50 dark:border-white/5 space-y-0.5">
									<span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
										<Building2 size={10} className="text-indigo-500" /> 관할청
									</span>
									<div className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
										{station.office || "한강유역환경청"}
									</div>
								</div>

								{/* 2. 수계 */}
								<div className="p-2 rounded-lg bg-white dark:bg-slate-900/70 border border-slate-200/50 dark:border-white/5 space-y-0.5">
									<span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
										<Waves size={10} className="text-cyan-500" /> 수계
									</span>
									<div className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
										{RIVER_CONFIG[station.river]?.label || station.river || "-"}
									</div>
								</div>

								{/* 3. 시설형태 */}
								<div className="p-2 rounded-lg bg-white dark:bg-slate-900/70 border border-slate-200/50 dark:border-white/5 space-y-0.5">
									<span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
										<Home size={10} className="text-emerald-500" /> 시설형태
									</span>
									<div className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
										{station.facility_type || "단독건물"}
									</div>
								</div>

								{/* 4. 최종 설치일 */}
								<div className="p-2 rounded-lg bg-white dark:bg-slate-900/70 border border-slate-200/50 dark:border-white/5 space-y-0.5">
									<span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
										<Calendar size={10} className="text-amber-500" /> 최종
										설치일
									</span>
									<div className="text-xs font-mono font-black text-slate-800 dark:text-slate-100 truncate">
										{station.install_date || "-"}
									</div>
								</div>
							</div>

							{/* 5. 소재지 주소 (전체 너비 1행) */}
							<div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900/70 border border-slate-200/50 dark:border-white/5">
								<span className="text-[9px] font-bold text-slate-400 uppercase shrink-0 flex items-center gap-1">
									<MapPin size={10} className="text-rose-500" /> 소재지 주소
								</span>
								<div className="text-xs font-black text-slate-700 dark:text-slate-200 truncate flex-1">
									{station.address || "주소 정보 등록 대기"}
								</div>
							</div>
						</div>

						{/* 주요 연혁 타임라인 (주요 특징 대신 기본 제원에 포함) */}
						<div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-0.5 flex items-center gap-1">
									<History
										size={11}
										strokeWidth={2.5}
										className="text-indigo-600 dark:text-indigo-400"
									/>
									주요 연혁 (History)
								</span>
								<span className="text-[9px] font-mono font-bold text-slate-400">
									{(station.history || []).length}건
								</span>
							</div>

							{station.history && station.history.length > 0 ? (
								<div className="relative pl-3 border-l-2 border-slate-100 dark:border-white/10 space-y-1.5 py-0.5">
									{station.history.map((item, i) => (
										<div
											key={i}
											className="relative flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
										>
											{/* 타임라인 불릿 포인트 */}
											<div className="w-1.5 h-1.5 rounded-full bg-indigo-500 ring-3 ring-indigo-50 dark:ring-indigo-950/50 mt-1 shrink-0 -ml-[18px]" />

											<div className="min-w-[60px] shrink-0 font-mono text-[11px] font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
												{item.date || "-"}
											</div>
											<div className="text-[11.5px] text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
												{item.desc || "(내용 없음)"}
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="py-4 bg-slate-50 dark:bg-white/[0.01] border border-dashed border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-center gap-1.5">
									<History
										size={14}
										className="text-slate-300 dark:text-slate-600"
									/>
									<p className="text-[10px] text-slate-400 font-bold">
										등록된 주요 연혁이 없습니다.
									</p>
								</div>
							)}
						</div>
					</section>
				)}

				{/* 2. 측정 장비 탭 */}
				{activeTab === "instruments" && (
					<section className="bg-white dark:bg-slate-900/80 p-3.5 sm:p-4.5 rounded-2xl sm:rounded-3xl shadow-xs space-y-3">
						<div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
							<div className="flex items-center gap-2">
								<div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs shrink-0">
									<Database size={14} strokeWidth={2.5} />
								</div>
								<h4 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white tracking-tight">
									가동 기기 목록 ({instruments.length}대)
								</h4>
							</div>

							<span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
								읽기 전용 (Viewer)
							</span>
						</div>

						{/* 기기 그리드 (읽기 전용 카드) */}
						{instruments.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
								{instruments.map((inst, idx) => {
									const preset = EQUIPMENT_PRESETS.find(
										(p) => p.model === inst,
									);
									const getStyle = () => {
										if (preset && EQUIP_STYLE[preset.item])
											return EQUIP_STYLE[preset.item];
										const upper = inst.toUpperCase();
										if (upper.includes("TOC") || upper.includes("HATA"))
											return EQUIP_STYLE.TOC;
										if (upper.includes("TN") || upper.includes("HATN"))
											return EQUIP_STYLE.TN;
										if (upper.includes("TP") || upper.includes("HATP"))
											return EQUIP_STYLE.TP;
										if (
											upper.includes("ITOX") ||
											upper.includes("TOX") ||
											upper.includes("EASYCHEM") ||
											upper.includes("ALGAE") ||
											upper.includes("TRILUX") ||
											upper.includes("DAPHNIA")
										)
											return EQUIP_STYLE.Bio;
										if (upper.includes("CLARUS")) return EQUIP_STYLE.VOCs;
										if (
											upper.includes("EXO") ||
											upper.includes("YSI") ||
											upper.includes("6600")
										)
											return EQUIP_STYLE.일반항목;
										return null;
									};

									const style = getStyle();
									const isRetired = inst.endsWith("(X)");

									return (
										<div
											key={idx}
											className={`flex items-center gap-2.5 p-2 px-3 ${
												isRetired
													? "bg-slate-100 dark:bg-white/[0.02] opacity-60"
													: "bg-slate-50/80 dark:bg-white/[0.03]"
											} rounded-xl transition-all`}
										>
											<div
												className={`shrink-0 px-2 py-0.5 rounded-md ${isRetired ? "bg-slate-400" : style?.bg || "bg-slate-500"} text-white text-[9.5px] font-black min-w-[38px] text-center flex items-center justify-center gap-1 shadow-2xs`}
											>
												{style?.label || "ETC"}
												{isRetired && <X size={9} strokeWidth={4} />}
											</div>
											<div className="flex-1 min-w-0">
												<div
													className={`text-xs font-black truncate ${isRetired ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-100"}`}
												>
													{inst}
												</div>
												{preset && (
													<div className="text-[9px] font-semibold text-slate-400 truncate">
														{preset.manufacturer}
													</div>
												)}
											</div>
											{isRetired && (
												<span className="text-[9px] font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded shrink-0">
													단종
												</span>
											)}
										</div>
									);
								})}
							</div>
						) : (
							<div className="py-8 bg-slate-50 dark:bg-white/[0.01] border border-dashed border-slate-200 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2">
								<Database
									size={22}
									className="text-slate-300 dark:text-slate-600"
								/>
								<p className="text-[10px] text-slate-400 font-bold">
									등록된 기기가 없습니다. 위 버튼을 눌러 추가하세요.
								</p>
							</div>
						)}
					</section>
				)}
			</div>
		</div>
	);
};
