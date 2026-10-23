/**
 * src/app/analysis/launchers/modules/journalHistory.ts
 * 모드 7: 작년·올해 점검일지 측정항목별 조치사항 & 비고 전수 수집 및 엑셀 다운로드
 *
 * - 대상 기간: 2025-01-01 ~ 오늘 (작년 1년치 + 올해 현재까지)
 * - 대상 측정소: 선택된 측정소들 (1개소 또는 선택한 여러 개소 / 전체)
 * - 수집 API:
 *   1단계: /wms/checkJournal/listAjax 로 일지 마스터 목록 수집
 *   2단계: 각 일지별 /wms/checkJournal/modifyGrid1/listAjax 로 세부 22개 장비 측정항목 조치사항/비고 수집
 * - 추출 컬럼:
 *   점검일자 | 측정소명 | 점검구분 | 점검자 | 장비명 | 측정항목 | 조치내역(FAULT_MANAGEMENT) | 비고(REMARK) | 발생원인(FAULT_CAUSE) | 비정상발생시간
 * - 엑셀 생성: SheetJS (XLSX) 라이브러리를 동적 로드하여 깔끔한 필터링 DB 엑셀로 자동 다운로드
 */

export const UNIFIED_JOURNAL_HISTORY_JS = `
    // ==========================================
    // 10. 모드 7: 작년·올해 조치사항 & 비고 전수 엑셀 수집
    // ==========================================
    async function runJournalHistoryExcelProcess() {
        const selectedList = Array.from(selectedSet);
        if (selectedList.length === 0) {
            alert('조치사항을 종합할 대상 측정소를 최소 1개 이상 선택해 주세요.');
            return;
        }

        const today = new Date();
        const thisYear = today.getFullYear();
        const lastYear = thisYear - 1;
        const isLastYearOnly = typeof journalYearScope !== 'undefined' && journalYearScope === 'lastYear';
        
        // 작년 선택 시: 작년 1.1 ~ 12.31 / 올해 선택 시: 올해 1.1 ~ 오늘
        const pastStart = isLastYearOnly ? \`\${lastYear}-01-01\` : \`\${thisYear}-01-01\`;
        const pastEnd = isLastYearOnly ? \`\${lastYear}-12-31\` : fmtDate(today);
        const todayStr = pastEnd;
        const targetYearDesc = isLastYearOnly ? \`\${lastYear}년\` : \`\${thisYear}년\`;

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

        updateProgress(5, \`[1/3] XLSX 엑셀 라이브러리 준비 중...\`);

        // SheetJS 동적 로드
        if (typeof XLSX === 'undefined') {
            try {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
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
            } catch(e) {
                alert('XLSX 엑셀 라이브러리 로드에 실패했습니다. 네트워크 연결을 확인해 주세요.');
                isRunning = false;
                if (progBox) progBox.style.display = 'none';
                if (cancelBtn) cancelBtn.style.display = 'none';
                if (startBtn) startBtn.style.display = 'inline-flex';
                return;
            }
        }

        const gubunMap = {
            '199': '일상점검',
            '200': '주간점검',
            '201': '월간점검',
            '203': '긴급점검'
        };

        const allFlatRows = [];
        let totalJournalsFound = 0;

        // 1단계: 선택된 측정소별 점검일지 마스터 목록 수집
        updateProgress(10, \`[2/3] 작년~올해 일지 목록 검색 중 (\${selectedList.length}개소)...\`);

        const journalsToFetch = [];

        for (let i = 0; i < selectedList.length; i++) {
            if (cancelRequested) break;
            const siteId = selectedList[i];
            const stInfo = ALL_STATIONS.find(s => s.value === siteId) || { name: siteId, typeCode: '1' };
            const siteName = stInfo.name || stInfo.label || siteId;
            const siteType = stInfo.typeCode || '1';

            try {
                const listRes = await fetch('/wms/checkJournal/listAjax', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        pMsrstnSeCd: siteType,
                        pRiverId: 'R01',
                        pSiteId: siteId,
                        pDay: pastStart,
                        pDay2: todayStr,
                        rptGubuns: '',
                        pOperatorName: '',
                        pRptStat: ''
                    })
                });

                const listData = await listRes.json();
                const rows = (listData && listData.list) ? listData.list : [];
                totalJournalsFound += rows.length;

                rows.forEach(r => {
                    journalsToFetch.push({
                        siteId: siteId,
                        siteName: siteName,
                        siteType: siteType,
                        rptSeq: r.RPT_SEQ,
                        rptDate: r.RPT_DATE,
                        rptGubun: gubunMap[r.RPT_GUBUN] || r.RPT_GUBUN_NM || '일반',
                        operatorName: r.OPERATOR_NAME || ''
                    });
                });
            } catch(err) {
                console.warn(\`[\${siteName}] 일지 목록 조회 실패:\`, err);
            }

            const pct = Math.round(10 + (i + 1) / selectedList.length * 20);
            updateProgress(pct, \`[2/3] 일지 목록 수집 중: \${i + 1}/\${selectedList.length}개소 (총 \${totalJournalsFound}건 발견)\`);
        }

        if (journalsToFetch.length === 0) {
            alert(\`작년(\${lastYear}년)부터 올해 현재까지 작성된 점검일지가 없습니다.\`);
            isRunning = false;
            if (progBox) progBox.style.display = 'none';
            if (cancelBtn) cancelBtn.style.display = 'none';
            if (startBtn) startBtn.style.display = 'inline-flex';
            return;
        }

        // 2단계: 각 일지별 세부 조치사항 및 비고 병렬 수집 (동시성 6)
        updateProgress(30, \`[3/3] 세부 조치사항·비고 수집 시작 (총 \${journalsToFetch.length}개 일지)...\`);

        let completedJournals = 0;
        let validActionRowCount = 0;

        await runWithConcurrency(
            journalsToFetch,
            async (jItem) => {
                if (cancelRequested) return;
                try {
                    const g1Res = await fetch('/wms/checkJournal/modifyGrid1/listAjax', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            RPT_SEQ: jItem.rptSeq,
                            SITE_ID: jItem.siteId,
                            RPT_DATE: (jItem.rptDate || '').replace(/-/g, '')
                        })
                    });

                    const g1Data = await g1Res.json();
                    const gridList = (g1Data && g1Data.list) ? g1Data.list : [];

                    const rawDate = jItem.rptDate || '';
                    const fmtD = rawDate.length === 8
                        ? (rawDate.substr(0,4) + '-' + rawDate.substr(4,2) + '-' + rawDate.substr(6,2))
                        : rawDate;

                    gridList.forEach(g => {
                        const action = (g.FAULT_MANAGEMENT || '').trim();
                        const remark = (g.REMARK || '').trim();
                        const cause = (g.FAULT_CAUSE || '').trim();
                        const faultDate = (g.FAULT_DATE || '').trim();

                        // 조치사항, 비고, 발생원인 중 하나라도 작성된 의미 있는 행만 추출 (빈 껍데기 제외)
                        if (action || remark || cause) {
                            validActionRowCount++;
                            allFlatRows.push({
                                '점검일자': fmtD,
                                '측정소명': jItem.siteName,
                                '측정소코드': jItem.siteId,
                                '점검구분': jItem.rptGubun,
                                '점검자': jItem.operatorName,
                                '장비명': (g.DEVICE_NAME || '').trim(),
                                '측정항목': (g.MSR_NAME || '').trim(),
                                '모델명': (g.DEVICE_MODEL || '').trim(),
                                '조치내역 (FAULT_MANAGEMENT)': action,
                                '비고 (REMARK)': remark,
                                '발생원인 (FAULT_CAUSE)': cause,
                                '비정상발생시간': faultDate,
                                '일지SEQ': jItem.rptSeq
                            });
                        }
                    });
                } catch(e) {
                    console.warn('세부 조치사항 조회 오류:', e);
                }

                completedJournals++;
                const pct = Math.round(30 + (completedJournals / journalsToFetch.length) * 65);
                updateProgress(
                    pct,
                    \`[3/3] 조치사항 수집 중: \${completedJournals}/\${journalsToFetch.length}일지 (\${validActionRowCount}건 추출됨)\`
                );
            },
            6,
            () => cancelRequested
        );

        if (cancelRequested) {
            updateProgress(100, '⏹️ 사용자에 의해 작업이 중단되었습니다.');
            setTimeout(() => {
                isRunning = false;
                if (progBox) progBox.style.display = 'none';
                if (cancelBtn) cancelBtn.style.display = 'none';
                if (startBtn) startBtn.style.display = 'inline-flex';
            }, 1500);
            return;
        }

        // 3단계: 날짜 역순(최신순) 정렬 및 엑셀 파일 생성
        updateProgress(96, '📊 엑셀 워크북 생성 및 서식 적용 중...');
        await new Promise(r => setTimeout(r, 100));

        allFlatRows.sort((a, b) => {
            if (b['점검일자'] !== a['점검일자']) {
                return b['점검일자'].localeCompare(a['점검일자']);
            }
            if (a['측정소명'] !== b['측정소명']) {
                return a['측정소명'].localeCompare(b['측정소명']);
            }
            return a['측정항목'].localeCompare(b['측정항목']);
        });

        const wb = XLSX.utils.book_new();

        // 1번 메인 시트: 조치사항 & 비고 전수 DB
        const wsData = XLSX.utils.json_to_sheet(allFlatRows.length > 0 ? allFlatRows : [{ '결과': '작성된 조치사항 및 비고 내역이 없습니다.' }]);
        
        // 열 너비 자동 맞춤
        wsData['!cols'] = [
            { wch: 12 }, // 점검일자
            { wch: 12 }, // 측정소명
            { wch: 10 }, // 측정소코드
            { wch: 10 }, // 점검구분
            { wch: 10 }, // 점검자
            { wch: 14 }, // 장비명
            { wch: 14 }, // 측정항목
            { wch: 14 }, // 모델명
            { wch: 38 }, // 조치내역
            { wch: 24 }, // 비고
            { wch: 20 }, // 발생원인
            { wch: 16 }, // 비정상발생시간
            { wch: 10 }  // 일지SEQ
        ];

        XLSX.utils.book_append_sheet(wb, wsData, '조치사항_비고_전수DB');

        // 파일명 생성
        const targetDesc = selectedList.length === 1 
            ? (ALL_STATIONS.find(s => s.value === selectedList[0])?.name || selectedList[0])
            : \`\${selectedList.length}개소\`;
        const fileName = \`WMS_점검일지_조치사항및비고_\${targetDesc}_\${targetYearDesc}_\${todayStr.replace(/-/g, '')}.xlsx\`;

        XLSX.writeFile(wb, fileName);

        updateProgress(100, \`✅ 엑셀 다운로드 완료! (총 \${allFlatRows.length}건 추출)\`);

        // 성공 토스트 배너 출력 (alert 팝업 없음)
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;top:24px;right:24px;z-index:9999999;background:#1e293b;color:#ffffff;padding:16px 22px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.3);font-family:sans-serif;font-size:13px;border:1px solid #334155;line-height:1.5;animation:wmsSlideIn 0.3s ease-out;';
        toast.innerHTML = \`<b style="color:#38bdf8;font-size:14.5px;">📥 조치사항 & 비고 엑셀 다운로드 완료!</b><br/><span style="color:#cbd5e1;font-size:12px;">\${targetDesc} (\${targetYearDesc}) 총 <b>\${allFlatRows.length}건</b>의 유효 조치사항이 추출되었습니다.</span>\`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4500);

        setTimeout(() => {
            isRunning = false;
            if (progBox) progBox.style.display = 'none';
            if (cancelBtn) cancelBtn.style.display = 'none';
            if (startBtn) startBtn.style.display = 'inline-flex';
        }, 2000);
    }
`;
