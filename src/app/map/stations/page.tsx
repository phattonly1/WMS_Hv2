"use client";

import { ChevronDown, Database, List, Save, Table2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useStations } from "@/utils/supabase/hooks";
import { upsertStation } from "../actions";
import type { Station } from "../stationData";
import { StationForm } from "./components/StationForm";
import { StationSidebar } from "./components/StationSidebar";
import { StationSummaryTab } from "./components/StationSummaryTab";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type TabType = "manager" | "summary";

export default function StationEditorPage() {
	const { stations, isLoading, refresh } = useStations();
	const [activeTab, setActiveTab] = useState<TabType>("manager");
	const [selectedStation, setSelectedStation] = useState<Station | null>(null);
	const [originalStation, setOriginalStation] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			const tabParam = params.get("tab") as TabType;
			if (tabParam === "summary" || tabParam === "manager") {
				setActiveTab(tabParam);
			}
		}
	}, []);

	useEffect(() => {
		document.title =
			activeTab === "summary"
				? "기기 통계 - 한강수계 수질자동측정망"
				: "측정소 제원 관리 - 한강수계 수질자동측정망";
	}, [activeTab]);

	const validStations = useMemo(() => {
		if (!stations) return [];
		return (stations as Station[]).filter(
			(s) => s.type === "station" || s.type === "small",
		);
	}, [stations]);

	useEffect(() => {
		if (!isLoading && validStations.length > 0 && !selectedStation) {
			const params =
				typeof window !== "undefined"
					? new URLSearchParams(window.location.search)
					: null;
			const targetId = params?.get("id");
			const target = targetId
				? validStations.find((s) => s.id === targetId)
				: validStations.find((s) => s.type === "station") || validStations[0];

			if (target) {
				setSelectedStation(target);
				setOriginalStation(JSON.stringify(target));
			}
		}
	}, [validStations, isLoading, selectedStation]);

	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab);
	};

	const isDirty = useMemo(() => {
		if (!selectedStation) return false;
		if (!selectedStation.id) return selectedStation.name.trim() !== "";

		try {
			const current = JSON.parse(JSON.stringify(selectedStation));
			const original = JSON.parse(originalStation || "{}");

			const excludeFields = ["created_at", "updated_at", "is_deleted"];
			excludeFields.forEach((f) => {
				delete current[f];
				delete original[f];
			});

			const normalize = (obj: Record<string, unknown>) => {
				if (!obj) return;
				obj.features = obj.features || [];
				obj.instruments = obj.instruments || [];
				obj.history = obj.history || [];
			};
			normalize(current);
			normalize(original);

			return JSON.stringify(current) !== JSON.stringify(original);
		} catch {
			return false;
		}
	}, [selectedStation, originalStation]);

	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (isDirty) {
				e.preventDefault();
				e.returnValue = "";
			}
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [isDirty]);

	const handleSelectStation = (id: string) => {
		if (
			isDirty &&
			!confirm("저장하지 않은 변경 사항이 있습니다. 무시하고 진행할까요?")
		) {
			return;
		}

		const station = (stations as Station[]).find((s) => s.id === id);
		if (station) {
			setSelectedStation(station);
			setOriginalStation(JSON.stringify(station));
			setIsSidebarOpen(false);
		}
	};

	const handleSave = async () => {
		if (!selectedStation) return;
		setIsSaving(true);
		try {
			const result = await upsertStation(selectedStation);
			if (result.error) throw new Error(result.error);

			const savedStation = result.id
				? { ...selectedStation, id: result.id }
				: selectedStation;

			toast.success("측정소 정보가 저장되었습니다.");

			setSelectedStation(savedStation);
			setOriginalStation(JSON.stringify(savedStation));

			await refresh();
		} catch (error: unknown) {
			toast.error(`저장 실패: ${(error as Error).message}`);
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-white font-sans">
				<div className="w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin mb-4" />
				<p className="text-sm font-bold text-[#a1a1aa] tracking-widest">
					데이터를 불러오는 중...
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col min-h-screen h-screen bg-[#09090b] text-[#f4f4f5] [word-break:keep-all] overflow-hidden">
			{/* M3 표준 상단 헤더 */}
			<header className="h-14 border-b border-[#222228] bg-[#111115] px-4 flex items-center justify-between shrink-0 z-30">
				<div className="flex items-center gap-3">
					<Link
						href="/dashboard"
						className="w-9 h-9 rounded-xl bg-[#16161c] border border-[#222228] text-[#a1a1aa] hover:text-white hover:bg-[#27272a] flex items-center justify-center transition-all shadow-sm shrink-0"
						title="대시보드로 돌아가기"
						aria-label="대시보드로 돌아가기"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M15 19l-7-7 7-7"
							/>
						</svg>
					</Link>

					{activeTab === "summary" ? (
						<h1 className="font-bold text-sm sm:text-base text-white tracking-tight">
							기기 통계 요약
						</h1>
					) : (
						<button
							type="button"
							onClick={() => setIsSidebarOpen(true)}
							className="flex items-center gap-1.5 text-left py-0.5"
							title="측정소 목록 열기"
						>
							<span className="font-bold text-sm sm:text-base text-white tracking-tight truncate">
								{selectedStation?.name || "측정소 선택"}
							</span>
							<ChevronDown size={14} className="text-[#a1a1aa]" />
						</button>
					)}
				</div>

				<div className="flex items-center gap-2">
					<ThemeToggle />
					{/* 탭 전환 버튼 */}
					<div className="flex items-center bg-[#18181b] p-1 rounded-xl border border-[#222228]">
						<button
							type="button"
							onClick={() => handleTabChange("manager")}
							className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
								activeTab === "manager"
									? "bg-[#2563eb] text-white shadow-sm"
									: "text-[#a1a1aa] hover:text-white"
							}`}
						>
							<Database size={13} />
							<span>제원 관리</span>
						</button>
						<button
							type="button"
							onClick={() => handleTabChange("summary")}
							className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
								activeTab === "summary"
									? "bg-[#2563eb] text-white shadow-sm"
									: "text-[#a1a1aa] hover:text-white"
							}`}
						>
							<Table2 size={13} />
							<span>기기 통계</span>
						</button>
					</div>

					{/* 저장 버튼 (제원 관리 탭일 때) */}
					{activeTab === "manager" && (
						<button
							type="button"
							onClick={handleSave}
							disabled={isSaving || !isDirty}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
								isDirty
									? "bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-sm active:scale-95 cursor-pointer"
									: "bg-[#18181b] text-[#52525b] border border-[#222228] cursor-not-allowed"
							}`}
						>
							<Save size={14} />
							<span>{isSaving ? "저장 중..." : "저장"}</span>
						</button>
					)}
				</div>
			</header>

			{/* 1. 제원 관리 탭 */}
			{activeTab === "manager" && (
				<div className="flex-1 flex overflow-hidden relative">
					{isSidebarOpen && (
						<div
							className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
							onClick={() => setIsSidebarOpen(false)}
							onKeyDown={(e) => {
								if (e.key === "Escape") setIsSidebarOpen(false);
							}}
							role="button"
							tabIndex={0}
							aria-label="사이드바 닫기"
						/>
					)}

					<aside
						className={`fixed inset-y-0 left-0 w-[85vw] max-w-xs bg-[#111115] border-r border-[#222228] flex flex-col z-50 transition-transform duration-300 md:relative md:w-80 md:translate-x-0 md:z-20 ${
							isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
						}`}
					>
						<div className="flex-1 overflow-y-auto">
							<StationSidebar
								stations={validStations}
								selectedId={selectedStation?.id}
								onSelect={handleSelectStation}
								onClose={() => setIsSidebarOpen(false)}
							/>
						</div>
					</aside>

					<main className="flex-1 flex flex-col overflow-hidden relative bg-[#09090b]">
						{selectedStation ? (
							<div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
								<StationForm
									station={selectedStation}
									onChange={setSelectedStation}
								/>
							</div>
						) : (
							<div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
								<div className="w-16 h-16 rounded-2xl bg-[#111115] text-[#2563eb] flex items-center justify-center mb-4 border border-[#222228]">
									<Database size={28} />
								</div>
								<h3 className="text-base font-bold text-white tracking-tight mb-1">
									측정소를 선택하세요
								</h3>
								<p className="text-xs text-[#a1a1aa] max-w-xs mb-5">
									등록된 측정소를 선택하여 설비 제원 및 가동 기기를 확인하고
									수정하세요.
								</p>
								<button
									type="button"
									onClick={() => setIsSidebarOpen(true)}
									className="px-4 py-2.5 rounded-xl bg-[#2563eb] text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
								>
									<List size={15} />
									<span>측정소 목록 열기</span>
								</button>
							</div>
						)}
					</main>
				</div>
			)}

			{/* 2. 장비 가동 현황 (수계별 집계표) */}
			{activeTab === "summary" && (
				<div className="flex-1 overflow-y-auto p-4 bg-[#09090b]">
					<StationSummaryTab stations={stations as Station[]} />
				</div>
			)}
		</div>
	);
}
