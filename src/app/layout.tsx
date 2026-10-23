import type { ReactNode } from "react";
import type { Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata = {
	title: "국가수질자동측정망 - 한강수계",
	description: "국가수질자동측정망 통합 관제 시스템",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="ko" suppressHydrationWarning className="dark">
			<head>
				<link
					rel="preload"
					as="style"
					href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendard-gov-variable.min.css"
				/>
				<link
					rel="stylesheet"
					href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendard-gov-variable.min.css"
				/>
				<script>
					{`try {
						var s = localStorage.getItem('wms-theme');
						if (s === 'light') {
							document.documentElement.classList.remove('dark');
						} else {
							document.documentElement.classList.add('dark');
						}
					} catch (e) {}`}
				</script>
			</head>
			<body>
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	);
}
