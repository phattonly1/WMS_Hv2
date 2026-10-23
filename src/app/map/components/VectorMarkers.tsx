"use client";

import React from "react";
import type { Station } from "../stationData";

// 1. 국가 측정소 마커 (2안: 미니멀 글래스 센서 링 + 우측 다이렉트 텍스트)
export const StationMarker = React.memo(function StationMarker({
	station,
	color,
	isSelected,
}: {
	station: Station;
	color: string;
	isSelected?: boolean;
}) {
	return (
		<div className="relative group cursor-pointer select-none flex items-center">
			{/* 1. 센터 관측 코어 (반투명 글래스 링) */}
			<div className="relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-125">
				{/* 선택 시 파동 펄스 */}
				{isSelected && (
					<>
						<span
							className="absolute w-8 h-8 rounded-full animate-ping opacity-60 pointer-events-none"
							style={{ backgroundColor: color }}
						/>
						<span
							className="absolute w-6 h-6 rounded-full opacity-30 pointer-events-none"
							style={{ backgroundColor: color }}
						/>
					</>
				)}

				{/* 외곽 수계 컬러 링 + 반투명 글래스 중심 */}
				<div
					className="w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm"
					style={{
						backgroundColor: "rgba(255, 255, 255, 0.65)",
						border: `2.5px solid ${color}`,
					}}
				>
					{/* 중심 미니 포인트 */}
					<div
						className="w-1.5 h-1.5 rounded-full"
						style={{ backgroundColor: color }}
					/>
				</div>
			</div>

			{/* 2. 우측 다이렉트 텍스트 라벨 (가로형 배치) */}
			<span
				style={{
					textShadow:
						"-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 5px rgba(255,255,255,0.95), 0 2px 4px rgba(0,0,0,0.25)",
				}}
				className="ml-1.5 text-[11px] font-black text-slate-950 tracking-tight whitespace-nowrap pointer-events-none select-none transition-transform group-hover:scale-105"
			>
				{station.name.replace(" 측정소", "")}
			</span>
		</div>
	);
});

// 2. 소규모 감시망 마커 (미니 마이크로 다이아몬드 큐브 - 글래스 반투명)
export const SmallMarker = React.memo(function SmallMarker({
	station,
	color,
	isSelected,
}: {
	station: Station;
	color: string;
	isSelected?: boolean;
}) {
	// 소규모 전용 시안/에메랄드 포인트 컬러 (국가망 파랑과 확실한 대비)
	const smallColor = color === "#2563eb" ? "#059669" : color;

	return (
		<div className="relative group cursor-pointer select-none flex items-center">
			{/* 미니 마름모 다이아몬드 마커 (w-2.5 h-2.5) */}
			<div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-140">
				{/* 선택 시 마름모 펄스 */}
				{isSelected && (
					<span
						className="absolute w-5 h-5 rotate-45 animate-ping opacity-60 pointer-events-none rounded-[1px]"
						style={{ backgroundColor: smallColor }}
					/>
				)}

				{/* 미니 컴팩트 마름모(Diamond) 외곽 테두리 + 반투명 글래스 내부 */}
				<div
					className="w-2.5 h-2.5 rotate-45 flex items-center justify-center shadow-xs rounded-[1.5px]"
					style={{
						backgroundColor: "rgba(255, 255, 255, 0.75)",
						border: `1.5px solid ${smallColor}`,
					}}
				>
					{/* 중심 마이크로 코어 포인트 */}
					<div
						className="w-0.8 h-0.8 rounded-full"
						style={{ backgroundColor: smallColor }}
					/>
				</div>

				{/* 호버 시에만 나타나는 플로팅 미니 라벨 (또렷한 가독성) */}
				<span
					style={{
						backgroundColor: "transparent",
						textShadow:
							"-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 5px rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.25)",
					}}
					className="absolute left-1/2 -top-5 -translate-x-1/2 px-1 py-0.2 text-[9.5px] font-black text-slate-950 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 select-none"
				>
					{station.name}
				</span>
			</div>
		</div>
	);
});

// 3. 관심 지점 (POI - 랜드마크 다이아몬드 스타 뱃지 - 글래스 반투명)
export const PoiMarker = React.memo(function PoiMarker({
	station,
	color,
	isSelected,
}: {
	station: Station;
	color: string;
	isSelected?: boolean;
}) {
	return (
		<div className="relative group cursor-pointer select-none flex items-center">
			<div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-120">
				{isSelected && (
					<span
						className="absolute w-7 h-7 rounded-full animate-ping opacity-60 pointer-events-none"
						style={{ backgroundColor: color }}
					/>
				)}
				<svg
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="drop-shadow-xs"
				>
					<rect
						x="12"
						y="1"
						width="15"
						height="15"
						rx="3"
						transform="rotate(45 12 1)"
						fill={color}
						fillOpacity="0.6"
						stroke="white"
						strokeWidth="2"
					/>
					<path
						d="M12 7L13.2 10.2L16.5 10.5L14 12.7L14.7 16L12 14.3L9.3 16L10 12.7L7.5 10.5L10.8 10.2L12 7Z"
						fill="white"
					/>
				</svg>
			</div>

			<span
				style={{
					backgroundColor: "transparent",
					textShadow:
						"-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 5px rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.25)",
				}}
				className="ml-1 px-1 py-0.2 text-[10px] font-black text-rose-900 whitespace-nowrap pointer-events-none select-none"
			>
				{station.name}
			</span>
		</div>
	);
});

// 4. 하천 유향 화살표 (Flow Arrow - 글래스 반투명 수류 화살표)
export const ArrowMarker = React.memo(function ArrowMarker({
	station,
	showLabel = false,
}: {
	station: Station;
	showLabel?: boolean;
}) {
	const angle = station.angle || 0;
	const isSpecial = station.name?.includes("→");
	const strokeColor = isSpecial ? "#f43f5e" : "#ffffff";

	return (
		<div className="relative cursor-pointer select-none flex items-center">
			<div
				style={{
					width: 26,
					height: 26,
					transform: `rotate(${angle}deg)`,
					transition: "transform 0.15s ease-out",
				}}
				className="flex items-center justify-center transition-transform hover:scale-120"
			>
				<svg
					viewBox="0 0 24 24"
					width="24"
					height="24"
					className="overflow-visible drop-shadow-sm"
				>
					<path
						d="M12 2.5 L20 12.5 H15 V21.5 H9 V12.5 H4 L12 2.5 Z"
						fill="#10b981"
						fillOpacity="0.65"
						stroke={strokeColor}
						strokeWidth="2"
						strokeLinejoin="round"
					/>
				</svg>
			</div>
			{showLabel && station.name && (
				<span
					style={{
						backgroundColor: "transparent",
						textShadow:
							"-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 5px rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.25)",
					}}
					className="ml-1 text-[9.5px] font-black text-emerald-950 whitespace-nowrap pointer-events-none select-none"
				>
					{station.name}
				</span>
			)}
		</div>
	);
});
