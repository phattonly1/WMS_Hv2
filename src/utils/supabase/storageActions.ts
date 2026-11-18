"use server";

import { checkDocsPinSession } from "@/app/docs/authActions";
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
		const isAuthorized = await checkDocsPinSession();
		if (!isAuthorized) {
			return {
				success: false,
				bucket: bucketName,
				folderPath,
				items: [],
				error: "보안 코드 인증이 필요합니다.",
			};
		}

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

				return {
					name: file.name,
					id: file.id,
					updated_at: file.updated_at,
					created_at: file.created_at,
					last_accessed_at: file.last_accessed_at,
					metadata: file.metadata,
					isFolder,
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

/**
 * 9415 보안 인증 쿠키를 통과한 사용자에게만 짧은 유효기간(기본 5분) 뒤 자동 폭파되는
 * 일회용 Supabase Signed URL을 발급합니다. (Vercel 대역폭 소모 0%)
 */
export async function getManualSignedUrl(
	filePath: string,
	bucketName = "Manual",
	expiresInSec = 300,
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
	try {
		const isAuthorized = await checkDocsPinSession();
		if (!isAuthorized) {
			return { success: false, error: "보안 코드 인증이 필요합니다." };
		}

		const cleanPath = filePath.replace(/^\/+|\/+$/g, "");
		if (!cleanPath || cleanPath.includes("..")) {
			return { success: false, error: "유효하지 않은 파일 경로입니다." };
		}

		const supabase = await createClient();
		const { data, error } = await supabase.storage
			.from(bucketName)
			.createSignedUrl(cleanPath, expiresInSec);

		if (error || !data?.signedUrl) {
			return {
				success: false,
				error: error?.message || "일회용 주소 발급에 실패했습니다.",
			};
		}

		return {
			success: true,
			signedUrl: data.signedUrl,
		};
	} catch (err: unknown) {
		return {
			success: false,
			error:
				err instanceof Error ? err.message : "일회용 주소 발급 중 오류 발생",
		};
	}
}
