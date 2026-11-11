"use server";

import { revalidatePath } from "next/cache";
import {
	type ReagentOrderSheet,
	type ReagentPerson,
	type ReagentRowSpec,
} from "@/app/reagents/constants";
import { createClient } from "@/utils/supabase/server";

export type { ReagentOrderSheet, ReagentPerson, ReagentRowSpec };

const DEDICATED_TABLE = "reagent_order_sheets";

const INITIAL_SHEETS_SEED: Omit<ReagentOrderSheet, "id" | "createdAt">[] = [
	{
		title: "1차 시약 주문 (초기)",
		deadline: "-",
		deliveryDate: "3월 분",
		sortOrder: 1,
		cells: {
			"toc-h3po4": { 신미한: "10", 여강원: "5", 충달: "10", 청경: "10" },
			"toc-na2s2o8-old": { 청경: "10" },
			"toc-na2s2o8-new": { 신미한: "5", 충달: "10" },
			"tp-robo-molyb-new": { 구가: "2" },
			"tp-robo-naoh": { 구가: "1", 서의화: "5" },
			"tp-hatp2000-molyb": { 여강원: "5", 청경: "2" },
			"tp-hatp4000h-molyb": { 충달: "10" },
			"tn-robo-hcl": { 서의화: "5" },
			"tn-hatn2000-alk": { 청경: "10" },
			"tn-hatn2000-hcl": { 여강원: "10", 청경: "10" },
			"tn-hatn4000-hcl": { 충달: "10" },
			"etc-daphnia": { 여강원: "10" },
		},
	},
	{
		title: "2차 시약 주문 (상반기 표준용액)",
		deadline: "-",
		deliveryDate: "4월 분",
		sortOrder: 2,
		cells: {
			"toc-hcl": { 구가: "1" },
			"toc-h3po4": { 여강원: "5" },
			"tp-robo-naoh": { 구가: "1" },
			"tp-hatp2000-molyb": { 서의화: "10" },
			"tp-hatp4000h-molyb": { 충달: "15" },
			"tn-hatn2000-alk": { 여강원: "5" },
			"tn-hatn2000-hcl": { 여강원: "5", 복능: "10" },
			"tn-hatn4000-alk": { 충달: "5" },
			"tn-hatn4000-hcl": { 충달: "15" },
			"etc-daphnia": { 여강원: "10" },
			"etc-std-toc": { 구가: "23" },
			"etc-std-tn": { 구가: "17" },
			"etc-std-tp": { 구가: "17" },
		},
	},
	{
		title: "3차 시약 주문 (5/18 납기)",
		deadline: "-",
		deliveryDate: "5/18",
		sortOrder: 3,
		cells: {
			"tp-robo-naoh": { 서의화: "5" },
			"tp-hatp2000-molyb": { 여강원: "5", 복능: "7" },
			"tn-robo-hcl": { 구가: "5", 서의화: "10" },
			"tn-hatn2000-alk": { 여강원: "5", 복능: "10" },
			"tn-hatn2000-hcl": { 여강원: "5", 복능: "10" },
			"tn-hatn4000-alk": { 충달: "5" },
			"tn-hatn4000-hcl": { 충달: "5" },
		},
	},
	{
		title: "4차 시약 주문 (6/8 납기)",
		deadline: "-",
		deliveryDate: "6/8",
		sortOrder: 4,
		cells: {
			"toc-hcl": { 구가: "2" },
			"toc-h3po4": { 신미한: "5" },
			"tp-robo-molyb-new": { 구가: "2" },
			"tp-robo-naoh": { 구가: "2" },
			"tp-hatp2000-molyb": { 청경: "10", 복능: "10" },
			"tn-robo-hcl": { 서의화: "10" },
			"tn-hatn2000-alk": { 여강원: "5", 청경: "10", 복능: "5" },
			"tn-hatn2000-hcl": { 여강원: "5", 청경: "10", 복능: "15" },
			"etc-daphnia": { 여강원: "10" },
		},
	},
	{
		title: "5차 시약 주문 (7/6 납기)",
		deadline: "-",
		deliveryDate: "7/6",
		sortOrder: 5,
		cells: {
			"toc-hcl": { 구가: "2", 신미한: "5" },
			"toc-h3po4": { 신미한: "5", 여강원: "10" },
			"toc-na2s2o8-new": { 신미한: "5", 여강원: "5" },
			"tp-robo-molyb-new": { 신미한: "5" },
			"tp-robo-naoh": { 구가: "2", 서의화: "5", 신미한: "5" },
			"tp-hatp2000-molyb": { 여강원: "5", 복능: "5" },
			"tp-hatp4000h-molyb": { 충달: "10" },
			"tn-robo-alk-k2s2o8": { 신미한: "5" },
			"tn-robo-hcl": { 구가: "2", 서의화: "5", 신미한: "5" },
			"tn-hatn2000-alk": { 청경: "5", 복능: "5" },
			"tn-hatn2000-hcl": { 여강원: "5", 청경: "10", 복능: "15" },
			"tn-hatn4000-alk": { 충달: "5" },
		},
	},
	{
		title: "6차 시약 주문 (8/10 납기)",
		deadline: "-",
		deliveryDate: "8/10",
		sortOrder: 6,
		cells: {
			"toc-hcl": { 구가: "2", 서의화: "2", 신미한: "10" },
			"tp-robo-molyb-new": { 구가: "2" },
			"tp-robo-naoh": { 구가: "1" },
			"tp-hatp2000-molyb": { 서의화: "2", 복능: "4" },
			"tn-robo-alk-k2s2o8": { 구가: "2" },
			"tn-robo-hcl": { 구가: "2", 서의화: "10" },
			"tn-hatn2000-alk": { 복능: "2" },
			"tn-hatn2000-hcl": { 복능: "2" },
		},
	},
	{
		title: "7차 시약 주문 (8/28 마감)",
		deadline: "8/28",
		deliveryDate: "9/4",
		sortOrder: 7,
		cells: {
			"toc-h3po4": { 여강원: "20" },
			"toc-na2s2o8-new": { 여강원: "10" },
			"tp-hatp2000-molyb": { 여강원: "10", 청경: "5" },
			"tn-hatn2000-alk": { 여강원: "10", 청경: "10" },
			"tn-hatn2000-hcl": { 여강원: "10", 청경: "5" },
		},
	},
	{
		title: "8차 시약 주문 (9/30 마감)",
		deadline: "9/30",
		deliveryDate: "10/8",
		sortOrder: 8,
		cells: {
			"toc-h3po4": { 신미한: "5", 충달: "5", 청경: "5" },
			"toc-na2s2o8-old": { 청경: "5" },
			"toc-na2s2o8-new": { 신미한: "5" },
			"tp-robo-naoh": { 구가: "5" },
			"tp-robo-ascorb-old": { 서의화: "5" },
			"tp-robo-ascorb-new": { 서의화: "5", 신미한: "5" },
			"tp-robo-k2s2o8": { 구가: "2", 서의화: "10" },
			"tp-hatp2000-molyb": { 서의화: "5", 복능: "2" },
			"tp-hatp-ascorb": { 여강원: "5", 충달: "10", 청경: "10", 복능: "4" },
			"tp-hatp-k2s2o8": { 여강원: "10", 충달: "10", 청경: "10", 복능: "7" },
			"tn-robo-alk-k2s2o8": { 서의화: "10" },
			"tn-robo-hcl": { 서의화: "6" },
			"tn-hatn2000-alk": { 청경: "5", 복능: "10" },
			"tn-hatn2000-hcl": { 여강원: "10", 청경: "5", 복능: "2" },
			"tn-hatn4000-alk": { 충달: "10" },
			"etc-std-toc": { 구가: "23" },
			"etc-std-tn": { 구가: "23" },
			"etc-std-tp": { 구가: "23" },
		},
	},
	{
		title: "9차 시약 주문 (10/23 마감)",
		deadline: "10/23",
		deliveryDate: "10/30",
		sortOrder: 9,
		cells: {
			"toc-hcl": { 서의화: "2" },
			"toc-h3po4": { 여강원: "5 × 2" },
			"tp-robo-molyb-new": { 구가: "1 × 2" },
			"tp-robo-naoh": { 구가: "5", 서의화: "5 × 2" },
			"tp-robo-ascorb-old": { 서의화: "1" },
			"tp-robo-ascorb-new": { 구가: "1 × 2", 서의화: "1" },
			"tp-robo-k2s2o8": { 구가: "5", 서의화: "2", 신미한: "5" },
			"tp-hatp2000-molyb": {
				서의화: "5",
				여강원: "5",
				청경: "5 × 2",
				복능: "5",
			},
			"tp-hatp4000h-molyb": { 충달: "5 × 2" },
			"tp-hatp-ascorb": {
				서의화: "1",
				여강원: "5",
				충달: "5 × 2",
				청경: "5",
				복능: "2 × 2",
			},
			"tp-hatp-k2s2o8": {
				서의화: "1",
				여강원: "5 × 2",
				충달: "5 × 3",
				청경: "5 × 2",
				복능: "5",
			},
			"tn-robo-alk-k2s2o8": { 구가: "5" },
			"tn-robo-hcl": { 구가: "5", 서의화: "2 × 6", 신미한: "5" },
			"tn-hatn2000-alk": { 여강원: "5", 청경: "5 × 2", 복능: "5" },
			"tn-hatn2000-hcl": { 여강원: "5 × 2", 청경: "5 × 2", 복능: "5" },
			"tn-hatn4000-hcl": { 충달: "5 × 2" },
		},
	},
];

