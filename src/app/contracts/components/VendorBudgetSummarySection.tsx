"use client";

import { ArrowRight, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import {
	MANUFACTURER_CONTRACT_LIST,
	type ManufacturerCategory,
} from "../contractRules";
import {
	type ConsumableItem,
	type HandoverPlanState,
	parseBaseQty,
	resolveBudgetAccount,
	resolveUnitPrice,
} from "../types";

export type VendorExecStatus = "미정" | "계획" | "계약진행" | "지출중" | "완료";

export interface VendorBudgetEntry {
	status: VendorExecStatus;
	maintContract: number;
	maintNonContract: number;
	matContract: number;
	matNonContract: number;
	spentAmount: number;
	/** true면 단가표 단가가 이미 VAT 포함(×1.0), false(기본)면 VAT 별도(×1.1) */
	vatIncluded?: boolean;
}

interface VendorBudgetSummarySectionProps {
	items: ConsumableItem[];
	plan: HandoverPlanState;
	onJumpToManufacturer: (mfg: string, onlyUnpriced?: boolean) => void;
}

const STORAGE_KEY = "wms_vendor_budget_summary_v1";

/** 제조사 카드 ID → 단가표 마스터 manufacturer 명칭 매핑 */
const MASTER_MFG_MAP: Record<string, string> = {
	"mfg-hsk": "HSKorea",
	"mfg-ysi": "YSI",
	"mfg-shimadzu": "시마즈",
	"mfg-baeknyeon": "백년기술",
	"mfg-kisul": "기술과환경",
	"mfg-saerom": "새론이엔아이",
	"mfg-knr": "KNR",
	"mfg-easychem": "EasyChem",
	"mfg-tieng": "티아이시스템",
	"mfg-spex": "스펙스",
	"mfg-jmenv": "제이엠이엔비",
	"mfg-blprocess": "BL프로세스",
};

const DEFAULT_ENTRY: VendorBudgetEntry = {
	status: "미정",
	maintContract: 0,
	maintNonContract: 0,
	matContract: 0,
	matNonContract: 0,
	spentAmount: 0,
};

const STATUS_BADGE: Record<VendorExecStatus, string> = {
	미정: "bg-[#f1f5f9] dark:bg-[#16161c] text-[#64748b] dark:text-[#a1a1aa] border-[#e2e8f0] dark:border-[#222228]",
	계획: "bg-[#2563eb]/15 text-[#2563eb] dark:text-[#60a5fa] border-[#2563eb]/30",
	계약진행:
		"bg-[#f59e0b]/15 text-[#f59e0b] dark:text-[#fbbf24] border-[#f59e0b]/30",
	지출중:
		"bg-[#38bdf8]/15 text-[#0284c7] dark:text-[#38bdf8] border-[#38bdf8]/30",
	완료: "bg-[#10b981]/15 text-[#059669] dark:text-[#34d399] border-[#10b981]/30",
};

function formatWonNum(val: number): string {
	if (!val) return "0원";
	return `${val.toLocaleString("ko-KR")}원`;
}

function parseNumInput(raw: string): number {
	const cleaned = raw.replace(/[^0-9]/g, "");
	return cleaned ? Number.parseInt(cleaned, 10) : 0;
}

export default function VendorBudgetSummarySection({
	items,
	plan,
	onJumpToManufacturer,
}: VendorBudgetSummarySectionProps) {
	const [entries, setEntries] = useState<Record<string, VendorBudgetEntry>>({});
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [catFilter, setCatFilter] = useState<
		"전체" | ManufacturerCategory | "독점"
	>("전체");
	const [query, setQuery] = useState("");
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				setEntries(JSON.parse(raw) as Record<string, VendorBudgetEntry>);
			}
		} catch {
			// ignore storage errors
		} finally {
			setHydrated(true);
		}
	}, []);

	useEffect(() => {
		if (!hydrated) return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
		} catch {
			// ignore storage errors
		}
	}, [entries, hydrated]);

	const getEntry = (id: string): VendorBudgetEntry =>
		entries[id] ?? DEFAULT_ENTRY;

	const updateEntry = (id: string, patch: Partial<VendorBudgetEntry>) => {
		setEntries((prev) => ({
			...prev,
			[id]: { ...(prev[id] ?? DEFAULT_ENTRY), ...patch },
		}));
	};

	// 단가표(구매·예산 산출) 연동 집계 (시설장비유지비 / 재료비 품목별 분리)
	const getMasterStats = (rowId: string, vatIncluded = false) => {
		const masterMfg = MASTER_MFG_MAP[rowId];
		if (!masterMfg) return null;
		const vatFactor = vatIncluded ? 1 : 1.1;
		const mfgItems = items.filter((i) => i.manufacturer === masterMfg);
		let selectedCount = 0;
		let selectedMaintRaw = 0;
		let selectedMatRaw = 0;
		let masterMaintRaw = 0;
		let masterMatRaw = 0;
		let progressSpentRaw = 0;
		let progressQtyTotal = 0;

		for (const item of mfgItems) {
			const entry = plan.entries[item.id];
			const { price } = resolveUnitPrice(item, entry);
			const resolvedBidPrice =
				entry?.bidPrice !== undefined
					? entry.bidPrice
					: (item.bidPrice ?? null);
			const effectivePrice =
				resolvedBidPrice !== null ? resolvedBidPrice : price;
			const acct = resolveBudgetAccount(item, entry);

			if (effectivePrice !== null) {
				const baseLine = effectivePrice * parseBaseQty(item.baseQty);
				if (acct === "material") {
					masterMatRaw += baseLine;
				} else {
					masterMaintRaw += baseLine;
				}
			}
			const qSum =
				(entry?.q1Qty ?? 0) + (entry?.q2Qty ?? 0) + (entry?.q3Qty ?? 0);
			if (qSum > 0) {
				progressQtyTotal += qSum;
				if (effectivePrice !== null) {
					progressSpentRaw += effectivePrice * qSum;
				}
			}
			if (!entry?.selected) continue;
			selectedCount++;
			if (effectivePrice !== null) {
				const selLine =
					effectivePrice * (entry.qty ?? parseBaseQty(item.baseQty));
				if (acct === "material") {
					selectedMatRaw += selLine;
				} else {
					selectedMaintRaw += selLine;
				}
			}
		}

		const useSelected = selectedCount > 0;
		const maintContractVatIncl = Math.round(
			(useSelected ? selectedMaintRaw : masterMaintRaw) * vatFactor,
		);
		const matContractVatIncl = Math.round(
			(useSelected ? selectedMatRaw : masterMatRaw) * vatFactor,
		);

		return {
			masterMfg,
			masterCount: mfgItems.length,
			selectedCount,
			selectedSumVatIncl: Math.round(
				(selectedMaintRaw + selectedMatRaw) * vatFactor,
			),
			masterSumVatIncl: Math.round((masterMaintRaw + masterMatRaw) * vatFactor),
			maintContractVatIncl,
			matContractVatIncl,
			progressSpentVatIncl: Math.round(progressSpentRaw * vatFactor),
			progressQtyTotal,
		};
	};

	const filteredRows = MANUFACTURER_CONTRACT_LIST.filter((r) => {
		if (catFilter === "독점" && !r.isExclusive) return false;
		if (
			catFilter !== "전체" &&
			catFilter !== "독점" &&
			r.category !== catFilter
		)
			return false;
		const q = query.trim().toLowerCase();
		if (!q) return true;
		return (
			r.name.toLowerCase().includes(q) ||
			r.equipment.toLowerCase().includes(q) ||
			r.maintenanceItems.toLowerCase().includes(q) ||
			r.materialItems.toLowerCase().includes(q) ||
			r.note.toLowerCase().includes(q)
		);
	});

	// 필터 기준 합계 집계 (집행률은 계약 금액 대비 계약 지출액만 산정, 비계약 제외)
	let totalMaintContract = 0;
	let totalMaintNonContract = 0;
	let totalMatContract = 0;
	let totalMatNonContract = 0;
	let totalContractSpent = 0;

	for (const row of filteredRows) {
		const e = getEntry(row.id);
		const master = getMasterStats(row.id, Boolean(e.vatIncluded));
		const maintContractVal = master
			? master.maintContractVatIncl
			: e.maintContract;
		const matContractVal = master ? master.matContractVatIncl : e.matContract;
		const contractSpentVal = master
			? master.progressSpentVatIncl
			: e.spentAmount;

		totalMaintContract += maintContractVal;
		totalMaintNonContract += e.maintNonContract;
		totalMatContract += matContractVal;
		totalMatNonContract += e.matNonContract;
		totalContractSpent += contractSpentVal;
	}

	const totalMaint = totalMaintContract + totalMaintNonContract;
	const totalMat = totalMatContract + totalMatNonContract;
	const totalContract = totalMaintContract + totalMatContract;
	const totalNonContract = totalMaintNonContract + totalMatNonContract;
	const grandTotal = totalMaint + totalMat;
	const execRate =
		totalContract > 0
			? Math.min(100, Math.round((totalContractSpent / totalContract) * 100))
			: 0;

	return (
		<section className="rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] p-5 shadow-sm space-y-4">
			{/* 헤더 */}
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] dark:border-[#222228] pb-3.5">
				<div className="flex items-center gap-2.5">
					<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2563eb]/15 text-[#2563eb] dark:text-[#60a5fa] shrink-0">
						<BarChart3 size={15} />
					</span>
					<h2 className="text-base font-extrabold tracking-tight text-[#0f172a] dark:text-white">
						제조사(대리점)별 계약 기준 · 예산·집행 통합 현황
					</h2>
					<span className="rounded-md bg-[#f1f5f9] dark:bg-[#16161c] px-2 py-0.5 tabular-nums text-[11px] font-semibold text-[#64748b] dark:text-[#a1a1aa]">
						{filteredRows.length}개 항목
					</span>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="업체·장비·품목 검색"
						className="h-8 w-40 rounded-lg border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] px-2.5 text-xs text-[#0f172a] dark:text-white placeholder:text-[#94a3b8] dark:placeholder:text-[#71717a] focus:border-[#2563eb] focus:outline-none"
					/>
					<div className="flex items-center gap-1 rounded-lg bg-[#f1f5f9] dark:bg-[#09090b] p-1 border border-[#e2e8f0] dark:border-[#222228]">
						{(
							["전체", "국가망", "소규모", "부대장비·기타", "독점"] as const
						).map((cat) => {
							const active = catFilter === cat;
							return (
								<button
									key={cat}
									type="button"
									onClick={() => setCatFilter(cat)}
									className={`rounded-md px-2 py-1 text-[11px] font-bold transition-colors whitespace-nowrap ${
										active
											? "bg-white dark:bg-[#16161c] text-[#2563eb] dark:text-[#60a5fa] shadow-xs"
											: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
									}`}
								>
									{cat}
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* 요약 KPI 4칸 */}
			<div className="grid grid-cols-4 gap-3">
				<div className="rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] p-3.5 space-y-1">
					<div className="text-[11px] font-bold text-[#64748b] dark:text-[#a1a1aa]">
						시설장비유지비
					</div>
					<div className="tabular-nums text-base font-extrabold text-[#0f172a] dark:text-white">
						{formatWonNum(totalMaintContract)}
						<span className="ml-1 text-[10px] font-semibold text-[#64748b] dark:text-[#a1a1aa]">
							(계약)
						</span>
					</div>
					<div className="tabular-nums text-[11px] text-[#64748b] dark:text-[#a1a1aa]">
						비계약 {formatWonNum(totalMaintNonContract)} · 총{" "}
						{formatWonNum(totalMaint)}
					</div>
				</div>

				<div className="rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] p-3.5 space-y-1">
					<div className="text-[11px] font-bold text-[#059669] dark:text-[#34d399]">
						재료비
					</div>
					<div className="tabular-nums text-base font-extrabold text-[#0f172a] dark:text-white">
						{formatWonNum(totalMatContract)}
						<span className="ml-1 text-[10px] font-semibold text-[#64748b] dark:text-[#a1a1aa]">
							(계약)
						</span>
					</div>
					<div className="tabular-nums text-[11px] text-[#64748b] dark:text-[#a1a1aa]">
						비계약 {formatWonNum(totalMatNonContract)} · 총{" "}
						{formatWonNum(totalMat)}
					</div>
				</div>

				<div className="rounded-xl border border-[#2563eb]/30 bg-[#2563eb]/5 dark:bg-[#2563eb]/10 p-3.5 space-y-1">
					<div className="text-[11px] font-bold text-[#2563eb] dark:text-[#60a5fa]">
						계약 금액 합계 (유지비+재료비)
					</div>
					<div className="tabular-nums text-base font-extrabold text-[#0f172a] dark:text-white">
						{formatWonNum(totalContract)}
					</div>
					<div className="tabular-nums text-[11px] text-[#64748b] dark:text-[#a1a1aa]">
						비계약 별도 {formatWonNum(totalNonContract)} · 전체{" "}
						{formatWonNum(grandTotal)}
					</div>
				</div>

				<div className="rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] p-3.5 space-y-1.5">
					<div className="flex items-center justify-between text-[11px] font-bold">
						<span className="text-[#0284c7] dark:text-[#38bdf8]">
							계약 지출(집행)액
						</span>
						<span className="tabular-nums text-[#0f172a] dark:text-white">
							{execRate}%
						</span>
					</div>
					<div className="tabular-nums text-base font-extrabold text-[#0f172a] dark:text-white">
						{formatWonNum(totalContractSpent)}
					</div>
					<div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e2e8f0] dark:bg-[#222228]">
						<div
							className="h-full rounded-full bg-[#2563eb] transition-all"
							style={{ width: `${execRate}%` }}
						/>
					</div>
				</div>
			</div>

			{/* 본문: 종합 표 + 행 클릭 시 상세 카드 펼침 */}
			{filteredRows.length === 0 ? (
				<div className="rounded-xl border border-dashed border-[#cbd5e1] dark:border-[#222228] py-8 text-center text-xs text-[#64748b] dark:text-[#a1a1aa]">
					검색 조건에 일치하는 업체가 없습니다.
				</div>
			) : (
				<div className="overflow-x-auto rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b]">
					<table className="w-full border-collapse text-xs">
						<thead>
							<tr className="border-b border-[#e2e8f0] dark:border-[#222228] bg-[#f1f5f9] dark:bg-[#16161c] text-[11px] font-bold text-[#64748b] dark:text-[#a1a1aa]">
								<th className="px-3 py-2.5 text-left whitespace-nowrap">
									업체 · 장비
								</th>
								<th className="px-2 py-2.5 text-center whitespace-nowrap">
									상태
								</th>
								<th className="px-2 py-2.5 text-center whitespace-nowrap">
									VAT
								</th>
								<th className="px-2.5 py-2.5 text-right whitespace-nowrap">
									시설장비유지비(계약)
								</th>
								<th className="px-2.5 py-2.5 text-right whitespace-nowrap">
									시설장비유지비(비계약)
								</th>
								<th className="px-2.5 py-2.5 text-right whitespace-nowrap text-[#059669] dark:text-[#34d399]">
									재료비(계약)
								</th>
								<th className="px-2.5 py-2.5 text-right whitespace-nowrap text-[#059669] dark:text-[#34d399]">
									재료비(비계약)
								</th>
								<th className="px-2.5 py-2.5 text-right whitespace-nowrap text-[#0284c7] dark:text-[#38bdf8]">
									계약 지출액
								</th>
								<th className="px-3 py-2.5 text-right whitespace-nowrap">
									계약합계 · 집행률
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#e2e8f0] dark:divide-[#222228]">
							{filteredRows.map((row) => {
								const e = getEntry(row.id);
								const master = getMasterStats(row.id, Boolean(e.vatIncluded));
								const maintContractVal = master
									? master.maintContractVatIncl
									: e.maintContract;
								const matContractVal = master
									? master.matContractVatIncl
									: e.matContract;
								const rowContractTotal = maintContractVal + matContractVal;
								const rowContractSpent = master
									? master.progressSpentVatIncl
									: e.spentAmount;
								const rowRate =
									rowContractTotal > 0
										? Math.min(
												100,
												Math.round((rowContractSpent / rowContractTotal) * 100),
											)
										: 0;
								const isExpanded = expandedId === row.id;

								return (
									<Fragment key={row.id}>
										<tr
											className={`transition-colors ${
												isExpanded
													? "bg-[#2563eb]/5 dark:bg-[#2563eb]/10"
													: "hover:bg-[#2563eb]/5 dark:hover:bg-[#2563eb]/10"
											}`}
										>
											<td className="px-2.5 py-2 whitespace-nowrap">
												<button
													type="button"
													onClick={() =>
														setExpandedId(isExpanded ? null : row.id)
													}
													className="flex items-center gap-1.5 text-left group"
												>
													<span className="text-[#94a3b8] dark:text-[#71717a] group-hover:text-[#2563eb] dark:group-hover:text-[#60a5fa]">
														{isExpanded ? (
															<ChevronUp size={13} />
														) : (
															<ChevronDown size={13} />
														)}
													</span>
													<div>
														<div className="flex items-center gap-1">
															<span className="font-bold text-[#0f172a] dark:text-white group-hover:text-[#2563eb] dark:group-hover:text-[#60a5fa]">
																{row.name}
															</span>
															{row.isExclusive && (
																<span className="rounded px-1 py-0.5 text-[10px] font-bold bg-[#f59e0b]/15 text-[#f59e0b] dark:text-[#fbbf24]">
																	독점
																</span>
															)}
															{master && (
																<span className="rounded bg-[#2563eb]/15 px-1 py-0.5 text-[10px] font-bold text-[#2563eb] dark:text-[#60a5fa]">
																	단가표
																</span>
															)}
														</div>
														<div className="text-[10px] text-[#64748b] dark:text-[#a1a1aa] truncate max-w-[130px]">
															{row.equipment}
														</div>
													</div>
												</button>
											</td>
											<td className="px-1 py-2 text-center">
												<select
													aria-label={`${row.name} 진행상태`}
													value={e.status}
													onChange={(ev) =>
														updateEntry(row.id, {
															status: ev.target.value as VendorExecStatus,
														})
													}
													className={`h-7 rounded-md border px-1 text-[11px] font-bold focus:outline-none ${STATUS_BADGE[e.status]}`}
												>
													{(
														[
															"미정",
															"계획",
															"계약진행",
															"지출중",
															"완료",
														] as const
													).map((st) => (
														<option
															key={st}
															value={st}
															className="bg-white dark:bg-[#111115] text-[#0f172a] dark:text-white"
														>
															{st}
														</option>
													))}
												</select>
											</td>
											{/* VAT 포함/별도 토글 */}
											<td className="px-2 py-2 text-center whitespace-nowrap">
												{master ? (
													<button
														type="button"
														onClick={() =>
															updateEntry(row.id, {
																vatIncluded: !e.vatIncluded,
															})
														}
														title={
															e.vatIncluded
																? "단가표 금액이 VAT 포함(×1.0) — 클릭하여 별도(×1.1)로 전환"
																: "단가표 금액이 VAT 별도(×1.1) — 클릭하여 포함(×1.0)으로 전환"
														}
														className={`h-6 rounded px-2 text-[10px] font-bold transition-colors ${
															e.vatIncluded
																? "bg-[#2563eb]/15 text-[#2563eb] dark:text-[#60a5fa]"
																: "bg-[#f1f5f9] dark:bg-[#16161c] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
														}`}
													>
														{e.vatIncluded ? "포함" : "별도"}
													</button>
												) : (
													<span className="text-[11px] text-[#cbd5e1] dark:text-[#3f3f46]">
														-
													</span>
												)}
											</td>

											{/* 시설장비유지비(계약): 단가표 연동 제조사는 깔끔한 클릭 텍스트 */}
											<td className="px-2.5 py-2 text-right whitespace-nowrap">
												{master ? (
													<button
														type="button"
														onClick={() =>
															onJumpToManufacturer(master.masterMfg, false)
														}
														title={`단가표 이동 (${master.selectedCount > 0 ? `선정 ${master.selectedCount}종` : `기준 ${master.masterCount}종`})`}
														className={`tabular-nums text-xs font-bold transition-colors hover:underline ${
															maintContractVal > 0
																? "text-[#2563eb] dark:text-[#60a5fa]"
																: "text-[#cbd5e1] dark:text-[#3f3f46] font-normal"
														}`}
													>
														{maintContractVal > 0
															? formatWonNum(maintContractVal)
															: "-"}
													</button>
												) : (
													<input
														type="text"
														inputMode="numeric"
														aria-label={`${row.name} 시설장비유지비 계약금액`}
														value={
															e.maintContract
																? e.maintContract.toLocaleString("ko-KR")
																: ""
														}
														onChange={(ev) =>
															updateEntry(row.id, {
																maintContract: parseNumInput(ev.target.value),
															})
														}
														placeholder="0"
														className="h-7 w-24 rounded-md border border-transparent hover:border-[#cbd5e1] dark:hover:border-[#3f3f46] focus:border-[#2563eb] bg-transparent focus:bg-white dark:focus:bg-[#111115] px-2 text-right tabular-nums text-xs text-[#0f172a] dark:text-white placeholder:text-[#cbd5e1] dark:placeholder:text-[#3f3f46] focus:outline-none transition-colors"
													/>
												)}
											</td>

											{/* 시설장비유지비(비계약): 수기 입력 */}
											<td className="px-2.5 py-2 text-right whitespace-nowrap">
												<input
													type="text"
													inputMode="numeric"
													aria-label={`${row.name} 시설장비유지비 비계약금액`}
													value={
														e.maintNonContract
															? e.maintNonContract.toLocaleString("ko-KR")
															: ""
													}
													onChange={(ev) =>
														updateEntry(row.id, {
															maintNonContract: parseNumInput(ev.target.value),
														})
													}
													placeholder="0"
													className="h-7 w-24 rounded-md border border-transparent hover:border-[#cbd5e1] dark:hover:border-[#3f3f46] focus:border-[#2563eb] bg-transparent focus:bg-white dark:focus:bg-[#111115] px-2 text-right tabular-nums text-xs text-[#0f172a] dark:text-white placeholder:text-[#cbd5e1] dark:placeholder:text-[#3f3f46] focus:outline-none transition-colors"
												/>
											</td>

											{/* 재료비(계약): 단가표 연동 제조사는 깔끔한 클릭 텍스트 */}
											<td className="px-2.5 py-2 text-right whitespace-nowrap">
												{master ? (
													<button
														type="button"
														onClick={() =>
															onJumpToManufacturer(master.masterMfg, false)
														}
														title="클릭하여 단가표에서 재료비 품목 확인"
														className={`tabular-nums text-xs font-bold transition-colors hover:underline ${
															matContractVal > 0
																? "text-[#059669] dark:text-[#34d399]"
																: "text-[#cbd5e1] dark:text-[#3f3f46] font-normal"
														}`}
													>
														{matContractVal > 0
															? formatWonNum(matContractVal)
															: "-"}
													</button>
												) : (
													<input
														type="text"
														inputMode="numeric"
														aria-label={`${row.name} 재료비 계약금액`}
														value={
															e.matContract
																? e.matContract.toLocaleString("ko-KR")
																: ""
														}
														onChange={(ev) =>
															updateEntry(row.id, {
																matContract: parseNumInput(ev.target.value),
															})
														}
														placeholder="0"
														className="h-7 w-24 rounded-md border border-transparent hover:border-[#cbd5e1] dark:hover:border-[#3f3f46] focus:border-[#2563eb] bg-transparent focus:bg-white dark:focus:bg-[#111115] px-2 text-right tabular-nums text-xs text-[#0f172a] dark:text-white placeholder:text-[#cbd5e1] dark:placeholder:text-[#3f3f46] focus:outline-none transition-colors"
													/>
												)}
											</td>

											{/* 재료비(비계약): 수기 입력 */}
											<td className="px-2.5 py-2 text-right whitespace-nowrap">
												<input
													type="text"
													inputMode="numeric"
													aria-label={`${row.name} 재료비 비계약금액`}
													value={
														e.matNonContract
															? e.matNonContract.toLocaleString("ko-KR")
															: ""
													}
													onChange={(ev) =>
														updateEntry(row.id, {
															matNonContract: parseNumInput(ev.target.value),
														})
													}
													placeholder="0"
													className="h-7 w-24 rounded-md border border-transparent hover:border-[#cbd5e1] dark:hover:border-[#3f3f46] focus:border-[#2563eb] bg-transparent focus:bg-white dark:focus:bg-[#111115] px-2 text-right tabular-nums text-xs text-[#0f172a] dark:text-white placeholder:text-[#cbd5e1] dark:placeholder:text-[#3f3f46] focus:outline-none transition-colors"
												/>
											</td>

											{/* 계약 지출액: 단가표 연동 시 1~3차 기성합계 */}
											<td className="px-2.5 py-2 text-right whitespace-nowrap">
												{master ? (
													<span
														title="단가표 1~3차 기성량 합계"
														className={`tabular-nums text-xs font-bold ${
															rowContractSpent > 0
																? "text-[#0284c7] dark:text-[#38bdf8]"
																: "text-[#cbd5e1] dark:text-[#3f3f46] font-normal"
														}`}
													>
														{rowContractSpent > 0
															? formatWonNum(rowContractSpent)
															: "-"}
													</span>
												) : (
													<input
														type="text"
														inputMode="numeric"
														aria-label={`${row.name} 계약 지출액`}
														value={
															e.spentAmount
																? e.spentAmount.toLocaleString("ko-KR")
																: ""
														}
														onChange={(ev) =>
															updateEntry(row.id, {
																spentAmount: parseNumInput(ev.target.value),
															})
														}
														placeholder="0"
														className="h-7 w-24 rounded-md border border-transparent hover:border-[#cbd5e1] dark:hover:border-[#3f3f46] focus:border-[#2563eb] bg-transparent focus:bg-white dark:focus:bg-[#111115] px-2 text-right tabular-nums text-xs text-[#0f172a] dark:text-white placeholder:text-[#cbd5e1] dark:placeholder:text-[#3f3f46] focus:outline-none transition-colors"
													/>
												)}
											</td>
											<td className="px-3 py-2 text-right whitespace-nowrap">
												<div className="tabular-nums text-xs font-bold text-[#0f172a] dark:text-white">
													{rowContractTotal > 0
														? formatWonNum(rowContractTotal)
														: "-"}
												</div>
												<div className="tabular-nums text-[10px] font-semibold text-[#64748b] dark:text-[#a1a1aa]">
													{rowRate}%
													{e.maintNonContract + e.matNonContract > 0
														? ` · 비계약 ${formatWonNum(e.maintNonContract + e.matNonContract)}`
														: ""}
												</div>
											</td>
										</tr>

										{/* 행 하단 확장 상세 카드 */}
										{isExpanded && (
											<tr className="bg-white dark:bg-[#111115]">
												<td colSpan={9} className="px-4 py-3">
													<div className="grid grid-cols-3 gap-3 rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] p-3 text-[11px]">
														<div className="space-y-1.5">
															<div className="flex items-center gap-1.5 font-bold text-[#64748b] dark:text-[#a1a1aa]">
																<span>적용 장비 · 구분</span>
																<span className="rounded bg-[#f1f5f9] dark:bg-[#16161c] px-1.5 py-0.5 text-[10px]">
																	{row.category}
																</span>
															</div>
															<div className="font-bold text-[#2563eb] dark:text-[#60a5fa] break-keep">
																{row.equipment}
															</div>
															{master && (
																<div className="flex items-center justify-between gap-2 pt-1">
																	<span className="tabular-nums text-[10px] text-[#64748b] dark:text-[#a1a1aa]">
																		{master.selectedCount > 0
																			? `선정 ${master.selectedCount}/${master.masterCount}종 · ${formatWonNum(master.selectedSumVatIncl)}`
																			: `등록 ${master.masterCount}종 · 기준합계 ${formatWonNum(master.masterSumVatIncl)}`}
																	</span>
																	<button
																		type="button"
																		onClick={() =>
																			onJumpToManufacturer(
																				master.masterMfg,
																				false,
																			)
																		}
																		className="inline-flex items-center gap-0.5 font-bold text-[#2563eb] dark:text-[#60a5fa] hover:underline"
																	>
																		<span>단가표 이동</span>
																		<ArrowRight size={11} />
																	</button>
																</div>
															)}
														</div>

														<div className="space-y-1.5 border-l border-[#e2e8f0] dark:border-[#222228] pl-3">
															<div className="font-bold text-[#64748b] dark:text-[#a1a1aa]">
																유지비 · 재료비 품목
															</div>
															<div className="text-[#334155] dark:text-[#d4d4d8] break-keep">
																<strong className="text-[#64748b] dark:text-[#a1a1aa]">
																	유지비:
																</strong>{" "}
																{row.maintenanceItems}
															</div>
															<div className="flex items-center gap-1.5">
																<strong className="text-[#64748b] dark:text-[#a1a1aa]">
																	재료비:
																</strong>
																{row.materialItems === "-" ? (
																	<span className="text-[#94a3b8] dark:text-[#52525b]">
																		-
																	</span>
																) : (
																	<span className="inline-flex items-center rounded bg-[#10b981]/15 border border-[#10b981]/30 px-1.5 py-0.5 text-[10px] font-bold text-[#059669] dark:text-[#34d399]">
																		{row.materialItems}
																	</span>
																)}
															</div>
														</div>

														<div className="space-y-1.5 border-l border-[#e2e8f0] dark:border-[#222228] pl-3">
															<div className="font-bold text-[#64748b] dark:text-[#a1a1aa]">
																발주 · 견적 특이사항
															</div>
															<div className="text-[#334155] dark:text-[#d4d4d8] break-keep leading-snug">
																{row.note}
															</div>
														</div>
													</div>
												</td>
											</tr>
										)}
									</Fragment>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}
