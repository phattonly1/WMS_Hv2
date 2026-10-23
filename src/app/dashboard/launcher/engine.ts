/**
 * src/app/analysis/launchers/engine.ts
 * WMS 한강수계 올인원 통합 런처 (Unified Super Launcher)
 *
 * 3대 핵심 탭 통합 구조:
 * 1. 수질데이터 종합진단 (유효일 가선별, 운전정지·재개, 코드변경 추적, 점검현황 진단)
 * 2. 소규모 월간 보고서 (기초자료, 차트캡처, 통합보고서)
 * 3. 점검일지 (일지 불러오기, 점검내역 추출)
 */

import {
	LAUNCHER_CALENDAR_JS,
	LAUNCHER_REALGRID_JS,
	LAUNCHER_STATIONS_JS,
	LAUNCHER_STYLES_CSS,
	LAUNCHER_TEAMS_JS,
	LAUNCHER_UTILS_JS,
	LAUNCHER_WORKER_JS,
	WMS_EXCLUDE_ITEMS_JS,
	WMS_STATUS_CODES_JS,
} from "./core/common";
import {
	UNIFIED_JOURNAL_HISTORY_JS,
	UNIFIED_JOURNAL_IMPORTER_JS,
	UNIFIED_MEASURE_CHANGE_JS,
	UNIFIED_POLLUTION_ACTION_JS,
	UNIFIED_SMALL_BASIC_DATA_JS,
	UNIFIED_SMALL_CHART_CAPTURE_JS,
	UNIFIED_SMALL_CHART_REPORT_JS,
	UNIFIED_STATUS_JS,
	UNIFIED_STOPPAGE_JS,
	UNIFIED_VALID_DAYS_JS,
} from "./modules";
import { LAUNCHER_DISPATCHER_JS, LAUNCHER_TAB_PANELS_JS } from "./ui";

