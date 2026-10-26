export interface FileNodeStory {
	id: string;
	name: string;
	path: string;
	badge: string;
	badgeColor: "blue" | "emerald" | "amber" | "sky" | "rose";
	title: string;
	keyFiles: {
		name: string;
		desc: string;
	}[];
}

export const FILE_DIAGRAM_NODES: Record<string, FileNodeStory> = {
	proxy_entry: {
		id: "proxy_entry",
		name: "src/proxy.ts",
		path: "src/proxy.ts",
		badge: "⚙️ 백엔드 진입 제어",
		badgeColor: "amber",
		title: "웹페이지 요청을 서버 최전선에서 가로채는 백엔드 프록시 파일",
		keyFiles: [
			{
				name: "src/proxy.ts",
				desc: "이미지·폰트 같은 단순 파일 요청은 그대로 통과시키고, 실제 웹페이지 접속 요청만 골라내어 백엔드 인증 검사(middleware.ts)로 전달합니다.",
			},
		],
	},
	middleware_auth: {
		id: "middleware_auth",
		name: "utils/supabase/middleware.ts",
		path: "src/utils/supabase/middleware.ts",
		badge: "⚙️ 백엔드 세션 분기",
		badgeColor: "amber",
		title: "서버 미들웨어: 로그인 여부 검증, 30분 활동 세션 체크, QR 스캔 임시 허용",
		keyFiles: [
			{
				name: "src/utils/supabase/middleware.ts",
				desc: "접속자의 로그인 쿠키/세션을 서버 측에서 검증하여 비로그인 상태면 로그인 화면으로 리다이렉트하고, 30분 이상 활동이 없으면 자동 로그아웃 처리합니다. 단, 소모품 QR 코드로 접속한 사용자는 하루 동안 로그인 없이 이용할 수 있도록 임시 허용합니다.",
			},
			{
				name: "src/utils/supabase/server.ts & client.ts",
				desc: "Next.js 서버와 브라우저 클라이언트에서 각각 외부 데이터베이스(Supabase)에 연결할 때 사용하는 백엔드 클라이언트 인스턴스 파일입니다.",
			},
		],
	},
	root_login: {
		id: "root_login",
		name: "src/app/page.tsx & app/login/",
		path: "src/app/page.tsx · src/app/login/*",
		badge: "🖥️ 프론트엔드 로그인",
		badgeColor: "amber",
		title: "기본 주소('/') 접속 시 브라우저에 표시되는 로그인 화면 UI",
		keyFiles: [
			{
				name: "src/app/page.tsx",
				desc: "사이트 첫 화면(루트 경로)을 담당하는 파일입니다. 로그인 성공 시 원래 이동하려던 페이지나 대시보드로 연결해 줍니다.",
			},
			{
				name: "src/app/login/components/LoginPageClient.tsx & LoginForm.tsx",
				desc: "로그인 화면의 전체 레이아웃과 이메일/비밀번호 입력 폼을 구성하는 화면 파일입니다.",
			},
			{
				name: "src/app/login/actions.ts",
				desc: "사용자가 입력한 계정 정보를 외부 인증 서버(Supabase Auth)로 보내 로그인 처리를 수행하는 파일입니다.",
			},
		],
	},
	public_bypass: {
		id: "public_bypass",
		name: "로그인 없이 바로 열리는 기능 (교육 영상 · QR 소모품)",
		path: "/docs/video · /items?quicklink=true",
		badge: "무인증 예외 허용",
		badgeColor: "amber",
		title: "현장 편의를 위해 로그인 없이 바로 접근할 수 있도록 묶어둔 2가지 예외 경로",
		keyFiles: [
			{
				name: "1) 교육 영상 바로보기 (/docs/video)",
				desc: "현장에서 장비 점검 중 교육 영상을 급히 확인해야 할 때 로그인 없이도 바로 영상을 재생할 수 있도록 허용했습니다.",
			},
			{
				name: "2) 소모품 QR 스캔 접속 (/items?quicklink=true)",
				desc: "창고에서 스마트폰으로 물품 QR 코드를 찍었을 때 매번 로그인하는 번거로움을 없애기 위해, QR 스캔 시 하루 동안 로그인 없이 소모품 페이지가 바로 열리도록 처리했습니다.",
			},
		],
	},
	ext_supa_auth: {
		id: "ext_supa_auth",
		name: "🌐 외부: Supabase Auth",
		path: "https://*.supabase.co/auth/v1",
		badge: "외부 인증 서버",
		badgeColor: "emerald",
		title: "계정 정보 확인 및 로그인 세션을 관리하는 외부 인증 서비스",
		keyFiles: [
			{
				name: "Supabase Auth",
				desc: "사용자 이메일/비밀번호 검증과 로그인 유지용 인증 토큰 발급을 전담하는 외부 클라우드 인증 서버입니다.",
			},
		],
	},
	layout_global: {
		id: "layout_global",
		name: "src/app/layout.tsx & globals.css",
		path: "src/app/layout.tsx · src/app/globals.css",
		badge: "공통 레이아웃 · 스타일",
		badgeColor: "sky",
		title: "전체 페이지의 기본 구조, 웹폰트 로드, 다크/라이트 테마 설정",
		keyFiles: [
			{
				name: "src/app/layout.tsx",
				desc: "모든 페이지를 감싸는 최상위 레이아웃 파일입니다. 정부 표준 웹폰트(Pretendard GOV)를 불러오고 초기 테마(다크/라이트 모드)를 적용합니다.",
			},
			{
				name: "src/app/globals.css",
				desc: "사이트 전체에 공통 적용되는 배경색, 글자 스타일, 스크롤바 디자인을 정의한 스타일시트입니다.",
			},
		],
	},
	pages_group: {
		id: "pages_group",
		name: "src/app/* (전체 페이지)",
		path: "src/app/ 하위 페이지 폴더",
		badge: "페이지 라우트 구조",
		badgeColor: "blue",
		title: "폴더 경로가 그대로 웹 주소(URL)가 되는 화면 폴더 묶음",
		keyFiles: [
			{
				name: "src/app/ 하위 폴더 (dashboard, map, docs, items, dev)",
				desc: "각 폴더 안에 있는 page.tsx 파일이 해당 주소(/dashboard, /map 등)의 메인 화면으로 동작합니다.",
			},
		],
	},
	ext_jsdelivr: {
		id: "ext_jsdelivr",
		name: "🌐 외부 CDN: jsDelivr",
		path: "https://cdn.jsdelivr.net (Pretendard GOV)",
		badge: "외부 웹폰트 서버",
		badgeColor: "emerald",
		title: "Pretendard GOV 웹폰트 파일을 제공하는 외부 콘텐츠 전송 서버",
		keyFiles: [
			{
				name: "pretendard-gov-variable.min.css",
				desc: "접속 기기에 해당 폰트가 설치되어 있지 않아도 동일한 글씨체로 화면이 보이도록 온라인에서 폰트를 불러옵니다.",
			},
		],
	},
	common_ui: {
		id: "common_ui",
		name: "src/components/",
		path: "src/components/providers/ThemeProvider.tsx · ui/ThemeToggle.tsx · ui/modal.tsx",
		badge: "공통 UI 컴포넌트",
		badgeColor: "sky",
		title: "여러 페이지에서 재사용하는 팝업 모달 및 테마 전환 버튼",
		keyFiles: [
			{
				name: "src/components/ui/modal.tsx",
				desc: "사이트 내 모든 팝업창의 크기, 닫기 동작, 디자인을 통일하기 위해 만든 공통 모달 컴포넌트입니다.",
			},
			{
				name: "src/components/ui/ThemeToggle.tsx & ThemeProvider.tsx",
				desc: "각 페이지 상단 헤더에서 다크모드와 라이트모드를 전환하고 설정값을 저장하는 공통 컴포넌트입니다.",
			},
		],
	},
	public_assets: {
		id: "public_assets",
		name: "public/data/han_rivers.geojson & public/icons/*",
		path: "public/data/han_rivers.geojson · public/icons/* · public/images/*",
		badge: "정적 데이터 · 이미지",
		badgeColor: "sky",
		title: "한강 하천망 지도 데이터 및 화면 아이콘 이미지 파일",
		keyFiles: [
			{
				name: "public/data/han_rivers.geojson",
				desc: "수질 지도(/map) 위에 한강·남한강·북한강 수계 라인을 표시하기 위한 지리 좌표 데이터 파일입니다.",
			},
			{
				name: "public/icons/* & public/images/*",
				desc: "대시보드 메뉴 카드 아이콘과 로고 등 고정 이미지 파일들이 저장된 폴더입니다.",
			},
		],
	},
	hangul_util: {
		id: "hangul_util",
		name: "src/utils/hangul.ts",
		path: "src/utils/hangul.ts",
		badge: "초성 검색 기능",
		badgeColor: "emerald",
		title: "수질 지도와 소모품 목록에서 사용되는 한글 초성 검색 유틸리티",
		keyFiles: [
			{
				name: "src/utils/hangul.ts",
				desc: "한글 단어에서 초성을 분리하여, 검색창에 'ㄱㅍ'만 입력해도 '가평'을 찾아낼 수 있도록 처리하는 함수 파일입니다.",
			},
		],
	},
	app_dashboard: {
		id: "app_dashboard",
		name: "src/app/dashboard/",
		path: "src/app/dashboard/page.tsx",
		badge: "메인 대시보드",
		badgeColor: "blue",
		title: "로그인 후 이동하는 메인 화면 (4대 핵심 메뉴 및 실무 도구 연결)",
		keyFiles: [
			{
				name: "src/app/dashboard/page.tsx",
				desc: "수질 지도, 자료실, 통합 런처, 소모품 메뉴와 하단 업무 보조 도구 4종을 한곳에 모아둔 메인 대시보드 페이지입니다.",
			},
			{
				name: "src/app/dashboard/launcher-card.tsx",
				desc: "클릭 시 통합 런처 스크립트를 생성해 클립보드에 복사하고 안내 알림창을 띄우는 컴포넌트입니다.",
			},
		],
	},
	app_launcher: {
		id: "app_launcher",
		name: "src/app/dashboard/launcher/",
		path: "src/app/dashboard/launcher/engine.ts · core/* · modules/* · ui/*",
		badge: "F12 통합 런처",
		badgeColor: "sky",
		title: "외부 WMS 사이트의 개발자 도구(F12)에 붙여넣어 실행하는 자동화 스크립트",
		keyFiles: [
			{
				name: "src/app/dashboard/launcher/engine.ts",
				desc: "공통 기능(core), 10개 업무 모듈(modules), 화면 패널(ui) 코드를 하나의 실행 스크립트로 합쳐주는 파일입니다.",
			},
			{
				name: "src/app/dashboard/launcher/modules/* (10개 업무 모듈)",
				desc: "수질데이터 종합진단, 소규모 월간보고서 생성, 점검일지 추출 등 10가지 실무 자동화 기능이 각각 나뉘어 작성된 폴더입니다.",
			},
			{
				name: "src/app/dashboard/launcher/core/worker.ts & realgrid.ts",
				desc: "다른 창을 보는 중에도 자동화가 멈추지 않게 유지하는 백그라운드 처리기(worker.ts)와 WMS 표 데이터 추출기(realgrid.ts)입니다.",
			},
		],
	},
	public_tools: {
		id: "public_tools",
		name: "public/tools/* (4종)",
		path: "public/tools/*.html & *.txt",
		badge: "독립 실행형 도구",
		badgeColor: "sky",
		title: "별도 서버 없이 브라우저에서 바로 열거나 다운로드해 쓰는 실무 도구 4종",
		keyFiles: [
			{
				name: "public/tools/station-history-filler.html",
				desc: "측정/장애 이력 엑셀 파일에 장비 모델명과 지속시간을 자동으로 채워주는 단일 HTML 파일입니다.",
			},
			{
				name: "public/tools/pdf-masking.html",
				desc: "파일을 외부 서버로 올리지 않고 브라우저 안에서 PDF 개인정보를 가려주는 마스킹 편집 도구입니다.",
			},
			{
				name: "public/tools/image-converter.html",
				desc: "JPG, WEBP 이미지 파일을 보고서 첨부용 PNG 파일로 일괄 변환하는 도구입니다.",
			},
			{
				name: "public/tools/education-automation.txt",
				desc: "온라인 교육 수강 시 활용하는 콘솔 보조 스크립트 텍스트 파일입니다.",
			},
		],
	},
	app_docs: {
		id: "app_docs",
		name: "src/app/docs/ & content/*.md",
		path: "src/app/docs/page.tsx · content/*/*.md · modals/*",
		badge: "자료실 · 매뉴얼",
		badgeColor: "blue",
		title: "마크다운(.md) 원고 기반 업무 매뉴얼 뷰어 및 시약 계산기 · 교육 영상",
		keyFiles: [
			{
				name: "src/app/docs/content/*/*.md",
				desc: "소규모망·국가망·정도관리·비상대응 등 카테고리별 업무 지침이 작성된 마크다운 문서 파일들입니다.",
			},
			{
				name: "src/app/docs/utils/markdownLoader.ts",
				desc: "폴더 안의 마크다운(.md) 문서들을 읽어들여 자동으로 카테고리 목차와 본문 데이터로 변환하는 파일입니다.",
			},
			{
				name: "src/app/docs/modals/ReagentModal.tsx & VideoModal.tsx & DownloadModal.tsx",
				desc: "자료실 상단 버튼으로 띄우는 시약 제조 계산기, 교육 영상 재생기, 실무 양식 다운로드 모달 파일입니다.",
			},
		],
	},
	app_items: {
		id: "app_items",
		name: "src/app/items/",
		path: "src/app/items/page.tsx & components/*",
		badge: "소모품 · QR 관리",
		badgeColor: "amber",
		title: "소모품·부품 현재고 조회, 구매 요청, 반출/반납 기록 및 QR 코드 생성",
		keyFiles: [
			{
				name: "src/app/items/page.tsx",
				desc: "현재고, 구매요청, 반출/반납 내역을 탭으로 구분해 관리하고 장비별 필터와 사진 보기 모드를 제공하는 페이지입니다.",
			},
			{
				name: "src/app/items/components/QRModal.tsx",
				desc: "개별 소모품의 전용 QR 코드 라벨을 생성하고 인쇄하는 모달 파일입니다.",
			},
			{
				name: "src/app/items/components/ItemModal.tsx",
				desc: "소모품 신규 등록 및 수정 창으로, 아이폰 사진(HEIC)을 일반 이미지로 자동 변환해 업로드하는 기능이 포함되어 있습니다.",
			},
		],
	},
	app_map: {
		id: "app_map",
		name: "src/app/map/ & map/stations/",
		path: "src/app/map/page.tsx · src/app/map/stations/page.tsx",
		badge: "수질 지도 · 제원 관리",
		badgeColor: "blue",
		title: "한강수계 지도 모니터링 및 측정소별 제원 · 보유 기기 통계 관리",
		keyFiles: [
			{
				name: "src/app/map/page.tsx & MapLibreView.tsx",
				desc: "수계별·분류별 필터링과 마커 위치 편집 모드(?mode=edit)를 지원하는 수질 지도 메인 파일입니다.",
			},
			{
				name: "src/app/map/stations/page.tsx & StationForm.tsx",
				desc: "측정소별 상세 정보, 보유 분석기기, 점검 이력을 조회하고 수정하는 제원 관리 화면입니다.",
			},
			{
				name: "src/app/map/stations/components/StationSummaryTab.tsx",
				desc: "전체 측정소에 설치된 분석기기 현황을 항목별·모델별로 자동 집계하여 표로 보여주는 파일입니다.",
			},
		],
	},
	app_dev: {
		id: "app_dev",
		name: "src/app/dev/",
		path: "src/app/dev/page.tsx · ArchitectureViewer.tsx",
		badge: "구조도 · 품질 검증",
		badgeColor: "rose",
		title: "시스템 구조도 뷰어 및 배포 전 코드·디자인 규칙 자동 검증 페이지",
		keyFiles: [
			{
				name: "src/app/dev/ArchitectureViewer.tsx & architectureData.ts",
				desc: "현재 화면에 표시되는 인터랙티브 파일 구조도 다이어그램과 각 파일의 설명 데이터를 담당하는 파일입니다.",
			},
			{
				name: "src/app/dev/page.tsx",
				desc: "아키텍처 교육 뷰어와 배포 전 무결성 검증 화면을 상단 탭으로 전환하며 확인할 수 있는 페이지입니다.",
			},
		],
	},
	ext_wms: {
		id: "ext_wms",
		name: "🌐 외부: 국립환경과학원 WMS",
		path: "https://wms.waterkorea.or.kr/wms/main",
		badge: "외부 대상 시스템",
		badgeColor: "sky",
		title: "통합 런처 스크립트를 붙여넣어 업무 자동화를 실행하는 외부 포털",
		keyFiles: [
			{
				name: "wms.waterkorea.or.kr (국가수질자동측정망 운영시스템)",
				desc: "대시보드에서 복사한 통합 런처 스크립트를 이 사이트의 개발자 도구(F12) 콘솔에 붙여넣으면 화면 내에 자동화 창이 생성됩니다.",
			},
		],
	},
	ext_sheetjs: {
		id: "ext_sheetjs",
		name: "🌐 외부 CDN: SheetJS & cdnjs",
		path: "https://cdn.sheetjs.com · https://cdnjs.cloudflare.com",
		badge: "외부 라이브러리 서버",
		badgeColor: "emerald",
		title: "엑셀 파일 생성 및 PDF 문서 렌더링 기능을 제공하는 외부 라이브러리",
		keyFiles: [
			{
				name: "SheetJS (xlsx) & pdf.js",
				desc: "통합 런처와 독립형 도구들이 엑셀 파일을 읽고 만들거나 PDF 문서를 화면에 표시할 때 불러오는 외부 오픈소스 라이브러리입니다.",
			},
		],
	},
	ext_r2: {
		id: "ext_r2",
		name: "🌐 외부: Cloudflare R2",
		path: "https://*.r2.dev (src/app/docs/video/data.ts)",
		badge: "외부 영상 스토리지",
		badgeColor: "emerald",
		title: "자료실의 교육 영상 파일들을 저장하고 스트리밍하는 외부 미디어 서버",
		keyFiles: [
			{
				name: "Cloudflare R2",
				desc: "용량이 큰 동영상 파일을 웹사이트 코드와 분리하여 빠르게 재생할 수 있도록 연결된 외부 클라우드 저장소입니다.",
			},
		],
	},
	data_layer: {
		id: "data_layer",
		name: "src/actions/* & src/utils/supabase/*",
		path: "src/actions/supplies.ts · map/actions.ts · utils/supabase/*",
		badge: "데이터 조회 · 저장 처리",
		badgeColor: "emerald",
		title: "DB 데이터를 불러와 임시 저장(캐싱)하고, 변경 사항을 서버에 반영하는 파일들",
		keyFiles: [
			{
				name: "src/utils/supabase/hooks.ts & fetcher.ts",
				desc: "측정소와 소모품 데이터를 DB에서 불러온 뒤 메모리에 임시 저장(SWR 캐싱)하여, 페이지 재방문 시 다시 로딩하지 않고 즉시 보여줍니다.",
			},
			{
				name: "src/actions/supplies.ts & src/app/map/actions.ts",
				desc: "소모품 입출고 수량 변경이나 측정소 정보 수정 요청을 서버에서 안전하게 처리해 DB에 반영하는 파일입니다.",
			},
			{
				name: "src/utils/supabase/storageActions.ts",
				desc: "소모품 사진과 자료실 양식 파일을 외부 스토리지에 업로드하거나 삭제하는 기능을 담당합니다.",
			},
		],
	},
	ext_supa_db: {
		id: "ext_supa_db",
		name: "🌐 외부: Supabase DB & Storage",
		path: "https://*.supabase.co (PostgreSQL & Storage)",
		badge: "외부 DB · 파일 저장소",
		badgeColor: "emerald",
		title: "측정소 제원, 보유 기기, 소모품 재고 데이터 및 이미지가 저장되는 클라우드 DB",
		keyFiles: [
			{
				name: "stations_master · station_assets · map_markers (측정소 테이블)",
				desc: "측정소 기본 정보, 설치된 수질분석기기 목록, 지도 보조 마커 위치가 저장된 데이터베이스 테이블입니다.",
			},
			{
				name: "supplies · supply_logs (소모품 테이블) & Storage",
				desc: "소모품 현재고, 구매요청·반출입 기록 테이블과 실물 사진 및 문서 파일이 저장되는 클라우드 저장소입니다.",
			},
		],
	},
	ext_vworld: {
		id: "ext_vworld",
		name: "🌐 외부: VWorld & OSM",
		path: "https://api.vworld.kr · https://tile.openstreetmap.org",
		badge: "외부 배경지도 서버",
		badgeColor: "emerald",
		title: "수질 지도(/map)에 위성 사진과 일반 도로 지도를 제공하는 외부 지도 서비스",
		keyFiles: [
			{
				name: "국토교통부 브이월드(VWorld) & 오픈스트리트맵(OSM)",
				desc: "수질 지도 화면의 배경이 되는 위성 지도와 일반 도로 지도 이미지를 실시간으로 불러오는 외부 지도 API입니다.",
			},
		],
	},
	audit_engine: {
		id: "audit_engine",
		name: "src/actions/audit.ts & scripts/audit-design-tokens.mjs",
		path: "src/actions/audit.ts · scripts/audit-design-tokens.mjs · package.json",
		badge: "코드 · 디자인 자동 검사",
		badgeColor: "rose",
		title: "사용하지 않는 파일·패키지와 디자인 규칙 위반을 찾아내는 자동 검사 파일",
		keyFiles: [
			{
				name: "scripts/audit-design-tokens.mjs",
				desc: "지정된 색상표 외의 색상 사용, 다크모드 누락, 반응형 화면 깨짐 등 디자인 규칙 위반 여부를 자동으로 검사하는 스크립트입니다.",
			},
			{
				name: "src/actions/audit.ts",
				desc: "프로젝트 내에서 연결이 끊긴 미사용 파일, 안 쓰는 패키지, 환경변수 누락을 검출하여 /dev 화면에 리포트로 보여주는 파일입니다.",
			},
		],
	},
};
