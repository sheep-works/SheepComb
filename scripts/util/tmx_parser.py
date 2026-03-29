import xml.etree.ElementTree as ET
import re

def strip_tags(text):
    """XML/HTMLタグを除去する"""
    if not isinstance(text, str):
        return ""
    return re.sub(r'<[^>]+>', '', text)

def parse_tmx(file_path, source_lang, target_lang):
    """TMXファイルをパースして、(元の原文, 訳文, タグ除去済み原文) のリストを返す"""
    tree = ET.parse(file_path)
    root = tree.getroot()
    tm_items = []
    for tu in root.findall('.//tu'):
        tuvs = tu.findall('tuv')
        source_seg = ""
        target_seg = ""
        for tuv in tuvs:
            lang = tuv.attrib.get('{http://www.w3.org/XML/1998/namespace}lang')
            if not lang:
                lang = tuv.attrib.get('xml:lang')
            
            seg = tuv.find('seg')
            # itertext()を使うことでタグ内部のテキストも含むプレーンテキストを取得できる
            # しかし、タグを「保持」する必要があるため、ET.tostringなどが必要だが、
            # itertextはタグ構造を消してしまう。
            # sample.tmxを確認すると、XMLタグが含まれていることがあるため、
            # tagを含めた文字列全体を取得する
            if seg is not None:
                # 内部の要素を文字列としてシリアライズ（先頭の<seg>タグなどは除く）
                text = (seg.text or "") + "".join(ET.tostring(child, encoding='unicode', method='xml') for child in seg)
                if lang and lang.lower().startswith(source_lang.lower()):
                    source_seg = text
                elif lang and lang.lower().startswith(target_lang.lower()):
                    target_seg = text
                
        if source_seg and target_seg:
            tm_items.append({
                'src_orig': source_seg,
                'tgt': target_seg,
                'src_stripped': strip_tags(source_seg)
            })
    return tm_items
