import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import type { AlignBlock, SheetData } from '../types/groom';

export interface ExtractedItem {
  text: string;
  property: string;
}

/**
 * XML 文字列を DOM Document にパースするヘルパー
 */
function parseXml(xmlString: string): Document {
  if (typeof window !== 'undefined' && window.DOMParser) {
    return new window.DOMParser().parseFromString(xmlString, 'text/xml');
  }
  // Node / SSR 等でのフォールバック
  try {
    const { DOMParser } = require('@xmldom/xmldom');
    return new DOMParser().parseFromString(xmlString);
  } catch {
    throw new Error('DOMParser is not available in the current environment.');
  }
}

/**
 * 制御文字等の不要な文字を除去
 */
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '{/}')
    .replace(/\r/g, '{/}')
    .replace(/\n/g, '{/}')
    .replace(/\v/g, '{/}')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .trim();
}

// ==========================================
// 1. Word (.docx) 抽出
// ==========================================

function readWordRun(runNode: Element): string {
  let text = '';
  for (let i = 0; i < runNode.childNodes.length; i++) {
    const child = runNode.childNodes[i] as Element;
    if (!child || child.nodeType !== 1) continue;

    const nodeName = child.nodeName;
    if (nodeName === 'w:t') {
      text += child.textContent || '';
    } else if (nodeName === 'w:tab') {
      text += '\t';
    } else if (nodeName === 'w:br' || nodeName === 'w:cr') {
      text += '{/}';
    } else if (nodeName === 'w:delText') {
      // 変更履歴削除テキストはスキップ
    } else if (nodeName === 'mc:AlternateContent' || nodeName === 'w:pict') {
      // シェイプやテキストボックス
      text += readWordNested(child);
    }
  }
  return text;
}

function readWordParagraph(pNode: Element): string {
  let text = '';
  for (let i = 0; i < pNode.childNodes.length; i++) {
    const child = pNode.childNodes[i] as Element;
    if (!child || child.nodeType !== 1) continue;

    const nodeName = child.nodeName;
    if (nodeName === 'w:r') {
      text += readWordRun(child);
    } else if (nodeName === 'w:ins') {
      // 変更履歴の挿入ノード
      for (let j = 0; j < child.childNodes.length; j++) {
        const insChild = child.childNodes[j] as Element;
        if (insChild && insChild.nodeName === 'w:r') {
          text += readWordRun(insChild);
        }
      }
    } else if (nodeName === 'w:hyperlink') {
      // ハイパーリンク
      for (let j = 0; j < child.childNodes.length; j++) {
        const hlChild = child.childNodes[j] as Element;
        if (hlChild && hlChild.nodeName === 'w:r') {
          text += readWordRun(hlChild);
        }
      }
    }
  }
  return text.trim();
}

function readWordNested(node: Element): string {
  let result = '';
  if (node.nodeName === 'mc:Fallback') {
    return ''; // 重複防止
  }
  if (node.nodeName === 'w:p') {
    return readWordParagraph(node);
  }
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i] as Element;
    if (child && child.nodeType === 1) {
      result += readWordNested(child);
    }
  }
  return result;
}

export async function extractDocx(data: ArrayBuffer): Promise<ExtractedItem[]> {
  const zip = await JSZip.loadAsync(data);
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('無効な docx ファイルです (word/document.xml が見つかりません)');
  }

  const xmlText = await docXmlFile.async('string');
  const doc = parseXml(xmlText);

  // w:document -> w:body
  const body = doc.getElementsByTagName('w:body')[0];
  if (!body) return [];

  const results: ExtractedItem[] = [];
  let pIdx = 1;
  let tIdx = 1;

  for (let i = 0; i < body.childNodes.length; i++) {
    const item = body.childNodes[i] as Element;
    if (!item || item.nodeType !== 1) continue;

    if (item.nodeName === 'w:p') {
      const text = cleanText(readWordParagraph(item));
      if (text && text !== '/') {
        results.push({
          text,
          property: `Paragraph ${pIdx++}`,
        });
      }
    } else if (item.nodeName === 'w:tbl') {
      let rIdx = 1;
      const rows = item.getElementsByTagName('w:tr');
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const cells = row.getElementsByTagName('w:tc');
        const cellTexts: string[] = [];

        for (let c = 0; c < cells.length; c++) {
          const cell = cells[c];
          const paras = cell.getElementsByTagName('w:p');
          const pTexts: string[] = [];
          for (let p = 0; p < paras.length; p++) {
            const pt = readWordParagraph(paras[p]);
            if (pt) pTexts.push(cleanText(pt));
          }
          cellTexts.push(pTexts.join('{/}'));
        }

        const line = cellTexts.join('\t').trim();
        if (line && line !== '/') {
          results.push({
            text: line,
            property: `Table ${tIdx} Row ${rIdx++}`,
          });
        }
      }
      tIdx++;
    }
  }

  return results;
}

