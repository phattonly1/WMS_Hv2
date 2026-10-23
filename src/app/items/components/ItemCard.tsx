"use client";

import { Package, PenLine, PlusCircle, QrCode } from "lucide-react";
import Image from "next/image";
import type { Supply } from "../types";

interface ItemCardProps {
	item: Supply;
	viewMode: "list" | "photo";
	onEdit: (item: Supply) => void;
	onAction: (item: Supply) => void;
	onQR: (item: Supply) => void;
	onZoom: (url: string) => void;
}

export default function ItemCard({
	item,
	viewMode,
	onEdit,
	onAction,
	onQR,
	onZoom,
}: ItemCardProps) {
	if (viewMode === "list") {
		return (
			<div className="rounded-2xl p-3 flex flex-col gap-2 group bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-blue-500/40 transition-all duration-200">
				<div className="flex gap-3 items-center">
					{/* 이미지/아이콘 */}
					<button
						type="button"
						aria-label={`${item.name} 이미지 확대보기`}
						className="w-10 h-10 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer p-0"
						onClick={() => item.image_url && onZoom(item.image_url)}
					>
						{item.image_url ? (
							<Image
								src={item.image_url}
								alt={item.name}
								width={40}
								height={40}
								className="w-full h-full object-cover"
							/>
						) : (
							<Package className="text-[#64748b] dark:text-[#a1a1aa] w-5 h-5" />
						)}
					</button>

					{/* 텍스트 정보 */}
					<div className="flex-1 min-w-0">
						<h3 className="font-bold text-[#0f172a] dark:text-white text-[15px] leading-snug truncate tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors break-keep">
							{item.name}
						</h3>
						<div className="flex items-center gap-1.5 mt-1 w-full overflow-hidden">
							{item.manufacturer && (
								<span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-[#64748b] dark:text-[#a1a1aa] font-semibold whitespace-nowrap shrink-0 border border-[#e2e8f0] dark:border-white/10 uppercase tracking-tight">
									{item.manufacturer}
								</span>
							)}
							<span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold whitespace-nowrap shrink-0 border border-blue-500/20 uppercase tracking-tight">
								{item.device || "미분류"}
							</span>
						</div>
					</div>

					{/* 재고 수량 */}
					<div className="flex flex-col items-end shrink-0">
						<span
							className={`px-3 py-1 rounded-lg font-mono font-bold text-sm transition-all ${
								item.quantity < 10
									? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs"
									: "bg-black/5 dark:bg-white/5 text-[#0f172a] dark:text-white border border-[#e2e8f0] dark:border-white/10"
							}`}
						>
							{item.quantity}
						</span>
					</div>
				</div>

				{/* 하단 액션 버튼들 */}
				<div className="flex gap-2 pt-2.5 mt-0.5 border-t border-[#e2e8f0] dark:border-[#222228]">
					<button
						type="button"
						onClick={() => onEdit(item)}
						className="w-10 h-10 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-all border border-[#e2e8f0] dark:border-[#222228] shrink-0"
						title="정보 수정"
					>
						<PenLine size={16} />
					</button>
					<button
						type="button"
						onClick={() => onAction(item)}
						className="flex-1 h-10 rounded-xl bg-[#2563eb] hover:bg-blue-500 text-white text-xs font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-1.5 active:scale-95 whitespace-nowrap"
					>
						<PlusCircle size={14} /> 수량 관리
					</button>
					<button
						type="button"
						onClick={() => onQR(item)}
						className="w-10 h-10 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-all border border-[#e2e8f0] dark:border-[#222228] shrink-0"
						title="QR 코드 보기"
					>
						<QrCode size={16} />
					</button>
				</div>
			</div>
		);
	}

	// Photo View
	return (
		<div className="rounded-2xl overflow-hidden group bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-blue-500/40 transition-all duration-200">
			{/* 사진 영역 */}
			<button
				type="button"
				aria-label={`${item.name} 이미지 확대보기`}
				className="w-full aspect-square bg-[#f1f5f9] dark:bg-[#16161c] flex items-center justify-center cursor-pointer relative overflow-hidden p-0 border-0"
				onClick={() => item.image_url && onZoom(item.image_url)}
			>
				{item.image_url ? (
					<Image
						src={item.image_url}
						alt={item.name}
						fill
						sizes="(max-width: 768px) 50vw, 220px"
						className="object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				) : (
					<Package className="text-[#64748b] dark:text-[#a1a1aa] w-14 h-14" />
				)}
				{/* 재고 배지 */}
				<span
					className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-mono font-bold shadow-md ${
						item.quantity < 10
							? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30"
							: "bg-white/90 dark:bg-[#111115]/90 text-[#0f172a] dark:text-white border border-[#e2e8f0] dark:border-white/20"
					}`}
				>
					{item.quantity}
				</span>
			</button>

			{/* 하단 정보 + 버튼 */}
			<div className="p-4 flex flex-col gap-2">
				<h3 className="font-bold text-[#0f172a] dark:text-white text-sm truncate tracking-tight break-keep">
					{item.name}
				</h3>
				<div className="flex items-center gap-1.5 w-full overflow-hidden">
					{item.manufacturer && (
						<span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-[#64748b] dark:text-[#a1a1aa] font-semibold whitespace-nowrap shrink-0 border border-[#e2e8f0] dark:border-white/10 uppercase tracking-tight">
							{item.manufacturer}
						</span>
					)}
					<span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold whitespace-nowrap shrink-0 border border-blue-500/20 uppercase tracking-tight">
						{item.device || "미분류"}
					</span>
				</div>
				<button
					type="button"
					onClick={() => onAction(item)}
					className="w-full h-10 mt-2 rounded-xl bg-[#2563eb] hover:bg-blue-500 text-white text-xs font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
				>
					<PlusCircle size={14} /> 수량 관리
				</button>
			</div>
		</div>
	);
}
