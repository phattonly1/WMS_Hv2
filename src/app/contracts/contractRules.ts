export type PurchaseTypeId =
	| "direct_purchase"
	| "sole_source"
	| "small_quote"
	| "competitive";

export type ProcessActor =
	| "사업부서"
	| "계약부서"
	| "지출부서"
	| "조달청"
	| "업체";

export type AccountingStage = "품의" | "원인행위" | "결의" | "자금집행";
export type ProcessStepStatus = "active" | "conditional" | "skipped";

export interface ProcessStep {
	stepNo: number;
	actor: ProcessActor;
	action: string;
	detail: string;
	accountingStage?: AccountingStage;
	status?: ProcessStepStatus;
	flexClass?: string;
}

export interface PurchaseTypeRule {
	id: PurchaseTypeId;
	name: string;
	shortTag: string;
	ownerDept: string;
	amountRangeVat: string;
	amountRangeNote: string;
	legalBasis: string;
	summary: string;
	processSteps: ProcessStep[];
	cautionNote: string;
	accentClass: string;
}

export interface SoleSourceCriterion {
	id: string;
	badge: string;
	title: string;
	amountRangeVat: string;
	targetScope: string;
	legalBasis: string;
	requiredDocs: string[];
	note: string;
}

export interface DirectPurchaseCriterion {
	id: string;
	label: string;
	basis: string;
	detail: string;
}

export interface CompetitiveTier {
	id: string;
	tierLabel: string;
	amountRangeVat: string;
	estimatedPriceRef: string;
	reviewStandard: string;
	keyPoints: string[];
}

export type ManufacturerCategory = "국가망" | "소규모" | "부대장비·기타";

export interface ManufacturerContractRow {
	id: string;
	name: string;
	category: ManufacturerCategory;
	isExclusive?: boolean;
	equipment: string;
	maintenanceItems: string;
	materialItems: string;
	note: string;
}

/**
 * 한국환경공단(수도권동부환경본부) 2026.05 공식 실무교육 및 제도개선 기준 반영
 * - 전 구간 부가가치세(VAT) 포함 기준 통일
 * - 2,200만 원 초과 건은 MIS 발주계획(매년 12/20, 분기 3·6·9월 15일) 사전 입력 필수
 * - 자산(공기구비품)은 금액 무관 계약부서 요청, 조달 종합쇼핑몰(3자단가/MAS) 우선 원칙
 */
