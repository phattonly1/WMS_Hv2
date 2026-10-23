"use client";

import { Camera, Minus, Package, Plus } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/utils/supabase/client";
import type { Supply } from "../types";

interface ItemModalProps {
	isOpen: boolean;
	onClose: () => void;
	selectedItem: Supply | null;
	onSave: (formData: FormData) => Promise<void>;
}

interface ItemFormState {
	id?: string;
	name?: string;
	device?: string;
	manufacturer?: string;
	unit?: string;
	quantity?: number | string;
	image_url?: string;
	code?: string;
}

export default function ItemModal({
	isOpen,
	onClose,
	selectedItem,
	onSave,
}: ItemModalProps) {
	const [formData, setFormData] = useState<ItemFormState>({});
	const [isUploading, setIsUploading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const imageInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen && selectedItem) {
			const data: Record<string, unknown> = { ...selectedItem };
			for (const key of Object.keys(data)) {
				if (data[key] === "undefined" || data[key] === "null") {
					data[key] = "";
				}
			}
			setFormData(data as unknown as ItemFormState);
		} else if (isOpen) {
			setFormData({ quantity: 0 });
		}
	}, [isOpen, selectedItem]);

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		try {
			const supabase = createClient();
			const ext = file.name.split(".").pop()?.toLowerCase() || "png";

			let fileName: string;
			if (formData.image_url) {
				const urlParts = formData.image_url.split("/");
				const existingFileName =
					urlParts[urlParts.length - 1]?.split("?")[0] || "";
				const baseName = existingFileName.split(".")[0] || `item_${Date.now()}`;
				fileName = `${baseName}.${ext}`;
			} else {
				const timestamp = Date.now();
				const randomStr = Math.random().toString(36).substring(2, 8);
				fileName = `item_${timestamp}_${randomStr}.${ext}`;
			}

			if (formData.image_url) {
				const urlParts = formData.image_url.split("/");
				const oldFileName = urlParts[urlParts.length - 1]?.split("?")[0];
				if (oldFileName) {
					await supabase.storage.from("items").remove([oldFileName]);
				}
			}

			const { error } = await supabase.storage
				.from("items")
				.upload(fileName, file, { upsert: true });
			if (error) throw error;

			const {
				data: { publicUrl },
			} = supabase.storage.from("items").getPublicUrl(fileName);
			const urlWithCache = `${publicUrl}?t=${Date.now()}`;
			setFormData((prev) => ({ ...prev, image_url: urlWithCache }));
			toast.success("이미지 업로드 완료");
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "알 수 없는 오류";
			toast.error(`이미지 업로드 실패: ${msg}`);
		} finally {
			setIsUploading(false);
			if (imageInputRef.current) {
				imageInputRef.current.value = "";
			}
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name?.trim()) {
			toast.error("물품명을 입력해주세요.");
			return;
		}

		setIsSaving(true);
		try {
			const fd = new FormData();
			if (selectedItem?.id) fd.append("id", selectedItem.id);
			fd.append("name", formData.name.trim());
			fd.append("category", formData.device || "");
			fd.append("spec", formData.unit || "");
			fd.append("quantity", String(formData.quantity ?? 0));
			fd.append("manufacturer", formData.manufacturer || "");
			fd.append("image_url", formData.image_url || "");
			await onSave(fd);
			toast.success(selectedItem ? "물품 수정 완료" : "물품 추가 완료");
		} catch {
			toast.error("저장 실패");
		} finally {
			setIsSaving(false);
		}
	};

	const qtyNum = Number(formData.quantity) || 0;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={selectedItem ? "물품 수정" : "새 물품 추가"}
			subtitle={selectedItem ? "Existing Item Update" : "New Inventory Entry"}
			icon={Package}
			maxWidth="max-w-lg"
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				{/* 물품명 */}
				<div className="space-y-1.5">
					<label
						htmlFor="item-name"
						className="text-[11px] font-mono uppercase tracking-wider text-[#64748b] dark:text-[#a1a1aa] ml-1 block"
					>
						물품명 <span className="text-rose-500 dark:text-rose-400">*</span>
					</label>
					<input
						id="item-name"
						name="item-name"
						required
						className="w-full bg-[#f8fafc] dark:bg-[#16161c] text-[#0f172a] dark:text-[#f4f4f5] rounded-2xl h-13 px-4 border border-[#e2e8f0] dark:border-[#222228] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 transition-all font-bold text-base placeholder:text-[#94a3b8] dark:placeholder:text-[#52525b]"
						placeholder="물품 이름을 입력하세요"
						value={formData.name || ""}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, name: e.target.value }))
						}
					/>
				</div>

				{/* 기기명 / 제조사 */}
				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<label
							htmlFor="item-device"
							className="text-[11px] font-mono uppercase tracking-wider text-[#64748b] dark:text-[#a1a1aa] ml-1 block"
						>
							기기명
						</label>
						<input
							id="item-device"
							name="item-device"
							className="w-full bg-[#f8fafc] dark:bg-[#16161c] text-[#0f172a] dark:text-[#f4f4f5] rounded-xl h-11 px-3.5 border border-[#e2e8f0] dark:border-[#222228] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 transition-all font-semibold text-sm placeholder:text-[#94a3b8] dark:placeholder:text-[#52525b]"
							placeholder="기기명"
							value={formData.device || ""}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, device: e.target.value }))
							}
						/>
					</div>
					<div className="space-y-1.5">
						<label
							htmlFor="item-manufacturer"
							className="text-[11px] font-mono uppercase tracking-wider text-[#64748b] dark:text-[#a1a1aa] ml-1 block"
						>
							제조사
						</label>
						<input
							id="item-manufacturer"
							name="item-manufacturer"
							className="w-full bg-[#f8fafc] dark:bg-[#16161c] text-[#0f172a] dark:text-[#f4f4f5] rounded-xl h-11 px-3.5 border border-[#e2e8f0] dark:border-[#222228] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 transition-all font-semibold text-sm placeholder:text-[#94a3b8] dark:placeholder:text-[#52525b]"
							placeholder="제조사"
							value={formData.manufacturer || ""}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									manufacturer: e.target.value,
								}))
							}
						/>
					</div>
				</div>

				{/* 규격 / 수량 */}
				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<label
							htmlFor="item-unit"
							className="text-[11px] font-mono uppercase tracking-wider text-[#64748b] dark:text-[#a1a1aa] ml-1 block"
						>
							규격 (단위)
						</label>
						<input
							id="item-unit"
							name="item-unit"
							className="w-full bg-[#f8fafc] dark:bg-[#16161c] text-[#0f172a] dark:text-[#f4f4f5] rounded-xl h-11 px-3.5 border border-[#e2e8f0] dark:border-[#222228] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 transition-all font-semibold text-sm placeholder:text-[#94a3b8] dark:placeholder:text-[#52525b]"
							placeholder="예: ml, 병, EA"
							value={formData.unit || ""}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, unit: e.target.value }))
							}
						/>
					</div>
					<div className="space-y-1.5">
						<label
							htmlFor="item-quantity"
							className="text-[11px] font-mono uppercase tracking-wider text-[#64748b] dark:text-[#a1a1aa] ml-1 block"
						>
							수량
						</label>
						<div className="flex items-center bg-[#f8fafc] dark:bg-[#16161c] rounded-xl border border-[#e2e8f0] dark:border-[#222228] h-11 px-1 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500">
							<button
								type="button"
								onClick={() =>
									setFormData((prev) => ({
										...prev,
										quantity: Math.max(0, qtyNum - 1),
									}))
								}
								className="w-9 h-9 flex items-center justify-center text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors shrink-0"
								aria-label="수량 감소"
							>
								<Minus size={14} />
							</button>
							<input
								id="item-quantity"
								name="item-quantity"
								type="number"
								required
								className="w-full min-w-0 bg-transparent text-[#0f172a] dark:text-white text-center font-mono font-bold text-base focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
								value={formData.quantity ?? 0}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										quantity: e.target.value,
									}))
								}
							/>
							<button
								type="button"
								onClick={() =>
									setFormData((prev) => ({
										...prev,
										quantity: qtyNum + 1,
									}))
								}
								className="w-9 h-9 flex items-center justify-center text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors shrink-0"
								aria-label="수량 증가"
							>
								<Plus size={14} />
							</button>
						</div>
					</div>
				</div>

				{/* 이미지 업로드 */}
				<div className="space-y-1.5">
					<span className="text-[11px] font-mono uppercase tracking-wider text-[#64748b] dark:text-[#a1a1aa] ml-1 block">
						물품 이미지
					</span>
					<div className="flex gap-4 items-center bg-[#f1f5f9]/60 dark:bg-[#16161c]/60 p-3 rounded-2xl border border-dashed border-[#e2e8f0] dark:border-[#222228]">
						<div className="w-20 h-20 rounded-xl bg-white dark:bg-[#09090b] border border-[#e2e8f0] dark:border-[#222228] flex items-center justify-center overflow-hidden shrink-0 relative group">
							{formData.image_url ? (
								<Image
									src={formData.image_url}
									width={80}
									height={80}
									unoptimized
									className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
									alt="미리보기"
								/>
							) : (
								<Package
									className="text-[#64748b] dark:text-[#3f3f46] w-8 h-8"
									aria-hidden="true"
								/>
							)}
						</div>
						<div className="flex-1 min-w-0 space-y-2">
							<p className="text-[11px] font-mono text-[#64748b] dark:text-[#71717a] leading-tight">
								512x512px 권장 (JPG, PNG, WEBP)
							</p>
							<input
								type="file"
								accept="image/*"
								ref={imageInputRef}
								className="hidden"
								onChange={handleImageUpload}
							/>
							<button
								type="button"
								onClick={() => imageInputRef.current?.click()}
								disabled={isUploading}
								className="w-full h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all border border-blue-500/20 active:scale-[0.98]"
							>
								{isUploading ? (
									"업로드 중..."
								) : (
									<>
										<Camera size={14} aria-hidden="true" /> 사진 업로드 / 변경
									</>
								)}
							</button>
						</div>
					</div>
				</div>

				{/* 하단 저장 버튼 */}
				<div className="flex gap-3 pt-3 border-t border-[#e2e8f0] dark:border-[#222228]">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 h-12 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] hover:bg-black/5 dark:hover:bg-white/10 text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white font-bold text-sm transition-all border border-[#e2e8f0] dark:border-[#222228]"
					>
						취소
					</button>
					<button
						type="submit"
						disabled={isSaving}
						className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
					>
						{isSaving ? "저장 중..." : "데이터 저장하기"}
					</button>
				</div>

				{selectedItem?.code && (
					<div className="text-center pt-1">
						<span className="text-[10px] text-[#64748b] dark:text-[#71717a] font-mono tracking-widest">
							ITEM CODE: {selectedItem.code}
						</span>
					</div>
				)}
			</form>
		</Modal>
	);
}
