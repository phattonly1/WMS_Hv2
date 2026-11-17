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
			className={`w-8 h-8 min-w-8 min-h-8 rounded-lg border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
				isDark
					? "bg-[#16161c] border-[#222228] text-[#a1a1aa] hover:text-white hover:bg-white/10"
					: "bg-[#f1f5f9] border-[#e2e8f0] text-[#64748b] hover:text-[#0f172a] hover:bg-black/5"
			} ${className}`}
			title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
			aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
		>
			{isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
		</button>
	);
}
