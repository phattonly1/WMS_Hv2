"use server";

import { createClient } from "@/utils/supabase/server";

export interface StorageItem {
	name: string;
	id?: string | null | undefined;
	updated_at?: string | null | undefined;
	created_at?: string | null | undefined;
	last_accessed_at?: string | null | undefined;
	metadata?:
		| {
				size?: number | undefined;
				mimetype?: string | undefined;
				cacheControl?: string | undefined;
				lastModified?: string | undefined;
				contentLength?: number | undefined;
		  }
		| null
		| undefined;
	isFolder: boolean;
	publicUrl?: string | undefined;
	path: string;
}

export interface StorageListResult {
	success: boolean;
	bucket: string;
	folderPath: string;
	items: StorageItem[];
	error?: string | undefined;
}

/**
 * manual 버킷(Public)의 파일/폴더 목록을 조회하고 각 파일의 Public URL을 반환합니다.
 */
export async function listManualStorageFiles(
	folderPath = "",
	bucketName = "Manual",
): Promise<StorageListResult> {
	try {
		const supabase = await createClient();
		const cleanPath = folderPath.replace(/^\/+|\/+$/g, "");

		const { data, error } = await supabase.storage
			.from(bucketName)
			.list(cleanPath, {
				limit: 100,
				offset: 0,
				sortBy: { column: "name", order: "asc" },
			});

		if (error) {
			console.error(
				`[StorageAction] Error listing files in ${bucketName}/${cleanPath}:`,
				error,
			);
			return {
				success: false,
				bucket: bucketName,
				folderPath: cleanPath,
				items: [],
				error: error.message,
			};
		}

		if (!data) {
			return {
				success: true,
				bucket: bucketName,
				folderPath: cleanPath,
				items: [],
			};
		}

		const items: StorageItem[] = data
			.filter((file) => file.name !== ".emptyFolderPlaceholder")
			.map((file) => {
				const isFolder =
					!file.id &&
					(!file.metadata || Object.keys(file.metadata).length === 0);
				const itemPath = cleanPath ? `${cleanPath}/${file.name}` : file.name;

				let publicUrl: string | undefined;
				if (!isFolder) {
					const { data: urlData } = supabase.storage
						.from(bucketName)
						.getPublicUrl(itemPath);
					publicUrl = urlData.publicUrl;
				}

				return {
					name: file.name,
					id: file.id,
					updated_at: file.updated_at,
					created_at: file.created_at,
					last_accessed_at: file.last_accessed_at,
					metadata: file.metadata,
					isFolder,
					publicUrl,
					path: itemPath,
				};
			});

		return {
			success: true,
			bucket: bucketName,
			folderPath: cleanPath,
			items,
		};
	} catch (err: unknown) {
		const msg =
			err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
		console.error(
			"[StorageAction] Critical error in listManualStorageFiles:",
			err,
		);
		return {
			success: false,
			bucket: bucketName,
			folderPath,
			items: [],
			error: msg,
		};
	}
}
