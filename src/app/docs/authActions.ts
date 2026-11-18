"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";

const DOCS_COOKIE_NAME = "wms-docs-auth";
const SEVEN_DAYS_SEC = 7 * 24 * 60 * 60;

function getSecretSalt(): string {
	return (
		process.env.SUPABASE_SERVICE_ROLE_KEY ||
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
		"wms-docs-secret-key-2026"
	);
}

function getExpectedPasscode(): string {
	// 한국 표준시(KST, UTC+9) 기준 오늘 날짜 4자리(MMDD) 동적 생성 (예: 11월 19일 -> "1119", 5월 3일 -> "0503")
	const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
	const month = String(kstNow.getUTCMonth() + 1).padStart(2, "0");
	const day = String(kstNow.getUTCDate()).padStart(2, "0");
	return `${month}${day}`;
}

export async function createSignedToken(timestamp: number): Promise<string> {
	const payload = `v1:${timestamp}`;
	// 날짜가 바뀌어도 한 번 인증된 쿠키는 7일간 유지되도록 서버 고유 시크릿으로만 서명
	const hmac = crypto
		.createHmac("sha256", getSecretSalt())
		.update(payload)
		.digest("hex");
	return `${payload}:${hmac}`;
}

export async function verifySignedToken(
	token: string | undefined,
): Promise<boolean> {
	if (!token) return false;
	const parts = token.split(":");
	if (parts.length !== 3 || parts[0] !== "v1") return false;
	const ts = Number(parts[1]);
	if (Number.isNaN(ts)) return false;

	// 7일 만료 검증
	if (Date.now() - ts > SEVEN_DAYS_SEC * 1000) return false;

	const expected = await createSignedToken(ts);
	try {
		return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
	} catch {
		return false;
	}
}

/**
 * QR 문지기(Supabase Edge Function)에서 1회 입력으로 넘어온 단기 티켓(30초 유효)을 검증하고
 * 즉시 우리 사이트의 7일 유지 httpOnly 쿠키로 교환해 줍니다. (비밀번호 2번 입력 방지)
 */
export async function exchangeQrGateTicketAction(
	ticket: string,
): Promise<boolean> {
	if (!ticket) return false;
	const parts = ticket.split(":");
	if (parts.length !== 3 || parts[0] !== "qr1") return false;
	const ts = Number(parts[1]);
	if (Number.isNaN(ts)) return false;

	// 티켓 발급 후 60초 이내만 유효 (재사용/유출 방지)
	if (Math.abs(Date.now() - ts) > 60 * 1000) return false;

	const expectedSig = crypto
		.createHmac("sha256", getSecretSalt())
		.update(`qr1:${ts}`)
		.digest("hex");

	let isValid = false;
	try {
		isValid = crypto.timingSafeEqual(
			Buffer.from(parts[2]!),
			Buffer.from(expectedSig),
		);
	} catch {
		return false;
	}

	if (!isValid) return false;

	const token = await createSignedToken(Date.now());
	const cookieStore = await cookies();
	cookieStore.set(DOCS_COOKIE_NAME, token, {
		path: "/",
		maxAge: SEVEN_DAYS_SEC,
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
	});

	return true;
}

/**
 * 현재 접속한 새 도메인 주소(origin)를 Supabase Storage(cache/active_domain.json)에 자동 동기화하여
 * 나중에 도메인을 바꿔도 Supabase QR 문지기가 자동으로 새 도메인으로 연결하도록 합니다.
 */
export async function syncActiveDomainToSupabase(
	origin: string,
): Promise<void> {
	try {
		if (
			!origin ||
			origin.includes("localhost") ||
			origin.includes("127.0.0.1")
		) {
			return;
		}
		const supabaseUrl =
			process.env.NEXT_PUBLIC_SUPABASE_URL ||
			"https://ymtjoyootbkszgmjywzb.supabase.co";
		const supabaseKey =
			process.env.SUPABASE_SERVICE_ROLE_KEY ||
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
		if (!supabaseKey) return;

		await fetch(`${supabaseUrl}/storage/v1/object/cache/active_domain.json`, {
			method: "POST",
			headers: {
				apikey: supabaseKey,
				Authorization: `Bearer ${supabaseKey}`,
				"Content-Type": "application/json",
				"x-upsert": "true",
			},
			body: JSON.stringify({
				origin,
				updatedAt: new Date().toISOString(),
			}),
			cache: "no-store",
		});
	} catch {
		// ignore sync error
	}
}

/**
 * 서버에서当前 요청의 httpOnly 쿠키가 유효한지 검사
 */
export async function checkDocsPinSession(): Promise<boolean> {
	const cookieStore = await cookies();
	const token = cookieStore.get(DOCS_COOKIE_NAME)?.value;
	return verifySignedToken(token);
}

/**
 * 4자리 보안 코드를 서버에서만 검증하고, 일치 시 위변조 불가능한 7일 유지 httpOnly 쿠키 발급
 */
export async function verifyDocsPinAction(
	pin: string,
): Promise<{ success: boolean; error?: string }> {
	const cleanPin = String(pin || "").trim();
	const expected = getExpectedPasscode();

	if (cleanPin !== expected) {
		// 무차별 대입(Brute-force) 지연 방어
		await new Promise((r) => setTimeout(r, 350));
		return { success: false, error: "보안 코드가 일치하지 않습니다." };
	}

	const token = await createSignedToken(Date.now());
	const cookieStore = await cookies();
	cookieStore.set(DOCS_COOKIE_NAME, token, {
		path: "/",
		maxAge: SEVEN_DAYS_SEC,
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
	});

	return { success: true };
}
