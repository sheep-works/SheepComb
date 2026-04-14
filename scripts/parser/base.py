import xml.etree.ElementTree as ET
from abc import ABC, abstractmethod
from typing import List
from scripts.util.types import Segment

class BaseParser(ABC):
    @abstractmethod
    def parse(self, file_path: str, **kwargs) -> List[Segment]:
        """
        ファイルをパースして、Segment（dict形式）のリストを返す。
        """
        pass

def get_inner_xml(node: ET.Element) -> str:
    """XMLノードの内部テキスト（タグを含む）を取得する共通関数"""
    if node is None:
        return ""
    return (node.text or "") + "".join(ET.tostring(child, encoding='unicode', method='xml') for child in node)

class XliffParser(BaseParser):
    """XLIFF系ファイル（XLF, MXLIFF, MQXLIFF, SDLXLIFF）の共通パーサー"""
    def parse(self, file_path: str, **kwargs) -> List[Segment]:
        try:
            tree = ET.parse(file_path)
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
            return []
            
        root = tree.getroot()
        items: List[Segment] = []
        
        for tu in root.iter():
            # 独自の名前空間を持つ場合があるため、ローカル名で判定
            if tu.tag.split('}')[-1] == 'trans-unit':
                source_node = None
                target_node = None
                
                for child in tu:
                    tag_local = child.tag.split('}')[-1]
                    if tag_local == 'source':
                        source_node = child
                    elif tag_local == 'target':
                        target_node = child
                
                if source_node is not None:
                    src = get_inner_xml(source_node)
                    tgt = get_inner_xml(target_node) if target_node is not None else ""
                    
                    items.append({
                        'src': src,
                        'tgt': tgt
                    })
                    
        return items
