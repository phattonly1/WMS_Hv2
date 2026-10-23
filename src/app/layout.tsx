import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata = {
	title: "국가수질자동측정망 - 한강수계",
	description: "국가수질자동측정망 통합 관제 시스템",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="ko" suppressHydrationWarning className="dark">
			<head>
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
