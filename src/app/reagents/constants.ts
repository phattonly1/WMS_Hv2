export const PEOPLE_LIST = [
	"구가",
	"서의화",
	"신미한",
	"여강원",
	"충달",
	"청경",
	"복능",
] as const;

export type ReagentPerson = (typeof PEOPLE_LIST)[number];
export type ReagentCategory = "TOC" | "TP" | "TN" | "기타";

export interface ReagentOrderSheet {
	id: string;
	title: string;
	deadline: string;
	deliveryDate: string;
	sortOrder: number;
	cells: Record<string, Partial<Record<ReagentPerson, string>>>;
	createdAt: string;
}

export interface ReagentRowSpec {
	id: string;
	category: ReagentCategory;
	device: string;
	company: string;
	reagentName: string;
	lastYearAvg: string;
	manualAvg: string;
	defaultVolume: number;
	mobileBadge?: string;
}

// 엑셀 시트의 녹색 셀(담당자별 실제 사용 시약) 매핑 (표준용액 3종은 PC 전용이므로 모바일에서 제외)
export const PERSON_GREEN_ROWS: Record<ReagentPerson, string[]> = {
	구가: [
		"toc-hcl",
		"tp-robo-molyb-new",
		"tp-robo-naoh",
		"tp-robo-ascorb-new",
		"tp-robo-k2s2o8",
		"tn-robo-alk-k2s2o8",
		"tn-robo-hcl",
	],
	서의화: [
		"toc-hcl",
		"tp-robo-molyb-old",
		"tp-robo-molyb-new",
		"tp-robo-naoh",
		"tp-robo-ascorb-old",
		"tp-robo-ascorb-new",
		"tp-robo-k2s2o8",
		"tp-hatp2000-molyb",
		"tp-hatp-ascorb",
		"tp-hatp-k2s2o8",
		"tn-robo-alk-k2s2o8",
		"tn-robo-hcl",
	],
	신미한: [
		"toc-hcl",
		"toc-h3po4",
		"toc-na2s2o8-new",
		"tp-robo-molyb-new",
		"tp-robo-naoh",
		"tp-robo-ascorb-new",
		"tp-robo-k2s2o8",
		"tn-robo-alk-k2s2o8",
		"tn-robo-hcl",
	],
	여강원: [
		"toc-hcl",
		"toc-h3po4",
		"toc-na2s2o8-new",
		"tp-hatp2000-molyb",
		"tp-hatp-ascorb",
		"tp-hatp-k2s2o8",
		"tn-hatn2000-alk",
		"tn-hatn2000-hcl",
		"etc-daphnia",
	],
	충달: [
		"toc-hcl",
		"toc-h3po4",
		"toc-na2s2o8-new",
		"tp-hatp4000h-molyb",
		"tp-hatp-ascorb",
		"tp-hatp-k2s2o8",
		"tn-hatn4000-alk",
		"tn-hatn4000-hcl",
	],
	청경: [
		"toc-hcl",
		"toc-h3po4",
		"toc-na2s2o8-old",
		"tp-hatp2000-molyb",
		"tp-hatp-ascorb",
		"tp-hatp-k2s2o8",
		"tn-hatn2000-alk",
		"tn-hatn2000-hcl",
	],
	복능: [
		"toc-hcl",
		"tp-hatp2000-molyb",
		"tp-hatp-ascorb",
		"tp-hatp-k2s2o8",
		"tn-hatn2000-alk",
		"tn-hatn2000-hcl",
	],
};

const CATEGORY_ORDER: Record<ReagentCategory, number> = {
	TOC: 0,
	TP: 1,
	TN: 2,
	기타: 3,
};