export const PURCHASE_TYPES: PurchaseTypeRule[] = [
	{
		id: "direct_purchase",
		name: "직접구매",
		shortTag: "부서 자체구매",
		ownerDept: "사업부서 자체 집행",
		amountRangeVat: "VAT 포함 1,000만 원 이하",
		amountRangeNote:
			"인지세 면제 한도 (2024.05.01 시행 · 기존 770만→1,000만 상향)",
		legalBasis:
			"소액구매 제도개선(24.04.17 동반성장부 · 24.05.01 시행) · 국가계약법 시행령 제26·30·49조",
		summary:
			"1,000만 원 초과는 인지세 납부 대상이므로 행정 간소화를 위해 부서 직접구매 한도를 VAT 포함 1,000만 원 이하로 설정(24.05.01 시행). 자산(공기구비품)은 금액 무관 계약부서 요청.",
		processSteps: [
			{
				stepNo: 1,
				actor: "사업부서",
				action: "MIS 발주계획 등록",
				detail: "2,200만 원 이하 미대상 (생략)",
				status: "skipped",
			},
			{
				stepNo: 2,
				actor: "사업부서",
				action: "예산확인 · 견적 요청",
				detail: "예산잔액 확인 · 2개사 비교견적 (독점·직접정비는 1인)",
				accountingStage: "품의",
			},
			{
				stepNo: 3,
				actor: "사업부서",
				action: "내부결재 상신(부장)",
				detail: "계획(안)·견적서 첨부 · 자체 발주(계약부서 생략)",
				accountingStage: "품의",
			},
			{
				stepNo: 4,
				actor: "계약부서",
				action: "공고 · 계약체결",
				detail: "계약부서 절차 없음 (사업부서 자체 발주)",
				accountingStage: "원인행위",
				status: "skipped",
			},
			{
				stepNo: 5,
				actor: "사업부서",
				action: "납품 · 검수결재(부장) · 직접 결의",
				detail: "검수조서(7일내) · 사업부서 품의·원인·결의",
				accountingStage: "결의",
			},
			{
				stepNo: 6,
				actor: "지출부서",
				action: "대금지급",
				detail: "자금집행(통장잔액확인)",
				accountingStage: "자금집행",
			},
		],
		cautionNote:
			"공공요금·여비·법인카드 등 계약 불필요 건은 원인행위 없이 바로 지출결의",
		accentClass:
			"bg-[#10b981]/15 text-[#059669] dark:text-[#34d399] border-[#10b981]/30",
	},
	{
		id: "sole_source",
		name: "수의계약",
		shortTag: "소액구매 · 1인 수의",
		ownerDept: "환경안전경영부 (MIS 구매요청 / 문서)",
		amountRangeVat: "1,000만~2,200만 원 / 독점(~1억) / 직접수리",
		amountRangeNote:
			"승낙사항(MIS: 1회 지급·연내) vs 표준계약(문서: 단가계약·연도초과)",
		legalBasis:
			"국가계약법 시행령 제26조·제30조·제49조 (지방계약법 시행령 제25조·제30조)",
		summary:
			"1,000만~2,200만 원 소액구매, 독점대리점계약서 보유 2개 업체(iTOX·EasyChem, 소매상 미납품 실제 독점) 1억 원 이하, 제조사 직접 수리 건에 적용. 단가계약·분할지급은 반드시 '표준계약(문서)'으로 요청합니다.",
		processSteps: [
			{
				stepNo: 1,
				actor: "사업부서",
				action: "MIS 발주계획 등록",
				detail: "2,200만 초과(독점·수리) 시 필수 · 품명 10자리",
				status: "conditional",
			},
			{
				stepNo: 2,
				actor: "사업부서",
				action: "예산확인 · 견적 요청",
				detail: "예산잔액 확인 · 견적서 · 독점대리점계약서(해당 시)",
				accountingStage: "품의",
			},
			{
				stepNo: 3,
				actor: "사업부서",
				action: "내부결재(처장) · 구매요청",
				detail: "납품기한·수의필수 · 총액은 조정배정(단가 자체집행)",
				accountingStage: "품의",
			},
			{
				stepNo: 4,
				actor: "계약부서",
				action: "승낙사항 · 계약체결",
				detail: "접수 · 가격검토 · 승낙사항/표준계약서 발송",
				accountingStage: "원인행위",
			},
			{
				stepNo: 5,
				actor: "사업부서",
				action: "납품 · 검수결재(부장) · 지급요청",
				detail: "MIS 검수조서 요청(7일내)·4대보험 → 계약부서 결의",
				accountingStage: "결의",
			},
			{
				stepNo: 6,
				actor: "지출부서",
				action: "대금지급",
				detail: "자금집행(통장잔액확인)",
				accountingStage: "자금집행",
			},
		],
		cautionNote:
			"수의계약 필수서류: 자가점검표 · 체크리스트 + [1인 수의 시] 수의계약사유서 · 이해충돌 3종(체결제한·퇴직자·임원현황)",
		accentClass:
			"bg-[#f59e0b]/15 text-[#f59e0b] dark:text-[#fbbf24] border-[#f59e0b]/30",
	},
	{
		id: "small_quote",
		name: "소액수의견적",
		shortTag: "소기업·소상공인 제한 · 낙찰하한 88%",
		ownerDept: "환경안전경영부 (MIS 계약의뢰관리 → 나라장터)",
		amountRangeVat: "VAT 포함 2,200만 원 이상 ~ 1억 1,000만 원 미만",
		amountRangeNote:
			"추정가격 2,000만~1억 미만 (소기업·소상공인 제한 · 가격만 평가)",
		legalBasis:
			"국가계약법 시행령 제26조 제1항 제5호 · 제30조 (지방계약법 시행령 제30조)",
		summary:
			"2,200만 원 이상 ~ 1억 1,000만 원 미만 구간은 소기업·소상공인 제한으로 나라장터 2인 이상 전자견적제출공고를 진행합니다. 입찰참가자격과 가격(낙찰하한율 물품 88%)만으로 낙찰자를 결정합니다.",
		processSteps: [
			{
				stepNo: 1,
				actor: "사업부서",
				action: "MIS 발주계획 등록",
				detail: "연간(12/20)·분기(3·6·9월 15일)·수시 · 품명 10자리",
			},
			{
				stepNo: 2,
				actor: "사업부서",
				action: "예산확인 · 설계견적 요청",
				detail: "예산잔액 확인 · 기초금액 견적 · 입찰 필수서류 3종",
				accountingStage: "품의",
			},
			{
				stepNo: 3,
				actor: "사업부서",
				action: "내부결재(처장) · 계약의뢰",
				detail: "입찰3종·자가점검 · 총액은 조정배정(단가 자체집행)",
				accountingStage: "품의",
			},
			{
				stepNo: 4,
				actor: "계약부서",
				action: "나라장터 견적공고 · 체결",
				detail: "사전규격(5일) → 본공고(3일·하한88%) · 체결",
				accountingStage: "원인행위",
			},
			{
				stepNo: 5,
				actor: "사업부서",
				action: "납품 · 검수결재(부장) · 지급요청",
				detail: "검사(14일내) · MIS 대금지급관리 → 계약부서 결의",
				accountingStage: "결의",
			},
			{
				stepNo: 6,
				actor: "지출부서",
				action: "대금지급",
				detail: "자금집행(통장잔액확인)",
				accountingStage: "자금집행",
			},
		],
		cautionNote:
			"입찰 필수서류 3종: 규격서 · 내역서 · 과업내용서 · 단가계약은 조정배정 없이 자체예산 집행",
		accentClass:
			"bg-[#06b6d4]/15 text-[#0284c7] dark:text-[#06b6d4] border-[#06b6d4]/30",
	},
	{
		id: "competitive",
		name: "경쟁입찰",
		shortTag: "단가계약 · 중앙조달(조달청)",
		ownerDept: "조달청 중앙조달 (MIS 계약의뢰관리 → 나라장터)",
		amountRangeVat: "VAT 포함 1억 1,000만 원 이상",
		amountRangeNote:
			"단가계약(국가계약법 제22조) · 최소 3주~한 달 전 발주 권장",
		legalBasis:
			"국가계약법 제22조(단가계약) · 시행령 제42조(적격심사) · 계약사무규칙 제12조",
		summary:
			"VAT 포함 1억 1,000만 원 이상 연간 통합 소모품은 조달청 중앙조달 단가계약 경쟁입찰로 추진합니다. 고시금액(VAT 포함 약 2.53억 원) 및 11억 원(추정가 10억) 경계에 따른 적격심사 기준을 적용합니다.",
		processSteps: [
			{
				stepNo: 1,
				actor: "사업부서",
				action: "MIS 발주계획 등록",
				detail: "연간(12/20)·분기(3·6·9월 15일)·수시 · 품명 10자리",
			},
			{
				stepNo: 2,
				actor: "사업부서",
				action: "예산확인 · 설계견적 요청",
				detail: "예산잔액 확인 · 기초금액 견적 · 입찰 필수서류 3종",
				accountingStage: "품의",
			},
			{
				stepNo: 3,
				actor: "사업부서",
				action: "내부결재(처장) · 중앙조달 의뢰",
				detail: "입찰3종 · 단가계약은 자체예산 집행(조정배정 없음)",
				accountingStage: "품의",
			},
			{
				stepNo: 4,
				actor: "조달청",
				action: "입찰공고 · 적격심사 체결",
				detail: "사전규격(5일) → 본공고(7일) → 적격심사·계약",
				accountingStage: "원인행위",
			},
			{
				stepNo: 5,
				actor: "사업부서",
				action: "분할검수(부장) · 지급요청",
				detail: "분할발주·검사(14일내) · MIS 대금지급관리 → 결의",
				accountingStage: "결의",
			},
			{
				stepNo: 6,
				actor: "지출부서",
				action: "대금지급",
				detail: "자금집행(통장잔액확인)",
				accountingStage: "자금집행",
			},
		],
		cautionNote:
			"입찰 필수서류 3종: 규격서 · 내역서 · 과업내용서 · 단순 납품 선금 불가 · 하자보증 1년",
		accentClass:
			"bg-[#2563eb]/15 text-[#2563eb] dark:text-[#60a5fa] border-[#2563eb]/30",
	},
];

