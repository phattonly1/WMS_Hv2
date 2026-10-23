"use client";

export default function ItemCardSkeleton({
	viewMode,
}: {
	viewMode: "list" | "photo";
}) {
	if (viewMode === "list") {
		return (
			<div className="rounded-xl p-3 bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] animate-pulse">
				<div className="flex gap-3 items-center">
					{/* 이미지 */}
					<div className="w-9 h-9 rounded-lg bg-[#f1f5f9] dark:bg-[#16161c]" />
					{/* 텍스트 */}
					<div className="flex-1 space-y-2">
						<div className="h-4 bg-[#f1f5f9] dark:bg-[#16161c] rounded w-3/4" />
						<div className="h-3 bg-[#f1f5f9] dark:bg-[#16161c] rounded w-1/2" />
					</div>
					{/* 재고 배지 */}
					<div className="w-8 h-5 bg-[#f1f5f9] dark:bg-[#16161c] rounded-md" />
				</div>
				{/* 버튼 */}
				<div className="flex gap-2 pt-3 mt-2 border-t border-[#e2e8f0] dark:border-[#222228]">
					<div className="w-10 h-10 bg-[#f1f5f9] dark:bg-[#16161c] rounded-xl" />
					<div className="flex-1 h-10 bg-[#f1f5f9] dark:bg-[#16161c] rounded-xl" />
					<div className="w-10 h-10 bg-[#f1f5f9] dark:bg-[#16161c] rounded-xl" />
				</div>
			</div>
		);
	}

	// Photo View
	return (
		<div className="rounded-2xl bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] overflow-hidden animate-pulse">
			<div className="aspect-square bg-[#f1f5f9] dark:bg-[#16161c]" />
			<div className="p-3 space-y-2">
				<div className="h-4 bg-[#f1f5f9] dark:bg-[#16161c] rounded w-3/4" />
				<div className="h-3 bg-[#f1f5f9] dark:bg-[#16161c] rounded w-1/2" />
				<div className="h-9 bg-[#f1f5f9] dark:bg-[#16161c] rounded-xl mt-2" />
			</div>
		</div>
	);
}
