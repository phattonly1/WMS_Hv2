/**
 * src/app/dashboard/launcher/core/stations.ts
 * 한강수계 43개 측정소 및 7개 조별 편성 마스터 데이터 (Single Source of Truth)
 */

import {
	NATIONAL_STATION_ORDER_NAMES,
	SMALL_STATION_ORDER_NAMES,
} from "@/app/map/stations/stationOrder";

export { NATIONAL_STATION_ORDER_NAMES, SMALL_STATION_ORDER_NAMES };

export interface StationInfo {
	name: string;
	value: string;
	typeCode: "1" | "3"; // 1: 국가망, 3: 소규모
	teamId?: string;
	category?: "base" | "extra" | "small";
	label?: string;
}

export const WMS_NATIONAL_STATIONS: StationInfo[] = [
	{ name: "평창강", value: "S01007", typeCode: "1", teamId: "3" },
	{ name: "단양", value: "S01018", typeCode: "1", teamId: "1" },
	{ name: "충주", value: "S01014", typeCode: "1", teamId: "1" },
	{ name: "달천", value: "S01021", typeCode: "1", teamId: "1" },
	{ name: "강천", value: "S01011", typeCode: "1", teamId: "2" },
	{ name: "원주", value: "S01006", typeCode: "1", teamId: "2" },
	{ name: "청미천", value: "S01023", typeCode: "1", teamId: "3" },
	{ name: "여주", value: "S01005", typeCode: "1", teamId: "2" },
	{ name: "능서", value: "S01020", typeCode: "1", teamId: "4" },
	{ name: "복하천", value: "S01022", typeCode: "1", teamId: "4" },
	{ name: "흥천", value: "S01002", typeCode: "1", teamId: "4" },
	{ name: "양평", value: "S01025", typeCode: "1", teamId: "2" },
	{ name: "경안천", value: "S01003", typeCode: "1", teamId: "3" },
	{ name: "인제", value: "S01015", typeCode: "1", teamId: "6" },
	{ name: "화천", value: "S01019", typeCode: "1", teamId: "6" },
	{ name: "서상", value: "S01010", typeCode: "1", teamId: "6" },
	{ name: "의암호", value: "S01012", typeCode: "1", teamId: "6" },
	{ name: "가평", value: "S01001", typeCode: "1", teamId: "5" },
	{ name: "구리", value: "S01004", typeCode: "1", teamId: "5" },
	{ name: "포천", value: "S01017", typeCode: "1", teamId: "7" },
	{ name: "한탄강", value: "S01009", typeCode: "1", teamId: "7" },
	{ name: "신천", value: "S01013", typeCode: "1", teamId: "7" },
	{ name: "미산", value: "S01016", typeCode: "1", teamId: "7" },
];

export const WMS_SMALL_STATIONS: StationInfo[] = [
	{ name: "대가리천", value: "S01034", typeCode: "3", teamId: "3" },
	{ name: "장평천", value: "S01033", typeCode: "3", teamId: "3" },
	{ name: "동진천", value: "S01036", typeCode: "3", teamId: "5" },
	{ name: "구안천", value: "S01043", typeCode: "3", teamId: "5" },
	{ name: "요도천", value: "S01028", typeCode: "3", teamId: "1" },
	{ name: "원곡천", value: "S01027", typeCode: "3", teamId: "1" },
	{ name: "영덕천", value: "S01037", typeCode: "3", teamId: "1" },
	{ name: "앙성천", value: "S01029", typeCode: "3", teamId: "1" },
	{ name: "전천", value: "S01030", typeCode: "3", teamId: "2" },
	{ name: "원주천", value: "S01035", typeCode: "3", teamId: "2" },
	{ name: "양화천", value: "S01031", typeCode: "3", teamId: "4" },
	{ name: "신둔천", value: "S01045", typeCode: "3", teamId: "3" },
	{ name: "죽당천", value: "S01046", typeCode: "3", teamId: "3" },
	{ name: "금사천", value: "S01032", typeCode: "3", teamId: "4" },
	{ name: "곤지암천", value: "S01038", typeCode: "3", teamId: "3" },
	{ name: "조종천", value: "S01039", typeCode: "3", teamId: "5" },
	{ name: "왕숙천", value: "S01040", typeCode: "3", teamId: "7" },
	{ name: "신천", value: "S01041", typeCode: "3", teamId: "7" },
	{ name: "송전천", value: "S01044", typeCode: "3", teamId: "6" },
	{ name: "황구지천", value: "S01042", typeCode: "3", teamId: "6" },
];

export const ALL_STATIONS: StationInfo[] = [
	...WMS_NATIONAL_STATIONS,
	...WMS_SMALL_STATIONS,
];

interface TeamStationInfo {
	name: string;
	value: string;
	category: "base" | "extra" | "small";
	label?: string;
}

export interface TeamGroup {
	team: string;
	baseNat: TeamStationInfo[];
	extraNat: TeamStationInfo[];
	small: TeamStationInfo[];
}