/**
 * 부서 직접구매(1,000만 원 이하) 금액 설정 근거 및 집행 기준
 * 출처: (240417)소액구매 제도개선 추진 내용 (경영지원처 동반성장부, 2024.05.01 시행)
 */
export const DIRECT_PURCHASE_CRITERIA: DirectPurchaseCriterion[] = [
	{
		id: "dp-basis",
		label: "금액 설정 근거",
		basis: "VAT 포함 1,000만 원 이하",
		detail:
			"1,000만 원 초과는 정부수입인지(인지세) 납부 대상 → 행정 간소화 목적 상향(770만 미만→1,000만 이하, '24.05.01 시행)",
	},
	{
		id: "dp-quote",
		label: "업체 선정 · 견적",
		basis: "2견적 비교 (1인 견적 예외)",
		detail:
			"2개 이상 견적 비교 최저가 원칙 · 단, 독점·혁신제품 및 제조사 직접 정비는 제조사 1인 견적 가능(확인서 첨부)",
	},
	{
		id: "dp-limit",
		label: "제외 · 통제 사항",
		basis: "자산(공기구비품) 제외",
		detail:
			"예산상 자산 분류 물품은 금액 무관 계약부서 요청(종합쇼핑몰 포함) · 동일목적 분할구매 금지 · 이해충돌 확인",
	},
];

