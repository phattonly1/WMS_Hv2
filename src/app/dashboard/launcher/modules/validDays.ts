/**
 * src/app/analysis/utils/launchers/unified/unifiedValidDays.ts
 * 모드 1: 유효일 가선별 프로세스 (5분 자료 · 13시간 이상 OK 판정 및 측정소별 상세 매트릭스 테이블)
 */

export const UNIFIED_VALID_DAYS_JS = `
    // ==========================================
    // 4. 모드 1: 유효일 가선별 프로세스
    // ==========================================
    async function runDiagnosticProcess() {
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

        // 1) 5분 시계열 검색 조건
        progText.textContent = '검색 조건 설정 중 (5분 시계열)...';
        await selectByText('#pDataType', '5분');
        await setVal('#pIntVal', 'fiveMinute');
        await setVal('#pStartDate', startDate);
        await setVal('#pEndDate', endDate);
        await setVal('#pDay', startDate);
        await setVal('#pDay2', endDate);

        const diagnosticResults = [];
        const total = targetStations.length;
        let lastType = '';

        for (let i = 0; i < total; i++) {
            if (cancelRequested) break;
            const st = targetStations[i];
            const pct = Math.round(((i) / total) * 100);
            progPct.textContent = pct + '%';
            progBar.style.width = pct + '%';
            progText.textContent = \`[\${i + 1}/\${total}] \${st.name} 5분 자료 조회 중...\`;

            try {
                if (st.typeCode !== lastType) {
                    await setVal('#pMsrstnSeCd', st.typeCode);
                    lastType = st.typeCode;
                    await delay(600);
                }

                // 측정소 선택 (800ms 항목 로딩 대기 포함)
                await setStationSelect(st);

                // 검색 파라미터 재확인
                await setVal('#pIntVal', 'fiveMinute');
                await setVal('#pDay', startDate);
                await setVal('#pDay2', endDate);
                await checkAllItemsFor5Min();

                // 이전 데이터 그리드 클리어
                const { dp } = findTimeSeriesGrid();
                if (dp && typeof dp.clearRows === 'function') {
                    try { dp.clearRows(); } catch(e) {}
                }

                // 검색 클릭
                await executeSearch();
                let hasData = await waitForGridData(25000);

                if (!hasData) {
                    await checkAllItemsFor5Min();
                    await executeSearch();
                    hasData = await waitForGridData(15000);
                }

                if (hasData) {
                    progText.textContent = \`[\${i + 1}/\${total}] \${st.name} 유효일(13h 이상 OK) 판정 중...\`;
                    const { rows, gv } = extractRowsFromRealGrid();
                    const evalResult = evaluateStationValidDays(st, rows, gv, startDate, endDate);
                    diagnosticResults.push(evalResult);
                } else {
                    diagnosticResults.push({
                        station: st.name,
                        stationObj: st,
                        category: st.typeCode === '1' ? '국가망' : '소규모',
                        teamId: st.teamId || '',
                        success: false,
                        error: '데이터 수신 대기 초과 또는 자료 없음',
                        data: {},
                        dates: []
                    });
                }
            } catch (err) {
                diagnosticResults.push({
                    station: st.name,
                    stationObj: st,
                    category: st.typeCode === '1' ? '국가망' : '소규모',
                    teamId: st.teamId || '',
                    success: false,
                    error: err.message,
                    data: {},
                    dates: []
                });
            }
        }

            progPct.textContent = '100%';
            progBar.style.width = '100%';
            progText.textContent = cancelRequested ? '작업이 중단되었습니다.' : '유효일 분석 완료!';
            await delay(400);

            renderValidDaysResultView(diagnosticResults);
        } catch (err) {
            console.error('유효일 분석 오류:', err);
            alert('유효일 분석 중 오류가 발생했습니다: ' + (err.message || err));
        } finally {
            cleanupWorkerWindow();
            isRunning = false;
            if (cancelBtn) cancelBtn.style.display = 'none';
            runBtn.style.display = 'inline-flex';
            runBtn.disabled = false;
            runBtn.style.opacity = '1';
        }
    }

    // 5분 시계열 기반 13시간(156개) 이상 OK코드 유효일 판정 함수 (측정소별 정밀 엔진)
    function evaluateStationValidDays(station, rows, targetGv, startStr, endStr) {
        const sD = new Date(startStr);
        const eD = new Date(endStr);
        const dates = [];
        let cur = new Date(sD);
        while (cur <= eD) {
            dates.push(fmtDate(cur));
            cur.setDate(cur.getDate() + 1);
        }

        if (!rows || rows.length === 0) {
            return {
                station: station.name,
                stationObj: station,
                category: station.typeCode === '1' ? '국가망' : '소규모',
                teamId: station.teamId || '',
                success: false,
                error: '추출된 데이터 행이 없습니다.',
                data: {},
                dates
            };
        }

        // 1) RealGrid 컬럼 계층구조(ColumnGroup)로부터 화면에 실제 존재하는 항목들만 100% 동적 추출
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
                        const isValueOrStateHeader = curText.includes('측정값') || curText.includes('측정치') || curText.includes('자료') || curText.includes('데이터') || curText.includes('상태') || curText.includes('코드') || curText.includes('FLAG');
                        const effectiveParent = parentText || (!isValueOrStateHeader ? curText : '');

                        if (curText.includes('일시') || curText.includes('시간') || curText.includes('DATE') || curText.includes('DT') || curText === 'DAY' || c.fieldName === 'DAY') {
                            dateField = c.fieldName || c.name;
                        }

                        if (c.columns && c.columns.length > 0) {
                            traverse(c.columns, effectiveParent);
                        } else {
                            const fn = c.fieldName || c.name;
                            if (fn) {
                                const targetGroup = effectiveParent || curText;
                                if (!headerMap[targetGroup]) {
                                    headerMap[targetGroup] = { valKey: null, statKey: null };
                                }
                                const upperFn = fn.toUpperCase();
                                const isStat = curText.includes('상태') || curText.includes('코드') || curText.includes('FLAG') || 
                                               upperFn.includes('STAT') || upperFn.includes('CODE') || upperFn.includes('FLAG');
                                if (isStat) {
                                    headerMap[targetGroup].statKey = fn;
                                } else {
                                    if (headerMap[targetGroup].valKey && headerMap[targetGroup].valKey !== fn) {
                                        const distinctGroup = curText && !isValueOrStateHeader ? (targetGroup + ' ' + curText) : (targetGroup + '_' + fn);
                                        if (!headerMap[distinctGroup]) {
                                            headerMap[distinctGroup] = { valKey: fn, statKey: headerMap[targetGroup].statKey };
                                        } else {
                                            headerMap[distinctGroup].valKey = fn;
                                        }
                                    } else {
                                        headerMap[targetGroup].valKey = fn;
                                    }
                                }
                            }
                        }
                    });
                };
                traverse(cols);
            } catch(e) {
                console.warn('[WMS 런처] 컬럼 스캔 중 경고:', e);
            }
        }

        const sample = rows[0] || {};
        const sampleKeys = Object.keys(sample);

        // 일시 키 감지
        if (!dateField || !sampleKeys.includes(dateField)) {
            dateField = sampleKeys.find(k => k.toUpperCase() === 'DAY') ||
                        sampleKeys.find(k => k.toUpperCase().includes('DAY') || k.toLowerCase().includes('date') || k.toLowerCase().includes('dt'));
            if (!dateField) {
                for (const [k, v] of Object.entries(sample)) {
                    const s = String(v || '').trim();
                    if (/^\\d{4}[-/.]\\d{1,2}[-/.]\\d{1,2}/.test(s) || /^\\d{12,14}$/.test(s)) {
                        dateField = k;
                        break;
                    }
                }
            }
            if (!dateField) dateField = sampleKeys[0];
        }

        // 2) 실제 존재하는 수질 측정 항목만 동적으로 채택 (공통 표준 제외 함수 isWmsExcludedItem 사용)
        const actualItems = {};
        for (const [hName, mapping] of Object.entries(headerMap)) {
            let cleanHName = String(hName || '').trim();
            if (!cleanHName || cleanHName === station.name.trim() || cleanHName.includes(station.name.trim()) || cleanHName.includes('측정소') || cleanHName.includes('지점') || cleanHName.includes('일시') || cleanHName.includes('시간') || cleanHName === 'DAY') continue;
            if (isWmsExcludedItem(cleanHName)) continue;

            // '_' 다음은 단위이므로 '_' 포함하여 이후 텍스트 제거
            if (cleanHName.includes('_')) {
                cleanHName = cleanHName.split('_')[0].trim();
            }
            if (!cleanHName || isWmsExcludedItem(cleanHName)) continue;

            if (mapping && mapping.valKey && mapping.valKey !== dateField) {
                if (actualItems[cleanHName] && actualItems[cleanHName].valKey !== mapping.valKey) {
                    actualItems[cleanHName + ' (2)'] = mapping;
                } else {
                    actualItems[cleanHName] = mapping;
                }
            }
        }

        // headerMap 실패 시 sampleKeys 폴백
        if (Object.keys(actualItems).length === 0) {
            const nonDateKeys = sampleKeys.filter(k => k !== dateField);
            for (let i = 0; i < nonDateKeys.length; i++) {
                const k1 = nonDateKeys[i];
                const k2 = nonDateKeys[i + 1];
                if (k2 && (k2.includes('STAT') || k2.includes('CODE') || k2.startsWith(k1))) {
                    actualItems[k1] = { valKey: k1, statKey: k2 };
                    i++;
                } else if (!k1.includes('STAT') && !k1.includes('CODE')) {
                    actualItems[k1] = { valKey: k1, statKey: null };
                }
            }
        }

        const targetItemNames = Object.keys(actualItems);
        const resultItemData = {};
        targetItemNames.forEach(item => {
            resultItemData[item] = dates.map(d => ({ date: d, isValid: true, reason: null, validHours: 0 }));
        });

        // 일시 파싱 헬퍼 함수
        const parseDatetime = (raw) => {
            if (!raw) return null;
            if (raw instanceof Date || (typeof raw === 'object' && raw && typeof raw.getFullYear === 'function')) {
                const y = raw.getFullYear();
                const m = String(raw.getMonth() + 1).padStart(2, '0');
                const d = String(raw.getDate()).padStart(2, '0');
                const h = String(raw.getHours()).padStart(2, '0');
                return { ymd: \`\${y}-\${m}-\${d}\`, hour: h };
            }
            if (typeof raw === 'number' && raw > 1000000000000) {
                const dt = new Date(raw);
                const y = dt.getFullYear();
                const m = String(dt.getMonth() + 1).padStart(2, '0');
                const d = String(dt.getDate()).padStart(2, '0');
                const h = String(dt.getHours()).padStart(2, '0');
                return { ymd: \`\${y}-\${m}-\${d}\`, hour: h };
            }
            const s = String(raw).trim().replace(/\\u00A0/g, ' ');
            if (!s) return null;

            const m1 = s.match(/^(\\d{4})[-/.](\\d{1,2})[-/.](\\d{1,2})\\s+(\\d{1,2})/);
            if (m1) {
                return {
                    ymd: \`\${m1[1]}-\${m1[2].padStart(2, '0')}-\${m1[3].padStart(2, '0')}\`,
                    hour: m1[4].padStart(2, '0')
                };
            }
            const m2 = s.match(/^(\\d{4})(\\d{2})(\\d{2})(\\d{2})/);
            if (m2 && parseInt(m2[2]) >= 1 && parseInt(m2[2]) <= 12 && parseInt(m2[3]) >= 1 && parseInt(m2[3]) <= 31) {
                return { ymd: \`\${m2[1]}-\${m2[2]}-\${m2[3]}\`, hour: m2[4] };
            }
            const parsedD = new Date(s);
            if (!isNaN(parsedD.getTime()) && parsedD.getFullYear() > 2000) {
                const y = parsedD.getFullYear();
                const m = String(parsedD.getMonth() + 1).padStart(2, '0');
                const d = String(parsedD.getDate()).padStart(2, '0');
                const h = String(parsedD.getHours()).padStart(2, '0');
                return { ymd: \`\${y}-\${m}-\${d}\`, hour: h };
            }
            return null;
        };

        // 각 항목별 5분 데이터 집계 및 13시간 이상 OK 판정
        targetItemNames.forEach(item => {
            const mapping = actualItems[item];
            const hourlyMap = {};
            const dailyReasons = {};

            rows.forEach(r => {
                const rawDate = r[dateField] !== undefined ? r[dateField] : (r['DAY'] || r['day'] || r['DATE'] || r['date'] || r['MSR_DATE'] || r['일시']);
                const dtParsed = parseDatetime(rawDate);
                if (!dtParsed) return;
                const { ymd, hour } = dtParsed;
                const hourKey = ymd + ' ' + hour;

                if (!hourlyMap[hourKey]) hourlyMap[hourKey] = { validCnt: 0 };
                if (!dailyReasons[ymd]) dailyReasons[ymd] = {};

                let rawVal = r[mapping.valKey];
                const status = mapping.statKey ? String(r[mapping.statKey] || '').trim().toUpperCase() : '';

                let val = NaN;
                if (typeof rawVal === 'number') {
                    val = rawVal;
                } else if (rawVal !== null && rawVal !== undefined) {
                    const cleanStr = String(rawVal).trim().replace(/,/g, '');
                    if (cleanStr !== '' && cleanStr !== '-' && cleanStr.toUpperCase() !== 'NULL') {
                        val = parseFloat(cleanStr);
                    }
                }

                // 5분 정상(OK) 데이터 판정:
                // 값이 유효한 숫자여야 하며, 상태코드가 존재할 때는 반드시 정상('OK' 또는 '정상')이어야 함
                // G(점검), D(가동/운전정지), E(이상), F(교정), 미수신, 결측, 에러 및 관련 한글 상태코드는 엄격히 제외
                const isExplicitBadStatus = 
                    status.startsWith('G') || 
                    status.startsWith('D') || 
                    status.startsWith('E') || 
                    status.startsWith('F') || 
                    status.includes('점검') || 
                    status.includes('정지') || 
                    status.includes('교정') || 
                    status.includes('보수') || 
                    status.includes('이상') || 
                    status.includes('결측') || 
                    status.includes('단선') || 
                    status.includes('수기') || 
                    status.includes('미수신') || 
                    status.includes('ERR') || 
                    status.includes('FAIL');

                let isOK = false;
                if (!isNaN(val)) {
                    if (mapping.statKey) {
                        isOK = !isExplicitBadStatus && (status === 'OK' || status === '정상' || status === '0' || status === 'NORMAL');
                    } else {
                        isOK = !isExplicitBadStatus && (status === '' || status === 'OK' || status === '정상');
                    }
                }

                if (isOK) {
                    hourlyMap[hourKey].validCnt++; // 5분 정상(OK) 데이터 개수 집계
                } else {
                    const code = status || (isNaN(val) ? '결측' : '이상');
                    dailyReasons[ymd][code] = (dailyReasons[ymd][code] || 0) + 1;
                }
            });

            // 일별 유효일 판정:
            // 1) 유효시간(1시간 데이터 생성): 1시간(12개) 중 35분 이상(7개 이상) OK 데이터 확보 시 해당 시간을 1 유효시간으로 인정
            // 2) 유효일: 하루 24시간 중 유효시간이 13개(13시간) 이상 확보되면 유효일(isValid: true)로 확정!
            resultItemData[item] = dates.map(date => {
                let validHours = 0;
                for (let h = 0; h < 24; h++) {
                    const hk = date + ' ' + String(h).padStart(2, '0');
                    // 1시간당 35분(5분 7개) 이상 확보되면 유효시간 인정
                    if (hourlyMap[hk] && hourlyMap[hk].validCnt >= 7) {
                        validHours++;
                    }
                }

                // 13시간 이상 확보 시 유효일 판정
                if (validHours >= 13) {
                    return { date, isValid: true, reason: null, validHours };
                }

                let maxCode = '결측';
                let maxCnt = 0;
                const dCodes = dailyReasons[date] || {};
                Object.entries(dCodes).forEach(([c, cnt]) => {
                    if (cnt > maxCnt) { maxCnt = cnt; maxCode = c; }
                });
                return { date, isValid: false, reason: maxCode, validHours };
            });
        });

        return {
            station: station.name,
            stationObj: station,
            category: station.typeCode === '1' ? '국가망' : '소규모',
            teamId: station.teamId || '',
            success: true,
            data: resultItemData,
            dates
        };
    }

    // 5. 결과 대시보드 뷰어 (측정소별 상세 매트릭스 테이블 + 엑셀 복사 + VOCs FID/ECD 안전 병합 모드 지원)
    function renderValidDaysResultView(results) {
        if (!results || results.length === 0) {
            alert('추출된 유효일 결과가 없습니다.');
            renderMainView();
            return;
        }

        let curIdx = 0;
        let mergeMode = {
            general: true, // 일반항목 (pH, EC, DO, 수온, 탁도)
            bio: true,     // 생물감시 (독성지수 좌/우, 미생물, 발광 등)
            voc: true      // VOCs (FID, ECD)
        };
        const cur = () => results[curIdx];

        // 항목 자동 분류 헬퍼 (일반항목 5종, 생물감시, VOCs FID/ECD, 기타)
        const getItemGroups = (items) => {
            const GENERAL_5_ITEMS = ['수소이온농도', '전기전도도', '용존산소', '수온', '탁도'];
            const BIO_KEYWORDS = ['독성지수', '미생물', '발광박테리아', '독성도', '물벼룩', '생물감시'];
            const VOC_RAW_NAMES = [
                '디클로로메탄', '1.1.1-트리클로로에테인', '사염화탄소', '벤젠', 
                '트리클로로에틸렌', '톨루엔', '자일렌', '테트라클로로에틸렌', 
                '에틸벤젠', 'm,p-자일렌', 'o-자일렌'
            ];

            const generalItems = [];
            const bioItems = [];
            const ecdItems = [];
            const fidItems = [];
            const otherItems = [];

            items.forEach(it => {
                if (it.includes('[ECD]')) {
                    ecdItems.push(it);
                } else if (VOC_RAW_NAMES.some(vn => it.includes(vn))) {
                    fidItems.push(it);
                } else if (GENERAL_5_ITEMS.includes(it)) {
                    generalItems.push(it);
                } else if (BIO_KEYWORDS.some(bk => it.includes(bk))) {
                    bioItems.push(it);
                } else {
                    otherItems.push(it);
                }
            });

            return {
                generalItems,
                bioItems,
                fidItems,
                ecdItems,
                otherItems,
                hasGeneral: generalItems.length >= 2,
                hasBio: bioItems.length >= 2,
                hasVoc: (fidItems.length > 0 || ecdItems.length > 0)
            };
        };

        const formatDayCell = (dateStr) => {
            const dObj = new Date(dateStr);
            const dayNum = isNaN(dObj.getTime()) ? -1 : dObj.getDay();
            const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
            const dayName = dayNum >= 0 ? dayNames[dayNum] : '';
            const isSun = dayNum === 0;
            const isSat = dayNum === 6;
            const dayColor = isSun ? '#e11d48' : (isSat ? '#2563eb' : '#64748b');
            const dayBg = isSun ? '#fff1f2' : (isSat ? '#eff6ff' : '#f8fafc');
            const dayBorder = isSun ? '#fecdd3' : (isSat ? '#bfdbfe' : '#e2e8f0');

            if (!dayName) return dateStr;
            return '<div style="display:inline-flex;align-items:center;gap:6px;justify-content:center;">' +
                   '<span>' + dateStr + '</span>' +
                   '<span style="font-size:10.5px;font-weight:900;color:' + dayColor + ';background:' + dayBg + ';padding:1px 5px;border-radius:4px;border:1px solid ' + dayBorder + ';">' + dayName + '</span>' +
                   '</div>';
        };

        function redraw() {
            const st = cur();
            const rawItems = Object.keys(st.data || {});
            const dates = st.dates || [];
            const groups = getItemGroups(rawItems);

            // 표시할 컬럼 목록 결정
            let displayCols = [];
            // 1. 일반항목
            if (mergeMode.general && groups.hasGeneral) {
                displayCols.push('일반항목');
            } else {
                displayCols.push(...groups.generalItems);
            }
            // 2. 생물감시
            if (mergeMode.bio && groups.hasBio) {
                displayCols.push('생물감시');
            } else {
                displayCols.push(...groups.bioItems);
            }
            // 3. 기타 항목 (TOC, TN, TP, Chl-a 등)
            displayCols.push(...groups.otherItems);
            // 4. VOCs
            if (mergeMode.voc && groups.hasVoc) {
                if (groups.fidItems.length > 0) displayCols.push('VOCs [FID]');
                if (groups.ecdItems.length > 0) displayCols.push('VOCs [ECD]');
            } else {
                displayCols.push(...groups.fidItems, ...groups.ecdItems);
            }

            const allFolded = (!groups.hasGeneral || mergeMode.general) && 
                              (!groups.hasBio || mergeMode.bio) && 
                              (!groups.hasVoc || mergeMode.voc);

            body.innerHTML = \`
                <!-- 상단 툴바 및 측정소 선택 탭 -->
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;border-bottom:1px solid #e2e8f0;padding-bottom:12px;">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                        <button id="wms-btn-back" class="wms-btn-action wms-btn-secondary" style="padding:6px 12px;font-size:12px;white-space:nowrap;font-weight:900;">
                            ◀ 재선택
                        </button>
                        \${results.map((r, i) => \`
                            <button class="wms-btn-action \${i === curIdx ? 'wms-btn-primary' : 'wms-btn-secondary'}" style="padding:6px 12px;font-size:12px;white-space:nowrap;font-weight:\${i === curIdx ? '900' : '700'};" onclick="window.__wmsSetStIdx(\${i})">
                                \${r.teamId ? \`<span style="opacity:0.75;font-size:11px;margin-right:2px;">[\${r.teamId}조]</span>\` : ''}\${r.station}
                                <span style="opacity:0.8;font-size:10px;margin-left:2px;">(\${r.category})</span>
                            </button>
                        \`).join('')}
                    </div>
                    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                        <!-- 일괄 접기/펼치기 토글 -->
                        <button id="wms-btn-toggle-all" class="wms-btn-action" style="padding:6px 11px;font-size:11.5px;font-weight:800;background:\${allFolded ? '#eff6ff' : '#f8fafc'};color:\${allFolded ? '#1d4ed8' : '#334155'};border:1px solid \${allFolded ? '#93c5fd' : '#cbd5e1'};">
                            \${allFolded ? '🔍 전체 펼치기' : '🗂️ 전체 요약 모드'}
                        </button>
                        \${groups.hasGeneral ? \`
                            <button id="wms-btn-toggle-gen" class="wms-btn-action" style="padding:6px 10px;font-size:11px;font-weight:800;background:\${mergeMode.general ? '#f0fdf4' : '#ffffff'};color:\${mergeMode.general ? '#15803d' : '#64748b'};border:1px solid \${mergeMode.general ? '#86efac' : '#cbd5e1'};">
                                일반 \${mergeMode.general ? '펼치기' : '접기'}
                            </button>
                        \` : ''}
                        \${groups.hasBio ? \`
                            <button id="wms-btn-toggle-bio" class="wms-btn-action" style="padding:6px 10px;font-size:11px;font-weight:800;background:\${mergeMode.bio ? '#fefce8' : '#ffffff'};color:\${mergeMode.bio ? '#a16207' : '#64748b'};border:1px solid \${mergeMode.bio ? '#fde047' : '#cbd5e1'};">
                                생물 \${mergeMode.bio ? '펼치기' : '접기'}
                            </button>
                        \` : ''}
                        \${groups.hasVoc ? \`
                            <button id="wms-btn-toggle-voc" class="wms-btn-action" style="padding:6px 10px;font-size:11px;font-weight:800;background:\${mergeMode.voc ? '#f5f3ff' : '#ffffff'};color:\${mergeMode.voc ? '#6d28d9' : '#64748b'};border:1px solid \${mergeMode.voc ? '#c4b5fd' : '#cbd5e1'};">
                                VOCs \${mergeMode.voc ? '펼치기' : '접기'}
                            </button>
                        \` : ''}
                        <button id="wms-btn-copy-cur" class="wms-btn-action wms-btn-excel" style="padding:6px 13px;font-size:12px;font-weight:900;">
                            📋 엑셀 복사
                        </button>
                        <button id="wms-btn-copy-all" class="wms-btn-action wms-btn-secondary" style="padding:6px 11px;font-size:12px;font-weight:800;" title="전체 측정소의 항목별 유효일수 요약 복사">
                            📊 전지점 요약
                        </button>
                    </div>
                </div>

                <!-- 지점 정보 헤더 배너 -->
                <div class="wms-valid-banner" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 3px rgba(0,0,0,0.03);flex-wrap:wrap;gap:10px;">
                    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                        <span style="font-size:16px;font-weight:900;color:#0f172a;">📍 \${st.station}</span>
                        \${st.teamId ? \`<span style="font-size:11px;font-weight:800;background:#ede9fe;color:#6d28d9;padding:2px 8px;border-radius:8px;">\${st.teamId}조</span>\` : ''}
                        <span style="font-size:11px;font-weight:800;background:\${st.category === '국가망' ? '#dbeafe' : '#d1fae5'};color:\${st.category === '국가망' ? '#1e40af' : '#065f46'};padding:2px 8px;border-radius:8px;">
                            \${st.category}
                        </span>
                        <span class="wms-valid-period" style="font-size:12px;font-weight:700;color:#64748b;">
                            조회 기간: \${dates[0] || startDate} ~ \${dates[dates.length - 1] || endDate} (\${dates.length}일간)
                        </span>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span style="font-size:12px;font-weight:700;color:#059669;">
                            표시 컬럼: \${displayCols.length}개 / 원본 \${rawItems.length}개 항목
                        </span>
                        <div style="display:flex;gap:4px;">
                            <button id="wms-btn-prev-st" class="wms-btn-action wms-btn-secondary" style="padding:4px 10px;font-size:11px;" \${curIdx === 0 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>
                                ◀ 이전
                            </button>
                            <span style="font-size:11px;font-weight:800;color:#64748b;display:flex;align-items:center;padding:0 4px;">
                                \${curIdx + 1} / \${results.length}
                            </span>
                            <button id="wms-btn-next-st" class="wms-btn-action wms-btn-secondary" style="padding:4px 10px;font-size:11px;" \${curIdx === results.length - 1 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>
                                다음 ▶
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 결과 매트릭스 테이블 (측정소별 날짜 × 항목 상세 그리드) -->
                \${!st.success ? \`
                    <div style="padding:40px;text-align:center;background:#fef2f2;border:1px solid #fee2e2;border-radius:16px;color:#dc2626;font-weight:800;">
                        ⚠️ \${st.error || '해당 지점의 5분 자료를 수신하지 못했거나 데이터가 비어있습니다.'}
                    </div>
                \` : \`
                    <div class="wms-valid-table-wrap wms-scrollbar" style="flex:1;overflow:auto;height:calc(92vh - 230px);max-height:calc(92vh - 230px);border:1px solid #cbd5e1;border-radius:16px;box-shadow:inset 0 1px 3px rgba(0,0,0,0.03);">
                        <table class="wms-valid-table" style="width:100%;border-collapse:collapse;font-size:12px;text-align:center;">
                            <thead style="position:sticky;top:0;background:#f8fafc;z-index:20;border-bottom:2px solid #cbd5e1;">
                                <tr>
                                    <th style="padding:10px 14px;font-weight:900;text-align:center;vertical-align:middle;position:sticky;top:0;left:0;z-index:30;background:#f8fafc;min-width:110px;width:110px;white-space:nowrap;box-shadow:4px 0 10px -2px rgba(15,23,42,0.06);color:#1e293b;">
                                        일자
                                    </th>
                                    \${displayCols.map(col => {
                                        let bg = '#f8fafc';
                                        if (col === '일반항목') bg = '#f0fdf4';
                                        else if (col === '생물감시') bg = '#fefce8';
                                        else if (col.includes('VOCs')) bg = '#f5f3ff';
                                        return \`
                                            <th style="padding:10px 12px;font-weight:800;text-align:center;vertical-align:middle;white-space:nowrap;color:#334155;border-left:1px solid #e2e8f0;background:\${bg};">
                                                 \${col}
                                            </th>
                                        \`;
                                    }).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                \${dates.map((d, dIdx) => \`
                                    <tr class="wms-table-row" style="border-bottom:1px solid #e2e8f0;\${dIdx % 2 === 0 ? 'background:#ffffff;' : 'background:#f8fafc;'}">
                                        <td style="padding:8px 12px;font-weight:800;text-align:center;vertical-align:middle;position:sticky;left:0;z-index:10;background:inherit;border-right:1px solid #cbd5e1;min-width:125px;width:125px;white-space:nowrap;box-shadow:4px 0 10px -2px rgba(15,23,42,0.06);color:#0f172a;">
                                            \${formatDayCell(d)}
                                        </td>
                                        \${displayCols.map(col => {
                                            // 그룹 병합 렌더링 헬퍼
                                            const renderGroupCell = (groupItems, labelName) => {
                                                const total = groupItems.length;
                                                const validCount = groupItems.filter(it => st.data[it] && st.data[it][dIdx] && st.data[it][dIdx].isValid).length;
                                                const isAllOk = validCount === total && total > 0;
                                                const invalidNames = groupItems.filter(it => !st.data[it] || !st.data[it][dIdx] || !st.data[it][dIdx].isValid);
                                                const tooltip = invalidNames.length > 0 
                                                    ? \`비정상(\${invalidNames.length}): \${invalidNames.map(it => it.replace('[ECD]', '') + '(' + ((st.data[it] && st.data[it][dIdx]) ? (st.data[it][dIdx].reason || '결측') : '결측') + ')').join(', ')}\` 
                                                    : \`전체 \${total}개 항목 정상\`;

                                                return \`
                                                    <td style="padding:6px;border-left:1px solid #f1f5f9;text-align:center;vertical-align:middle;" title="\${tooltip}">
                                                        <div style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;">
                                                            <div style="display:inline-flex;align-items:center;gap:3px;">
                                                                <span style="color:\${isAllOk ? '#10b981' : (validCount > 0 ? '#d97706' : '#ef4444')};font-size:12px;font-weight:900;">
                                                                    \${isAllOk ? '✔' : '✖'}
                                                                </span>
                                                                <span style="font-size:11px;font-weight:800;color:\${isAllOk ? '#059669' : (validCount > 0 ? '#b45309' : '#dc2626')};">
                                                                    \${labelName}(\${validCount}/\${total})
                                                                </span>
                                                            </div>
                                                            \${!isAllOk ? \`
                                                                <span style="font-size:9px;font-weight:700;color:#b45309;background:#fef3c7;border:1px solid #fde68a;padding:0 4px;border-radius:4px;margin-top:2px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                                                    \${invalidNames.map(n => n.replace('[ECD]', '').replace('m,p-', '').replace('o-', '').replace('독성지수', '').replace('수소이온농도', 'pH').replace('전기전도도', 'EC').replace('용존산소', 'DO')).slice(0, 2).join(', ')}\${invalidNames.length > 2 ? ' 외' : ''}
                                                                </span>
                                                            \` : ''}
                                                        </div>
                                                    </td>
                                                \`;
                                            };

                                            // 1) 일반항목 병합
                                            if (col === '일반항목') return renderGroupCell(groups.generalItems, '일반');
                                            // 2) 생물감시 병합
                                            if (col === '생물감시') return renderGroupCell(groups.bioItems, '생물');
                                            // 3) VOCs FID 병합
                                            if (col === 'VOCs [FID]') return renderGroupCell(groups.fidItems, 'FID');
                                            // 4) VOCs ECD 병합
                                            if (col === 'VOCs [ECD]') return renderGroupCell(groups.ecdItems, 'ECD');

                                            // 5) 개별 단일 항목 렌더링
                                            const cell = st.data[col] ? st.data[col][dIdx] : null;
                                            if (!cell || cell.isValid) {
                                                const vh = cell ? cell.validHours : 24;
                                                return \`<td style="padding:6px;border-left:1px solid #f1f5f9;text-align:center;vertical-align:middle;">
                                                    <div style="display:inline-flex;align-items:center;gap:3px;justify-content:center;">
                                                        <span style="color:#10b981;font-weight:900;font-size:14px;">✔</span>
                                                        <span style="font-size:10px;color:#059669;font-weight:700;">\${vh}h</span>
                                                    </div>
                                                </td>\`;
                                            } else {
                                                return \`
                                                    <td style="padding:6px;border-left:1px solid #f1f5f9;text-align:center;vertical-align:middle;">
                                                        <div style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;">
                                                            <div style="display:inline-flex;align-items:center;gap:3px;">
                                                                <span style="color:#ef4444;font-size:12px;line-height:1;font-weight:900;">✖</span>
                                                                <span style="font-size:10px;color:#dc2626;font-weight:700;">\${cell.validHours}h</span>
                                                            </div>
                                                            <span style="font-size:9.5px;font-weight:800;color:#ef4444;background:#fee2e2;border:1px solid #fecaca;padding:1px 5px;border-radius:4px;margin-top:2px;">
                                                                \${cell.reason || '결측'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                \`;
                                            }
                                        }).join('')}
                                    </tr>
                                \`).join('')}
                            </tbody>
                            <tfoot style="position:sticky;bottom:0;background:#f1f5f9;font-weight:900;z-index:20;border-top:2px solid #cbd5e1;">
                                <tr>
                                    <td style="padding:10px 14px;position:sticky;left:0;bottom:0;z-index:30;background:#f1f5f9;border-right:1px solid #cbd5e1;color:#0f172a;">
                                        유효일수 합계
                                    </td>
                                    \${displayCols.map(col => {
                                        const renderGroupFooter = (groupItems, labelName) => {
                                            const allValidDays = dates.filter((_, dIdx) => {
                                                return groupItems.length > 0 && groupItems.every(it => st.data[it] && st.data[it][dIdx] && st.data[it][dIdx].isValid);
                                            }).length;
                                            const pct = dates.length > 0 ? Math.round((allValidDays / dates.length) * 100) : 0;
                                            return \`
                                                <td style="padding:10px 8px;border-left:1px solid #e2e8f0;color:#0f172a;">
                                                    <div style="font-size:12px;font-weight:900;color:\${pct >= 80 ? '#16a34a' : (pct >= 50 ? '#d97706' : '#dc2626')};">
                                                        \${allValidDays} / \${dates.length}일
                                                    </div>
                                                    <div style="font-size:9.5px;color:#64748b;margin-top:2px;">
                                                        (\${labelName}완전정상 \${pct}%)
                                                    </div>
                                                </td>
                                            \`;
                                        };

                                        if (col === '일반항목') return renderGroupFooter(groups.generalItems, '일반');
                                        if (col === '생물감시') return renderGroupFooter(groups.bioItems, '생물');
                                        if (col === 'VOCs [FID]') return renderGroupFooter(groups.fidItems, 'FID');
                                        if (col === 'VOCs [ECD]') return renderGroupFooter(groups.ecdItems, 'ECD');

                                        const validDaysCount = (st.data[col] || []).filter(c => c.isValid).length;
                                        const pct = dates.length > 0 ? Math.round((validDaysCount / dates.length) * 100) : 0;
                                        return \`
                                            <td style="padding:10px 8px;border-left:1px solid #e2e8f0;color:#0f172a;">
                                                <div style="font-size:12.5px;font-weight:900;color:\${pct >= 80 ? '#16a34a' : (pct >= 50 ? '#d97706' : '#dc2626')};">
                                                    \${validDaysCount} / \${dates.length}일
                                                </div>
                                                <div style="font-size:10px;color:#64748b;margin-top:2px;">
                                                    (\${pct}%)
                                                </div>
                                            </td>
                                        \`;
                                    }).join('')}
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                \`}
            \`;

            document.getElementById('wms-btn-back').onclick = renderMainView;

            // 상단 토글 핸들러들
            const allToggleBtn = document.getElementById('wms-btn-toggle-all');
            if (allToggleBtn) {
                allToggleBtn.onclick = () => {
                    const nextVal = !allFolded;
                    mergeMode.general = nextVal;
                    mergeMode.bio = nextVal;
                    mergeMode.voc = nextVal;
                    redraw();
                };
            }
            const genToggleBtn = document.getElementById('wms-btn-toggle-gen');
            if (genToggleBtn) {
                genToggleBtn.onclick = () => { mergeMode.general = !mergeMode.general; redraw(); };
            }
            const bioToggleBtn = document.getElementById('wms-btn-toggle-bio');
            if (bioToggleBtn) {
                bioToggleBtn.onclick = () => { mergeMode.bio = !mergeMode.bio; redraw(); };
            }
            const vocToggleBtn = document.getElementById('wms-btn-toggle-voc');
            if (vocToggleBtn) {
                vocToggleBtn.onclick = () => { mergeMode.voc = !mergeMode.voc; redraw(); };
            }

            const prevBtn = document.getElementById('wms-btn-prev-st');
            if (prevBtn && curIdx > 0) {
                prevBtn.onclick = () => { curIdx--; redraw(); };
            }

            const nextBtn = document.getElementById('wms-btn-next-st');
            if (nextBtn && curIdx < results.length - 1) {
                nextBtn.onclick = () => { curIdx++; redraw(); };
            }

            // 현재 측정소 엑셀 TSV 복사 (현재 화면에 표출된 열 그대로 복사)
            const copyCurBtn = document.getElementById('wms-btn-copy-cur');
            if (copyCurBtn) {
                copyCurBtn.onclick = () => {
                    let tsv = '일자\\t' + displayCols.join('\\t') + '\\n';
                    dates.forEach((d, dIdx) => {
                        const rowVals = displayCols.map(col => {
                            const getGroupCopyVal = (groupItems, labelName) => {
                                const validCount = groupItems.filter(it => st.data[it] && st.data[it][dIdx] && st.data[it][dIdx].isValid).length;
                                const total = groupItems.length;
                                return validCount === total ? \`정상(\${labelName} \${validCount}/\${total})\` : \`일부비정상(\${labelName} \${validCount}/\${total})\`;
                            };
                            if (col === '일반항목') return getGroupCopyVal(groups.generalItems, '일반');
                            if (col === '생물감시') return getGroupCopyVal(groups.bioItems, '생물');
                            if (col === 'VOCs [FID]') return getGroupCopyVal(groups.fidItems, 'FID');
                            if (col === 'VOCs [ECD]') return getGroupCopyVal(groups.ecdItems, 'ECD');

                            const cell = st.data[col] ? st.data[col][dIdx] : null;
                            return (cell && cell.isValid) ? \`정상(\${cell.validHours}h)\` : \`\${cell?.reason || '결측'}(\${cell?.validHours || 0}h)\`;
                        });
                        tsv += d + '\\t' + rowVals.join('\\t') + '\\n';
                    });

                    copyToClipboard(tsv, null, () => {
                        const origHtml = copyCurBtn.innerHTML;
                        copyCurBtn.innerHTML = '<span>✅ 엑셀 복사 완료!</span>';
                        copyCurBtn.style.background = '#047857';
                        setTimeout(() => {
                            copyCurBtn.innerHTML = origHtml;
                            copyCurBtn.style.background = '#059669';
                        }, 2000);
                    });
                };
            }

            // 전체 측정소 요약 복사
            const copyAllBtn = document.getElementById('wms-btn-copy-all');
            if (copyAllBtn) {
                copyAllBtn.onclick = () => {
                    let tsv = '구분\\t측정소명\\t조회일수\\t항목별 유효일수\\n';
                    results.forEach(r => {
                        const itmList = Object.keys(r.data || {});
                        const summaryStr = r.success ? itmList.map(k => {
                            const vCnt = (r.data[k] || []).filter(c => c.isValid).length;
                            return \`\${k}:\${vCnt}일\`;
                        }).join(', ') : (r.error || '조회 실패');

                        tsv += \`\${r.category}\\t\${r.station}\\t\${(r.dates || []).length}\\t\${summaryStr}\\n\`;
                    });

                    copyToClipboard(tsv, null, () => {
                        const origHtml = copyAllBtn.innerHTML;
                        copyAllBtn.innerHTML = '<span>✅ 요약 복사 완료!</span>';
                        setTimeout(() => {
                            copyAllBtn.innerHTML = origHtml;
                        }, 2000);
                    });
                };
            }
        }

        window.__wmsSetStIdx = idx => {
            curIdx = idx;
            redraw();
        };

        redraw();
    }
`;
