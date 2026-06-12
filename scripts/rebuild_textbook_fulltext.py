"""Rebuild textbook-data.js fullText fields cleanly."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA = ROOT / "js" / "textbook-data.js"
FULLTEXTS = json.loads((Path(__file__).parent / "extracted" / "fulltexts.json").read_text(encoding="utf-8"))
WORK_IDS = list(FULLTEXTS.keys())


def to_js_field(text: str) -> str:
    paras = text.split("\n\n")
    parts = []
    for i, p in enumerate(paras):
        suffix = "\\n\\n" if i < len(paras) - 1 else ""
        esc = p.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + suffix
        line = f'      "{esc}"'
        if i < len(paras) - 1:
            line += " +"
        parts.append(line)
    return "    fullText:\n" + "\n".join(parts) + ",\n"


def main():
    src = DATA.read_text(encoding="utf-8")
    for wid in WORK_IDS:
        text = FULLTEXTS[wid]
        field = to_js_field(text)
        # Replace from moral through questions (strip any fullText junk in between)
        pattern = (
            rf'(id: "{re.escape(wid)}",[\s\S]*?moral: "[^"]*",)\s*'
            rf'(?:[\s\S]*?)(    questions:)'
        )
        m = re.search(pattern, src)
        if not m:
            print(f"FAIL {wid}")
            continue
        replacement = m.group(1) + "\n" + field + "\n" + m.group(2)
        src = src[: m.start()] + replacement + src[m.end() :]
        print(f"OK {wid}")
    DATA.write_text(src, encoding="utf-8")


if __name__ == "__main__":
    main()
