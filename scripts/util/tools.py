import re
import os

def strip_tags(text):
    """XML/HTMLタグを除去する"""
    if not isinstance(text, str):
        return ""
    return re.sub(r'<.*?>|&lt;.*?&gt;', '', text)

def strip_tags_from_item(item):
    """辞書の 'src' と 'tgt' からタグを除去した 'src_stripped' と 'tgt_stripped' を追加する"""
    if 'src' in item:
        item['src_stripped'] = strip_tags(item['src'])
    if 'tgt' in item:
        item['tgt_stripped'] = strip_tags(item['tgt'])
    return item

def lowercase_item(item):
    """辞書の 'src' と 'tgt' を小文字にする"""
    if 'src' in item:
        item['src'] = item['src'].lower()
    if 'tgt' in item:
        item['tgt'] = item['tgt'].lower()
    return item

def add_index_to_item(item, index):
    """辞書の 'src' と 'tgt' にインデックスを追加する"""
    item['idx'] = index
    return item

def batch_strip_tags(items):
    """辞書リストの 'src' と 'tgt' からタグを除去した 'src_stripped' と 'tgt_stripped' を追加する"""
    return [strip_tags_from_item(item) for item in items]

def batch_lowercase(items):
    """辞書リストの 'src' と 'tgt' を小文字にする"""
    return [lowercase_item(item) for item in items]

def dir_to_files(dir_path, exts=None):
    """指定されたディレクトリ内のファイルをリスト化する"""
    files = []
    for file in os.listdir(dir_path):
        if exts is None:
            files.append(os.path.join(dir_path, file))
        elif file.endswith(tuple(exts)):
            files.append(os.path.join(dir_path, file))
    return files
    