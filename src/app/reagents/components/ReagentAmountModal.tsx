"use client";

import { FlaskConical, Plus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReagentPerson, ReagentRowSpec } from "@/actions/reagents";
import { Modal } from "@/components/ui/modal";
import {
	parseCellExpression,
	serializeBuckets,
	VOLUME_OPTIONS,
} from "../constants";

interface ReagentAmountModalProps {
	editingTarget: {
		row: ReagentRowSpec;
		person: ReagentPerson;
		rawVal: string;
	} | null;
	onClose: () => void;
	onSave: (
		row: ReagentRowSpec,
		person: ReagentPerson,
		nextValue: string,
		totalL: number,
	) => Promise<void>;
	savingCell: boolean;
}

export default function ReagentAmountModal({
	editingTarget,
	onClose,
	onSave,
	savingCell,
}: ReagentAmountModalProps) {
	const [editBuckets, setEditBuckets] = useState<Record<number, number>>({
		1: 0,
		2: 0,
		5: 0,
		10: 0,
	});
	const [inputMode, setInputMode] = useState<"buckets" | "single">("buckets");
	const [editSingleTotal, setEditSingleTotal] = useState<number>(0);

	useEffect(() => {
		if (!editingTarget) return;
		const { row, rawVal } = editingTarget;
		const parsed = parseCellExpression(rawVal, row.defaultVolume);
		setEditBuckets({
			1: parsed.buckets[1] || 0,
			2: parsed.buckets[2] || 0,
			5: parsed.buckets[5] || 0,
			10: parsed.buckets[10] || 0,
		});
		setEditSingleTotal(parsed.total);
		setInputMode(row.id.startsWith("etc-std-") ? "single" : "buckets");
	}, [editingTarget]);

	const handleAddBucket = (vol: number) => {
		setEditBuckets((prev) => ({
			...prev,
			[vol]: (prev[vol] || 0) + 1,
		}));
	};

	const handleResetBuckets = () => {
		setEditBuckets({ 1: 0, 2: 0, 5: 0, 10: 0 });
		setEditSingleTotal(0);
	};

	const modalPreview = useMemo(() => {
		if (inputMode === "single") {
			const total = Number(editSingleTotal.toFixed(2));
			return {
				total,
				breakdownText: total > 0 ? `${total}` : "",
				serialized: total > 0 ? String(total) : "",
			};
		}
		const serialized = serializeBuckets(editBuckets);
		const parsed = parseCellExpression(
			serialized,
			editingTarget?.row.defaultVolume ?? 5,
		);
		return {
			total: parsed.total,
			breakdownText: parsed.breakdownText,
			serialized,
		};
	}, [editBuckets, editSingleTotal, editingTarget, inputMode]);

	return (
		<Modal
			isOpen={Boolean(editingTarget)}
			onClose={onClose}
			title={
				editingTarget
					? `${editingTarget.person} · ${editingTarget.row.reagentName || editingTarget.row.device}`
					: "시약 수량 입력"
			}
			subtitle={
				editingTarget
					? `${editingTarget.row.category} · ${editingTarget.row.device}${editingTarget.row.company ? ` (${editingTarget.row.company})` : ""}`
					: ""
			}
			icon={FlaskConical}
		>
			{editingTarget && (
				<div className="space-y-3">
					{inputMode === "buckets" ? (
						<>
							{/* 상단: 1L, 2L, 5L, 10L 카드 4개 1행 가로 배치 (예시 1: 수직 2행 중심형) */}
							<div className="grid grid-cols-4 gap-2">
								{VOLUME_OPTIONS.map((vol) => {
									const count = editBuckets[vol] || 0;
									const isActive = count > 0;
									return (
										<button
											key={vol}
											type="button"
											onClick={() => handleAddBucket(vol)}
											className={`h-[72px] px-2 py-2.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
												isActive
													? "bg-blue-500/10 border-blue-500/30 shadow-2xs"
													: "bg-[#f8fafc] dark:bg-[#16161c] border-[#e2e8f0] dark:border-[#222228] hover:bg-black/5 dark:hover:bg-white/5"
											}`}
										>
											<span
												className={`text-base font-mono font-bold leading-none ${
													isActive
														? "text-[#2563eb] dark:text-[#60a5fa]"
														: "text-[#0f172a] dark:text-white"
												}`}
											>
												{vol}L
											</span>

											<span
												className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold leading-tight transition-colors ${
													isActive
														? "bg-[#2563eb] text-white shadow-2xs"
														: "bg-black/5 dark:bg-white/5 text-[#94a3b8] dark:text-[#71717a]"
												}`}
											>
												{count}개
											</span>
										</button>
									);
								})}
							</div>

							{/* 하단 1: 입력 구성 내용 (예시 C: 1줄 칩/뱃지형 압축) */}
							<div className="h-11 px-3.5 rounded-2xl bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] flex items-center justify-between text-xs font-bold">
								<div className="flex items-center gap-2 min-w-0">
									<span className="px-2 py-0.5 rounded-lg bg-blue-500/15 text-[#2563eb] dark:text-[#60a5fa] font-mono text-xs shrink-0">
										총 {modalPreview.total}L
									</span>
									<span className="text-[#64748b] dark:text-[#a1a1aa] shrink-0">
										·
									</span>
									<span className="truncate text-[#0f172a] dark:text-white">
										{modalPreview.total > 0 ? (
											<span className="font-mono text-xs">
												{modalPreview.breakdownText}
											</span>
										) : (
											<span className="text-[#94a3b8] dark:text-[#71717a] font-normal">
												카드를 눌러 추가
											</span>
										)}
									</span>
								</div>
							</div>
						</>
					) : (
						<div className="p-3 rounded-2xl bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] space-y-2.5">
							<div className="flex items-center justify-between">
								<span className="text-xs font-bold text-[#0f172a] dark:text-white">
									단일 수량 입력 (표준용액 등)
								</span>
								<span className="text-xs font-mono text-[#64748b] dark:text-[#a1a1aa]">
									숫자만 표기
								</span>
							</div>
							<div className="flex items-center gap-2">
								<input
									type="number"
									inputMode="decimal"
									min={0}
									value={editSingleTotal}
									onFocus={(e) => e.target.select()}
									onChange={(e) =>
										setEditSingleTotal(Math.max(0, Number(e.target.value)))
									}
									className="flex-1 h-11 rounded-xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] text-center font-mono text-xs font-bold text-[#0f172a] dark:text-white outline-none focus:border-[#2563eb]"
								/>
								<button
									type="button"
									onClick={() => setEditSingleTotal((prev) => prev + 1)}
									className="h-11 px-4 rounded-xl bg-[#2563eb] text-white flex items-center justify-center gap-1 font-bold text-xs cursor-pointer shrink-0"
								>
									<Plus size={16} />
									<span>추가</span>
								</button>
							</div>
							<div className="grid grid-cols-5 gap-1.5">
								{[5, 10, 15, 17, 23].map((n) => (
									<button
										key={n}
										type="button"
										onClick={() => setEditSingleTotal(n)}
										className="h-9 rounded-xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] font-mono text-xs font-bold text-[#64748b] dark:text-[#a1a1aa] hover:text-[#2563eb] cursor-pointer"
									>
										{n}
									</button>
								))}
							</div>
						</div>
					)}

					{/* 하단 2: 초기화 버튼 + 저장 (1:1 비율) */}
					<div className="flex items-center gap-2 pt-1">
						<button
							type="button"
							onClick={handleResetBuckets}
							disabled={modalPreview.total === 0}
							className="flex-1 h-11 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-30 border border-rose-500/20 text-rose-600 dark:text-[#f87171] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
						>
							<RotateCcw size={14} />
							<span>초기화</span>
						</button>
						<button
							type="button"
							onClick={() =>
								onSave(
									editingTarget.row,
									editingTarget.person,
									modalPreview.serialized,
									modalPreview.total,
								)
							}
							disabled={savingCell}
							className="flex-1 h-11 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center"
						>
							{savingCell ? "저장 중..." : "저장하기"}
						</button>
					</div>
				</div>
			)}
		</Modal>
	);
}
