"use client";

import * as fflate from "fflate";
import {
	type ConsumableItem,
	type HandoverPlanState,
	MANUFACTURER_BRIEFS,
	parseBaseQty,
	resolveUnitPrice,
} from "./types";

function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function colLetter(colIdx: number): string {
	let n = colIdx + 1;
	let s = "";
	while (n > 0) {
		const mod = (n - 1) % 26;
		s = String.fromCharCode(65 + mod) + s;
		n = Math.floor((n - 1) / 26);
	}
	return s;
}

type CellVal =
	| { t: "s"; v: string; style?: number }
	| { t: "n"; v: number; style?: number };

function buildSheetXml(rows: CellVal[][], colWidths: number[]): string {
	const colsXml = colWidths
		.map(
			(w, idx) =>
				`<col min="${idx + 1}" max="${idx + 1}" width="${w}" customWidth="1"/>`,
		)
		.join("");

	const rowsXml = rows
		.map((row, rIdx) => {
			const rNum = rIdx + 1;
			const isHeader = rIdx === 0;
			const ht = isHeader
				? ` ht="26" customHeight="1"`
				: ` ht="20" customHeight="1"`;
			const cells = row
				.map((cell, cIdx) => {
					const ref = `${colLetter(cIdx)}${rNum}`;
					const sAttr = ` s="${cell.style ?? 1}"`;
					if (cell.t === "n") {
						return `<c r="${ref}"${sAttr}><v>${cell.v}</v></c>`;
					}
					return `<c r="${ref}" t="inlineStr"${sAttr}><is><t xml:space="preserve">${escapeXml(cell.v)}</t></is></c>`;
				})
				.join("");
			return `<row r="${rNum}"${ht}>${cells}</row>`;
		})
		.join("");

	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${colsXml}</cols>
  <sheetData>${rowsXml}</sheetData>
</worksheet>`;
}

function buildStylesXml(): string {
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="165" formatCode="#,##0"/>
  </numFmts>
  <fonts count="3">
    <font><sz val="10"/><color rgb="FF0F172A"/><name val="맑은 고딕"/><charset val="129"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="맑은 고딕"/><charset val="129"/></font>
    <font><b/><sz val="10"/><color rgb="FF0F172A"/><name val="맑은 고딕"/><charset val="129"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E3A8A"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="5">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <!-- 1: 일반 텍스트 -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
    <!-- 2: 헤더 (남색 배경, 흰 글씨 Bold) -->
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 3: 숫자 포맷 (#,##0) -->
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 4: 요약 강조 행 (연회색 배경 Bold 숫자) -->
    <xf numFmtId="165" fontId="2" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="right" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;
}

export function downloadContractsXlsx(
	items: ConsumableItem[],
	plan: HandoverPlanState,
): void {
	// 시트 1: 선정된 구매 발주 내역서
	const selectedRows: CellVal[][] = [
		[
			{ t: "s", v: "연번", style: 2 },
			{ t: "s", v: "제조사", style: 2 },
			{ t: "s", v: "품목구분", style: 2 },
			{ t: "s", v: "측정항목", style: 2 },
			{ t: "s", v: "적용장비", style: 2 },
			{ t: "s", v: "부품코드(P/N)", style: 2 },
			{ t: "s", v: "품명", style: 2 },
			{ t: "s", v: "상세규격", style: 2 },
			{ t: "s", v: "단위", style: 2 },
			{ t: "s", v: "계획수량", style: 2 },
			{ t: "s", v: "적용단가(VAT별도)", style: 2 },
			{ t: "s", v: "단가기준", style: 2 },
			{ t: "s", v: "예상금액(VAT별도)", style: 2 },
			{ t: "s", v: "교체주기", style: 2 },
			{ t: "s", v: "견적근거/비고", style: 2 },
			{ t: "s", v: "인수인계 메모", style: 2 },
		],
	];

	let seq = 1;
	let totalSupplyWon = 0;

	for (const item of items) {
		const entry = plan.entries[item.id];
		if (!entry?.selected) continue;

		const qty = entry.qty ?? parseBaseQty(item.baseQty);
		const { price, source } = resolveUnitPrice(item, entry);
		const lineTotal = price !== null ? price * qty : 0;
		totalSupplyWon += lineTotal;

		const sourceLabel =
			source === "custom"
				? "수동입력단가"
				: source === "26"
					? "26년 견적"
					: source === "25"
						? "25년 단가(대체)"
						: "미확보";

		selectedRows.push([
			{ t: "n", v: seq++, style: 3 },
			{ t: "s", v: item.manufacturer, style: 1 },
			{ t: "s", v: item.partGroup, style: 1 },
			{ t: "s", v: item.category, style: 1 },
			{ t: "s", v: item.model, style: 1 },
			{ t: "s", v: item.partNumber, style: 1 },
			{ t: "s", v: item.name, style: 1 },
			{ t: "s", v: item.spec, style: 1 },
			{ t: "s", v: item.unit, style: 1 },
			{ t: "n", v: qty, style: 3 },
			price !== null
				? { t: "n", v: price, style: 3 }
				: { t: "s", v: "-", style: 1 },
			{ t: "s", v: sourceLabel, style: 1 },
			price !== null
				? { t: "n", v: lineTotal, style: 4 }
				: { t: "s", v: "-", style: 1 },
			{ t: "s", v: item.cycle, style: 1 },
			{ t: "s", v: item.note, style: 1 },
			{ t: "s", v: entry.memo || "", style: 1 },
		]);
	}

	selectedRows.push([
		{ t: "s", v: "합계 (공급가액 / VAT 별도)", style: 2 },
		{ t: "s", v: "", style: 1 },
		{ t: "s", v: "", style: 1 },
		{ t: "s", v: "", style: 1 },
		{ t: "s", v: "", style: 1 },
		{ t: "s", v: "", style: 1 },
		{ t: "s", v: "", style: 1 },
		{ t: "s", v: "", style: 1 },
		{ t: "s", v: "", style: 1 },
		{ t: "s", v: "", style: 1 },
		{ t: "s", v: "", style: 1 },
		{ t: "s", v: "공급가 합계", style: 1 },
		{ t: "n", v: totalSupplyWon, style: 4 },
		{ t: "s", v: "VAT 포함(×1.1)", style: 1 },
		{ t: "n", v: Math.round(totalSupplyWon * 1.1), style: 4 },
		{ t: "s", v: "", style: 1 },
	]);

	// 시트 2: 제조사별 요약 및 인수인계 브리핑
	const summaryRows: CellVal[][] = [
		[
			{ t: "s", v: "구분/제조사", style: 2 },
			{ t: "s", v: "전체 마스터 품목수", style: 2 },
			{ t: "s", v: "구매선정 품목수", style: 2 },
			{ t: "s", v: "단가 미확보(선정분)", style: 2 },
			{ t: "s", v: "예상 공급가액(원)", style: 2 },
			{ t: "s", v: "예상 부가세 포함(원)", style: 2 },
			{ t: "s", v: "견적 근거", style: 2 },
			{ t: "s", v: "계약 검토 / 인수인계 메모", style: 2 },
		],
	];

	for (const brief of MANUFACTURER_BRIEFS) {
		const mfg = brief.manufacturer;
		const mfgItems = items.filter((i) => i.manufacturer === mfg);
		let selCount = 0;
		let unpricedSelCount = 0;
		let mfgSum = 0;

		for (const item of mfgItems) {
			const entry = plan.entries[item.id];
			if (!entry?.selected) continue;
			selCount++;
			const { price } = resolveUnitPrice(item, entry);
			if (price === null) {
				unpricedSelCount++;
			} else {
				mfgSum += price * (entry.qty ?? parseBaseQty(item.baseQty));
			}
		}

		const customMemo = plan.mfgMemos[mfg]?.trim();
		const combinedNote = customMemo
			? `[담당자 메모] ${customMemo} / [기본 전략] ${brief.contractStrategy}`
			: brief.contractStrategy;

		summaryRows.push([
			{ t: "s", v: mfg, style: 1 },
			{ t: "n", v: mfgItems.length, style: 3 },
			{ t: "n", v: selCount, style: 3 },
			{ t: "n", v: unpricedSelCount, style: 3 },
			{ t: "n", v: mfgSum, style: 4 },
			{ t: "n", v: Math.round(mfgSum * 1.1), style: 4 },
			{ t: "s", v: brief.quoteBasis, style: 1 },
			{ t: "s", v: combinedNote, style: 1 },
		]);
	}

	summaryRows.push([
		{ t: "s", v: "문서 제목", style: 2 },
		{ t: "s", v: plan.title, style: 1 },
		{ t: "s", v: "작성/인계자", style: 2 },
		{ t: "s", v: plan.author || "-", style: 1 },
		{ t: "s", v: "총계(VAT별도)", style: 2 },
		{ t: "n", v: totalSupplyWon, style: 4 },
		{ t: "s", v: "공통 인계사항", style: 2 },
		{ t: "s", v: plan.handoverNotes, style: 1 },
	]);

	// 시트 3: 전체 마스터 단가표 (313건 원본 + 계획상태)
	const masterRows: CellVal[][] = [
		[
			{ t: "s", v: "ID", style: 2 },
			{ t: "s", v: "발주포함", style: 2 },
			{ t: "s", v: "제조사", style: 2 },
			{ t: "s", v: "구분", style: 2 },
			{ t: "s", v: "측정항목", style: 2 },
			{ t: "s", v: "적용장비", style: 2 },
			{ t: "s", v: "부품코드", style: 2 },
			{ t: "s", v: "품명", style: 2 },
			{ t: "s", v: "규격", style: 2 },
			{ t: "s", v: "단위", style: 2 },
			{ t: "s", v: "기준수량", style: 2 },
			{ t: "s", v: "계획수량", style: 2 },
			{ t: "s", v: "교체주기", style: 2 },
			{ t: "s", v: "25년 단가", style: 2 },
			{ t: "s", v: "26년 단가", style: 2 },
			{ t: "s", v: "비고", style: 2 },
			{ t: "s", v: "담당자 메모", style: 2 },
		],
	];

	for (const item of items) {
		const entry = plan.entries[item.id];
		masterRows.push([
			{ t: "n", v: item.id, style: 3 },
			{ t: "s", v: entry?.selected ? "O" : "", style: 1 },
			{ t: "s", v: item.manufacturer, style: 1 },
			{ t: "s", v: item.partGroup, style: 1 },
			{ t: "s", v: item.category, style: 1 },
			{ t: "s", v: item.model, style: 1 },
			{ t: "s", v: item.partNumber, style: 1 },
			{ t: "s", v: item.name, style: 1 },
			{ t: "s", v: item.spec, style: 1 },
			{ t: "s", v: item.unit, style: 1 },
			{ t: "s", v: item.baseQty, style: 1 },
			{ t: "n", v: entry?.qty ?? parseBaseQty(item.baseQty), style: 3 },
			{ t: "s", v: item.cycle, style: 1 },
			item.price25 !== null
				? { t: "n", v: item.price25, style: 3 }
				: { t: "s", v: "", style: 1 },
			item.price26 !== null
				? { t: "n", v: item.price26, style: 3 }
				: { t: "s", v: "", style: 1 },
			{ t: "s", v: item.note, style: 1 },
			{ t: "s", v: entry?.memo || "", style: 1 },
		]);
	}

	const files: Record<string, Uint8Array> = {
		"[Content_Types].xml":
			fflate.strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`),
		"_rels/.rels":
			fflate.strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
		"xl/workbook.xml":
			fflate.strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="1_선정구매내역서" sheetId="1" r:id="rId1"/>
    <sheet name="2_업체별요약_인수인계" sheetId="2" r:id="rId2"/>
    <sheet name="3_통합마스터단가표" sheetId="3" r:id="rId3"/>
  </sheets>
