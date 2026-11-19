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
			title={isReq ? "입고" : "출고"}
			subtitle={selectedItem?.name}
			icon={isReq ? ShoppingCart : LogOut}
			maxWidth="max-w-sm"
			headerAction={
				<div className="flex items-center p-0.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px] font-bold">
					<button
						type="button"
						onClick={() => setActionType("OUT")}
						className={`px-2 py-0.5 rounded-md transition-colors ${
							!isReq
								? "bg-amber-600 text-white shadow-2xs"
								: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
						}`}
					>
						출고
					</button>
					<button
						type="button"
						onClick={() => setActionType("REQ")}
						className={`px-2 py-0.5 rounded-md transition-colors ${
							isReq
								? "bg-blue-600 text-white shadow-2xs"
								: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
						}`}
					>
						입고
					</button>
				</div>
			}
		>
			<div className="space-y-2.5">
				{/* 1. 올인원 인라인 스텝퍼 + 퀵 버튼 */}
				<div className="bg-[#f8fafc] dark:bg-[#16161c] p-2.5 rounded-2xl border border-[#d7dfe9] dark:border-[#2a2a32] flex items-center justify-between gap-2">
					{/* 수량 감소 / 표시 / 증가 */}
					<div className="flex items-center gap-1.5">
						<button
							type="button"
							onClick={() => setActionQty((prev) => Math.max(1, prev - 1))}
							className="w-8 h-8 bg-white dark:bg-[#111115] border border-[#d7dfe9] dark:border-[#2a2a32] rounded-lg flex items-center justify-center text-[#334155] dark:text-[#d4d4d8] hover:text-[#0f172a] dark:hover:text-white active:scale-95 transition-all shadow-2xs"
							aria-label="수량 감소"
						>
							<Minus size={14} />
						</button>
						<div className="min-w-[42px] text-center font-black tabular-nums text-xl text-[#0f172a] dark:text-white">
							{actionQty}
						</div>
						<button
							type="button"
							onClick={() => setActionQty((prev) => prev + 1)}
							className="w-8 h-8 bg-white dark:bg-[#111115] border border-[#d7dfe9] dark:border-[#2a2a32] rounded-lg flex items-center justify-center text-[#334155] dark:text-[#d4d4d8] hover:text-[#0f172a] dark:hover:text-white active:scale-95 transition-all shadow-2xs"
							aria-label="수량 증가"
						>
							<Plus size={14} />
						</button>
						<span className="text-[11px] font-bold text-[#64748b] dark:text-[#a1a1aa] ml-1">
							{selectedItem?.unit || "EA"}
						</span>
					</div>

					{/* 퀵 추가 칩 (+1, +5, +10) */}
					<div className="flex items-center gap-1">
						{[1, 5, 10].map((add) => (
							<button
								key={add}
								type="button"
								onClick={() => setActionQty((prev) => prev + add)}
								className="px-2 py-1 rounded-lg bg-white dark:bg-[#111115] border border-[#d7dfe9] dark:border-[#2a2a32] text-[11px] font-bold tabular-nums text-[#64748b] dark:text-[#a1a1aa] hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition-all shadow-2xs"
							>
								+{add}
							</button>
						))}
					</div>
				</div>

				{/* 3. 사용자 이름 & 사유 (2열 인라인 또는 컴팩트 그리드) */}
				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-1">
						<label
							htmlFor="action-user"
							className="text-[10px] font-semibold text-[#64748b] dark:text-[#a1a1aa] ml-0.5 block truncate"
						>
							담당자 <span className="text-rose-500 dark:text-rose-400">*</span>
						</label>
						<input
							id="action-user"
							name="action-user"
							placeholder="이름 입력"
							className="w-full bg-[#f8fafc] dark:bg-[#16161c] border border-[#d7dfe9] dark:border-[#2a2a32] rounded-xl h-9 px-2.5 text-center font-bold text-[#0f172a] dark:text-white text-xs focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-blue-500/50 transition-all placeholder:text-[#94a3b8] dark:placeholder:text-[#52525b]"
							value={actionUser}
							onChange={(e) => setActionUser(e.target.value)}
						/>
					</div>

					<div className="space-y-1">
						<label
							htmlFor="action-note"
							className="text-[10px] font-semibold text-[#64748b] dark:text-[#a1a1aa] ml-0.5 block truncate"
						>
							사유 / 목적
						</label>
						<input
							id="action-note"
							name="action-note"
							placeholder={isReq ? "입고 사유" : "사용 목적"}
							className="w-full bg-[#f8fafc] dark:bg-[#16161c] border border-[#d7dfe9] dark:border-[#2a2a32] rounded-xl h-9 px-2.5 text-center text-xs text-[#0f172a] dark:text-white focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-blue-500/50 transition-all placeholder:text-[#94a3b8] dark:placeholder:text-[#52525b]"
							value={actionNote}
							onChange={(e) => setActionNote(e.target.value)}
						/>
					</div>
				</div>

				{/* 4. 액션 버튼 */}
				<div className="flex gap-2 pt-1">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 h-10 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/10 text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white font-bold text-xs transition-all border border-[#d7dfe9] dark:border-[#2a2a32] active:scale-98"
					>
						취소
					</button>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={isSubmitting}
						className={`flex-[2] h-10 rounded-xl font-bold text-xs text-white transition-all active:scale-98 disabled:opacity-50 ${
							isReq
								? "bg-blue-600 hover:bg-blue-500 shadow-sm"
								: "bg-amber-600 hover:bg-amber-500 shadow-sm"
						}`}
					>
						{isSubmitting ? "처리 중..." : isReq ? "수량 채우기" : "불출 확인"}
					</button>
				</div>
			</div>
		</Modal>
	);
}
