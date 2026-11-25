"use client";

import {
	AlertTriangle,
	BookOpen,
	Calculator,
	Check,
	ChevronDown,
	FileText,
	RotateCcw,
	Search,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
	type ActiveTab,
	type BomDataset,
	type ConsumableItem,
	formatWon,
	MANUFACTURERS,
	PART_GROUPS,
	splitModels,
} from "../types";
import type { ListScopeFilter } from "./ProcurementWorkspaceTab";

interface ContractsSidebarProps {
	activeTab: ActiveTab;
	setActiveTab: (tab: ActiveTab) => void;
	items: ConsumableItem[];
	bomData: BomDataset;
	query: string;
	onChangeQuery: (q: string) => void;
	selectedMfg: string;
	onSelectMfg: (mfg: string) => void;
	selectedGroup: string;
	onSelectGroup: (grp: string) => void;
	selectedModel: string;
	onSelectModel: (model: string) => void;
	scopeFilter: ListScopeFilter;
	onChangeScopeFilter: (scope: ListScopeFilter) => void;
	activeBomModel: string;
	onSelectBomModel: (model: string) => void;
	kpi: {
		selectedCount: number;
		unpricedSelectedCount: number;
		supplyTotal: number;
		vatIncludedTotal: number;
	};
	onResetDefaults: () => void;
}

