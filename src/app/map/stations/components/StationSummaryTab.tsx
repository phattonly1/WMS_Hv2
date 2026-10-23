"use client";

import {
	Building2,
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
	EQUIPMENT_PRESETS,
	parseStationArray,
	RIVER_CONFIG,
	type Station,
} from "../../stationData";
import { NATIONAL_STATION_ORDER_NAMES } from "../stationOrder";

// 모든 기호와 공백을 제거하여 순수 핵심 문자열만 추출 (예: "신천(국가망)" -> "신천국가망")
const normalizeStr = (str: string) => str.replace(/[^가-힣a-zA-Z0-9]/g, "");

// 앞부분 핵심 단어만 매칭하도록 헬퍼 함수
const getSortIndex = (stationName: string) => {
	const normalizedTarget = normalizeStr(stationName);

	// 1. 정확한 매칭 (정규화 후)
	let idx = NATIONAL_STATION_ORDER_NAMES.findIndex(
		(name) => normalizeStr(name) === normalizedTarget,
	);
	if (idx !== -1) return idx;

	// 2. 부분 매칭
	const baseTarget = normalizedTarget.replace(/소규모|국가망/g, "");
	idx = NATIONAL_STATION_ORDER_NAMES.findIndex((name) => {
		const baseName = normalizeStr(name).replace(/소규모|국가망/g, "");
		return baseName.includes(baseTarget) || baseTarget.includes(baseName);
	});

	return idx !== -1 ? idx : 999;
};

// 원주청 관할 국가망 (평창강~화천)
const WONJU_STATIONS = [
	"평창강",
	"단양",
	"충주",
	"달천",
	"원주",
	"인제",
	"서상",
	"의암호",
	"화천",
];

const getOfficeConfig = (stationName: string) => {
	const cleanName = normalizeStr(stationName).replace(/소규모|국가망/g, "");
	const isWonju = WONJU_STATIONS.some(
		(w) => cleanName.includes(w) || w.includes(cleanName),
	);
	return isWonju
		? { label: "원주청", bgClass: "emerald" }
		: { label: "한강청", bgClass: "blue" };
};

interface StationSummaryTabProps {
	stations: Station[];
}

