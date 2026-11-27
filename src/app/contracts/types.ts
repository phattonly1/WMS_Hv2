export interface ConsumableItem {
	id: number;
	manufacturer: string;
	partGroup: string;
	category: string;
	model: string;
	partNumber: string;
	name: string;
	spec: string;
	unit: string;
	baseQty: string;
	cycle: string;
	price25: number | null;
	price26: number | null;
	bidPrice?: number | null;
	note: string;
}

export interface BomPartItem {
	partCode: string;
	name: string;
	qty: number;
	unit: string;
	unitPrice?: number;
	isAnnualStandard?: boolean;
	spec?: string;
	altPart?: string;
}

export interface BomSubItem {
	circle: string;
	name: string;
	desc: string;
}

export interface BomCallout {
	no: number;
	circle: string;
	name: string;
	desc: string;
	defaultPartCodes?: string[];
	subItems?: BomSubItem[];
}

export interface BomSection {
	id: string;
	stepNo: string;
	title: string;
	pageNo?: string;
	imageSrc: string;
	callouts: BomCallout[];
}

export interface BomModelData {
	label: string;
	partsMaster: BomPartItem[];
	sections: BomSection[];
}

export type BomDataset = Record<string, BomModelData>;

export type BudgetAccount = "maintenance" | "material";

export interface PlanLineEntry {
	selected: boolean;
	qty: number;
	customPrice?: number | null;
	bidPrice?: number | null;
	q1Qty?: number;
	q2Qty?: number;
	q3Qty?: number;
	budgetAccount?: BudgetAccount;
	memo?: string;
}

export interface HandoverPlanState {
	version: number;
	updatedAt: string;
	title: string;
	author: string;
	handoverNotes: string;
	mfgMemos: Record<string, string>;
	checkedActionIds: string[];
	entries: Record<number, PlanLineEntry>;
}

export type ActiveTab = "briefing" | "procurement" | "bom";

export const STORAGE_KEY = "wms_consumables_handover_v1";

export const MANUFACTURERS = [
	"전체",
	"HSKorea",
	"백년기술",
	"시마즈",
	"YSI",
	"기술과환경",
	"새론이엔아이",
	"KNR",
	"EasyChem",
	"티아이시스템",
	"스펙스",
	"제이엠이엔비",
	"BL프로세스",
] as const;

export const PART_GROUPS = [
	"전체",
	"일반소모품",
	"피팅",
	"튜브",
	"제어/보드부",
	"PC부",
	"브로셔(참고)",
] as const;

export const MANUFACTURER_BADGE: Record<string, string> = {
	HSKorea:
		"bg-[#38bdf8]/15 text-[#0284c7] dark:text-[#38bdf8] border-[#38bdf8]/30",
	기술과환경:
		"bg-[#10b981]/15 text-[#059669] dark:text-[#34d399] border-[#10b981]/30",
	백년기술:
		"bg-[#f59e0b]/15 text-[#f59e0b] dark:text-[#fbbf24] border-[#f59e0b]/30",
	YSI: "bg-[#06b6d4]/15 text-[#0284c7] dark:text-[#06b6d4] border-[#06b6d4]/30",
	시마즈:
		"bg-[#2563eb]/15 text-[#2563eb] dark:text-[#93c5fd] border-[#2563eb]/40",
	새론이엔아이:
		"bg-[#10b981]/15 text-[#059669] dark:text-[#34d399] border-[#10b981]/30",
	KNR: "bg-[#f59e0b]/15 text-[#f59e0b] dark:text-[#fbbf24] border-[#f59e0b]/30",
	EasyChem:
		"bg-[#f59e0b]/15 text-[#f59e0b] dark:text-[#fbbf24] border-[#f59e0b]/30",
	티아이시스템:
		"bg-[#10b981]/15 text-[#059669] dark:text-[#34d399] border-[#10b981]/30",
	스펙스:
		"bg-[#06b6d4]/15 text-[#0284c7] dark:text-[#06b6d4] border-[#06b6d4]/30",
	제이엠이엔비:
		"bg-[#38bdf8]/15 text-[#0284c7] dark:text-[#38bdf8] border-[#38bdf8]/30",
	BL프로세스:
		"bg-[#2563eb]/15 text-[#2563eb] dark:text-[#60a5fa] border-[#2563eb]/30",
};

export const GROUP_BADGE: Record<string, string> = {
	일반소모품:
		"bg-[#f1f5f9] dark:bg-[#222228] text-[#334155] dark:text-[#d4d4d8] border-[#cbd5e1] dark:border-[#3f3f46]",
	피팅: "bg-[#10b981]/15 text-[#059669] dark:text-[#34d399] border-[#10b981]/30",
	튜브: "bg-[#06b6d4]/15 text-[#0284c7] dark:text-[#06b6d4] border-[#06b6d4]/30",
	PC부: "bg-[#f59e0b]/15 text-[#f59e0b] dark:text-[#fbbf24] border-[#f59e0b]/30",
	"제어/보드부":
		"bg-[#f43f5e]/15 text-[#f43f5e] dark:text-[#f87171] border-[#f43f5e]/30",
	"브로셔(참고)":
		"bg-[#2563eb]/10 text-[#1d4ed8] dark:text-[#60a5fa] border-[#2563eb]/30",
};