/**
 * 사내 수의계약 세부 적용 기준 (공단 실무교육 + 당사 적용 기준 반영)
 */
export const SOLE_SOURCE_CRITERIA: SoleSourceCriterion[] = [
	{
		id: "sole-small",
		badge: "소액구매",
		title: "소액 수의계약",
		amountRangeVat: "1,000만~2,200만 원",
		targetScope: "1회·연내(MIS 승낙사항) / 단가·분할(문서 표준계약)",
		legalBasis: "국가계약법 시행령 제26조·제30조·제49조",
		requiredDocs: ["견적서(2개 이상)", "자가점검표", "체크리스트"],
		note: "단가계약·분할지급·연도초과는 문서(표준계약) 요청",
	},
	{
		id: "sole-exclusive",
		badge: "독점계약",
		title: "독점 2개사 (iTOX·EasyChem)",
		amountRangeVat: "2,200만~1억 원",
		targetScope: "독점대리점계약서 보유 2개사 (입찰 가능하면 독점 불가)",
		legalBasis: "국가계약법 시행령 제26조 제1항 제2호 (1인 수의)",
		requiredDocs: ["독점대리점계약서", "수의계약 필수서류"],
		note: "2,200만 원 초과로 MIS 발주계획 선행 필수",
	},
	{
		id: "sole-repair",
		badge: "직접수리",
		title: "제조사 직접 수리·정비",
		amountRangeVat: "직접 수리 건 (1인 수의)",
		targetScope: "장비 제조사 직접 수행 고장수리·정비",
		legalBasis: "국가계약법 시행령 제26조 제1항 제2호 · 제30조",
		requiredDocs: ["제조사 견적·진단서", "수의계약 필수서류"],
		note: "수리·용역 지체상금률 1.25‰ (물품 0.75‰)",
	},
];

/**
 * 소액수의견적(2,200만~1억 1,000만 미만) 핵심 적용 기준
 */
export const SMALL_QUOTE_CRITERIA: DirectPurchaseCriterion[] = [
	{
		id: "sq-limit",
		label: "참가자격 제한",
		basis: "소기업 · 소상공인 제한",
		detail:
			"소기업·소상공인 대상 제한경쟁 적용 (중소기업현황정보시스템 소기업·소상공인 확인서 보유 업체)",
	},
	{
		id: "sq-award",
		label: "선정 · 낙찰 기준",
		basis: "2인 이상 전자견적 (88%)",
		detail:
			"나라장터 2인 이상 전자견적제출공고 · 입찰참가자격과 가격(물품 낙찰하한율 88%)만으로 최저가 낙찰자 결정",
	},
	{
		id: "sq-plan",
		label: "사전 · 필수 절차",
		basis: "MIS 발주계획 선행 필수",
		detail:
			"연간(12/20)·분기(3·6·9월 15일)·수시 입력(품명 10자리) — 미입력 시 MIS 계약의뢰 불가",
	},
];

