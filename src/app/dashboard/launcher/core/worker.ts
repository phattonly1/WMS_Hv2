/**
 * src/app/analysis/launchers/core/worker.ts
 * WMS 백그라운드 워커 창(Worker Context) 및 폼 컨트롤 조작 헬퍼
 */

export const LAUNCHER_WORKER_JS = `
    let sharedWorkerWin = null;
    let sharedWorkerCleanupBypass = null;
    let activeWorkerCtx = { win: window, doc: document, $: window.$ || window.jQuery, isWorker: false };

    const waitForConditionInWin = async (checkFn, maxWaitMs = 15000, stepMs = 300) => {
        let elapsed = 0;
        while (elapsed < maxWaitMs) {
            try { if (checkFn()) return true; } catch(e) {}
            await delay(stepMs);
            elapsed += stepMs;
        }
        return false;
    };

    const cleanupWorkerWindow = () => {
        if (typeof sharedWorkerCleanupBypass === 'function') {
            try { sharedWorkerCleanupBypass(); } catch(e) {}
            sharedWorkerCleanupBypass = null;
        }
        if (sharedWorkerWin && !sharedWorkerWin.closed) {
            try { sharedWorkerWin.close(); } catch(e) {}
            sharedWorkerWin = null;
        }
        activeWorkerCtx = { win: window, doc: document, $: window.$ || window.jQuery, isWorker: false };
        try { window.focus(); } catch(e) {}
    };

    const getWorkerContext = async (targetUrl, menuId, statusLabel = '화면 연동 중...') => {
        const curPath = window.location.pathname || '';
        const curSearch = window.location.search || '';
        const curMenuId = new URLSearchParams(curSearch).get('pMENUMST_ID') || '';
        const targetPathPart = targetUrl ? targetUrl.split('?')[0] : '';

        const isCurrentPage = (menuId && curMenuId === menuId) || (targetPathPart && curPath.includes(targetPathPart));
        if (isCurrentPage) {
            activeWorkerCtx = { win: window, doc: document, $: window.$ || window.jQuery, isWorker: false };
            return activeWorkerCtx;
        }

        const progText = document.getElementById('wms-prog-text');
        if (progText) progText.textContent = \`[고속 워커] \${statusLabel} 로딩 중...\`;

        if (sharedWorkerWin && !sharedWorkerWin.closed) {
            try {
                const wHref = sharedWorkerWin.location.href || '';
                const wSearch = sharedWorkerWin.location.search || '';
                const wMenuId = new URLSearchParams(wSearch).get('pMENUMST_ID') || '';
                const matchesTarget = (menuId && wMenuId === menuId) || (targetPathPart && wHref.includes(targetPathPart));
                if (matchesTarget && sharedWorkerWin.document && sharedWorkerWin.document.readyState === 'complete') {
                    sharedWorkerWin.focus();
                    activeWorkerCtx = {
                        win: sharedWorkerWin,
                        doc: sharedWorkerWin.document,
                        $: sharedWorkerWin.$ || sharedWorkerWin.jQuery,
                        isWorker: true
                    };
                    return activeWorkerCtx;
                }
            } catch(e) {}
        }

        if (typeof sharedWorkerCleanupBypass === 'function') {
            try { sharedWorkerCleanupBypass(); } catch(e) {}
            sharedWorkerCleanupBypass = null;
        }

        const width = 1280;
        const height = 900;
        const left = Math.max(0, (window.screen.width - width) / 2);
        const top = Math.max(0, (window.screen.height - height) / 2);

        sharedWorkerWin = window.open(
            targetUrl,
            'wms_smart_worker_window',
            \`width=\${width},height=\${height},top=\${top},left=\${left},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no\`
        );

        if (!sharedWorkerWin) {
            throw new Error('팝업 차단이 감지되었습니다. 브라우저 주소창 우측에서 팝업을 허용해주세요.');
        }

        sharedWorkerWin.focus();

        const isReady = await waitForConditionInWin(() => {
            if (!sharedWorkerWin || sharedWorkerWin.closed || !sharedWorkerWin.location) return false;
            const wHref = sharedWorkerWin.location.href || '';
            if (!wHref || wHref === 'about:blank') return false;
            const wSearch = sharedWorkerWin.location.search || '';
            const wMenuId = new URLSearchParams(wSearch).get('pMENUMST_ID') || '';
            const urlMatches = (menuId && wMenuId === menuId) || (targetPathPart && wHref.includes(targetPathPart));
            if (!urlMatches) return false;

            return sharedWorkerWin.document && 
                   sharedWorkerWin.document.readyState === 'complete' &&
                   (sharedWorkerWin.$ || sharedWorkerWin.jQuery) &&
                   sharedWorkerWin.document.querySelector('#pSiteId, #siteCd, #schSiteCd, select[name="pSiteId"], select[name="siteCd"], select[name="schSiteCd"]');
        }, 15000, 300);

        if (!isReady) {
            await delay(1500);
        }

        // 워커 창의 confirm/alert 및 조회 기간 경고 팝업 자동 우회 설정
        try {
            sharedWorkerCleanupBypass = setupPopupBypass('wms_worker_bypass', sharedWorkerWin);
            sharedWorkerWin.confirm = () => true;
            sharedWorkerWin.alert = function(msg) {
                console.log('🔇 [워커] 알림 자동 우회:', msg);
                return true;
            };
        } catch(e) {}

        activeWorkerCtx = {
            win: sharedWorkerWin,
            doc: sharedWorkerWin.document,
            $: sharedWorkerWin.$ || sharedWorkerWin.jQuery,
            isWorker: true
        };

        return activeWorkerCtx;
    };

    // 범용 input / select 값 변경 헬퍼 (activeWorkerCtx 연동)
    const setVal = async (sel, val) => {
        const targetDoc = activeWorkerCtx ? activeWorkerCtx.doc : document;
        const target$ = (activeWorkerCtx && activeWorkerCtx.$) ? activeWorkerCtx.$ : (window.$ || window.jQuery);
        const el = targetDoc.querySelector(sel);
        if (el) {
            el.value = val;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            if (target$ && target$(sel).length) {
                try { target$(sel).val(val).trigger('change'); } catch(e) {}
            }
            await delay(400);
        }
    };

    // 측정소 선택 헬퍼 (망구분 변경 및 옵션 비동기 갱신 대기 지원)
    const setStationSelect = async (station) => {
        const targetDoc = activeWorkerCtx ? activeWorkerCtx.doc : document;
        const targetWin = activeWorkerCtx ? activeWorkerCtx.win : window;
        const target$ = (activeWorkerCtx && activeWorkerCtx.$) ? activeWorkerCtx.$ : (window.$ || window.jQuery);

        // 1. 망구분 맞춤 확인
        if (station.typeCode && target$('#pMsrstnSeCd').length) {
            const curType = target$('#pMsrstnSeCd').val();
            if (curType !== station.typeCode) {
                target$('#pMsrstnSeCd').val(station.typeCode).trigger('change');
                await waitForConditionInWin(() => {
                    const sel = targetDoc.querySelector('#pSiteId, #siteCd, #schSiteCd');
                    return sel && sel.options && sel.options.length > 1;
                }, 5000, 200);
                await delay(400);
            }
        }

        const select = targetDoc.querySelector('#pSiteId') || 
                       targetDoc.querySelector('#siteCd') || 
                       targetDoc.querySelector('#schSiteCd') || 
                       targetDoc.querySelector('select[name="pSiteId"]') || 
                       targetDoc.querySelector('select[name="siteCd"]') || 
                       targetDoc.querySelector('select[name="schSiteCd"]');
        if (!select) return false;

        const options = Array.from(select.querySelectorAll('option'));
        let opt = options.find(o => o.value === station.value || o.value === station.id || o.value === station.siteId);
        if (!opt) {
            opt = options.find(o => o.text && (o.text.trim() === station.name.trim() || o.text.includes(station.name.trim())));
        }

        if (opt) {
            select.value = opt.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            if (target$ && target$(select).length) {
                try { target$(select).val(opt.value).trigger('change'); } catch(e) {}
            }
            if (typeof targetWin.fn_siteCd_change === 'function') {
                try { targetWin.fn_siteCd_change(); } catch(e) {}
            }
            // 측정소 변경 후 수질 항목 체크박스 렌더링 대기
            await delay(800);
            return true;
        }
        return false;
    };

    const selectStationOption = async (stationId) => {
        return await setStationSelect({ value: stationId, name: stationId });
    };

    // 5분 시계열 항목 체크 ('부대장비 제외' 및 '모두선택' + #device 및 그리드 checkAll)
    const checkAllItemsFor5Min = async () => {
        const targetDoc = activeWorkerCtx ? activeWorkerCtx.doc : document;
        const targetWin = activeWorkerCtx ? activeWorkerCtx.win : window;

        // 1. '부대장비 제외' 선택
        if (targetDoc.querySelector('#pDeviceGubun')) {
            await selectByText('#pDeviceGubun', '부대장비 제외');
            await delay(250);
        }

        // 2. '측정기 상태정보 표시' 체크박스 활성화
        const stateInputs = targetDoc.querySelectorAll('input[type="checkbox"]');
        for (const cb of stateInputs) {
            const parentText = cb.parentElement ? (cb.parentElement.textContent || '') : '';
            const isStateCheckbox = parentText.includes('상태정보') || 
                                    cb.id.includes('State') || cb.id.includes('Status') || 
                                    cb.name.includes('State') || cb.name.includes('Status') ||
                                    cb.id === 'pStateYn' || cb.id === 'pStatusYn';
            if (isStateCheckbox && !cb.checked) {
                cb.click();
                await delay(100);
            }
        }

        // 3. '모두선택' 버튼 클릭 (항상 확실하게 클릭 실행)
        let clickDone = false;
        const clickable = targetDoc.querySelectorAll('button, a, span, label, input[type="button"]');
        for (const el of clickable) {
            const txt = (el.textContent || el.value || '').trim();
            if (txt === '모두선택' || txt === '전체선택') {
                el.click();
                clickDone = true;
                break;
            }
        }

        // 4. 5분 시계열 #device 체크박스 클릭
        const device = targetDoc.querySelector('#device');
        if (device instanceof HTMLInputElement && !device.checked) {
            device.click();
            clickDone = true;
        }

        // 5. 그리드 checkAll fallback
        if (!clickDone && targetWin && typeof targetWin.gridView !== 'undefined' && typeof targetWin.gridView.checkAll === 'function') {
            try { targetWin.gridView.checkAll(true); } catch(e) {}
        }

        await delay(300);
        return true;
    };

    const setDateRange = async (start, end) => {
        const targetDoc = activeWorkerCtx ? activeWorkerCtx.doc : document;
        const sInput = targetDoc.querySelector('#startDate, #frDate, #fromDt, #stDate, #searchStartDt, input[name="startDate"], input[name="frDate"]');
        const eInput = targetDoc.querySelector('#endDate, #toDate, #toDt, #edDate, #searchEndDt, input[name="endDate"], input[name="toDate"]');
        if (sInput) {
            sInput.value = start;
            sInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (eInput) {
            eInput.value = end;
            eInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        await delay(200);
    };

    const checkAllWaterItems = async () => {
        return await checkAllItemsFor5Min();
    };

    const executeSearch = async () => {
        const targetDoc = activeWorkerCtx ? activeWorkerCtx.doc : document;
        const targetWin = activeWorkerCtx ? activeWorkerCtx.win : window;

        const searchBtn = targetDoc.querySelector('#searchBtn, #btn_search, .btn_search, a[onclick*="search"], button[onclick*="search"], a.btn_search, input[value="조회"]') ||
                          Array.from(targetDoc.querySelectorAll('button, a, span')).find(el => el.textContent && el.textContent.trim() === '조회');
        if (searchBtn) {
            searchBtn.click();
        } else if (typeof targetWin.loadingData === 'function') {
            targetWin.loadingData();
        } else if (typeof targetWin.fn_search === 'function') {
            targetWin.fn_search();
        } else if (typeof targetWin.searchData === 'function') {
            targetWin.searchData();
        }
        await delay(500);
    };
`;
