"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Check, ChevronDown, Droplets } from "lucide-react";
import type { RealtimeWaterQuality } from "../nierStationMap";
import { Modal } from "@/components/ui/modal";

interface WaterQualityChartModalProps {
	isOpen: boolean;
	onClose: () => void;
	stationName: string;
	data: {
		latest: RealtimeWaterQuality | null;
		history: RealtimeWaterQuality[];
	} | null;
	isLoading: boolean;
}

type MetricKey = "wtrtp" | "wqi" | "toc" | "tp" | "tn" | "ph" | "doc" | "ec" | "tur";

interface MetricConfig {
	key: MetricKey;
	label: string;
	unit: string;
	color: string;
	decimals: number;
}

const METRIC_CONFIGS: MetricConfig[] = [
	{ key: "wtrtp", label: "수온", unit: "℃", color: "#38bdf8", decimals: 1 },
	{ key: "wqi", label: "WQI", unit: "점", color: "#2563eb", decimals: 0 },
	{ key: "toc", label: "TOC", unit: "mg/L", color: "#10b981", decimals: 2 },
	{ key: "tp", label: "TP(총인)", unit: "mg/L", color: "#f59e0b", decimals: 3 },
	{ key: "tn", label: "TN(총질소)", unit: "mg/L", color: "#60a5fa", decimals: 3 },
	{ key: "ph", label: "pH", unit: "", color: "#f43f5e", decimals: 2 },
	{ key: "doc", label: "DO(용존산소)", unit: "mg/L", color: "#06b6d4", decimals: 1 },
	{ key: "ec", label: "EC(전도도)", unit: "μS/cm", color: "#059669", decimals: 0 },
	{ key: "tur", label: "탁도", unit: "NTU", color: "#fbbf24", decimals: 1 },
];

