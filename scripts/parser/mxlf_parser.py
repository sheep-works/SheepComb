from typing import List
from scripts.parser.base import XliffParser
from scripts.util.types import Segment

class MxlfParser(XliffParser):
    pass

def parse_mxlf(file_path: str) -> List[Segment]:
    return MxlfParser().parse(file_path)
