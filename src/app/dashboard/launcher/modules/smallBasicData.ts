/**
 * src/app/analysis/launchers/modules/smallBasicData.ts
 * 모드 3-1: 소규모 20개소 1일 유효 + 유류 결합 기초자료 엑셀/CSV 다운로드 엔진
 *
 * - 10064(유효데이터): 20개소 1일 유효 수질자료 수집
 * - 10061(측정자료): 3개소(전천, 왕숙천, 송전천) 1일 유류자료 수집
 * - 결합 파일: 소규모20개소_1일유효_기초자료_YYYY-MM.xlsx 및 .csv 다운로드
 */

export const UNIFIED_SMALL_BASIC_DATA_JS = `
    // ==========================================
    // 6. 소규모 1번 기초자료 엑셀 생성 프로세스
    //    10064(1일 유효)에서 전 항목(유류 포함) 일괄 수집
    // ==========================================
    async function collectStationDayData(ctx, station, sDate, eDate) {
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

        // 2. 측정소 선택 (완전 일치 검증)
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

        // 3. 간격 '1일' 설정
        await waitForConditionInWin(() => target$('#pIntVal option').length > 0, 3000, 200);
        let intValSet = false;
        target$('#pIntVal option').each(function() {
            const v = target$(this).val();
            const t = target$(this).text().trim();
            if (v === 'OneDay' || v === 'day' || v === 'dayValid' || t.includes('1일')) {
                target$('#pIntVal').val(v).trigger('change');
                intValSet = true;
                return false;
            }
        });
        if (!intValSet && target$('#pIntVal').length) {
            target$('#pIntVal').val('OneDay').trigger('change');
        }
        await delay(200);

        // 4. 날짜 설정
        if (target$('#pDay').length) target$('#pDay').val(sDate);
        if (target$('#pDay2').length) target$('#pDay2').val(eDate);
        if (target$('#pStartDate').length) target$('#pStartDate').val(sDate);
        if (target$('#pEndDate').length) target$('#pEndDate').val(eDate);

        // 5. 항목 선택 (유류 포함 전 항목 수집을 위해 전체 선택)
        if (target$('#pDeviceGubun').length) {
            target$('#pDeviceGubun option').each(function() {
                const txt = target$(this).text();
                if (txt.includes('전체') || txt.includes('모두')) {
                    target$('#pDeviceGubun').val(target$(this).val()).trigger('change');
                    return false;
                }
            });
            await delay(200);
        }

        target$('button, a, span, label').each(function() {
            const txt = target$(this).text().trim();
            if (txt === '모두선택' || txt === '전체선택') {
                target$(this).trigger('click');
                return false;
            }
        });
        await delay(300);

        // 6. 그리드 비우기 및 검색 실행
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

        // 7. 데이터 대기
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

        // 8. 행 추출
        const { rows, gv } = extractRowsFromRealGrid();
        return { rows, gv };
    }

    function parseDailyGridRows(rows, gv) {
        if (!rows || rows.length === 0) return {};
        
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
                        const curText = headerText.trim();
                        const effectiveParent = parentText || (curText && !curText.includes('측정값') && !curText.includes('상태') ? curText : '');
                        const fn = c.fieldName || c.name;
                        if (curText.includes('일시') || curText.includes('시간') || curText.includes('DATE') || curText.includes('DT') || curText === 'DAY' || fn === 'DAY') {
                            if (fn) detectedDateField = fn;
                        }
                        if (c.columns && c.columns.length > 0) {
                            traverse(c.columns, effectiveParent);
                        } else if (fn) {
                            if (!curText.includes('상태') && !curText.includes('코드') && !fn.includes('STAT') && !fn.includes('CODE')) {
                                colHeaderMap[fn] = effectiveParent || curText;
                            }
                        }
                    });
                };
                traverse(cols);
            } catch(e) {}
        }

        const sample = rows[0] || {};
        const sampleKeys = Object.keys(sample);
        if (!detectedDateField || !(detectedDateField in sample)) {
            detectedDateField = sampleKeys.find(k => {
                const uk = k.toUpperCase();
                return uk === 'DAY' || uk === 'MSR_DATE' || uk === 'LOG_DATE' || uk.includes('DAY') || uk.includes('DATE');
            }) || sampleKeys[0];
        }

        const itemFieldMap = {};
        for (const [fn, header] of Object.entries(colHeaderMap)) {
            const norm = normalizeChartItem(header);
            if (norm) itemFieldMap[norm] = fn;
        }
        if (Object.keys(itemFieldMap).length === 0) {
            sampleKeys.forEach(k => {
                if (k === detectedDateField || k.includes('STAT') || k.includes('CODE')) return;
                const norm = normalizeChartItem(k);
                if (norm) itemFieldMap[norm] = k;
            });
        }

        const formatDay = (raw) => {
            if (!raw) return '';
            const s = String(raw).trim();
            const m = s.match(/^(\\d{4})[-/.]?(\\d{2})[-/.]?(\\d{2})/);
            if (m) return \`\${m[1]}-\${m[2]}-\${m[3]}\`;
            return s.slice(0, 10);
        };

        const dataByDate = {};
        rows.forEach(r => {
            const d = formatDay(r[detectedDateField]);
            if (!d) return;
            if (!dataByDate[d]) dataByDate[d] = {};

            Object.entries(itemFieldMap).forEach(([norm, fn]) => {
                if (norm === '강수량') return;
                if (r[fn] != null && String(r[fn]).trim() !== '') {
                    const val = parseFloat(r[fn]);
                    if (!isNaN(val)) dataByDate[d][norm] = val;
                }
            });

            // 유류 필드가 normalizeChartItem에서 매핑되지 않았을 경우 추가 탐색
            if (dataByDate[d]['유류'] == null) {
                const oilKey = sampleKeys.find(k => k.toLowerCase().includes('oil') || k.includes('유류'));
                if (oilKey && r[oilKey] != null && String(r[oilKey]).trim() !== '') {
                    const val = parseFloat(r[oilKey]);
                    if (!isNaN(val)) dataByDate[d]['유류'] = val;
                }
            }
        });

        return dataByDate;
    }

    async function generateSmallMonthlyCombinedExcelAndCsv(collectedData, sDate, eDate) {
        await loadScriptOnce('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js');
        if (typeof window.ExcelJS === 'undefined') {
            alert('ExcelJS 라이브러리를 로드하지 못했습니다.');
            return;
        }

        const ExcelJS = window.ExcelJS;
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'WMS 한강수계 통합 런처';
        workbook.created = new Date();

        const allDates = [];
        const cur = new Date(sDate);
        const end = new Date(eDate);
        while (cur <= end) {
            const y = cur.getFullYear();
            const m = String(cur.getMonth() + 1).padStart(2, '0');
            const d = String(cur.getDate()).padStart(2, '0');
            allDates.push(\`\${y}-\${m}-\${d}\`);
            cur.setDate(cur.getDate() + 1);
        }

        const ORDERED_NAMES = [
            '대가리천', '장평천', '동진천', '구안천', '요도천',
            '원곡천', '영덕천', '앙성천', '전천', '원주천',
            '양화천', '신둔천', '죽당천', '금사천', '곤지암천',
            '조종천', '왕숙천', '신천', '송전천', '황구지천'
        ];

        const cleanName = n => (n || '').replace(/\\(소규모\\)|\\(국가망\\)|\\s/g, '').trim();

        const titleFont = { name: '맑은 고딕', size: 10, bold: true };
        const headerFont = { name: '맑은 고딕', size: 9.5, bold: true };
        const dataFont = { name: '맑은 고딕', size: 9.5 };
        const statLabelFont = { name: '맑은 고딕', size: 9.5, bold: false };
        const statDataFont = { name: '맑은 고딕', size: 9.5 };
        const redBoldFont = { name: '맑은 고딕', size: 9.5, bold: true, color: { argb: 'FFFF0000' } };

        // 색상 정의
        // 1) 헤더: 베이지 브라운 (RGB: 215, 180, 140 / D7B48C)
        const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD7B48C' } };
        // 2) 통계행: 연한 아이보리 베이지 (RGB: 255, 242, 204 / FFF2CC)
        const statFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
        // 3) 결측 셀: 연한 빨간색 채우기 (Light Red / Pink, RGB: 255, 199, 206 / FFC7CE)
        const missingCellFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };

        const thinBorder = {
            top: { style: 'thin', color: { argb: 'FF595959' } },
            bottom: { style: 'thin', color: { argb: 'FF595959' } },
            left: { style: 'thin', color: { argb: 'FF595959' } },
            right: { style: 'thin', color: { argb: 'FF595959' } }
        };

        const getItemNumFmt = (it) => {
            if (it === '전기전도도' || it === '유류') return '#,##0';
            if (it === '질산성질소') return '0.000';
            return '0.0';
        };

        const csvLines = [];

        for (let i = 0; i < ORDERED_NAMES.length; i++) {
            const stName = ORDERED_NAMES[i];
            const stIdx = i + 1;

            const sheetName = \`\${stIdx}. \${stName}\`;
            const worksheet = workbook.addWorksheet(sheetName, {
                views: [{ showGridLines: true }]
            });

            const isAmmonia = ['원주천', '금사천', '조종천'].includes(stName);
            const isOil = ['전천', '왕숙천', '송전천'].includes(stName);

            let items = [];
            let headers = [];
            if (isAmmonia) {
                items = ['수소이온농도', '용존산소', '전기전도도', '수온', '탁도', '총유기탄소', '암모니아성질소', '질산성질소'];
                headers = ['수소이온농도(-)', '용존산소(mg/L)', '전기전도도(μS/cm)', '수온(℃)', '탁도(NTU)', '총유기탄소(mg/L)', '암모니아성질소(mg/L)', '질산성질소(mg/L)'];
            } else if (isOil) {
                items = ['수소이온농도', '용존산소', '전기전도도', '수온', '탁도', '총유기탄소', '질산성질소', '유류'];
                headers = ['수소이온농도(-)', '용존산소(mg/L)', '전기전도도(μS/cm)', '수온(℃)', '탁도(NTU)', '총유기탄소(mg/L)', '질산성질소(mg/L)', '유류(-)'];
            } else {
                items = ['수소이온농도', '용존산소', '전기전도도', '수온', '탁도', '총유기탄소', '질산성질소'];
                headers = ['수소이온농도(-)', '용존산소(mg/L)', '전기전도도(μS/cm)', '수온(℃)', '탁도(NTU)', '총유기탄소(mg/L)', '질산성질소(mg/L)'];
            }

            const entry = Object.values(collectedData).find(e => {
                const cn = cleanName(e.station.name);
                return cn === stName;
            }) || { wqData: {} };

            // 1. Station Title Row (1행)
            const titleText = sheetName;
            const titleRow = worksheet.addRow([titleText]);
            titleRow.getCell(1).font = titleFont;

            // 2. Table Header Row (2행)
            const headerRowValues = ['측정일시', ...headers];
            const headerRow = worksheet.addRow(headerRowValues);
            headerRow.eachCell((cell) => {
                cell.font = headerFont;
                cell.fill = headerFill;
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = thinBorder;
            });

            // 3. Daily Rows & collect statistics (3행 ~ 말일행)
            const dayValuesByItem = {};
            items.forEach(it => dayValuesByItem[it] = []);

            const operatedDaysByItem = {};
            items.forEach(it => operatedDaysByItem[it] = 0);

            const startDataRowNum = worksheet.rowCount + 1;

            allDates.forEach(d => {
                const rowVals = [d];

                items.forEach(it => {
                    const val = entry.wqData && entry.wqData[d] && entry.wqData[d][it] != null ? entry.wqData[d][it] : null;

                    if (val !== null && !isNaN(val)) {
                        dayValuesByItem[it].push(val);
                        rowVals.push(val);
                    } else {
                        rowVals.push('');
                    }
                });

                const dRow = worksheet.addRow(rowVals);
                dRow.eachCell((cell, colNum) => {
                    cell.font = dataFont;
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    cell.border = thinBorder;
                    if (colNum > 1) {
                        if (cell.value === '' || cell.value == null) {
                            cell.fill = missingCellFill;
                        } else if (typeof cell.value === 'number') {
                            const it = items[colNum - 2];
                            cell.numFmt = getItemNumFmt(it);
                        }
                    }
                });
            });

            const endDataRowNum = worksheet.rowCount;

            // 4. Calculate Statistics & prepare dynamic formulas
            // 총일수는 당월 전체 일수 (지점의 운영일수)
            const totalDaysCount = allDates.length;

            const stats = items.map(it => {
                const vals = dayValuesByItem[it];
                const validCount = vals.length;
                const totalDays = totalDaysCount;
                const maxVal = vals.length > 0 ? Math.max(...vals) : 0;
                const minVal = vals.length > 0 ? Math.min(...vals) : 0;
                const avgVal = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length) : NaN;
                const opRate = totalDays > 0 ? (validCount / totalDays) * 100 : NaN;
                return { it, totalDays, validCount, maxVal, minVal, avgVal, opRate };
            });

            const nonNaNOpRates = stats.map(s => s.opRate).filter(r => !isNaN(r));
            const overallOpRate = nonNaNOpRates.length > 0 ? (nonNaNOpRates.reduce((a,b)=>a+b,0) / nonNaNOpRates.length) : NaN;

            const formatStatNum = (n) => {
                if (isNaN(n) || n == null) return 'NaN';
                return n;
            };

            const getColLetter = (colIdx) => {
                let temp = colIdx;
                let letter = '';
                while (temp > 0) {
                    const mod = (temp - 1) % 26;
                    letter = String.fromCharCode(65 + mod) + letter;
                    temp = Math.floor((temp - mod) / 26);
                }
                return letter;
            };

            // Calculate target row indices for formula references
            const maxRowNum = worksheet.rowCount + 1;
            const minRowNum = worksheet.rowCount + 2;
            const avgRowNum = worksheet.rowCount + 3;
            const opRateRowNum = worksheet.rowCount + 4;
            // blank line (rowCount + 5)
            const totalDaysRowNum = worksheet.rowCount + 6;
            const validDaysRowNum = worksheet.rowCount + 7;
            // blank line (rowCount + 8)
            const overallOpRateRowNum = worksheet.rowCount + 9;

            const addStatRowWithFormula = (label, values, formulaGetter, isStatGroup = false, numFmtType = 'item') => {
                const cellObjects = [label];

                values.forEach((val, idx) => {
                    const colLetter = getColLetter(idx + 2); // 1-indexed, Column B is 2
                    const formulaStr = formulaGetter ? formulaGetter(colLetter, idx) : null;
                    if (formulaStr) {
                        cellObjects.push({ formula: formulaStr, result: (isNaN(val) || val == null) ? undefined : val });
                    } else {
                        cellObjects.push(formatStatNum(val));
                    }
                });

                const r = worksheet.addRow(cellObjects);
                r.eachCell((cell, colNum) => {
                    cell.font = colNum === 1 ? statLabelFont : statDataFont;
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    cell.border = thinBorder;
                    if (isStatGroup) {
                        cell.fill = statFill;
                    }
                    if (colNum > 1) {
                        if (numFmtType === 'item') {
                            const it = items[colNum - 2];
                            cell.numFmt = getItemNumFmt(it);
                        } else if (numFmtType === 'percent') {
                            cell.numFmt = '0.0';
                        } else if (numFmtType === 'int') {
                            cell.numFmt = '#,##0';
                        }
                    }
                });
            };

            // 1) 최대값: =MAX(col{start}:col{end}) [연노랑 배경, 항목별 소수점]
            addStatRowWithFormula('최대값', stats.map(s => s.maxVal), (col) => \`MAX(\${col}\${startDataRowNum}:\${col}\${endDataRowNum})\`, true, 'item');

            // 2) 최소값: =MIN(col{start}:col{end}) [연노랑 배경, 항목별 소수점]
            addStatRowWithFormula('최소값', stats.map(s => s.minVal), (col) => \`MIN(\${col}\${startDataRowNum}:\${col}\${endDataRowNum})\`, true, 'item');

            // 3) 평균값: =AVERAGE(col{start}:col{end}) [연노랑 배경, 항목별 소수점]
            addStatRowWithFormula('평균값', stats.map(s => s.avgVal), (col) => \`AVERAGE(\${col}\${startDataRowNum}:\${col}\${endDataRowNum})\`, true, 'item');

            // 4) 가동율: =IF(col{totalDays}>0, (col{validDays}/col{totalDays})*100, 0) [연노랑 배경, 소수점 1자리]
            addStatRowWithFormula('가동율', stats.map(s => s.opRate), (col) => \`IF(\${col}\${totalDaysRowNum}>0,(\${col}\${validDaysRowNum}/\${col}\${totalDaysRowNum})*100,0)\`, true, 'percent');

            // 빈 줄
            worksheet.addRow([]);

            // 5) 총일수: 수치값 [흰색 배경, 정수]
            addStatRowWithFormula('총일수', stats.map(s => s.totalDays), null, false, 'int');

            // 6) 유효측정일수: =COUNT(col{start}:col{end}) [흰색 배경, 정수]
            addStatRowWithFormula('유효측정일수', stats.map(s => s.validCount), (col) => \`COUNT(\${col}\${startDataRowNum}:\${col}\${endDataRowNum})\`, false, 'int');

            // 빈 줄
            worksheet.addRow([]);

            // 7) 종합 가동률: =AVERAGE(B{opRate}:lastCol{opRate}) [빨간색 볼드, 소수점 1자리, 박스 테두리]
            const firstColLetter = 'B';
            const lastColLetter = getColLetter(items.length + 1);
            const overallFormulaStr = \`AVERAGE(\${firstColLetter}\${opRateRowNum}:\${lastColLetter}\${opRateRowNum})\`;

            const overallRowArr = [
                '가동률',
                { formula: overallFormulaStr, result: isNaN(overallOpRate) ? undefined : overallOpRate },
                ...Array(headers.length - 1).fill('')
            ];
            const oRow = worksheet.addRow(overallRowArr);
            oRow.eachCell((cell, colNum) => {
                if (colNum <= 2) {
                    cell.font = redBoldFont;
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    cell.border = thinBorder;
                    if (colNum === 2) {
                        cell.numFmt = '0.0';
                    }
                }
            });

            // 각 시트 열 너비 조정 (A열 14, 데이터열 16)
            worksheet.columns.forEach((col, idx) => {
                col.width = idx === 0 ? 14 : 16;
            });
        }

        const ym = sDate.slice(0, 7);
        const yyyy = ym.slice(0, 4);
        const mm = ym.slice(5, 7);
        const fileName = \`붙임2. 한강수계 소규모감시망 \${yyyy}년 \${mm}월 유효측정결과.xlsx\`;

        // 엑셀 파일 (.xlsx) 단독 다운로드
        const xlsxBuffer = await workbook.xlsx.writeBuffer();
        const xlsxBlob = new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const xlsxLink = document.createElement('a');
        xlsxLink.href = URL.createObjectURL(xlsxBlob);
        xlsxLink.download = fileName;
        document.body.appendChild(xlsxLink);
        xlsxLink.click();
        document.body.removeChild(xlsxLink);
        URL.revokeObjectURL(xlsxLink.href);
    }

    async function runSmallMonthlyProcess() {
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

        const totalSteps = targetStations.length + 1;
        let completedSteps = 0;

        const updateProgress = (label, pct) => {
            if (progPct) progPct.textContent = pct + '%';
            if (progBar) progBar.style.width = pct + '%';
            if (progText) progText.textContent = label;
        };

        const collectedData = {};
        targetStations.forEach(s => {
            collectedData[s.value] = {
                station: s,
                wqData: {}
            };
        });

        try {
            // ──────────────────────────────────────────────────────────
            // 10064(유효데이터)에서 20개소 1일 유효자료 수집 (유류 포함 일괄)
            // ──────────────────────────────────────────────────────────
            updateProgress('1일 유효데이터(10064) 화면 연동 중...', 5);
            const wqCtx = await getWorkerContext('/wms/validData/site?pMENUMST_ID=10064', '10064', '유효데이터(10064)');

            for (let i = 0; i < targetStations.length; i++) {
                if (cancelRequested) break;
                const st = targetStations[i];
                completedSteps++;
                const pct = Math.round((completedSteps / totalSteps) * 100);
                updateProgress(\`[수질 1일유효] \${st.name} (\${i + 1}/\${targetStations.length}) 수집 중...\`, pct);
                console.log(\`[수질 1일유효] [\${i + 1}/\${targetStations.length}] \${st.name} 수집 시작\`);

                try {
                    const { rows, gv } = await collectStationDayData(wqCtx, st, startDate, endDate, false);
                    const parsed = parseDailyGridRows(rows, gv);
                    collectedData[st.value].wqData = parsed;
                    console.log(\`  ✅ \${st.name} 1일 유효데이터: \${Object.keys(parsed).length}일치 수집 완료\`);
                } catch(stErr) {
                    console.error(\`  ⚠️ \${st.name} 수질 수집 오류:\`, stErr);
                }
                await delay(200);
            }

            if (cancelRequested) {
                alert('작업이 중단되었습니다.');
                return;
            }

            // ──────────────────────────────────────────────────────────
            // 20개소 시트 분할 표준 엑셀 문서 생성
            // ──────────────────────────────────────────────────────────
            updateProgress('📑 20개소 시트별 기초자료 엑셀 생성 중...', 95);

            await generateSmallMonthlyCombinedExcelAndCsv(collectedData, startDate, endDate);

            const ymStr = startDate ? startDate.slice(0, 7) : new Date().toISOString().slice(0, 7);
            const yyyy = ymStr.slice(0, 4);
            const mm = ymStr.slice(5, 7);
            updateProgress('✅ 다운로드 완료: 붙임2. 한강수계 소규모감시망 ' + yyyy + '년 ' + mm + '월 유효측정결과.xlsx', 100);
        } catch(err) {
            console.error('기초자료 생성 오류:', err);
            alert('기초자료 생성 중 오류가 발생했습니다: ' + (err.message || err));
        } finally {
            cleanupWorkerWindow();
            isRunning = false;
            if (cancelBtn) cancelBtn.style.display = 'none';
            if (runBtn) {
                runBtn.style.display = 'inline-flex';
                runBtn.disabled = false;
                runBtn.style.opacity = '1';
            }
        }
    }
`;