export interface ManufacturerBrief {
	manufacturer: string;
	equipmentSummary: string;
	quoteBasis: string;
	contractStrategy: string;
	cautions: string[];
	hasBomGuide?: boolean;
}

export const MANUFACTURER_BRIEFS: ManufacturerBrief[] = [
	{
		manufacturer: "HSKorea",
		equipmentSummary:
			"TN/TP (HATN·HATP-2000/4000), TOC (HATA-2000/4000/4000A), 생물감시 (HATOX-2000)",
		quoteBasis:
			"부품코드표 원본 + 26.03.24 HSKorea 견적서(MPA2603-197-2) A안 통합",
		contractStrategy:
			"펌프튜브(#14·#16)·우레탄튜브는 Masterflex 등 호환 대체품 병행 검토 가능. 다수 기기 공용 부품(밸브·피팅·오링)은 측정소 통합수량으로 묶어 발주.",
		cautions: [
			"총 203종 중 67종 단가 확정 (PC부·일부 보드류 136종은 고장 시 별도 견적 품목)",
			"공용 부품 기준수량(baseQty)은 전체 기기 합산 기준이므로 발주 전 실소요 대수 차감 확인 필수",
			"장비 도해/BOM 탭에서 부위별 장착 위치 및 호환 대체품 규격 확인 가능",
		],
		hasBomGuide: true,
	},
	{
		manufacturer: "백년기술",
		equipmentSummary: "총질소·총인 측정기 (TN, TP, A4-TN, A4-TP)",
		quoteBasis: "25년 입찰 단가 + 26.04.10 견적가 비교 반영",
		contractStrategy:
			"44개 전 품목 25년 단가 보유 및 41개 품목 26년 견적 확보 완료(평균 약 +3%대 인상). 전년도 입찰 대비 단가 상승폭 검증 자료로 즉시 활용 가능.",
		cautions: [
			"무상 제공 품목 3건(0원 처리) 포함 여부 발주서 비고란 명시",
			"Top/Bottom 분할 단가 표기 품목은 세트 여부 확인 후 수량 산정",
		],
	},
	{
		manufacturer: "시마즈",
		equipmentSummary: "총유기탄소 측정기 (TOC-4200)",
		quoteBasis: "26.10월 확정단가 + 25년 견적단가 + 브로셔 참고품목",
		contractStrategy:
			"연소관(Combustion Tube)·백금촉매·시린지·밸브 로터 등 주기성 핵심 소모품 위주로 연간 단가계약 목록 편성.",
		cautions: [
			"'브로셔(참고)' 구분 14종 및 25년 구단가만 있는 품목은 계약 전 최신 단가 재확인 필요",
			"구품번(브로셔 번호)과 신품번(S638-...) 혼용 주의",
		],
	},
	{
		manufacturer: "YSI",
		equipmentSummary: "다항목 수질측정기 (EXO2 Sonde 및 스마트 센서류)",
		quoteBasis: "26.04.01 동문이엔티 본견적 (조달 물품식별번호: 22470285)",
		contractStrategy:
			"센서별 교체주기(2년/4년/고장시)가 명확하므로 측정소별 센서 도입연도를 대조하여 도래분만 선별 반영.",
		cautions: [
			"Bulkhead(119087)는 고장 시 교체 품목으로 현재 단가 미기재(필요 시 추가 견적)",
			"표준용액(pH 4·7·10) 박스 단위(6 pints) 규격 확인",
		],
	},
	{
		manufacturer: "기술과환경",
		equipmentSummary: "일반항목 다항목 수질측정기 (M-1000U)",
		quoteBasis: "26.10.12 기술과환경 견적 반영 + M-1000U 규격서",
		contractStrategy:
			"전도도(C02)·pH(P02) 등 교체 빈도가 높은 전극 센서 위주 단가 확보 완료.",
		cautions: [
			"10종 중 3종만 26년 견적 반영됨 — DO 센서 등 나머지 7종 발주 포함 시 사전 견적 요청 필요",
		],
	},
];

export interface HandoverCheckItem {
	id: string;
	phase: string;
	title: string;
	desc: string;
}

