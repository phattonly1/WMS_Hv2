"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { login } from "../actions";

interface LoginFormProps {
	onSuccess?: () => void;
	className?: string;
	redirectTo?: string;
}

export default function LoginForm({
	onSuccess,
	className = "",
	redirectTo,
}: LoginFormProps) {
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [pin, setPin] = useState(["", "", "", ""]);
	const [error, setError] = useState(false);
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
	const router = useRouter();

	// 미리 대시보드 데이터를 프리페치하여 전환 속도 향상
	useEffect(() => {
		router.prefetch("/dashboard");
		// 첫 렌더 시 0번째 인풋 자동 포커스
		inputRefs.current[0]?.focus();
	}, [router]);

	const handleInput = (value: string, index: number) => {
		if (!/^\d*$/.test(value)) return;

		setError(false);
		const newPin = [...pin];
		newPin[index] = value.slice(-1);
		setPin(newPin);

		if (value && index < 3) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>,
		index: number,
	) => {
		if (e.key === "Backspace" && !pin[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault();
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
		const nextIndex = Math.min(pastedDigits.length, 3);
		setTimeout(() => inputRefs.current[nextIndex]?.focus(), 10);
	};

	const handleSubmit = useCallback(
		async (e?: React.FormEvent) => {
			if (e) e.preventDefault();

			const fullPin = pin.join("");
			if (fullPin.length < 4) return;

			setLoading(true);
			setError(false);

			try {
				const formData = new FormData();
				formData.append("passcode", fullPin);
				const result = await login(formData);

				if (result?.error) {
					setError(true);
					setLoading(false);
					toast.error("잘못된 패스코드입니다.");
					setTimeout(() => {
						setPin(["", "", "", ""]);
						inputRefs.current[0]?.focus();
					}, 500);
				} else if (result?.success) {
					setSuccess(true);
					const redirectUrl =
						redirectTo?.startsWith("/") && !redirectTo.startsWith("//")
							? redirectTo
							: "/dashboard";
					if (onSuccess) {
						onSuccess();
						setTimeout(() => {
							router.push(redirectUrl);
						}, 400);
					} else {
						router.push(redirectUrl);
					}
				}
			} catch {
				setError(true);
				setLoading(false);
				toast.error("요청 중 오류가 발생했습니다.");
			}
		},
		[pin, redirectTo, onSuccess, router],
	);

	useEffect(() => {
		if (pin.every((digit) => digit !== "") && !loading && !success) {
			handleSubmit();
		}
	}, [pin, loading, success, handleSubmit]);

	// 페이지 어디를 클릭해도 PIN 입력창으로 포커스
	useEffect(() => {
		const handleGlobalClick = (e: MouseEvent) => {
			if (loading || success) return;

			const target = e.target as HTMLElement;
			if (target.closest("a") || target.closest("button")) return;

			if (inputRefs.current.some((ref) => ref === document.activeElement))
				return;

			const nextEmptyIndex = pin.indexOf("");
			const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 3;
			inputRefs.current[focusIndex]?.focus();
		};

		window.addEventListener("click", handleGlobalClick);
		return () => window.removeEventListener("click", handleGlobalClick);
	}, [pin, loading, success]);

	return (
		<form
			onSubmit={handleSubmit}
			className={`transition-all duration-300 relative min-h-[52px] sm:min-h-[80px] flex items-center justify-center ${error ? "animate-bounce" : ""} ${className}`}
			aria-label="PIN 로그인 폼"
		>
			<div
				className={`flex justify-between gap-2.5 sm:gap-4 w-full max-w-[240px] sm:max-w-[280px] mx-auto absolute transition-all duration-300 transform ${
					loading || success
						? "opacity-0 scale-95 pointer-events-none"
						: "opacity-100 scale-100"
				}`}
				role="group"
				aria-label="4자리 PIN 입력"
			>
				{pin.map((digit, index) => (
					<input
						key={index}
						ref={(el) => {
							inputRefs.current[index] = el;
						}}
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
						maxLength={1}
						value={digit}
						onChange={(e) => handleInput(e.target.value, index)}
						onKeyDown={(e) => handleKeyDown(e, index)}
						onPaste={handlePaste}
						disabled={loading || success}
						aria-label={`${index + 1}번째 숫자`}
						placeholder="•"
						className={`w-full aspect-square text-center text-lg sm:text-2xl font-black rounded-full transition-all duration-300 outline-none caret-transparent
							${
								error
									? "bg-red-500/10 border-2 border-red-500 text-red-500"
									: "bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-blue-50/20 dark:focus:bg-blue-500/10"
							}
							${digit && !error ? "bg-blue-50/60 dark:bg-white/15 border-blue-400 dark:border-white/30" : ""}
							hover:bg-slate-200/50 dark:hover:bg-white/10
							placeholder:text-slate-400 dark:placeholder:text-white/20
						`}
					/>
				))}
			</div>

			<div
				className={`absolute w-full flex flex-col items-center justify-center gap-3 transition-all duration-300 transform ${
					loading || success
						? "opacity-100 scale-100 delay-100"
						: "opacity-0 scale-105 pointer-events-none"
				}`}
			>
				{success ? (
					<>
						<div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
							<CheckCircle2 className="text-emerald-500" size={28} />
						</div>
						<span className="text-sm font-black text-slate-800 dark:text-white tracking-[0.2em] uppercase">
							접근 승인됨
						</span>
					</>
				) : (
					<>
						<Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={32} />
						<span className="text-sm font-black text-slate-600 dark:text-slate-300 tracking-[0.2em] uppercase">
							시스템 인증 중...
						</span>
					</>
				)}
			</div>
		</form>
	);
}
