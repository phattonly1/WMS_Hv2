/**
 * src/app/analysis/launchers/ui/dispatcher.ts
 * 실행 버튼 디스패처, 프로그레스 바 제어, 취소 핸들러
 */

export const LAUNCHER_DISPATCHER_JS = `
    // 탭별 실행 버튼 라벨 및 스타일 반환
    const getRunButtonConfig = () => {
        if (activeTab === 'diagnostic') {
            switch (diagSelectedTask) {
                case 'validDays':
                    return { text: '⚡ 1. 유효일 가선별 자동 분석 시작', bg: 'linear-gradient(135deg, #2563eb, #1d4ed8)' };
                case 'stoppage':
                    return { text: '⚙️ 2. 운전정지 및 교정·재개 이력 분석 시작', bg: 'linear-gradient(135deg, #0891b2, #0e7490)' };
                case 'measureChange':
                    return { text: '🔍 3. 데이터/코드 변경이력 추적 시작', bg: 'linear-gradient(135deg, #d97706, #b45309)' };
                case 'status':
                    return { text: '🛠️ 4. 점검현황 및 상태 진단 시작', bg: 'linear-gradient(135deg, #7c3aed, #6d28d9)' };
                default:
                    return { text: '⚡ 실행', bg: '#2563eb' };
            }
        }

        if (activeTab === 'pollutionAction') {
            const qNames = { '1Q': '1분기', '2Q': '2분기', '3Q': '3분기', '4Q': '4분기' };
            const qTitle = qNames[pollutionQuarter] || '분기';
            return {
                text: \`🚨 \${qTitle} 수질오염사고 [붙임 2] 전수 취합 및 엑셀 다운로드\`,
                bg: 'linear-gradient(135deg, #e11d48, #be123c)'
            };
        }

        if (activeTab === 'smallMonthly') {
            if (smallSelectedTask === 'chartPre') {
                return { text: '📦 3. 선별 전 차트 캡처 ZIP 다운로드', bg: 'linear-gradient(135deg, #0284c7, #0369a1)' };
            } else if (smallSelectedTask === 'chartPost') {
                return { text: '📦 4. 선별 후 차트 캡처 ZIP 다운로드', bg: 'linear-gradient(135deg, #0d9488, #0f766e)' };
            } else if (smallSelectedTask === 'chartReport') {
                return { text: '📑 2. 통합그래프 다운로드 시작', bg: 'linear-gradient(135deg, #4f46e5, #4338ca)' };
            }
            return { text: '📑 1. 유효측정결과(1일) 다운로드 시작', bg: 'linear-gradient(135deg, #059669, #047857)' };
        }

        if (activeTab === 'journal') {
            if (journalTask === 'history') {
                const yearLabel = journalYearScope === 'lastYear' ? '작년' : '올해';
                return { text: \`📥 \${yearLabel} 점검내역 추출 (엑셀 다운로드)\`, bg: 'linear-gradient(135deg, #059669, #047857)' };
            }
            return { text: '🚀 일지 작성창 열기 + 불러오기코드 자동 복사', bg: 'linear-gradient(135deg, #2563eb, #1d4ed8)' };
        }

        return { text: '⚡ 실행', bg: '#2563eb' };
    };

    // 메인 실행 디스패치 함수
    const dispatchCurrentTask = () => {
        // 측정소 선택 검증 (점검일지 복사 모드 및 수질오염사고 수집 모드는 전체 조회가 가능하므로 제외)
        const isJournalCopy = activeTab === 'journal' && journalTask === 'copy';
        const isPollutionCrawler = activeTab === 'diagnostic' && diagSelectedTask === 'pollutionAction';
        if (!isJournalCopy && !isPollutionCrawler && selectedSet.size === 0) {
            const container = document.getElementById('wms-7col-station-container');
            if (container) {
                container.style.outline = '3px solid #ef4444';
                container.style.borderRadius = '10px';
                setTimeout(() => { container.style.outline = 'none'; }, 2000);
            }
            const progBox = document.getElementById('wms-progress-box');
            const progText = document.getElementById('wms-prog-text');
            if (progBox && progText) {
                progBox.style.display = 'flex';
                progText.textContent = '⚠️ 먼저 대상 측정소를 1개 이상 선택해주세요!';
                progText.style.color = '#ef4444';
                setTimeout(() => {
                    progText.style.color = '#0284c7';
                    if (!isRunning) progBox.style.display = 'none';
                }, 3000);
            }
            alert('⚠️ 대상 측정소를 최소 1개 이상 선택해주세요!');
            return;
        }

        if (activeTab === 'diagnostic') {
            if (diagSelectedTask === 'validDays') {
                runDiagnosticProcess();
            } else if (diagSelectedTask === 'stoppage') {
                runStoppageProcess();
            } else if (diagSelectedTask === 'measureChange') {
                runMeasureChangeProcess();
            } else if (diagSelectedTask === 'status') {
                runStatusProcess();
            } else if (diagSelectedTask === 'pollutionAction') {
                runPollutionActionProcess();
            }
        } else if (activeTab === 'smallMonthly') {
            if (smallSelectedTask === 'chartPre') {
                executeChartCaptureZipPipeline(true);
            } else if (smallSelectedTask === 'chartPost') {
                executeChartCaptureZipPipeline(false);
            } else if (smallSelectedTask === 'chartReport') {
                runChartGenerationProcess();
            } else {
                runSmallMonthlyProcess();
            }
        } else if (activeTab === 'journal') {
            if (journalTask === 'history') {
                runJournalHistoryExcelProcess();
            } else {
                runJournalImporterProcess();
            }
        } else if (activeTab === 'pollutionAction') {
            runPollutionActionProcess();
        }
    };
`;
