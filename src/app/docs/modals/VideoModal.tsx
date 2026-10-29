"use client";

import {
	ChevronLeft,
	Download,
	Film,
	Folder,
	PlayCircle,
	QrCode,
	Video,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { matchChosung } from "@/utils/hangul";
import { VIDEO_CATEGORIES, VIDEO_DATA } from "../video/data";

interface VideoModalProps {
	isOpen: boolean;
	onClose: () => void;
	sharedSearchQuery?: string;
}

export default function VideoModal({
	isOpen,
	onClose,
	sharedSearchQuery = "",
}: VideoModalProps) {
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [selectedVideo, setSelectedVideo] = useState<
		(typeof VIDEO_DATA)[0] | null
	>(null);
	const [isQROpen, setIsQROpen] = useState<boolean>(false);
	const qrRef = useRef<HTMLDivElement>(null);

	const origin =
		typeof window !== "undefined" &&
		window.location.hostname !== "localhost" &&
		window.location.hostname !== "127.0.0.1"
			? window.location.origin
			: "https://wmshv2.vercel.app";
	const qrUrl = `${origin}/docs?modal=video&quicklink=true`;

	const downloadQR = () => {
		if (!qrRef.current) return;
		const svg = qrRef.current.querySelector("svg");
		if (!svg) return;

		const svgData = new XMLSerializer().serializeToString(svg);
		const img = new window.Image();

		img.onload = () => {
			const padding = 20;
			const textHeight = 30;
			const canvas = document.createElement("canvas");
			canvas.width = img.width + padding * 2;
			canvas.height = img.height + padding * 2 + textHeight;

			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			// 순백색 배경 (스캐너 인식 보장)
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// QR 코드 그리기
			ctx.drawImage(img, padding, padding);

			// 하단 라벨 그리기
			ctx.fillStyle = "#09090b";
			ctx.font =
				"bold 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(
				"동영상 매뉴얼 바로가기",
				canvas.width / 2,
				img.height + padding * 1.5 + textHeight / 2,
			);

			const pngFile = canvas.toDataURL("image/png");
			const downloadLink = document.createElement("a");
			downloadLink.download = "QR_동영상_매뉴얼.png";
			downloadLink.href = pngFile;
			downloadLink.click();
			toast.success("QR 코드 이미지 저장 완료");
		};

		img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
	};

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
		<>
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
				size="half"
				headerAction={
					<button
						type="button"
						onClick={() => setIsQROpen(true)}
						title="동영상 매뉴얼 QR 코드 발급"
						className="h-8 px-2.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/10 border border-[#e2e8f0] dark:border-[#222228] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-all cursor-pointer"
					>
						<QrCode size={14} className="text-blue-600 dark:text-blue-400" />
						<span className="hidden sm:inline">QR 코드</span>
					</button>
				}
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
									<Film
										size={36}
										className="text-[#64748b] dark:text-[#a1a1aa] mb-2"
									/>
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
								<Folder
									size={14}
									className="text-blue-600 dark:text-blue-400"
								/>
								<span>장비별 동영상 폴더 ({VIDEO_CATEGORIES.length})</span>
							</span>
							<span className="text-[11px] font-mono text-[#64748b] dark:text-[#a1a1aa]">
								전체 {VIDEO_DATA.length}개 영상
							</span>
						</div>

						<div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
							{VIDEO_CATEGORIES.map((cat) => {
								const count = VIDEO_DATA.filter(
									(v) => v.category === cat,
								).length;
								const match = cat.match(/^([^(]+)(?:\(([^)]+)\))?$/);
								const mainTitle = match?.[1]?.trim() || cat;
								const subTitle = match?.[2]?.trim();

								return (
									<button
										key={cat}
										type="button"
										onClick={() => setSelectedCategory(cat)}
										className="group px-3.5 py-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/40 text-left transition-all active:scale-[0.98] flex flex-col justify-center gap-0.5 shadow-xs hover:shadow-md cursor-pointer"
									>
										<div className="flex items-center justify-between gap-2 w-full">
											<span className="font-sans text-xs font-extrabold text-[#0f172a] dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
												{mainTitle}
											</span>
											<span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[#64748b] dark:text-[#a1a1aa] shrink-0">
												{count}편
											</span>
										</div>

										<span className="font-mono text-[11px] font-medium text-[#64748b] dark:text-[#a1a1aa] truncate block">
											{subTitle || "측정소 개요"}
										</span>
									</button>
								);
							})}
						</div>
					</div>
				)}
			</Modal>

			{/* 동영상 매뉴얼 QR 코드 모달 (소모품 QR 모달과 동일한 규격) */}
			<Modal
				isOpen={isQROpen}
				onClose={() => setIsQROpen(false)}
				title="QR 코드 발급"
				subtitle="동영상 매뉴얼 바로가기"
				icon={QrCode}
				maxWidth="max-w-xs"
			>
				<div className="text-center space-y-4">
					<div className="relative inline-block">
						<div
							ref={qrRef}
							className="relative bg-white p-5 rounded-2xl border border-white/20 shadow-2xl flex items-center justify-center mx-auto"
						>
							<QRCodeSVG
								value={qrUrl}
								size={180}
								level="H"
								includeMargin={false}
							/>
						</div>
					</div>

					<div className="space-y-1">
						<p className="text-xs font-mono font-bold text-[#0f172a] dark:text-white truncate max-w-[220px] mx-auto">
							동영상 매뉴얼 바로가기
						</p>
						<p className="text-[10px] font-mono text-[#64748b] dark:text-[#71717a]">
							로그인 없이 즉시 동영상 모달 오픈
						</p>
					</div>

					<div className="flex gap-2.5 pt-1">
						<button
							type="button"
							onClick={() => setIsQROpen(false)}
							className="flex-1 h-11 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/10 text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white font-bold text-xs transition-all border border-[#e2e8f0] dark:border-[#222228]"
						>
							닫기
						</button>
						<button
							type="button"
							onClick={downloadQR}
							className="flex-[1.5] h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
						>
							<Download size={14} /> PNG 다운로드
						</button>
					</div>
				</div>
			</Modal>
		</>
	);
}
