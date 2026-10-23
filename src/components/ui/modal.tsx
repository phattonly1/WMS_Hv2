import { ChevronLeft, type LucideIcon, X } from "lucide-react";
import type React from "react";
import { useEffect } from "react";

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
}

/**
 * Nordic M3 다크 테마 기반 전역 모달 컴포넌트
 */
export function Modal({
	isOpen,
	onClose,
	title,
	subtitle,
	icon: Icon,
	children,
	maxWidth = "max-w-2xl",
	headerAction,
	onBack,
	contentClassName = "",
	hideHeader = false,
}: ModalProps) {
	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		if (isOpen) window.addEventListener("keydown", handleEsc);
		return () => window.removeEventListener("keydown", handleEsc);
	}, [isOpen, onClose]);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div
			role="dialog"
			aria-modal="true"
			className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden"
		>
			<div
				className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
				onClick={onClose}
				aria-hidden="true"
			/>

			<div
				className={`relative w-full ${maxWidth} max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl flex flex-col z-10 bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] shadow-2xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_50px_rgba(0,0,0,0.7)] text-[#0f172a] dark:text-[#f4f4f5] overflow-hidden transition-colors`}
			>
				<div
					onClick={onClose}
					className="w-full pt-3 pb-1 flex flex-col items-center justify-center cursor-pointer sm:hidden select-none"
					aria-hidden="true"
				>
					<div className="w-10 h-1 rounded-full bg-black/20 dark:bg-white/20 hover:bg-black/30 dark:hover:bg-white/30 transition-colors" />
				</div>

				{!hideHeader && (
					<div className="relative px-4 sm:px-6 py-3 flex items-center justify-between border-b border-[#e2e8f0] dark:border-[#222228] shrink-0 min-h-[52px]">
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
			</div>
		</div>
	);
}
