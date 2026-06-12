"""Inject fullText fields into textbook-data.js"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA = ROOT / "js" / "textbook-data.js"
FULLTEXTS = json.loads((Path(__file__).parent / "extracted" / "fulltexts.json").read_text(encoding="utf-8"))


def to_js_concat(text: str, indent: str = "    ") -> str:
    paras = text.split("\n\n")
    chunks = []
    for p in paras:
        esc = p.replace("\\", "\\\\").replace('"', '\\"')
        chunks.append(f'{indent}"{esc}"')
    if len(chunks) == 1:
        return chunks[0] + ","
    lines = []
    for i, c in enumerate(chunks):
        suffix = " +" if i < len(chunks) - 1 else ","
        lines.append(c + suffix)
    return "\n".join(lines)


def main():
    src = DATA.read_text(encoding="utf-8")
    for wid, text in FULLTEXTS.items():
        field = f"\n    fullText:\n      {to_js_concat(text, '      ')}\n"
        # Insert after moral line for this work
        pattern = rf'(id: "{re.escape(wid)}",[\s\S]*?moral: "[^"]*",)'
        m = re.search(pattern, src)
        if not m:
            print(f"WARN: could not find {wid}")
            continue
        if f'id: "{wid}"' in src and "fullText:" in src[src.find(f'id: "{wid}"'):src.find(f'id: "{wid}"') + 2000]:
            print(f"SKIP {wid} (already has fullText)")
            continue
        src = src[: m.end()] + field + src[m.end() :]
        print(f"Patched {wid}")
    DATA.write_text(src, encoding="utf-8")


if __name__ == "__main__":
    main()
