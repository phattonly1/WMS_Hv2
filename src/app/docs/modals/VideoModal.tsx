"use client";

import {
	Activity,
	Atom,
	Building2,
	ChevronLeft,
	Dna,
	Film,
	FlaskConical,
	Folder,
	Gauge,
	Layers,
	PlayCircle,
	Sparkles,
	TestTube2,
	Video,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { matchChosung } from "@/utils/hangul";
import { VIDEO_CATEGORIES, VIDEO_DATA } from "../video/data";

interface VideoModalProps {
	isOpen: boolean;
	onClose: () => void;
	sharedSearchQuery?: string;
}

// 9개 장비 카테고리별 시각적 M3 아이콘 및 색상 메타데이터
const CATEGORY_META: Record<
	string,
	{ icon: React.ElementType; color: string; bg: string }
> = {
	"달천측정소 소개": {
		icon: Building2,
		color: "text-blue-500 dark:text-blue-400",
		bg: "bg-blue-500/10 border-blue-500/20",
	},
	"일반항목(YSI EXO2)": {
		icon: Gauge,
		color: "text-cyan-500 dark:text-cyan-400",
		bg: "bg-cyan-500/10 border-cyan-500/20",
	},
	"일반항목(기술과환경)": {
		icon: Activity,
		color: "text-emerald-500 dark:text-emerald-400",
		bg: "bg-emerald-500/10 border-emerald-500/20",
	},
	"TOC(시마즈 TOC)": {
		icon: TestTube2,
		color: "text-amber-500 dark:text-amber-400",
		bg: "bg-amber-500/10 border-amber-500/20",
	},
	"TOC(코비 HATA-4000B)": {
		icon: FlaskConical,
		color: "text-orange-500 dark:text-orange-400",
		bg: "bg-orange-500/10 border-orange-500/20",
	},
	"T-N(백년기술)": {
		icon: Dna,
		color: "text-purple-500 dark:text-purple-400",
		bg: "bg-purple-500/10 border-purple-500/20",
	},
	"T-P(백년기술)": {
		icon: Sparkles,
		color: "text-rose-500 dark:text-rose-400",
		bg: "bg-rose-500/10 border-rose-500/20",
	},
	"T-N(H-KORBI)": {
		icon: Atom,
		color: "text-indigo-500 dark:text-indigo-400",
		bg: "bg-indigo-500/10 border-indigo-500/20",
	},
	"T-P(H-KORBI)": {
		icon: Layers,
		color: "text-teal-500 dark:text-teal-400",
		bg: "bg-teal-500/10 border-teal-500/20",
	},
};

export default function VideoModal({
	isOpen,
	onClose,
	sharedSearchQuery = "",
}: VideoModalProps) {
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [selectedVideo, setSelectedVideo] = useState<
		(typeof VIDEO_DATA)[0] | null
	>(null);

	const isSearching = sharedSearchQuery.trim().length > 0;

	const filteredVideos = useMemo(() => {
		let list = VIDEO_DATA;
		if (selectedCategory && !isSearching) {
			list = list.filter((v) => v.category === selectedCategory);
		}
		if (isSearching) {
			const q = sharedSearchQuery.trim();
			list = list.filter(
				(v) =>
					matchChosung(v.title, q) ||
					(v.desc && matchChosung(v.desc, q)) ||
					(v.category && matchChosung(v.category, q)),
			);
		}
		return list;
	}, [selectedCategory, isSearching, sharedSearchQuery]);

	return (
		<Modal
			isOpen={isOpen}
			onClose={() => {
				setSelectedVideo(null);
				setSelectedCategory(null);
				onClose();
			}}
			title={
				selectedVideo
					? selectedVideo.title
					: selectedCategory
						? `${selectedCategory} 영상`
						: "동영상 매뉴얼"
			}
			subtitle={
				selectedVideo?.category ??
				(selectedCategory
					? `${filteredVideos.length}개 동영상`
					: "장비별 교육 및 유지보수 영상 가이드")
			}
			icon={Video}
			maxWidth={selectedVideo ? "max-w-3xl" : "max-w-4xl"}
			onBack={
				selectedVideo
					? () => setSelectedVideo(null)
					: selectedCategory
						? () => setSelectedCategory(null)
						: undefined
			}
		>
			{selectedVideo ? (
				/* 비디오 재생 뷰 */
				<div className="space-y-4">
					<div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[#e2e8f0] dark:border-[#222228]">
						{selectedVideo.streamUrl ? (
							<video
								src={selectedVideo.streamUrl}
								controls
								className="w-full h-full"
							>
								<track kind="captions" />
							</video>
						) : (
							<div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
								<Film size={36} className="text-[#64748b] dark:text-[#a1a1aa] mb-2" />
								<p className="text-xs text-[#64748b] dark:text-[#a1a1aa] mb-4">
									영상 스트리밍 준비 중입니다.
								</p>
							</div>
						)}
					</div>

					<div className="p-4 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228]">
						<h3 className="text-sm font-bold text-[#0f172a] dark:text-white mb-1">
							{selectedVideo.title}
						</h3>
						{selectedVideo.desc && (
							<p className="text-xs text-[#64748b] dark:text-[#a1a1aa] leading-relaxed break-keep">
								{selectedVideo.desc}
							</p>
						)}
					</div>
				</div>
			) : isSearching ? (
				/* 검색 중일 때: 전체 영상 검색 결과 리스트 */
				<div className="space-y-3">
					<div className="text-[11px] font-mono text-[#64748b] dark:text-[#a1a1aa] px-1">
						'{sharedSearchQuery}' 검색 결과:{" "}
						<span className="font-bold text-blue-600 dark:text-blue-400">
							{filteredVideos.length}
						</span>
						건
					</div>

					{filteredVideos.length === 0 ? (
						<div className="py-20 text-center text-xs text-[#64748b] dark:text-[#a1a1aa] font-mono">
							일치하는 동영상이 없습니다.
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{filteredVideos.map((video) => (
								<button
									key={video.id}
									type="button"
									onClick={() => setSelectedVideo(video)}
									className="group p-3.5 rounded-2xl bg-white dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/50 text-left transition-all active:scale-[0.98] flex flex-col justify-between gap-3 shadow-xs"
								>
									<div>
										<div className="flex items-center justify-between gap-2 mb-1.5">
											<span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 truncate">
												{video.category}
											</span>
											<PlayCircle
												size={16}
												className="text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform"
											/>
										</div>
										<h4 className="text-xs font-bold text-[#0f172a] dark:text-white line-clamp-2 leading-snug">
											{video.title}
										</h4>
									</div>
									{video.desc && (
										<p className="text-[11px] text-[#64748b] dark:text-[#a1a1aa] line-clamp-2">
											{video.desc}
										</p>
									)}
								</button>
							))}
						</div>
					)}
				</div>
			) : selectedCategory ? (
				/* 특정 장비 폴더 내부: 영상 목록 */
				<div className="space-y-3">
					<div className="flex items-center justify-between px-1">
						<button
							type="button"
							onClick={() => setSelectedCategory(null)}
							className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
						>
							<ChevronLeft size={14} />
							<span>전체 장비 폴더로 나가기</span>
						</button>
						<span className="text-xs font-mono text-[#64748b] dark:text-[#a1a1aa]">
							총 {filteredVideos.length}개 영상
						</span>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{filteredVideos.map((video) => (
							<button
								key={video.id}
								type="button"
								onClick={() => setSelectedVideo(video)}
								className="group p-3.5 rounded-2xl bg-white dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/50 text-left transition-all active:scale-[0.98] flex flex-col justify-between gap-3 shadow-xs"
							>
								<div>
									<div className="flex items-center justify-between gap-2 mb-1.5">
										<span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 truncate">
											{video.category}
										</span>
										<PlayCircle
											size={16}
											className="text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform"
										/>
									</div>
									<h4 className="text-xs font-bold text-[#0f172a] dark:text-white line-clamp-2 leading-snug">
										{video.title}
									</h4>
								</div>
								{video.desc && (
									<p className="text-[11px] text-[#64748b] dark:text-[#a1a1aa] line-clamp-2">
										{video.desc}
									</p>
								)}
							</button>
						))}
					</div>
				</div>
			) : (
				/* 기본 뷰: 9개 장비 폴더 & 아이콘 그리드 뷰 (가로스크롤 완전 대체) */
				<div className="space-y-4">
					<div className="flex items-center justify-between px-1">
						<span className="text-xs font-bold text-[#0f172a] dark:text-white flex items-center gap-1.5">
							<Folder size={14} className="text-blue-600 dark:text-blue-400" />
							<span>장비별 동영상 폴더 ({VIDEO_CATEGORIES.length})</span>
						</span>
						<span className="text-[11px] font-mono text-[#64748b] dark:text-[#a1a1aa]">
							전체 {VIDEO_DATA.length}개 영상
						</span>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
						{VIDEO_CATEGORIES.map((cat) => {
							const meta = CATEGORY_META[cat] || {
								icon: Video,
								color: "text-blue-500 dark:text-blue-400",
								bg: "bg-blue-500/10 border-blue-500/20",
							};
							const Icon = meta.icon;
							const count = VIDEO_DATA.filter((v) => v.category === cat).length;

							return (
								<button
									key={cat}
									type="button"
									onClick={() => setSelectedCategory(cat)}
									className="group p-4 rounded-2xl bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/40 text-left transition-all active:scale-[0.98] flex flex-col justify-between gap-3 shadow-xs hover:shadow-md cursor-pointer"
								>
									<div className="flex items-start justify-between">
										<div
											className={`w-10 h-10 rounded-xl flex items-center justify-center border ${meta.bg} ${meta.color} group-hover:scale-105 transition-transform`}
										>
											<Icon size={20} strokeWidth={2.2} />
										</div>
										<span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[#64748b] dark:text-[#a1a1aa]">
											{count}편
										</span>
									</div>

									<div>
										<h4 className="text-xs font-bold text-[#0f172a] dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
											{cat}
										</h4>
										<span className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] block mt-0.5">
											폴더 열기 &rarr;
										</span>
									</div>
								</button>
							);
						})}
					</div>
				</div>
			)}
		</Modal>
	);
}