const RAW_REAGENT_SPEC_ROWS: ReagentRowSpec[] = [
	{
		id: "toc-hcl",
		category: "TOC",
		device: "TOC-4200,4110",
		company: "동일시마즈",
		reagentName: "염산",
		lastYearAvg: "0.5",
		manualAvg: "0.7",
		defaultVolume: 1,
	},
	{
		id: "toc-h3po4",
		category: "TOC",
		device: "HATA-4000, 4000B",
		company: "코비",
		reagentName: "인산",
		lastYearAvg: "1.4",
		manualAvg: "5.4",
		defaultVolume: 5,
	},
	{
		id: "toc-na2s2o8-old",
		category: "TOC",
		device: "HATA-4000",
		company: "코비",
		reagentName: "과황산나트륨(구형)",
		lastYearAvg: "2.1",
		manualAvg: "3.7",
		defaultVolume: 5,
	},
	{
		id: "toc-na2s2o8-new",
		category: "TOC",
		device: "HATA-4000B",
		company: "코비",
		reagentName: "과황산나트륨(신형)",
		lastYearAvg: "1",
		manualAvg: "1.5",
		defaultVolume: 5,
	},
	{
		id: "tp-robo-molyb-old",
		category: "TP",
		device: "Robochem TP",
		company: "백년기술",
		reagentName: "몰리브덴산 혼합용액(구)",
		lastYearAvg: "1.9",
		manualAvg: "0.4",
		defaultVolume: 1,
	},
	{
		id: "tp-robo-molyb-new",
		category: "TP",
		device: "Robochem-A4-TP",
		company: "백년기술",
		reagentName: "몰리브덴산 혼합용액(신)",
		lastYearAvg: "0.6",
		manualAvg: "0.4",
		defaultVolume: 1,
	},
	{
		id: "tp-robo-naoh",
		category: "TP",
		device: "Robochem 전체",
		company: "백년기술",
		reagentName: "수산화나트륨 2%",
		lastYearAvg: "0.5",
		manualAvg: "0.7",
		defaultVolume: 5,
	},
	{
		id: "tp-robo-ascorb-old",
		category: "TP",
		device: "Robochem 전체",
		company: "백년기술",
		reagentName: "아스크로빈산(구)",
		lastYearAvg: "",
		manualAvg: "",
		defaultVolume: 1,
	},
	{
		id: "tp-robo-ascorb-new",
		category: "TP",
		device: "Robochem 전체",
		company: "백년기술",
		reagentName: "아스크로빈산(신)",
		lastYearAvg: "",
		manualAvg: "",
		defaultVolume: 1,
	},
	{
		id: "tp-robo-k2s2o8",
		category: "TP",
		device: "Robochem 전체",
		company: "백년기술",
		reagentName: "과황산칼륨",
		lastYearAvg: "",
		manualAvg: "",
		defaultVolume: 5,
	},
	{
		id: "tp-hatp2000-molyb",
		category: "TP",
		device: "HATP-2000",
		company: "코비",
		reagentName: "몰리브덴산 혼합용액",
		lastYearAvg: "1.1",
		manualAvg: "1.4",
		defaultVolume: 5,
	},
	{
		id: "tp-hatp4000h-molyb",
		category: "TP",
		device: "HATP-4000H",
		company: "코비",
		reagentName: "몰리브덴산 혼합용액",
		lastYearAvg: "2.5",
		manualAvg: "2.9",
		defaultVolume: 5,
	},
	{
		id: "tp-hatp-ascorb",
		category: "TP",
		device: "HATP 전체",
		company: "코비",
		reagentName: "아스크로빈산",
		lastYearAvg: "",
		manualAvg: "",
		defaultVolume: 5,
	},
	{
		id: "tp-hatp-k2s2o8",
		category: "TP",
		device: "HATP 전체",
		company: "코비",
		reagentName: "과황산칼륨",
		lastYearAvg: "",
		manualAvg: "",
		defaultVolume: 5,
	},
	{
		id: "tn-robo-alk-k2s2o8",
		category: "TN",
		device: "Robochem 전체",
		company: "백년기술",
		reagentName: "알칼리 과황산칼륨",
		lastYearAvg: "0.5",
		manualAvg: "1.5",
		defaultVolume: 5,
	},
	{
		id: "tn-robo-hcl",
		category: "TN",
		device: "Robochem 전체",
		company: "백년기술",
		reagentName: "염산용액(1+16)",
		lastYearAvg: "1",
		manualAvg: "2.9",
		defaultVolume: 5,
	},
	{
		id: "tn-hatn2000-alk",
		category: "TN",
		device: "HATN-2000",
		company: "코비",
		reagentName: "알칼리 과황산칼륨",
		lastYearAvg: "1.3",
		manualAvg: "3.6",
		defaultVolume: 5,
	},
	{
		id: "tn-hatn2000-hcl",
		category: "TN",
		device: "HATN-2000",
		company: "코비",
		reagentName: "염산용액",
		lastYearAvg: "2",
		manualAvg: "6.5",
		defaultVolume: 5,
	},
	{
		id: "tn-hatn4000-alk",
		category: "TN",
		device: "HATN-4000",
		company: "코비",
		reagentName: "알칼리 과황산칼륨",
		lastYearAvg: "2.3",
		manualAvg: "2.2",
		defaultVolume: 5,
	},
	{
		id: "tn-hatn4000-hcl",
		category: "TN",
		device: "HATN-4000",
		company: "코비",
		reagentName: "염산용액",
		lastYearAvg: "3.5",
		manualAvg: "2.9",
		defaultVolume: 5,
	},
	{
		id: "etc-daphnia",
		category: "기타",
		device: "물벼룩 배양액",
		company: "",
		reagentName: "",
		lastYearAvg: "",
		manualAvg: "10",
		defaultVolume: 10,
	},
	{
		id: "etc-std-toc",
		category: "기타",
		device: "TOC 표준용액(1,000ppm)",
		company: "",
		reagentName: "",
		lastYearAvg: "1L / 6개월",
		manualAvg: "",
		defaultVolume: 1,
	},
	{
		id: "etc-std-tn",
		category: "기타",
		device: "TN 표준용액(100ppm)",
		company: "",
		reagentName: "",
		lastYearAvg: "1L / 6개월",
		manualAvg: "",
		defaultVolume: 1,
	},
	{
		id: "etc-std-tp",
		category: "기타",
		device: "TP 표준용액(100ppm)",
		company: "",
		reagentName: "",
		lastYearAvg: "1L / 6개월",
		manualAvg: "",
		defaultVolume: 1,
	},
];

