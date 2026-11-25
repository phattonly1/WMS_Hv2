"use client";

import { ArrowRight, CheckCircle2, Layers, Wrench } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { type BomDataset, formatWon } from "../types";

interface BomDiagramGuideTabProps {
	bomData: BomDataset;
	activeModel: string;
	highlightPartCode: string | null;
	onJumpToProcurementPart: (partCode: string) => void;
}

export default function BomDiagramGuideTab({
	bomData,
	activeModel,
	highlightPartCode,
	onJumpToProcurementPart,
}: BomDiagramGuideTabProps) {
	const modelKeys = Object.keys(bomData);
	const currentModel = bomData[activeModel] ?? bomData[modelKeys[0] ?? ""];
	const [activeSectionId, setActiveSectionId] = useState<string>(
		currentModel?.sections[0]?.id ?? "front",
	);

	useEffect(() => {
		if (!currentModel) return;
		if (highlightPartCode) {
			const matchedSection = currentModel.sections.find((sec) =>
				sec.callouts.some((c) =>
					(c.defaultPartCodes ?? []).includes(highlightPartCode),
				),
			);
			if (matchedSection) {
				setActiveSectionId(matchedSection.id);
				return;
			}
		}
		if (!currentModel.sections.some((s) => s.id === activeSectionId)) {
			setActiveSectionId(currentModel.sections[0]?.id ?? "front");
		}
	}, [currentModel, highlightPartCode, activeSectionId]);

	if (!currentModel) {
		return (
			<div className="rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] p-10 text-center text-xs text-[#64748b] dark:text-[#a1a1aa]">
				도해 데이터를 불러올 수 없습니다.
			</div>
		);
	}

	const currentSection =
		currentModel.sections.find((s) => s.id === activeSectionId) ??
		currentModel.sections[0];

	return (
		<div className="flex flex-col gap-4">
			{/* 1. 선택된 장비 부위별 실물 도해 + 번호별 콜아웃 매핑 (장비 선택은 좌측 사이드바에서 제어) */}
			{currentSection && (
				<section className="grid grid-cols-12 gap-4">
					{/* 좌측: 이미지 뷰어 */}
					<div className="col-span-6 flex flex-col gap-3 rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] p-4 shadow-sm">
						<div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e8f0] dark:border-[#222228] pb-3">
							<span className="font-mono text-sm font-bold text-[#2563eb] dark:text-[#60a5fa]">
								{currentModel.label}
							</span>
							<div className="flex flex-wrap items-center gap-1.5">
								{currentModel.sections.map((sec) => {
									const active = sec.id === currentSection.id;
									return (
										<button
											key={sec.id}
											type="button"
											onClick={() => setActiveSectionId(sec.id)}
											className={`inline-flex min-h-10 items-center gap-1 rounded-xl border px-3 text-xs font-bold transition-colors ${
												active
													? "border-[#2563eb] bg-[#2563eb] text-white"
													: "border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#16161c] text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-white"
											}`}
										>
											<span>{sec.title}</span>
											{sec.pageNo && (
												<span className="font-mono text-[10px] opacity-80">
													({sec.pageNo})
												</span>
											)}
										</button>
									);
								})}
							</div>
						</div>

						<div className="relative flex min-h-80 flex-1 w-full items-center justify-center overflow-hidden rounded-xl border border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b] p-3">
							<Image
								src={currentSection.imageSrc}
								alt={`${currentModel.label} - ${currentSection.title}`}
								width={720}
								height={540}
								className="max-h-[460px] w-auto object-contain rounded-lg"
							/>
						</div>
					</div>

					{/* 우측: 콜아웃 상세 및 연결 부품코드 */}
					<div className="col-span-6 flex flex-col gap-3 rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] p-4 shadow-sm">
						<div className="flex items-center justify-between border-b border-[#e2e8f0] dark:border-[#222228] pb-3 min-h-10">
							<h2 className="text-sm font-bold text-[#0f172a] dark:text-white break-keep">
								{currentSection.title} — 구성 부품 및 점검 포인트
							</h2>
							<span className="font-mono text-xs text-[#64748b] dark:text-[#a1a1aa]">
								{currentSection.callouts.length}개 항목
							</span>
						</div>

						<div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
							{currentSection.callouts.map((c) => {
								const isHighlighted =
									highlightPartCode !== null &&
									(c.defaultPartCodes ?? []).includes(highlightPartCode);
								return (
									<div
										key={`${c.no}-${c.circle}`}
										className={`rounded-xl border p-3 transition-colors ${
											isHighlighted
												? "border-[#2563eb] bg-[#eff6ff] dark:bg-[#2563eb]/15"
												: "border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#09090b]"
										}`}
									>
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div className="flex items-center gap-2">
												<span className="inline-flex items-center rounded-lg bg-[#2563eb] px-2 py-0.5 font-mono text-xs font-bold text-white">
													{c.circle}
												</span>
												<span className="text-xs font-bold text-[#0f172a] dark:text-white break-keep">
													{c.name}
												</span>
											</div>

											<div className="flex flex-wrap gap-1">
												{(c.defaultPartCodes ?? []).map((code) => (
													<button
														key={code}
														type="button"
														onClick={() => onJumpToProcurementPart(code)}
														className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[#06b6d4]/40 bg-[#06b6d4]/10 px-2.5 font-mono text-xs font-semibold text-[#0284c7] dark:text-[#38bdf8] hover:bg-[#06b6d4]/20"
														title="구매·예산 산출 탭에서 이 부품코드 검색"
													>
														<span>{code}</span>
														<ArrowRight size={11} />
													</button>
												))}
											</div>
										</div>

										<p className="mt-1 text-xs text-[#475569] dark:text-[#d4d4d8] break-keep">
											{c.desc}
										</p>

										{c.subItems && c.subItems.length > 0 && (
											<div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-[#e2e8f0] dark:border-[#222228] pt-2">
												{c.subItems.map((sub) => (
													<div
														key={`${sub.circle}-${sub.name}`}
														className="rounded-lg bg-white dark:bg-[#111115] border border-[#e2e8f0] dark:border-[#222228] px-2 py-1.5 text-[11px]"
													>
														<span className="font-mono font-bold text-[#2563eb] dark:text-[#60a5fa]">
															{sub.circle}
														</span>{" "}
														<span className="font-semibold text-[#0f172a] dark:text-white">
															{sub.name}
														</span>
														<div className="text-[10px] text-[#64748b] dark:text-[#a1a1aa]">
															{sub.desc}
														</div>
													</div>
												))}
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				</section>
			)}

			{/* 2. 해당 장비 표준 BOM & 호환 대체품 일람표 */}
			<section className="rounded-2xl border border-[#e2e8f0] dark:border-[#222228] bg-white dark:bg-[#111115] overflow-hidden shadow-sm">
				<div className="flex items-center justify-between gap-2 border-b border-[#e2e8f0] dark:border-[#222228] px-4 py-3.5">
					<div className="flex items-center gap-2">
						<Wrench
							size={15}
							className="text-[#059669] dark:text-[#34d399] shrink-0"
						/>
						<h3 className="text-sm font-bold text-[#0f172a] dark:text-white break-keep">
							{currentModel.label} 대당 기준 BOM 및 호환 대체품 명세 (
							{currentModel.partsMaster.length}종)
						</h3>
					</div>
					<span className="text-xs text-[#64748b] dark:text-[#a1a1aa]">
						부품코드 클릭 시 통합 구매리스트 해당 품목으로 이동합니다
					</span>
				</div>

				<div className="w-full overflow-x-auto">
					<table className="w-full border-collapse text-left text-xs">
						<thead>
							<tr className="border-b border-[#e2e8f0] dark:border-[#222228] bg-[#f8fafc] dark:bg-[#16161c] text-[11px] font-bold text-[#475569] dark:text-[#a1a1aa]">
								<th className="px-3.5 py-3 whitespace-nowrap">구분</th>
								<th className="px-3.5 py-3 whitespace-nowrap">부품코드</th>
								<th className="px-3.5 py-3 whitespace-nowrap">품명</th>
								<th className="px-3.5 py-3 whitespace-nowrap text-center">
									대당 소요량
								</th>
								<th className="px-3.5 py-3 whitespace-nowrap">
									장착 위치 · 교체주기 · 점검기준
								</th>
								<th className="px-3.5 py-3 whitespace-nowrap">
									호환 대체품 규격 (예산절감 참고)
								</th>
								<th className="px-3.5 py-3 whitespace-nowrap text-right">
									BOM 기준단가
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#e2e8f0] dark:divide-[#222228]/70">
							{currentModel.partsMaster.map((part) => {
								const isHighlighted = highlightPartCode === part.partCode;
								return (
									<tr
										key={`${part.partCode}-${part.name}`}
										className={`transition-colors ${
											isHighlighted
												? "bg-[#eff6ff] dark:bg-[#2563eb]/15"
												: "hover:bg-[#f8fafc] dark:hover:bg-[#16161c]"
										}`}
									>
										<td className="px-3.5 py-2.5 align-top whitespace-nowrap">
											{part.isAnnualStandard ? (
												<span className="inline-flex items-center gap-1 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 px-2 py-0.5 text-[10px] font-semibold text-[#059669] dark:text-[#34d399]">
													<CheckCircle2 size={11} />
													연간표준
												</span>
											) : (
												<span className="inline-flex items-center gap-1 rounded-lg bg-[#f1f5f9] dark:bg-[#222228] px-2 py-0.5 text-[10px] text-[#64748b] dark:text-[#a1a1aa]">
													<Layers size={11} />
													예비/수리
												</span>
											)}
										</td>
										<td className="px-3.5 py-2.5 align-top whitespace-nowrap">
											<button
												type="button"
												onClick={() => onJumpToProcurementPart(part.partCode)}
												className="inline-flex min-h-10 items-center gap-1 font-mono text-xs font-bold text-[#2563eb] dark:text-[#60a5fa] hover:underline"
											>
												<span>{part.partCode}</span>
												<ArrowRight size={11} />
											</button>
										</td>
										<td className="px-3.5 py-2.5 align-top font-bold text-[#0f172a] dark:text-white break-keep">
											{part.name}
										</td>
										<td className="px-3.5 py-2.5 align-top text-center font-mono font-semibold text-[#0f172a] dark:text-white whitespace-nowrap">
											{part.qty} {part.unit}
										</td>
										<td className="px-3.5 py-2.5 align-top text-[#475569] dark:text-[#d4d4d8] break-keep">
											{part.spec || "-"}
										</td>
										<td className="px-3.5 py-2.5 align-top break-keep">
											{part.altPart ? (
												<span className="inline-block rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 px-2 py-0.5 text-[11px] font-medium text-[#059669] dark:text-[#34d399]">
													{part.altPart}
												</span>
											) : (
												<span className="text-[#94a3b8] dark:text-[#52525b]">
													-
												</span>
											)}
										</td>
										<td className="px-3.5 py-2.5 align-top text-right font-mono text-[#475569] dark:text-[#d4d4d8] whitespace-nowrap">
											{formatWon(part.unitPrice ?? null)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}
