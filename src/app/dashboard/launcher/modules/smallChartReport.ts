/**
 * src/app/analysis/launchers/modules/smallChartReport.ts
 * 모드 3-3: 소규모 20개소 수질·강수량 1시간 시계열 차트 대시보드 및 통합차트 보고서 엑셀 다운로드
 *
 * - 10064(유효데이터): 20개소 1시간 수질·강수량 데이터 수집
 * - Chart.js V4 기반 인페이지 멀티스케일 시계열 차트 대시보드 제공
 * - 시트 1에 20개소 차트 이미지가 자동 삽입된 소규모20개소_월간보고서_YYYY-MM_차트통합.xlsx 다운로드
 */

export const UNIFIED_SMALL_CHART_REPORT_JS = `
    // ==========================================
    // 9. 소규모 3번 통합차트 엑셀 및 대시보드 엔진
    // ==========================================
    const CHART_ITEM_COLORS = {
        '수소이온농도': '#2563eb', // 로열 블루 (pH 천장 지붕선)
        '용존산소': '#dc2626',     // 선명한 브라이트 레드 (수온 골드와 100% 명쾌한 분리)
        '수온': '#eab308',         // 맑고 따뜻한 골드 옐로우 (일교차 사인파)
        '탁도': '#06b6d4',         // 청량한 터콰이즈/민트 시안 (블루 중복 탈피)
        '총유기탄소': '#16a34a',   // 에메랄드 그린 (유기물 녹색)
        '질산성질소': '#8b5cf6',   // 바이올렛 퍼플 (시안·그린과 완벽 3원색 분리)
        '암모니아성질소': '#db2777',// 마젠타 핑크
        '전기전도도': '#64748b',   // 슬레이트 차콜 그레이 (배경 지지선)
        '강수량': '#1d4ed8',       // 딥 네이비
        '유류': '#e11d48'
    };

    const CHART_ITEM_UNITS = {
        '수소이온농도': '-', '용존산소': 'mg/L', '수온': '℃', '총유기탄소': 'mg/L',
        '암모니아성질소': 'mg/L', '질산성질소': 'mg/L', '전기전도도': 'μs/cm', '탁도': 'NTU',
        '강수량': 'mm', '유류': ''
    };

    const normalizeChartItem = (name) => {
        if (!name) return null;
        const n = String(name).toLowerCase().replace(/\\s/g, '');
        if (n.includes('수소이온') || n.includes('ph')) return '수소이온농도';
        if (n.includes('용존산소') || n.includes('do')) return '용존산소';
        if (n.includes('수온') || n.includes('temp')) return '수온';
        if (n.includes('전기전도') || n.includes('ec')) return '전기전도도';
        if (n.includes('탁도') || n.includes('tur')) return '탁도';
        if (n.includes('총유기') || n.includes('toc')) return '총유기탄소';
        if (n.includes('질산성') || n.includes('no3')) return '질산성질소';
        if (n.includes('암모니아') || n.includes('nh4') || n.includes('nh3')) return '암모니아성질소';
        if (n.includes('강수량') || n.includes('강우량') || n.includes('rain')) return '강수량';
        if (n.includes('유류') || n.includes('oil')) return '유류';
        return null;
    };

    let chartStationsData = [];

    // ──────────────────────────────────────
    // ⭐️ 핵심 파서: RealGrid GridView 컬럼과 Row 데이터를 동적 매핑
    // ──────────────────────────────────────
    const parseWmsGridRows = (rows, gv, isRainfall) => {
        if (!rows || rows.length === 0) return [];

        const colHeaderMap = {};
        let detectedDateField = null;

        if (gv && typeof gv.getColumns === 'function') {
            try {
                const cols = gv.getColumns();
                const traverse = (colList, parentText = '') => {
                    (colList || []).forEach(c => {
                        let headerText = '';
                        if (typeof c.header === 'string') headerText = c.header;
                        else if (c.header && typeof c.header.text === 'string') headerText = c.header.text;
                        const curText = (headerText || '').trim();
                        const effectiveParent = parentText || (curText && !curText.includes('측정값') && !curText.includes('상태') ? curText : '');
                        
                        const fn = c.fieldName || c.name;
                        if (curText.includes('일시') || curText.includes('시간') || curText.includes('DATE') || curText.includes('DT') || curText === 'DAY' || fn === 'DAY') {
                            if (fn) detectedDateField = fn;
                        }

                        const children = c.columns || c.childColumns || (typeof c.columns === 'function' ? c.columns() : null);
                        if (Array.isArray(children) && children.length > 0) {
                            traverse(children, effectiveParent);
                        } else if (fn) {
                            if (!curText.includes('상태') && !curText.includes('코드') && !fn.includes('STAT') && !fn.includes('CODE')) {
                                colHeaderMap[fn] = effectiveParent || curText;
                            }
                        }
                    });
                };
                traverse(cols);
            } catch(e) {
                console.warn('컬럼 분석 오류:', e);
            }
        }

        const sample = rows[0] || {};
        const sampleKeys = Object.keys(sample);

        if (!detectedDateField || !(detectedDateField in sample)) {
            detectedDateField = sampleKeys.find(k => {
                const uk = k.toUpperCase();
                return uk === 'DAY' || uk === 'MSR_DATE' || uk === 'LOG_DATE' || uk === 'MSR_TIME' || uk.includes('DAY') || uk.includes('DATE') || uk.includes('TIME');
            });
            if (!detectedDateField) {
                for (const [k, v] of Object.entries(sample)) {
                    const s = String(v || '').trim();
                    if (/^\\d{4}[-/.]\\d{1,2}[-/.]\\d{1,2}/.test(s) || /^\\d{8,14}$/.test(s)) {
                        detectedDateField = k;
                        break;
                    }
                }
            }
            if (!detectedDateField && sampleKeys.length > 0) {
                detectedDateField = sampleKeys[0];
            }
        }

        const formatRowDate = (raw) => {
            if (!raw) return '';
            const s = String(raw).trim().replace(/\\u00A0/g, ' ');
            const m1 = s.match(/^(\\d{4})[-/.](\\d{1,2})[-/.](\\d{1,2})\\s+(\\d{1,2}):?(\\d{1,2})?/);
            if (m1) {
                const mm = m1[5] != null ? m1[5].padStart(2, '0') : '00';
                return \`\${m1[1]}-\${m1[2].padStart(2, '0')}-\${m1[3].padStart(2, '0')} \${m1[4].padStart(2, '0')}:\${mm}\`;
            }
            const m2 = s.match(/^(\\d{4})(\\d{2})(\\d{2})(\\d{2})(\\d{2})?/);
            if (m2 && parseInt(m2[2]) >= 1 && parseInt(m2[2]) <= 12 && parseInt(m2[3]) >= 1 && parseInt(m2[3]) <= 31) {
                const mm = m2[5] != null ? m2[5] : '00';
                return \`\${m2[1]}-\${m2[2]}-\${m2[3]} \${m2[4]}:\${mm}\`;
            }
            return s;
        };

        let rainField = null;
        for (const [fn, header] of Object.entries(colHeaderMap)) {
            const h = String(header || '').toLowerCase().replace(/\\s/g, '');
            if (normalizeChartItem(header) === '강수량' || h.includes('강수') || h.includes('강우') || h.includes('rain') || h === 'rn' || h === 'rf') {
                rainField = fn;
                break;
            }
        }
        if (!rainField) {
            rainField = sampleKeys.find(k => {
                if (k === detectedDateField) return false;
                const lk = k.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
                return lk.includes('rain') || lk.includes('강수') || lk.includes('강우') || lk === 'rn' || lk === 'rf' || lk.endsWith('rn') || lk.endsWith('rf');
            });
        }

        if (isRainfall) {
            return rows.map(r => {
                const rawD = r[detectedDateField];
                const d = formatRowDate(rawD);
                let val = 0;
                if (rainField && r[rainField] != null) {
                    const parsed = parseFloat(r[rainField]);
                    if (!isNaN(parsed)) val = parsed;
                }
                return { date: d, rainfall: val };
            }).filter(item => item.date);
        } else {
            const itemFieldMap = {};
            for (const [fn, header] of Object.entries(colHeaderMap)) {
                const norm = normalizeChartItem(header);
                if (norm && norm !== '강수량') {
                    itemFieldMap[norm] = fn;
                }
            }

            if (Object.keys(itemFieldMap).length === 0) {
                sampleKeys.forEach(k => {
                    if (k === detectedDateField || k.includes('STAT') || k.includes('CODE')) return;
                    const norm = normalizeChartItem(k);
                    if (norm && norm !== '강수량') {
                        itemFieldMap[norm] = k;
                    }
                });
            }

            return rows.map(r => {
                const rawD = r[detectedDateField];
                const d = formatRowDate(rawD);
                const obj = { date: d };

                if (Object.keys(itemFieldMap).length > 0) {
                    Object.entries(itemFieldMap).forEach(([norm, fn]) => {
                        if (r[fn] != null) {
                            const val = parseFloat(r[fn]);
                            obj[norm] = isNaN(val) ? null : val;
                        }
                    });
                } else {
                    sampleKeys.forEach((k, idx) => {
                        if (k === detectedDateField || k.includes('STAT') || k.includes('CODE')) return;
                        const val = parseFloat(r[k]);
                        if (!isNaN(val)) {
                            obj['항목_' + (idx + 1)] = val;
                        }
                    });
                }

                if (rainField && r[rainField] != null) {
                    const parsed = parseFloat(r[rainField]);
                    if (!isNaN(parsed)) obj['강수량'] = parsed;
                }

                return obj;
            }).filter(item => item.date);
        }
    };

    // ──────────────────────────────────────
    // 유효데이터(10064)에서 수질·강수량 1시간 시계열 데이터 수집
    // ──────────────────────────────────────
    async function collectStationHourData(ctx, station, sDate, eDate) {
        const targetWin = ctx.win || window;
        const targetDoc = ctx.doc || document;
        const target$ = ctx.$ || window.$ || window.jQuery;
        if (!target$) return { rows: [], gv: null };

        // 1. 망구분 소규모 ('3') 설정
        if (target$('#pMsrstnSeCd').length && target$('#pMsrstnSeCd').val() !== '3') {
            target$('#pMsrstnSeCd').val('3').trigger('change');
            await waitForConditionInWin(() => target$('#pRiverId option').length > 0, 4000, 200);
            await delay(300);
            target$('#pRiverId option').each(function() {
                if (target$(this).val()) {
                    target$('#pRiverId').val(target$(this).val()).trigger('change');
                    return false;
                }
            });
            await waitForConditionInWin(() => target$('#pSiteId option').length > 1, 4000, 200);
            await delay(300);
        } else {
            await waitForConditionInWin(() => target$('#pSiteId option').length > 1, 3000, 200);
        }

        // 2. 측정소 선택
        let matched = false;
        target$('#pSiteId option').each(function() {
            if (target$(this).val() === station.value) {
                target$('#pSiteId').val(station.value).trigger('change');
                matched = true;
                return false;
            }
        });
        if (!matched) {
            target$('#pSiteId option').each(function() {
                const txt = target$(this).text().replace(/\\(소규모\\)|\\(국가망\\)|\\s/g, '').trim();
                const targetName = station.name.replace(/\\(소규모\\)|\\(국가망\\)|\\s/g, '').trim();
                if (txt === targetName) {
                    target$('#pSiteId').val(target$(this).val()).trigger('change');
                    matched = true;
                    return false;
                }
            });
        }
        if (!matched) {
            console.warn(\`[10064] [\${station.name}] 측정소 선택 실패\`);
            return { rows: [], gv: null };
        }

        // 3. 주기 및 체크박스 대기
        await waitForConditionInWin(() => targetDoc.querySelectorAll('input[type="checkbox"]').length > 2, 3000, 200);
        await delay(300);

        // 4. 주기 설정: 1시간(hour)
        let intValSet = false;
        target$('#pIntVal option').each(function() {
            const v = target$(this).val();
            const t = target$(this).text().trim();
            if (v === 'hour' || v === 'oneHour' || t.includes('1시간') || t.includes('시간')) {
                target$('#pIntVal').val(v).trigger('change');
                intValSet = true;
                return false;
            }
        });
        if (!intValSet && target$('#pIntVal').length) {
            target$('#pIntVal').val('hour').trigger('change');
        }
        await delay(200);

        // 5. 날짜 설정
        if (target$('#pDay').length) target$('#pDay').val(sDate);
        if (target$('#pDay2').length) target$('#pDay2').val(eDate);
        if (target$('#pStartDate').length) target$('#pStartDate').val(sDate);
        if (target$('#pEndDate').length) target$('#pEndDate').val(eDate);

        // 6. 항목 선택
        if (target$('#pDeviceGubun').length) {
            let gubunChanged = false;
            target$('#pDeviceGubun option').each(function() {
                const txt = target$(this).text().trim();
                const val = target$(this).val();
                if (txt.includes('포함') || txt.includes('전체') || val === 'ALL' || val === '1' || val === '') {
                    target$('#pDeviceGubun').val(val).trigger('change');
                    gubunChanged = true;
                    return false;
                }
            });
            if (!gubunChanged) {
                target$('#pDeviceGubun option').each(function() {
                    const txt = target$(this).text().trim();
                    if (!txt.includes('제외')) {
                        target$('#pDeviceGubun').val(target$(this).val()).trigger('change');
                        gubunChanged = true;
                        return false;
                    }
                });
            }
            await delay(400);
            await waitForConditionInWin(() => targetDoc.querySelectorAll('input[type="checkbox"]').length > 2, 4000, 200);
        }

        target$('button, a, span, label').each(function() {
            const txt = target$(this).text().trim();
            if (txt === '모두선택' || txt === '전체선택') {
                target$(this).trigger('click');
                return false;
            }
        });
        await delay(250);

        targetDoc.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            if (!cb.checked) {
                cb.checked = true;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        await delay(200);

        // 7. 그리드 비우기 및 검색 실행
        const { dp } = findTimeSeriesGrid(targetWin);
        if (dp && typeof dp.clearRows === 'function') {
            try { dp.clearRows(); } catch(e) {}
        }

        if (typeof targetWin.loadingData === 'function') {
            targetWin.loadingData();
        } else {
            const sBtn = targetDoc.querySelector('#searchBtn, .btn_search');
            if (sBtn) sBtn.click();
        }

        // 8. 데이터 로딩 대기
        await delay(800);
        await waitForConditionInWin(() => {
            try {
                const loading = targetDoc.querySelector('#viewLoading');
                if (loading && loading.style.display !== 'none') return false;
                const grid = findTimeSeriesGrid(targetWin);
                return grid.dp && grid.dp.getRowCount() >= 0;
            } catch(e) { return false; }
        }, 25000, 400);
        await delay(400);

        // 9. 행 추출
        const { rows, gv } = extractRowsFromRealGrid();
        console.log(\`   📊 [10064] [\${station.name}] RealGrid에서 \${rows.length}건 추출\`);
        return { rows, gv };
    }

    // ──────────────────────────────────────
    // 메인 프로세스: 유효데이터(10064) 단일 패스 수집 및 차트 대시보드 생성
    // ──────────────────────────────────────
    async function runChartGenerationProcess() {
        const targetStations = SMALL_STATIONS.filter(s => selectedSet.has(s.value));
        if (targetStations.length === 0) {
            alert('소규모 측정소(20개소 중)를 최소 1개 이상 선택해주세요.');
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

        if (progBox) progBox.style.display = 'flex';
        if (runBtn) runBtn.style.display = 'none';
        if (cancelBtn) {
            cancelBtn.style.display = 'inline-flex';
            cancelBtn.disabled = false;
            cancelBtn.textContent = '⏹️ 작업 중단';
        }

        try {
            if (progText) progText.textContent = '그래프 엔진(Chart.js & ExcelJS) 로딩 중...';
            await Promise.all([
                loadScriptOnce('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'),
                loadScriptOnce('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js')
            ]);

            chartStationsData = targetStations.map(s => ({
                name: s.name.replace(/\\(소규모\\)|\\(국가망\\)/g, '').trim(),
                stationId: s.value,
                measurementData: [],
                rainfallData: []
            }));

            if (progText) progText.textContent = '유효데이터(10064) 화면 연동 중...';
            const wqCtx = await getWorkerContext('/wms/validData/site?pMENUMST_ID=10064', '10064', '유효데이터(10064)');

            const totalStations = targetStations.length;
            let completed = 0;

            for (let i = 0; i < totalStations; i++) {
                if (cancelRequested) break;
                const st = targetStations[i];
                completed++;
                const pct = Math.round((completed / totalStations) * 100);
                if (progPct) progPct.textContent = pct + '%';
                if (progBar) progBar.style.width = pct + '%';
                if (progText) progText.textContent = \`[유효데이터] \${st.name} (\${i + 1}/\${totalStations}) 수집 중...\`;

                try {
                    const { rows, gv } = await collectStationHourData(wqCtx, st, startDate, endDate);
                    const sEntry = chartStationsData.find(cs => cs.stationId === st.value);
                    if (sEntry && rows.length > 0) {
                        sEntry.measurementData = parseWmsGridRows(rows, gv, false);
                        sEntry.rainfallData = parseWmsGridRows(rows, gv, true);
                    }
                    console.log(\`✅ [10064 완료] \${st.name}: 수질 \${sEntry ? sEntry.measurementData.length : 0}건 | 강수량 \${sEntry ? sEntry.rainfallData.length : 0}건\`);
                } catch(stErr) {
                    console.error(\`⚠️ \${st.name} 10064 수집 오류:\`, stErr);
                }
                await delay(200);
            }

            if (cancelRequested) {
                alert('작업이 중단되었습니다.');
                return;
            }

            if (progPct) progPct.textContent = '95%';
            if (progBar) progBar.style.width = '95%';
            if (progText) progText.textContent = '📊 대시보드 렌더링 및 ZIP 압축 중...';
            await delay(100);

            // 대시보드 페이지 렌더링
            renderChartDashboardView();

            // ZIP 자동 다운로드 실행
            await exportSmallChartZipDirectly(startDate);

            const ym = startDate.slice(0, 7);
            const mm = ym.slice(5, 7);
            if (progPct) progPct.textContent = '100%';
            if (progBar) progBar.style.width = '100%';
            if (progText) progText.textContent = '✅ 완료: 대시보드 표시 및 소규모_그래프(' + mm + '월).zip 다운로드';
        } catch (err) {
            console.error('그래프 생성 프로세스 오류:', err);
            alert('오류: ' + (err.message || err));
        } finally {
            cleanupWorkerWindow();
            isRunning = false;
            if (cancelBtn) cancelBtn.style.display = 'none';
            if (runBtn) { runBtn.style.display = 'inline-flex'; runBtn.disabled = false; runBtn.style.opacity = '1'; }
        }
    }

    const getCanvasWhiteDataUrl = (c) => {
        if (!c) return '';
        const off = document.createElement('canvas');
        off.width = c.width;
        off.height = c.height;
        const offCtx = off.getContext('2d');
        offCtx.fillStyle = '#ffffff';
        offCtx.fillRect(0, 0, off.width, off.height);
        offCtx.drawImage(c, 0, 0);
        return off.toDataURL('image/png');
    };

    // ──────────────────────────────────────
    // ⭐️ 수질 상단 차트 설정 빌더 (강수량 제외, 각 항목별 독립 Y축 적용)
    // ──────────────────────────────────────
    const buildWaterChartConfig = (st) => {
        const dateSet = new Set();
        (st.measurementData || []).forEach(d => dateSet.add(d.date));
        (st.rainfallData || []).forEach(d => dateSet.add(d.date));
        const labels = Array.from(dateSet).sort();
        const mMap = new Map((st.measurementData || []).map(d => [d.date, d]));

        const datasets = [];
        const scales = {
            x: {
                grid: { display: true, color: '#f1f5f9' },
                border: { color: '#cbd5e1' },
                ticks: {
                    color: '#334155',
                    font: { size: 10, weight: 'bold' },
                    maxTicksLimit: 14,
                    autoSkip: true,
                    padding: 4,
                    callback: function(val) {
                        const raw = this.getLabelForValue(val);
                        if (!raw) return '';
                        try {
                            const datePart = raw.split(' ')[0];
                            const parts = datePart.split('-');
                            if (parts.length >= 3) {
                                const m = parseInt(parts[1], 10);
                                const d = parseInt(parts[2], 10);
                                return \`\${m}월 \${d}일\`;
                            }
                        } catch(e) {}
                        return raw;
                    }
                }
            }
        };

        const ITEM_ORDER = ['수소이온농도', '용존산소', '수온', '탁도', '총유기탄소', '질산성질소', '암모니아성질소', '전기전도도'];
        const ITEM_ABBR = {
            '수소이온농도': 'pH',
            '용존산소': 'DO',
            '수온': '수온',
            '탁도': '탁도',
            '총유기탄소': 'TOC',
            '질산성질소': 'NO3-N',
            '암모니아성질소': 'NH3-N',
            '전기전도도': 'EC'
        };

        // 유효한 항목 목록 추출 (실제 데이터가 존재하는 항목만)
        const validItems = ITEM_ORDER.filter(item => labels.some(l => mMap.get(l) && mMap.get(l)[item] != null));
        const numItems = validItems.length;

        // 항목별 원본 min / max 계산
        const itemStats = {};
        validItems.forEach(item => {
            let minVal = Infinity, maxVal = -Infinity;
            labels.forEach(l => {
                const row = mMap.get(l);
                const v = row ? row[item] : null;
                if (v != null && !isNaN(v)) {
                    if (v < minVal) minVal = v;
                    if (v > maxVal) maxVal = v;
                }
            });
            if (minVal === Infinity) { minVal = 0; maxVal = 1; }
            if (minVal === maxVal) { minVal = Math.max(0, minVal - 1); maxVal = maxVal + 1; }
            itemStats[item] = { min: minVal, max: maxVal, diff: (maxVal - minVal) || 1 };
        });

        // 상단영역 스택 배치 순서 (안 1: 아래부터 1층 DO -> 2층 수온 -> 3층 pH)
        // 수온과 DO의 역위상 호흡으로 서로 벌어져 교차 간섭이 제거되고, pH가 최상단 지붕 역할
        const UPPER_GROUP_ITEMS = ['용존산소', '수온', '수소이온농도'];

        validItems.forEach(item => {
            const color = CHART_ITEM_COLORS[item] || '#3b82f6';
            const stats = itemStats[item];

            let bandBottom = 0;
            let bandTop = 100;

            if (item === '전기전도도') {
                // ── 전기전도도: 5 ~ 95 대역 할당 ──
                bandBottom = 5;
                bandTop = 95;
            } else if (UPPER_GROUP_ITEMS.includes(item)) {
                // ── 상단 32 ~ 100 영역 (1층 DO: 32~70, 2층 수온: 44~82, 3층 pH: 56~94) ──
                const upperIdx = UPPER_GROUP_ITEMS.indexOf(item); // 0: DO, 1: 수온, 2: pH
                bandBottom = 32 + (upperIdx * 12); // DO: 32, 수온: 44, pH: 56
                bandTop = Math.min(100, bandBottom + 38); // DO: 70, 수온: 82, pH: 94
            } else {
                // ── 하단 영역 전부 0 ~ 48 대역으로 확장하여 중간 공백 메움 ──
                bandBottom = 0;
                bandTop = 48;
            }

            const bandHeight = bandTop - bandBottom;

            // 베이스 기준값 및 상한값 계산:
            // 1. 상단 항목들(수온, DO, pH): 자체 min~max를 100% 다 쓰지 않고 위아래 18%씩 여유 마진(Buffer)을 두어
            //    진폭이 100%로 팽창되는 왜곡(늘어짐)을 방지하고 잔잔하고 사실적인 진폭 유지
            // 2. 하단 항목들(탁도, TOC, 질산성질소 등): 0 베이스에서 scaleMax = stats.max * 1.55로
            //    중간 대역(25~32)까지 자연스럽게 올라와 차트 중심을 알차게 채우고 피크 공간 보존
            const isZeroBaseItem = !UPPER_GROUP_ITEMS.includes(item);
            let scaleMin, scaleMax;

            if (isZeroBaseItem) {
                scaleMin = 0;
                scaleMax = (stats.max > 0 ? stats.max : 1) * (item === '전기전도도' ? 1.05 : 1.55);
            } else {
                // 상단 항목 완충 마진: min과 max 양쪽으로 diff의 20% 여유 버퍼를 주어 진폭 팽창 왜곡 방지
                const rawDiff = (stats.max - stats.min) || 1;
                const buffer = rawDiff * 0.20;
                scaleMin = stats.min - buffer;
                scaleMax = stats.max + buffer;
            }
            const scaleRange = (scaleMax - scaleMin) || 1;

            // 해당 대역폭으로 정규화 매핑
            const mappedData = labels.map(l => {
                const row = mMap.get(l);
                const rawVal = row ? row[item] : null;
                if (rawVal == null || isNaN(rawVal)) return null;
                const ratio = Math.max(0, Math.min(1, (rawVal - scaleMin) / scaleRange));
                return bandBottom + (ratio * bandHeight);
            });

            // 툴팁용 원본 데이터
            const rawData = labels.map(l => {
                const row = mMap.get(l);
                const v = row ? row[item] : null;
                return (v != null && !isNaN(v)) ? v : null;
            });

            // 범례 라벨에 실제 [최소 ~ 최대 단위] 표시
            const unit = CHART_ITEM_UNITS[item] && CHART_ITEM_UNITS[item] !== '-' ? ' ' + CHART_ITEM_UNITS[item] : '';
            const minStr = Math.round(stats.min * 10) / 10;
            const maxStr = Math.round(stats.max * 10) / 10;
            const legendLabel = \`\${item}(\${ITEM_ABBR[item] || item}) [\${minStr}~\${maxStr}\${unit}]\`;

            datasets.push({
                type: 'line',
                itemKey: item,
                label: legendLabel,
                data: mappedData,
                rawValues: rawData, // 툴팁에 실제 원본 측정값 표시용
                borderColor: color,
                backgroundColor: color,
                borderWidth: 2.0,
                tension: 0,
                spanGaps: false,
                pointRadius: 0,
                pointHoverRadius: 4,
                yAxisID: 'y'
            });
        });

        if (datasets.length === 0) {
            datasets.push({ type: 'line', label: '데이터 없음', data: [0], borderColor: '#cbd5e1' });
        }

        scales.y = {
            type: 'linear',
            min: 0,
            max: 100,
            display: false,
            grid: { display: false }
        };

        const cleanStationName = (st.name || '').replace(/\\(소규모\\)|\\(국가망\\)|\\s/g, '').trim();

        // ⭐️ 플러그인: 배경 채우기 + 각 그래프 첫 점 Y좌표 왼쪽에 2행 범례([위: 항목명], [아래: 수치범위]) 렌더링
        const customLeftYAxisPlugin = {
            id: 'customLeftYAxis',
            beforeDraw: (chart) => {
                const { ctx, width, height, chartArea } = chart;
                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);

                if (!chartArea) { ctx.restore(); return; }

                const leftBoundary = chartArea.left;
                const plotTop = chartArea.top;
                const plotBottom = chartArea.bottom;
                const plotHeight = plotBottom - plotTop;

                // 1. 각 항목별 첫 번째 데이터 점의 Y좌표(0~100 스케일) 추출 및 플롯 픽셀 Y좌표 환산
                const itemPositions = [];
                validItems.forEach((item) => {
                    const stats = itemStats[item];
                    if (!stats) return;

                    const ds = datasets.find(d => d.itemKey === item);
                    let firstVal = null;
                    if (ds && ds.data) {
                        for (let k = 0; k < ds.data.length; k++) {
                            if (ds.data[k] != null && !isNaN(ds.data[k])) {
                                firstVal = ds.data[k];
                                break;
                            }
                        }
                    }

                    // 0~100 스케일을 캔버스 Y 픽셀로 변환 (0: bottom, 100: top)
                    // 데이터 시작점에 값이 없거나 결측인 경우, 해당 항목의 기본 바닥 대역(하단 항목: 5%, 상단 항목: 50%)을 기준으로 배치
                    const defaultNormY = UPPER_GROUP_ITEMS.includes(item) ? (50 + UPPER_GROUP_ITEMS.indexOf(item) * 15) : 5;
                    const normY = (firstVal != null && !isNaN(firstVal)) ? firstVal : defaultNormY;
                    const rawPixelY = plotBottom - (normY / 100) * plotHeight;

                    itemPositions.push({
                        item,
                        stats,
                        rawPixelY,
                        targetY: Math.max(plotTop + 14, Math.min(plotBottom - 14, rawPixelY)),
                        color: CHART_ITEM_COLORS[item] || '#334155',
                        abbr: ITEM_ABBR[item] || item,
                        unit: CHART_ITEM_UNITS[item] && CHART_ITEM_UNITS[item] !== '-' ? ' ' + CHART_ITEM_UNITS[item] : ''
                    });
                });

                // 2. 글자 겹침 100% 방지: 2행 텍스트 높이(약 28px)를 충분히 수용하는 최소 간격(34px) 확보
                itemPositions.sort((a, b) => a.targetY - b.targetY);
                const minGap = 34;

                for (let i = 1; i < itemPositions.length; i++) {
                    if (itemPositions[i].targetY < itemPositions[i - 1].targetY + minGap) {
                        itemPositions[i].targetY = itemPositions[i - 1].targetY + minGap;
                    }
                }
                if (itemPositions.length > 0 && itemPositions[itemPositions.length - 1].targetY > plotBottom - 16) {
                    itemPositions[itemPositions.length - 1].targetY = plotBottom - 16;
                    for (let i = itemPositions.length - 2; i >= 0; i--) {
                        if (itemPositions[i].targetY > itemPositions[i + 1].targetY - minGap) {
                            itemPositions[i].targetY = itemPositions[i + 1].targetY - minGap;
                        }
                    }
                }

                // 3. 2행 포맷 렌더링 - 중앙 정렬(Center Align) 적용
                // 좌측 110px 여백 영역의 중심축(centerX = leftBoundary - 55) 기준으로 완벽 대칭 정렬
                const centerX = leftBoundary - 55;

                itemPositions.forEach(pos => {
                    const { item, stats, targetY, color, abbr, unit } = pos;
                    const minStr = Math.round(stats.min * 10) / 10;
                    const maxStr = Math.round(stats.max * 10) / 10;

                    ctx.save();

                    // 1행: 색상원 + 항목명 (위)
                    const line1Y = targetY - 8;
                    ctx.font = 'bold 11.5px sans-serif';
                    const textMetrics = ctx.measureText(abbr);
                    const totalHalfWidth = (textMetrics.width + 12) / 2; // 원(8px) + 간격(4px) + 텍스트폭

                    // 색상 원(블릿)
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(centerX - totalHalfWidth + 4, line1Y, 4, 0, Math.PI * 2);
                    ctx.fill();

                    // 항목명 텍스트
                    ctx.fillStyle = '#0f172a';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(abbr, centerX - totalHalfWidth + 12, line1Y);

                    // 2행: 수치범위 최소 ~ 최대 단위 (아래) - 중앙 정렬 & 깔끔한 산세리프 폰트
                    const line2Y = targetY + 8;
                    ctx.font = 'bold 10px sans-serif';
                    ctx.fillStyle = color;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(\`\${minStr} ~ \${maxStr}\${unit}\`, centerX, line2Y);

                    ctx.restore();
                });

                // 플롯 좌측 세로 경계선
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(leftBoundary, chartArea.top);
                ctx.lineTo(leftBoundary, chartArea.bottom);
                ctx.stroke();

                ctx.restore();
            }
        };

        return {
            data: { labels: labels.length > 0 ? labels : ['없음'], datasets },
            plugins: [customLeftYAxisPlugin],
            options: {
                animation: false,
                responsive: false,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                layout: {
                    // 좌측 여백을 110px로 슬림화하여 차트 플롯 영역과 범례 사이 간격 밀착
                    padding: { left: 110, right: 35, top: 12, bottom: 20 }
                },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: \`\${cleanStationName} 소규모감시망\`,
                        font: { size: 17, weight: 'bold' },
                        color: '#0f172a',
                        padding: { top: 8, bottom: 12 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const ds = context.dataset;
                                const idx = context.dataIndex;
                                const original = (ds.rawValues && ds.rawValues[idx] != null) ? ds.rawValues[idx] : null;
                                if (original != null) {
                                    return \`\${ds.label}: \${original}\`;
                                }
                                return null;
                            }
                        }
                    }
                },
                scales
            }
        };
    };

    // ──────────────────────────────────────
    // ⭐️ 하단 강수량 차트 설정 빌더 (수질 차트와 가로폭/좌측 여백 1:1 완벽 정렬)
    // ──────────────────────────────────────
    const buildRainfallChartConfig = (st) => {
        const dateSet = new Set();
        (st.measurementData || []).forEach(d => dateSet.add(d.date));
        (st.rainfallData || []).forEach(d => dateSet.add(d.date));
        const labels = Array.from(dateSet).sort();
        const mMap = new Map((st.measurementData || []).map(d => [d.date, d]));
        const rMap = new Map((st.rainfallData || []).map(d => [d.date, d]));

        const rainData = labels.map(l => {
            const rEntry = rMap.get(l);
            if (rEntry && rEntry.rainfall != null) return rEntry.rainfall;
            const mEntry = mMap.get(l);
            if (mEntry && mEntry['강수량'] != null) return mEntry['강수량'];
            return 0;
        });

        let maxRain = 0;
        rainData.forEach(v => { if (v > maxRain) maxRain = v; });
        const rainMaxScale = maxRain > 0 ? Math.max(10, Math.ceil(maxRain * 1.25)) : 10;

        const rainfallLeftAxisPlugin = {
            id: 'rainfallLeftAxis',
            beforeDraw: (chart) => {
                const { ctx, width, height, chartArea } = chart;
                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);

                if (!chartArea) { ctx.restore(); return; }
                const leftBoundary = chartArea.left;
                const midY = (chartArea.top + chartArea.bottom) / 2;

                ctx.save();
                const centerX = leftBoundary - 55;

                // 1행: 색상원 + 강수량 (위)
                const line1Y = midY - 8;
                ctx.font = 'bold 11.5px sans-serif';
                const textMetrics = ctx.measureText('강수량');
                const totalHalfWidth = (textMetrics.width + 12) / 2;

                ctx.fillStyle = '#1d4ed8';
                ctx.beginPath();
                ctx.arc(centerX - totalHalfWidth + 4, line1Y, 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#0f172a';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText('강수량', centerX - totalHalfWidth + 12, line1Y);

                // 2행: 수치범위 0 ~ max mm (아래) - 중앙 정렬
                const line2Y = midY + 8;
                ctx.font = 'bold 10px sans-serif';
                ctx.fillStyle = '#1d4ed8';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(\`0 ~ \${rainMaxScale} mm\`, centerX, line2Y);

                // 좌측 세로선
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(leftBoundary, chartArea.top);
                ctx.lineTo(leftBoundary, chartArea.bottom);
                ctx.stroke();

                ctx.restore();
            }
        };

        return {
            data: {
                labels: labels.length > 0 ? labels : ['없음'],
                datasets: [{
                    type: 'bar',
                    label: '강수량 (mm)',
                    data: rainData,
                    backgroundColor: 'rgba(37, 99, 235, 0.45)',
                    borderColor: '#2563eb',
                    borderWidth: 1,
                    barPercentage: 0.9,
                    categoryPercentage: 0.95
                }]
            },
            plugins: [rainfallLeftAxisPlugin],
            options: {
                animation: false,
                responsive: false,
                maintainAspectRatio: false,
                layout: {
                    // 수질 그래프와 동일하게 좌측 110px, 우측 35px 설정하여 1:1 정렬
                    padding: { left: 110, right: 35, top: 4, bottom: 6 }
                },
                plugins: {
                    legend: { display: false },
                    title: { display: false }
                },
                scales: {
                    x: {
                        grid: { display: true, color: '#f8fafc' },
                        border: { color: '#cbd5e1' },
                        ticks: {
                            display: false
                        }
                    },
                    y: {
                        type: 'linear',
                        min: 0,
                        max: rainMaxScale,
                        display: false,
                        grid: { display: false },
                        border: { display: false }
                    }
                }
            }
        };
    };

    // ──────────────────────────────────────
    // ⭐️ 1400x700 고해상도 캔버스에 수질(상단 590px) + 강수량(하단 110px) 상하 결합 (잘림 0% 보장)
    // ──────────────────────────────────────
    const renderStationChartToImage = (st) => {
        if (!st) return '';

        const totalWidth = 1400;
        const totalHeight = 700;
        const waterHeight = 590;
        const rainHeight = 110;

        // ⭐️ 오프스크린 렌더링 시 브라우저 뷰포트 크기나 devicePixelRatio로 인해 우측이 잘리는 현상을 100% 방지하기 위해
        // 1400px 고정 크기 컨테이너와 canvas 속성(width, height, style.width, style.height, dpr=1)을 강제 일치시킴
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1400px;height:700px;opacity:0;pointer-events:none;z-index:-1;overflow:hidden;';
        document.body.appendChild(tempContainer);

        // 최종 합본 캔버스
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = totalWidth;
        finalCanvas.height = totalHeight;
        const finalCtx = finalCanvas.getContext('2d');
        finalCtx.fillStyle = '#ffffff';
        finalCtx.fillRect(0, 0, totalWidth, totalHeight);

        // 1. 상단 수질 차트 렌더링 (1400 x 590)
        const waterCanvas = document.createElement('canvas');
        waterCanvas.width = totalWidth;
        waterCanvas.height = waterHeight;
        waterCanvas.style.width = totalWidth + 'px';
        waterCanvas.style.height = waterHeight + 'px';
        tempContainer.appendChild(waterCanvas);

        const waterCtx = waterCanvas.getContext('2d');
        const waterCfg = buildWaterChartConfig(st);
        waterCfg.options.animation = false;
        waterCfg.options.responsive = false;
        waterCfg.options.maintainAspectRatio = false;
        waterCfg.options.devicePixelRatio = 1;
        const waterChart = new Chart(waterCtx, waterCfg);
        waterChart.resize(totalWidth, waterHeight);
        waterChart.update('none');

        // 2. 하단 강수량 차트 렌더링 (1400 x 110)
        const rainCanvas = document.createElement('canvas');
        rainCanvas.width = totalWidth;
        rainCanvas.height = rainHeight;
        rainCanvas.style.width = totalWidth + 'px';
        rainCanvas.style.height = rainHeight + 'px';
        tempContainer.appendChild(rainCanvas);

        const rainCtx = rainCanvas.getContext('2d');
        const rainCfg = buildRainfallChartConfig(st);
        rainCfg.options.animation = false;
        rainCfg.options.responsive = false;
        rainCfg.options.maintainAspectRatio = false;
        rainCfg.options.devicePixelRatio = 1;
        const rainChart = new Chart(rainCtx, rainCfg);
        rainChart.resize(totalWidth, rainHeight);
        rainChart.update('none');

        // 3. 최종 캔버스에 상하 배치 복사 (수질 590px + 강수량 110px)
        finalCtx.drawImage(waterCanvas, 0, 0, totalWidth, waterHeight);
        finalCtx.drawImage(rainCanvas, 0, waterHeight, totalWidth, rainHeight);

        // 차트 인스턴스 정리 및 임시 DOM 제거
        waterChart.destroy();
        rainChart.destroy();
        if (tempContainer.parentNode) {
            tempContainer.parentNode.removeChild(tempContainer);
        }

        return finalCanvas.toDataURL('image/png');
    };

    // ──────────────────────────────────────
    // ⭐️ 자동 ZIP 생성 및 다운로드 함수
    // ──────────────────────────────────────
    async function exportSmallChartZipDirectly(startDate) {
        await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        if (typeof window.JSZip === 'undefined') {
            alert('JSZip 라이브러리를 로드하지 못했습니다.');
            return;
        }

        const zip = new window.JSZip();
        const ym = startDate.slice(0, 7);
        const folderName = "소규모20개소_월간보고서_" + ym + "_통합차트_ZIP";
        const folder = zip.folder(folderName);

        const ORDERED_NAMES = [
            '대가리천', '장평천', '동진천', '구안천', '요도천',
            '원곡천', '영덕천', '앙성천', '전천', '원주천',
            '양화천', '신둔천', '죽당천', '금사천', '곤지암천',
            '조종천', '왕숙천', '신천', '송전천', '황구지천'
        ];

        const cleanName = n => (n || '').replace(/\\(소규모\\)|\\(국가망\\)|\\s/g, '').trim();

        let count = 0;
        for (let i = 0; i < ORDERED_NAMES.length; i++) {
            const stName = ORDERED_NAMES[i];
            const num = String(i + 1).padStart(2, '0');

            const stDataIdx = chartStationsData.findIndex(s => {
                const cn = cleanName(s.name);
                return cn === stName;
            });

            let sObj = null;
            if (stDataIdx >= 0) {
                sObj = chartStationsData[stDataIdx];
            }

            if (sObj) {
                const dataUrl = renderStationChartToImage(sObj);
                if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
                    const rawBase64 = dataUrl.split(',')[1];
                    folder.file(num + "_" + stName + "_통합차트.png", rawBase64, { base64: true });
                    count++;
                }
            }
        }

        if (count === 0) {
            alert('⚠️ ZIP으로 저장할 유효한 차트 이미지가 없습니다.');
            return;
        }

        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        const mm = ym.slice(5, 7);
        const fileName = "소규모_그래프(" + mm + "월).zip";
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    // ──────────────────────────────────────
    // 대시보드 렌더링 (필요시 개별 열람 가능)
    // ──────────────────────────────────────
    function renderChartDashboardView() {
        let currentStationIdx = 0;
        let chartInstance = null;

        body.innerHTML = \`
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px;border-bottom:1px solid #e2e8f0;padding-bottom:12px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <button id="wms-chart-back-btn" class="wms-btn-action wms-btn-secondary" style="padding:6px 14px;font-size:13px;font-weight:900;">◀ 설정으로 돌아가기</button>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:15px;font-weight:900;color:#0f172a;" id="wms-cur-chart-title">📊 통합그래프</span>
                        <span style="font-size:11px;font-weight:800;background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:10px;">Chart.js V4</span>
                        <span id="wms-cur-data-badge" style="font-size:11px;font-weight:800;padding:2px 8px;border-radius:10px;background:#f1f5f9;color:#475569;"></span>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <button id="wms-chart-btn-report-excel" class="wms-btn-action wms-btn-excel" style="padding:8px 18px;font-size:13px;font-weight:900;background:linear-gradient(135deg, #d97706, #b45309);box-shadow:0 3px 10px rgba(217,119,6,0.3);" title="소규모 20개소 통합차트 이미지를 ZIP 파일로 압축 다운로드">📦 통합차트 이미지 ZIP 다운로드</button>
                </div>
            </div>
            <div style="flex:1;min-height:0;display:flex;gap:14px;overflow:hidden;">
                <div style="width:185px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:10px;overflow-y:auto;display:flex;flex-direction:column;gap:5px;" class="wms-scrollbar" id="wms-chart-station-list">
                    \${chartStationsData.map((s, idx) => {
                        const hasData = (s.measurementData||[]).length > 0 || (s.rainfallData||[]).length > 0;
                        return \`<button class="wms-btn-action \${idx===0?'wms-btn-primary':'wms-btn-secondary'}" data-st-idx="\${idx}" style="padding:7px 10px;font-size:12px;width:100%;text-align:left;justify-content:space-between;border-radius:10px;">
                            <span>\${s.name}</span><span style="font-size:10px;color:\${hasData?'#10b981':'#94a3b8'};">\${hasData?'●':'○'}</span>
                        </button>\`;
                    }).join('')}
                </div>
                <div style="flex:1;min-width:0;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:14px;display:flex;flex-direction:column;box-shadow:0 4px 12px rgba(0,0,0,0.03);overflow:hidden;">
                    <div style="flex:1;width:100%;min-height:0;position:relative;"><canvas id="wms-water-chart-canvas"></canvas></div>
                    <div style="height:75px;width:100%;min-height:75px;position:relative;margin-top:2px;"><canvas id="wms-rain-chart-canvas"></canvas></div>
                </div>
            </div>
        \`;

        let waterChartInstance = null;
        let rainChartInstance = null;

        const drawChartForStation = (idx) => {
            currentStationIdx = idx;
            const st = chartStationsData[idx]; if (!st) return;
            const mCount = (st.measurementData||[]).length, rCount = (st.rainfallData||[]).length;
            const titleEl = document.getElementById('wms-cur-chart-title');
            if (titleEl) titleEl.textContent = \`📊 [\${st.name}] 통합그래프\`;
            const badgeEl = document.getElementById('wms-cur-data-badge');
            if (badgeEl) {
                if (mCount > 0 || rCount > 0) {
                    badgeEl.style.background = '#dcfce7';
                    badgeEl.style.color = '#15803d';
                    badgeEl.textContent = \`수질데이터 \${mCount}건 | 강수량 \${rCount}건\`;
                } else {
                    badgeEl.style.background = '#fee2e2';
                    badgeEl.style.color = '#b91c1c';
                    badgeEl.textContent = '데이터 없음';
                }
            }
            document.querySelectorAll('#wms-chart-station-list button').forEach((b,i) => { b.className='wms-btn-action '+(i===idx?'wms-btn-primary':'wms-btn-secondary'); });

            // 1. 상단 수질 차트 렌더링
            const waterCanvas = document.getElementById('wms-water-chart-canvas');
            if (waterCanvas) {
                const wCtx = waterCanvas.getContext('2d');
                if (waterChartInstance) { waterChartInstance.destroy(); waterChartInstance = null; }
                const wCfg = buildWaterChartConfig(st);
                wCfg.options.animation = false;
                wCfg.options.responsive = true;
                wCfg.options.maintainAspectRatio = false;
                waterChartInstance = new Chart(wCtx, wCfg);
            }

            // 2. 하단 강수량 차트 렌더링
            const rainCanvas = document.getElementById('wms-rain-chart-canvas');
            if (rainCanvas) {
                const rCtx = rainCanvas.getContext('2d');
                if (rainChartInstance) { rainChartInstance.destroy(); rainChartInstance = null; }
                const rCfg = buildRainfallChartConfig(st);
                rCfg.options.animation = false;
                rCfg.options.responsive = true;
                rCfg.options.maintainAspectRatio = false;
                rainChartInstance = new Chart(rCtx, rCfg);
            }
        };

        drawChartForStation(0);
        document.querySelectorAll('#wms-chart-station-list button').forEach(btn => { btn.onclick = () => drawChartForStation(parseInt(btn.getAttribute('data-st-idx'),10)); });
        document.getElementById('wms-chart-back-btn').onclick = renderMainView;

        const reportExcelBtn = document.getElementById('wms-chart-btn-report-excel');
        if (reportExcelBtn) reportExcelBtn.onclick = () => exportSmallChartZipDirectly(startDate);
    }
`;
