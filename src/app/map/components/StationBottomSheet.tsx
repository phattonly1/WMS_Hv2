"use client";

import { AnimatePresence, motion, useDragControls } from "framer-motion";
import {
	BarChart3,
	Building2,
	Calendar,
	ChevronDown,
	ChevronUp,
	Droplets,
	History,
	Settings2,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	parseStationArray,
	RIVER_CONFIG,
	RIVER_ICONS,
	type Station,
} from "../stationData";
import { getRealtimeWaterQuality } from "../actions";
import type { RealtimeWaterQuality } from "../nierStationMap";

interface StationBottomSheetProps {
	station: Station | null;
	onClose: () => void;
	onOpenWaterQuality?: (station: Station) => void;
}

export function StationBottomSheet({
	station,
	onClose,
	onOpenWaterQuality,
}: StationBottomSheetProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const dragControls = useDragControls();

	// 실시간 수질 데이터 상태 (하단 피크 칩 표시용)
	const [waterQualityData, setWaterQualityData] = useState<{
		latest: RealtimeWaterQuality | null;
		history: RealtimeWaterQuality[];
	} | null>(null);

	// 측정소가 바뀌면 접힌 상태(Peek)로 시작 & 백그라운드 선제 호출(Prefetch)
	useEffect(() => {
		if (station) {
			setIsExpanded(false);

			// 국가망(type === 'station')일 때 백그라운드에서 24시간 실시간 수질 데이터 선제 수신
			if (station.type === "station") {
				getRealtimeWaterQuality(station.name)
					.then((res) => {
						setWaterQualityData({
							latest: res.latest,
							history: res.history,
						});
					})
					.catch(() => {
						setWaterQualityData(null);
					});
			} else {
				setWaterQualityData(null);
			}
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
	const instruments = parseStationArray<string>(station.instruments);
	const isSimpleModal = station.type === "small" || station.type === "poi";

	return (
		<AnimatePresence>
			<div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+14px)] z-[1200] pointer-events-none flex justify-center px-3.5">
				{/* 확장 상태일 때 뒷배경 딤(Dim) 오버레이 */}
				{!isSimpleModal && isExpanded && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setIsExpanded(false)}
						className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto z-[-1]"
					/>
				)}

				{/* 플로팅 글래스 카드 컨테이너 (아일랜드 모던 글래스) */}
				<motion.div
					drag="y"
					dragControls={dragControls}
					dragListener={false}
					dragConstraints={{ top: 0, bottom: 0 }}
					dragElastic={{ top: 0.1, bottom: 0.6 }}
					onDragEnd={(_, info) => {
						if (info.offset.y > 80 || info.velocity.y > 400) {
							if (!isSimpleModal && isExpanded) {
								setIsExpanded(false);
							} else {
								onClose();
							}
						} else if (
							!isSimpleModal &&
							(info.offset.y < -40 || info.velocity.y < -250)
						) {
							setIsExpanded(true);
						}
					}}
					initial={{ y: 80, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 80, opacity: 0 }}
					transition={{ type: "spring", damping: 28, stiffness: 320 }}
					className={`pointer-events-auto w-full max-w-md rounded-3xl bg-white/95 dark:bg-[#111115]/95 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-black/[0.08] dark:border-white/10 flex flex-col transition-[max-height] duration-300 ease-out overflow-hidden ${
						isSimpleModal
							? "max-h-[110px]"
							: isExpanded
								? "max-h-[80vh]"
								: "max-h-[290px]"
					}`}
				>
					{/* 상단 드래그 핸들 영역 */}
					<div
						onPointerDown={(e) => dragControls.start(e)}
						onClick={() => {
							if (!isSimpleModal) setIsExpanded(!isExpanded);
						}}
						className="w-full pt-2.5 pb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
					>
						<div className="w-10 h-1.5 rounded-full bg-slate-400/50 hover:bg-slate-500/60 transition-colors" />
					</div>

					{isSimpleModal ? (
						/* 소규모 감시망 & 관심지점 통합 심플 모달 (이름만 표시) */
						<div className="px-5 pt-1.5 pb-4 flex items-center justify-between gap-3">
							<h3 className="text-[16px] font-black text-slate-950 dark:text-white tracking-tight truncate break-keep">
								{station.name}
							</h3>
							<button
								type="button"
								onClick={onClose}
								aria-label="닫기"
								className="w-8 h-8 rounded-xl bg-black/[0.05] hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 flex items-center justify-center active:scale-95 transition-all border border-black/[0.06] dark:border-white/10 shrink-0"
							>
								<X size={16} strokeWidth={2.5} />
							</button>
						</div>
					) : (
						<>
							{/* 1. 상단 타이틀 & 뱃지 & 컨트롤 */}
							<div className="px-4 pt-1 pb-2 flex items-start justify-between gap-2.5">
								<div className="flex items-center gap-2.5 min-w-0">
									<div
										className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
										style={{ backgroundColor: config.color }}
									>
										<Icon size={20} strokeWidth={2.2} />
									</div>

									<div className="min-w-0">
										<div className="flex items-center gap-1.5">
											<span
												className="text-[9.5px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider text-white"
												style={{ backgroundColor: config.color }}
											>
												{config.label}
											</span>
											<span className="flex items-center gap-1 text-[9.5px] font-black text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-white/10 px-1.5 py-0.5 rounded-md border border-white/60 dark:border-white/10">
												<Building2 size={10} className="text-slate-500 dark:text-slate-400" />
												{station.office || "한강유역환경청"}
											</span>
										</div>
										<h3 className="text-[16px] font-black text-slate-950 dark:text-white tracking-tight truncate mt-0.5">
											{station.name}
										</h3>
									</div>
								</div>

								{/* 접기/펼치기 & 닫기 버튼 */}
								<div className="flex items-center gap-1 shrink-0">
									<button
										onClick={() => setIsExpanded(!isExpanded)}
										aria-label={isExpanded ? "접기" : "더보기"}
										className="w-8 h-8 rounded-xl bg-black/[0.05] hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 flex items-center justify-center active:scale-95 transition-all border border-black/[0.06] dark:border-white/10"
									>
										{isExpanded ? (
											<ChevronDown size={16} strokeWidth={2.5} />
										) : (
											<ChevronUp size={16} strokeWidth={2.5} />
										)}
									</button>
									<button
										onClick={onClose}
										aria-label="닫기"
										className="w-8 h-8 rounded-xl bg-black/[0.05] hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 flex items-center justify-center active:scale-95 transition-all border border-black/[0.06] dark:border-white/10"
									>
										<X size={16} strokeWidth={2.5} />
									</button>
								</div>
							</div>

							{/* 2. 스마트 3분할 핵심 요약 피크 칩 */}
							<div className="px-4 py-1.5 grid grid-cols-3 gap-1.5 text-center">
								<div className="p-2 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 flex flex-col items-center justify-center">
									<span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
										<Building2
											size={11}
											className="text-slate-600 dark:text-slate-400"
										/>
										관할청
									</span>
									<span className="text-[11px] font-black text-slate-900 dark:text-white truncate w-full mt-0.5">
										{station.office || "한강유역환경청"}
									</span>
								</div>

								<div className="p-2 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 flex flex-col items-center justify-center">
									<span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
										<Calendar
											size={11}
											className="text-slate-600 dark:text-slate-400"
										/>
										최종설치
									</span>
									<span className="text-[11px] font-black text-slate-900 dark:text-white truncate w-full mt-0.5">
										{station.install_date
											? station.install_date.slice(0, 7)
											: "정보없음"}
									</span>
								</div>

								<div className="p-2 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 flex flex-col items-center justify-center">
									<span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
										<Settings2
											size={11}
											className="text-slate-600 dark:text-slate-400"
										/>
										보유장비
									</span>
									<span className="text-[11px] font-black text-slate-900 dark:text-white truncate w-full mt-0.5">
										총 {instruments.length}종
									</span>
								</div>
							</div>

							{/* 3. 액션 바 (실시간 수질분석 1/3 + 2열 콤팩트 미니 그리드 알약 칩 2/3) */}
							<div className="px-4 py-2 grid grid-cols-3 gap-1.5 items-stretch">
								{/* 1/3: 실시간 수질 분석 (클릭 시 24시간 그래프 모달 오픈) */}
								<button
									type="button"
									onClick={() => onOpenWaterQuality?.(station)}
									title="실시간 수질 24시간 추이 창 열기"
									className="col-span-1 min-h-[52px] rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 flex flex-col items-center justify-center gap-0.5 text-[11px] font-black active:scale-95 transition-all select-none shadow-xs group px-1"
								>
									<div className="flex items-center gap-1">
										<BarChart3
											size={14}
											strokeWidth={2.4}
											className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform"
										/>
										<span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
										<span className="text-[10px] font-bold">수질분석</span>
									</div>
									<div className="flex flex-col items-center leading-none mt-0.5">
										{waterQualityData?.latest?.wtrtp !== null &&
										waterQualityData?.latest?.wtrtp !== undefined ? (
											<span className="text-[9px] font-mono text-blue-600 dark:text-blue-300 font-bold">
												{waterQualityData.latest.wtrtp.toFixed(1)}℃
											</span>
										) : (
											<span className="text-[8.5px] font-mono text-blue-500/80 dark:text-blue-300/80">
												24h 추이
											</span>
										)}
										<span className="text-[8px] font-medium text-blue-500/70 dark:text-blue-400/70 mt-0.5">
											클릭시 창 열림 ↗
										</span>
									</div>
								</button>

								{/* 2/3: 기기 알약 칩 (정밀 4x2 그리드, 1줄 truncate) */}
								<div className="col-span-2 min-h-[50px] bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/10 rounded-2xl p-1.5 shadow-xs flex items-center">
									<div className="w-full grid grid-cols-4 gap-1 items-center">
										{instruments.length > 0 ? (
											instruments.slice(0, 8).map((inst, i) => {
												const isRetired = inst.trim().endsWith("(X)");
												const displayName = isRetired
													? inst.replace(/\(X\)$/, "").trim()
													: inst;
												return (
													<span
														key={i}
														title={displayName}
														className={`px-1 py-0.5 rounded-md text-[9px] font-black tracking-tight text-center truncate border ${
															isRetired
																? "bg-slate-200/50 dark:bg-white/5 text-slate-400 border-slate-300/40 dark:border-white/5 line-through"
																: "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-black/[0.06] dark:border-white/10 shadow-2xs"
														}`}
													>
														{displayName}
													</span>
												);
											})
										) : (
											<span className="col-span-4 text-[10px] text-slate-400 dark:text-slate-500 font-bold text-center">
												장비 정보 없음
											</span>
										)}
									</div>
								</div>
							</div>

							{/* 4. 확장 영역 (주요 연혁 전용 노출) */}
							{isExpanded && (
								<div className="flex-1 flex flex-col overflow-hidden border-t border-black/[0.08] dark:border-white/10 pt-2.5 pb-3">
									<div className="px-4 pb-2 flex items-center justify-between">
										<span className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
											<History size={13} className="text-indigo-600 dark:text-indigo-400" />
											주요 연혁 ({history.length})
										</span>
									</div>

									{/* 연혁 타임라인 목록 */}
									<div className="flex-1 overflow-y-auto px-4 space-y-1.5 custom-scrollbar overscroll-contain">
										{history.length > 0 ? (
											history.map((h, i) => (
												<div
													key={i}
													className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/10 flex items-start gap-2.5 text-xs shadow-2xs"
												>
													<span className="font-mono font-black text-indigo-600 dark:text-indigo-400 shrink-0 min-w-[70px]">
														{h.date}
													</span>
													<span className="text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
														{h.desc}
													</span>
												</div>
											))
										) : (
											<div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 font-bold">
												등록된 연혁 정보가 없습니다.
											</div>
										)}
									</div>
								</div>
							)}
						</>
					)}
				</motion.div>
			</div>
		</AnimatePresence>
	);
}
