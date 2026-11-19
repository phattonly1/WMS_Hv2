"use client";

import {
	Download,
	Film,
	PlayCircle,
	QrCode,
	Video,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { matchChosung } from "@/utils/hangul";
import { DocsPinGate } from "../components/DocsPinGate";
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

	const qrUrl =
		process.env.NEXT_PUBLIC_QR_GATE_URL ||
		"https://wms-qr.phattonly1.workers.dev";

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
							? selectedCategory
							: "동영상"
				}
				subtitle={
					selectedVideo?.category ??
					(isSearching
						? `${filteredVideos.length}건`
						: selectedCategory
							? `${filteredVideos.length}편`
							: undefined)
				}
				icon={Video}
				maxWidth={selectedVideo ? "max-w-3xl" : "max-w-4xl"}
				size="half"
				headerAction={
					<div className="flex items-center gap-1.5">
						{!selectedCategory && !selectedVideo && (
							<span className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[#64748b] dark:text-[#a1a1aa]">
								총 {VIDEO_DATA.length}편
							</span>
						)}
						<button
							type="button"
							onClick={() => setIsQROpen(true)}
							title="동영상 매뉴얼 QR 코드 발급"
							className="h-6 px-1.5 rounded-lg bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/10 border border-[#d7dfe9] dark:border-[#2a2a32] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white flex items-center gap-1 text-[11px] font-bold active:scale-95 transition-all cursor-pointer"
						>
							<QrCode size={12} className="text-blue-600 dark:text-blue-400" />
							<span>QR</span>
						</button>
					</div>
				}
				onBack={
					selectedVideo
						? () => setSelectedVideo(null)
						: selectedCategory
							? () => setSelectedCategory(null)
							: undefined
				}
			>
				<DocsPinGate title="동영상 매뉴얼 보안 코드 입력">
					{selectedVideo ? (
						/* 비디오 재생 뷰 */
						<div className="space-y-3">
							<div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[#d7dfe9] dark:border-[#2a2a32]">
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

							{selectedVideo.desc && (
								<div className="p-3 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#d7dfe9] dark:border-[#2a2a32]">
									<p className="text-xs text-[#64748b] dark:text-[#a1a1aa] leading-relaxed break-keep">
										{selectedVideo.desc}
									</p>
								</div>
							)}
						</div>
					) : isSearching ? (
						/* 검색 중일 때: 전체 영상 검색 결과 리스트 */
						<div>
							{filteredVideos.length === 0 ? (
								<div className="py-16 text-center text-xs text-[#64748b] dark:text-[#a1a1aa]">
									일치하는 동영상이 없습니다.
								</div>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
									{filteredVideos.map((video) => (
										<button
											key={video.id}
											type="button"
											onClick={() => setSelectedVideo(video)}
											className="group p-2.5 rounded-xl bg-white dark:bg-[#16161c] border border-[#d7dfe9] dark:border-[#2a2a32] hover:border-blue-500/50 text-left transition-all active:scale-[0.98] flex flex-col justify-between gap-1.5 shadow-xs"
										>
											<div className="flex items-center justify-between gap-2">
												<span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 truncate">
													{video.category}
												</span>
												<PlayCircle
													size={15}
													className="text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform"
												/>
											</div>
											<h4 className="text-xs font-bold text-[#0f172a] dark:text-white line-clamp-1 leading-snug">
												{video.title}
											</h4>
											{video.desc && (
												<p className="text-[11px] text-[#64748b] dark:text-[#a1a1aa] line-clamp-1">
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
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
							{filteredVideos.map((video) => (
								<button
									key={video.id}
									type="button"
									onClick={() => setSelectedVideo(video)}
									className="group p-2.5 rounded-xl bg-white dark:bg-[#16161c] border border-[#d7dfe9] dark:border-[#2a2a32] hover:border-blue-500/50 text-left transition-all active:scale-[0.98] flex flex-col justify-between gap-1.5 shadow-xs"
								>
									<div className="flex items-center justify-between gap-2">
										<h4 className="text-xs font-bold text-[#0f172a] dark:text-white truncate leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
											{video.title}
										</h4>
										<PlayCircle
											size={15}
											className="text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform"
										/>
									</div>
									{video.desc && (
										<p className="text-[11px] text-[#64748b] dark:text-[#a1a1aa] line-clamp-1">
											{video.desc}
										</p>
									)}
								</button>
							))}
						</div>
					) : (
						/* 기본 뷰: 9개 장비 폴더 그리드 뷰 */
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
										className="group px-3 py-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#16161c] border border-[#d7dfe9] dark:border-[#2a2a32] hover:border-blue-500/40 text-left transition-all active:scale-[0.98] flex items-center justify-between gap-2 shadow-xs hover:shadow-md cursor-pointer"
									>
										<div className="flex items-baseline gap-1.5 min-w-0">
											<span className="font-sans text-xs font-extrabold text-[#0f172a] dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
												{mainTitle}
											</span>
											{subTitle && (
												<span className="text-[10px] text-[#64748b] dark:text-[#a1a1aa] truncate">
													{subTitle}
												</span>
											)}
										</div>
										<span className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[#64748b] dark:text-[#a1a1aa] shrink-0">
											{count}편
										</span>
									</button>
								);
							})}
						</div>
					)}
				</DocsPinGate>
			</Modal>

			{/* 동영상 매뉴얼 QR 코드 모달 (소모품 QR 모달과 동일한 규격) */}
			<Modal
				isOpen={isQROpen}
				onClose={() => setIsQROpen(false)}
				title="QR 코드 발급"
				subtitle="동영상 매뉴얼"
				icon={QrCode}
				maxWidth="max-w-xs"
			>
				<div className="text-center space-y-3">
					<div className="relative inline-block">
						<div
							ref={qrRef}
							className="relative bg-white p-4 rounded-2xl border border-white/20 shadow-2xl flex items-center justify-center mx-auto"
						>
							<QRCodeSVG
								value={qrUrl}
								size={180}
								level="H"
								includeMargin={false}
							/>
						</div>
					</div>

					<p className="text-[11px] text-[#64748b] dark:text-[#71717a]">
						스캔 시 동영상 매뉴얼 즉시 오픈
					</p>

					<div className="flex gap-2 pt-1">
						<button
							type="button"
							onClick={() => setIsQROpen(false)}
							className="flex-1 h-10 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/10 text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white font-bold text-xs transition-all border border-[#d7dfe9] dark:border-[#2a2a32]"
						>
							닫기
						</button>
						<button
							type="button"
							onClick={downloadQR}
							className="flex-[1.5] h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
						>
							<Download size={14} /> PNG 다운로드
						</button>
					</div>
				</div>
			</Modal>
		</>
	);
}
