"use client";

import {
	AlertTriangle,
	ArrowLeft,
	BookOpen,
	ClipboardList,
	Download,
	FileSpreadsheet,
	Layers,
	Monitor,
	PackageCheck,
	Scale,
	Search,
	Upload,
	Wallet,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import BomDiagramGuideTab from "./components/BomDiagramGuideTab";
import HandoverBriefingTab from "./components/HandoverBriefingTab";
import ProcurementWorkspaceTab, {
	type ListScopeFilter,
} from "./components/ProcurementWorkspaceTab";
import { downloadContractsXlsx, exportHandoverJson } from "./exportContracts";
import {
	type ActiveTab,
	type BomDataset,
	type BomPartItem,
	type ConsumableItem,
	createDefaultPlanState,
	formatWon,
	type HandoverPlanState,
	MANUFACTURERS,
	PART_GROUPS,
	type PlanLineEntry,
	parseBaseQty,
	resolveUnitPrice,
	STORAGE_KEY,
} from "./types";

export default function ContractsPage() {
	const [items, setItems] = useState<ConsumableItem[]>([]);
	const [bomData, setBomData] = useState<BomDataset>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isMobileBlocked, setIsMobileBlocked] = useState<boolean>(false);
	const [scrollProgress, setScrollProgress] = useState<number>(0);

	const [activeTab, setActiveTab] = useState<ActiveTab>("briefing");
	const [plan, setPlan] = useState<HandoverPlanState | null>(null);

	// 구매·예산 산출 탭 필터 상태
	const [selectedMfg, setSelectedMfg] = useState<string>("전체");
	const [selectedGroup, setSelectedGroup] = useState<string>("전체");
	const [selectedModel, setSelectedModel] = useState<string>("전체");
	const [scopeFilter, setScopeFilter] = useState<ListScopeFilter>("all");
	const [query, setQuery] = useState<string>("");

	// 도해·BOM 탭 포커스 상태
	const [activeBomModel, setActiveBomModel] = useState<string>("HATOX-2000");
	const [highlightPartCode, setHighlightPartCode] = useState<string | null>(
		null,
	);

	const fileInputRef = useRef<HTMLInputElement | null>(null);

	// 런처와 동일한 모바일/소형 뷰포트 감지 + /items, /docs와 동일한 스크롤 진행률 및 스크롤바 숨김 처리
	useEffect(() => {
		document.documentElement.classList.add("scrollbar-hide");
		document.body.classList.add("scrollbar-hide");

		const checkMobileEnv = () => {
			const uaMobile =
				/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
					navigator.userAgent,
				);
			const smallViewport = window.innerWidth < 1024;
			setIsMobileBlocked(uaMobile || smallViewport);
		};

		const handleScroll = () => {
			const maxScroll =
				document.documentElement.scrollHeight - window.innerHeight;
			if (maxScroll > 0) {
				const progress = Math.min(
					100,
					Math.max(0, Math.round((window.scrollY / maxScroll) * 100)),
				);
				setScrollProgress(progress);
			} else {
				setScrollProgress(0);
			}
		};

		checkMobileEnv();
		handleScroll();
		window.addEventListener("resize", checkMobileEnv);
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			window.removeEventListener("resize", checkMobileEnv);
			window.removeEventListener("scroll", handleScroll);
			document.documentElement.classList.remove("scrollbar-hide");
			document.body.classList.remove("scrollbar-hide");
		};
	}, []);

	// 마스터 JSON + HSKorea 도해 JSON 병렬 로드 및 로컬스토리지 상태 복원
	useEffect(() => {
		let cancelled = false;
		Promise.all([
			fetch("/data/consumables_master_unified.json").then((res) => {
				if (!res.ok)
					throw new Error(`마스터 데이터 로드 실패 (HTTP ${res.status})`);
				return res.json() as Promise<ConsumableItem[]>;
			}),
			fetch("/data/bom_handover.json")
				.then((res) => (res.ok ? (res.json() as Promise<BomDataset>) : {}))
				.catch(() => ({}) as BomDataset),
		])
			.then(([masterItems, bomJson]) => {
				if (cancelled) return;
				setItems(masterItems);
				setBomData(bomJson);

				const defaultState = createDefaultPlanState(masterItems);
				try {
					const raw = window.localStorage.getItem(STORAGE_KEY);
					if (raw) {
						const parsed = JSON.parse(raw) as Partial<HandoverPlanState>;
						setPlan({
							...defaultState,
							...parsed,
							mfgMemos: {
								...defaultState.mfgMemos,
								...(parsed.mfgMemos ?? {}),
							},
							checkedActionIds: Array.isArray(parsed.checkedActionIds)
								? parsed.checkedActionIds
								: [],
							entries: { ...defaultState.entries, ...(parsed.entries ?? {}) },
						});
					} else {
						setPlan(defaultState);
					}
				} catch {
					setPlan(defaultState);
				}

				setLoading(false);
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(
						err instanceof Error
							? err.message
							: "데이터를 불러오지 못했습니다.",
					);
					setLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, []);

	// plan 변경 시 localStorage 자동 저장
	const commitPlan = useCallback(
		(updater: (prev: HandoverPlanState) => HandoverPlanState) => {
			setPlan((prev) => {
				if (!prev) return prev;
				const next = {
					...updater(prev),
					updatedAt: new Date().toISOString(),
				};
				try {
					window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
				} catch {
					// ignore storage quota errors
				}
				return next;
			});
		},
		[],
	);

	const handleUpdatePlanMeta = useCallback(
		(patch: Partial<HandoverPlanState>) => {
			commitPlan((prev) => ({ ...prev, ...patch }));
		},
		[commitPlan],
	);

	const handleUpdateMfgMemo = useCallback(
		(mfg: string, memo: string) => {
			commitPlan((prev) => ({
				...prev,
				mfgMemos: { ...prev.mfgMemos, [mfg]: memo },
			}));
		},
		[commitPlan],
	);

	const handleToggleCheckItem = useCallback(
		(id: string) => {
			commitPlan((prev) => {
				const exists = prev.checkedActionIds.includes(id);
				return {
					...prev,
					checkedActionIds: exists
						? prev.checkedActionIds.filter((x) => x !== id)
						: [...prev.checkedActionIds, id],
				};
			});
		},
		[commitPlan],
	);

	const handleUpdateEntry = useCallback(
		(id: number, patch: Partial<PlanLineEntry>) => {
			const targetItem = items.find((i) => i.id === id);
			commitPlan((prev) => {
				const existing = prev.entries[id] ?? {
					selected: false,
					qty: parseBaseQty(targetItem?.baseQty ?? "1"),
					memo: "",
				};
				return {
					...prev,
					entries: {
						...prev.entries,
						[id]: { ...existing, ...patch },
					},
				};
			});
		},
		[commitPlan, items],
	);

	const handleBulkToggleFiltered = useCallback(
		(filteredIds: number[], select: boolean) => {
			commitPlan((prev) => {
				const nextEntries = { ...prev.entries };
				for (const id of filteredIds) {
					const item = items.find((x) => x.id === id);
					const cur = nextEntries[id] ?? {
						selected: false,
						qty: parseBaseQty(item?.baseQty ?? "1"),
						memo: "",
					};
					nextEntries[id] = { ...cur, selected: select };
				}
				return { ...prev, entries: nextEntries };
			});
		},
		[commitPlan, items],
	);

	const handleImportJson = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = () => {
				try {
					const parsed = JSON.parse(
						String(reader.result),
					) as Partial<HandoverPlanState>;
					if (!parsed || typeof parsed !== "object" || !parsed.entries) {
						throw new Error("유효하지 않은 인수인계 파일 형식입니다.");
					}
					const base = createDefaultPlanState(items);
					const merged: HandoverPlanState = {
						...base,
						...parsed,
						mfgMemos: { ...base.mfgMemos, ...(parsed.mfgMemos ?? {}) },
						checkedActionIds: Array.isArray(parsed.checkedActionIds)
							? parsed.checkedActionIds
							: [],
						entries: { ...base.entries, ...parsed.entries },
						updatedAt: new Date().toISOString(),
					};
					setPlan(merged);
					window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
					toast.success("인수인계 작업본(.json)을 성공적으로 불러왔습니다.");
				} catch (err) {
					toast.error(
						err instanceof Error
							? err.message
							: "파일을 읽는 중 오류가 발생했습니다.",
					);
				} finally {
					e.target.value = "";
				}
			};
			reader.readAsText(file, "utf-8");
		},
		[items],
	);

	// BOM 부품코드 -> 대체품 매핑 사전
	const altPartMap = useMemo(() => {
		const map: Record<string, BomPartItem[]> = {};
		for (const modelObj of Object.values(bomData)) {
			for (const p of modelObj.partsMaster ?? []) {
				if (!p.partCode) continue;
				const bucket = map[p.partCode] ?? [];
				bucket.push(p);
				map[p.partCode] = bucket;
			}
		}
		return map;
	}, [bomData]);

	// 상단 글로벌 계약 KPI 집계
	const kpi = useMemo(() => {
		const priced26Total = items.filter((i) => i.price26 !== null).length;
		const pricedAnyTotal = items.filter(
			(i) => i.price26 !== null || i.price25 !== null,
		).length;

		let selectedCount = 0;
		let unpricedSelectedCount = 0;
		let supplyTotal = 0;

		if (plan) {
			for (const item of items) {
				const entry = plan.entries[item.id];
				if (!entry?.selected) continue;
				selectedCount++;
				const { price } = resolveUnitPrice(item, entry);
				if (price === null) {
					unpricedSelectedCount++;
				} else {
					supplyTotal += price * (entry.qty ?? parseBaseQty(item.baseQty));
				}
			}
		}

		return {
			priced26Total,
			pricedAnyTotal,
			selectedCount,
			unpricedSelectedCount,
			supplyTotal,
			vatIncludedTotal: Math.round(supplyTotal * 1.1),
		};
	}, [items, plan]);

	// 탭 간 빠른 점프 핸들러
	const handleJumpToManufacturer = useCallback(
		(mfg: string, onlyUnpriced?: boolean) => {
			setSelectedMfg(mfg);
			setSelectedGroup("전체");
			setSelectedModel("전체");
			setScopeFilter(onlyUnpriced ? "unpricedSelected" : "all");
			setQuery("");
			setActiveTab("procurement");
		},
		[],
	);

	const handleJumpToBomPart = useCallback((model: string, partCode: string) => {
		const normalizedModel = model === "HATA-4000A" ? "HATA-4000" : model;
		setActiveBomModel(normalizedModel);
		setHighlightPartCode(partCode);
		setActiveTab("bom");
	}, []);

	const handleJumpToProcurementPart = useCallback((partCode: string) => {
		setSelectedMfg("HSKorea");
		setSelectedGroup("전체");
		setSelectedModel("전체");
		setScopeFilter("all");
		setQuery(partCode);
		setActiveTab("procurement");
	}, []);

	// 모바일 또는 1024px 미만 환경 접근 시 런처 스타일 PC 전용 차단 안내 노출
	if (isMobileBlocked) {
		return (
			<div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-[#f8fafc] dark:bg-[#09090b] text-[#0f172a] dark:text-[#f4f4f5] relative transition-colors">
				<div
					className="absolute inset-0 pointer-events-none opacity-[0.03] dark:invert"
					style={{
						backgroundImage: "radial-gradient(#09090b 1px, transparent 1px)",
						backgroundSize: "20px 20px",
					}}
				/>
				<div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] p-6 text-center shadow-sm space-y-4">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2563eb]/10 border border-[#2563eb]/20 text-[#2563eb] dark:text-[#60a5fa]">
						<Monitor size={22} />
					</div>
					<div className="space-y-1.5">
						<h1 className="text-base font-bold text-[#0f172a] dark:text-white break-keep">
							PC 전용 기능
						</h1>
						<p className="text-xs sm:text-sm text-[#64748b] dark:text-[#a1a1aa] leading-relaxed break-keep">
							구매계약 워크스페이스는 다열 단가표·엑셀 설계 작업 특성상 PC 버전
							브라우저(1024px 이상)에서 실행해 주세요.
						</p>
					</div>
					<Link
						href="/dashboard"
						className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 text-xs font-bold text-white hover:bg-[#1d4ed8] transition-colors"
					>
						<ArrowLeft size={15} />
						<span>대시보드로 돌아가기</span>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-dvh flex flex-col bg-[#f8fafc] dark:bg-[#09090b] text-[#0f172a] dark:text-[#f4f4f5] font-sans relative transition-colors">
			{/* /docs, /dashboard와 동일한 미세 도트 그리드 배경 */}
			<div
				className="fixed inset-0 pointer-events-none opacity-[0.03] dark:invert"
				style={{
					backgroundImage: "radial-gradient(#09090b 1px, transparent 1px)",
					backgroundSize: "20px 20px",
				}}
			/>

			{/* /items, /docs 정식 규격 상단 고정 내비게이션 헤더 (h-14 + 블러 + 2px 진행률 게이지) */}
			<header className="sticky top-0 h-14 px-4 lg:px-6 border-b border-[#e2e8f0] dark:border-[#222228] bg-white/80 dark:bg-[#111115]/80 backdrop-blur-md flex items-center justify-between gap-2 shrink-0 z-30 transition-colors overflow-x-hidden">
				<div
					className="absolute bottom-0 left-0 h-0.5 bg-[#2563eb] dark:bg-[#60a5fa] transition-all duration-150 ease-out pointer-events-none"
					style={{ width: `${scrollProgress}%` }}
				/>

				{/* 좌측: 대시보드 복귀 아이콘 버튼 + 페이지 아이콘 배지 + 타이틀 */}
				<div className="flex items-center gap-2.5 min-w-0 shrink-0">
					<Link
						href="/dashboard"
						className="w-8 h-8 rounded-lg bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-[#e2e8f0] dark:hover:bg-[#222228] border border-[#e2e8f0] dark:border-[#222228] flex items-center justify-center text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-all active:scale-95 shrink-0"
						aria-label="대시보드로 돌아가기"
						title="대시보드로 돌아가기"
					>
						<ArrowLeft size={16} />
					</Link>
					<div className="flex items-center gap-2 min-w-0">
						<div className="w-8 h-8 rounded-lg bg-[#2563eb]/10 border border-[#2563eb]/20 text-[#2563eb] dark:text-[#60a5fa] flex items-center justify-center shrink-0">
							<ClipboardList size={15} strokeWidth={2.4} />
						</div>
						<h1 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-tight truncate break-keep">
							구매계약
						</h1>
					</div>
				</div>

				{/* 중앙: 3개 워크스페이스 탭 전환 */}
				<nav className="flex items-center gap-1 rounded-lg bg-[#f1f5f9] dark:bg-[#09090b] p-1 border border-[#e2e8f0] dark:border-[#222228] min-w-0">
					{(
						[
							{ id: "briefing", label: "계약 기준 · 브리핑", icon: Scale },
							{ id: "procurement", label: "구매 · 예산 산출", icon: Layers },
							{ id: "bom", label: "HSKorea 장비 도해", icon: BookOpen },
						] as const
					).map((tab) => {
						const Icon = tab.icon;
						const active = activeTab === tab.id;
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setActiveTab(tab.id)}
								className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold transition-all whitespace-nowrap ${
									active
										? "bg-white dark:bg-[#16161c] text-[#2563eb] dark:text-[#60a5fa] shadow-xs"
										: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
								}`}
							>
								<Icon size={13} />
								<span>{tab.label}</span>
							</button>
						);
					})}
				</nav>

				{/* 우측: 백업/불러오기 + 엑셀 다운로드 + 테마 토글 */}
				<div className="flex items-center gap-1.5 shrink-0">
					<ThemeToggle />

					<a
						href="/data/consumables_master_unified.csv"
						download="consumables_master_unified.csv"
						className="h-8 px-2 xl:px-2.5 rounded-lg bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-xs font-semibold text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
						title="원본 마스터 CSV 다운로드"
					>
						<Download size={14} className="text-[#f59e0b]" />
						<span className="hidden xl:inline">원본 CSV</span>
					</a>

					<input
						ref={fileInputRef}
						type="file"
						accept="application/json,.json"
						onChange={handleImportJson}
						className="hidden"
					/>

					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						disabled={!plan}
						className="h-8 px-2 xl:px-2.5 rounded-lg bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-xs font-semibold text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-colors inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
						title="인계받은 JSON 작업본 불러오기"
					>
						<Upload size={14} className="text-[#38bdf8]" />
						<span className="hidden xl:inline">불러오기</span>
					</button>

					<button
						type="button"
						onClick={() => plan && exportHandoverJson(plan)}
						disabled={!plan}
						className="h-8 px-2 xl:px-2.5 rounded-lg bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-xs font-semibold text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-colors inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
						title="선택 수량과 메모를 JSON 파일로 백업"
					>
						<Download size={14} className="text-[#10b981]" />
						<span className="hidden xl:inline">백업</span>
					</button>

					<button
						type="button"
						onClick={() => plan && downloadContractsXlsx(items, plan)}
						disabled={!plan || items.length === 0}
						className="h-8 px-2.5 xl:px-3 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap disabled:opacity-50"
						title="선정 구매내역서 + 업체별 요약 + 마스터 단가표 3시트 엑셀 내보내기"
					>
						<FileSpreadsheet size={14} />
						<span className="hidden lg:inline">설계내역서</span>
					</button>
				</div>
			</header>

			{/* 풀와이드 max-w-7xl 본문 레이아웃 (사이드바 제거) */}
			<div className="flex-1 max-w-7xl mx-auto w-full pt-4 px-4 relative z-10">
				<main className="min-w-0 pb-24 space-y-4">
					{/* 상단 컴팩트 KPI 요약 바 (구매 · 예산 산출 탭 전용) */}
					{activeTab === "procurement" && (
						<section className="grid grid-cols-4 gap-3">
							<div className="rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] p-3.5 shadow-sm">
								<div className="flex items-center justify-between text-[11px] font-semibold text-[#64748b] dark:text-[#a1a1aa]">
									<span>발주 선정 품목</span>
									<PackageCheck
										size={14}
										className="text-[#2563eb] dark:text-[#60a5fa]"
									/>
								</div>
								<p className="mt-1.5 tabular-nums text-lg font-bold text-[#0f172a] dark:text-white">
									{kpi.selectedCount.toLocaleString("ko-KR")}
									<span className="ml-1 text-xs font-normal text-[#64748b] dark:text-[#a1a1aa]">
										/ {items.length}종
									</span>
								</p>
							</div>

							<div className="rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] p-3.5 shadow-sm">
								<div className="flex items-center justify-between text-[11px] font-semibold text-[#64748b] dark:text-[#a1a1aa]">
									<span>예상 공급가액 (VAT별도)</span>
									<Wallet
										size={14}
										className="text-[#059669] dark:text-[#34d399]"
									/>
								</div>
								<p className="mt-1.5 tabular-nums text-lg font-bold text-[#059669] dark:text-[#34d399] truncate">
									{kpi.supplyTotal === 0 ? "0원" : formatWon(kpi.supplyTotal)}
								</p>
							</div>

							<div className="rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] p-3.5 shadow-sm">
								<div className="flex items-center justify-between text-[11px] font-semibold text-[#64748b] dark:text-[#a1a1aa]">
									<span>총 계약예상액 (VAT포함)</span>
									<span className="tabular-nums text-[10px] text-[#2563eb] dark:text-[#60a5fa] font-bold">
										26년단가 {kpi.priced26Total}종
									</span>
								</div>
								<p className="mt-1.5 tabular-nums text-lg font-bold text-[#0f172a] dark:text-white truncate">
									{kpi.vatIncludedTotal === 0
										? "0원"
										: formatWon(kpi.vatIncludedTotal)}
								</p>
							</div>

							<button
								type="button"
								onClick={() => {
									setSelectedMfg("전체");
									setSelectedGroup("전체");
									setSelectedModel("전체");
									setScopeFilter(
										kpi.unpricedSelectedCount > 0
											? "unpricedSelected"
											: "priced",
									);
									setActiveTab("procurement");
								}}
								className="rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] p-3.5 text-left shadow-sm transition-colors hover:border-[#2563eb]/50"
							>
								<div className="flex items-center justify-between text-[11px] font-semibold text-[#64748b] dark:text-[#a1a1aa]">
									<span>선정분 미단가 점검</span>
									<AlertTriangle
										size={14}
										className={
											kpi.unpricedSelectedCount > 0
												? "text-[#f43f5e]"
												: "text-[#10b981]"
										}
									/>
								</div>
								<p
									className={`mt-1.5 tabular-nums text-lg font-bold ${
										kpi.unpricedSelectedCount > 0
											? "text-[#f43f5e] dark:text-[#f87171]"
											: "text-[#059669] dark:text-[#34d399]"
									}`}
								>
									{kpi.unpricedSelectedCount}
									<span className="ml-1 text-xs font-normal text-[#64748b] dark:text-[#a1a1aa]">
										건 {kpi.unpricedSelectedCount > 0 ? "(확인 →)" : "(완료)"}
									</span>
								</p>
							</button>
						</section>
					)}

					{/* 본문 콘텐츠 */}
					{loading || !plan ? (
						<div className="h-64 flex flex-col items-center justify-center rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] p-6 text-xs font-semibold text-[#64748b] dark:text-[#a1a1aa]">
							계약 마스터 단가표 및 장비 도해 데이터를 불러오는 중...
						</div>
					) : error ? (
						<div className="h-64 flex flex-col items-center justify-center rounded-2xl border border-[#f43f5e]/40 bg-white dark:bg-[#111115] p-6 text-xs font-semibold text-[#f43f5e]">
							오류: {error}
						</div>
					) : activeTab === "briefing" ? (
						<HandoverBriefingTab
							items={items}
							plan={plan}
							onUpdatePlanMeta={handleUpdatePlanMeta}
							onUpdateMfgMemo={handleUpdateMfgMemo}
							onToggleCheckItem={handleToggleCheckItem}
							onJumpToManufacturer={handleJumpToManufacturer}
							onOpenBomGuide={(model) => {
								if (model) setActiveBomModel(model);
								setHighlightPartCode(null);
								setActiveTab("bom");
							}}
						/>
					) : activeTab === "procurement" ? (
						<ProcurementWorkspaceTab
							items={items}
							plan={plan}
							altPartMap={altPartMap}
							selectedMfg={selectedMfg}
							onSelectMfg={setSelectedMfg}
							selectedGroup={selectedGroup}
							onSelectGroup={setSelectedGroup}
							selectedModel={selectedModel}
							onSelectModel={setSelectedModel}
							scopeFilter={scopeFilter}
							onChangeScopeFilter={setScopeFilter}
							query={query}
							onChangeQuery={setQuery}
							onUpdateEntry={handleUpdateEntry}
							onBulkToggleFiltered={handleBulkToggleFiltered}
							onJumpToBomPart={handleJumpToBomPart}
						/>
					) : (
						<BomDiagramGuideTab
							bomData={bomData}
							activeModel={activeBomModel}
							highlightPartCode={highlightPartCode}
							onJumpToProcurementPart={handleJumpToProcurementPart}
						/>
					)}
				</main>
			</div>

			{/* 하단 플로팅 검색·필터 바텀바 (구매·예산 산출 / 장비 도해 탭 전용) */}
			{activeTab === "procurement" && (
				<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(960px,calc(100%-2rem))] rounded-2xl border border-[#cbd5e1] dark:border-[#27272a] bg-white/90 dark:bg-[#111115]/90 backdrop-blur-md px-3.5 py-2.5 shadow-lg flex items-center justify-between gap-2.5">
					<div className="flex items-center gap-2 flex-1 min-w-0">
						<div className="relative flex-1 max-w-60">
							<Search
								size={13}
								className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]"
							/>
							<input
								type="text"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="품명·코드·규격 검색..."
								className="h-8 w-full rounded-lg border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] pl-8 pr-2.5 text-xs text-[#0f172a] dark:text-white placeholder:text-[#94a3b8] dark:placeholder:text-[#71717a] focus:border-[#2563eb] focus:outline-none"
							/>
						</div>

						<select
							aria-label="제조사 필터"
							value={selectedMfg}
							onChange={(e) => setSelectedMfg(e.target.value)}
							className="h-8 rounded-lg border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] px-2 text-xs font-semibold text-[#0f172a] dark:text-white focus:border-[#2563eb] focus:outline-none"
						>
							{MANUFACTURERS.map((m) => (
								<option key={m} value={m}>
									{m === "전체" ? "제조사: 전체" : m}
								</option>
							))}
						</select>

						<select
							aria-label="부품 구분 필터"
							value={selectedGroup}
							onChange={(e) => setSelectedGroup(e.target.value)}
							className="h-8 rounded-lg border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] px-2 text-xs font-semibold text-[#0f172a] dark:text-white focus:border-[#2563eb] focus:outline-none"
						>
							{PART_GROUPS.map((g) => (
								<option key={g} value={g}>
									{g === "전체" ? "구분: 전체" : g}
								</option>
							))}
						</select>

						<div className="flex items-center gap-0.5 rounded-lg bg-[#f1f5f9] dark:bg-[#09090b] p-0.5 border border-[#e2e8f0] dark:border-[#222228]">
							{(
								[
									["all", "전체"],
									["selected", "선정"],
									["unpricedSelected", "미단가"],
								] as const
							).map(([val, label]) => (
								<button
									key={val}
									type="button"
									onClick={() => setScopeFilter(val)}
									className={`rounded-md px-2 py-1 text-[11px] font-bold transition-colors whitespace-nowrap ${
										scopeFilter === val
											? "bg-white dark:bg-[#16161c] text-[#2563eb] dark:text-[#60a5fa] shadow-xs"
											: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
									}`}
								>
									{label}
								</button>
							))}
						</div>
					</div>

					<div className="shrink-0 flex items-center gap-2 border-l border-[#e2e8f0] dark:border-[#222228] pl-3 text-xs tabular-nums">
						<span className="font-semibold text-[#64748b] dark:text-[#a1a1aa]">
							선정 {kpi.selectedCount}건
						</span>
						<span className="font-extrabold text-[#2563eb] dark:text-[#60a5fa]">
							{kpi.vatIncludedTotal === 0
								? "0원"
								: formatWon(kpi.vatIncludedTotal)}
						</span>
					</div>
				</div>
			)}

			{activeTab === "bom" && Object.keys(bomData).length > 0 && (
				<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-2xl border border-[#cbd5e1] dark:border-[#27272a] bg-white/90 dark:bg-[#111115]/90 backdrop-blur-md px-3.5 py-2 shadow-lg flex items-center gap-1.5">
					<span className="text-[11px] font-bold text-[#64748b] dark:text-[#a1a1aa] mr-1 whitespace-nowrap">
						HSKorea 기기:
					</span>
					{Object.keys(bomData).map((modelKey) => {
						const active = activeBomModel === modelKey;
						return (
							<button
								key={modelKey}
								type="button"
								onClick={() => {
									setActiveBomModel(modelKey);
									setHighlightPartCode(null);
								}}
								className={`rounded-lg px-2.5 py-1 tabular-nums text-xs font-bold transition-colors whitespace-nowrap ${
									active
										? "bg-[#2563eb] text-white"
										: "bg-[#f1f5f9] dark:bg-[#16161c] text-[#475569] dark:text-[#d4d4d8] hover:text-[#0f172a] dark:hover:text-white"
								}`}
							>
								{modelKey}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