/**
 * 경쟁입찰(단가계약 · 중앙조달) 적격심사 구간 기준 (조달청 물품구매 적격심사 세부기준)
 * - 고시금액: 추정가격 2.3억 원 ≒ VAT 포함 약 2억 5,300만 원
 * - 10억 기준: 추정가격 10억 원 ≒ VAT 포함 약 11억 원
 */
export const COMPETITIVE_TIERS: CompetitiveTier[] = [
	{
		id: "tier-below",
		tierLabel: "고시금액 미만",
		amountRangeVat: "1.1억 ~ 2.53억 미만",
		estimatedPriceRef: "추정가 1억~2.3억 미만",
		reviewStandard: "적격심사(고시미만 · 실적제한 불가)",
		keyPoints: [
			"중소기업 제한경쟁 원칙 · 사전규격 5일+본공고 7일(최소 3주 전 발주)",
		],
	},
	{
		id: "tier-mid",
		tierLabel: "고시금액 ~ 11억",
		amountRangeVat: "2.53억 ~ 11억 미만",
		estimatedPriceRef: "추정가 2.3억~10억 미만",
		reviewStandard: "적격심사(고시이상 · 수행실적 평가)",
		keyPoints: [
			"조달청 중앙조달 · 납품실적·경영상태 평가 (국제입찰 기준 검토)",
		],
	},
	{
		id: "tier-high",
		tierLabel: "11억 원 이상",
		amountRangeVat: "VAT 포함 11억 이상",
		estimatedPriceRef: "추정가 10억 이상",
		reviewStandard: "고액 적격심사(별표1 · 하한 80.495%)",
		keyPoints: [
			"납품실적·기술능력·경영상태 종합평가 · 국제입찰 시 공고기간 40일",
		],
	},
];

/**
 * 제조사 · 장비별 계약 방식 및 마감기한 요약 리스트
 */
