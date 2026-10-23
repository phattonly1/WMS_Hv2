/**
 * 한글 초성 추출 함수
 * @param str 초성을 추출할 문자열
 * @returns 추출된 초성 문자열
 */
export function getChosung(str: string): string {
    const CHO = [
        'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    ];
    let result = "";
    if (!str) return "";
    
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i) - 44032;
        if (code > -1 && code < 11172) {
            result += CHO[Math.floor(code / 588)];
        } else {
            result += str.charAt(i);
        }
    }
    return result;
}

/**
 * 초성 검색 포함 매칭 함수
 * @param target 대상 문자열 (예: "달천측정소")
 * @param query 검색어 (예: "ㄷㅊ", "달천")
 * @returns 매칭 여부
 */
export function matchChosung(target: string, query: string): boolean {
    if (!query) return true;
    const t = target.toLowerCase().replace(/\s/g, "");
    const q = query.toLowerCase().replace(/\s/g, "");
    
    // 1. 일반 포함 검색
    if (t.includes(q)) return true;
    
    // 2. 초성 검색
    const targetChosung = getChosung(t);
    if (targetChosung.includes(q)) return true;
    
    return false;
}
