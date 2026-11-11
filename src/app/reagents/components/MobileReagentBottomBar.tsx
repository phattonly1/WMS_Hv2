"use client";

import { Calendar } from "lucide-react";
import { useState } from "react";
import type { ReagentOrderSheet } from "@/actions/reagents";
import { Modal } from "@/components/ui/modal";
import { formatSheetShortTitle, getDeadlineDDay } from "../constants";

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

	const currentDDay = getDeadlineDDay(currentSheet?.deadline);

	return (
		<>
			{/* 모바일 하단 고정 도킹 바: [회차/납기일 통합] */}
			<div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111115]/95 backdrop-blur-md border-t border-[#e2e8f0] dark:border-[#222228] px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)] flex items-center justify-between gap-2">
				<button
					type="button"
					onClick={() => setShowSheetModal(true)}
					className="w-full min-w-0 h-11 px-3.5 rounded-xl bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] flex items-center justify-between gap-2 text-xs cursor-pointer active:scale-[0.99] transition-all"
				>
					<div className="flex items-center gap-1.5 min-w-0 truncate">
						<span className="px-2 py-0.5 rounded-lg bg-blue-500/15 border border-blue-500/30 font-mono font-bold text-xs text-[#2563eb] dark:text-[#60a5fa] shrink-0">
							{currentSheet
								? formatSheetShortTitle(currentSheet.title)
								: "선택"}
						</span>
						<span className="text-xs font-bold text-[#0f172a] dark:text-white truncate">
							주문
						</span>
						{currentDDay && (
							<span
								className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold border shrink-0 ${currentDDay.badgeClass}`}
							>
								{currentDDay.text}
							</span>
						)}
					</div>
					<div className="flex items-center gap-1.5 text-[10px] shrink-0 whitespace-nowrap">
						{currentSheet && currentSheet.deadline !== "-" && (
							<span className="text-amber-600 dark:text-[#fbbf24]">
								마감 <span className="font-mono">{currentSheet.deadline}</span>
							</span>
						)}
						{currentSheet && (
							<span className="text-emerald-600 dark:text-[#34d399] font-bold">
								납기{" "}
								<span className="font-mono">{currentSheet.deliveryDate}</span>
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
				subtitle="이전 주문 내역 및 현재 주문 회차"
				icon={Calendar}
				size="half"
			>
				<div className="flex flex-col gap-1.5 pb-2">
					{sheets
						.slice()
						.reverse()
						.map((s) => {
							const isSelected = currentSheet?.id === s.id;
							const dDay = getDeadlineDDay(s.deadline);
							return (
								<button
									key={s.id}
									type="button"
									onClick={() => {
										onSelectSheetId(s.id);
										setShowSheetModal(false);
									}}
									className={`w-full min-h-[48px] py-2 px-3.5 rounded-2xl text-xs font-bold flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
										isSelected
											? "bg-blue-500/15 text-[#2563eb] dark:text-[#60a5fa] border border-blue-500/30"
											: "bg-[#f8fafc] dark:bg-[#16161c] text-[#0f172a] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-[#e2e8f0] dark:border-[#222228]"
									}`}
								>
									<div className="flex items-center gap-2 min-w-0">
										<span
											className={`px-2 py-0.5 rounded-lg font-mono font-bold text-xs shrink-0 ${
												isSelected
													? "bg-[#2563eb] text-white"
													: "bg-black/5 dark:bg-white/10 text-[#0f172a] dark:text-white"
											}`}
										>
											{formatSheetShortTitle(s.title)}
										</span>
										<span className="font-bold text-xs text-[#0f172a] dark:text-white truncate">
											주문
										</span>
										{dDay && (
											<span
												className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold border shrink-0 ${dDay.badgeClass}`}
											>
												{dDay.text}
											</span>
										)}
									</div>
									<div className="flex items-center gap-2 text-[10px] shrink-0 ml-2 whitespace-nowrap">
										{s.deadline !== "-" && (
											<span className="text-amber-600 dark:text-[#fbbf24]">
												마감 <span className="font-mono">{s.deadline}</span>
											</span>
										)}
										<span className="text-emerald-600 dark:text-[#34d399] font-bold">
											납기 <span className="font-mono">{s.deliveryDate}</span>
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
