# WMS 2.0 Engineering Principles & Action Protocol

You MUST strictly adhere to these core standards across 3 operational domains on every command, reasoning step, and code change:

---

## 1. Architecture & Code Standards (아키텍처 & 코드 구조)

### 1.1 SRP & Scope Colocation (단일 책임 & 단일 파일 응집)
- Keep UI, state, mock data, and domain-specific types colocated within their route scope (`page.tsx`).
- Do not create premature subfiles or shared directories unless proven necessary.
- A module must have only one reason to change; changes in one domain must never ripple into others.

### 1.2 OCP & Composition over Inheritance (개방-폐쇄 & 컴포넌트 합성)
- New features/widgets must be added via component composition or configuration extensions without modifying existing stable core logic.
- Favor React component composition (`children`, slots) and custom hooks over rigid class inheritance or sprawling conditional (`if/switch`) branches.

### 1.3 LSP & Environment Parity (리스코프 치환 & Vercel 환경 치환성)
- All interfaces, mock objects, and real service implementations must be 100% mutually substitutable without breaking contract assumptions.
- Code written on Windows (local dev) MUST be fully substitutable on Linux (Vercel production). Never rely on case-insensitive paths, platform-specific line endings, or missing `.env.local` mappings.

### 1.4 ISP & Minimal Interfaces (인터페이스 분리 & 최소 Props 원칙)
- Components and functions must NEVER depend on props or interface fields they do not actively consume.
- Avoid passing entire giant domain objects. Explicitly declare only the minimal fields required for rendering/computation to eliminate dead prop residue.

### 1.5 DIP & Pragmatic CQS (의존성 역전 & 명령-조회 분리)
- High-level UI views must not couple to raw database queries or third-party client drivers. Communicate strictly through standard Server Action (`"use server"`) boundaries.
- Strictly separate mutations (Command) from data retrieval (Query). Queries must have zero side effects. Commands must return execution metadata (status, ID, errors), not large unrelated query payloads.

### 1.6 KISS, YAGNI & AHA (단순성 & 섣부른 추상화 금지)
- Do not write speculative code for hypothetical futures. Build strictly for current requirements.
- Tolerate minor duplication over premature abstraction. Only extract shared modules (`lib/`) when the exact same logic repeats 3+ times across separate routes.

### 1.7 Law of Demeter & Defensive Boundaries (최소 지식 & 방어적 경계)
- Do not chain access deep into collaborators' internals (avoid `a.b().c().d()`). Tell, don't ask.
- Validate all external inputs (URL queries, form inputs, external API payloads) at the boundary. Never use `any` or blind type assertions (`as`).
- Use early returns (`if (!data) return;`) to keep nesting depth within 2 levels.

### 1.8 Server Components by Default (RSC 우선)
- Default to React Server Components (RSC). Only declare `"use client"` when state (`useState`), lifecycle hooks (`useEffect`), or browser-only APIs are strictly required.

---

## 2. UI & Design System (UI & 디자인 토큰)

### 2.1 Nordic M3 Design Tokens (색감 시스템)
- **Canvas (배경 60%)**: `#09090b` (Deep Obsidian Zinc)
- **Surface Container (카드/패널 30%)**: `#111115` with 1px border `#222228` and `rounded-2xl`
- **Primary Action (메인 버튼 10%)**: `#2563eb` (Glacier Cobalt) with text `#ffffff`
- **Accent Highlight**: `#06b6d4` (Water Cyan)
- **Status Colors (신호등)**:
  - Normal (정상/승인): `#10b981` (Emerald 500)
  - Warning (주의/미참조): `#f59e0b` (Amber 500)
  - Critical (차단/고립/에러): `#f43f5e` (Rose 500)
  - Info (통신/폴링): `#38bdf8` (Sky 500)

### 2.2 Precision Typography & Tactile Touch (서체 & 질감)
- All metric numbers, telemetry data, timestamps, and status badges MUST use `font-mono`.
- Use 1px subtle top-highlight shadows for interactive surfaces (`shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`).
- Ad-hoc random hex colors and arbitrary paddings outside this system are strictly forbidden.

### 2.3 M3 Responsive, Breakpoints & Touch Standards (모바일 & 반응형 표준)
- **Window Size Classes**: Compact (<600px: 1 col), Medium (600-840px: 2 cols), Expanded (>840px: 4 cols). Use mobile-first `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`.
- **Korean Typography Word-Break (한글 단어 분리 방지)**: All Korean headings, subtitles, and labels MUST use `break-keep` (`[word-break:keep-all]`) to prevent mid-word unnatural line breaks (e.g., '통 / 합 관제' 분리 방지).
- **Action & Badge Wrapping (버튼/뱃지 개행 방지)**: Action buttons, nav pills, status badges, and short control labels MUST include `whitespace-nowrap` and `shrink-0` to prevent vertical splitting across lines.
- **Header & Action Bar Resilience (상단 헤더 반응형)**: Header containers must prevent squishing on narrow screens (<360px) by using flexible wrapping (`flex-wrap gap-3` or `shrink-0` on action items).
- **Mandatory Navigation Back Button (뒤로가기 버튼 필수)**: All non-root pages and standalone tool pages MUST include a clear back button (`ArrowLeft` / '대시보드로 돌아가기' link to `/dashboard` or history back) in the top header. A page or tool without a navigation exit route is strictly forbidden.
- **Total Workspace Scope (전체 파일 및 public/ 정적 도구 포함)**: Design tokens, typography, and navigation standards apply to ALL files without exception, including standalone tools inside `public/tools/`. Never bypass principles just because a file is a standalone HTML.
- **Touch Target**: Minimum 48x48px clickable area for all mobile interactive controls with >=8px spacing.
- **Viewport Protection**: Zero horizontal page overflow (`overflow-x-hidden` on main canvas; isolate wide data grids into local `overflow-x-auto`).
- **No Fixed Widths**: Never hardcode fixed pixel widths (`w-[*px]` forbidden; use `w-full max-w-*`).

---

## 3. Quality & Deployment Gate (품질 & 배포 검증)

### 3.1 Double-Gate Automated Audit (2중 자동 무결성 검증)
- **Gate 1 (Lint & Compilation)**: ALWAYS verify that `npx biome lint src` and `npx tsc --noEmit` exit with 0 errors before declaring any task complete.
- **Gate 2 (Dead Code & Asset Guard)**: Ensure Knip audit detects 0 orphan files, 0 unused exports, and 0 unused packages.

### 3.2 Strict Communication Protocol (소통 프로토콜)
- Eliminate all flattery, praise, and filler text.
- Provide direct, concise, and factual responses focused on engineering decisions and concrete diffs.
