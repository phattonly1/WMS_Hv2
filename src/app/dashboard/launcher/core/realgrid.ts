/**
 * src/app/analysis/launchers/core/realgrid.ts
 * WMS RealGrid 객체 탐색, 로딩 대기, 행 데이터 추출 전용 모듈
 */

export const LAUNCHER_REALGRID_JS = `
    // RealGrid 시계열 그리드 전역 객체 스캐너 (Fast-Path 및 캐시 적용)
    let _cachedGridCtx = null;

    const findTimeSeriesGrid = (customWin) => {
        const win = customWin || (activeWorkerCtx ? activeWorkerCtx.win : window);
        if (!win) return { dp: null, gv: null, count: 0 };

        // 1. Fast-Path 캐시 검증: 이미 캐시된 인스턴스가 여전히 유효하고 동일 window인 경우
        if (_cachedGridCtx && _cachedGridCtx.win === win && _cachedGridCtx.dp) {
            try {
                if (typeof _cachedGridCtx.dp.getRowCount === 'function') {
                    const rowCount = _cachedGridCtx.dp.getRowCount();
                    return { dp: _cachedGridCtx.dp, gv: _cachedGridCtx.gv, count: rowCount };
                }
            } catch(e) {
                _cachedGridCtx = null;
            }
        }

        // 2. Fast-Path 관례적 변수명 우선 탐색 (Object.keys 전수 스캔 비용 방지)
        const knownDp = win.dataProvider || win.dataProvider1 || win.dp;
        const knownGv = win.gridView || win.gridView1 || win.gv;
        if (knownDp && typeof knownDp.getRowCount === 'function') {
            try {
                const count = knownDp.getRowCount();
                if (count > 0 || (knownGv && typeof knownGv.getDataSource === 'function')) {
                    _cachedGridCtx = { win, dp: knownDp, gv: knownGv || null };
                    return { dp: knownDp, gv: knownGv || null, count };
                }
            } catch(e) {}
        }

        // 3. Fallback: 전수 스캐너
        let bestDp = null;
        let bestGv = null;
        let maxCount = -1;

        const dpCandidates = [];
        const gvCandidates = [];

        try {
            const keys = Object.keys(win);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                try {
                    const val = win[key];
                    if (val && typeof val === 'object') {
                        if (typeof val.getJsonRows === 'function' && typeof val.getRowCount === 'function') {
                            dpCandidates.push({ name: key, dp: val });
                        }
                        if (typeof val.getDataSource === 'function' && typeof val.getColumns === 'function') {
                            gvCandidates.push({ name: key, gv: val });
                        }
                    }
                } catch(e) {}
            }
        } catch(e) {}

        dpCandidates.forEach(cand => {
            try {
                const cnt = cand.dp.getRowCount();
                if (cnt > maxCount) {
                    maxCount = cnt;
                    bestDp = cand.dp;
                }
            } catch(e) {}
        });

        gvCandidates.forEach(cand => {
            try {
                const ds = cand.gv.getDataSource();
                if (ds && typeof ds.getRowCount === 'function') {
                    const cnt = ds.getRowCount();
                    if (cnt > maxCount) {
                        maxCount = cnt;
                        bestDp = ds;
                        bestGv = cand.gv;
                    }
                }
            } catch(e) {}
        });

        if (!bestGv && bestDp) {
            gvCandidates.forEach(cand => {
                try {
                    if (cand.gv.getDataSource() === bestDp) bestGv = cand.gv;
                } catch(e) {}
            });
        }

        if (!bestDp && typeof win.dataProvider !== 'undefined') bestDp = win.dataProvider;
        if (!bestGv && typeof win.gridView !== 'undefined') bestGv = win.gridView;

        const count = maxCount >= 0 ? maxCount : (bestDp?.getRowCount?.() || 0);
        if (bestDp) {
            _cachedGridCtx = { win, dp: bestDp, gv: bestGv };
        }
        return { dp: bestDp, gv: bestGv, count };
    };

    const waitForGridData = async (maxWait = 25000) => {
        const targetDoc = activeWorkerCtx ? activeWorkerCtx.doc : document;
        let waited = 0;
        await delay(1000);
        waited += 1000;

        while (waited < maxWait) {
            if (cancelRequested) return false;
            const loading = targetDoc.querySelector('#viewLoading, .loading, #loading, .load_wrap');
            const isLoading = loading && loading.style.display !== 'none' && !loading.classList.contains('hidden');
            if (isLoading) {
                await delay(500);
                waited += 500;
                continue;
            }
            const { count } = findTimeSeriesGrid();
            if (count > 0) {
                await delay(600);
                return true;
            }
            await delay(400);
            waited += 400;
        }
        return false;
    };

    const extractRowsFromRealGrid = () => {
        const { dp, gv } = findTimeSeriesGrid();
        if (!dp) return { rows: [], gv: null };
        if (typeof dp.getJsonRows === 'function') {
            try {
                const r = dp.getJsonRows(0, -1);
                if (r && r.length > 0) return { rows: r, gv };
            } catch(e) {}
        }
        if (typeof dp.getRows === 'function') {
            try {
                const r = dp.getRows(0, -1);
                if (r && r.length > 0) {
                    const fields = (typeof dp.getFieldNames === 'function') ? dp.getFieldNames() : [];
                    const rows = r.map(rowArr => {
                        if (!Array.isArray(rowArr)) return rowArr;
                        const obj = {};
                        rowArr.forEach((val, fIdx) => {
                            const fn = fields[fIdx] || ('fld_' + fIdx);
                            obj[fn] = val;
                        });
                        return obj;
                    });
                    return { rows, gv };
                }
            } catch(e) {}
        }
        return { rows: [], gv };
    };
`;
