"""Remove duplicate fullText fields and keep one clean version per work."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA = ROOT / "js" / "textbook-data.js"
FULLTEXTS = json.loads((Path(__file__).parent / "extracted" / "fulltexts.json").read_text(encoding="utf-8"))


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
    return "\n    fullText:\n" + "\n".join(parts) + ",\n"


def main():
    src = DATA.read_text(encoding="utf-8")
    # Remove ALL fullText blocks
    src = re.sub(
        r"\n    fullText:\n(?:      \"(?:\\.|[^\"])*\"(?: \+)?\n?)+",
        "\n",
        src,
    )
    # Insert one per work after moral
    for wid, text in FULLTEXTS.items():
        field = to_js_field(text)
        pattern = rf'(id: "{re.escape(wid)}",[\s\S]*?moral: "[^"]*",)'
        m = re.search(pattern, src)
        if m:
            src = src[: m.end()] + field + src[m.end() :]
            print(f"OK {wid}")
        else:
            print(f"MISS {wid}")
    DATA.write_text(src, encoding="utf-8")


if __name__ == "__main__":
    main()
