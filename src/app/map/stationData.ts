// 측정소 타입 및 설정 (클라이언트용)
// 데이터는 Supabase에서 가져옴 (actions.ts 참조)

import { AlertTriangle, Droplets, Mountain, Waves } from "lucide-react";
import type React from "react";

export type RiverType = "han" | "bukhan" | "namhan" | "imjin" | "pyeongtaek";
export type StationType = "station" | "small" | "poi" | "arrow";
export type Equipment = {
	item: string;
	manufacturer: string;
	model: string;
	details?: any;
};

export interface MapFilters {
	station: boolean;
	small: boolean;
	poi: boolean;
	arrow: "none" | "name" | "no-name";
	rivers: Record<RiverType, boolean>;
	highlightedRiver?: RiverType | null; // 특정 수계 강조 (굵기 & 채도 극대화)
}

// 측정소 마스터 타입 (stations_master)
export interface StationMaster {
	id: string;
	station_id: string;
	name: string;
	type: "station" | "small";
	river: RiverType;
	office: string;
	lat: number;
	lng: number;
	address?: string;
	facility_type?: string;
	install_date?: string;
	description?: string;
	thresholds?: Record<string, { min?: number; max?: number; unit?: string }>;
	photo_url?: string;
	status: "현재" | "종료";
	change_reason?: string;
	created_at?: string;
}

// 기기/자산 제원 타입 (station_assets)
// 통합 지도 보조 마커 타입 (map_markers)
export interface MapMarker {
	id: string;
	reg_no?: number;
	type: "arrow" | "poi";
	name: string;
	river: RiverType;
	lat: number;
	lng: number;
	category?: string;
	related_station_id?: string;
	angle?: number;
	arrow_type?: string;
	color?: string;
	description?: string;
}

export interface Station {
	id?: string;
	name: string;
	lat: number;
	lng: number;
	type: StationType;
	river: RiverType;
	color?: string;
	path?: [number, number][];
	history?: { date: string; desc: string }[];
	features?: string[];
	instruments?: string[];
	is_deleted?: boolean;
	angle?: number; // 화살표 방향 (0-360도, 0=북쪽, 90=동쪽)
	office?: string;
	address?: string;
	facility_type?: string;
	install_date?: string;
	related_station_id?: string;
	description?: string;
}

// 수계별 아이콘 매핑
export const RIVER_ICONS: Record<RiverType, React.ElementType> = {
	han: Droplets,
	bukhan: Mountain,
	namhan: Waves,
	imjin: AlertTriangle,
	pyeongtaek: Waves,
};

// 수계별 색상 및 설정
export const RIVER_CONFIG: Record<
	RiverType,
	{ label: string; labelEn: string; color: string; bgClass: string }
> = {
	bukhan: {
		label: "북한강",
		labelEn: "North Han",
		color: "#06b6d4",
		bgClass: "cyan",
	},
	namhan: {
		label: "남한강",
		labelEn: "South Han",
		color: "#3b82f6",
		bgClass: "blue",
	},
	han: {
		label: "한강본류",
		labelEn: "Han River",
		color: "#6366f1",
		bgClass: "indigo",
	},
	imjin: {
		label: "임진강",
		labelEn: "Imjin River",
		color: "#f97316",
		bgClass: "orange",
	},
	pyeongtaek: {
		label: "평택호",
		labelEn: "Pyeongtaek Lake",
		color: "#10b981",
		bgClass: "emerald",
	},
};

// 타입별 설정
export const TYPE_CONFIG: Record<
	StationType,
	{ label: string; color: string }
> = {
	station: { label: "국가 측정소", color: "#0033cc" },
	small: { label: "소규모 감시망", color: "#0d9488" },
	poi: { label: "관심지점", color: "#ef4444" },
	arrow: { label: "흐름 방향", color: "#10b981" },
};

/**
 * 측정소의 색상을 결정하는 헬퍼 함수
 * 우선순위: 수계 색상 (관심지점/화살표 등) > 타입 색상 (국가/소규모)
 */
export function getStationColor(station: Station): string {
	if (!station) return "#6366f1";
	if (station.color) return station.color;
	if (station.type === "arrow") return TYPE_CONFIG.arrow?.color || "#10b981";
	if (station.type === "poi")
		return (station.river && RIVER_CONFIG[station.river]?.color) || "#ef4444";
	if (station.type === "station" || station.type === "small")
		return TYPE_CONFIG[station.type]?.color || "#0033cc";
	return (station.river && RIVER_CONFIG[station.river]?.color) || "#6366f1";
}

