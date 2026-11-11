"use client";

import { Calendar } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface ReagentSheetMetaModalProps {
	isOpen: boolean;
	onClose: () => void;
	editingSheetId: string | undefined;
	sheetTitle: string;
	setSheetTitle: (title: string) => void;
	sheetDeadline: string;
	setSheetDeadline: (deadline: string) => void;
	sheetDelivery: string;
	setSheetDelivery: (delivery: string) => void;
	onSave: () => Promise<void>;
	savingSheet: boolean;
}

export default function ReagentSheetMetaModal({
	isOpen,
	onClose,
	editingSheetId,
	sheetTitle,
	setSheetTitle,
	sheetDeadline,
	setSheetDeadline,
	sheetDelivery,
	setSheetDelivery,
	onSave,
	savingSheet,
}: ReagentSheetMetaModalProps) {
	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={editingSheetId ? "회차 정보 수정" : "새 시약 주문 회차 생성"}
			subtitle="주문 마감일 및 예상 납기일 설정"
			icon={Calendar}
		>
			<div className="space-y-4">
				<div className="space-y-1.5">
					<label
						htmlFor="sheet-title"
						className="text-xs font-bold text-[#0f172a] dark:text-white block"
					>
						회차 제목
					</label>
					<input
						id="sheet-title"
						type="text"
						value={sheetTitle}
						onChange={(e) => setSheetTitle(e.target.value)}
						placeholder="예: 10차 시약 주문 (11월 분)"
						className="w-full h-11 px-3 rounded-xl bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-xs text-[#0f172a] dark:text-white outline-none focus:border-[#2563eb]"
					/>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<label
							htmlFor="sheet-deadline"
							className="text-xs font-bold text-[#0f172a] dark:text-white block"
						>
							주문 마감일
						</label>
						<input
							id="sheet-deadline"
							type="text"
							value={sheetDeadline}
							onChange={(e) => setSheetDeadline(e.target.value)}
							placeholder="예: 11/20"
							className="w-full h-11 px-3 rounded-xl bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-xs font-mono text-[#0f172a] dark:text-white outline-none focus:border-[#2563eb]"
						/>
					</div>
					<div className="space-y-1.5">
						<label
							htmlFor="sheet-delivery"
							className="text-xs font-bold text-[#0f172a] dark:text-white block"
						>
							예상 납기일
						</label>
						<input
							id="sheet-delivery"
							type="text"
							value={sheetDelivery}
							onChange={(e) => setSheetDelivery(e.target.value)}
							placeholder="예: 11/27"
							className="w-full h-11 px-3 rounded-xl bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-xs font-mono text-[#0f172a] dark:text-white outline-none focus:border-[#2563eb]"
						/>
					</div>
				</div>

				<div className="flex items-center gap-2 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 h-12 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-[#64748b] dark:text-[#a1a1aa] font-bold text-xs cursor-pointer"
					>
						취소
					</button>
					<button
						type="button"
						onClick={onSave}
						disabled={savingSheet}
						className="flex-[2] h-12 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs cursor-pointer disabled:opacity-50"
					>
						{savingSheet
							? "저장 중..."
							: editingSheetId
								? "수정 완료"
								: "새 회차 생성"}
					</button>
				</div>
			</div>
		</Modal>
	);
}
