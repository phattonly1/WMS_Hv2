# 공간정보 및 수계 데이터 출처 (Spatial Data Sources)

이 디렉터리에 포함된 하천 벡터 데이터의 출처 및 규격 정보입니다.

---

## 1. `han_rivers.geojson` / `han_rivers.backup.geojson`

- **데이터셋 명칭**: **South Korea Waterways** (`hotosm_kor_waterways`)
- **원천 제공처**: **Humanitarian OpenStreetMap Team (HOT)**
- **배포 플랫폼**: **HDX (Humanitarian Data Exchange)**
- **공식 다운로드 URL**: [https://data.humdata.org/dataset/hotosm_kor_waterways](https://data.humdata.org/dataset/hotosm_kor_waterways)
- **라이선스**: Open Data Commons Open Database License (ODbL) / CC-BY

### 포함된 파일 설명
* **`han_rivers.backup.geojson`**:
  - HDX/HOT 대한민국 전체 수계망 중 한강 및 인접 수계의 원본 추출본 (총 307개 피처, 2.84MB).
  - 지류 복원이나 원본 형상 참조용 아카이브 파일.
* **`han_rivers.geojson`**:
  - 현재 웹 모니터링 화면(`src/app/map/MapLibreView.tsx`)에서 실제 서비스 중인 파일 (총 145개 피처, 1.97MB).
  - 소하천/저수지 등을 선별 및 1차 정제하고 5대 수계(`han`, `namhan`, `bukhan`, `imjin`, `pyeongtaek`) 필터 태그가 매핑된 버전.

---

## 2. 지도 배경 타일 (Basemap)

- **제공처**: **국토교통부 공간정보 오픈플랫폼 브이월드 (VWorld)**
- **활용 레이어**: 
  - 기본 배경지도 (Base WMTS)
  - 백지도 (White WMTS)
  - 고해상도 항공/위성 영상 (Satellite) + 지명/도로 하이브리드 (Hybrid WMTS)
- **공식 사이트**: [https://www.vworld.kr](https://www.vworld.kr)
