/**
 * src/app/analysis/launchers/core/styles.ts
 * WMS 인페이지 런처 전용 모달 & 칩 & 캘린더 스타일시트 (CSS)
 */

export const LAUNCHER_STYLES_CSS = `
    @keyframes wmsFadeIn { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    @keyframes wmsPulseSlow { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

    /* 버튼 기본 및 인터랙션 */
    .wms-btn-action {
        cursor: pointer;
        padding: 8px 16px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 800;
        border: 1px solid transparent;
        transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        user-select: none;
    }
    .wms-btn-action:hover {
        transform: translateY(-1px);
    }
    .wms-btn-action:active {
        transform: translateY(0) scale(0.98);
    }
    .wms-btn-primary {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: white;
        box-shadow: 0 4px 12px rgba(37,99,235,0.25);
    }
    .wms-btn-primary:hover {
        box-shadow: 0 6px 16px rgba(37,99,235,0.35);
        background: linear-gradient(135deg, #1d4ed8, #1e40af);
    }
    .wms-btn-secondary {
        background: #ffffff;
        color: #475569;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }
    .wms-btn-secondary:hover {
        background: #f8fafc;
        color: #0f172a;
        border-color: #cbd5e1;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .wms-btn-excel {
        background: linear-gradient(135deg, #059669, #047857);
        color: white;
        box-shadow: 0 4px 12px rgba(5,150,105,0.25);
    }
    .wms-btn-excel:hover {
        background: linear-gradient(135deg, #047857, #065f46);
        box-shadow: 0 6px 16px rgba(5,150,105,0.35);
    }
    .wms-btn-cancel {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
    }
    .wms-btn-cancel:hover {
        background: #fee2e2;
    }

    .wms-table-row { transition: background-color 0.1s ease; }
    .wms-table-row:hover td { background-color: #f8fafc !important; }
    .wms-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
    .wms-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .wms-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    .wms-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

    /* 7열 측정소 그리드 스타일 */
    .wms-team-grid {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 10px;
        width: 100%;
        box-sizing: border-box;
    }
    .wms-team-col {
        background: #f8fafc;
        border: 1px solid #e9eff6;
        border-radius: 16px;
        padding: 9px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }
    .wms-team-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 6px;
        border-bottom: 2px solid #e2e8f0;
        cursor: pointer;
        user-select: none;
        border-radius: 8px;
        transition: background 0.12s ease;
    }
    .wms-team-header:hover {
        background: #e2e8f0;
    }
    .wms-team-title {
        font-size: 13.5px;
        font-weight: 900;
        color: #0f172a;
    }
    .wms-team-badge {
        font-size: 11px;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 12px;
        background: #e2e8f0;
        color: #475569;
        transition: all 0.15s ease;
    }
    .wms-team-badge.active-all {
        background: #2563eb;
        color: #ffffff;
    }
    .wms-team-badge.active-part {
        background: #bfdbfe;
        color: #1d4ed8;
    }

    .wms-chip-section-label {
        font-size: 11px;
        font-weight: 800;
        padding: 3px 5px 2px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        user-select: none;
        margin-top: 2px;
    }
    .wms-chip-section-label:hover {
        filter: brightness(0.95);
    }
    .wms-label-base { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
    .wms-label-extra { background: #f5f3ff; color: #6d28d9; border: 1px solid #ede9fe; }
    .wms-label-small { background: #ecfdf5; color: #047857; border: 1px solid #d1fae5; }
    .wms-sub-badge { font-size: 10px; font-weight: 700; opacity: 0.85; }

    /* 개별 측정소 칩 */
    .wms-chip-v2 {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px 4px;
        border-radius: 9px;
        font-size: 12.5px;
        font-weight: 700;
        color: #334155;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        cursor: pointer;
        user-select: none;
        transition: all 0.12s ease;
        text-align: center;
        box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }
    .wms-chip-v2:hover {
        border-color: #94a3b8;
        background: #f1f5f9;
        transform: translateY(-1px);
    }
    .wms-chip-v2.active-base {
        background: #2563eb !important;
        border-color: #1d4ed8 !important;
        color: #ffffff !important;
        font-weight: 900;
        box-shadow: 0 2px 6px rgba(37,99,235,0.3);
    }
    .wms-chip-v2.active-extra {
        background: #7c3aed !important;
        border-color: #6d28d9 !important;
        color: #ffffff !important;
        font-weight: 900;
        box-shadow: 0 2px 6px rgba(124,58,237,0.3);
    }
    .wms-chip-v2.active-small {
        background: #059669 !important;
        border-color: #047857 !important;
        color: #ffffff !important;
        font-weight: 900;
        box-shadow: 0 2px 6px rgba(5,150,105,0.3);
    }
    .wms-chip-v2.wms-chip-disabled {
        opacity: 0.3 !important;
        cursor: not-allowed !important;
        pointer-events: none !important;
        background: #f1f5f9 !important;
        border-color: #e2e8f0 !important;
        color: #94a3b8 !important;
        box-shadow: none !important;
        transform: none !important;
    }

    /* 프리셋 필터 알약 버튼 */
    .wms-pill-preset {
        cursor: pointer;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 11.5px;
        font-weight: 700;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        color: #475569;
        transition: all 0.12s ease;
        user-select: none;
    }
    .wms-pill-preset:hover {
        background: #f1f5f9;
        color: #0f172a;
        border-color: #94a3b8;
    }
    .wms-pill-preset.highlight {
        background: #eff6ff;
        color: #2563eb;
        border-color: #bfdbfe;
        font-weight: 800;
    }

    .wms-inline-cal-box {
        display: flex;
        flex-direction: column;
        gap: 4px;
        user-select: none;
    }
    .wms-cal-double-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
    }
    .wms-cal-month-pane {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .wms-cal-month-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 2px;
        height: 24px;
    }
    .wms-cal-nav-btn {
        width: 22px;
        height: 22px;
        border-radius: 5px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        color: #475569;
        transition: all 0.12s ease;
    }
    .wms-cal-nav-btn:hover {
        background: #e2e8f0;
        color: #0f172a;
        border-color: #94a3b8;
    }
    .wms-cal-title {
        font-size: 14px;
        font-weight: 900;
        color: #0f172a;
        letter-spacing: -0.3px;
    }
    .wms-cal-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        text-align: center;
        font-size: 11.5px;
        font-weight: 800;
        color: #64748b;
        margin-bottom: 2px;
        padding-bottom: 2px;
        border-bottom: 1px solid #f1f5f9;
    }
    .wms-cal-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        row-gap: 6px;
    }
    .wms-cal-cell {
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        color: #334155;
        cursor: pointer;
        position: relative;
        transition: all 0.1s ease;
    }
    .wms-cal-cell:hover .wms-cal-cell-inner {
        background: #e2e8f0;
        color: #0f172a;
    }
    .wms-cal-cell-inner {
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.12s ease;
    }
    .wms-cal-other {
        color: #cbd5e1 !important;
        cursor: default;
    }
    .wms-cal-other:hover .wms-cal-cell-inner {
        background: transparent !important;
    }
    .wms-cal-sun { color: #ef4444; }
    .wms-cal-sat { color: #3b82f6; }
    
    .wms-cal-in-range {
        background: #f0f7ff !important;
        border-radius: 0;
    }
    .wms-cal-range-start {
        background: linear-gradient(to right, transparent 50%, #f0f7ff 50%) !important;
    }
    .wms-cal-range-start .wms-cal-cell-inner {
        background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
        color: #ffffff !important;
        font-weight: 900;
        box-shadow: 0 3px 8px rgba(37,99,235,0.35);
    }
    .wms-cal-range-end {
        background: linear-gradient(to left, transparent 50%, #f0f7ff 50%) !important;
    }
    .wms-cal-range-end .wms-cal-cell-inner {
        background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
        color: #ffffff !important;
        font-weight: 900;
        box-shadow: 0 3px 8px rgba(37,99,235,0.35);
    }
    .wms-cal-range-single {
        background: transparent !important;
    }
    .wms-cal-range-single .wms-cal-cell-inner {
        background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
        color: #ffffff !important;
        font-weight: 900;
        box-shadow: 0 3px 8px rgba(37,99,235,0.35);
    }
    .wms-cal-today-dot {
        position: absolute;
        bottom: 3px;
        width: 4px;
        height: 4px;
        background: #ef4444;
        border-radius: 50%;
    }

    /* ========================================================
       다크 모드 전용 스타일 테마 (.wms-dark)
       ======================================================== */
    .wms-dark#wms-instant-card,
    #wms-instant-card.wms-dark,
    .wms-dark {
        color-scheme: dark;
    }

    /* 모달 기본 배경 및 보더 */
    .wms-dark#wms-instant-card,
    #wms-instant-card.wms-dark {
        background: #09090b !important;
        border-color: #222228 !important;
        color: #f1f5f9 !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7) !important;
    }
    .wms-dark #wms-modal-header {
        background: #09090b !important;
        border-bottom-color: #111115 !important;
    }
    .wms-dark #wms-modal-title {
        color: #f8fafc !important;
    }
    .wms-dark #wms-modal-body {
        background: #09090b !important;
    }

    /* 닫기 버튼 */
    .wms-dark #wms-close-btn {
        background: #111115 !important;
        color: #cbd5e1 !important;
    }
    .wms-dark #wms-close-btn:hover {
        background: #222228 !important;
        color: #ffffff !important;
    }

    /* 메인 탭바 */
    .wms-dark .wms-main-tab-bar {
        background: #111115 !important;
        border-color: #222228 !important;
    }
    .wms-dark .wms-main-tab {
        color: #94a3b8 !important;
    }
    .wms-dark .wms-main-tab:hover {
        color: #f8fafc !important;
        background: rgba(255, 255, 255, 0.08) !important;
    }
    .wms-dark .wms-main-tab.active {
        background: #09090b !important;
        color: #60a5fa !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
    }

    /* 좌우 메인 패널 박스 (캘린더 박스, 빠른선택 바, 우측 측정소 박스) */
    .wms-dark .wms-panel-box,
    .wms-dark .wms-preset-bar {
        background: #111115 !important;
        border-color: #222228 !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
    }
    .wms-dark .wms-panel-border {
        border-color: #222228 !important;
    }
    .wms-dark .wms-panel-title {
        color: #f8fafc !important;
    }
    .wms-dark .wms-panel-subtext {
        color: #94a3b8 !important;
    }

    /* 캘린더 영역 */
    .wms-dark .wms-cal-month-header {
        color: #f8fafc !important;
    }
    .wms-dark .wms-cal-title {
        color: #f8fafc !important;
    }
    .wms-dark .wms-cal-nav-btn {
        background: #222228 !important;
        color: #cbd5e1 !important;
        border-color: #475569 !important;
    }
    .wms-dark .wms-cal-nav-btn:hover {
        background: #475569 !important;
        color: #ffffff !important;
    }
    .wms-dark .wms-cal-weekdays {
        border-bottom-color: #222228 !important;
    }
    .wms-dark .wms-cal-weekday {
        color: #94a3b8 !important;
    }
    .wms-dark .wms-cal-cell {
        color: #e2e8f0 !important;
    }
    .wms-dark .wms-cal-cell:hover .wms-cal-cell-inner {
        background: #222228 !important;
        color: #ffffff !important;
    }
    .wms-dark .wms-cal-other {
        color: #475569 !important;
    }
    .wms-dark .wms-cal-in-range {
        background: rgba(37, 99, 235, 0.22) !important;
    }
    .wms-dark .wms-cal-range-start {
        background: linear-gradient(to right, transparent 50%, rgba(37, 99, 235, 0.22) 50%) !important;
    }
    .wms-dark .wms-cal-range-end {
        background: linear-gradient(to left, transparent 50%, rgba(37, 99, 235, 0.22) 50%) !important;
    }
    .wms-dark .wms-cal-range-single {
        background: transparent !important;
    }

    /* 빠른 선택 프리셋 바 알약 버튼 및 측정소 전체선택 버튼군 */
    .wms-dark .wms-pill-preset {
        background: #09090b !important;
        border-color: #222228 !important;
        color: #cbd5e1 !important;
    }
    .wms-dark .wms-pill-preset:hover {
        background: #222228 !important;
        color: #ffffff !important;
        border-color: #475569 !important;
    }
    .wms-dark .wms-pill-preset.highlight {
        background: rgba(16, 185, 129, 0.15) !important;
        border-color: #059669 !important;
        color: #34d399 !important;
    }
    /* 측정소 상단 전체/국가/소규모/해제 버튼 다크모드 최적화 */
    .wms-dark #wms-btn-all {
        background: #111115 !important;
        color: #f1f5f9 !important;
        border-color: #475569 !important;
        font-weight: 800 !important;
    }
    .wms-dark #wms-btn-all:hover {
        background: #222228 !important;
        color: #ffffff !important;
    }
    .wms-dark #wms-btn-base {
        background: rgba(37, 99, 235, 0.15) !important;
        color: #60a5fa !important;
        border-color: #2563eb !important;
    }
    .wms-dark #wms-btn-nat {
        background: rgba(29, 78, 216, 0.18) !important;
        color: #93c5fd !important;
        border-color: #3b82f6 !important;
    }
    .wms-dark #wms-btn-sml {
        background: rgba(5, 150, 105, 0.15) !important;
        color: #34d399 !important;
        border-color: #059669 !important;
    }
    .wms-dark #wms-btn-clear {
        background: rgba(220, 38, 38, 0.12) !important;
        color: #f87171 !important;
        border-color: #dc2626 !important;
    }

    /* 작업 모드 선택 카드들 - 비활성/비선택 기본 상태 */
    .wms-dark #wms-card-diag-days,
    .wms-dark #wms-card-diag-stop,
    .wms-dark #wms-card-diag-change,
    .wms-dark #wms-card-diag-status,
    .wms-dark #wms-card-task-data,
    .wms-dark #wms-card-task-chart,
    .wms-dark #wms-card-task-report,
    .wms-dark #wms-card-journal-copy,
    .wms-dark #wms-card-journal-history {
        background: #111115 !important;
        border-color: #222228 !important;
        color: #f1f5f9 !important;
    }

    /* 종합진단: 유효일 가선별 (Blue) */
    .wms-dark #wms-card-diag-days[style*="background: rgb(239, 246, 255)"],
    .wms-dark #wms-card-diag-days[style*="background:#eff6ff"] {
        background: rgba(37, 99, 235, 0.15) !important;
        border-color: #3b82f6 !important;
    }
    /* 종합진단: 운전정지 (Cyan) */
    .wms-dark #wms-card-diag-stop[style*="background: rgb(236, 254, 255)"],
    .wms-dark #wms-card-diag-stop[style*="background:#ecfeff"] {
        background: rgba(6, 182, 212, 0.15) !important;
        border-color: #06b6d4 !important;
    }
    /* 종합진단: 코드변경 추적 (Amber) */
    .wms-dark #wms-card-diag-change[style*="background: rgb(255, 251, 235)"],
    .wms-dark #wms-card-diag-change[style*="background:#fffbeb"] {
        background: rgba(245, 158, 11, 0.15) !important;
        border-color: #f59e0b !important;
    }
    /* 종합진단: 점검현황 진단 (Purple) */
    .wms-dark #wms-card-diag-status[style*="background: rgb(250, 245, 255)"],
    .wms-dark #wms-card-diag-status[style*="background:#faf5ff"] {
        background: rgba(139, 92, 246, 0.15) !important;
        border-color: #8b5cf6 !important;
    }
    /* 소규모: 기초자료 엑셀 (Emerald) */
    .wms-dark #wms-card-task-data[style*="background: rgb(240, 253, 244)"],
    .wms-dark #wms-card-task-data[style*="background:#f0fdf4"] {
        background: rgba(16, 185, 129, 0.15) !important;
        border-color: #10b981 !important;
    }
    /* 소규모: 차트 캡처 (Sky) */
    .wms-dark #wms-card-task-chart[style*="background: rgb(240, 249, 255)"],
    .wms-dark #wms-card-task-chart[style*="background:#f0f9ff"] {
        background: rgba(2, 132, 199, 0.15) !important;
        border-color: #38bdf8 !important;
    }
    /* 소규모 1단계 4대 작업 카드 (기본 & 선택) */
    .wms-dark #wms-card-task-data,
    .wms-dark #wms-card-task-report,
    .wms-dark #wms-card-task-pre,
    .wms-dark #wms-card-task-post {
        background: #111115 !important;
        border-color: #222228 !important;
        color: #f1f5f9 !important;
    }
    .wms-dark #wms-card-task-data[style*="background:#f0fdf4"],
    .wms-dark #wms-card-task-data[style*="background: rgb(240, 253, 244)"] {
        background: rgba(5, 150, 105, 0.2) !important;
        border-color: #10b981 !important;
    }
    .wms-dark #wms-card-task-report[style*="background:#fffbeb"],
    .wms-dark #wms-card-task-report[style*="background: rgb(255, 251, 235)"] {
        background: rgba(217, 119, 6, 0.2) !important;
        border-color: #f59e0b !important;
    }
    .wms-dark #wms-card-task-pre[style*="background:#f0f9ff"],
    .wms-dark #wms-card-task-pre[style*="background: rgb(240, 249, 255)"] {
        background: rgba(2, 132, 199, 0.2) !important;
        border-color: #38bdf8 !important;
    }
    .wms-dark #wms-card-task-post[style*="background:#f0fdfa"],
    .wms-dark #wms-card-task-post[style*="background: rgb(240, 253, 250)"] {
        background: rgba(13, 148, 136, 0.2) !important;
        border-color: #2dd4bf !important;
    }

    /* 소규모 2단계 3열 대형 드롭존 컨테이너 (디자인 A) */
    .wms-dark #wms-small-step2-container,
    .wms-dark div[id="wms-small-step2-container"] {
        background: #111115 !important;
        border-color: #222228 !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
    }
    .wms-dark #wms-dropzone-combined,
    .wms-dark #wms-dropzone-pre,
    .wms-dark #wms-dropzone-post {
        background: #09090b !important;
        border-color: #222228 !important;
    }
    .wms-dark #wms-dropzone-combined:hover,
    .wms-dark #wms-dropzone-pre:hover,
    .wms-dark #wms-dropzone-post:hover {
        background: #111115 !important;
        border-color: #475569 !important;
    }
    .wms-dark #wms-dropzone-combined[style*="background:#fffbeb"],
    .wms-dark #wms-dropzone-combined[style*="background: rgb(255, 251, 235)"] {
        background: rgba(217, 119, 6, 0.15) !important;
        border-color: #f59e0b !important;
    }
    .wms-dark #wms-dropzone-pre[style*="background:#f0f9ff"],
    .wms-dark #wms-dropzone-pre[style*="background: rgb(240, 249, 255)"] {
        background: rgba(2, 132, 199, 0.15) !important;
        border-color: #38bdf8 !important;
    }
    .wms-dark #wms-dropzone-post[style*="background:#f0fdfa"],
    .wms-dark #wms-dropzone-post[style*="background: rgb(240, 253, 250)"] {
        background: rgba(13, 148, 136, 0.15) !important;
        border-color: #2dd4bf !important;
    }
    .wms-dark #wms-small-step2-container div,
    .wms-dark #wms-small-step2-container span,
    .wms-dark #wms-small-step2-container strong {
        color: #f1f5f9;
    }
    .wms-dark #wms-dropzone-combined div,
    .wms-dark #wms-dropzone-pre div,
    .wms-dark #wms-dropzone-post div {
        color: #cbd5e1;
    }
    .wms-dark #wms-dropzone-combined div[style*="font-weight:900"],
    .wms-dark #wms-dropzone-pre div[style*="font-weight:900"],
    .wms-dark #wms-dropzone-post div[style*="font-weight:900"] {
        color: #f8fafc !important;
    }

    /* 운전정지·재개: 포함 코드 필터 바 다크모드 */
    .wms-dark #wms-stoppage-filter-bar {
        background: #111115 !important;
        border-color: #222228 !important;
    }
    .wms-dark #wms-stoppage-filter-bar span {
        color: #38bdf8 !important;
    }
    .wms-dark #wms-stoppage-filter-bar span:last-child {
        color: #94a3b8 !important;
    }

    /* 소규모: 하단 병합 차트 캡처 카드 & 구분선 */
    .wms-dark .wms-chart-combined-card {
        background: #111115 !important;
        border-color: #222228 !important;
        color: #f1f5f9 !important;
    }
    .wms-dark .wms-chart-combined-card[style*="rgba(2, 132, 199"],
    .wms-dark .wms-chart-combined-card[style*="rgba(2,132,199"] {
        background: rgba(2, 132, 199, 0.12) !important;
        border-color: #0284c7 !important;
    }
    .wms-dark .wms-card-divider {
        background: #222228 !important;
    }

    /* 소규모: ZIP 병합 컨트롤 바 */
    .wms-dark .wms-zip-merge-bar {
        background: #09090b !important;
        border-color: #38bdf8 !important;
    }
    .wms-dark .wms-zip-merge-bar span,
    .wms-dark .wms-zip-merge-bar strong {
        color: #f8fafc !important;
    }

    /* 점검일지: 일지 불러오기 (Blue) */
    .wms-dark #wms-card-journal-copy[style*="background: rgb(239, 246, 255)"],
    .wms-dark #wms-card-journal-copy[style*="background:#eff6ff"] {
        background: rgba(37, 99, 235, 0.15) !important;
        border-color: #3b82f6 !important;
    }
    /* 점검일지: 점검내역 추출 (Emerald) */
    .wms-dark #wms-card-journal-history[style*="background: rgb(236, 253, 245)"],
    .wms-dark #wms-card-journal-history[style*="background:#ecfdf5"] {
        background: rgba(16, 185, 129, 0.15) !important;
        border-color: #10b981 !important;
    }

    /* 카드 내부 라벨, 텍스트 가독성 */
    .wms-dark span[style*="color:#0f172a"],
    .wms-dark span[style*="color: rgb(15, 23, 42)"],
    .wms-dark div[style*="color:#0f172a"],
    .wms-dark div[style*="color: rgb(15, 23, 42)"],
    .wms-dark span[style*="color:#09090b"],
    .wms-dark div[style*="color:#09090b"] {
        color: #ffffff !important;
        font-weight: 700 !important;
    }
    .wms-dark span[style*="color:#475569"],
    .wms-dark span[style*="color: rgb(71, 85, 105)"],
    .wms-dark div[style*="color:#475569"],
    .wms-dark div[style*="color: rgb(71, 85, 105)"] {
        color: #d4d4d8 !important;
    }
    .wms-dark span[style*="color:#64748b"],
    .wms-dark span[style*="color: rgb(100, 116, 139)"],
    .wms-dark div[style*="color:#64748b"],
    .wms-dark div[style*="color: rgb(100, 116, 139)"] {
        color: #a1a1aa !important;
    }

    /* 7열 측정소 그리드 & 조별 열 */
    .wms-dark .wms-team-col {
        background: #111115 !important;
        border: 1px solid #222228 !important;
        border-radius: 14px !important;
    }
    .wms-dark .wms-team-header {
        border-bottom: 1px solid #222228 !important;
    }
    .wms-dark .wms-team-header:hover {
        background: #16161c !important;
    }
    .wms-dark .wms-team-title {
        color: #ffffff !important;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    }
    .wms-dark .wms-team-badge {
        background: #16161c !important;
        border: 1px solid #222228 !important;
        color: #d4d4d8 !important;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    }
    .wms-dark .wms-team-badge.active-all {
        background: #2563eb !important;
        border-color: #3b82f6 !important;
        color: #ffffff !important;
    }
    .wms-dark .wms-team-badge.active-part {
        background: rgba(37, 99, 235, 0.25) !important;
        border-color: #2563eb !important;
        color: #93c5fd !important;
    }

    /* 측정소 칩 기본 상태 */
    .wms-dark .wms-chip-v2 {
        background: #16161c !important;
        border: 1px solid #222228 !important;
        color: #f4f4f5 !important;
        word-break: keep-all !important;
        white-space: nowrap !important;
    }
    .wms-dark .wms-chip-v2:hover {
        background: #222228 !important;
        border-color: #3b82f6 !important;
        color: #ffffff !important;
    }
    .wms-dark .wms-team-header:hover {
        background: #111115 !important;
    }
    .wms-dark .wms-team-title {
        color: #f8fafc !important;
    }
    .wms-dark .wms-team-badge {
        background: #111115 !important;
        color: #94a3b8 !important;
    }
    .wms-dark .wms-team-badge.active-all {
        background: #2563eb !important;
        color: #ffffff !important;
    }
    .wms-dark .wms-team-badge.active-part {
        background: rgba(37, 99, 235, 0.3) !important;
        color: #93c5fd !important;
    }

    /* 조 내 섹션 라벨 (국가/위탁/소규모) */
    .wms-dark .wms-label-base {
        background: rgba(37, 99, 235, 0.18) !important;
        color: #93c5fd !important;
        border-color: rgba(37, 99, 235, 0.35) !important;
    }
    .wms-dark .wms-label-extra {
        background: rgba(139, 92, 246, 0.18) !important;
        color: #c4b5fd !important;
        border-color: rgba(139, 92, 246, 0.35) !important;
    }
    .wms-dark .wms-label-small {
        background: rgba(16, 185, 129, 0.18) !important;
        color: #6ee7b7 !important;
        border-color: rgba(16, 185, 129, 0.35) !important;
    }

    /* 측정소 칩 */
    .wms-dark .wms-chip-v2 {
        background: #111115 !important;
        border-color: #222228 !important;
        color: #cbd5e1 !important;
    }
    .wms-dark .wms-chip-v2:hover {
        background: #222228 !important;
        border-color: #475569 !important;
        color: #ffffff !important;
    }
    .wms-dark .wms-chip-v2.active-base {
        background: #2563eb !important;
        border-color: #3b82f6 !important;
        color: #ffffff !important;
    }
    .wms-dark .wms-chip-v2.active-extra {
        background: #7c3aed !important;
        border-color: #8b5cf6 !important;
        color: #ffffff !important;
    }
    .wms-dark .wms-chip-v2.active-small {
        background: #059669 !important;
        border-color: #10b981 !important;
        color: #ffffff !important;
    }
    .wms-dark .wms-chip-v2.wms-chip-disabled {
        background: #09090b !important;
        border-color: #111115 !important;
        color: #475569 !important;
    }

    /* 하단 푸터 및 프로그레스 */
    .wms-dark #wms-modal-footer {
        background: #09090b !important;
        border-top-color: #111115 !important;
    }
    .wms-dark .wms-prog-track {
        background: #111115 !important;
        border-color: #222228 !important;
    }
    .wms-dark #wms-prog-pct {
        color: #f8fafc !important;
    }

    /* 보조 버튼 스타일 (선별전/후, 작년/올해 등) */
    .wms-dark button[style*="background:#f8fafc"],
    .wms-dark button[style*="background: rgb(248, 250, 252)"] {
        background: #09090b !important;
        color: #cbd5e1 !important;
        border-color: #222228 !important;
    }

    /* 수질오염사고 탭 다크모드 전용 스타일 */
    .wms-dark div[id^="wms-card-q-"] {
        background: #111115 !important;
        border-color: #222228 !important;
        color: #f1f5f9 !important;
    }
    .wms-dark div[id^="wms-card-q-"][style*="background:#eff6ff"],
    .wms-dark div[id^="wms-card-q-"][style*="background: rgb(239, 246, 255)"] {
        background: rgba(37, 99, 235, 0.22) !important;
        border-color: #3b82f6 !important;
    }
    .wms-dark div[id^="wms-card-q-"] span[style*="color:#1d4ed8"] {
        color: #60a5fa !important;
    }
    .wms-dark div[id^="wms-card-q-"] span[style*="color:#2563eb"] {
        color: #93c5fd !important;
    }
    .wms-dark div[id^="wms-card-q-"] div {
        color: #94a3b8 !important;
    }
    .wms-dark div[style*="background:#f8fafc"] span[style*="color:#09090b"] {
        color: #f8fafc !important;
    }
    .wms-dark div[style*="background:#f8fafc"] {
        background: #111115 !important;
        border-color: #222228 !important;
    }
    .wms-dark span[style*="background:#e0f2fe"] {
        background: rgba(2, 132, 199, 0.25) !important;
        color: #38bdf8 !important;
    }
    .wms-dark span[style*="background:#fff1f2"] {
        background: rgba(225, 29, 72, 0.2) !important;
        border-color: rgba(225, 29, 72, 0.4) !important;
        color: #fb7185 !important;
    }
    .wms-dark div[style*="border:1px dashed #cbd5e1"] {
        background: #09090b !important;
        border-color: #222228 !important;
        color: #94a3b8 !important;
    }

    /* 결과 테이블 및 상단 컨트롤 바 다크모드 */
    .wms-dark .wms-btn-secondary {
        background: #111115 !important;
        color: #cbd5e1 !important;
        border-color: #222228 !important;
    }
    .wms-dark .wms-btn-secondary:hover {
        background: #222228 !important;
        color: #ffffff !important;
        border-color: #475569 !important;
    }
    .wms-dark .wms-tab-btn {
        background: #111115 !important;
        color: #94a3b8 !important;
        border: 1px solid #222228 !important;
        border-radius: 8px;
        padding: 6px 12px;
        cursor: pointer;
        font-weight: 700;
        transition: all 0.15s ease;
    }
    .wms-dark .wms-tab-btn:hover {
        background: #222228 !important;
        color: #f8fafc !important;
    }
    .wms-dark .wms-tab-btn.active {
        background: #09090b !important;
        border-color: #3b82f6 !important;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4) !important;
    }
    .wms-dark #wms-tab-all.active {
        color: #60a5fa !important;
    }
    .wms-dark #wms-tab-stoppage.active {
        color: #38bdf8 !important;
    }
    .wms-dark #wms-tab-calibration.active {
        color: #818cf8 !important;
    }
    .wms-dark input#wms-search-box,
    .wms-dark input#wms-mc-search,
    .wms-dark input#wms-st-search,
    .wms-dark select#wms-mc-filter-site {
        background: #111115 !important;
        border-color: #222228 !important;
        color: #f1f5f9 !important;
    }
    .wms-dark input#wms-search-box::placeholder,
    .wms-dark input#wms-mc-search::placeholder,
    .wms-dark input#wms-st-search::placeholder {
        color: #64748b !important;
    }

    /* 테이블 컨테이너 및 헤더 / 셀 */
    .wms-dark #wms-table-container,
    .wms-dark #wms-st-table-container,
    .wms-dark div[style*="background:#ffffff"],
    .wms-dark div[style*="background: rgb(255, 255, 255)"] {
        background: #09090b !important;
        border-color: #111115 !important;
    }
    .wms-dark thead,
    .wms-dark thead tr,
    .wms-dark thead[id="wms-result-thead"],
    .wms-dark thead[id="wms-mc-thead"],
    .wms-dark thead[id="wms-st-thead"],
    .wms-dark thead[style*="background:#f1f5f9"],
    .wms-dark thead[style*="background: rgb(241, 245, 249)"] {
        background: #111115 !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
    }
    .wms-dark .wms-table-header {
        background: #111115 !important;
        color: #94a3b8 !important;
        border-bottom: 1px solid #222228 !important;
        padding: 10px 8px;
        font-weight: 800;
    }
    .wms-dark .wms-table-cell {
        border-bottom: 1px solid #111115 !important;
        padding: 9px 8px;
        color: #cbd5e1 !important;
    }
    .wms-dark tr.wms-table-row {
        background: #09090b !important;
        border-bottom: 1px solid #111115 !important;
    }
    .wms-dark tr[style*="border-bottom:1px solid #f1f5f9"],
    .wms-dark tr[style*="border-bottom: 1px solid rgb(241, 245, 249)"] {
        border-bottom-color: #111115 !important;
    }
    .wms-dark tr[style*="background:#ffffff"],
    .wms-dark tr[style*="background: rgb(255, 255, 255)"] {
        background: #09090b !important;
    }
    /* 사유 미작성 행 다크모드 하이라이트 (은은한 앰버/레드 틴트) */
    .wms-dark tr.wms-row-empty,
    .wms-dark tr[style*="background:#fffdf7"],
    .wms-dark tr[style*="background: rgb(255, 253, 247)"] {
        background: rgba(245, 158, 11, 0.06) !important;
    }
    .wms-dark tr.wms-table-row:hover,
    .wms-dark tr:hover td {
        background-color: #111115 !important;
    }
    .wms-dark td[style*="color:#09090b"] {
        color: #f8fafc !important;
    }
    .wms-dark td[style*="color:#111115"] {
        color: #e2e8f0 !important;
    }
    .wms-dark td[style*="color:#64748b"] {
        color: #94a3b8 !important;
    }
    .wms-dark td[style*="color:#475569"] {
        color: #94a3b8 !important;
    }
    .wms-dark td[style*="color:#222228"] {
        color: #cbd5e1 !important;
    }
    .wms-dark td[style*="color:#0369a1"] {
        color: #38bdf8 !important;
    }
    .wms-dark td[style*="color:#059669"] {
        color: #34d399 !important;
    }
    .wms-dark td[style*="color:#94a3b8"] {
        color: #64748b !important;
    }
    .wms-dark td[style*="color:#dc2626"] {
        color: #f87171 !important;
    }

    /* 점검현황 상태 뱃지 다크모드 규격 */
    .wms-dark .wms-badge-stop {
        background: rgba(239, 68, 68, 0.16) !important;
        color: #f87171 !important;
        border-color: rgba(239, 68, 68, 0.35) !important;
    }
    .wms-dark .wms-badge-unrecv {
        background: rgba(217, 119, 6, 0.16) !important;
        color: #fbbf24 !important;
        border-color: rgba(217, 119, 6, 0.35) !important;
    }
    .wms-dark .wms-badge-trial {
        background: rgba(5, 150, 105, 0.16) !important;
        color: #34d399 !important;
        border-color: rgba(5, 150, 105, 0.35) !important;
    }
    .wms-dark .wms-badge-check {
        background: rgba(2, 132, 199, 0.16) !important;
        color: #38bdf8 !important;
        border-color: rgba(2, 132, 199, 0.35) !important;
    }

    /* 유효일 가선별 뷰어 다크모드 최적화 */
    .wms-dark .wms-valid-banner {
        background: #111115 !important;
        border-color: #222228 !important;
        color: #f1f5f9 !important;
    }
    .wms-dark .wms-valid-banner span[style*="color:#09090b"] {
        color: #f8fafc !important;
    }
    .wms-dark .wms-valid-period {
        color: #94a3b8 !important;
    }
    .wms-dark .wms-valid-table-wrap {
        border-color: #222228 !important;
        background: #09090b !important;
    }
    .wms-dark .wms-valid-table {
        background: #09090b !important;
        color: #cbd5e1 !important;
    }
    .wms-dark .wms-valid-table thead,
    .wms-dark .wms-valid-table thead tr {
        background: #111115 !important;
        border-bottom-color: #222228 !important;
    }
    .wms-dark .wms-valid-table th {
        background: #111115 !important;
        color: #e2e8f0 !important;
        border-color: #222228 !important;
    }
    .wms-dark .wms-valid-table th[style*="background:#f0fdf4"],
    .wms-dark .wms-valid-table th[style*="background: rgb(240, 253, 244)"] {
        background: rgba(16, 185, 129, 0.15) !important;
        color: #34d399 !important;
    }
    .wms-dark .wms-valid-table th[style*="background:#fefce8"],
    .wms-dark .wms-valid-table th[style*="background: rgb(254, 252, 232)"] {
        background: rgba(234, 179, 8, 0.15) !important;
        color: #fde047 !important;
    }
    .wms-dark .wms-valid-table th[style*="background:#f5f3ff"],
    .wms-dark .wms-valid-table th[style*="background: rgb(245, 243, 255)"] {
        background: rgba(139, 92, 246, 0.15) !important;
        color: #c4b5fd !important;
    }
    .wms-dark .wms-valid-table tr.wms-table-row {
        background: #09090b !important;
        border-bottom-color: #111115 !important;
    }
    .wms-dark .wms-valid-table tr.wms-table-row:nth-child(even) {
        background: #16161c !important;
    }
    .wms-dark .wms-valid-table tr.wms-table-row:hover {
        background: #111115 !important;
    }
    .wms-dark .wms-valid-table td {
        border-color: #111115 !important;
        color: #cbd5e1 !important;
    }
    .wms-dark .wms-valid-table td[style*="position:sticky"] {
        background: #09090b !important;
        color: #f1f5f9 !important;
        border-right-color: #222228 !important;
    }
    .wms-dark .wms-valid-table tr.wms-table-row:nth-child(even) td[style*="position:sticky"] {
        background: #16161c !important;
    }
    .wms-dark .wms-valid-table tr.wms-table-row:hover td[style*="position:sticky"] {
        background: #111115 !important;
    }
    .wms-dark .wms-valid-table tfoot,
    .wms-dark .wms-valid-table tfoot tr {
        background: #111115 !important;
        border-top-color: #222228 !important;
    }
    .wms-dark .wms-valid-table tfoot td {
        background: #111115 !important;
        border-color: #222228 !important;
        color: #f8fafc !important;
    }
    .wms-dark #wms-btn-toggle-all {
        background: #111115 !important;
        color: #93c5fd !important;
        border-color: #3b82f6 !important;
    }
    .wms-dark #wms-btn-toggle-gen {
        background: rgba(16, 185, 129, 0.15) !important;
        color: #34d399 !important;
        border-color: #059669 !important;
    }
    .wms-dark #wms-btn-toggle-bio {
        background: rgba(234, 179, 8, 0.15) !important;
        color: #fde047 !important;
        border-color: #ca8a04 !important;
    }
    .wms-dark #wms-btn-toggle-voc {
        background: rgba(139, 92, 246, 0.15) !important;
        color: #c4b5fd !important;
        border-color: #7c3aed !important;
    }

    /* 스크롤바 */
    .wms-dark .wms-scrollbar::-webkit-scrollbar-thumb {
        background: #222228 !important;
    }
    .wms-dark .wms-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #475569 !important;
    }
`;
