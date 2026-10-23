"use client";

import {
	Check,
	ChevronDown,
	ChevronUp,
	LayoutGrid,
	LogOut,
	Package,
	PlusCircle,
	Search,
} from "lucide-react";
import { useState } from "react";
import type { TabType } from "../types";

interface MobileFilterBarProps {
	activeTab: TabType;
	setActiveTab: (tab: TabType) => void;
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	manufacturers: string[];
	filterManufacturer: string;
	setFilterManufacturer: (manuf: string) => void;
	subDevices: string[];
	filterDevice: string;
	setFilterDevice: (device: string) => void;
	showInStockOnly: boolean;
	setShowInStockOnly: (show: boolean) => void;
	filteredItemsLength: number;
}

export default function MobileFilterBar({
	activeTab,
	setActiveTab,
	searchTerm,
	setSearchTerm,
	manufacturers,
	filterManufacturer,
	setFilterManufacturer,
	subDevices,
	filterDevice,
	setFilterDevice,
	showInStockOnly,
	setShowInStockOnly,
	filteredItemsLength,
}: MobileFilterBarProps) {
	const [showManufDropdown, setShowManufDropdown] = useState(false);
	const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);

	return (
		<div className="lg:hidden fixed bottom-0 left-0 right-0 w-full overflow-visible flex-shrink-0 z-50 bg-white/95 dark:bg-[#111115]/95 backdrop-blur-md border-t border-[#e2e8f0] dark:border-[#222228] pb-safe transition-colors">
			{/* 1. 세부 기기 필터 (제조사 선택시에만 노출) */}
			{activeTab === "inventory" && filterManufacturer !== "ALL" && (
				<div className="px-3 py-2 border-b border-[#e2e8f0] dark:border-[#222228]">
					<div className="relative">
						<button
							type="button"
							onClick={() => setShowDeviceDropdown(!showDeviceDropdown)}
							className="w-full flex items-center justify-between px-3.5 h-10 bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] rounded-xl text-xs font-semibold text-[#0f172a] dark:text-white transition-all"
						>
							<span className="flex items-center gap-2 truncate">
								<span className="text-blue-600 dark:text-blue-400 font-bold">
									{filterManufacturer}
								</span>
								<span className="text-[#64748b] dark:text-[#a1a1aa] text-[10px] uppercase truncate">
									{filterDevice === "ALL" ? "세부 기기 선택" : filterDevice}
								</span>
							</span>
							<ChevronUp
								size={16}
								className={`text-[#64748b] dark:text-[#a1a1aa] shrink-0 transition-transform duration-200 ${
									showDeviceDropdown ? "rotate-180" : ""
								}`}
							/>
						</button>

						{showDeviceDropdown && (
							<>
								<div
									className="fixed inset-0 z-40"
									onClick={() => setShowDeviceDropdown(false)}
								/>
								<div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] rounded-2xl shadow-2xl z-50 overflow-hidden">
									<div className="max-h-60 overflow-y-auto p-1">
										{subDevices.map((device: string) => (
											<button
												key={device}
												type="button"
												onClick={() => {
													setFilterDevice(device);
													setShowDeviceDropdown(false);
												}}
												className={`w-full px-3.5 py-2.5 text-left text-xs font-semibold rounded-xl transition-all break-keep ${
													filterDevice === device
														? "text-blue-600 dark:text-blue-400 bg-blue-500/10"
														: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
												}`}
											>
												{device === "ALL" ? "전체 기기" : device}
											</button>
										))}
									</div>
								</div>
							</>
						)}
					</div>
				</div>
			)}

			{/* 2. 탭 전환 + 검색창 + 재고 토글 */}
			<div className="flex items-center gap-2 px-3 py-2">
				{/* 탭 버튼 */}
				<div className="flex items-center gap-1 bg-[#f1f5f9] dark:bg-[#16161c] p-1 rounded-xl border border-[#e2e8f0] dark:border-[#222228] shrink-0">
					<button
						type="button"
						onClick={() => setActiveTab("inventory")}
						className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
							activeTab === "inventory"
								? "bg-[#2563eb] text-white shadow-xs"
								: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
						}`}
						title="재고 현황"
					>
						<LayoutGrid size={16} />
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("request")}
						className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
							activeTab === "request"
								? "bg-[#2563eb] text-white shadow-xs"
								: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
						}`}
						title="수량 추가"
					>
						<PlusCircle size={16} />
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("out")}
						className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
							activeTab === "out"
								? "bg-[#2563eb] text-white shadow-xs"
								: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
						}`}
						title="불출 기록"
					>
						<LogOut size={16} />
					</button>
				</div>

				{/* 검색창 컨테이너 */}
				<div className="flex-1 min-w-0 h-[44px] rounded-xl flex items-center px-2 bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] focus-within:border-blue-500/50 relative">
					<div className="relative">
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setShowManufDropdown(!showManufDropdown);
							}}
							className="px-2 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white gap-0.5"
							aria-label="제조사 선택"
						>
							<Search size={15} />
							<ChevronDown
								size={13}
								className={`transition-transform duration-200 ${
									showManufDropdown ? "rotate-180" : ""
								}`}
							/>
						</button>

						{showManufDropdown && (
							<>
								<div
									className="fixed inset-0 z-40"
									onClick={() => setShowManufDropdown(false)}
								/>
								<div className="absolute bottom-full left-0 mb-3 w-52 bg-white dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] rounded-2xl shadow-2xl z-50 overflow-hidden">
									<div className="p-3 border-b border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#111115]">
										<p className="text-[10px] font-mono font-bold text-[#64748b] dark:text-[#a1a1aa] uppercase tracking-wider px-1">
											제조사 선택
										</p>
									</div>
									<div className="max-h-60 overflow-y-auto p-1.5">
										{manufacturers.map((manuf) => (
											<button
												key={manuf}
												type="button"
												onClick={() => {
													setFilterManufacturer(manuf);
													setShowManufDropdown(false);
												}}
												className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all break-keep ${
													filterManufacturer === manuf
														? "text-blue-600 dark:text-blue-400 bg-blue-500/10"
														: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
												}`}
											>
												<span>{manuf === "ALL" ? "전체 제조사" : manuf}</span>
												{filterManufacturer === manuf && (
													<Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
												)}
											</button>
										))}
									</div>
								</div>
							</>
						)}
					</div>

					<label htmlFor="mobile-search" className="sr-only">
						소모품 검색
					</label>
					<input
						id="mobile-search"
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="검색..."
						className="flex-1 min-w-0 h-full bg-transparent border-none outline-none text-xs text-[#0f172a] dark:text-white placeholder:text-[#64748b] dark:placeholder:text-[#a1a1aa] px-1"
					/>

					<span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md shrink-0 mr-1 border border-blue-500/20 whitespace-nowrap">
						{filteredItemsLength}
					</span>
				</div>

				{/* 재고 토글 */}
				<button
					type="button"
					onClick={() => setShowInStockOnly(!showInStockOnly)}
					className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 border ${
						showInStockOnly
							? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
							: "bg-[#f1f5f9] dark:bg-[#16161c] text-[#64748b] dark:text-[#a1a1aa] border-[#e2e8f0] dark:border-[#222228] hover:text-[#0f172a] dark:hover:text-white"
					}`}
					title={showInStockOnly ? "전체 보기" : "재고 있는 것만 보기"}
				>
					<Package size={17} />
				</button>
			</div>
		</div>
	);
}