export const MANUFACTURER_CONTRACT_LIST: ManufacturerContractRow[] = [
	{
		id: "mfg-hsk",
		name: "HSKorea",
		category: "국가망",
		equipment: "TOC·TN·TP·Bio·자동채수기 (HATA·HATN·HATP·HATOX)",
		maintenanceItems: "펌프·밸브·보드·모듈 등 장비 수리·교체 부품",
		materialItems: "-",
		note: "연간 통합 단가계약 주력 · 호환 대체품은 BOM 도해 참고",
	},
	{
		id: "mfg-ysi",
		name: "동문이엔티",
		category: "국가망",
		equipment: "일반항목 (EXO2 · YSI600XL · 6600EDS)",
		maintenanceItems: "EXO 센서 모듈·와이퍼·본체 수리·교정",
		materialItems: "표준물질",
		note: "수입 납기 고려해 사전 발주 권장 (독점 아님 · EasyChem과 분리)",
	},
	{
		id: "mfg-shimadzu",
		name: "시마즈",
		category: "국가망",
		equipment: "TOC (TOC-4200 · TOC-4110)",
		maintenanceItems: "연소관·검출기·시린지 펌프 등 정비·수리",
		materialItems: "-",
		note: "제조사 직접 정비 건은 1인 수의 가능",
	},
	{
		id: "mfg-baeknyeon",
		name: "백년기술",
		category: "국가망",
		equipment: "TN·TP·자동채수기 (Robochem A2/A4 · TN-2060 · TP-2002)",
		maintenanceItems: "장비 고장 수리 및 주요 부품 교체",
		materialItems: "-",
		note: "제조사 직접 정비 및 전용 부품 확인",
	},
	{
		id: "mfg-kisul",
		name: "기술과환경",
		category: "국가망",
		equipment: "일반항목 (M-1000U · 평택 3개소 M-3000U 예정)",
		maintenanceItems: "장비 고장 수리 및 주요 부품 교체",
		materialItems: "-",
		note: "평택측정소 3개소(예정) M-3000U 납품 · 미단가 품목 사전 견적",
	},
	{
		id: "mfg-easychem",
		name: "동문이엔티",
		category: "국가망",
		isExclusive: true,
		equipment: "Bio (EasyChem 생물독성)",
		maintenanceItems: "장비 정비·수리 부품 (제조사·독점 대리점)",
		materialItems: "박테리아 및 배양액",
		note: "독점대리점계약서 보유 · 12월 말 만료",
	},
	{
		id: "mfg-itox",
		name: "엘엠비",
		category: "국가망",
		isExclusive: true,
		equipment: "Bio (microLAN iTOXcontrol 생물독성)",
		maintenanceItems: "장비 정비·수리 부품 (제조사·독점 대리점)",
		materialItems: "박테리아 및 배양액",
		note: "독점대리점계약서 보유 · 10월 중 만료(사전 발주 주의)",
	},
	{
		id: "mfg-knr",
		name: "KNR",
		category: "국가망",
		equipment: "VOCs · VOC 자동채수기",
		maintenanceItems: "VOCs·VOC 자동채수기 정비·수리 및 주요 부품 교체",
		materialItems: "-",
		note: "VOCs 분석기 및 VOC 자동채수기 공급·유지보수",
	},
	{
		id: "mfg-blprocess",
		name: "BL프로세스",
		category: "국가망",
		equipment: "평택 TOC·TN·TP·페놀 (Star TOCk 등)",
		maintenanceItems: "장비 정비·수리 및 주요 부품 교체",
		materialItems: "-",
		note: "평택측정소 TOC·TN·TP·페놀 장비 공급",
	},
	{
		id: "mfg-jmenv",
		name: "제이엠이엔비",
		category: "국가망",
		equipment: "생물독성(물벼룩) · 클로로필",
		maintenanceItems: "물벼룩·클로로필 측정기 정비·수리 부품",
		materialItems: "-",
		note: "물벼룩·클로로필 장비 공급 및 유지보수",
	},
	{
		id: "mfg-saerom",
		name: "새론이엔아이",
		category: "소규모",
		equipment: "소규모 TOC · NO3-N",
		maintenanceItems: "소규모 측정기 정비·수리 및 부품 교체",
		materialItems: "-",
		note: "소규모 측정소 TOC·NO3-N 장비",
	},
	{
		id: "mfg-tieng",
		name: "티아이시스템",
		category: "소규모",
		equipment: "소규모 NH4-N",
		maintenanceItems: "소규모 측정기 정비·수리 및 부품 교체",
		materialItems: "-",
		note: "소규모 측정소 NH4-N 장비 (납기 발주 후 6주 이내)",
	},
	{
		id: "mfg-yeoui",
		name: "여의시스템",
		category: "부대장비·기타",
		equipment: "데이터로거 (자료수집장치)",
		maintenanceItems: "데이터로거 본체·통신모듈·전원부 수리·교체",
		materialItems: "-",
		note: "측정소 데이터로거 공급 및 유지보수",
	},
	{
		id: "mfg-miraest",
		name: "미래에스티",
		category: "부대장비·기타",
		equipment: "증류수기 (초순수 제조장치)",
		maintenanceItems: "증류수기 정비·수리 부품",
		materialItems: "필터",
		note: "측정소 증류수기 공급 및 필터 교체",
	},
	{
		id: "mfg-spex",
		name: "스펙스",
		category: "부대장비·기타",
		equipment: "증류수기 (초순수 제조장치)",
		maintenanceItems: "증류수기 정비·수리 부품",
		materialItems: "필터",
		note: "측정소 증류수기 공급 및 필터 교체",
	},
	{
		id: "mfg-enco",
		name: "엔코",
		category: "부대장비·기타",
		equipment: "수질분석용 시약",
		maintenanceItems: "-",
		materialItems: "제조시약",
		note: "측정소 분석용 제조시약 공급",
	},
	{
		id: "mfg-hansung",
		name: "한성플랜트/에어존",
		category: "부대장비·기타",
		equipment: "채수시설 관련 공사",
		maintenanceItems: "채수시설 배관·펌프·부대설비 보수 및 공사",
		materialItems: "-",
		note: "측정소 채수시설 관련 각종 보수·공사 지원",
	},
	{
		id: "mfg-wilo",
		name: "윌로펌프",
		category: "부대장비·기타",
		equipment: "채수·이송 펌프",
		maintenanceItems: "펌프",
		materialItems: "-",
		note: "측정소 채수·이송용 펌프 공급 및 교체",
	},
];
