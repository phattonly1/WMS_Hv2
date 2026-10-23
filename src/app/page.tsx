import LoginPageClient from "./login/components/LoginPageClient";

interface Props {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * 루트 페이지("/") 접속 시 로그인 화면을 렌더링하며,
 * 인증된 유저는 미들웨어에서 /dashboard 또는 ?next= 경로로 자동 리다이렉트됩니다.
 */
export default async function RootPage({ searchParams }: Props) {
	const resolvedSearchParams = await searchParams;
	const next =
		typeof resolvedSearchParams.next === "string"
			? resolvedSearchParams.next
			: undefined;

	return <LoginPageClient redirectTo={next} />;
}
