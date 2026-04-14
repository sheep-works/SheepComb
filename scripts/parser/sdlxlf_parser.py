from typing import List
from scripts.parser.base import XliffParser
from scripts.util.types import Segment

class SdlxlfParser(XliffParser):
    pass

def parse_sdlxlf(file_path: str) -> List[Segment]:
    return SdlxlfParser().parse(file_path)
