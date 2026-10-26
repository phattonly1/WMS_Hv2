"use client";

import { ArrowRight, Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import LoginForm from "./LoginForm";

interface LoginPageClientProps {
	redirectTo?: string;
}

export default function LoginPageClient({ redirectTo }: LoginPageClientProps) {
	const [isSuccess, setIsSuccess] = useState(false);
	const [theme, setTheme] = useState<"light" | "dark">("dark");
	const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

	useEffect(() => {
		const handleViewportChange = () => {
			if (window.visualViewport) {
				// 키패드가 열려 높이가 전체 window 대비 확 줄어들었는지 감지 (모바일 기준)
				const isShrunk = window.visualViewport.height < window.innerHeight * 0.75;
				setIsKeyboardOpen(isShrunk);
				// iOS Safari가 포커스 시 임의로 화면을 밀어올리는 현상 복구
				if (window.scrollY !== 0) {
					window.scrollTo(0, 0);
				}
			}
		};

		if (window.visualViewport) {
			window.visualViewport.addEventListener("resize", handleViewportChange);
			window.visualViewport.addEventListener("scroll", handleViewportChange);
		}

		return () => {
			if (window.visualViewport) {
				window.visualViewport.removeEventListener("resize", handleViewportChange);
				window.visualViewport.removeEventListener("scroll", handleViewportChange);
			}
		};
	}, []);

	useEffect(() => {
		const saved = localStorage.getItem("wms-theme");
		if (saved === "light" || saved === "dark") {
			setTheme(saved);
			if (saved === "light") {
				document.documentElement.classList.remove("dark");
			} else {
				document.documentElement.classList.add("dark");
			}
		} else {
			const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
			const initialTheme = prefersDark ? "dark" : "light";
			setTheme(initialTheme);
			if (initialTheme === "dark") {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
		}
	}, []);

	const toggleTheme = () => {
		const next = theme === "dark" ? "light" : "dark";
		setTheme(next);
		localStorage.setItem("wms-theme", next);
		if (next === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	};

	return (
		<div
			className={`fixed inset-0 h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden overscroll-none font-sans transition-colors duration-700 ${
				isSuccess
					? "bg-sky-50 dark:bg-zinc-950"
					: "bg-slate-50 dark:bg-[#09090b]"
			}`}
		>
			{/* Dynamic Background */}
			<div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-opacity duration-700">
				{/* Base Gradient Layer */}
				<div
					className={`absolute inset-0 transition-opacity duration-700 ${
						isSuccess
							? "opacity-0"
							: "opacity-100 bg-gradient-to-b from-blue-100/40 via-white to-sky-50 dark:from-blue-950/20 dark:via-[#111115] dark:to-[#09090b]"
					}`}
				/>

				{/* Shallow Water Gradient Layer (Success) */}
				<div
					className={`absolute inset-0 transition-opacity duration-700 ${
						isSuccess
							? "opacity-100 bg-gradient-to-b from-white via-sky-50 to-white dark:from-[#111115] dark:via-blue-950/30 dark:to-[#111115]"
							: "opacity-0"
					}`}
				/>

				{/* Animated Orbs */}
				<div
					className={`absolute top-[-20%] left-[-10%] w-[120%] h-[120%] transition-opacity duration-700 ${
						isSuccess ? "opacity-60" : "opacity-30"
					}`}
				>
					<div
						className={`absolute top-1/2 left-1/2 w-full max-w-[700px] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-colors duration-700 ${
							isSuccess
								? "bg-sky-300/40 dark:bg-sky-900/40"
								: "bg-blue-300/30 dark:bg-blue-900/20"
						}`}
					/>
					<div
						className={`absolute top-1/2 left-1/2 w-full max-w-[900px] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-colors duration-700 ${
							isSuccess
								? "bg-teal-200/30 dark:bg-cyan-950/30"
								: "bg-sky-200/20 dark:bg-sky-950/20"
						}`}
					/>
				</div>

				{/* Accent Light */}
				<div
					className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] transition-all duration-700 ${
						isSuccess
							? "from-amber-100/40 dark:from-amber-900/20 via-transparent to-transparent"
							: "from-blue-200/40 dark:from-blue-900/20 via-transparent to-transparent"
					}`}
				/>
			</div>

			<div
				className={`relative z-10 w-full max-w-[460px] transition-all duration-300 ease-out ${
					isKeyboardOpen ? "-translate-y-16 sm:translate-y-0" : "translate-y-0"
				} ${isSuccess ? "scale-105" : "scale-100"}`}
			>
				{/* Main Card */}
				<div className="group relative">
					<div
						className={`absolute -inset-1 rounded-3xl transition duration-500 ${
							isSuccess
								? "shadow-[0_0_80px_rgba(14,165,233,0.4)] opacity-100"
								: "shadow-[0_0_40px_rgba(37,99,235,0.15)] opacity-50 group-hover:opacity-100"
						}`}
					/>

					<div
						className={`relative backdrop-blur-md border rounded-3xl p-6 sm:p-14 text-center overflow-hidden transition-all duration-700 ${
							isSuccess
								? "bg-white/80 dark:bg-[#16161c]/90 border-white/60 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(14,165,233,0.2)]"
								: "bg-white/70 dark:bg-[#111115]/80 border-slate-200/80 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
						}`}
					>
						{/* Card Inside Theme Toggle */}
						<div className="absolute top-4 right-4 z-20">
							<button
								type="button"
								onClick={toggleTheme}
								aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
								className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-slate-300 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-white/10 transition-colors shadow-sm"
							>
								{theme === "dark" ? (
									<>
										<Sun size={13} className="text-amber-400" />
										<span>라이트</span>
									</>
								) : (
									<>
										<Moon size={13} className="text-blue-600" />
										<span>다크</span>
									</>
								)}
							</button>
						</div>

						{/* Header Section */}
						<div
							className={`space-y-6 sm:space-y-8 mb-8 sm:mb-12 relative z-10 transition-all duration-500 ${
								isSuccess ? "-translate-y-2" : ""
							}`}
						>
							<div className="mx-auto w-[72px] h-[72px] sm:w-[92px] sm:h-[92px] p-2 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-white/20 relative overflow-hidden group">
								<div className="relative w-[44px] h-[44px] sm:w-[56px] sm:h-[56px] transition-transform duration-700 group-hover:scale-110">
									<Image
										src="/images/gongdan-mark.png"
										alt="한국환경공단 로고"
										fill
										className="object-contain"
										priority
									/>
								</div>
							</div>

							<div className="space-y-3 sm:space-y-4">
								<h1
									className={`text-2xl sm:text-4xl font-black tracking-tight leading-tight transition-colors duration-700 ${
										isSuccess
											? "text-slate-800 dark:text-zinc-100"
											: "text-slate-900 dark:text-white"
									}`}
								>
									수질자동측정망
								</h1>
								<div
									className={`flex items-center justify-center gap-3 transition-opacity duration-500 ${
										isSuccess ? "opacity-0" : "opacity-100"
									}`}
								>
									<div className="h-px w-6 sm:w-8 bg-gradient-to-r from-transparent to-slate-300 dark:to-white/20" />
									<p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400 tracking-widest uppercase">
										4자리 PIN번호를 입력하세요
									</p>
									<div className="h-px w-6 sm:w-8 bg-gradient-to-l from-transparent to-slate-300 dark:to-white/20" />
								</div>
							</div>
						</div>

						<LoginForm
							redirectTo={redirectTo}
							onSuccess={() => setIsSuccess(true)}
							className={`relative z-10 transition-transform duration-500 ${
								isSuccess ? "-translate-y-4" : ""
							}`}
						/>

						{/* Quick Links Section */}
						<div
							className={`mt-6 sm:mt-8 pt-5 sm:pt-6 border-t relative z-10 transition-all duration-500 delay-500 ${
								isSuccess
									? "border-sky-200/50 opacity-0 scale-95"
									: "border-slate-200/60 dark:border-white/5 opacity-100 scale-100"
							}`}
						>
							<div className="flex flex-col items-center">
								<Link
									href="/items?quicklink=true"
									className="group/link relative flex items-center gap-3 px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:bg-slate-200/80 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-colors duration-300 outline-none cursor-pointer"
								>
									<div className="flex flex-col items-start leading-tight">
										<span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors">
											Quick Link
										</span>
										<span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-zinc-300 group-hover/link:text-slate-900 dark:group-hover/link:text-white transition-colors">
											물품 관리 시스템 바로가기
										</span>
									</div>
									<div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-white/5 flex items-center justify-center group-hover/link:bg-blue-500/20 dark:group-hover/link:bg-white/10 transition-colors">
										<ArrowRight
											className="text-blue-600 dark:text-blue-400 group-hover/link:translate-x-0.5 transition-all duration-300"
											size={16}
										/>
									</div>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
