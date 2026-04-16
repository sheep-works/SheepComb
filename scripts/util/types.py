from typing import TypedDict, List, Optional

class Segment(TypedDict, total=False):
    src: str
    tgt: str
    src_stripped: Optional[str]
    tgt_stripped: Optional[str]
    idx: Optional[int]
    note: Optional[str]

SegmentList = List[Segment]
