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
			className={`w-9 h-9 min-w-9 min-h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm ${
				isDark
					? "bg-[#16161c] border-[#222228] text-[#a1a1aa] hover:text-white hover:bg-[#27272a]"
					: "bg-white border-[#e2e8f0] text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]"
			} ${className}`}
			title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
			aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
		>
			{isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
		</button>
	);
}
