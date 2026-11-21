"use client";

import { useEffect, useMemo, useState } from "react";
import { Droplets } from "lucide-react";
import type {
	RealtimeWaterQuality,
	WaterQualityMetricKey,
} from "../nierStationMap";
import { Modal } from "@/components/ui/modal";
import { isGeneralMetricsUnreceived } from "./VectorMarkers";

interface WaterQualityChartModalProps {
	isOpen: boolean;
	onClose: () => void;
	stationName: string;
	initialMetric?: WaterQualityMetricKey;
	data: {
		latest: RealtimeWaterQuality | null;
		history: RealtimeWaterQuality[];
	} | null;
	isLoading: boolean;
}

type MetricKey =
	| "wtrtp"
	| "wqi"
	| "toc"
	| "tp"
	| "tn"
	| "ph"
	| "doc"
	| "ec"
	| "tur"
	| "chla";

interface MetricConfig {
	key: MetricKey;
	label: string;
	shortLabel: string;
	unit: string;
	color: string;
	decimals: number;
}

const METRIC_CONFIGS: MetricConfig[] = [
	{
		key: "wtrtp",
		label: "수온",
		shortLabel: "수온",
		unit: "℃",
		color: "#2563eb",
		decimals: 1,
	},
	{
		key: "wqi",
		label: "WQI(수질지수)",
		shortLabel: "WQI",
		unit: "점",
		color: "#2563eb",
		decimals: 0,
	},
	{
		key: "ec",
		label: "EC(전도도)",
		shortLabel: "EC",
		unit: "μS",
		color: "#10b981",
		decimals: 0,
	},
	{
		key: "ph",
		label: "pH",
		shortLabel: "pH",
		unit: "",
		color: "#f43f5e",
		decimals: 1,
	},
	{
		key: "doc",
		label: "DO(용존산소)",
		shortLabel: "DO",
		unit: "mg/L",
		color: "#2563eb",
		decimals: 1,
	},
	{
		key: "toc",
		label: "TOC(유기탄소)",
		shortLabel: "TOC",
		unit: "mg/L",
		color: "#10b981",
		decimals: 1,
	},
	{
		key: "tp",
		label: "TP(총인)",
		shortLabel: "TP",
		unit: "mg/L",
		color: "#f59e0b",
		decimals: 3,
	},
	{
		key: "tn",
		label: "TN(총질소)",
		shortLabel: "TN",
		unit: "mg/L",
		color: "#2563eb",
		decimals: 3,
	},
	{
		key: "tur",
		label: "탁도",
		shortLabel: "탁도",
		unit: "NTU",
		color: "#f59e0b",
		decimals: 1,
	},
	{
		key: "chla",
		label: "클로로필-a",
		shortLabel: "Chl-a",
		unit: "mg/m³",
		color: "#10b981",
		decimals: 1,
	},
];

