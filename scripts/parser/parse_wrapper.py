import os
from typing import List, Optional, Type, Dict
from scripts.parser.base import BaseParser
from scripts.parser.xlf_parser import XlfParser, parse_xlf
from scripts.parser.mxlf_parser import MxlfParser, parse_mxlf
from scripts.parser.mqxlf_parser import MqxlfParser, parse_mqxlf
from scripts.parser.sdlxlf_parser import SdlxlfParser, parse_sdlxlf
from scripts.parser.tmx_parser import TmxParser, parse_tmx
from scripts.util.types import Segment, SegmentList

def get_parser(extension: str):
    """拡張子に基づいてパース関数を返す (互換性のため保持)"""
    parsers = {
        '.xlf': parse_xlf,
        '.xliff': parse_xlf,
        '.mqxlf': parse_mqxlf,
        '.mxlf': parse_mxlf,
        '.sdlxlf': parse_sdlxlf,
        '.tmx': parse_tmx
    }
    return parsers.get(extension.lower())

def get_parser_class(extension: str) -> Optional[Type[BaseParser]]:
    """拡張子に基づいてパーサークラスを返す"""
    parsers: Dict[str, Type[BaseParser]] = {
        '.xlf': XlfParser,
        '.xliff': XlfParser,
        '.mqxlf': MqxlfParser,
        '.mxlf': MxlfParser,
        '.sdlxlf': SdlxlfParser,
        '.tmx': TmxParser
    }
    return parsers.get(extension.lower())

def parse_file(file_path: str, **kwargs) -> SegmentList:
    """
    ファイルをパースして、Segmentのリストを返す。
    """
    _, ext = os.path.splitext(file_path)
    parser_cls = get_parser_class(ext)
    if not parser_cls:
        print(f"Unsupported file extension: {ext}")
        return []
    
    return parser_cls().parse(file_path, **kwargs)

def batch_parse(file_paths: List[str], **kwargs) -> List[SegmentList]:
    """
    複数のファイルパスを受け取って順次処理し、二重リストを返す。
    """
    results: List[SegmentList] = []
    for file_path in file_paths:
        results.append(parse_file(file_path, **kwargs))
    return results
