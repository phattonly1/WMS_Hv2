"use client";

import {
	AlertTriangle,
	BarChart3,
	Building2,
	Calendar,
	ChevronRight,
	Droplets,
	History,
	MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import {
	getNierStationCode,
	getRealtimeWaterQuality,
	type RealtimeWaterQuality,
	type WaterQualityMetricKey,
} from "../nierStationMap";
import {
	parseStationArray,
	RIVER_CONFIG,
	RIVER_ICONS,
	type Station,
} from "../stationData";

interface StationBottomSheetProps {
	station: Station | null;
	onClose: () => void;
	onOpenWaterQuality?: (
		station: Station,
		initialMetric?: WaterQualityMetricKey,
	) => void;
}

const METRIC_META: {
	key: WaterQualityMetricKey;
	label: string;
	unit: string;
	decimals: number;
}[] = [
	{ key: "ec", label: "EC", unit: "µS", decimals: 0 },
	{ key: "wtrtp", label: "수온", unit: "℃", decimals: 1 },
	{ key: "ph", label: "pH", unit: "", decimals: 1 },
	{ key: "doc", label: "DO", unit: "mg/L", decimals: 1 },
	{ key: "toc", label: "TOC", unit: "mg/L", decimals: 1 },
	{ key: "tur", label: "탁도", unit: "NTU", decimals: 1 },
	{ key: "tp", label: "TP", unit: "mg/L", decimals: 3 },
	{ key: "tn", label: "TN", unit: "mg/L", decimals: 3 },
	{ key: "wqi", label: "WQI", unit: "점", decimals: 0 },
	{ key: "chla", label: "클로로필-a", unit: "mg/m³", decimals: 1 },
];

export function StationBottomSheet({
	station,
	onClose,
	onOpenWaterQuality,
}: StationBottomSheetProps) {
	// 실시간 수질 최신 데이터 상태 (그리드 및 이상치 배너 표시용)
	const [latestWq, setLatestWq] = useState<RealtimeWaterQuality | null>(null);
	const [showAllHistory, setShowAllHistory] = useState(false);

	// 측정소가 바뀌면 localStorage 캐시에서 즉시 실시간 수질 데이터 조회
	useEffect(() => {
		setShowAllHistory(false);
		if (!station) return;

		if (station.type === "station") {
			let foundCached = false;
			try {
				const code = getNierStationCode(station.name);
				const cachedRaw =
					typeof window !== "undefined"
						? window.localStorage.getItem("wms_nier_realtime_wq")
						: null;
				if (code && cachedRaw) {
					const parsed = JSON.parse(cachedRaw);
					const cachedLatest = parsed?.data?.[code] as
						| RealtimeWaterQuality
						| undefined;
					if (cachedLatest) {
						foundCached = true;
						setLatestWq(cachedLatest);
					}
				}
			} catch {
				// ignore cache read error
			}

			if (!foundCached) {
				setLatestWq(null);
				getRealtimeWaterQuality(station.name)
					.then((res) => {
						if (res.latest) {
							setLatestWq(res.latest);
						}
					})
					.catch(() => {
						// ignore fetch error
					});
			}
		} else {
			setLatestWq(null);
		}
	}, [station?.name, station?.lat, station]);

	if (!station) return null;

	const config = (station.river && RIVER_CONFIG[station.river]) || {
		label: "기타",
		labelEn: "Etc",
		color: "#2563eb",
		bgClass: "indigo",
	};
	const Icon = (station.river && RIVER_ICONS[station.river]) || Droplets;

	const history = parseStationArray<{ date: string; desc: string }>(
		station.history,
	);
	const features = parseStationArray<string>(station.features);
	const instruments = parseStationArray<string>(station.instruments);
	const isSimpleModal = station.type === "small" || station.type === "poi";

	const shortOffice = (station.office || "한강유역환경청")
		.replace("한강유역환경청", "한강청")
		.replace("원주지방환경청", "원주청")
		.replace(/유역환경청|지방환경청/, "청");

	// 실시간 수질 전일 평균 대비 이상치(50% 이하 급감 / 150% 이상 급등) 항목 계산
	const anomalies = (() => {
		if (!latestWq?.prevAvg) return [];
		const list: {
			key: WaterQualityMetricKey;
			label: string;
			unit: string;
			decimals: number;
			currentVal: number;
			prevAvgVal: number;
			ratio: number;
			type: "low" | "high";
		}[] = [];

		for (const m of METRIC_META) {
			const cur = latestWq[m.key];
			const avg = latestWq.prevAvg[m.key];
			if (
				typeof cur === "number" &&
				typeof avg === "number" &&
				!Number.isNaN(cur) &&
				!Number.isNaN(avg) &&
				avg > 0
			) {
				const ratio = cur / avg;
				if (ratio <= 0.5 || ratio >= 1.5) {
					list.push({
						...m,
						currentVal: cur,
						prevAvgVal: avg,
						ratio,
						type: ratio <= 0.5 ? "low" : "high",
					});
				}
			}
		}
		return list;
	})();

	return (
		<>
			{/* 모달 바깥 상단: 실시간 수질 진입 칩 + 이상치 플로팅 알림 바 */}
			{!isSimpleModal && (
				<div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+70px+45svh+8px)] sm:bottom-[calc(87.5dvh+8px)] z-[1010] pointer-events-none flex justify-center px-3.5">
					<div className="pointer-events-auto w-full max-w-xl flex flex-wrap items-center gap-1.5">
						<button
							type="button"
							onClick={() => onOpenWaterQuality?.(station)}
							title="실시간 수질 24시간 추이 창 열기"
							className="px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_6px_20px_rgba(37,99,235,0.35)] border border-blue-400/30 flex items-center gap-1.5 text-[11px] font-black tracking-tight active:scale-95 transition-all shrink-0"
						>
							<BarChart3 size={13} strokeWidth={2.5} className="shrink-0" />
							<span>실시간 수질</span>
						</button>

						{anomalies.length > 0 && (
							<div className="px-2.5 py-1 rounded-full bg-white/95 dark:bg-[#111115]/95 backdrop-blur-2xl shadow-[0_6px_20px_rgba(0,0,0,0.18)] border border-amber-500/40 dark:border-amber-400/30 flex flex-wrap items-center gap-1">
								<span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 dark:text-amber-300 shrink-0 mr-0.5">
									<AlertTriangle
										size={12}
										strokeWidth={2.6}
										className="shrink-0"
									/>
									<span>이상치</span>
								</span>
								{anomalies.map((anom) => (
									<button
										key={anom.key}
										type="button"
										onClick={() => onOpenWaterQuality?.(station, anom.key)}
										title={`클릭 시 ${anom.label} 24시간 추이 확인`}
										className={`px-1.5 py-0.5 rounded-full text-[9.5px] tabular-nums font-black tracking-tight flex items-center gap-1 active:scale-95 transition-transform ${
											anom.type === "low"
												? "bg-rose-600 text-white"
												: "bg-amber-500 text-white"
										}`}
									>
										<span>{anom.label}</span>
										<span>
											{anom.type === "low" ? "↓" : "↑"}
											{Math.round(anom.ratio * 100)}%
										</span>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			)}

			<Modal
				isOpen={Boolean(station)}
				onClose={onClose}
				title={station.name}
				subtitle={
					showAllHistory
						? `주요 연혁 (${history.length})`
						: isSimpleModal
							? station.type === "small"
								? "소규모 감시망"
								: "관심지점"
							: config.label
				}
				icon={Icon}
				size="half"
				onBack={showAllHistory ? () => setShowAllHistory(false) : undefined}
				headerAction={
					!isSimpleModal ? (
						<div className="flex items-center gap-1 mr-0.5">
							<span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded-md border border-black/[0.06] dark:border-white/10 shrink-0">
								<Building2
									size={10}
									className="shrink-0 text-slate-500 dark:text-slate-400"
								/>
								<span>{shortOffice}</span>
							</span>
							{station.install_date && (
								<span className="inline-flex items-center gap-1 text-[10px] font-bold tabular-nums text-slate-600 dark:text-slate-300 bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded-md border border-black/[0.06] dark:border-white/10 shrink-0">
									<Calendar
										size={10}
										className="shrink-0 text-slate-500 dark:text-slate-400"
									/>
									{station.install_date.slice(0, 7)}
								</span>
							)}
						</div>
					) : (
						<span
							className="text-[10px] font-black px-1.5 py-0.5 rounded-md text-white shrink-0 mr-0.5"
							style={{ backgroundColor: config.color }}
						>
							{config.label}
						</span>
					)
				}
			>
				{isSimpleModal ? (
					<div className="space-y-2 py-1">
						{station.address && (
							<div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 bg-black/[0.03] dark:bg-white/[0.05] px-3 py-2 rounded-xl border border-black/[0.06] dark:border-white/10">
								<MapPin size={14} className="shrink-0 mt-0.5 text-blue-500" />
								<span className="break-keep">{station.address}</span>
							</div>
						)}
						{station.description && (
							<p className="text-xs text-slate-600 dark:text-slate-300 px-1 leading-relaxed break-keep">
								{station.description}
							</p>
						)}
						{!station.address && !station.description && (
							<p className="text-xs text-slate-500 dark:text-slate-400 px-1">
								{config.label} 수계 ·{" "}
								{station.type === "small" ? "소규모 감시망 측정소" : "관심지점"}
							</p>
						)}
					</div>
				) : showAllHistory ? (
					/* 연혁 전체 보기 뷰 */
					<div className="space-y-1.5">
						{history.map((h, i) => (
							<div
								key={i}
								className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/10 flex items-start gap-2.5 text-xs shadow-2xs"
							>
								<span className="tabular-nums font-black text-indigo-600 dark:text-indigo-400 shrink-0 min-w-[70px]">
									{h.date}
								</span>
								<span className="text-slate-800 dark:text-slate-200 font-bold leading-relaxed break-keep">
									{h.desc}
								</span>
							</div>
						))}
					</div>
				) : (
					<div className="space-y-2.5">
						{/* 2열 벤토 레이아웃: [1열 1/3: 채수시설 정보 / 채수시설 용량] + [2열 2/3: 장비정보] */}
						<div className="grid grid-cols-3 gap-2 items-stretch pt-0.5">
							{/* 1열 (1/3): 1행 채수시설 정보 + 2행 채수시설 용량 */}
							<div className="col-span-1 flex flex-col gap-1.5 min-w-0">
								<fieldset className="flex-1 min-w-0 px-2 pt-1 pb-2 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/15 flex flex-col justify-center">
									<legend className="px-1 text-[9.5px] font-bold text-slate-500 dark:text-slate-400 leading-none whitespace-nowrap">
										채수시설 정보
									</legend>
									<span className="text-xs font-black text-slate-900 dark:text-white min-h-[16px]" />
								</fieldset>

								<fieldset className="flex-1 min-w-0 px-2 pt-1 pb-2 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/15 flex flex-col justify-center">
									<legend className="px-1 text-[9.5px] font-bold text-slate-500 dark:text-slate-400 leading-none whitespace-nowrap">
										채수시설 용량
									</legend>
									<span className="text-xs font-black text-slate-900 dark:text-white min-h-[16px]" />
								</fieldset>
							</div>

							{/* 2열 (2/3): 장비정보 */}
							<fieldset className="col-span-2 min-w-0 px-2.5 pt-1.5 pb-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/15 flex flex-col justify-center">
								<legend className="px-1 text-[9.5px] font-bold text-slate-500 dark:text-slate-400 leading-none">
									장비정보
								</legend>
								{instruments.length > 0 ? (
									<div className="flex flex-wrap gap-1">
										{instruments.map((inst, i) => {
											const isRetired = inst.trim().endsWith("(X)");
											const displayName = isRetired
												? inst.replace(/\(X\)$/, "").trim()
												: inst;
											return (
												<span
													key={i}
													title={displayName}
													className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold tracking-tight border ${
														isRetired
															? "bg-slate-200/50 dark:bg-white/5 text-slate-400 border-slate-300/40 dark:border-white/5 line-through"
															: "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-black/[0.06] dark:border-white/10 shadow-2xs"
													}`}
												>
													{displayName}
												</span>
											);
										})}
									</div>
								) : (
									<p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
										장비 정보 없음
									</p>
								)}
							</fieldset>
						</div>

						{/* 2. 주요 연혁 (최신 2건 미리보기 + 전체보기 전환) */}
						<div className="border-t border-black/[0.08] dark:border-white/10 pt-2 space-y-1.5">
							<div className="flex items-center justify-between gap-2">
								<span className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
									<History
										size={13}
										className="text-indigo-600 dark:text-indigo-400"
									/>
									주요 연혁 ({history.length})
								</span>
								{history.length > 2 && (
									<button
										type="button"
										onClick={() => setShowAllHistory(true)}
										className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-blue-600 dark:text-blue-400 hover:underline active:scale-95 transition-transform"
									>
										<span>전체보기</span>
										<ChevronRight size={12} strokeWidth={2.5} />
									</button>
								)}
							</div>

							{history.length > 0 ? (
								<div className="space-y-1">
									{history.slice(0, 2).map((h, i) => (
										<div
											key={i}
											className="px-2.5 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/10 flex items-start gap-2.5 text-xs shadow-2xs"
										>
											<span className="tabular-nums font-black text-indigo-600 dark:text-indigo-400 shrink-0 min-w-[70px]">
												{h.date}
											</span>
											<span className="text-slate-800 dark:text-slate-200 font-bold leading-snug line-clamp-1 break-keep">
												{h.desc}
											</span>
										</div>
									))}
								</div>
							) : (
								<div className="py-2 text-center text-[11px] text-slate-400 dark:text-slate-500 font-bold">
									등록된 연혁 정보가 없습니다.
								</div>
							)}
						</div>
					</div>
			)}
		</Modal>
		</>
	);
}
