import os
import re
import sys
import glob
from datetime import datetime

def merge_pyscript(html_path, target_path=None):
    if not os.path.exists(html_path):
        print(f"Error: {html_path} does not exist.")
        return False

    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # Find the <!-- PYSCRIPT_START --> ... <!-- PYSCRIPT_END --> block
    pattern = re.compile(r'<!--\s*PYSCRIPT_START\s*-->(.*?)<!--\s*PYSCRIPT_END\s*-->', re.DOTALL)
    match = pattern.search(html_content)
    if not match:
        return False
        
    block = match.group(1)
    
    # Resolve the python file relative to the html file
    html_dir = os.path.dirname(html_path)
    base_name = os.path.splitext(os.path.basename(html_path))[0]
    if base_name.endswith("_py"):
        stem_name = base_name[:-3]
    else:
        stem_name = base_name
        
    py_abs_path = os.path.join(html_dir, f"{stem_name}.py")
    
    if not os.path.exists(py_abs_path):
        print(f"Warning: {html_path} has PYSCRIPT block but {py_abs_path} was not found.")
        return False

    with open(py_abs_path, 'r', encoding='utf-8') as f:
        py_content = f.read()

    # Extract attributes from the original script tag
    tag_match = re.search(r'<script\b([^>]*)>', block)
    if not tag_match:
        print("Error: Could not find script tag inside PYSCRIPT block.")
        return False
    
    attrs_raw = tag_match.group(1)
    # Filter out src and type to re-add them clean
    attrs_list = []
    # Improved regex to handle quoted attributes properly (matching same quote type)
    for kv in re.finditer(r'([a-zA-Z0-9_-]+)\s*=\s*(?P<q>["\'])(.*?)(?P=q)', attrs_raw):
        key = kv.group(1)
        val = kv.group(0).split('=', 1)[1].strip()
        if key.lower() not in ('src', 'type'):
            attrs_list.append(f'{key}={val}')
    
    attrs_str = " ".join(attrs_list)
    if attrs_str:
        attrs_str = " " + attrs_str

    # Create the new embedded script block with timestamp
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    embedded_script = f"""
    <!-- PYSCRIPT_START -->
    <!-- Merged on {now} -->
    <script type="py"{attrs_str}>
{py_content}
    </script>
    <!-- PYSCRIPT_END -->
"""
    
    # Replace the block with the embedded script
    merged_html = html_content[:match.start()] + embedded_script.strip('\n') + html_content[match.end():]
    
    if target_path is None:
        target_path = html_path
        
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(merged_html)
        
    print(f"Successfully merged {os.path.basename(py_abs_path)} into {target_path}")
    return True

def process_all_in_webview():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    webview_dir = os.path.join(base_dir, "webview")
    
    if not os.path.exists(webview_dir):
        print(f"Error: {webview_dir} not found.")
        return

    html_files = glob.glob(os.path.join(webview_dir, "*.html"))
    count = 0
    for html_file in html_files:
        if html_file.endswith("_py.html"):
            continue
            
        base, ext = os.path.splitext(html_file)
        target_file = f"{base}_py{ext}"
        
        if merge_pyscript(html_file, target_file):
            count += 1
    
    if count == 0:
        print("No files were merged.")
    else:
        print(f"Done! Total {count} files merged.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("No arguments provided. Scanning 'webview' directory...")
        process_all_in_webview()
    else:
        html_file = sys.argv[1]
        out_file = sys.argv[2] if len(sys.argv) > 2 else html_file
        merge_pyscript(html_file, out_file)
