import zipfile
import re
import json
import xml.etree.ElementTree as ET
from pathlib import Path

DOCX = Path(r"c:\Users\Abdullayev\Desktop\Новый документ.docx")
OUT = Path(__file__).resolve().parent / "extracted-works.json"
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def extract_paras(path):
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    paras = []
    for para in root.iter(W + "p"):
        texts = [t.text or "" for t in para.iter(W + "t")]
        paras.append("".join(texts))
    return paras


def is_meta_line(line):
    return (
        line.startswith("Muallif:")
        or line.startswith("Janr:")
        or "| Sinf:" in line
        or line.startswith("Janr ")
    )


paras = extract_paras(DOCX)
header_re = re.compile(r"^(\d{1,2})\.\s+(.+)$")
works = []
current = None

for line in paras:
    line = line.strip()
    if not line:
        if current is not None:
            current["body"].append("")
        continue
    m = header_re.match(line)
    if m and not is_meta_line(line):
        if current:
            works.append(current)
        current = {
            "num": int(m.group(1)),
            "title": m.group(2).strip(),
            "meta_lines": [],
            "body": [],
        }
    elif current is not None:
        if is_meta_line(line):
            current["meta_lines"].append(line)
        else:
            current["body"].append(line)

if current:
    works.append(current)

OUT.write_text(json.dumps(works, ensure_ascii=False, indent=2), encoding="utf-8")
print("works", len(works))
for w in works:
    body = "\n".join(w["body"]).strip()
    print(f"{w['num']:2}. {w['title'][:55]}  meta={len(w['meta_lines'])}  chars={len(body)}")
