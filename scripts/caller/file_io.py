import os
from typing import List, Optional, Dict, Any
from scripts.util.models import RawDocument
from scripts.util.tools import dir_to_files

def read_document(file_path: str, metadata: Optional[Dict[str, Any]] = None) -> RawDocument:
    """ファイルを読み込み、RawDocumentオブジェクトを返す"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    _, ext = os.path.splitext(file_path)
    is_binary = ext.lower() in ['.docx', '.xlsx']
    
    if is_binary:
        with open(file_path, 'rb') as f:
            contents = f.read()
    else:
        with open(file_path, 'r', encoding='utf-8') as f:
            contents = f.read()
            
    return RawDocument(
        filename=os.path.basename(file_path),
        contents=contents,
        metadata=metadata or {}
    )

def batch_read_documents(
    file_or_dir_paths: List[str], 
    base_metadata: Optional[Dict[str, Any]] = None, 
    exts: Optional[List[str]] = None
) -> List[RawDocument]:
    """複数のファイルやディレクトリを読み込み、RawDocumentオブジェクトのリストを返す"""
    all_file_paths = []
    for path in file_or_dir_paths:
        if os.path.isdir(path):
            all_file_paths.extend(dir_to_files(path, exts=exts))
        elif os.path.isfile(path):
            all_file_paths.append(path)

    docs = []
    base_meta = base_metadata or {}
    for path in all_file_paths:
        try:
            if not os.path.isfile(path):
                continue
            doc = read_document(path, metadata=base_meta.copy())
            docs.append(doc)
        except Exception as e:
            print(f"Skipping {path}: {e}")
    return docs

def write_document(file_path: str, contents: str) -> None:
    """指定パスに文字列を書き込む"""
    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(contents)
