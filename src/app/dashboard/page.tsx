import {
	Activity,
	Code2,
	Download,
	ExternalLink,
	FileText,
	ImageDown,
	Table2,
	Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LauncherCard } from "./launcher-card";

// 주요 3대 네비게이션 서비스 (정적 데이터)
const NAV_SERVICES = [
	{
		title: "수질 지도",
		desc: "공간정보 모니터링",
		imgSrc: "/icons/icon-map-bg.png",
		href: "/map",
	},
	{
		title: "자료실",
		desc: "업무 지침 및 보고서",
		imgSrc: "/icons/icon-docs-bg.png",
		href: "/docs",
	},
	{
		title: "소모품",
		desc: "시약 및 부품 재고 관리",
		imgSrc: "/icons/icon-item-bg.png",
		href: "/items",
	},
];

// 하단 업무 유틸리티 도구 4종
const OFFLINE_TOOLS = [
	{
		name: "측정/장애 이력 완성기",
		desc: "장비모델명 및 지속기간 자동 매핑",
		file: "/tools/station-history-filler.html",
		icon: Table2,
	},
	{
		name: "PDF 마스킹",
		desc: "개인정보 비식별화 및 보안 편집",
		file: "/tools/pdf-masking.html",
		icon: FileText,
	},
	{
		name: "이미지 변환기",
		desc: "JPG/WEBP to PNG 이미지 변환",
		file: "/tools/image-converter.html",
		icon: ImageDown,
	},
	{
		name: "교육 자동화",
		desc: "KECO 온라인 교육 콘솔 스크립트",
		file: "/tools/education-automation.txt",
		icon: Code2,
	},
];

