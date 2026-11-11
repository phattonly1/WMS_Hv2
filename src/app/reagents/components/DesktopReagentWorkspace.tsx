"use client";

import {
	Calendar,
	Check,
	Eye,
	EyeOff,
	Layers,
	PenLine,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
	ReagentOrderSheet,
	ReagentPerson,
	ReagentRowSpec,
} from "@/actions/reagents";
import {
	PEOPLE_LIST,
	PERSON_GREEN_ROWS,
	parseCellExpression,
	REAGENT_SPEC_ROWS,
	SUMMARY_SHEET_ID,
} from "../constants";

interface DesktopReagentWorkspaceProps {
	loading: boolean;
	sheets: ReagentOrderSheet[];
	selectedSheetId: string;
	setSelectedSheetId: (id: string) => void;
	isSummaryView: boolean;
	currentSheet: ReagentOrderSheet | null;
	summaryCells: Record<string, Record<ReagentPerson, number>>;
	columnTotals: {
		totals: Record<ReagentPerson, number>;
		grandTotal: number;
	};
	onOpenEditSheetModal: () => void;
	onDeleteCurrentSheet: () => void;
	onOpenCellModal: (row: ReagentRowSpec, person: ReagentPerson) => void;
}

export default function DesktopReagentWorkspace({
	loading,
	sheets,
	selectedSheetId,
	setSelectedSheetId,
	isSummaryView,
	currentSheet,
	summaryCells,
	columnTotals,
	onOpenEditSheetModal,
	onDeleteCurrentSheet,
	onOpenCellModal,
}: DesktopReagentWorkspaceProps) {
	const [showReferenceCols, setShowReferenceCols] = useState<boolean>(false);
	const [hoveredCol, setHoveredCol] = useState<string | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const [scrollbarWidth, setScrollbarWidth] = useState<number>(10);

	useEffect(() => {
		const el = scrollContainerRef.current;
		if (!el) return;
		const updateScrollbarWidth = () => {
			const sbw = el.offsetWidth - el.clientWidth;
			if (sbw >= 0) setScrollbarWidth(sbw);
		};
		updateScrollbarWidth();
		const ro = new ResizeObserver(updateScrollbarWidth);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	// 측정항목 카테고리별 연속 행 수 (rowSpan 병합 계산)
	const categoryRowSpans = useMemo(() => {
		const spans: Record<number, number> = {};
		let currentCat = "";
		let startIdx = 0;

		REAGENT_SPEC_ROWS.forEach((row, idx) => {
			if (row.category !== currentCat) {
				if (currentCat !== "") {
					spans[startIdx] = idx - startIdx;
				}
				currentCat = row.category;
				startIdx = idx;
			}
		});
		if (currentCat !== "") {
			spans[startIdx] = REAGENT_SPEC_ROWS.length - startIdx;
		}
		return spans;
	}, []);

	// 측정소가 많아지더라도 각 측정소 열 최소 너비(76px)를 보장하여 수식/배지 깨짐 방지
	const tableMinWidth = useMemo(() => {
		const baseFixedCols = 64 + 128 + 80 + 160 + 72; // 측정항목+기기+회사+시약명+합계
		const refCols = showReferenceCols ? 96 + 80 : 0;
		const personCols = PEOPLE_LIST.length * 76;
		return baseFixedCols + refCols + personCols;
	}, [showReferenceCols]);
	return (
		<div className="hidden lg:flex flex-1 max-w-[1600px] mx-auto w-full flex-row overflow-x-hidden pt-4 px-4 gap-4 relative min-h-0">
			{/* 좌측 사이드바 (데스크톱): 주문 회차 선택 전용 */}
			<aside className="w-[240px] shrink-0 flex flex-col p-4 overflow-y-auto border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] rounded-2xl shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] mb-4">
				<div className="flex items-center justify-between mb-3 px-1">
					<h3 className="text-[11px] font-bold text-[#64748b] dark:text-[#a1a1aa] uppercase tracking-wider">
						주문 회차 (시트)
					</h3>
					<span className="text-[10px] text-[#2563eb] dark:text-[#60a5fa] font-bold">
						<span className="font-mono">{sheets.length}</span>개 회차
					</span>
				</div>

				<div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
					<button
						type="button"
						onClick={() => setSelectedSheetId(SUMMARY_SHEET_ID)}
						className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer break-keep ${
							isSummaryView
								? "bg-[#2563eb] text-white shadow-sm"
								: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#16161c]"
						}`}
					>
						<span className="flex items-center gap-2 truncate">
							<Layers size={15} className="shrink-0" />
							<span className="truncate">전체 누적 합계표</span>
						</span>
						<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 whitespace-nowrap shrink-0">
							SUM
						</span>
					</button>

					{sheets
						.slice()
						.reverse()
						.map((sheet) => {
							const isSelected = selectedSheetId === sheet.id;
							return (
								<button
									key={sheet.id}
									type="button"
									onClick={() => setSelectedSheetId(sheet.id)}
									className={`w-full flex flex-col gap-0.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
										isSelected
											? "bg-blue-500/10 border border-blue-500/30 text-[#2563eb] dark:text-[#60a5fa]"
											: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#16161c] border border-transparent"
									}`}
								>
									<div className="flex items-center justify-between gap-1">
										<span className="text-xs font-bold truncate break-keep">
											{sheet.title}
										</span>
										{isSelected && <Check size={13} className="shrink-0" />}
									</div>
									<div className="flex items-center gap-2 text-[10px] font-mono opacity-80">
										{sheet.deadline !== "-" && (
											<span>마감 {sheet.deadline}</span>
										)}
										{sheet.deliveryDate !== "-" && (
											<span>납기 {sheet.deliveryDate}</span>
										)}
									</div>
								</button>
							);
						})}
				</div>
			</aside>

			{/* 우측 메인 영역 (데스크톱) */}
			<main className="flex-1 flex flex-col min-w-0 min-h-0 pb-4 gap-3">
				{/* 현재 시트 배너 & 마감일/납기일 수정/삭제 */}
				<div className="bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] rounded-2xl p-3.5 px-5 flex items-center justify-between gap-3 shrink-0 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
					<div className="flex items-center gap-3 min-w-0">
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base font-bold text-[#0f172a] dark:text-white break-keep">
									{isSummaryView
										? "전체 회차 누적 합계표"
										: currentSheet?.title || "시약 주문표"}
								</h2>
								{isSummaryView ? (
									<span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#34d399] border border-emerald-500/20 whitespace-nowrap shrink-0">
										총 {sheets.length}개 회차 자동 합산
									</span>
								) : (
									<span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#34d399] border border-emerald-500/20 whitespace-nowrap shrink-0">
										녹색 셀 = 측정소 사용 시약 (클릭하여 입력)
									</span>
								)}
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{/* 참고열(작년 주문량/매뉴얼) 표시/숨김 토글 버튼 */}
						<button
							type="button"
							onClick={() => setShowReferenceCols((prev) => !prev)}
							className={`h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
								showReferenceCols
									? "bg-blue-500/10 border-blue-500/30 text-[#2563eb] dark:text-[#60a5fa]"
									: "bg-[#f8fafc] dark:bg-[#16161c] border-[#e2e8f0] dark:border-[#222228] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
							}`}
							title="작년 주문량, 매뉴얼 열 표시/숨김"
						>
							{showReferenceCols ? <EyeOff size={14} /> : <Eye size={14} />}
							<span>{showReferenceCols ? "참고열 숨김" : "참고열 표시"}</span>
						</button>

						{!isSummaryView && currentSheet && (
							<>
								<div className="h-10 flex items-center gap-1.5 px-3 rounded-xl bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-xs">
									<Calendar
										size={13}
										className="text-amber-500 dark:text-[#fbbf24]"
									/>
									<span className="text-[#64748b] dark:text-[#a1a1aa]">
										주문 마감일:
									</span>
									<span className="font-mono font-bold text-[#0f172a] dark:text-white">
										{currentSheet.deadline}
									</span>
								</div>
								<div className="h-10 flex items-center gap-1.5 px-3 rounded-xl bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-xs">
									<Calendar
										size={13}
										className="text-emerald-500 dark:text-[#34d399]"
									/>
									<span className="text-[#64748b] dark:text-[#a1a1aa]">
										예상 납기일:
									</span>
									<span className="font-mono font-bold text-[#0f172a] dark:text-white">
										{currentSheet.deliveryDate}
									</span>
								</div>
								<button
									type="button"
									onClick={onOpenEditSheetModal}
									className="w-10 h-10 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/10 border border-[#e2e8f0] dark:border-[#222228] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
									title="마감일/납기일 수정"
								>
									<PenLine size={15} />
								</button>
								{sheets.length > 1 && (
									<button
										type="button"
										onClick={onDeleteCurrentSheet}
										className="w-10 h-10 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-[#f87171] flex items-center justify-center transition-colors cursor-pointer shrink-0"
										title="현재 회차 삭제"
									>
										<Trash2 size={15} />
									</button>
								)}
							</>
						)}
					</div>
				</div>

				{/* 데스크톱 전체 엑셀 매트릭스 테이블 컨테이너 */}
				<div className="flex-1 min-h-0 bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] rounded-2xl shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] flex flex-col overflow-hidden">
					{loading ? (
						<div className="h-full flex items-center justify-center p-12 text-xs font-mono text-[#64748b] dark:text-[#a1a1aa]">
							시약 주문 시트 데이터를 불러오는 중...
						</div>
					) : (
						<div className="flex-1 min-h-0 flex flex-col overflow-x-auto">
							<div
								style={{ minWidth: `${tableMinWidth}px` }}
								className="flex-1 min-h-0 flex flex-col w-full"
							>
								{/* 1. 상단 제목(헤더) 독립 고정 (스크롤바 너비만큼 우측 패딩으로 1px 오차 없이 일치) */}
								<div
									style={{ paddingRight: `${scrollbarWidth}px` }}
									className="shrink-0 bg-[#f1f5f9] dark:bg-[#16161c] border-b border-[#e2e8f0] dark:border-[#222228]"
								>
									<table className="w-full border-collapse text-xs table-fixed">
										<colgroup>
											<col className="w-16" />
											<col className="w-32" />
											<col className="w-20" />
											<col className="w-40" />
											{showReferenceCols && (
												<>
													<col className="w-24" />
													<col className="w-20" />
												</>
											)}
											{PEOPLE_LIST.map((p) => (
												<col key={p} />
											))}
											<col className="w-18" />
										</colgroup>
										<thead className="bg-[#f1f5f9] dark:bg-[#16161c] text-[#0f172a] dark:text-[#f4f4f5]">
											<tr>
												<th className="py-2 px-2 text-center font-bold border-r border-[#e2e8f0] dark:border-[#222228] whitespace-nowrap">
													측정항목
												</th>
												<th className="py-2 px-2.5 text-left font-bold border-r border-[#e2e8f0] dark:border-[#222228] whitespace-nowrap">
													측정기기
												</th>
												<th className="py-2 px-2 text-center font-bold border-r border-[#e2e8f0] dark:border-[#222228] whitespace-nowrap">
													회사명
												</th>
												<th className="py-2 px-2.5 text-left font-bold border-r-2 border-[#cbd5e1] dark:border-[#33333e] whitespace-nowrap">
													제조시약명
												</th>
												{showReferenceCols && (
													<>
														<th className="py-1.5 px-2 text-center text-[11px] text-[#64748b] dark:text-[#a1a1aa] border-r border-[#e2e8f0] dark:border-[#222228] whitespace-nowrap">
															<div>작년 주문량</div>
															<div className="text-[10px]">(1달, 기기 당)</div>
														</th>
														<th className="py-1.5 px-2 text-center text-[11px] text-[#64748b] dark:text-[#a1a1aa] border-r border-[#e2e8f0] dark:border-[#222228] whitespace-nowrap">
															<div>매뉴얼</div>
															<div className="text-[10px]">(1달, 기기 당)</div>
														</th>
													</>
												)}
												{PEOPLE_LIST.map((person) => {
													const isColActive = hoveredCol === person;
													return (
														<th
															key={person}
															onMouseEnter={() => setHoveredCol(person)}
															onMouseLeave={() => setHoveredCol(null)}
															className={`py-2 px-2 text-center font-bold border-r border-[#e2e8f0] dark:border-[#222228] whitespace-nowrap transition-colors ${
																isColActive
																	? "bg-blue-500/15 text-[#2563eb] dark:text-[#60a5fa]"
																	: ""
															}`}
														>
															{person}
														</th>
													);
												})}
												<th
													onMouseEnter={() => setHoveredCol("__sum__")}
													onMouseLeave={() => setHoveredCol(null)}
													className={`py-2 px-2.5 text-center font-mono font-bold border-r border-[#e2e8f0] dark:border-[#222228] whitespace-nowrap transition-colors ${
														hoveredCol === "__sum__"
															? "bg-blue-500/25 text-[#2563eb] dark:text-[#60a5fa]"
															: "bg-blue-500/10 text-[#2563eb] dark:text-[#60a5fa]"
													}`}
												>
													합계
												</th>
											</tr>
										</thead>
									</table>
								</div>

								{/* 2. 순수 데이터 행에만 세로 스크롤 적용 */}
								<div
									ref={scrollContainerRef}
									className="flex-1 min-h-0 overflow-y-scroll"
								>
									<table className="w-full border-collapse text-xs table-fixed">
										<colgroup>
											<col className="w-16" />
											<col className="w-32" />
											<col className="w-20" />
											<col className="w-40" />
											{showReferenceCols && (
												<>
													<col className="w-24" />
													<col className="w-20" />
												</>
											)}
											{PEOPLE_LIST.map((p) => (
												<col key={p} />
											))}
											<col className="w-18" />
										</colgroup>
										<tbody className="divide-y divide-[#e2e8f0] dark:divide-[#1a1a20]">
											{REAGENT_SPEC_ROWS.map((row, idx) => {
												const rowSpan = categoryRowSpans[idx];
												const nextRow = REAGENT_SPEC_ROWS[idx + 1];
												const isCategoryEnd =
													Boolean(nextRow) &&
													nextRow?.category !== row.category;
												const isEvenRow = idx % 2 === 1;

												let rowSum = 0;
												for (const p of PEOPLE_LIST) {
													if (isSummaryView) {
														rowSum += summaryCells[row.id]?.[p] || 0;
													} else {
														const raw = currentSheet?.cells[row.id]?.[p];
														rowSum += parseCellExpression(
															raw,
															row.defaultVolume,
														).total;
													}
												}
												rowSum = Number(rowSum.toFixed(2));

												const catBadgeClass =
													row.category === "TOC"
														? "bg-blue-500/10 text-[#2563eb] dark:text-[#60a5fa] border-blue-500/20"
														: row.category === "TP"
															? "bg-emerald-500/10 text-emerald-600 dark:text-[#34d399] border-emerald-500/20"
															: row.category === "TN"
																? "bg-amber-500/10 text-amber-600 dark:text-[#fbbf24] border-amber-500/20"
																: "bg-black/5 dark:bg-white/5 text-[#64748b] dark:text-[#a1a1aa] border-[#e2e8f0] dark:border-[#222228]";

												return (
													<tr
														key={row.id}
														className={`group transition-colors hover:bg-blue-500/10 dark:hover:bg-blue-500/10 ${
															isEvenRow
																? "bg-[#f8fafc]/60 dark:bg-white/[0.015]"
																: ""
														} ${
															isCategoryEnd
																? "border-b-2 border-[#cbd5e1] dark:border-[#33333e]"
																: ""
														}`}
													>
														{rowSpan ? (
															<td
																rowSpan={rowSpan}
																className="py-1 px-2 text-center align-middle border-r border-b-2 border-[#cbd5e1] dark:border-[#33333e] bg-white dark:bg-[#111115] whitespace-nowrap"
															>
																<span
																	className={`inline-block px-1.5 py-1 rounded-md font-mono font-bold text-[10px] border shadow-2xs ${catBadgeClass}`}
																>
																	{row.category}
																</span>
															</td>
														) : null}

														<td className="py-1 px-2.5 font-mono font-semibold text-[11px] text-[#475569] dark:text-[#a1a1aa] group-hover:text-[#0f172a] dark:group-hover:text-white border-r border-[#e2e8f0] dark:border-[#1a1a20] whitespace-nowrap transition-colors">
															{row.device}
														</td>

														<td className="py-1 px-1.5 text-center text-[11px] text-[#64748b] dark:text-[#a1a1aa] border-r border-[#e2e8f0] dark:border-[#1a1a20] whitespace-nowrap">
															{row.company || "-"}
														</td>

														<td className="py-1 px-2.5 font-bold text-xs text-[#0f172a] dark:text-white group-hover:text-[#2563eb] dark:group-hover:text-[#60a5fa] border-r-2 border-[#cbd5e1] dark:border-[#33333e] whitespace-nowrap transition-colors">
															{row.reagentName || (
																<span className="text-[#64748b] dark:text-[#a1a1aa] font-normal">
																	{row.device}
																</span>
															)}
														</td>

														{showReferenceCols && (
															<>
																<td className="py-1 px-2 text-center font-mono text-xs text-[#64748b] dark:text-[#a1a1aa] border-r border-[#e2e8f0] dark:border-[#1a1a20] whitespace-nowrap">
																	{row.lastYearAvg || "-"}
																</td>
																<td className="py-1 px-2 text-center font-mono text-xs text-[#64748b] dark:text-[#a1a1aa] border-r border-[#e2e8f0] dark:border-[#1a1a20] whitespace-nowrap">
																	{row.manualAvg || "-"}
																</td>
															</>
														)}

														{/* 7개 측정소 입력 셀 */}
														{PEOPLE_LIST.map((person) => {
															const isGreenCell = PERSON_GREEN_ROWS[
																person
															].includes(row.id);
															const isColActive = hoveredCol === person;

															if (isSummaryView) {
																const sumVal =
																	summaryCells[row.id]?.[person] || 0;
																return (
																	<td
																		key={person}
																		onMouseEnter={() => setHoveredCol(person)}
																		onMouseLeave={() => setHoveredCol(null)}
																		className={`py-1 px-1 text-center font-mono border-r border-[#e2e8f0] dark:border-[#1a1a20] whitespace-nowrap transition-colors ${
																			isColActive
																				? "bg-blue-500/10 dark:bg-blue-500/15"
																				: isGreenCell
																					? "bg-emerald-500/10"
																					: ""
																		}`}
																	>
																		<div className="h-9 flex items-center justify-center">
																			{sumVal > 0 ? (
																				<span className="font-bold text-xs text-[#0f172a] dark:text-white">
																					{sumVal}
																				</span>
																			) : (
																				<span className="text-[#cbd5e1] dark:text-[#3f3f46]">
																					-
																				</span>
																			)}
																		</div>
																	</td>
																);
															}

															const rawVal =
																currentSheet?.cells[row.id]?.[person] || "";
															const parsed = parseCellExpression(
																rawVal,
																row.defaultVolume,
															);
															const hasVal = parsed.total > 0;
															const isInteractive = isGreenCell || hasVal;

															return (
																<td
																	key={person}
																	onMouseEnter={() => setHoveredCol(person)}
																	onMouseLeave={() => setHoveredCol(null)}
																	className={`p-0.5 border-r border-[#e2e8f0] dark:border-[#1a1a20] transition-colors ${
																		isColActive
																			? "bg-blue-500/10 dark:bg-blue-500/15"
																			: isGreenCell
																				? "bg-emerald-500/10"
																				: ""
																	}`}
																>
																	{isInteractive ? (
																		<button
																			type="button"
																			onClick={() =>
																				onOpenCellModal(row, person)
																			}
																			className={`relative w-full min-w-[50px] h-9 px-1 py-1 rounded-md font-mono text-[11px] flex items-center justify-center text-center overflow-hidden transition-all cursor-pointer ${
																				hasVal
																					? "bg-blue-500/15 hover:bg-blue-500/25 text-[#2563eb] dark:text-[#60a5fa] border border-blue-500/30 font-bold shadow-2xs"
																					: "hover:bg-emerald-500/20 text-emerald-600 dark:text-[#34d399] border border-dashed border-emerald-500/30"
																			}`}
																			title={
																				hasVal
																					? `${person}: ${parsed.breakdownText} (총 ${parsed.total}L)`
																					: `${person} - ${row.reagentName || row.device} 수량 입력`
																			}
																		>
																			{hasVal ? (
																				(() => {
																					const parts = rawVal
																						.split("+")
																						.map((p) => p.trim())
																						.filter(Boolean);
																					const extraCount = parts.length - 2;
																					const displayParts = parts.slice(
																						0,
																						2,
																					);

																					return (
																						<>
																							{extraCount > 0 && (
																								<span className="absolute top-0.5 right-0.5 px-1 py-px rounded-full bg-[#2563eb] text-white text-[8px] font-sans font-bold leading-none shadow-2xs">
																									+{extraCount}
																								</span>
																							)}
																							<span className="flex flex-col items-center justify-center gap-0.5 leading-[13px] whitespace-nowrap">
																								{displayParts.map(
																									(part, idx) => (
																										<span
																											key={`${person}-${row.id}-${idx}-${part}`}
																											className="truncate max-w-[68px]"
																										>
																											{part}
																										</span>
																									),
																								)}
																							</span>
																						</>
																					);
																				})()
																			) : (
																				<span>+</span>
																			)}
																		</button>
																	) : (
																		<div
																			className="w-full min-w-[50px] h-9 flex items-center justify-center font-mono text-[11px] text-[#cbd5e1] dark:text-[#27272a] select-none cursor-not-allowed"
																			title="해당 측정소 미사용 시약"
																		>
																			-
																		</div>
																	)}
																</td>
															);
														})}

														<td
															onMouseEnter={() => setHoveredCol("__sum__")}
															onMouseLeave={() => setHoveredCol(null)}
															className={`py-1 px-2.5 text-center font-mono font-bold border-r border-[#e2e8f0] dark:border-[#1a1a20] whitespace-nowrap transition-colors ${
																hoveredCol === "__sum__"
																	? "bg-blue-500/20"
																	: "bg-blue-500/5"
															}`}
														>
															{rowSum > 0 ? (
																<span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-[#2563eb] dark:text-[#60a5fa]">
																	{rowSum}
																</span>
															) : (
																<span className="text-[#94a3b8] dark:text-[#52525b]">
																	0
																</span>
															)}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>

								{/* 3. 하단 합계(tfoot) 독립 고정 (스크롤바 너비만큼 우측 패딩으로 1px 오차 없이 일치) */}
								<div
									style={{ paddingRight: `${scrollbarWidth}px` }}
									className="shrink-0 border-t-2 border-[#cbd5e1] dark:border-[#33333e] bg-[#f1f5f9] dark:bg-[#16161c]"
								>
									<table className="w-full border-collapse text-xs table-fixed font-bold">
										<colgroup>
											<col className="w-16" />
											<col className="w-32" />
											<col className="w-20" />
											<col className="w-40" />
											{showReferenceCols && (
												<>
													<col className="w-24" />
													<col className="w-20" />
												</>
											)}
											{PEOPLE_LIST.map((p) => (
												<col key={p} />
											))}
											<col className="w-18" />
										</colgroup>
										<tfoot>
											<tr>
												<td
													colSpan={4}
													className="py-2 px-3 text-right text-xs text-[#0f172a] dark:text-white border-r-2 border-[#cbd5e1] dark:border-[#33333e]"
												>
													측정소별 총 주문량 합계 (L)
												</td>
												{showReferenceCols && (
													<>
														<td className="border-r border-[#e2e8f0] dark:border-[#222228]" />
														<td className="border-r border-[#e2e8f0] dark:border-[#222228]" />
													</>
												)}
												{PEOPLE_LIST.map((p) => {
													const isColActive = hoveredCol === p;
													return (
														<td
															key={p}
															onMouseEnter={() => setHoveredCol(p)}
															onMouseLeave={() => setHoveredCol(null)}
															className={`py-2 px-2 text-center font-mono text-xs border-r border-[#e2e8f0] dark:border-[#222228] transition-colors ${
																isColActive
																	? "bg-blue-500/20 text-[#2563eb] dark:text-[#60a5fa] font-bold"
																	: "text-[#0f172a] dark:text-white"
															}`}
														>
															{columnTotals.totals[p]}
														</td>
													);
												})}
												<td
													onMouseEnter={() => setHoveredCol("__sum__")}
													onMouseLeave={() => setHoveredCol(null)}
													className={`py-2 px-2.5 text-center font-mono text-xs text-[#2563eb] dark:text-[#60a5fa] border-r border-[#e2e8f0] dark:border-[#222228] transition-colors ${
														hoveredCol === "__sum__"
															? "bg-blue-500/25 font-bold"
															: "bg-blue-500/15"
													}`}
												>
													{columnTotals.grandTotal}
												</td>
											</tr>
										</tfoot>
									</table>
								</div>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