// 시약이 배열 어디에 추가되더라도 TOC -> TP -> TN -> 기타 순서로 자동 그룹핑 보장
export const REAGENT_SPEC_ROWS: ReagentRowSpec[] = [
	...RAW_REAGENT_SPEC_ROWS,
].sort((a, b) => CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category]);

export const SUMMARY_SHEET_ID = "__SUMMARY__";
export const VOLUME_OPTIONS = [1, 2, 5, 10] as const;

interface ParsedCellResult {
	buckets: Record<number, number>; // { 1: count, 2: count, 5: count, 10: count }
	total: number;
	breakdownText: string; // e.g. "5L × 2개" or "5L × 2개 + 2L × 1개"
	isFormula: boolean;
}

/**
 * 셀 문자열("5 × 2", "5 × 2 + 2 × 1", "10" 등)을 파싱하여 용량별 개수와 총합(L)을 산출
 */
export function parseCellExpression(
	raw: string | undefined,
	defaultVol = 5,
): ParsedCellResult {
	const emptyBuckets: Record<number, number> = { 1: 0, 2: 0, 5: 0, 10: 0 };
	if (!raw) {
		return {
			buckets: emptyBuckets,
			total: 0,
			breakdownText: "0L",
			isFormula: false,
		};
	}

	const trimmed = raw.trim();
	if (!trimmed || trimmed === "-" || trimmed === "0") {
		return {
			buckets: emptyBuckets,
			total: 0,
			breakdownText: "0L",
			isFormula: false,
		};
	}

	const parts = trimmed.split("+").map((s) => s.trim());
	let total = 0;
	let hasFormula = false;

	for (const part of parts) {
		const multMatch = part.match(
			/^(\d+(?:\.\d+)?)\s*[L]?\s*[xX×*]\s*(\d+(?:\.\d+)?)/i,
		);
		if (multMatch) {
			const vol = Number(multMatch[1]);
			const cnt = Number(multMatch[2]);
			if (Number.isFinite(vol) && Number.isFinite(cnt) && vol > 0 && cnt > 0) {
				emptyBuckets[vol] = (emptyBuckets[vol] || 0) + cnt;
				total += vol * cnt;
				hasFormula = true;
			}
			continue;
		}

		const singleNum = Number(part.replace(/L$/i, ""));
		if (Number.isFinite(singleNum) && singleNum > 0) {
			total += singleNum;
			if (
				defaultVol > 0 &&
				singleNum >= defaultVol &&
				singleNum % defaultVol === 0 &&
				(defaultVol === 1 ||
					defaultVol === 2 ||
					defaultVol === 5 ||
					defaultVol === 10)
			) {
				emptyBuckets[defaultVol] =
					(emptyBuckets[defaultVol] || 0) + singleNum / defaultVol;
			} else if (
				singleNum === 1 ||
				singleNum === 2 ||
				singleNum === 5 ||
				singleNum === 10
			) {
				emptyBuckets[singleNum] = (emptyBuckets[singleNum] || 0) + 1;
			} else {
				emptyBuckets[1] = (emptyBuckets[1] || 0) + singleNum;
			}
		}
	}

	total = Number(total.toFixed(2));
	const breakdownParts: string[] = [];
	for (const v of [10, 5, 2, 1]) {
		const c = emptyBuckets[v] || 0;
		if (c > 0) {
			breakdownParts.push(`${v}L × ${c}개`);
		}
	}

	return {
		buckets: emptyBuckets,
		total,
		breakdownText:
			breakdownParts.length > 0 ? breakdownParts.join(" + ") : `${total}L`,
		isFormula: hasFormula || breakdownParts.length > 0,
	};
}

