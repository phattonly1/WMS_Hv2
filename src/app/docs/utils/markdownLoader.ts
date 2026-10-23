import fs from "node:fs";
import path from "node:path";
import type { ManualCategory, ManualItem } from "../types";

const CATEGORY_DEFINITIONS: Record<
	string,
	{
		id: string;
		name: string;
		iconName: string;
		description: string;
		order: number;
	}
> = {
	"01-small-network": {
		id: "small-network",
		name: "소규모감시망",
		iconName: "Building2",
		description:
			"소규모 측정소 점검, 센서 세척/교정, 시스템 운영 및 보고서 작성",
		order: 1,
	},
	"02-national-network": {
		id: "national-network",
		name: "국가측정망",
		iconName: "Cpu",
		description:
			"국가 수질자동측정망 출입, 수조/펌프/가스실 점검, 생물감시 및 VOCs",
		order: 2,
	},
	"03-quality-assurance": {
		id: "quality-assurance",
		name: "정도보증사업",
		iconName: "ShieldCheck",
		description: "정도관리, 정도평가, 법정 정도검사, 국제숙련도 및 외부점검",
		order: 3,
	},
	"04-emergency-etc": {
		id: "emergency-etc",
		name: "기타 및 비상대응",
		iconName: "AlertOctagon",
		description: "비상출동 요건, 비상대기 보고, 초과근무 소명 및 장기 운전정지",
		order: 4,
	},
};

function parseFrontmatter(rawContent: string): {
	data: Record<string, unknown>;
	content: string;
} {
	const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match?.[1] || !match[2]) {
		return { data: {}, content: rawContent.trim() };
	}

	const yamlBlock = match[1];
	const content = match[2].trim();
	const data: Record<string, unknown> = {};

	for (const line of yamlBlock.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;

		const colonIdx = trimmed.indexOf(":");
		if (colonIdx === -1) continue;

		const key = trimmed.slice(0, colonIdx).trim();
		let val: unknown = trimmed.slice(colonIdx + 1).trim();

		if (
			typeof val === "string" &&
			((val.startsWith('"') && val.endsWith('"')) ||
				(val.startsWith("'") && val.endsWith("'")))
		) {
			val = val.slice(1, -1);
		}

		if (typeof val === "string" && val.startsWith("[") && val.endsWith("]")) {
			try {
				val = JSON.parse(val.replace(/'/g, '"'));
			} catch {
				const rawStr = typeof val === "string" ? val : "";
				val = rawStr
					.slice(1, -1)
					.split(",")
					.map((item: string) => item.trim().replace(/^["']|["']$/g, ""));
			}
		} else if (typeof val === "string" && !Number.isNaN(Number(val))) {
			val = Number(val);
		}

		data[key] = val;
	}

	return { data, content };
}

export function getAllManualCategories(): ManualCategory[] {
	const manualsDirectory = path.join(
		process.cwd(),
		"src",
		"app",
		"docs",
		"content",
	);

	if (!fs.existsSync(manualsDirectory)) {
		return [];
	}

	const categoryDirs = fs
		.readdirSync(manualsDirectory, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name)
		.sort();

	const categories: ManualCategory[] = [];

	for (const dirName of categoryDirs) {
		const fullDirPath = path.join(manualsDirectory, dirName);
		const categoryMetaPath = path.join(fullDirPath, "_category.json");
		const defaultDef = CATEGORY_DEFINITIONS[dirName];

		let categoryMeta: {
			id: string;
			name: string;
			iconName: string;
			description?: string | undefined;
			order?: number | undefined;
		} = defaultDef
			? { ...defaultDef }
			: {
					id: dirName.replace(/^\d+-/, ""),
					name: dirName,
					iconName: "Building2",
					order: 99,
				};

		if (fs.existsSync(categoryMetaPath)) {
			try {
				const metaContent = fs.readFileSync(categoryMetaPath, "utf8");
				const parsed = JSON.parse(metaContent);
				categoryMeta = { ...categoryMeta, ...parsed };
			} catch (err) {
				console.error(`Error reading ${categoryMetaPath}:`, err);
			}
		}

		const mdFiles = fs
			.readdirSync(fullDirPath)
			.filter((file) => file.endsWith(".md") && !file.startsWith("_"));

		const items: (ManualItem & { order?: number | undefined })[] = [];

		for (const file of mdFiles) {
			const filePath = path.join(fullDirPath, file);
			const fileContent = fs.readFileSync(filePath, "utf8");
			const { data, content } = parseFrontmatter(fileContent);

			items.push({
				id: (data.id as string) || file.replace(/\.md$/, ""),
				title: (data.title as string) || file.replace(/\.md$/, ""),
				subtitle: (data.subtitle as string | undefined) ?? undefined,
				badge: (data.badge as string | undefined) ?? undefined,
				tags: (data.tags as string[] | undefined) ?? undefined,
				summary: (data.summary as string | undefined) ?? undefined,
				order: (data.order as number | undefined) ?? 99,
				content: content.trim(),
			});
		}

		items.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

		categories.push({
			id: categoryMeta.id,
			name: categoryMeta.name,
			iconName: categoryMeta.iconName,
			description: categoryMeta.description ?? undefined,
			order: categoryMeta.order ?? undefined,
			items,
		});
	}

	categories.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
	return categories;
}
