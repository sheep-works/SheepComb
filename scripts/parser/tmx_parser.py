import xml.etree.ElementTree as ET
from typing import List
from scripts.parser.base import BaseParser, get_inner_xml
from scripts.util.types import Segment

class TmxParser(BaseParser):
    def parse(self, file_path: str, **kwargs) -> List[Segment]:
        """TMXファイルをパースして、Segmentのリストを返す"""
        source_lang = kwargs.get('source_lang') or kwargs.get('src_lang', 'ja')
        target_lang = kwargs.get('target_lang') or kwargs.get('tgt_lang', 'en')
        
        try:
            tree = ET.parse(file_path)
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
            return []
            
        root = tree.getroot()
        tm_items: List[Segment] = []
        
        for tu in root.findall('.//tu'):
            tuvs = tu.findall('tuv')
            source_seg = ""
            target_seg = ""
            for tuv in tuvs:
                lang = tuv.attrib.get('{http://www.w3.org/XML/1998/namespace}lang')
                if not lang:
                    lang = tuv.attrib.get('xml:lang')
                
                seg = tuv.find('seg')
                if seg is not None:
                    text = get_inner_xml(seg)
                    if lang and lang.lower().startswith(source_lang.lower()):
                        source_seg = text
                    elif lang and lang.lower().startswith(target_lang.lower()):
                        target_seg = text
                    
            if source_seg and target_seg:
                tm_items.append({
                    'src': source_seg,
                    'tgt': target_seg
                })
        return tm_items

def parse_tmx(file_path: str, source_lang: str, target_lang: str) -> List[Segment]:
    return TmxParser().parse(file_path, source_lang=source_lang, target_lang=target_lang)