export function WaterQualityChartModal({
	isOpen,
	onClose,
	stationName,
	initialMetric,
	data,
	isLoading,
}: WaterQualityChartModalProps) {
	const [activeMetric, setActiveMetric] = useState<MetricKey>("wtrtp");
	const [hoverIdx, setHoverIdx] = useState<number | null>(null);

	// 초기 지표 지정 시 보정
	useEffect(() => {
		setHoverIdx(null);
		if (isOpen && initialMetric) {
			const exists = METRIC_CONFIGS.some((m) => m.key === initialMetric);
			if (exists) {
				setActiveMetric(initialMetric as MetricKey);
			}
		}
	}, [isOpen, initialMetric]);

	const selectedConfig = useMemo(
		() =>
			METRIC_CONFIGS.find((m) => m.key === activeMetric) ||
			METRIC_CONFIGS[0]!,
		[activeMetric],
	);

	// 유효한 실측 데이터가 존재하는 최근 48시간 시계열 추출
	const recentHistory = useMemo(() => {
		if (!data?.history || data.history.length === 0) return [];
		const validList = data.history.filter((item) => {
			return (
				item.ph !== null ||
				item.wtrtp !== null ||
				item.doc !== null ||
				item.toc !== null
			);
		});
		return validList.slice(-48);
	}, [data]);

	// 각 지표별로 최근 48시간 내 가장 마지막 유효 측정값 추출 (현재 시각이 결측일 때 회색 숫자로 표시용)
	const lastValidByMetric = useMemo(() => {
		const map: Partial<Record<MetricKey, { val: number; dt: string }>> = {};
		for (const m of METRIC_CONFIGS) {
			for (let i = recentHistory.length - 1; i >= 0; i--) {
				const rec = recentHistory[i];
				const v = rec?.[m.key];
				if (typeof v === "number" && !Number.isNaN(v)) {
					map[m.key] = { val: v, dt: rec?.measureDt || "" };
					break;
				}
			}
		}
		return map;
	}, [recentHistory]);

	// 차트 SVG 좌표 계산 (초슬림 높이 84px, 실측 구간 컬러 실선 + 결측 구간 회색 점선 분리)
	const chartData = useMemo(() => {
		if (recentHistory.length === 0) return null;

		const values = recentHistory
			.map((item) => item[activeMetric] as number | null)
			.filter((v): v is number => v !== null && !Number.isNaN(v));

		if (values.length === 0) return null;

		const minVal = Math.min(...values);
		const maxVal = Math.max(...values);
		const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

		const svgWidth = 320;
		const svgHeight = 84;
		const padY = 10;
		const usableHeight = svgHeight - padY * 2;

		// "2026-11-17 14h" -> "11/17 14시" 변환 헬퍼
		const formatKoDt = (raw: string) => {
			const m = raw.match(/(?:\d{4}-)?(\d{2})-(\d{2})\s+(\d{2})h?/);
			if (m) {
				return `${Number(m[1])}/${Number(m[2])} ${Number(m[3])}시`;
			}
			return raw;
		};

		const rawPoints = recentHistory.map((item, idx) => {
			const x = (idx / (recentHistory.length - 1 || 1)) * svgWidth;
			const val = item[activeMetric] as number | null;
			const isValid = typeof val === "number" && !Number.isNaN(val);
			const y = isValid
				? svgHeight - padY - ((val - minVal) / range) * usableHeight
				: null;
			const rawDt = item.measureDt || "";
			const timeLabel = formatKoDt(rawDt);
			return { x, y, val: isValid ? val : null, isValid, timeLabel, fullDt: rawDt };
		});

		// 결측(null) 포인트의 y좌표를 앞/뒤 유효 실측값 기준으로 보간(또는 직전 실측값 유지)하여 엉뚱한 중앙선(svgHeight/2) 튀는 현상 방지
		const firstValidIdx = rawPoints.findIndex((p) => p.isValid);
		const lastValidIdx = rawPoints.findLastIndex((p) => p.isValid);
		const firstValidY = rawPoints[firstValidIdx]?.y ?? svgHeight / 2;
		const lastValidY = rawPoints[lastValidIdx]?.y ?? svgHeight / 2;

		const points = rawPoints.map((pt, i) => {
			if (pt.y !== null) return { ...pt, y: pt.y };
			if (i < firstValidIdx) return { ...pt, y: firstValidY };
			if (i > lastValidIdx) return { ...pt, y: lastValidY };
			// 중간 결측 구간: 직전 유효점과 다음 유효점 사이 선형 보간
			let prevIdx = i - 1;
			while (prevIdx >= 0 && rawPoints[prevIdx]?.y === null) prevIdx--;
			let nextIdx = i + 1;
			while (nextIdx < rawPoints.length && rawPoints[nextIdx]?.y === null)
				nextIdx++;
			const prevPt = rawPoints[prevIdx];
			const nextPt = rawPoints[nextIdx];
			if (prevPt?.y != null && nextPt?.y != null && nextIdx > prevIdx) {
				const t = (i - prevIdx) / (nextIdx - prevIdx);
				return { ...pt, y: prevPt.y + (nextPt.y - prevPt.y) * t };
			}
			return { ...pt, y: lastValidY };
		});

		// 1) 연속된 실측(isValid) 구간 Path 및 그라디언트 채우기 생성
		const solidSegments: { pathD: string; fillD: string }[] = [];
		let currentSeg: typeof points = [];
		for (const pt of points) {
			if (pt.isValid) {
				currentSeg.push(pt);
			} else if (currentSeg.length > 0) {
				const d = currentSeg
					.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`)
					.join(" ");
				const firstX = currentSeg[0]!.x;
				const lastX = currentSeg[currentSeg.length - 1]!.x;
				solidSegments.push({
					pathD: d,
					fillD: `${d} L ${lastX} ${svgHeight} L ${firstX} ${svgHeight} Z`,
				});
				currentSeg = [];
			}
		}
		if (currentSeg.length > 0) {
			const d = currentSeg
				.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`)
				.join(" ");
			const firstX = currentSeg[0]!.x;
			const lastX = currentSeg[currentSeg.length - 1]!.x;
			solidSegments.push({
				pathD: d,
				fillD: `${d} L ${lastX} ${svgHeight} L ${firstX} ${svgHeight} Z`,
			});
		}

		// 2) 결측(!isValid) 구간을 잇는 회색 점선 Path 생성
		const dashedPaths: string[] = [];
		let i = 0;
		while (i < points.length) {
			if (!points[i]!.isValid) {
				const startIdx = Math.max(0, i - 1);
				let endIdx = i;
				while (endIdx + 1 < points.length && !points[endIdx + 1]!.isValid) {
					endIdx++;
				}
				if (endIdx + 1 < points.length) endIdx++;
				const seg = points.slice(startIdx, endIdx + 1);
				if (seg.length >= 2) {
					dashedPaths.push(
						seg
							.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`)
							.join(" "),
					);
				}
				i = endIdx + 1;
			} else {
				i++;
			}
		}

		return {
			minVal,
			maxVal,
			avgVal: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(
				selectedConfig.decimals,
			),
			points,
			solidSegments,
			dashedPaths,
			svgWidth,
			svgHeight,
		};
	}, [recentHistory, activeMetric, selectedConfig]);

	const activePoint =
		chartData && hoverIdx !== null && chartData.points[hoverIdx]
			? chartData.points[hoverIdx]
			: chartData?.points[chartData.points.length - 1] || null;

	const latestMeasureTime = data?.latest?.measureDt
		? data.latest.measureDt.replace(/^\d{4}-/, "")
		: null;
	const isUnreceived = isGeneralMetricsUnreceived(data?.latest);

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={`${stationName} 실시간 수질`}
			icon={Droplets}
			size="half"
			headerAction={
				<div className="flex items-center gap-1">
					{isUnreceived && (
						<span className="text-[10px] font-black text-white bg-slate-600 px-2 py-0.5 rounded-lg border border-slate-400/50">
							미수신
						</span>
					)}
					{latestMeasureTime && (
						<span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-lg border border-black/5 dark:border-white/5">
							{latestMeasureTime}
						</span>
					)}
				</div>
			}
			contentClassName="p-3 sm:p-3.5 overflow-hidden"
		>
			<div className="space-y-2.5 text-[11px] select-none">
				{/* 1. 상단: 전 항목 슬림 대시보드 그리드 (5열 x 2행, 배지 없이 색상으로 이상치 강조하여 이름 잘림 원천 차단) */}
				<div className="p-1.5 rounded-2xl bg-slate-100/80 dark:bg-[#16161c] border border-slate-200/80 dark:border-white/10 grid grid-cols-5 gap-1">
					{METRIC_CONFIGS.map((m) => {
						const isSelected = activeMetric === m.key;
						const currentVal = data?.latest
							? (data.latest[m.key] as number | null)
							: null;
						const isCurrentValid =
							typeof currentVal === "number" && !Number.isNaN(currentVal);
						const fallbackEntry = !isCurrentValid
							? lastValidByMetric[m.key]
							: undefined;
						const prevAvgVal = data?.latest?.prevAvg?.[m.key] ?? null;
						const ratio =
							isCurrentValid &&
							typeof prevAvgVal === "number" &&
							!Number.isNaN(prevAvgVal) &&
							prevAvgVal > 0
								? currentVal / prevAvgVal
								: null;
						const isLow = ratio !== null && ratio <= 0.5;
						const isHigh = ratio !== null && ratio >= 1.5;
						const hasAnomaly = isLow || isHigh;

						return (
							<button
								key={m.key}
								type="button"
								onClick={() => {
									setActiveMetric(m.key);
									setHoverIdx(null);
								}}
								className="w-full text-left active:scale-95 transition-transform min-w-0"
							>
								<fieldset
									className={`w-full min-w-0 h-[38px] px-2 pt-0.5 pb-1.5 rounded-xl flex items-center justify-center transition-all border ${
										isSelected
											? hasAnomaly
												? isLow
													? "bg-rose-500/15 dark:bg-rose-500/25 border-rose-500 dark:border-rose-400 shadow-xs ring-1 ring-rose-500/30"
													: "bg-amber-500/15 dark:bg-amber-500/25 border-amber-500 dark:border-amber-400 shadow-xs ring-1 ring-amber-500/30"
												: "bg-white dark:bg-[#2a2a32] border-blue-500 dark:border-blue-400 shadow-xs ring-1 ring-blue-500/20"
											: hasAnomaly
												? isLow
													? "bg-rose-500/10 dark:bg-rose-500/15 border-rose-400/60 dark:border-rose-500/40"
													: "bg-amber-500/10 dark:bg-amber-500/15 border-amber-400/60 dark:border-amber-500/40"
												: "bg-white/70 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] border-black/[0.08] dark:border-white/15"
									}`}
								>
									{/* 테두리 상단 제목: 지표 약칭 */}
									<legend
										className={`px-1 text-[9.5px] font-bold tracking-tight leading-none whitespace-nowrap ${
											hasAnomaly
												? isLow
													? "text-rose-600 dark:text-rose-300 font-black"
													: "text-amber-600 dark:text-amber-300 font-black"
												: isSelected
													? "text-blue-600 dark:text-blue-400 font-black"
													: "text-slate-500 dark:text-slate-400"
										}`}
									>
										{m.shortLabel}
									</legend>

									{/* 현재 측정값 (일시 결측이지만 48h 내 최근값이 있으면 회색 숫자로 표시) */}
									<div className="w-full flex items-center justify-center leading-none">
										{isCurrentValid ? (
											<span
												className={`text-[12px] font-black tracking-tight tabular-nums whitespace-nowrap ${
													hasAnomaly
														? isLow
															? "text-rose-600 dark:text-rose-200"
															: "text-amber-600 dark:text-amber-200"
														: isSelected
															? "text-blue-600 dark:text-blue-300"
															: "text-slate-900 dark:text-white"
												}`}
											>
												{currentVal.toFixed(m.decimals)}
											</span>
										) : fallbackEntry ? (
											<span
												title={`현재 결측 (최근 측정: ${fallbackEntry.val.toFixed(m.decimals)})`}
												className="text-[12px] font-bold tracking-tight tabular-nums whitespace-nowrap text-slate-400 dark:text-slate-500"
											>
												{fallbackEntry.val.toFixed(m.decimals)}
											</span>
										) : (
											<span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">
												-
											</span>
										)}
									</div>
								</fieldset>
							</button>
						);
					})}
				</div>

				{/* 2. 하단: 일체형 초컴팩트 24h 트렌드 차트 */}
				<div className="p-2.5 rounded-2xl bg-slate-100/80 dark:bg-[#16161c] border border-slate-200/80 dark:border-white/10 space-y-1.5">
					{/* 차트 상단 1줄: 고정 높이 h-5로 배지 등장/소멸 시 레이아웃 울렁거림 원천 차단 */}
					<div className="h-5 flex items-center justify-between gap-2 leading-none">
						<div className="flex items-center gap-1.5 min-w-0">
							<span className="text-[11.5px] font-black text-slate-900 dark:text-white whitespace-nowrap">
								{selectedConfig.label}
							</span>
							{activePoint &&
								(activePoint.val !== null ? (
									<span className="text-[12px] font-black tabular-nums whitespace-nowrap text-blue-600 dark:text-blue-400">
										{activePoint.val.toFixed(selectedConfig.decimals)}
										{selectedConfig.unit && (
											<span className="ml-0.5 text-[9.5px] font-bold text-slate-500 dark:text-slate-400">
												{selectedConfig.unit}
											</span>
										)}
									</span>
								) : lastValidByMetric[activeMetric] ? (
									<span className="text-[11px] font-bold tabular-nums whitespace-nowrap text-slate-400 dark:text-slate-500">
										{hoverIdx !== null
											? "결측"
											: `${lastValidByMetric[activeMetric]!.val.toFixed(selectedConfig.decimals)}${selectedConfig.unit} (최근)`}
									</span>
								) : null)}
							{(() => {
								const cur = data?.latest
									? (data.latest[activeMetric] as number | null)
									: null;
								const avg = data?.latest?.prevAvg?.[activeMetric] ?? null;
								if (
									typeof cur === "number" &&
									typeof avg === "number" &&
									!Number.isNaN(cur) &&
									!Number.isNaN(avg) &&
									avg > 0
								) {
									const ratio = cur / avg;
									if (ratio <= 0.5 || ratio >= 1.5) {
										const isLow = ratio <= 0.5;
										return (
											<span
												className={`h-[18px] px-1.5 inline-flex items-center rounded-md text-[9px] font-black leading-none text-white tabular-nums whitespace-nowrap ${
													isLow ? "bg-rose-500" : "bg-amber-500"
												}`}
											>
												전일대비 {isLow ? "↓" : "↑"}
												{Math.round(ratio * 100)}%
											</span>
										);
									}
								}
								return null;
							})()}
						</div>

						{activePoint && hoverIdx !== null && (
							<span className="h-[18px] px-1.5 inline-flex items-center rounded-md bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[9.5px] font-bold text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap shrink-0">
								{activePoint.timeLabel}
							</span>
						)}
					</div>

					{/* 로딩 인디케이터 */}
					{isLoading && (
						<div className="h-[96px] flex flex-col items-center justify-center gap-1.5 text-slate-400">
							<div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
							<span className="text-[10px]">48시간 데이터 수신 중...</span>
						</div>
					)}

					{/* 차트 SVG (모바일 터치 드래그 & PC 마우스 이동으로 시간대별 수치 탐색) */}
					{!isLoading && chartData && (
						<div>
							<div
								className="w-full relative h-[84px] flex items-center justify-center touch-none cursor-crosshair"
								onPointerDown={(e) => {
									e.stopPropagation();
									const rect = e.currentTarget.getBoundingClientRect();
									const relX = Math.max(
										0,
										Math.min(1, (e.clientX - rect.left) / rect.width),
									);
									const idx = Math.round(
										relX * (chartData.points.length - 1),
									);
									setHoverIdx(idx);
								}}
								onPointerMove={(e) => {
									const rect = e.currentTarget.getBoundingClientRect();
									const relX = Math.max(
										0,
										Math.min(1, (e.clientX - rect.left) / rect.width),
									);
									const idx = Math.round(
										relX * (chartData.points.length - 1),
									);
									setHoverIdx(idx);
								}}
								onPointerUp={() => setHoverIdx(null)}
								onPointerCancel={() => setHoverIdx(null)}
								onPointerLeave={() => setHoverIdx(null)}
							>
								<svg
									viewBox={`0 0 ${chartData.svgWidth} ${chartData.svgHeight}`}
									className="w-full h-full overflow-visible"
									preserveAspectRatio="none"
								>
									<defs>
										<linearGradient
											id={`grad-${activeMetric}`}
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="0%"
												stopColor={selectedConfig.color}
												stopOpacity="0.28"
											/>
											<stop
												offset="100%"
												stopColor={selectedConfig.color}
												stopOpacity="0.0"
											/>
										</linearGradient>
									</defs>

									{/* 수평 가이드선 */}
									<line
										x1="0"
										y1="10"
										x2={chartData.svgWidth}
										y2="10"
										stroke="currentColor"
										strokeDasharray="3 3"
										className="text-slate-200 dark:text-white/5"
									/>
									<line
										x1="0"
										y1="42"
										x2={chartData.svgWidth}
										y2="42"
										stroke="currentColor"
										strokeDasharray="3 3"
										className="text-slate-200 dark:text-white/5"
									/>
									<line
										x1="0"
										y1="74"
										x2={chartData.svgWidth}
										y2="74"
										stroke="currentColor"
										strokeDasharray="3 3"
										className="text-slate-200 dark:text-white/5"
									/>

									{/* 1) 실측 구간 배경 그라디언트 */}
									{chartData.solidSegments.map((seg, idx) => (
										<path
											key={`fill-${idx}`}
											d={seg.fillD}
											fill={`url(#grad-${activeMetric})`}
										/>
									))}

									{/* 2) 결측(없는 데이터) 구간 회색 점선 */}
									{chartData.dashedPaths.map((d, idx) => (
										<path
											key={`dash-${idx}`}
											d={d}
											fill="none"
											stroke="#64748b"
											strokeWidth="1.8"
											strokeDasharray="3 3"
											strokeLinecap="round"
											opacity="0.75"
										/>
									))}

									{/* 3) 실측 구간 컬러 트렌드 실선 */}
									{chartData.solidSegments.map((seg, idx) => (
										<path
											key={`line-${idx}`}
											d={seg.pathD}
											fill="none"
											stroke={selectedConfig.color}
											strokeWidth="2.2"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									))}

									{/* 터치/호버 수직 가이드라인 */}
									{activePoint && hoverIdx !== null && (
										<line
											x1={activePoint.x}
											y1="4"
											x2={activePoint.x}
											y2={chartData.svgHeight - 4}
											stroke={
												activePoint.isValid ? selectedConfig.color : "#64748b"
											}
											strokeWidth="1"
											strokeDasharray="2 2"
											opacity="0.7"
										/>
									)}

									{/* 활성 포인트 닷 (실측이면 컬러 닷, 결측이면 회색 속빈 닷) */}
									{activePoint && (
										<circle
											cx={activePoint.x}
											cy={activePoint.y}
											r="3.5"
											fill={
												activePoint.isValid ? selectedConfig.color : "#64748b"
											}
											stroke="#ffffff"
											strokeWidth="1.8"
										/>
									)}
								</svg>
							</div>

							{/* 하단 X축 시간 라벨 (48시간 전 ~ 현재) + 중앙에 최저·평균·최고 통합 */}
							<div className="flex justify-between items-center text-[9.5px] text-slate-400 px-0.5 pt-1 leading-none tabular-nums">
								<span className="shrink-0 font-semibold">48시간 전</span>

								<div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
									<span>
										최저{" "}
										<b className="font-black text-slate-800 dark:text-slate-200">
											{chartData.minVal.toFixed(selectedConfig.decimals)}
										</b>
									</span>
									<span className="opacity-40">·</span>
									<span>
										평균{" "}
										<b className="font-black text-slate-800 dark:text-slate-200">
											{chartData.avgVal}
										</b>
									</span>
									<span className="opacity-40">·</span>
									<span>
										최고{" "}
										<b className="font-black text-slate-800 dark:text-slate-200">
											{chartData.maxVal.toFixed(selectedConfig.decimals)}
										</b>
									</span>
								</div>

								<span className="font-bold text-slate-700 dark:text-slate-200 shrink-0">
									현재
								</span>
							</div>
						</div>
					)}

					{/* 데이터 없음 */}
					{!isLoading && !chartData && (
						<div className="h-[96px] flex items-center justify-center text-slate-400 text-[11px]">
							해당 항목의 최근 측정 데이터가 없습니다.
						</div>
					)}
				</div>
			</div>
		</Modal>
	);
}
