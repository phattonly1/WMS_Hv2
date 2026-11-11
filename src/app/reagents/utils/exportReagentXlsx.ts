"use client";

import * as fflate from "fflate";
import type { ReagentOrderSheet, ReagentPerson } from "@/actions/reagents";
import {
	PEOPLE_LIST,
	PERSON_GREEN_ROWS,
	parseCellExpression,
	REAGENT_SPEC_ROWS,
} from "../constants";

function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function buildStylesXml(): string {
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="176" formatCode="0.0"/>
  </numFmts>
  <fonts count="4">
    <!-- 0: 기본 11pt 맑은 고딕 -->
    <font><sz val="11"/><color rgb="FF000000"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font>
    <!-- 1: 10pt 맑은 고딕 (일반 데이터) -->
    <font><sz val="10"/><color rgb="FF000000"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font>
    <!-- 2: 10pt 맑은 고딕 Bold (헤더/카테고리/측정소/합계) -->
    <font><b/><sz val="10"/><color rgb="FF000000"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font>
    <!-- 3: 11pt 맑은 고딕 Bold -->
    <font><b/><sz val="11"/><color rgb="FF000000"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font>
  </fonts>
  <fills count="5">
    <!-- 0: none -->
    <fill><patternFill patternType="none"/></fill>
    <!-- 1: gray125 -->
    <fill><patternFill patternType="gray125"/></fill>
    <!-- 2: 흰색 (#FFFFFF) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor indexed="64"/></patternFill></fill>
    <!-- 3: 노란색 (#FFFF00 - 헤더 & 측정항목) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill>
    <!-- 4: 초록색 (#70AD47 - 측정소 사용 시약 셀) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FF70AD47"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="11">
    <!-- 0: 없음 -->
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <!-- 1: 일반 사방 thin -->
    <border>
      <left style="thin"><color auto="1"/></left>
      <right style="thin"><color auto="1"/></right>
      <top style="thin"><color auto="1"/></top>
      <bottom style="thin"><color auto="1"/></bottom>
      <diagonal/>
    </border>
    <!-- 2: 헤더 좌측 끝 (left medium, top medium, right thin, bottom double) -->
    <border>
      <left style="medium"><color auto="1"/></left>
      <right style="thin"><color auto="1"/></right>
      <top style="medium"><color auto="1"/></top>
      <bottom style="double"><color auto="1"/></bottom>
      <diagonal/>
    </border>
    <!-- 3: 헤더 중간 (left thin, right thin, top medium, bottom double) -->
    <border>
      <left style="thin"><color auto="1"/></left>
      <right style="thin"><color auto="1"/></right>
      <top style="medium"><color auto="1"/></top>
      <bottom style="double"><color auto="1"/></bottom>
      <diagonal/>
    </border>
    <!-- 4: 헤더 우측 끝 (left thin, right medium, top medium, bottom double) -->
    <border>
      <left style="thin"><color auto="1"/></left>
      <right style="medium"><color auto="1"/></right>
      <top style="medium"><color auto="1"/></top>
      <bottom style="double"><color auto="1"/></bottom>
      <diagonal/>
    </border>
    <!-- 5: 카테고리 열 (left medium, right thin, top thin, bottom thin) -->
    <border>
      <left style="medium"><color auto="1"/></left>
      <right style="thin"><color auto="1"/></right>
      <top style="thin"><color auto="1"/></top>
      <bottom style="thin"><color auto="1"/></bottom>
      <diagonal/>
    </border>
    <!-- 6: 카테고리 열 마지막 행 (left medium, right thin, top thin, bottom medium) -->
    <border>
      <left style="medium"><color auto="1"/></left>
      <right style="thin"><color auto="1"/></right>
      <top style="thin"><color auto="1"/></top>
      <bottom style="medium"><color auto="1"/></bottom>
      <diagonal/>
    </border>
    <!-- 7: 합계 열 일반 (left thin, right medium, top thin, bottom thin) -->
    <border>
      <left style="thin"><color auto="1"/></left>
      <right style="medium"><color auto="1"/></right>
      <top style="thin"><color auto="1"/></top>
      <bottom style="thin"><color auto="1"/></bottom>
      <diagonal/>
    </border>
    <!-- 8: 합계 열 마지막 행 (left thin, right medium, top thin, bottom medium) -->
    <border>
      <left style="thin"><color auto="1"/></left>
      <right style="medium"><color auto="1"/></right>
      <top style="thin"><color auto="1"/></top>
      <bottom style="medium"><color auto="1"/></bottom>
      <diagonal/>
    </border>
    <!-- 9: 마지막 행 중간 셀 (left thin, right thin, top thin, bottom medium) -->
    <border>
      <left style="thin"><color auto="1"/></left>
      <right style="thin"><color auto="1"/></right>
      <top style="thin"><color auto="1"/></top>
      <bottom style="medium"><color auto="1"/></bottom>
      <diagonal/>
    </border>
    <!-- 10: 하단 합계 행 (left thin, right thin, top double, bottom medium) -->
    <border>
      <left style="thin"><color auto="1"/></left>
      <right style="thin"><color auto="1"/></right>
      <top style="double"><color auto="1"/></top>
      <bottom style="medium"><color auto="1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="18">
    <!-- 0: 기본 빈 셀 -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment vertical="center"/></xf>
    <!-- 1: 헤더 좌측 끝 (노란색, Bold, border 2) -->
    <xf numFmtId="0" fontId="2" fillId="3" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <!-- 2: 헤더 중간 (노란색, Bold, border 3) -->
    <xf numFmtId="0" fontId="2" fillId="3" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <!-- 3: 헤더 우측 끝 합계 (노란색, Bold, border 4) -->
    <xf numFmtId="0" fontId="2" fillId="3" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <!-- 4: 측정항목 카테고리 일반 (노란색, Bold, border 5) -->
    <xf numFmtId="0" fontId="2" fillId="3" borderId="5" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 5: 측정항목 카테고리 마지막 행 (노란색, Bold, border 6) -->
    <xf numFmtId="0" fontId="2" fillId="3" borderId="6" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 6: 일반 텍스트 셀 (흰색, 10pt, border 1) -->
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <!-- 7: 일반 텍스트 셀 마지막 행 (흰색, 10pt, border 9) -->
    <xf numFmtId="0" fontId="1" fillId="2" borderId="9" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <!-- 8: 측정소 녹색 셀 일반 (#70AD47, Bold, border 1) -->
    <xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <!-- 9: 측정소 녹색 셀 마지막 행 (#70AD47, Bold, border 9) -->
    <xf numFmtId="0" fontId="2" fillId="4" borderId="9" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <!-- 10: 측정소 흰색 셀 일반 (Bold, border 1) -->
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <!-- 11: 측정소 흰색 셀 마지막 행 (Bold, border 9) -->
    <xf numFmtId="0" fontId="2" fillId="2" borderId="9" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <!-- 12: 우측 합계 셀 일반 (Bold, border 7) -->
    <xf numFmtId="0" fontId="2" fillId="2" borderId="7" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 13: 우측 합계 셀 마지막 행 (Bold, border 8) -->
    <xf numFmtId="0" fontId="2" fillId="2" borderId="8" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 14: 기본 셀 예비 -->
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <!-- 15: 기본 셀 예비 -->
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <!-- 16: 하단 총합계 행 노란색 셀 -->
    <xf numFmtId="0" fontId="2" fillId="3" borderId="10" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 17: 숫자 소수점 셀 (0.0 포맷, 흰색, border 1) -->
    <xf numFmtId="176" fontId="1" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="표준" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>`;
}

function makeInlineStrCell(
	col: string,
	rowNum: number,
	styleIdx: number,
	val: string,
): string {
	if (!val) {
		return `<c r="${col}${rowNum}" s="${styleIdx}"/>`;
	}
	return `<c r="${col}${rowNum}" s="${styleIdx}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(val)}</t></is></c>`;
}

function makeNumOrStrCell(
	col: string,
	rowNum: number,
	styleIdx: number,
	val: string | number,
): string {
	if (val === "" || val === undefined || val === null) {
		return `<c r="${col}${rowNum}" s="${styleIdx}"/>`;
	}
	if (typeof val === "number" && Number.isFinite(val)) {
		return `<c r="${col}${rowNum}" s="${styleIdx}"><v>${val}</v></c>`;
	}
	const strVal = String(val).trim();
	const asNum = Number(strVal);
	if (strVal !== "" && !Number.isNaN(asNum) && /^(\d+(\.\d+)?)$/.test(strVal)) {
		return `<c r="${col}${rowNum}" s="${styleIdx}"><v>${asNum}</v></c>`;
	}
	return makeInlineStrCell(col, rowNum, styleIdx, strVal);
}

interface BuildSheetParams {
	isSummaryView: boolean;
	currentSheet: ReagentOrderSheet | null;
	summaryCells: Record<string, Record<ReagentPerson, number>>;
}

/**
 * 1-based 열 번호(1=A, 2=B, ..., 8=H, ..., 27=AA)를 엑셀 알파벳으로 변환
 */
function colNumberToLetter(colNum: number): string {
	let n = colNum;
	let letter = "";
	while (n > 0) {
		const mod = (n - 1) % 26;
		letter = String.fromCharCode(65 + mod) + letter;
		n = Math.floor((n - 1) / 26);
	}
	return letter;
}

function buildWorksheetXml({
	isSummaryView,
	currentSheet,
	summaryCells,
}: BuildSheetParams): string {
	const rowsXml: string[] = [];

	// B=2, C=3, D=4, E=5, F=6, G=7, 측정소 시작=8(H열)
	const firstPersonColNum = 8;
	const personCount = PEOPLE_LIST.length;
	const lastPersonColNum = firstPersonColNum + personCount - 1;
	const sumColNum = lastPersonColNum + 1;
	const sumColLetter = colNumberToLetter(sumColNum);

	const totalRows = REAGENT_SPEC_ROWS.length;
	const firstDataRowNum = 3;
	const lastDataRowNum = firstDataRowNum + totalRows - 1;

	// Row 2: 헤더 행 (높이 33.45) - PEOPLE_LIST 동적 생성
	const headerCells = [
		makeInlineStrCell("B", 2, 1, "측정항목"),
		makeInlineStrCell("C", 2, 2, "측정기기"),
		makeInlineStrCell("D", 2, 2, "회사명"),
		makeInlineStrCell("E", 2, 2, "제조시약명"),
		makeInlineStrCell("F", 2, 2, "작년 주문량\n(1달, 기기 당)"),
		makeInlineStrCell("G", 2, 2, "매뉴얼\n(1달, 기기 당)"),
		...PEOPLE_LIST.map((person, pIdx) =>
			makeInlineStrCell(
				colNumberToLetter(firstPersonColNum + pIdx),
				2,
				2,
				person,
			),
		),
		makeInlineStrCell(sumColLetter, 2, 3, "합계"),
	];
	rowsXml.push(
		`<row r="2" spans="2:${sumColNum}" ht="33.45" customHeight="1" thickBot="1">${headerCells.join("")}</row>`,
	);

	// 동적 병합 범위 수집 배열
	const mergeRefs: string[] = [];
	let catStartRow = firstDataRowNum;

	// 시약 데이터 행 동적 생성 (높이 25.95)
	REAGENT_SPEC_ROWS.forEach((spec, idx) => {
		const rNum = firstDataRowNum + idx;
		const isLastRow = idx === totalRows - 1;
		const prevSpec = idx > 0 ? REAGENT_SPEC_ROWS[idx - 1] : null;
		const nextSpec = idx < totalRows - 1 ? REAGENT_SPEC_ROWS[idx + 1] : null;
		const isCatStart = !prevSpec || prevSpec.category !== spec.category;
		const isCatEnd = !nextSpec || nextSpec.category !== spec.category;

		if (isCatStart) {
			catStartRow = rNum;
		}
		if (isCatEnd && rNum > catStartRow) {
			mergeRefs.push(`B${catStartRow}:B${rNum}`);
		}

		// 회사명/시약명이 비어있는 단일 항목(예: 물벼룩 배양액, 표준용액 등)은 C~E 병합
		if (!spec.company && !spec.reagentName) {
			mergeRefs.push(`C${rNum}:E${rNum}`);
		}

		const isStdSolution =
			spec.id.startsWith("etc-std-") ||
			(!spec.reagentName && !spec.manualAvg && Boolean(spec.lastYearAvg));
		if (isStdSolution) {
			mergeRefs.push(`F${rNum}:G${rNum}`);
		}

		const rowCells: string[] = [];

		// B열: 측정항목 (병합 시작점에만 텍스트)
		const bStyle = isLastRow ? 5 : 4;
		rowCells.push(
			makeInlineStrCell("B", rNum, bStyle, isCatStart ? spec.category : ""),
		);

		// C, D, E열: 측정기기, 회사명, 제조시약명
		const cdeStyle = isLastRow ? 7 : 6;
		rowCells.push(makeInlineStrCell("C", rNum, cdeStyle, spec.device));
		rowCells.push(makeInlineStrCell("D", rNum, cdeStyle, spec.company || ""));
		rowCells.push(
			makeInlineStrCell("E", rNum, cdeStyle, spec.reagentName || ""),
		);

		// F, G열: 작년 주문량, 매뉴얼
		const fgTextStyle = isLastRow ? 7 : 6;
		if (isStdSolution) {
			rowCells.push(
				makeInlineStrCell("F", rNum, fgTextStyle, spec.lastYearAvg || ""),
			);
			rowCells.push(makeInlineStrCell("G", rNum, fgTextStyle, ""));
		} else {
			rowCells.push(
				makeNumOrStrCell("F", rNum, isLastRow ? 7 : 17, spec.lastYearAvg || ""),
			);
			rowCells.push(
				makeNumOrStrCell("G", rNum, isLastRow ? 7 : 17, spec.manualAvg || ""),
			);
		}

		// 측정소 셀 (동적 개수)
		let rowTotalL = 0;
		PEOPLE_LIST.forEach((person, pIdx) => {
			const colLetter = colNumberToLetter(firstPersonColNum + pIdx);
			const isGreen =
				(PERSON_GREEN_ROWS[person]?.includes(spec.id) ?? false) ||
				isStdSolution;
			const cellStyle = isGreen ? (isLastRow ? 9 : 8) : isLastRow ? 11 : 10;

			if (isSummaryView) {
				const sumVal = summaryCells[spec.id]?.[person] || 0;
				rowTotalL += sumVal;
				rowCells.push(
					makeNumOrStrCell(
						colLetter,
						rNum,
						cellStyle,
						sumVal > 0 ? sumVal : "",
					),
				);
			} else {
				const rawVal = currentSheet?.cells[spec.id]?.[person] || "";
				const parsed = parseCellExpression(rawVal, spec.defaultVolume);
				rowTotalL += parsed.total;
				rowCells.push(makeNumOrStrCell(colLetter, rNum, cellStyle, rawVal));
			}
		});

		rowTotalL = Number(rowTotalL.toFixed(2));

		// 우측 끝: 합계 열
		const sumStyle = isLastRow ? 13 : 12;
		rowCells.push(
			`<c r="${sumColLetter}${rNum}" s="${sumStyle}"><v>${rowTotalL}</v></c>`,
		);

		rowsXml.push(
			`<row r="${rNum}" spans="2:${sumColNum}" ht="25.95" customHeight="1"${rNum === firstDataRowNum ? ' thickTop="1"' : ""}>${rowCells.join("")}</row>`,
		);
	});

	const mergeCellsXml =
		mergeRefs.length > 0
			? `<mergeCells count="${mergeRefs.length}">${mergeRefs
					.map((ref) => `<mergeCell ref="${ref}"/>`)
					.join("")}</mergeCells>`
			: "";

	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetPr><tabColor rgb="FF0070C0"/></sheetPr>
  <dimension ref="B2:${sumColLetter}${lastDataRowNum}"/>
  <sheetViews>
    <sheetView tabSelected="1" zoomScaleNormal="90" workbookViewId="0"/>
  </sheetViews>
  <sheetFormatPr defaultColWidth="9" defaultRowHeight="17.4"/>
  <cols>
    <col min="1" max="1" width="3" customWidth="1"/>
    <col min="2" max="2" width="8.5" customWidth="1"/>
    <col min="3" max="3" width="18" customWidth="1"/>
    <col min="4" max="4" width="10.5" customWidth="1"/>
    <col min="5" max="5" width="24" customWidth="1"/>
    <col min="6" max="6" width="11.5" customWidth="1"/>
    <col min="7" max="7" width="9.5" customWidth="1"/>
    <col min="${firstPersonColNum}" max="${lastPersonColNum}" width="11" customWidth="1"/>
    <col min="${sumColNum}" max="${sumColNum}" width="7.5" customWidth="1"/>
  </cols>
  <sheetData>
    ${rowsXml.join("\n    ")}
  </sheetData>
  ${mergeCellsXml}
  <pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
</worksheet>`;
}

export function downloadStyledReagentXlsx({
	isSummaryView,
	currentSheet,
	summaryCells,
}: BuildSheetParams): void {
	const sheetName = isSummaryView
		? "팀별 시약주문량(누적합계)"
		: currentSheet?.title.replace(/[\\/?*[\]:]/g, "_") || "팀별 시약주문량";

	const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

	const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

	const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(sheetName.slice(0, 31))}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

	const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

	const stylesXml = buildStylesXml();
	const sheetXml = buildWorksheetXml({
		isSummaryView,
		currentSheet,
		summaryCells,
	});

	const enc = (s: string) => fflate.strToU8(s);

	const zipped = fflate.zipSync({
		"[Content_Types].xml": enc(contentTypesXml),
		"_rels/.rels": enc(rootRelsXml),
		"xl/workbook.xml": enc(workbookXml),
		"xl/_rels/workbook.xml.rels": enc(workbookRelsXml),
		"xl/styles.xml": enc(stylesXml),
		"xl/worksheets/sheet1.xml": enc(sheetXml),
	});

	const blob = new Blob([zipped], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	const fileName = isSummaryView
		? "팀별_시약주문량_전체합계.xlsx"
		: `${currentSheet?.title.replace(/\s+/g, "_") || "팀별_시약주문량"}.xlsx`;
	a.href = url;
	a.download = fileName;
	a.click();
	URL.revokeObjectURL(url);
}