export const HANDOVER_CHECKLIST: HandoverCheckItem[] = [
	{
		id: "chk-1",
		phase: "1단계 · 수량 산정",
		title: "측정소별 현행 재고 차감 및 공용 부품 배분 확인",
		desc: "실시간 재고(/items)와 대조하여 여유 재고분 차감, HSKorea 공용 부품 중복 계상 여부 점검",
	},
	{
		id: "chk-2",
		phase: "2단계 · 단가 검증",
		title: "26년 미확보 단가 품목(25년 단가 대체분·미기재분) 추가 견적 징구",
		desc: "시마즈 구단가 품목 및 기술과환경·HSKorea 중 금회 구매 대상에 포함된 미단가 품목 확인",
	},
	{
		id: "chk-3",
		phase: "3단계 · 호환품 검토",
		title: "펌프튜브·이송튜브 등 범용 규격품 별도 구매(예산 절감) 여부 결정",
		desc: "장비 도해/BOM 탭의 Masterflex 및 우레탄/테프론 규격 대체품 내역 참조",
	},
	{
		id: "chk-4",
		phase: "4단계 · 설계 내역서 확정",
		title: "구매 산출 리스트 확정 후 엑셀(.xlsx) 및 인수인계 백업(.json) 보관",
		desc: "우측 상단 내보내기 버튼으로 계약 설계 기초자료 엑셀 파일 및 후임자 인계용 JSON 파일 생성",
	},
];

export function parseBaseQty(raw: string): number {
	const parsed = Number.parseFloat(raw);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function splitModels(modelStr: string): string[] {
	if (!modelStr) return [];
	return modelStr
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

export function formatWon(value: number | null | undefined): string {
	if (value === null || value === undefined) return "-";
	if (value === 0) return "무상";
	return `₩${value.toLocaleString("ko-KR")}`;
}

export function calcDiffPercent(
	p25: number | null,
	p26: number | null,
): { label: string; isUp: boolean } | null {
	if (p25 === null || p26 === null || p25 <= 0) return null;
	const pct = ((p26 - p25) / p25) * 100;
	const sign = pct > 0 ? "+" : "";
	return {
		label: `${sign}${pct.toFixed(1)}%`,
		isUp: pct > 0,
	};
}

export function resolveUnitPrice(
	item: ConsumableItem,
	entry?: PlanLineEntry,
): { price: number | null; source: "custom" | "26" | "25" | "none" } {
	if (
		entry?.customPrice !== undefined &&
		entry?.customPrice !== null &&
		!Number.isNaN(entry.customPrice)
	) {
		return { price: entry.customPrice, source: "custom" };
	}
	if (item.price26 !== null) {
		return { price: item.price26, source: "26" };
	}
	if (item.price25 !== null) {
		return { price: item.price25, source: "25" };
	}
	return { price: null, source: "none" };
}

const MATERIAL_KEYWORDS = [
	"표준용액",
	"표준액",
	"시약",
	"전해액",
	"배지",
	"물벼룩",
	"standard",
	"solution",
	"buffer",
	"reagent",
	"electrolyte",
	"daphnia",
	"질소가스",
	"초순수",
	"증류수",
];

/** 품목의 예산과목(시설장비유지비 / 재료비) 결정 — 사용자 지정값 우선, 미지정 시 품명·규격 키워드로 자동 분류 */
export function resolveBudgetAccount(
	item: ConsumableItem,
	entry?: PlanLineEntry,
): BudgetAccount {
	if (entry?.budgetAccount) return entry.budgetAccount;
	const haystack = `${item.name} ${item.spec}`.toLowerCase();
	return MATERIAL_KEYWORDS.some((kw) => haystack.includes(kw))
		? "material"
		: "maintenance";
}

export function createDefaultPlanState(
	items: ConsumableItem[],
): HandoverPlanState {
	const entries: Record<number, PlanLineEntry> = {};
	for (const item of items) {
		// 기본 추천안: 정기 교체주기가 명시되어 있거나 26년 단가가 확보된 일반소모품/튜브/피팅을 초기 선택
		const hasPrice = item.price26 !== null || item.price25 !== null;
		const isCoreConsumable =
			item.partGroup === "일반소모품" ||
			item.partGroup === "튜브" ||
			item.partGroup === "피팅";
		const hasCycle = Boolean(item.cycle) && !item.cycle.includes("고장시");
		const autoSelect = hasPrice && (hasCycle || isCoreConsumable);

		entries[item.id] = {
			selected: autoSelect,
			qty: parseBaseQty(item.baseQty),
			memo: "",
		};
	}

	return {
		version: 1,
		updatedAt: new Date().toISOString(),
		title: "2027년도 통합발주 소모품 구매계획 및 인수인계서",
		author: "",
		handoverNotes:
			"1. 5개 제조사 26년 확보 견적 및 전년도 입찰 단가를 통합한 기준 리스트입니다.\n2. '구매·예산 산출' 탭에서 실제 발주 품목 체크 및 수량을 조정하면 예상 소요예산이 자동 집계됩니다.\n3. HSKorea 장비는 '장비 도해 · BOM 가이드' 탭에서 부위별 실물 위치와 호환 대체품 규격을 함께 확인하세요.",
		mfgMemos: {},
		checkedActionIds: [],
		entries,
	};
}
