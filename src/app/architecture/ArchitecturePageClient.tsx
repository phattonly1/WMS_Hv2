"use client";

import { ArrowLeft, Network } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ArchitectureViewer } from "@/app/dev/ArchitectureViewer";

export default function ArchitecturePageClient() {
	return (
		<div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] text-[#0f172a] dark:text-[#f4f4f5] p-6 md:p-10 font-sans relative transition-colors">
			{/* 배경 도트 매트릭스 그리드 */}
			<div
				className="absolute inset-0 pointer-events-none opacity-[0.03] dark:invert"
				style={{
					backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
					backgroundSize: "20px 20px",
				}}
			/>

			<div className="max-w-7xl mx-auto space-y-6 relative z-10">
				{/* 상단 내비게이션 바 */}
				<header className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] shadow-sm transition-colors">
					<div className="flex items-center gap-3">
						<Link
							href="/dashboard"
							className="p-2.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-[#f4f4f5] transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
						</Link>
						<div>
							<div className="flex items-center gap-2">
								<Network className="w-5 h-5 text-[#2563eb]" />
								<h1 className="text-base sm:text-lg font-bold tracking-tight text-[#0f172a] dark:text-[#f4f4f5]">
									시스템 아키텍처 교육 뷰어
								</h1>
							</div>
							<p className="text-xs text-[#64748b] dark:text-[#a1a1aa] mt-0.5">
								WMS_Hv2 프론트엔드 및 백엔드 인터랙션 파일 구조도
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<ThemeToggle />
					</div>
				</header>

				{/* 아키텍처 뷰어 본체 */}
				<ArchitectureViewer />
			</div>
		</div>
	);
}
