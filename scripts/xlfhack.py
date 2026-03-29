import argparse
import os
import xml.etree.ElementTree as ET
from rapidfuzz import fuzz, process

def parse_args():
    parser = argparse.ArgumentParser(description="Lock MXLIFF segments based on similarity to previous segments.")
    parser.add_argument("input_file", help="Path to the input MXLIFF file")
    parser.add_argument("--mode", choices=["char", "word"], default="char", help="Comparison mode: char or word (default: char)")
    parser.add_argument("--threshold", type=float, default=90.0, help="Similarity threshold (0-100, default: 90.0)")
    parser.add_argument("--output", help="Path to the output MXLIFF file (default: input_proc.mxliff)")
    return parser.parse_args()

def get_text_from_element(elem):
    """ETのElementからテキストを再帰的に取得する"""
    if elem is None:
        return ""
    text = elem.text or ""
    for child in elem:
        text += get_text_from_element(child)
        if child.tail:
            text += child.tail
    return text

def main():
    args = parse_args()
    input_file = args.input_file
    output_file = args.output
    if not output_file:
        base, ext = os.path.splitext(input_file)
        # Handle cases like .docx.mxliff
        if input_file.lower().endswith(".mxliff"):
            output_file = input_file[:-7] + "_proc.mxliff"
        else:
            output_file = base + "_proc" + ext

    # Register namespaces to keep the output clean
    # Memsource MXLIFF usually uses these
    ET.register_namespace('', 'urn:oasis:names:tc:xliff:document:1.2')
    ET.register_namespace('m', 'http://www.memsource.com/mxlf/2.0')
    ET.register_namespace('space', 'http://www.w3.org/XML/1998/namespace') # xml:space

    try:
        tree = ET.parse(input_file)
        root = tree.getroot()
    except Exception as e:
        print(f"Error parsing XML: {e}")
        return

    # Extract namespace if present
    ns = {'xlf': 'urn:oasis:names:tc:xliff:document:1.2', 'm': 'http://www.memsource.com/mxlf/2.0'}
    # Try to find default namespace dynamically just in case
    match = ET.iterparse(input_file, events=('start-ns',))
    ns_map = {}
    try:
        for event, elem in match:
            ns_map[elem[0]] = elem[1]
    except ET.ParseError:
        pass
    
    # Overwrite typical mxliff namespaces if found dynamically
    if '' in ns_map:
        ns['xlf'] = ns_map['']
    if 'm' in ns_map:
        ns['m'] = ns_map['m']

    trans_units = root.findall('.//xlf:trans-unit', ns)
    if not trans_units:
        # Fallback to no namespace
        trans_units = root.findall('.//trans-unit')

    seen_sources = []
    locked_count = 0

    mode = args.mode
    threshold = args.threshold

    print(f"Processing {len(trans_units)} trans-units in {mode} mode with threshold {threshold}...")

    # Name of the locked attribute. In Memsource MXLIFF it's m:locked
    # ElementTree represents this as {http://www.memsource.com/mxlf/2.0}locked
    m_namespace = ns.get('m', 'http://www.memsource.com/mxlf/2.0')
    locked_attr = f"{{{m_namespace}}}locked"

    for unit in trans_units:
        # Skip already locked units
        if unit.attrib.get(locked_attr) == "true" or unit.attrib.get("translate") == "no":
            continue

        source_elem = unit.find('xlf:source', ns)
        if source_elem is None:
            source_elem = unit.find('source')
        
        if source_elem is None:
            continue
            
        src_text = get_text_from_element(source_elem)
        if not src_text.strip():
            continue

        compare_src = src_text
        if mode == "word":
            compare_src = src_text.split()

        # Compare with previous segments
        should_lock = False
        max_score = 0
        
        if len(seen_sources) > 0:
            if mode == "char":
                # Rapidfuzz process.extractOne is fast
                best_match = process.extractOne(compare_src, seen_sources, scorer=fuzz.ratio)
                if best_match:
                    match_text, score, idx = best_match
                    max_score = score
                    if score >= threshold:
                        should_lock = True
            elif mode == "word":
                # For arrays, we might need to iterate manually or use fuzzy matching on strings
                # process.extract doesn't work out of the box with sequences of tokens in Python rapidfuzz easily
                # as it expects strings. Let's manually iterate or just use fuzz.ratio directly.
                for seen in seen_sources:
                    score = fuzz.ratio(compare_src, seen)
                    if score > max_score:
                        max_score = score
                    if score >= threshold:
                        should_lock = True
                        break

        if should_lock:
            # Lock the unit
            unit.attrib[locked_attr] = "true"
            locked_count += 1
            # Add back the text to seen_sources to match TS behavior
            if mode == "char":
                seen_sources.append(compare_src)
            else:
                seen_sources.append(compare_src)
            # print(f"Locked (score: {max_score:.1f}): {src_text[:50]}...")
        else:
            seen_sources.append(compare_src)

    print(f"Locked {locked_count} segments based on similarity.")
    
    tree.write(output_file, encoding="utf-8", xml_declaration=True)
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    main()
