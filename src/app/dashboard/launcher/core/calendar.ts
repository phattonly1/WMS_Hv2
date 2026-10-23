/**
 * src/app/analysis/launchers/core/calendar.ts
 * 2개월 인라인 캘린더 엔진 & 빠른 선택 프리셋 단일 관리 모듈
 */

export const LAUNCHER_CALENDAR_JS = `
    // 인라인 캘린더 생성기 (Double-Month Inline Calendar Engine)
    const createInlineCalendar = (container, initialStart, initialEnd, onRangeChange) => {
        if (!container) return { setRange: () => {} };
        container.innerHTML = '';
        container.className = 'wms-inline-cal-box';

        const parseParts = (str) => {
            const [y, m, d] = str.split('-').map(Number);
            return { y, m: m - 1, d };
        };

        const now = new Date();
        const baseYear = now.getFullYear();
        const baseMonth = now.getMonth();

        const sInit = parseParts(initialStart);
        let viewYear = sInit.y;
        let viewMonth = sInit.m;

        let startStr = initialStart;
        let endStr = initialEnd;
        let isSelectingEnd = false;
        let hoverStr = null;

        const render = () => {
            const y1 = viewYear;
            const m1 = viewMonth;
            const y2 = (m1 === 11) ? y1 + 1 : y1;
            const m2 = (m1 === 11) ? 0 : m1 + 1;

            container.innerHTML = \`
                <div class="wms-cal-double-grid">
                    <div class="wms-cal-month-pane" id="wms-cal-pane-1">
                        <div class="wms-cal-month-header">
                            <button type="button" class="wms-cal-nav-btn" id="wms-cal-prev-btn" title="이전 달">◀</button>
                            <span class="wms-cal-title">\${y1}년 \${String(m1 + 1).padStart(2, '0')}월</span>
                            <span style="width:26px;"></span>
                        </div>
                        <div class="wms-cal-weekdays">
                            <span class="wms-cal-sun">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span class="wms-cal-sat">토</span>
                        </div>
                        <div class="wms-cal-grid" id="wms-cal-grid-1"></div>
                    </div>
                    <div class="wms-cal-month-pane" id="wms-cal-pane-2">
                        <div class="wms-cal-month-header">
                            <span style="width:26px;"></span>
                            <span class="wms-cal-title">\${y2}년 \${String(m2 + 1).padStart(2, '0')}월</span>
                            <button type="button" class="wms-cal-nav-btn" id="wms-cal-next-btn" title="다음 달">▶</button>
                        </div>
                        <div class="wms-cal-weekdays">
                            <span class="wms-cal-sun">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span class="wms-cal-sat">토</span>
                        </div>
                        <div class="wms-cal-grid" id="wms-cal-grid-2"></div>
                    </div>
                </div>
            \`;

            container.querySelector('#wms-cal-prev-btn').onclick = (e) => {
                e.stopPropagation();
                if (viewMonth === 0) {
                    viewMonth = 11;
                    viewYear--;
                } else {
                    viewMonth--;
                }
                render();
            };

            container.querySelector('#wms-cal-next-btn').onclick = (e) => {
                e.stopPropagation();
                if (viewMonth === 11) {
                    viewMonth = 0;
                    viewYear++;
                } else {
                    viewMonth++;
                }
                render();
            };

            const fillMonthGrid = (gridEl, y, m) => {
                const firstDay = new Date(y, m, 1).getDay();
                const lastDate = new Date(y, m + 1, 0).getDate();
                const prevLastDate = new Date(y, m, 0).getDate();

                for (let i = firstDay - 1; i >= 0; i--) {
                    const cell = document.createElement('div');
                    cell.className = 'wms-cal-cell wms-cal-other';
                    cell.innerHTML = \`<span class="wms-cal-cell-inner">\${prevLastDate - i}</span>\`;
                    gridEl.appendChild(cell);
                }

                const todayStr = fmtDate(now);

                for (let d = 1; d <= lastDate; d++) {
                    const dateStr = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
                    const dow = new Date(y, m, d).getDay();

                    const cell = document.createElement('div');
                    let cls = 'wms-cal-cell';
                    if (dow === 0) cls += ' wms-cal-sun';
                    if (dow === 6) cls += ' wms-cal-sat';

                    let effStart = startStr;
                    let effEnd = endStr;
                    if (isSelectingEnd && hoverStr) {
                        if (hoverStr < startStr) {
                            effStart = hoverStr;
                            effEnd = startStr;
                        } else {
                            effEnd = hoverStr;
                        }
                    }

                    const isSingle = effStart === effEnd && effStart === dateStr;
                    const isStart = effStart === dateStr;
                    const isEnd = effEnd === dateStr;
                    const inRange = effStart && effEnd && (dateStr > effStart && dateStr < effEnd);

                    if (isSingle) {
                        cls += ' wms-cal-range-single';
                    } else if (isStart) {
                        cls += ' wms-cal-range-start';
                    } else if (isEnd) {
                        cls += ' wms-cal-range-end';
                    } else if (inRange) {
                        cls += ' wms-cal-in-range';
                    }

                    cell.className = cls;
                    cell.innerHTML = \`<span class="wms-cal-cell-inner">\${d}</span>\` + (dateStr === todayStr ? '<span class="wms-cal-today-dot"></span>' : '');

                    cell.onclick = (e) => {
                        e.stopPropagation();
                        if (!isSelectingEnd) {
                            startStr = dateStr;
                            endStr = dateStr;
                            isSelectingEnd = true;
                            hoverStr = dateStr;
                            render();
                            if (typeof onRangeChange === 'function') onRangeChange(startStr, endStr, true);
                        } else {
                            if (dateStr < startStr) {
                                endStr = startStr;
                                startStr = dateStr;
                            } else {
                                endStr = dateStr;
                            }
                            isSelectingEnd = false;
                            hoverStr = null;
                            render();
                            if (typeof onRangeChange === 'function') onRangeChange(startStr, endStr, false);
                        }
                    };

                    cell.onmouseenter = () => {
                        if (isSelectingEnd && hoverStr !== dateStr) {
                            hoverStr = dateStr;
                            render();
                        }
                    };

                    gridEl.appendChild(cell);
                }

                const totalCells = firstDay + lastDate;
                const targetTotal = totalCells > 35 ? 42 : 35;
                const remaining = targetTotal - totalCells;
                for (let d = 1; d <= remaining; d++) {
                    const cell = document.createElement('div');
                    cell.className = 'wms-cal-cell wms-cal-other';
                    cell.innerHTML = \`<span class="wms-cal-cell-inner">\${d}</span>\`;
                    gridEl.appendChild(cell);
                }
            };

            fillMonthGrid(container.querySelector('#wms-cal-grid-1'), y1, m1);
            fillMonthGrid(container.querySelector('#wms-cal-grid-2'), y2, m2);
        };

        render();

        return {
            setRange: (newStart, newEnd) => {
                startStr = newStart;
                endStr = newEnd;
                isSelectingEnd = false;
                hoverStr = null;

                const sp = parseParts(startStr);
                const curM2 = (viewMonth + 1) % 12;
                const curY2 = (viewMonth === 11 ? viewYear + 1 : viewYear);

                const inCurrentView = (sp.y === viewYear && sp.m === viewMonth) || (sp.y === curY2 && sp.m === curM2);
                if (!inCurrentView) {
                    if (sp.m === now.getMonth() && sp.y === now.getFullYear()) {
                        viewYear = baseYear;
                        viewMonth = baseMonth;
                    } else {
                        viewYear = sp.y;
                        viewMonth = sp.m;
                    }
                }
                render();
            }
        };
    };
`;
