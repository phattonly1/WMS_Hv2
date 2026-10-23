// MapLibre 지도 타일 스타일 정의
// 국토교통부 브이월드(VWorld) WMTS + 고해상도 위성 영상 + 하이브리드 라벨

import type { StyleSpecification } from "maplibre-gl";

const VWORLD_KEY =
	process.env.NEXT_PUBLIC_VWORLD_KEY || "1415A147-5544-4D31-9B13-A8B8AAE80CF4";

export const MAP_STYLES = {
	// 1. 브이월드 기본 배경지도 (Base) - 선명한 국내 지명, 도로, 하천
	vworldBase: {
		version: 8,
		sources: {
			"vworld-base": {
				type: "raster",
				tiles: [
					`https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_KEY}/Base/{z}/{y}/{x}.png`,
				],
				tileSize: 256,
				attribution: "&copy; 공간정보 오픈플랫폼 브이월드(VWorld)",
			},
		},
		layers: [
			{
				id: "vworld-base-layer",
				type: "raster",
				source: "vworld-base",
				minzoom: 0,
				maxzoom: 19,
			},
		],
	} as StyleSpecification,

	// 2. 브이월드 야간 배경지도 (Midnight) - 눈부심 없는 야간 관제 전용 다크 타일
	vworldMidnight: {
		version: 8,
		sources: {
			"vworld-midnight": {
				type: "raster",
				tiles: [
					`https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_KEY}/midnight/{z}/{y}/{x}.png`,
				],
				tileSize: 256,
				attribution: "&copy; 공간정보 오픈플랫폼 브이월드(VWorld)",
			},
		},
		layers: [
			{
				id: "vworld-midnight-layer",
				type: "raster",
				source: "vworld-midnight",
				minzoom: 0,
				maxzoom: 19,
			},
		],
	} as StyleSpecification,

	// 3. 브이월드 백지도 (White) - 측정소 마커 및 하천 색상이 가장 돋보이는 모니터링 최적 스타일
	vworldWhite: {
		version: 8,
		sources: {
			"vworld-white": {
				type: "raster",
				tiles: [
					`https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_KEY}/white/{z}/{y}/{x}.png`,
				],
				tileSize: 256,
				attribution: "&copy; 공간정보 오픈플랫폼 브이월드(VWorld)",
			},
		},
		layers: [
			{
				id: "vworld-white-layer",
				type: "raster",
				source: "vworld-white",
				minzoom: 0,
				maxzoom: 19,
			},
		],
	} as StyleSpecification,

	// 3. 브이월드 위성 영상 + 한글 지명/도로 하이브리드 오버레이
	satellite: {
		version: 8,
		sources: {
			"vworld-sat": {
				type: "raster",
				tiles: [
					`https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_KEY}/Satellite/{z}/{y}/{x}.jpeg`,
				],
				tileSize: 256,
				attribution: "&copy; 국토교통부 브이월드 영상",
			},
			"vworld-hybrid": {
				type: "raster",
				tiles: [
					`https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_KEY}/Hybrid/{z}/{y}/{x}.png`,
				],
				tileSize: 256,
			},
		},
		layers: [
			{
				id: "vworld-sat-layer",
				type: "raster",
				source: "vworld-sat",
				minzoom: 0,
				maxzoom: 19,
			},
			{
				id: "vworld-hybrid-layer",
				type: "raster",
				source: "vworld-hybrid",
				minzoom: 0,
				maxzoom: 19,
			},
		],
	} as StyleSpecification,
};