export function WaterQualityChartModal({
	isOpen,
	onClose,
	stationName,
	data,
	isLoading,
}: WaterQualityChartModalProps) {
	const [activeMetric, setActiveMetric] = useState<MetricKey>("wtrtp");
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// 드롭다운 외부 클릭 시 닫기
	useEffect(() => {
		const handleOutsideClick = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		};
		if (isDropdownOpen) {
			document.addEventListener("mousedown", handleOutsideClick);
		}
		return () => {
			document.removeEventListener("mousedown", handleOutsideClick);
		};
	}, [isDropdownOpen]);

	// 모달 닫힐 때 드롭다운도 닫기
	useEffect(() => {
		if (!isOpen) setIsDropdownOpen(false);
	}, [isOpen]);

	const selectedConfig = useMemo(
		() => METRIC_CONFIGS.find((m) => m.key === activeMetric) || METRIC_CONFIGS[0]!,
		[activeMetric],
	);

	// 유효한 실측 데이터가 존재하는 최근 24개 시간대 추출
	const recent24h = useMemo(() => {
		if (!data?.history || data.history.length === 0) return [];
		// 이미 유효한 레코드 중 뒤에서 최대 24개
		const validList = data.history.filter((item) => {
			return item.ph !== null || item.wtrtp !== null || item.doc !== null || item.toc !== null;
		});
		return validList.slice(-24);
	}, [data]);

	// 차트 SVG 좌표 계산
	const chartData = useMemo(() => {
		if (recent24h.length === 0) return null;

		const values = recent24h
			.map((item) => item[activeMetric] as number | null)
			.filter((v): v is number => v !== null && !Number.isNaN(v));

		if (values.length === 0) return null;

		const minVal = Math.min(...values);
		const maxVal = Math.max(...values);
		const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

		const svgWidth = 320;
		const svgHeight = 120;
		const padY = 16;
		const usableHeight = svgHeight - padY * 2;

		const points = recent24h.map((item, idx) => {
			const x = (idx / (recent24h.length - 1 || 1)) * svgWidth;
			const val = item[activeMetric] as number | null;
			let y = svgHeight / 2;
			if (val !== null && !Number.isNaN(val)) {
				y = svgHeight - padY - ((val - minVal) / range) * usableHeight;
			}
			// 시간 라벨: "2026-10-30 02h" -> "02h"
			const rawDt = item.measureDt || "";
			const timeLabel = rawDt.includes(" ") ? rawDt.split(" ")[1] : rawDt.slice(-3);
			return { x, y, val, timeLabel, fullDt: item.measureDt };
		});

		// SVG Path 생성
		const pathD = points.reduce((acc, pt, i) => {
			return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
		}, "");

		// 그라디언트 채우기용 하단 닫힌 Path
		const fillD = `${pathD} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

		return {
			minVal,
			maxVal,
			avgVal: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(
				selectedConfig.decimals,
			),
			points,
			pathD,
			fillD,
			svgWidth,
			svgHeight,
		};
	}, [recent24h, activeMetric, selectedConfig]);

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={`${stationName} 실시간 수질`}
			subtitle="NIER 24시간 실시간 모니터링 추이"
			icon={Droplets}
			contentClassName="p-3 sm:p-5 overflow-y-auto"
		>
			<div className="space-y-3 text-[11px]">
				{/* 1. 커스텀 모던 프리미엄 드롭다운 */}
				<div ref={dropdownRef} className="relative z-30">
					{/* 드롭다운 트리거 버튼 */}
					<button
						type="button"
						onClick={() => setIsDropdownOpen((prev) => !prev)}
						className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#16161c] border border-slate-200/90 dark:border-white/10 shadow-xs hover:border-blue-400 dark:hover:border-blue-500/50 transition-all select-none active:scale-[0.99] group"
					>
						<div className="flex items-center gap-2.5 min-w-0">
							<div
								className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105"
								style={{ backgroundColor: `${selectedConfig.color}20` }}
							>
								<span
									className="w-2.5 h-2.5 rounded-full"
									style={{ backgroundColor: selectedConfig.color }}
								/>
							</div>
							<div className="flex flex-col text-left leading-tight min-w-0">
								<span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500">
									선택된 수질 지표
								</span>
								<span className="text-[12px] font-black text-slate-900 dark:text-white truncate">
									{selectedConfig.label}
								</span>
							</div>
						</div>

						<div className="flex items-center gap-2 shrink-0">
							{data?.latest && (
								<div className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-center gap-1 font-mono">
									<span className="text-[9px] text-slate-400">현재</span>
									<span
										className="text-[11px] font-black"
										style={{ color: selectedConfig.color }}
									>
										{data.latest[activeMetric] !== null &&
										!Number.isNaN(data.latest[activeMetric] as number)
											? `${(data.latest[activeMetric] as number).toFixed(selectedConfig.decimals)} ${selectedConfig.unit}`
											: "점검중"}
									</span>
								</div>
							)}
							<div
								className={`w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 transition-transform duration-200 ${
									isDropdownOpen ? "rotate-180 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : ""
								}`}
							>
								<ChevronDown size={14} strokeWidth={2.4} />
							</div>
						</div>
					</button>

					{/* 드롭다운 옵션 메뉴 (팝오버) */}
					{isDropdownOpen && (
						<div className="absolute left-0 right-0 top-[calc(100%+6px)] p-1.5 rounded-2xl bg-white/95 dark:bg-[#16161c]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] max-h-[260px] overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150 custom-scrollbar overscroll-contain">
							<div className="px-2 py-1 text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
								<span>수질 항목 목록</span>
								<span>9개 지표</span>
							</div>
							{METRIC_CONFIGS.map((m) => {
								const isSelected = activeMetric === m.key;
								const currentVal = data?.latest
									? (data.latest[m.key] as number | null)
									: null;

								return (
									<button
										key={m.key}
										type="button"
										onClick={() => {
											setActiveMetric(m.key);
											setIsDropdownOpen(false);
										}}
										className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between transition-all text-left ${
											isSelected
												? "bg-blue-50 dark:bg-blue-950/50 text-blue-950 dark:text-blue-100 font-black border border-blue-200/70 dark:border-blue-800/60 shadow-2xs"
												: "hover:bg-slate-100/80 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-bold border border-transparent"
										}`}
									>
										<div className="flex items-center gap-2 min-w-0">
											<span
												className="w-2 h-2 rounded-full shrink-0"
												style={{ backgroundColor: m.color }}
											/>
											<span className="text-[11.5px] truncate">{m.label}</span>
											<span className="text-[9.5px] font-mono text-slate-400 dark:text-slate-500">
												{m.unit}
											</span>
										</div>

										<div className="flex items-center gap-2 shrink-0">
											{currentVal !== null && !Number.isNaN(currentVal) ? (
												<span
													className={`text-[10.5px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
														isSelected
															? "bg-blue-600 text-white dark:bg-blue-500"
															: "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
													}`}
												>
													{currentVal.toFixed(m.decimals)} {m.unit}
												</span>
											) : (
												<span className="text-[9.5px] text-slate-400 font-mono">
													-
												</span>
											)}
											{isSelected && (
												<Check
													size={13}
													strokeWidth={2.8}
													className="text-blue-600 dark:text-blue-400"
												/>
											)}
										</div>
									</button>
								);
							})}
						</div>
					)}
				</div>

				{/* 2. 메인 차트 영역 (초경량 반응형 SVG) */}
				<div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-[#16161c] border border-slate-200/80 dark:border-white/10 space-y-2">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-1.5 min-w-0">
							<span
								className="w-2.5 h-2.5 rounded-full shrink-0"
								style={{ backgroundColor: selectedConfig.color }}
							/>
							<span className="text-xs font-black text-slate-900 dark:text-white truncate">
								{selectedConfig.label} 24h 변동 추이
							</span>
							<span className="text-[10px] font-mono text-slate-400 shrink-0">
								({selectedConfig.unit || "무차원"})
							</span>
						</div>

						{data?.latest && (
							<div className="flex items-center gap-1 shrink-0 text-right whitespace-nowrap">
								<span className="text-[10px] text-slate-400">최신:</span>
								<span
									className="text-xs font-black font-mono"
									style={{ color: selectedConfig.color }}
								>
									{data.latest[activeMetric] !== null &&
									!Number.isNaN(data.latest[activeMetric] as number)
										? `${(data.latest[activeMetric] as number).toFixed(selectedConfig.decimals)} ${selectedConfig.unit}`
										: "점검중"}
								</span>
							</div>
						)}
					</div>

					{/* 로딩 인디케이터 */}
					{isLoading && (
						<div className="h-32 flex flex-col items-center justify-center gap-2 text-slate-400">
							<div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
							<span className="text-[10.5px]">실시간 24시간 데이터 수신 중...</span>
						</div>
					)}

					{/* 차트 렌더링 */}
					{!isLoading && chartData && (
						<div className="space-y-1 pt-1">
							<div className="w-full relative h-[120px] flex items-center justify-center">
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
												stopOpacity="0.3"
											/>
											<stop
												offset="100%"
												stopColor={selectedConfig.color}
												stopOpacity="0.0"
											/>
										</linearGradient>
									</defs>

									{/* 수평 가이드선 3줄 */}
									<line
										x1="0"
										y1="16"
										x2={chartData.svgWidth}
										y2="16"
										stroke="currentColor"
										strokeDasharray="3 3"
										className="text-slate-200 dark:text-white/5"
									/>
									<line
										x1="0"
										y1="60"
										x2={chartData.svgWidth}
										y2="60"
										stroke="currentColor"
										strokeDasharray="3 3"
										className="text-slate-200 dark:text-white/5"
									/>
									<line
										x1="0"
										y1="104"
										x2={chartData.svgWidth}
										y2="104"
										stroke="currentColor"
										strokeDasharray="3 3"
										className="text-slate-200 dark:text-white/5"
									/>

									{/* 배경 그라디언트 채우기 */}
									<path d={chartData.fillD} fill={`url(#grad-${activeMetric})`} />

									{/* 트렌드 곡선 */}
									<path
										d={chartData.pathD}
										fill="none"
										stroke={selectedConfig.color}
										strokeWidth="2.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>

									{/* 최신 포인트 강조 펄스 닷 */}
									{chartData.points.length > 0 && (
										<circle
											cx={chartData.points[chartData.points.length - 1]!.x}
											cy={chartData.points[chartData.points.length - 1]!.y}
											r="4"
											fill={selectedConfig.color}
											stroke="#ffffff"
											strokeWidth="2"
										/>
									)}
								</svg>
							</div>

							{/* 하단 X축 시간 라벨 (-23h ~ 0h 상대 시간 및 실제 시각 표기) */}
							<div className="flex justify-between items-center text-[9px] font-mono text-slate-400 px-0.5 pt-1">
								<span title={chartData.points[0]?.timeLabel}>
									-23h
								</span>
								<span title={chartData.points[Math.floor(chartData.points.length / 2)]?.timeLabel}>
									-12h
								</span>
								<span className="font-bold text-slate-700 dark:text-slate-200" title={chartData.points[chartData.points.length - 1]?.timeLabel}>
									0h (최신)
								</span>
							</div>

							{/* 통계 요약 (최고, 최저, 평균) */}
							<div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200/60 dark:border-white/5 text-center">
								<div className="p-1 rounded-lg bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5">
									<span className="text-[9px] text-slate-400 block">최저</span>
									<span className="text-[10.5px] font-mono font-bold text-slate-800 dark:text-slate-200">
										{chartData.minVal.toFixed(selectedConfig.decimals)} {selectedConfig.unit}
									</span>
								</div>
								<div className="p-1 rounded-lg bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5">
									<span className="text-[9px] text-slate-400 block">평균</span>
									<span className="text-[10.5px] font-mono font-bold text-slate-800 dark:text-slate-200">
										{chartData.avgVal} {selectedConfig.unit}
									</span>
								</div>
								<div className="p-1 rounded-lg bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5">
									<span className="text-[9px] text-slate-400 block">최고</span>
									<span className="text-[10.5px] font-mono font-bold text-slate-800 dark:text-slate-200">
										{chartData.maxVal.toFixed(selectedConfig.decimals)} {selectedConfig.unit}
									</span>
								</div>
							</div>
						</div>
					)}

					{/* 데이터 없음 */}
					{!isLoading && !chartData && (
						<div className="h-28 flex items-center justify-center text-slate-400 text-xs">
							해당 항목의 최근 측정 데이터가 없습니다.
						</div>
					)}
				</div>

				{/* 3. 최근 6시간 텍스트 테이블 리스트 */}
				{recent24h.length > 0 && (
					<div className="space-y-1">
						<span className="text-[10.5px] font-semibold text-slate-700 dark:text-slate-300 block">
							시간대별 기록 (최근 6시간)
						</span>
						<div className="rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-slate-900/60">
							{recent24h
								.slice(-6)
								.reverse()
								.map((item, idx) => {
									const val = item[activeMetric] as number | null;
									return (
										<div
											key={idx}
											className="px-3 py-1.5 flex items-center justify-between text-[10.5px]"
										>
											<span className="font-mono text-slate-500 dark:text-slate-400">
												{item.measureDt}
											</span>
											<span className="font-mono font-bold text-slate-800 dark:text-slate-200">
												{val !== null && !Number.isNaN(val)
													? `${val.toFixed(selectedConfig.decimals)} ${selectedConfig.unit}`
													: "점검중"}
											</span>
										</div>
									);
								})}
						</div>
					</div>
				)}
			</div>
		</Modal>
	);
}
