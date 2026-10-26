import type { Metadata } from "next";
import ArchitecturePageClient from "./ArchitecturePageClient";

export const metadata: Metadata = {
	title: "시스템 아키텍처 교육 뷰어 | WMS_Hv2",
	description:
		"WMS_Hv2 시스템의 프론트엔드 및 백엔드 인터랙션 파일 구조도 및 핵심 설계 안내",
};

export default function ArchitecturePage() {
	return <ArchitecturePageClient />;
}