export const generateUnifiedLauncherScript = (defaultTab?: string): string => {
	const forcedTab = defaultTab ? `'${defaultTab}'` : "null";

	// 탭별 온디맨드(On-Demand) 모듈 번들링 최적화
	// defaultTab이 지정된 경우 해당 탭에 필요한 모듈만 주입하여 스크립트 용량을 최대 70% 절감
	let moduleScripts = "";
	if (defaultTab === "diagnostic") {
		moduleScripts = `
            ${UNIFIED_VALID_DAYS_JS}
            ${UNIFIED_STOPPAGE_JS}
            ${UNIFIED_MEASURE_CHANGE_JS}
            ${UNIFIED_STATUS_JS}
            ${UNIFIED_POLLUTION_ACTION_JS}
            const runSmallMonthlyProcess = () => { alert('종합진단 전용 모드입니다.'); };
            const runChartGenerationProcess = () => { alert('종합진단 전용 모드입니다.'); };
            const runJournalImporterProcess = () => { alert('종합진단 전용 모드입니다.'); };
            const runJournalHistoryExcelProcess = () => { alert('종합진단 전용 모드입니다.'); };
        `;
	} else if (defaultTab === "smallMonthly") {
		moduleScripts = `
            ${UNIFIED_SMALL_BASIC_DATA_JS}
            ${UNIFIED_SMALL_CHART_CAPTURE_JS}
            ${UNIFIED_SMALL_CHART_REPORT_JS}
            const runDiagnosticProcess = () => { alert('소규모 보고서 전용 모드입니다.'); };
            const runStoppageProcess = () => { alert('소규모 보고서 전용 모드입니다.'); };
            const runMeasureChangeProcess = () => { alert('소규모 보고서 전용 모드입니다.'); };
            const runStatusProcess = () => { alert('소규모 보고서 전용 모드입니다.'); };
            const runJournalImporterProcess = () => { alert('소규모 보고서 전용 모드입니다.'); };
            const runJournalHistoryExcelProcess = () => { alert('소규모 보고서 전용 모드입니다.'); };
        `;
	} else if (defaultTab === "journal") {
		moduleScripts = `
            ${UNIFIED_JOURNAL_IMPORTER_JS}
            ${UNIFIED_JOURNAL_HISTORY_JS}
            const runDiagnosticProcess = () => { alert('점검일지 전용 모드입니다.'); };
            const runStoppageProcess = () => { alert('점검일지 전용 모드입니다.'); };
            const runMeasureChangeProcess = () => { alert('점검일지 전용 모드입니다.'); };
            const runStatusProcess = () => { alert('점검일지 전용 모드입니다.'); };
            const runSmallMonthlyProcess = () => { alert('점검일지 전용 모드입니다.'); };
            const runChartGenerationProcess = () => { alert('점검일지 전용 모드입니다.'); };
        `;
	} else {
		// 전체 통합 모드 (All-in-One Super Launcher)
		moduleScripts = `
            ${UNIFIED_VALID_DAYS_JS}
            ${UNIFIED_STOPPAGE_JS}
            ${UNIFIED_SMALL_BASIC_DATA_JS}
            ${UNIFIED_SMALL_CHART_CAPTURE_JS}
            ${UNIFIED_SMALL_CHART_REPORT_JS}
            ${UNIFIED_MEASURE_CHANGE_JS}
            ${UNIFIED_STATUS_JS}
            ${UNIFIED_JOURNAL_IMPORTER_JS}
            ${UNIFIED_JOURNAL_HISTORY_JS}
            ${UNIFIED_POLLUTION_ACTION_JS}
        `;
	}

	return `
/**
 * WMS 한강수계 올인원 통합 런처 (Unified Super Launcher)
 * F12 개발자도구 콘솔 실행 전용
 */
(function() {
    // 모바일 기기 실행 방지 (PC 환경 전용)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || (window.innerWidth < 768 && window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    if (isMobile) {
        alert('⚠️ WMS 런처는 PC 환경(데스크톱/노트북)에서만 지원됩니다.');
        return;
    }

    // 0. 기존 모달 정리
    const oldModal = document.getElementById('wms-instant-modal');
    if (oldModal) oldModal.remove();

    ${LAUNCHER_STATIONS_JS}
    ${LAUNCHER_TEAMS_JS}
    ${WMS_STATUS_CODES_JS}
    ${WMS_EXCLUDE_ITEMS_JS}
    ${LAUNCHER_UTILS_JS}
    ${LAUNCHER_CALENDAR_JS}
    ${LAUNCHER_REALGRID_JS}
    ${LAUNCHER_WORKER_JS}

    // 팝업 전역 자동 우회 설정
    const cleanupPopups = setupPopupBypass('wms-instant-modal');

    // WMS 현재 페이지 감지
    const curPath = window.location.pathname || '';
    const curSearch = window.location.search || '';
    const urlParams = new URLSearchParams(curSearch);
    const menuId = urlParams.get('pMENUMST_ID') || '';

    // 3대 메인 탭: 'diagnostic' (종합진단) | 'smallMonthly' (소규모 보고서) | 'journal' (점검일지)
    const presetTab = ${forcedTab};
    let diagSelectedTask = 'validDays'; // 'validDays' | 'stoppage' | 'measureChange' | 'status'
    let smallSelectedTask = 'data';     // 'data' | 'chartReport' | 'chartPre' | 'chartPost'
    let smallChartScope = 'pre';        // 'pre' | 'post'
    let smallZipPreFile = null;         // 선별 전 선택 ZIP 파일 유지
    let smallZipPostFile = null;        // 선별 후 선택 ZIP 파일 유지
    let smallZipCombinedFile = null;    // 통합차트 선택 ZIP 파일 유지
    let journalTask = 'copy';           // 'copy' | 'history'
    let journalYearScope = 'thisYear';  // 'lastYear' | 'thisYear'
    let pollutionYear = new Date().getFullYear(); // 수질오염사고 대상 연도
    let pollutionQuarter = '3Q';        // '1Q' | '2Q' | '3Q' | '4Q'
    let activeTab = presetTab || 'diagnostic';

    if (!presetTab) {
        if (menuId === '10320' || curPath.includes('pollutionAction')) {
            activeTab = 'pollutionAction';
        } else if (menuId === '10328' || curPath.includes('checkJournal')) {
            activeTab = 'journal';
        } else if (menuId === '10064' || curPath.includes('validData') || curPath.includes('dataSort') || curPath.includes('dataFix')) {
            activeTab = 'smallMonthly';
            smallSelectedTask = (curPath.includes('dataFix') || curPath.includes('validData')) ? 'chartPost' : 'chartPre';
        } else {
            activeTab = 'diagnostic';
            if (menuId === '10027' || curPath.includes('stateManage')) {
                diagSelectedTask = 'status';
            } else if (menuId === '10227' || curPath.includes('measureChange')) {
                diagSelectedTask = 'measureChange';
            } else if (menuId === '10061' || curPath.includes('measureData')) {
                diagSelectedTask = 'validDays';
            }
        }
    }

    // 날짜 기본값: 기본적으로 지난달 1일 ~ 말일
    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const fmt = d => fmtDate(d);
    let startDate = fmt(lastMonthDate);
    let endDate = fmt(lastMonthEnd);

    // 수질오염사고 탭인 경우: 지난달(현재 작업 기준월)이 포함된 분기(예: 9월 -> 3분기 7.1~9.30) 자동 설정
    if (activeTab === 'pollutionAction') {
        const targetMonth = lastMonthDate.getMonth() + 1; // 1 ~ 12
        const targetYear = lastMonthDate.getFullYear();
        pollutionYear = targetYear;
        if (targetMonth >= 1 && targetMonth <= 3) {
            pollutionQuarter = '1Q';
            startDate = targetYear + '-01-01';
            endDate = targetYear + '-03-31';
        } else if (targetMonth >= 4 && targetMonth <= 6) {
            pollutionQuarter = '2Q';
            startDate = targetYear + '-04-01';
            endDate = targetYear + '-06-30';
        } else if (targetMonth >= 7 && targetMonth <= 9) {
            pollutionQuarter = '3Q';
            startDate = targetYear + '-07-01';
            endDate = targetYear + '-09-30';
        } else {
            pollutionQuarter = '4Q';
            startDate = targetYear + '-10-01';
            endDate = targetYear + '-12-31';
        }
    }

    // 공통 상태 관리: 초기 탭에 맞는 측정소 기본 자동 선택
    let selectedSet = new Set(
        activeTab === 'smallMonthly'
            ? SMALL_STATIONS.map(s => s.value)
            : activeTab === 'diagnostic'
            ? ALL_STATIONS.map(s => s.value)
            : []
    );
    let isRunning = false;
    let cancelRequested = false;

    // 탭별 전용 옵션 상태
    const stoppageFilters = { includeG: true, includeD: true, includeE: true };
    const smallOptions = {
        mode: (menuId === '10064' || curPath.includes('validData')) ? 'post' : 'pre',
        preTasks: { fiveMin: true, oilDay: true, chart: true },
        postTasks: { hourValid: true, dayValid: true, chart: true },
        includeBothCharts: false
    };
    const OIL_STATION_IDS = ['S01030', 'S01040', 'S01044'];

    // 모달 DOM 생성
    const overlay = document.createElement('div');
    overlay.id = 'wms-instant-modal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.7);backdrop-filter:blur(8px);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;box-sizing:border-box;color:#1e293b;';

    const card = document.createElement('div');
    card.id = 'wms-instant-card';
    card.style.cssText = 'background:#ffffff;width:96vw;max-width:1600px;height:86vh;min-height:700px;max-height:920px;border-radius:18px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.35);display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(226,232,240,0.8);position:relative;animation:wmsFadeIn 0.25s ease-out;';
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const styleEl = document.createElement('style');
    styleEl.textContent = \`
        ${LAUNCHER_STYLES_CSS}
        .wms-main-tab-bar { display:flex; gap:4px; background:#f1f5f9; padding:3px; border-radius:10px; border:1px solid #e2e8f0; }
        .wms-main-tab { cursor:pointer; padding:7px 18px; border-radius:8px; font-size:13.5px; font-weight:700; border:none; background:transparent; color:#64748b; transition:all 0.15s ease; user-select:none; white-space:nowrap; }
        .wms-main-tab:hover { color:#0f172a; background:rgba(255,255,255,0.7); }
        .wms-main-tab.active { background:#ffffff; color:#1d4ed8; box-shadow:0 2px 6px rgba(0,0,0,0.06); font-weight:900; }
    \`;
    card.appendChild(styleEl);

    // 테마 설정 (localStorage 저장된 'wms-theme' 우선, 없으면 OS 미디어쿼리 감지)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    let currentTheme = localStorage.getItem('wms-theme') || (mediaQuery.matches ? 'dark' : 'light');

    const applyTheme = (theme) => {
        currentTheme = theme;
        if (theme === 'dark') {
            card.classList.add('wms-dark');
        } else {
            card.classList.remove('wms-dark');
        }
        localStorage.setItem('wms-theme', theme);
        const toggleBtn = document.getElementById('wms-theme-toggle-btn');
        if (toggleBtn) {
            toggleBtn.textContent = theme === 'dark' ? '☀️ 라이트' : '🌙 다크';
            toggleBtn.title = theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환';
        }
    };
    applyTheme(currentTheme);

    const onSystemThemeChange = (e) => {
        if (!localStorage.getItem('wms-theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    };
    mediaQuery.addEventListener('change', onSystemThemeChange);

    // 헤더 렌더링 (3대 메인 탭 + 테마 토글 버튼 + 닫기)
    const header = document.createElement('div');
    header.id = 'wms-modal-header';
    header.style.cssText = 'padding:10px 20px;border-bottom:1px solid #e9eff6;display:flex;align-items:center;justify-content:space-between;background:#ffffff;flex-wrap:nowrap;gap:16px;z-index:10;';
    header.innerHTML = \`
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
            <div style="width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg, #2563eb, #0284c7);color:white;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;">⚡</div>
            <div id="wms-modal-title" style="font-size:15px;font-weight:900;color:#0f172a;letter-spacing:-0.4px;">WMS 통합 런처</div>
        </div>
        <div class="wms-main-tab-bar" style="display:flex;align-items:center;gap:6px;">
            <button class="wms-main-tab \${activeTab === 'diagnostic' ? 'active' : ''}" data-tab="diagnostic">수질데이터 종합진단</button>
            <button class="wms-main-tab \${activeTab === 'smallMonthly' ? 'active' : ''}" data-tab="smallMonthly">소규모 월간 보고서</button>
            <button class="wms-main-tab \${activeTab === 'journal' ? 'active' : ''}" data-tab="journal">점검일지</button>
            <button class="wms-main-tab \${activeTab === 'pollutionAction' ? 'active' : ''}" data-tab="pollutionAction">수질오염사고 조치</button>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
            <button id="wms-theme-toggle-btn" class="wms-pill-preset" style="height:28px;padding:4px 10px;font-size:12px;font-weight:800;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;box-sizing:border-box;">\${currentTheme === 'dark' ? '☀️ 라이트' : '🌙 다크'}</button>
            <button id="wms-close-btn" style="width:28px;height:28px;border-radius:7px;border:none;background:#f1f5f9;cursor:pointer;font-size:13px;color:#64748b;font-weight:800;display:flex;align-items:center;justify-content:center;" title="닫기 (ESC)">✕</button>
        </div>
    \`;
    card.appendChild(header);

    // 테마 토글 버튼 클릭 이벤트
    const themeToggleBtn = header.querySelector('#wms-theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.onclick = () => {
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme);
        };
    }

    // 모달 바디
    const body = document.createElement('div');
    body.id = 'wms-modal-body';
    body.style.cssText = 'flex:1;padding:12px 20px;overflow:hidden;display:flex;flex-direction:column;gap:10px;background:#ffffff;min-height:0;';
    card.appendChild(body);

    // 메인 탭바 전환 이벤트 (탭 넘어갈 때마다 모든 측정소 선택 항상 해제)
    header.querySelectorAll('.wms-main-tab').forEach(tabBtn => {
        tabBtn.onclick = () => {
            if (isRunning) { alert('작업이 진행 중일 때는 탭을 전환할 수 없습니다.'); return; }
            activeTab = tabBtn.getAttribute('data-tab');
            header.querySelectorAll('.wms-main-tab').forEach(b => b.classList.remove('active'));
            tabBtn.classList.add('active');

            // 탭 넘어갈 때 해당 탭에 적합한 기본 측정소 자동 세팅
            selectedSet.clear();
            if (activeTab === 'smallMonthly') {
                SMALL_STATIONS.forEach(s => selectedSet.add(s.value));
            } else if (activeTab === 'diagnostic') {
                ALL_STATIONS.forEach(s => selectedSet.add(s.value));
            } else if (activeTab === 'pollutionAction') {
                // 수질오염사고 탭: 측정소 불문 전체 수집 모드이므로 전체 세팅
                ALL_STATIONS.forEach(s => selectedSet.add(s.value));
                // 기준월에 맞는 분기 날짜 자동 동기화
                const targetM = lastMonthDate.getMonth() + 1;
                const targetY = lastMonthDate.getFullYear();
                if (targetM >= 1 && targetM <= 3) {
                    pollutionQuarter = '1Q'; startDate = targetY + '-01-01'; endDate = targetY + '-03-31';
                } else if (targetM >= 4 && targetM <= 6) {
                    pollutionQuarter = '2Q'; startDate = targetY + '-04-01'; endDate = targetY + '-06-30';
                } else if (targetM >= 7 && targetM <= 9) {
                    pollutionQuarter = '3Q'; startDate = targetY + '-07-01'; endDate = targetY + '-09-30';
                } else {
                    pollutionQuarter = '4Q'; startDate = targetY + '-10-01'; endDate = targetY + '-12-31';
                }
            }

            renderMainView();
        };
    });

    ${LAUNCHER_TAB_PANELS_JS}
    ${LAUNCHER_DISPATCHER_JS}

    // 메인 뷰 렌더링
    function renderMainView() {
        const btnCfg = getRunButtonConfig();
        const isDiagnostic = activeTab === 'diagnostic';
        const isSmallMonthly = activeTab === 'smallMonthly';
        const isJournal = activeTab === 'journal';
        const isPollutionAction = activeTab === 'pollutionAction';
        const isJournalCopy = isJournal && journalTask === 'copy';

        const stationButtonsHtml = isJournalCopy
            ? '<div style="display:inline-flex;align-items:center;height:28px;box-sizing:border-box;"><span style="font-size:12px;font-weight:800;color:#2563eb;background:#eff6ff;padding:4px 10px;border-radius:8px;border:1px solid #bfdbfe;line-height:1;display:inline-flex;align-items:center;">🎯 단일 측정소 선택 모드 (1개 선택 시 나머지 비활성화)</span></div>'
            : isPollutionAction
            ? '<div style="display:inline-flex;align-items:center;height:28px;box-sizing:border-box;"><span style="font-size:12px;font-weight:800;color:#e11d48;background:#fff1f2;padding:4px 10px;border-radius:8px;border:1px solid #fecdd3;line-height:1;display:inline-flex;align-items:center;">🌐 측정소 구분 없이 전수 자동 취합 모드</span></div>'
            : isSmallMonthly
            ? '<button id="wms-btn-sml" class="wms-pill-preset highlight" style="background:#ecfdf5;color:#059669;border-color:#a7f3d0;font-weight:900;padding:4px 10px;font-size:12px;height:28px;box-sizing:border-box;display:inline-flex;align-items:center;">소규모 (20)</button>' +
              '<button id="wms-btn-clear" class="wms-pill-preset" style="color:#dc2626;padding:4px 10px;font-size:12px;height:28px;box-sizing:border-box;display:inline-flex;align-items:center;">선택 해제</button>'
            : '<button id="wms-btn-all" class="wms-pill-preset" style="padding:4px 10px;font-size:12px;height:28px;box-sizing:border-box;display:inline-flex;align-items:center;">전체 43개소</button>' +
              '<button id="wms-btn-base" class="wms-pill-preset" style="color:#2563eb;font-weight:800;padding:4px 10px;font-size:12px;height:28px;box-sizing:border-box;display:inline-flex;align-items:center;">국가망 (17)</button>' +
              '<button id="wms-btn-nat" class="wms-pill-preset" style="color:#1d4ed8;font-weight:800;padding:4px 10px;font-size:12px;height:28px;box-sizing:border-box;display:inline-flex;align-items:center;">국가+위탁 (23)</button>' +
              '<button id="wms-btn-sml" class="wms-pill-preset" style="color:#059669;font-weight:800;padding:4px 10px;font-size:12px;height:28px;box-sizing:border-box;display:inline-flex;align-items:center;">소규모 (20)</button>' +
              '<button id="wms-btn-clear" class="wms-pill-preset" style="color:#dc2626;padding:4px 10px;font-size:12px;height:28px;box-sizing:border-box;display:inline-flex;align-items:center;">선택 해제</button>';

        // 좌측 패널 상단 컨텐츠 렌더링 (점검일지 탭에서도 날짜 영역을 비활성화 상태로 유지하여 완벽한 UI 레이아웃 통일)
        const dateDisabledStyle = isJournal ? 'opacity:0.42;pointer-events:none;filter:grayscale(0.6);user-select:none;' : '';
        const currentYearNum = new Date().getFullYear();
        const dateNoticeBadge = isJournal
            ? (journalTask === 'copy'
                ? '<span style="font-size:11px;font-weight:800;color:#64748b;background:#f1f5f9;padding:2px 8px;border-radius:6px;border:1px solid #e2e8f0;">🔒 날짜 선택 비활성화 (작성창 팝업에서 조회)</span>'
                : (journalYearScope === 'lastYear'
                    ? \`<span style="font-size:11px;font-weight:800;color:#059669;background:#ecfdf5;padding:2px 8px;border-radius:6px;border:1px solid #a7f3d0;">⚡ 작년 전체 자동수집 (\${currentYearNum - 1}.1.1 ~ 12.31)</span>\`
                    : \`<span style="font-size:11px;font-weight:800;color:#059669;background:#ecfdf5;padding:2px 8px;border-radius:6px;border:1px solid #a7f3d0;">⚡ 올해 전체 자동수집 (\${currentYearNum}.1.1 ~ 오늘)</span>\`))
            : '';

        const leftPanelHtml = \`
            <!-- 2개월 인라인 캘린더 -->
            <div class="wms-panel-box" style="background:#ffffff;border:1px solid #e9eff6;border-radius:14px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.02);display:flex;flex-direction:column;gap:8px;position:relative;\${dateDisabledStyle}">
                <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:6px;border-bottom:1px solid #f1f5f9;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:15px;">📅</span>
                        <span id="wms-range-display-text" style="font-size:15px;font-weight:900;color:#0f172a;">\${startDate} ~ \${endDate}</span>
                    </div>
                    \${dateNoticeBadge}
                </div>
                <div id="wms-inline-cal-container"></div>
            </div>

            <!-- 빠른 날짜 프리셋 바 -->
            <div class="wms-preset-bar" style="background:#f8fafc;border:1px solid #e9eff6;border-radius:12px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;\${dateDisabledStyle}">
                <span style="font-size:12.5px;font-weight:800;color:#64748b;">빠른 선택</span>
                <div style="flex:1;display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-end;">
                    <button id="wms-btn-prev-month-nav" class="wms-pill-preset" style="color:#2563eb;font-weight:800;padding:3px 9px;font-size:12px;">◀ 이전달</button>
                    <button id="wms-btn-next-month-nav" class="wms-pill-preset" style="color:#2563eb;font-weight:800;padding:3px 9px;font-size:12px;">다음달 ▶</button>
                    <button id="wms-btn-last-month" class="wms-pill-preset highlight" style="background:#ecfdf5;color:#059669;border-color:#a7f3d0;font-weight:900;padding:3px 9px;font-size:12px;">지난달 전체</button>
                    <button id="wms-btn-this-month" class="wms-pill-preset" style="color:#059669;font-weight:800;padding:3px 9px;font-size:12px;">이번달</button>
                    <button id="wms-btn-week-prev" class="wms-pill-preset" style="padding:3px 9px;font-size:12px;">지난주(월~일)</button>
                    <button id="wms-btn-today" class="wms-pill-preset" style="padding:3px 9px;font-size:12px;">오늘</button>
                    <button id="wms-btn-last-7days" class="wms-pill-preset" style="padding:3px 9px;font-size:12px;">최근 7일</button>
                </div>
            </div>

            <!-- 수질데이터 종합진단 탭일 때: 하단 4대 분석 작업 카드 -->
            \${isDiagnostic ? renderDiagnosticTaskCards() : ''}

            <!-- 소규모 월간 보고서 탭일 때: 하단 3대 보고서 작업 카드 (위치 완벽 통일) -->
            \${isSmallMonthly ? renderSmallMonthly3ColCards() : ''}

            <!-- 점검일지 탭일 때: 하단 2대 점검일지 작업 카드 -->
            \${isJournal ? renderJournalTaskCards() : ''}

            <!-- 수질오염사고 조치 탭일 때: 분기 선택 작업 카드 -->
            \${isPollutionAction ? renderPollutionActionTaskCards() : ''}
        \`;

        // 우측 측정소 패널 스타일: 수질오염사고 탭에서는 측정소 선택 완전 비활성화 (포인터 방지, 불투명도 조절)
        const stationPanelDisabledStyle = isPollutionAction ? 'opacity:0.48;pointer-events:none;filter:grayscale(0.5);user-select:none;' : '';

        body.innerHTML = \`
            <div style="display:grid;grid-template-columns:1fr 1.25fr;gap:16px;align-items:stretch;flex:1;min-height:0;overflow:hidden;">
                <!-- 좌측 영역: 기간 및 작업 모드 카드 (모든 탭 위치 100% 통일) -->
                <div style="min-width:0;display:flex;flex-direction:column;gap:10px;overflow-y:auto;padding-right:2px;" class="wms-scrollbar">
                    \${leftPanelHtml}
                </div>

                <!-- 우측 영역: 대상 측정소 선택 (7개 조별 그리드 전용) -->
                <div class="wms-panel-box" style="min-width:0;display:flex;flex-direction:column;gap:8px;background:#ffffff;border:1px solid #e9eff6;border-radius:14px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.02);overflow:hidden;\${stationPanelDisabledStyle}">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding-bottom:8px;border-bottom:1px solid #f1f5f9;min-height:36px;box-sizing:border-box;flex-shrink:0;">
                        <div style="display:flex;align-items:center;gap:8px;white-space:nowrap;">
                            <span style="font-size:14px;font-weight:900;color:#0f172a;">대상 측정소 선택 (7개 조별)</span>
                            <span id="wms-selected-count" style="font-size:12.5px;font-weight:800;color:\${isPollutionAction ? '#e11d48' : '#1d4ed8'};">
                                \${isPollutionAction ? "전체 측정소 전수 자동 취합" : (selectedSet.size + ' / ' + (isJournalCopy ? "1개소 (단일선택)" : (isSmallMonthly ? "20개소 (소규모망)" : "43개소")))}
                            </span>
                        </div>
                        <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;justify-content:flex-end;">\${stationButtonsHtml}</div>
                    </div>

                    <div style="flex:1;min-height:0;overflow-y:auto;padding-right:2px;" class="wms-scrollbar">
                        <div id="wms-7col-station-container"></div>
                    </div>
                </div>
            </div>

            <!-- 하단 푸터: 프로그레스 바 & 실행/중지 버튼 -->
            <div id="wms-modal-footer" style="margin-top:auto;display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid #e9eff6;gap:12px;background:#ffffff;flex-shrink:0;">
                <div id="wms-progress-box" style="display:none;align-items:center;gap:12px;flex:1;">
                    <div class="wms-prog-track" style="flex:1;height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden;position:relative;border:1px solid #e2e8f0;">
                        <div id="wms-prog-bar" style="width:0%;height:100%;background:\${btnCfg.bg};transition:width 0.2s ease;"></div>
                    </div>
                    <span id="wms-prog-text" style="font-size:13px;font-weight:800;color:#0284c7;min-width:240px;">준비 중...</span>
                    <span id="wms-prog-pct" style="font-size:13px;font-weight:900;color:#0f172a;min-width:40px;text-align:right;">0%</span>
                </div>
                <div style="display:flex;gap:10px;margin-left:auto;align-items:center;">
                    <button id="wms-cancel-run-btn" class="wms-btn-action" style="display:none;padding:12px 24px;font-size:14px;font-weight:900;background:#ef4444;color:white;box-shadow:0 4px 12px rgba(239,68,68,0.25);border-radius:10px;">
                        ⏹️ 작업 중지
                    </button>
                    <button id="wms-start-run-btn" class="wms-btn-action" style="padding:12px 34px;font-size:15px;font-weight:900;background:\${btnCfg.bg};color:white;box-shadow:0 4px 12px rgba(37,99,235,0.25);border-radius:10px;display:flex;align-items:center;gap:6px;">
                        \${btnCfg.text}
                    </button>
                </div>
            </div>
        \`;

        // 7열 측정소 칩 초기화
        const stationPicker = create7ColumnStationPicker(
            document.getElementById('wms-7col-station-container'),
            selectedSet,
            (newSet) => {
                if (isPollutionAction) return; // 수질오염사고 탭에서는 측정소 조작 무시
                selectedSet = newSet;
                const cnt = document.getElementById('wms-selected-count');
                if (cnt) cnt.textContent = \`\${selectedSet.size} / \${isJournalCopy ? "1개소 (단일선택)" : (isSmallMonthly ? "20개소 (소규모망)" : "43개소")}\`;
            },
            { onlySmall: isSmallMonthly, singleSelect: isJournalCopy }
        );

        // 상단 측정소 프리셋 필터 버튼
        const btnAll = document.getElementById('wms-btn-all');
        if (btnAll) btnAll.onclick = () => { ALL_STATIONS.forEach(s => selectedSet.add(s.value)); stationPicker.updateUI(); };
        const btnBase = document.getElementById('wms-btn-base');
        if (btnBase) btnBase.onclick = () => { selectedSet.clear(); BASE_NAT_VALUES.forEach(val => selectedSet.add(val)); stationPicker.updateUI(); };
        const btnNat = document.getElementById('wms-btn-nat');
        if (btnNat) btnNat.onclick = () => { selectedSet.clear(); NATIONAL_STATIONS.forEach(s => selectedSet.add(s.value)); stationPicker.updateUI(); };
        const btnSml = document.getElementById('wms-btn-sml');
        if (btnSml) btnSml.onclick = () => { selectedSet.clear(); SMALL_STATIONS.forEach(s => selectedSet.add(s.value)); stationPicker.updateUI(); };
        const btnClear = document.getElementById('wms-btn-clear');
        if (btnClear) btnClear.onclick = () => { selectedSet.clear(); stationPicker.updateUI(); };

        // 캘린더 초기화 및 빠른 선택 바
        const updateRangeDisplay = (s, e) => {
            const disp = document.getElementById('wms-range-display-text');
            if (disp) {
                const diffDays = Math.round((new Date(e) - new Date(s)) / (1000 * 60 * 60 * 24)) + 1;
                disp.textContent = s + ' ~ ' + e + ' (' + diffDays + '일간)';
            }
        };

        const inlineCal = createInlineCalendar(
            document.getElementById('wms-inline-cal-container'),
            startDate,
            endDate,
            (newStart, newEnd) => {
                if (isJournal) return;
                startDate = newStart;
                endDate = newEnd;
                updateRangeDisplay(startDate, endDate);
            }
        );
        updateRangeDisplay(startDate, endDate);

        if (!isJournal) {
            const applyPreset = (s, e) => {
                startDate = fmtDate(s);
                endDate = fmtDate(e);
                if (inlineCal && typeof inlineCal.setRange === 'function') inlineCal.setRange(startDate, endDate);
                updateRangeDisplay(startDate, endDate);
            };

            const pNav = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
            pNav('wms-btn-prev-month-nav', () => { const cur = new Date(startDate); applyPreset(new Date(cur.getFullYear(), cur.getMonth() - 1, 1), new Date(cur.getFullYear(), cur.getMonth(), 0)); });
            pNav('wms-btn-next-month-nav', () => { const cur = new Date(startDate); applyPreset(new Date(cur.getFullYear(), cur.getMonth() + 1, 1), new Date(cur.getFullYear(), cur.getMonth() + 2, 0)); });
            pNav('wms-btn-last-month', () => { const t = new Date(); applyPreset(new Date(t.getFullYear(), t.getMonth() - 1, 1), new Date(t.getFullYear(), t.getMonth(), 0)); });
            pNav('wms-btn-this-month', () => { const t = new Date(); applyPreset(new Date(t.getFullYear(), t.getMonth(), 1), t); });
            pNav('wms-btn-today', () => { const t = new Date(); applyPreset(t, t); });
            pNav('wms-btn-last-7days', () => { const t = new Date(); const d7 = new Date(t); d7.setDate(t.getDate() - 6); applyPreset(d7, t); });
            pNav('wms-btn-week-prev', () => {
                const t = new Date(); const day = t.getDay(); const diff = day === 0 ? 7 : day;
                const lastSun = new Date(t); lastSun.setDate(t.getDate() - diff);
                const lastMon = new Date(lastSun); lastMon.setDate(lastSun.getDate() - 6);
                applyPreset(lastMon, lastSun);
            });
        }

        // 취소 버튼
        const cancelBtn = document.getElementById('wms-cancel-run-btn');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                cancelRequested = true;
                if (typeof closeWmsChartPopup === 'function') {
                    closeWmsChartPopup();
                }
                const progText = document.getElementById('wms-prog-text');
                if (progText) progText.textContent = '⏹️ 중단 요청 중... (진행 중인 팝업 즉시 닫힘)';
            };
        }

        // 탭별 전용 옵션 이벤트 등록
        bindTabSpecificEvents();

        // 메인 실행 버튼 이벤트
        document.getElementById('wms-start-run-btn').onclick = () => {
            dispatchCurrentTask();
        };
    }

    // 선택 탭 기반 모듈 합성
    ${moduleScripts}

    // 닫기 및 단축키 핸들러 (메모리 누수 방지 리소스 완전 해제)
    const cleanupModal = () => {
        try { mediaQuery.removeEventListener('change', onSystemThemeChange); } catch(e) {}
        window.removeEventListener('keydown', handleEsc);
        if (typeof closeWmsChartPopup === 'function') {
            closeWmsChartPopup();
        }
        cleanupWorkerWindow();
        cleanupPopups();
        overlay.remove();
    };

    document.getElementById('wms-close-btn').onclick = () => {
        const msg = isRunning 
            ? '현재 작업이 진행 중입니다. 정말 런처를 닫으시겠습니까?' 
            : '런처를 닫으시겠습니까?';
        if (!confirm(msg)) return;
        cleanupModal();
    };

    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            const msg = isRunning 
                ? '현재 작업이 진행 중입니다. 정말 런처를 닫으시겠습니까?' 
                : '런처를 닫으시겠습니까?';
            if (!confirm(msg)) return;
            cleanupModal();
        }
    };
    window.addEventListener('keydown', handleEsc);

    // 초기 기동
    renderMainView();
})();
    `.trim();
};
