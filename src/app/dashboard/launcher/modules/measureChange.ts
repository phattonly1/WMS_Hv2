/**
 * src/app/analysis/utils/launchers/unified/unifiedMeasureChange.ts
 * 모드 4: 측정값/코드 변경이력 추적 프로세스 (/wms/measureChange 화면 기반 실시간 동적 수집 및 필터링 뷰)
 */

export const UNIFIED_MEASURE_CHANGE_JS = `
    // ==========================================
    // 7. 모드 4: 코드변경이력 추적 프로세스 (실시간 WMS DOM & AJAX 연동)
    // ==========================================
    const isExcludedChangeItem = (name) => isWmsExcludedItem(name);

    const waitForCondition = async (checkFn, maxWaitMs = 4000, stepMs = 150) => {
        let elapsed = 0;
        while (elapsed < maxWaitMs) {
            const res = checkFn();
            if (res) return res;
            await delay(stepMs);
            elapsed += stepMs;
        }
        return checkFn();
    };

    const requestMeasureChange = (siteId, msrId) => {
        return new Promise((resolve) => {
            const target$ = (typeof activeWorkerCtx !== 'undefined' && activeWorkerCtx) ? activeWorkerCtx.$ : window.$;
            if (typeof target$ !== 'undefined' && target$.ajax) {
                target$.ajax({
                    type: "POST",
                    url: '/wms/measureChange/listAjax',
                    timeout: 8000,
                    data: {
                        pDay: startDate,
                        pDay2: endDate,
                        pSiteId: siteId,
                        time_s: '00:00',
                        time_e: '23:59',
                        msrId: msrId
                    },
                    dataType: 'json',
                    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                    success: function(data) {
                        resolve((data && data.list) || []);
                    },
                    error: function() {
                        resolve([]);
                    }
                });
                return;
            }

            const params = new URLSearchParams({
                pDay: startDate,
                pDay2: endDate,
                pSiteId: siteId,
                time_s: '00:00',
                time_e: '23:59',
                msrId: msrId
            });

            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 8000);

            fetch('/wms/measureChange/listAjax', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: params,
                signal: ctrl.signal
            })
            .then(r => r.json())
            .then(d => { clearTimeout(tid); resolve((d && d.list) || []); })
            .catch(() => { clearTimeout(tid); resolve([]); });
        });
    };

    async function runMeasureChangeProcess() {
        const targetStations = ALL_STATIONS.filter(s => selectedSet.has(s.value));
        if (targetStations.length === 0) {
            alert('최소 1개 이상의 측정소를 선택해주세요.');
            return;
        }

        // 0) 스마트 워커 연동 (데이터변경요청 10227)
        await getWorkerContext('/wms/measureChange?pMENUMST_ID=10227', '10227', '데이터변경요청 화면(10227)');
        const $ = (typeof activeWorkerCtx !== 'undefined' && activeWorkerCtx) ? activeWorkerCtx.$ : window.$;


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

        const isCurrentOnly = selectedSet.size === 1;
        const totalCount = isCurrentOnly ? 1 : selectedSet.size;
        const groupedMap = new Map();
        let processedStations = 0;

        try {
            if (isCurrentOnly) {
                const curSiteVal = Array.from(selectedSet)[0];
                const curSiteObj = ALL_STATIONS.find(s => s.value === curSiteVal);
                const curSiteName = curSiteObj ? curSiteObj.name : curSiteVal;
                const curTypeName = curSiteObj ? (curSiteObj.typeCode === '1' ? '국가망' : '소규모') : '측정소';

                progText.textContent = \`[\${curSiteName}] 측정항목 확인 중...\`;

                if (typeof $ !== 'undefined' && $('#pSiteId').length > 0 && $('#pSiteId').val() !== curSiteVal) {
                    $('#pSiteId').val(curSiteVal).change();
                    await waitForCondition(() => typeof $ !== 'undefined' && $('input[name="msrId"]').length > 0, 3000);
                    await delay(300);
                }

                let msrItems = [];
                if (typeof $ !== 'undefined') {
                    $('input[name="msrId"]').each(function() {
                        const name = $(this).parent().text().trim();
                        if (name && !isExcludedChangeItem(name)) msrItems.push({ id: $(this).val(), name: name });
                    });
                }

                if (msrItems.length === 0) {
                    await waitForCondition(() => typeof $ !== 'undefined' && $('input[name="msrId"]').length > 0, 3000);
                    if (typeof $ !== 'undefined') {
                        $('input[name="msrId"]').each(function() {
                            const name = $(this).parent().text().trim();
                            if (name && !isExcludedChangeItem(name)) msrItems.push({ id: $(this).val(), name: name });
                        });
                    }
                }

                progText.textContent = \`[\${curSiteName}] \${msrItems.length}개 수질항목 변경이력 조회 중...\`;

                const BATCH = 3;
                for (let b = 0; b < msrItems.length; b += BATCH) {
                    if (cancelRequested) break;
                    const batch = msrItems.slice(b, b + BATCH);
                    await Promise.all(batch.map(async (item) => {
                        const list = await requestMeasureChange(curSiteVal, item.id);
                        const changeRows = list.filter(row => {
                            const g = (row.GUBUN || row.gubun || '').trim();
                            return g && g !== '정상' && g !== '-';
                        });

                        changeRows.forEach(row => {
                            const gubun = (row.GUBUN || row.gubun || '').trim();
                            const reqDate = row.REQUEST_DATE || row.request_date || '';
                            const reqName = row.REQUEST_NAME || row.request_name || '';
                            const msrDate = row.MSR_DATE2 || row.msr_date2 || row.MSR_DATE || '';
                            const reason = row.CHG_REASON || row.chg_reason || row.REASON || row.reason || row.BIGO || row.bigo || '';
                            const key = \`\${curSiteName}_\${item.name}_\${gubun}_\${reqDate}_\${reqName}\`;

                            if (!groupedMap.has(key)) {
                                groupedMap.set(key, {
                                    stationName: curSiteName,
                                    stationType: curTypeName,
                                    siteId: curSiteVal,
                                    itemName: item.name,
                                    status: gubun,
                                    reqDate: reqDate,
                                    reqName: reqName,
                                    startDate: msrDate,
                                    endDate: msrDate,
                                    count: 1,
                                    reason: reason
                                });
                            } else {
                                const entry = groupedMap.get(key);
                                entry.count += 1;
                                if (msrDate && msrDate < entry.startDate) entry.startDate = msrDate;
                                if (msrDate && msrDate > entry.endDate) entry.endDate = msrDate;
                                if (!entry.reason && reason) entry.reason = reason;
                            }
                        });
                    }));
                    const curPct = Math.min(100, Math.round(((b + batch.length) / msrItems.length) * 100));
                    progPct.textContent = curPct + '%';
                    progBar.style.width = curPct + '%';
                    await delay(60);
                }
            } else {
                const stationTypes = [];
                const checkNat = Array.from(selectedSet).some(val => NATIONAL_STATIONS.some(s => s.value === val));
                const checkSml = Array.from(selectedSet).some(val => SMALL_STATIONS.some(s => s.value === val));
                if (checkNat) stationTypes.push({ code: '1', name: '국가망' });
                if (checkSml) stationTypes.push({ code: '3', name: '소규모' });

                for (const st of stationTypes) {
                    if (cancelRequested) break;
                    if (typeof $ !== 'undefined') {
                        $('#pMsrstnSeCd').val(st.code).change();
                    }

                    await waitForCondition(() => typeof $ !== 'undefined' && $('#pRiverId option').length > 0, 3000);
                    await delay(600);

                    const rivers = [];
                    if (typeof $ !== 'undefined') {
                        $('#pRiverId option').each(function() {
                            const val = $(this).val();
                            if (val) rivers.push({ value: val, name: $(this).text() });
                        });
                    }

                    for (const river of rivers) {
                        if (cancelRequested) break;
                        if (typeof $ !== 'undefined') {
                            $('#pRiverId').val(river.value).change();
                        }

                        await waitForCondition(() => typeof $ !== 'undefined' && $('#pSiteId option').length > 1, 3000);
                        await delay(500);

                        const stations = [];
                        if (typeof $ !== 'undefined') {
                            $('#pSiteId option').each(function() {
                                const val = $(this).val();
                                const txt = $(this).text().trim();
                                if (!val || val === 'ALL' || txt === '선택') return;
                                const match = selectedSet.has(val) || ALL_STATIONS.some(as => as.name === txt && selectedSet.has(as.value));
                                if (match) {
                                    stations.push({ value: val, name: txt });
                                }
                            });
                        }

                        for (let i = 0; i < stations.length; i++) {
                            if (cancelRequested) break;
                            const station = stations[i];
                            processedStations++;

                            const pct = Math.min(100, Math.floor((processedStations / totalCount) * 100));
                            progBar.style.width = pct + '%';
                            progPct.textContent = pct + '%';
                            progText.textContent = \`[\${st.name}] \${station.name} (\${processedStations}/\${totalCount}개소, 감지 \${groupedMap.size}건)\`;

                            if (typeof $ !== 'undefined') {
                                $('#pSiteId').val(station.value).change();
                            }

                            await waitForCondition(() => typeof $ !== 'undefined' && $('input[name="msrId"]').length > 0, 2500);
                            await delay(200);

                            let msrItems = [];
                            if (typeof $ !== 'undefined') {
                                $('input[name="msrId"]').each(function() {
                                    const name = $(this).parent().text().trim();
                                    if (name && !isExcludedChangeItem(name)) msrItems.push({ id: $(this).val(), name: name });
                                });
                            }

                            const BATCH = 3;
                            for (let b = 0; b < msrItems.length; b += BATCH) {
                                if (cancelRequested) break;
                                const batch = msrItems.slice(b, b + BATCH);
                                await Promise.all(batch.map(async (item) => {
                                    const list = await requestMeasureChange(station.value, item.id);
                                    const changeRows = list.filter(row => {
                                        const g = (row.GUBUN || row.gubun || '').trim();
                                        return g && g !== '정상' && g !== '-';
                                    });

                                    changeRows.forEach(row => {
                                        const gubun = (row.GUBUN || row.gubun || '').trim();
                                        const reqDate = row.REQUEST_DATE || row.request_date || '';
                                        const reqName = row.REQUEST_NAME || row.request_name || '';
                                        const msrDate = row.MSR_DATE2 || row.msr_date2 || row.MSR_DATE || '';
                                        const reason = row.CHG_REASON || row.chg_reason || row.REASON || row.reason || row.BIGO || row.bigo || '';
                                        const key = \`\${station.name}_\${item.name}_\${gubun}_\${reqDate}_\${reqName}\`;

                                        if (!groupedMap.has(key)) {
                                            groupedMap.set(key, {
                                                stationName: station.name,
                                                stationType: st.name,
                                                siteId: station.value,
                                                itemName: item.name,
                                                status: gubun,
                                                reqDate: reqDate,
                                                reqName: reqName,
                                                startDate: msrDate,
                                                endDate: msrDate,
                                                count: 1,
                                                reason: reason
                                            });
                                        } else {
                                            const entry = groupedMap.get(key);
                                            entry.count += 1;
                                            if (msrDate && msrDate < entry.startDate) entry.startDate = msrDate;
                                            if (msrDate && msrDate > entry.endDate) entry.endDate = msrDate;
                                            if (!entry.reason && reason) entry.reason = reason;
                                        }
                                    });
                                }));
                                await delay(80);
                            }
                        }
                    }
                }
            }

            progPct.textContent = '100%';
            progBar.style.width = '100%';
            progText.textContent = cancelRequested ? '작업이 중단되었습니다.' : '코드변경 수집 완료!';
            await delay(400);

            renderMeasureChangeResultView(Array.from(groupedMap.values()));
        } catch(err) {
            console.error('코드변경 조회 오류:', err);
            alert('조회 중 오류가 발생했습니다: ' + (err.message || err));
        } finally {
            cleanupWorkerWindow();
            isRunning = false;
            if (cancelBtn) cancelBtn.style.display = 'none';
            runBtn.style.display = 'inline-flex';
            runBtn.disabled = false;
            runBtn.style.opacity = '1';
        }
    }

    function renderMeasureChangeResultView(records) {
        let currentFilterStatus = 'ALL';
        let currentFilterStation = 'ALL';
        let searchQuery = '';

        const totalRecords = records.length;
        const pendingRecords = records.filter(r => r.status === '요청중' || r.status.includes('요청') || r.status.includes('접수')).length;
        const completedRecords = records.filter(r => r.status === '변경완료' || r.status.includes('완료') || r.status.includes('승인')).length;
        const uniqueStations = Array.from(new Set(records.map(r => r.stationName))).sort();

        body.innerHTML = \`
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                    <button id="wms-mc-back-btn" class="wms-btn-action wms-btn-secondary" style="padding:6px 14px;font-size:13px;font-weight:900;">◀ 설정으로 돌아가기</button>
                    <div style="display:flex;gap:6px;">
                        <button id="wms-mc-tab-all" class="wms-tab-btn active">전체 (\${totalRecords})</button>
                        <button id="wms-mc-tab-pending" class="wms-tab-btn" style="color:#c2410c;font-weight:900;">🚨 미승인 요청중 (\${pendingRecords})</button>
                        <button id="wms-mc-tab-completed" class="wms-tab-btn" style="color:#15803d;font-weight:900;">✅ 변경완료 (\${completedRecords})</button>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <select id="wms-mc-filter-site" style="padding:6px 8px;border-radius:10px;border:1px solid #cbd5e1;font-size:12px;font-weight:700;background:white;">
                        <option value="ALL">전체 측정소 (\${uniqueStations.length})</option>
                        \${uniqueStations.map(st => \`<option value="\${st}">\${st}</option>\`).join('')}
                    </select>
                    <input type="text" id="wms-mc-search" placeholder="항목, 사유, 요청자 검색..." style="padding:6px 12px;border-radius:10px;border:1px solid #cbd5e1;font-size:12px;width:160px;">
                    <button id="wms-mc-copy-btn" class="wms-btn-action wms-btn-excel" style="padding:6px 14px;font-size:12px;">📋 엑셀 복사</button>
                </div>
            </div>

            <div style="border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;background:#ffffff;flex:1;min-height:0;overflow-y:auto;" class="wms-scrollbar">
                <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:center;">
                    <thead style="background:#f1f5f9;position:sticky;top:0;z-index:2;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                        <tr>
                            <th class="wms-table-header" style="width:50px;">No</th>
                            <th class="wms-table-header">측정소명</th>
                            <th class="wms-table-header">망구분</th>
                            <th class="wms-table-header">측정항목</th>
                            <th class="wms-table-header">상태</th>
                            <th class="wms-table-header">변경대상 기간</th>
                            <th class="wms-table-header" style="width:65px;">건수</th>
                            <th class="wms-table-header">요청일시</th>
                            <th class="wms-table-header">요청자</th>
                            <th class="wms-table-header" style="text-align:left;">변경 사유 및 비고</th>
                        </tr>
                    </thead>
                    <tbody id="wms-mc-tbody"></tbody>
                </table>
            </div>
        \`;

        const updateTable = () => {
            const tbody = document.getElementById('wms-mc-tbody');
            if (!tbody) return;

            let filtered = records;
            if (currentFilterStatus === '요청중') {
                filtered = filtered.filter(r => r.status === '요청중' || r.status.includes('요청') || r.status.includes('접수'));
            } else if (currentFilterStatus === '변경완료') {
                filtered = filtered.filter(r => r.status === '변경완료' || r.status.includes('완료') || r.status.includes('승인'));
            }

            if (currentFilterStation !== 'ALL') {
                filtered = filtered.filter(r => r.stationName === currentFilterStation);
            }

            if (searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                filtered = filtered.filter(r =>
                    (r.stationName || '').toLowerCase().includes(q) ||
                    (r.itemName || '').toLowerCase().includes(q) ||
                    (r.reqName || '').toLowerCase().includes(q) ||
                    (r.reason || '').toLowerCase().includes(q)
                );
            }

            if (filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" style="padding:40px;text-align:center;color:#94a3b8;font-weight:700;">해당 조건의 코드변경 이력이 없습니다.</td></tr>';
                return;
            }

            tbody.innerHTML = filtered.map((r, idx) => {
                const isPending = r.status === '요청중' || r.status.includes('요청') || r.status.includes('접수');
                const badgeBg = isPending ? 'background:#ffedd5;color:#c2410c;border:1px solid #fed7aa;' : 'background:#dcfce7;color:#15803d;border:1px solid #bbf7d0;';
                return \`
                    <tr style="border-bottom:1px solid #f1f5f9;background:\${isPending ? '#fffdf7' : '#ffffff'};">
                        <td class="wms-table-cell" style="color:#94a3b8;font-weight:700;">\${idx + 1}</td>
                        <td class="wms-table-cell" style="font-weight:900;color:#0f172a;">\${r.stationName}</td>
                        <td class="wms-table-cell" style="color:#64748b;">\${r.stationType}</td>
                        <td class="wms-table-cell" style="font-weight:800;color:#0369a1;">\${r.itemName}</td>
                        <td class="wms-table-cell"><span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:900;\${badgeBg}">\${isPending ? '🚨 요청중' : '✅ 변경완료'}</span></td>
                        <td class="wms-table-cell" style="font-family:monospace;font-size:11.5px;">\${r.startDate || '-'} ~ \${r.endDate || '-'}</td>
                        <td class="wms-table-cell" style="font-weight:900;color:#475569;">\${r.count}건</td>
                        <td class="wms-table-cell" style="font-family:monospace;font-size:11.5px;">\${r.reqDate || '-'}</td>
                        <td class="wms-table-cell">\${r.reqName || '-'}</td>
                        <td class="wms-table-cell" style="text-align:left;max-width:260px;word-break:break-all;">\${r.reason || '-'}</td>
                    </tr>
                \`;
            }).join('');
        };

        document.getElementById('wms-mc-back-btn').onclick = renderMainView;
        document.getElementById('wms-mc-tab-all').onclick = (e) => {
            currentFilterStatus = 'ALL';
            document.querySelectorAll('.wms-tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateTable();
        };
        document.getElementById('wms-mc-tab-pending').onclick = (e) => {
            currentFilterStatus = '요청중';
            document.querySelectorAll('.wms-tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateTable();
        };
        document.getElementById('wms-mc-tab-completed').onclick = (e) => {
            currentFilterStatus = '변경완료';
            document.querySelectorAll('.wms-tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateTable();
        };
        document.getElementById('wms-mc-filter-site').onchange = (e) => {
            currentFilterStation = e.target.value;
            updateTable();
        };
        document.getElementById('wms-mc-search').oninput = (e) => {
            searchQuery = e.target.value;
            updateTable();
        };
        document.getElementById('wms-mc-copy-btn').onclick = () => {
            let tsv = 'No\\t측정소명\\t망구분\\t측정항목\\t상태구분\\t시작일시\\t종료일시\\t건수\\t요청일시\\t요청자\\t사유비고\\n';
            records.forEach((r, idx) => {
                tsv += \`\${idx + 1}\\t\${r.stationName}\\t\${r.stationType}\\t\${r.itemName}\\t\${r.status}\\t\${r.startDate || ''}\\t\${r.endDate || ''}\\t\${r.count}\\t\${r.reqDate || ''}\\t\${r.reqName || ''}\\t\${r.reason || ''}\\n\`;
            });
            copyToClipboard(tsv, null, () => alert('클립보드에 코드변경 내역이 복사되었습니다!'));
        };

        updateTable();
    }
`;
