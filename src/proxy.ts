import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
	return await updateSession(request);
}

export const config = {
	matcher: [
		/*
		 * 정적 파일 및 이미지 등을 제외한 모든 경로 검사
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mjs|geojson|xlsx|ico|css|js|woff2|ttf)$).*)",
	],
};
