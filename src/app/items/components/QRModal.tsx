"use client";

import { Download, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import type { Supply } from "../types";

interface QRModalProps {
	isOpen: boolean;
	onClose: () => void;
	item: Supply | null;
}

export default function QRModal({ isOpen, onClose, item }: QRModalProps) {
	const qrRef = useRef<HTMLDivElement>(null);

	const downloadQR = () => {
		if (!qrRef.current || !item) return;
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

			// M3 Dark QR 배경: 순백색 (스캐너 인식 보장)
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// QR 코드 그리기
			ctx.drawImage(img, padding, padding);

			// 라벨 그리기 (텍스트)
			ctx.fillStyle = "#09090b";
			ctx.font =
				"bold 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			const maxWidth = canvas.width - padding * 2;
			let displayName = item.name;
			while (
				ctx.measureText(displayName).width > maxWidth &&
				displayName.length > 0
			) {
				displayName = displayName.slice(0, -1);
			}
			if (displayName !== item.name) {
				displayName += "...";
			}

			ctx.fillText(
				displayName,
				canvas.width / 2,
				img.height + padding * 1.5 + textHeight / 2,
			);

			const pngFile = canvas.toDataURL("image/png");
			const downloadLink = document.createElement("a");
			downloadLink.download = `QR_${item.name}.png`;
			downloadLink.href = pngFile;
			downloadLink.click();
			toast.success("QR 코드 이미지 저장 완료");
		};

		img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
	};

	const origin =
		typeof window !== "undefined" &&
		window.location.hostname !== "localhost" &&
		window.location.hostname !== "127.0.0.1"
			? window.location.origin
			: "https://wmshv2.vercel.app";
	const qrUrl = item ? `${origin}/items?action=${item.id}&quicklink=true` : "";

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="QR 코드 발급"
			subtitle={item?.name}
			icon={QrCode}
			maxWidth="max-w-xs"
		>
			<div className="text-center space-y-4">
				<div className="relative inline-block">
					<div
						ref={qrRef}
						className="relative bg-white p-5 rounded-2xl border border-white/20 shadow-2xl flex items-center justify-center mx-auto"
					>
						{item && (
							<QRCodeSVG
								value={qrUrl}
								size={180}
								level="H"
								includeMargin={false}
							/>
						)}
					</div>
				</div>

				<div className="space-y-1">
					<p className="text-xs font-mono font-bold text-[#0f172a] dark:text-white truncate max-w-[220px] mx-auto">
						{item?.name}
					</p>
					{item?.code && (
						<p className="text-[10px] font-mono text-[#64748b] dark:text-[#71717a]">
							ID: {item.code}
						</p>
					)}
				</div>

				<div className="flex gap-2.5 pt-1">
					<button
						type="button"
						onClick={onClose}
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
	);
}
