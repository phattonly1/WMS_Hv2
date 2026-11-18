"use client";

import {
	ChevronRight,
	Download,
	Eye,
	File,
	FileArchive,
	FileCode,
	FileImage,
	FileText,
	Folder,
	FolderDown,
	Home,
	Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import {
	getManualSignedUrl,
	listManualStorageFiles,
	type StorageItem,
} from "@/utils/supabase/storageActions";
import { DocsPinGate } from "../components/DocsPinGate";

interface DownloadModalProps {
	isOpen: boolean;
	onClose: () => void;
	sharedSearchQuery?: string;
}

function formatBytes(bytes?: number): string {
	if (bytes === undefined || bytes === null || bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

function getFileIcon(name: string, isFolder: boolean) {
	if (isFolder)
		return <Folder className="w-4 h-4 text-amber-400 fill-amber-400/20" />;

	const ext = name.split(".").pop()?.toLowerCase() || "";
	if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
		return <FileImage className="w-4 h-4 text-emerald-400" />;
	}
	if (
		["pdf", "txt", "md", "doc", "docx", "hwp", "hwpx", "xls", "xlsx"].includes(
			ext,
		)
	) {
		return <FileText className="w-4 h-4 text-blue-400" />;
	}
	if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
		return <FileArchive className="w-4 h-4 text-purple-400" />;
	}
	if (["json", "js", "ts", "tsx", "html", "css"].includes(ext)) {
		return <FileCode className="w-4 h-4 text-amber-400" />;
	}
	return <File className="w-4 h-4 text-[#a1a1aa]" />;
}

export default function DownloadModal({
	isOpen,
	onClose,
	sharedSearchQuery = "",
}: DownloadModalProps) {
	const router = useRouter();
	const [currentPath, setCurrentPath] = useState("");
	const [items, setItems] = useState<StorageItem[]>([]);
	const [bucketName, setBucketName] = useState("Manual");
	const [localSearchQuery, setLocalSearchQuery] = useState("");
	const [isPending, startTransition] = useTransition();

	const searchQuery = sharedSearchQuery || localSearchQuery;

	const loadRootFiles = React.useCallback(() => {
		startTransition(async () => {
			let targetBucket = "Manual";
			let result = await listManualStorageFiles("", targetBucket);

			if (!result.success || result.items.length === 0) {
				const fallback = await listManualStorageFiles("", "manual");
				if (fallback.success && fallback.items.length > 0) {
					targetBucket = "manual";
					result = fallback;
				}
			}

			setBucketName(targetBucket);
			setItems(result.items || []);
			setCurrentPath("");
		});
	}, []);

	const navigateToFolder = (targetPath: string) => {
		startTransition(async () => {
			const result = await listManualStorageFiles(targetPath, bucketName);
			if (result.success) {
				setItems(result.items);
				setCurrentPath(targetPath);
				setLocalSearchQuery("");
			}
		});
	};

	const handlePreviewPdf = (item: StorageItem) => {
		if (!item.path) return;
		const params = new URLSearchParams({
			path: item.path,
			bucket: bucketName,
			name: item.name,
		});
		router.push(`/docs/viewer?${params.toString()}`);
	};

	const handleDownloadSingle = async (item: StorageItem) => {
		if (!item.path) return;
		const signed = await getManualSignedUrl(item.path, bucketName, 120);
		if (!signed.success || !signed.signedUrl) return;
		try {
			const res = await fetch(signed.signedUrl);
			if (!res.ok) throw new Error("다운로드 실패");
			const blob = await res.blob();
			const blobUrl = URL.createObjectURL(blob);

			const a = document.createElement("a");
			a.href = blobUrl;
			a.download = item.name;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(blobUrl);
		} catch {
			window.open(signed.signedUrl, "_blank");
		}
	};

	const isPdfFile = (name: string) => name.toLowerCase().endsWith(".pdf");

	const breadcrumbs = useMemo(() => {
		if (!currentPath) return [];
		const parts = currentPath.split("/");
		return parts.map((part, index) => ({
			name: part,
			path: parts.slice(0, index + 1).join("/"),
		}));
	}, [currentPath]);

	const filteredItems = useMemo(() => {
		if (!searchQuery.trim()) return items;
		const q = searchQuery.toLowerCase().trim();
		return items.filter((item) => item.name.toLowerCase().includes(q));
	}, [items, searchQuery]);

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="보관함"
			subtitle={currentPath ? currentPath.split("/").pop() : "루트"}
			icon={FolderDown}
			size="half"
			onBack={
				currentPath
					? () => {
							const parts = currentPath.split("/");
							parts.pop();
							navigateToFolder(parts.join("/"));
						}
					: undefined
			}
			headerAction={
				<div className="flex items-center gap-1.5 text-xs text-[#64748b] dark:text-[#a1a1aa]">
					{/* 헤더 브레드크럼 */}
					<div className="flex items-center gap-1 overflow-x-auto max-w-[140px] sm:max-w-[200px] whitespace-nowrap">
						<button
							type="button"
							onClick={() => navigateToFolder("")}
							className="hover:text-[#0f172a] dark:hover:text-white flex items-center gap-0.5 transition-colors"
						>
							<Home size={12} />
						</button>
						{breadcrumbs.map((b) => (
							<React.Fragment key={b.path}>
								<ChevronRight
									size={10}
									className="text-[#64748b] dark:text-[#a1a1aa]"
								/>
								<button
									type="button"
									onClick={() => navigateToFolder(b.path)}
									className="hover:text-[#0f172a] dark:hover:text-white transition-colors truncate max-w-[60px]"
								>
									{b.name}
								</button>
							</React.Fragment>
						))}
					</div>
					<span className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 shrink-0">
						{filteredItems.length}개
					</span>
				</div>
			}
		>
			<DocsPinGate
				title="보관함 보안 코드 입력"
				onVerified={loadRootFiles}
			>
				<div className="space-y-1 pr-0.5">
					{isPending ? (
						<div className="py-12 flex flex-col items-center justify-center text-xs text-[#64748b] dark:text-[#a1a1aa] gap-2">
							<Loader2
								size={18}
								className="animate-spin text-blue-500 dark:text-blue-400"
							/>
							<span>파일 목록을 불러오는 중...</span>
						</div>
					) : filteredItems.length === 0 ? (
						<div className="py-10 text-center text-xs text-[#64748b] dark:text-[#a1a1aa]">
							파일이나 하위 폴더가 없습니다.
						</div>
					) : (
						filteredItems.map((item) => {
							const canPreview = !item.isFolder && isPdfFile(item.name);
							return (
								<div
									key={item.path}
									className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/40 transition-colors gap-2"
								>
									<div
										onClick={() => {
											if (item.isFolder) {
												navigateToFolder(item.path);
											} else if (canPreview) {
												handlePreviewPdf(item);
											}
										}}
										className={`flex items-center gap-2 min-w-0 flex-1 ${
											item.isFolder || canPreview ? "cursor-pointer" : ""
										}`}
										aria-hidden="true"
									>
										<div className="w-6 h-6 rounded-lg bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] flex items-center justify-center shrink-0">
											{getFileIcon(item.name, item.isFolder)}
										</div>
										<p className="text-xs font-bold text-[#0f172a] dark:text-white truncate break-keep">
											{item.name}
										</p>
									</div>

									<div className="flex items-center gap-1.5 shrink-0">
										<span className="text-[10px] tabular-nums text-[#64748b] dark:text-[#a1a1aa]">
											{item.isFolder
												? "폴더"
												: formatBytes(item.metadata?.size)}
										</span>
										{canPreview && (
											<button
												type="button"
												onClick={() => handlePreviewPdf(item)}
												title="전체 화면으로 미리보기"
												aria-label="전체 화면으로 미리보기"
												className="p-1 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors shrink-0 active:scale-95"
											>
												<Eye size={13} />
											</button>
										)}
										{!item.isFolder && (
											<button
												type="button"
												onClick={() => handleDownloadSingle(item)}
												title="다운로드"
												aria-label="다운로드"
												className="p-1 rounded-lg text-[#64748b] dark:text-[#a1a1aa] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0 active:scale-95"
											>
												<Download size={13} />
											</button>
										)}
									</div>
								</div>
							);
						})
					)}
				</div>
			</DocsPinGate>
		</Modal>
	);
}
