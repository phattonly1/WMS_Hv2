"use client";

import {
	ChevronRight,
	Download,
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
import React, { useEffect, useMemo, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import {
	listManualStorageFiles,
	type StorageItem,
} from "@/utils/supabase/storageActions";

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
	const [currentPath, setCurrentPath] = useState("");
	const [items, setItems] = useState<StorageItem[]>([]);
	const [bucketName, setBucketName] = useState("Manual");
	const [localSearchQuery, setLocalSearchQuery] = useState("");
	const [isPending, startTransition] = useTransition();

	const searchQuery = sharedSearchQuery || localSearchQuery;

	useEffect(() => {
		if (!isOpen) return;

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
	}, [isOpen]);

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

	const handleDownloadSingle = async (item: StorageItem) => {
		if (!item.publicUrl) return;
		try {
			const res = await fetch(item.publicUrl);
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
			window.open(item.publicUrl, "_blank");
		}
	};

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
			title="파일 다운로드 보관함"
			subtitle="SUPABASE CLOUD STORAGE"
			icon={FolderDown}
		>
			<div className="space-y-3.5">
				{/* 브레드크럼 */}
				<div className="flex items-center gap-1.5 px-1 text-xs text-[#64748b] dark:text-[#a1a1aa] overflow-x-auto whitespace-nowrap">
					<button
						type="button"
						onClick={() => navigateToFolder("")}
						className="hover:text-[#0f172a] dark:hover:text-white flex items-center gap-1 transition-colors"
					>
						<Home size={13} />
						<span>루트</span>
					</button>
					{breadcrumbs.map((b) => (
						<React.Fragment key={b.path}>
							<ChevronRight size={12} className="text-[#64748b] dark:text-[#a1a1aa]" />
							<button
								type="button"
								onClick={() => navigateToFolder(b.path)}
								className="hover:text-[#0f172a] dark:hover:text-white transition-colors"
							>
								{b.name}
							</button>
						</React.Fragment>
					))}
				</div>

				{/* 파일 목록 */}
				<div className="space-y-1.5 pr-1">
					{isPending ? (
						<div className="py-12 flex flex-col items-center justify-center text-xs text-[#64748b] dark:text-[#a1a1aa] gap-2">
							<Loader2 size={18} className="animate-spin text-blue-500 dark:text-blue-400" />
							<span>파일 목록을 불러오는 중...</span>
						</div>
					) : filteredItems.length === 0 ? (
						<div className="py-10 text-center text-xs text-[#64748b] dark:text-[#a1a1aa]">
							파일이나 하위 폴더가 없습니다.
						</div>
					) : (
						filteredItems.map((item) => (
							<div
								key={item.path}
								className="flex items-center justify-between p-2.5 rounded-xl bg-[#f1f5f9] dark:bg-[#16161c] border border-[#e2e8f0] dark:border-[#222228] hover:border-blue-500/40 transition-colors"
							>
								<div
									onClick={() => item.isFolder && navigateToFolder(item.path)}
									className={`flex items-center gap-2.5 min-w-0 flex-1 ${item.isFolder ? "cursor-pointer" : ""}`}
									aria-hidden="true"
								>
									<div className="w-8 h-8 rounded-lg bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] flex items-center justify-center shrink-0">
										{getFileIcon(item.name, item.isFolder)}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-xs font-bold text-[#0f172a] dark:text-white truncate break-keep">
											{item.name}
										</p>
										<p className="text-[10px] font-mono text-[#64748b] dark:text-[#a1a1aa] mt-0.5">
											{item.isFolder
												? "폴더"
												: formatBytes(item.metadata?.size)}
										</p>
									</div>
								</div>

								{!item.isFolder && (
									<button
										type="button"
										onClick={() => handleDownloadSingle(item)}
										title="다운로드"
										className="p-2 rounded-lg text-[#64748b] dark:text-[#a1a1aa] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
									>
										<Download size={15} />
									</button>
								)}
							</div>
						))
					)}
				</div>
			</div>
		</Modal>
	);
}
