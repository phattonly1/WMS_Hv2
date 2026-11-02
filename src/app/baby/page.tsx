"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Maximize, Minimize, Sparkles, Volume2, VolumeX } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface FloatingElement {
	id: number;
	char: string;
	x: number;
	y: number;
	color: string;
	rotation: number;
	scale: number;
	isSpecialEmoji?: boolean;
}

const BG_PALETTES = [
	"from-pink-300 via-purple-300 to-indigo-400",
	"from-yellow-200 via-orange-300 to-pink-400",
	"from-emerald-200 via-teal-300 to-cyan-400",
	"from-violet-300 via-fuchsia-300 to-rose-300",
	"from-sky-300 via-blue-300 to-indigo-400",
	"from-lime-200 via-green-300 to-emerald-400",
	"from-amber-200 via-rose-300 to-violet-300",
	"from-teal-200 via-sky-300 to-purple-300",
];

const TEXT_COLORS = [
	"#f43f5e", // Rose 500
	"#f59e0b", // Amber 500
	"#fbbf24", // Amber 400 Soft
	"#10b981", // Emerald 500
	"#06b6d4", // Water Cyan Accent
	"#38bdf8", // Sky 500 Info
	"#2563eb", // Glacier Cobalt Primary
	"#60a5fa", // Blue Telemetry
	"#f87171", // Rose Soft Text
	"#34d399", // Emerald Soft Text
];

const FUN_EMOJIS = [
	"⭐",
	"🌟",
	"🎈",
	"🎉",
	"🐶",
	"🐱",
	"🐰",
	"🐻",
	"🐼",
	"🦁",
	"🐯",
	"🐸",
	"🐵",
	"🦄",
	"🌈",
	"🍎",
	"🍓",
	"🍌",
	"🚗",
	"🚀",
	"⚽",
	"🎸",
	"🍦",
	"🍭",
	"🌻",
	"🦖",
	"🐠",
	"🦋",
	"💖",
	"✨",
];

// 간단한 실로폰/물방울 사운드 (Web Audio API)
const NOTES = [
	261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25,
	783.99, 880.0,
];

