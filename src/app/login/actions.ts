"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
	const supabase = await createClient();

	// 패스코드 가져오기
	const passcode = formData.get("passcode") as string;

	const MASTER_EMAIL = "test2@test.com";

	// 로그인 시도 (패스코드를 비밀번호로 사용)
	const { error } = await supabase.auth.signInWithPassword({
		email: MASTER_EMAIL,
		password: passcode,
	});

	if (error) {
		return { error: "잘못된 패스코드입니다." };
	}

	// 30분 활동 세션 증명 쿠키 발급
	const cookieStore = await cookies();
	cookieStore.set("sb-session-active", Date.now().toString(), {
		path: "/",
		maxAge: 30 * 60,
		httpOnly: true,
		sameSite: "lax",
	});

	revalidatePath("/", "layout");
	return { success: true };
}
