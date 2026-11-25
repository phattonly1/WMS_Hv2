"use client";

import {
	AlertTriangle,
	ArrowRight,
	BookOpen,
	Calendar,
	CheckCircle2,
	Circle,
	FileCheck2,
	Gavel,
	Info,
	Layers,
	Scale,
	ShieldCheck,
	TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
	COMPETITIVE_TIERS,
	DIRECT_PURCHASE_CRITERIA,
	MANUFACTURER_CONTRACT_LIST,
	type ProcessActor,
	PURCHASE_TYPES,
	type PurchaseTypeId,
	SMALL_QUOTE_CRITERIA,
	SOLE_SOURCE_CRITERIA,
} from "../contractRules";
import {
	type ConsumableItem,
	formatWon,
	HANDOVER_CHECKLIST,
	type HandoverPlanState,
	MANUFACTURER_BADGE,
	MANUFACTURER_BRIEFS,
	parseBaseQty,
	resolveUnitPrice,
} from "../types";

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
	onUpdatePlanMeta,
	onUpdateMfgMemo,
	onToggleCheckItem,
	onJumpToManufacturer,
	onOpenBomGuide,
}: HandoverBriefingTabProps) {
	const [selectedTypeId, setSelectedTypeId] =
		useState<PurchaseTypeId>("sole_source");

	const activeRule =
		PURCHASE_TYPES.find((t) => t.id === selectedTypeId) ?? PURCHASE_TYPES[0]!;

	return (
		<div className="flex flex-col gap-6">
			{/* 0. 구매계약 적용 기준 요약 (단일 카드) */}
			<section className="rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] p-5 shadow-sm space-y-4">
				{/* 헤더 */}
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<Scale
							size={16}
							className="text-[#2563eb] dark:text-[#60a5fa] shrink-0"
						/>
						<h2 className="text-sm font-bold text-[#0f172a] dark:text-white break-keep">
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
					<div className="flex items-center justify-between gap-2 text-[11px]">
						<div className="flex items-center gap-1.5 font-bold text-[#0f172a] dark:text-white">
							<ShieldCheck
								size={13}
								className="text-[#059669] dark:text-[#34d399] shrink-0"
							/>
							<span>실무 진행 공정</span>
						</div>
						{activeRule.cautionNote && (
							<div className="flex items-center gap-1 text-[#f59e0b] dark:text-[#fbbf24] font-semibold whitespace-nowrap">
								<Info size={12} className="shrink-0" />
								<span>{activeRule.cautionNote}</span>
							</div>
						)}
					</div>

					<div className="grid grid-cols-3 gap-2">
						{activeRule.processSteps.map((step, idx) => (
							<div
								key={step.stepNo}
								className="min-w-0 flex items-center gap-2"
							>
								<div className="flex-1 min-w-0 h-full rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] px-3.5 py-2.5 flex flex-col justify-between gap-1.5">
									<div className="flex items-center justify-between gap-1.5">
										<span className="tabular-nums text-[10px] font-bold text-[#64748b] dark:text-[#a1a1aa]">
											STEP {step.stepNo}
										</span>
										<span
											className={`rounded px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${ACTOR_BADGE[step.actor]}`}
										>
											{step.actor}
										</span>
									</div>
									<div
										className="text-xs font-bold text-[#0f172a] dark:text-white whitespace-nowrap truncate"
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
								{idx < activeRule.processSteps.length - 1 ? (
									<ArrowRight
										size={14}
										className="text-[#94a3b8] dark:text-[#52525b] shrink-0"
									/>
								) : (
									<span className="w-3.5 shrink-0" aria-hidden="true" />
								)}
							</div>
						))}
					</div>
				</div>
			</section>

			{/* 0-2. 연간 예산 · 계약기간 및 필수 일정 기준 */}
			<section className="rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] p-5 shadow-sm space-y-3.5">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<Calendar
							size={17}
							className="text-[#2563eb] dark:text-[#60a5fa] shrink-0"
						/>
						<h2 className="text-sm font-bold text-[#0f172a] dark:text-white">
							연간 예산 · 계약기간 및 필수 일정 기준
						</h2>
						<span className="rounded-md bg-[#f1f5f9] dark:bg-[#16161c] px-2 py-0.5 text-[11px] font-semibold text-[#64748b] dark:text-[#a1a1aa]">
							연초 발주 · 마감 관리
						</span>
					</div>
				</div>

				<div className="grid grid-cols-3 gap-3 text-xs">
					{/* 1. 준예산 / 본예산 / 이월예산 */}
					<div className="rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] p-3.5 space-y-2">
						<div className="flex items-center justify-between gap-1.5">
							<span className="font-bold text-[#0f172a] dark:text-white">
								준예산 · 본예산 · 이월예산
							</span>
							<span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-[#2563eb]/15 text-[#2563eb] dark:text-[#60a5fa] whitespace-nowrap">
								예산
							</span>
						</div>
						<ul className="space-y-1.5 text-[11px] text-[#475569] dark:text-[#d4d4d8]">
							<li className="flex items-start gap-1.5">
								<span className="font-bold text-[#0f172a] dark:text-white shrink-0">
									준예산(1월 초):
								</span>
								<span>본예산 확정 전 필수 운영·긴급 소모품 우선 집행</span>
							</li>
							<li className="flex items-start gap-1.5">
								<span className="font-bold text-[#0f172a] dark:text-white shrink-0">
									본예산(3~4월):
								</span>
								<span>연간 예산 확정 배정 (준예산 집행분 흡수·정산)</span>
							</li>
							<li className="flex items-start gap-1.5">
								<span className="font-bold text-[#0f172a] dark:text-white shrink-0">
									이월예산(연말):
								</span>
								<span>
									계약체결 완료 건은 연말 이월신청 시 익년도 집행 가능 (MIS
									이월대금지급관리)
								</span>
							</li>
						</ul>
					</div>

					{/* 2. 기후부 대행역무계약 연장 */}
					<div className="rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] p-3.5 space-y-2">
						<div className="flex items-center justify-between gap-1.5">
							<span className="font-bold text-[#0f172a] dark:text-white">
								기후부 대행역무계약 연장
							</span>
							<span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-[#10b981]/15 text-[#059669] dark:text-[#34d399] whitespace-nowrap">
								연초 필수서류
							</span>
						</div>
						<ul className="space-y-1.5 text-[11px] text-[#475569] dark:text-[#d4d4d8]">
							<li className="flex items-start gap-1.5">
								<span className="font-bold text-[#0f172a] dark:text-white shrink-0">
									매년 초 연장:
								</span>
								<span>기후부와 대행역무계약 연장 체결 진행</span>
							</li>
							<li className="flex items-start gap-1.5">
								<span className="font-bold text-[#0f172a] dark:text-white shrink-0">
									서류 첨부 필수:
								</span>
								<span>
									연초 계약의뢰 시 근거 서류로 제출 (내부결재 시 불필요)
								</span>
							</li>
						</ul>
					</div>

					{/* 3. 계약기간 및 의뢰 마감기한 */}
					<div className="rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] p-3.5 space-y-2">
						<div className="flex items-center justify-between gap-1.5">
							<span className="font-bold text-[#0f172a] dark:text-white">
								계약기간 · 의뢰 마감기한
							</span>
							<span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-[#f59e0b]/15 text-[#f59e0b] dark:text-[#fbbf24] whitespace-nowrap">
								기간 설정
							</span>
						</div>
						<ul className="space-y-1.5 text-[11px] text-[#475569] dark:text-[#d4d4d8]">
							<li className="flex items-start gap-1.5">
								<span className="font-bold text-[#0f172a] dark:text-white shrink-0">
									기본 종료일:
								</span>
								<span>12월 초 종료 (연말 검수·정산·지급 여유 확보)</span>
							</li>
							<li className="flex items-start gap-1.5">
								<span className="font-bold text-[#0f172a] dark:text-white shrink-0">
									독점(LOA):
								</span>
								<span>
									독점대리점계약서 만료일이 마감기한 (
									<strong className="text-[#0f172a] dark:text-white">
										EasyChem 12월 말
									</strong>{" "}
									·{" "}
									<strong className="text-[#f59e0b] dark:text-[#fbbf24]">
										iTOX 10월 중
									</strong>
									)
								</span>
							</li>
							<li className="flex items-start gap-1.5">
								<span className="font-bold text-[#0f172a] dark:text-white shrink-0">
									계약의뢰 마감:
								</span>
								<span>조달청 연말 마감기한과 연동 (사전 공지 일정 준수)</span>
							</li>
						</ul>
					</div>
				</div>
			</section>

			{/* 0-3. 제조사 · 업체별 계약 기준 리스트 */}
			<section className="rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] p-5 shadow-sm space-y-3.5">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<Layers
							size={17}
							className="text-[#2563eb] dark:text-[#60a5fa] shrink-0"
						/>
						<h2 className="text-sm font-bold text-[#0f172a] dark:text-white">
							제조사(대리점)별 계약 기준 리스트
						</h2>
						<span className="rounded-md bg-[#f1f5f9] dark:bg-[#16161c] px-2 py-0.5 text-[11px] font-semibold text-[#64748b] dark:text-[#a1a1aa]">
							{MANUFACTURER_CONTRACT_LIST.length}개 항목
						</span>
					</div>
				</div>

				<div className="divide-y divide-[#e2e8f0] dark:divide-[#222228] rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] text-xs">
					{/* 컬럼 헤더 */}
					<div className="flex items-center gap-3 px-3.5 py-2 text-[11px] font-bold text-[#64748b] dark:text-[#a1a1aa] bg-[#f1f5f9]/70 dark:bg-[#16161c]/70 rounded-t-xl">
						<span className="w-28 shrink-0">제조사(대리점)</span>
						<span className="w-40 shrink-0">적용 장비(항목)</span>
						<span className="flex-1 min-w-0">시설장비유지비 품목</span>
						<span className="flex-1 min-w-0">재료비 품목</span>
						<span className="flex-[1.1] min-w-0">발주·견적 특이사항</span>
					</div>
					{MANUFACTURER_CONTRACT_LIST.map((row) => (
						<div
							key={row.id}
							className="flex items-center gap-3 px-3.5 py-2.5 min-w-0"
						>
							<span className="w-28 shrink-0 font-bold text-[#0f172a] dark:text-white whitespace-nowrap">
								{row.name}
							</span>
							<span
								className="w-40 shrink-0 font-medium text-[#2563eb] dark:text-[#60a5fa] truncate"
								title={row.equipment}
							>
								{row.equipment}
							</span>
							<span
								className="flex-1 min-w-0 text-[#334155] dark:text-[#d4d4d8] truncate"
								title={row.maintenanceItems}
							>
								{row.maintenanceItems}
							</span>
							<span
								className="flex-1 min-w-0 text-[#475569] dark:text-[#a1a1aa] truncate"
								title={row.materialItems}
							>
								{row.materialItems}
							</span>
							<span
								className="flex-[1.1] min-w-0 text-[#64748b] dark:text-[#a1a1aa] truncate"
								title={row.note}
							>
								{row.note}
							</span>
						</div>
					))}
				</div>
			</section>

			{/* 1. 인수인계 문서 헤더 & 체크리스트 2열 그리드 */}
			<div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
				{/* 문서 기본정보 및 공통 인계사항 */}
				<div className="lg:col-span-7 flex flex-col gap-4 rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] p-5">
					<div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e8f0] dark:border-[#222228] pb-3.5">
						<div className="flex items-center gap-2">
							<FileCheck2
								size={18}
								className="text-[#2563eb] dark:text-[#60a5fa] shrink-0"
							/>
							<h2 className="text-base font-bold text-[#0f172a] dark:text-white break-keep">
								차기년도 계약 인수인계 총괄 메모
							</h2>
						</div>
						<span className="font-mono text-xs text-[#64748b] dark:text-[#a1a1aa]">
							자동 저장됨 (브라우저 로컬 + JSON/XLSX 백업 지원)
						</span>
					</div>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
						<div className="sm:col-span-2 flex flex-col gap-1.5">
							<label
								htmlFor="handover-title"
								className="text-xs font-semibold text-[#475569] dark:text-[#a1a1aa]"
							>
								계획서 / 인수인계 제목
							</label>
							<input
								id="handover-title"
								type="text"
								value={plan.title}
								onChange={(e) => onUpdatePlanMeta({ title: e.target.value })}
								placeholder="예: 2027년도 통합발주 소모품 구매계획 및 인수인계서"
								className="min-h-11 w-full rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] px-3.5 text-sm font-medium text-[#0f172a] dark:text-white focus:border-[#2563eb] focus:outline-none"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="handover-author"
								className="text-xs font-semibold text-[#475569] dark:text-[#a1a1aa]"
							>
								작성 / 인계 담당자
							</label>
							<input
								id="handover-author"
								type="text"
								value={plan.author}
								onChange={(e) => onUpdatePlanMeta({ author: e.target.value })}
								placeholder="담당자 성명 입력"
								className="min-h-11 w-full rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] px-3.5 text-sm text-[#0f172a] dark:text-white focus:border-[#2563eb] focus:outline-none"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-1.5 flex-1">
						<label
							htmlFor="handover-notes"
							className="text-xs font-semibold text-[#475569] dark:text-[#a1a1aa]"
						>
							핵심 계약 추진 방향 및 후임자 당부사항 (엑셀 내보내기 시 요약
							시트에 함께 수록)
						</label>
						<textarea
							id="handover-notes"
							rows={4}
							value={plan.handoverNotes}
							onChange={(e) =>
								onUpdatePlanMeta({ handoverNotes: e.target.value })
							}
							placeholder="계약 추진 시 유의사항, 단가 협상 이력, 예산 편성 기준 등을 기록하세요."
							className="w-full flex-1 rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] p-3.5 text-sm leading-relaxed text-[#0f172a] dark:text-[#f4f4f5] focus:border-[#2563eb] focus:outline-none"
						/>
					</div>
				</div>

				{/* 단계별 계약 준비 체크리스트 */}
				<div className="lg:col-span-5 flex flex-col gap-3.5 rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] p-5">
					<div className="flex items-center justify-between border-b border-[#e2e8f0] dark:border-[#222228] pb-3.5">
						<h2 className="text-base font-bold text-[#0f172a] dark:text-white break-keep">
							차기 계약 준비 진척 체크리스트
						</h2>
						<span className="rounded-full bg-[#2563eb]/15 px-2.5 py-1 font-mono text-xs font-semibold text-[#2563eb] dark:text-[#60a5fa]">
							{plan.checkedActionIds.length} / {HANDOVER_CHECKLIST.length} 완료
						</span>
					</div>

					<div className="flex flex-col gap-2.5">
						{HANDOVER_CHECKLIST.map((chk) => {
							const done = plan.checkedActionIds.includes(chk.id);
							return (
								<button
									key={chk.id}
									type="button"
									onClick={() => onToggleCheckItem(chk.id)}
									className={`flex min-h-12 w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
										done
											? "border-[#10b981]/40 bg-[#10b981]/10"
											: "border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] hover:border-[#2563eb]/50"
									}`}
								>
									{done ? (
										<CheckCircle2
											size={18}
											className="mt-0.5 text-[#059669] dark:text-[#34d399] shrink-0"
										/>
									) : (
										<Circle
											size={18}
											className="mt-0.5 text-[#94a3b8] dark:text-[#71717a] shrink-0"
										/>
									)}
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="font-mono text-[11px] font-semibold text-[#2563eb] dark:text-[#60a5fa]">
												{chk.phase}
											</span>
										</div>
										<p
											className={`mt-0.5 text-xs sm:text-sm font-semibold break-keep ${
												done
													? "line-through text-[#64748b] dark:text-[#a1a1aa]"
													: "text-[#0f172a] dark:text-white"
											}`}
										>
											{chk.title}
										</p>
										<p className="mt-1 text-xs text-[#64748b] dark:text-[#a1a1aa] break-keep">
											{chk.desc}
										</p>
									</div>
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* 2. 5대 제조사별 견적 근거 · 예산 비중 · 인수인계 브리핑 카드 */}
			<section className="flex flex-col gap-4">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div>
						<h2 className="text-base sm:text-lg font-bold text-[#0f172a] dark:text-white break-keep">
							제조사별 견적 근거 및 인수인계 브리핑 (5개사)
						</h2>
						<p className="text-xs sm:text-sm text-[#64748b] dark:text-[#a1a1aa] break-keep">
							업체별 확보 단가율, 주의사항, 선정된 예상 발주금액을 한눈에
							대조하고 업체별 특이사항을 기록합니다.
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
					{MANUFACTURER_BRIEFS.map((brief) => {
						const mfg = brief.manufacturer;
						const mfgItems = items.filter((i) => i.manufacturer === mfg);
						const priced26Count = mfgItems.filter(
							(i) => i.price26 !== null,
						).length;
						const pricedAnyCount = mfgItems.filter(
							(i) => i.price26 !== null || i.price25 !== null,
						).length;

						let selectedCount = 0;
						let selectedUnpricedCount = 0;
						let selectedSum = 0;
						let diffSumPct = 0;
						let diffCount = 0;

						for (const item of mfgItems) {
							if (
								item.price25 !== null &&
								item.price26 !== null &&
								item.price25 > 0
							) {
								diffSumPct +=
									((item.price26 - item.price25) / item.price25) * 100;
								diffCount++;
							}

							const entry = plan.entries[item.id];
							if (!entry?.selected) continue;
							selectedCount++;
							const { price } = resolveUnitPrice(item, entry);
							if (price === null) {
								selectedUnpricedCount++;
							} else {
								selectedSum +=
									price * (entry.qty ?? parseBaseQty(item.baseQty));
							}
						}

						const avgInflation =
							diffCount > 0 ? (diffSumPct / diffCount).toFixed(1) : null;
						const coveragePct =
							mfgItems.length > 0
								? Math.round((pricedAnyCount / mfgItems.length) * 100)
								: 0;
						const badgeClass =
							MANUFACTURER_BADGE[mfg] ??
							"bg-[#f1f5f9] dark:bg-[#222228] text-[#0f172a] dark:text-[#f4f4f5] border-[#cbd5e1] dark:border-[#3f3f46]";

						return (
							<article
								key={mfg}
								className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] p-5 shadow-sm"
							>
								<div className="flex flex-col gap-3.5">
									{/* 상단 타이틀 + 예산 요약 */}
									<div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e2e8f0] dark:border-[#222228] pb-3">
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<span
													className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${badgeClass}`}
												>
													{mfg}
												</span>
												<span className="font-mono text-xs text-[#64748b] dark:text-[#a1a1aa]">
													마스터 {mfgItems.length}종 · 단가확보 {pricedAnyCount}
													종 ({coveragePct}%)
												</span>
												{avgInflation !== null && (
													<span className="inline-flex items-center gap-1 rounded-md bg-[#f59e0b]/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#f59e0b] dark:text-[#fbbf24]">
														<TrendingUp size={12} />
														전년비 평균{" "}
														{Number(avgInflation) > 0
															? `+${avgInflation}%`
															: `${avgInflation}%`}
													</span>
												)}
											</div>
											<p className="mt-1.5 text-xs font-medium text-[#475569] dark:text-[#d4d4d8] break-keep">
												대상 장비: {brief.equipmentSummary}
											</p>
										</div>

										<div className="text-right shrink-0">
											<div className="text-[11px] font-medium text-[#64748b] dark:text-[#a1a1aa]">
												선정 {selectedCount}건 예상액 (VAT별도)
											</div>
											<div className="font-mono text-lg font-bold text-[#0f172a] dark:text-white">
												{formatWon(selectedSum)}
											</div>
											{selectedUnpricedCount > 0 && (
												<button
													type="button"
													onClick={() => onJumpToManufacturer(mfg, true)}
													className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#f43f5e] dark:text-[#f87171] hover:underline"
												>
													<AlertTriangle size={12} />
													단가 미확보 {selectedUnpricedCount}건 확인
												</button>
											)}
										</div>
									</div>

									{/* 견적 근거 & 계약 전략 */}
									<div className="grid grid-cols-1 gap-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#09090b] p-3.5 border border-[#e2e8f0] dark:border-[#222228] text-xs">
										<div>
											<span className="font-bold text-[#2563eb] dark:text-[#60a5fa]">
												[견적 기준]{" "}
											</span>
											<span className="text-[#334155] dark:text-[#d4d4d8] break-keep">
												{brief.quoteBasis} (26년 확정단가 {priced26Count}건)
											</span>
										</div>
										<div>
											<span className="font-bold text-[#059669] dark:text-[#34d399]">
												[발주 포인트]{" "}
											</span>
											<span className="text-[#334155] dark:text-[#d4d4d8] break-keep">
												{brief.contractStrategy}
											</span>
										</div>
										<ul className="mt-0.5 space-y-1 border-t border-[#e2e8f0] dark:border-[#222228] pt-2 text-[#64748b] dark:text-[#a1a1aa]">
											{brief.cautions.map((c) => (
												<li
													key={c}
													className="flex items-start gap-1.5 break-keep"
												>
													<span className="text-[#f59e0b] font-bold">•</span>
													<span>{c}</span>
												</li>
											))}
										</ul>
									</div>

									{/* 업체별 담당자 추가 메모 */}
									<div>
										<input
											type="text"
											aria-label={`${mfg} 담당자 인수인계 메모`}
											value={plan.mfgMemos[mfg] ?? ""}
											onChange={(e) => onUpdateMfgMemo(mfg, e.target.value)}
											placeholder={`${mfg} 관련 담당자 연락처, 추가 할인 조건, 특이사항 메모 입력...`}
											className="min-h-10 w-full rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] px-3 text-xs text-[#0f172a] dark:text-white placeholder-[#94a3b8] dark:placeholder-[#71717a] focus:border-[#2563eb] focus:outline-none"
										/>
									</div>
								</div>

								{/* 하단 바로가기 액션 */}
								<div className="flex flex-wrap items-center justify-between gap-2 pt-1">
									<button
										type="button"
										onClick={() => onJumpToManufacturer(mfg, false)}
										className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#cbd5e1] dark:border-[#27272a] bg-[#f1f5f9] dark:bg-[#16161c] px-3.5 text-xs font-semibold text-[#0f172a] dark:text-[#f4f4f5] transition-colors hover:border-[#2563eb]"
									>
										<Layers
											size={14}
											className="text-[#2563eb] dark:text-[#60a5fa]"
										/>
										<span>{mfg} 구매 품목·수량 편집하기</span>
										<ArrowRight size={13} />
									</button>

									{brief.hasBomGuide && (
										<button
											type="button"
											onClick={() => onOpenBomGuide("HATOX-2000")}
											className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#2563eb]/15 border border-[#2563eb]/30 px-3.5 text-xs font-semibold text-[#2563eb] dark:text-[#60a5fa] transition-colors hover:bg-[#2563eb]/25"
										>
											<BookOpen size={14} />
											<span>HSKorea 장비 사진·호환대체품 도해 보기</span>
										</button>
									)}
								</div>
							</article>
						);
					})}
				</div>
			</section>
		</div>
	);
}
