"use client";

import {
	ChevronLeft,
	ChevronRight,
	FileText,
	FolderTree,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { matchChosung } from "@/utils/hangul";
import type { ManualCategory, ManualItem } from "../types";

interface SearchResult {
	categoryId: string;
	categoryName: string;
	item: ManualItem;
	matchedField: "title" | "subtitle" | "tags" | "content";
}

interface ManualNavigationModalProps {
	isOpen: boolean;
	onClose: () => void;
	categories: ManualCategory[];
	activeCategoryId: string;
	activeItemId: string | null;
	onSelectItem: (categoryId: string, itemId: string) => void;
	sharedSearchQuery?: string;
}

export default function ManualNavigationModal({
	isOpen,
	onClose,
	categories,
	activeCategoryId,
	activeItemId,
	onSelectItem,
	sharedSearchQuery = "",
}: ManualNavigationModalProps) {
	const query = sharedSearchQuery;

	const [activeCatIndex, setActiveCatIndex] = useState<number>(() => {
		const idx = categories.findIndex((c) => c.id === activeCategoryId);
		return idx >= 0 ? idx : 0;
	});

	useEffect(() => {
		if (isOpen) {
			const idx = categories.findIndex((c) => c.id === activeCategoryId);
			if (idx >= 0) setActiveCatIndex(idx);
		}
	}, [isOpen, categories, activeCategoryId]);

	const activeCategory = categories[activeCatIndex] ?? categories[0];
	const prevCategory =
		categories.length > 0
			? categories[
					(activeCatIndex - 1 + categories.length) % categories.length
				]
			: null;
	const nextCategory =
		categories.length > 0
			? categories[(activeCatIndex + 1) % categories.length]
			: null;

	const isSearching = query.trim().length > 0;

	const searchResults = useMemo<SearchResult[]>(() => {
		if (!isSearching) return [];
		const q = query.trim();
		const results: SearchResult[] = [];

		for (const cat of categories) {
			for (const item of cat.items) {
				if (matchChosung(item.title, q)) {
					results.push({
						categoryId: cat.id,
						categoryName: cat.name,
						item,
						matchedField: "title",
					});
				} else if (item.subtitle && matchChosung(item.subtitle, q)) {
					results.push({
						categoryId: cat.id,
						categoryName: cat.name,
						item,
						matchedField: "subtitle",
					});
				} else if (item.tags?.some((tag) => matchChosung(tag, q))) {
					results.push({
						categoryId: cat.id,
						categoryName: cat.name,
						item,
						matchedField: "tags",
					});
				} else if (item.content?.toLowerCase().includes(q.toLowerCase())) {
					results.push({
						categoryId: cat.id,
						categoryName: cat.name,
						item,
						matchedField: "content",
					});
				}
			}
		}
		return results;
	}, [categories, query, isSearching]);

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={isSearching ? "매뉴얼 검색 결과" : "매뉴얼 목차 바로가기"}
			subtitle={
				isSearching
					? `검색어: "${query}" (${searchResults.length}건)`
					: "카테고리별 문서 목록"
			}
			icon={FolderTree}
			size="half"
			contentClassName="!p-0 overflow-hidden"
		>
			{isSearching ? (
				/* 검색 결과 목록 */
				<div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#09090b]">
					<div className="flex-1 overflow-y-auto overscroll-contain p-2.5 space-y-1.5">
						{searchResults.length === 0 ? (
							<div className="py-16 text-center text-xs text-[#64748b] dark:text-[#71717a] font-mono">
								'{query}' 일치하는 문서가 없습니다.
							</div>
						) : (
							searchResults.map((res) => (
								<button
									key={`${res.categoryId}-${res.item.id}`}
									type="button"
									onClick={() => {
										onSelectItem(res.categoryId, res.item.id);
										onClose();
									}}
									className="w-full p-3 rounded-xl bg-[#f8fafc] dark:bg-[#111115] hover:bg-[#f1f5f9] dark:hover:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/40 text-left transition-all active:scale-[0.99] flex items-start justify-between gap-2 group shadow-xs"
								>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-1.5 mb-1">
											<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
												{res.categoryName}
											</span>
										</div>
										<h4 className="text-xs font-bold text-[#0f172a] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate break-keep">
											{res.item.title}
										</h4>
										{res.item.subtitle && (
											<p className="text-[11px] text-[#64748b] dark:text-[#a1a1aa] truncate mt-0.5">
												{res.item.subtitle}
											</p>
										)}
									</div>
									<ChevronRight
										size={14}
										className="text-[#94a3b8] dark:text-[#52525b] group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 mt-2 transition-colors"
									/>
								</button>
							))
						)}
					</div>
				</div>
			) : (
				/* 카테고리별 탐색 뷰 (StationListModal 스타일 3분할 순환 내비게이터) */
				<div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#09090b]">
					{/* 카테고리 전환 퀵 내비게이터 바 (원형 순환 Infinite Loop) */}
					<div className="grid grid-cols-3 items-center bg-[#f8fafc] dark:bg-[#16161c] border-b border-[#e2e8f0] dark:border-[#222228] text-xs font-mono select-none shrink-0 h-10">
						<button
							type="button"
							onClick={() =>
								setActiveCatIndex(
									(activeCatIndex - 1 + categories.length) % categories.length,
								)
							}
							className="h-full flex items-center justify-center gap-1 text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-colors px-2 border-r border-[#e2e8f0] dark:border-[#222228] active:scale-95 cursor-pointer"
						>
							<ChevronLeft size={15} strokeWidth={2.5} />
							<span className="truncate">{prevCategory?.name || "이전"}</span>
						</button>

						<div className="h-full flex items-center justify-center px-2 text-center border-r border-[#e2e8f0] dark:border-[#222228] font-bold text-[#0f172a] dark:text-white">
							<span className="truncate flex items-center gap-1 text-blue-600 dark:text-blue-400">
								<span className="truncate">{activeCategory?.name}</span>
								<span className="text-[10px] font-mono text-[#64748b] dark:text-[#71717a] shrink-0">
									({activeCatIndex + 1}/{categories.length})
								</span>
							</span>
						</div>

						<button
							type="button"
							onClick={() =>
								setActiveCatIndex((activeCatIndex + 1) % categories.length)
							}
							className="h-full flex items-center justify-center gap-1 text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-colors px-2 active:scale-95 cursor-pointer"
						>
							<span className="truncate">{nextCategory?.name || "다음"}</span>
							<ChevronRight size={15} strokeWidth={2.5} />
						</button>
					</div>

					{/* 선택된 카테고리의 문서 목록 */}
					<div className="flex-1 overflow-y-auto overscroll-contain p-2.5 space-y-1.5">
						{!activeCategory || activeCategory.items.length === 0 ? (
							<div className="py-12 text-center text-[11px] font-mono text-[#64748b] dark:text-[#71717a]">
								문서가 없습니다.
							</div>
						) : (
							activeCategory.items.map((item) => {
								const isItemActive =
									activeCategory.id === activeCategoryId &&
									activeItemId === item.id;

								return (
									<button
										key={item.id}
										type="button"
										onClick={() => {
											onSelectItem(activeCategory.id, item.id);
											onClose();
										}}
										className={`w-full px-3 py-2.5 rounded-xl border flex items-center justify-between gap-2.5 text-left transition-all active:scale-[0.99] group ${
											isItemActive
												? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
												: "bg-[#f8fafc] dark:bg-[#111115] hover:bg-[#f1f5f9] dark:hover:bg-[#16161c] border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/30 text-[#0f172a] dark:text-[#f4f4f5]"
										}`}
									>
										<div className="flex items-center gap-2.5 min-w-0 flex-1">
											<FileText
												size={14}
												className={
													isItemActive
														? "text-blue-600 dark:text-blue-400 shrink-0"
														: "text-[#64748b] dark:text-[#a1a1aa] group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 transition-colors"
												}
											/>
											<div className="min-w-0 flex-1">
												<div className="text-xs font-bold truncate break-keep group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
													{item.title}
												</div>
												{item.subtitle && (
													<div className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] truncate mt-0.5">
														{item.subtitle}
													</div>
												)}
											</div>
										</div>

										<div className="flex items-center gap-1.5 shrink-0">
											{item.badge && (
												<span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-[#16161c] text-[#64748b] dark:text-[#a1a1aa] border border-[#e2e8f0] dark:border-[#222228]">
													{item.badge}
												</span>
											)}
											<ChevronRight
												size={13}
												className="text-[#94a3b8] dark:text-[#52525b] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
											/>
										</div>
									</button>
								);
							})
						)}
					</div>
				</div>
			)}
		</Modal>
	);
}
