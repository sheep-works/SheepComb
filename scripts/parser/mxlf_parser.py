from typing import List
from scripts.parser.base import XliffParser
from scripts.util.types import Segment

class MxlfParser(XliffParser):
    pass

def parse_mxlf(file_path: str) -> List[Segment]:
    from scripts.caller.file_io import read_document
    doc = read_document(file_path)
    return MxlfParser().parse(doc)
