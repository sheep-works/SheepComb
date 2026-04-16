import xml.etree.ElementTree as ET
from typing import List
from scripts.parser.base import BaseParser, get_inner_xml
from scripts.util.types import Segment
from scripts.util.models import RawDocument

class TmxParser(BaseParser):
    def parse(self, document: RawDocument, **kwargs) -> List[Segment]:
        """TMXファイルをパースして、Segmentのリストを返す"""
        # kwargsまたはmetadataから言語情報を取得
        source_lang = kwargs.get('source_lang') or kwargs.get('src_lang') or document.metadata.get('src_lang', 'ja')
        target_lang = kwargs.get('target_lang') or kwargs.get('tgt_lang') or document.metadata.get('tgt_lang', 'en')
        
        try:
            root = ET.fromstring(document.contents.encode('utf-8'))
        except Exception as e:
            print(f"Error parsing {document.filename}: {e}")
            return []
            
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
    from scripts.caller.file_io import read_document
    doc = read_document(file_path)
    return TmxParser().parse(doc, source_lang=source_lang, target_lang=target_lang)