export default function BabyPlayPage() {
	const [bgIndex, setBgIndex] = useState(0);
	const [elements, setElements] = useState<FloatingElement[]>([]);
	const [mainChar, setMainChar] = useState<string>("👶");
	const [soundEnabled, setSoundEnabled] = useState(true);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [showToolbar, setShowToolbar] = useState(true);

	const audioCtxRef = useRef<AudioContext | null>(null);
	const nextIdRef = useRef(1);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const lastInputTimeRef = useRef(0);
	const INPUT_THROTTLE_MS = 180; // 연속 입력 제한 (180ms 이내의 연타/키 누르고 있기 무시)

	// Audio Context 초기화 및 소리 재생
	const playTone = useCallback(() => {
		if (!soundEnabled) return;

		try {
			if (!audioCtxRef.current) {
				const AudioContextClass =
					window.AudioContext ||
					(window as unknown as { webkitAudioContext: typeof AudioContext })
						.webkitAudioContext;
				audioCtxRef.current = new AudioContextClass();
			}
			if (audioCtxRef.current.state === "suspended") {
				audioCtxRef.current.resume();
			}

			const ctx = audioCtxRef.current;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			const randomFreq = NOTES[Math.floor(Math.random() * NOTES.length)] ?? 440;
			osc.type = "sine";
			osc.frequency.setValueAtTime(randomFreq, ctx.currentTime);

			// 통통 튀는 벨/실로폰 느낌의 Envelope
			gain.gain.setValueAtTime(0.3, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

			osc.connect(gain);
			gain.connect(ctx.destination);

			osc.start();
			osc.stop(ctx.currentTime + 0.45);
		} catch {
			// 오디오 미지원 환경 예외 무시
		}
	}, [soundEnabled]);

	// 글자/이모지 팝업 트리거
	const spawnElement = useCallback(
		(char: string, posX?: number, posY?: number) => {
			playTone();

			// 배경색 변경
			setBgIndex((prev) => (prev + 1) % BG_PALETTES.length);
			setMainChar(char);

			const x = posX ?? Math.random() * 80 + 10; // 10% ~ 90%
			const y = posY ?? Math.random() * 70 + 15; // 15% ~ 85%
			const color =
				TEXT_COLORS[Math.floor(Math.random() * TEXT_COLORS.length)] ??
				"#2563eb";
			const rotation = (Math.random() - 0.5) * 60; // -30도 ~ +30도
			const scale = Math.random() * 0.4 + 0.9; // 0.9 ~ 1.3

			const newElem: FloatingElement = {
				id: nextIdRef.current++,
				char,
				x,
				y,
				color,
				rotation,
				scale,
			};

			setElements((prev) => [...prev.slice(-15), newElem]); // 최근 15개까지만 유지
		},
		[playTone],
	);

	// 키보드 이벤트 핸들러
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// 뒤로가기, 탭, 알트키 조합 등 기본 시스템 브라우저 동작 방지 (아기 탈출 방지용)
			if (
				e.key === "Backspace" ||
				e.key === "Tab" ||
				e.key === "Alt" ||
				e.key === "F5" ||
				(e.ctrlKey && (e.key === "w" || e.key === "r" || e.key === "q"))
			) {
				e.preventDefault();
			}

			// 1. 키보드를 꾹 누르고 있을 때 발생하는 자동 반복(auto-repeat) 방지
			if (e.repeat) {
				return;
			}

			// 2. 아기가 양손으로 초고속 연타하거나 여러 키를 뭉개 눌렀을 때의 쓰로틀링(연속 입력 제한)
			const now = Date.now();
			if (now - lastInputTimeRef.current < INPUT_THROTTLE_MS) {
				return;
			}
			lastInputTimeRef.current = now;

			// 표시할 텍스트 결정
			let displayChar = "";

			if (e.key === " " || e.key === "Enter") {
				displayChar =
					FUN_EMOJIS[Math.floor(Math.random() * FUN_EMOJIS.length)] ?? "⭐";
			} else if (e.key.length === 1) {
				displayChar = e.key.toUpperCase();
			} else {
				// 화살표나 특수 기능키를 누른 경우 동물/별 이모티콘 팡팡
				displayChar =
					FUN_EMOJIS[Math.floor(Math.random() * FUN_EMOJIS.length)] ?? "⭐";
			}

			spawnElement(displayChar);
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [spawnElement]);

	// 화면 터치 / 클릭 시에도 작동
	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		// 툴바 클릭 시 제외
		if ((e.target as HTMLElement).closest(".baby-toolbar")) return;

		const x = (e.clientX / window.innerWidth) * 100;
		const y = (e.clientY / window.innerHeight) * 100;
		const randomEmoji =
			FUN_EMOJIS[Math.floor(Math.random() * FUN_EMOJIS.length)] ?? "👶";
		spawnElement(randomEmoji, x, y);
	};

	// 전체화면 토글
	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch(() => {});
			setIsFullscreen(true);
		} else {
			document.exitFullscreen().catch(() => {});
			setIsFullscreen(false);
		}
	};

	// 마우스 움직임 감지 시 툴바 잠시 표시 후 숨김
	const handleMouseMove = () => {
		setShowToolbar(true);
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => {
			setShowToolbar(false);
		}, 3000);
	};

	return (
		<div
			onPointerDown={handlePointerDown}
			onMouseMove={handleMouseMove}
			className={`fixed inset-0 w-screen h-screen overflow-hidden select-none cursor-pointer bg-gradient-to-br ${BG_PALETTES[bgIndex]} transition-colors duration-700 flex items-center justify-center`}
			style={{ touchAction: "none" }}
		>
			{/* 배경 장식 원형 버블들 */}
			<div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
				<div className="absolute w-96 h-96 -top-20 -left-20 bg-white rounded-full blur-3xl animate-pulse" />
				<div className="absolute w-80 h-80 -bottom-20 -right-20 bg-white rounded-full blur-2xl animate-pulse" />
			</div>

			{/* 중앙 메인 대형 글자/이모지 */}
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
				<AnimatePresence mode="popLayout">
					<motion.div
						key={`main-${mainChar}-${nextIdRef.current}`}
						initial={{ scale: 0.2, rotate: -25, opacity: 0 }}
						animate={{ scale: 1, rotate: 0, opacity: 1 }}
						exit={{ scale: 1.5, opacity: 0 }}
						transition={{ type: "spring", stiffness: 350, damping: 15 }}
						className="text-[28vw] md:text-[22vw] font-black drop-shadow-2xl flex items-center justify-center leading-none"
						style={{
							textShadow: "0 15px 30px rgba(0,0,0,0.2)",
							filter: "drop-shadow(0 10px 20px rgba(255,255,255,0.4))",
						}}
					>
						{mainChar}
					</motion.div>
				</AnimatePresence>
			</div>

			{/* 흩뿌려지는 파티클 요소들 */}
			<AnimatePresence>
				{elements.map((item) => (
					<motion.div
						key={item.id}
						initial={{
							left: `${item.x}vw`,
							top: `${item.y}vh`,
							scale: 0.1,
							opacity: 1,
							rotate: 0,
						}}
						animate={{
							scale: item.scale,
							rotate: item.rotation,
							opacity: 0.85,
							top: `${item.y - 10}vh`, // 살짝 위로 둥둥 떠오름
						}}
						exit={{
							scale: 0,
							opacity: 0,
							transition: { duration: 0.5 },
						}}
						transition={{ type: "spring", stiffness: 200, damping: 18 }}
						className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none font-extrabold text-6xl md:text-8xl"
						style={{
							color: item.color,
							textShadow:
								"3px 3px 0 #fff, -3px -3px 0 #fff, 3px -3px 0 #fff, -3px 3px 0 #fff",
						}}
					>
						{item.char}
					</motion.div>
				))}
			</AnimatePresence>

			{/* 상단/하단 안내 문구 */}
			<div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none opacity-60 text-white font-bold text-lg md:text-xl drop-shadow">
				키보드를 마구 눌러보세요! 터치도 돼요 🎈
			</div>

			{/* 부모용 컨트롤 바 (마우스 올리면 나타남) */}
			<motion.div
				initial={false}
				animate={{ opacity: showToolbar ? 1 : 0, y: showToolbar ? 0 : -20 }}
				transition={{ duration: 0.3 }}
				className="baby-toolbar absolute top-5 right-5 flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/50 z-50"
			>
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						setSoundEnabled(!soundEnabled);
					}}
					className="p-2 rounded-full hover:bg-black/5 text-gray-700 transition"
					title={soundEnabled ? "소리 끄기" : "소리 켜기"}
				>
					{soundEnabled ? (
						<Volume2 className="w-6 h-6 text-emerald-600" />
					) : (
						<VolumeX className="w-6 h-6 text-gray-400" />
					)}
				</button>

				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						toggleFullscreen();
					}}
					className="p-2 rounded-full hover:bg-black/5 text-gray-700 transition"
					title={isFullscreen ? "전체화면 종료" : "전체화면 모드"}
				>
					{isFullscreen ? (
						<Minimize className="w-6 h-6" />
					) : (
						<Maximize className="w-6 h-6" />
					)}
				</button>

				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						spawnElement(
							FUN_EMOJIS[Math.floor(Math.random() * FUN_EMOJIS.length)] ?? "✨",
						);
					}}
					className="p-2 rounded-full hover:bg-black/5 text-amber-500 transition"
					title="랜덤 이모지"
				>
					<Sparkles className="w-6 h-6" />
				</button>
			</motion.div>
		</div>
	);
}
