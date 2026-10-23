// Item Page Types

export type TabType = "inventory" | "request" | "out";

export interface Supply {
	id: string;
	code?: string; // 3자리 단축 코드
	name: string;
	device: string; // 기기명 (category 대체)
	unit: string; // 규격
	quantity: number;
	manufacturer?: string; // 제조사
	image_url?: string;
}

export interface Log {
	id: string;
	type: "REQ" | "OUT" | "RETURN";
	created_at: string;
	completed_at?: string; // 구매완료 시 시간
	remaining_qty?: number; // 불출/반납 후 남은 재고
	returned_qty?: number; // 불출 로그에서 반납된 수량
	supply_id: string;
	supply_name: string;
	quantity: number;
	user_name: string;
	note: string;
	status: string;
}