interface DedicatedSheetRow {
	id: string;
	title: string;
	deadline: string;
	delivery_date: string;
	sort_order: number;
	cells: Record<string, Partial<Record<ReagentPerson, string>>> | null;
	created_at: string;
}

function parseDedicatedRow(row: DedicatedSheetRow): ReagentOrderSheet {
	return {
		id: row.id,
		title: row.title,
		deadline: row.deadline || "-",
		deliveryDate: row.delivery_date || "-",
		sortOrder: row.sort_order || 1,
		cells: row.cells && typeof row.cells === "object" ? row.cells : {},
		createdAt: row.created_at,
	};
}

/**
 * 1. 시약 주문 회차 전체 조회 (reagent_order_sheets 전용 테이블 사용)
 * - 테이블이 비어 있으면 엑셀 1차~9차 회차 자동 시드
 */
export async function getReagentSheets(): Promise<ReagentOrderSheet[]> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DEDICATED_TABLE)
		.select("id, title, deadline, delivery_date, sort_order, cells, created_at")
		.order("sort_order", { ascending: true });

	if (error) {
		console.error("getReagentSheets error:", error);
		return [];
	}

	if (!data || data.length === 0) {
		const seedRows = INITIAL_SHEETS_SEED.map((seed) => ({
			title: seed.title,
			deadline: seed.deadline,
			delivery_date: seed.deliveryDate,
			sort_order: seed.sortOrder,
			cells: seed.cells,
		}));

		const { data: inserted, error: insertErr } = await supabase
			.from(DEDICATED_TABLE)
			.insert(seedRows)
			.select(
				"id, title, deadline, delivery_date, sort_order, cells, created_at",
			);

		if (insertErr || !inserted) {
			console.error("seed reagent_order_sheets error:", insertErr);
			return [];
		}

		return (inserted as DedicatedSheetRow[])
			.map(parseDedicatedRow)
			.sort((a, b) => a.sortOrder - b.sortOrder);
	}

	return (data as DedicatedSheetRow[])
		.map(parseDedicatedRow)
		.sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * 2. 특정 회차의 셀(용량 × 개수 또는 숫자) 업데이트
 */
