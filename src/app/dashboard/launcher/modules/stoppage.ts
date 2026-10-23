/**
 * src/app/analysis/utils/launchers/unified/unifiedStoppage.ts
 * 모드 2: 운전정지·재개 분석 프로세스 (5분 시계열 정밀 분석 및 장비별/동일시점 그룹핑 뷰)
 */

export const UNIFIED_STOPPAGE_JS = `
    // ==========================================
    // 5. 모드 2: 운전정지·재개 분석 프로세스 (정밀 엔진)
    // ==========================================
    const getJurisdiction = (name) => {
        const cleanName = (name || '').replace(/\\(국가망\\)|\\(소규모\\)/g, '').trim();
        const wonjuList = ['평창강', '단양', '충주', '달천', '원주', '인제', '서상', '의암호', '화천', '대가리천', '장평천', '동진천', '구안천', '요도천', '원곡천', '영덕천', '앙성천', '전천', '원주천'];
        return wonjuList.includes(cleanName) ? '원주지방환경청' : '한강유역환경청';
    };

    const formatDuration = (minutes) => {
        const totalMins = Math.max(0, Math.round(minutes || 0));
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        if (hrs > 0 && mins > 0) return \`\${hrs}시간 \${mins}분\`;
        if (hrs > 0) return \`\${hrs}시간\`;
        return \`\${mins}분\`;
    };

    // 표준 항목 정렬 순서
    const ITEM_SORT_ORDER = [
        '수소이온농도', '용존산소', '전기전도도', '수온', '탁도', 
        '총유기탄소', '총질소', '총인', '질산성질소', '암모니아성질소', '유류',
        '클로로필-a', '독성도[발광박테리아]', '미생물 독성지수', '독성지수[좌]', '독성지수[우]', '독성지수', '프렉탈 차수'
    ];

    const getItemPriority = (name) => {
        const idx = ITEM_SORT_ORDER.findIndex(orderedName => name.includes(orderedName) || orderedName.includes(name));
        return idx === -1 ? 999 : idx;
    };

    const sortMeasurementItems = (items) => {
        return [...items].sort((a, b) => getItemPriority(a) - getItemPriority(b));
    };

    const formatGroupedItems = (items) => {
        if (!items || items.length === 0) return '';
        const GENERAL_BASIC_ITEMS = ['수소이온농도', '수온', '용존산소', '전기전도도', '탁도'];
        const vocKeywords = ['벤젠', '톨루엔', '에틸벤젠', '자일렌', '디클로로메탄', '트리클로로에테인', '트리클로로에틸렌', '테트라클로로에틸렌', '사염화탄소', '[ECD]'];
        const bioKeywords = ['미생물 독성지수', '독성도[발광박테리아]', '독성지수[좌]', '독성지수[우]'];

        const parts = [];
        const vocItems = items.filter(item => vocKeywords.some(kw => item.includes(kw)));
        const generalItems = items.filter(item => GENERAL_BASIC_ITEMS.includes(item));
        const otherItems = items.filter(item => !vocKeywords.some(kw => item.includes(kw)) && !GENERAL_BASIC_ITEMS.includes(item));

        // 1. 일반항목 (5종: 수소이온농도, 수온, 용존산소, 전기전도도, 탁도)
        if (generalItems.length >= 5) parts.push('일반항목');
        else if (generalItems.length === 4 && !generalItems.includes('탁도')) parts.push('일반항목(탁도 제외)');
        else if (generalItems.length > 0) parts.push(...sortMeasurementItems(generalItems));

        // 2. 단독 분석 항목
        const bioItems = otherItems.filter(item => bioKeywords.some(kw => item.includes(kw)));
        const standaloneItems = otherItems.filter(item => !bioKeywords.some(kw => item.includes(kw)));
        if (standaloneItems.length > 0) parts.push(...sortMeasurementItems(standaloneItems));

        // 3. 휘발성 유기화합물
        if (vocItems.length >= 8) parts.push('휘발성 유기화합물');
        else if (vocItems.length === 1) parts.push(\`휘발성 유기화합물(\${vocItems[0]})\`);
        else if (vocItems.length > 0) parts.push(\`휘발성 유기화합물(\${sortMeasurementItems(vocItems).join(', ')})\`);

        // 4. 생물감시
        const mapBioName = (name) => {
            if (name === '독성도[발광박테리아]' || name === '독성도') return '생물감시(발광박테리아)';
            if (name === '미생물 독성지수' || name === '미생물독성지수') return '생물감시(미생물)';
            if (name === '독성지수[좌]') return '생물감시(독성지수 좌)';
            if (name === '독성지수[우]') return '생물감시(독성지수 우)';
            if (name === '독성지수') return '생물감시(독성지수)';
            return name;
        };

        const hasLeft = bioItems.includes('독성지수[좌]');
        const hasRight = bioItems.includes('독성지수[우]');
        if (hasLeft && hasRight) {
            parts.push('생물감시(독성지수 좌·우)');
            bioItems.filter(b => b !== '독성지수[좌]' && b !== '독성지수[우]').forEach(b => parts.push(mapBioName(b)));
        } else if (bioItems.length > 0) {
            bioItems.forEach(b => parts.push(mapBioName(b)));
        }

        return parts.length > 0 ? parts.join(', ') : sortMeasurementItems(items).join(', ');
    };

    async function runStoppageProcess() {
        const targetStations = ALL_STATIONS.filter(s => selectedSet.has(s.value));
        if (targetStations.length === 0) {
            alert('최소 1개 이상의 측정소를 선택해주세요.');
            return;
        }

        isRunning = true;
        cancelRequested = false;
        const progBox = document.getElementById('wms-progress-box');
        const progText = document.getElementById('wms-prog-text');
        const progPct = document.getElementById('wms-prog-pct');
        const progBar = document.getElementById('wms-prog-bar');
        const runBtn = document.getElementById('wms-start-run-btn');
        const cancelBtn = document.getElementById('wms-cancel-run-btn');

        progBox.style.display = 'flex';
        runBtn.style.display = 'none';
        if (cancelBtn) {
            cancelBtn.style.display = 'inline-flex';
            cancelBtn.disabled = false;
            cancelBtn.textContent = '⏹️ 작업 중단';
        }

        try {
            // 0) 스마트 워커 연동 (측정자료 10061)
            await getWorkerContext('/wms/measureData/site?pMENUMST_ID=10061', '10061', '측정자료 화면(10061)');

            const allStoppageResults = [];
            let lastType = '';

            for (let i = 0; i < targetStations.length; i++) {
                if (cancelRequested) break;
                const st = targetStations[i];
                const pct = Math.round(((i) / targetStations.length) * 100);
                progPct.textContent = pct + '%';
                progBar.style.width = pct + '%';
                progText.textContent = \`[\${i + 1}/\${targetStations.length}] \${st.name} 5분 자료 분석 중...\`;

                try {
                    if (st.typeCode !== lastType) {
                        await setVal('#pMsrstnSeCd', st.typeCode);
                        lastType = st.typeCode;
                        await delay(600);
                    }

                    // 측정소 및 5분 주기 설정 (800ms 항목 로딩 대기 포함)
                    await setStationSelect(st);
                    await setVal('#pIntVal', 'fiveMinute');
                    await setVal('#pDay', startDate);
                    await setVal('#pDay2', endDate);
                    await setVal('#pStartDate', startDate);
                    await setVal('#pEndDate', endDate);
                    await checkAllItemsFor5Min();

                    // 이전 데이터 클리어
                    const { dp } = findTimeSeriesGrid();
                    if (dp && typeof dp.clearRows === 'function') {
                        try { dp.clearRows(); } catch(e) {}
                    }

                    await executeSearch();
                    let hasData = await waitForGridData(25000);

                    // 타임아웃 시 1회 재시도
                    if (!hasData) {
                        await checkAllItemsFor5Min();
                        await executeSearch();
                        hasData = await waitForGridData(15000);
                    }

                    if (hasData) {
                        const { rows, gv } = extractRowsFromRealGrid();
                        const events = analyzeStationStoppage(st, rows, gv, stoppageFilters);
                        allStoppageResults.push(...events);
                    }
                } catch(e) {
                    console.warn(st.name, e);
                }
            }

            progPct.textContent = '100%';
            progBar.style.width = '100%';
            progText.textContent = cancelRequested ? '작업이 중단되었습니다.' : '운전정지 분석 완료!';
            await delay(400);

            renderStoppageResultView(allStoppageResults);
        } catch (err) {
            console.error('운전정지 분석 오류:', err);
            alert('운전정지 분석 중 오류가 발생했습니다: ' + (err.message || err));
        } finally {
            cleanupWorkerWindow();
            isRunning = false;
            if (cancelBtn) cancelBtn.style.display = 'none';
            runBtn.style.display = 'inline-flex';
            runBtn.disabled = false;
            runBtn.style.opacity = '1';
        }
    }

    function analyzeStationStoppage(station, rows, targetGv, options) {
        if (!rows || rows.length === 0) return [];
        const headerMap = {};
        let dateField = null;

        const gvToUse = targetGv || window.gridView;
        if (gvToUse && typeof gvToUse.getColumns === 'function') {
            try {
                const cols = gvToUse.getColumns();
                const traverse = (colList, parentText = '') => {
                    (colList || []).forEach(c => {
                        let headerText = '';
                        if (typeof c.header === 'string') headerText = c.header;
                        else if (c.header && typeof c.header.text === 'string') headerText = c.header.text;

                        const curText = headerText.trim();
                        const effectiveParent = parentText || (curText && !curText.includes('측정값') && !curText.includes('상태') ? curText : '');

                        if (curText.includes('일시') || curText.includes('시간') || curText.includes('DATE') || curText.includes('DT') || curText === 'DAY' || c.fieldName === 'DAY') {
                            dateField = c.fieldName || c.name;
                        }

                        if (c.columns && c.columns.length > 0) {
                            traverse(c.columns, effectiveParent);
                        } else {
                            const fn = c.fieldName || c.name;
                            if (fn) {
                                const targetGroup = effectiveParent || curText;
                                if (!headerMap[targetGroup]) headerMap[targetGroup] = { valKey: null, statKey: null };
                                if (curText.includes('상태') || curText.includes('STAT') || fn.toUpperCase().includes('STAT')) {
                                    headerMap[targetGroup].statKey = fn;
                                } else {
                                    headerMap[targetGroup].valKey = fn;
                                }
                            }
                        }
                    });
                };
                traverse(cols);
            } catch(e) {}
        }

        if (!dateField) {
            const firstRow = rows[0] || {};
            const candidates = ['MSR_DATE', 'DATETIME', 'DATA_DT', 'MESURE_DT', 'MSR_DATE2', 'DAY', 'DATE'];
            for (const c of candidates) {
                if (firstRow[c] !== undefined) { dateField = c; break; }
            }
        }

        const parseDateTimeStr = (raw) => {
            const s = String(raw || '').trim();
            if (!s) return '';
            if (s.includes('-') || s.includes('/')) return s.replace(/\\//g, '-');
            if (s.length >= 12) {
                return \`\${s.slice(0,4)}-\${s.slice(4,6)}-\${s.slice(6,8)} \${s.slice(8,10)}:\${s.slice(10,12)}\`;
            }
            return s;
        };

        const getDiffMin = (t1, t2) => {
            if (!t1 || !t2) return 999999;
            const ms1 = new Date(t1.replace(/-/g, '/')).getTime();
            const ms2 = new Date(t2.replace(/-/g, '/')).getTime();
            if (isNaN(ms1) || isNaN(ms2)) return 999999;
            return Math.round(Math.abs(ms2 - ms1) / 60000);
        };

        const itemEvents = [];
        // 정도관리(E코드) 유효 판정용: 일자별·항목별 정상 시간 수(OK시간수) 집계
        // 1시간 내 OK 7개 이상이면 정상 1시간 인정 -> 하루 총 정상 시간이 12시간 이하인 '무효일'에 발생한 E코드만 추출
        const dailyItemOkHours = {}; // { [itemName]: { [ymd]: okHourCount } }

        Object.keys(headerMap).forEach(itemName => {
            const cleanName = String(itemName || '').trim();
            if (!cleanName || cleanName.includes('일시') || cleanName.includes('시간') || cleanName === station.name.trim()) return;
            if (isWmsExcludedItem(cleanName)) return;
            const { valKey, statKey } = headerMap[itemName];
            if (!valKey && !statKey) return;

            // 1) 항목별 시간대별 OK 카운트 집계
            const hourlyOkCnt = {}; // { "YYYY-MM-DD HH": count }
            for (let rIdx = 0; rIdx < rows.length; rIdx++) {
                const r = rows[rIdx];
                const dStr = parseDateTimeStr(r[dateField]);
                if (!dStr || dStr.length < 13) continue;
                const hourKey = dStr.slice(0, 13); // "YYYY-MM-DD HH"

                const valRaw = valKey ? String(r[valKey] !== undefined ? r[valKey] : '').trim() : '';
                const statRaw = statKey ? String(r[statKey] !== undefined ? r[statKey] : '').trim().toUpperCase() : '';

                let val = NaN;
                if (valRaw !== '' && valRaw !== '-' && valRaw.toUpperCase() !== 'NULL') {
                    val = parseFloat(valRaw.replace(/,/g, ''));
                }
                const isBadStatus = statRaw.startsWith('G') || statRaw.startsWith('D') || statRaw.startsWith('E') || statRaw === '미수신';
                const isOK = !isNaN(val) && !isBadStatus;

                if (!hourlyOkCnt[hourKey]) hourlyOkCnt[hourKey] = 0;
                if (isOK) hourlyOkCnt[hourKey]++;
            }

            // 2) 일자별 정상 시간 수(OK시간수) 계산 (1시간에 7개 이상이면 정상 1시간 인정)
            const dailyHours = {}; // { "YYYY-MM-DD": okHourCount }
            Object.entries(hourlyOkCnt).forEach(([hk, cnt]) => {
                const ymd = hk.slice(0, 10);
                if (dailyHours[ymd] === undefined) dailyHours[ymd] = 0;
                if (cnt >= 7) dailyHours[ymd]++;
            });
            dailyItemOkHours[itemName] = dailyHours;

            // 3) 개별 항목(Per-Item) 순수 연속 구간 추출 (정밀 5분 간격 추적)
            let currentLog = null;
            for (let rIdx = 0; rIdx < rows.length; rIdx++) {
                const r = rows[rIdx];
                const dStr = parseDateTimeStr(r[dateField]);
                if (!dStr) continue;

                const valRaw = valKey ? String(r[valKey] !== undefined ? r[valKey] : '').trim() : '';
                const statRaw = statKey ? String(r[statKey] !== undefined ? r[statKey] : '').trim().toUpperCase() : '';

                const isValEmpty = valRaw === '' || valRaw === '-' || valRaw.toUpperCase() === 'NULL';
                const isStatEmpty = statRaw === '' || statRaw === '-' || statRaw === '미수신';
                const isUnreceived = (isValEmpty && isStatEmpty) || statRaw === '미수신';

                let effectiveCode = statRaw;
                if (isUnreceived) effectiveCode = '미수신';

                const isG = effectiveCode.startsWith('G');
                const isD = effectiveCode.startsWith('D') || effectiveCode === '미수신';
                const isE = effectiveCode.startsWith('E');

                let targetHit = false;
                let eventCategory = '';
                if (options.includeG && isG) { targetHit = true; eventCategory = '운전정지'; }
                else if (options.includeD && isD) { targetHit = true; eventCategory = '미수신'; }
                else if (options.includeE && isE) { targetHit = true; eventCategory = '정도보증'; }

                if (targetHit) {
                    const diff = getDiffMin(currentLog?.lastTime, dStr);
                    if (currentLog && currentLog.code === effectiveCode && diff > 0 && diff <= 5) {
                        currentLog.endTime = dStr;
                        currentLog.lastTime = dStr;
                        currentLog.duration_min = (currentLog.duration_min || 0) + 5;
                    } else if (currentLog && currentLog.code === effectiveCode && diff === 0) {
                        // 동일 시점 중복 행 통과
                    } else {
                        if (currentLog) itemEvents.push(currentLog);
                        currentLog = {
                            station: station.name,
                            category: station.typeCode === '1' ? '국가망' : '소규모',
                            item: itemName,
                            startTime: dStr,
                            lastTime: dStr,
                            endTime: dStr,
                            duration_min: 5,
                            code: effectiveCode,
                            eventCategory
                        };
                    }
                } else if (currentLog) {
                    itemEvents.push(currentLog);
                    currentLog = null;
                }
            }
            if (currentLog) itemEvents.push(currentLog);
        });

        // 2단계: 정밀 시차 보존 병합 (Exact Time Match Only)
        // ⚠️ 사용자 핵심 요구사항: "5~10분 미세시차를 정확하게 감지할 수 있어야 해. 시차 발생 시 절대 병합 금지!"
        // 시작시간과 종료시간이 100% 동일한 항목들만 그룹핑
        itemEvents.sort((a, b) => {
            const msA = new Date(a.startTime.replace(/-/g, '/')).getTime();
            const msB = new Date(b.startTime.replace(/-/g, '/')).getTime();
            return msA - msB || getItemPriority(a.item) - getItemPriority(b.item);
        });

        const synchronizedEvents = [];
        itemEvents.forEach(ev => {
            let matched = false;
            for (const syn of synchronizedEvents) {
                // 시작시간과 종료시간이 완전히 동일하고 상태코드도 동일한 경우만 묶음
                if (syn.startTime === ev.startTime && syn.endTime === ev.endTime && syn.code === ev.code) {
                    if (!syn.items.includes(ev.item)) {
                        syn.items.push(ev.item);
                    }
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                synchronizedEvents.push({
                    station: station.name,
                    category: station.typeCode === '1' ? '국가망' : '소규모',
                    jurisdiction: getJurisdiction(station.name),
                    startTime: ev.startTime,
                    endTime: ev.endTime,
                    duration_min: ev.duration_min,
                    items: [ev.item],
                    code: ev.code,
                    eventCategory: ev.eventCategory
                });
            }
        });

        // 3단계: 표준 필터링 규칙 적용
        // 1) 미수신/D코드: 2시간(120분) 미만 단순 통신지연 제외 (사용자 피드백 유지)
        // 2) 정도보증(E코드): 과거 공식 [붙임4] 기준 엄격 적용
        //    - VOC 항목: 전수 추출
        //    - 생물감시: 60분 이상 건만 추출
        //    - 일반항목 및 기타: 60분 이상 & 해당 일자의 정상(OK) 시간이 12시간 이하(무효일)에 포함된 건만 추출
        const vocKeywords = ['벤젠', '톨루엔', '에틸벤젠', '자일렌', '디클로로메탄', '트리클로로에테인', '트리클로로에틸렌', '테트라클로로에틸렌', '사염화탄소', '[ECD]'];
        const bioKeywords = ['미생물 독성지수', '독성도[발광박테리아]', '독성지수[좌]', '독성지수[우]'];

        const validEvents = synchronizedEvents.filter(m => {
            const isUnreceivedOrD = m.code.startsWith('D') || m.code === '미수신';
            const isECode = m.code.startsWith('E');

            // 1. D/미수신: 120분 미만 제외
            if (isUnreceivedOrD && (m.duration_min || 0) < 120) return false;

            // 2. E코드 필터링
            if (isECode) {
                const items = m.items || [];
                const isVoc = items.some(itm => vocKeywords.some(kw => itm.includes(kw)));
                const isBio = items.some(itm => bioKeywords.some(kw => itm.includes(kw)));

                if (isVoc) {
                    return true; // VOC 항목은 전수 포함
                }
                if (isBio) {
                    return (m.duration_min || 0) >= 60; // 생물감시는 60분 이상만 포함
                }

                // 일반항목 및 기타 항목
                if ((m.duration_min || 0) < 60) return false; // 60분 미만 제외

                // 해당 날짜의 일간 정상(OK) 시간이 12시간 이하인지(무효일 포함 여부) 확인
                const eventDate = (m.startTime || '').slice(0, 10);
                const okHoursList = items.map(itm => {
                    return dailyItemOkHours[itm] && dailyItemOkHours[itm][eventDate] !== undefined
                        ? dailyItemOkHours[itm][eventDate]
                        : 0;
                });
                const minOkHours = okHoursList.length > 0 ? Math.min(...okHoursList) : 0;
                
                // 정상 시간이 12시간 이하인 날(즉 무효가 12시간 이상 발생한 날)에만 추출 통과
                if (minOkHours > 12) {
                    return false;
                }
            }

            return true;
        });

        return validEvents.map(m => {
            const sortedItems = sortMeasurementItems(m.items);
            const formattedItem = formatGroupedItems(sortedItems);
            let reasonStr = '';
            if (m.code.startsWith('G')) reasonStr = \`운전정지(\${m.code})\`;
            else if (m.code === '미수신') reasonStr = '데이터 미수신';
            else if (m.code.startsWith('D')) reasonStr = \`미수신(\${m.code})\`;
            else if (m.code.startsWith('E')) {
                const eMap = { 'E0': '자동교정', 'E1': '수동교정', 'E2': '정도관리', 'E3': '정도평가' };
                reasonStr = eMap[m.code] || '정도관리';
            } else reasonStr = m.code;

            return {
                ...m,
                items: sortedItems,
                equipment: formattedItem,
                reason: reasonStr,
                formattedDuration: formatDuration(m.duration_min)
            };
        });
    }

    function renderStoppageResultView(results) {
        let currentTab = 'ALL'; // 기본 메인 페이지: 전체 통합 뷰
        let searchQuery = '';

        const getStoppageList = () => results.filter(r => r.code.startsWith('G') || r.code === '미수신' || r.code.startsWith('D'));
        const getCalibrationList = () => results.filter(r => r.code.startsWith('E'));

        const totalStoppage = getStoppageList().length;
        const totalCalibration = getCalibrationList().length;

        body.innerHTML = \`
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <button id="wms-back-btn" class="wms-btn-action wms-btn-secondary" style="padding:6px 14px;font-size:13px;font-weight:900;">◀ 설정으로 돌아가기</button>
                    <div style="display:flex;gap:6px;">
                        <button id="wms-tab-all" class="wms-tab-btn active" style="font-weight:900;">📊 전체 통합 조회 (\${results.length})</button>
                        <button id="wms-tab-stoppage" class="wms-tab-btn" style="color:#0891b2;font-weight:900;">1. 운전정지 및 재개 (\${totalStoppage})</button>
                        <button id="wms-tab-calibration" class="wms-tab-btn" style="color:#2563eb;font-weight:900;">2. 통합 정도보증 E코드 (\${totalCalibration})</button>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <input type="text" id="wms-search-box" placeholder="측정소, 장비명 검색..." style="padding:6px 12px;border-radius:10px;border:1px solid #cbd5e1;font-size:12px;width:150px;">
                    <button id="wms-copy-excel-btn" class="wms-btn-action wms-btn-excel" style="padding:6px 14px;font-size:12px;">📋 엑셀 양식 복사</button>
                    <button id="wms-download-xlsx-btn" class="wms-btn-action" style="padding:6px 14px;font-size:12px;background:#059669;color:white;box-shadow:0 2px 6px rgba(5,150,105,0.25);">📗 2개 시트 엑셀 다운로드</button>
                </div>
            </div>

            <div id="wms-table-container" style="border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;background:#ffffff;flex:1;min-height:0;overflow-y:auto;" class="wms-scrollbar">
                <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:center;">
                    <thead id="wms-result-thead" style="position:sticky;top:0;z-index:2;"></thead>
                    <tbody id="wms-result-tbody"></tbody>
                </table>
            </div>
        \`;

        const updateTable = () => {
            const tbody = document.getElementById('wms-result-tbody');
            const thead = document.getElementById('wms-result-thead');
            if (!tbody || !thead) return;

            let filtered = (currentTab === 'STOPPAGE') ? getStoppageList() : ((currentTab === 'CALIBRATION') ? getCalibrationList() : results);
            if (searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                filtered = filtered.filter(r => r.station.toLowerCase().includes(q) || r.equipment.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q));
            }

            if (currentTab === 'CALIBRATION') {
                thead.innerHTML = \`
                    <tr>
                        <th class="wms-table-header">담당유역</th>
                        <th class="wms-table-header">측정소</th>
                        <th class="wms-table-header">장비</th>
                        <th class="wms-table-header">교정시작 시간</th>
                        <th class="wms-table-header">교정운전 시간</th>
                        <th class="wms-table-header">소요시간(시간/분)</th>
                        <th class="wms-table-header">비고 내역</th>
                    </tr>
                \`;
            } else if (currentTab === 'STOPPAGE') {
                thead.innerHTML = \`
                    <tr>
                        <th class="wms-table-header">담당유역</th>
                        <th class="wms-table-header">측정소</th>
                        <th class="wms-table-header">장비</th>
                        <th class="wms-table-header">정지시작 시간</th>
                        <th class="wms-table-header">운전재개 시간</th>
                        <th class="wms-table-header">소요시간(시간/분)</th>
                        <th class="wms-table-header">비고</th>
                    </tr>
                \`;
            } else {
                // 전체 통합 조회 테이블 헤더 (구분 컬럼 포함)
                thead.innerHTML = \`
                    <tr>
                        <th class="wms-table-header" style="width:90px;">구분</th>
                        <th class="wms-table-header">담당유역</th>
                        <th class="wms-table-header">측정소</th>
                        <th class="wms-table-header">장비</th>
                        <th class="wms-table-header">시작 시간</th>
                        <th class="wms-table-header">재개/완료 시간</th>
                        <th class="wms-table-header">소요시간(시간/분)</th>
                        <th class="wms-table-header">비고</th>
                    </tr>
                \`;
            }

            if (filtered.length === 0) {
                const colSpan = (currentTab === 'ALL') ? 8 : 7;
                tbody.innerHTML = \`<tr><td colspan="\${colSpan}" style="padding:40px;text-align:center;color:#94a3b8;font-weight:700;">해당 조건의 이력이 없습니다.</td></tr>\`;
                return;
            }

            if (currentTab === 'ALL') {
                tbody.innerHTML = filtered.map(r => {
                    const isE = r.code.startsWith('E');
                    const badgeBg = isE ? '#eff6ff' : '#ecfeff';
                    const badgeColor = isE ? '#1d4ed8' : '#0891b2';
                    const badgeText = isE ? '2. 정도보증' : '1. 운전정지';
                    return \`
                        <tr style="border-bottom:1px solid #f1f5f9;">
                            <td class="wms-table-cell"><span style="font-size:11px;font-weight:900;padding:2px 6px;border-radius:6px;background:\${badgeBg};color:\${badgeColor};">\${badgeText}</span></td>
                            <td class="wms-table-cell" style="color:#64748b;">\${r.jurisdiction}</td>
                            <td class="wms-table-cell" style="font-weight:900;color:#0f172a;">\${r.station}</td>
                            <td class="wms-table-cell" style="font-weight:700;color:#1e293b;text-align:left;">\${r.equipment}</td>
                            <td class="wms-table-cell" style="font-family:monospace;font-weight:700;color:#0369a1;">\${r.startTime}</td>
                            <td class="wms-table-cell" style="font-family:monospace;font-weight:700;color:#059669;">\${r.endTime}</td>
                            <td class="wms-table-cell" style="font-weight:800;color:#475569;">\${r.formattedDuration}</td>
                            <td class="wms-table-cell" style="font-weight:800;">\${r.reason}</td>
                        </tr>
                    \`;
                }).join('');
            } else {
                tbody.innerHTML = filtered.map(r => \`
                    <tr style="border-bottom:1px solid #f1f5f9;">
                        <td class="wms-table-cell" style="color:#64748b;">\${r.jurisdiction}</td>
                        <td class="wms-table-cell" style="font-weight:900;color:#0f172a;">\${r.station}</td>
                        <td class="wms-table-cell" style="font-weight:700;color:#1e293b;text-align:left;">\${r.equipment}</td>
                        <td class="wms-table-cell" style="font-family:monospace;font-weight:700;color:#0369a1;">\${r.startTime}</td>
                        <td class="wms-table-cell" style="font-family:monospace;font-weight:700;color:#059669;">\${r.endTime}</td>
                        <td class="wms-table-cell" style="font-weight:800;color:#475569;">\${r.formattedDuration}</td>
                        <td class="wms-table-cell" style="font-weight:800;">\${r.reason}</td>
                    </tr>
                \`).join('');
            }
        };

        document.getElementById('wms-back-btn').onclick = renderMainView;
        document.getElementById('wms-tab-all').onclick = (e) => {
            currentTab = 'ALL';
            document.querySelectorAll('.wms-tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateTable();
        };
        document.getElementById('wms-tab-stoppage').onclick = (e) => {
            currentTab = 'STOPPAGE';
            document.querySelectorAll('.wms-tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateTable();
        };
        document.getElementById('wms-tab-calibration').onclick = (e) => {
            currentTab = 'CALIBRATION';
            document.querySelectorAll('.wms-tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateTable();
        };
        document.getElementById('wms-search-box').oninput = (e) => {
            searchQuery = e.target.value;
            updateTable();
        };

        // 엑셀 양식 클립보드 복사 (전체 또는 해당 탭)
        document.getElementById('wms-copy-excel-btn').onclick = () => {
            const stoppageList = getStoppageList();
            const calList = getCalibrationList();

            let tsv = '';
            if (currentTab === 'STOPPAGE') {
                tsv = '담당유역\\t측정소\\t장비\\t정지시작 시간\\t운전재개 시간\\t소요시간(시간/분)\\t비고\\n';
                stoppageList.forEach(r => {
                    tsv += \`\${r.jurisdiction}\\t\${r.station}\\t\${r.equipment}\\t\${r.startTime}\\t\${r.endTime}\\t\${r.formattedDuration}\\t\${r.reason}\\n\`;
                });
            } else if (currentTab === 'CALIBRATION') {
                tsv = '담당유역\\t측정소\\t장비\\t교정시작 시간\\t교정운전 시간\\t소요시간(시간/분)\\t비고 내역\\n';
                calList.forEach(r => {
                    tsv += \`\${r.jurisdiction}\\t\${r.station}\\t\${r.equipment}\\t\${r.startTime}\\t\${r.endTime}\\t\${r.formattedDuration}\\t\${r.reason}\\n\`;
                });
            } else {
                // 전체 통합 복사: 1.운전정지 + 2.통합정도보증 2단 섹션
                tsv = '1. 운전정지 및 재개 현황\\n';
                tsv += '※ G코드(운전정지), D코드 및 데이터 미수신(공란) 자동 추출\\n\\n';
                tsv += '담당유역\\t측정소\\t장비\\t정지시작 시간\\t운전재개 시간\\t소요시간(시간/분)\\t비고\\n';
                stoppageList.forEach(r => {
                    tsv += \`\${r.jurisdiction}\\t\${r.station}\\t\${r.equipment}\\t\${r.startTime}\\t\${r.endTime}\\t\${r.formattedDuration}\\t\${r.reason}\\n\`;
                });
                tsv += '\\n2. 통합 정도보증 현황\\n';
                tsv += '※ [E코드 추출 기준] ① VOC: 전수 추출 / ② 생물감시: 60분 이상 / ③ 일반항목: 60분 이상 지속 및 일간 정상데이터 12시간 이하(무효일) 발생 건\\n\\n';
                tsv += '담당유역\\t측정소\\t장비\\t교정시작 시간\\t교정운전 시간\\t소요시간(시간/분)\\t비고 내역\\n';
                calList.forEach(r => {
                    tsv += \`\${r.jurisdiction}\\t\${r.station}\\t\${r.equipment}\\t\${r.startTime}\\t\${r.endTime}\\t\${r.formattedDuration}\\t\${r.reason}\\n\`;
                });
            }

            copyToClipboard(tsv, null, () => alert('📋 [붙임 4] 공식 양식으로 클립보드에 복사되었습니다! 엑셀에서 바로 붙여넣기(Ctrl+V) 하세요.'));
        };

        // 📗 2개 시트 분리 엑셀 다운로드 (SheetJS 동적 로드)
        document.getElementById('wms-download-xlsx-btn').onclick = async () => {
            if (typeof XLSX === 'undefined') {
                const loaded = await loadScriptOnce('https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js')
                    || await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
                if (!loaded && typeof XLSX === 'undefined') {
                    alert('XLSX 엑셀 라이브러리를 로드하지 못했습니다. 클립보드 복사 기능을 이용해 주세요.');
                    return;
                }
            }

            const stoppageList = getStoppageList();
            const calList = getCalibrationList();

            const wb = XLSX.utils.book_new();

            // 시트 1: 1.운전정지및재개
            const s1Rows = [
                ['', '1. 운전정지 및 재개 현황'],
                ['', '※ G코드(운전정지), D코드 및 데이터 미수신(공란) 자동 추출'],
                [],
                ['', '담당유역', '측정소', '장비', '정지시작 시간', '운전재개 시간', '소요시간(시간/분)', '비고']
            ];
            stoppageList.forEach(r => {
                s1Rows.push(['', r.jurisdiction, r.station, r.equipment, r.startTime, r.endTime, r.formattedDuration, r.reason]);
            });
            const ws1 = XLSX.utils.aoa_to_sheet(s1Rows);
            ws1['!cols'] = [{ wch: 2 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws1, '1.운전정지및재개');

            // 시트 2: 2.통합정도보증
            const s2Rows = [
                ['', '2. 통합 정도보증 현황'],
                ['', '※ [E코드 추출 기준] ① VOC: 전수 추출 / ② 생물감시: 60분 이상 / ③ 일반항목: 60분 이상 지속 및 일간 정상데이터 12시간 이하(무효일) 발생 건'],
                [],
                ['', '담당유역', '측정소', '장비', '교정시작 시간', '교정운전 시간', '소요시간(시간/분)', '비고 내역']
            ];
            calList.forEach(r => {
                s2Rows.push(['', r.jurisdiction, r.station, r.equipment, r.startTime, r.endTime, r.formattedDuration, r.reason]);
            });
            const ws2 = XLSX.utils.aoa_to_sheet(s2Rows);
            ws2['!cols'] = [{ wch: 2 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws2, '2.통합정도보증');

            const fileName = \`운전정지·재개 리포트_\${startDate}_\${endDate}.xlsx\`;
            XLSX.writeFile(wb, fileName);
        };

        updateTable();
    }
`;
