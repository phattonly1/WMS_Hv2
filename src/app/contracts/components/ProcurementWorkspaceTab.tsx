"use client";

import {
	AlertCircle,
	BookOpen,
	CheckSquare,
	FilterX,
	Minus,
	Plus,
	Square,
} from "lucide-react";
import { useMemo } from "react";
import {
	type BomPartItem,
	type ConsumableItem,
	calcDiffPercent,
	formatWon,
	GROUP_BADGE,
	type HandoverPlanState,
	MANUFACTURER_BADGE,
	type PlanLineEntry,
	parseBaseQty,
	resolveUnitPrice,
	splitModels,
} from "../types";

export type ListScopeFilter =
	| "all"
	| "selected"
	| "priced"
	| "unpricedSelected";

interface ProcurementWorkspaceTabProps {
	items: ConsumableItem[];
	plan: HandoverPlanState;
	altPartMap: Record<string, BomPartItem[]>;
	selectedMfg: string;
	onSelectMfg: (mfg: string) => void;
	selectedGroup: string;
	onSelectGroup: (grp: string) => void;
	selectedModel: string;
	onSelectModel: (model: string) => void;
	scopeFilter: ListScopeFilter;
	onChangeScopeFilter: (scope: ListScopeFilter) => void;
	query: string;
	onChangeQuery: (q: string) => void;
	onUpdateEntry: (id: number, patch: Partial<PlanLineEntry>) => void;
	onBulkToggleFiltered: (filteredIds: number[], select: boolean) => void;
	onJumpToBomPart: (model: string, partCode: string) => void;
}