/**
 * 측정소의 배열 필드(instruments, features, history 등)를 안전하게 파싱하는 헬퍼 함수
 */
export function parseStationArray<T = string>(field: any): T[] {
	if (!field) return [];
	if (Array.isArray(field)) return field;
	if (typeof field === "string") {
		const trimmed = field.trim();
		if (!trimmed) return [];
		if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
			try {
				const parsed = JSON.parse(trimmed.replace(/'/g, '"'));
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				return trimmed
					.slice(1, -1)
					.split(",")
					.map(
						(s: string) => s.trim().replace(/^['"]|['"]$/g, "") as unknown as T,
					);
			}
		}
		return [trimmed as unknown as T];
	}
	return [];
}

/**
 * 수계별 측정소 그룹핑 헬퍼 함수
 */
export function groupStationsByRiver(
	stations: Station[],
): Record<RiverType, Station[]> {
	const groups: Record<RiverType, Station[]> = {
		bukhan: [],
		namhan: [],
		han: [],
		imjin: [],
		pyeongtaek: [],
	};

	stations.forEach((s) => {
		if (s.river && groups[s.river]) {
			groups[s.river].push(s);
		}
	});

	return groups;
}

// --- 장비 프리셋 ---
export const EQUIPMENT_PRESETS: Equipment[] = [
	// 일반항목
	{ item: "일반항목", manufacturer: "YSI", model: "YSI6600EDS" },
	{ item: "일반항목", manufacturer: "YSI/Xylem", model: "EXO2" },
	{ item: "일반항목", manufacturer: "YSI", model: "YSI600XL" },
	// 총유기탄소 (TOC)
	{ item: "TOC", manufacturer: "시마즈", model: "TOC-4200" },
	{ item: "TOC", manufacturer: "시마즈", model: "TOC-4110" },
	{ item: "TOC", manufacturer: "KOBI", model: "HATA-4000" },
	{ item: "TOC", manufacturer: "KOBI", model: "HATA-4000B" },
	{ item: "TOC", manufacturer: "비엘프로세스", model: "Star TOCk" },
	// 총질소 (TN)
	{ item: "TN", manufacturer: "KOBI", model: "HATN-4000" },
	{ item: "TN", manufacturer: "KOBI", model: "HATN-2000" },
	{ item: "TN", manufacturer: "백년기술", model: "Robochem TN-2060" },
	{ item: "TN", manufacturer: "백년기술", model: "Robochem A2-TN" },
	{ item: "TN", manufacturer: "백년기술", model: "Robochem A4-TN" },
	{ item: "TN", manufacturer: "Moni", model: "Moni-TN 5100" },
	// 총인 (TP)
	{ item: "TP", manufacturer: "KOBI", model: "HATP-4000" },
	{ item: "TP", manufacturer: "KOBI", model: "HATP-4000H" },
	{ item: "TP", manufacturer: "KOBI", model: "HATP-2000" },
	{ item: "TP", manufacturer: "백년기술", model: "Robochem TP-2002" },
	{ item: "TP", manufacturer: "백년기술", model: "Robochem TP" },
	{ item: "TP", manufacturer: "Moni", model: "Moni-TP 3000" },
	// Bio
	{ item: "Bio", manufacturer: "EasyChem", model: "EasyChem" },
	{ item: "Bio", manufacturer: "microLAN", model: "iTOXcontrol" },
	{ item: "Bio", manufacturer: "bbe", model: "Daphnia Toximeter" },
	{ item: "Bio", manufacturer: "KOBI", model: "HATOX-2000" },
	{ item: "Algae", manufacturer: "bbe", model: "Algae Torch" },
	{ item: "Algae", manufacturer: "bbe", model: "Algae Online Analyzer" },
	{ item: "Algae", manufacturer: "Trilux", model: "Trilux Technologies" },
	// VOCs
	{ item: "VOCs", manufacturer: "PerkinElmer", model: "Clarus 680" },
	{ item: "VOCs", manufacturer: "PerkinElmer", model: "Clarus 680 (APK2950W)" },
];
