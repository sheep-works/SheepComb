from typing import List
from scripts.parser.base import XliffParser
from scripts.util.types import Segment

class MqxlfParser(XliffParser):
    pass

def parse_mqxlf(file_path: str) -> List[Segment]:
    return MqxlfParser().parse(file_path)
