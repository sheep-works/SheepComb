export interface AlignBlock {
  id: string;
  sectionName: string;      // e.g. "Slide 21", "Paragraph 1"
  sourceText: string;       // 原文（改行区切り）
  targetText: string;       // 訳文（改行区切り）
  sourceProp?: string;
  targetProp?: string;
}

export interface SheetData {
  sheetName: string;
  blocks: AlignBlock[];
}

export interface FilePair {
  id: string;
  srcPath: string;
  tgtPath: string;
}

export interface DataFileInfo {
  name: string;
  path: string;
  extension: string;
}

declare global {
  interface Window {
    pywebview?: {
      api: {
        select_file_dialog: (title?: string, fileTypes?: string[]) => Promise<string | null>;
        scan_data_folder: (dataDir?: string) => Promise<DataFileInfo[]>;
        extract_direct: (srcPath: string, tgtPath: string) => Promise<{
          success: boolean;
          sheetName?: string;
          blocks?: AlignBlock[];
          error?: string;
        }>;
        extract_multi_pairs: (pairs: { srcPath: string; tgtPath: string }[]) => Promise<{
          success: boolean;
          sheets?: SheetData[];
          warnings?: string[];
          error?: string;
        }>;
        save_excel_file: (sheetsData: SheetData[], defaultName?: string) => Promise<{
          success: boolean;
          path?: string;
          cancelled?: boolean;
          error?: string;
        }>;
      };
    };
  }
}