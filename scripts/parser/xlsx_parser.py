import io
from typing import List
import openpyxl
from scripts.parser.base import BaseParser
from scripts.util.models import RawDocument
from scripts.util.types import Segment

class XlsxParser(BaseParser):
    def parse(self, document: RawDocument) -> List[Segment]:
        """
        Excelファイル(XLSX)をパースしてSegmentのリストを返す。
        A列: Source, B列: Target, C列: Note (Optional)
        """
        if not isinstance(document.contents, bytes):
            content_bytes = document.contents.encode('utf-8')
        else:
            content_bytes = document.contents

        try:
            workbook = openpyxl.load_workbook(io.BytesIO(content_bytes), read_only=True, data_only=True)
            sheet = workbook.active
        except Exception as e:
            print(f"Error opening Excel document {document.filename}: {e}")
            return []

        segments: List[Segment] = []
        if sheet is None:
            return []

        for row in sheet.iter_rows(values_only=True):
            # A, B, C列 (index 0, 1, 2)
            source_val = str(row[0]) if len(row) > 0 and row[0] is not None else ""
            src = source_val.replace('\t', '\\t').replace('\n', '\\n').strip()
            
            target_val = str(row[1]) if len(row) > 1 and row[1] is not None else ""
            tgt = target_val.replace('\t', '\\t').replace('\n', '\\n').strip()
            
            note_val = str(row[2]) if len(row) > 2 and row[2] is not None else ""
            note = note_val.replace('\t', '\\t').replace('\n', '\\n').strip()

            if not src and not tgt:
                continue
            
            seg: Segment = {'src': src, 'tgt': tgt}
            if note:
                seg['note'] = note
                
            segments.append(seg)

        return segments
