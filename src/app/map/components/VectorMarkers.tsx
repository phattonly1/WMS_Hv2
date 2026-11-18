"use client";

import React from "react";
import type {
	RealtimeWaterQuality,
	WaterQualityMetricKey,
} from "../nierStationMap";
import type { Station, WaterChipMode } from "../stationData";

// 전일(누적) 평균 대비 50% 이하 급감 또는 150% 이상 급등 판단 헬퍼
interface MetricAnomalyInfo {
	key: WaterQualityMetricKey;
	label: string;
	currentVal: number;
	prevAvgVal: number;
	ratio: number; // current / prevAvg (예: 0.45 -> 45%, 1.65 -> 165%)
	diffPercent: number; // (ratio - 1) * 100
	type: "low" | "high"; // low: <= 50%, high: >= 150%
}

const METRIC_LABELS: Record<WaterQualityMetricKey, string> = {
	wtrtp: "수온",
	ph: "pH",
	doc: "DO",
	ec: "EC",
	toc: "TOC",
	tur: "탁도",
	tp: "TP",
	tn: "TN",
	wqi: "WQI",
	chla: "클로로필-a",
};

function evaluateAnomaly(
	waterQuality: RealtimeWaterQuality | null | undefined,
	key: WaterQualityMetricKey,
): MetricAnomalyInfo | null {
	if (!waterQuality?.prevAvg) return null;
	const cur = waterQuality[key];
	const avg = waterQuality.prevAvg[key];
	if (
		typeof cur !== "number" ||
		typeof avg !== "number" ||
		Number.isNaN(cur) ||
		Number.isNaN(avg) ||
		avg <= 0
	) {
		return null;
	}
	const ratio = cur / avg;
	if (ratio <= 0.5) {
		return {
			key,
			label: METRIC_LABELS[key] || key.toUpperCase(),
			currentVal: cur,
			prevAvgVal: avg,
			ratio,
			diffPercent: Math.round((ratio - 1) * 100),
			type: "low",
		};
	}
	if (ratio >= 1.5) {
		return {
			key,
			label: METRIC_LABELS[key] || key.toUpperCase(),
			currentVal: cur,
			prevAvgVal: avg,
			ratio,
			diffPercent: Math.round((ratio - 1) * 100),
			type: "high",
		};
	}
	return null;
}

