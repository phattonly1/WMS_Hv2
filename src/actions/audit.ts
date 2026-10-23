"use server";

import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export interface GuardIssue {
	type: "orphan-file" | "unused-export" | "unused-package" | "env-mismatch";
	target: string;
	detail: string;
	line?: number;
}

export interface HardcodedViolation {
	type:
		| "color-hex"
		| "theme-missing-dark"
		| "fixed-width"
		| "hardcoded-url"
		| "hardcoded-secret"
		| "arbitrary-input-font"
		| "arbitrary-modal-width"
		| "arbitrary-modal-height"
		| "nested-scrollbar";
	file: string;
	line: number;
	snippet: string;
	detail: string;
	recommendation: string;
}

export interface DeploymentGuardReport {
	scannedAt: string;
	isReadyToDeploy: boolean;
	totalIssues: number;
	orphanFiles: GuardIssue[];
	unusedExports: GuardIssue[];
	unusedPackages: GuardIssue[];
	envIssues: GuardIssue[];
	hardcodedViolations: HardcodedViolation[];
}

export async function runDeploymentGuard(): Promise<DeploymentGuardReport> {
	const rootDir = process.cwd();

	// 1. Knip 실행 (미사용 파일, export, 패키지 감지)
	const knipJson = await new Promise<string>((resolve) => {
		exec(
			"npx knip --reporter json",
			{ cwd: rootDir, maxBuffer: 10 * 1024 * 1024 },
			(_err, stdout, stderr) => {
				if (stdout?.trim().startsWith("{")) {
					resolve(stdout.trim());
				} else if (stderr?.trim().startsWith("{")) {
					resolve(stderr.trim());
				} else {
					resolve('{"issues":[]}');
				}
			},
		);
	});

	interface RawKnip {
		files?: string[];
		dependencies?: Array<{ name: string; file: string }>;
		devDependencies?: Array<{ name: string; file: string }>;
		exports?: Array<{ name: string; file: string; line: number }>;
		types?: Array<{ name: string; file: string; line: number }>;
	}

	let parsed: RawKnip = {};
	try {
		parsed = JSON.parse(knipJson) as RawKnip;
	} catch {
		parsed = {};
	}

	// 고립된 파일
	const orphanFiles: GuardIssue[] = (parsed.files ?? []).map((f) => ({
		type: "orphan-file",
		target: f,
		detail: "어디서도 임포트되지 않는 불필요한 고립 파일입니다.",
	}));

	// 미사용 exports & types
	const unusedExports: GuardIssue[] = [
		...(parsed.exports ?? []).map((e) => ({
			type: "unused-export" as const,
			target: `${e.file} -> ${e.name}`,
			detail: `선언된 export 심볼 '${e.name}'이 외부에서 쓰이지 않습니다.`,
			line: e.line,
		})),
		...(parsed.types ?? []).map((t) => ({
			type: "unused-export" as const,
			target: `${t.file} -> ${t.name}`,
			detail: `선언된 type '${t.name}'이 어디서도 참조되지 않습니다.`,
			line: t.line,
		})),
	];

	// 미사용 패키지
	const unusedPackages: GuardIssue[] = [
		...(parsed.dependencies ?? []).map((d) => ({
			type: "unused-package" as const,
			target: d.name,
			detail:
				"package.json dependencies에 설치되어 있으나 코드에서 쓰이지 않습니다.",
		})),
		...(parsed.devDependencies ?? []).map((d) => ({
			type: "unused-package" as const,
			target: d.name,
			detail: "devDependencies에 설치되어 있으나 사용되지 않습니다.",
		})),
	];

	// 2. 환경변수 불일치 전수 조사 (.env.local vs process.env.*)
	const envIssues: GuardIssue[] = [];
	try {
		const envPath = path.join(rootDir, ".env.local");
		if (fs.existsSync(envPath)) {
			const declaredKeys = fs
				.readFileSync(envPath, "utf8")
				.split(/\r?\n/)
				.map((l) => l.trim())
				.filter((l) => l && !l.startsWith("#") && l.includes("="))
				.map((l) => l.split("=")[0]?.trim())
				.filter((k): k is string => Boolean(k));

			// scan src/ for process.env
			const findCodeEnvs = (dir: string): Set<string> => {
				const found = new Set<string>();
				if (!fs.existsSync(dir)) return found;
				const list = fs.readdirSync(dir);
				for (const f of list) {
					const full = path.join(dir, f);
					if (fs.statSync(full).isDirectory()) {
						const sub = findCodeEnvs(full);
						for (const s of sub) found.add(s);
					} else if (/\.(ts|tsx|js|jsx)$/.test(f)) {
						const txt = fs.readFileSync(full, "utf8");
						const matches = txt.matchAll(/process\.env\.([A-Z0-9_]+)/g);
						for (const m of matches) {
							if (m[1]) found.add(m[1]);
						}
					}
				}
				return found;
			};

			const codeRefs = findCodeEnvs(path.join(rootDir, "src"));

			// 코드에서 아직 안 쓰는 환경변수
			for (const k of declaredKeys) {
				if (!codeRefs.has(k)) {
					envIssues.push({
						type: "env-mismatch",
						target: k,
						detail:
							".env.local에 정의되어 있으나 실제 소스 코드에서 읽지 않습니다.",
					});
				}
			}
		}
	} catch {}

	// 3. 종합 하드코딩 정적 분석 검출기 (Color, Theme Variant, Fixed Width, URL, Secret)
	const hardcodedViolations: HardcodedViolation[] = [];

	const APPROVED_HEX_WHITELIST = new Set([
		"#09090b", "#111115", "#16161c", "#1a1a20", "#222228", "#33333e",
		"#2563eb", "#1d4ed8", "#1e40af", "#0284c7", "#38bdf8", "#06b6d4",
		"#10b981", "#059669", "#34d399", "#6ee7b7", "#f59e0b", "#f43f5e",
		"#ef4444", "#f87171", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe", "#eff6ff",
		"#18181b", "#27272a", "#3f3f46", "#52525b", "#71717a", "#fbbf24",
		"#facc15", "#ffffff", "#f4f4f5", "#d4d4d8", "#a1a1aa", "#000000",
		"#000", "#fff",
		// Light Mode M3 Tokens
		"#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b",
		"#475569", "#334155", "#1e293b", "#0f172a",
	]);

	const scanHardcoding = (dir: string) => {
		if (!fs.existsSync(dir)) return;
		const entries = fs.readdirSync(dir);
		for (const entry of entries) {
			const full = path.join(dir, entry);
			const stat = fs.statSync(full);
			if (stat.isDirectory()) {
				if (entry !== "node_modules" && entry !== ".next" && entry !== ".git") {
					scanHardcoding(full);
				}
			} else if (/\.(tsx|ts|html)$/.test(entry)) {
				const relPath = path.relative(rootDir, full).replace(/\\/g, "/");
				// 제외 대상:
				// 1. audit 자체 및 린터 스크립트
				// 2. 외부 포털 주입용 standalone 번들 (src/app/dashboard/launcher)
				// 3. 지도 지리정보 및 백터 렌더링 (단, UI 컴포넌트나 모달은 검증에 포함)
				// 4. 정적 CDN/SVG 네임스페이스 및 미디어 데이터 (video/data.ts)
				if (
					relPath.includes("actions/audit.ts") ||
					relPath.includes("scripts/audit") ||
					relPath.startsWith("src/app/dashboard/launcher/") ||
					relPath === "src/app/map/MapLibreView.tsx" ||
					relPath === "src/app/map/components/VectorMarkers.tsx" ||
					relPath === "src/app/map/stationData.ts" ||
					relPath.includes("video/data.ts")
				) {
					continue;
				}

				const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
				lines.forEach((lineText, idx) => {
					const lineNum = idx + 1;

					// A. 비인가 임의 HEX 색상 검출
					const hexMatches = lineText.match(/#[0-9a-fA-F]{3,8}\b/g);
					if (hexMatches) {
						for (const h of hexMatches) {
							if (!APPROVED_HEX_WHITELIST.has(h.toLowerCase())) {
								hardcodedViolations.push({
									type: "color-hex",
									file: relPath,
									line: lineNum,
									snippet: h,
									detail: `M3 디자인 시스템 비인가 임의 색상 '${h}' 감지`,
									recommendation: "승인된 M3 토큰 또는 CSS 변수를 사용하세요.",
								});
							}
						}
					}

					// B. 단독 다크모드 색상 (dark: 접두사 없는 다크 토큰 감지)
					if (
						/\b(bg-\[#(09090b|111115|16161c)\]|text-\[#(f4f4f5)\])\b/.test(
							lineText,
						) &&
						!lineText.includes("dark:") &&
						!lineText.includes("/* ignore-dark */")
					) {
						hardcodedViolations.push({
							type: "theme-missing-dark",
							file: relPath,
							line: lineNum,
							snippet: lineText.trim().slice(0, 60),
							detail: "dark: 접두사 없이 다크 토큰이 단독으로 하드코딩되어 라이트모드 미전환 유발",
							recommendation: "bg-white dark:bg-[#111115] 와 같이 라이트/다크 쌍으로 지정하세요.",
						});
					}

					// C. 레이아웃 파괴 고정 픽셀 너비 (w-[...px], min-w-[...px] > 400px - 단, w-[92vw] max-w-[...px] 등의 유동 뷰포트 너비는 제외)
					const fixedWidthMatch = lineText.match(
						/(?<!max-)\b(min-w|w)-\[(\d{3,4})px\]/,
					);
					if (fixedWidthMatch && Number(fixedWidthMatch[2]) >= 400) {
						hardcodedViolations.push({
							type: "fixed-width",
							file: relPath,
							line: lineNum,
							snippet: fixedWidthMatch[0],
							detail: `모바일 뷰포트 파괴 고정 너비 '${fixedWidthMatch[0]}' 감지`,
							recommendation: "w-full max-w-* 형태의 유동 너비를 적용하세요.",
						});
					}

					// D. 하드코딩된 외부 URL / IP 주소 검출 (표준 네임스페이스 및 CDN 제외)
					const urlMatch = lineText.match(/https?:\/\/(?!localhost\b)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
					if (
						urlMatch &&
						!lineText.includes("wms.waterkorea.or.kr") &&
						!lineText.includes("vworld.kr") &&
						!lineText.includes("openstreetmap.org") &&
						!lineText.includes("schema.org") &&
						!lineText.includes("w3.org") &&
						!lineText.includes("supabase.co") &&
						!lineText.includes("cloudflare.com") &&
						!lineText.includes("jsdelivr.net") &&
						!lineText.includes("sheetjs.com") &&
						!lineText.includes("r2.dev")
					) {
						hardcodedViolations.push({
							type: "hardcoded-url",
							file: relPath,
							line: lineNum,
							snippet: urlMatch[0],
							detail: `절대 외부 URL '${urlMatch[0]}' 하드코딩 감지`,
							recommendation: "process.env 환경변수로 추출하여 일원화하세요.",
						});
					}

					// E. 보안 키 / 시크릿 문자열 리터럴 의심 패턴
					if (
						/(service_role_key|secret_key|private_key)\s*[:=]\s*["'][a-zA-Z0-9_]{20,}["']/i.test(
							lineText,
						)
					) {
						hardcodedViolations.push({
							type: "hardcoded-secret",
							file: relPath,
							line: lineNum,
							snippet: `${lineText.trim().slice(0, 40)}...`,
							detail: "노출 위험 높은 시크릿/비밀키 리터럴 하드코딩 감지",
							recommendation: ".env.local 환경변수로 즉시 분리하세요.",
						});
					}

					// F. 인풋 폼/검색창의 임의 큰 폰트 크기 감지 (text-base, text-lg 등 하드코딩 차단 -> text-xs 표준 강제)
					if (
						(lineText.includes("<input") || lineText.includes("<textarea")) &&
						/\btext-(base|lg|xl|2xl)\b/.test(lineText)
					) {
						hardcodedViolations.push({
							type: "arbitrary-input-font",
							file: relPath,
							line: lineNum,
							snippet: lineText.trim().slice(0, 50),
							detail: "인풋 입력창에 전역 표준(text-xs)을 벗어난 큰 폰트 크기(text-base 등) 하드코딩 감지",
							recommendation: "입력창 폰트 크기를 Tailwind 전역 표준인 'text-xs'로 통일하세요.",
						});
					}

					// G. 임의 모달 너비 하드코딩 감지 (전역 Modal 규격 상속 강제)
					if (
						lineText.includes("<Modal") &&
						lineText.includes("maxWidth=") &&
						!relPath.includes("components/ui/modal.tsx") &&
						!relPath.includes("src/app/docs/modals/VideoModal.tsx")
					) {
						hardcodedViolations.push({
							type: "arbitrary-modal-width",
							file: relPath,
							line: lineNum,
							snippet: lineText.trim().slice(0, 50),
							detail: "전역 Modal 표준을 무시하고 개별 maxWidth를 하드코딩 지정함",
							recommendation: "개별 maxWidth 지정을 제거하고 전역 Modal 컴포넌트의 표준 크기를 상속받으세요.",
						});
					}

					// H. 임의 모달 레이아웃/세로 높이 하드코딩 감지 (전역 Modal 표준 규격 이탈 방지)
					if (
						(lineText.includes("sheetClassName=") || lineText.includes("containerClassName=")) &&
						!relPath.includes("components/ui/modal.tsx")
					) {
						hardcodedViolations.push({
							type: "arbitrary-modal-height",
							file: relPath,
							line: lineNum,
							snippet: lineText.trim().slice(0, 50),
							detail: "모달에 전역 Modal 표준을 무시하고 개별 sheetClassName/containerClassName을 하드코딩 지정함",
							recommendation: "개별 지정을 제거하고 전역 Modal 컴포넌트의 표준 규격을 100% 상속받으세요.",
						});
					}

					// I. 모달/컨테이너 내부 이중 세로 스크롤 의심 중복 감지
					if (
						lineText.includes("overflow-y-auto") &&
						(lineText.includes("max-h-[5") || lineText.includes("max-h-[6")) &&
						(relPath.includes("/modals/") || relPath.includes("/components/"))
					) {
						hardcodedViolations.push({
							type: "nested-scrollbar",
							file: relPath,
							line: lineNum,
							snippet: lineText.trim().slice(0, 50),
							detail: "컨테이너 내부에 중복된 overflow-y-auto 지정으로 이중 세로 스크롤바 유발",
							recommendation: "자식 요소의 overflow-y-auto를 제거하고 부모 Modal 스크롤 1개로 일원화하세요.",
						});
					}
				});
			}
		}
	};

	scanHardcoding(path.join(rootDir, "src"));

	const totalIssues =
		orphanFiles.length +
		unusedExports.length +
		unusedPackages.length +
		envIssues.length +
		hardcodedViolations.length;

	return {
		scannedAt: new Date().toISOString(),
		isReadyToDeploy: totalIssues === 0,
		totalIssues,
		orphanFiles,
		unusedExports,
		unusedPackages,
		envIssues,
		hardcodedViolations,
	};
}

export async function deleteTargetFile(
	relPath: string,
): Promise<{ success: boolean; message: string }> {
	try {
		const rootDir = process.cwd();
		const safeRel = relPath.replace(/^(\.\.[/\\])+/, "");
		const target = path.join(rootDir, safeRel);

		if (!fs.existsSync(target)) {
			return { success: false, message: "파일을 찾을 수 없습니다." };
		}

		fs.unlinkSync(target);
		return { success: true, message: `${safeRel} 파일이 정상 삭제되었습니다.` };
	} catch (err) {
		return { success: false, message: String(err) };
	}
}
