"use client";

import {
	ArrowLeft,
	ArrowUp,
	ChevronLeft,
	ChevronRight,
	FlaskConical,
	FolderDown,
	FolderTree,
	Search,
	Video,
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
	const [navSearchMode, setNavSearchMode] = useState(false);
	const [isReagentOpen, setIsReagentOpen] = useState(false);
	const [isVideoOpen, setIsVideoOpen] = useState(false);
	const [isDownloadOpen, setIsDownloadOpen] = useState(false);
	const [showScrollTop, setShowScrollTop] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setShowScrollTop(window.scrollY > 300);
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Cmd/Ctrl + K 키보드 단축키
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setNavSearchMode(true);
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

	const prevCategory =
		currentCatIndex > 0 ? categories[currentCatIndex - 1] : null;
	const nextCategory =
		currentCatIndex < categories.length - 1
			? categories[currentCatIndex + 1]
			: null;

	return (
		<div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] text-[#0f172a] dark:text-[#f4f4f5] font-sans relative pb-28 sm:pb-12 transition-colors">
			{/* 도트 매트릭스 배경 */}
			<div
				className="absolute inset-0 pointer-events-none opacity-[0.03] dark:invert"
				style={{
					backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
					backgroundSize: "20px 20px",
				}}
			/>

			<div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8 space-y-6 relative z-10">
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
							onClick={() => setIsDownloadOpen(true)}
							className="px-3 py-1.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-xs font-mono text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
						>
							<FolderDown size={14} className="text-amber-500 dark:text-amber-400" />
							<span>다운로드</span>
						</button>
						<button
							type="button"
							onClick={() => setIsVideoOpen(true)}
							className="px-3 py-1.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-xs font-mono text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
						>
							<Video size={14} className="text-indigo-500 dark:text-indigo-400" />
							<span>동영상</span>
						</button>
						<button
							type="button"
							onClick={() => setIsReagentOpen(true)}
							className="px-3 py-1.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-xs font-mono text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
						>
							<FlaskConical size={14} className="text-emerald-500 dark:text-emerald-400" />
							<span>시약</span>
						</button>
						<button
							type="button"
							onClick={() => {
								setNavSearchMode(false);
								setIsNavOpen(true);
							}}
							className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-mono text-white transition-colors flex items-center gap-1.5 whitespace-nowrap font-bold shadow-sm"
						>
							<FolderTree size={14} />
							<span>목차 ({totalDocsCount})</span>
						</button>
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
				<main className="w-full">
					<ManualViewer category={activeCategory} activeItemId={activeItemId} />
				</main>
			</div>

			{/* 맨위로 플로팅 버튼 */}
			{showScrollTop && (
				<button
					type="button"
					onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
					aria-label="맨 위로 이동"
					className="fixed bottom-20 sm:bottom-8 right-4 sm:right-6 z-40 w-10 h-10 rounded-full bg-white dark:bg-[#16161c] text-[#0f172a] dark:text-white border border-[#e2e8f0] dark:border-[#222228] shadow-lg flex items-center justify-center transition-all hover:bg-[#f1f5f9] dark:hover:bg-white/10 active:scale-95"
				>
					<ArrowUp size={16} strokeWidth={2.5} />
				</button>
			)}

			{/* 모바일 전용 하단 고정 액션바 */}
			<div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111115]/95 backdrop-blur-md border-t border-[#e2e8f0] dark:border-[#222228] transition-colors">
				{/* 카테고리 퀵 내비게이터 */}
				<div className="grid grid-cols-3 items-center border-b border-[#e2e8f0] dark:border-[#222228] text-xs font-mono">
					<button
						type="button"
						disabled={!prevCategory}
						onClick={() => {
							if (prevCategory) {
								setActiveCategoryId(prevCategory.id);
								setActiveItemId(null);
							}
						}}
						className="h-9 flex items-center justify-center gap-1 text-[#64748b] dark:text-[#a1a1aa] disabled:opacity-30 border-r border-[#e2e8f0] dark:border-[#222228] px-2"
					>
						<ChevronLeft size={14} />
						<span className="truncate">{prevCategory?.name || "이전"}</span>
					</button>

					<div className="h-9 flex items-center justify-center px-2 text-center border-r border-[#e2e8f0] dark:border-[#222228] font-bold text-blue-600 dark:text-blue-400 truncate">
						{activeCategory.name}
					</div>

					<button
						type="button"
						disabled={!nextCategory}
						onClick={() => {
							if (nextCategory) {
								setActiveCategoryId(nextCategory.id);
								setActiveItemId(null);
							}
						}}
						className="h-9 flex items-center justify-center gap-1 text-[#64748b] dark:text-[#a1a1aa] disabled:opacity-30 px-2"
					>
						<span className="truncate">{nextCategory?.name || "다음"}</span>
						<ChevronRight size={14} />
					</button>
				</div>

				{/* 모바일 유틸 버튼군 */}
				<div className="flex items-center gap-2 p-2 px-3">
					<ThemeToggle />
					<button
						type="button"
						onClick={() => {
							setNavSearchMode(false);
							setIsNavOpen(true);
						}}
						className="w-9 h-9 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"
						title="목차"
					>
						<FolderTree size={16} />
					</button>

					<button
						type="button"
						onClick={() => setIsReagentOpen(true)}
						className="w-9 h-9 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0"
						title="시약"
					>
						<FlaskConical size={16} />
					</button>

					<div
						onClick={() => {
							setNavSearchMode(true);
							setIsNavOpen(true);
						}}
						className="flex-1 min-w-0 h-9 rounded-xl bg-[#f8fafc] dark:bg-[#09090b] border border-[#e2e8f0] dark:border-[#222228] flex items-center px-3 cursor-pointer"
						aria-hidden="true"
					>
						<Search size={14} className="text-[#64748b] dark:text-[#a1a1aa] mr-1.5 shrink-0" />
						<span className="text-xs text-[#64748b] dark:text-[#a1a1aa] truncate">검색...</span>
					</div>

					<button
						type="button"
						onClick={() => setIsVideoOpen(true)}
						className="w-9 h-9 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0"
						title="동영상"
					>
						<Video size={16} />
					</button>

					<button
						type="button"
						onClick={() => setIsDownloadOpen(true)}
						className="w-9 h-9 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0"
						title="다운로드"
					>
						<FolderDown size={16} />
					</button>
				</div>
			</div>

			{/* 모달 4종 */}
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
					initialSearchMode={navSearchMode}
				/>
			)}

			{isReagentOpen && (
				<ReagentModal
					isOpen={isReagentOpen}
					onClose={() => setIsReagentOpen(false)}
				/>
			)}

			{isVideoOpen && (
				<VideoModal
					isOpen={isVideoOpen}
					onClose={() => setIsVideoOpen(false)}
				/>
			)}

			{isDownloadOpen && (
				<DownloadModal
					isOpen={isDownloadOpen}
					onClose={() => setIsDownloadOpen(false)}
				/>
			)}
		</div>
	);
}
