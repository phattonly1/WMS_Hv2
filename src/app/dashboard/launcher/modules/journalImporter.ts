/**
 * src/app/analysis/launchers/modules/journalImporter.ts
 * 모드 6: WMS 운영점검일지 조치내역 스마트 불러오기
 *
 * 1. 현재 화면이 /wms/checkJournal/form/2 가 아니면:
 *    - 선택된 1개 측정소 정보로 스크립트를 자동 생성하여 클립보드에 복사(navigator.clipboard.writeText)
 *    - 새 탭으로 WMS 점검일지 신규 작성 페이지(/wms/checkJournal/form/2?pMENUMST_ID=10328)를 팝업 오픈
 *    - 사용자에게 "작성창에서 F12 콘솔에 Ctrl+V 후 Enter를 치면 1클릭 복제가 완료됩니다" 안내 토스트 출력
 *
 * 2. 이미 /wms/checkJournal/form/2 화면 안에서 런처를 실행했다면:
 *    - 과거 6개월 일지를 즉시 인페이지에서 조회하여 모달 표시 후 Grid 1(22개 장비)에 1클릭 조치내역 복제 주입
 */

export const UNIFIED_JOURNAL_IMPORTER_JS = `
    // ==========================================
    // 9. 모드 6: 점검일지 조치내역 스마트 복제
    // ==========================================
    async function runJournalImporterProcess() {
        const curPath = window.location.pathname || '';
        const selectedList = Array.from(selectedSet);
        const targetSiteId = selectedList[0] || $('#SITE_ID').val() || 'S01006';
        const matchedSt = ALL_STATIONS.find(s => s.value === targetSiteId) || { name: '선택 측정소', typeCode: '1' };
        const currentSiteName = matchedSt.name || matchedSt.label || '선택 측정소';
        const currentSiteType = matchedSt.typeCode || '1';
        const currentRiverId = 'R01';

        // [동작 분기 A]: 현재 WMS 점검일지 작성 페이지가 아닌 경우 (예: 측정자료 조회 등 타 페이지에서 실행)
        if (!curPath.includes('/checkJournal/form/2')) {
            // 주입할 전용 매크로 스크립트 코드 생성
            const macroCode = \`(async () => {
    const targetSiteId = '\${targetSiteId}';
    const targetSiteName = '\${currentSiteName}';
    const targetSiteType = '\${currentSiteType}';
    const targetRiverId = '\${currentRiverId}';

    if (!location.href.includes('/checkJournal/form/2')) {
        alert('⚠️ WMS 운영점검일지 작성 페이지(/wms/checkJournal/form/2)에서 실행해 주세요.');
        return;
    }

    try {
        let currentSiteId = $('#SITE_ID').val();
        if (!currentSiteId || currentSiteId === '') {
            currentSiteId = targetSiteId;
            $('#MSRSTN_SE_CD').val(targetSiteType);
            $('#RIVER_ID').val(targetRiverId);
            $('#SITE_ID').val(currentSiteId).trigger('change');
        }

        const currentSiteName = $('#SITE_ID option:selected').text().trim() || targetSiteName;
        const currentSiteTypeVal = $('#MSRSTN_SE_CD').val() || targetSiteType;
        const currentRiverIdVal = $('#RIVER_ID').val() || targetRiverId;

        const modalId = 'wms-journal-picker-modal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        const pastStart = d.toISOString().split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];

        console.log('%c[WMS Journal]', 'color:#2563eb;font-weight:bold;', \\\`과거 일지 조회 중... (\\\${currentSiteName})\\\`);

        const listRes = await fetch('/wms/checkJournal/listAjax', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                pMsrstnSeCd: currentSiteTypeVal,
                pRiverId: currentRiverIdVal,
                pSiteId: currentSiteId,
                pDay: pastStart,
                pDay2: todayStr,
                rptGubuns: '',
                pOperatorName: '',
                pRptStat: ''
            })
        });

        const listData = await listRes.json();
        const rows = (listData && listData.list) ? listData.list : [];
        if (rows.length === 0) {
            alert('최근 6개월간 작성된 일지가 없습니다.');
            return;
        }

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.style.cssText = 'position:fixed;top:60px;right:30px;width:440px;max-width:calc(100vw - 40px);max-height:82vh;background:#ffffff;color:#0f172a;border-radius:16px;box-shadow:0 20px 40px -10px rgba(0,0,0,0.3);z-index:9999999;display:flex;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:13px;animation:wmsSlideIn 0.25s ease-out;';

        const gubunBadges = {
            '199': { label: '일상', bg: '#dcfce7', text: '#15803d' },
            '200': { label: '주간', bg: '#dbeafe', text: '#1d4ed8' },
            '201': { label: '월간', bg: '#f3e8ff', text: '#7e22ce' },
            '203': { label: '긴급', bg: '#ffe4e6', text: '#be123c' }
        };

        const itemsHtml = rows.map((r, idx) => {
            const raw = r.RPT_DATE || '';
            const fmt = raw.length === 8 ? \\\`\\\${raw.substr(0,4)}-\\\${raw.substr(4,2)}-\\\${raw.substr(6,2)}\\\` : raw;
            const b = gubunBadges[r.RPT_GUBUN] || { label: r.RPT_GUBUN_NM || '일반', bg: '#f1f5f9', text: '#475569' };
            return \\\`
                <div class="wms-journal-item" data-idx="\\\${idx}" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;margin-bottom:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;cursor:pointer;transition:all 0.15s ease;">
                    <div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-weight:700;font-size:14px;color:#0f172a;">\\\${fmt}</span>
                            <span style="font-size:11px;font-weight:700;padding:2px 7px;border-radius:6px;background:\\\${b.bg};color:\\\${b.text};">\\\${b.label}</span>
                        </div>
                        <span style="font-size:11px;color:#64748b;">점검자: <b>\\\${r.OPERATOR_NAME || '미기재'}</b></span>
                    </div>
                    <button type="button" style="padding:6px 12px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;pointer-events:none;">불러오기</button>
                </div>
            \\\`;
        }).join('');

        modal.innerHTML = \\\`
            <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:#1e293b;color:#ffffff;">
                <div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span>📋</span>
                        <b style="font-size:15px;">\\\${currentSiteName} (\\\${currentSiteId})</b>
                    </div>
                    <span style="font-size:11px;color:#94a3b8;">불러올 과거 일자를 클릭하세요 (총 \\\${rows.length}건)</span>
                </div>
                <button id="wms-picker-close-btn" type="button" style="background:transparent;border:none;color:#94a3b8;font-size:20px;cursor:pointer;line-height:1;">✕</button>
            </div>
            <div style="padding:10px 16px;background:#eff6ff;border-bottom:1px solid #dbeafe;color:#1e40af;font-size:11px;">
                💡 <b>안내:</b> 클릭 시 22개 전체 장비 로드 후 제목 매칭 복제되며, <u>점검시각과 그리드 2는 보존</u>됩니다.
            </div>
            <div style="flex:1;overflow-y:auto;padding:12px 16px;max-height:55vh;">
                \\\${itemsHtml}
            </div>
        \\\`;

        document.body.appendChild(modal);
        document.getElementById('wms-picker-close-btn').onclick = () => modal.remove();

        modal.querySelectorAll('.wms-journal-item').forEach(itemEl => {
            itemEl.onclick = async () => {
                const idx = parseInt(itemEl.getAttribute('data-idx'), 10);
                const target = rows[idx];
                if (!target) return;

                itemEl.style.opacity = '0.5';
                itemEl.style.pointerEvents = 'none';

                try {
                    const g1Res = await fetch('/wms/checkJournal/modifyGrid1/listAjax', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            RPT_SEQ: target.RPT_SEQ,
                            SITE_ID: currentSiteId,
                            RPT_DATE: (target.RPT_DATE || '').replace(/-/g, '')
                        })
                    });
                    const g1Data = await g1Res.json();
                    const pastGrid1 = g1Data.list || [];

                    if (!window.dataProvider || dataProvider.getRowCount() < 20) {
                        if (typeof loadData === 'function' && window.grdMain && window.dataProvider) {
                            await new Promise(resolve => {
                                loadData(
                                    grdMain, dataProvider,
                                    { RPT_SEQ: '', SITE_ID: currentSiteId, RPT_DATE: ($('#RPT_DATE').val() || '').replace(/-/g, '') },
                                    '/wms/checkJournal/writeGrid1/listAjax',
                                    window.beCustiomFun1,
                                    function(d) {
                                        if (typeof window.afCustiomFun1 === 'function') {
                                            try { window.afCustiomFun1(d); } catch(e){}
                                        }
                                        resolve(true);
                                    }
                                );
                            });
                            await new Promise(r => setTimeout(r, 200));
                        }
                    }

                    let copiedCount = 0;
                    if (window.dataProvider && window.grdMain) {
                        const rowCount = dataProvider.getRowCount();
                        for (let i = 0; i < rowCount; i++) {
                            const curMsr = (dataProvider.getValue(i, 'MSR_NAME') || '').trim();
                            const curDev = (dataProvider.getValue(i, 'DEVICE_NAME') || '').trim();

                            const matched = pastGrid1.find(p => {
                                const pMsr = (p.MSR_NAME || '').trim();
                                const pDev = (p.DEVICE_NAME || '').trim();
                                return (pMsr && curMsr && pMsr === curMsr) && (pDev && curDev && pDev === curDev);
                            }) || pastGrid1.find(p => {
                                const pMsr = (p.MSR_NAME || '').trim();
                                return pMsr && curMsr && pMsr === curMsr;
                            });

                            if (matched) {
                                if (matched.FAULT_MANAGEMENT) {
                                    dataProvider.setValue(i, 'FAULT_MANAGEMENT', matched.FAULT_MANAGEMENT);
                                    copiedCount++;
                                }
                                if (matched.REMARK) dataProvider.setValue(i, 'REMARK', matched.REMARK);
                                if (matched.FAULT_CAUSE) dataProvider.setValue(i, 'FAULT_CAUSE', matched.FAULT_CAUSE);
                            }
                        }
                        grdMain.commit();
                        if (typeof grdMain.refresh === 'function') grdMain.refresh();
                    }

                    if (target.OPERATOR_NAME) $('#OPERATOR_NAME').val(target.OPERATOR_NAME);

                    modal.remove();
                    const toast = document.createElement('div');
                    toast.style.cssText = 'position:fixed;top:24px;right:24px;z-index:9999999;background:#1e293b;color:#ffffff;padding:14px 20px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.3);font-family:sans-serif;font-size:13px;border:1px solid #334155;animation:wmsSlideIn 0.25s ease-out;';
                    toast.innerHTML = '<b style="color:#38bdf8;">✨ 조치내역 ' + copiedCount + '건 복제 완료!</b><br/><span style="font-size:11px;color:#94a3b8;">점검시각과 그리드 2는 보존되었습니다.</span>';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 2500);
                } catch(err) {
                    alert('조치내역 복제 실패: ' + err.message);
                    itemEl.style.opacity = '1';
                    itemEl.style.pointerEvents = 'auto';
                }
            };
        });
    } catch(err) {
        alert('일지 조회 실패: ' + err.message);
    }
})();\`;

            // 클립보드 복사 실행
            let copySuccess = false;
            try {
                if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                    await navigator.clipboard.writeText(macroCode);
                    copySuccess = true;
                }
            } catch(e) {}

            if (!copySuccess) {
                const ta = document.createElement('textarea');
                ta.value = macroCode;
                ta.style.position = 'fixed';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.select();
                try {
                    document.execCommand('copy');
                    copySuccess = true;
                } catch(e) {}
                ta.remove();
            }

            // WMS 점검일지 신규 작성 창 열기
            window.open('/wms/checkJournal/form/2?pMENUMST_ID=10328', '_blank');

            // 사용자 알림 표시
            alert(
                '📋 [' + currentSiteName + '] 점검일지 복제 코드가 클립보드에 복사되었습니다!\\n\\n' +
                '새로 열린 [운영점검일지 작성] 페이지에서:\\n' +
                '1. F12 키를 눌러 개발자 도구 (Console) 열기\\n' +
                '2. Ctrl + V (붙여넣기) 후 Enter 실행\\n' +
                '3. 과거 일지 목록 팝업에서 원하는 날짜 클릭 (1클릭 복제 완료)'
            );
            return;
        }

        // [동작 분기 B]: 이미 WMS 점검일지 작성 페이지(/wms/checkJournal/form/2) 안에 있는 경우
        // 런처 모달을 잠시 숨김 (WMS 화면 뒤의 일지 선택 팝업에 집중하도록)
        overlay.style.display = 'none';

        const journalModalId = 'wms-journal-picker-modal';
        const existing = document.getElementById(journalModalId);
        if (existing) existing.remove();

        // 1. 측정소 자동 세팅
        if (targetSiteId) {
            $('#MSRSTN_SE_CD').val(currentSiteType);
            $('#RIVER_ID').val(currentRiverId);
            $('#SITE_ID').val(targetSiteId).trigger('change');
        }

        // 과거 6개월 일지 조회
        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        const pastStart = d.toISOString().split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];

        console.log('%c[WMS Journal]', 'color:#2563eb;font-weight:bold;', \`과거 일지 조회 중... (\${currentSiteName})\`);

        try {
            const listRes = await fetch('/wms/checkJournal/listAjax', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    pMsrstnSeCd: currentSiteType,
                    pRiverId: currentRiverId,
                    pSiteId: targetSiteId,
                    pDay: pastStart,
                    pDay2: todayStr,
                    rptGubuns: '',
                    pOperatorName: '',
                    pRptStat: ''
                })
            });

            const listData = await listRes.json();
            const rows = (listData && listData.list) ? listData.list : [];
            console.log('%c[WMS Journal]', 'color:#16a34a;font-weight:bold;', \`조회 완료: 총 \${rows.length}개 일지 수신\`);

            if (rows.length === 0) {
                alert('최근 6개월간 작성된 점검일지가 없습니다.');
                overlay.style.display = 'flex';
                return;
            }

            // 플로팅 모달 생성 (Nordic M3 Dark / Light 적응형)
            const jModal = document.createElement('div');
            jModal.id = journalModalId;
            const isDark = document.getElementById('wms-instant-card')?.classList.contains('wms-dark') || 
                window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            jModal.style.cssText = [
                'position: fixed', 'top: 60px', 'right: 30px', 'width: 440px',
                'max-width: calc(100vw - 40px)', 'max-height: 82vh',
                isDark ? 'background: #111115; color: #f4f4f5; border: 1px solid #222228; box-shadow: 0 20px 50px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06);' : 'background: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3);',
                'border-radius: 16px', 'z-index: 9999999', 'display: flex', 'flex-direction: column', 'overflow: hidden',
                'font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif', 'font-size: 13px',
                'animation: wmsFadeIn 0.25s ease-out'
            ].join(';');

            const gubunBadges = {
                '199': { label: '일상', bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#dcfce7', text: isDark ? '#34d399' : '#15803d' },
                '200': { label: '주간', bg: isDark ? 'rgba(37, 99, 235, 0.15)' : '#dbeafe', text: isDark ? '#60a5fa' : '#1d4ed8' },
                '201': { label: '월간', bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#f3e8ff', text: isDark ? '#c4b5fd' : '#7e22ce' },
                '203': { label: '긴급', bg: isDark ? 'rgba(244, 63, 94, 0.15)' : '#ffe4e6', text: isDark ? '#fb7185' : '#be123c' }
            };

            const itemsHtml = rows.map((r, idx) => {
                const raw = r.RPT_DATE || '';
                const fmt = raw.length === 8 ? \`\${raw.substr(0,4)}-\${raw.substr(4,2)}-\${raw.substr(6,2)}\` : raw;
                const b = gubunBadges[r.RPT_GUBUN] || { label: r.RPT_GUBUN_NM || '일반', bg: '#f1f5f9', text: '#475569' };
                return \`
                    <div class="wms-journal-item" data-idx="\${idx}" style="
                        display: flex; align-items: center; justify-content: space-between;
                        padding: 12px 14px; margin-bottom: 8px; background: #f8fafc;
                        border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.15s ease;
                    ">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-weight: 700; font-size: 14px; color: #0f172a;">\${fmt}</span>
                                <span style="font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 6px; background: \${b.bg}; color: \${b.text};">\${b.label}</span>
                            </div>
                            <span style="font-size: 11px; color: #64748b;">점검자: <b>\${r.OPERATOR_NAME || '미기재'}</b></span>
                        </div>
                        <button type="button" style="padding: 6px 12px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; pointer-events: none;">
                            불러오기
                        </button>
                    </div>
                \`;
            }).join('');

            jModal.innerHTML = \`
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: #1e293b; color: #ffffff;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span>📋</span>
                            <b style="font-size: 15px;">\${currentSiteName} (\${targetSiteId})</b>
                        </div>
                        <span style="font-size: 11px; color: #94a3b8;">불러올 과거 일자를 클릭하세요 (총 \${rows.length}건)</span>
                    </div>
                    <button id="wms-jmodal-close" type="button" style="background: transparent; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; line-height: 1;">✕</button>
                </div>
                <div style="padding: 10px 16px; background: #eff6ff; border-bottom: 1px solid #dbeafe; color: #1e40af; font-size: 11px;">
                    💡 <b>안내:</b> 클릭 시 22개 전체 장비 로드 후 제목 매칭 복제되며, <u>점검시각과 그리드 2는 보존</u>됩니다.
                </div>
                <div style="flex: 1; overflow-y: auto; padding: 12px 16px; max-height: 55vh;">
                    \${itemsHtml}
                </div>
            \`;

            document.body.appendChild(jModal);

            const handleCloseJModal = () => {
                jModal.remove();
                overlay.style.display = 'flex'; // 런처 모달 다시 표시
            };

            document.getElementById('wms-jmodal-close').onclick = handleCloseJModal;

            // 과거 일지 클릭 시 1:1 조치내역 주입
            jModal.querySelectorAll('.wms-journal-item').forEach(itemEl => {
                itemEl.onclick = async () => {
                    const idx = parseInt(itemEl.getAttribute('data-idx'), 10);
                    const target = rows[idx];
                    if (!target) return;

                    itemEl.style.opacity = '0.5';
                    itemEl.style.pointerEvents = 'none';

                    try {
                        const g1Res = await fetch('/wms/checkJournal/modifyGrid1/listAjax', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                                RPT_SEQ: target.RPT_SEQ,
                                SITE_ID: targetSiteId,
                                RPT_DATE: (target.RPT_DATE || '').replace(/-/g, '')
                            })
                        });
                        const g1Data = await g1Res.json();
                        const pastGrid1 = g1Data.list || [];

                        // 신규 서식의 Grid 1 행 개수가 20개 미만이면 22개 전체 장비 행 로드
                        if (!window.dataProvider || dataProvider.getRowCount() < 20) {
                            if (typeof loadData === 'function' && window.grdMain && window.dataProvider) {
                                console.log('%c[WMS Journal]', 'color:#2563eb;', '전체 22개 장비 서식 로딩 중...');
                                await new Promise(resolve => {
                                    loadData(
                                        grdMain, dataProvider,
                                        { RPT_SEQ: '', SITE_ID: targetSiteId, RPT_DATE: ($('#RPT_DATE').val() || '').replace(/-/g, '') },
                                        '/wms/checkJournal/writeGrid1/listAjax',
                                        window.beCustiomFun1,
                                        function(d) {
                                            if (typeof window.afCustiomFun1 === 'function') {
                                                try { window.afCustiomFun1(d); } catch(e){}
                                            }
                                            resolve(true);
                                        }
                                    );
                                });
                                await new Promise(r => setTimeout(r, 200));
                            }
                        }

                        // Grid 1 순회하며 제목(장비명 + 측정항목) 기준으로 조치내역 1:1 매핑
                        let copiedCount = 0;
                        if (window.dataProvider && window.grdMain) {
                            const rowCount = dataProvider.getRowCount();
                            for (let i = 0; i < rowCount; i++) {
                                const curMsr = (dataProvider.getValue(i, 'MSR_NAME') || '').trim();
                                const curDev = (dataProvider.getValue(i, 'DEVICE_NAME') || '').trim();

                                const matched = pastGrid1.find(p => {
                                    const pMsr = (p.MSR_NAME || '').trim();
                                    const pDev = (p.DEVICE_NAME || '').trim();
                                    return (pMsr && curMsr && pMsr === curMsr) && (pDev && curDev && pDev === curDev);
                                }) || pastGrid1.find(p => {
                                    const pMsr = (p.MSR_NAME || '').trim();
                                    return pMsr && curMsr && pMsr === curMsr;
                                });

                                if (matched) {
                                    if (matched.FAULT_MANAGEMENT) {
                                        dataProvider.setValue(i, 'FAULT_MANAGEMENT', matched.FAULT_MANAGEMENT);
                                        copiedCount++;
                                    }
                                    if (matched.REMARK) {
                                        dataProvider.setValue(i, 'REMARK', matched.REMARK);
                                    }
                                    if (matched.FAULT_CAUSE) {
                                        dataProvider.setValue(i, 'FAULT_CAUSE', matched.FAULT_CAUSE);
                                    }
                                }
                            }
                            grdMain.commit();
                            if (typeof grdMain.refresh === 'function') grdMain.refresh();
                        }

                        if (target.OPERATOR_NAME) {
                            $('#OPERATOR_NAME').val(target.OPERATOR_NAME);
                        }

                        jModal.remove();
                        const toast = document.createElement('div');
                        toast.style.cssText = 'position:fixed;top:24px;right:24px;z-index:9999999;background:#1e293b;color:#ffffff;padding:14px 20px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.3);font-family:sans-serif;font-size:13px;border:1px solid #334155;';
                        toast.innerHTML = '<b style="color:#38bdf8;">✨ 조치내역 ' + copiedCount + '건 복제 완료!</b><br/><span style="font-size:11px;color:#94a3b8;">점검시각과 그리드 2는 보존되었습니다.</span>';
                        document.body.appendChild(toast);
                        setTimeout(() => toast.remove(), 2500);
                        overlay.remove(); // 작업 완료 시 런처 닫기

                    } catch (err) {
                        console.error('[WMS Journal] 조치내역 복제 실패:', err);
                        alert('조치내역 복제 중 오류 발생: ' + err.message);
                        itemEl.style.opacity = '1';
                        itemEl.style.pointerEvents = 'auto';
                    }
                };
            });

        } catch (outerErr) {
            console.error('[WMS Journal] 일지 목록 조회 실패:', outerErr);
            alert('일지 목록을 가져오는 중 오류가 발생했습니다: ' + outerErr.message);
            overlay.style.display = 'flex';
        }
    }
`;