// ==========================================
// 2. PowerPoint (.pptx) 抽出
// ==========================================

function extractShapeTexts(spNode: Element): string[] {
  const texts: string[] = [];
  const txBody = spNode.getElementsByTagName('p:txBody')[0];
  if (!txBody) return texts;

  const paras = txBody.getElementsByTagName('a:p');
  for (let p = 0; p < paras.length; p++) {
    const para = paras[p];
    let pText = '';
    const runs = para.getElementsByTagName('a:r');
    for (let r = 0; r < runs.length; r++) {
      const t = runs[r].getElementsByTagName('a:t')[0];
      if (t && t.textContent) {
        pText += t.textContent;
      }
    }
    const cleaned = cleanText(pText);
    if (cleaned) {
      texts.push(cleaned);
    }
  }
  return texts;
}

function extractTableTexts(graphicFrameNode: Element): string[] {
  const texts: string[] = [];
  const tbl = graphicFrameNode.getElementsByTagName('a:tbl')[0];
  if (!tbl) return texts;

  const rows = tbl.getElementsByTagName('a:tr');
  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r].getElementsByTagName('a:tc');
    const cellTexts: string[] = [];
    for (let c = 0; c < cells.length; c++) {
      const txBody = cells[c].getElementsByTagName('a:txBody')[0];
      if (txBody) {
        const paras = txBody.getElementsByTagName('a:p');
        const pTexts: string[] = [];
        for (let p = 0; p < paras.length; p++) {
          const runs = paras[p].getElementsByTagName('a:r');
          let pt = '';
          for (let runIdx = 0; runIdx < runs.length; runIdx++) {
            const t = runs[runIdx].getElementsByTagName('a:t')[0];
            if (t && t.textContent) pt += t.textContent;
          }
          if (pt.trim()) pTexts.push(cleanText(pt));
        }
        cellTexts.push(pTexts.join('{/}'));
      } else {
        cellTexts.push('');
      }
    }
    const line = cellTexts.join('\t').trim();
    if (line) texts.push(line);
  }
  return texts;
}

export async function extractPptx(data: ArrayBuffer): Promise<ExtractedItem[]> {
  const zip = await JSZip.loadAsync(data);
  const results: ExtractedItem[] = [];

  // スライドファイルを収集して番号順にソート
  const slidePaths: string[] = [];
  zip.folder('ppt/slides')?.forEach((relativePath) => {
    if (relativePath.startsWith('slide') && relativePath.endsWith('.xml')) {
      slidePaths.push(`ppt/slides/${relativePath}`);
    }
  });

  slidePaths.sort((a, b) => {
    const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
    return numA - numB;
  });

  for (let i = 0; i < slidePaths.length; i++) {
    const slidePath = slidePaths[i];
    const slideNum = i + 1;
    const file = zip.file(slidePath);
    if (!file) continue;

    const xmlText = await file.async('string');
    const doc = parseXml(xmlText);

    const slideShapeTexts: string[] = [];

    // 通常の図形 (p:sp)
    const shapes = doc.getElementsByTagName('p:sp');
    for (let s = 0; s < shapes.length; s++) {
      const texts = extractShapeTexts(shapes[s]);
      if (texts.length > 0) {
        slideShapeTexts.push(texts.join('{/}'));
      }
    }

    // テーブル等のグラフィックフレーム (p:graphicFrame)
    const gFrames = doc.getElementsByTagName('p:graphicFrame');
    for (let g = 0; g < gFrames.length; g++) {
      const tblTexts = extractTableTexts(gFrames[g]);
      if (tblTexts.length > 0) {
        slideShapeTexts.push(tblTexts.join('{/}'));
      }
    }

    if (slideShapeTexts.length > 0) {
      results.push({
        text: slideShapeTexts.join('{|}'),
        property: `Slide ${slideNum}`,
      });
    }

    // ノートスライド (ppt/notesSlides/notesSlide{N}.xml) のチェック
    const noteFile = zip.file(`ppt/notesSlides/notesSlide${slideNum}.xml`);
    if (noteFile) {
      const noteXmlText = await noteFile.async('string');
      const noteDoc = parseXml(noteXmlText);
      const noteShapes = noteDoc.getElementsByTagName('p:sp');
      const noteTexts: string[] = [];

      for (let s = 0; s < noteShapes.length; s++) {
        const texts = extractShapeTexts(noteShapes[s]);
        if (texts.length > 0) {
          noteTexts.push(texts.join('{/}'));
        }
      }

      if (noteTexts.length > 0) {
        results.push({
          text: noteTexts.join('{|}'),
          property: `Slide ${slideNum} Note`,
        });
      }
    }
  }

  return results;
}

