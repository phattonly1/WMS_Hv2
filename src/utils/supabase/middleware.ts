import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	});

	// /login 접근 시 루트('/')로 리다이렉트
	if (request.nextUrl.pathname === "/login") {
		const url = request.nextUrl.clone();
		url.pathname = "/";
		return NextResponse.redirect(url);
	}

	// 비디오 스트리밍 API, 교육 영상(/docs/video), 업무 도구 파일(/tools, /api/tools)은 무인증 허용
	if (
		request.nextUrl.pathname.startsWith("/api/video") ||
		request.nextUrl.pathname.startsWith("/docs/video") ||
		request.nextUrl.pathname.startsWith("/tools/") ||
		request.nextUrl.pathname.startsWith("/api/tools/")
	) {
		return supabaseResponse;
	}

	const supabaseUrl =
		process.env.NEXT_PUBLIC_SUPABASE_URL ||
		"https://ymtjoyootbkszgmjywzb.supabase.co";
	const supabaseAnonKey =
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdGpveW9vdGJrc3pnbWp5d3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MjY4NDgsImV4cCI6MjA4MjMwMjg0OH0.Vl8B9hbWnuxtLliRSdQWPgjyK7IG9D81Mp1Zc7DqONE";

	const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet) {
				for (const { name, value } of cookiesToSet) {
					request.cookies.set(name, value);
				}
				supabaseResponse = NextResponse.next({
					request,
				});
				for (const { name, value, options } of cookiesToSet) {
					supabaseResponse.cookies.set(name, value, options);
				}
			},
		},
	});

	// 로그인 페이지 및 물품(아이템) · 자료실(매뉴얼/동영상) 퀵링크 체크
	const isLoginPage = request.nextUrl.pathname === "/";
	const isAllowedQuickPage =
		request.nextUrl.pathname.startsWith("/items") ||
		request.nextUrl.pathname.startsWith("/item") ||
		request.nextUrl.pathname.startsWith("/docs");

	const hasQuickLinkParam =
		request.nextUrl.searchParams.get("quicklink") === "true";
	const isQuickAccess =
		request.cookies.get("quick_link_access")?.value === "true";

	// 퀵링크 파라미터가 있는 경우: 파라미터를 정리하고 1일 유효 quick_link_access 쿠키 발급 후 리다이렉트
	if (isAllowedQuickPage && hasQuickLinkParam) {
		const url = request.nextUrl.clone();
		url.searchParams.delete("quicklink");
		const response = NextResponse.redirect(url);
		response.cookies.set("quick_link_access", "true", {
			path: "/",
			maxAge: 60 * 60 * 24,
		});
		return response;
	}

	// 쿠키가 전혀 없는 경우 getUser() 호출 스킵 (API 호출 최소화)
	const authCookies = request.cookies
		.getAll()
		.filter((c) => c.name.includes("supabase") || c.name.includes("sb-"));

	if (authCookies.length === 0) {
		if (isLoginPage || (isAllowedQuickPage && isQuickAccess)) {
			return supabaseResponse;
		}
		const url = request.nextUrl.clone();
		const nextParam = request.nextUrl.pathname + request.nextUrl.search;
		url.pathname = "/";
		url.search = `?next=${encodeURIComponent(nextParam)}`;
		return NextResponse.redirect(url);
	}

	// auth.getUser()로 세션 확인
	let user = null;
	try {
		const { data, error } = await supabase.auth.getUser();
		if (error) {
			if (
				error.message?.includes("Refresh Token") ||
				error.code === "refresh_token_not_found"
			) {
				const response =
					isLoginPage || (isAllowedQuickPage && isQuickAccess)
						? NextResponse.next({ request })
						: NextResponse.redirect(new URL("/", request.url));

				request.cookies.getAll().forEach((cookie) => {
					if (cookie.name.includes("supabase") || cookie.name.includes("sb-")) {
						response.cookies.delete(cookie.name);
					}
				});
				return response;
			}
			throw error;
		}
		user = data.user;
	} catch (e) {
		console.error("Auth check error in middleware:", e);
		if (isLoginPage || (isAllowedQuickPage && isQuickAccess)) {
			return NextResponse.next({ request });
		}
		const url = request.nextUrl.clone();
		const nextParam = request.nextUrl.pathname + request.nextUrl.search;
		url.pathname = "/";
		url.search = `?next=${encodeURIComponent(nextParam)}`;
		return NextResponse.redirect(url);
	}

	// 30분 미활동 체크
	if (user) {
		const lastActive = request.cookies.get("sb-session-active")?.value;
		const THIRTY_MINUTES = 30 * 60 * 1000;
		const now = Date.now();
		const parsed = Number(lastActive);

		if (!lastActive || Number.isNaN(parsed) || now - parsed > THIRTY_MINUTES) {
			// 세션 만료 처리
			user = null;
			const response =
				isLoginPage || (isAllowedQuickPage && isQuickAccess)
					? NextResponse.next({ request })
					: NextResponse.redirect(new URL("/", request.url));

			request.cookies.getAll().forEach((cookie) => {
				if (
					cookie.name.includes("supabase") ||
					cookie.name.includes("sb-") ||
					cookie.name === "sb-session-active"
				) {
					response.cookies.delete(cookie.name);
				}
			});
			if (!isAllowedQuickPage || !isQuickAccess) {
				response.cookies.delete("quick_link_access");
			}
			return response;
		} else {
			// 활동 타이머 갱신 (30분)
			supabaseResponse.cookies.set("sb-session-active", now.toString(), {
				path: "/",
				maxAge: 30 * 60,
				httpOnly: true,
				sameSite: "lax",
			});
		}
	}

	if (!user && !isLoginPage) {
		// 퀵링크 접근 허용
		if (isAllowedQuickPage && isQuickAccess) {
			return supabaseResponse;
		}

		// 미인증 시 로그인 화면으로
		const url = request.nextUrl.clone();
		const nextParam = request.nextUrl.pathname + request.nextUrl.search;
		url.pathname = "/";
		url.search = `?next=${encodeURIComponent(nextParam)}`;
		return NextResponse.redirect(url);
	}

	// 로그인된 상태에서 루트(로그인) 접근 시 대시보드 또는 원래 가려던 경로로
	if (user && request.nextUrl.pathname === "/") {
		const nextParam = request.nextUrl.searchParams.get("next");
		if (nextParam?.startsWith("/") && !nextParam.startsWith("//")) {
			const redirectUrl = new URL(nextParam, request.url);
			return NextResponse.redirect(redirectUrl);
		}
		const url = request.nextUrl.clone();
		url.pathname = "/dashboard";
		url.search = "";
		return NextResponse.redirect(url);
	}

	return supabaseResponse;
}
