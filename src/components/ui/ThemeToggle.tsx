"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";

interface ThemeToggleProps {
	className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
	const { theme, toggleTheme } = useTheme();
	const isDark = theme === "dark";

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className={`w-9 h-9 min-w-9 min-h-9 rounded-xl border border-[#d7dfe9] dark:border-[#2a2a32] bg-[#f1f5f9] dark:bg-[#16161c] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-all active:scale-95 cursor-pointer ${className}`}
			title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
			aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
		>
			{isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
		</button>
	);
}
