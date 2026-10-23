/**
 * src/app/analysis/launchers/core/excludeItems.ts
 * WMS 수질 분석 대상 외 보조/부대장비/기상/생물감시 센서 제외 키워드 표준화 모듈
 */

export const WMS_EXCLUDE_ITEMS = [
	// 1. 기상 및 수문 항목
	"강수량",
	"강우량",
	"유량",
	"수위",

	// 2. 측정소 시설 및 부대장비 항목 (WMS 실제 정규 명칭)
	"실내온도",
	"실내 온도",
	"실내습도",
	"전원",
	"출입문",
	"채수펌프",
	"채수기",
	"자탐기",
	"자동소화기",
	"가스감지기",
	"필터유입압력",
	"측정소상태",

	// 3. 조류 및 광학 지표
	"남조류",
	"투과도",

	// 4. 생물감시 내부 보조 센서 ('발광도' 하나로 초기/후기/Ctrl/REF/테스트 전수 커버)
	"발광도",
	"보정계수",
	"EC50",
	"독성도테스트",
	"박테리아온도",
	"배양용기",
	"용기1",
	"용기2",
	"유영속도",
	"개체수",
	"프렉탈",
	"시료온도",

	// 5. 전극 센서 (전극 하나로 전극[A], 전극[B], 전극 등 전체 커버)
	"전극",
];

/**
 * 런처 클라이언트 브라우저 주입용 표준 자바스크립트 코드
 */
export const WMS_EXCLUDE_ITEMS_JS = `
    // WMS 공통 수질 제외 항목 표준 리스트 (전체 모듈 공통)
    const WMS_EXCLUDE_ITEMS = ${JSON.stringify(WMS_EXCLUDE_ITEMS, null, 8)};

    // 제외 항목 여부 판정 헬퍼 (공백 제거 정규화 매칭 포함)
    const isWmsExcludedItem = (name) => {
        if (!name) return true;
        const cleanName = String(name).trim();
        if (!cleanName) return true;
        return WMS_EXCLUDE_ITEMS.some(kw => cleanName.includes(kw) || cleanName === kw);
    };
`;