/**
 * 회차 제목에서 ' 시약 주문' 및 괄호 내용(예: '(5/18 납기)', '(8/28 마감)') 정리
 * 예: '3차 시약 주문 (5/18 납기)' -> '3차'
 */
export function formatSheetShortTitle(title: string): string {
	return title
		.replace(/\s*시약\s*주문/g, "")
		.replace(/\s*\([^)]*\)/g, "")
		.trim();
}

/**
 * 마감일 문자열(예: '10/23', '9/30', '2026-10-23')을 기반으로 D-Day 태그 정보 계산
 */
export function getDeadlineDDay(deadline: string | undefined): {
	text: string;
	badgeClass: string;
} | null {
	if (!deadline || deadline === "-" || !deadline.trim()) return null;

	const parts = deadline.match(/(\d{1,4})[./-](\d{1,2})(?:[./-](\d{1,2}))?/);
	if (!parts) return null;

	const now = new Date();
	const currentYear = now.getFullYear();

	let year = currentYear;
	let month: number;
	let day: number;

	if (parts[3]) {
		year = Number(parts[1]);
		month = Number(parts[2]);
		day = Number(parts[3]);
	} else if (parts[2]) {
		month = Number(parts[1]);
		day = Number(parts[2]);
	} else {
		return null;
	}

	const target = new Date(year, month - 1, day, 23, 59, 59);
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const diffMs = target.getTime() - today.getTime();
	const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays < 0) {
		return {
			text: "마감",
			badgeClass:
				"bg-black/5 dark:bg-white/5 text-[#94a3b8] dark:text-[#52525b] border-transparent",
		};
	}
	if (diffDays === 0) {
		return {
			text: "D-Day",
			badgeClass:
				"bg-rose-500/15 text-rose-600 dark:text-[#f87171] border-rose-500/30",
		};
	}
	if (diffDays <= 3) {
		return {
			text: `D-${diffDays}`,
			badgeClass:
				"bg-amber-500/15 text-amber-600 dark:text-[#fbbf24] border-amber-500/30",
		};
	}
	return {
		text: `D-${diffDays}`,
		badgeClass:
			"bg-blue-500/15 text-[#2563eb] dark:text-[#60a5fa] border-blue-500/30",
	};
}

/**
 * 용량별 개수 버킷을 DB/엑셀 저장용 문자열로 직렬화
 * - 단일 용량일 때: "5 × 2" (엑셀 원본 포맷 호환)
 * - 복합 용량일 때: "5 × 2 + 2 × 1"
 */
export function serializeBuckets(buckets: Record<number, number>): string {
	const active = [10, 5, 2, 1].filter((v) => (buckets[v] || 0) > 0);
	if (active.length === 0) return "";
	return active.map((v) => `${v} × ${buckets[v]}`).join(" + ");
}

/**
 * 모바일 1줄 리스트에서 시약명 축약 및 배지 자동 생성
 * - mobileBadge가 지정되어 있으면 최우선 사용
 * - 신규 제조사가 추가되어도 2~4글자 축약 배지로 자동 폴백
 */
export function getMobileReagentLabel(row: ReagentRowSpec): {
	mainName: string;
	companyBadge?: string;
} {
	if (!row.reagentName) {
		return { mainName: row.device, companyBadge: row.mobileBadge };
	}
	const shortName = row.reagentName.replace(" 혼합용액", "");
	if (row.mobileBadge) {
		return { mainName: shortName, companyBadge: row.mobileBadge };
	}
	const companyBadge =
		row.company === "백년기술"
			? "백년"
			: row.company === "동일시마즈"
				? "시마즈"
				: row.company === "코비"
					? row.device === "HATP-4000H"
						? "4000H"
						: "코비"
					: row.company
						? row.company.slice(0, 4)
						: undefined;

	return { mainName: shortName, companyBadge };
}