export const INSPECTION_TEAMS: TeamGroup[] = [
	{
		team: "1조",
		baseNat: [
			{ name: "충주", value: "S01014", category: "base" },
			{ name: "달천", value: "S01021", category: "base" },
		],
		extraNat: [{ name: "단양", value: "S01018", category: "extra" }],
		small: [
			{ name: "요도천", value: "S01028", category: "small" },
			{ name: "원곡천", value: "S01027", category: "small" },
			{ name: "앙성천", value: "S01029", category: "small" },
			{ name: "영덕천", value: "S01037", category: "small" },
		],
	},
	{
		team: "2조",
		baseNat: [
			{ name: "여주", value: "S01005", category: "base" },
			{ name: "강천", value: "S01011", category: "base" },
			{ name: "원주", value: "S01006", category: "base" },
		],
		extraNat: [{ name: "양평", value: "S01025", category: "extra" }],
		small: [
			{ name: "전천", value: "S01030", category: "small" },
			{ name: "원주천", value: "S01035", category: "small" },
		],
	},
	{
		team: "3조",
		baseNat: [
			{ name: "청미천", value: "S01023", category: "base" },
			{ name: "경안천", value: "S01003", category: "base" },
		],
		extraNat: [{ name: "평창강", value: "S01007", category: "extra" }],
		small: [
			{ name: "죽당천", value: "S01046", category: "small" },
			{ name: "신둔천", value: "S01045", category: "small" },
			{ name: "곤지암천", value: "S01038", category: "small" },
			{ name: "대가리천", value: "S01034", category: "small" },
			{ name: "장평천", value: "S01033", category: "small" },
		],
	},
	{
		team: "4조",
		baseNat: [
			{ name: "복하천", value: "S01022", category: "base" },
			{ name: "능서", value: "S01020", category: "base" },
		],
		extraNat: [{ name: "흥천", value: "S01002", category: "extra" }],
		small: [
			{ name: "양화천", value: "S01031", category: "small" },
			{ name: "금사천", value: "S01032", category: "small" },
		],
	},
	{
		team: "5조",
		baseNat: [
			{ name: "구리", value: "S01004", category: "base" },
			{ name: "가평", value: "S01001", category: "base" },
		],
		extraNat: [],
		small: [
			{ name: "조종천", value: "S01039", category: "small" },
			{ name: "구안천", value: "S01043", category: "small" },
			{ name: "동진천", value: "S01036", category: "small" },
		],
	},
	{
		team: "6조",
		baseNat: [
			{ name: "서상", value: "S01010", category: "base" },
			{ name: "의암호", value: "S01012", category: "base" },
			{ name: "화천", value: "S01019", category: "base" },
		],
		extraNat: [{ name: "인제", value: "S01015", category: "extra" }],
		small: [
			{ name: "황구지천", value: "S01042", category: "small" },
			{ name: "송전천", value: "S01044", category: "small" },
		],
	},
	{
		team: "7조",
		baseNat: [
			{ name: "신천", value: "S01013", category: "base", label: "신천" },
			{ name: "미산", value: "S01016", category: "base" },
			{ name: "한탄강", value: "S01009", category: "base" },
		],
		extraNat: [{ name: "포천", value: "S01017", category: "extra" }],
		small: [
			{ name: "왕숙천", value: "S01040", category: "small" },
			{ name: "신천", value: "S01041", category: "small", label: "신천(소)" },
		],
	},
];

/**
 * 런처 주입용 JS 스크립트 (Single Source of Truth 기반 자동 생성)
 */
export const LAUNCHER_STATIONS_JS = `
    const NATIONAL_STATIONS = ${JSON.stringify(WMS_NATIONAL_STATIONS)};
    const SMALL_STATIONS = ${JSON.stringify(WMS_SMALL_STATIONS)};
    const ALL_STATIONS = [...NATIONAL_STATIONS, ...SMALL_STATIONS];
    const NATIONAL_STATION_ORDER_NAMES = ${JSON.stringify(NATIONAL_STATION_ORDER_NAMES)};
    const SMALL_STATION_ORDER_NAMES = ${JSON.stringify(SMALL_STATION_ORDER_NAMES)};
`;

/**
 * 7개 조별 측정소 편성 데이터 스크립트 (Single Source of Truth 기반 자동 생성)
 */
export const LAUNCHER_TEAMS_JS = `
    const INSPECTION_TEAMS_DATA = ${JSON.stringify(INSPECTION_TEAMS)};
    const BASE_NAT_VALUES = INSPECTION_TEAMS_DATA.flatMap(t => t.baseNat.map(s => s.value));
    const EXTRA_NAT_VALUES = INSPECTION_TEAMS_DATA.flatMap(t => t.extraNat.map(s => s.value));
    const SMALL_VALUES = INSPECTION_TEAMS_DATA.flatMap(t => t.small.map(s => s.value));
    const ALL_STATION_VALUES = [...BASE_NAT_VALUES, ...EXTRA_NAT_VALUES, ...SMALL_VALUES];
`;
