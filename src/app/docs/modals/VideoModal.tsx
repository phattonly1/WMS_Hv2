"use client";

import { Film, PlayCircle, Search, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { matchChosung } from "@/utils/hangul";
import { VIDEO_CATEGORIES, VIDEO_DATA } from "../video/data";

interface VideoModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function VideoModal({ isOpen, onClose }: VideoModalProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [selectedVideo, setSelectedVideo] = useState<
		(typeof VIDEO_DATA)[0] | null
	>(null);

	const isSearching = searchTerm.trim().length > 0;

	const filteredVideos = useMemo(() => {
		let list = VIDEO_DATA;
		if (selectedCategory) {
			list = list.filter((v) => v.category === selectedCategory);
		}
		if (isSearching) {
			const q = searchTerm.trim();
			list = list.filter(
				(v) =>
					matchChosung(v.title, q) ||
					(v.desc && matchChosung(v.desc, q)) ||
					(v.category && matchChosung(v.category, q)),
			);
		}
		return list;
	}, [selectedCategory, isSearching, searchTerm]);

	return (
		<Modal
			isOpen={isOpen}
			onClose={() => {
				setSelectedVideo(null);
				setSelectedCategory(null);
				setSearchTerm("");
				onClose();
			}}
			title={selectedVideo ? selectedVideo.title : "동영상 매뉴얼"}
			subtitle={selectedVideo?.category ?? "KECO & WMS 영상 가이드"}
			icon={Video}
			maxWidth={selectedVideo ? "max-w-3xl" : "max-w-4xl"}
			onBack={selectedVideo ? () => setSelectedVideo(null) : undefined}
		>
			{selectedVideo ? (
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
			) : (
				<div className="flex flex-col md:flex-row gap-4 min-h-[460px]">
					{/* PC 좌측 사이드바 (모바일에서는 상단 탭으로 반응형 유지) */}
					<aside className="w-full md:w-56 shrink-0 flex flex-col gap-2">
						<div className="hidden md:block px-1">
							<span className="text-[11px] font-mono font-bold text-[#64748b] dark:text-[#a1a1aa] uppercase tracking-wider">
								장비 분류 ({VIDEO_CATEGORIES.length})
							</span>
						</div>

						{/* 모바일: 가로 스크롤 / PC: 세로 사이드바 목록 */}
						<div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto pb-1 md:pb-0 md:max-h-[400px] pr-0 md:pr-1">
							<button
								type="button"
								onClick={() => setSelectedCategory(null)}
								className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all text-left flex items-center justify-between ${
									selectedCategory === null
										? "bg-blue-600 text-white shadow-sm"
										: "bg-[#f1f5f9] dark:bg-[#16161c] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white border border-[#e2e8f0] dark:border-[#222228]"
								}`}
							>
								<span>전체 보기</span>
								<span className="text-[10px] font-mono opacity-80 ml-2">
									{VIDEO_DATA.length}
								</span>
							</button>

							{VIDEO_CATEGORIES.map((cat) => {
								const count = VIDEO_DATA.filter((v) => v.category === cat).length;
								const isSelected = selectedCategory === cat;
								return (
									<button
										key={cat}
										type="button"
										onClick={() => setSelectedCategory(cat)}
										className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all text-left flex items-center justify-between ${
											isSelected
												? "bg-blue-600 text-white shadow-sm"
												: "bg-[#f1f5f9] dark:bg-[#16161c] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white border border-[#e2e8f0] dark:border-[#222228]"
										}`}
									>
										<span className="truncate">{cat}</span>
										<span className="text-[10px] font-mono opacity-80 ml-2 shrink-0">
											{count}
										</span>
									</button>
								);
							})}
						</div>
					</aside>

					{/* 우측 메인 컨텐츠 영역: 검색창 + 동영상 카드 그리드 */}
					<div className="flex-1 flex flex-col gap-3 min-w-0">
						<div className="relative flex items-center w-full h-11 px-3.5 bg-[#f8fafc] dark:bg-[#09090b] rounded-xl border border-[#e2e8f0] dark:border-[#222228] focus-within:border-blue-500/50 shrink-0">
							<Search size={15} className="text-[#64748b] dark:text-[#a1a1aa] shrink-0 mr-2" />
							<input
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="동영상 제목 또는 키워드 검색..."
								className="w-full bg-transparent text-xs text-[#0f172a] dark:text-white placeholder-[#64748b] dark:placeholder-[#a1a1aa] focus:outline-none"
							/>
							{filteredVideos.length > 0 && (
								<span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md shrink-0 border border-blue-500/20 whitespace-nowrap">
									{filteredVideos.length}건
								</span>
							)}
						</div>

						{/* 비디오 그리드 */}
						<div className="flex-1 overflow-y-auto pr-1 max-h-[400px]">
							{filteredVideos.length === 0 ? (
								<div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-[#f1f5f9] dark:bg-[#16161c] rounded-2xl border border-[#e2e8f0] dark:border-[#222228]">
									<Film className="w-8 h-8 text-[#64748b] dark:text-[#52525b] mb-2" />
									<p className="text-xs font-bold text-[#0f172a] dark:text-white">
										해당 조건의 동영상이 없습니다
									</p>
									<p className="text-[11px] text-[#64748b] dark:text-[#a1a1aa] mt-1 font-mono">
										검색어나 선택된 카테고리를 확인해주세요.
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									{filteredVideos.map((item) => (
										<button
											key={item.id}
											type="button"
											onClick={() => setSelectedVideo(item)}
											className="group relative flex flex-col p-3 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/40 text-left transition-colors"
										>
											<div className="flex items-center justify-between gap-2 mb-2">
												<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
													{item.category}
												</span>
												<PlayCircle
													size={16}
													className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform"
												/>
											</div>
											<h4 className="text-xs font-bold text-[#0f172a] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors line-clamp-1 break-keep">
												{item.title}
											</h4>
											{item.desc && (
												<p className="text-[11px] text-[#64748b] dark:text-[#a1a1aa] line-clamp-2 mt-1 break-keep">
													{item.desc}
												</p>
											)}
										</button>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</Modal>
	);
}
