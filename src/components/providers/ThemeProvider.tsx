"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
	theme: Theme;
	toggleTheme: () => void;
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>("dark");

	useEffect(() => {
		// 로컬스토리지 또는 시스템 설정 확인
		const savedTheme = localStorage.getItem("wms-theme") as Theme | null;
		if (savedTheme === "light" || savedTheme === "dark") {
			setThemeState(savedTheme);
			document.documentElement.classList.toggle("dark", savedTheme === "dark");
		} else {
			// 기본값은 다크모드
			setThemeState("dark");
			document.documentElement.classList.add("dark");
		}
	}, []);

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
		localStorage.setItem("wms-theme", newTheme);
		document.documentElement.classList.toggle("dark", newTheme === "dark");
	};

	const toggleTheme = () => {
		const nextTheme = theme === "dark" ? "light" : "dark";
		setTheme(nextTheme);
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
