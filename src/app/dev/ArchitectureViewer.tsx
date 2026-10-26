"use client";

import {
	FileCode2,
	Layers,
	Maximize2,
	Minimize2,
	Move,
	Network,
	RotateCcw,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { FILE_DIAGRAM_NODES, type FileNodeStory } from "./architectureData";

const BADGE_STYLES: Record<FileNodeStory["badgeColor"], string> = {
	blue: "bg-blue-500/10 text-[#2563eb] dark:text-[#60a5fa] border-blue-500/20",
	emerald:
		"bg-emerald-500/10 text-emerald-600 dark:text-[#34d399] border-emerald-500/20",
	amber:
		"bg-amber-500/10 text-amber-600 dark:text-[#fbbf24] border-amber-500/20",
	sky: "bg-sky-500/10 text-sky-600 dark:text-[#38bdf8] border-sky-500/20",
	rose: "bg-rose-500/10 text-rose-600 dark:text-[#f87171] border-rose-500/20",
};

type NodeTone = "amber" | "blue" | "sky" | "emerald" | "rose";

const TONE_PALETTE: Record<
	NodeTone,
	{
		border: string;
		headerBg: string;
		badgeText: string;
		titleText: string;
		dot: string;
	}
> = {
	amber: {
		border: "#f59e0b",
		headerBg: "#18181b",
		badgeText: "#fbbf24",
		titleText: "#f4f4f5",
		dot: "#f59e0b",
	},
	blue: {
		border: "#2563eb",
		headerBg: "#18181b",
		badgeText: "#60a5fa",
		titleText: "#f4f4f5",
		dot: "#2563eb",
	},
	sky: {
		border: "#0284c7",
		headerBg: "#18181b",
		badgeText: "#38bdf8",
		titleText: "#f4f4f5",
		dot: "#38bdf8",
	},
	emerald: {
		border: "#10b981",
		headerBg: "#18181b",
		badgeText: "#34d399",
		titleText: "#f4f4f5",
		dot: "#10b981",
	},
	rose: {
		border: "#f43f5e",
		headerBg: "#18181b",
		badgeText: "#f87171",
		titleText: "#f4f4f5",
		dot: "#f43f5e",
	},
};

export function ArchitectureViewer() {
	// 'summary' (핵심 요약 10노드) vs 'full' (완전판 22노드) 전환 상태
	const [diagramMode, setDiagramMode] = useState<"summary" | "full">("summary");
	const [selectedId, setSelectedId] = useState<string>("app_dashboard");
	const [scale, setScale] = useState<number>(1);
	const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState<boolean>(false);
	const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

	const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
	const didDragRef = useRef<boolean>(false);

	const selectedNode =
		FILE_DIAGRAM_NODES[selectedId] || FILE_DIAGRAM_NODES.app_dashboard;

	const handleModeChange = (mode: "summary" | "full") => {
		setDiagramMode(mode);
		setScale(1);
		setPan({ x: 0, y: 0 });
	};

	const handleZoomIn = () =>
		setScale((s) => Math.min(2.8, Number((s + 0.2).toFixed(2))));
	const handleZoomOut = () =>
		setScale((s) => Math.max(0.4, Number((s - 0.2).toFixed(2))));
	const handleResetZoom = () => {
		setScale(1);
		setPan({ x: 0, y: 0 });
	};

	const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
		e.preventDefault();
		const delta = e.deltaY < 0 ? 0.14 : -0.14;
		setScale((s) =>
			Math.min(2.8, Math.max(0.4, Number((s + delta).toFixed(2)))),
		);
	};

	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (e.button !== 0) return;
		setIsDragging(true);
		didDragRef.current = false;
		dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!isDragging) return;
		const dx = e.clientX - dragStartRef.current.x;
		const dy = e.clientY - dragStartRef.current.y;
		if (Math.abs(dx - pan.x) > 4 || Math.abs(dy - pan.y) > 4) {
			didDragRef.current = true;
		}
		setPan({ x: dx, y: dy });
	};

	const handlePointerUp = () => {
		setIsDragging(false);
	};

	const selectNode = (id: string) => {
		if (didDragRef.current) return;
		setSelectedId(id);
	};

	/**
	 * 모던 2단 헤더 카드(Card Node) 디자인
	 */
	const renderCardNode = (
		id: string,
		cx: number,
		cy: number,
		w: number,
		h: number,
		tag: string,
		line1: string,
		line2: string,
		tone: NodeTone,
		isExternal = false,
	) => {
		const x = cx - w / 2;
		const y = cy - h / 2;
		const isSelected = selectedId === id;
		const pal = TONE_PALETTE[tone];
		const headerH = 24;

		return (
			<g
				key={id}
				onClick={() => selectNode(id)}
				className="cursor-pointer"
				filter={isSelected ? "url(#node-glow)" : undefined}
			>
				<rect
					x={x}
					y={y}
					width={w}
					height={h}
					rx={12}
					fill={isSelected ? "#18181b" : "#111115"}
					stroke={isSelected ? "#ffffff" : pal.border}
					strokeWidth={isSelected ? 3 : 1.8}
					strokeDasharray={isExternal && !isSelected ? "6 4" : undefined}
				/>

				<path
					d={`M ${x + 1} ${y + 12} Q ${x + 1} ${y + 1} ${x + 12} ${
						y + 1
					} L ${x + w - 12} ${y + 1} Q ${x + w - 1} ${y + 1} ${x + w - 1} ${
						y + 12
					} L ${x + w - 1} ${y + headerH} L ${x + 1} ${y + headerH} Z`}
					fill={pal.headerBg}
				/>
				<line
					x1={x + 1}
					y1={y + headerH}
					x2={x + w - 1}
					y2={y + headerH}
					stroke="#27272a"
					strokeWidth="1"
				/>

				<circle cx={x + 14} cy={y + 12.5} r={4} fill={pal.dot} />
				<text
					x={x + 24}
					y={y + 16}
					fill={pal.badgeText}
					fontSize="10"
					fontWeight="700"
					fontFamily="monospace"
				>
					{tag}
				</text>

				{isSelected && (
					<rect
						x={x + w - 54}
						y={y + 5}
						width={44}
						height={14}
						rx={4}
						fill="#2563eb"
					/>
				)}
				{isSelected && (
					<text
						x={x + w - 32}
						y={y + 15}
						textAnchor="middle"
						fill="#ffffff"
						fontSize="9"
						fontWeight="700"
					>
						ACTIVE
					</text>
				)}

				<text
					x={cx}
					y={y + headerH + 24}
					textAnchor="middle"
					fill={isSelected ? "#ffffff" : pal.titleText}
					fontSize="13.5"
					fontWeight="700"
				>
					{line1}
				</text>

				<text
					x={cx}
					y={y + headerH + 45}
					textAnchor="middle"
					fill="#a1a1aa"
					fontSize="11.5"
				>
					{line2}
				</text>
			</g>
		);
	};

	const renderEdgeLabel = (
		cx: number,
		cy: number,
		w: number,
		text: string,
		tone: "default" | "amber" | "blue" | "sky" | "emerald" = "default",
	) => {
		const toneMap = {
			default: { stroke: "#3f3f46", text: "#d4d4d8", fill: "#111115" },
			amber: { stroke: "#f59e0b", text: "#fbbf24", fill: "#18181b" },
			blue: { stroke: "#2563eb", text: "#93c5fd", fill: "#18181b" },
			sky: { stroke: "#0284c7", text: "#38bdf8", fill: "#18181b" },
			emerald: { stroke: "#10b981", text: "#34d399", fill: "#18181b" },
		}[tone];

		return (
			<g key={`${cx}-${cy}-${text}`}>
				<rect
					x={cx - w / 2}
					y={cy - 13}
					width={w}
					height={26}
					rx={6}
					fill={toneMap.fill}
					stroke={toneMap.stroke}
					strokeWidth="1.3"
				/>
				<text
					x={cx}
					y={cy + 4}
					textAnchor="middle"
					fill={toneMap.text}
					fontSize="11"
					fontWeight="700"
				>
					{text}
				</text>
			</g>
		);
	};

	const renderDefs = () => (
		<defs>
			<filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
				<feDropShadow
					dx="0"
					dy="0"
					stdDeviation="8"
					floodColor="#38bdf8"
					floodOpacity="0.6"
				/>
			</filter>

			<marker
				id="arrow"
				viewBox="0 0 10 10"
				refX="8"
				refY="5"
				markerWidth="6"
				markerHeight="6"
				orient="auto-start-reverse"
			>
				<path d="M 0 1 L 10 5 L 0 9 z" fill="#71717a" />
			</marker>
			<marker
				id="arrow-amber"
				viewBox="0 0 10 10"
				refX="8"
				refY="5"
				markerWidth="6.5"
				markerHeight="6.5"
				orient="auto-start-reverse"
			>
				<path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
			</marker>
			<marker
				id="arrow-blue"
				viewBox="0 0 10 10"
				refX="8"
				refY="5"
				markerWidth="6.5"
				markerHeight="6.5"
				orient="auto-start-reverse"
			>
				<path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
			</marker>
			<marker
				id="arrow-emerald"
				viewBox="0 0 10 10"
				refX="8"
				refY="5"
				markerWidth="6.5"
				markerHeight="6.5"
				orient="auto-start-reverse"
			>
				<path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
			</marker>
			<marker
				id="arrow-rose"
				viewBox="0 0 10 10"
				refX="8"
				refY="5"
				markerWidth="6.5"
				markerHeight="6.5"
				orient="auto-start-reverse"
			>
				<path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
			</marker>
		</defs>
	);

	return (
		<div
			className={
				isFullscreen
					? "fixed inset-0 z-50 bg-[#09090b] p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto break-keep"
					: "space-y-6 break-keep"
			}
		>
			{/* 1. 상단 인터랙티브 줌/팬 다이어그램 컨테이너 */}
			<div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] space-y-3 flex-1 flex flex-col">
				{/* 컨트롤 툴바: [요약 보기 / 전체 상세] 전환 스위치 + 줌 컨트롤 */}
				<div className="flex items-center justify-between flex-wrap gap-2">
					<div className="flex items-center gap-2.5 flex-wrap">
						{/* 요약 보기 (프론트엔드 중심) vs 전체 상세 (백엔드·외부연동 포함) 전환 스위치 */}
						<div className="flex items-center p-1 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228]">
							<button
								type="button"
								onClick={() => handleModeChange("summary")}
								className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
									diagramMode === "summary"
										? "bg-[#2563eb] text-white shadow-sm"
										: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-[#f4f4f5]"
								}`}
							>
								<Layers className="w-3.5 h-3.5" />
								<span>프론트엔드 화면 구조 (요약 8개)</span>
							</button>
							<button
								type="button"
								onClick={() => handleModeChange("full")}
								className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
									diagramMode === "full"
										? "bg-[#2563eb] text-white shadow-sm"
										: "text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-[#f4f4f5]"
								}`}
							>
								<Network className="w-3.5 h-3.5" />
								<span>전체 아키텍처 (백엔드·DB·외부 연동)</span>
							</button>
						</div>

						<span className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono bg-[#f8fafc] dark:bg-[#09090b] border border-[#e2e8f0] dark:border-[#222228] text-[#64748b] dark:text-[#a1a1aa]">
							<Move className="w-3 h-3" /> 휠 확대/축소 · 드래그 이동 · 카드 클릭
						</span>
					</div>

					{/* 확대/축소/초기화/전체화면 버튼 */}
					<div className="flex items-center gap-1.5">
						<button
							type="button"
							onClick={handleZoomOut}
							className="min-w-[38px] min-h-[38px] px-2.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-[#0f172a] dark:text-[#f4f4f5] hover:border-[#2563eb] flex items-center justify-center cursor-pointer transition-colors"
							title="축소"
						>
							<ZoomOut className="w-4 h-4" />
						</button>
						<span className="px-2.5 py-1.5 rounded-xl bg-[#f8fafc] dark:bg-[#09090b] border border-[#e2e8f0] dark:border-[#222228] font-mono text-xs font-bold text-[#0f172a] dark:text-[#f4f4f5] min-w-[60px] text-center">
							{Math.round(scale * 100)}%
						</span>
						<button
							type="button"
							onClick={handleZoomIn}
							className="min-w-[38px] min-h-[38px] px-2.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-[#0f172a] dark:text-[#f4f4f5] hover:border-[#2563eb] flex items-center justify-center cursor-pointer transition-colors"
							title="확대"
						>
							<ZoomIn className="w-4 h-4" />
						</button>
						<button
							type="button"
							onClick={handleResetZoom}
							className="min-h-[38px] px-3 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] text-xs font-semibold text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-[#f4f4f5] flex items-center gap-1 cursor-pointer transition-colors"
							title="배율 및 위치 초기화"
						>
							<RotateCcw className="w-3.5 h-3.5" />
							<span className="hidden sm:inline">100%</span>
						</button>
						<button
							type="button"
							onClick={() => setIsFullscreen((v) => !v)}
							className="min-h-[38px] px-3 rounded-xl bg-[#2563eb] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#1d4ed8] transition-colors"
							title="전체화면 토글"
						>
							{isFullscreen ? (
								<>
									<Minimize2 className="w-3.5 h-3.5" />
									<span>축소 복귀</span>
								</>
							) : (
								<>
									<Maximize2 className="w-3.5 h-3.5" />
									<span>크게 보기</span>
								</>
							)}
						</button>
					</div>
				</div>

				{/* 줌/팬 뷰포트 영역 */}
				<div
					onWheel={handleWheel}
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					onPointerLeave={handlePointerUp}
					className={`relative w-full overflow-hidden rounded-xl bg-[#09090b] border border-[#222228] select-none ${
						isFullscreen
							? "flex-1 min-h-[620px]"
							: diagramMode === "summary"
								? "h-[560px]"
								: "h-[660px]"
					} ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
				>
					{/* 하단 컬러 범례 바 */}
					<div className="absolute bottom-3 right-3 z-10 flex flex-wrap items-center gap-3 px-3.5 py-2 rounded-xl bg-[#111115] border border-[#222228] text-[11px] font-mono text-[#d4d4d8] pointer-events-none">
						{diagramMode === "full" ? (
							<>
								<span className="flex items-center gap-1.5 font-bold text-[#60a5fa]">
									<span className="w-2.5 h-2.5 rounded-xs border border-[#2563eb] bg-[#1e40af]" />
									🖥️ 프론트엔드 영역 (UI · 페이지 · 컴포넌트)
								</span>
								<span className="flex items-center gap-1.5 font-bold text-[#fbbf24]">
									<span className="w-2.5 h-2.5 rounded-xs border border-[#f59e0b] bg-[#111115]" />
									⚙️ 백엔드 영역 (Next 서버 · 인증 미들웨어 · DB 연동)
								</span>
								<span className="flex items-center gap-1.5 font-bold text-[#34d399]">
									<span className="w-2.5 h-2.5 rounded-xs border border-dashed border-[#10b981] bg-[#111115]" />
									🌐 외부 인프라 (인증 · DB · CDN · 지도 · WMS)
								</span>
							</>
						) : (
							<>
								<span className="flex items-center gap-1.5 font-bold text-[#60a5fa]">
									<span className="w-2.5 h-2.5 rounded-xs bg-[#2563eb]" />
									프론트엔드 핵심 UI 화면
								</span>
								<span className="flex items-center gap-1.5">
									<span className="w-2.5 h-2.5 rounded-xs bg-[#f59e0b]" />
									로그인 및 QR 즉시 진입
								</span>
								<span className="flex items-center gap-1.5">
									<span className="w-2.5 h-2.5 rounded-xs bg-[#38bdf8]" />
									보조 도구 및 품질 검증 UI
								</span>
							</>
						)}
					</div>

					<div
						style={{
							transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
							transformOrigin: "center center",
						}}
						className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
					>
						{diagramMode === "summary" ? (
							/* =========================================================
							   [MODE 1] 프론트엔드 화면 구조 (요약 9개 순수 화면 UI 흐름)
							========================================================= */
							<svg
								viewBox="0 0 1820 720"
								className="w-full h-full max-w-[1820px] max-h-[720px] font-sans"
								role="img"
								aria-label="WMS_Hv2 프론트엔드 화면 구조도"
							>
								{renderDefs()}

								{/* 1. 사용자 접속(640,78) -> 로그인 페이지(640,150) */}
								<path
									d="M 640 78 L 640 150"
									stroke="#38bdf8"
									strokeWidth="2.4"
									fill="none"
									markerEnd="url(#arrow-blue)"
								/>
								{renderEdgeLabel(640, 114, 115, "첫 화면 접속", "sky")}

								{/* 2. 로그인 페이지(640,192) 좌측(510,192) -> 로그인 없이 이동 -> 무인증 바로가기 박스(330,192) */}
								<path
									d="M 510 192 L 330 192"
									stroke="#f59e0b"
									strokeWidth="2.4"
									fill="none"
									markerEnd="url(#arrow-amber)"
								/>
								{renderEdgeLabel(420, 192, 115, "로그인 없이 이동", "amber")}

								{/* 3. 로그인 페이지(640,192) 우측(770,192) -> 로그인 완료 이동 -> 메인 대시보드(1060,192) 좌측(930,192) */}
								<path
									d="M 770 192 L 925 192"
									stroke="#38bdf8"
									strokeWidth="2.8"
									fill="none"
									markerEnd="url(#arrow-blue)"
								/>
								{renderEdgeLabel(847, 192, 115, "로그인 완료 이동", "blue")}

								{/* 4. 무인증 바로가기(190,234) 하단 -> 2갈래 분기 (전용 통로 Y=285, 파란선 Y=355와 완전히 분리!) */}
								<path
									d="M 150 234 L 150 385"
									stroke="#f59e0b"
									strokeWidth="2.4"
									fill="none"
									markerEnd="url(#arrow-amber)"
								/>
								{renderEdgeLabel(150, 285, 125, "① QR 스캔 바로가기", "amber")}

								<path
									d="M 230 234 L 230 285 L 720 285 L 720 385"
									stroke="#f59e0b"
									strokeWidth="2.4"
									fill="none"
									markerEnd="url(#arrow-amber)"
								/>
								{renderEdgeLabel(480, 285, 130, "② 교육 영상 바로보기", "amber")}

								{/* 5. 메인 대시보드(/dashboard, 1060,234) 하단 -> 6대 핵심 서비스 분기 버스 (전용 통로 Y=355) */}
								<path
									d="M 1060 234 L 1060 355"
									stroke="#38bdf8"
									strokeWidth="2.4"
									fill="none"
								/>
								<path
									d="M 220 355 L 1630 355"
									stroke="#38bdf8"
									strokeWidth="2.4"
									fill="none"
								/>
								{[220, 470, 780, 1050, 1340, 1620].map((xPos) => (
									<path
										key={`sum-front-${xPos}`}
										d={`M ${xPos} 355 L ${xPos} 385`}
										stroke="#38bdf8"
										strokeWidth="2.2"
										fill="none"
										markerEnd="url(#arrow-blue)"
									/>
								))}

								{/* [Start] 사용자 접속 */}
								<g>
									<rect
										x="570"
										y="34"
										width="140"
										height="44"
										rx="22"
										fill="#2563eb"
										stroke="#60a5fa"
										strokeWidth="2"
									/>
									<text
										x="640"
										y="61"
										textAnchor="middle"
										fill="#ffffff"
										fontSize="14"
										fontWeight="700"
									>
										사용자 접속
									</text>
								</g>

								{/* [좌측: 무인증 바로가기 (교육/QR 2종 묶음)] */}
								{renderCardNode(
									"public_bypass",
									190,
									192,
									270,
									84,
									"무인증 바로가기",
									"교육 영상 · QR 스캔 접속",
									"/docs/video · /items (2종 묶음)",
									"amber",
								)}

								{/* [중앙: 프론트엔드 첫 화면] 로그인 페이지 */}
								{renderCardNode(
									"root_login",
									640,
									192,
									260,
									84,
									"로그인 페이지",
									"src/app/page.tsx",
									"/ (첫 접속 화면 및 로그인 UI)",
									"amber",
								)}

								{/* [우측: 프론트엔드 메인 허브] 메인 대시보드 */}
								{renderCardNode(
									"app_dashboard",
									1060,
									192,
									260,
									84,
									"메인 대시보드",
									"src/app/dashboard/",
									"/dashboard (업무 메뉴 메인 허브)",
									"blue",
								)}

								{/* 하단 6대 프론트엔드 화면 페이지 */}
								{renderCardNode(
									"app_items",
									180,
									430,
									240,
									84,
									"소모품 · QR 관리",
									"src/app/items/",
									"/items (소모품 재고 & QR 라벨 UI)",
									"amber",
								)}
								{renderCardNode(
									"app_map",
									470,
									430,
									250,
									84,
									"수질 지도 · 제원 관리",
									"src/app/map/",
									"/map (지도 모니터링 & 제원 UI)",
									"blue",
								)}
								{renderCardNode(
									"app_docs",
									760,
									430,
									250,
									84,
									"자료실 · 매뉴얼",
									"src/app/docs/",
									"/docs (매뉴얼 · 시약 · 교육영상)",
									"blue",
								)}
								{renderCardNode(
									"app_launcher",
									1050,
									430,
									250,
									84,
									"F12 통합 런처",
									"dashboard/launcher/",
									"통합 런처 (F12 브라우저 스크립트)",
									"sky",
								)}
								{renderCardNode(
									"public_tools",
									1340,
									430,
									250,
									84,
									"독립 실행형 도구",
									"public/tools/* (4종)",
									"웹에서 바로 쓰는 단독 보조 도구",
									"sky",
								)}
								{renderCardNode(
									"app_dev",
									1620,
									430,
									240,
									84,
									"구조도 · 품질 검증",
									"src/app/dev/",
									"/dev (구조도 뷰어 & UI 검증기)",
									"rose",
								)}
							</svg>
						) : (
							/* =========================================================
							   [MODE 2] 전체 상세 구조도: 좌측(프론트엔드 UI) <-> 우측(백엔드 로직 & 외부 DB)
							   * 모든 가로/세로 통로 완벽 분리 (선-라벨-카드 충돌 0건)
							========================================================= */
							<svg
								viewBox="0 0 2500 1540"
								width="2500"
								height="1540"
								className="shrink-0 font-sans"
								role="img"
								aria-label="WMS_Hv2 좌우 분할 전체 파일 구조도 (프론트 좌 / 백엔드 우)"
							>
								{renderDefs()}

								{/* =========================================================
								    [좌우 2대 메인 영역 구획: 좌측 프론트 vs 우측 백엔드·인프라]
								========================================================= */}
								{/* 1. 좌측 열: 🖥️ 프론트엔드 영역 (X: 30 ~ 1310, Y: 100 ~ 1500) */}
								<rect
									x="30"
									y="100"
									width="1280"
									height="1400"
									rx="24"
									fill="#111115"
									stroke="#2563eb"
									strokeWidth="1.8"
									strokeDasharray="6 6"
									opacity="0.4"
								/>
								<g>
									<rect
										x="50"
										y="115"
										width="380"
										height="34"
										rx="8"
										fill="#1e40af"
										opacity="0.9"
									/>
									<text
										x="240"
										y="137"
										textAnchor="middle"
										fill="#ffffff"
										fontSize="13.5"
										fontWeight="700"
										fontFamily="monospace"
									>
										🖥️ [LEFT] FRONTEND ZONE (화면 · UI 컴포넌트)
									</text>
								</g>

								{/* 2. 우측 열: ⚙️ 백엔드 & 인프라 영역 (X: 1350 ~ 2470, Y: 100 ~ 1500) */}
								<rect
									x="1350"
									y="100"
									width="1120"
									height="1400"
									rx="24"
									fill="#111115"
									stroke="#f59e0b"
									strokeWidth="1.8"
									strokeDasharray="6 6"
									opacity="0.4"
								/>
								<g>
									<rect
										x="1370"
										y="115"
										width="420"
										height="34"
										rx="8"
										fill="#f59e0b"
										opacity="0.25"
									/>
									<text
										x="1580"
										y="137"
										textAnchor="middle"
										fill="#fbbf24"
										fontSize="13.5"
										fontWeight="700"
										fontFamily="monospace"
									>
										⚙️ [RIGHT] BACKEND & INFRA (인증 · 서버 로직 · 외부 DB)
									</text>
								</g>

								{/* =========================================================
								    [주고받는 인터랙션 연결선 (Cross-Zone Flows - 충돌 0건)]
								========================================================= */}
								{/* [Flow 1] 사용자 접속(680,90) -> 우측 proxy.ts(1500,190) 요청 가로채기 */}
								<path
									d="M 680 90 L 680 190 L 1495 190"
									stroke="#f59e0b"
									strokeWidth="2.4"
									fill="none"
									markerEnd="url(#arrow-amber)"
								/>
								{renderEdgeLabel(1080, 190, 140, "접속 요청 가로채기", "amber")}

								{/* [Flow 2] 우측 proxy.ts(1580,232 하단) -> 좌측 로그인 페이지(730,295 상단) [Y=265 전용 통로] */}
								<path
									d="M 1580 232 L 1580 265 L 730 265 L 730 295"
									stroke="#71717a"
									strokeWidth="2"
									strokeDasharray="5 5"
									fill="none"
									markerEnd="url(#arrow)"
								/>
								{renderEdgeLabel(1160, 265, 135, "미인증 ➔ 로그인 안내")}

								{/* [Flow 3] 좌측 로그인 페이지(835,365) -> 우측 백엔드 세션 검증 다이아몬드(1520,365) [Y=365 직결] */}
								<path
									d="M 835 365 L 1515 365"
									stroke="#38bdf8"
									strokeWidth="2.4"
									fill="none"
									markerEnd="url(#arrow-blue)"
								/>
								{renderEdgeLabel(1160, 365, 130, "로그인 인증 요청", "sky")}

								{/* [Flow 4] 우측 세션 다이아몬드(1780,365 우측 꼭짓점) -> 외부 Supabase Auth(1990,365 좌측) */}
								<path
									d="M 1780 365 L 1985 365"
									stroke="#10b981"
									strokeWidth="2.2"
									fill="none"
									markerEnd="url(#arrow-emerald)"
								/>
								{renderEdgeLabel(1882, 365, 95, "계정 검증", "emerald")}

								{/* [Flow 5] 우측 세션 다이아몬드(1650,465 하단) -> 좌측 메인 대시보드(835,520) [Y=520 직결] */}
								<path
									d="M 1650 465 L 1650 520 L 835 520"
									stroke="#38bdf8"
									strokeWidth="2.8"
									fill="none"
									markerEnd="url(#arrow-blue)"
								/>
								{renderEdgeLabel(1240, 520, 160, "인증 성공 ➔ 대시보드 진입", "blue")}

								{/* [Flow 6] 좌측 로그인 페이지(525,340 좌측) -> 무인증 바로가기(370,340 우측) 분기 */}
								<path
									d="M 525 340 L 375 340"
									stroke="#f59e0b"
									strokeWidth="2.4"
									fill="none"
									markerEnd="url(#arrow-amber)"
								/>
								{renderEdgeLabel(450, 340, 115, "로그인 없이 이동", "amber")}

								{/* 무인증 바로가기(220,382 하단) -> ① QR 스캔(/items, X=250) & ② 교육영상(/docs, X=950) [전용 통로 Y=615] */}
								<path
									d="M 180 382 L 180 615 L 250 615 L 250 735"
									stroke="#f59e0b"
									strokeWidth="2.4"
									fill="none"
									markerEnd="url(#arrow-amber)"
								/>
								{renderEdgeLabel(180, 500, 135, "① QR 스캔 바로접속", "amber")}

								<path
									d="M 260 382 L 260 615 L 950 615 L 950 735"
									stroke="#f59e0b"
									strokeWidth="2.4"
									fill="none"
									markerEnd="url(#arrow-amber)"
								/>
								{renderEdgeLabel(480, 615, 135, "② 교육영상 바로보기", "amber")}

								{/* [Flow 7] 메인 대시보드(680,562 하단) -> 좌측 3대 서비스 UI 버스 [전용 통로 Y=695] */}
								<path
									d="M 680 562 L 680 695"
									stroke="#38bdf8"
									strokeWidth="2.4"
									fill="none"
								/>
								<path
									d="M 350 695 L 1040 695"
									stroke="#38bdf8"
									strokeWidth="2.4"
									fill="none"
								/>
								{[350, 680, 1040].map((xPos) => (
									<path
										key={`flow-dash-row1-${xPos}`}
										d={`M ${xPos} 695 L ${xPos} 735`}
										stroke="#38bdf8"
										strokeWidth="2.2"
										fill="none"
										markerEnd="url(#arrow-blue)"
									/>
								))}

								{/* [Flow 8] 자료실 UI(1060,822) -> 외부 Cloudflare R2(2260,782) [전용 통로 Y=855] */}
								<path
									d="M 1060 822 L 1060 855 L 2260 855 L 2260 785"
									stroke="#10b981"
									strokeWidth="1.8"
									strokeDasharray="5 5"
									fill="none"
									markerEnd="url(#arrow-emerald)"
								/>
								{renderEdgeLabel(1450, 855, 135, "동영상 스트리밍", "emerald")}

								{/* [Flow 9] 수질 지도 UI(740,822) -> 외부 배경지도 VWorld(1960,782) [전용 통로 Y=905] */}
								<path
									d="M 740 822 L 740 905 L 1960 905 L 1960 785"
									stroke="#10b981"
									strokeWidth="1.8"
									strokeDasharray="5 5"
									fill="none"
									markerEnd="url(#arrow-emerald)"
								/>
								{renderEdgeLabel(1220, 905, 145, "배경 지도 타일 로드", "emerald")}

								{/* [Flow 10] 소모품(330) · 수질지도(620) · 자료실(980) -> 우측 백엔드 데이터 계층(1550,998 상단) [전용 통로 Y=960] */}
								<path
									d="M 330 822 L 330 960 L 1550 960 L 1550 995"
									stroke="#10b981"
									strokeWidth="2.4"
									fill="none"
									markerEnd="url(#arrow-emerald)"
								/>
								<path
									d="M 620 822 L 620 960"
									stroke="#10b981"
									strokeWidth="2.4"
									fill="none"
								/>
								<path
									d="M 980 822 L 980 960"
									stroke="#10b981"
									strokeWidth="2.4"
									fill="none"
								/>
								{renderEdgeLabel(1160, 960, 175, "데이터 조회 · 저장 요청", "emerald")}

								{/* [Flow 11] 우측 백엔드 데이터 계층(1550,1082 하단) -> 최하단 외부 Supabase DB & Storage(1550,1328 상단) */}
								<path
									d="M 1550 1082 L 1550 1325"
									stroke="#10b981"
									strokeWidth="2.8"
									fill="none"
									markerEnd="url(#arrow-emerald)"
								/>
								{renderEdgeLabel(1550, 1140, 175, "DB 쿼리 및 파일 저장/로드", "emerald")}

								{/* [Flow 12] 품질 검증기(760,1142 하단) -> 우측 audit.ts 검사 엔진(1960,1328 상단) [전용 통로 Y=1175] */}
								<path
									d="M 760 1142 L 760 1175 L 1960 1175 L 1960 1325"
									stroke="#f43f5e"
									strokeWidth="2.4"
									fill="none"
									markerEnd="url(#arrow-rose)"
								/>
								{renderEdgeLabel(1160, 1175, 150, "규칙 위반 자동 검사")}

								{/* [Flow 13] 독립 실행형 도구(490,1142 하단) -> 우측 외부 SheetJS CDN(2260,1082 하단) [전용 통로 Y=1225] */}
								<path
									d="M 490 1142 L 490 1225 L 2260 1225 L 2260 1085"
									stroke="#10b981"
									strokeWidth="1.8"
									strokeDasharray="5 5"
									fill="none"
									markerEnd="url(#arrow-emerald)"
								/>
								{renderEdgeLabel(1160, 1225, 150, "엑셀(xlsx) 처리 CDN", "emerald")}

								{/* [Flow 14] F12 통합 런처(220,1142 하단) -> 우측 외부 과학원 WMS(1960,1082 하단) [전용 통로 Y=1275] */}
								<path
									d="M 220 1142 L 220 1275 L 1960 1275 L 1960 1085"
									stroke="#38bdf8"
									strokeWidth="2.4"
									fill="none"
									markerEnd="url(#arrow-blue)"
								/>
								{renderEdgeLabel(880, 1275, 150, "F12 스크립트 대상 주입", "sky")}

								{/* [Flow 15] 공통 UI 컴포넌트(1030,1058 상단) -> 실무 화면 UI 적용 [전용 통로 Y=1015] */}
								<path
									d="M 1030 1058 L 1030 1015 L 680 1015 L 680 825"
									stroke="#71717a"
									strokeWidth="1.6"
									strokeDasharray="5 5"
									fill="none"
									markerEnd="url(#arrow)"
								/>
								{renderEdgeLabel(855, 1015, 130, "공통 팝업/테마 적용")}

								{/* =========================================================
								    [좌측 열: 🖥️ 프론트엔드 노드 카드들]
								========================================================= */}
								{/* [Start] 사용자 접속 (좌상단 중앙) */}
								<g>
									<rect
										x="610"
										y="44"
										width="140"
										height="44"
										rx="22"
										fill="#2563eb"
										stroke="#60a5fa"
										strokeWidth="2"
									/>
									<text
										x="680"
										y="71"
										textAnchor="middle"
										fill="#ffffff"
										fontSize="14"
										fontWeight="700"
									>
										사용자 접속
									</text>
								</g>

								{/* [좌측 배치 1] 무인증 바로가기 (로그인 페이지의 좌측에 위치) */}
								{renderCardNode(
									"public_bypass",
									220,
									340,
									300,
									84,
									"무인증 바로가기",
									"교육 영상 · QR 스캔 접속",
									"/docs/video · /items (2종 묶음)",
									"amber",
								)}

								{/* [좌측 배치 2] 프론트엔드 로그인 페이지 */}
								{renderCardNode(
									"root_login",
									680,
									340,
									310,
									84,
									"🖥️ 프론트엔드 로그인",
									"src/app/page.tsx & app/login/",
									"첫 화면 로그인 폼 및 사용자 입력 처리",
									"amber",
								)}

								{/* [좌측 배치 3] 메인 대시보드 허브 */}
								{renderCardNode(
									"app_dashboard",
									680,
									520,
									310,
									84,
									"메인 대시보드",
									"src/app/dashboard/",
									"4대 핵심 서비스 & 실무 메뉴 연결 허브",
									"blue",
								)}

								{/* 좌측 하단 1열 (Y=780): 실무 3대 핵심 화면 */}
								{renderCardNode(
									"app_items",
									330,
									780,
									270,
									84,
									"소모품 · QR 관리",
									"src/app/items/",
									"/items (소모품 재고 & QR 인쇄)",
									"amber",
								)}
								{renderCardNode(
									"app_map",
									680,
									780,
									280,
									84,
									"수질 지도 · 제원 관리",
									"src/app/map/",
									"/map (지도 모니터링 & 측정소 제원)",
									"blue",
								)}
								{renderCardNode(
									"app_docs",
									1020,
									780,
									280,
									84,
									"자료실 · 매뉴얼",
									"src/app/docs/",
									"/docs (매뉴얼 · 시약 · 교육영상)",
									"blue",
								)}

								{/* 좌측 하단 2열 (Y=1100): 보조 도구 & 공통 UI */}
								{renderCardNode(
									"app_launcher",
									220,
									1100,
									240,
									84,
									"F12 통합 런처",
									"src/app/dashboard/launcher/",
									"외부 WMS 주입용 자동화 스크립트",
									"sky",
								)}
								{renderCardNode(
									"public_tools",
									490,
									1100,
									250,
									84,
									"독립 실행형 도구",
									"public/tools/* (4종)",
									"이력완성 · PDF마스킹 · 이미지변환",
									"sky",
								)}
								{renderCardNode(
									"app_dev",
									760,
									1100,
									250,
									84,
									"구조도 · 품질 검증",
									"src/app/dev/",
									"/dev (파일 구조도 & 품질 검증기)",
									"rose",
								)}
								{renderCardNode(
									"common_ui",
									1030,
									1100,
									230,
									84,
									"공통 UI 컴포넌트",
									"src/components/",
									"공통 팝업(Modal) · 테마 버튼",
									"sky",
								)}

								{/* 좌측 최하단 (Y=1370): 정적 자원 및 유틸 */}
								{renderCardNode(
									"layout_global",
									330,
									1370,
									290,
									84,
									"🖥️ 프론트 공통 레이아웃",
									"src/app/layout.tsx & globals.css",
									"전체 화면 틀 · 테마 · 기본 스타일",
									"sky",
								)}
								{renderCardNode(
									"hangul_util",
									670,
									1370,
									240,
									84,
									"초성 검색 기능",
									"src/utils/hangul.ts",
									"한글 초성('ㄱㅍ'→'가평') 검색 처리",
									"emerald",
								)}
								{renderCardNode(
									"public_assets",
									980,
									1370,
									250,
									84,
									"정적 데이터 · 이미지",
									"public/data/han_rivers.geojson",
									"한강 하천망 좌표 · 아이콘 이미지",
									"sky",
								)}

								{/* =========================================================
								    [우측 열: ⚙️ 백엔드 & 인프라 노드 카드들]
								========================================================= */}
								{/* 우측 상단 1: 백엔드 프록시 (proxy.ts) */}
								{renderCardNode(
									"proxy_entry",
									1650,
									190,
									300,
									84,
									"⚙️ 백엔드 진입 제어",
									"src/proxy.ts",
									"웹페이지 접속 요청 가로채기 및 필터링",
									"amber",
								)}

								{/* 우측 상단 2: 백엔드 인증/세션 다이아몬드 (middleware.ts) */}
								<g
									onClick={() => selectNode("middleware_auth")}
									className="cursor-pointer"
									filter={
										selectedId === "middleware_auth"
											? "url(#node-glow)"
											: undefined
									}
								>
									<polygon
										points="1650,265 1780,365 1650,465 1520,365"
										fill={
											selectedId === "middleware_auth" ? "#18181b" : "#111115"
										}
										stroke={
											selectedId === "middleware_auth" ? "#ffffff" : "#f59e0b"
										}
										strokeWidth={selectedId === "middleware_auth" ? 3 : 2.2}
									/>
									<text
										x="1650"
										y="342"
										textAnchor="middle"
										fill="#f59e0b"
										fontSize="10"
										fontWeight="700"
										fontFamily="monospace"
									>
										⚙️ 백엔드 인증 · 세션 분기
									</text>
									<text
										x="1650"
										y="364"
										textAnchor="middle"
										fill="#fbbf24"
										fontSize="13"
										fontWeight="700"
									>
										인증 · 30분 활동 세션 · QR 분기
									</text>
									<text
										x="1650"
										y="386"
										textAnchor="middle"
										fill="#d4d4d8"
										fontSize="11"
									>
										(utils/supabase/middleware.ts)
									</text>
								</g>

								{/* 외부 Supabase Auth */}
								{renderCardNode(
									"ext_supa_auth",
									2120,
									365,
									260,
									84,
									"🌐 외부 인증 서버",
									"외부: Supabase Auth",
									"계정 확인 및 사용자 로그인 세션 관리",
									"emerald",
									true,
								)}

								{/* 우측 중단: 외부 CDN & 외부 지도/스토리지 */}
								{renderCardNode(
									"ext_jsdelivr",
									1600,
									740,
									250,
									84,
									"🌐 외부 웹폰트 서버",
									"외부 CDN: jsDelivr",
									"Pretendard GOV 웹폰트 파일 제공",
									"emerald",
									true,
								)}
								{renderCardNode(
									"ext_vworld",
									1960,
									740,
									260,
									84,
									"🌐 외부 배경지도 서버",
									"외부: VWorld & OSM",
									"국토부 위성지도 · 일반 도로지도 제공",
									"emerald",
									true,
								)}
								{renderCardNode(
									"ext_r2",
									2260,
									740,
									250,
									84,
									"🌐 외부 영상 스토리지",
									"외부: Cloudflare R2",
									"교육 영상 파일 저장 및 스트리밍",
									"emerald",
									true,
								)}

								{/* 우측 하단 1: 백엔드 데이터 캐싱 계층 (src/actions/*) & 외부 대상 시스템 */}
								{renderCardNode(
									"data_layer",
									1550,
									1040,
									380,
									84,
									"⚙️ 백엔드 데이터 처리 계층",
									"src/actions/* & src/utils/supabase/*",
									"DB 데이터 임시 저장(캐싱) 및 서버 반영 처리",
									"emerald",
								)}
								{renderCardNode(
									"ext_wms",
									1960,
									1040,
									260,
									84,
									"🌐 외부 대상 시스템",
									"외부: 국립환경과학원 WMS",
									"wms.waterkorea.or.kr (런처 실행 대상)",
									"sky",
									true,
								)}
								{renderCardNode(
									"ext_sheetjs",
									2260,
									1040,
									250,
									84,
									"🌐 외부 라이브러리 서버",
									"외부 CDN: SheetJS & cdnjs",
									"엑셀(xlsx) 파일 생성 · PDF 화면 표시",
									"emerald",
									true,
								)}

								{/* 우측 최하단: 외부 Supabase DB & Storage & 검사 엔진 */}
								{renderCardNode(
									"ext_supa_db",
									1550,
									1370,
									350,
									84,
									"🌐 외부 DB · 파일 저장소",
									"외부: Supabase DB & Storage",
									"측정소·기기·소모품 테이블 및 사진 파일 저장",
									"emerald",
									true,
								)}
								{renderCardNode(
									"audit_engine",
									1960,
									1370,
									280,
									84,
									"코드 · 디자인 자동 검사",
									"src/actions/audit.ts & scripts/*",
									"미사용 파일·패키지 및 색상 규칙 위반 검사",
									"rose",
								)}
							</svg>
						)}
					</div>
				</div>
			</div>

			{/* 2. 하단: 클릭한 다이어그램 노드의 대표 파일 & 참조 상세 */}
			<div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] space-y-4">
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e8f0] dark:border-[#222228] pb-3.5">
					<div className="flex items-center gap-2.5">
						<span
							className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border ${
								BADGE_STYLES[selectedNode.badgeColor]
							}`}
						>
							{selectedNode.badge}
						</span>
						<h3 className="text-base sm:text-lg font-bold text-[#0f172a] dark:text-[#f4f4f5]">
							{selectedNode.title}
						</h3>
					</div>
					<span className="font-mono text-xs text-[#2563eb] dark:text-[#60a5fa] font-bold">
						{selectedNode.path}
					</span>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{selectedNode.keyFiles.map((file) => (
						<div
							key={file.name}
							className="p-4 rounded-xl bg-[#f8fafc] dark:bg-[#09090b] border border-[#e2e8f0] dark:border-[#222228] space-y-1.5"
						>
							<div className="flex items-center gap-2">
								<FileCode2 className="w-4 h-4 text-[#2563eb] dark:text-[#60a5fa] shrink-0" />
								<span className="font-mono text-xs sm:text-sm font-bold text-[#0f172a] dark:text-[#f4f4f5] break-all">
									{file.name}
								</span>
							</div>
							<p className="text-xs text-[#64748b] dark:text-[#a1a1aa] leading-relaxed pl-6">
								{file.desc}
							</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
