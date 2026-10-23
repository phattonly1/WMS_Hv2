"use client";

import { ChevronDown, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ManualCategory } from "../types";

interface MarkdownRendererProps {
	content: string;
	onImageClick?: (src: string, alt?: string) => void;
}

const ListContext = React.createContext<{ depth: number; isOrdered: boolean }>({
	depth: 0,
	isOrdered: false,
});

function FluidTable({ children }: { children: React.ReactNode }) {
	return (
		<div className="w-full my-3 overflow-x-auto rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#09090b] shadow-xs">
			<table className="w-full min-w-[340px] text-left border-collapse text-xs leading-snug">
				{children}
			</table>
		</div>
	);
}

function MarkdownRenderer({ content, onImageClick }: MarkdownRendererProps) {
	return (
		<div className="w-full text-[#0f172a] dark:text-[#f4f4f5]">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					p({ children }) {
						return (
							<p className="mb-3 last:mb-0 text-[#64748b] dark:text-[#a1a1aa] break-keep leading-relaxed text-xs sm:text-[13px]">
								{children}
							</p>
						);
					},
					h1({ children }) {
						return (
							<h1 className="font-bold tracking-tight text-[#0f172a] dark:text-white mt-4 mb-2 text-base break-keep">
								{children}
							</h1>
						);
					},
					h2({ children }) {
						return (
							<h2 className="font-bold tracking-tight text-[#0f172a] dark:text-white mt-4 mb-2 text-sm sm:text-base break-keep">
								{children}
							</h2>
						);
					},
					h3({ children }) {
						return (
							<h3 className="font-bold tracking-tight text-[#0f172a] dark:text-white mt-3 mb-1.5 text-xs sm:text-sm break-keep">
								{children}
							</h3>
						);
					},
					h4({ children }) {
						return (
							<h4 className="font-bold text-[#0f172a] dark:text-[#f4f4f5] mt-2 mb-1 text-xs break-keep">
								{children}
							</h4>
						);
					},
					h5({ children }) {
						return (
							<h5 className="font-bold text-[#64748b] dark:text-[#a1a1aa] uppercase tracking-wider mt-4 mb-2 text-[11px] flex items-center gap-1.5 break-keep">
								{children}
							</h5>
						);
					},
					blockquote({ children }) {
						return (
							<blockquote className="my-3 p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-[#475569] dark:text-[#a1a1aa] text-xs leading-relaxed break-keep">
								{children}
							</blockquote>
						);
					},
					ul({ children }) {
						return (
							<ListContext.Consumer>
								{(ctx) => (
									<ListContext.Provider
										value={{ depth: ctx.depth + 1, isOrdered: false }}
									>
										<ul className="my-1.5 space-y-1 pl-0 w-full text-[#64748b] dark:text-[#a1a1aa]">
											{children}
										</ul>
									</ListContext.Provider>
								)}
							</ListContext.Consumer>
						);
					},
					ol({ children }) {
						return (
							<ListContext.Consumer>
								{(ctx) => (
									<ListContext.Provider
										value={{ depth: ctx.depth + 1, isOrdered: true }}
									>
										<ol className="my-2 space-y-2 list-none pl-0 [counter-reset:step-counter]">
											{children}
										</ol>
									</ListContext.Provider>
								)}
							</ListContext.Consumer>
						);
					},
					li({ children }) {
						return (
							<ListContext.Consumer>
								{(ctx) => {
									if (ctx.isOrdered && ctx.depth === 1) {
										return (
											<li className="relative flex flex-col rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] p-3 text-xs [counter-increment:step-counter]">
												<div className="flex items-start gap-2">
													<span className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-mono font-bold text-[10px] shrink-0 before:content-[counter(step-counter)]" />
													<div className="flex-1 min-w-0 text-[#0f172a] dark:text-[#f4f4f5] break-keep">
														{children}
													</div>
												</div>
											</li>
										);
									}

									return (
										<li className="flex items-start gap-2 text-[#64748b] dark:text-[#a1a1aa] text-xs py-0.5 break-keep">
											<span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 shrink-0 mt-1.5" />
											<div className="flex-1 min-w-0">{children}</div>
										</li>
									);
								}}
							</ListContext.Consumer>
						);
					},
					table({ children }) {
						return <FluidTable>{children}</FluidTable>;
					},
					thead({ children }) {
						return (
							<thead className="bg-[#f1f5f9] dark:bg-[#16161c] border-b border-[#e2e8f0] dark:border-[#222228] text-[#0f172a] dark:text-white font-bold whitespace-nowrap">
								{children}
							</thead>
						);
					},
					th({ children }) {
						return (
							<th className="py-2 px-3 font-mono text-[11px] tracking-tight break-keep text-[#64748b] dark:text-[#a1a1aa]">
								{children}
							</th>
						);
					},
					tbody({ children }) {
						return (
							<tbody className="divide-y divide-[#e2e8f0] dark:divide-[#222228] font-normal">
								{children}
							</tbody>
						);
					},
					tr({ children }) {
						return (
							<tr className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
								{children}
							</tr>
						);
					},
					td({ children }) {
						return (
							<td className="py-2 px-3 text-[#334155] dark:text-[#d4d4d8] text-xs leading-relaxed break-keep align-top">
								{children}
							</td>
						);
					},
					code({ className, children, ...props }) {
						const isInline = !className;
						if (isInline) {
							return (
								<code
									className="px-1.5 py-0.5 rounded-md bg-[#f1f5f9] dark:bg-[#16161c] text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold border border-[#e2e8f0] dark:border-[#222228]"
									{...props}
								>
									{children}
								</code>
							);
						}
						return (
							<pre className="p-3 my-2 rounded-xl bg-[#f8fafc] dark:bg-[#09090b] text-[#0f172a] dark:text-[#f4f4f5] border border-[#e2e8f0] dark:border-[#222228] overflow-x-auto text-xs font-mono">
								<code className={className} {...props}>
									{children}
								</code>
							</pre>
						);
					},
					strong({ children }) {
						return <strong className="font-bold text-[#0f172a] dark:text-white">{children}</strong>;
					},
					img({ src, alt }) {
						if (!src || typeof src !== "string") return null;
						return (
							<figure className="my-3 block group">
								<div
									onClick={() => onImageClick?.(src, alt)}
									className="relative overflow-hidden rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#09090b] cursor-zoom-in transition-all hover:border-blue-500/40"
									aria-hidden="true"
								>
									<img
										src={src}
										alt={alt || "매뉴얼 이미지"}
										loading="lazy"
										decoding="async"
										className="w-full max-h-[380px] object-contain mx-auto"
									/>
									<div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/70 text-[10px] text-white/90 font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
										확대보기
									</div>
								</div>
								{alt && (
									<figcaption className="text-center text-[11px] text-[#64748b] dark:text-[#a1a1aa] mt-1.5 px-2">
										{alt}
									</figcaption>
								)}
							</figure>
						);
					},
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}

interface ManualViewerProps {
	category: ManualCategory;
	activeItemId?: string | null;
}

export function ManualViewer({ category, activeItemId }: ManualViewerProps) {
	const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(
		() => {
			const initial: Record<string, boolean> = {};
			if (activeItemId) {
				initial[activeItemId] = true;
			}
			return initial;
		},
	);

	useEffect(() => {
		if (activeItemId) {
			setExpandedIds((prev) => ({ ...prev, [activeItemId]: true }));
			setTimeout(() => {
				const el = document.getElementById(`manual-${activeItemId}`);
				if (el) {
					el.scrollIntoView({ behavior: "smooth", block: "center" });
				}
			}, 100);
		}
	}, [activeItemId]);

	const [zoomImage, setZoomImage] = useState<{
		src: string;
		alt?: string | undefined;
	} | null>(null);

	const toggleItem = (id: string) => {
		setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	return (
		<div className="w-full space-y-4">
			{/* 카테고리 헤더 */}
			<div className="px-1 pt-2 pb-1">
				<h2 className="font-bold tracking-tight text-[#0f172a] dark:text-white text-lg sm:text-xl truncate break-keep">
					{category.name}
				</h2>
				{category.description && (
					<p className="text-[#64748b] dark:text-[#a1a1aa] mt-1 break-keep text-xs sm:text-sm">
						{category.description}
					</p>
				)}
			</div>

			{/* 개별 매뉴얼 카드 목록 */}
			<div className="space-y-3">
				{category.items.map((item) => {
					const isExpanded = !!expandedIds[item.id];
					const isHighlight = activeItemId === item.id;

					return (
						<article
							key={item.id}
							id={`manual-${item.id}`}
							className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
								isHighlight
									? "border-blue-500/80 bg-[#f1f5f9] dark:bg-[#16161c] shadow-[0_0_20px_rgba(37,99,235,0.15)]"
									: "border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] hover:border-blue-500/30 dark:hover:border-[#222228]"
							}`}
						>
							{/* 카드 헤더 (토글) */}
							<button
								type="button"
								onClick={() => toggleItem(item.id)}
								aria-expanded={isExpanded}
								className="w-full flex items-center justify-between p-4 sm:p-5 text-left select-none hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
							>
								<div className="flex-1 min-w-0 pr-3">
									<div className="flex items-center gap-2 mb-1.5 flex-wrap">
										{item.badge && (
											<span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
												{item.badge}
											</span>
										)}
										{item.tags?.map((tag) => (
											<span
												key={tag}
												className="font-mono text-[#64748b] dark:text-[#a1a1aa] text-[11px] whitespace-nowrap"
											>
												#{tag}
											</span>
										))}
									</div>

									<h3 className="font-bold tracking-tight text-[#0f172a] dark:text-white leading-snug break-keep text-sm sm:text-base">
										{item.title}
									</h3>

									{item.subtitle && (
										<p className="text-[#64748b] dark:text-[#a1a1aa] mt-1 break-keep text-xs">
											{item.subtitle}
										</p>
									)}
								</div>

								<div
									className={`w-8 h-8 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] flex items-center justify-center transition-transform duration-200 shrink-0 text-[#64748b] dark:text-[#a1a1aa] ${
										isExpanded ? "rotate-180 text-[#0f172a] dark:text-white" : ""
									}`}
								>
									<ChevronDown size={16} />
								</div>
							</button>

							{/* 본문 렌더러 */}
							{isExpanded && (
								<div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-2 border-t border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115]">
									<MarkdownRenderer
										content={item.content}
										onImageClick={(src, alt) => setZoomImage({ src, alt })}
									/>
								</div>
							)}
						</article>
					);
				})}
			</div>

			{/* 이미지 확대 모달 */}
			{zoomImage && (
				<div
					role="dialog"
					aria-modal="true"
					className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
					onClick={() => setZoomImage(null)}
					aria-hidden="true"
				>
					<div
						className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
						onClick={(e) => e.stopPropagation()}
						aria-hidden="true"
					>
						<button
							type="button"
							onClick={() => setZoomImage(null)}
							className="absolute -top-10 right-0 w-8 h-8 rounded-xl bg-white dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-[#0f172a] dark:text-white flex items-center justify-center"
							aria-label="닫기"
						>
							<X size={16} />
						</button>
						<img
							src={zoomImage.src}
							alt={zoomImage.alt || "확대 이미지"}
							className="max-w-full max-h-[80vh] object-contain rounded-xl border border-[#e2e8f0] dark:border-[#222228]"
						/>
					</div>
				</div>
			)}
		</div>
	);
}
