export interface AlignBlock {
  id: string;
  sectionName: string;
  sourceText: string;
  targetText: string;
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
  srcFile?: File;
  tgtFile?: File;
}

export interface DataFileInfo {
  name: string;
  path: string;
  extension: string;
}
