"use client";

import { Loader2, Lock } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	checkDocsPinSession,
	exchangeQrGateTicketAction,
	syncActiveDomainToSupabase,
	verifyDocsPinAction,
} from "../authActions";

// 같은 탭 내에서 모달 전환 시 불필요한 깜빡임을 막는 메모리 플래그 (실제 데이터 보호는 서버 httpOnly 쿠키가 담당)
let sessionVerifiedCache = false;

interface DocsPinGateProps {
	children: React.ReactNode;
	title?: string;
	onVerified?: () => void;
}

export function DocsPinGate({
	children,
	title = "열람 보안 코드 입력",
	onVerified,
}: DocsPinGateProps) {
	const [verified, setVerified] = useState<boolean>(sessionVerifiedCache);
	const [checking, setChecking] = useState<boolean>(!sessionVerifiedCache);
	const [submitting, setSubmitting] = useState<boolean>(false);
	const [pin, setPin] = useState(["", "", "", ""]);
	const [error, setError] = useState(false);
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
	const onVerifiedRef = useRef(onVerified);
	onVerifiedRef.current = onVerified;

	useEffect(() => {
		// 현재 도메인을 Supabase에 자동 동기화 (도메인 변경 시 QR 문지기 자동 추적용)
		if (
			typeof window !== "undefined" &&
			window.location.hostname !== "localhost" &&
			window.location.hostname !== "127.0.0.1"
		) {
			syncActiveDomainToSupabase(window.location.origin);
		}

		if (sessionVerifiedCache) {
			onVerifiedRef.current?.();
			return;
		}
		let cancelled = false;

		(async () => {
			try {
				// 1. Supabase QR 문지기에서 이미 인증을 통과하고 넘어온 gate_ticket 파라미터가 있는지 우선 확인
				if (typeof window !== "undefined") {
					const params = new URLSearchParams(window.location.search);
					const ticket = params.get("gate_ticket");
					if (ticket) {
						const exchanged = await exchangeQrGateTicketAction(ticket);
						if (exchanged && !cancelled) {
							// 주소창에서 일회용 티켓 파라미터 깔끔하게 제거
							params.delete("gate_ticket");
							const newSearch = params.toString();
							const cleanUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}`;
							window.history.replaceState({}, "", cleanUrl);

							sessionVerifiedCache = true;
							setVerified(true);
							setChecking(false);
							onVerifiedRef.current?.();
							return;
						}
					}
				}

				// 2. 기존 7일 유지 쿠키 확인
				const ok = await checkDocsPinSession();
				if (cancelled) return;
				sessionVerifiedCache = ok;
				setVerified(ok);
				setChecking(false);
				if (ok) {
					onVerifiedRef.current?.();
				} else {
					setTimeout(() => {
						inputRefs.current[0]?.focus({ preventScroll: true });
					}, 50);
				}
			} catch {
				if (!cancelled) setChecking(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, []);

	const handleVerify = useCallback(
		async (fullPin: string) => {
			if (submitting) return;
			setSubmitting(true);
			setError(false);

			try {
				const res = await verifyDocsPinAction(fullPin);
				if (res.success) {
					sessionVerifiedCache = true;
					setVerified(true);
					setSubmitting(false);
					toast.success("인증 완료 (7일간 유지됩니다)");
					onVerified?.();
				} else {
					setError(true);
					setSubmitting(false);
					toast.error(res.error || "보안 코드가 일치하지 않습니다.");
					setTimeout(() => {
						setPin(["", "", "", ""]);
						setError(false);
						inputRefs.current[0]?.focus({ preventScroll: true });
					}, 450);
				}
			} catch {
				setError(true);
				setSubmitting(false);
				toast.error("인증 확인 중 오류가 발생했습니다.");
			}
		},
		[submitting, onVerified],
	);

	const handleInput = (value: string, index: number) => {
		if (!/^\d*$/.test(value) || submitting) return;

		setError(false);
		const newPin = [...pin];
		newPin[index] = value.slice(-1);
		setPin(newPin);

		if (value && index < 3) {
			inputRefs.current[index + 1]?.focus({ preventScroll: true });
		}

		const joined = newPin.join("");
		if (joined.length === 4 && newPin.every((d) => d !== "")) {
			handleVerify(joined);
		}
	};

	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>,
		index: number,
	) => {
		if (e.key === "Backspace" && !pin[index] && index > 0) {
			inputRefs.current[index - 1]?.focus({ preventScroll: true });
		}
	};

	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault();
		if (submitting) return;
		const pastedDigits = e.clipboardData
			.getData("text")
			.replace(/\D/g, "")
			.slice(0, 4)
			.split("");
		if (pastedDigits.length === 0) return;
		const newPin = [...pin];
		for (let i = 0; i < 4; i++) {
			const char = pastedDigits[i];
			if (char !== undefined) {
				newPin[i] = char;
			}
		}
		setPin(newPin);
		const joined = newPin.join("");
		if (joined.length === 4 && newPin.every((d) => d !== "")) {
			handleVerify(joined);
		} else {
			const nextIndex = Math.min(pastedDigits.length, 3);
			setTimeout(
				() => inputRefs.current[nextIndex]?.focus({ preventScroll: true }),
				10,
			);
		}
	};

	if (checking) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center py-12 text-xs text-[#64748b] dark:text-[#a1a1aa] gap-2">
				<Loader2 size={20} className="animate-spin text-blue-500" />
				<span>인증 상태 확인 중...</span>
			</div>
		);
	}

	if (verified) {
		return <>{children}</>;
	}

	return (
		<div className="flex-1 flex flex-col items-center justify-center py-8 px-4 select-none">
			<div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2.5">
				{submitting ? (
					<Loader2 size={18} className="animate-spin" />
				) : (
					<Lock size={18} strokeWidth={2.4} />
				)}
			</div>
			<h3 className="text-xs sm:text-sm font-bold text-[#0f172a] dark:text-white mb-1">
				{title}
			</h3>
			<p className="text-[11px] text-[#64748b] dark:text-[#a1a1aa] mb-5 text-center">
				4자리 보안 코드를 입력하면 7일간 인증이 유지됩니다.
			</p>

			<div
				className={`flex justify-between gap-2.5 sm:gap-3 w-full max-w-[220px] mx-auto transition-transform ${
					error ? "animate-bounce" : ""
				}`}
				role="group"
				aria-label="4자리 보안 코드 입력"
			>
				{pin.map((digit, index) => (
					<input
						// biome-ignore lint/suspicious/noArrayIndexKey: 4자리 고정 PIN 슬롯
						key={index}
						ref={(el) => {
							inputRefs.current[index] = el;
						}}
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
						maxLength={1}
						disabled={submitting}
						value={digit}
						onChange={(e) => handleInput(e.target.value, index)}
						onKeyDown={(e) => handleKeyDown(e, index)}
						onPaste={handlePaste}
						aria-label={`${index + 1}번째 숫자`}
						placeholder="•"
						className={`w-full aspect-square text-center text-lg sm:text-xl font-black rounded-2xl transition-all duration-200 outline-none caret-transparent disabled:opacity-50 ${
							error
								? "bg-red-500/10 border-2 border-red-500 text-red-500"
								: "bg-[#f1f5f9] dark:bg-[#16161c] border border-[#d7dfe9] dark:border-[#2a2a32] text-[#0f172a] dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
						} ${
							digit && !error
								? "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400"
								: ""
						} placeholder:text-[#94a3b8] dark:placeholder:text-white/20`}
					/>
				))}
			</div>
		</div>
	);
}
