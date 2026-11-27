"use client";

import {
	ArrowRight,
	Calendar,
	Gavel,
	Info,
	Scale,
	ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import {
	COMPETITIVE_TIERS,
	DIRECT_PURCHASE_CRITERIA,
	type ProcessActor,
	PURCHASE_TYPES,
	type PurchaseTypeId,
	SMALL_QUOTE_CRITERIA,
	SOLE_SOURCE_CRITERIA,
} from "../contractRules";
import type { ConsumableItem, HandoverPlanState } from "../types";
import VendorBudgetSummarySection from "./VendorBudgetSummarySection";

interface HandoverBriefingTabProps {
	items: ConsumableItem[];
	plan: HandoverPlanState;
	onUpdatePlanMeta: (patch: Partial<HandoverPlanState>) => void;
	onUpdateMfgMemo: (mfg: string, memo: string) => void;
	onToggleCheckItem: (id: string) => void;
	onJumpToManufacturer: (mfg: string, onlyUnpriced?: boolean) => void;
	onOpenBomGuide: (model?: string) => void;
}

const RANGE_SEGMENTS: Array<{
	id: PurchaseTypeId;
	label: string;
	rangeText: string;
	flexClass: string;
	barColor: string;
}> = [
	{
		id: "direct_purchase",
		label: "직접구매",
		rangeText: "~1,000만 (부서자체)",
		flexClass: "flex-[1.1]",
		barColor: "bg-[#10b981]",
	},
	{
		id: "sole_source",
		label: "수의계약",
		rangeText: "1,000~2,200만 (독점 ~1억)",
		flexClass: "flex-[1.7]",
		barColor: "bg-[#f59e0b]",
	},
	{
		id: "small_quote",
		label: "소액수의견적",
		rangeText: "2,200만~1.1억 (하한 88%)",
		flexClass: "flex-[1.8]",
		barColor: "bg-[#06b6d4]",
	},
	{
		id: "competitive",
		label: "경쟁입찰 (단가계약)",
		rangeText: "1.1억~ (중앙조달·고시 2.53억)",
		flexClass: "flex-[2.4]",
		barColor: "bg-[#2563eb]",
	},
];

const ACTOR_BADGE: Record<ProcessActor, string> = {
	사업부서: "bg-[#2563eb]/15 text-[#2563eb] dark:text-[#60a5fa]",
	계약부서: "bg-[#10b981]/15 text-[#059669] dark:text-[#34d399]",
	지출부서: "bg-[#38bdf8]/15 text-[#0284c7] dark:text-[#38bdf8]",
	조달청: "bg-[#06b6d4]/15 text-[#0284c7] dark:text-[#38bdf8]",
	업체: "bg-[#f59e0b]/15 text-[#f59e0b] dark:text-[#fbbf24]",
};

export default function HandoverBriefingTab({
	items,
	plan,
	onJumpToManufacturer,
}: HandoverBriefingTabProps) {
	const [selectedTypeId, setSelectedTypeId] =
		useState<PurchaseTypeId>("sole_source");

	const activeRule =
		PURCHASE_TYPES.find((t) => t.id === selectedTypeId) ?? PURCHASE_TYPES[0]!;

	return (
		<div className="flex flex-col gap-6">
			{/* 1. 제조사(대리점)별 계약 기준 · 예산·집행 통합 현황 */}
			<VendorBudgetSummarySection
				items={items}
				plan={plan}
				onJumpToManufacturer={onJumpToManufacturer}
			/>

			{/* 2. 구매계약 적용 기준 요약 (단일 카드) */}
			<section className="rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] p-5 shadow-sm space-y-4">
				{/* 헤더 */}
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e8f0] dark:border-[#222228] pb-3.5">
					<div className="flex items-center gap-2.5">
						<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2563eb]/15 text-[#2563eb] dark:text-[#60a5fa] shrink-0">
							<Scale size={15} />
						</span>
						<h2 className="text-base font-extrabold tracking-tight text-[#0f172a] dark:text-white break-keep">
							구매계약 적용 기준
						</h2>
						<span className="rounded-md bg-[#f1f5f9] dark:bg-[#16161c] px-2 py-0.5 tabular-nums text-[11px] font-semibold text-[#64748b] dark:text-[#a1a1aa]">
							VAT 포함 기준
						</span>
					</div>
					<div className="flex items-center gap-1.5 text-[11px] text-[#64748b] dark:text-[#a1a1aa]">
						<Gavel
							size={12}
							className="text-[#2563eb] dark:text-[#60a5fa] shrink-0"
						/>
						<span className="break-keep">{activeRule.legalBasis}</span>
					</div>
				</div>

				{/* 금액 구간 가로 막대형 세그먼트 탭 (0원 → 3억 원) */}
				<div className="space-y-1.5">
					<div className="flex items-stretch gap-1 rounded-xl bg-[#f1f5f9] dark:bg-[#09090b] p-1 border border-[#e2e8f0] dark:border-[#222228]">
						{RANGE_SEGMENTS.map((seg) => {
							const isActive = seg.id === selectedTypeId;
							return (
								<button
									key={seg.id}
									type="button"
									onClick={() => setSelectedTypeId(seg.id)}
									className={`${seg.flexClass} min-w-0 flex flex-col justify-between gap-1.5 rounded-lg px-2.5 py-2 text-left transition-all cursor-pointer ${
										isActive
											? "bg-white dark:bg-[#16161c] shadow-sm ring-1 ring-[#2563eb]/50"
											: "opacity-75 hover:opacity-100 hover:bg-white/60 dark:hover:bg-[#16161c]/60"
									}`}
								>
									<div className="flex items-center justify-between gap-1 min-w-0">
										<span
											className={`text-xs font-bold truncate ${
												isActive
													? "text-[#0f172a] dark:text-white"
													: "text-[#475569] dark:text-[#a1a1aa]"
											}`}
										>
											{seg.label}
										</span>
									</div>
									<div className="w-full h-1.5 rounded-full bg-[#e2e8f0] dark:bg-[#222228] overflow-hidden">
										<div
											className={`h-full w-full rounded-full transition-opacity ${seg.barColor} ${
												isActive ? "opacity-100" : "opacity-45"
											}`}
										/>
									</div>
									<span className="tabular-nums text-[11px] font-medium text-[#64748b] dark:text-[#a1a1aa] truncate">
										{seg.rangeText}
									</span>
								</button>
							);
						})}
					</div>

					{/* 하단 금액 눈금 축 */}
					<div className="flex items-center justify-between px-1 tabular-nums text-[11px] text-[#64748b] dark:text-[#71717a]">
						<span>0원</span>
						<span>1,000만</span>
						<span>2,200만</span>
						<span>1억 · 1.1억</span>
						<span>2.53억(고시)</span>
						<span>11억+</span>
					</div>
				</div>

				{/* 선택된 구매유형 1줄 핵심 요약 */}
				<div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
					<div className="flex flex-wrap items-center gap-2">
						<span
							className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold ${activeRule.accentClass}`}
						>
							{activeRule.name}
						</span>
						<span className="tabular-nums text-sm font-bold text-[#0f172a] dark:text-white">
							{activeRule.amountRangeVat}
						</span>
						<span className="text-xs text-[#64748b] dark:text-[#a1a1aa]">
							({activeRule.shortTag})
						</span>
					</div>
					<span className="rounded-md bg-[#f1f5f9] dark:bg-[#16161c] px-2.5 py-0.5 text-[11px] font-semibold text-[#334155] dark:text-[#d4d4d8] whitespace-nowrap">
						주체: {activeRule.ownerDept}
					</span>
				</div>

				{/* 유형별 핵심 기준 요약 리스트 (1줄 정렬 · font-sans tabular-nums) */}
				{selectedTypeId === "direct_purchase" ? (
					<div className="divide-y divide-[#e2e8f0] dark:divide-[#222228] rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] text-xs">
						{DIRECT_PURCHASE_CRITERIA.map((d) => (
							<div
								key={d.id}
								className="flex items-center gap-3 px-3.5 py-2.5 min-w-0"
							>
								<span className="w-28 shrink-0 font-bold text-[#0f172a] dark:text-white whitespace-nowrap">
									{d.label}
								</span>
								<span className="w-44 shrink-0 tabular-nums font-bold text-[#059669] dark:text-[#34d399] whitespace-nowrap">
									{d.basis}
								</span>
								<span className="flex-1 min-w-0 text-[#475569] dark:text-[#d4d4d8] truncate">
									{d.detail}
								</span>
							</div>
						))}
					</div>
				) : selectedTypeId === "sole_source" ? (
					<div className="divide-y divide-[#e2e8f0] dark:divide-[#222228] rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] text-xs">
						{SOLE_SOURCE_CRITERIA.map((c) => (
							<div
								key={c.id}
								className="flex items-center gap-3 px-3.5 py-2.5 min-w-0"
							>
								<span className="w-44 shrink-0 font-bold text-[#0f172a] dark:text-white whitespace-nowrap truncate">
									{c.title}
								</span>
								<span className="w-36 shrink-0 tabular-nums font-bold text-[#2563eb] dark:text-[#60a5fa] whitespace-nowrap">
									{c.amountRangeVat}
								</span>
								<span className="flex-1 min-w-0 text-[#475569] dark:text-[#d4d4d8] truncate">
									{c.targetScope}
									<span className="mx-1.5 text-[#94a3b8] dark:text-[#52525b]">
										·
									</span>
									<span className="text-[#64748b] dark:text-[#a1a1aa]">
										증빙: {c.requiredDocs.join(", ")}
									</span>
								</span>
							</div>
						))}
					</div>
				) : selectedTypeId === "competitive" ? (
					<div className="divide-y divide-[#e2e8f0] dark:divide-[#222228] rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] text-xs">
						{COMPETITIVE_TIERS.map((tier) => (
							<div
								key={tier.id}
								className="flex items-center gap-3 px-3.5 py-2.5 min-w-0"
							>
								<span className="w-24 shrink-0 font-bold text-[#0f172a] dark:text-white whitespace-nowrap">
									{tier.tierLabel}
								</span>
								<span className="w-36 shrink-0 tabular-nums font-bold text-[#2563eb] dark:text-[#60a5fa] whitespace-nowrap">
									{tier.amountRangeVat}
								</span>
								<span className="flex-1 min-w-0 text-[#475569] dark:text-[#d4d4d8] truncate">
									<strong className="text-[#059669] dark:text-[#34d399]">
										{tier.reviewStandard}
									</strong>
									<span className="mx-1.5 text-[#94a3b8] dark:text-[#52525b]">
										·
									</span>
									<span>{tier.keyPoints[0]}</span>
								</span>
							</div>
						))}
					</div>
				) : (
					<div className="divide-y divide-[#e2e8f0] dark:divide-[#222228] rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] text-xs">
						{SMALL_QUOTE_CRITERIA.map((s) => (
							<div
								key={s.id}
								className="flex items-center gap-3 px-3.5 py-2.5 min-w-0"
							>
								<span className="w-28 shrink-0 font-bold text-[#0f172a] dark:text-white whitespace-nowrap">
									{s.label}
								</span>
								<span className="w-44 shrink-0 tabular-nums font-bold text-[#0284c7] dark:text-[#06b6d4] whitespace-nowrap">
									{s.basis}
								</span>
								<span className="flex-1 min-w-0 text-[#475569] dark:text-[#d4d4d8] truncate">
									{s.detail}
								</span>
							</div>
						))}
					</div>
				)}

				{/* 행동 중심 가로 공정 흐름 다이어그램 */}
				<div className="space-y-2 pt-1">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2 text-[13px] font-extrabold tracking-tight text-[#0f172a] dark:text-white">
							<span className="h-3.5 w-1 rounded-full bg-[#10b981] shrink-0" />
							<ShieldCheck
								size={14}
								className="text-[#059669] dark:text-[#34d399] shrink-0"
							/>
							<span>실무 진행 공정</span>
						</div>
						{activeRule.cautionNote && (
							<div className="flex items-center gap-1 text-[11px] text-[#f59e0b] dark:text-[#fbbf24] font-semibold whitespace-nowrap">
								<Info size={12} className="shrink-0" />
								<span>{activeRule.cautionNote}</span>
							</div>
						)}
					</div>

					<div className="grid grid-cols-3 gap-x-3 gap-y-3.5">
						{activeRule.processSteps.map((step, idx) => {
							const isSkipped = step.status === "skipped";
							const isConditional = step.status === "conditional";
							return (
								<div
									key={step.stepNo}
									className={`min-w-0 flex flex-col gap-2 transition-opacity ${
										isSkipped ? "opacity-40" : ""
									}`}
								>
									{/* 상단 타임라인 노드 + 연결선 */}
									<div className="flex items-center gap-2">
										<span
											className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full tabular-nums text-[11px] font-extrabold ${
												isSkipped
													? "border border-dashed border-[#94a3b8] dark:border-[#52525b] text-[#64748b] dark:text-[#71717a]"
													: isConditional
														? "border border-dashed border-[#f59e0b] bg-[#f59e0b]/15 text-[#f59e0b] dark:text-[#fbbf24]"
														: "bg-[#2563eb] text-white"
											}`}
										>
											{step.stepNo}
										</span>
										{step.accountingStage && !isSkipped && (
											<span className="rounded bg-[#f1f5f9] dark:bg-[#16161c] px-1.5 py-0.5 text-[10px] font-semibold text-[#475569] dark:text-[#a1a1aa] whitespace-nowrap">
												{step.accountingStage}
											</span>
										)}
										{isSkipped ? (
											<span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-[#f1f5f9] dark:bg-[#16161c] text-[#64748b] dark:text-[#71717a] whitespace-nowrap">
												생략
											</span>
										) : isConditional ? (
											<span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-[#f59e0b]/15 text-[#f59e0b] dark:text-[#fbbf24] whitespace-nowrap">
												조건부
											</span>
										) : (
											<span
												className={`rounded px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${ACTOR_BADGE[step.actor]}`}
											>
												{step.actor}
											</span>
										)}
										{idx < activeRule.processSteps.length - 1 && (
											<div className="flex-1 flex items-center gap-1 min-w-0">
												<span
													className={`h-px flex-1 ${
														isSkipped
															? "border-t border-dashed border-[#cbd5e1] dark:border-[#3f3f46]"
															: "bg-[#cbd5e1] dark:bg-[#222228]"
													}`}
												/>
												<ArrowRight
													size={12}
													className="text-[#94a3b8] dark:text-[#52525b] shrink-0"
												/>
											</div>
										)}
									</div>

									{/* 하단 카드 (제목 최상단 강조) */}
									<div
										className={`flex-1 min-w-0 rounded-xl border px-3.5 py-2.5 flex flex-col justify-center gap-1 ${
											isSkipped
												? "border-dashed border-[#cbd5e1] dark:border-[#222228] bg-[#f8fafc]/50 dark:bg-[#09090b]/40"
												: isConditional
													? "border-dashed border-[#f59e0b]/60 bg-[#f8fafc] dark:bg-[#09090b]"
													: "border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b]"
										}`}
									>
										<div
											className="text-sm font-extrabold tracking-tight text-[#0f172a] dark:text-white whitespace-nowrap truncate"
											title={step.action}
										>
											{step.action}
										</div>
										<div
											className="text-[11px] text-[#64748b] dark:text-[#a1a1aa] whitespace-nowrap truncate"
											title={step.detail}
										>
											{step.detail}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* 전 유형 공통: 연간 예산 · 마감 일정 타임테이블 (1월~12월 · 점선 구분) */}
				<div className="border-t border-dashed border-[#cbd5e1] dark:border-[#222228] pt-3.5 space-y-2.5">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2 text-[13px] font-extrabold tracking-tight text-[#0f172a] dark:text-white">
							<span className="h-3.5 w-1 rounded-full bg-[#2563eb] shrink-0" />
							<Calendar
								size={14}
								className="text-[#2563eb] dark:text-[#60a5fa] shrink-0"
							/>
							<span>연간 예산 · 마감 일정 타임테이블</span>
						</div>
						<span className="text-[11px] text-[#64748b] dark:text-[#a1a1aa] font-medium">
							1월 ~ 12월 기준 (전 유형 공통)
						</span>
					</div>

					<div className="rounded-xl border border-dashed border-[#cbd5e1] dark:border-[#222228] bg-[#f8fafc]/70 dark:bg-[#09090b]/70 p-3 space-y-2 text-[11px]">
						{/* 월 헤더 (1월~12월) */}
						<div className="flex items-center gap-2">
							<span className="w-24 shrink-0 font-bold text-[#64748b] dark:text-[#a1a1aa]">
								구분
							</span>
							<div className="flex-1 grid grid-cols-12 gap-1 text-center tabular-nums font-bold text-[#64748b] dark:text-[#a1a1aa]">
								{[
									"1월",
									"2월",
									"3월",
									"4월",
									"5월",
									"6월",
									"7월",
									"8월",
									"9월",
									"10월",
									"11월",
									"12월",
								].map((m) => (
									<span
										key={m}
										className="rounded bg-[#f1f5f9] dark:bg-[#16161c] py-0.5 text-[10px]"
									>
										{m}
									</span>
								))}
							</div>
						</div>

						{/* 트랙 1: 예산 배정·이월 */}
						<div className="flex items-center gap-2">
							<span className="w-24 shrink-0 font-bold text-[#2563eb] dark:text-[#60a5fa] whitespace-nowrap">
								예산 배정·이월
							</span>
							<div className="flex-1 grid grid-cols-12 gap-1">
								<div
									className="col-span-2 rounded-md bg-[#2563eb]/15 border border-[#2563eb]/30 px-2 py-1 text-[10px] font-bold text-[#2563eb] dark:text-[#60a5fa] text-center whitespace-nowrap truncate"
									title="준예산(1월 초): 본예산 확정 전 필수 운영·긴급 소모품 우선 집행"
								>
									준예산 (1월 초)
								</div>
								<div
									className="col-span-2 rounded-md bg-[#2563eb] px-2 py-1 text-[10px] font-bold text-white text-center whitespace-nowrap truncate"
									title="본예산(3~4월): 연간 예산 확정 배정 및 준예산 정산"
								>
									본예산 확정 (3~4월)
								</div>
								<div className="col-span-7" />
								<div
									className="col-span-1 rounded-md bg-[#38bdf8]/20 border border-[#38bdf8]/40 px-1 py-1 text-[10px] font-bold text-[#0284c7] dark:text-[#38bdf8] text-center whitespace-nowrap truncate"
									title="이월예산(연말): 계약체결 완료 건 이월신청 → 익년도 MIS 이월대금지급관리"
								>
									이월
								</div>
							</div>
						</div>

						{/* 트랙 2: 발주계획·연초서류 */}
						<div className="flex items-center gap-2">
							<span className="w-24 shrink-0 font-bold text-[#059669] dark:text-[#34d399] whitespace-nowrap">
								발주계획·서류
							</span>
							<div className="flex-1 grid grid-cols-12 gap-1">
								<div
									className="col-span-2 rounded-md bg-[#10b981]/15 border border-[#10b981]/30 px-1.5 py-1 text-[10px] font-bold text-[#059669] dark:text-[#34d399] text-center whitespace-nowrap truncate"
									title="기후부 대행역무계약 연장(매년 초): 연초 계약의뢰 시 근거 서류 첨부(내부결재 시 불필요)"
								>
									대행역무 연장
								</div>
								<div
									className="col-span-1 rounded-md bg-[#f1f5f9] dark:bg-[#16161c] border border-[#cbd5e1] dark:border-[#3f3f46] px-1 py-1 text-[10px] font-semibold text-[#334155] dark:text-[#d4d4d8] text-center whitespace-nowrap"
									title="1분기 발주계획 변경 (3/15)"
								>
									3/15
								</div>
								<div className="col-span-2" />
								<div
									className="col-span-1 rounded-md bg-[#f1f5f9] dark:bg-[#16161c] border border-[#cbd5e1] dark:border-[#3f3f46] px-1 py-1 text-[10px] font-semibold text-[#334155] dark:text-[#d4d4d8] text-center whitespace-nowrap"
									title="2분기 발주계획 변경 (6/15)"
								>
									6/15
								</div>
								<div className="col-span-2" />
								<div
									className="col-span-1 rounded-md bg-[#f1f5f9] dark:bg-[#16161c] border border-[#cbd5e1] dark:border-[#3f3f46] px-1 py-1 text-[10px] font-semibold text-[#334155] dark:text-[#d4d4d8] text-center whitespace-nowrap"
									title="3분기 발주계획 변경 (9/15)"
								>
									9/15
								</div>
								<div className="col-span-2" />
								<div
									className="col-span-1 rounded-md bg-[#10b981]/20 border border-[#10b981]/40 px-1 py-1 text-[10px] font-bold text-[#059669] dark:text-[#34d399] text-center whitespace-nowrap"
									title="익년도 연간 발주계획 입력 (12/20)"
								>
									12/20
								</div>
							</div>
						</div>

						{/* 트랙 3: 계약기간·마감기한 */}
						<div className="flex items-center gap-2">
							<span className="w-24 shrink-0 font-bold text-[#f59e0b] dark:text-[#fbbf24] whitespace-nowrap">
								계약기간·마감
							</span>
							<div className="flex-1 grid grid-cols-12 gap-1">
								<div
									className="col-span-9 rounded-md bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] px-2 py-1 text-[10px] font-semibold text-[#334155] dark:text-[#d4d4d8] text-center whitespace-nowrap truncate"
									title="기본 계약기간: 12월 초 종료 (연말 검수·정산·대금지급 여유 확보)"
								>
									기본 계약기간 (12월 초 종료)
								</div>
								<div
									className="col-span-1 rounded-md bg-[#f59e0b]/20 border border-[#f59e0b]/50 px-1 py-1 text-[10px] font-bold text-[#f59e0b] dark:text-[#fbbf24] text-center whitespace-nowrap truncate"
									title="iTOX 독점대리점계약서 10월 중 만료"
								>
									iTOX
								</div>
								<div
									className="col-span-1 rounded-md bg-[#f43f5e]/15 border border-[#f43f5e]/40 px-1 py-1 text-[10px] font-bold text-[#f43f5e] dark:text-[#f87171] text-center whitespace-nowrap truncate"
									title="계약의뢰 마감: 조달청 연말 마감기한 연동"
								>
									조달마감
								</div>
								<div
									className="col-span-1 rounded-md bg-[#f59e0b]/15 border border-[#f59e0b]/40 px-1 py-1 text-[10px] font-bold text-[#f59e0b] dark:text-[#fbbf24] text-center whitespace-nowrap truncate"
									title="EasyChem 독점대리점계약서 12월 말 만료"
								>
									Easy
								</div>
							</div>
						</div>

						{/* 타임테이블 항목 설명 범례 */}
						<div className="border-t border-[#e2e8f0] dark:border-[#222228] pt-2 mt-1 space-y-1 text-[11px] text-[#64748b] dark:text-[#a1a1aa]">
							<div className="truncate">
								<strong className="text-[#2563eb] dark:text-[#60a5fa]">
									예산·이월:
								</strong>{" "}
								준예산(필수·긴급 운영 우선 집행) → 본예산(확정·정산) ·{" "}
								<strong className="text-[#0f172a] dark:text-white">이월</strong>{" "}
								= 연내 계약체결 건 연말 신청(익년도 MIS 이월대금지급관리)
							</div>
							<div className="truncate">
								<strong className="text-[#059669] dark:text-[#34d399]">
									발주계획·서류:
								</strong>{" "}
								<strong className="text-[#0f172a] dark:text-white">
									대행역무 연장
								</strong>{" "}
								= 연초 계약의뢰 시 근거 첨부(내부결재 불필요) ·{" "}
								<strong className="text-[#0f172a] dark:text-white">
									3/15·6/15·9/15
								</strong>{" "}
								= 분기 발주계획 변경 ·{" "}
								<strong className="text-[#0f172a] dark:text-white">
									12/20
								</strong>{" "}
								= 익년도 연간 발주계획 입력
							</div>
							<div className="truncate">
								<strong className="text-[#f59e0b] dark:text-[#fbbf24]">
									계약기간·마감:
								</strong>{" "}
								기본 12월 초 종료(연말 검수·정산 여유) ·{" "}
								<strong className="text-[#0f172a] dark:text-white">
									iTOX(10월 중)·Easy(EasyChem 12월 말)
								</strong>{" "}
								= 독점 만료일 ·{" "}
								<strong className="text-[#0f172a] dark:text-white">
									조달마감
								</strong>{" "}
								= 조달청 연말 의뢰 마감 연동
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
