"use client";

import { LogOut, Minus, Plus, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import type { Supply } from "../types";

interface ActionModalProps {
	isOpen: boolean;
	onClose: () => void;
	selectedItem: Supply | null;
	onSubmit: (
		type: "REQ" | "OUT",
		qty: number,
		user: string,
		note: string,
	) => Promise<void>;
}

export default function ActionModal({
	isOpen,
	onClose,
	selectedItem,
	onSubmit,
}: ActionModalProps) {
	const [actionType, setActionType] = useState<"REQ" | "OUT">("OUT");
	const [actionQty, setActionQty] = useState(1);
	const [actionUser, setActionUser] = useState("");
	const [actionNote, setActionNote] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setActionQty(1);
			setActionUser("");
			setActionNote("");
		}
	}, [isOpen]);

	const handleSubmit = async () => {
		if (!actionUser.trim()) {
			toast.error("사용자 이름을 입력해주세요.");
			return;
		}
		if (actionQty <= 0) {
			toast.error("수량은 1개 이상이어야 합니다.");
			return;
		}

		setIsSubmitting(true);
		try {
			await onSubmit(
				actionType,
				actionQty,
				actionUser.trim(),
				actionNote.trim(),
			);
			const successMsg =
				actionType === "REQ" ? "수량 채우기 완료" : "불출 처리 완료";
			toast.success(successMsg);
			onClose();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "알 수 없는 오류";
			toast.error(`처리 실패: ${msg}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	const isReq = actionType === "REQ";

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={isReq ? "수량 채우기" : "불출 처리"}
			subtitle={selectedItem?.name}
			icon={isReq ? ShoppingCart : LogOut}
			maxWidth="max-w-sm"
		>
			<div className="space-y-4">
				{/* 탭 전환: 채우기(REQ) / 가져가기(OUT) */}
				<div className="grid grid-cols-2 p-1 bg-[#f1f5f9] dark:bg-[#16161c] rounded-2xl border border-[#e2e8f0] dark:border-[#222228]">
					<button
						type="button"
						onClick={() => setActionType("REQ")}
						className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
							isReq
								? "bg-blue-600 text-white shadow-sm"
								: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
						}`}
					>
						<ShoppingCart size={14} /> 채우기 (입고)
					</button>
					<button
						type="button"
						onClick={() => setActionType("OUT")}
						className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
							!isReq
								? "bg-amber-600 text-white shadow-sm"
								: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
						}`}
					>
						<LogOut size={14} /> 가져가기 (불출)
					</button>
				</div>

				{/* 수량 조절 카드 */}
				<div className="bg-[#f8fafc] dark:bg-[#16161c] p-4 rounded-2xl border border-[#e2e8f0] dark:border-[#222228] space-y-3">
					<p className="text-center text-[11px] font-mono uppercase tracking-widest text-[#64748b] dark:text-[#a1a1aa]">
						수량 조절
					</p>
					<div className="flex items-center justify-center gap-4">
						<button
							type="button"
							onClick={() => setActionQty((prev) => Math.max(1, prev - 1))}
							className="w-11 h-11 bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] rounded-xl flex items-center justify-center text-[#334155] dark:text-[#d4d4d8] hover:text-[#0f172a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
							aria-label="수량 감소"
						>
							<Minus size={18} />
						</button>
						<div className="text-3xl font-mono font-black text-[#0f172a] dark:text-white w-20 text-center tracking-tight">
							{actionQty}
						</div>
						<button
							type="button"
							onClick={() => setActionQty((prev) => prev + 1)}
							className="w-11 h-11 bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] rounded-xl flex items-center justify-center text-[#334155] dark:text-[#d4d4d8] hover:text-[#0f172a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
							aria-label="수량 증가"
						>
							<Plus size={18} />
						</button>
					</div>
					<div className="text-center">
						<span className="px-2.5 py-0.5 rounded-md bg-[#e2e8f0] dark:bg-[#222228] text-[10px] font-mono text-[#475569] dark:text-[#a1a1aa]">
							단위: {selectedItem?.unit || "EA"}
						</span>
					</div>
				</div>

				{/* 사용자 이름 & 비고 */}
				<div className="space-y-3">
					<div className="space-y-1.5">
						<label
							htmlFor="action-user"
							className="text-[11px] font-mono uppercase tracking-wider text-[#64748b] dark:text-[#a1a1aa] ml-1 block"
						>
							사용자 이름 <span className="text-rose-500 dark:text-rose-400">*</span>
						</label>
						<input
							id="action-user"
							name="action-user"
							placeholder="이름을 입력하세요"
							className="w-full bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] rounded-xl h-11 px-3.5 text-center font-bold text-[#0f172a] dark:text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all placeholder:text-[#94a3b8] dark:placeholder:text-[#52525b]"
							value={actionUser}
							onChange={(e) => setActionUser(e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<label
							htmlFor="action-note"
							className="text-[11px] font-mono uppercase tracking-wider text-[#64748b] dark:text-[#a1a1aa] ml-1 block"
						>
							특이사항 / 사유
						</label>
						<input
							id="action-note"
							name="action-note"
							placeholder={
								isReq ? "입고 / 구매 사유 등" : "사용 측정소 및 목적 등"
							}
							className="w-full bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] rounded-xl h-11 px-3.5 text-center text-xs text-[#0f172a] dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all placeholder:text-[#94a3b8] dark:placeholder:text-[#52525b]"
							value={actionNote}
							onChange={(e) => setActionNote(e.target.value)}
						/>
					</div>
				</div>

				{/* 버튼 */}
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
						disabled={isSubmitting}
						className={`flex-[2] h-12 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-50 ${
							isReq
								? "bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
								: "bg-amber-600 hover:bg-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.3)]"
						}`}
					>
						{isSubmitting ? "처리 중..." : isReq ? "수량 채우기" : "불출 확인"}
					</button>
				</div>
			</div>
		</Modal>
	);
}
