"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// 1. 소모품 추가/수정 (Upsert)
export async function upsertSupply(formData: FormData) {
	const supabase = await createClient();

	const id = formData.get("id") as string;
	const rawQty = Number(formData.get("quantity"));
	if (!Number.isFinite(rawQty) || rawQty < 0) {
		return { error: "유효하지 않은 수량입니다." };
	}

	const item = {
		name: formData.get("name") as string,
		category: formData.get("category") as string,
		quantity: rawQty,
		unit: formData.get("spec") as string, // spec(규격)을 unit에 매핑
		manufacturer: formData.get("manufacturer") as string,
		image_url: formData.get("image_url") as string,
	};

	const { error } = id
		? await supabase.from("supplies").update(item).eq("id", id)
		: await supabase.from("supplies").insert(item);

	if (error) return { error: error.message };
	revalidatePath("/items");
	return { success: true };
}

// 2. 기록(요청/불출/반납) 추가
export async function addLog(
	type: "REQ" | "OUT" | "RETURN",
	supplyId: string,
	supplyName: string,
	qty: number,
	user: string,
	note: string,
) {
	if (!Number.isFinite(qty) || qty <= 0) {
		throw new Error("유효한 수량을 입력해주세요.");
	}

	const supabase = await createClient();

	let remainingQty: number | null = null;
	if (type === "OUT" || type === "RETURN" || type === "REQ") {
		const { data: item, error: itemError } = await supabase
			.from("supplies")
			.select("quantity")
			.eq("id", supplyId)
			.single();
		if (itemError || !item) {
			throw new Error(itemError?.message || "물품을 찾을 수 없습니다.");
		}

		if (type === "OUT" && item.quantity < qty) {
			throw new Error("재고가 부족합니다.");
		}

		remainingQty = type === "OUT" ? item.quantity - qty : item.quantity + qty;
		const { error: updateError } = await supabase
			.from("supplies")
			.update({ quantity: remainingQty })
			.eq("id", supplyId);
		if (updateError) {
			throw new Error(updateError.message);
		}
	}

	const logData: Record<string, unknown> = {
		type,
		supply_id: supplyId,
		supply_name: supplyName,
		quantity: qty,
		user_name: user,
		note,
	};
	if (type === "REQ") logData.status = "done";

	if (
		(type === "OUT" || type === "RETURN" || type === "REQ") &&
		remainingQty !== null
	) {
		logData.remaining_qty = remainingQty;
	}

	const { error: logError } = await supabase
		.from("supply_logs")
		.insert(logData);

	if (logError) return { error: logError.message };

	revalidatePath("/items");
	return { success: true };
}

// 3. 요청 상태 변경 (구매완료 처리) - 재고 반영
export async function toggleReqStatus(id: string, currentStatus: string) {
	const supabase = await createClient();

	const { data: logData, error: logFetchErr } = await supabase
		.from("supply_logs")
		.select("supply_id, quantity, status")
		.eq("id", id)
		.single();

	if (logFetchErr || !logData) {
		throw new Error(logFetchErr?.message || "로그 정보를 찾을 수 없습니다.");
	}

	const dbCurrentStatus = logData.status || "pending";
	if (currentStatus && dbCurrentStatus !== currentStatus) {
		return;
	}

	const newStatus = dbCurrentStatus === "done" ? "pending" : "done";

	const updateData =
		newStatus === "done"
			? { status: newStatus, completed_at: new Date().toISOString() }
			: { status: newStatus, completed_at: null };

	const { data: updatedLogs, error: statusUpdateErr } = await supabase
		.from("supply_logs")
		.update(updateData)
		.eq("id", id)
		.eq("status", dbCurrentStatus)
		.select("id");

	if (statusUpdateErr) {
		throw new Error(statusUpdateErr.message);
	}

	if (!updatedLogs || updatedLogs.length === 0) {
		return;
	}

	if (
		logData.supply_id &&
		Number.isFinite(logData.quantity) &&
		logData.quantity > 0
	) {
		const { data: currentSupply, error: supplyFetchErr } = await supabase
			.from("supplies")
			.select("quantity")
			.eq("id", logData.supply_id)
			.single();

		if (supplyFetchErr) {
			throw new Error(supplyFetchErr.message);
		}

		if (currentSupply) {
			const qtyChange =
				newStatus === "done" ? logData.quantity : -logData.quantity;
			const newQuantity = Math.max(0, currentSupply.quantity + qtyChange);

			const { error: supplyUpdateErr } = await supabase
				.from("supplies")
				.update({ quantity: newQuantity })
				.eq("id", logData.supply_id);

			if (supplyUpdateErr) {
				throw new Error(supplyUpdateErr.message);
			}
		}
	}

	revalidatePath("/items");
}

// 4. 불출 로그 수량 조절 (반납/반납취소 양방향)
export async function adjustOutQty(
	logId: string,
	supplyId: string,
	supplyName: string,
	newOutQty: number,
	_originalQty: number,
	userName: string,
	note: string,
) {
	if (!Number.isFinite(newOutQty) || newOutQty < 0) {
		return { error: "유효하지 않은 수량입니다." };
	}

	const supabase = await createClient();

	const { data: logData, error: logFetchErr } = await supabase
		.from("supply_logs")
		.select("quantity, returned_qty")
		.eq("id", logId)
		.single();

	if (logFetchErr || !logData) {
		return { error: logFetchErr?.message || "불출 기록을 찾을 수 없습니다." };
	}

	const dbOriginalQty = Number(logData.quantity);
	if (!Number.isFinite(dbOriginalQty) || newOutQty > dbOriginalQty) {
		return { error: "불출 수량을 초과할 수 없습니다." };
	}

	const currentReturnedQty = Number(logData.returned_qty) || 0;
	const currentOutQty = dbOriginalQty - currentReturnedQty;

	const diff = newOutQty - currentOutQty;
	if (diff === 0) return { success: true };

	const { data: supplyData, error: supplyFetchErr } = await supabase
		.from("supplies")
		.select("quantity")
		.eq("id", supplyId)
		.single();

	if (supplyFetchErr || !supplyData) {
		return { error: supplyFetchErr?.message || "물품을 찾을 수 없습니다." };
	}

	const newStockQty = supplyData.quantity - diff;
	if (newStockQty < 0) {
		return { error: "재고가 부족합니다." };
	}

	const { error: stockUpdateErr } = await supabase
		.from("supplies")
		.update({ quantity: newStockQty })
		.eq("id", supplyId);

	if (stockUpdateErr) {
		return { error: stockUpdateErr.message };
	}

	const newReturnedQty = dbOriginalQty - newOutQty;
	const { error: logUpdateErr } = await supabase
		.from("supply_logs")
		.update({ returned_qty: newReturnedQty })
		.eq("id", logId);

	if (logUpdateErr) {
		return { error: logUpdateErr.message };
	}

	const logType = diff > 0 ? "OUT" : "RETURN";
	const logQty = Math.abs(diff);
	const logNote = diff > 0 ? note || "반납분 재사용" : note || "부분 반납";

	const { error: logInsertErr } = await supabase.from("supply_logs").insert({
		type: logType,
		supply_id: supplyId,
		supply_name: supplyName,
		quantity: logQty,
		user_name: userName,
		note: logNote,
		remaining_qty: newStockQty,
		ref_log_id: logId,
	});

	if (logInsertErr) {
		return { error: logInsertErr.message };
	}

	revalidatePath("/items");
	return { success: true };
}
