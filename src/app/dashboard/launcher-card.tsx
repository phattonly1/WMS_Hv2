"use client";

import { Check, ExternalLink, Monitor, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";

export function LauncherCard() {
	const [showToast, setShowToast] = useState<boolean>(false);
	const [showMobileNotice, setShowMobileNotice] = useState<boolean>(false);
	const [remainingMs, setRemainingMs] = useState<number>(5000);
	const timerRef = useRef<number | null>(null);
	const TOTAL_MS = 5000;

	useEffect(() => {
		if (!showToast) {
			if (timerRef.current) {
				cancelAnimationFrame(timerRef.current);
				timerRef.current = null;
			}
			return;
		}

		setRemainingMs(TOTAL_MS);
		const startTime = performance.now();

		const updateProgress = () => {
			const elapsed = performance.now() - startTime;
			const remaining = Math.max(0, TOTAL_MS - elapsed);
			setRemainingMs(remaining);

			if (remaining > 0) {
				timerRef.current = requestAnimationFrame(updateProgress);
			} else {
				setShowToast(false);
			}
		};

		timerRef.current = requestAnimationFrame(updateProgress);

		return () => {
			if (timerRef.current) {
				cancelAnimationFrame(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [showToast]);

	const handleCopyLauncher = async () => {
		const isMobile =
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent,
			) ||
			(window.innerWidth < 768 &&
				window.matchMedia("(pointer: coarse)").matches);

		if (isMobile) {
			setShowMobileNotice(true);
			return;
		}

		try {
			const { generateUnifiedLauncherScript } = await import("./launcher");
			const script = generateUnifiedLauncherScript();
			await navigator.clipboard.writeText(script);

			setShowToast(true);
		} catch {
			alert("클립보드 복사 권한이 거부되었습니다.");
		}
	};

	const progressPercent = Math.max(
		0,
		Math.min(100, (remainingMs / TOTAL_MS) * 100),
	);

	return (
		<>
			<button
				type="button"
				onClick={handleCopyLauncher}
				className="block h-full w-full text-left cursor-pointer"
			>
				<div className="group relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/40 transition-all duration-300 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-md dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] h-full min-h-[160px]">
					<div className="my-auto relative flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
						<Image
							src="/icons/icon-chart-bg.png"
							alt="WMS 슈퍼 런처"
							width={80}
							height={80}
							className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-2xl select-none"
						/>
					</div>

					<div className="text-center w-full mt-1.5 space-y-0.5">
						<span className="text-base font-bold text-[#0f172a] dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-center gap-1 whitespace-nowrap">
							통합 런처
						</span>
						<p className="text-[11px] text-[#64748b] dark:text-[#a1a1aa] leading-tight truncate">
							F12 업무 자동화 콘솔
						</p>
					</div>
				</div>
			</button>

			{/* 모바일 전용 M3 간결 안내 모달 */}
			<Modal
				isOpen={showMobileNotice}
				onClose={() => setShowMobileNotice(false)}
				title="PC 전용 기능"
				subtitle="WMS 슈퍼 런처"
				icon={Monitor}
				maxWidth="max-w-xs"
			>
				<div className="space-y-4 py-2 text-center">
					<p className="text-sm font-medium text-[#0f172a] dark:text-[#f4f4f5] leading-relaxed break-keep">
						WMS 통합 런처는 PC 버전 브라우저에서 실행해 주세요.
					</p>

					<button
						type="button"
						onClick={() => setShowMobileNotice(false)}
						className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 active:scale-98 transition-all shadow-md shadow-blue-500/20 flex items-center justify-center cursor-pointer"
					>
						확인
					</button>
				</div>
			</Modal>

			{/* 5초 토스트 알림창 */}
			{showToast && (
				<div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-[480px] bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)] flex items-start gap-3.5 transition-all text-[#0f172a] dark:text-[#f4f4f5] animate-in fade-in slide-in-from-top-4 duration-200">
					<div className="flex-1 min-w-0 pr-1">
						<div className="flex items-center gap-2 flex-wrap">
							<span className="font-bold text-sm text-[#0f172a] dark:text-white tracking-tight break-keep">
								WMS 올인원 통합 런처 복사 완료
							</span>
							<span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md flex items-center gap-1 whitespace-nowrap shrink-0">
								<Check className="w-2.5 h-2.5" />
								클립보드 저장됨
							</span>
						</div>

						<p className="text-xs text-[#64748b] dark:text-[#a1a1aa] mt-1.5 leading-relaxed break-keep">
							WMS 사이트 화면에서{" "}
							<kbd className="px-1.5 py-0.5 text-[11px] font-mono font-semibold bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] rounded text-[#0f172a] dark:text-white shadow-xs">
								F12
							</kbd>{" "}
							콘솔 열고{" "}
							<kbd className="px-1.5 py-0.5 text-[11px] font-mono font-semibold bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] rounded text-[#0f172a] dark:text-white shadow-xs">
								Ctrl+V
							</kbd>{" "}
							후{" "}
							<kbd className="px-1.5 py-0.5 text-[11px] font-mono font-semibold bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] rounded text-[#0f172a] dark:text-white shadow-xs">
								Enter
							</kbd>
							를 누르세요.
						</p>
					</div>

					<div className="flex flex-col items-end justify-between self-stretch shrink-0 gap-2">
						<button
							type="button"
							onClick={() => setShowToast(false)}
							className="text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white p-2.5 -mr-2 -mt-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer min-w-[48px] min-h-[48px] flex items-center justify-center"
							title="닫기"
						>
							<X className="w-4 h-4" />
						</button>
						<button
							type="button"
							onClick={() => {
								window.open("https://wms.waterkorea.or.kr/wms/main", "_blank");
								setShowToast(false);
							}}
							className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_8px_rgba(37,99,235,0.3)] transition-all cursor-pointer whitespace-nowrap min-h-[48px]"
						>
							<span>WMS 열기</span>
							<ExternalLink className="w-3.5 h-3.5" />
						</button>
					</div>

					<div className="absolute bottom-0 left-0 right-0 h-1 bg-[#f1f5f9] dark:bg-[#16161c] overflow-hidden rounded-b-2xl">
						<div
							className="h-full bg-blue-500 will-change-[width]"
							style={{ width: `${progressPercent}%` }}
						/>
					</div>
				</div>
			)}
		</>
	);
}
