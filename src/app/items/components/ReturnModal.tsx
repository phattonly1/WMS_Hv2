"use client";

import { Minus, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import type { Log } from "../types";

interface ReturnModalProps {
	isOpen: boolean;
	onClose: () => void;
	log: Log | null;
	onAdjust: (
		logId: string,
		supplyId: string,
		supplyName: string,
		newOutQty: number,
		userName: string,
		note: string,
	) => Promise<void>;
}

export default function ReturnModal({
	isOpen,
	onClose,
	log,
	onAdjust,
}: ReturnModalProps) {
	const [currentOutQty, setCurrentOutQty] = useState(1);
	const [userName, setUserName] = useState("");
	const [note, setNote] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const originalQty = log?.quantity || 0;
	const returnedQty = log?.returned_qty || 0;
	const initialOutQty = originalQty - returnedQty;

	useEffect(() => {
		if (isOpen && log) {
			setCurrentOutQty(initialOutQty);
			setUserName(log.user_name || "");
			setNote("");
		}
	}, [isOpen, log, initialOutQty]);

	const handleSubmit = async () => {
		if (!log) return;
		if (!userName.trim()) {
			toast.error("수정자 이름을 입력해주세요.");
			return;
		}

		const diff = currentOutQty - initialOutQty;
		if (diff === 0) {
			toast.info("변경 사항이 없습니다.");
			onClose();
			return;
		}

		setIsSubmitting(true);
		try {
			await onAdjust(
				log.id,
				log.supply_id,
				log.supply_name,
				currentOutQty,
				userName.trim(),
				note.trim(),
			);
			if (diff < 0) {
				toast.success(`${log.supply_name} ${Math.abs(diff)}개 반납 완료!`);
			} else {
				toast.success(`${log.supply_name} ${diff}개 반납 취소!`);
			}
			onClose();
		} catch {
			toast.error("반납/수량조절 처리에 실패했습니다.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!log) return null;

	const diff = currentOutQty - initialOutQty;
	const isReturning = diff < 0;
	const isTakingBack = diff > 0;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="불출 수량 반납 및 조절"
			subtitle={log.supply_name}
			icon={RefreshCw}
			maxWidth="max-w-md"
		>
			<div className="space-y-4">
				{/* 상태 인디케이터 배너 */}
				<div
					className={`px-3.5 py-2.5 rounded-xl flex items-center justify-between border text-xs font-semibold ${
						isReturning
							? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
							: isTakingBack
								? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
								: "bg-[#f1f5f9] dark:bg-[#16161c] border-[#e2e8f0] dark:border-[#222228] text-[#64748b] dark:text-[#a1a1aa]"
					}`}
				>
					<div className="flex items-center gap-1.5 font-mono">
						<RefreshCw
							size={13}
							className={isSubmitting ? "animate-spin" : ""}
						/>
						{isReturning
							? "수량 반납 진행 중"
							: isTakingBack
								? "반납 취소(추가 불출)"
								: "수량 유지"}
					</div>
					<div className="text-[11px] font-mono text-[#64748b] dark:text-[#a1a1aa]">
						불출일: {new Date(log.created_at).toLocaleDateString("ko-KR")}
					</div>
				</div>

				{/* 원래 수량 / 현재 반납된 수량 */}
				<div className="grid grid-cols-2 gap-3">
					<div className="p-3.5 rounded-xl bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228]">
						<p className="text-[10px] font-mono uppercase text-[#64748b] dark:text-[#a1a1aa] mb-1">
							원 불출 수량
						</p>
						<p className="text-xl font-mono font-bold text-[#0f172a] dark:text-white">
							{originalQty}개
						</p>
					</div>
					<div className="p-3.5 rounded-xl bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228]">
						<p className="text-[10px] font-mono uppercase text-[#64748b] dark:text-[#a1a1aa] mb-1">
							현재 반납 완료
						</p>
						<p className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
							{returnedQty}개
						</p>
					</div>
				</div>

				{/* 사용 중 수량 조절 인터페이스 */}
				<div className="bg-[#f8fafc] dark:bg-[#16161c] p-4 rounded-2xl border border-[#e2e8f0] dark:border-[#222228] space-y-3">
					<p className="text-center text-[11px] font-mono uppercase tracking-widest text-[#64748b] dark:text-[#a1a1aa]">
						현재 사용 중 수량 조절
					</p>
					<div className="flex items-center justify-center gap-5">
						<button
							type="button"
							onClick={() => setCurrentOutQty((prev) => Math.max(0, prev - 1))}
							className="w-12 h-12 bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] rounded-xl flex items-center justify-center text-[#334155] dark:text-[#d4d4d8] hover:text-[#0f172a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
							aria-label="사용 중 수량 감소 (반납)"
						>
							<Minus size={20} />
						</button>
						<div className="text-center min-w-[90px]">
							<div
								className={`text-4xl font-mono font-black tracking-tight ${
									isReturning
										? "text-emerald-600 dark:text-emerald-400"
										: isTakingBack
											? "text-amber-600 dark:text-amber-400"
											: "text-[#0f172a] dark:text-white"
								}`}
							>
								{currentOutQty}
							</div>
							<p className="text-[10px] font-mono uppercase text-[#64748b] dark:text-[#71717a] mt-0.5">
								In Use
							</p>
						</div>
						<button
							type="button"
							onClick={() =>
								setCurrentOutQty((prev) => Math.min(originalQty, prev + 1))
							}
							className="w-12 h-12 bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] rounded-xl flex items-center justify-center text-[#334155] dark:text-[#d4d4d8] hover:text-[#0f172a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
							aria-label="사용 중 수량 증가"
						>
							<Plus size={20} />
						</button>
					</div>
				</div>

				{/* 수정자 & 사유 */}
				<div className="space-y-3">
					<div className="space-y-1.5">
						<label
							htmlFor="return-user"
							className="text-[11px] font-mono uppercase tracking-wider text-[#64748b] dark:text-[#a1a1aa] ml-1 block"
						>
							수정자 이름 <span className="text-rose-500 dark:text-rose-400">*</span>
						</label>
						<input
							id="return-user"
							type="text"
							placeholder="이름을 입력하세요"
							value={userName}
							onChange={(e) => setUserName(e.target.value)}
							className="w-full bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] rounded-xl h-11 px-3.5 text-center font-bold text-[#0f172a] dark:text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all placeholder:text-[#94a3b8] dark:placeholder:text-[#52525b]"
						/>
					</div>
					<div className="space-y-1.5">
						<label
							htmlFor="return-note"
							className="text-[11px] font-mono uppercase tracking-wider text-[#64748b] dark:text-[#a1a1aa] ml-1 block"
						>
							수정 사유
						</label>
						<input
							id="return-note"
							type="text"
							placeholder="반납 사유 또는 특이사항 (선택)"
							value={note}
							onChange={(e) => setNote(e.target.value)}
							className="w-full bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] rounded-xl h-11 px-3.5 text-center text-xs text-[#0f172a] dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all placeholder:text-[#94a3b8] dark:placeholder:text-[#52525b]"
						/>
					</div>
				</div>

				{/* 액션 버튼 */}
				<div className="flex gap-2.5 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 h-12 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/10 text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white font-bold text-sm transition-all border border-[#e2e8f0] dark:border-[#222228]"
					>
						취소
					</button>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={isSubmitting || diff === 0}
						className={`flex-[2] h-12 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-40 ${
							isReturning
								? "bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
								: isTakingBack
									? "bg-amber-600 hover:bg-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.3)]"
									: "bg-[#e2e8f0] dark:bg-[#27272a] text-[#64748b] dark:text-[#71717a]"
						}`}
					>
						{isSubmitting
							? "처리 중..."
							: diff === 0
								? "변경 없음"
								: isReturning
									? `${Math.abs(diff)}개 반납 확정`
									: `${diff}개 반납 취소`}
					</button>
				</div>
			</div>
		</Modal>
	);
}