export default function ContractsSidebar({
	activeTab,
	setActiveTab,
	items,
	bomData,
	query,
	onChangeQuery,
	selectedMfg,
	onSelectMfg,
	selectedGroup,
	onSelectGroup,
	selectedModel,
	onSelectModel,
	scopeFilter,
	onChangeScopeFilter,
	activeBomModel,
	onSelectBomModel,
	kpi,
	onResetDefaults,
}: ContractsSidebarProps) {
	const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
	const [showGroupDropdown, setShowGroupDropdown] = useState(false);

	const mfgCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		for (const i of items) {
			counts[i.manufacturer] = (counts[i.manufacturer] ?? 0) + 1;
		}
		return counts;
	}, [items]);

	const availableModels = useMemo(() => {
		const set = new Set<string>();
		for (const item of items) {
			if (selectedMfg === "전체" || item.manufacturer === selectedMfg) {
				for (const m of splitModels(item.model)) {
					set.add(m);
				}
			}
		}
		return ["전체", ...Array.from(set).sort()];
	}, [items, selectedMfg]);

	const bomModelKeys = Object.keys(bomData);

	return (
		<aside className="hidden lg:flex lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100dvh-5.5rem)] w-[240px] shrink-0 flex-col p-4 gap-5 overflow-y-auto border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] rounded-2xl shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors">
			{/* 1. 통합 검색창 (검색 입력 시 자동으로 구매·예산 산출 탭 전환) */}
			<div>
				<div className="h-[40px] rounded-xl flex items-center px-3 bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] transition-all focus-within:border-[#2563eb] mb-5">
					<Search
						size={15}
						className="text-[#64748b] dark:text-[#a1a1aa] mr-2 shrink-0"
					/>
					<label htmlFor="consumables-sidebar-search" className="sr-only">
						소모품 및 부품코드 검색
					</label>
					<input
						id="consumables-sidebar-search"
						type="text"
						value={query}
						onChange={(e) => {
							onChangeQuery(e.target.value);
							if (activeTab !== "procurement" && e.target.value.trim()) {
								setActiveTab("procurement");
							}
						}}
						placeholder="품명, P/N, 대체품 검색..."
						className="flex-1 h-full bg-transparent border-none outline-none text-xs font-medium text-[#0f172a] dark:text-white placeholder:text-[#64748b] dark:placeholder:text-[#a1a1aa]"
					/>
					{query && (
						<button
							type="button"
							onClick={() => onChangeQuery("")}
							aria-label="검색어 초기화"
							className="inline-flex min-h-10 min-w-8 items-center justify-center text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
						>
							<X size={13} />
						</button>
					)}
				</div>

				{/* 2. 메인 메뉴 */}
				<h3 className="text-[11px] font-bold text-[#64748b] dark:text-[#a1a1aa] uppercase mb-2 px-2 tracking-wider">
					메뉴
				</h3>
				<div className="space-y-1.5">
					<button
						type="button"
						onClick={() => setActiveTab("briefing")}
						className={`w-full flex items-center gap-3 px-3 min-h-10 rounded-xl text-xs font-bold transition-all break-keep ${
							activeTab === "briefing"
								? "bg-[#2563eb] text-white shadow-sm"
								: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#16161c]"
						}`}
					>
						<FileText size={15} className="shrink-0" />
						<span>계약 기준 · 브리핑</span>
					</button>

					<button
						type="button"
						onClick={() => setActiveTab("procurement")}
						className={`w-full flex items-center justify-between px-3 min-h-10 rounded-xl text-xs font-bold transition-all break-keep ${
							activeTab === "procurement"
								? "bg-[#2563eb] text-white shadow-sm"
								: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#16161c]"
						}`}
					>
						<span className="flex items-center gap-3">
							<Calculator size={15} className="shrink-0" />
							<span>구매 · 예산 산출</span>
						</span>
						<span
							className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
								activeTab === "procurement"
									? "bg-white/20 text-white"
									: "bg-[#f1f5f9] dark:bg-[#16161c] text-[#64748b] dark:text-[#a1a1aa]"
							}`}
						>
							{kpi.selectedCount}
						</span>
					</button>

					<button
						type="button"
						onClick={() => setActiveTab("bom")}
						className={`w-full flex items-center gap-3 px-3 min-h-10 rounded-xl text-xs font-bold transition-all break-keep ${
							activeTab === "bom"
								? "bg-[#2563eb] text-white shadow-sm"
								: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#16161c]"
						}`}
					>
						<BookOpen size={15} className="shrink-0" />
						<span>HSKorea 장비 도해</span>
					</button>
				</div>
			</div>

			<div className="h-px bg-[#e2e8f0] dark:bg-[#222228]" />

			{/* 3. 활성 탭별 전용 사이드바 필터 */}
			{activeTab === "procurement" ? (
				<div className="flex flex-col gap-4">
					{/* 제조사 리스트 */}
					<div>
						<h3 className="text-[11px] font-bold text-[#64748b] dark:text-[#a1a1aa] uppercase mb-2 px-2 tracking-wider">
							제조사
						</h3>
						<div className="space-y-1">
							{MANUFACTURERS.map((mfg) => {
								const active = selectedMfg === mfg;
								const count =
									mfg === "전체" ? items.length : (mfgCounts[mfg] ?? 0);
								return (
									<button
										key={mfg}
										type="button"
										onClick={() => {
											onSelectMfg(mfg);
											onSelectModel("전체");
										}}
										className={`w-full flex items-center justify-between px-3 min-h-10 rounded-xl text-left text-xs font-semibold transition-all break-keep ${
											active
												? "text-[#2563eb] dark:text-[#60a5fa] bg-[#2563eb]/10 border border-[#2563eb]/25"
												: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#16161c]"
										}`}
									>
										<span className="truncate">
											{mfg === "전체" ? "전체 제조사" : mfg}
										</span>
										<span className="flex items-center gap-1.5 font-mono text-[11px] opacity-80">
											{count}
											{active && <Check size={13} className="shrink-0" />}
										</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* 품목구분 드롭다운 */}
					<div className="space-y-1.5">
						<h3 className="text-[10px] font-bold text-[#64748b] dark:text-[#a1a1aa] uppercase tracking-wider px-2">
							품목 구분
						</h3>
						<div className="relative">
							<button
								type="button"
								onClick={() => setShowGroupDropdown((v) => !v)}
								className="w-full flex items-center justify-between px-3.5 min-h-10 bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] rounded-xl text-xs font-semibold text-[#0f172a] dark:text-white hover:border-[#2563eb]/40 transition-all"
							>
								<span className="truncate">
									{selectedGroup === "전체" ? "모든 품목구분" : selectedGroup}
								</span>
								<ChevronDown
									size={15}
									className={`text-[#64748b] dark:text-[#a1a1aa] transition-transform duration-200 ${
										showGroupDropdown ? "rotate-180" : ""
									}`}
								/>
							</button>
							{showGroupDropdown && (
								<>
									<button
										type="button"
										aria-label="품목구분 메뉴 닫기"
										className="fixed inset-0 z-40 cursor-default"
										onClick={() => setShowGroupDropdown(false)}
									/>
									<div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] rounded-xl shadow-lg z-50 overflow-hidden p-1">
										{PART_GROUPS.map((grp) => (
											<button
												key={grp}
												type="button"
												onClick={() => {
													onSelectGroup(grp);
													setShowGroupDropdown(false);
												}}
												className={`w-full px-3 min-h-10 text-left text-xs font-semibold rounded-lg transition-all break-keep flex items-center justify-between ${
													selectedGroup === grp
														? "text-[#2563eb] dark:text-[#60a5fa] bg-[#2563eb]/10"
														: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#222228]"
												}`}
											>
												<span>{grp === "전체" ? "전체 구분" : grp}</span>
												{selectedGroup === grp && <Check size={13} />}
											</button>
										))}
									</div>
								</>
							)}
						</div>
					</div>

					{/* 세부 적용장비 드롭다운 */}
					<div className="space-y-1.5">
						<h3 className="text-[10px] font-bold text-[#64748b] dark:text-[#a1a1aa] uppercase tracking-wider px-2">
							세부 기기 필터 (공용 포함)
						</h3>
						<div className="relative">
							<button
								type="button"
								onClick={() => setShowDeviceDropdown((v) => !v)}
								className="w-full flex items-center justify-between px-3.5 min-h-10 bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] rounded-xl text-xs font-semibold text-[#0f172a] dark:text-white hover:border-[#2563eb]/40 transition-all"
							>
								<span className="truncate font-mono">
									{selectedModel === "전체" ? "모든 세부 기기" : selectedModel}
								</span>
								<ChevronDown
									size={15}
									className={`text-[#64748b] dark:text-[#a1a1aa] transition-transform duration-200 ${
										showDeviceDropdown ? "rotate-180" : ""
									}`}
								/>
							</button>
							{showDeviceDropdown && (
								<>
									<button
										type="button"
										aria-label="세부 기기 메뉴 닫기"
										className="fixed inset-0 z-40 cursor-default"
										onClick={() => setShowDeviceDropdown(false)}
									/>
									<div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] rounded-xl shadow-lg z-50 overflow-hidden">
										<div className="max-h-60 overflow-y-auto p-1">
											{availableModels.map((model) => (
												<button
													key={model}
													type="button"
													onClick={() => {
														onSelectModel(model);
														setShowDeviceDropdown(false);
													}}
													className={`w-full px-3 min-h-10 text-left text-xs font-semibold rounded-lg transition-all break-keep flex items-center justify-between ${
														selectedModel === model
															? "text-[#2563eb] dark:text-[#60a5fa] bg-[#2563eb]/10"
															: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#222228]"
													}`}
												>
													<span className="font-mono">
														{model === "전체" ? "전체 기기" : model}
													</span>
													{selectedModel === model && <Check size={13} />}
												</button>
											))}
										</div>
									</div>
								</>
							)}
						</div>
					</div>

					{/* 조회 범위 토글 */}
					<div className="space-y-1">
						<h3 className="text-[10px] font-bold text-[#64748b] dark:text-[#a1a1aa] uppercase tracking-wider px-2">
							목록 범위
						</h3>
						{(
							[
								{ id: "all", label: "전체 마스터 품목" },
								{
									id: "selected",
									label: `발주 선정분만 (${kpi.selectedCount})`,
								},
								{ id: "priced", label: "단가 보유 품목만" },
								{
									id: "unpricedSelected",
									label: `선정 중 미단가 (${kpi.unpricedSelectedCount})`,
								},
							] as const
						).map((opt) => {
							const active = scopeFilter === opt.id;
							return (
								<button
									key={opt.id}
									type="button"
									onClick={() => onChangeScopeFilter(opt.id)}
									className={`w-full flex items-center justify-between px-3 min-h-10 rounded-xl text-left text-xs font-semibold transition-all break-keep ${
										active
											? opt.id === "unpricedSelected"
												? "bg-[#f43f5e]/15 text-[#f43f5e] dark:text-[#f87171]"
												: "bg-[#10b981]/15 text-[#059669] dark:text-[#34d399]"
											: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#16161c]"
									}`}
								>
									<span>{opt.label}</span>
									{active && <Check size={13} className="shrink-0" />}
								</button>
							);
						})}
					</div>

					<button
						type="button"
						onClick={onResetDefaults}
						className="w-full inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#16161c] px-3 text-xs font-semibold text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
					>
						<RotateCcw size={13} />
						<span>추천 수량 초기화</span>
					</button>
				</div>
			) : activeTab === "bom" ? (
				<div>
					<h3 className="text-[11px] font-bold text-[#64748b] dark:text-[#a1a1aa] uppercase mb-2 px-2 tracking-wider">
						HSKorea 대상 기기 (7종)
					</h3>
					<div className="space-y-1">
						{bomModelKeys.map((key) => {
							const active = key === activeBomModel;
							const m = bomData[key];
							return (
								<button
									key={key}
									type="button"
									onClick={() => onSelectBomModel(key)}
									className={`w-full flex items-center justify-between px-3 min-h-10 rounded-xl text-left text-xs font-semibold transition-all ${
										active
											? "text-[#2563eb] dark:text-[#60a5fa] bg-[#2563eb]/10 border border-[#2563eb]/25"
											: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#16161c]"
									}`}
								>
									<span className="font-mono font-bold">{m?.label ?? key}</span>
									<span className="font-mono text-[11px] opacity-75">
										{m?.partsMaster.length ?? 0}종
									</span>
								</button>
							);
						})}
					</div>
				</div>
			) : (
				<div>
					<h3 className="text-[11px] font-bold text-[#64748b] dark:text-[#a1a1aa] uppercase mb-2 px-2 tracking-wider">
						업체별 바로가기
					</h3>
					<div className="space-y-1">
						{MANUFACTURERS.filter((m) => m !== "전체").map((mfg) => (
							<button
								key={mfg}
								type="button"
								onClick={() => {
									onSelectMfg(mfg);
									onSelectGroup("전체");
									onSelectModel("전체");
									onChangeScopeFilter("all");
									setActiveTab("procurement");
								}}
								className="w-full flex items-center justify-between px-3 min-h-10 rounded-xl text-left text-xs font-semibold text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#16161c] transition-all"
							>
								<span>{mfg} 단가표</span>
								<span className="font-mono text-[11px] opacity-75">
									{mfgCounts[mfg] ?? 0}건 →
								</span>
							</button>
						))}
					</div>
				</div>
			)}

			{/* 4. 하단 고정 예산 요약 미니 위젯 */}
			<div className="mt-auto rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#16161c] p-3 space-y-1.5">
				<div className="flex items-center justify-between text-[11px] font-semibold text-[#64748b] dark:text-[#a1a1aa]">
					<span>선정 {kpi.selectedCount}건 공급가</span>
					<span>VAT별도</span>
				</div>
				<div className="font-mono text-sm font-bold text-[#059669] dark:text-[#34d399] truncate">
					{formatWon(kpi.supplyTotal)}
				</div>
				<div className="flex items-center justify-between border-t border-[#e2e8f0] dark:border-[#222228] pt-1.5 text-[11px]">
					<span className="text-[#64748b] dark:text-[#a1a1aa]">VAT 포함</span>
					<span className="font-mono font-bold text-[#0f172a] dark:text-white">
						{formatWon(kpi.vatIncludedTotal)}
					</span>
				</div>
				{kpi.unpricedSelectedCount > 0 && (
					<button
						type="button"
						onClick={() => {
							onSelectMfg("전체");
							onSelectGroup("전체");
							onSelectModel("전체");
							onChangeScopeFilter("unpricedSelected");
							setActiveTab("procurement");
						}}
						className="w-full inline-flex min-h-10 items-center justify-center gap-1 rounded-lg bg-[#f43f5e]/15 text-[11px] font-bold text-[#f43f5e] dark:text-[#f87171] hover:bg-[#f43f5e]/25"
					>
						<AlertTriangle size={12} />
						<span>미확보 단가 {kpi.unpricedSelectedCount}건 점검</span>
					</button>
				)}
			</div>
		</aside>
	);
}