</workbook>`),
		"xl/_rels/workbook.xml.rels":
			fflate.strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
		"xl/styles.xml": fflate.strToU8(buildStylesXml()),
		"xl/worksheets/sheet1.xml": fflate.strToU8(
			buildSheetXml(
				selectedRows,
				[7, 12, 13, 18, 24, 15, 28, 30, 8, 10, 16, 15, 18, 13, 30, 26],
			),
		),
		"xl/worksheets/sheet2.xml": fflate.strToU8(
			buildSheetXml(summaryRows, [14, 16, 16, 18, 20, 20, 36, 55]),
		),
		"xl/worksheets/sheet3.xml": fflate.strToU8(
			buildSheetXml(
				masterRows,
				[7, 9, 12, 13, 18, 24, 15, 28, 30, 8, 10, 10, 13, 15, 15, 30, 24],
			),
		),
	};

	const zipped = fflate.zipSync(files, { level: 6 });
	const blob = new Blob([zipped.buffer as ArrayBuffer], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	const dateTag = new Date().toISOString().slice(0, 10);
	a.href = url;
	a.download = `소모품_구매계약_산출내역_및_인수인계_${dateTag}.xlsx`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export function exportHandoverJson(plan: HandoverPlanState): void {
	const payload = JSON.stringify(
		{
			...plan,
			updatedAt: new Date().toISOString(),
		},
		null,
		2,
	);
	const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	const dateTag = new Date().toISOString().slice(0, 10);
	a.href = url;
	a.download = `소모품_인수인계_작업본_${dateTag}.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