// Server Component (RSC First)
export default function DashboardPage() {
	return (
		<main
			id="main-content"
			className="relative flex min-h-screen flex-col items-center justify-center p-4 md:p-8 font-sans bg-[#f8fafc] dark:bg-[#09090b] text-[#0f172a] dark:text-[#f4f4f5] overflow-x-hidden transition-colors"
		>
			<h1 className="sr-only">한강수계 수질자동측정망 통합 관제 대시보드</h1>

			{/* 미세 도트 그리드 배경 */}
			<div
				className="absolute inset-0 pointer-events-none opacity-[0.03] dark:invert"
				style={{
					backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
					backgroundSize: "20px 20px",
				}}
			/>

			<div className="w-full max-w-6xl flex flex-col items-center gap-8 relative z-10 bg-white dark:bg-[#111115] rounded-3xl p-6 md:p-10 border border-[#e2e8f0] dark:border-[#222228] shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_20px_50px_rgba(0,0,0,0.5)] transition-colors">
				{/* 상단 통합 헤더 */}
				<header className="w-full flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#e2e8f0] dark:border-[#222228]">
					<div className="flex items-center gap-3 min-w-0">
						<div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
							<Activity className="w-5 h-5 animate-pulse" />
						</div>
						<div className="min-w-0">
							<h1 className="text-base sm:text-lg font-bold tracking-tight text-[#0f172a] dark:text-white break-keep">
								한강수계 수질자동측정망
							</h1>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<ThemeToggle />
						<Link
							href="/architecture"
							className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-xs font-mono text-[#2563eb] dark:text-[#60a5fa] hover:underline transition-colors items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
						>
							<span>구조도 뷰어</span>
						</Link>
						<Link
							href="/dev"
							className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-xs font-mono text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white transition-colors items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
						>
							<span>/dev 검증기</span>
						</Link>
					</div>
				</header>

				{/* 1. 메인 4대 서비스 내비게이션 그리드 (2열 2행 균형 배치) */}
				<nav className="w-full" aria-label="주요 서비스 내비게이션">
					<div className="grid grid-cols-2 gap-4 md:gap-6">
						{NAV_SERVICES.slice(0, 2).map((item) => (
							<Link key={item.title} href={item.href} className="block h-full">
								<div className="group relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/40 transition-all duration-300 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-md dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] cursor-pointer h-full min-h-[160px]">
									<div className="my-auto relative flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
										<Image
											src={item.imgSrc}
											alt={item.title}
											width={80}
											height={80}
											className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-2xl select-none"
										/>
									</div>
									<div className="text-center w-full mt-1.5 space-y-0.5">
										<span className="text-base font-bold text-[#0f172a] dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-center gap-1 whitespace-nowrap">
											{item.title}
										</span>
										<p className="text-[11px] text-[#64748b] dark:text-[#a1a1aa] leading-tight truncate">
											{item.desc}
										</p>
									</div>
								</div>
							</Link>
						))}

						{/* WMS 런처 (클라이언트 상호작용 컴포넌트) */}
						<div className="h-full">
							<LauncherCard />
						</div>

						{NAV_SERVICES.slice(2).map((item) => (
							<Link key={item.title} href={item.href} className="block h-full">
								<div className="group relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/40 transition-all duration-300 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-md dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] cursor-pointer h-full min-h-[160px]">
									<div className="my-auto relative flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
										<Image
											src={item.imgSrc}
											alt={item.title}
											width={80}
											height={80}
											className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-2xl select-none"
										/>
									</div>
									<div className="text-center w-full mt-1.5 space-y-0.5">
										<span className="text-base font-bold text-[#0f172a] dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-center gap-1 whitespace-nowrap">
											{item.title}
										</span>
										<p className="text-[11px] text-[#64748b] dark:text-[#a1a1aa] leading-tight truncate">
											{item.desc}
										</p>
									</div>
								</div>
							</Link>
						))}
					</div>
				</nav>

				{/* 2. 업무 유틸리티 도구함 바 (정적 SSR 렌더링) */}
				<section className="w-full pt-6 border-t border-[#e2e8f0] dark:border-[#222228] flex flex-col gap-4">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
						<div className="flex items-center gap-2.5">
							<div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
								<Wrench className="w-4 h-4" />
							</div>
							<div>
								<h2 className="text-sm sm:text-base font-bold text-[#0f172a] dark:text-white tracking-tight">
									업무 유틸리티 도구함
								</h2>
								<p className="text-xs text-[#64748b] dark:text-[#a1a1aa] mt-0.5">
									브라우저에서 바로 사용하는 실무 보조 도구 모음입니다.
								</p>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{OFFLINE_TOOLS.map((tool) => {
							const Icon = tool.icon;
							return (
								<div
									key={tool.name}
									className="group relative flex items-center justify-between p-3.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/40 transition-all duration-200 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
								>
									<a
										href={tool.file}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-3 min-w-0 flex-1 mr-2"
										title={`${tool.name} 새 탭에서 열기`}
									>
										<div className="w-9 h-9 rounded-xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] text-[#64748b] dark:text-[#a1a1aa] group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-500/30 flex items-center justify-center shrink-0 transition-colors">
											<Icon className="w-4 h-4" />
										</div>
										<div className="min-w-0">
											<span className="text-xs font-bold text-[#0f172a] dark:text-white truncate block">
												{tool.name}
											</span>
											<p className="text-[11px] text-[#64748b] dark:text-[#a1a1aa] truncate mt-0.5">
												{tool.desc}
											</p>
										</div>
									</a>

									<div className="flex items-center gap-1 shrink-0">
										<a
											href={tool.file}
											target="_blank"
											rel="noopener noreferrer"
											className="p-1.5 rounded-lg text-[#64748b] dark:text-[#a1a1aa] hover:text-blue-600 dark:hover:text-blue-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
											title="새 탭에서 열기"
										>
											<ExternalLink className="w-3.5 h-3.5" />
										</a>
										<a
											href={tool.file}
											download
											className="p-1.5 rounded-lg text-[#64748b] dark:text-[#a1a1aa] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
											title="파일 다운로드"
										>
											<Download className="w-3.5 h-3.5" />
										</a>
									</div>
								</div>
							);
						})}
					</div>
				</section>
			</div>
		</main>
	);
}
