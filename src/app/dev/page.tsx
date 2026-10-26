"use client";

import {
	Activity,
	ArrowLeft,
	CheckCircle2,
	Code2,
	FileX,
	KeyRound,
	PackageX,
	Palette,
	RefreshCw,
	ShieldAlert,
	ShieldCheck,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
	type DeploymentGuardReport,
	deleteTargetFile,
	type GuardIssue,
	type HardcodedViolation,
	runDeploymentGuard,
} from "@/actions/audit";

export default function DeploymentGuardPage() {
	const [report, setReport] = useState<DeploymentGuardReport | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [deleting, setDeleting] = useState<string | null>(null);

	const checkGuard = useCallback(async () => {
		setLoading(true);
		try {
			const data = await runDeploymentGuard();
			setReport(data);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		checkGuard();
	}, [checkGuard]);

	const handleDelete = async (file: string) => {
		if (!confirm(`'${file}' 파일을 즉시 삭제하시겠습니까?`)) return;
		setDeleting(file);
		try {
			const res = await deleteTargetFile(file);
			if (!res.success) {
				alert(res.message);
				return;
			}
			await checkGuard();
		} finally {
			setDeleting(null);
		}
	};

	const isClean = report?.isReadyToDeploy;

	return (
		<div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] text-[#0f172a] dark:text-[#f4f4f5] p-6 md:p-10 font-sans relative transition-colors">
			{/* 배경 도트 매트릭스 그리드 */}
			<div
				className="absolute inset-0 pointer-events-none opacity-[0.03] dark:invert"
				style={{
					backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
					backgroundSize: "20px 20px",
				}}
			/>

			<div className="max-w-5xl mx-auto space-y-6 relative z-10">
				{/* 1. 상단 내비게이션 바 (Surface Container & Tactile) */}
				<header className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors">
					<div className="flex items-center gap-3">
						<Link
							href="/dashboard"
							className="p-2.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-[#f4f4f5] transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
						</Link>
						<div>
							<h1 className="text-base sm:text-lg font-bold tracking-tight text-[#0f172a] dark:text-[#f4f4f5]">
								배포 무결성 검증기
							</h1>
							<p className="text-xs text-[#64748b] dark:text-[#a1a1aa] mt-0.5">
								미사용 파일 · 패키지 누락 · 디자인 토큰 규칙 검사
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<ThemeToggle />

						<button
							type="button"
							onClick={checkGuard}
							disabled={loading}
							className="px-4 py-2 rounded-xl bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_8px_rgba(37,99,235,0.3)] transition-all cursor-pointer"
						>
							<RefreshCw
								className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
							/>
							<span>재검증 실행</span>
						</button>
					</div>
				</header>

				{/* 2. 메인 배포 승인 신호등 배너 (Bento Hero) */}
				{report && (
					<div
						className={`p-6 rounded-2xl border transition-all ${
							isClean
								? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
								: "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
						}`}
					>
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div className="flex items-center gap-4">
								<div
									className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
										isClean
											? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
											: "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
									}`}
								>
									{isClean ? (
										<ShieldCheck className="w-7 h-7" />
									) : (
										<ShieldAlert className="w-7 h-7" />
									)}
								</div>
								<div>
									<div className="text-[11px] font-mono font-bold uppercase tracking-wider opacity-80">
										{isClean
											? "GATE STATUS: READY TO DEPLOY"
											: "GATE STATUS: BLOCKED"}
									</div>
									<div className="text-xl font-bold text-[#0f172a] dark:text-[#f4f4f5] mt-0.5">
										{isClean
											? "불필요한 코드 및 하드코딩 0건: 배포 승인 완료"
											: `무결성 위반 ${report.totalIssues}건 감지: 배포 전 정리가 필요합니다`}
									</div>
								</div>
							</div>

							<div className="text-right font-mono text-xs text-[#64748b] dark:text-[#a1a1aa]">
								<div>SCANNER: KNIP & STATIC TOKEN GUARD</div>
								<div className="text-[11px] mt-0.5">
									{new Date(report.scannedAt).toLocaleTimeString()}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* 3. 5대 감시 지표 벤토 그리드 */}
				<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
					<div className="p-4 rounded-2xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
						<div className="flex items-center justify-between text-xs text-[#64748b] dark:text-[#a1a1aa]">
							<span>하드코딩 위반</span>
							<Palette className="w-4 h-4 text-purple-500 dark:text-purple-400" />
						</div>
						<div className="text-2xl font-bold font-mono text-[#0f172a] dark:text-[#f4f4f5] mt-2">
							{report?.hardcodedViolations?.length ?? 0}
						</div>
						<div className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] mt-0.5">
							HARDCODED
						</div>
					</div>

					<div className="p-4 rounded-2xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
						<div className="flex items-center justify-between text-xs text-[#64748b] dark:text-[#a1a1aa]">
							<span>고립된 파일</span>
							<FileX className="w-4 h-4 text-rose-500 dark:text-rose-400" />
						</div>
						<div className="text-2xl font-bold font-mono text-[#0f172a] dark:text-[#f4f4f5] mt-2">
							{report?.orphanFiles.length ?? 0}
						</div>
						<div className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] mt-0.5">
							UNREFERENCED
						</div>
					</div>

					<div className="p-4 rounded-2xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
						<div className="flex items-center justify-between text-xs text-[#64748b] dark:text-[#a1a1aa]">
							<span>죽은 코드 (Exports)</span>
							<Code2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
						</div>
						<div className="text-2xl font-bold font-mono text-[#0f172a] dark:text-[#f4f4f5] mt-2">
							{report?.unusedExports.length ?? 0}
						</div>
						<div className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] mt-0.5">
							UNUSED SYMBOLS
						</div>
					</div>

					<div className="p-4 rounded-2xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
						<div className="flex items-center justify-between text-xs text-[#64748b] dark:text-[#a1a1aa]">
							<span>미사용 패키지</span>
							<PackageX className="w-4 h-4 text-sky-500 dark:text-sky-400" />
						</div>
						<div className="text-2xl font-bold font-mono text-[#0f172a] dark:text-[#f4f4f5] mt-2">
							{report?.unusedPackages.length ?? 0}
						</div>
						<div className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] mt-0.5">
							PACKAGE.JSON
						</div>
					</div>

					<div className="p-4 rounded-2xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
						<div className="flex items-center justify-between text-xs text-[#64748b] dark:text-[#a1a1aa]">
							<span>환경변수 불일치</span>
							<KeyRound className="w-4 h-4 text-blue-500 dark:text-blue-400" />
						</div>
						<div className="text-2xl font-bold font-mono text-[#0f172a] dark:text-[#f4f4f5] mt-2">
							{report?.envIssues.length ?? 0}
						</div>
						<div className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] mt-0.5">
							.ENV.LOCAL
						</div>
					</div>
				</div>

				{/* 4. 감지된 이슈 상세 리스트 */}
				<div className="space-y-4">
					{/* 하드코딩 위반 리스트 */}
					{report?.hardcodedViolations && report.hardcodedViolations.length > 0 && (
						<div className="p-5 rounded-2xl bg-white dark:bg-[#111115] border border-purple-500/30 space-y-3">
							<div className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center justify-between">
								<span className="flex items-center gap-1.5">
									<Palette className="w-4 h-4" />
									하드코딩 위반 검출 ({report.hardcodedViolations.length}개)
								</span>
								<span className="text-[11px] font-mono">
									색상 / 단독 다크 / 레이아웃 / 보안 점검 필요
								</span>
							</div>
							<div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
								{report.hardcodedViolations.map((v: HardcodedViolation, i: number) => (
									<div
										key={`${v.file}-${v.line}-${i}`}
										className="p-3 rounded-xl bg-[#f8fafc] dark:bg-[#09090b] border border-[#e2e8f0] dark:border-[#222228] text-xs space-y-1"
									>
										<div className="flex items-center justify-between gap-2">
											<span className="font-mono text-purple-600 dark:text-purple-400 font-bold truncate">
												{v.file}:{v.line}
											</span>
											<span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 whitespace-nowrap">
												{v.type}
											</span>
										</div>
										<div className="text-[#0f172a] dark:text-[#f4f4f5] font-semibold break-keep">
											{v.detail}
										</div>
										<div className="font-mono text-[11px] bg-black/5 dark:bg-white/5 p-1.5 rounded text-[#475569] dark:text-[#d4d4d8] truncate">
											코드: {v.snippet}
										</div>
										<div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
											💡 권장: {v.recommendation}
										</div>
									</div>
								))}
							</div>
						</div>
					)}
					{/* 고립된 파일 리스트 */}
					{report && report.orphanFiles.length > 0 && (
						<div className="p-5 rounded-2xl bg-white dark:bg-[#111115] border border-rose-500/30 space-y-3">
							<div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-between">
								<span className="flex items-center gap-1.5">
									<FileX className="w-4 h-4" />
									고립된 불필요 파일 ({report.orphanFiles.length}개)
								</span>
								<span className="text-[11px] font-mono">
									배포 전 즉시 삭제 권장
								</span>
							</div>
							<div className="space-y-2">
								{report.orphanFiles.map((issue: GuardIssue) => (
									<div
										key={issue.target}
										className="flex items-center justify-between p-3 rounded-xl bg-[#f8fafc] dark:bg-[#09090b] border border-[#e2e8f0] dark:border-[#222228] text-xs"
									>
										<div>
											<div className="font-mono text-[#0f172a] dark:text-[#f4f4f5] font-semibold">
												{issue.target}
											</div>
											<div className="text-[#64748b] dark:text-[#a1a1aa] text-[11px] mt-0.5">
												{issue.detail}
											</div>
										</div>
										<button
											type="button"
											onClick={() => handleDelete(issue.target)}
											disabled={deleting === issue.target}
											className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
										>
											<Trash2 className="w-3.5 h-3.5" />
											삭제
										</button>
									</div>
								))}
							</div>
						</div>
					)}

					{/* 죽은 Export 리스트 */}
					{report && report.unusedExports.length > 0 && (
						<div className="p-5 rounded-2xl bg-white dark:bg-[#111115] border border-amber-500/30 space-y-3">
							<div className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
								<Code2 className="w-4 h-4" />
								미사용 Export 및 타입 ({report.unusedExports.length}개)
							</div>
							<div className="space-y-1.5">
								{report.unusedExports.map((issue: GuardIssue) => (
									<div
										key={`${issue.target}:${issue.line ?? 0}`}
										className="p-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#09090b] border border-[#e2e8f0] dark:border-[#222228] text-xs flex items-center justify-between"
									>
										<span className="font-mono text-amber-600 dark:text-amber-300 font-semibold">
											{issue.target}
										</span>
										<span className="text-[#64748b] dark:text-[#a1a1aa] text-[11px] font-mono">
											{issue.detail}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* 미사용 환경변수 리스트 */}
					{report && report.envIssues.length > 0 && (
						<div className="p-5 rounded-2xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] space-y-3">
							<div className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
								<KeyRound className="w-4 h-4" />
								코드에서 아직 사용하지 않는 환경변수 ({report.envIssues.length}개)
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
								{report.envIssues.map((issue: GuardIssue) => (
									<div
										key={issue.target}
										className="p-3 rounded-xl bg-[#f8fafc] dark:bg-[#09090b] border border-[#e2e8f0] dark:border-[#222228] text-xs flex items-center justify-between"
									>
										<span className="font-mono text-sky-600 dark:text-sky-300 font-semibold">
											{issue.target}
										</span>
										<span className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa]">
											.env.local 정의됨
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* 100% 클린 상태 */}
					{isClean && (
						<div className="p-10 rounded-2xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] text-center space-y-3 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
							<div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
								<CheckCircle2 className="w-6 h-6" />
							</div>
							<div className="text-base font-bold text-[#0f172a] dark:text-[#f4f4f5]">
								모든 배포 무결성 기준을 통과했습니다
							</div>
							<p className="text-xs text-[#64748b] dark:text-[#a1a1aa] max-w-md mx-auto">
								하드코딩 위반, 고립된 파일, 죽은 export, 미사용 패키지가 없습니다.
							</p>
						</div>
					)}
				</div>

				{/* 푸터 */}
				<footer className="pt-4 border-t border-[#e2e8f0] dark:border-[#222228] flex items-center justify-between text-[11px] font-mono text-[#64748b] dark:text-[#a1a1aa]">
					<div className="flex items-center gap-3">
						<span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
							<Activity className="w-3.5 h-3.5" />
							STATIC CODE GUARD
						</span>
						<span>·</span>
						<span>M3 MULTI-OBJECT AUDITOR</span>
					</div>
					<div>WMS 2.0 배포 전 품질 보증 시스템</div>
				</footer>
			</div>
		</div>
	);
}
