"use client";

import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import type { Log, TabType } from "../types";

interface LogListProps {
	activeTab: TabType;
	logs: Log[];
	searchTerm: string;
	onToggleReqStatus: (logId: string, status: string) => Promise<void>;
	onOpenReturnModal: (log: Log) => void;
}

export default function LogList({
	activeTab,
	logs,
	searchTerm,
	onToggleReqStatus,
	onOpenReturnModal,
}: LogListProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
			{logs
				.filter((log) => {
					if (!searchTerm) return true;
					const term = searchTerm.toLowerCase();
					return (
						log.supply_name.toLowerCase().includes(term) ||
						log.user_name.toLowerCase().includes(term) ||
						log.note?.toLowerCase().includes(term)
					);
				})
				.map((log) => {
					const isReturn = log.type === "RETURN";
					const borderAccent =
						activeTab === "request"
							? "border-l-blue-500"
							: isReturn
								? "border-l-emerald-500"
								: "border-l-amber-500";

					return (
						<div
							key={log.id}
							className={`rounded-2xl p-4 border border-[#e2e8f0] dark:border-[#222228] border-l-4 ${borderAccent} bg-white dark:bg-[#111115] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all`}
						>
							<div className="flex justify-between items-center gap-3">
								{/* 좌측: 날짜, 이름, 물품명 */}
								<div className="flex-1 min-w-0 space-y-1">
									<div className="flex items-center gap-2">
										<span className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] uppercase tracking-tight">
											{new Date(log.created_at).toLocaleDateString()}
										</span>
										<span
											className={`text-xs font-bold ${
												isReturn ? "text-emerald-600 dark:text-emerald-400" : "text-[#0f172a] dark:text-[#f4f4f5]"
											}`}
										>
											{log.user_name}
										</span>
										{isReturn && (
											<span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
												반납
											</span>
										)}
										{activeTab === "request" && log.status === "done" && (
											<span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
												✓ 완료
											</span>
										)}
									</div>
									<h3 className="font-bold text-[#0f172a] dark:text-white text-sm truncate leading-tight break-keep">
										{log.supply_name}
									</h3>
									{log.note && (
										<p className="text-[11px] text-[#64748b] dark:text-[#a1a1aa] truncate break-keep">
											{log.note}
										</p>
									)}
								</div>

								{/* 우측: 수량 + 버튼 */}
								<div className="flex items-center gap-3 flex-shrink-0">
									<div className="text-right">
										<span
											className={`font-mono font-bold text-lg tracking-tight ${
												activeTab === "request"
													? "text-blue-600 dark:text-blue-400"
													: isReturn
														? "text-emerald-600 dark:text-emerald-400"
														: "text-amber-600 dark:text-amber-400"
											}`}
										>
											{activeTab === "request" ? "+" : isReturn ? "+" : "-"}
											{log.quantity}
										</span>
										{log.type === "OUT" && Number(log.returned_qty) > 0 && (
											<div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
												({log.returned_qty}개 반납)
											</div>
										)}
									</div>
									{activeTab === "request" && (
										<button
											type="button"
											onClick={() => onToggleReqStatus(log.id, log.status)}
											className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
												log.status === "done"
													? "bg-emerald-500 text-white shadow-emerald-500/20"
													: "bg-[#f1f5f9] dark:bg-[#16161c] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white border border-[#e2e8f0] dark:border-[#222228]"
											}`}
											title={
												log.status === "done"
													? "구매 완료 상태 (클릭 시 요청중으로 변경)"
													: "요청 중 상태 (클릭 시 구매완료로 변경)"
											}
										>
											{log.status === "done" ? (
												<CheckCircle2 size={16} />
											) : (
												<AlertCircle size={16} />
											)}
										</button>
									)}
									{activeTab === "out" && log.type === "OUT" && (
										<button
											type="button"
											onClick={() => onOpenReturnModal(log)}
											className="px-3 py-2 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/10 text-[#0f172a] dark:text-white text-[11px] font-bold border border-[#e2e8f0] dark:border-[#222228] transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
										>
											<RefreshCw size={12} /> 조절
										</button>
									)}
								</div>
							</div>
						</div>
					);
				})}
		</div>
	);
}
