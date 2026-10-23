"use client";

import {
	Check,
	ChevronDown,
	LayoutGrid,
	LogOut,
	PlusCircle,
	Search,
} from "lucide-react";
import { useState } from "react";
import type { Log, TabType } from "../types";

interface InventorySidebarProps {
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
	outLogs: Log[];
	filterUser: string;
	setFilterUser: (user: string) => void;
}

export default function InventorySidebar({
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
	outLogs,
	filterUser,
	setFilterUser,
}: InventorySidebarProps) {
	const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);

	return (
		<aside className="hidden lg:flex w-[240px] flex-shrink-0 flex-col p-4 gap-6 overflow-y-auto border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] rounded-2xl shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors">
			{/* 검색창 */}
			<div>
				<div className="h-[40px] rounded-xl flex items-center px-3 bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] transition-all focus-within:border-blue-500/50 mb-6">
					<Search
						size={16}
						className="text-[#64748b] dark:text-[#a1a1aa] mr-2 shrink-0 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400"
					/>
					<label htmlFor="sidebar-search" className="sr-only">
						물품 검색
					</label>
					<input
						id="sidebar-search"
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="물품 검색..."
						className="flex-1 h-full bg-transparent border-none outline-none text-xs font-medium text-[#0f172a] dark:text-white placeholder:text-[#64748b] dark:placeholder:text-[#a1a1aa]"
					/>
				</div>

				<h3 className="text-[11px] font-mono font-bold text-[#64748b] dark:text-[#a1a1aa] uppercase mb-2 px-2 tracking-wider">
					메뉴
				</h3>
				<div className="space-y-1.5 mb-6">
					<button
						type="button"
						onClick={() => setActiveTab("inventory")}
						className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all break-keep ${
							activeTab === "inventory"
								? "bg-[#2563eb] text-white shadow-sm"
								: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#16161c]"
						}`}
					>
						<LayoutGrid size={16} />
						재고 현황
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("request")}
						className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all break-keep ${
							activeTab === "request"
								? "bg-[#2563eb] text-white shadow-sm"
								: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#16161c]"
						}`}
					>
						<PlusCircle size={16} />
						수량 추가
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("out")}
						className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all break-keep ${
							activeTab === "out"
								? "bg-[#2563eb] text-white shadow-sm"
								: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#16161c]"
						}`}
					>
						<LogOut size={16} />
						불출 기록
					</button>
				</div>

				{/* 제조사 필터 */}
				{activeTab === "inventory" && (
					<div className="mb-6">
						<h3 className="text-[11px] font-mono font-bold text-[#64748b] dark:text-[#a1a1aa] uppercase mb-2 px-2 tracking-wider">
							제조사
						</h3>
						<div className="space-y-1 max-h-[240px] overflow-y-auto pr-1">
							{manufacturers.map((manuf) => (
								<button
									key={manuf}
									type="button"
									onClick={() => setFilterManufacturer(manuf)}
									className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all break-keep ${
										filterManufacturer === manuf
											? "text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20"
											: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#16161c]"
									}`}
								>
									<span className="truncate">
										{manuf === "ALL" ? "전체 제조사" : manuf}
									</span>
									{filterManufacturer === manuf && (
										<Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
									)}
								</button>
							))}
						</div>
					</div>
				)}
			</div>

			<div className="h-px bg-[#e2e8f0] dark:bg-[#222228]" />

			{activeTab === "inventory" ? (
				<>
					{filterManufacturer !== "ALL" && (
						<div className="space-y-2">
							<h3 className="text-[10px] font-mono font-bold text-[#64748b] dark:text-[#a1a1aa] uppercase tracking-wider px-2">
								세부 기기 필터
							</h3>
							<div className="relative">
								<button
									type="button"
									onClick={() => setShowDeviceDropdown(!showDeviceDropdown)}
									className="w-full flex items-center justify-between px-3.5 h-[40px] bg-[#f8fafc] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] rounded-xl text-xs font-semibold text-[#0f172a] dark:text-white hover:border-blue-500/40 transition-all"
								>
									<span className="truncate">
										{filterDevice === "ALL" ? "모든 세부 기기" : filterDevice}
									</span>
									<ChevronDown
										size={16}
										className={`text-[#64748b] dark:text-[#a1a1aa] transition-transform duration-200 ${
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
										<div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] rounded-xl shadow-2xl z-50 overflow-hidden">
											<div className="max-h-60 overflow-y-auto p-1">
												{subDevices.map((device: string) => (
													<button
														key={device}
														type="button"
														onClick={() => {
															setFilterDevice(device);
															setShowDeviceDropdown(false);
														}}
														className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-lg transition-all break-keep ${
															filterDevice === device
																? "text-blue-600 dark:text-blue-400 bg-blue-500/10"
																: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
														}`}
													>
														{device === "ALL" ? "전체" : device}
													</button>
												))}
											</div>
										</div>
									</>
								)}
							</div>
						</div>
					)}

					<div className="pt-2">
						<label className="flex items-center gap-2.5 cursor-pointer px-2 py-1.5 hover:bg-[#f1f5f9] dark:hover:bg-[#16161c] rounded-xl transition-colors font-medium">
							<div
								className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
									showInStockOnly
										? "bg-emerald-500 border-emerald-500 text-white"
										: "border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#16161c]"
								}`}
							>
								{showInStockOnly && <Check size={12} strokeWidth={3} />}
							</div>
							<input
								type="checkbox"
								checked={showInStockOnly}
								onChange={(e) => setShowInStockOnly(e.target.checked)}
								className="hidden"
							/>
							<span className="text-xs text-[#64748b] dark:text-[#a1a1aa] select-none break-keep">
								재고 있는 것만
							</span>
						</label>
					</div>
				</>
			) : activeTab === "out" ? (
				<div>
					<h3 className="text-[11px] font-mono font-bold text-[#64748b] dark:text-[#a1a1aa] uppercase mb-2 px-2 tracking-wider">
						사용자 필터
					</h3>
					<div className="space-y-1">
						<button
							type="button"
							onClick={() => setFilterUser("ALL")}
							className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all break-keep ${
								filterUser === "ALL"
									? "bg-[#2563eb] text-white"
									: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#16161c]"
							}`}
						>
							전체보기
						</button>
						{Array.from(new Set((outLogs || []).map((l) => l.user_name)))
							.sort()
							.map((user) => (
								<button
									type="button"
									key={user}
									onClick={() => setFilterUser(user)}
									className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all break-keep ${
										filterUser === user
											? "bg-[#2563eb] text-white"
											: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#16161c]"
									}`}
								>
									{user}
								</button>
							))}
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center h-full text-[#64748b] dark:text-[#a1a1aa] text-xs">
					<p className="break-keep">요청 탭에서는</p>
					<p className="break-keep">필터가 제한됩니다</p>
				</div>
			)}
		</aside>
	);
}
