"use client";

import {
	ArrowLeft,
	ArrowUp,
	ChevronLeft,
	ChevronRight,
	FlaskConical,
	FolderDown,
	FolderTree,
	List,
	Search,
	Video,
	X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import DownloadModal from "../modals/DownloadModal";
import ManualNavigationModal from "../modals/ManualNavigationModal";
import ReagentModal from "../modals/ReagentModal";
import VideoModal from "../modals/VideoModal";
import type { ManualCategory } from "../types";
import { ManualViewer } from "./ManualViewer";

interface DocsClientViewProps {
	initialCategories: ManualCategory[];
}

export default function DocsClientView({
	initialCategories,
}: DocsClientViewProps) {
	const [categories] = useState<ManualCategory[]>(initialCategories);
	const [activeCategoryId, setActiveCategoryId] = useState<string>(
		initialCategories[0]?.id || "small-network",
	);
	const [activeItemId, setActiveItemId] = useState<string | null>(null);

	const [isNavOpen, setIsNavOpen] = useState(false);
	const [activeModal, setActiveModal] = useState<
		"reagent" | "video" | "download" | null
	>(null);
	const [sharedSearchQuery, setSharedSearchQuery] = useState("");
	const [showScrollTop, setShowScrollTop] = useState(false);
	const [scrollProgress, setScrollProgress] = useState(0);
	const [fontSizeStep, setFontSizeStep] = useState<number>(0);

	// 데스크톱 / 모바일 공용 스크롤 이벤트 처리
	const handleScrollUpdate = (scrollTop: number, scrollHeight: number, clientHeight: number) => {
		setShowScrollTop(scrollTop > 200);
		const maxScroll = scrollHeight - clientHeight;
		if (maxScroll > 0) {
			const progress = Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100)));
			setScrollProgress(progress);
		} else {
			setScrollProgress(0);
		}
	};

	const scrollToTop = () => {
		const mobileContainer = document.getElementById("docs-scroll-container");
		if (mobileContainer && window.innerWidth < 640) {
			mobileContainer.scrollTo({ top: 0, behavior: "smooth" });
		} else {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	useEffect(() => {
		try {
			const saved = localStorage.getItem("wms_docs_font_step");
			if (saved !== null) {
				const parsed = Number.parseInt(saved, 10);
				if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 2) {
					setFontSizeStep(parsed);
				}
			}
		} catch {
			// ignore storage access errors
		}
	}, []);

	const handleCycleFontSize = () => {
		setFontSizeStep((prev) => {
			const next = (prev + 1) % 3;
			try {
				localStorage.setItem("wms_docs_font_step", String(next));
			} catch {
				// ignore
			}
			return next;
		});
	};

	// PC 브라우저 윈도우 스크롤 감지
	useEffect(() => {
		const handleWindowScroll = () => {
			if (window.innerWidth >= 640) {
				handleScrollUpdate(
					window.scrollY,
					document.documentElement.scrollHeight,
					window.innerHeight,
				);
			}
		};
		window.addEventListener("scroll", handleWindowScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleWindowScroll);
	}, []);

	// Cmd/Ctrl + K 키보드 단축키
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setIsNavOpen(true);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const activeCategory = useMemo(() => {
		const found = categories.find((c) => c.id === activeCategoryId);
		return (
			found ??
			categories[0] ?? {
				id: "empty",
				name: "매뉴얼",
				iconName: "BookOpen",
				items: [],
			}
		);
	}, [categories, activeCategoryId]);

	const totalDocsCount = useMemo(() => {
		return categories.reduce((acc, c) => acc + c.items.length, 0);
	}, [categories]);

	const currentCatIndex = useMemo(() => {
		return categories.findIndex((c) => c.id === activeCategoryId);
	}, [categories, activeCategoryId]);

	// 카테고리 퀵 내비게이터 무한 루프 순환 (Infinite Loop)
	const prevCategory =
		categories.length > 0 && currentCatIndex >= 0
			? categories[(currentCatIndex - 1 + categories.length) % categories.length]
			: null;
	const nextCategory =
		categories.length > 0 && currentCatIndex >= 0
			? categories[(currentCatIndex + 1) % categories.length]
			: null;

	return (
		<div className="fixed inset-0 sm:static h-dvh sm:min-h-screen bg-[#f8fafc] dark:bg-[#09090b] text-[#0f172a] dark:text-[#f4f4f5] font-sans relative flex flex-col overflow-hidden sm:overflow-visible overscroll-none transition-colors">
			{/* 도트 매트릭스 배경 */}
			<div
				className="absolute inset-0 pointer-events-none opacity-[0.03] dark:invert"
				style={{
					backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
					backgroundSize: "20px 20px",
				}}
			/>

			{/* 모바일 독립 스크롤 컨테이너 (웨일/모바일 툴바 위까지만 높이 제한 & 스크롤바가 하단바를 침범하지 않음) */}
			<div
				id="docs-scroll-container"
				onScroll={(e) => {
					const target = e.currentTarget;
					handleScrollUpdate(target.scrollTop, target.scrollHeight, target.clientHeight);
				}}
				className={`flex-1 w-full relative z-10 sm:pb-12 overscroll-contain ${
					isNavOpen || activeModal
						? "overflow-hidden sm:overflow-visible"
						: "overflow-y-auto sm:overflow-visible"
				}`}
			>
				<div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8 space-y-6">
					{/* 상단 내비게이션 바 (M3 Surface Container) */}
					<header className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors">
						<div className="flex items-center gap-3 min-w-0">
							<Link
								href="/dashboard"
								className="p-2 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-colors shrink-0"
								title="대시보드로 돌아가기"
							>
								<ArrowLeft className="w-4 h-4" />
							</Link>
							<div className="min-w-0">
								<h1 className="text-base sm:text-lg font-bold tracking-tight text-[#0f172a] dark:text-white truncate break-keep">
									국가수질자동측정망 업무 매뉴얼
								</h1>
							</div>
						</div>

						{/* PC 액션 버튼군 */}
						<div className="hidden sm:flex items-center gap-1.5 shrink-0">
							<ThemeToggle />
							<button
								type="button"
								onClick={() => setActiveModal("download")}
								className="px-3 py-1.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-xs font-mono text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
							>
								<FolderDown size={14} className="text-amber-500 dark:text-amber-400" />
								<span>다운로드</span>
							</button>
							<button
								type="button"
								onClick={() => setActiveModal("video")}
								className="px-3 py-1.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-xs font-mono text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
							>
								<Video size={14} className="text-indigo-500 dark:text-indigo-400" />
								<span>동영상</span>
							</button>
							<button
								type="button"
								onClick={() => setActiveModal("reagent")}
								className="px-3 py-1.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-xs font-mono text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
							>
								<FlaskConical size={14} className="text-emerald-500 dark:text-emerald-400" />
								<span>시약</span>
							</button>
							<button
								type="button"
								onClick={() => {
									setIsNavOpen(true);
								}}
								className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-mono text-white transition-colors flex items-center gap-1.5 whitespace-nowrap font-bold shadow-sm"
							>
								<FolderTree size={14} />
								<span>목차 ({totalDocsCount})</span>
							</button>
						</div>

						{/* 모바일 상단 테마 토글 버튼 (하단바에서 상단 헤더로 이동) */}
						<div className="sm:hidden flex items-center gap-1.5 shrink-0">
							<ThemeToggle />
						</div>
					</header>

					{/* 카테고리 탭 (M3 Pill Tabs) - 데스크톱에서만 노출, 모바일은 하단바 활용 */}
					<nav
						aria-label="카테고리 선택"
						className="hidden sm:flex flex-wrap items-center gap-2 pb-1"
					>
						{categories.map((cat) => (
							<button
								key={cat.id}
								type="button"
								onClick={() => {
									setActiveCategoryId(cat.id);
									setActiveItemId(null);
								}}
								className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
									activeCategoryId === cat.id
										? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
										: "bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:border-blue-500/30"
								}`}
							>
								{cat.name} ({cat.items.length})
							</button>
						))}
					</nav>

					{/* 메인 매뉴얼 뷰어 본체 */}
					<main className="w-full pb-6 sm:pb-0">
						<ManualViewer
							category={activeCategory}
							activeItemId={activeItemId}
							fontSizeStep={fontSizeStep}
						/>
					</main>
				</div>
			</div>

			{/* 데스크톱 전용 맨위로 플로팅 버튼 (모바일은 1단 하단바 인라인에 통합) */}
			{showScrollTop && (
				<button
					type="button"
					onClick={scrollToTop}
					aria-label="맨 위로 이동"
					className="hidden sm:flex fixed bottom-8 right-6 z-40 w-10 h-10 rounded-full bg-white dark:bg-[#16161c] text-[#0f172a] dark:text-white border border-[#e2e8f0] dark:border-[#222228] shadow-lg items-center justify-center transition-all hover:bg-[#f1f5f9] dark:hover:bg-white/10 active:scale-95"
				>
					<ArrowUp size={16} strokeWidth={2.5} />
				</button>
			)}

			{/* 모바일 전용 하단 고정 액션바 (독립 Flex 컨테이너로 스크롤 영역 아래에 위치) */}
			<div className="sm:hidden shrink-0 z-[1100] bg-white/95 dark:bg-[#111115]/95 backdrop-blur-md border-t border-[#e2e8f0] dark:border-[#222228] transition-colors pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
				{/* 카테고리 퀵 내비게이터 (모달 또는 목차가 닫혀있을 때만 노출) */}
				{!activeModal && !isNavOpen && (
					<div className="grid grid-cols-3 items-center border-b border-[#e2e8f0] dark:border-[#222228] text-xs font-mono select-none">
						<button
							type="button"
							onClick={() => {
								if (prevCategory) {
									setActiveCategoryId(prevCategory.id);
									setActiveItemId(null);
								}
							}}
							className="h-9 flex items-center justify-center gap-1 text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white border-r border-[#e2e8f0] dark:border-[#222228] px-2 active:scale-95 transition-all cursor-pointer"
						>
							<ChevronLeft size={14} />
							<span className="truncate">{prevCategory?.name || "이전"}</span>
						</button>

						<button
							type="button"
							onClick={scrollToTop}
							title="맨 위로 이동"
							className={`relative h-9 flex items-center justify-center gap-1.5 px-2 text-center border-r border-[#e2e8f0] dark:border-[#222228] font-bold text-xs active:scale-95 transition-all cursor-pointer overflow-hidden ${
								showScrollTop
									? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold shadow-inner"
									: "text-[#0f172a] dark:text-[#f4f4f5] hover:text-blue-600 dark:hover:text-blue-400"
							}`}
						>
							<span className="truncate">{activeCategory.name}</span>
							{showScrollTop && (
								<ArrowUp size={12} strokeWidth={2.8} className="shrink-0 animate-bounce text-blue-600 dark:text-blue-400" />
							)}

							{/* 4. 스크롤 진행률 게이지 바 (하단 2px) */}
							<div
								className="absolute bottom-0 left-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-150 ease-out"
								style={{ width: `${scrollProgress}%` }}
							/>
						</button>

						<button
							type="button"
							onClick={() => {
								if (nextCategory) {
									setActiveCategoryId(nextCategory.id);
									setActiveItemId(null);
								}
							}}
							className="h-9 flex items-center justify-center gap-1 text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white px-2 active:scale-95 transition-all cursor-pointer"
						>
							<span className="truncate">{nextCategory?.name || "다음"}</span>
							<ChevronRight size={14} />
						</button>
					</div>
				)}

				{/* 모바일 유틸 버튼군: [왼쪽 3개 모달 (시약, 동영상, 보관함)] + [중앙 공유 검색창/목차] + [오른쪽 폰트 크기 조절] */}
				<div className="flex items-center gap-1.5 p-2 px-2.5">
					{/* 1. 시약 버튼 */}
					<button
						type="button"
						onClick={() => {
							setIsNavOpen(false);
							setSharedSearchQuery("");
							setActiveModal(activeModal === "reagent" ? null : "reagent");
						}}
						className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer ${
							activeModal === "reagent"
								? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
								: "bg-[#f1f5f9] dark:bg-[#16161c] border-[#e2e8f0] dark:border-[#222228] text-emerald-600 dark:text-emerald-400"
						}`}
						title="시약"
						aria-label="시약 모달 열기"
					>
						<FlaskConical size={16} />
					</button>

					{/* 2. 동영상 버튼 */}
					<button
						type="button"
						onClick={() => {
							setIsNavOpen(false);
							setSharedSearchQuery("");
							setActiveModal(activeModal === "video" ? null : "video");
						}}
						className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer ${
							activeModal === "video"
								? "bg-indigo-500/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400"
								: "bg-[#f1f5f9] dark:bg-[#16161c] border-[#e2e8f0] dark:border-[#222228] text-indigo-600 dark:text-indigo-400"
						}`}
						title="동영상"
						aria-label="동영상 모달 열기"
					>
						<Video size={16} />
					</button>

					{/* 3. 파일보관함 다운로드 버튼 */}
					<button
						type="button"
						onClick={() => {
							setIsNavOpen(false);
							setSharedSearchQuery("");
							setActiveModal(activeModal === "download" ? null : "download");
						}}
						className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer ${
							activeModal === "download"
								? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
								: "bg-[#f1f5f9] dark:bg-[#16161c] border-[#e2e8f0] dark:border-[#222228] text-amber-600 dark:text-amber-400"
						}`}
						title="다운로드"
						aria-label="보관함 모달 열기"
					>
						<FolderDown size={16} />
					</button>

					{/* 4. 중앙 공용 검색창 */}
					<div className="flex-1 min-w-0 h-9 rounded-xl bg-[#f8fafc] dark:bg-[#09090b] border border-[#e2e8f0] dark:border-[#222228] focus-within:border-blue-500/50 flex items-center px-2.5 transition-colors">
						<Search
							size={13}
							className="text-[#64748b] dark:text-[#a1a1aa] mr-1 shrink-0"
						/>
						<input
							type="text"
							value={sharedSearchQuery}
							onChange={(e) => {
								setSharedSearchQuery(e.target.value);
								if (!activeModal && !isNavOpen && e.target.value.trim()) {
									setIsNavOpen(true);
								}
							}}
							onFocus={() => {
								if (!activeModal && !isNavOpen) {
									setIsNavOpen(true);
								}
							}}
							placeholder={
								isNavOpen
									? "목차 내 검색..."
									: activeModal === "reagent"
										? "시약 검색..."
										: activeModal === "video"
											? "동영상 검색..."
											: activeModal === "download"
												? "보관함 검색..."
												: "목차/문서 검색..."
							}
							className="w-full bg-transparent border-none outline-none text-xs text-[#0f172a] dark:text-white placeholder-[#64748b] dark:placeholder-[#a1a1aa]"
						/>
						{sharedSearchQuery ? (
							<button
								type="button"
								onClick={() => setSharedSearchQuery("")}
								className="w-5 h-5 rounded-full bg-slate-900/10 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white flex items-center justify-center active:scale-95 transition-all shrink-0 ml-1"
								aria-label="검색어 지우기"
							>
								<X size={12} strokeWidth={2.5} />
							</button>
						) : (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setActiveModal(null);
									setSharedSearchQuery("");
									setIsNavOpen(!isNavOpen);
								}}
								title="목차 열기"
								aria-label="매뉴얼 목차 열기"
								className={`w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-all shrink-0 border ml-1 ${
									isNavOpen
										? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs"
										: "bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-slate-800 dark:text-slate-200 border-black/[0.06] dark:border-white/10"
								}`}
							>
								<List size={14} strokeWidth={2.5} />
							</button>
						)}
					</div>

					{/* 5. 우측 단독 본문 폰트 크기 조절 버튼 */}
					<button
						type="button"
						onClick={handleCycleFontSize}
						className={`h-9 px-2.5 rounded-xl border flex items-center justify-center gap-0.5 shrink-0 active:scale-95 transition-all cursor-pointer select-none font-bold text-xs ${
							fontSizeStep > 0
								? "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400"
								: "bg-[#f1f5f9] dark:bg-[#16161c] border-[#e2e8f0] dark:border-[#222228] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
						}`}
						title={`본문 글자 크기: ${fontSizeStep === 2 ? "크게 (125%)" : fontSizeStep === 1 ? "중간 (110%)" : "기본 (100%)"}`}
						aria-label="본문 글자 크기 조절"
					>
						<span>Aa</span>
						<span className="text-[10px] font-mono opacity-80">
							{fontSizeStep === 0 ? "" : fontSizeStep === 1 ? "+" : "++"}
						</span>
					</button>
				</div>
			</div>

			{/* 모달군 (하단 공유 검색어 props 전달) */}
			{isNavOpen && (
				<ManualNavigationModal
					isOpen={isNavOpen}
					onClose={() => setIsNavOpen(false)}
					categories={categories}
					activeCategoryId={activeCategoryId}
					activeItemId={activeItemId}
					onSelectItem={(catId, itemId) => {
						setActiveCategoryId(catId);
						setActiveItemId(itemId);
					}}
					sharedSearchQuery={sharedSearchQuery}
				/>
			)}

			{activeModal === "reagent" && (
				<ReagentModal
					isOpen={activeModal === "reagent"}
					onClose={() => setActiveModal(null)}
					sharedSearchQuery={sharedSearchQuery}
				/>
			)}

			{activeModal === "video" && (
				<VideoModal
					isOpen={activeModal === "video"}
					onClose={() => setActiveModal(null)}
					sharedSearchQuery={sharedSearchQuery}
				/>
			)}

			{activeModal === "download" && (
				<DownloadModal
					isOpen={activeModal === "download"}
					onClose={() => setActiveModal(null)}
					sharedSearchQuery={sharedSearchQuery}
				/>
			)}
		</div>
	);
}