export async function updateReagentCell(
	sheetId: string,
	rowId: string,
	person: ReagentPerson,
	value: string,
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createClient();
	const trimmed = value.trim();

	const { data: existing, error: fetchErr } = await supabase
		.from(DEDICATED_TABLE)
		.select("id, cells")
		.eq("id", sheetId)
		.single();

	if (fetchErr || !existing) {
		return {
			error: fetchErr?.message || "시트를 찾을 수 없습니다.",
			success: false,
		};
	}

	const currentCells =
		(existing.cells as Record<
			string,
			Partial<Record<ReagentPerson, string>>
		> | null) || {};
	const rowCells = { ...(currentCells[rowId] || {}) };

	if (!trimmed || trimmed === "0") {
		delete rowCells[person];
	} else {
		rowCells[person] = trimmed;
	}

	const nextCells = { ...currentCells, [rowId]: rowCells };
	const { error: updateErr } = await supabase
		.from(DEDICATED_TABLE)
		.update({ cells: nextCells })
		.eq("id", sheetId);

	if (updateErr) {
		return { error: updateErr.message, success: false };
	}

	revalidatePath("/reagents");
	return { success: true };
}

/**
 * 3. 신규 주문 회차(시트) 생성 또는 메타 정보 수정
 */
export async function upsertReagentSheetMeta(input: {
	id?: string;
	title: string;
	deadline: string;
	deliveryDate: string;
}): Promise<{ success: boolean; sheetId?: string; error?: string }> {
	const supabase = await createClient();
	const cleanTitle = input.title.trim();
	if (!cleanTitle) {
		return { success: false, error: "회차 제목을 입력해주세요." };
	}

	if (input.id) {
		const { error: updateErr } = await supabase
			.from(DEDICATED_TABLE)
			.update({
				title: cleanTitle,
				deadline: input.deadline.trim() || "-",
				delivery_date: input.deliveryDate.trim() || "-",
			})
			.eq("id", input.id);

		if (updateErr) {
			return { success: false, error: updateErr.message };
		}

		revalidatePath("/reagents");
		return { success: true, sheetId: input.id };
	}

	const { data: allRows } = await supabase
		.from(DEDICATED_TABLE)
		.select("sort_order");

	const maxOrder = (allRows || []).reduce(
		(acc, r) => Math.max(acc, Number(r.sort_order) || 0),
		0,
	);
	const nextOrder = maxOrder + 1;

	const { data: created, error: insertErr } = await supabase
		.from(DEDICATED_TABLE)
		.insert({
			title: cleanTitle,
			deadline: input.deadline.trim() || "-",
			delivery_date: input.deliveryDate.trim() || "-",
			sort_order: nextOrder,
			cells: {},
		})
		.select("id")
		.single();

	if (insertErr || !created) {
		return {
			success: false,
			error: insertErr?.message || "회차 생성에 실패했습니다.",
		};
	}

	revalidatePath("/reagents");
	return { success: true, sheetId: created.id };
}

/**
 * 4. 주문 회차 삭제
 */
export async function deleteReagentSheet(
	sheetId: string,
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createClient();

	const { error } = await supabase
		.from(DEDICATED_TABLE)
		.delete()
		.eq("id", sheetId);

	if (error) {
		return { success: false, error: error.message };
	}

	revalidatePath("/reagents");
	return { success: true };
}