export function StationSummaryTab({ stations }: StationSummaryTabProps) {
	const [selectedStationId, setSelectedStationId] = useState<string | null>(
		null,
	);
	const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

	const filteredStations = useMemo(() => {
		if (!stations) return [];
		const filtered = stations.filter((station) => station.type === "station");

		return [...filtered].sort((a, b) => {
			const indexA = getSortIndex(a.name);
			const indexB = getSortIndex(b.name);
			if (indexA === indexB) return a.name.localeCompare(b.name, "ko-KR");
			return indexA - indexB;
		});
	}, [stations]);

	// 모바일에서 선택된 측정소 (기본값: 첫 번째 측정소)
	const currentStation = useMemo(() => {
		if (!filteredStations || filteredStations.length === 0) return null;
		return (
			filteredStations.find((s) => s.id === selectedStationId) ||
			filteredStations[0]
		);
	}, [filteredStations, selectedStationId]);

	const currentIndex = useMemo(() => {
		if (!currentStation || !filteredStations) return 0;
		const idx = filteredStations.findIndex(
			(s) => (s.id || s.name) === (currentStation.id || currentStation.name),
		);
		return idx !== -1 ? idx : 0;
	}, [filteredStations, currentStation]);

	const handlePrevStation = () => {
		if (filteredStations.length === 0) return;
		const prevIdx =
			(currentIndex - 1 + filteredStations.length) % filteredStations.length;
		const target = filteredStations[prevIdx];
		setSelectedStationId(target?.id ?? null);
	};

	const handleNextStation = () => {
		if (filteredStations.length === 0) return;
		const nextIdx = (currentIndex + 1) % filteredStations.length;
		const target = filteredStations[nextIdx];
		setSelectedStationId(target?.id ?? null);
	};

	const equipmentStats = useMemo(() => {
		const stats: Record<string, number> = {};
		const catStats: Record<
			string,
			{
				total: number;
				manufacturers: Record<
					string,
					{ total: number; models: Record<string, number> }
				>;
			}
		> = {
			standard: { total: 0, manufacturers: {} },
			toc: { total: 0, manufacturers: {} },
			tn: { total: 0, manufacturers: {} },
			tp: { total: 0, manufacturers: {} },
			bio: { total: 0, manufacturers: {} },
			algae: { total: 0, manufacturers: {} },
			vocs: { total: 0, manufacturers: {} },
		};

		const modelToMan: Record<string, string> = {};
		EQUIPMENT_PRESETS.forEach((p) => {
			modelToMan[p.model] = p.manufacturer;
		});

		filteredStations.forEach((station) => {
			const parsedInsts = parseStationArray<string>(station.instruments);

			parsedInsts.forEach((inst: string) => {
				if (!inst || typeof inst !== "string") return;

				const val = inst.trim();
				const isRetired = val.endsWith("(X)") || val.endsWith("(x)");
				if (isRetired) return;

				if (val && val !== "확인필요" && val !== "-") {
					stats[val] = (stats[val] || 0) + 1;

					const upper = val.toUpperCase();
					let catKey = "";
					if (
						upper.includes("EXO") ||
						upper.includes("YSI") ||
						upper.includes("6600")
					)
						catKey = "standard";
					else if (upper.includes("TOC") || upper.includes("HATA"))
						catKey = "toc";
					else if (upper.includes("TN") || upper.includes("HATN"))
						catKey = "tn";
					else if (upper.includes("TP") || upper.includes("HATP"))
						catKey = "tp";
					else if (
						upper.includes("ITOX") ||
						upper.includes("TOX") ||
						upper.includes("EASYCHEM") ||
						upper.includes("DAPHNIA")
					)
						catKey = "bio";
					else if (upper.includes("ALGAE") || upper.includes("TRILUX"))
						catKey = "algae";
					else if (upper.includes("CLARUS")) catKey = "vocs";

					if (catKey) {
						const targetStat = catStats[catKey];
						if (targetStat) {
							const manufacturer = modelToMan[val] || "미분류";
							targetStat.total++;

							const mfs = targetStat.manufacturers;
							if (!mfs[manufacturer]) {
								mfs[manufacturer] = {
									total: 0,
									models: {},
								};
							}
							const mfData = mfs[manufacturer];
							if (mfData) {
								mfData.total++;
								mfData.models[val] = (mfData.models[val] || 0) + 1;
							}
						}
					}
				}
			});
		});

		return {
			totalEquipments: Object.values(stats).reduce((a, b) => a + b, 0),
			catStats,
		};
	}, [filteredStations]);

	const CATEGORY_CHIPS = [
		{
			key: "standard",
			label: "일반",
			bg: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
		},
		{
			key: "toc",
			label: "TOC",
			bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
		},
		{
			key: "tn",
			label: "TN",
			bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
		},
		{
			key: "tp",
			label: "TP",
			bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
		},
		{
			key: "bio",
			label: "생물",
			bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
		},
		{
			key: "algae",
			label: "조류",
			bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
		},
		{
			key: "vocs",
			label: "VOCs",
			bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
		},
	];

	return (
		<div className="space-y-2.5 animate-in fade-in duration-200 max-w-7xl mx-auto w-full">
			{/* ============================================================ */}
			{/* 📊 상단 기기 요약 알약 칩 바 (모바일/데스크톱 공통 표시) */}
			{/* ============================================================ */}
			<div className="bg-white dark:bg-slate-900/90 p-1.5 sm:p-2 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-center sm:justify-start gap-1 overflow-x-auto thin-scrollbar">
				<div className="flex items-center gap-1 shrink-0 py-0.5">
					<div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex flex-col items-center justify-center shrink-0 shadow-2xs">
						<span className="text-[8px] font-black leading-none opacity-80 mb-0.5">
							총계
						</span>
						<span className="font-mono text-[10.5px] font-black leading-none">
							{equipmentStats.totalEquipments}
						</span>
					</div>

					{CATEGORY_CHIPS.map((cat) => (
						<div
							key={cat.key}
							className={`w-8 h-8 rounded-lg border flex flex-col items-center justify-center shrink-0 ${cat.bg}`}
						>
							<span className="text-[8px] font-black leading-none opacity-80 mb-0.5">
								{cat.label}
							</span>
							<span className="font-mono text-[10.5px] font-black leading-none">
								{equipmentStats.catStats[cat.key]?.total || 0}
							</span>
						</div>
					))}
				</div>
			</div>

			{/* ============================================================ */}
			{/* 📱 모바일 전용 뷰 (< md): [3안] 44px 슬림 헤더 스위처 + 바텀시트 + 와이드 기기 카드 */}
			{/* ============================================================ */}
			<div className="block md:hidden space-y-2">
				{currentStation &&
					(() => {
						const station = currentStation;
						const riverCfg = RIVER_CONFIG[station.river] || {
							label: "기타",
							color: "#2563eb",
						};
						const officeCfg = getOfficeConfig(station.name);
						const models = parseStationArray<string>(station.instruments);

						const getCatModels = (keywords: string[]) =>
							models.filter(
								(m) =>
									typeof m === "string" && keywords.some((k) => m.includes(k)),
							);

						const cats = [
							{
								key: "standard",
								label: "일반항목",
								color: "indigo",
								items: getCatModels(["EXO", "YSI", "6600"]),
							},
							{
								key: "toc",
								label: "TOC",
								color: "emerald",
								items: getCatModels(["TOC", "HATA"]),
							},
							{
								key: "tn",
								label: "TN",
								color: "indigo",
								items: getCatModels(["TN", "HATN"]),
							},
							{
								key: "tp",
								label: "TP",
								color: "indigo",
								items: getCatModels(["TP", "HATP"]),
							},
							{
								key: "bio",
								label: "생물감시",
								color: "amber",
								items: getCatModels([
									"iTOX",
									"Toximeter",
									"HATOX",
									"EasyChem",
									"Daphnia",
								]),
							},
							{
								key: "algae",
								label: "조류감시",
								color: "emerald",
								items: getCatModels(["Algae", "TriLux"]),
							},
							{
								key: "vocs",
								label: "VOCs",
								color: "purple",
								items: getCatModels(["Clarus"]),
							},
						];

						// 가동 중인 기기 대수 (종료된 (X) 기기 제외)
						const allItems = cats.flatMap((c) => c.items);
						void allItems;

						return (
							<>
								{/* 1. 상단: 44px 프리미엄 슬림 스위처 바 (이전/다음 퀵 점프 & 바텀시트 트리거) */}
								<div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-1.5 shadow-xs flex items-center justify-between gap-1">
									{/* 이전 측정소 버튼 */}
									<button
										type="button"
										onClick={handlePrevStation}
										className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white bg-slate-50 dark:bg-white/[0.03] active:scale-95 transition-all"
										title="이전 측정소"
									>
										<ChevronLeft size={16} strokeWidth={2.5} />
									</button>

									{/* 중앙: 측정소 선택 트리거 (터치 시 바텀시트 팝업) */}
									<button
										type="button"
										onClick={() => setIsBottomSheetOpen(true)}
										className="flex-1 h-9 px-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-1.5 active:scale-98 transition-all"
									>
										<div className="flex items-center gap-1.5 truncate">
											<span className="text-xs font-black text-slate-900 dark:text-white truncate">
												{station.name}
											</span>
											<span className="text-[9px] font-bold px-1.5 py-0.25 rounded bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0">
												{riverCfg.label}
											</span>
											<span className="text-[9px] font-bold px-1.5 py-0.25 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
												{officeCfg.label}
											</span>
										</div>

										<div className="flex items-center gap-1 shrink-0 text-slate-400">
											<span className="text-[10px] font-mono font-black text-indigo-600 dark:text-indigo-400">
												{currentIndex + 1}/{filteredStations.length}
											</span>
											<ChevronDown size={14} strokeWidth={2.5} />
										</div>
									</button>

									{/* 다음 측정소 버튼 */}
									<button
										type="button"
										onClick={handleNextStation}
										className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white bg-slate-50 dark:bg-white/[0.03] active:scale-95 transition-all"
										title="다음 측정소"
									>
										<ChevronRight size={16} strokeWidth={2.5} />
									</button>
								</div>

								{/* 2. 하단: 넓고 쾌적한 와이드 기기 제원 카드 (상단 헤더 줄 삭제로 컴팩트화) */}
								<div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-2.5 shadow-xs">
									{/* 설치 기기 목록 (가로 한눈에 들어오는 와이드 카드) */}
									<div className="space-y-1.5">
										{cats
											.filter((cat) => cat.items.length > 0)
											.map((cat) => (
												<div
													key={cat.key}
													className="p-2 px-2.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-2"
												>
													<div className="flex items-center gap-2 shrink-0">
														<span
															className={`w-1.5 h-1.5 rounded-full bg-${cat.color}-500`}
														/>
														<span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
															{cat.label}
														</span>
													</div>

													<div className="flex flex-wrap gap-1 justify-end">
														{cat.items.map((m, i) => {
															const isRetired =
																m.trim().endsWith("(X)") ||
																m.trim().endsWith("(x)");
															const rawName = isRetired
																? m.replace(/\(X\)$/i, "").trim()
																: m;

															return (
																<span
																	key={i}
																	className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-black border ${
																		isRetired
																			? "bg-slate-100 dark:bg-white/5 text-slate-400 line-through border-slate-200 dark:border-white/5"
																			: `bg-${cat.color}-500/10 text-${cat.color}-600 dark:text-${cat.color}-400 border-${cat.color}-500/20 shadow-2xs`
																	}`}
																>
																	{rawName}
																	{isRetired && (
																		<span className="text-[7.5px] text-rose-500 no-underline">
																			OFF
																		</span>
																	)}
																</span>
															);
														})}
													</div>
												</div>
											))}
									</div>
								</div>

								{/* 3. 모바일 전용 측정소 선택 바텀시트 팝업 모달 */}
								{isBottomSheetOpen && (
									<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
										<div
											className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-4 shadow-2xl border border-slate-200 dark:border-white/10 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200"
											onClick={(e) => e.stopPropagation()}
										>
											{/* 바텀시트 헤더 */}
											<div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
												<h3 className="text-sm font-black text-slate-900 dark:text-white">
													측정소 선택 ({filteredStations.length}개소)
												</h3>
												<button
													type="button"
													onClick={() => setIsBottomSheetOpen(false)}
													className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white"
												>
													<X size={14} strokeWidth={2.5} />
												</button>
											</div>

											{/* 측정소 스크롤 리스트 */}
											<div className="flex-1 overflow-y-auto custom-scrollbar py-2 divide-y divide-slate-100 dark:divide-white/5 space-y-0.5">
												{filteredStations.map((s, idx) => {
													const isCurrent =
														(s.id || s.name) === (station.id || station.name);
													const sInsts = parseStationArray<string>(
														s.instruments,
													);

													// 보유 기기 카테고리 태그 계산
													const sCats = [
														{
															label: "일반",
															bg: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
															has: sInsts.some((m) =>
																["EXO", "YSI", "6600"].some((k) =>
																	m.includes(k),
																),
															),
														},
														{
															label: "TOC",
															bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
															has: sInsts.some((m) =>
																["TOC", "HATA"].some((k) => m.includes(k)),
															),
														},
														{
															label: "TN",
															bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
															has: sInsts.some((m) =>
																["TN", "HATN"].some((k) => m.includes(k)),
															),
														},
														{
															label: "TP",
															bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
															has: sInsts.some((m) =>
																["TP", "HATP"].some((k) => m.includes(k)),
															),
														},
														{
															label: "생물",
															bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
															has: sInsts.some((m) =>
																[
																	"iTOX",
																	"Toximeter",
																	"HATOX",
																	"EasyChem",
																	"Daphnia",
																].some((k) => m.includes(k)),
															),
														},
														{
															label: "조류",
															bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
															has: sInsts.some((m) =>
																["Algae", "TriLux"].some((k) => m.includes(k)),
															),
														},
														{
															label: "VOCs",
															bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
															has: sInsts.some((m) =>
																["Clarus"].some((k) => m.includes(k)),
															),
														},
													].filter((c) => c.has);

													return (
														<button
															key={s.id || s.name}
															type="button"
															onClick={() => {
																setSelectedStationId(s.id || null);
																setIsBottomSheetOpen(false);
															}}
															className={`w-full py-2.5 px-2.5 rounded-xl flex items-center justify-between gap-1.5 transition-all text-left ${
																isCurrent
																	? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black"
																	: "hover:bg-slate-50 dark:hover:bg-white/[0.02] text-slate-800 dark:text-slate-200 font-bold"
															}`}
														>
															{/* 좌측: 순번 + 측정소명 (점 제거) */}
															<div className="flex items-center gap-1.5 shrink-0">
																<span className="text-[10px] font-mono text-slate-400 w-4">
																	{(idx + 1).toString().padStart(2, "0")}
																</span>
																<span className="text-xs truncate max-w-[85px] sm:max-w-none">
																	{s.name}
																</span>
															</div>

															{/* 우측: 수계 텍스트 대신 컴팩트 알약 칩들 (가로 길이 최소화) */}
															<div className="flex items-center gap-1 shrink-0">
																<div className="flex items-center gap-0.5">
																	{sCats.map((cat, ci) => (
																		<span
																			key={ci}
																			className={`px-1 py-0.25 rounded text-[8px] font-black leading-none border border-black/5 dark:border-white/5 ${cat.bg}`}
																		>
																			{cat.label}
																		</span>
																	))}
																</div>

																<span className="text-[10px] font-mono text-slate-400 ml-1">
																	{
																		sInsts.filter(
																			(m) =>
																				!m.trim().endsWith("(X)") &&
																				!m.trim().endsWith("(x)"),
																		).length
																	}
																	대
																</span>
																{isCurrent && (
																	<Check
																		size={14}
																		className="text-indigo-600 dark:text-indigo-400 ml-0.5"
																	/>
																)}
															</div>
														</button>
													);
												})}
											</div>
										</div>
									</div>
								)}
							</>
						);
					})()}
			</div>

			{/* ============================================================ */}
			{/* 💻 데스크톱 전용 뷰 (>= md): 넓은 화면 분석기 매트릭스 테이블 */}
			{/* ============================================================ */}
			<div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
				<div className="overflow-x-auto custom-scrollbar">
					<table className="w-full border-collapse text-left text-xs">
						<thead>
							<tr className="bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
								<th className="py-2 px-2 sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 w-10 text-center">
									NO
								</th>
								<th className="py-2 px-2.5 sticky left-10 z-20 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 min-w-[105px]">
									측정소명
								</th>
								<th className="py-2 px-1.5 text-center min-w-[110px]">
									일반항목
								</th>
								<th className="py-2 px-1.5 text-center min-w-[110px]">TOC</th>
								<th className="py-2 px-1.5 text-center min-w-[110px]">TN</th>
								<th className="py-2 px-1.5 text-center min-w-[110px]">TP</th>
								<th className="py-2 px-1.5 text-center min-w-[110px]">
									생물감시
								</th>
								<th className="py-2 px-1.5 text-center min-w-[110px]">
									조류감시
								</th>
								<th className="py-2 px-1.5 text-center min-w-[110px]">VOCs</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 dark:divide-white/5">
							{filteredStations.length > 0 ? (
								filteredStations.map((station, index) => {
									const riverCfg = RIVER_CONFIG[station.river] || {
										label: "기타",
										bgClass: "slate",
									};
									const officeCfg = getOfficeConfig(station.name);

									const models = parseStationArray<string>(station.instruments);

									const getCatModels = (keywords: string[]) =>
										models.filter(
											(m) =>
												typeof m === "string" &&
												keywords.some((k) => m.includes(k)),
										);

									const cats = {
										standard: getCatModels(["EXO", "YSI", "6600"]),
										toc: getCatModels(["TOC", "HATA"]),
										tn: getCatModels(["TN", "HATN"]),
										tp: getCatModels(["TP", "HATP"]),
										bio: getCatModels([
											"iTOX",
											"Toximeter",
											"HATOX",
											"EasyChem",
											"Daphnia",
										]),
										algae: getCatModels(["Algae", "TriLux"]),
										vocs: getCatModels(["Clarus"]),
									};

									const renderCell = (list: string[], color: string) => (
										<div className="flex flex-wrap gap-1 justify-center">
											{list.length > 0 ? (
												list.map((m, i) => {
													const isRetired =
														m.trim().endsWith("(X)") ||
														m.trim().endsWith("(x)");
													const rawName = isRetired
														? m.replace(/\(X\)$/i, "").trim()
														: m;

													return (
														<div
															key={i}
															title={m}
															className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black border shadow-2xs whitespace-nowrap ${
																isRetired
																	? "bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/5 opacity-50"
																	: `bg-${color}-500/5 dark:bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 border-${color}-500/10`
															}`}
														>
															<div
																className={`w-1 h-1 rounded-full ${isRetired ? "bg-slate-300" : `bg-${color}-500`}`}
															/>
															<span>{rawName}</span>
															{isRetired && (
																<span className="text-[7px] font-black text-rose-500">
																	OFF
																</span>
															)}
														</div>
													);
												})
											) : (
												<span className="text-xs text-slate-300 dark:text-slate-600">
													-
												</span>
											)}
										</div>
									);

									return (
										<tr
											key={station.id || index}
											className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
										>
											<td className="py-2 px-2 sticky left-0 z-10 bg-white dark:bg-slate-900 text-center font-mono text-[10.5px] text-slate-400">
												{(index + 1).toString().padStart(2, "0")}
											</td>
											<td className="py-2 px-2.5 sticky left-10 z-10 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10">
												<div className="flex flex-col">
													<span className="font-black text-slate-900 dark:text-white tracking-tight">
														{station.name}
													</span>
													<div className="flex items-center gap-1.5 mt-0.5">
														<span className="text-[8px] font-bold px-1 py-0.25 rounded bg-slate-100 dark:bg-white/5 text-slate-500">
															{riverCfg.label}
														</span>
														<span className="text-[8px] font-bold px-1 py-0.25 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
															<Building2 size={8} /> {officeCfg.label}
														</span>
													</div>
												</div>
											</td>
											<td className="py-2.5 px-2 text-center">
												{renderCell(cats.standard, "indigo")}
											</td>
											<td className="py-2.5 px-2 text-center">
												{renderCell(cats.toc, "emerald")}
											</td>
											<td className="py-2.5 px-2 text-center">
												{renderCell(cats.tn, "indigo")}
											</td>
											<td className="py-2.5 px-2 text-center">
												{renderCell(cats.tp, "indigo")}
											</td>
											<td className="py-2.5 px-2 text-center">
												{renderCell(cats.bio, "amber")}
											</td>
											<td className="py-2.5 px-2 text-center">
												{renderCell(cats.algae, "emerald")}
											</td>
											<td className="py-2.5 px-2 text-center">
												{renderCell(cats.vocs, "purple")}
											</td>
										</tr>
									);
								})
							) : (
								<tr>
									<td
										colSpan={9}
										className="py-16 text-center text-slate-400 text-xs"
									>
										조건에 맞는 측정소가 없습니다.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
