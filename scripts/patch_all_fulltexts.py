"""Patch all fullText fields into textbook-data.js from fulltexts_all.json."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA = ROOT / "js" / "textbook-data.js"
FULLTEXTS = json.loads((Path(__file__).parent / "extracted" / "fulltexts_all.json").read_text(encoding="utf-8"))


def to_js_field(text: str) -> str:
    if not text.strip():
        return ""
    paras = text.split("\n\n") if "\n\n" in text else [text]
    if len(paras) == 1 and "\n" in text:
        paras = text.split("\n")
    parts = []
    for i, p in enumerate(paras):
        p = p.strip()
        if not p:
            continue
        suffix = "\\n\\n" if i < len(paras) - 1 and "\n\n" in text else ("\\n" if i < len(paras) - 1 and "\n\n" not in text else "")
        esc = p.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + suffix
        line = f'      "{esc}"'
        if i < len(paras) - 1:
            line += " +"
        parts.append(line)
    return "    fullText:\n" + "\n".join(parts) + ",\n"


def main():
    src = DATA.read_text(encoding="utf-8")
    for wid, text in FULLTEXTS.items():
        if not text.strip():
            src = re.sub(
                rf'(id: "{re.escape(wid)}",[\s\S]*?moral: "[^"]*",)\s*fullText:[\s\S]*?(    questions:)',
                rf"\1\n\2",
                src,
                count=1,
            )
            print(f"SKIP {wid} (empty)")
            continue
        field = to_js_field(text)
        pattern = rf'(id: "{re.escape(wid)}",[\s\S]*?moral: "[^"]*",)\s*(?:fullText:[\s\S]*?)?(    questions:)'
        m = re.search(pattern, src)
        if not m:
            print(f"FAIL {wid}")
            continue
        src = src[: m.start()] + m.group(1) + "\n" + field + "\n" + m.group(2) + src[m.end() :]
        print(f"OK {wid} ({len(text)} chars)")
    DATA.write_text(src, encoding="utf-8")


if __name__ == "__main__":
    main()
