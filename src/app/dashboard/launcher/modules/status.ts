/**
 * src/app/analysis/utils/launchers/unified/unifiedStatus.ts
 * 모드 5: 점검현황 및 상태 진단 프로세스 (/wms/stateManage/listAjax 초고속 8병렬 수집 및 사유미작성 필터링 뷰)
 */

export const UNIFIED_STATUS_JS = `
    // ==========================================
    // 8. 모드 5: 점검현황 진단 프로세스 (초고속 API 병렬 호출)
    // ==========================================
    const calcDuration = (startStr, endStr) => {
        if (!startStr) return '-';
        if (!endStr || endStr.trim() === '' || endStr === '-') return '진행중';
        try {
            const s = new Date(startStr.replace(/-/g, '/'));
            const e = new Date(endStr.replace(/-/g, '/'));
            const diffMs = e.getTime() - s.getTime();
            if (isNaN(diffMs) || diffMs < 0) return '-';
            const mins = Math.floor(diffMs / 60000);
            const hours = Math.floor(mins / 60);
            const remMins = mins % 60;
            const days = Math.floor(hours / 24);
            const remHours = hours % 24;
            if (days > 0) return days + '일 ' + remHours + '시간';
            if (hours > 0) return hours + '시간 ' + remMins + '분';
            return mins + '분';
        } catch(e) {
            return '-';
        }
    };

    async function runStatusProcess() {
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

        const startDay = startDate.replace(/-/g, '') + '000000';
        const endDay = endDate.replace(/-/g, '') + '235900';
        let allRecords = [];
        let completed = 0;

        const normalizeGubun = (rawName, rawGubun) => {
            const text = String(rawName || rawGubun || '').trim();
            if (text.includes('정지')) {
                return { label: '운전정지', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' };
            }
            if (text.includes('미수신')) {
                return { label: '미수신', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
            }
            if (text.includes('시험')) {
                return { label: '시험가동', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
            }
            if (text.includes('점검') || text.includes('보수')) {
                return { label: '점검/보수', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' };
            }
            return { label: text || '기타', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' };
        };

        const fetchOneStatusStation = async (st) => {
            try {
                const res = await fetch('/wms/stateManage/listAjax', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        riverId: 'R01',
                        siteId: st.value,
                        pMsrstnSeCd: st.typeCode,
                        startDay: startDay,
                        endDay: endDay,
                        stats: 'G|B'
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const rawList = data.list || [];
                    return rawList.map(item => {
                        const gubunInfo = normalizeGubun(item.GUBUN_NAME, item.GUBUN);
                        return {
                            ...item,
                            gubunLabel: gubunInfo.label,
                            gubunColor: gubunInfo.color,
                            gubunBg: gubunInfo.bg,
                            gubunBorder: gubunInfo.border,
                            stationName: st.name,
                            stationType: st.typeCode === '1' ? '국가망' : '소규모'
                        };
                    });
                }
            } catch(e) {
                console.warn(st.name, e);
            }
            return [];
        };

        // 동시성 제어 큐로 8개 병렬 호출
        await runWithConcurrency(
            targetStations,
            async (st) => {
                const rList = await fetchOneStatusStation(st);
                allRecords = allRecords.concat(rList);
                completed++;
                const pct = Math.round((completed / targetStations.length) * 100);
                progText.textContent = '[' + completed + '/' + targetStations.length + '] ' + st.name + ' 점검이력 수집 중... (누적 ' + allRecords.length + '건)';
                progPct.textContent = pct + '%';
                progBar.style.width = pct + '%';
            },
            8,
            () => cancelRequested
        );

        isRunning = false;
        if (cancelBtn) cancelBtn.style.display = 'none';
        runBtn.style.display = 'inline-flex';
        runBtn.disabled = false;
        runBtn.style.opacity = '1';

        allRecords.sort((a, b) => (b.STOP_STARTDATE || '').localeCompare(a.STOP_STARTDATE || ''));
        progPct.textContent = '100%';
        progBar.style.width = '100%';
        progText.textContent = cancelRequested ? '작업이 중단되었습니다.' : '점검현황 수집 완료!';
        await delay(400);

        renderStatusResultsView(allRecords);
    }

    function renderStatusResultsView(records) {
        let onlyEmptyCause = true;
        let searchQuery = '';

        const totalCount = records.length;
        const emptyCount = records.filter(r => !r.CAUSE || r.CAUSE.trim() === '').length;

        body.innerHTML = \`
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <button id="wms-back-btn" class="wms-btn-action wms-btn-secondary" style="padding:6px 14px;font-size:13px;font-weight:900;">◀ 설정으로 돌아가기</button>
                    <div style="display:flex;gap:6px;">
                        <button id="wms-st-tab-all" class="wms-tab-btn">전체 점검이력 (\${totalCount})</button>
                        <button id="wms-st-tab-empty" class="wms-tab-btn active" style="color:#dc2626;font-weight:900;">🚨 사유 미작성 (\${emptyCount})</button>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <input type="text" id="wms-st-search" placeholder="측정소, 구분, 내용, 사유 검색..." style="padding:6px 12px;border-radius:10px;border:1px solid #cbd5e1;font-size:12px;width:170px;">
                    <button id="wms-st-copy-btn" class="wms-btn-action wms-btn-excel" style="padding:6px 14px;font-size:12px;">📋 엑셀 복사</button>
                </div>
            </div>

            <div id="wms-st-table-container" style="border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;background:#ffffff;flex:1;min-height:0;overflow-y:auto;" class="wms-scrollbar">
                <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:center;">
                    <thead id="wms-st-thead" style="background:#f1f5f9;position:sticky;top:0;z-index:2;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                        <tr>
                            <th class="wms-table-header">측정소명</th>
                            <th class="wms-table-header">망구분</th>
                            <th class="wms-table-header">구분</th>
                            <th class="wms-table-header">점검내용/항목</th>
                            <th class="wms-table-header">시작일시</th>
                            <th class="wms-table-header">종료일시</th>
                            <th class="wms-table-header">소요시간</th>
                            <th class="wms-table-header">점검사유</th>
                            <th class="wms-table-header">비고</th>
                        </tr>
                    </thead>
                    <tbody id="wms-st-tbody"></tbody>
                </table>
            </div>
        \`;

        const updateTable = () => {
            const tbody = document.getElementById('wms-st-tbody');
            if (!tbody) return;

            let filtered = records;
            if (onlyEmptyCause) filtered = filtered.filter(r => !r.CAUSE || r.CAUSE.trim() === '');
            if (searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                filtered = filtered.filter(r => (r.stationName || '').toLowerCase().includes(q) || (r.gubunLabel || '').toLowerCase().includes(q) || (r.GUBUN_DETAIL || '').toLowerCase().includes(q) || (r.CAUSE || '').toLowerCase().includes(q));
            }

            if (filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" style="padding:40px;text-align:center;color:#94a3b8;font-weight:700;">해당 조건의 점검이력이 없습니다.</td></tr>';
                return;
            }

            tbody.innerHTML = filtered.map(r => {
                const isCauseEmpty = !r.CAUSE || r.CAUSE.trim() === '';
                const durStr = calcDuration(r.STOP_STARTDATE, r.STOP_ENDDATE);
                const gubunClass = r.gubunLabel === '운전정지' ? 'wms-badge-stop' :
                                   r.gubunLabel === '미수신' ? 'wms-badge-unrecv' :
                                   r.gubunLabel === '시험가동' ? 'wms-badge-trial' : 'wms-badge-check';
                return \`
                    <tr class="wms-table-row \${isCauseEmpty ? 'wms-row-empty' : ''}" style="border-bottom:1px solid #f1f5f9;background:\${isCauseEmpty ? '#fffdf7' : '#ffffff'};">
                        <td class="wms-table-cell" style="font-weight:900;color:#0f172a;">\${r.stationName}</td>
                        <td class="wms-table-cell" style="color:#64748b;">\${r.stationType}</td>
                        <td class="wms-table-cell"><span class="wms-status-badge \${gubunClass}" style="display:inline-block;padding:2.5px 8px;border-radius:6px;font-size:11px;font-weight:800;color:\${r.gubunColor};background:\${r.gubunBg};border:1px solid \${r.gubunBorder};white-space:nowrap;">\${r.gubunLabel}</span></td>
                        <td class="wms-table-cell" style="font-weight:700;color:#1e293b;">\${r.GUBUN_DETAIL || '-'}</td>
                        <td class="wms-table-cell" style="font-family:monospace;color:#475569;">\${r.STOP_STARTDATE || '-'}</td>
                        <td class="wms-table-cell" style="font-family:monospace;color:#475569;">\${r.STOP_ENDDATE || '-'}</td>
                        <td class="wms-table-cell" style="font-weight:800;color:#334155;">\${durStr}</td>
                        <td class="wms-table-cell" style="text-align:left;\${isCauseEmpty ? 'color:#dc2626;font-weight:900;' : ''}">\${r.CAUSE || '🚨 (사유 미작성)'}</td>
                        <td class="wms-table-cell" style="color:#64748b;text-align:left;">\${r.BIGO || '-'}</td>
                    </tr>
                \`;
            }).join('');
        };

        document.getElementById('wms-back-btn').onclick = renderMainView;
        document.getElementById('wms-st-tab-all').onclick = (e) => {
            onlyEmptyCause = false;
            document.querySelectorAll('.wms-tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateTable();
        };
        document.getElementById('wms-st-tab-empty').onclick = (e) => {
            onlyEmptyCause = true;
            document.querySelectorAll('.wms-tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateTable();
        };
        document.getElementById('wms-st-search').oninput = (e) => {
            searchQuery = e.target.value;
            updateTable();
        };
        document.getElementById('wms-st-copy-btn').onclick = () => {
            let tsv = '측정소명\\t망구분\\t구분\\t점검내용\\t시작일시\\t종료일시\\t소요시간\\t점검사유\\t비고\\n';
            records.forEach(r => {
                tsv += \`\${r.stationName}\\t\${r.stationType}\\t\${r.gubunLabel}\\t\${r.GUBUN_DETAIL || ''}\\t\${r.STOP_STARTDATE || ''}\\t\${r.STOP_ENDDATE || ''}\\t\${calcDuration(r.STOP_STARTDATE, r.STOP_ENDDATE)}\\t\${r.CAUSE || '미작성'}\\t\${r.BIGO || ''}\\n\`;
            });
            copyToClipboard(tsv, null, () => alert('클립보드에 점검이력이 복사되었습니다!'));
        };

        updateTable();
    }
`;
