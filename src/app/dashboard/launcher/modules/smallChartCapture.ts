/**
 * src/app/analysis/launchers/modules/smallChartCapture.ts
 * 모드 3-2: WMS 차트합본 팝업 고속 캡처 및 지점별 엑셀/ZIP 다운로드 엔진
 *
 * - WMS dataSort(10206 선별전) / dataFix(10207 선별후) 팝업 호출
 * - HTML5 Canvas 차트 캔버스 추출 및 세로 스트립 단일 이미지 합성
 * - 지점별 개별 시트에 차트 이미지 자동 삽입 보고서 엑셀 다운로드
 */

export const UNIFIED_SMALL_CHART_CAPTURE_JS = `
    // ==========================================
    // 7. WMS 차트합본 팝업 캡처 코어 엔진 (선별전 / 선별후)
    // ==========================================
    let wmsChartPopupWin = null;
    let timeoutStations = [];

    function closeWmsChartPopup() {
        if (wmsChartPopupWin && !wmsChartPopupWin.closed) {
            try { wmsChartPopupWin.close(); } catch(e) {}
        }
        wmsChartPopupWin = null;
    }

    async function captureWmsChartStrip(st, isPre, yyyymm) {
        const origin = window.location.origin || 'https://wms.waterkorea.or.kr';
        const basePath = isPre ? '/wms/dataSort/graphNew/' : '/wms/dataFix/graphNew/';
        const menuId = isPre ? '10206' : '10207';
        const typeLabel = isPre ? '선별전' : '선별후';
        const cleanStName = st.name.replace(/\\(소규모\\)|\\(국가망\\)|\\s/g, '').trim();
        const popupUrl = \`\${origin}\${basePath}?pMENUMST_ID=\${menuId}&pSiteId=\${st.value}&pSiteNm=\${encodeURIComponent(cleanStName)}&pYyyyMm=\${yyyymm}\`;
        
        console.log(\`[WMS 차트 캡처] 📸 [\${cleanStName}] \${typeLabel} 팝업 호출: \${popupUrl}\`);

        // 단일 팝업 이름('wms_chart_popup') 사용으로 브라우저 팝업 누적/차단 방지
        const popup = window.open(popupUrl, 'wms_chart_popup', 'width=1280,height=1000');
        wmsChartPopupWin = popup;

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
            console.error(\`❌ [\${st.name}] 팝업이 차단되었습니다! 브라우저 주소창에서 팝업을 허용해주세요.\`);
            alert('⚠️ 팝업이 브라우저에 의해 차단되었습니다!\\n브라우저 주소창 오른쪽에서 [항상 팝업 허용]을 설정하고 다시 시도해주세요.');
            return null;
        }

        const progText = document.getElementById('wms-prog-text');

        try {
            // 1단계: 팝업 페이지 로딩 대기
            let popupReady = false;
            let loadWaited = 0;
            while (loadWaited < 30000 && !cancelRequested) {
                await delay(500);
                loadWaited += 500;
                try {
                    if (popup.document && 
                        popup.document.readyState === 'complete' && 
                        popup.location.href && 
                        popup.location.href !== 'about:blank' && 
                        popup.location.href.includes('graphNew')) {
                        popupReady = true;
                        break;
                    }
                } catch(e) {}
            }

            if (!popupReady || cancelRequested) {
                console.warn(\`  ⚠️ [\${st.name}] 팝업 로딩 타임아웃 또는 취소 요청됨\`);
                closeWmsChartPopup();
                await delay(500);
                return null;
            }

            // 2단계: 차트 렌더링 대기
            const cleanStName = st.name.replace(/\\(소규모\\)|\\(국가망\\)|\\s/g, '').trim();
            const isNH3 = ['S01035', 'S01032', 'S01039'].includes(st.value) || 
                          ['원주천', '금사천', '조종천'].includes(cleanStName);
            const isOil = ['S01030', 'S01040', 'S01044'].includes(st.value) || 
                          ['전천', '왕숙천', '송전천'].includes(cleanStName);
            const expectedCount = (isNH3 || isOil) ? 8 : 7;

            try { popup.focus(); } catch(e) {}
            console.log(\`  ⏳ [\${cleanStName}] \${typeLabel} 차트 렌더링 감지 시작 (최대 30초)...\`);

            let prevSignatures = '';
            let stableCount = 0;
            let renderDetected = false;
            let isEmptyChart = false;
            let waitedMs = 0;
            const MAX_WAIT_MS = 30000;
            const CHECK_INTERVAL_MS = 500;

            while (waitedMs < MAX_WAIT_MS) {
                if (cancelRequested) {
                    closeWmsChartPopup();
                    return null;
                }

                try { popup.focus(); } catch(e) {}

                // 항목별 캔버스 탐색 (chart0 ~ chart11)
                const docCurrent = popup.document;
                const currentCanvases = [];
                for (let k = 0; k < 12; k++) {
                    const el = docCurrent ? docCurrent.getElementById('chart' + k) : null;
                    const cv = el ? el.querySelector('canvas') : null;
                    if (cv) currentCanvases.push(cv);
                }

                const elapsedSec = (waitedMs / 1000).toFixed(1);
                if (progText) {
                    progText.textContent = \`[\${cleanStName}] \${typeLabel} 차트 렌더링 중 (\${elapsedSec}s / 30s)...\`;
                }

                // 예상 항목 수(7~8개)만큼 캔버스가 존재할 때
                if (currentCanvases.length >= expectedCount) {
                    const canvasLengths = [];
                    let hasError = false;

                    for (const cv of currentCanvases) {
                        try {
                            const dataUrl = cv.toDataURL('image/png');
                            canvasLengths.push(dataUrl.length);
                        } catch(e) {
                            hasError = true;
                            break;
                        }
                    }

                    if (!hasError && canvasLengths.length >= expectedCount) {
                        const currentSignature = canvasLengths.join(',');
                        const minLen = Math.min(...canvasLengths);
                        const maxLen = Math.max(...canvasLengths);
                        const diff = maxLen - minLen;
                        const isIdentical25106 = (diff <= 30) && (minLen >= 24500 && maxLen <= 25500);

                        // 🔍 1. [진짜 빈 차트 감지 (25106)]: 7개 모두 25,106자 안팎이고 편차 30 이내일 때 1.5초 후 즉시 통과
                        if (isIdentical25106 && currentSignature === prevSignatures) {
                            stableCount++;
                            if (stableCount >= 3) { // 1.5초 정지 확인 시 즉시 탈출
                                renderDetected = true;
                                isEmptyChart = true;
                                console.log(\`  📭 [\${cleanStName}] \${typeLabel} 빈 차트(25106) 감지 완료! (\${elapsedSec}초 소요)\`);
                                break;
                            }
                        }
                        // 📈 2. [정상 데이터 차트]: 
                        // ⚠️ 창 로딩 완료 후 '순수 10초'가 지나기 전에는 어떠한 중간 멈춤도 무시하고 계속 대기!
                        // 순수 10초 경과 후에 굵은 선으로 완성 정지된 상태 감지
                        else if (maxLen >= 26000 && waitedMs >= 10000 && currentSignature === prevSignatures) {
                            stableCount++;
                            if (stableCount >= 2) { // 10초 지난 후 1.0초 정지 확인 시 즉시 완료!
                                renderDetected = true;
                                console.log(\`  🎯 [\${cleanStName}] \${typeLabel} 창 로딩 후 10초 완주! 굵은 선 최종 렌더링 완료 감지! (\${elapsedSec}초 소요, 바이트: \${maxLen})\`);
                                break;
                            }
                        } else {
                            stableCount = 0; // 아직 선이 이동 중이거나 10초 미도달 상태
                        }

                        // 📊 [1초마다 상세 진단 로그 콘솔 출력]
                        if (waitedMs % 1000 === 0) {
                            const isMoving = (currentSignature !== prevSignatures);
                            const statusLabel = isIdentical25106 
                                ? \`📭 빈차트후보(25106)\` 
                                : (maxLen >= 26000 ? (waitedMs < 10000 ? \`⏳ 10초안전대기중(\${elapsedSec}s/10s, \${isMoving ? '움직임' : '일시정지'})\` : \`📈 굵은선확정중(\${stableCount}/2)\`) : '⏳ 초기화중');
                            console.log(\`⏱️ [\${elapsedSec}s] [\${cleanStName}] \${statusLabel} | min:\${minLen} max:\${maxLen} diff:\${diff}\`);
                        }

                        prevSignatures = currentSignature;
                    }
                }

                await delay(CHECK_INTERVAL_MS);
                waitedMs += CHECK_INTERVAL_MS;
            }

            if (cancelRequested) {
                closeWmsChartPopup();
                return null;
            }

            // 30초 제한시간을 초과한 경우 타임아웃 목록에 기록 (빈 차트는 제외)
            if (!renderDetected) {
                console.warn(\`  ⚠️ [\${cleanStName}] \${typeLabel} 30초 내 렌더링 완료 미감지 (30초 초과 타임아웃)\`);
                if (typeof timeoutStations !== 'undefined' && Array.isArray(timeoutStations)) {
                    timeoutStations.push(\`\${cleanStName}(\${typeLabel})\`);
                }
            }

            console.log(\`  ✅ [\${cleanStName}] \${typeLabel} \${isEmptyChart ? '빈 차트(25106) 확인' : '렌더링 완료'}! 즉시 캡처 진행...\`);
            if (progText) {
                progText.textContent = \`[\${cleanStName}] \${typeLabel} \${isEmptyChart ? '(데이터 없음) ' : ''}캡처 중...\`;
            }
            try { popup.focus(); } catch(e) {}

            if (cancelRequested) {
                closeWmsChartPopup();
                return null;
            }

            // 3단계: 각 항목별 차트 캔버스(chart0 ~ chart11) 추출
            const captures = [];
            let totalHeight = 20, maxWidth = 0;
            const doc = popup.document;

            for (let k = 0; k < 12; k++) {
                try {
                    const chartEl = doc.getElementById('chart' + k);
                    if (!chartEl) continue;
                    const canvas = chartEl.querySelector('canvas');
                    if (canvas) {
                        const dataUrl = canvas.toDataURL('image/png');
                        if (dataUrl && dataUrl.length > 100) {
                            let domTitle = '';
                            try {
                                const prev = chartEl.previousElementSibling;
                                if (prev && prev.textContent && prev.textContent.trim().length > 1) {
                                    domTitle = prev.textContent.trim();
                                } else {
                                    const parent = chartEl.parentElement;
                                    if (parent) {
                                        const hEl = parent.querySelector('h1, h2, h3, h4, h5, .title, .chart-title, .chart_title, th, dt, legend, strong');
                                        if (hEl && hEl.textContent && hEl.textContent.trim().length > 1) {
                                            domTitle = hEl.textContent.trim();
                                        }
                                    }
                                }
                            } catch(e) {}

                            captures.push({ dataUrl, width: canvas.width, height: canvas.height, index: k, domTitle });
                            totalHeight += canvas.height + 40;
                            maxWidth = Math.max(maxWidth, canvas.width);
                        }
                    }
                } catch(e) {}
            }

            closeWmsChartPopup();
            await delay(100);

            if (captures.length === 0) {
                console.warn(\`  ⚠️ [\${st.name}] 캡처된 차트 캔버스가 없습니다.\`);
                return null;
            }

            console.log(\`  📸 [\${st.name}] \${typeLabel} \${captures.length}개 항목 캡처 완료! 세로 합본 생성 중...\`);

            // 4단계: 세로 합본 캔버스 조합
            const combinedCanvas = document.createElement('canvas');
            combinedCanvas.width = maxWidth || 1200;
            combinedCanvas.height = totalHeight;
            const ctx = combinedCanvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, combinedCanvas.width, totalHeight);

            const getChartTitle = (idx, cap) => {
                if (cap && cap.domTitle) return cap.domTitle;
                const basic = ['수소이온농도(pH)', '용존산소(DO)', '전기전도도(EC)', '수온', '탁도', '총유기탄소(TOC)'];
                if (idx < 6) return basic[idx];

                if (isNH3) {
                    if (idx === 6) return '암모니아성질소(NH3-N)';
                    if (idx === 7) return '질산성질소(NO3-N)';
                } else if (isOil) {
                    if (idx === 6) return '질산성질소(NO3-N)';
                    if (idx === 7) return '유류(Oil)';
                } else {
                    if (idx === 6) return '질산성질소(NO3-N)';
                }
                return '측정항목 ' + (idx + 1);
            };

            let currentY = 20;
            for (let idx = 0; idx < captures.length; idx++) {
                const cap = captures[idx];
                const title = getChartTitle(idx, cap);
                await new Promise(r => {
                    const img = new Image();
                    img.onload = () => {
                        ctx.fillStyle = '#0f172a';
                        ctx.font = 'bold 16px Arial';
                        ctx.fillText('[ ' + title + ' ]', 10, currentY + 20);
                        ctx.drawImage(img, 0, currentY + 30);
                        currentY += cap.height + 40;
                        r();
                    };
                    img.onerror = () => r();
                    img.src = cap.dataUrl;
                });
            }

            return combinedCanvas.toDataURL('image/png');
        } catch(err) {
            console.error(\`  ❌ [\${st.name}] 캡처 중 오류:\`, err);
            closeWmsChartPopup();
            await delay(1500);
            return null;
        } finally {
            closeWmsChartPopup();
        }
    }

    // ==========================================
    // 7-2. 통합그래프 및 강수량 총괄 시트 빌더 (ExcelJS)
    // ==========================================
    function createCombinedSummarySheet(workbook, combinedImagesMap) {
        const sheet = workbook.addWorksheet('통합그래프 및 강수량', {
            views: [{ showGridLines: true }]
        });

        // 20개 행 세로폭 (20행 * 15pt = 300pt, 약 400px)
        // 원본 2:1 가로세로 비율을 유지하려면 가로폭은 약 800px (100 width 단위)
        // C열부터 10개 열(C~L열)에 width 10씩 균등 배정하여 원본 2:1 비율 완벽 유지
        sheet.columns = [
            { width: 14 },
            { width: 15 },
            ...Array(10).fill({ width: 10 })
        ];

        // 1행: A1:L1 병합, 제목: <통합그래프 및 강수량>
        sheet.mergeCells('A1:L1');
        const a1 = sheet.getCell('A1');
        a1.value = '<통합그래프 및 강수량>';
        a1.font = { name: '맑은 고딕', size: 12, bold: true, color: { argb: 'FF0F172A' } };
        a1.alignment = { vertical: 'middle', horizontal: 'left' };

        const thinBorder = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
        };

        const ORDERED_NAMES = [
            '대가리천', '장평천', '동진천', '구안천', '요도천',
            '원곡천', '영덕천', '앙성천', '전천', '원주천',
            '양화천', '신둔천', '죽당천', '금사천', '곤지암천',
            '조종천', '왕숙천', '신천', '송전천', '황구지천'
        ];

        // 20개 지점별: 지점 1개당 20개 행씩 배정 (대가리천: 2~21행, 장평천: 22~41행, ...)
        for (let i = 0; i < ORDERED_NAMES.length; i++) {
            const stName = ORDERED_NAMES[i];
            const stIndex = i + 1;
            const startRow = 2 + (i * 20); // 2, 22, 42, 62, ...
            const endRow = startRow + 19;   // 21, 41, 61, 81, ...

            // A열 20개 행 세로 병합: 1.대가리천 ~ 20.황구지천
            sheet.mergeCells("A" + startRow + ":A" + endRow);
            const cellA = sheet.getCell("A" + startRow);
            cellA.value = stIndex + "." + stName;
            cellA.font = { name: '맑은 고딕', size: 11, bold: true };
            cellA.alignment = { vertical: 'middle', horizontal: 'center' };

            // B열 20개 행 세로 병합: 유효측정결과
            sheet.mergeCells("B" + startRow + ":B" + endRow);
            const cellB = sheet.getCell("B" + startRow);
            cellB.value = '유효측정결과';
            cellB.font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF475569' } };
            cellB.alignment = { vertical: 'middle', horizontal: 'center' };

            // C~L열 20개 행 전체 병합: 차트 배경 영역
            sheet.mergeCells("C" + startRow + ":L" + endRow);

            // 테두리 설정 (A열, B열, C~L열)
            for (let r = startRow; r <= endRow; r++) {
                sheet.getCell("A" + r).border = thinBorder;
                sheet.getCell("B" + r).border = thinBorder;
                for (let c = 3; c <= 12; c++) {
                    sheet.getRow(r).getCell(c).border = thinBorder;
                }
            }

            // C~L열 (col: 2 ~ 12), startRow ~ endRow (20개 행 세로폭)에 원본 2:1 비율로 스트레칭 삽입
            const chartBase64 = combinedImagesMap ? (combinedImagesMap[stName] || null) : null;
            if (chartBase64) {
                const rawBase64 = chartBase64.includes(',') ? chartBase64.split(',')[1] : chartBase64;
                const imageId = workbook.addImage({
                    base64: rawBase64,
                    extension: 'png'
                });

                // col: 2 = C열 시작, col: 12 = M열 시작(L열 끝)
                // row: startRow - 1 = startRow행 시작, row: endRow = endRow행 끝
                sheet.addImage(imageId, {
                    tl: { col: 2, row: startRow - 1 },
                    br: { col: 12, row: endRow },
                    editAs: 'oneCell'
                });
            }
        }
    }

    // ==========================================
    // 8. 20개소 지점별 보고서 시트 빌더 (ExcelJS)
    // ==========================================
    function createStationDetailSheet(workbook, stName, preDataUrl, postDataUrl) {
        const sheet = workbook.addWorksheet(stName, {
            views: [{ showGridLines: true }]
        });

        // A열: 구분(너비 13), B~P열 (15개): rawdata, Q~AE열 (15개): 1차 확정 후
        // 너비 45px에 해당하는 Excel column width는 약 5.5
        sheet.columns = [
            { width: 13 },
            ...Array(15).fill({ width: 5.5 }),
            ...Array(15).fill({ width: 5.5 })
        ];

        sheet.mergeCells('A1:AE1');
        const a1 = sheet.getCell('A1');
        a1.value = '<측정항목별 개별그래프>';
        a1.font = { name: '맑은 고딕', size: 11, bold: true };
        a1.alignment = { horizontal: 'left', vertical: 'middle' };

        sheet.getRow(2).height = 32.25;
        sheet.getCell('A2').value = '구분';
        sheet.getCell('A2').font = { name: '맑은 고딕', size: 10 };
        sheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

        // B2:P2 (15칸) -> rawdata
        sheet.mergeCells('B2:P2');
        sheet.getCell('B2').value = 'rawdata';
        sheet.getCell('B2').font = { name: '맑은 고딕', size: 10 };
        sheet.getCell('B2').alignment = { horizontal: 'center', vertical: 'middle' };

        // Q2:AE2 (15칸) -> 1차 확정 후
        sheet.mergeCells('Q2:AE2');
        sheet.getCell('Q2').value = '1차 확정 후';
        sheet.getCell('Q2').font = { name: '맑은 고딕', size: 10 };
        sheet.getCell('Q2').alignment = { horizontal: 'center', vertical: 'middle' };

        const thinBorder = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
        };

        const cleanStName = stName.replace(/(소규모)|(국가망)|s/g, '').trim();
        const isNH3 = ['원주천', '금사천', '조종천'].includes(cleanStName);
        const isOil = ['전천', '왕숙천', '송전천'].includes(cleanStName);

        let PARAMS = [];
        if (isNH3) {
            PARAMS = [
                { name: 'pH', start: 3, end: 19 },
                { name: 'DO', start: 20, end: 36 },
                { name: 'EC', start: 37, end: 53 },
                { name: '수온', start: 54, end: 70 },
                { name: '탁도', start: 71, end: 87 },
                { name: 'TOC', start: 88, end: 104 },
                { name: 'NH4-N', start: 105, end: 121 },
                { name: 'NO3-N', start: 122, end: 138 }
            ];
        } else if (isOil) {
            PARAMS = [
                { name: 'pH', start: 3, end: 19 },
                { name: 'DO', start: 20, end: 36 },
                { name: 'EC', start: 37, end: 53 },
                { name: '수온', start: 54, end: 70 },
                { name: '탁도', start: 71, end: 87 },
                { name: 'TOC', start: 88, end: 104 },
                { name: 'NO3-N', start: 105, end: 121 },
                { name: '유류', start: 122, end: 138 }
            ];
        } else {
            PARAMS = [
                { name: 'pH', start: 3, end: 19 },
                { name: 'DO', start: 20, end: 36 },
                { name: 'EC', start: 37, end: 53 },
                { name: '수온', start: 54, end: 70 },
                { name: '탁도', start: 71, end: 87 },
                { name: 'TOC', start: 88, end: 104 },
                { name: 'NO3-N', start: 105, end: 121 }
            ];
        }

        const maxRow = PARAMS[PARAMS.length - 1].end;

        PARAMS.forEach(p => {
            sheet.mergeCells("A" + p.start + ":A" + p.end);
            const ac = sheet.getCell("A" + p.start);
            ac.value = p.name;
            ac.font = { name: '맑은 고딕', size: 10, bold: true };
            ac.alignment = { horizontal: 'center', vertical: 'middle' };

            sheet.mergeCells("B" + p.start + ":P" + p.end);
            sheet.mergeCells("Q" + p.start + ":AE" + p.end);
        });

        // 3행부터 maxRow까지 행 높이를 표준 13.5pt로 지정하여 셀 테두리 적용
        for (let r = 2; r <= maxRow; r++) {
            const row = sheet.getRow(r);
            if (r > 2) {
                row.height = 13.5;
            }
            for (let c = 1; c <= 31; c++) {
                row.getCell(c).border = thinBorder;
            }
        }

        // 2-Cell Anchor를 사용하여 B3 ~ P[maxRow], Q3 ~ AE[maxRow] 범위에 꽉 차게 이미지 스트레칭 삽입
        // col: 1 = B열, col: 16 = Q열(P열 끝), col: 31 = AF열(AE열 끝)
        // row: 2 = 3행 시작, row: maxRow = maxRow행 끝
        if (preDataUrl) {
            const rawBase64 = preDataUrl.includes(',') ? preDataUrl.split(',')[1] : preDataUrl;
            const imgId = workbook.addImage({
                base64: rawBase64,
                extension: 'png'
            });
            sheet.addImage(imgId, {
                tl: { col: 1, row: 2 },
                br: { col: 16, row: maxRow },
                editAs: 'oneCell'
            });
        }

        if (postDataUrl) {
            const rawBase64 = postDataUrl.includes(',') ? postDataUrl.split(',')[1] : postDataUrl;
            const imgId = workbook.addImage({
                base64: rawBase64,
                extension: 'png'
            });
            sheet.addImage(imgId, {
                tl: { col: 16, row: 2 },
                br: { col: 31, row: maxRow },
                editAs: 'oneCell'
            });
        }
    }

    // ==========================================
    // 9. 차트 캡처 ZIP 다운로드 및 엑셀 파이프라인
    // ==========================================
    async function exportChartImagesZip(imagesMap, isPre, yyyymm) {
        await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        if (typeof window.JSZip === 'undefined') {
            throw new Error('JSZip 라이브러리를 로드하지 못했습니다.');
        }

        const zip = new window.JSZip();
        const typeLabel = isPre ? '선별전' : '선별후';
        const folderName = \`소규모20개소_\${typeLabel}_차트이미지_\${yyyymm}\`;
        const folder = zip.folder(folderName);

        const ORDERED_NAMES = [
            '대가리천', '장평천', '동진천', '구안천', '요도천',
            '원곡천', '영덕천', '앙성천', '전천', '원주천',
            '양화천', '신둔천', '죽당천', '금사천', '곤지암천',
            '조종천', '왕숙천', '신천', '송전천', '황구지천'
        ];

        let count = 0;
        for (let idx = 0; idx < ORDERED_NAMES.length; idx++) {
            const stName = ORDERED_NAMES[idx];
            const dataUrl = imagesMap[stName];
            if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
                const base64Data = dataUrl.split(',')[1] || '';
                const num = String(idx + 1).padStart(2, '0');
                folder.file(\`\${num}_\${stName}_\${typeLabel}.png\`, base64Data, { base64: true });
                count++;
            }
        }

        // 대상 목록에 없는 커스텀 지점이 선택되었을 경우 추가
        for (const [stName, dataUrl] of Object.entries(imagesMap)) {
            if (!ORDERED_NAMES.includes(stName) && dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
                const base64Data = dataUrl.split(',')[1] || '';
                folder.file(\`\${stName}_\${typeLabel}.png\`, base64Data, { base64: true });
                count++;
            }
        }

        if (count === 0) {
            throw new Error('ZIP으로 저장할 캡처 이미지가 없습니다.');
        }

        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        const mm = yyyymm.slice(4, 6);
        const zipFilename = isPre ? \`소규모_선별전 차트(\${mm}월).zip\` : \`소규모_선별후 차트(\${mm}월).zip\`;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob);
        a.download = zipFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);

        return zipFilename;
    }

    // 선별 전 차트 캡처 후 ZIP 다운로드
    async function runPreChartZipProcess() {
        await executeChartCaptureZipPipeline(true);
    }

    // 선별 후 차트 캡처 후 ZIP 다운로드
    async function runPostChartZipProcess() {
        await executeChartCaptureZipPipeline(false);
    }

    // 차트 캡처 후 ZIP 파일로 다운로드하는 핵심 파이프라인
    async function executeChartCaptureZipPipeline(isPre) {
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

        const yyyymm = startDate.replace(/-/g, '').slice(0, 6);
        const typeLabel = isPre ? '선별 전' : '선별 후';
        timeoutStations = [];

        try {
            const capturedImages = {};

            for (let i = 0; i < targetStations.length; i++) {
                if (cancelRequested) break;
                const st = targetStations[i];
                const cleanStName = st.name.replace(/(소규모)|(국가망)|s/g, '').trim();

                const pct = Math.round(((i) / targetStations.length) * 100);
                if (progPct) progPct.textContent = pct + '%';
                if (progBar) progBar.style.width = pct + '%';

                if (progText) progText.textContent = \`[\${i + 1}/\${targetStations.length}] \${st.name} \${typeLabel} 차트 팝업 캡처 시작...\`;
                const imgDataUrl = await captureWmsChartStrip(st, isPre, yyyymm);
                if (imgDataUrl) {
                    capturedImages[cleanStName] = imgDataUrl;
                }

                if (!cancelRequested && i < targetStations.length - 1) {
                    await delay(100);
                }
            }

            if (cancelRequested) {
                alert('작업이 중단되었습니다.');
                return;
            }

            if (progText) progText.textContent = \`📦 \${typeLabel} 캡처 이미지들을 ZIP 파일로 압축 중...\`;
            if (progPct) progPct.textContent = '95%';
            if (progBar) progBar.style.width = '95%';

            const downloadedZip = await exportChartImagesZip(capturedImages, isPre, yyyymm);

            if (progPct) progPct.textContent = '100%';
            if (progBar) progBar.style.width = '100%';
            if (progText) progText.textContent = \`✅ ZIP 다운로드 완료: \${downloadedZip}\`;

            // 일반 작업 완료 팝업은 제거하고, 30초 초과된 측정소가 있는 경우에만 팝업 알림
            if (timeoutStations.length > 0) {
                const listStr = timeoutStations.join(', ');
                alert(\`⚠️ [30초 렌더링 초과 측정소 안내]\\n\\n다음 측정소는 30초 제한시간 동안 굵은 선 렌더링 완료가 감지되지 않아 30초 시점에 자동 캡처되었습니다:\\n\\n• \${listStr}\\n\\n차트가 정상 생성되었는지 확인해 주시기 바랍니다.\`);
            }
        } catch (err) {
            console.error('차트 ZIP 생성 오류:', err);
            alert('차트 ZIP 생성 중 오류가 발생했습니다: ' + (err.message || err));
        } finally {
            closeWmsChartPopup();
            isRunning = false;
            cancelRequested = false;
            if (progBox) progBox.style.display = 'none';
            if (runBtn) runBtn.style.display = 'inline-flex';
            if (cancelBtn) cancelBtn.style.display = 'none';
        }
    }


    // ==========================================
    // 10. 선별 전/후 ZIP 파일 2개를 병합하여 20개소 보고서 엑셀 생성
    // ==========================================
    async function combineZipFilesToExcel(combinedZipFile, preZipFile, postZipFile) {
        if (!combinedZipFile && !preZipFile && !postZipFile) {
            alert('⚠️ 통합차트, 선별 전, 선별 후 ZIP 파일 중 최소 하나 이상을 선택해주세요.');
            return;
        }

        await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        await loadScriptOnce('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js');

        if (typeof window.JSZip === 'undefined' || typeof window.ExcelJS === 'undefined') {
            alert('필수 라이브러리(JSZip, ExcelJS)를 로드하지 못했습니다.');
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

        const ORDERED_NAMES = [
            '대가리천', '장평천', '동진천', '구안천', '요도천',
            '원곡천', '영덕천', '앙성천', '전천', '원주천',
            '양화천', '신둔천', '죽당천', '금사천', '곤지암천',
            '조종천', '왕숙천', '신천', '송전천', '황구지천'
        ];

        try {
            const combinedImages = {};
            const preImages = {};
            const postImages = {};

            // 긴 지점명부터 매칭하여 '송전천'이 '전천'에 오매칭되지 않도록 방지
            const matchingNames = [...ORDERED_NAMES].sort((a, b) => b.length - a.length);

            // 1. 통합차트 ZIP 파싱
            if (combinedZipFile) {
                if (progText) progText.textContent = "📊 통합차트 ZIP 파일(" + combinedZipFile.name + ") 분석 중...";
                const combZip = await window.JSZip.loadAsync(combinedZipFile);
                for (const filename of Object.keys(combZip.files)) {
                    if (filename.toLowerCase().endsWith('.png')) {
                        const fileData = await combZip.files[filename].async('base64');
                        for (const stName of matchingNames) {
                            if (filename.includes(stName)) {
                                combinedImages[stName] = fileData;
                                break;
                            }
                        }
                    }
                }
            }

            if (progPct) progPct.textContent = '25%';
            if (progBar) progBar.style.width = '25%';

            // 2. 선별 전 ZIP 파싱
            if (preZipFile) {
                if (progText) progText.textContent = "📂 선별 전 ZIP 파일(" + preZipFile.name + ") 분석 중...";
                const preZip = await window.JSZip.loadAsync(preZipFile);
                for (const filename of Object.keys(preZip.files)) {
                    if (filename.toLowerCase().endsWith('.png')) {
                        const fileData = await preZip.files[filename].async('base64');
                        for (const stName of matchingNames) {
                            if (filename.includes(stName)) {
                                preImages[stName] = fileData;
                                break;
                            }
                        }
                    }
                }
            }

            if (progPct) progPct.textContent = '50%';
            if (progBar) progBar.style.width = '50%';

            // 3. 선별 후 ZIP 파싱
            if (postZipFile) {
                if (progText) progText.textContent = "📂 선별 후 ZIP 파일(" + postZipFile.name + ") 분석 중...";
                const postZip = await window.JSZip.loadAsync(postZipFile);
                for (const filename of Object.keys(postZip.files)) {
                    if (filename.toLowerCase().endsWith('.png')) {
                        const fileData = await postZip.files[filename].async('base64');
                        for (const stName of matchingNames) {
                            if (filename.includes(stName)) {
                                postImages[stName] = fileData;
                                break;
                            }
                        }
                    }
                }
            }

            if (progPct) progPct.textContent = '75%';
            if (progBar) progBar.style.width = '75%';

            // 4. ExcelJS 워크북 생성: 시트 1에 <통합그래프 및 강수량> 배치 후 20개소 개별 시트 배치
            if (progText) progText.textContent = '📑 총괄 통합시트 및 20개소 보고서 엑셀 시트 생성 중...';
            const ExcelJS = window.ExcelJS;
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'WMS 한강수계 통합 런처';
            workbook.created = new Date();

            // 시트 1: 통합그래프 및 강수량 생성
            createCombinedSummarySheet(workbook, combinedImages);

            let totalPlaced = Object.keys(combinedImages).length;
            for (let i = 0; i < ORDERED_NAMES.length; i++) {
                const stName = ORDERED_NAMES[i];
                const preBase64 = preImages[stName] || null;
                const postBase64 = postImages[stName] || null;
                if (preBase64 || postBase64) totalPlaced++;
                createStationDetailSheet(workbook, stName, preBase64, postBase64);
            }

            if (progPct) progPct.textContent = '90%';
            if (progBar) progBar.style.width = '90%';

            const ym = (startDate ? startDate.slice(0, 7) : new Date().toISOString().slice(0, 7));
            const yyyy = ym.slice(0, 4);
            const mm = ym.slice(5, 7);
            const fileName = "붙임3. 한강수계 소규모감시망 " + yyyy + "년 " + mm + "월 측정데이터 그래프.xlsx";

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);

            if (progPct) progPct.textContent = '100%';
            if (progBar) progBar.style.width = '100%';
            if (progText) progText.textContent = "✅ 다운로드 완료: " + fileName;


        } catch (err) {
            console.error('ZIP 병합 엑셀 생성 오류:', err);
            alert('ZIP 병합 엑셀 생성 중 오류가 발생했습니다: ' + (err.message || err));
        } finally {
            isRunning = false;
            cancelRequested = false;
            if (progBox) progBox.style.display = 'none';
            if (runBtn) runBtn.style.display = 'inline-flex';
            if (cancelBtn) cancelBtn.style.display = 'none';
        }
    }

    // 파일 선택 모달을 열어 ZIP 병합을 시작하는 트리거 함수
    function promptZipMergeToExcel() {
        let inputComb = document.getElementById('wms-zip-combined-file');
        let inputPre = document.getElementById('wms-zip-pre-file');
        let inputPost = document.getElementById('wms-zip-post-file');
        
        const combFile = (inputComb && inputComb.files && inputComb.files[0]) || (typeof smallZipCombinedFile !== 'undefined' ? smallZipCombinedFile : null);
        const preFile = (inputPre && inputPre.files && inputPre.files[0]) || (typeof smallZipPreFile !== 'undefined' ? smallZipPreFile : null);
        const postFile = (inputPost && inputPost.files && inputPost.files[0]) || (typeof smallZipPostFile !== 'undefined' ? smallZipPostFile : null);

        if (!combFile && !preFile && !postFile) {
            alert('⚠️ [통합차트 ZIP], [선별 전 ZIP], [선별 후 ZIP] 파일 중 최소 하나 이상을 선택해주세요!');
            return;
        }

        combineZipFilesToExcel(combFile, preFile, postFile);
    }
`;
