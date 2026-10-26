"use client";

import {
	ChevronRight,
	FileText,
	Folder,
	FolderOpen,
	FolderTree,
} from "lucide-react";
import { useMemo, useState } from "react";
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

	const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(
		() => {
			const initial: Record<string, boolean> = {};
			for (const c of categories) {
				initial[c.id] = true;
			}
			return initial;
		},
	);

	const toggleFolder = (id: string) => {
		setOpenFolders((prev) => ({ ...prev, [id]: !prev[id] }));
	};

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
			title="매뉴얼 목차 및 검색"
			subtitle="WMS STANDARD MANUAL"
			icon={FolderTree}
			sheetClassName="h-[45dvh] max-h-[45dvh] sm:h-auto sm:max-h-[85vh] rounded-3xl"
		>
			<div className="space-y-2 pr-1">
				{isSearching ? (
						<div>
							<p className="text-[11px] font-mono text-[#64748b] dark:text-[#a1a1aa] mb-2 px-1">
								검색 결과:{" "}
								<span className="text-blue-600 dark:text-blue-400 font-bold">
									{searchResults.length}
								</span>
								건
							</p>
							{searchResults.length === 0 ? (
								<div className="py-8 text-center text-xs text-[#64748b] dark:text-[#a1a1aa]">
									검색 결과가 없습니다.
								</div>
							) : (
								<div className="space-y-1.5">
									{searchResults.map((res) => (
										<button
											key={`${res.categoryId}-${res.item.id}`}
											type="button"
											onClick={() => {
												onSelectItem(res.categoryId, res.item.id);
												onClose();
											}}
											className="w-full p-3 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/40 text-left transition-colors flex items-start justify-between gap-2"
										>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-1.5 mb-1">
													<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
														{res.categoryName}
													</span>
												</div>
												<h4 className="text-xs font-bold text-[#0f172a] dark:text-white truncate break-keep">
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
												className="text-[#64748b] dark:text-[#a1a1aa] shrink-0 mt-2"
											/>
										</button>
									))}
								</div>
							)}
						</div>
					) : (
						<div className="space-y-2">
							{categories.map((cat) => {
								const isOpenFolder = !!openFolders[cat.id];
								const isCatActive = cat.id === activeCategoryId;

								return (
									<div
										key={cat.id}
										className="rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f1f5f9] dark:bg-[#16161c] overflow-hidden"
									>
										<button
											type="button"
											onClick={() => toggleFolder(cat.id)}
											className="w-full flex items-center justify-between p-3 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
										>
											<div className="flex items-center gap-2 min-w-0">
												{isOpenFolder ? (
													<FolderOpen
														size={16}
														className="text-blue-600 dark:text-blue-400 shrink-0"
													/>
												) : (
													<Folder
														size={16}
														className="text-[#64748b] dark:text-[#a1a1aa] shrink-0"
													/>
												)}
												<span className="text-xs font-bold text-[#0f172a] dark:text-white truncate">
													{cat.name}
												</span>
												<span className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa]">
													({cat.items.length})
												</span>
											</div>
											<ChevronRight
												size={14}
												className={`text-[#64748b] dark:text-[#a1a1aa] transition-transform ${isOpenFolder ? "rotate-90" : ""}`}
											/>
										</button>

										{isOpenFolder && (
											<div className="p-2 pt-0 space-y-1 border-t border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115]">
												{cat.items.map((item) => {
													const isItemActive =
														isCatActive && activeItemId === item.id;
													return (
														<button
															key={item.id}
															type="button"
															onClick={() => {
																onSelectItem(cat.id, item.id);
																onClose();
															}}
															className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
																isItemActive
																	? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20"
																	: "text-[#334155] dark:text-[#d4d4d8] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
															}`}
														>
															<FileText
																size={13}
																className="shrink-0 opacity-70"
															/>
															<span className="truncate flex-1 break-keep">
																{item.title}
															</span>
															{item.badge && (
																<span className="text-[9px] font-mono px-1 rounded bg-[#f1f5f9] dark:bg-[#16161c] text-[#64748b] dark:text-[#a1a1aa] border border-[#e2e8f0] dark:border-[#222228]">
																	{item.badge}
																</span>
															)}
														</button>
													);
												})}
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>
		</Modal>
	);
}
