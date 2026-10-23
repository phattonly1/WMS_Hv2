import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL =
	process.env.NEXT_PUBLIC_SUPABASE_URL ||
	"https://ymtjoyootbkszgmjywzb.supabase.co";
const SUPABASE_ANON_KEY =
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdGpveW9vdGJrc3pnbWp5d3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MjY4NDgsImV4cCI6MjA4MjMwMjg0OH0.Vl8B9hbWnuxtLliRSdQWPgjyK7IG9D81Mp1Zc7DqONE";

export async function createClient() {
	const cookieStore = await cookies();

	return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(cookiesToSet) {
				try {
					for (const { name, value, options } of cookiesToSet) {
						cookieStore.set(name, value, options);
					}
				} catch {
					// Server Component에서는 쿠키를 쓸 수 없지만 무시해도 됩니다.
				}
			},
		},
	});
}