// 1. 국가 측정소 마커
export const StationMarker = React.memo(function StationMarker({
	station,
	color,
	isSelected,
	waterQuality,
	chipMode = "default",
}: {
	station: Station;
	color: string;
	isSelected?: boolean;
	waterQuality?: RealtimeWaterQuality | null;
	chipMode?: WaterChipMode;
}) {
	const gradeColor =
		waterQuality?.grade === "우수" || waterQuality?.grade === "좋음"
			? "#10b981"
			: waterQuality?.grade === "양호"
				? "#06b6d4"
				: waterQuality?.grade === "보통"
					? "#2563eb"
					: waterQuality?.grade === "주의"
						? "#f59e0b"
						: waterQuality?.grade === "불량" || waterQuality?.grade === "경보"
							? "#ef4444"
							: "#64748b";

	// 1. 자동 상시 감시: EC 50% 이하 급감 또는 150% 이상 급등 여부
	const ecAnomaly = evaluateAnomaly(waterQuality, "ec");

	// 2. 전체 측정항목 중 50% 이하 또는 150% 이상인 모든 이상 항목 산출
	const allAnomalies: MetricAnomalyInfo[] = [];
	if (waterQuality?.prevAvg) {
		for (const key of Object.keys(METRIC_LABELS) as WaterQualityMetricKey[]) {
			const anom = evaluateAnomaly(waterQuality, key);
			if (anom) allAnomalies.push(anom);
		}
	}

	// EC 외에 다른 항목 중 50% 이하 또는 150% 이상인 항목들
	const otherAnomalies = allAnomalies.filter((d) => d.key !== "ec");
	const otherCount = otherAnomalies.length;

	// 현재 선택된 칩 모드(chipMode) 자체가 이상치인지 확인
	const selectedMetricKey: WaterQualityMetricKey | null =
		chipMode !== "default" && chipMode !== "none" ? chipMode : null;
	const selectedMetricAnomaly = selectedMetricKey
		? allAnomalies.find((d) => d.key === selectedMetricKey) || null
		: null;

	// 현재 칩에 직접 표시된 항목(선택된 지표 + 상시 표기되는 EC)을 제외한 '다른 항목' 이상 목록
	const unshownOtherAnomalies = allAnomalies.filter(
		(d) => d.key !== "ec" && d.key !== selectedMetricKey,
	);
	const unshownOtherCount = unshownOtherAnomalies.length;

	// 마커 센터 링 경고 펄스: EC 급감/급등 시 작동
	const hasEcWarning = Boolean(ecAnomaly);
	// 칩 자체 배경색 경고 여부:
	// - 기본(default) 모드일 때는 EC 또는 기타 이상이 있으면 경고 배경 표시
	// - 특정 수질 칩(TOC, TP, 탁도 등)을 선택했을 때는 '선택한 그 지표(또는 상시 감시 EC)'가 이상일 때만 칩 전체 배경을 경고색으로 칠함!
	//   (다른 항목만 이상일 때는 칩 배경은 정상 흰색/다크로 유지하고 우측 '+N' 배지만 주황색으로 표시해 혼동 방지)
	const isChipSelfWarning = selectedMetricKey
		? Boolean(selectedMetricAnomaly || ecAnomaly)
		: hasEcWarning || otherCount > 0;
	const chipWarningType: "low" | "high" | null = selectedMetricAnomaly
		? selectedMetricAnomaly.type
		: ecAnomaly
			? ecAnomaly.type
			: otherCount > 0
				? "high"
				: null;

	// 선택된 칩 모드에 따른 텍스트 계산
	const getChipText = (): string | null => {
		if (!waterQuality || chipMode === "none") return null;
		switch (chipMode) {
			case "default": {
				const parts: string[] = [];
				if (waterQuality.wtrtp != null)
					parts.push(`${waterQuality.wtrtp.toFixed(1)}°`);
				if (waterQuality.wqi != null) parts.push(`${waterQuality.wqi}점`);
				return parts.length > 0 ? parts.join(" | ") : null;
			}
			case "wtrtp":
				return waterQuality.wtrtp != null
					? `${waterQuality.wtrtp.toFixed(1)}℃`
					: null;
			case "wqi":
				return waterQuality.wqi != null
					? `${waterQuality.wqi}점`
					: waterQuality.grade || null;
			case "ph":
				return waterQuality.ph != null
					? `pH ${waterQuality.ph.toFixed(1)}`
					: null;
			case "doc":
				return waterQuality.doc != null
					? `${waterQuality.doc.toFixed(1)}mg/L`
					: null;
			case "ec":
				return waterQuality.ec != null
					? `${Math.round(waterQuality.ec)}µS`
					: null;
			case "toc":
				return waterQuality.toc != null
					? `${waterQuality.toc.toFixed(1)}mg/L`
					: null;
			case "tp":
				return waterQuality.tp != null
					? `TP ${waterQuality.tp.toFixed(3)}`
					: null;
			case "tn":
				return waterQuality.tn != null
					? `TN ${waterQuality.tn.toFixed(3)}`
					: null;
			case "tur":
				return waterQuality.tur != null
					? `${waterQuality.tur.toFixed(1)}NTU`
					: null;
			case "chla":
				return waterQuality.chla != null
					? `Chl-a ${waterQuality.chla.toFixed(1)}`
					: null;
			default:
				return null;
		}
	};

	const chipText = getChipText();
	// 마커 코어 링 색상: EC 급감 시 로즈 레드(#ef4444), EC 급등 시 앰버(#f59e0b), 평소엔 수계 기본 색상
	const ringColor = hasEcWarning
		? ecAnomaly?.type === "low"
			? "#ef4444"
			: "#f59e0b"
		: color;

	return (
		<div className="relative group cursor-pointer select-none hover:z-[9999]">
			{/* 1. 센터 관측 코어 - EC 50% 이하 급감 또는 150% 이상 급등 시 펄스 링 경고 */}
			<div className="relative w-0 h-0 flex items-center justify-center">
				<div className="relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-125">
					{(isSelected || hasEcWarning) && (
						<>
							<span
								className="absolute w-8 h-8 rounded-full animate-ping opacity-65 pointer-events-none"
								style={{ backgroundColor: ringColor }}
							/>
							<span
								className="absolute w-6 h-6 rounded-full opacity-35 pointer-events-none"
								style={{ backgroundColor: ringColor }}
							/>
						</>
					)}

					{/* 외곽 수계/경고 컬러 링 + 반투명 글래스 중심 */}
					<div
						className="w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm"
						style={{
							backgroundColor: hasEcWarning
								? ecAnomaly?.type === "low"
									? "rgba(255, 241, 242, 0.9)"
									: "rgba(254, 243, 199, 0.9)"
								: "rgba(255, 255, 255, 0.65)",
							border: `2.5px solid ${ringColor}`,
						}}
					>
						<div
							className="w-1.5 h-1.5 rounded-full"
							style={{ backgroundColor: ringColor }}
						/>
					</div>
				</div>

				{/* 2. 우측 다이렉트 텍스트 라벨 + 실시간 수질 미니 뱃지 (짝수 높이 h-5 고정으로 0.5px 걸침 방지 및 transform 블러 제거) */}
				<div className="absolute left-3.5 h-5 flex items-center gap-1 pointer-events-none select-none">
					<span
						style={{
							textShadow:
								"-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 5px rgba(255,255,255,0.95), 0 2px 4px rgba(0,0,0,0.25)",
						}}
						className={`text-[11px] leading-none font-black tracking-tight whitespace-nowrap ${
							hasEcWarning
								? ecAnomaly?.type === "low"
									? "text-rose-700"
									: "text-amber-700"
								: "text-slate-950"
						}`}
					>
						{station.name.replace(" 측정소", "")}
					</span>

					{/* 실시간 수질 미니 칩 (반투명 배경 레이어와 텍스트 분리로 PC 1x 모니터에서도 또렷한 렌더링 보장) */}
					{chipText && (
						<span className="relative inline-flex items-center h-[18px] px-1.5 rounded-full whitespace-nowrap">
							{/* 반투명 배경 전용 레이어 (선택한 수질 항목 자체가 이상이거나 EC 이상일 때만 전체 배경 경고색 적용) */}
							<span
								aria-hidden="true"
								className={`absolute inset-0 rounded-full shadow-xs border ${
									isChipSelfWarning
										? chipWarningType === "low"
											? "bg-rose-600/90 border-rose-400 ring-2 ring-rose-500/40"
											: "bg-amber-600/90 border-amber-300 ring-2 ring-amber-500/40"
										: "bg-white/85 dark:bg-slate-900/85 border-slate-300/90 dark:border-slate-600/90"
								}`}
							/>

							{/* 고선명 전면 텍스트 & 인디케이터 레이어 */}
							<span
								className={`relative z-10 inline-flex items-center gap-1 text-[10px] font-extrabold leading-none tracking-tight tabular-nums ${
									isChipSelfWarning
										? "text-white"
										: "text-slate-950 dark:text-white"
								}`}
							>
								<span
									className="w-1.5 h-1.5 rounded-full shrink-0"
									style={{
										backgroundColor: isChipSelfWarning ? "#ffffff" : gradeColor,
									}}
								/>
								<span>{chipText}</span>

								{/* 0) 선택된 단일 수질 칩(EC 제외) 자체가 급감/급등일 때 직접 ↓/↑% 표기 */}
								{selectedMetricAnomaly &&
									selectedMetricAnomaly.key !== "ec" && (
										<span className="ml-0.5 px-1 py-0.5 rounded bg-black/25 text-[9px] font-mono font-black tracking-tighter leading-none text-white">
											{selectedMetricAnomaly.type === "low" ? "↓" : "↑"}
											{Math.round(selectedMetricAnomaly.ratio * 100)}%
										</span>
									)}

								{/* 1) EC 급감(↓) 또는 급등(↑) 상시 표기 */}
								{ecAnomaly && (
									<span className="ml-0.5 px-1 py-0.5 rounded bg-black/25 text-[9px] font-mono font-black tracking-tighter leading-none text-white">
										{selectedMetricKey === "ec" ? "" : "EC "}
										{ecAnomaly.type === "low" ? "↓" : "↑"}
										{Math.round(ecAnomaly.ratio * 100)}%
									</span>
								)}

								{/* 2) 현재 칩에 표시되지 않은 '다른 항목'이 급감/급등일 때 '+N' 배지 표기 */}
								{unshownOtherCount > 0 && (
									<span
										className={`ml-0.5 px-1 py-0.5 rounded text-[9px] font-mono font-black tracking-tighter leading-none ${
											isChipSelfWarning
												? "bg-black/25 text-white"
												: "bg-amber-500 text-white"
										}`}
										title={`기타 이상 항목: ${unshownOtherAnomalies.map((d) => `${d.label}(${d.type === "low" ? "↓" : "↑"}${Math.round(d.ratio * 100)}%)`).join(", ")}`}
									>
										+{unshownOtherCount}
									</span>
								)}
							</span>
						</span>
					)}
				</div>

				{/* 3. 마우스 호버 시 상세 실시간 수질 툴팁 팝업 (모바일 화면 < md 및 터치 기기에서는 원천 차단) */}
				{waterQuality && (
					<div className="hidden md:[@media(hover:hover)_and_(pointer:fine)]:block invisible opacity-0 md:group-hover:visible md:group-hover:opacity-100 transition-all duration-150 pointer-events-none absolute left-0 bottom-4 mb-2 z-[9999] w-60 p-2.5 rounded-xl bg-slate-900/95 text-white backdrop-blur-md shadow-2xl border border-slate-700/80 text-[10px]">
						<div className="flex items-center justify-between border-b border-slate-700/70 pb-1.5 mb-1.5">
							<div className="flex items-center gap-1.5">
								<span
									className="w-2 h-2 rounded-full"
									style={{ backgroundColor: gradeColor }}
								/>
								<span className="font-black text-[11px] text-white">
									{station.name}
								</span>
							</div>
							<span className="text-[9px] text-slate-400 font-mono">
								{waterQuality.measureDt.replace(/^\d{4}-/, "")}
							</span>
						</div>

						{/* EC 이상 배너 (EC 급감/급등 시 상단 표시) */}
						{ecAnomaly && (
							<div
								className={`mb-1.5 px-2 py-1 rounded-lg border text-[9px] leading-tight ${
									ecAnomaly.type === "low"
										? "bg-rose-500/20 border-rose-500/40 text-rose-200"
										: "bg-amber-500/20 border-amber-500/40 text-amber-200"
								}`}
							>
								<div
									className={`font-black mb-0.5 ${
										ecAnomaly.type === "low" ? "text-rose-300" : "text-amber-300"
									}`}
								>
									{ecAnomaly.type === "low"
										? "🚨 EC 전일 평균 대비 50% 이하 급감"
										: "⚠️ EC 전일 평균 대비 150% 이상 급등"}
								</div>
								<div className="flex items-center justify-between font-mono">
									<span>
										현재 {Math.round(ecAnomaly.currentVal)} µS (전일평균{" "}
										{Math.round(ecAnomaly.prevAvgVal)} µS)
									</span>
									<span className="font-black">
										전일의 {Math.round(ecAnomaly.ratio * 100)}%
									</span>
								</div>
							</div>
						)}

						{/* EC 외에 다른 항목도 급감/급등 시 리스트 표시 */}
						{otherCount > 0 && (
							<div className="mb-1.5 px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[9px] leading-tight">
								<div className="font-black text-amber-300 mb-0.5">
									⚠ 기타 이상 항목 ({otherCount}건)
								</div>
								{otherAnomalies.map((d) => (
									<div
										key={d.key}
										className="flex items-center justify-between font-mono"
									>
										<span>
											{d.label}: {d.currentVal} (전일평균{" "}
											{Number(d.prevAvgVal.toFixed(2))})
										</span>
										<span className="font-black text-amber-300">
											{d.type === "low" ? "↓" : "↑"}
											{Math.round(d.ratio * 100)}%
										</span>
									</div>
								))}
							</div>
						)}

						<div className="grid grid-cols-2 gap-x-3 gap-y-1">
							{(
								[
									{
										key: "wtrtp" as const,
										label: "수온",
										unit: "℃",
										defaultCls: "text-sky-300",
									},
									{
										key: "ph" as const,
										label: "pH",
										unit: "",
										defaultCls: "text-emerald-300",
									},
									{
										key: "doc" as const,
										label: "DO",
										unit: "mg/L",
										defaultCls: "text-white",
									},
									{
										key: "ec" as const,
										label: "EC",
										unit: "µS",
										defaultCls: "text-white",
									},
									{
										key: "toc" as const,
										label: "TOC",
										unit: "mg/L",
										defaultCls: "text-white",
									},
									{
										key: "tur" as const,
										label: "탁도",
										unit: "NTU",
										defaultCls: "text-white",
									},
									{
										key: "tp" as const,
										label: "TP",
										unit: "mg/L",
										defaultCls: "text-white",
									},
									{
										key: "tn" as const,
										label: "TN",
										unit: "mg/L",
										defaultCls: "text-white",
									},
									{
										key: "chla" as const,
										label: "Chl-a",
										unit: "mg/m³",
										defaultCls: "text-lime-300",
									},
								] as const
							).map((row) => {
								const val = waterQuality[row.key];
								const anom = allAnomalies.find((d) => d.key === row.key);
								return (
									<div
										key={row.key}
										className={`flex justify-between items-center rounded px-1 -mx-1 ${
											anom
												? anom.type === "low"
													? "bg-rose-500/25 text-rose-200"
													: "bg-amber-500/25 text-amber-200"
												: ""
										}`}
									>
										<span className="text-slate-400">{row.label}</span>
										<span
											className={`font-bold ${
												anom
													? anom.type === "low"
														? "text-rose-300 font-black"
														: "text-amber-300 font-black"
													: row.defaultCls
											}`}
										>
											{val ?? "-"} {row.unit}
											{anom && (
												<span className="ml-0.5 text-[8.5px] font-mono">
													({anom.type === "low" ? "↓" : "↑"}
													{Math.round(anom.ratio * 100)}%)
												</span>
											)}
										</span>
									</div>
								);
							})}
						</div>
						{waterQuality.grade && (
							<div className="mt-1.5 pt-1 border-t border-slate-800 flex items-center justify-between text-[9.5px]">
								<span className="text-slate-400">실시간 수질지수</span>
								<span
									className="font-black px-1.5 py-0.5 rounded text-white"
									style={{ backgroundColor: gradeColor }}
								>
									{waterQuality.grade}{" "}
									{waterQuality.wqi ? `(${waterQuality.wqi})` : ""}
								</span>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
});

// 2. 소규모 감시망 마커 (미니 마이크로 다이아몬드 큐브 - 글래스 반투명)
export const SmallMarker = React.memo(function SmallMarker({
	station,
	color,
	isSelected,
}: {
	station: Station;
	color: string;
	isSelected?: boolean;
}) {
	// 소규모 전용 시안/에메랄드 포인트 컬러 (국가망 파랑과 확실한 대비)
	const smallColor = color === "#2563eb" ? "#059669" : color;

	return (
		<div className="relative group cursor-pointer select-none">
			{/* 정확한 GPS 좌표 중심(0,0)에 다이아몬드 큐브 고정 */}
			<div className="relative w-0 h-0 flex items-center justify-center">
				<div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-140">
					{/* 선택 시 마름모 펄스 */}
					{isSelected && (
						<span
							className="absolute w-5 h-5 rotate-45 animate-ping opacity-60 pointer-events-none rounded-[1px]"
							style={{ backgroundColor: smallColor }}
						/>
					)}

					{/* 미니 컴팩트 마름모(Diamond) 외곽 테두리 + 반투명 글래스 내부 */}
					<div
						className="w-2.5 h-2.5 rotate-45 flex items-center justify-center shadow-xs rounded-[1.5px]"
						style={{
							backgroundColor: "rgba(255, 255, 255, 0.75)",
							border: `1.5px solid ${smallColor}`,
						}}
					>
						{/* 중심 마이크로 코어 포인트 */}
						<div
							className="w-0.8 h-0.8 rounded-full"
							style={{ backgroundColor: smallColor }}
						/>
					</div>

					{/* 호버 시에만 나타나는 플로팅 미니 라벨 (모바일 화면 < md 및 터치 기기 숨김) */}
					<span
						style={{
							backgroundColor: "transparent",
							textShadow:
								"-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 5px rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.25)",
						}}
						className="hidden md:[@media(hover:hover)_and_(pointer:fine)]:block absolute left-1/2 -top-5 -translate-x-1/2 px-1 py-0.2 text-[9.5px] font-black text-slate-950 whitespace-nowrap opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none z-30 select-none"
					>
						{station.name}
					</span>
				</div>
			</div>
		</div>
	);
});

// 3. 관심 지점 (POI - 랜드마크 다이아몬드 스타 뱃지 - 글래스 반투명)
export const PoiMarker = React.memo(function PoiMarker({
	station,
	color,
	isSelected,
}: {
	station: Station;
	color: string;
	isSelected?: boolean;
}) {
	return (
		<div className="relative group cursor-pointer select-none">
			{/* 정확한 GPS 좌표 중심(0,0)에 아이콘 고정 */}
			<div className="relative w-0 h-0 flex items-center justify-center">
				<div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-120">
					{isSelected && (
						<span
							className="absolute w-7 h-7 rounded-full animate-ping opacity-60 pointer-events-none"
							style={{ backgroundColor: color }}
						/>
					)}
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="drop-shadow-xs"
					>
						<rect
							x="12"
							y="1"
							width="15"
							height="15"
							rx="3"
							transform="rotate(45 12 1)"
							fill={color}
							fillOpacity="0.6"
							stroke="white"
							strokeWidth="2"
						/>
						<path
							d="M12 7L13.2 10.2L16.5 10.5L14 12.7L14.7 16L12 14.3L9.3 16L10 12.7L7.5 10.5L10.8 10.2L12 7Z"
							fill="white"
						/>
					</svg>
				</div>

				<span
					style={{
						backgroundColor: "transparent",
						textShadow:
							"-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 5px rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.25)",
					}}
					className="absolute left-3.5 px-1 py-0.2 text-[10px] font-black text-rose-900 whitespace-nowrap pointer-events-none select-none"
				>
					{station.name}
				</span>
			</div>
		</div>
	);
});