export default function ProcurementWorkspaceTab({
	items,
	plan,
	altPartMap,
	selectedMfg,
	onSelectMfg,
	selectedGroup,
	onSelectGroup,
	selectedModel,
	onSelectModel,
	scopeFilter,
	onChangeScopeFilter,
	query,
	onChangeQuery,
	onUpdateEntry,
	onBulkToggleFiltered,
	onJumpToBomPart,
}: ProcurementWorkspaceTabProps) {
	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return items.filter((item) => {
			if (selectedMfg !== "전체" && item.manufacturer !== selectedMfg) {
				return false;
			}
			if (selectedGroup !== "전체" && item.partGroup !== selectedGroup) {
				return false;
			}
			if (selectedModel !== "전체") {
				const itemModels = splitModels(item.model);
				if (!itemModels.includes(selectedModel)) return false;
			}

			const entry = plan.entries[item.id];
			const isSelected = Boolean(entry?.selected);
			const { price } = resolveUnitPrice(item, entry);

			if (scopeFilter === "selected" && !isSelected) return false;
			if (scopeFilter === "priced" && price === null) return false;
			if (
				scopeFilter === "unpricedSelected" &&
				(!isSelected || price !== null)
			) {
				return false;
			}

			if (!q) return true;
			const altMatches = item.partNumber
				? (altPartMap[item.partNumber] ?? []).some((b) =>
						b.altPart?.toLowerCase().includes(q),
					)
				: false;

			return (
				item.name.toLowerCase().includes(q) ||
				item.partNumber.toLowerCase().includes(q) ||
				item.model.toLowerCase().includes(q) ||
				item.spec.toLowerCase().includes(q) ||
				item.category.toLowerCase().includes(q) ||
				item.note.toLowerCase().includes(q) ||
				(entry?.memo ?? "").toLowerCase().includes(q) ||
				altMatches
			);
		});
	}, [
		items,
		selectedMfg,
		selectedGroup,
		selectedModel,
		scopeFilter,
		query,
		plan.entries,
		altPartMap,
	]);

	const filteredSummary = useMemo(() => {
		let selCount = 0;
		let selWon = 0;
		for (const item of filtered) {
			const entry = plan.entries[item.id];
			if (!entry?.selected) continue;
			selCount++;
			const { price } = resolveUnitPrice(item, entry);
			if (price !== null) {
				selWon += price * (entry.qty ?? parseBaseQty(item.baseQty));
			}
		}
		return { selCount, selWon };
	}, [filtered, plan.entries]);

	const allFilteredSelected =
		filtered.length > 0 &&
		filtered.every((item) => Boolean(plan.entries[item.id]?.selected));

	const hasActiveFilters =
		selectedMfg !== "전체" ||
		selectedGroup !== "전체" ||
		selectedModel !== "전체" ||
		scopeFilter !== "all" ||
		query.trim() !== "";

	return (
		<div className="flex flex-col gap-3">
			{/* 상단 1줄 상태 요약 & 일괄 선택 액션 바 (모든 필터는 좌측 사이드바에서 제어) */}
			<section className="flex items-center justify-between gap-3 rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] px-4 py-2.5 text-xs shadow-sm">
				<div className="flex items-center gap-2.5 flex-wrap">
					<button
						type="button"
						onClick={() =>
							onBulkToggleFiltered(
								filtered.map((f) => f.id),
								!allFilteredSelected,
							)
						}
						disabled={filtered.length === 0}
						className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#cbd5e1] dark:border-[#27272a] bg-[#f8fafc] dark:bg-[#16161c] px-3 font-bold text-[#0f172a] dark:text-[#f4f4f5] hover:border-[#2563eb] disabled:opacity-50"
					>
						{allFilteredSelected ? (
							<CheckSquare size={14} className="text-[#2563eb]" />
						) : (
							<Square size={14} className="text-[#64748b]" />
						)}
						<span>
							조회 {filtered.length}건{" "}
							{allFilteredSelected ? "전체 해제" : "일괄 발주포함"}
						</span>
					</button>

					<div className="flex items-center gap-1.5 text-[#64748b] dark:text-[#a1a1aa]">
						<span className="rounded-lg bg-[#f1f5f9] dark:bg-[#16161c] px-2.5 py-1 font-semibold text-[#0f172a] dark:text-white">
							{selectedMfg === "전체" ? "전체 제조사" : selectedMfg}
						</span>
						{selectedGroup !== "전체" && (
							<span className="rounded-lg bg-[#06b6d4]/15 px-2.5 py-1 font-semibold text-[#0284c7] dark:text-[#06b6d4]">
								{selectedGroup}
							</span>
						)}
						{selectedModel !== "전체" && (
							<span className="rounded-lg bg-[#2563eb]/15 px-2.5 py-1 font-mono font-semibold text-[#2563eb] dark:text-[#60a5fa]">
								{selectedModel}
							</span>
						)}
						{query.trim() && (
							<span className="rounded-lg bg-[#f59e0b]/15 px-2.5 py-1 font-semibold text-[#f59e0b] dark:text-[#fbbf24]">
								검색: "{query.trim()}"
							</span>
						)}
					</div>

					{hasActiveFilters && (
						<button
							type="button"
							onClick={() => {
								onSelectMfg("전체");
								onSelectGroup("전체");
								onSelectModel("전체");
								onChangeScopeFilter("all");
								onChangeQuery("");
							}}
							className="inline-flex min-h-10 items-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
						>
							<FilterX size={14} />
							<span>필터 해제</span>
						</button>
					)}
				</div>

				<div className="font-mono text-xs font-bold text-[#2563eb] dark:text-[#60a5fa] shrink-0">
					현재 목록 선정 {filteredSummary.selCount}건:{" "}
					{formatWon(filteredSummary.selWon)}{" "}
					<span className="text-[11px] font-normal text-[#64748b] dark:text-[#a1a1aa]">
						(VAT별도)
					</span>
				</div>
			</section>

			{/* 구매 산출 인터랙티브 테이블 */}
			<section className="rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] overflow-hidden shadow-sm">
				{filtered.length === 0 ? (
					<div className="h-64 flex flex-col items-center justify-center p-6 text-center text-xs text-[#64748b] dark:text-[#a1a1aa]">
						<p className="text-sm font-bold text-[#0f172a] dark:text-white mb-1">
							조건에 맞는 소모품이 없습니다
						</p>
						<p>좌측 사이드바에서 제조사·기기 필터나 검색어를 변경해 주세요.</p>
					</div>
				) : (
					<div className="w-full overflow-x-auto">
						<table className="w-full border-collapse text-left text-xs">
							<thead>
								<tr className="border-b border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#16161c] text-[11px] font-bold text-[#475569] dark:text-[#a1a1aa]">
									<th className="px-2.5 py-3 text-center whitespace-nowrap">
										포함
									</th>
									<th className="px-3 py-3 whitespace-nowrap">제조사/구분</th>
									<th className="px-3 py-3 whitespace-nowrap">
										적용장비 / 항목
									</th>
									<th className="px-3 py-3 whitespace-nowrap">
										품명 · 규격 · 호환대체품
									</th>
									<th className="px-2.5 py-3 whitespace-nowrap text-center">
										교체주기
									</th>
									<th className="px-3 py-3 whitespace-nowrap text-center">
										계획수량
									</th>
									<th className="px-3 py-3 whitespace-nowrap text-right">
										단가 (25→26년)
									</th>
									<th className="px-3 py-3 whitespace-nowrap text-right">
										예상금액
									</th>
									<th className="px-3 py-3 whitespace-nowrap">
										견적근거 및 인계 메모
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-[#e2e8f0] dark:divide-[#222228]/70">
								{filtered.map((item) => {
									const entry = plan.entries[item.id] ?? {
										selected: false,
										qty: parseBaseQty(item.baseQty),
										memo: "",
									};
									const isSelected = entry.selected;
									const diff = calcDiffPercent(item.price25, item.price26);
									const { price, source } = resolveUnitPrice(item, entry);
									const lineTotal =
										isSelected && price !== null ? price * entry.qty : null;

									const badgeClass =
										MANUFACTURER_BADGE[item.manufacturer] ??
										"bg-[#f1f5f9] dark:bg-[#222228] text-[#334155] dark:text-[#d4d4d8] border-[#cbd5e1] dark:border-[#3f3f46]";

									const bomMatches = item.partNumber
										? (altPartMap[item.partNumber] ?? [])
										: [];
									const altPartText = bomMatches.find(
										(b) => b.altPart,
									)?.altPart;
									const bomModels = splitModels(item.model).filter((m) =>
										m.startsWith("HAT"),
									);

									return (
										<tr
											key={item.id}
											className={`transition-colors ${
												isSelected
													? "bg-[#eff6ff]/50 dark:bg-[#2563eb]/5 hover:bg-[#eff6ff] dark:hover:bg-[#16161c]"
													: "hover:bg-[#f8fafc] dark:hover:bg-[#16161c]"
											}`}
										>
											<td className="px-2.5 py-2.5 align-top text-center">
												<button
													type="button"
													aria-label={`${item.name} 발주 포함 토글`}
													onClick={() =>
														onUpdateEntry(item.id, { selected: !isSelected })
													}
													className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-[#2563eb] dark:text-[#60a5fa] hover:bg-[#2563eb]/10"
												>
													{isSelected ? (
														<CheckSquare size={17} />
													) : (
														<Square
															size={17}
															className="text-[#94a3b8] dark:text-[#52525b]"
														/>
													)}
												</button>
											</td>

											<td className="px-3 py-2.5 align-top">
												<div className="flex flex-col items-start gap-1">
													<span
														className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap ${badgeClass}`}
													>
														{item.manufacturer}
													</span>
													<span
														className={`inline-flex items-center rounded-lg border px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap ${
															GROUP_BADGE[item.partGroup] ??
															"bg-[#f1f5f9] dark:bg-[#222228] text-[#334155] dark:text-[#d4d4d8] border-[#cbd5e1] dark:border-[#3f3f46]"
														}`}
													>
														{item.partGroup}
													</span>
												</div>
											</td>

											<td className="px-3 py-2.5 align-top max-w-44">
												<div className="flex flex-wrap gap-1">
													{splitModels(item.model).map((m) => (
														<span
															key={m}
															className="rounded bg-[#f1f5f9] dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#27272a] px-1.5 py-0.5 font-mono text-[10px] text-[#334155] dark:text-[#d4d4d8] whitespace-nowrap"
														>
															{m}
														</span>
													))}
												</div>
												{item.category && (
													<div className="mt-1 text-[10px] text-[#64748b] dark:text-[#a1a1aa] break-keep">
														{item.category}
													</div>
												)}
											</td>

											<td className="px-3 py-2.5 align-top min-w-56">
												<div className="flex flex-wrap items-center gap-1.5">
													{item.partNumber && (
														<span className="font-mono text-[11px] font-bold text-[#0284c7] dark:text-[#38bdf8]">
															[{item.partNumber}]
														</span>
													)}
													<span className="text-xs font-bold text-[#0f172a] dark:text-white break-keep">
														{item.name}
													</span>
												</div>
												{item.spec && (
													<p className="mt-0.5 text-[11px] text-[#64748b] dark:text-[#a1a1aa] break-keep">
														{item.spec}
													</p>
												)}
												{altPartText && (
													<div className="mt-1 inline-flex items-center gap-1 rounded-md bg-[#10b981]/10 border border-[#10b981]/30 px-2 py-0.5 text-[10px] font-semibold text-[#059669] dark:text-[#34d399] break-keep">
														<span>대체품: {altPartText}</span>
													</div>
												)}
												{item.manufacturer === "HSKorea" &&
													item.partNumber &&
													bomModels[0] && (
														<div className="mt-1">
															<button
																type="button"
																onClick={() =>
																	onJumpToBomPart(
																		bomModels[0] ?? "HATOX-2000",
																		item.partNumber,
																	)
																}
																className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563eb] dark:text-[#60a5fa] hover:underline"
															>
																<BookOpen size={11} />
																<span>장비 도해 위치 확인</span>
															</button>
														</div>
													)}
											</td>

											<td className="px-2.5 py-2.5 align-top text-center whitespace-nowrap">
												<span className="text-[11px] text-[#334155] dark:text-[#d4d4d8]">
													{item.cycle || "-"}
												</span>
											</td>

											<td className="px-3 py-2.5 align-top">
												<div className="flex flex-col items-center gap-0.5">
													<div className="inline-flex items-center rounded-xl border border-[#cbd5e1] dark:border-[#27272a] bg-[#f8fafc] dark:bg-[#09090b]">
														<button
															type="button"
															aria-label="수량 감소"
															onClick={() =>
																onUpdateEntry(item.id, {
																	selected: true,
																	qty: Math.max(0, (entry.qty ?? 1) - 1),
																})
															}
															className="inline-flex min-h-10 min-w-8 items-center justify-center text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
														>
															<Minus size={12} />
														</button>
														<input
															type="number"
															min={0}
															aria-label={`${item.name} 계획수량`}
															value={entry.qty}
															onChange={(e) => {
																const v = Math.max(
																	0,
																	Number.parseInt(e.target.value || "0", 10) ||
																		0,
																);
																onUpdateEntry(item.id, {
																	selected: v > 0 ? true : entry.selected,
																	qty: v,
																});
															}}
															className="w-10 bg-transparent text-center font-mono text-xs font-bold text-[#0f172a] dark:text-white focus:outline-none"
														/>
														<button
															type="button"
															aria-label="수량 증가"
															onClick={() =>
																onUpdateEntry(item.id, {
																	selected: true,
																	qty: (entry.qty ?? 0) + 1,
																})
															}
															className="inline-flex min-h-10 min-w-8 items-center justify-center text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
														>
															<Plus size={12} />
														</button>
													</div>
													<span className="font-mono text-[10px] text-[#64748b] dark:text-[#a1a1aa]">
														기준 {item.baseQty || "-"} {item.unit}
													</span>
												</div>
											</td>

											<td className="px-3 py-2.5 align-top text-right whitespace-nowrap">
												<div className="font-mono text-xs font-bold text-[#0f172a] dark:text-white">
													{formatWon(item.price26)}
												</div>
												{item.price25 !== null && (
													<div className="font-mono text-[10px] text-[#64748b] dark:text-[#a1a1aa]">
														25년: {formatWon(item.price25)}
													</div>
												)}
												{diff && (
													<div
														className={`font-mono text-[10px] font-semibold ${
															diff.isUp
																? "text-[#f59e0b] dark:text-[#fbbf24]"
																: "text-[#059669] dark:text-[#34d399]"
														}`}
													>
														{diff.label}
													</div>
												)}
												{source === "25" && (
													<span className="mt-0.5 inline-block rounded bg-[#f59e0b]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#f59e0b] dark:text-[#fbbf24]">
														25년단가 대체
													</span>
												)}
												{item.price26 === null && item.price25 === null && (
													<div className="mt-1 flex items-center justify-end">
														<input
															type="number"
															min={0}
															step={1000}
															placeholder="가견적 입력"
															aria-label={`${item.name} 가견적 단가`}
															value={entry.customPrice ?? ""}
															onChange={(e) => {
																const raw = e.target.value.trim();
																onUpdateEntry(item.id, {
																	customPrice:
																		raw === "" ? null : Number(raw) || 0,
																});
															}}
															className="min-h-10 w-24 rounded-lg border border-[#cbd5e1] dark:border-[#27272a] bg-[#f8fafc] dark:bg-[#09090b] px-2 text-right font-mono text-[11px] text-[#0f172a] dark:text-white focus:border-[#2563eb] focus:outline-none"
														/>
													</div>
												)}
											</td>

											<td className="px-3 py-2.5 align-top text-right whitespace-nowrap">
												{!isSelected ? (
													<span className="font-mono text-[11px] text-[#94a3b8] dark:text-[#52525b]">
														미포함
													</span>
												) : lineTotal !== null ? (
													<div className="font-mono text-xs font-bold text-[#2563eb] dark:text-[#60a5fa]">
														{formatWon(lineTotal)}
													</div>
												) : (
													<span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#f43f5e] dark:text-[#f87171]">
														<AlertCircle size={12} />
														견적필요
													</span>
												)}
											</td>

											<td className="px-3 py-2.5 align-top min-w-44">
												<div className="text-[10px] text-[#64748b] dark:text-[#a1a1aa] break-keep">
													{item.note || "-"}
												</div>
												<input
													type="text"
													value={entry.memo ?? ""}
													onChange={(e) =>
														onUpdateEntry(item.id, { memo: e.target.value })
													}
													placeholder="수량 산출근거 / 메모..."
													aria-label={`${item.name} 인수인계 메모`}
													className="mt-1 min-h-10 w-full rounded-lg border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] px-2.5 text-xs text-[#0f172a] dark:text-white placeholder-[#94a3b8] dark:placeholder-[#71717a] focus:border-[#2563eb] focus:outline-none"
												/>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</div>
	);
}
