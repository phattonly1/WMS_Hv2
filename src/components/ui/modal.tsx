import { ChevronLeft, type LucideIcon, X } from "lucide-react";
import type React from "react";
import { useEffect } from "react";
import { motion, useDragControls } from "framer-motion";

export interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string | undefined;
	subtitle?: string | undefined;
	icon?: LucideIcon | undefined;
	children: React.ReactNode;
	maxWidth?: string | undefined; // e.g., 'max-w-4xl'
	headerAction?: React.ReactNode | undefined;
	onBack?: (() => void) | undefined;
	contentClassName?: string | undefined;
	hideHeader?: boolean | undefined;
	containerClassName?: string | undefined;
	sheetClassName?: string | undefined;
	preventBodyLock?: boolean | undefined;
}

/**
 * Nordic M3 다크 테마 기반 전역 모달 컴포넌트
 * - 전역 표준 규격: 데스크톱 max-w-xl / 모바일 80dvh 플로팅 시트
 * - 모바일 하단 안전영역 + 하단 내비바 상단 안착 규격
 * - 모바일 하향 드래그/스와이프 제스처 닫기 지원
 * - 배경 딤: 40% 반투명 + 2px 블러 (지도/배경 투과 일원화)
 */
export function Modal({
	isOpen,
	onClose,
	title,
	subtitle,
	icon: Icon,
	children,
	maxWidth = "max-w-xl",
	headerAction,
	onBack,
	contentClassName = "",
	hideHeader = false,
	containerClassName = "z-[1000] px-3.5 pb-[calc(env(safe-area-inset-bottom)+70px)] sm:p-4 md:p-6",
	sheetClassName = "max-h-[80dvh] sm:max-h-[85vh] rounded-3xl",
	preventBodyLock = false,
}: ModalProps) {
	const dragControls = useDragControls();

	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		if (isOpen) window.addEventListener("keydown", handleEsc);
		return () => window.removeEventListener("keydown", handleEsc);
	}, [isOpen, onClose]);

	useEffect(() => {
		if (preventBodyLock) return;
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen, preventBodyLock]);

	if (!isOpen) return null;

	return (
		<div
			role="dialog"
			aria-modal="true"
			className={`fixed inset-0 flex items-end sm:items-center justify-center overflow-hidden ${containerClassName}`}
		>
			<div
				className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity pointer-events-auto"
				onClick={onClose}
				aria-hidden="true"
			/>

			<motion.div
				drag="y"
				dragControls={dragControls}
				dragListener={false}
				dragConstraints={{ top: 0 }}
				dragElastic={{ top: 0, bottom: 0.5 }}
				onDragEnd={(_e, info) => {
					if (info.offset.y > 70 || info.velocity.y > 350) {
						onClose();
					}
				}}
				initial={{ y: 60, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				exit={{ y: 60, opacity: 0 }}
				transition={{ type: "spring", damping: 28, stiffness: 320 }}
				className={`relative w-full ${maxWidth} flex flex-col z-10 bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] shadow-2xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_50px_rgba(0,0,0,0.7)] text-[#0f172a] dark:text-[#f4f4f5] overflow-hidden transition-colors ${sheetClassName}`}
			>
				{/* 모바일 상단 드래그 핸들 (터치로 쓸어내려 닫기) */}
				<div
					onPointerDown={(e) => dragControls.start(e)}
					onClick={onClose}
					className="w-full pt-3 pb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing sm:hidden select-none"
					aria-hidden="true"
				>
					<div className="w-10 h-1.5 rounded-full bg-black/20 dark:bg-white/20 hover:bg-black/30 dark:hover:bg-white/30 transition-colors" />
				</div>

				{!hideHeader && (
					<div
						onPointerDown={(e) => {
							// 버튼 등 상호작용 요소 클릭이 아닐 때 헤더 드래그 허용
							if ((e.target as HTMLElement).closest("button")) return;
							dragControls.start(e);
						}}
						className="relative px-4 sm:px-6 py-3 flex items-center justify-between border-b border-[#e2e8f0] dark:border-[#222228] shrink-0 min-h-[52px] select-none"
					>
						<div className="flex items-center gap-2.5 min-w-0 pr-2">
							{onBack && (
								<button
									type="button"
									onClick={onBack}
									className="w-8 h-8 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/10 border border-[#e2e8f0] dark:border-[#222228] flex items-center justify-center text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-all active:scale-95 shrink-0"
								>
									<ChevronLeft size={16} />
								</button>
							)}
							{Icon && (
								<div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
									<Icon size={16} strokeWidth={2.4} />
								</div>
							)}
							<div className="min-w-0">
								{title && (
									<h2 className="text-sm sm:text-base font-bold tracking-tight text-[#0f172a] dark:text-white truncate break-keep">
										{title}
									</h2>
								)}
								{subtitle && (
									<p className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] tracking-tight truncate mt-0.5">
										{subtitle}
									</p>
								)}
							</div>
						</div>

						<div className="flex items-center gap-2 shrink-0">
							{headerAction}
							<button
								type="button"
								onClick={onClose}
								aria-label="닫기"
								className="w-8 h-8 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/10 border border-[#e2e8f0] dark:border-[#222228] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white flex items-center justify-center active:scale-95 transition-all"
							>
								<X size={16} strokeWidth={2.5} />
							</button>
						</div>
					</div>
				)}

				<div
					className={`flex-1 flex flex-col overflow-y-auto overscroll-contain p-4 sm:p-6 min-h-0 ${contentClassName}`}
				>
					{children}
				</div>
			</motion.div>
		</div>
	);
}
