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
	formatWon,
	type HandoverPlanState,
	MANUFACTURER_BADGE,
	type PlanLineEntry,
	parseBaseQty,
	resolveBudgetAccount,
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

				<div className="tabular-nums text-xs font-bold text-[#2563eb] dark:text-[#60a5fa] shrink-0">
					현재 목록 선정 {filteredSummary.selCount}건:{" "}
					{filteredSummary.selWon === 0
						? "0원"
						: formatWon(filteredSummary.selWon)}{" "}
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
									<th className="px-2 py-2.5 text-center whitespace-nowrap">
										포함
									</th>
									<th className="px-2.5 py-2.5 whitespace-nowrap">
										제조사 · 적용장비
									</th>
									<th className="px-2.5 py-2.5 whitespace-nowrap">
										품명 · 규격 · 호환대체품
									</th>
									<th className="px-2.5 py-2.5 whitespace-nowrap text-right">
										최초견적 / 입찰가
									</th>
									<th className="px-2 py-2.5 whitespace-nowrap text-center">
										계약량
									</th>
									<th className="px-2 py-2.5 whitespace-nowrap text-center">
										기성량 (1차 · 2차 · 3차)
									</th>
									<th className="px-2.5 py-2.5 whitespace-nowrap text-right">
										지출금액 / 계약액
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
									const { price } = resolveUnitPrice(item, entry);
									const resolvedBidPrice =
										entry.bidPrice !== undefined
											? entry.bidPrice
											: (item.bidPrice ?? null);
									const effectivePrice =
										resolvedBidPrice !== null ? resolvedBidPrice : price;
									const lineTotal =
										isSelected && effectivePrice !== null
											? effectivePrice * entry.qty
											: null;
									const q1 = entry.q1Qty ?? 0;
									const q2 = entry.q2Qty ?? 0;
									const q3 = entry.q3Qty ?? 0;
									const progressQty = q1 + q2 + q3;
									const spentTotal =
										effectivePrice !== null ? effectivePrice * progressQty : 0;

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
											<td className="px-2 py-2 align-middle text-center">
												<button
													type="button"
													aria-label={`${item.name} 발주 포함 토글`}
													onClick={() =>
														onUpdateEntry(item.id, { selected: !isSelected })
													}
													className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#2563eb] dark:text-[#60a5fa] hover:bg-[#2563eb]/10"
												>
													{isSelected ? (
														<CheckSquare size={16} />
													) : (
														<Square
															size={16}
															className="text-[#94a3b8] dark:text-[#52525b]"
														/>
													)}
												</button>
											</td>

											<td className="px-2.5 py-2 align-middle max-w-44">
												<div className="flex items-center gap-1 flex-wrap">
													<span
														className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${badgeClass}`}
													>
														{item.manufacturer}
													</span>
													{(() => {
														const acct = resolveBudgetAccount(item, entry);
														const isMat = acct === "material";
														return (
															<button
																type="button"
																onClick={() =>
																	onUpdateEntry(item.id, {
																		budgetAccount: isMat
																			? "maintenance"
																			: "material",
																	})
																}
																title="클릭하여 시설장비유지비 ↔ 재료비 전환"
																className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap transition-colors ${
																	isMat
																		? "bg-[#10b981]/15 text-[#059669] dark:text-[#34d399] border-[#10b981]/30 hover:bg-[#10b981]/25"
																		: "bg-[#f1f5f9] dark:bg-[#16161c] text-[#64748b] dark:text-[#a1a1aa] border-[#e2e8f0] dark:border-[#222228] hover:border-[#2563eb]/40"
																}`}
															>
																{isMat ? "재료비" : "유지비"}
															</button>
														);
													})()}
													<span className="text-[10px] font-medium text-[#64748b] dark:text-[#a1a1aa] whitespace-nowrap">
														{item.partGroup}
													</span>
												</div>
												{(() => {
													const models = splitModels(item.model);
													const first = models[0] ?? "-";
													const extra =
														models.length > 1 ? ` 외 ${models.length - 1}` : "";
													return (
														<div
															className="mt-1 tabular-nums text-[11px] font-semibold text-[#334155] dark:text-[#d4d4d8] whitespace-nowrap truncate"
															title={models.join(", ")}
														>
															{first}
															{extra && (
																<span className="text-[#64748b] dark:text-[#a1a1aa] font-normal">
																	{extra}
																</span>
															)}
														</div>
													);
												})()}
											</td>

											<td className="px-2.5 py-2 align-middle">
												<div className="flex flex-wrap items-center gap-1.5">
													{item.partNumber && (
														<span className="tabular-nums text-[11px] font-bold text-[#0284c7] dark:text-[#38bdf8]">
															[{item.partNumber}]
														</span>
													)}
													<span className="text-xs font-bold text-[#0f172a] dark:text-white break-keep">
														{item.name}
													</span>
													{item.cycle && (
														<span className="rounded bg-[#f1f5f9] dark:bg-[#16161c] px-1.5 py-0.5 text-[10px] font-medium text-[#64748b] dark:text-[#a1a1aa] whitespace-nowrap">
															{item.cycle}
														</span>
													)}
													{item.manufacturer === "HSKorea" &&
														item.partNumber &&
														bomModels[0] && (
															<button
																type="button"
																onClick={() =>
																	onJumpToBomPart(
																		bomModels[0] ?? "HATOX-2000",
																		item.partNumber,
																	)
																}
																className="inline-flex items-center gap-0.5 rounded bg-[#2563eb]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#2563eb] dark:text-[#60a5fa] hover:bg-[#2563eb]/25 whitespace-nowrap"
															>
																<BookOpen size={10} />
																<span>도해</span>
															</button>
														)}
												</div>
												{(item.spec || altPartText || item.note) && (
													<div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
														{item.spec && (
															<span
																className="text-[#64748b] dark:text-[#a1a1aa] truncate max-w-56"
																title={item.spec}
															>
																{item.spec}
															</span>
														)}
														{altPartText && (
															<span
																className="inline-flex items-center rounded bg-[#10b981]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#059669] dark:text-[#34d399] truncate max-w-56"
																title={`대체품: ${altPartText}`}
															>
																대체: {altPartText}
															</span>
														)}
													</div>
												)}
											</td>

											{/* 최초견적 / 산출내역서(입찰가) — 화살표 없음 */}
											<td className="px-2.5 py-2 align-middle text-right whitespace-nowrap">
												<div className="flex flex-col items-end gap-1">
													{item.price26 === null && item.price25 === null ? (
														<input
															type="text"
															inputMode="numeric"
															placeholder="최초견적"
															aria-label={`${item.name} 최초견적 단가`}
															value={
																entry.customPrice
																	? entry.customPrice.toLocaleString("ko-KR")
																	: ""
															}
															onChange={(e) => {
																const cleaned = e.target.value.replace(
																	/[^0-9]/g,
																	"",
																);
																onUpdateEntry(item.id, {
																	customPrice: cleaned
																		? Number.parseInt(cleaned, 10)
																		: null,
																});
															}}
															className="h-7 w-24 rounded-md border border-[#cbd5e1] dark:border-[#27272a] bg-[#f8fafc] dark:bg-[#09090b] px-2 text-right tabular-nums text-[11px] text-[#0f172a] dark:text-white focus:border-[#2563eb] focus:outline-none"
														/>
													) : (
														<div className="tabular-nums text-xs font-bold text-[#0f172a] dark:text-white">
															{formatWon(item.price26 ?? item.price25)}
														</div>
													)}
													<input
														type="text"
														inputMode="numeric"
														placeholder="입찰가(낙찰)"
														aria-label={`${item.name} 산출내역서 입찰가`}
														value={
															resolvedBidPrice
																? resolvedBidPrice.toLocaleString("ko-KR")
																: ""
														}
														onChange={(e) => {
															const cleaned = e.target.value.replace(
																/[^0-9]/g,
																"",
															);
															onUpdateEntry(item.id, {
																bidPrice: cleaned
																	? Number.parseInt(cleaned, 10)
																	: null,
															});
														}}
														className="h-6 w-24 rounded-md border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] px-2 text-right tabular-nums text-[10px] font-semibold text-[#059669] dark:text-[#34d399] placeholder:text-[#94a3b8] dark:placeholder:text-[#52525b] focus:border-[#10b981] focus:outline-none"
													/>
												</div>
											</td>

											{/* 계약량 */}
											<td className="px-2 py-2 align-middle">
												<div className="flex flex-col items-center gap-0.5">
													<div className="inline-flex items-center rounded-lg border border-[#cbd5e1] dark:border-[#27272a] bg-[#f8fafc] dark:bg-[#09090b]">
														<button
															type="button"
															aria-label="계약량 감소"
															onClick={() =>
																onUpdateEntry(item.id, {
																	selected: true,
																	qty: Math.max(0, (entry.qty ?? 1) - 1),
																})
															}
															className="inline-flex h-7 w-6 items-center justify-center text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
														>
															<Minus size={11} />
														</button>
														<input
															type="text"
															inputMode="numeric"
															aria-label={`${item.name} 계약량`}
															value={entry.qty}
															onChange={(e) => {
																const cleaned = e.target.value.replace(
																	/[^0-9]/g,
																	"",
																);
																const v = cleaned
																	? Number.parseInt(cleaned, 10)
																	: 0;
																onUpdateEntry(item.id, {
																	selected: v > 0 ? true : entry.selected,
																	qty: v,
																});
															}}
															className="w-9 bg-transparent text-center tabular-nums text-xs font-bold text-[#0f172a] dark:text-white focus:outline-none"
														/>
														<button
															type="button"
															aria-label="계약량 증가"
															onClick={() =>
																onUpdateEntry(item.id, {
																	selected: true,
																	qty: (entry.qty ?? 0) + 1,
																})
															}
															className="inline-flex h-7 w-6 items-center justify-center text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
														>
															<Plus size={11} />
														</button>
													</div>
													<span className="tabular-nums text-[10px] text-[#64748b] dark:text-[#a1a1aa]">
														기준 {item.baseQty || "-"} {item.unit}
													</span>
												</div>
											</td>

											{/* 1차(5월) · 2차(8월) · 3차(11월) 기성량 */}
											<td className="px-2 py-2 align-middle">
												<div className="flex flex-col items-center gap-1">
													<div className="flex items-center gap-1">
														{(
															[
																["q1Qty", "1차"],
																["q2Qty", "2차"],
																["q3Qty", "3차"],
															] as const
														).map(([field, label]) => (
															<input
																key={field}
																type="text"
																inputMode="numeric"
																aria-label={`${item.name} ${label} 기성량`}
																placeholder={label}
																value={entry[field] ? String(entry[field]) : ""}
																onChange={(e) => {
																	const cleaned = e.target.value.replace(
																		/[^0-9]/g,
																		"",
																	);
																	onUpdateEntry(item.id, {
																		[field]: cleaned
																			? Number.parseInt(cleaned, 10)
																			: 0,
																	});
																}}
																className="h-7 w-11 rounded-md border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] px-1 text-center tabular-nums text-[11px] font-semibold text-[#0f172a] dark:text-white placeholder:text-[#94a3b8] dark:placeholder:text-[#52525b] focus:border-[#2563eb] focus:outline-none"
															/>
														))}
													</div>
													<span className="tabular-nums text-[10px] text-[#64748b] dark:text-[#a1a1aa]">
														누계 {progressQty} / 잔여{" "}
														{Math.max(0, entry.qty - progressQty)}
													</span>
												</div>
											</td>

											{/* 지출금액 / 계약예상액 */}
											<td className="px-2.5 py-2 align-middle text-right whitespace-nowrap">
												<div className="tabular-nums text-xs font-extrabold text-[#059669] dark:text-[#34d399]">
													{spentTotal > 0 ? formatWon(spentTotal) : "0원"}
												</div>
												<div className="tabular-nums text-[10px] text-[#64748b] dark:text-[#a1a1aa]">
													{!isSelected ? (
														"미포함"
													) : lineTotal !== null ? (
														<span>계약 {formatWon(lineTotal)}</span>
													) : (
														<span className="inline-flex items-center gap-0.5 text-[#f43f5e] dark:text-[#f87171] font-semibold">
															<AlertCircle size={10} />
															견적필요
														</span>
													)}
												</div>
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
