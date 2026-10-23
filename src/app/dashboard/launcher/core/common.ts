/**
 * src/app/analysis/launchers/core/common.ts
 * WMS 인페이지 런처 공통 유틸리티 라이브러리 (순수 유틸리티 전용)
 */

export * from "./calendar";
export * from "./excludeItems";
export * from "./realgrid";
export * from "./stations";
export * from "./statusCodes";
export * from "./styles";
export * from "./worker";

/**
 * 런처 순수 공통 유틸리티 자바스크립트 함수
 */
export const LAUNCHER_UTILS_JS = `
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const fmtDate = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const escapeHtml = (str) => String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    window.__wmsScriptPromises = window.__wmsScriptPromises || {};
    const loadScriptOnce = (url) => {
        if (window.__wmsScriptPromises[url]) return window.__wmsScriptPromises[url];
        const p = new Promise((resolve) => {
            const existing = document.querySelector('script[src="' + url + '"]');
            if (existing && existing.getAttribute('data-loaded') === 'true') {
                return resolve(true);
            }
            if (existing) existing.remove();
            const s = document.createElement('script');
            s.src = url;
            s.onload = () => {
                s.setAttribute('data-loaded', 'true');
                resolve(true);
            };
            s.onerror = () => {
                s.remove();
                delete window.__wmsScriptPromises[url];
                resolve(false);
            };
            document.head.appendChild(s);
        });
        window.__wmsScriptPromises[url] = p;
        return p;
    };

    // select 엘리먼트 텍스트 기반 선택 헬퍼 (activeWorkerCtx 자동 지원)
    const selectByText = async (selector, text) => {
        const targetDoc = (typeof activeWorkerCtx !== 'undefined' && activeWorkerCtx) ? activeWorkerCtx.doc : document;
        const target$ = (typeof activeWorkerCtx !== 'undefined' && activeWorkerCtx) ? activeWorkerCtx.$ : window.$;
        const el = targetDoc.querySelector(selector);
        if (el && el.options) {
            for (let i = 0; i < el.options.length; i++) {
                if (el.options[i].text.includes(text)) {
                    el.selectedIndex = i;
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    if (target$ && target$(selector).length) {
                        try { target$(selector).val(el.value).trigger('change'); } catch(e) {}
                    }
                    break;
                }
            }
            await delay(300);
        }
    };

    // 클립보드 복사 유틸 (TSV + HTML 표 서식)
    const copyToClipboard = (tsvText, htmlText, onSuccess) => {
        if (navigator.clipboard && window.ClipboardItem) {
            const data = [new ClipboardItem({
                'text/plain': new Blob([tsvText], { type: 'text/plain' }),
                'text/html': new Blob([htmlText || ('<pre>' + escapeHtml(tsvText) + '</pre>')], { type: 'text/html' })
            })];
            navigator.clipboard.write(data).then(() => {
                if (typeof onSuccess === 'function') onSuccess();
                else alert('📋 엑셀 양식으로 클립보드에 복사되었습니다! 엑셀에서 바로 붙여넣기(Ctrl+V) 하세요.');
            }).catch(() => fallbackCopy(tsvText, onSuccess));
        } else {
            fallbackCopy(tsvText, onSuccess);
        }
    };

    const fallbackCopy = (text, onSuccess) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        if (typeof onSuccess === 'function') onSuccess();
        else alert('📋 클립보드에 복사되었습니다!');
    };

    // CSV 다운로드 유틸 (UTF-8 BOM 포함)
    const downloadCsv = (filename, content) => {
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // 팝업 및 알림 우회 헬퍼 (메인 창 및 워커 창 모두 지원)
    const setupPopupBypass = (modalId, targetWindow = window) => {
        const targetDoc = targetWindow.document || document;
        const origConfirm = targetWindow.confirm;
        const origAlert = targetWindow.alert;
        targetWindow.confirm = function(msg) {
            // 사용자의 명시적인 런처 닫기 확인창은 우회하지 않고 사용자에게 직접 띄움
            if (msg && (msg.includes('런처') || msg.includes('닫으시겠습니까'))) {
                return origConfirm.apply(this, arguments);
            }
            console.log('🔇 [자동 승인] confirm 우회:', msg);
            return true;
        };
        targetWindow.alert = function(msg) {
            // 사용자 안내 alert는 메인 창에서 통과, WMS 백그라운드 팝업/조회 경고/기간 경고는 무조건 우회
            if (msg && (msg.includes('소요') || msg.includes('걸릴') || msg.includes('걸리수도') || msg.includes('계속 진행') || msg.includes('넘었습니다') || msg.includes('조회 건수') || msg.includes('데이터가 많'))) {
                console.log('🔇 WMS 알림 우회:', msg);
                return true;
            }
            if (targetWindow === window) {
                origAlert.apply(this, arguments);
            }
        };

        const dismissPopups = () => {
            const modalEl = targetDoc.getElementById(modalId);
            const pickerEl = targetDoc.getElementById('wms-journal-picker-modal');
            const popups = targetDoc.querySelectorAll('.ui-dialog, .modal, .alert, .popup, .layer, [class*="dialog"], [class*="pop"], div[style*="z-index"]');
            for (const pop of popups) {
                if (
                    pop.id === modalId ||
                    (modalEl && (modalEl.contains(pop) || pop.contains(modalEl))) ||
                    (pickerEl && (pickerEl.contains(pop) || pop.contains(pickerEl)))
                ) continue;
                if (pop.offsetWidth === 0 && pop.offsetHeight === 0) continue;
                const text = pop.textContent || '';
                if (text.includes('걸릴') || text.includes('계속 진행') || text.includes('소요') || text.includes('걸리수도') || text.includes('확인하시겠습니까') || text.includes('넘었습니다') || text.includes('7일')) {
                    const btn = pop.querySelector('button, input[type="button"], a.btn, a[href*="javascript"], a');
                    if (btn) {
                        btn.click();
                        return;
                    }
                }
            }
        };

        const intervalId = setInterval(dismissPopups, 200);

        return () => {
            clearInterval(intervalId);
            targetWindow.confirm = origConfirm;
            targetWindow.alert = origAlert;
        };
    };

    // 안정적인 동시성 제어 큐
    const runWithConcurrency = async (items, workerFn, concurrency = 6, isCancelRequested = () => false) => {
        const results = [];
        let index = 0;
        const pool = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
            while (index < items.length) {
                if (isCancelRequested()) break;
                const cur = index++;
                const res = await workerFn(items[cur], cur);
                results[cur] = res;
            }
        });
        await Promise.all(pool);
        return results;
    };

    // 7열 측정소 선택기 생성기 (7-Column Station Picker)
    const create7ColumnStationPicker = (container, selectedSet, onUpdate, options = {}) => {
        if (!container) return { updateUI: () => {} };
        container.innerHTML = '';
        container.className = 'wms-team-grid wms-scrollbar';

        const onlySmall = !!options.onlySmall;
        const singleSelect = !!options.singleSelect;

        const updateChipsUI = () => {
            INSPECTION_TEAMS_DATA.forEach((teamData, teamIdx) => {
                const teamAllValues = onlySmall
                    ? teamData.small.map(s => s.value)
                    : [
                        ...teamData.baseNat.map(s => s.value),
                        ...teamData.extraNat.map(s => s.value),
                        ...teamData.small.map(s => s.value)
                    ];
                const selectedInTeam = teamAllValues.filter(val => selectedSet.has(val)).length;
                const totalInTeam = teamAllValues.length;

                const badgeEl = container.querySelector(\`[data-team-badge="\${teamIdx}"]\`);
                if (badgeEl) {
                    badgeEl.textContent = singleSelect ? (selectedInTeam > 0 ? "1" : "0") : \`\${selectedInTeam}/\${totalInTeam}\`;
                    badgeEl.className = 'wms-team-badge' + (totalInTeam > 0 && selectedInTeam === totalInTeam ? ' active-all' : (selectedInTeam > 0 ? ' active-part' : ''));
                }

                // 서브 카테고리 배지 업데이트
                const baseSel = teamData.baseNat.filter(s => selectedSet.has(s.value)).length;
                const baseBadge = container.querySelector(\`[data-sub-badge="base-\${teamIdx}"]\`);
                if (baseBadge) baseBadge.textContent = onlySmall ? '-' : (singleSelect ? (baseSel > 0 ? "1" : "0") : \`\${baseSel}/\${teamData.baseNat.length}\`);

                if (teamData.extraNat.length > 0) {
                    const extraSel = teamData.extraNat.filter(s => selectedSet.has(s.value)).length;
                    const extraBadge = container.querySelector(\`[data-sub-badge="extra-\${teamIdx}"]\`);
                    if (extraBadge) extraBadge.textContent = onlySmall ? '-' : (singleSelect ? (extraSel > 0 ? "1" : "0") : \`\${extraSel}/\${teamData.extraNat.length}\`);
                }

                const smallSel = teamData.small.filter(s => selectedSet.has(s.value)).length;
                const smallBadge = container.querySelector(\`[data-sub-badge="small-\${teamIdx}"]\`);
                if (smallBadge) smallBadge.textContent = singleSelect ? (smallSel > 0 ? "1" : "0") : \`\${smallSel}/\${teamData.small.length}\`;

                container.querySelectorAll(\`[data-team-idx="\${teamIdx}"][data-val]\`).forEach(chip => {
                    const val = chip.getAttribute('data-val');
                    const cat = chip.getAttribute('data-cat');
                    const isSel = selectedSet.has(val);
                    let cls = 'wms-chip-v2';
                    if (isSel) {
                        cls += ' active-' + cat;
                    } else if (singleSelect && selectedSet.size > 0) {
                        cls += ' wms-chip-disabled';
                    }
                    chip.className = cls;
                });
            });

            if (typeof onUpdate === 'function') onUpdate(selectedSet);
        };

        INSPECTION_TEAMS_DATA.forEach((teamData, teamIdx) => {
            const col = document.createElement('div');
            col.className = 'wms-team-col';

            const teamAllValues = onlySmall
                ? teamData.small.map(s => s.value)
                : [
                    ...teamData.baseNat.map(s => s.value),
                    ...teamData.extraNat.map(s => s.value),
                    ...teamData.small.map(s => s.value)
                ];

            // 1. 조 헤더 (클릭 시 해당 조 전체 토글)
            const header = document.createElement('div');
            header.className = 'wms-team-header';
            header.title = \`\${teamData.team} \${onlySmall ? '소규모' : '전체'} 선택 / 해제\`;
            header.innerHTML = \`
                <span class="wms-team-title">\${teamData.team}</span>
                <span class="wms-team-badge" data-team-badge="\${teamIdx}">0/\${teamAllValues.length}</span>
            \`;
            if (!singleSelect) {
                header.onclick = () => {
                    const allSelected = teamAllValues.length > 0 && teamAllValues.every(val => selectedSet.has(val));
                    if (allSelected) {
                        teamAllValues.forEach(val => selectedSet.delete(val));
                    } else {
                        teamAllValues.forEach(val => selectedSet.add(val));
                    }
                    updateChipsUI();
                };
            } else {
                header.style.cursor = 'default';
                header.title = teamData.team;
            }
            col.appendChild(header);

            // 국가망 및 위탁용역 섹션 (소규모 전용 모드에서는 완전히 숨겨 깔끔하게 정리)
            if (!onlySmall) {
                // 2. 국가망 섹션 (클릭 시 국가망 그룹 일괄 토글)
                const baseValues = teamData.baseNat.map(s => s.value);
                const baseLabel = document.createElement('div');
                baseLabel.className = 'wms-chip-section-label wms-label-base';
                baseLabel.title = \`\${teamData.team} 국가망 그룹 선택 / 해제\`;
                baseLabel.innerHTML = \`
                    <span>국가망</span>
                    <span class="wms-sub-badge" data-sub-badge="base-\${teamIdx}">0/\${teamData.baseNat.length}</span>
                \`;
                if (!singleSelect) {
                    baseLabel.onclick = () => {
                        const allBaseSelected = baseValues.every(val => selectedSet.has(val));
                        if (allBaseSelected) {
                            baseValues.forEach(val => selectedSet.delete(val));
                        } else {
                            baseValues.forEach(val => selectedSet.add(val));
                        }
                        updateChipsUI();
                    };
                } else {
                    baseLabel.style.cursor = 'default';
                }
                col.appendChild(baseLabel);
    
                teamData.baseNat.forEach(s => {
                    const chip = document.createElement('div');
                    chip.className = 'wms-chip-v2';
                    chip.setAttribute('data-val', s.value);
                    chip.setAttribute('data-cat', 'base');
                    chip.setAttribute('data-team-idx', teamIdx);
                    chip.textContent = s.label || s.name;
                    chip.title = \`\${s.name} [국가망]\`;
                    chip.onclick = () => {
                        if (singleSelect) {
                            if (selectedSet.has(s.value)) selectedSet.delete(s.value);
                            else { selectedSet.clear(); selectedSet.add(s.value); }
                        } else {
                            if (selectedSet.has(s.value)) selectedSet.delete(s.value);
                            else selectedSet.add(s.value);
                        }
                        updateChipsUI();
                    };
                    col.appendChild(chip);
                });
    
                // 3. 위탁용역 섹션 (해당 조에 위탁용역 지점이 있을 때만 표시)
                if (teamData.extraNat.length > 0) {
                    const extraValues = teamData.extraNat.map(s => s.value);
                    const extraLabel = document.createElement('div');
                    extraLabel.className = 'wms-chip-section-label wms-label-extra';
                    extraLabel.title = \`\${teamData.team} 위탁용역 그룹 선택 / 해제\`;
                    extraLabel.innerHTML = \`
                        <span>위탁용역</span>
                        <span class="wms-sub-badge" data-sub-badge="extra-\${teamIdx}">0/\${teamData.extraNat.length}</span>
                    \`;
                    if (!singleSelect) {
                        extraLabel.onclick = () => {
                            const allExtraSelected = extraValues.every(val => selectedSet.has(val));
                            if (allExtraSelected) {
                                extraValues.forEach(val => selectedSet.delete(val));
                            } else {
                                extraValues.forEach(val => selectedSet.add(val));
                            }
                            updateChipsUI();
                        };
                    } else {
                        extraLabel.style.cursor = 'default';
                    }
                    col.appendChild(extraLabel);
    
                    teamData.extraNat.forEach(s => {
                        const chip = document.createElement('div');
                        chip.className = 'wms-chip-v2';
                        chip.setAttribute('data-val', s.value);
                        chip.setAttribute('data-cat', 'extra');
                        chip.setAttribute('data-team-idx', teamIdx);
                        chip.textContent = s.label || s.name;
                        chip.title = \`\${s.name} [위탁용역]\`;
                        chip.onclick = () => {
                            if (singleSelect) {
                                if (selectedSet.has(s.value)) selectedSet.delete(s.value);
                                else { selectedSet.clear(); selectedSet.add(s.value); }
                            } else {
                                if (selectedSet.has(s.value)) selectedSet.delete(s.value);
                                else selectedSet.add(s.value);
                            }
                            updateChipsUI();
                        };
                        col.appendChild(chip);
                    });
                }
            }

            // 4. 소규모망 섹션 (클릭 시 소규모 그룹 일괄 토글)
            if (teamData.small.length > 0) {
                const smallValues = teamData.small.map(s => s.value);
                const smallLabel = document.createElement('div');
                smallLabel.className = 'wms-chip-section-label wms-label-small';
                smallLabel.title = \`\${teamData.team} 소규모망 그룹 선택 / 해제\`;
                smallLabel.innerHTML = \`
                    <span>소규모</span>
                    <span class="wms-sub-badge" data-sub-badge="small-\${teamIdx}">0/\${teamData.small.length}</span>
                \`;
                if (!singleSelect) {
                    smallLabel.onclick = () => {
                        const allSmallSelected = smallValues.every(val => selectedSet.has(val));
                        if (allSmallSelected) {
                            smallValues.forEach(val => selectedSet.delete(val));
                        } else {
                            smallValues.forEach(val => selectedSet.add(val));
                        }
                        updateChipsUI();
                    };
                } else {
                    smallLabel.style.cursor = 'default';
                }
                col.appendChild(smallLabel);

                teamData.small.forEach(s => {
                    const chip = document.createElement('div');
                    chip.className = 'wms-chip-v2';
                    chip.setAttribute('data-val', s.value);
                    chip.setAttribute('data-cat', 'small');
                    chip.setAttribute('data-team-idx', teamIdx);
                    chip.textContent = s.label || s.name;
                    chip.title = \`\${s.name} [소규모망]\`;
                    chip.onclick = () => {
                        if (singleSelect) {
                            if (selectedSet.has(s.value)) selectedSet.delete(s.value);
                            else { selectedSet.clear(); selectedSet.add(s.value); }
                        } else {
                            if (selectedSet.has(s.value)) selectedSet.delete(s.value);
                            else selectedSet.add(s.value);
                        }
                        updateChipsUI();
                    };
                    col.appendChild(chip);
                });
            }

            container.appendChild(col);
        });

        updateChipsUI();

        return {
            updateUI: updateChipsUI
        };
    };
`;
