"use client";

import {
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	Download,
	LayoutGrid,
	Loader2,
	SunMoon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { getManualSignedUrl } from "@/utils/supabase/storageActions";
import { DocsPinGate } from "../components/DocsPinGate";

const PDFJS_VERSION = "3.11.174";
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

declare global {
	interface Window {
		pdfjsLib?: any;
	}
}

function loadPdfJs(): Promise<any> {
	if (typeof window === "undefined") return Promise.reject();
	if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);

	return new Promise((resolve, reject) => {
		const existing = document.querySelector(
			`script[src="${PDFJS_CDN}"]`,
		) as HTMLScriptElement | null;
		if (existing) {
			existing.addEventListener("load", () => resolve(window.pdfjsLib));
			existing.addEventListener("error", reject);
			return;
		}
		const script = document.createElement("script");
		script.src = PDFJS_CDN;
		script.async = true;
		script.onload = () => {
			if (window.pdfjsLib) {
				window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
				resolve(window.pdfjsLib);
			} else {
				reject(new Error("PDF.js 로드 실패"));
			}
		};
		script.onerror = () => reject(new Error("PDF.js 스크립트 로드 오류"));
		document.head.appendChild(script);
	});
}

/**
 * 화면에 보이는 카드만 조각내서(Range 요청) 그리는 지연 렌더링 썸네일 카드
 */
function ThumbnailCard({
	pdfDoc,
	pageNumber,
	isActive,
	isInverted,
	cachedDataUrl,
	onCacheThumb,
	onSelect,
}: {
	pdfDoc: any;
	pageNumber: number;
	isActive: boolean;
	isInverted: boolean;
	cachedDataUrl?: string;
	onCacheThumb: (page: number, dataUrl: string) => void;
	onSelect: (page: number) => void;
}) {
	const cardRef = useRef<HTMLButtonElement | null>(null);
	const [isVisible, setIsVisible] = useState(false);
	const [thumbUrl, setThumbUrl] = useState<string | null>(
		cachedDataUrl || null,
	);

	useEffect(() => {
		if (thumbUrl) return;
		const el = cardRef.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "180px" },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [thumbUrl]);

	useEffect(() => {
		if (!isVisible || thumbUrl || !pdfDoc) return;
		let cancelled = false;
		let renderTask: any = null;

		(async () => {
			try {
				const page = await pdfDoc.getPage(pageNumber);
				if (cancelled) return;

				const unscaled = page.getViewport({ scale: 1 });
				const targetWidth = 220;
				const scale = targetWidth / unscaled.width;
				const viewport = page.getViewport({ scale });

				const offscreen = document.createElement("canvas");
				offscreen.width = Math.floor(viewport.width);
				offscreen.height = Math.floor(viewport.height);
				const ctx = offscreen.getContext("2d");
				if (!ctx) return;

				renderTask = page.render({ canvasContext: ctx, viewport });
				await renderTask.promise;
				if (cancelled) return;

				const dataUrl = offscreen.toDataURL("image/jpeg", 0.8);
				setThumbUrl(dataUrl);
				onCacheThumb(pageNumber, dataUrl);
			} catch {
				// ignore cancelled render
			}
		})();

		return () => {
			cancelled = true;
			if (renderTask) {
				try {
					renderTask.cancel();
				} catch {
					// ignore
				}
			}
		};
	}, [isVisible, thumbUrl, pdfDoc, pageNumber, onCacheThumb]);

	return (
		<button
			ref={cardRef}
			id={`pdf-thumb-${pageNumber}`}
			type="button"
			onClick={() => onSelect(pageNumber)}
			className={`group flex flex-col items-center rounded-xl p-1.5 transition-all active:scale-95 border text-center cursor-pointer ${
				isActive
					? "bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/40 shadow-lg"
					: "bg-white dark:bg-[#16161c] hover:bg-[#f1f5f9] dark:hover:bg-[#16161c] border-[#d7dfe9] dark:border-[#2a2a32] hover:border-blue-500/40 dark:hover:border-white/20"
			}`}
		>
			<div className="w-full aspect-[1/1.414] rounded-lg bg-white/95 overflow-hidden flex items-center justify-center relative shadow-xs">
				{thumbUrl ? (
					// biome-ignore lint/performance/noImgElement: DataURL 썸네일 직접 표시
					<img
						src={thumbUrl}
						alt={`${pageNumber}쪽 미리보기`}
						className="w-full h-full object-contain"
						style={
							isInverted
								? { filter: "invert(1) hue-rotate(180deg) contrast(0.95)" }
								: undefined
						}
					/>
				) : (
					<div className="flex flex-col items-center justify-center gap-1 text-[#64748b]">
						<Loader2 size={16} className="animate-spin text-blue-500/70" />
						<span className="text-[10px] font-semibold tabular-nums">
							{pageNumber}
						</span>
					</div>
				)}
			</div>
			<span
				className={`mt-1.5 text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md ${
					isActive
						? "bg-blue-600 text-white"
						: "text-[#64748b] dark:text-[#a1a1aa] group-hover:text-[#0f172a] dark:group-hover:text-white"
				}`}
			>
				{pageNumber}쪽
			</span>
		</button>
	);
}

function PdfViewerContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const filePath = searchParams.get("path") || "";
	const bucket = searchParams.get("bucket") || "Manual";
	const fileName = searchParams.get("name") || "문서 미리보기";

	const [pdfDoc, setPdfDoc] = useState<any>(null);
	const [pageNum, setPageNum] = useState(1);
	const [numPages, setNumPages] = useState(0);
	const [zoom, setZoom] = useState(1);
	const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
	const [isGridOpen, setIsGridOpen] = useState(false);
	const [isInverted, setIsInverted] = useState<boolean>(() => {
		if (typeof window === "undefined") return false;
		try {
			return window.localStorage.getItem("wms_pdf_invert") === "true";
		} catch {
			return false;
		}
	});
	const toggleInvert = useCallback(() => {
		setIsInverted((prev) => {
			const next = !prev;
			try {
				window.localStorage.setItem("wms_pdf_invert", String(next));
			} catch {
				// ignore
			}
			return next;
		});
	}, []);
	const [loadProgress, setLoadProgress] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [thumbCache, setThumbCache] = useState<Record<number, string>>({});

	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const renderTaskRef = useRef<any>(null);
	const loadingTaskRef = useRef<any>(null);

	const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
		null,
	);
	const lastTouchEndTimeRef = useRef<number>(0);
	const pinchRef = useRef<{
		initialDist: number;
		initialZoom: number;
		currentScale: number;
	} | null>(null);

	const handleCacheThumb = useCallback((p: number, dataUrl: string) => {
		setThumbCache((prev) => (prev[p] ? prev : { ...prev, [p]: dataUrl }));
	}, []);

	// 1. PDF 문서 초기 로드 (일회용 자동 만료 Signed URL 발급으로 Vercel 중계 없이 직통 로드)
	useEffect(() => {
		if (!filePath) {
			setError("유효한 PDF 경로가 없습니다.");
			setIsLoading(false);
			return;
		}

		let cancelled = false;
		setIsLoading(true);
		setError(null);
		setLoadProgress(0);
		setPageNum(1);
		setZoom(1);
		setIsGridOpen(false);
		setThumbCache({});

		(async () => {
			try {
				const [pdfjsLib, signedRes] = await Promise.all([
					loadPdfJs(),
					getManualSignedUrl(filePath, bucket, 300),
				]);
				if (cancelled) return;

				if (!signedRes.success || !signedRes.signedUrl) {
					setError(signedRes.error || "일회용 열람 권한을 발급받지 못했습니다.");
					setIsLoading(false);
					return;
				}

				const loadingTask = pdfjsLib.getDocument({
					url: signedRes.signedUrl,
					rangeChunkSize: 65536 * 2,
					disableAutoFetch: true,
					disableStream: false,
					cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/cmaps/`,
					cMapPacked: true,
				});
				loadingTaskRef.current = loadingTask;

				loadingTask.onProgress = (p: { loaded: number; total: number }) => {
					if (!cancelled && p.total > 0) {
						setLoadProgress(
							Math.min(99, Math.round((p.loaded / p.total) * 100)),
						);
					}
				};

				const doc = await loadingTask.promise;
				if (cancelled) {
					doc.destroy();
					return;
				}
				setPdfDoc(doc);
				setNumPages(doc.numPages);
				setIsLoading(false);
			} catch (err) {
				if (!cancelled) {
					console.error("PDF load error:", err);
					setError("PDF 문서를 불러오지 못했습니다.");
					setIsLoading(false);
				}
			}
		})();

		return () => {
			cancelled = true;
			if (renderTaskRef.current) {
				try {
					renderTaskRef.current.cancel();
				} catch {
					// ignore
				}
			}
			if (loadingTaskRef.current) {
				try {
					loadingTaskRef.current.destroy();
				} catch {
					// ignore
				}
			}
		};
	}, [filePath, bucket]);

	// 2. 본문 단일 페이지 렌더링
	const renderPage = useCallback(async () => {
		if (isGridOpen || !pdfDoc || !canvasRef.current || !containerRef.current)
			return;

		try {
			if (renderTaskRef.current) {
				try {
					renderTaskRef.current.cancel();
				} catch {
					// ignore
				}
			}

			const page = await pdfDoc.getPage(pageNum);
			const canvas = canvasRef.current;
			const container = containerRef.current;
			if (!canvas || !container) return;

			const maxW = Math.min(container.clientWidth - 16, 980);
			const unscaledViewport = page.getViewport({ scale: 1 });
			const fitScale = (Math.max(280, maxW) / unscaledViewport.width) * zoom;
			const viewport = page.getViewport({ scale: fitScale });

			const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
			canvas.width = Math.floor(viewport.width * dpr);
			canvas.height = Math.floor(viewport.height * dpr);
			canvas.style.width = `${Math.floor(viewport.width)}px`;
			canvas.style.height = `${Math.floor(viewport.height)}px`;

			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			const renderTask = page.render({
				canvasContext: ctx,
				viewport,
			});
			renderTaskRef.current = renderTask;
			await renderTask.promise;
		} catch (err: any) {
			if (err?.name !== "RenderingCancelledException") {
				console.error("PDF page render error:", err);
			}
		}
	}, [pdfDoc, pageNum, zoom, isGridOpen]);

	useEffect(() => {
		renderPage();
		const onResize = () => renderPage();
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, [renderPage]);

	// 3. 바둑판 모아보기(Grid) 열릴 때 현재 보고 있던 페이지 카드로 자동 스크롤
	useEffect(() => {
		if (isGridOpen) {
			requestAnimationFrame(() => {
				const activeEl = document.getElementById(`pdf-thumb-${pageNum}`);
				activeEl?.scrollIntoView({ block: "center", behavior: "instant" });
			});
		}
	}, [isGridOpen, pageNum]);

	// 4. 두 손가락 핀치 줌 시 브라우저 전체 화면 확대(하단바 이탈)를 막고 내부 PDF 캔버스만 확대하도록 non-passive touchmove 등록
	useEffect(() => {
		const el = containerRef.current;
		if (!el || isGridOpen) return;

		const handleNativeTouchMove = (e: TouchEvent) => {
			if (e.touches.length === 2 && pinchRef.current && canvasRef.current) {
				e.preventDefault();
				const t1 = e.touches[0]!;
				const t2 = e.touches[1]!;
				const dist = Math.hypot(
					t2.clientX - t1.clientX,
					t2.clientY - t1.clientY,
				);
				const rawRatio = dist / pinchRef.current.initialDist;
				const targetZoom = Math.min(
					3,
					Math.max(1, pinchRef.current.initialZoom * rawRatio),
				);
				const visualScale = targetZoom / pinchRef.current.initialZoom;
				pinchRef.current.currentScale = visualScale;
				canvasRef.current.style.transformOrigin = "center top";
				canvasRef.current.style.transform = `scale(${visualScale})`;
			}
		};

		el.addEventListener("touchmove", handleNativeTouchMove, { passive: false });
		return () => {
			el.removeEventListener("touchmove", handleNativeTouchMove);
		};
	}, [isGridOpen]);

	// 5. PC 키보드 화살표(←/→) 및 Esc 단축키 지원
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isGridOpen) {
				setIsGridOpen(false);
				return;
			}
			if (isGridOpen || isLoading || numPages <= 0) return;
			if (e.key === "ArrowLeft") {
				setPageNum((p) => Math.max(1, p - 1));
				containerRef.current?.scrollTo({ top: 0 });
			} else if (e.key === "ArrowRight") {
				setPageNum((p) => Math.min(numPages, p + 1));
				containerRef.current?.scrollTo({ top: 0 });
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isGridOpen, isLoading, numPages]);

	const handleDownload = async () => {
		if (!filePath) return;
		try {
			if (pdfDoc && typeof pdfDoc.getData === "function") {
				const uint8Array = await pdfDoc.getData();
				const blob = new Blob([uint8Array], { type: "application/pdf" });
				const blobUrl = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = blobUrl;
				a.download = fileName;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(blobUrl);
				return;
			}

			const signed = await getManualSignedUrl(filePath, bucket, 120);
			if (!signed.success || !signed.signedUrl) return;
			const res = await fetch(signed.signedUrl);
			if (!res.ok) throw new Error("다운로드 실패");
			const blob = await res.blob();
			const blobUrl = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = blobUrl;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(blobUrl);
		} catch {
			// ignore
		}
	};

	const handleClose = () => {
		if (isGridOpen) {
			setIsGridOpen(false);
			return;
		}
		if (window.history.length > 1) {
			router.back();
		} else {
			router.push("/docs");
		}
	};

	return (
		<div className="fixed inset-0 h-dvh w-full bg-[#f8fafc] dark:bg-[#09090b] text-[#0f172a] dark:text-white flex flex-col overflow-hidden overscroll-none select-none transition-colors">
			{/* 상단 바 없이 화면 전체를 쓰는 메인 뷰어 / 썸네일 그리드 영역 */}
			{isGridOpen && pdfDoc ? (
				<div className="flex-1 w-full overflow-y-auto overscroll-contain p-3 sm:p-5 bg-[#f8fafc] dark:bg-[#09090b] transition-colors">
					<div className="max-w-6xl mx-auto">
						<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3.5 pb-4">
							{Array.from({ length: numPages }, (_, idx) => idx + 1).map(
								(p) => (
									<ThumbnailCard
										key={p}
										pdfDoc={pdfDoc}
										pageNumber={p}
										isActive={p === pageNum}
										isInverted={isInverted}
										cachedDataUrl={thumbCache[p]}
										onCacheThumb={handleCacheThumb}
										onSelect={(selectedPage) => {
											setPageNum(selectedPage);
											setIsGridOpen(false);
											containerRef.current?.scrollTo({ top: 0 });
										}}
									/>
								),
							)}
						</div>
					</div>
				</div>
			) : (
				<main
					ref={containerRef}
					onTouchStart={(e) => {
						if (e.touches.length === 2) {
							const t1 = e.touches[0]!;
							const t2 = e.touches[1]!;
							const dist = Math.hypot(
								t2.clientX - t1.clientX,
								t2.clientY - t1.clientY,
							);
							pinchRef.current = {
								initialDist: Math.max(10, dist),
								initialZoom: zoom,
								currentScale: 1,
							};
							touchStartRef.current = null;
							return;
						}
						if (e.touches.length !== 1) return;
						const t = e.touches[0]!;
						touchStartRef.current = {
							x: t.clientX,
							y: t.clientY,
							time: Date.now(),
						};
					}}
					onTouchEnd={(e) => {
						lastTouchEndTimeRef.current = Date.now();
						if (pinchRef.current) {
							if (e.touches.length < 2) {
								const finalZoom = Number(
									Math.min(
										3,
										Math.max(
											1,
											pinchRef.current.initialZoom *
												pinchRef.current.currentScale,
										),
									).toFixed(2),
								);
								pinchRef.current = null;
								if (canvasRef.current) {
									canvasRef.current.style.transform = "";
								}
								setZoom(finalZoom);
							}
							return;
						}

						if (e.changedTouches.length !== 1) return;
						const t = e.changedTouches[0]!;
						const now = Date.now();

						const start = touchStartRef.current;
						const dx = start ? t.clientX - start.x : 0;
						const dy = start ? t.clientY - start.y : 0;

						// 1) 제자리 단일 탭(터치): 화면 좌측 절반 -> 이전 페이지, 우측 절반 -> 다음 페이지
						if (
							start &&
							now - start.time < 350 &&
							Math.abs(dx) < 12 &&
							Math.abs(dy) < 12
						) {
							if (isZoomMenuOpen) {
								setIsZoomMenuOpen(false);
								return;
							}
							const midX = window.innerWidth / 2;
							if (t.clientX < midX) {
								if (pageNum > 1) {
									setPageNum((p) => Math.max(1, p - 1));
									containerRef.current?.scrollTo({ top: 0 });
								}
							} else {
								if (pageNum < numPages) {
									setPageNum((p) => Math.min(numPages, p + 1));
									containerRef.current?.scrollTo({ top: 0 });
								}
							}
							return;
						}

						// 2) 기본 배율(100%) 상태에서 좌우 스와이프 시 이전/다음 페이지 넘김
						if (
							zoom === 1 &&
							start &&
							now - start.time < 500 &&
							Math.abs(dx) > 65 &&
							Math.abs(dx) > Math.abs(dy) * 1.6
						) {
							if (dx < 0 && pageNum < numPages) {
								setPageNum((p) => Math.min(numPages, p + 1));
								containerRef.current?.scrollTo({ top: 0 });
							} else if (dx > 0 && pageNum > 1) {
								setPageNum((p) => Math.max(1, p - 1));
								containerRef.current?.scrollTo({ top: 0 });
							}
						}
					}}
					onClick={(e) => {
						// 모바일 터치 직후 발생하는 중복 마우스 클릭 이벤트 무시 (PC 마우스 클릭 전용)
						if (Date.now() - lastTouchEndTimeRef.current < 450) return;
						if (isLoading || numPages <= 0) return;
						if (isZoomMenuOpen) {
							setIsZoomMenuOpen(false);
							return;
						}
						const rect = e.currentTarget.getBoundingClientRect();
						const midX = rect.left + rect.width / 2;
						if (e.clientX < midX) {
							if (pageNum > 1) {
								setPageNum((p) => Math.max(1, p - 1));
								containerRef.current?.scrollTo({ top: 0 });
							}
						} else {
							if (pageNum < numPages) {
								setPageNum((p) => Math.min(numPages, p + 1));
								containerRef.current?.scrollTo({ top: 0 });
							}
						}
					}}
					className="flex-1 w-full overflow-auto overscroll-none touch-pan-x touch-pan-y flex flex-col items-center justify-start p-2 sm:p-4 bg-[#f1f5f9] dark:bg-[#09090b] cursor-pointer transition-colors"
				>
					{isLoading ? (
						<div className="my-auto flex flex-col items-center justify-center gap-2.5 text-xs text-[#64748b] dark:text-[#a1a1aa]">
							<Loader2 size={26} className="animate-spin text-blue-500" />
							<span className="font-semibold">
								문서를 불러오는 중...{" "}
								{loadProgress > 0 ? `(${loadProgress}%)` : ""}
							</span>
						</div>
					) : error ? (
						<div className="my-auto flex flex-col items-center justify-center gap-3 text-xs text-[#64748b] dark:text-[#a1a1aa]">
							<p>{error}</p>
							<button
								type="button"
								onClick={handleDownload}
								className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-1.5"
							>
								<Download size={14} /> 원본 파일 다운로드
							</button>
						</div>
					) : (
						<canvas
							ref={canvasRef}
							className="bg-white rounded-md shadow-lg dark:shadow-2xl max-w-none my-auto"
							style={
								isInverted
									? { filter: "invert(1) hue-rotate(180deg) contrast(0.95)" }
									: undefined
							}
						/>
					)}
				</main>
			)}

			{/* 하단 고정 1줄 통합 컨트롤 바 (/docs 하단바와 동일한 라이트/다크 테마 연동) */}
			<footer className="shrink-0 z-30 bg-white/95 dark:bg-[#111115]/95 backdrop-blur-md border-t border-[#d7dfe9] dark:border-[#2a2a32] px-2.5 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-colors">
				<div className="max-w-2xl mx-auto flex items-center justify-between gap-1.5">
					{/* 1. 좌측 끝: 뒤로가기 단독 배치 */}
					<button
						type="button"
						onClick={handleClose}
						className="w-9 h-9 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-[#d7dfe9] dark:hover:bg-white/10 border border-[#d7dfe9] dark:border-[#2a2a32] flex items-center justify-center text-[#0f172a] dark:text-[#f4f4f5] hover:text-[#0f172a] dark:hover:text-white active:scale-95 transition-all cursor-pointer shrink-0"
						aria-label="뒤로가기"
						title={isGridOpen ? "본문으로 돌아가기" : "보관함으로 돌아가기"}
					>
						<ArrowLeft size={16} />
					</button>

					{/* 2. 중앙: 페이지 이동 & 전체 썸네일 모아보기 통합 (< ▦ 1 / 185 >) */}
					<div className="flex items-center bg-[#f1f5f9] dark:bg-[#16161c] border border-[#d7dfe9] dark:border-[#2a2a32] rounded-xl h-9 p-0.5 min-w-0">
						<button
							type="button"
							disabled={pageNum <= 1 || isLoading || isGridOpen}
							onClick={() => {
								setPageNum((p) => Math.max(1, p - 1));
								containerRef.current?.scrollTo({ top: 0 });
							}}
							className="w-9 sm:w-12 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 flex items-center justify-center text-[#0f172a] dark:text-white disabled:opacity-30 active:scale-95 transition-all cursor-pointer shrink-0"
							aria-label="이전 페이지"
						>
							<ChevronLeft size={17} strokeWidth={2.5} />
						</button>
						<button
							type="button"
							disabled={numPages <= 0 || isLoading}
							onClick={() => setIsGridOpen((prev) => !prev)}
							title="터치하여 전체 페이지 썸네일 보기"
							className={`px-2.5 sm:px-3.5 h-8 rounded-lg text-xs font-bold tabular-nums whitespace-nowrap flex items-center justify-center gap-1.5 border-x border-[#d7dfe9] dark:border-[#2a2a32] transition-all active:scale-95 cursor-pointer disabled:opacity-35 ${
								isGridOpen
									? "bg-blue-600 border-transparent text-white shadow-xs"
									: "hover:bg-black/5 dark:hover:bg-white/5 text-[#0f172a] dark:text-white"
							}`}
						>
							<LayoutGrid
								size={13}
								className={
									isGridOpen
										? "text-white"
										: "text-blue-600 dark:text-blue-400"
								}
							/>
							<span>{numPages > 0 ? `${pageNum} / ${numPages}` : "- / -"}</span>
						</button>
						<button
							type="button"
							disabled={pageNum >= numPages || isLoading || isGridOpen}
							onClick={() => {
								setPageNum((p) => Math.min(numPages, p + 1));
								containerRef.current?.scrollTo({ top: 0 });
							}}
							className="w-9 sm:w-12 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 flex items-center justify-center text-[#0f172a] dark:text-white disabled:opacity-30 active:scale-95 transition-all cursor-pointer shrink-0"
							aria-label="다음 페이지"
						>
							<ChevronRight size={17} strokeWidth={2.5} />
						</button>
					</div>

					{/* 3. 우측: 배율·색반전 통합 팝오버(100%) + 저장 */}
					<div className="relative flex items-center gap-1.5 shrink-0">
						{isZoomMenuOpen && !isGridOpen && (
							<>
								<div
									className="fixed inset-0 z-10"
									onClick={() => setIsZoomMenuOpen(false)}
									aria-hidden="true"
								/>
								<div className="absolute bottom-11 right-0 z-20 bg-white/95 dark:bg-[#16161c]/95 backdrop-blur-md border border-[#d7dfe9] dark:border-[#2a2a32] rounded-2xl p-1 shadow-2xl flex flex-row items-center gap-1 whitespace-nowrap">
									<button
										type="button"
										onClick={toggleInvert}
										className={`h-8 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border-r border-[#d7dfe9] dark:border-[#2a2a32] mr-0.5 ${
											isInverted
												? "bg-indigo-600 text-white"
												: "text-[#0f172a] dark:text-[#f4f4f5] hover:bg-black/5 dark:hover:bg-white/10"
										}`}
										title="색반전 보정 (브라우저 강제 다크모드 대응)"
									>
										<SunMoon size={14} />
										<span>반전</span>
									</button>
									{[1, 1.25, 1.5, 2, 2.5].map((zVal) => {
										const isSelected = zoom === zVal;
										return (
											<button
												key={zVal}
												type="button"
												onClick={() => {
													setZoom(zVal);
													setIsZoomMenuOpen(false);
												}}
												className={`h-8 px-2 rounded-xl text-xs font-bold tabular-nums transition-colors cursor-pointer ${
													isSelected
														? "bg-blue-600 text-white"
														: "text-[#0f172a] dark:text-[#f4f4f5] hover:bg-black/5 dark:hover:bg-white/10"
												}`}
											>
												{Math.round(zVal * 100)}%
											</button>
										);
									})}
								</div>
							</>
						)}

						<button
							type="button"
							disabled={isLoading || isGridOpen}
							onClick={() => setIsZoomMenuOpen((prev) => !prev)}
							className={`h-9 px-2.5 rounded-xl border text-xs font-bold tabular-nums transition-all active:scale-95 cursor-pointer disabled:opacity-30 flex items-center gap-1 ${
								isZoomMenuOpen || zoom > 1 || isInverted
									? "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400"
									: "bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-[#d7dfe9] dark:hover:bg-white/10 border-[#d7dfe9] dark:border-[#2a2a32] text-[#0f172a] dark:text-[#f4f4f5]"
							}`}
							title="배율 및 색반전 설정"
							aria-label="배율 및 색반전 설정"
						>
							{isInverted && (
								<SunMoon
									size={12}
									className="text-indigo-600 dark:text-indigo-400 shrink-0"
								/>
							)}
							<span>{Math.round(zoom * 100)}%</span>
						</button>

						<button
							type="button"
							onClick={handleDownload}
							className="w-9 sm:w-auto sm:px-3 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
							title="파일 다운로드"
							aria-label="파일 다운로드"
						>
							<Download size={15} />
							<span className="hidden sm:inline">저장</span>
						</button>
					</div>
				</div>
			</footer>
		</div>
	);
}

export default function PdfViewerPage() {
	return (
		<Suspense
			fallback={
				<div className="fixed inset-0 h-dvh w-full bg-[#f8fafc] dark:bg-[#09090b] flex items-center justify-center text-xs text-[#64748b] dark:text-[#a1a1aa]">
					로딩 중...
				</div>
			}
		>
			<div className="fixed inset-0 h-dvh w-full bg-[#f8fafc] dark:bg-[#09090b] text-[#0f172a] dark:text-white flex flex-col transition-colors">
				<DocsPinGate title="매뉴얼 뷰어 보안 코드 입력">
					<PdfViewerContent />
				</DocsPinGate>
			</div>
		</Suspense>
	);
}
