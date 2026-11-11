import { NextResponse } from "next/server";
import { syncNierRealtimeSnapshotToRollingCache } from "@/app/map/actions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 매시간 10~15분 사이 랜덤 지연(Jitter) 후 NIER 실시간 1회 스냅샷을 48시간 누적 캐시에 저장
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const useJitter = searchParams.get("jitter") !== "false";

		let delayedMs = 0;
		// Vercel 함수 타임아웃(기본 60초) 내에서 랜덤 지연 또는 외부 스케줄러의 0~300초 랜덤 지연과 결합
		if (useJitter) {
			delayedMs = Math.floor(Math.random() * 25000); // 0 ~ 25초 서버측 추가 랜덤 지연
			await new Promise((resolve) => setTimeout(resolve, delayedMs));
		}

		const { realtimeMap, rollingState } =
			await syncNierRealtimeSnapshotToRollingCache(true);

		return NextResponse.json({
			ok: true,
			delayedMs,
			lastHourKey: rollingState?.lastHourKey,
			updatedAt: rollingState?.updatedAt,
			stationCount: Object.keys(rollingState?.stations || {}).length,
			realtimeTotalCount: Object.keys(realtimeMap).length,
		});
	} catch (err: unknown) {
		return NextResponse.json(
			{
				ok: false,
				error: err instanceof Error ? err.message : "Sync failed",
			},
			{ status: 500 },
		);
	}
}
