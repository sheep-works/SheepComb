from typing import List
from scripts.parser.base import XliffParser
from scripts.util.types import Segment

class XlfParser(XliffParser):
    pass

def parse_xlf(file_path: str) -> List[Segment]:
    return XlfParser().parse(file_path)
