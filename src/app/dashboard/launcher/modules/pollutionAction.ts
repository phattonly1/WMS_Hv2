/**
 * src/app/analysis/launchers/modules/pollutionAction.ts
 * 모드 8: 수질오염사고 조치/상황 관리(pollutionAction) [붙임 2] 공식 보고서 무결점 크롤러
 *
 * 1단계: /wms/pollutionAction/listAjax (type: 0, alarmStates: "5|6|7|8") 로 목록 전수 조회
 * 2단계: 결재완료 건에 대해 /wms/pollutionAction/form?P_ORGIDX={orgidx}&P_IDX={idx}&idx={idx}... 순차 호출하여
 *        - ITEM_STATE, DATA_STATE, UNIT_STATE, ALARMLEVEL_STATE (실제 측정소별 경보기준)
 *        - 실제 조치내용(RESCONTENT) 전수 크롤링 (미상신/작성중 건은 "[결재완료 이전: 수동확인 필요]" 표기)
 * 3단계: [붙임 2] 공식 보고서 양식(상단 환경청별 요약 집계표 + 초과항목 1~10칸 + 주야간 출동체크 + 원인분류)으로 엑셀 자동 다운로드
 */

export const UNIFIED_POLLUTION_ACTION_JS = `
    // ==========================================
    // 11. 모드 8: 수질오염사고 조치 [붙임 2] 무결점 크롤러
    // ==========================================
    async function runPollutionActionProcess() {
        // 어느 화면에서 실행하든 상관없이 WMS 내에서 바로 전수 수집 및 엑셀 다운로드 실행
        isRunning = true;
        cancelRequested = false;

        const progBox = document.getElementById('wms-progress-box');
        const progBar = document.getElementById('wms-prog-bar');
        const progText = document.getElementById('wms-prog-text');
        const progPct = document.getElementById('wms-prog-pct');
        const startBtn = document.getElementById('wms-start-run-btn');
        const cancelBtn = document.getElementById('wms-cancel-run-btn');

        if (progBox) progBox.style.display = 'flex';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';
        if (startBtn) startBtn.style.display = 'none';

        const updateProgress = (pct, text) => {
            if (progBar) progBar.style.width = pct + '%';
            if (progPct) progPct.textContent = pct + '%';
            if (progText) progText.textContent = text;
        };

        updateProgress(5, '[1/3] XLSX 엑셀 라이브러리 로드 중...');

        try {
            if (typeof XLSX === 'undefined') {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
                    script.onload = resolve;
                    script.onerror = () => {
                        const fallback = document.createElement('script');
                        fallback.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
                        fallback.onload = resolve;
                        fallback.onerror = reject;
                        document.head.appendChild(fallback);
                    };
                    document.head.appendChild(script);
                });
            }

            const pDayVal = startDate || $('#pDay').val() || '2026-07-01';
            const pDay2Val = endDate || $('#pDay2').val() || fmtDate(new Date());

            // 1단계: WMS 공식 마스터 목록 전수 수집 (type: 0)
            updateProgress(15, \`[2/3] 공식 사고현황 데이터 조회 중 (\${pDayVal} ~ \${pDay2Val})...\`);

            const params = {
                pDay: pDayVal,
                pDay2: pDay2Val,
                pSiteId: $("#pSiteId").val() || '',
                pRiverId: $("#pRiverId").val() || 'R01',
                ConfirmGubun: $("#ConfirmGubun").val() || '0',
                time_s: $("#time_s").val() || '00:00',
                time_e: $("#time_e").val() || '23:59',
                alarmStates: "5|6|7|8",
                alarmNames: "관심|주의|경계|심각",
                type: 0
            };

            const listData = await new Promise((resolve, reject) => {
                if (typeof ajaxCall === 'function') {
                    ajaxCall('/wms/pollutionAction/listAjax', params, resolve);
                } else {
                    $.ajax({
                        url: '/wms/pollutionAction/listAjax',
                        type: 'POST',
                        data: params,
                        dataType: 'json',
                        success: resolve,
                        error: (xhr, st, err) => reject(new Error(err || '조회 실패'))
                    });
                }
            });

            const rawList = (listData && listData.list) ? listData.list : [];
            console.log('%c[WMS 공식 목록 조회 성공]', 'color:#0284c7;font-weight:bold;', \`총 \${rawList.length}건\`, rawList);

            if (rawList.length === 0) {
                alert(\`해당 기간(\${pDayVal} ~ \${pDay2Val})에 조회된 수질오염 경보 내역이 없습니다.\`);
                if (progBox) progBox.style.display = 'none';
                if (startBtn) startBtn.style.display = 'inline-flex';
                if (cancelBtn) cancelBtn.style.display = 'none';
                isRunning = false;
                return;
            }

            // 발생일시(START_ALARM_DATE) 기준 오름차순(과거->최신) 정렬 후 연번 부여
            rawList.sort((a, b) => {
                const timeA = (a.START_ALARM_DATE || '').trim();
                const timeB = (b.START_ALARM_DATE || '').trim();
                return timeA.localeCompare(timeB);
            });

            const getEnvOffice = (st) => {
                const wonjuStations = ['원주', '평창강', '인제', '서상', '화천'];
                for (let i = 0; i < wonjuStations.length; i++) {
                    if (st.indexOf(wonjuStations[i]) !== -1) return '원주지방환경청';
                }
                return '한강유역환경청';
            };

            const formatAlarmStd = (rawStd) => {
                if (!rawStd || rawStd.trim() === '') return '-';
                const s = rawStd.trim();
                if (s.indexOf('/') !== -1 && !s.startsWith('/') && !s.endsWith('/')) {
                    const parts = s.split('/');
                    return '<' + parts[0] + ',>' + parts[1];
                }
                if (s.startsWith('/')) {
                    return '<' + s.substring(1);
                }
                if (s.endsWith('/')) {
                    return '>' + s.substring(0, s.length - 1);
                }
                return '>' + s;
            };

            const parseMsgCodeMap = (msg) => {
                const map = {};
                if (!msg) return map;
                // 순수 문자열 기반 토큰 분리
                const tokens = msg.split(' ');
                for (let i = 0; i < tokens.length; i++) {
                    const t = tokens[i].split(',').join('').trim();
                    if (t.indexOf(':') !== -1) {
                        const parts = t.split(':');
                        if (parts[0] && parts[1]) {
                            map[parts[0].trim()] = parts[1].trim();
                        }
                    }
                }
                return map;
            };

            const classifyCause = (cause) => {
                if (!cause) return '설비적 요인';
                const envWords = ['우천', '강우', '강수', '혼탁수', '갈수기', '소나기', '폭우', '녹조', '수온', '환경'];
                for (let i = 0; i < envWords.length; i++) {
                    if (cause.indexOf(envWords[i]) !== -1) return '환경적 요인';
                }
                return '설비적 요인';
            };

            // 2단계: 결재완료 확정 건에 대해 세션 안전 순차 수집
            updateProgress(25, \`[3/3] 실제 조치내용·경보기준 순차 수집 중 (총 \${rawList.length}건)...\`);

            const clean = s => s ? String(s).split('\\r').join('').split('\\n').join(' ').trim() : '';
            const detailMap = new Map();
            const targetItems = rawList
                .map((item, originalIndex) => ({ item, originalIndex }))
                .filter(x => x.item.IDX && (x.item.CONFIRM_STATE2 === '결재완료' || x.item.CONFIRM_STATE === '결재'));

            for (let i = 0; i < targetItems.length; i++) {
                if (cancelRequested) break;
                const { item, originalIndex } = targetItems[i];
                try {
                    const orgidx = item.ORGIDX || '';
                    const idx = item.IDX || '';
                    const confirmYn = item.CONFIRM_YN || 'Y';
                    const formUrl = \`/wms/pollutionAction/form?P_ORGIDX=\${orgidx}&P_IDX=\${idx}&idx=\${idx}&alarmId=\${orgidx}&confirmYn=\${confirmYn}&pMENUMST_ID=10320\`;
                    const res = await fetch(formUrl);
                    if (res.ok) {
                        const html = await res.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');

                        const rawItems = (doc.querySelector('#ITEM_STATE, [name="ITEM_STATE"]')?.value || '').split('@@').map(s => s.trim()).filter(Boolean);
                        const rawDatas = (doc.querySelector('#DATA_STATE, [name="DATA_STATE"]')?.value || '').split('@@').map(s => s.trim()).filter(Boolean);
                        const rawUnits = (doc.querySelector('#UNIT_STATE, [name="UNIT_STATE"]')?.value || '').split('@@').map(s => s.trim()).filter(Boolean);
                        const rawStds  = (doc.querySelector('#ALARMLEVEL_STATE, [name="ALARMLEVEL_STATE"]')?.value || '').split('@@').map(s => s.trim()).filter(Boolean);

                        const resContent = clean(doc.querySelector('#RESCONTENT, [name="RESCONTENT"]')?.value);
                        const matterLr = (doc.querySelector('#MATTER_LR, [name="MATTER_LR"]')?.value || '').trim();

                        detailMap.set(originalIndex, {
                            items: rawItems,
                            datas: rawDatas,
                            units: rawUnits,
                            stds: rawStds,
                            resContent: resContent,
                            matterLr: matterLr
                        });
                    }
                } catch(err) {
                    console.warn(\`상세 수집 실패 (순번: \${originalIndex + 1})\`, err);
                }

                const pct = 25 + Math.floor(((i + 1) / targetItems.length) * 50);
                updateProgress(pct, \`조치내용 정밀 수집 중 [\${i + 1}/\${targetItems.length}] (\${item.SITE_NAME} \${item.ALARM_NM})...\`);
                await new Promise(r => setTimeout(r, 40));
            }

            if (cancelRequested) {
                alert('작업이 사용자에 의해 중단되었습니다.');
                return;
            }

            // 2.5단계: [점검여부] 정밀 판정 (stateManage 점검이력 및 checkJournal 점검일지 연계)
            updateProgress(78, '[4/4] 출동 당일 정기점검(일상/주간/월간) 교차 분석 중...');

            const inspectionResultMap = new Map(); // idx -> '일상' | '주간' | '월간' | ''

            try {
                // 1) 대상 측정소 정보 추출 (rawList의 SITE_ID, SITEID, SITE_NAME 모두 활용)
                const targetSiteMap = new Map();
                rawList.forEach(r => {
                    const sId = r.SITE_ID || r.SITEID || r.siteId || '';
                    const sName = r.SITE_NAME || '';
                    let found = null;
                    if (sId) found = ALL_STATIONS.find(s => s.value === sId);
                    if (!found && sName) found = ALL_STATIONS.find(s => s.name === sName || s.label === sName || sName.includes(s.name) || (s.name && s.name.includes(sName)));
                    if (found) {
                        targetSiteMap.set(found.value, found);
                    }
                });
                const targetSiteInfos = Array.from(targetSiteMap.values());

                // 2) 분기 기간 stateManage(점검이력) 및 checkJournal(점검일지) 일괄 수집
                const stDayParam = pDayVal.replace(/-/g, '') + '000000';
                // 익일 새벽 점검까지 포괄하기 위해 종료일 다음날까지 확장
                const endDt = new Date(pDay2Val);
                endDt.setDate(endDt.getDate() + 2);
                const endDayParam = fmtDate(endDt).replace(/-/g, '') + '235900';
                const endDayStr = fmtDate(endDt);

                const stationStateManageMap = new Map(); // siteValue -> records[]
                const stationJournalMap = new Map();     // siteValue -> Map(rptDate -> rptGubunName)

                const gubunNameMap = {
                    '199': '일상',
                    '200': '주간',
                    '201': '월간',
                    '203': '긴급'
                };

                // 8개 병렬 동시성 제어 큐로 초고속 동시 수집 (status.ts와 동일한 고성능 아키텍처)
                let completedStations = 0;
                await runWithConcurrency(
                    targetSiteInfos,
                    async (st) => {
                        try {
                            // 1. stateManage (점검이력) 비동기 호출
                            const smPromise = fetch('/wms/stateManage/listAjax', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                body: new URLSearchParams({
                                    riverId: 'R01',
                                    siteId: st.value,
                                    pMsrstnSeCd: st.typeCode || '1',
                                    startDay: stDayParam,
                                    endDay: endDayParam,
                                    stats: 'G|B'
                                })
                            }).then(async res => {
                                if (res.ok) {
                                    const smData = await res.json();
                                    const list = (smData && smData.list) ? smData.list : [];
                                    stationStateManageMap.set(st.value, list);
                                    stationStateManageMap.set(st.name, list);
                                }
                            });

                            // 2. checkJournal (점검일지) 비동기 동시 호출
                            const jPromise = fetch('/wms/checkJournal/listAjax', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                body: new URLSearchParams({
                                    pMsrstnSeCd: st.typeCode || '1',
                                    pRiverId: 'R01',
                                    pSiteId: st.value,
                                    pDay: pDayVal,
                                    pDay2: endDayStr,
                                    rptGubuns: '',
                                    pOperatorName: '',
                                    pRptStat: ''
                                })
                            }).then(async res => {
                                if (res.ok) {
                                    const jData = await res.json();
                                    const jRows = (jData && jData.list) ? jData.list : [];
                                    const dateMap = new Map();
                                    jRows.forEach(jr => {
                                        // '20260629', '2026-06-29', '2026.06.29' 등을 순수 숫자 8자리 '20260629'로 정규화
                                        const rawD = String(jr.RPT_DATE || '').replace(/[-./s]/g, '').trim();
                                        const gName = gubunNameMap[jr.RPT_GUBUN] || jr.RPT_GUBUN_NM || '';
                                        if (rawD && rawD.length === 8 && gName && !gName.includes('긴급')) {
                                            const cleanG = gName.includes('일상') ? '일상' : (gName.includes('주간') ? '주간' : (gName.includes('월간') ? '월간' : ''));
                                            if (cleanG) dateMap.set(rawD, cleanG);
                                        }
                                    });
                                    stationJournalMap.set(st.value, dateMap);
                                    stationJournalMap.set(st.name, dateMap);
                                }
                            });

                            await Promise.all([smPromise, jPromise]);

                        } catch(e) {
                            console.warn(\`[\${st.name}] 점검이력 동시수집 실패:\`, e);
                        } finally {
                            completedStations++;
                            const curPct = 75 + Math.floor((completedStations / targetSiteInfos.length) * 15);
                            updateProgress(curPct, \`[4/4] 측정소별 점검현황 동시 조회 중 [\${completedStations}/\${targetSiteInfos.length}] (\${st.name})...\`);
                        }
                    },
                    8,
                    () => cancelRequested
                );

                // 3) 각 경보 건별 정밀 판정 로직
                rawList.forEach((r, idx) => {
                    const isMoved = (r.MOVE_YN === '출동' || r.MOVE_YN === 'Y');
                    if (!isMoved) return; // 출동한 건만 점검여부 판정 대상

                    const stName = r.SITE_NAME || '';
                    const stId = r.SITE_ID || r.SITEID || r.siteId || '';
                    const smList = stationStateManageMap.get(stId) || stationStateManageMap.get(stName) || [];
                    const journalDateMap = stationJournalMap.get(stId) || stationJournalMap.get(stName) || new Map();

                    const alarmStartStr = r.START_ALARM_DATE || ''; // 'YYYY-MM-DD HH:mm'
                    if (!alarmStartStr) return;

                    const alarmStartDt = new Date(alarmStartStr.replace(/-/g, '/'));
                    // 8자리 숫자 날짜 추출 (예: '20260629')
                    const alarmDateYMD = alarmStartStr.split(' ')[0].replace(/[-./s]/g, '');
                    const nextDateDt = new Date(alarmStartDt);
                    nextDateDt.setDate(nextDateDt.getDate() + 1);
                    const nextDateYMD = fmtDate(nextDateDt).replace(/[-./s]/g, '');

                    // 경보 발생시간 이후(또는 직전 30분 이내 현장조작 포함)에 시작된 점검들
                    const validFutureChecks = smList
                        .filter(sm => {
                            const sStr = sm.STOP_STARTDATE || '';
                            if (!sStr) return false;
                            const sDt = new Date(sStr.replace(/-/g, '/'));
                            return sDt.getTime() >= (alarmStartDt.getTime() - 30 * 60 * 1000);
                        })
                        .sort((a, b) => (a.STOP_STARTDATE || '').localeCompare(b.STOP_STARTDATE || ''));

                    // 경보 후 최초 출동 점검
                    const firstCheck = validFutureChecks[0];
                    let dispatchDayYMD = alarmDateYMD;

                    if (firstCheck) {
                        // 출동은 시간범위(23:00~01:00)로 기록되므로 종료시간(01:00)인 날이 해당 출동의 기준 날짜
                        const firstEndStr = firstCheck.STOP_ENDDATE || firstCheck.STOP_STARTDATE || '';
                        if (firstEndStr) {
                            dispatchDayYMD = firstEndStr.split(' ')[0].replace(/[-./s]/g, '');
                        }
                    } else {
                        // stateManage에 별도 기록이 없더라도 야간(18시 이후) 발생 건은 익일 출동 가능성 감안
                        const hour = parseInt((alarmStartStr.split(' ')[1] || '00:00').split(':')[0], 10);
                        if (hour >= 18 && journalDateMap.has(nextDateYMD)) {
                            dispatchDayYMD = nextDateYMD;
                        }
                    }

                    // 출동일(dispatchDayYMD)에 정기 점검일지가 있는지 확인
                    let detectedGubun = journalDateMap.get(dispatchDayYMD) || '';

                    // 만약 당일 일지가 없고 야간 발생으로 익일 새벽에 걸친 점검인 경우 익일 일지도 확인
                    if (!detectedGubun && dispatchDayYMD !== nextDateYMD && journalDateMap.has(nextDateYMD)) {
                        const hour = parseInt((alarmStartStr.split(' ')[1] || '00:00').split(':')[0], 10);
                        if (hour >= 18) detectedGubun = journalDateMap.get(nextDateYMD) || '';
                    }

                    if (!detectedGubun) {
                        // stateManage 자체 GUBUN_NAME 중 일상/주간/월간 확인
                        const dispatchDayWithHyphen = dispatchDayYMD.substring(0, 4) + '-' + dispatchDayYMD.substring(4, 6) + '-' + dispatchDayYMD.substring(6, 8);
                        const sameDayChecks = smList.filter(sm => {
                            const sStr = sm.STOP_STARTDATE || '';
                            return sStr.startsWith(dispatchDayWithHyphen);
                        });
                        for (let c = 0; c < sameDayChecks.length; c++) {
                            const gName = sameDayChecks[c].GUBUN_NAME || sameDayChecks[c].GUBUN || sameDayChecks[c].GUBUN_DETAIL || '';
                            if (gName.includes('일상')) { detectedGubun = '일상'; break; }
                            if (gName.includes('주간')) { detectedGubun = '주간'; break; }
                            if (gName.includes('월간')) { detectedGubun = '월간'; break; }
                        }
                    }

                    if (detectedGubun && (detectedGubun.includes('일상') || detectedGubun.includes('주간') || detectedGubun.includes('월간'))) {
                        const cleanG = detectedGubun.includes('일상') ? '일상' : (detectedGubun.includes('주간') ? '주간' : '월간');
                        inspectionResultMap.set(idx, cleanG);
                    }
                });

            } catch(inspErr) {
                console.warn('점검여부 판정 중 오류 발생:', inspErr);
            }

            // 3단계: [붙임 2] 서식 행 구성 (상단 요약표 제거, 공식 2줄 헤더로 시작)
            updateProgress(92, '엑셀 파일 구성 중...');

            const sheetData = [];

            // 공식 헤더 1행
            const h1 = [
                '관할 환경청', '연번', '측정소', '경보 종류', '경보 지속기간', '', '',
                '초과항목(1)', '단위', '초과농도', '경보기준',
                '초과항목(2)', '단위', '초과농도', '경보기준',
                '초과항목(3)', '단위', '초과농도', '경보기준',
                '초과항목(4)', '단위', '초과농도', '경보기준',
                '초과항목(5)', '단위', '초과농도', '경보기준',
                '초과항목(6)', '단위', '초과농도', '경보기준',
                '초과항목(7)', '단위', '초과농도', '경보기준',
                '초과항목(8)', '단위', '초과농도', '경보기준',
                '초과항목(9)', '단위', '초과농도', '경보기준',
                '초과항목(10)', '단위', '초과농도', '경보기준',
                '시료분석요청일', '시료분석여부', '경보발령요청', '경보발령여부', '경보발령문서번호', '방제사고번호',
                '긴급출동여부(평일＆휴일)', '',
                '점검여부', '미출동사유',
                '추정 경보 원인', '조치 사항', '예비경보알림유무', '비고'
            ];

            // 공식 헤더 2행 (하위 구분)
            const h2 = [
                '', '', '', '', '발생', '해제', '기간',
                // 초과항목 1~10 (총 40칸 빈칸)
                '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
                '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
                // 시료분석 ~ 방제사고 (총 6칸 빈칸)
                '', '', '', '', '', '',
                // 긴급출동여부 하위 (2칸: 주간, 야간)
                '주간(09:00~18:00)', '야간(18:00~09:00)',
                // 점검여부 ~ 비고 (총 6칸 빈칸)
                '', '', '', '', '', ''
            ];

            sheetData.push(h1);
            sheetData.push(h2);

            // 데이터 행 추가
            rawList.forEach((r, idx) => {
                const office = getEnvOffice(r.SITE_NAME || '');
                const detail = detailMap.get(idx);
                const isConfirmed = (r.CONFIRM_STATE2 === '결재완료' || r.CONFIRM_STATE === '결재');

                // 초과항목 1~10칸 정밀 1:1 결합 (항목명 기준 단위/수치/기준 완전 일치 보장)
                const itemCols = [];
                const msgCodeMap = parseMsgCodeMap(r.START_ALARM_MSG || '');
                const msgCodes = Object.keys(msgCodeMap);

                // 항목 코드별 표준 단위 및 기본 기준 사전 (역전 방지용)
                const getItemDefaultMeta = (code) => {
                    const c = (code || '').toUpperCase();
                    if (c.indexOf('BIO69') !== -1) return { unit: '%', std: '>20' };
                    if (c.indexOf('BIOTOX') !== -1) return { unit: '%', std: '<-20' };
                    if (c.indexOf('DO') !== -1) return { unit: '㎎/L', std: '<4' };
                    if (c.indexOf('EC') !== -1) return { unit: '㎲/㎝', std: '>400' };
                    if (c.indexOf('PH') !== -1) return { unit: '-', std: '<6,>9.5' };
                    if (c.indexOf('TOC') !== -1) return { unit: '㎎/L', std: '>8' };
                    if (c.indexOf('TP') !== -1) return { unit: '㎎/L', std: '>0.25' };
                    if (c.indexOf('TN') !== -1) return { unit: '㎎/L', std: '>7' };
                    if (c.indexOf('TCE') !== -1 || c.indexOf('PCE') !== -1 || c.indexOf('BNZ') !== -1 || c.indexOf('DCM') !== -1 || c.indexOf('CBT') !== -1 || c.indexOf('ECBT') !== -1 || c.indexOf('EDCM') !== -1) {
                        return { unit: '㎍/L', std: '>10' };
                    }
                    return { unit: '㎎/L', std: '-' };
                };

                for (let k = 0; k < 10; k++) {
                    if (msgCodes[k]) {
                        const code = msgCodes[k];
                        const val = msgCodeMap[code];
                        const defaultMeta = getItemDefaultMeta(code);

                        let unit = defaultMeta.unit;
                        let std = defaultMeta.std;

                        // 폼 데이터에 해당 항목명과 일치하는 항목이 있으면 폼의 실제 기준/단위 사용
                        if (detail && detail.items) {
                            let matchedFormIdx = -1;
                            for (let m = 0; m < detail.items.length; m++) {
                                const fName = detail.items[m];
                                if (
                                    (code.indexOf('DO') !== -1 && fName.indexOf('용존산소') !== -1) ||
                                    (code.indexOf('BIO69') !== -1 && fName.indexOf('발광박테리아') !== -1) ||
                                    (code.indexOf('BIOTOX') !== -1 && fName.indexOf('미생물') !== -1) ||
                                    (code.indexOf('EC') !== -1 && fName.indexOf('전기전도도') !== -1) ||
                                    (code.indexOf('TOC') !== -1 && fName.indexOf('유기탄소') !== -1) ||
                                    (code.indexOf('TP') !== -1 && fName.indexOf('총인') !== -1) ||
                                    (code.indexOf('TN') !== -1 && fName.indexOf('총질소') !== -1)
                                ) {
                                    matchedFormIdx = m;
                                    break;
                                }
                            }

                            if (matchedFormIdx !== -1) {
                                if (detail.units && detail.units[matchedFormIdx] && detail.units[matchedFormIdx] !== '-') {
                                    unit = detail.units[matchedFormIdx];
                                }
                                if (detail.stds && detail.stds[matchedFormIdx]) {
                                    const parsedStd = formatAlarmStd(detail.stds[matchedFormIdx]);
                                    if (parsedStd !== '-') std = parsedStd;
                                }
                            }
                        }

                        itemCols.push(code, unit, val, std);
                    } else {
                        itemCols.push('', '', '', '');
                    }
                }

                const stDate = r.START_ALARM_DATE || '';
                const timePart = stDate.split(' ')[1] || '00:00';
                const hour = parseInt(timePart.split(':')[0], 10);
                const isDayTime = (hour >= 9 && hour < 18);
                const isMoved = (r.MOVE_YN === '출동' || r.MOVE_YN === 'Y');

                const dayCheck = isMoved && isDayTime ? 'O' : '';
                const nightCheck = isMoved && !isDayTime ? 'O' : '';
                const noMoveReason = !isMoved ? (r.THINKALARM || '상황실 모니터링') : '';

                // 조치사항 분기: 실제 작성된 조치내용(RESCONTENT)만 반영하고 임의 추정 문구 없이 확실하지 않으면 공란
                let actionText = '';
                if (isConfirmed && detail && detail.resContent) {
                    actionText = detail.resContent;
                }

                // 비고(61열): 폼의 실제 대분류(MATTER_LR: 108=환경적 요인, 109=설비적 요인) 기준 매핑. 없으면 공란.
                let remarkText = '';
                if (detail && detail.matterLr) {
                    if (detail.matterLr === '108') {
                        remarkText = '환경적 요인';
                    } else if (detail.matterLr === '109') {
                        remarkText = '설비적 요인';
                    }
                }

                sheetData.push([
                    office,
                    idx + 1,
                    r.SITE_NAME || '-',
                    r.ALARM_NM || '-',
                    r.START_ALARM_DATE || '-',
                    r.END_ALARM_DATE || '-',
                    r.GIGAN || '-',
                    ...itemCols,
                    'X', 'X', 'X', '', '해당없음', '',
                    dayCheck,
                    nightCheck,
                    inspectionResultMap.get(idx) || '', // 56. 점검여부 (출동 당일 일상/주간/월간 점검 병행 시 해당 명칭 기입, 없으면 공란)
                    '', // 57. 미출동사유 (빈칸)
                    r.THINKALARM || '-',
                    actionText,
                    'X',
                    remarkText // 61. 비고 (108=환경적 요인, 109=설비적 요인, 없으면 공란)
                ]);
            });

            updateProgress(98, '엑셀 파일 저장 중...');

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(sheetData);

            // 셀 병합 설정 (!merges)
            // r: 행 (0-based, 0=헤더1행, 1=헤더2행), c: 열 (0-based)
            const merges = [
                // 세로 병합 (1행~2행): 관할환경청(0), 연번(1), 측정소(2), 경보종류(3)
                { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
                { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
                { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
                { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },
                // 가로 병합 (1행 4~6열): 경보 지속기간 (발생, 해제, 기간)
                { s: { r: 0, c: 4 }, e: { r: 0, c: 6 } },
                // 시료분석 ~ 방제사고 (세로 병합 47~52열)
                { s: { r: 0, c: 47 }, e: { r: 1, c: 47 } },
                { s: { r: 0, c: 48 }, e: { r: 1, c: 48 } },
                { s: { r: 0, c: 49 }, e: { r: 1, c: 49 } },
                { s: { r: 0, c: 50 }, e: { r: 1, c: 50 } },
                { s: { r: 0, c: 51 }, e: { r: 1, c: 51 } },
                { s: { r: 0, c: 52 }, e: { r: 1, c: 52 } },
                // 가로 병합 (1행 53~54열): 긴급출동여부(평일＆휴일) -> 주간(53), 야간(54)
                { s: { r: 0, c: 53 }, e: { r: 0, c: 54 } },
                // 세로 병합: 점검여부(55), 미출동사유(56), 추정경보원인(57), 조치사항(58), 예비경보(59), 비고(60)
                { s: { r: 0, c: 55 }, e: { r: 1, c: 55 } },
                { s: { r: 0, c: 56 }, e: { r: 1, c: 56 } },
                { s: { r: 0, c: 57 }, e: { r: 1, c: 57 } },
                { s: { r: 0, c: 58 }, e: { r: 1, c: 58 } },
                { s: { r: 0, c: 59 }, e: { r: 1, c: 59 } },
                { s: { r: 0, c: 60 }, e: { r: 1, c: 60 } }
            ];

            // 초과항목(1~10): 1행 4열씩 가로 병합 및 세로 병합
            for (let m = 0; m < 10; m++) {
                const startCol = 7 + (m * 4);
                merges.push({ s: { r: 0, c: startCol }, e: { r: 0, c: startCol + 3 } });
            }
            ws['!merges'] = merges;

            // 열 너비 설정 (!cols)
            const colWidths = [
                { wch: 15 }, // 관할 환경청
                { wch: 6 },  // 연번
                { wch: 10 }, // 측정소
                { wch: 8 },  // 경보 종류
                { wch: 16 }, // 발생
                { wch: 16 }, // 해제
                { wch: 12 }, // 기간
            ];
            // 초과항목 1~10칸 (항목, 단위, 농도, 기준)
            for (let m = 0; m < 10; m++) {
                colWidths.push({ wch: 9 }, { wch: 7 }, { wch: 9 }, { wch: 10 });
            }
            // 후속 열 너비
            colWidths.push(
                { wch: 13 }, // 시료분석요청일
                { wch: 11 }, // 시료분석여부
                { wch: 11 }, // 경보발령요청
                { wch: 11 }, // 경보발령여부
                { wch: 15 }, // 경보발령문서번호
                { wch: 12 }, // 방제사고번호
                { wch: 16 }, // 주간(09:00~18:00)
                { wch: 16 }, // 야간(18:00~09:00)
                { wch: 10 }, // 점검여부
                { wch: 12 }, // 미출동사유
                { wch: 38 }, // 추정 경보 원인
                { wch: 55 }, // 조치 사항
                { wch: 13 }, // 예비경보알림유무
                { wch: 13 }  // 비고
            );
            ws['!cols'] = colWidths;

            // 셀 스타일 지정 (SheetJS Pro/Community 호환: 정렬, 테두리, 배경색)
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:BI2');
            const thinBorder = {
                top: { style: 'thin', color: { rgb: 'D1D5DB' } },
                bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
                left: { style: 'thin', color: { rgb: 'D1D5DB' } },
                right: { style: 'thin', color: { rgb: 'D1D5DB' } }
            };

            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = ws[cellAddress];
                    if (!cell) continue;

                    // 헤더 서식 (1행, 2행)
                    if (R === 0 || R === 1) {
                        cell.s = {
                            font: { name: '맑은 고딕', sz: 10, bold: true, color: { rgb: '1E293B' } },
                            fill: { fgColor: { rgb: 'F1F5F9' } },
                            alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
                            border: thinBorder
                        };
                    } else {
                        // 데이터 행 서식
                        // 긴 텍스트(추정원인 C=57, 조치사항 C=58)는 좌측 정렬, 나머지는 가운데 정렬
                        const isLongText = (C === 57 || C === 58);
                        cell.s = {
                            font: { name: '맑은 고딕', sz: 9.5, color: { rgb: '0F172A' } },
                            alignment: {
                                vertical: 'center',
                                horizontal: isLongText ? 'left' : 'center',
                                wrapText: isLongText
                            },
                            border: thinBorder
                        };
                    }
                }
            }

            XLSX.utils.book_append_sheet(wb, ws, '붙임2_경보발생현황');
            const fileName = \`[붙임2]_수질오염_경보발생_현황_(\${pDayVal}_\${pDay2Val})_\${rawList.length}건.xlsx\`;
            XLSX.writeFile(wb, fileName);

            updateProgress(100, \`완료! 총 \${rawList.length}건 엑셀 다운로드 성공\`);
            setTimeout(() => {
                if (progBox) progBox.style.display = 'none';
                if (startBtn) startBtn.style.display = 'inline-flex';
                if (cancelBtn) cancelBtn.style.display = 'none';
            }, 3000);

        } catch (err) {
            console.error(err);
            alert('수질오염사고 크롤링 중 오류가 발생했습니다: ' + err.message);
        } finally {
            isRunning = false;
        }
    }

    // 전역 호출 등록
    window.__runPollutionActionCrawler = runPollutionActionProcess;
`;
