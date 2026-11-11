"use client";

import {
	ArrowLeft,
	Download,
	FlaskConical,
	Plus,
	UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	deleteReagentSheet,
	type ReagentOrderSheet,
	type ReagentPerson,
	type ReagentRowSpec,
	updateReagentCell,
	upsertReagentSheetMeta,
} from "@/actions/reagents";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useReagentSheets } from "@/utils/supabase/hooks";
import DesktopReagentWorkspace from "./components/DesktopReagentWorkspace";
import MobileReagentBottomBar from "./components/MobileReagentBottomBar";
import ReagentAmountModal from "./components/ReagentAmountModal";
import ReagentSheetMetaModal from "./components/ReagentSheetMetaModal";
import {
	getMobileReagentLabel,
	PEOPLE_LIST,
	PERSON_GREEN_ROWS,
	parseCellExpression,
	REAGENT_SPEC_ROWS,
	SUMMARY_SHEET_ID,
} from "./constants";
import { downloadStyledReagentXlsx } from "./utils/exportReagentXlsx";

export default function ReagentsPage() {
	const {
		sheets: fetchedSheets,
		isLoading: isFetchingSheets,
		refresh: refreshSheetsData,
	} = useReagentSheets();
	const [sheets, setSheets] = useState<ReagentOrderSheet[]>([]);
	const [selectedSheetId, setSelectedSheetId] = useState<string>("");

	useEffect(() => {
		if (fetchedSheets) {
			setSheets(fetchedSheets);
		}
	}, [fetchedSheets]);

	// 초기 선택 시트 설정
	useEffect(() => {
		if (sheets.length > 0 && !selectedSheetId) {
			const latest = sheets[sheets.length - 1];
			setSelectedSheetId(latest ? latest.id : SUMMARY_SHEET_ID);
		}
	}, [sheets, selectedSheetId]);

	const loading = isFetchingSheets && sheets.length === 0;

	// 모바일 전용 상태: 처음 진입 시 이름 선택 화면부터 노출 (null)
	const [mobilePerson, setMobilePerson] = useState<ReagentPerson | null>(null);
	const [breakdownPopupRowId, setBreakdownPopupRowId] = useState<string | null>(
		null,
	);

	// 셀 입력 모달 상태 (아이디어 A: 1L, 2L, 5L, 10L 카드 4개 + 입력 구성 내용 + 초기화)
	const [editingTarget, setEditingTarget] = useState<{
		row: ReagentRowSpec;
		person: ReagentPerson;
		rawVal: string;
	} | null>(null);
	const [savingCell, setSavingCell] = useState<boolean>(false);

	// 데스크톱 회차(시트) 추가/수정 모달 상태
	const [isSheetModalOpen, setIsSheetModalOpen] = useState<boolean>(false);
	const [editingSheetId, setEditingSheetId] = useState<string | undefined>(
		undefined,
	);
	const [sheetTitle, setSheetTitle] = useState<string>("");
	const [sheetDeadline, setSheetDeadline] = useState<string>("");
	const [sheetDelivery, setSheetDelivery] = useState<string>("");
	const [savingSheet, setSavingSheet] = useState<boolean>(false);

	const loadSheets = useCallback(
		async (preferSheetId?: string) => {
			const updated = await refreshSheetsData();
			if (updated && Array.isArray(updated)) {
				setSheets(updated);
				if (preferSheetId) {
					setSelectedSheetId(preferSheetId);
				} else if (updated.length > 0) {
					setSelectedSheetId((prev) => {
						if (prev === SUMMARY_SHEET_ID) return SUMMARY_SHEET_ID;
						if (prev && updated.some((s) => s.id === prev)) return prev;
						const latest = updated[updated.length - 1];
						return latest ? latest.id : SUMMARY_SHEET_ID;
					});
				} else {
					setSelectedSheetId(SUMMARY_SHEET_ID);
				}
			}
		},
		[refreshSheetsData],
	);

	// 모바일 브라우저/하드웨어 뒤로가기 시 대시보드 이탈 대신 측정소 선택 화면으로 복귀
	useEffect(() => {
		const handlePopState = () => {
			setMobilePerson(null);
			setBreakdownPopupRowId(null);
		};
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, []);

	const handleSelectMobilePerson = (person: ReagentPerson) => {
		if (isSummaryView && sheets.length > 0) {
			const latest = sheets[sheets.length - 1];
			if (latest) setSelectedSheetId(latest.id);
		}
		if (!mobilePerson && typeof window !== "undefined") {
			window.history.pushState({ mobilePerson: person }, "");
		}
		setMobilePerson(person);
		setBreakdownPopupRowId(null);
	};

	const handleResetMobilePerson = () => {
		if (!mobilePerson) return;
		setMobilePerson(null);
		setBreakdownPopupRowId(null);
		if (typeof window !== "undefined" && window.history.state?.mobilePerson) {
			window.history.back();
		}
	};

	const isSummaryView = selectedSheetId === SUMMARY_SHEET_ID;

	const currentSheet = useMemo(() => {
		if (isSummaryView) return null;
		return (
			sheets.find((s) => s.id === selectedSheetId) ??
			sheets[sheets.length - 1] ??
			null
		);
	}, [sheets, selectedSheetId, isSummaryView]);

	// 전체 누적 합계 시트 계산 (데스크톱용)
	const summaryCells = useMemo(() => {
		const acc: Record<string, Record<ReagentPerson, number>> = {};
		for (const row of REAGENT_SPEC_ROWS) {
			acc[row.id] = Object.fromEntries(
				PEOPLE_LIST.map((p) => [p, 0]),
			) as Record<ReagentPerson, number>;
		}

		for (const sheet of sheets) {
			for (const row of REAGENT_SPEC_ROWS) {
				const rowData = sheet.cells[row.id];
				if (!rowData) continue;
				for (const person of PEOPLE_LIST) {
					const raw = rowData[person];
					if (!raw) continue;
					const { total } = parseCellExpression(raw, row.defaultVolume);
					const targetRowAcc = acc[row.id];
					if (total > 0 && targetRowAcc) {
						targetRowAcc[person] = Number(
							(targetRowAcc[person] + total).toFixed(2),
						);
					}
				}
			}
		}
		return acc;
	}, [sheets]);

	// 모바일에서 선택된 담당자의 녹색 셀 시약 목록만 추출
	const mobilePersonRows = useMemo(() => {
		if (!mobilePerson) return [];
		const allowedIds = new Set(PERSON_GREEN_ROWS[mobilePerson]);
		return REAGENT_SPEC_ROWS.filter((row) => allowedIds.has(row.id));
	}, [mobilePerson]);

	// 모바일 및 데스크톱 셀 입력 모달 오픈
	const handleOpenCellModal = (row: ReagentRowSpec, person: ReagentPerson) => {
		if (isSummaryView) {
			toast.info(
				"누적 합계 뷰에서는 직접 수정할 수 없습니다. 좌측에서 주문 회차를 선택해주세요.",
			);
			return;
		}
		const activeTargetSheet = currentSheet ?? sheets[sheets.length - 1];
		if (!activeTargetSheet) return;

		const rawVal = activeTargetSheet.cells[row.id]?.[person] || "";
		setEditingTarget({ row, person, rawVal });
	};

	const handleSaveCell = async (
		row: ReagentRowSpec,
		person: ReagentPerson,
		nextValue: string,
		totalL: number,
	) => {
		const activeTargetSheet = currentSheet ?? sheets[sheets.length - 1];
		if (!activeTargetSheet) return;
		setSavingCell(true);

		const targetSheetId = activeTargetSheet.id;
		setSheets((prev) =>
			prev.map((s) => {
				if (s.id !== targetSheetId) return s;
				const nextRowCells = { ...(s.cells[row.id] || {}) };
				if (!nextValue) {
					delete nextRowCells[person];
				} else {
					nextRowCells[person] = nextValue;
				}
				return {
					...s,
					cells: {
						...s.cells,
						[row.id]: nextRowCells,
					},
				};
			}),
		);

		try {
			const res = await updateReagentCell(
				targetSheetId,
				row.id,
				person,
				nextValue,
			);
			if (!res.success) {
				toast.error(res.error || "저장에 실패했습니다.");
				await loadSheets(targetSheetId);
			} else {
				toast.success(
					!nextValue
						? `${person} · ${row.reagentName || row.device} 수량 초기화됨`
						: `${person} · ${row.reagentName || row.device}: 총 ${totalL}L 저장 완료`,
				);
				setEditingTarget(null);
			}
		} finally {
			setSavingCell(false);
		}
	};

	// 새 회차 모달 열기 (데스크톱)
	const handleOpenNewSheetModal = () => {
		setEditingSheetId(undefined);
		const nextNum = sheets.length + 1;
		setSheetTitle(`${nextNum}차 시약 주문`);
		setSheetDeadline("");
		setSheetDelivery("");
		setIsSheetModalOpen(true);
	};

	// 현재 회차 정보 수정 모달 열기 (데스크톱)
	const handleOpenEditSheetModal = () => {
		if (!currentSheet) return;
		setEditingSheetId(currentSheet.id);
		setSheetTitle(currentSheet.title);
		setSheetDeadline(
			currentSheet.deadline === "-" ? "" : currentSheet.deadline,
		);
		setSheetDelivery(
			currentSheet.deliveryDate === "-" ? "" : currentSheet.deliveryDate,
		);
		setIsSheetModalOpen(true);
	};

	const handleSaveSheetMeta = async () => {
		if (!sheetTitle.trim()) {
			toast.error("회차 이름을 입력해주세요.");
			return;
		}
		setSavingSheet(true);
		try {
			const res = await upsertReagentSheetMeta({
				id: editingSheetId,
				title: sheetTitle,
				deadline: sheetDeadline,
				deliveryDate: sheetDelivery,
			});
			if (!res.success) {
				toast.error(res.error || "회차 저장 실패");
				return;
			}
			toast.success(
				editingSheetId
					? "회차 정보가 수정되었습니다."
					: "새 주문 회차가 생성되었습니다.",
			);
			setIsSheetModalOpen(false);
			await loadSheets(res.sheetId);
		} finally {
			setSavingSheet(false);
		}
	};

	const handleDeleteCurrentSheet = async () => {
		if (!currentSheet) return;
		if (
			!confirm(
				`'${currentSheet.title}' 회차를 삭제하시겠습니까? 입력된 모든 수량이 삭제됩니다.`,
			)
		) {
			return;
		}
		const res = await deleteReagentSheet(currentSheet.id);
		if (!res.success) {
			toast.error(res.error || "삭제 실패");
			return;
		}
		toast.success("회차가 삭제되었습니다.");
		await loadSheets();
	};

	// 원본 양식 그대로 스타일이 적용된 엑셀(.xlsx) 다운로드 (데스크톱)
	const handleDownloadExcel = () => {
		try {
			downloadStyledReagentXlsx({
				isSummaryView,
				currentSheet,
				summaryCells,
			});
			toast.success("원본 양식 엑셀(.xlsx) 파일이 다운로드되었습니다.");
		} catch {
			toast.error("엑셀 파일 생성 중 오류가 발생했습니다.");
		}
	};

	// 측정소 열별 총합계 계산
	const columnTotals = useMemo(() => {
		const totals = Object.fromEntries(PEOPLE_LIST.map((p) => [p, 0])) as Record<
			ReagentPerson,
			number
		>;
		let grandTotal = 0;

		for (const row of REAGENT_SPEC_ROWS) {
			for (const p of PEOPLE_LIST) {
				const val = isSummaryView
					? summaryCells[row.id]?.[p] || 0
					: parseCellExpression(
							currentSheet?.cells[row.id]?.[p],
							row.defaultVolume,
						).total;
				totals[p] = Number((totals[p] + val).toFixed(2));
				grandTotal = Number((grandTotal + val).toFixed(2));
			}
		}
		return { totals, grandTotal };
	}, [isSummaryView, summaryCells, currentSheet]);

	return (
		<div className="h-[100dvh] overflow-hidden flex flex-col bg-[#f8fafc] dark:bg-[#09090b] text-[#0f172a] dark:text-[#f4f4f5] transition-colors">
			{/* 상단 헤더 */}
			<header className="h-14 px-3 sm:px-4 lg:px-6 border-b border-[#e2e8f0] dark:border-[#222228] bg-white/80 dark:bg-[#111115]/80 backdrop-blur-md flex items-center justify-between gap-2 shrink-0 z-20 transition-colors">
				<div className="flex items-center gap-2.5 min-w-0">
					{mobilePerson ? (
						<>
							<button
								type="button"
								onClick={handleResetMobilePerson}
								className="lg:hidden w-10 h-10 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/10 border border-[#e2e8f0] dark:border-[#222228] flex items-center justify-center text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-all active:scale-95 shrink-0 cursor-pointer"
								aria-label="측정소 선택으로 돌아가기"
							>
								<ArrowLeft size={18} />
							</button>
							<Link
								href="/dashboard"
								className="hidden lg:flex w-10 h-10 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/10 border border-[#e2e8f0] dark:border-[#222228] items-center justify-center text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-all active:scale-95 shrink-0"
								aria-label="대시보드로 돌아가기"
							>
								<ArrowLeft size={18} />
							</Link>
						</>
					) : (
						<Link
							href="/dashboard"
							className="w-10 h-10 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/10 border border-[#e2e8f0] dark:border-[#222228] flex items-center justify-center text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-all active:scale-95 shrink-0"
							aria-label="대시보드로 돌아가기"
						>
							<ArrowLeft size={18} />
						</Link>
					)}
					<div className="flex items-center gap-2 min-w-0">
						<div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#2563eb] dark:text-[#60a5fa] flex items-center justify-center shrink-0">
							<FlaskConical size={16} strokeWidth={2.4} />
						</div>
						<div className="min-w-0">
							<h1 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-tight break-keep truncate">
								제조시약 주문
							</h1>
							<p className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] tracking-tight truncate">
								REAGENT ORDER MATRIX
							</p>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<ThemeToggle />

					{/* 데스크톱(lg 이상)에서만 노출되는 관리 버튼들 */}
					<button
						type="button"
						onClick={handleDownloadExcel}
						className="hidden lg:flex h-10 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-[#34d399] font-bold text-xs items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
						title="원본 양식 엑셀(.xlsx) 다운로드"
					>
						<Download size={15} />
						<span>엑셀 저장</span>
					</button>

					<button
						type="button"
						onClick={handleOpenNewSheetModal}
						className="hidden lg:flex h-10 px-3.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs items-center gap-1.5 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
					>
						<Plus size={16} strokeWidth={2.5} />
						<span>새 회차 추가</span>
					</button>
				</div>
			</header>

			{/* [A] 모바일 전용 화면 (lg 미만) */}
			<div className="lg:hidden flex-1 flex flex-col min-h-0 overflow-hidden">
				<main className="flex-1 min-h-0 overflow-y-auto px-2.5 pt-3 pb-24">
					{loading ? (
						<div className="h-full flex items-center justify-center text-xs text-[#64748b] dark:text-[#a1a1aa]">
							데이터를 불러오는 중...
						</div>
					) : !mobilePerson ? (
						/* 1) 모바일 초기 진입: 이름 선택 화면만 노출 */
						<div className="min-h-full flex flex-col items-center py-2">
							<div className="w-full max-w-md my-auto bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] rounded-2xl p-4 shadow-sm space-y-3">
								<div className="flex items-center gap-2.5 pb-2 border-b border-[#e2e8f0] dark:border-[#222228]">
									<div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#2563eb] dark:text-[#60a5fa] flex items-center justify-center shrink-0">
										<UserCheck size={18} />
									</div>
									<div className="min-w-0">
										<h2 className="text-sm font-bold text-[#0f172a] dark:text-white break-keep">
											측정소를 선택하세요
										</h2>
										<p className="text-[11px] text-[#64748b] dark:text-[#a1a1aa] break-keep truncate">
											측정소의 시약 목록만 표시됩니다
										</p>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-2">
									{PEOPLE_LIST.map((person) => {
										const count = PERSON_GREEN_ROWS[person].length;
										const totalL = columnTotals.totals[person] || 0;
										return (
											<button
												key={person}
												type="button"
												onClick={() => handleSelectMobilePerson(person)}
												className="min-h-[50px] py-2.5 px-3 rounded-xl bg-[#f8fafc] dark:bg-[#16161c] hover:border-[#2563eb] border border-[#e2e8f0] dark:border-[#222228] flex items-center justify-between transition-all active:scale-95 cursor-pointer"
											>
												<div className="text-left">
													<div className="text-sm font-bold text-[#0f172a] dark:text-white">
														{person}
													</div>
													<div className="text-[10px] text-[#64748b] dark:text-[#a1a1aa]">
														시약 <span className="font-mono">{count}</span>종
													</div>
												</div>
												{totalL > 0 && (
													<span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-[#2563eb] dark:text-[#60a5fa] font-bold text-xs">
														<span className="font-mono">{totalL}</span>L
													</span>
												)}
											</button>
										);
									})}
								</div>
							</div>
						</div>
					) : (
						/* 2) 측정소 선택 후: 녹색 셀 시약 1줄 인라인 리스트 */
						<div className="space-y-1.5">
							<div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-[10px] font-bold text-[#64748b] dark:text-[#a1a1aa]">
								<span>측정항목 · 시약명</span>
								<span>합계 · 시약 추가</span>
							</div>

							{mobilePersonRows.map((row) => {
								const activeTargetSheet =
									currentSheet ?? sheets[sheets.length - 1];
								const rawVal =
									activeTargetSheet?.cells[row.id]?.[mobilePerson] || "";
								const parsed = parseCellExpression(rawVal, row.defaultVolume);
								const { mainName, companyBadge } = getMobileReagentLabel(row);
								const isBreakdownOpen = breakdownPopupRowId === row.id;

								const catBadgeClass =
									row.category === "TOC"
										? "bg-blue-500/10 text-[#2563eb] dark:text-[#60a5fa] border-blue-500/20"
										: row.category === "TP"
											? "bg-emerald-500/10 text-emerald-600 dark:text-[#34d399] border-emerald-500/20"
											: row.category === "TN"
												? "bg-amber-500/10 text-amber-600 dark:text-[#fbbf24] border-amber-500/20"
												: "bg-black/5 dark:bg-white/5 text-[#64748b] dark:text-[#a1a1aa] border-[#e2e8f0] dark:border-[#222228]";

								return (
									<div
										key={row.id}
										className="relative px-2.5 py-2 rounded-2xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] shadow-2xs"
									>
										<div className="flex items-center gap-1.5 min-w-0">
											{/* 1) 측정항목 뱃지 */}
											<span
												className={`w-9 py-1 rounded-lg font-mono font-bold text-[10px] text-center border shrink-0 ${catBadgeClass}`}
											>
												{row.category}
											</span>

											{/* 2) 제조사 뱃지 (시약명 왼쪽, 측정항목처럼 키운 크기) */}
											{companyBadge && (
												<span className="px-2 py-1 rounded-lg bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-[10px] font-bold text-[#64748b] dark:text-[#a1a1aa] text-center shrink-0">
													{companyBadge}
												</span>
											)}

											{/* 3) 시약명 */}
											<div className="flex-1 min-w-0 pr-1">
												<span className="text-xs font-bold text-[#0f172a] dark:text-white truncate block">
													{mainName}
												</span>
											</div>

											<button
												type="button"
												onClick={() =>
													setBreakdownPopupRowId((prev) =>
														prev === row.id ? null : row.id,
													)
												}
												className={`min-w-[48px] h-10 px-2 rounded-xl font-mono text-xs font-bold flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer border ${
													parsed.total > 0
														? "bg-blue-500/15 text-[#2563eb] dark:text-[#60a5fa] border-blue-500/30"
														: "bg-[#f1f5f9] dark:bg-[#16161c] text-[#94a3b8] dark:text-[#52525b] border-[#e2e8f0] dark:border-[#222228]"
												}`}
												title="클릭하여 상세 내역(몇L × 몇개) 확인"
											>
												{parsed.total}L
											</button>

											<button
												type="button"
												onClick={() => handleOpenCellModal(row, mobilePerson)}
												className="h-10 px-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shrink-0 cursor-pointer shadow-2xs"
											>
												<Plus size={14} strokeWidth={2.5} />
												<span>추가</span>
											</button>
										</div>

										{isBreakdownOpen && (
											<div className="mt-2 px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-[#16161c] border border-blue-500/30 flex items-center justify-between text-xs font-mono">
												<span className="text-[#64748b] dark:text-[#a1a1aa]">
													입력 구성 내역:
												</span>
												<span className="font-bold text-[#2563eb] dark:text-[#60a5fa]">
													{parsed.total > 0
														? `${parsed.breakdownText} (총 ${parsed.total}L)`
														: "입력된 수량 없음"}
												</span>
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</main>

				{/* 모바일 하단바 및 전역 모달 (회차 선택) */}
				<MobileReagentBottomBar
					currentSheet={currentSheet}
					sheets={sheets}
					onSelectSheetId={setSelectedSheetId}
				/>
			</div>

			{/* [B] 데스크톱 전용 워크스페이스 (lg 이상) */}
			<DesktopReagentWorkspace
				loading={loading}
				sheets={sheets}
				selectedSheetId={selectedSheetId}
				setSelectedSheetId={setSelectedSheetId}
				isSummaryView={isSummaryView}
				currentSheet={currentSheet}
				summaryCells={summaryCells}
				columnTotals={columnTotals}
				onOpenEditSheetModal={handleOpenEditSheetModal}
				onDeleteCurrentSheet={handleDeleteCurrentSheet}
				onOpenCellModal={handleOpenCellModal}
			/>

			{/* 1. 시약 용량 × 개수 입력 모달 */}
			<ReagentAmountModal
				editingTarget={editingTarget}
				onClose={() => setEditingTarget(null)}
				onSave={handleSaveCell}
				savingCell={savingCell}
			/>

			{/* 2. 새 회차 추가 / 마감일 수정 모달 */}
			<ReagentSheetMetaModal
				isOpen={isSheetModalOpen}
				onClose={() => setIsSheetModalOpen(false)}
				editingSheetId={editingSheetId}
				sheetTitle={sheetTitle}
				setSheetTitle={setSheetTitle}
				sheetDeadline={sheetDeadline}
				setSheetDeadline={setSheetDeadline}
				sheetDelivery={sheetDelivery}
				setSheetDelivery={setSheetDelivery}
				onSave={handleSaveSheetMeta}
				savingSheet={savingSheet}
			/>
		</div>
	);
}
