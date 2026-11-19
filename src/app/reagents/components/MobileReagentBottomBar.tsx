"use client";

import { Calendar } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import {
	formatSheetShortTitle,
	getDeadlineDDay,
	PEOPLE_LIST,
	PERSON_GREEN_ROWS,
	type ReagentOrderSheet,
} from "../constants";

interface MobileReagentBottomBarProps {
	currentSheet: ReagentOrderSheet | null;
	sheets: ReagentOrderSheet[];
	onSelectSheetId: (sheetId: string) => void;
}

export default function MobileReagentBottomBar({
	currentSheet,
	sheets,
	onSelectSheetId,
}: MobileReagentBottomBarProps) {
	const [showSheetModal, setShowSheetModal] = useState(false);

	const getDeliveryStatus = (dateStr?: string) => {
		const res = getDeadlineDDay(dateStr);
		if (!res) return null;
		if (res.text === "마감") {
			return {
				text: "완료",
				badgeClass:
					"bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
			};
		}
		return res;
	};

	const getCompletedCount = (sheet: ReagentOrderSheet | null) => {
		if (!sheet) return 0;
		return PEOPLE_LIST.filter((person) => {
			if (sheet.cells.__no_order__?.[person] === "1") return true;
			return PERSON_GREEN_ROWS[person].some((rowId) =>
				Boolean(sheet.cells[rowId]?.[person]),
			);
		}).length;
	};

	const currentCompleted = getCompletedCount(currentSheet);
	const currentDeadlineDDay = getDeadlineDDay(currentSheet?.deadline);
	const currentDeliveryDDay = getDeliveryStatus(currentSheet?.deliveryDate);

	return (
		<>
			{/* 모바일 하단 고정 도킹 바: [회차/납기일 통합] */}
			<div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111115]/95 backdrop-blur-md border-t border-[#d7dfe9] dark:border-[#2a2a32] px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)] flex items-center justify-between gap-2">
				<button
					type="button"
					onClick={() => setShowSheetModal(true)}
					className="w-full min-w-0 h-11 px-3 rounded-xl bg-[#f8fafc] dark:bg-[#16161c] border border-[#d7dfe9] dark:border-[#2a2a32] flex items-center justify-between gap-2 text-xs cursor-pointer active:scale-[0.99] transition-all"
				>
					<div className="flex items-center gap-1.5 min-w-0 truncate">
						<span className="text-sm font-black tabular-nums text-[#0f172a] dark:text-white truncate">
							{currentSheet
								? `${formatSheetShortTitle(currentSheet.title)} 주문`
								: "회차 선택"}
						</span>
						{currentSheet && (
							<span
								className={`text-[11px] font-bold tabular-nums shrink-0 ${
									currentCompleted === PEOPLE_LIST.length
										? "text-emerald-600 dark:text-emerald-400"
										: "text-[#64748b] dark:text-[#a1a1aa]"
								}`}
							>
								{currentCompleted}/{PEOPLE_LIST.length}
							</span>
						)}
					</div>
					<div className="flex items-center gap-2 text-[11px] tabular-nums shrink-0 whitespace-nowrap">
						{currentSheet && currentSheet.deadline !== "-" && (
							<span className="inline-flex items-center gap-1 text-amber-600 dark:text-[#f59e0b] font-semibold">
								<span>마감 {currentSheet.deadline}</span>
								{currentDeadlineDDay && (
									<span
										className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border leading-none ${currentDeadlineDDay.badgeClass}`}
									>
										{currentDeadlineDDay.text}
									</span>
								)}
							</span>
						)}
						{currentSheet && (
							<span className="inline-flex items-center gap-1 text-emerald-600 dark:text-[#10b981] font-bold">
								<span>납품 {currentSheet.deliveryDate}</span>
								{currentDeliveryDDay && (
									<span
										className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border leading-none ${currentDeliveryDDay.badgeClass}`}
									>
										{currentDeliveryDDay.text}
									</span>
								)}
							</span>
						)}
					</div>
				</button>
			</div>

			{/* 모바일 하단바 회차 선택 모달 (전역 표준 Modal 적용) */}
			<Modal
				isOpen={showSheetModal}
				onClose={() => setShowSheetModal(false)}
				title="주문 회차 선택"
				icon={Calendar}
				size="half"
			>
				<div className="flex flex-col gap-1.5 pb-2">
					{sheets
						.slice()
						.reverse()
						.map((s) => {
							const isSelected = currentSheet?.id === s.id;
							const completed = getCompletedCount(s);
							const deadlineDDay = getDeadlineDDay(s.deadline);
							const deliveryDDay = getDeliveryStatus(s.deliveryDate);
							return (
								<button
									key={s.id}
									type="button"
									onClick={() => {
										onSelectSheetId(s.id);
										setShowSheetModal(false);
									}}
									className={`w-full min-h-[48px] py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
										isSelected
											? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
											: "bg-[#f8fafc] dark:bg-[#16161c] text-[#0f172a] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-[#d7dfe9] dark:border-[#2a2a32]"
									}`}
								>
									<div className="flex items-center gap-1.5 min-w-0">
										<span
											className={`font-black text-sm tabular-nums truncate ${
												isSelected
													? "text-blue-600 dark:text-blue-400"
													: "text-[#0f172a] dark:text-white"
											}`}
										>
											{formatSheetShortTitle(s.title)} 주문
										</span>
										<span
											className={`text-[11px] font-bold tabular-nums shrink-0 ${
												completed === PEOPLE_LIST.length
													? "text-emerald-600 dark:text-emerald-400"
													: "text-[#64748b] dark:text-[#a1a1aa]"
											}`}
										>
											{completed}/{PEOPLE_LIST.length}
										</span>
									</div>
									<div className="flex items-center gap-2 text-[11px] tabular-nums shrink-0 ml-2 whitespace-nowrap">
										{s.deadline !== "-" && (
											<span className="inline-flex items-center gap-1 text-amber-600 dark:text-[#f59e0b] font-semibold">
												<span>마감 {s.deadline}</span>
												{deadlineDDay && (
													<span
														className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border leading-none ${deadlineDDay.badgeClass}`}
													>
														{deadlineDDay.text}
													</span>
												)}
											</span>
										)}
										<span className="inline-flex items-center gap-1 text-emerald-600 dark:text-[#10b981] font-bold">
											<span>납품 {s.deliveryDate}</span>
											{deliveryDDay && (
												<span
													className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border leading-none ${deliveryDDay.badgeClass}`}
												>
													{deliveryDDay.text}
												</span>
											)}
										</span>
									</div>
								</button>
							);
						})}
				</div>
			</Modal>
		</>
	);
}
