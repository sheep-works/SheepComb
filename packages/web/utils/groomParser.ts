import * as XLSX from 'xlsx';
import type { AlignBlock, SheetData } from '../types/groom';

/**
 * テキストの初期整形
 * - {/} (段落/シェイプの切れ目) は改行に展開
 * - {|} (フレーム内改行/レイアウト改行) は意図的に残す (エディタ内でハイライト表示)
 */
export function formatBlockText(rawText: string): string {
  if (!rawText) return '';
  const text = rawText.replace(/\{\/\}/g, '\n');
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  return lines.join('\n');
}

export async function parseXlsx(data: ArrayBuffer): Promise<SheetData[]> {
  const workbook = XLSX.read(data, { type: 'array' });
  const result: SheetData[] = [];

  for (const sheetName of workbook.SheetNames) {
    if (sheetName.toUpperCase() === 'INPUT') continue;

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    if (!rows || rows.length <= 1) continue;

    const headerRow = rows[0] || [];
    const is3Col = String(headerRow[1] || '').includes('訳文') || rows[1]?.length === 3;

    const blocks: AlignBlock[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      let srcRaw = '';
      let tgtRaw = '';
      let prop = '';

      if (is3Col) {
        srcRaw = String(row[0] || '');
        tgtRaw = String(row[1] || '');
        prop = String(row[2] || `Row ${i}`);
      } else {
        srcRaw = String(row[0] || '');
        prop = String(row[1] || `Row ${i}`);
        tgtRaw = String(row[2] || '');
      }

      if (!srcRaw && !tgtRaw) continue;

      blocks.push({
        id: `block-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        sectionName: prop,
        sourceText: formatBlockText(srcRaw),
        targetText: formatBlockText(tgtRaw),
        sourceProp: prop,
        targetProp: prop,
      });
    }

    if (blocks.length > 0) {
      result.push({
        sheetName,
        blocks,
      });
    }
  }

  return result;
}

export function parseTsvOrText(raw: string): AlignBlock[] {
  const lines = raw.split('\n');
  const blocks: AlignBlock[] = [];

  let currentSection = 'Section 1';
  let currentSrcLines: string[] = [];
  let currentTgtLines: string[] = [];

  const flush = () => {
    if (currentSrcLines.length > 0 || currentTgtLines.length > 0) {
      blocks.push({
        id: `block-${Date.now()}-${blocks.length}-${Math.random().toString(36).substring(2, 7)}`,
        sectionName: currentSection,
        sourceText: currentSrcLines.join('\n'),
        targetText: currentTgtLines.join('\n'),
      });
      currentSrcLines = [];
      currentTgtLines = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const markerMatch = trimmed.match(/^(_@§_|#|===|---)\s*(.+?)\s*(_§@_|===|---)?$/);
    if (markerMatch) {
      flush();
      currentSection = markerMatch[2] || `Section ${blocks.length + 1}`;
      continue;
    }

    if (line.includes('\t')) {
      const parts = line.split('\t');
      if (parts.length >= 3 && parts[2].trim()) {
        currentSection = parts[2].trim();
      }
      currentSrcLines.push(parts[0] || '');
      currentTgtLines.push(parts[1] || '');
    } else {
      currentSrcLines.push(line);
    }
  }

  flush();
  return blocks;
}

export function exportToXlsx(sheetData: SheetData): Uint8Array {
  const wb = XLSX.utils.book_new();
  const sheetName = sheetData.sheetName || 'ALIGN';

  const rows: any[][] = [
    ['原文', '訳文', '属性']
  ];

  for (const block of sheetData.blocks) {
    const srcLines = block.sourceText ? block.sourceText.split('\n') : [''];
    const tgtLines = block.targetText ? block.targetText.split('\n') : [''];
    const maxLen = Math.max(srcLines.length, tgtLines.length);

    const prop = sheetName && block.sectionName
      ? `${sheetName}-${block.sectionName}`
      : (block.sectionName || sheetName);

    for (let i = 0; i < maxLen; i++) {
      rows.push([
        srcLines[i] !== undefined ? srcLines[i] : '',
        tgtLines[i] !== undefined ? tgtLines[i] : '',
        prop,
      ]);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 50 }, { wch: 50 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

export function exportAllSheetsToXlsx(sheets: SheetData[]): Uint8Array {
  const wb = XLSX.utils.book_new();

  for (const sheetData of sheets) {
    const sheetName = sheetData.sheetName || 'ALIGN';
    const rows: any[][] = [
      ['原文', '訳文', '属性']
    ];

    for (const block of sheetData.blocks) {
      const srcLines = block.sourceText ? block.sourceText.split('\n') : [''];
      const tgtLines = block.targetText ? block.targetText.split('\n') : [''];
      const maxLen = Math.max(srcLines.length, tgtLines.length);

      const prop = sheetName && block.sectionName
        ? `${sheetName}-${block.sectionName}`
        : (block.sectionName || sheetName);

      for (let i = 0; i < maxLen; i++) {
        rows.push([
          srcLines[i] !== undefined ? srcLines[i] : '',
          tgtLines[i] !== undefined ? tgtLines[i] : '',
          prop,
        ]);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 50 }, { wch: 50 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  }

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

export function exportToPaddedTsv(blocks: AlignBlock[], sheetName: string = ''): string {
  const rows: string[] = [];

  for (const block of blocks) {
    const srcLines = block.sourceText ? block.sourceText.split('\n') : [''];
    const tgtLines = block.targetText ? block.targetText.split('\n') : [''];
    const maxLen = Math.max(srcLines.length, tgtLines.length);

    const prop = sheetName && block.sectionName
      ? `${sheetName}-${block.sectionName}`
      : (block.sectionName || sheetName);

    for (let i = 0; i < maxLen; i++) {
      const s = srcLines[i] !== undefined ? srcLines[i] : '';
      const t = tgtLines[i] !== undefined ? tgtLines[i] : '';
      rows.push(`${s}\t${t}\t${prop}`);
    }
  }

  return rows.join('\n');
}
