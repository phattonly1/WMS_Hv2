import { Beaker, Bug, FlaskConical, Sparkles, TestTube2 } from "lucide-react";
import type React from "react";
import { REAGENTS, type ReagentData, type StationData } from "./data";

export interface CategoryStyle {
	icon: React.ReactNode;
	label: string;
	color: string;
	badgeBg: string;
	badgeText: string;
	badgeBorder: string;
	border: string;
	dotColor: string;
}

export const CATEGORY_CONFIG: Record<string, CategoryStyle> = {
	TOC: {
		icon: <Beaker size={18} strokeWidth={2.2} aria-hidden="true" />,
		label: "TOC",
		color: "text-emerald-400",
		badgeBg: "bg-emerald-500/10",
		badgeText: "text-emerald-400",
		badgeBorder: "border-emerald-500/20",
		border: "border-emerald-500/30",
		dotColor: "bg-emerald-500",
	},
	TN: {
		icon: <TestTube2 size={18} strokeWidth={2.2} aria-hidden="true" />,
		label: "TN",
		color: "text-sky-400",
		badgeBg: "bg-sky-500/10",
		badgeText: "text-sky-400",
		badgeBorder: "border-sky-500/20",
		border: "border-sky-500/30",
		dotColor: "bg-sky-500",
	},
	TP: {
		icon: <FlaskConical size={18} strokeWidth={2.2} aria-hidden="true" />,
		label: "TP",
		color: "text-blue-400",
		badgeBg: "bg-blue-500/10",
		badgeText: "text-blue-400",
		badgeBorder: "border-blue-500/20",
		border: "border-blue-500/30",
		dotColor: "bg-blue-500",
	},
	생물감시: {
		icon: <Bug size={18} strokeWidth={2.2} aria-hidden="true" />,
		label: "생물감시",
		color: "text-purple-400",
		badgeBg: "bg-purple-500/10",
		badgeText: "text-purple-400",
		badgeBorder: "border-purple-500/20",
		border: "border-purple-500/30",
		dotColor: "bg-purple-500",
	},
	"공통 표준용액": {
		icon: <Sparkles size={18} strokeWidth={2.2} aria-hidden="true" />,
		label: "공통 표준용액",
		color: "text-amber-400",
		badgeBg: "bg-amber-500/10",
		badgeText: "text-amber-400",
		badgeBorder: "border-amber-500/20",
		border: "border-amber-500/30",
		dotColor: "bg-amber-500",
	},
};

/**
 * 측정소별 해당 시약 목록 추출
 */
export function getReagentsForStation(
	station: StationData,
): { category: string; reagents: ReagentData[] }[] {
	const result: { category: string; reagents: ReagentData[] }[] = [];

	if (station.toc?.equipment) {
		const eq = station.toc.equipment;
		const tocReagents = REAGENTS.filter(
			(r) =>
				r.category === "TOC" &&
				r.equipmentTypes.some((t) =>
					eq.toLowerCase().includes(t.toLowerCase()),
				),
		);
		if (tocReagents.length > 0) {
			result.push({ category: "TOC", reagents: tocReagents });
		}
	}

	if (station.tn?.equipment) {
		const eq = station.tn.equipment;
		const tnReagents = REAGENTS.filter(
			(r) =>
				r.category === "TN" &&
				r.equipmentTypes.some((t) =>
					eq.toLowerCase().includes(t.toLowerCase()),
				),
		);
		if (tnReagents.length > 0) {
			result.push({ category: "TN", reagents: tnReagents });
		}
	}

	if (station.tp?.equipment) {
		const eq = station.tp.equipment;
		const tpReagents = REAGENTS.filter(
			(r) =>
				r.category === "TP" &&
				r.equipmentTypes.some((t) =>
					eq.toLowerCase().includes(t.toLowerCase()),
				),
		);
		if (tpReagents.length > 0) {
			result.push({ category: "TP", reagents: tpReagents });
		}
	}

	if (station.bio) {
		const bioTypes: string[] = [];
		if (station.bio.microbe) bioTypes.push("미생물");
		if (station.bio.itox) bioTypes.push("발광박테리아");
		if (station.bio.daphnia) bioTypes.push("물벼룩");

		const bioReagents = REAGENTS.filter(
			(r) =>
				r.category === "BIO" &&
				r.equipmentTypes.some((t) =>
					bioTypes.some((bt) => bt.includes(t) || t.includes(bt)),
				),
		);
		if (bioReagents.length > 0) {
			result.push({ category: "생물감시", reagents: bioReagents });
		}
	}

	const commonReagents = REAGENTS.filter((r) => r.category === "공통표준");
	if (commonReagents.length > 0) {
		result.push({ category: "공통 표준용액", reagents: commonReagents });
	}

	return result;
}

/**
 * 전체 시약을 카테고리별로 그룹화
 */
export function groupAllReagents(): {
	category: string;
	items: ReagentData[];
}[] {
	const tocList: ReagentData[] = [];
	const tnList: ReagentData[] = [];
	const tpList: ReagentData[] = [];
	const bioList: ReagentData[] = [];
	const commonList: ReagentData[] = [];

	for (const r of REAGENTS) {
		if (r.category === "TOC") tocList.push(r);
		else if (r.category === "TN") tnList.push(r);
		else if (r.category === "TP") tpList.push(r);
		else if (r.category === "BIO") bioList.push(r);
		else if (r.category === "공통표준") commonList.push(r);
	}

	return [
		{ category: "TOC", items: tocList },
		{ category: "TN", items: tnList },
		{ category: "TP", items: tpList },
		{ category: "생물감시", items: bioList },
		{ category: "공통 표준용액", items: commonList },
	];
}
