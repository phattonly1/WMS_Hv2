"use client";

import {
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	Grid3X3,
	List,
	Package,
	Plus,
	X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
	addLog,
	adjustOutQty,
	toggleReqStatus,
	upsertSupply,
} from "@/actions/supplies";
import { useLogs, useSupplies } from "@/utils/supabase/hooks";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import InventorySidebar from "./components/InventorySidebar";
import ItemCard from "./components/ItemCard";
import ItemCardSkeleton from "./components/ItemCardSkeleton";
import LogList from "./components/LogList";
import MobileFilterBar from "./components/MobileFilterBar";
import type { Log, Supply, TabType } from "./types";

const ItemModal = dynamic(() => import("./components/ItemModal"));
const ActionModal = dynamic(() => import("./components/ActionModal"));
const QRModal = dynamic(() => import("./components/QRModal"));
const ReturnModal = dynamic(() => import("./components/ReturnModal"));

function ItemsContent() {
	const {
		supplies,
		isLoading: suppliesLoading,
		refresh: refreshSuppliesData,
	} = useSupplies();
	const {
		logs: reqLogs,
		isLoading: reqLoading,
		refresh: refreshReqLogs,
	} = useLogs("REQ");
	const {
		logs: outLogs,
		isLoading: outLoading,
		refresh: refreshOutLogs,
	} = useLogs("OUT_RETURN");

	const [activeTab, setActiveTab] = useState<TabType>("inventory");
	const [searchTerm, setSearchTerm] = useState("");
	const [filterUser, setFilterUser] = useState("ALL");
	const [showInStockOnly, setShowInStockOnly] = useState(false);

	const [isItemModalOpen, setIsItemModalOpen] = useState(false);
	const [isActionModalOpen, setIsActionModalOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<Supply | null>(null);
	const [isQRModalOpen, setIsQRModalOpen] = useState(false);
	const [qrItem, setQrItem] = useState<Supply | null>(null);

	const [viewMode, setViewMode] = useState<"list" | "photo">("list");
	const [zoomImage, setZoomImage] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
	const [selectedLog, setSelectedLog] = useState<Log | null>(null);
	const ITEMS_PER_PAGE = 16;

	const router = useRouter();
	const searchParams = useSearchParams();

	const items = (supplies || []) as Supply[];
	const logs = (
		activeTab === "request" ? reqLogs || [] : outLogs || []
	) as Log[];
	const loading =
		activeTab === "inventory"
			? suppliesLoading
			: activeTab === "request"
				? reqLoading
				: outLoading;

	const loadData = async () => {
		await Promise.all([
			refreshSuppliesData(),
			refreshReqLogs(),
			refreshOutLogs(),
		]);
		router.refresh();
	};

	useEffect(() => {
		if (activeTab === "request") {
			refreshReqLogs();
		} else if (activeTab === "out") {
			refreshOutLogs();
		}
	}, [activeTab, refreshReqLogs, refreshOutLogs]);

	// QR 스캔 진입 시 자동 모달 트리거
	useEffect(() => {
		const actionId = searchParams.get("action");
		if (actionId && items.length > 0) {
			const targetItem = items.find((i) => i.id === actionId);
			if (targetItem) {
				setSelectedItem(targetItem);
				setIsActionModalOpen(true);
				router.replace("/items", { scroll: false });
			}
		}
	}, [items, searchParams, router]);

	// 상위 카테고리 (제조사 목록 동적 생성)
	const manufacturers = useMemo(() => {
		const manufSet = new Set(
			items.map((item) => {
				const m = item.manufacturer || "기타";
				return m === "기술과환경" ? "기타" : m;
			}),
		);

		const preferredOrder = ["백년기술", "시마즈", "코비", "YSI"];
		const existingManufs = Array.from(manufSet);
		const sortedPreferred = preferredOrder.filter(
			(p) => existingManufs.includes(p) || p === "시마즈",
		);
		const others = existingManufs
			.filter(
				(m) =>
					!preferredOrder.includes(m) && m !== "기타" && m !== "기술과환경",
			)
			.sort();

		return [
			"ALL",
			...sortedPreferred,
			...others,
			...(existingManufs.includes("기타") ? ["기타"] : []),
		];
	}, [items]);

	const [filterManufacturer, setFilterManufacturer] = useState("ALL");
	const [filterDevice, setFilterDevice] = useState("ALL");

	const subDevices = useMemo(() => {
		if (filterManufacturer === "ALL") return [];

		const allDevices = new Set<string>();
		items
			.filter((item) => {
				let m = item.manufacturer || "기타";
				if (m === "기술과환경") m = "기타";
				return m === filterManufacturer;
			})
			.forEach((item) => {
				const deviceStr = item.device || "미분류";
				for (const d of deviceStr.split(",")) {
					const trimmed = d.trim();
					if (trimmed) allDevices.add(trimmed);
				}
			});

		const uniqueDevices = Array.from(allDevices).sort();
		return ["ALL", ...uniqueDevices];
	}, [items, filterManufacturer]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset filterDevice when filterManufacturer changes
	useEffect(() => {
		setFilterDevice("ALL");
	}, [filterManufacturer]);

	const filteredItems = items.filter((item) => {
		const matchesSearch = (
			item.name +
			item.unit +
			(item.device || "") +
			(item.manufacturer || "")
		)
			.toLowerCase()
			.includes(searchTerm.toLowerCase());

		let itemManuf = item.manufacturer || "기타";
		if (itemManuf === "기술과환경") itemManuf = "기타";
		const matchesManuf =
			filterManufacturer === "ALL" || itemManuf === filterManufacturer;

		const itemDeviceStr = item.device || "미분류";
		const itemDeviceList = itemDeviceStr.split(",").map((d) => d.trim());
		const matchesDevice =
			filterDevice === "ALL" || itemDeviceList.includes(filterDevice);

		const matchesStock = !showInStockOnly || item.quantity > 0;

		return matchesSearch && matchesManuf && matchesDevice && matchesStock;
	});

	const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
	const paginatedItems = filteredItems.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE,
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset pagination when filter criteria change
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, filterDevice, showInStockOnly]);

	const handleSaveItem = async (fd: FormData) => {
		await upsertSupply(fd);
		setIsItemModalOpen(false);
		await loadData();
	};

	const handleSubmitLog = async (
		type: "REQ" | "OUT",
		qty: number,
		user: string,
		note: string,
	) => {
		if (!selectedItem) return;
		const res = await addLog(
			type,
			selectedItem.id,
			selectedItem.name,
			qty,
			user,
			note,
		);
		if (res.error) throw new Error(res.error);
		setIsActionModalOpen(false);
		await loadData();
	};

	return (
		<div className="h-[100dvh] overflow-hidden flex flex-col bg-[#f8fafc] dark:bg-[#09090b] text-[#0f172a] dark:text-[#f4f4f5] transition-colors">
			{/* Top Header Navigation */}
			<header className="h-14 px-4 lg:px-6 border-b border-[#e2e8f0] dark:border-[#222228] bg-white/80 dark:bg-[#111115]/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20 transition-colors">
				<div className="flex items-center gap-3">
					<Link
						href="/dashboard"
						className="w-9 h-9 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/10 border border-[#e2e8f0] dark:border-[#222228] flex items-center justify-center text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-all active:scale-95"
						aria-label="대시보드로 돌아가기"
					>
						<ArrowLeft size={18} />
					</Link>
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
							<Package size={16} strokeWidth={2.4} />
						</div>
						<div>
							<h1 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-tight break-keep">
								소모품 관리
							</h1>
							<p className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] tracking-tight">
								INVENTORY MANAGEMENT
							</p>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<ThemeToggle />
					{activeTab === "inventory" && (
						<button
							type="button"
							onClick={() => {
								setSelectedItem(null);
								setIsItemModalOpen(true);
							}}
							aria-label="소모품 추가"
							className="h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(37,99,235,0.25)] active:scale-95"
						>
							<Plus size={16} strokeWidth={2.5} />
							<span className="hidden sm:inline">물품 추가</span>
						</button>
					)}

					<div
						className="flex gap-1 bg-[#f1f5f9] dark:bg-[#16161c] p-1 rounded-xl border border-[#e2e8f0] dark:border-[#222228]"
						role="tablist"
					>
						<button
							type="button"
							onClick={() => setViewMode("list")}
							role="tab"
							aria-selected={viewMode === "list"}
							aria-label="리스트 뷰"
							className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
								viewMode === "list"
									? "bg-white dark:bg-[#222228] text-[#0f172a] dark:text-white font-bold shadow-sm"
									: "text-[#64748b] dark:text-[#71717a] hover:text-[#0f172a] dark:hover:text-[#a1a1aa]"
							}`}
						>
							<List size={15} strokeWidth={2} />
						</button>
						<button
							type="button"
							onClick={() => setViewMode("photo")}
							role="tab"
							aria-selected={viewMode === "photo"}
							aria-label="포토 뷰"
							className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
								viewMode === "photo"
									? "bg-white dark:bg-[#222228] text-[#0f172a] dark:text-white font-bold shadow-sm"
									: "text-[#64748b] dark:text-[#71717a] hover:text-[#0f172a] dark:hover:text-[#a1a1aa]"
							}`}
						>
							<Grid3X3 size={15} strokeWidth={2} />
						</button>
					</div>
				</div>
			</header>

			{/* Screen Reader Status */}
			<div aria-live="polite" aria-atomic="true" className="sr-only">
				{searchTerm ? `검색 결과 ${filteredItems.length}건이 있습니다.` : ""}
			</div>

			{/* Main Workspace with Sidebar */}
			<div className="flex-1 max-w-7xl mx-auto w-full flex overflow-x-hidden pt-2 lg:pt-4 relative min-h-0">
				{/* Desktop Sidebar */}
				<InventorySidebar
					activeTab={activeTab}
					setActiveTab={setActiveTab}
					searchTerm={searchTerm}
					setSearchTerm={setSearchTerm}
					manufacturers={manufacturers}
					filterManufacturer={filterManufacturer}
					setFilterManufacturer={setFilterManufacturer}
					subDevices={subDevices}
					filterDevice={filterDevice}
					setFilterDevice={setFilterDevice}
					showInStockOnly={showInStockOnly}
					setShowInStockOnly={setShowInStockOnly}
					outLogs={outLogs as Log[]}
					filterUser={filterUser}
					setFilterUser={setFilterUser}
				/>

				{/* Content Area */}
				<main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 pb-24 lg:p-6 lg:pb-6">
					{loading ? (
						<div
							className={
								viewMode === "list"
									? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5"
									: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3"
							}
						>
							{Array.from({ length: 8 }).map((_, i) => (
								<ItemCardSkeleton key={`skel-${i + 1}`} viewMode={viewMode} />
							))}
						</div>
					) : activeTab === "inventory" ? (
						filteredItems.length === 0 ? (
							<div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-[#111115] rounded-3xl border border-[#e2e8f0] dark:border-[#222228]">
								<Package className="w-10 h-10 text-[#64748b] dark:text-[#52525b] mb-2" />
								<p className="text-sm font-bold text-[#0f172a] dark:text-white">
									해당하는 소모품이 없습니다
								</p>
								<p className="text-xs text-[#64748b] dark:text-[#71717a] mt-1 font-mono">
									필터 조건을 조정하거나 검색어를 확인해주세요.
								</p>
							</div>
						) : (
							<div
								className={
									viewMode === "list"
										? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5"
										: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3"
								}
							>
								{paginatedItems.map((item) => (
									<ItemCard
										key={item.id}
										item={item}
										viewMode={viewMode}
										onEdit={(i) => {
											setSelectedItem(i);
											setIsItemModalOpen(true);
										}}
										onAction={(i) => {
											setSelectedItem(i);
											setIsActionModalOpen(true);
										}}
										onQR={(i) => {
											setQrItem(i);
											setIsQRModalOpen(true);
										}}
										onZoom={(url) => setZoomImage(url)}
									/>
								))}
							</div>
						)
					) : null}

					{/* Inventory Pagination */}
					{activeTab === "inventory" && totalPages > 1 && (
						<div className="flex items-center justify-center gap-2 mt-5">
							<button
								type="button"
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={currentPage === 1}
								className="w-9 h-9 rounded-xl bg-white dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] flex items-center justify-center disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
								aria-label="이전 페이지"
							>
								<ChevronLeft size={18} />
							</button>
							<div className="bg-white dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] px-4 h-9 rounded-xl flex items-center">
								<span className="text-xs font-mono font-bold text-[#0f172a] dark:text-white">
									{currentPage} <span className="text-[#64748b] dark:text-[#52525b] mx-1">/</span>{" "}
									{totalPages}
								</span>
							</div>
							<button
								type="button"
								onClick={() =>
									setCurrentPage((p) => Math.min(totalPages, p + 1))
								}
								disabled={currentPage === totalPages}
								className="w-9 h-9 rounded-xl bg-white dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] flex items-center justify-center disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
								aria-label="다음 페이지"
							>
								<ChevronRight size={18} />
							</button>
						</div>
					)}

					{/* Logs List View (Request / Out) */}
					{activeTab !== "inventory" && (
						<LogList
							activeTab={activeTab}
							logs={logs}
							searchTerm={searchTerm}
							onToggleReqStatus={async (logId, status) => {
								await toggleReqStatus(logId, status);
								await refreshReqLogs();
								await refreshSuppliesData();
							}}
							onOpenReturnModal={(log) => {
								setSelectedLog(log);
								setIsReturnModalOpen(true);
							}}
						/>
					)}
				</main>
			</div>

			{/* Mobile Bottom Filter Bar */}
			<MobileFilterBar
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				manufacturers={manufacturers}
				filterManufacturer={filterManufacturer}
				setFilterManufacturer={setFilterManufacturer}
				subDevices={subDevices}
				filterDevice={filterDevice}
				setFilterDevice={setFilterDevice}
				showInStockOnly={showInStockOnly}
				setShowInStockOnly={setShowInStockOnly}
				filteredItemsLength={filteredItems.length}
			/>

			{/* Modals */}
			<ItemModal
				isOpen={isItemModalOpen}
				onClose={() => setIsItemModalOpen(false)}
				selectedItem={selectedItem}
				onSave={handleSaveItem}
			/>

			<ActionModal
				isOpen={isActionModalOpen}
				onClose={() => setIsActionModalOpen(false)}
				selectedItem={selectedItem}
				onSubmit={handleSubmitLog}
			/>

			<QRModal
				isOpen={isQRModalOpen}
				onClose={() => setIsQRModalOpen(false)}
				item={qrItem}
			/>

			<ReturnModal
				isOpen={isReturnModalOpen}
				onClose={() => {
					setIsReturnModalOpen(false);
					setSelectedLog(null);
				}}
				log={selectedLog}
				onAdjust={async (
					logId: string,
					supplyId: string,
					supplyName: string,
					newOutQty: number,
					userName: string,
					note: string,
				) => {
					if (selectedLog) {
						await adjustOutQty(
							logId,
							supplyId,
							supplyName,
							newOutQty,
							selectedLog.quantity,
							userName,
							note,
						);
						await refreshOutLogs();
						await refreshSuppliesData();
					}
				}}
			/>

			{/* Image Zoom Lightbox */}
			{zoomImage && (
				<div
					role="dialog"
					aria-modal="true"
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 cursor-pointer"
					onClick={() => setZoomImage(null)}
				>
					<div
						className="relative max-w-[90vw] max-h-[85vh] w-auto h-auto"
						onClick={(e) => e.stopPropagation()}
					>
						<Image
							src={zoomImage}
							width={1200}
							height={900}
							unoptimized
							className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/10"
							alt="확대 이미지"
						/>
					</div>
					<button
						type="button"
						className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/20 transition-all"
						onClick={() => setZoomImage(null)}
						aria-label="닫기"
					>
						<X size={20} />
					</button>
				</div>
			)}
		</div>
	);
}

export default function ItemsPage() {
	return (
		<Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-[#09090b]" />}>
			<ItemsContent />
		</Suspense>
	);
}
