/**
 * src/app/analysis/launchers/ui/tabPanels.ts
 * 탭별 전용 옵션 카드, 종합진단 4대 작업 카드, 소규모 3열 카드, 점검일지 2분할 듀얼 작업 카드 렌더링 & 이벤트 바인딩
 */

export const LAUNCHER_TAB_PANELS_JS = `
    // 1. [수질데이터 종합진단] 4대 작업 카드 HTML 생성
    function renderDiagnosticTaskCards() {
        const isDays = diagSelectedTask === 'validDays';
        const isStop = diagSelectedTask === 'stoppage';
        const isChange = diagSelectedTask === 'measureChange';
        const isStatus = diagSelectedTask === 'status';
        const isPollution = diagSelectedTask === 'pollutionAction';

        return \`
            <div style="display:flex;flex-direction:column;gap:10px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <!-- 유효일 가선별 -->
                    <div id="wms-card-diag-days" style="background:\${isDays ? '#eff6ff' : '#ffffff'};border:2px solid \${isDays ? '#2563eb' : '#e2e8f0'};border-radius:12px;padding:12px 14px;cursor:pointer;transition:all 0.15s ease;display:flex;flex-direction:column;gap:5px;box-shadow:\${isDays ? '0 2px 8px rgba(37,99,235,0.12)' : 'none'};">
                        <div style="display:flex;align-items:center;justify-content:space-between;">
                            <label style="display:flex;align-items:center;gap:7px;cursor:pointer;margin:0;">
                                <input type="radio" name="wms-diag-task" value="validDays" \${isDays ? 'checked' : ''} style="cursor:pointer;width:17px;height:17px;accent-color:#2563eb;">
                                <span style="font-size:14px;font-weight:900;color:\${isDays ? '#1d4ed8' : '#0f172a'};">유효일 가선별</span>
                            </label>
                        </div>
                        <div style="font-size:11.5px;color:#475569;line-height:1.4;">
                            1시간당 35분(7개) 이상 OK 시 1유효시간, 하루 13시간 이상 시 유효일 판정
                        </div>
                    </div>

                    <!-- 운전정지·재개 이력 분석 -->
                    <div id="wms-card-diag-stop" style="background:\${isStop ? '#ecfeff' : '#ffffff'};border:2px solid \${isStop ? '#0891b2' : '#e2e8f0'};border-radius:12px;padding:12px 14px;cursor:pointer;transition:all 0.15s ease;display:flex;flex-direction:column;gap:5px;box-shadow:\${isStop ? '0 2px 8px rgba(8,145,178,0.12)' : 'none'};">
                        <div style="display:flex;align-items:center;justify-content:space-between;">
                            <label style="display:flex;align-items:center;gap:7px;cursor:pointer;margin:0;">
                                <input type="radio" name="wms-diag-task" value="stoppage" \${isStop ? 'checked' : ''} style="cursor:pointer;width:17px;height:17px;accent-color:#0891b2;">
                                <span style="font-size:14px;font-weight:900;color:\${isStop ? '#0e7490' : '#0f172a'};">운전정지·재개</span>
                            </label>
                        </div>
                        <div style="font-size:11.5px;color:#475569;line-height:1.4;">
                            [G]점검, [D]정지, [E]교정 시계열 연속 구간 분석
                        </div>
                    </div>

                    <!-- 코드변경 추적 -->
                    <div id="wms-card-diag-change" style="background:\${isChange ? '#fffbeb' : '#ffffff'};border:2px solid \${isChange ? '#d97706' : '#e2e8f0'};border-radius:12px;padding:12px 14px;cursor:pointer;transition:all 0.15s ease;display:flex;flex-direction:column;gap:5px;box-shadow:\${isChange ? '0 2px 8px rgba(217,119,6,0.12)' : 'none'};">
                        <div style="display:flex;align-items:center;justify-content:space-between;">
                            <label style="display:flex;align-items:center;gap:7px;cursor:pointer;margin:0;">
                                <input type="radio" name="wms-diag-task" value="measureChange" \${isChange ? 'checked' : ''} style="cursor:pointer;width:17px;height:17px;accent-color:#d97706;">
                                <span style="font-size:14px;font-weight:900;color:\${isChange ? '#b45309' : '#0f172a'};">코드변경 추적</span>
                            </label>
                        </div>
                        <div style="font-size:11.5px;color:#475569;line-height:1.4;">
                            데이터 상태코드 및 수치 변경 승인/이력 전수 추적
                        </div>
                    </div>

                    <!-- 점검현황 진단 -->
                    <div id="wms-card-diag-status" style="background:\${isStatus ? '#faf5ff' : '#ffffff'};border:2px solid \${isStatus ? '#7c3aed' : '#e2e8f0'};border-radius:12px;padding:12px 14px;cursor:pointer;transition:all 0.15s ease;display:flex;flex-direction:column;gap:5px;box-shadow:\${isStatus ? '0 2px 8px rgba(124,58,237,0.12)' : 'none'};">
                        <div style="display:flex;align-items:center;justify-content:space-between;">
                            <label style="display:flex;align-items:center;gap:7px;cursor:pointer;margin:0;">
                                <input type="radio" name="wms-diag-task" value="status" \${isStatus ? 'checked' : ''} style="cursor:pointer;width:17px;height:17px;accent-color:#7c3aed;">
                                <span style="font-size:14px;font-weight:900;color:\${isStatus ? '#6d28d9' : '#0f172a'};">점검현황 진단</span>
                            </label>
                        </div>
                        <div style="font-size:11.5px;color:#475569;line-height:1.4;">
                            WMS 상태관리 데이터(10027) 고속 병렬 수집 종합 진단
                        </div>
                    </div>
                </div>

                <!-- 2번 운전정지 선택 시 추가 필터 옵션 바 표시 -->
                \${isStop ? \`
                <div id="wms-stoppage-filter-bar" style="background:#ffffff;border:1px solid #e9eff6;border-radius:10px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <span style="font-size:12px;font-weight:900;color:#0e7490;">⚙️ 포함 코드:</span>
                        <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;">
                            <input type="checkbox" id="wms-chk-g" \${stoppageFilters.includeG ? 'checked' : ''} style="cursor:pointer;accent-color:#0891b2;">
                            <span style="font-weight:700;color:#0e7490;">[G] 점검중</span>
                        </label>
                        <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;">
                            <input type="checkbox" id="wms-chk-d" \${stoppageFilters.includeD ? 'checked' : ''} style="cursor:pointer;accent-color:#0891b2;">
                            <span style="font-weight:700;color:#0e7490;">[D] 가동중지</span>
                        </label>
                        <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;">
                            <input type="checkbox" id="wms-chk-e" \${stoppageFilters.includeE ? 'checked' : ''} style="cursor:pointer;accent-color:#0891b2;">
                            <span style="font-weight:700;color:#0e7490;">[E] 교정중</span>
                        </label>
                    </div>
                    <span style="font-size:11px;color:#64748b;">(부대장비 자동 제외)</span>
                </div>
                \` : ''}
            </div>
        \`;
    }

    // 2. 소규모 4대 작업 2x2 카드 HTML 생성 (종합진단과 동일한 균형 레이아웃)
    function renderSmallMonthly3ColCards() {
        const isData = smallSelectedTask === 'data';
        const isReport = smallSelectedTask === 'chartReport';
        const isPre = smallSelectedTask === 'chartPre';
        const isPost = smallSelectedTask === 'chartPost';

        const isCombReady = !!smallZipCombinedFile;
        const isPreReady = !!smallZipPreFile;
        const isPostReady = !!smallZipPostFile;
        const readyCount = (isCombReady ? 1 : 0) + (isPreReady ? 1 : 0) + (isPostReady ? 1 : 0);

        return \`
            <div style="display:flex;flex-direction:column;gap:10px;">
                <!-- 1단계: 4대 추출 카드 (2열 대칭 그리드) -->
                <div>
                    <div style="font-size:11px;font-weight:900;color:#64748b;margin-bottom:4px;display:flex;align-items:center;gap:5px;">
                        <span>📥 <strong>1단계:</strong> 데이터 추출 및 차트 ZIP 다운로드</span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                        <!-- 1. 유효측정결과(1일) -->
                        <div id="wms-card-task-data" style="background:\${isData ? '#f0fdf4' : '#ffffff'};border:1.5px solid \${isData ? '#059669' : '#e2e8f0'};border-radius:10px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;display:flex;flex-direction:column;gap:2px;box-shadow:\${isData ? '0 2px 6px rgba(5,150,105,0.12)' : 'none'};">
                            <div style="display:flex;align-items:center;justify-content:space-between;">
                                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin:0;">
                                    <input type="radio" name="wms-small-task" value="data" \${isData ? 'checked' : ''} style="cursor:pointer;width:15px;height:15px;accent-color:#059669;">
                                    <span style="font-size:12.5px;font-weight:900;color:\${isData ? '#047857' : '#0f172a'};">유효측정결과(1일)</span>
                                </label>
                            </div>
                            <div style="font-size:10.5px;color:#64748b;line-height:1.2;">
                                유효데이터 측정결과(xlsx)
                            </div>
                        </div>

                        <!-- 2. 통합그래프 -->
                        <div id="wms-card-task-report" style="background:\${isReport ? '#fffbeb' : '#ffffff'};border:1.5px solid \${isReport ? '#d97706' : '#e2e8f0'};border-radius:10px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;display:flex;flex-direction:column;gap:2px;box-shadow:\${isReport ? '0 2px 6px rgba(217,119,6,0.12)' : 'none'};">
                            <div style="display:flex;align-items:center;justify-content:space-between;">
                                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin:0;">
                                    <input type="radio" name="wms-small-task" value="chartReport" \${isReport ? 'checked' : ''} style="cursor:pointer;width:15px;height:15px;accent-color:#d97706;">
                                    <span style="font-size:12.5px;font-weight:900;color:\${isReport ? '#b45309' : '#0f172a'};">통합그래프</span>
                                </label>
                            </div>
                            <div style="font-size:10.5px;color:#64748b;line-height:1.2;">
                                수질 및 강수량 그래프(zip)
                            </div>
                        </div>

                        <!-- 3. 선별 전 차트 -->
                        <div id="wms-card-task-pre" style="background:\${isPre ? '#f0f9ff' : '#ffffff'};border:1.5px solid \${isPre ? '#0284c7' : '#e2e8f0'};border-radius:10px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;display:flex;flex-direction:column;gap:2px;box-shadow:\${isPre ? '0 2px 6px rgba(2,132,199,0.12)' : 'none'};">
                            <div style="display:flex;align-items:center;justify-content:space-between;">
                                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin:0;">
                                    <input type="radio" name="wms-small-task" value="chartPre" \${isPre ? 'checked' : ''} style="cursor:pointer;width:15px;height:15px;accent-color:#0284c7;">
                                    <span style="font-size:12.5px;font-weight:900;color:\${isPre ? '#0369a1' : '#0f172a'};">선별 전 차트</span>
                                </label>
                            </div>
                            <div style="font-size:10.5px;color:#64748b;line-height:1.2;">
                                선별 전 차트 캡쳐(우선 작업!)
                            </div>
                        </div>

                        <!-- 4. 선별 후 차트 -->
                        <div id="wms-card-task-post" style="background:\${isPost ? '#f0fdfa' : '#ffffff'};border:1.5px solid \${isPost ? '#0d9488' : '#e2e8f0'};border-radius:10px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;display:flex;flex-direction:column;gap:2px;box-shadow:\${isPost ? '0 2px 6px rgba(13,148,136,0.12)' : 'none'};">
                            <div style="display:flex;align-items:center;justify-content:space-between;">
                                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin:0;">
                                    <input type="radio" name="wms-small-task" value="chartPost" \${isPost ? 'checked' : ''} style="cursor:pointer;width:15px;height:15px;accent-color:#0d9488;">
                                    <span style="font-size:12.5px;font-weight:900;color:\${isPost ? '#0f766e' : '#0f172a'};">선별 후 차트</span>
                                </label>
                            </div>
                            <div style="font-size:10.5px;color:#64748b;line-height:1.2;">
                                선별 후 차트 캡쳐
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 2단계: 2열 대형 드롭존 및 병합 컨트롤러 -->
                <div id="wms-small-step2-container" style="background:#ffffff;border:1.5px solid #cbd5e1;border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:6px;box-shadow:0 1px 4px rgba(0,0,0,0.02);">
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                        <div style="font-size:11px;font-weight:900;color:#0f172a;display:flex;align-items:center;gap:5px;">
                            <span>⚡ <strong>2단계:</strong> 그래프 및 차트 통합엑셀</span>
                            <span style="font-size:10px;font-weight:700;color:#64748b;">(ZIP 3개 등록)</span>
                        </div>
                        <span style="font-size:10.5px;font-weight:800;padding:1px 6px;border-radius:8px;background:\${readyCount === 3 ? '#dcfce7' : '#f1f5f9'};color:\${readyCount === 3 ? '#15803d' : '#64748b'};">
                            준비: \${readyCount}/3개
                        </span>
                    </div>

                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                        <!-- 드롭존 1: 통합그래프 ZIP -->
                        <label id="wms-dropzone-combined" style="border:1.5px dashed \${isCombReady ? '#d97706' : '#cbd5e1'};background:\${isCombReady ? '#fffbeb' : '#f8fafc'};border-radius:8px;padding:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;transition:all 0.15s ease;text-align:center;min-height:50px;" title="소규모_그래프(MM월).zip">
                            <input type="file" id="wms-zip-combined-file" accept=".zip" style="display:none;">
                            <div style="font-size:14px;">\${isCombReady ? '✅' : '📊'}</div>
                            <div style="font-size:11px;font-weight:900;color:\${isCombReady ? '#b45309' : '#334155'};">1. 통합그래프 ZIP</div>
                            <div id="wms-zip-combined-name" style="font-size:10px;color:\${isCombReady ? '#d97706' : '#94a3b8'};font-weight:700;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                \${isCombReady ? smallZipCombinedFile.name : '클릭/드래그'}
                            </div>
                        </label>

                        <!-- 드롭존 2: 선별 전 ZIP -->
                        <label id="wms-dropzone-pre" style="border:1.5px dashed \${isPreReady ? '#0284c7' : '#cbd5e1'};background:\${isPreReady ? '#f0f9ff' : '#f8fafc'};border-radius:8px;padding:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;transition:all 0.15s ease;text-align:center;min-height:50px;" title="소규모_선별전 차트(MM월).zip">
                            <input type="file" id="wms-zip-pre-file" accept=".zip" style="display:none;">
                            <div style="font-size:14px;">\${isPreReady ? '✅' : '📁'}</div>
                            <div style="font-size:11px;font-weight:900;color:\${isPreReady ? '#0369a1' : '#334155'};">2. 선별 전 ZIP</div>
                            <div id="wms-zip-pre-name" style="font-size:10px;color:\${isPreReady ? '#0284c7' : '#94a3b8'};font-weight:700;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                \${isPreReady ? smallZipPreFile.name : '클릭/드래그'}
                            </div>
                        </label>

                        <!-- 드롭존 3: 선별 후 ZIP -->
                        <label id="wms-dropzone-post" style="border:1.5px dashed \${isPostReady ? '#0d9488' : '#cbd5e1'};background:\${isPostReady ? '#f0fdfa' : '#f8fafc'};border-radius:8px;padding:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;transition:all 0.15s ease;text-align:center;min-height:50px;" title="소규모_선별후 차트(MM월).zip">
                            <input type="file" id="wms-zip-post-file" accept=".zip" style="display:none;">
                            <div style="font-size:14px;">\${isPostReady ? '✅' : '📁'}</div>
                            <div style="font-size:11px;font-weight:900;color:\${isPostReady ? '#0f766e' : '#334155'};">3. 선별 후 ZIP</div>
                            <div id="wms-zip-post-name" style="font-size:10px;color:\${isPostReady ? '#0d9488' : '#94a3b8'};font-weight:700;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                \${isPostReady ? smallZipPostFile.name : '클릭/드래그'}
                            </div>
                        </label>

                        <!-- 우측: 대형 병합 엑셀 다운로드 버튼 -->
                        <button type="button" id="wms-btn-merge-zip-excel" style="border:none;border-radius:8px;background:linear-gradient(135deg, #2563eb, #1d4ed8);color:#ffffff;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:6px;cursor:pointer;padding:8px 10px;box-shadow:0 3px 10px rgba(37,99,235,0.25);transition:all 0.15s ease;min-height:50px;">
                            <span style="font-size:16px;">⚡</span>
                            <span style="font-size:12px;font-weight:900;line-height:1.2;text-align:left;">보고서 엑셀<br>병합 다운로드</span>
                        </button>
                    </div>
                </div>
            </div>
        \`;
    }

        // 3. [점검일지] 전용 2대 작업 카드 HTML 생성
    function renderJournalTaskCards() {
        const isCopy = journalTask === 'copy';
        return \`
            <div style="display:flex;flex-direction:column;gap:10px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <!-- 일지 불러오기 모드 -->
                    <div id="wms-card-journal-copy" style="background:\${isCopy ? '#eff6ff' : '#ffffff'};border:2px solid \${isCopy ? '#2563eb' : '#e2e8f0'};border-radius:12px;padding:12px 14px;cursor:pointer;transition:all 0.15s ease;display:flex;flex-direction:column;gap:5px;box-shadow:\${isCopy ? '0 2px 8px rgba(37,99,235,0.12)' : 'none'};">
                        <div style="display:flex;align-items:center;justify-content:space-between;">
                            <label style="display:flex;align-items:center;gap:7px;cursor:pointer;margin:0;">
                                <input type="radio" name="wms-journal-task" value="copy" \${isCopy ? 'checked' : ''} style="cursor:pointer;width:17px;height:17px;accent-color:#2563eb;">
                                <span style="font-size:14px;font-weight:900;color:\${isCopy ? '#1d4ed8' : '#0f172a'};">일지 불러오기</span>
                            </label>
                        </div>
                        <div style="font-size:11.5px;color:#475569;line-height:1.4;">
                            측정소 1개소 선택 후 작성창 열기 + 이전 일지 내용 불러오기
                        </div>
                    </div>

                    <!-- 점검내역 추출 모드 -->
                    <div id="wms-card-journal-history" style="background:\${!isCopy ? '#ecfdf5' : '#ffffff'};border:2px solid \${!isCopy ? '#059669' : '#e2e8f0'};border-radius:12px;padding:12px 14px;cursor:pointer;transition:all 0.15s ease;display:flex;flex-direction:column;gap:5px;box-shadow:\${!isCopy ? '0 2px 8px rgba(5,150,105,0.12)' : 'none'};">
                        <div style="display:flex;align-items:center;justify-content:space-between;">
                            <label style="display:flex;align-items:center;gap:7px;cursor:pointer;margin:0;">
                                <input type="radio" name="wms-journal-task" value="history" \${!isCopy ? 'checked' : ''} style="cursor:pointer;width:17px;height:17px;accent-color:#059669;">
                                <span style="font-size:14px;font-weight:900;color:\${!isCopy ? '#047857' : '#0f172a'};">점검내역 추출</span>
                            </label>
                        </div>
                        <div style="font-size:11.5px;color:#475569;line-height:1.4;">
                            일지에서 측정항목별 조치사항과 비고만 전수 추출
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:2px;">
                            <button type="button" id="wms-btn-journal-last-year" style="padding:5px 8px;border-radius:8px;cursor:pointer;font-weight:900;font-size:12px;border:1.5px solid \${!isCopy && journalYearScope === 'lastYear' ? '#059669' : '#cbd5e1'};background:\${!isCopy && journalYearScope === 'lastYear' ? '#059669' : '#f8fafc'};color:\${!isCopy && journalYearScope === 'lastYear' ? '#ffffff' : '#475569'};transition:all 0.15s ease;display:flex;align-items:center;justify-content:center;">
                                작년 (\${new Date().getFullYear() - 1}년)
                            </button>
                            <button type="button" id="wms-btn-journal-this-year" style="padding:5px 8px;border-radius:8px;cursor:pointer;font-weight:900;font-size:12px;border:1.5px solid \${!isCopy && journalYearScope === 'thisYear' ? '#059669' : '#cbd5e1'};background:\${!isCopy && journalYearScope === 'thisYear' ? '#059669' : '#f8fafc'};color:\${!isCopy && journalYearScope === 'thisYear' ? '#ffffff' : '#475569'};transition:all 0.15s ease;display:flex;align-items:center;justify-content:center;">
                                올해 (\${new Date().getFullYear()}년)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        \`;
    }

    // 4. [수질오염사고 조치] 전용 분기 선택 카드 HTML 생성
    function renderPollutionActionTaskCards() {
        const curYear = pollutionYear || new Date().getFullYear();
        const qList = [
            { id: '1Q', label: '1분기', desc: '1.1 ~ 3.31', s: \`\${curYear}-01-01\`, e: \`\${curYear}-03-31\` },
            { id: '2Q', label: '2분기', desc: '4.1 ~ 6.30', s: \`\${curYear}-04-01\`, e: \`\${curYear}-06-30\` },
            { id: '3Q', label: '3분기', desc: '7.1 ~ 9.30', s: \`\${curYear}-07-01\`, e: \`\${curYear}-09-30\` },
            { id: '4Q', label: '4분기', desc: '10.1 ~ 12.31', s: \`\${curYear}-10-01\`, e: \`\${curYear}-12-31\` }
        ];

        const qButtons = qList.map(q => {
            const isSel = pollutionQuarter === q.id;
            return \`
                <div id="wms-card-q-\${q.id}" data-q="\${q.id}" data-s="\${q.s}" data-e="\${q.e}" style="background:\${isSel ? '#eff6ff' : '#ffffff'};border:2px solid \${isSel ? '#2563eb' : '#e2e8f0'};border-radius:12px;padding:12px 14px;cursor:pointer;transition:all 0.15s ease;display:flex;flex-direction:column;gap:4px;box-shadow:\${isSel ? '0 2px 8px rgba(37,99,235,0.12)' : 'none'};">
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                        <span style="font-size:14px;font-weight:900;color:\${isSel ? '#1d4ed8' : '#0f172a'};">\${q.label}</span>
                        <span style="font-size:11.5px;font-weight:800;color:\${isSel ? '#2563eb' : '#64748b'};">\${q.desc}</span>
                    </div>
                    <div style="font-size:11px;color:#64748b;">\${curYear}년 \${q.label} [붙임 2] 자동 생성</div>
                </div>
            \`;
        }).join('');

        return \`
            <div style="display:flex;flex-direction:column;gap:10px;">
                <!-- 연도 전환 컨트롤러 바 -->
                <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                    <button type="button" id="wms-btn-poll-prev-year" style="border:1px solid #cbd5e1;background:#f8fafc;color:#334155;border-radius:8px;padding:5px 12px;font-size:12px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:all 0.15s ease;">
                        ◀ \${curYear - 1}년
                    </button>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:15px;font-weight:900;color:#1e293b;">📅 \${curYear}년도</span>
                        \${curYear !== new Date().getFullYear() ? \`
                            <button type="button" id="wms-btn-poll-reset-year" style="border:1px solid #bfdbfe;background:#eff6ff;color:#2563eb;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:800;cursor:pointer;">
                                올해(\${new Date().getFullYear()}년)로 복귀
                            </button>
                        \` : ''}
                    </div>
                    <button type="button" id="wms-btn-poll-next-year" style="border:1px solid #cbd5e1;background:#f8fafc;color:#334155;border-radius:8px;padding:5px 12px;font-size:12px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:all 0.15s ease;">
                        \${curYear + 1}년 ▶
                    </button>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    \${qButtons}
                </div>
                <div style="font-size:11.5px;color:#475569;line-height:1.55;background:#f8fafc;border:1px solid #e2e8f0;padding:12px 14px;border-radius:10px;display:flex;flex-direction:column;gap:5px;">
                    <div style="font-size:12px;font-weight:900;color:#0f172a;display:flex;align-items:center;gap:6px;">
                        <span>💡</span>
                        <span>[붙임 2] 보고서 자동화 프로세스 안내</span>
                    </div>
                    <div style="padding-left:2px;display:flex;flex-direction:column;gap:3px;">
                        <div>• <strong>시간순 연번 정렬:</strong> 발생일시 기준 오름차순으로 자동 정렬하여 1번부터 연번을 부여합니다.</div>
                        <div>• <strong>점검여부 정밀 판정:</strong> 경보 발생 후 최초 출동(시간범위 종료일 기준)을 식별하고, 출동 당일 병행된 정기점검(<code>일상</code>/<code>주간</code>/<code>월간</code>)만 점검일지와 교차 분석하여 자동 기입합니다. (단순 긴급출동은 공란 유지)</div>
                        <div>• <strong>대분류 공식 매핑:</strong> WMS 결재 폼에 등록된 대분류 코드(<code>108: 환경적 요인</code>, <code>109: 설비적 요인</code>)를 1:1로 매핑하며, 미등록 시 임의 추정 없이 공란 처리합니다.</div>
                        <div>• <strong>초과항목 전수 맵핑:</strong> 초과항목(1~10)의 단위 및 실제 경보기준을 결재 폼 데이터와 대조하여 정확히 추출합니다.</div>
                    </div>
                </div>
            </div>
        \`;
    }

    // 탭 전용 이벤트 안전 바인딩 함수
    function bindTabSpecificEvents() {
        if (activeTab === 'pollutionAction') {
            const btnPrevYear = document.getElementById('wms-btn-poll-prev-year');
            const btnNextYear = document.getElementById('wms-btn-poll-next-year');
            const btnResetYear = document.getElementById('wms-btn-poll-reset-year');

            const setQuarterDates = (year, q) => {
                if (q === '1Q') { startDate = \`\${year}-01-01\`; endDate = \`\${year}-03-31\`; }
                else if (q === '2Q') { startDate = \`\${year}-04-01\`; endDate = \`\${year}-06-30\`; }
                else if (q === '3Q') { startDate = \`\${year}-07-01\`; endDate = \`\${year}-09-30\`; }
                else { startDate = \`\${year}-10-01\`; endDate = \`\${year}-12-31\`; }
            };

            if (btnPrevYear) {
                btnPrevYear.onclick = () => {
                    pollutionYear--;
                    setQuarterDates(pollutionYear, pollutionQuarter);
                    renderMainView();
                };
            }
            if (btnNextYear) {
                btnNextYear.onclick = () => {
                    pollutionYear++;
                    setQuarterDates(pollutionYear, pollutionQuarter);
                    renderMainView();
                };
            }
            if (btnResetYear) {
                btnResetYear.onclick = () => {
                    pollutionYear = new Date().getFullYear();
                    setQuarterDates(pollutionYear, pollutionQuarter);
                    renderMainView();
                };
            }

            ['1Q', '2Q', '3Q', '4Q'].forEach(qid => {
                const card = document.getElementById('wms-card-q-' + qid);
                if (card) {
                    card.onclick = () => {
                        pollutionQuarter = qid;
                        startDate = card.getAttribute('data-s');
                        endDate = card.getAttribute('data-e');
                        renderMainView();
                    };
                }
            });
            return;
        }

        if (activeTab === 'diagnostic') {
            const cDays = document.getElementById('wms-card-diag-days');
            const cStop = document.getElementById('wms-card-diag-stop');
            const cChange = document.getElementById('wms-card-diag-change');
            const cStatus = document.getElementById('wms-card-diag-status');

            if (cDays) cDays.onclick = () => { diagSelectedTask = 'validDays'; renderMainView(); };
            if (cStop) cStop.onclick = () => { diagSelectedTask = 'stoppage'; renderMainView(); };
            if (cChange) cChange.onclick = () => { diagSelectedTask = 'measureChange'; renderMainView(); };
            if (cStatus) cStatus.onclick = () => { diagSelectedTask = 'status'; renderMainView(); };

            document.querySelectorAll('input[name="wms-diag-task"]').forEach(r => {
                r.onchange = (e) => {
                    diagSelectedTask = e.target.value;
                    renderMainView();
                };
            });

            if (diagSelectedTask === 'stoppage') {
                const chkG = document.getElementById('wms-chk-g');
                const chkD = document.getElementById('wms-chk-d');
                const chkE = document.getElementById('wms-chk-e');
                if (chkG) chkG.onchange = e => stoppageFilters.includeG = e.target.checked;
                if (chkD) chkD.onchange = e => stoppageFilters.includeD = e.target.checked;
                if (chkE) chkE.onchange = e => stoppageFilters.includeE = e.target.checked;
            }
            return;
        }

        if (activeTab === 'journal') {
            const cardCopy = document.getElementById('wms-card-journal-copy');
            const cardHistory = document.getElementById('wms-card-journal-history');
            if (cardCopy) cardCopy.onclick = () => {
                journalTask = 'copy';
                renderMainView();
            };
            if (cardHistory) cardHistory.onclick = () => {
                journalTask = 'history';
                renderMainView();
            };

            document.querySelectorAll('input[name="wms-journal-task"]').forEach(r => {
                r.onchange = (e) => {
                    journalTask = e.target.value;
                    renderMainView();
                };
            });

            const btnLastYear = document.getElementById('wms-btn-journal-last-year');
            const btnThisYear = document.getElementById('wms-btn-journal-this-year');
            if (btnLastYear) {
                btnLastYear.onclick = (e) => {
                    e.stopPropagation();
                    journalTask = 'history';
                    journalYearScope = 'lastYear';
                    renderMainView();
                };
            }
            if (btnThisYear) {
                btnThisYear.onclick = (e) => {
                    e.stopPropagation();
                    journalTask = 'history';
                    journalYearScope = 'thisYear';
                    renderMainView();
                };
            }
            return;
        }

        if (activeTab === 'smallMonthly') {
            const cardData = document.getElementById('wms-card-task-data');
            const cardReport = document.getElementById('wms-card-task-report');
            const cardPre = document.getElementById('wms-card-task-pre');
            const cardPost = document.getElementById('wms-card-task-post');

            // 4개 작업 카드 UI 및 실행 버튼 동기화 (선별전 ↔ 선별후 전환 시 병합 박스 깜빡임 없이 즉시 전환)
            const updateSmallTaskUI = (task) => {
                const prevTask = smallSelectedTask;
                smallSelectedTask = task;

                // data <-> chartReport <-> chart 모드 간 전환 시에는 레이아웃/병합바 표시 여부가 바뀌므로 renderMainView 호출
                const wasChart = (prevTask === 'chartPre' || prevTask === 'chartPost');
                const isChart = (task === 'chartPre' || task === 'chartPost');
                if (wasChart !== isChart || !wasChart) {
                    renderMainView();
                    return;
                }

                // chartPre <-> chartPost 간의 전환인 경우: 병합 박스 및 파일 선택 상태를 유지하면서 즉시 DOM 고속 업데이트
                const rPre = document.querySelector('input[name="wms-small-task"][value="chartPre"]');
                const rPost = document.querySelector('input[name="wms-small-task"][value="chartPost"]');
                if (rPre) rPre.checked = (task === 'chartPre');
                if (rPost) rPost.checked = (task === 'chartPost');

                if (cardPre) {
                    cardPre.style.background = (task === 'chartPre') ? '#f0f9ff' : 'transparent';
                    cardPre.style.borderColor = (task === 'chartPre') ? '#0284c7' : 'transparent';
                    const pill = cardPre.querySelector('.wms-pill-preset');
                    if (pill) pill.style.display = (task === 'chartPre') ? 'inline-block' : 'none';
                    const title = cardPre.querySelector('span[style*="font-size:13.5px"]');
                    if (title) title.style.color = (task === 'chartPre') ? '#0369a1' : '#0f172a';
                }

                if (cardPost) {
                    cardPost.style.background = (task === 'chartPost') ? '#f0fdfa' : 'transparent';
                    cardPost.style.borderColor = (task === 'chartPost') ? '#0d9488' : 'transparent';
                    const pill = cardPost.querySelector('.wms-pill-preset');
                    if (pill) pill.style.display = (task === 'chartPost') ? 'inline-block' : 'none';
                    const title = cardPost.querySelector('span[style*="font-size:13.5px"]');
                    if (title) title.style.color = (task === 'chartPost') ? '#0f766e' : '#0f172a';
                }

                // 하단 메인 실행 버튼 문구 및 스타일 즉시 업데이트
                const btn = document.getElementById('wms-start-run-btn');
                if (btn && typeof getRunButtonConfig === 'function') {
                    const cfg = getRunButtonConfig();
                    btn.textContent = cfg.text;
                    btn.style.background = cfg.bg;
                }
            };

            if (cardData) cardData.onclick = () => { updateSmallTaskUI('data'); };
            if (cardReport) cardReport.onclick = () => { updateSmallTaskUI('chartReport'); };
            if (cardPre) cardPre.onclick = () => { updateSmallTaskUI('chartPre'); };
            if (cardPost) cardPost.onclick = () => { updateSmallTaskUI('chartPost'); };

            document.querySelectorAll('input[name="wms-small-task"]').forEach(r => {
                r.onchange = (e) => {
                    updateSmallTaskUI(e.target.value);
                };
            });

            // ZIP 병합 파일 선택 및 실행 이벤트 바인딩 (전역 상태에 파일 객체 유지)
            const inputCombined = document.getElementById('wms-zip-combined-file');
            const inputPre = document.getElementById('wms-zip-pre-file');
            const inputPost = document.getElementById('wms-zip-post-file');
            const nameCombined = document.getElementById('wms-zip-combined-name');
            const namePre = document.getElementById('wms-zip-pre-name');
            const namePost = document.getElementById('wms-zip-post-name');
            const btnMerge = document.getElementById('wms-btn-merge-zip-excel');

            if (inputCombined && nameCombined) {
                inputCombined.onchange = (e) => {
                    const f = e.target.files && e.target.files[0];
                    smallZipCombinedFile = f || null;
                    renderMainView();
                };
            }

            if (inputPre && namePre) {
                inputPre.onchange = (e) => {
                    const f = e.target.files && e.target.files[0];
                    smallZipPreFile = f || null;
                    renderMainView();
                };
            }

            if (inputPost && namePost) {
                inputPost.onchange = (e) => {
                    const f = e.target.files && e.target.files[0];
                    smallZipPostFile = f || null;
                    renderMainView();
                };
            }


            // Drag & Drop 지원 헬퍼
            const setupDropzone = (zoneId, inputId, setFileFn) => {
                const zone = document.getElementById(zoneId);
                const input = document.getElementById(inputId);
                if (!zone || !input) return;

                ['dragenter', 'dragover'].forEach(name => {
                    zone.addEventListener(name, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        zone.style.transform = 'scale(1.02)';
                    });
                });

                ['dragleave', 'drop'].forEach(name => {
                    zone.addEventListener(name, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        zone.style.transform = 'scale(1)';
                    });
                });

                zone.addEventListener('drop', (e) => {
                    const dt = e.dataTransfer;
                    if (dt && dt.files && dt.files[0]) {
                        const file = dt.files[0];
                        if (file.name.toLowerCase().endsWith('.zip')) {
                            setFileFn(file);
                            renderMainView();
                        } else {
                            alert('ZIP 압축 파일(.zip)만 등록 가능합니다.');
                        }
                    }
                });
            };

            setupDropzone('wms-dropzone-combined', 'wms-zip-combined-file', (f) => { smallZipCombinedFile = f; });
            setupDropzone('wms-dropzone-pre', 'wms-zip-pre-file', (f) => { smallZipPreFile = f; });
            setupDropzone('wms-dropzone-post', 'wms-zip-post-file', (f) => { smallZipPostFile = f; });

            if (btnMerge) {
                btnMerge.onclick = () => {
                    promptZipMergeToExcel();
                };
            }
        }
    }
`;
