/**
 * src/app/dashboard/launcher/core/statusCodes.ts
 * 수질자동측정망 국가/소규모 공통 표준 상태정보 코드 정의 및 런처 주입 스크립트
 */

/**
 * 인페이지 런처 주입용 상태코드 정의 자바스크립트 스니펫
 */
export const WMS_STATUS_CODES_JS = `
    const WMS_STATUS_CODE_DICT = {
        "OK": { name: "정상", category: "정상", isOk: true },
        "A0": { name: "측정소 메인전원", category: "전원이상", isOk: false },
        "A1": { name: "UPS/AVR 전원", category: "전원이상", isOk: false },
        "A2": { name: "기타(정전관련)", category: "전원이상", isOk: false },
        "B0": { name: "측정기기 보수", category: "점검·보수중", isOk: false },
        "B1": { name: "채수시설 보수", category: "점검·보수중", isOk: false },
        "B2": { name: "측정기기 부품교환", category: "점검·보수중", isOk: false },
        "B3": { name: "Overhaul cleaning", category: "점검·보수중", isOk: false },
        "B4": { name: "점검(정기/수시)", category: "점검·보수중", isOk: false },
        "B5": { name: "전송/회선점검", category: "점검·보수중", isOk: false },
        "B6": { name: "데이터로거 점검", category: "점검·보수중", isOk: false },
        "B7": { name: "로거 프로그램점검", category: "점검·보수중", isOk: false },
        "C0": { name: "측정기기 이상", category: "장비이상", isOk: false },
        "C1": { name: "Calibration error", category: "장비이상", isOk: false },
        "C2": { name: "시료공급 비정상", category: "장비이상", isOk: false },
        "C3": { name: "시약공급 비정상", category: "장비이상", isOk: false },
        "C4": { name: "가스공급 비정상", category: "장비이상", isOk: false },
        "C5": { name: "채수시설 비정상", category: "장비이상", isOk: false },
        "C6": { name: "전원공급 비정상", category: "장비이상", isOk: false },
        "C7": { name: "측정범위초과", category: "장비이상", isOk: false },
        "C8": { name: "기타 이상", category: "장비이상", isOk: false },
        "D0": { name: "기타 통신오류", category: "통신관련", isOk: false },
        "D1": { name: "미수신(측정기↔로거)", category: "통신관련", isOk: false },
        "D2": { name: "미수신(로거↔통신서버)", category: "통신관련", isOk: false },
        "D3": { name: "미수신(통신↔통합서버)", category: "통신관련", isOk: false },
        "D4": { name: "연산오류(로거)", category: "통신관련", isOk: false },
        "E0": { name: "자동 교정", category: "교정중", isOk: false },
        "E1": { name: "수동 교정", category: "교정중", isOk: false },
        "E2": { name: "정도관리", category: "교정중", isOk: false },
        "E3": { name: "정도평가", category: "교정중", isOk: false },
        "F1": { name: "시험가동", category: "시험가동", isOk: false },
        "G1": { name: "운전정지", category: "운전정지", isOk: false },
        "H0": { name: "데이터 재전송", category: "재전송", isOk: false }
    };

    /**
     * 상태코드 해석 및 라벨 반환 함수
     */
    const getStatusCodeInfo = (rawCode) => {
        if (!rawCode) return { code: "", name: "미수신", category: "결측", isOk: false };
        const clean = String(rawCode).trim().toUpperCase();
        if (clean === "OK" || clean === "정상" || clean === "0") {
            return { code: "OK", name: "정상", category: "정상", isOk: true };
        }
        if (WMS_STATUS_CODE_DICT[clean]) {
            return { code: clean, ...WMS_STATUS_CODE_DICT[clean] };
        }
        // A~H 대분류 코드로 시작하는 경우 (예: G, B, C, D01 등)
        const firstChar = clean.charAt(0);
        const MAJOR_NAMES = {
            "A": "전원이상",
            "B": "점검·보수",
            "C": "장비이상",
            "D": "통신오류/미수신",
            "E": "교정중",
            "F": "시험가동",
            "G": "운전정지",
            "H": "재전송"
        };
        if (MAJOR_NAMES[firstChar]) {
            return { code: clean, name: clean + '(' + MAJOR_NAMES[firstChar] + ')', category: MAJOR_NAMES[firstChar], isOk: false };
        }
        return { code: clean, name: clean, category: "이상", isOk: false };
    };
`;