// ==========================================
// 3. Excel (.xlsx / .xls) 抽出
// ==========================================

export async function extractXlsx(data: ArrayBuffer): Promise<ExtractedItem[]> {
  const workbook = XLSX.read(data, { type: 'array' });
  const results: ExtractedItem[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];
        if (cell && cell.v !== undefined && cell.v !== null) {
          const val = String(cell.v).trim();
          if (val) {
            results.push({
              text: cleanText(val),
              property: `${sheetName}!${cellAddress}`,
            });
          }
        }
      }
    }
  }

  return results;
}

// ==========================================
// 4. プレーンテキスト (.tsv / .csv / .txt) 抽出
// ==========================================

export function extractPlainText(rawText: string): ExtractedItem[] {
  const lines = rawText.split(/\r?\n/);
  const results: ExtractedItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      results.push({
        text: cleanText(line),
        property: `Line ${i + 1}`,
      });
    }
  }

  return results;
}

// ==========================================
// 5. 統合抽出 & ペアアライメント
// ==========================================

/**
 * ファイルオブジェクトから自動判別してテキストアイテム配列を抽出
 */
export async function extractFromFile(file: File): Promise<ExtractedItem[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.docx')) {
    const buffer = await file.arrayBuffer();
    return extractDocx(buffer);
  }

  if (fileName.endsWith('.pptx')) {
    const buffer = await file.arrayBuffer();
    return extractPptx(buffer);
  }

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    return extractXlsx(buffer);
  }

  // テキスト形式 (.tsv, .csv, .txt 等)
  const text = await file.text();
  return extractPlainText(text);
}

/**
 * 原文と訳文の ExtractedItem[] から SheetData を構築 (SheepGroom 互換)
 */
export function pairExtractedItems(
  srcItems: ExtractedItem[],
  tgtItems: ExtractedItem[],
  sheetName: string = 'ALIGN'
): SheetData {
  const maxLen = Math.max(srcItems.length, tgtItems.length);
  const blocks: AlignBlock[] = [];

  for (let i = 0; i < maxLen; i++) {
    const sItem = srcItems[i] || { text: '', property: `Block ${i + 1}` };
    const tItem = tgtItems[i] || { text: '', property: `Block ${i + 1}` };

    const secName = sItem.property || tItem.property || `Block ${i + 1}`;
    // {/} はエディタ内表示用に改行へ変換 ( {|} はそのまま保持 )
    const sText = sItem.text.replace(/\{\/\}/g, '\n');
    const tText = tItem.text.replace(/\{\/\}/g, '\n');

    blocks.push({
      id: `block-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
      sectionName: secName,
      sourceText: sText,
      targetText: tText,
      sourceProp: sItem.property,
      targetProp: tItem.property,
    });
  }

  return {
    sheetName: sheetName.substring(0, 31),
    blocks,
  };
}
