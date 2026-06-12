"""Patch textbook-data.js questions/tests/crossword + regenerate work-tests-data.js."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
DERIV = Path(__file__).parent / "work-derivatives.json"
DATA = ROOT / "js" / "textbook-data.js"
TESTS_JS = ROOT / "js" / "work-tests-data.js"

WORK_IDS = [
    "temir-qoziq", "karim-polvon", "chin-va-yolgon", "mehnat-bahosi", "dustlik-kemasi",
    "saxiy-dehqon", "zardoz", "halol-savdogar", "ota-nasihati", "mehribon-qiz",
    "ona-qarzi", "adolatli-qozi", "yolgonchi-cho'pon", "navruz-bayrami", "kitob-dosti",
    "mardlik-qissasi", "vatan-yoshlari", "marvarid", "boburning-bolaligi", "oltin-tarvuz",
]


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def format_questions(questions: list[str]) -> str:
    lines = ["    questions: ["]
    for q in questions:
        lines.append(f'      "{esc(q)}",')
    lines.append("    ],")
    return "\n".join(lines)


def format_tests(tests: list[dict]) -> str:
    lines = ["    tests: ["]
    for t in tests:
        opts = json.dumps(t["options"], ensure_ascii=False)
        lines.append("      {")
        lines.append(f'        q: "{esc(t["q"])}",')
        lines.append(f"        options: {opts},")
        lines.append(f'        correct: {t["correct"]},')
        lines.append("      },")
    lines.append("    ],")
    return "\n".join(lines)


def format_crossword(entries: list[dict]) -> str:
    lines = ["    crossword: ["]
    for c in entries:
        lines.append(f'      {{ word: "{esc(c["word"])}", clue: "{esc(c["clue"])}" }},')
    lines.append("    ],")
    return "\n".join(lines)


def replace_section(block: str, key: str, next_key: str, new_lines: str) -> str:
    start = block.index(f"    {key}: [")
    end = block.index(f"    {next_key}:", start)
    return block[:start] + new_lines + "\n" + block[end:]


def patch_work_block(block: str, deriv: dict) -> str:
    block = replace_section(block, "questions", "tests", format_questions(deriv["questions"]))
    block = replace_section(block, "tests", "crossword", format_tests(deriv["tests"]))
    block = replace_section(block, "crossword", "illustration", format_crossword(deriv["crossword"]))
    return block


def find_work_spans(src: str) -> list[tuple[str, int, int]]:
    """Return (work_id, start, end) for each work object in TEXTBOOK_WORKS."""
    id_pat = re.compile(r'\n  \{\n    id: "([^"]+)"')
    matches = list(id_pat.finditer(src))
    spans = []
    for i, m in enumerate(matches):
        wid = m.group(1)
        start = m.start() + 1
        if i + 1 < len(matches):
            end = matches[i + 1].start()
        else:
            end = src.index("\n];", start)
        spans.append((wid, start, end))
    return spans


def patch_textbook(src: str, all_deriv: dict) -> str:
    spans = find_work_spans(src)
    out = []
    last = 0
    for wid, start, end in spans:
        out.append(src[last:start])
        block = src[start:end]
        if wid in all_deriv:
            block = patch_work_block(block, all_deriv[wid])
            print(f"OK derivatives {wid}")
        else:
            print(f"SKIP {wid}")
        out.append(block)
        last = end
    out.append(src[last:])
    return "".join(out)


def write_work_tests_js(all_deriv: dict) -> None:
    tests = {wid: all_deriv[wid]["tests"] for wid in WORK_IDS if wid in all_deriv}
    lines = [
        "/* Har bir asar uchun 10 ta ko'p tanlovli savol — darslik matniga mos */",
        "const WORK_TESTS = " + json.dumps(tests, ensure_ascii=False, indent=2) + ";",
        "",
        "function applyWorkTests() {",
        "  if (typeof TEXTBOOK_WORKS === 'undefined') return;",
        "  TEXTBOOK_WORKS.forEach((w) => {",
        "    if (WORK_TESTS[w.id]) w.tests = WORK_TESTS[w.id];",
        "  });",
        "}",
        "",
        "applyWorkTests();",
        "",
        "if (typeof window !== 'undefined') {",
        "  window.WORK_TESTS = WORK_TESTS;",
        "  window.applyWorkTests = applyWorkTests;",
        "}",
        "",
    ]
    TESTS_JS.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {TESTS_JS}")


def main():
    all_deriv = json.loads(DERIV.read_text(encoding="utf-8"))
    assert len(all_deriv) == 20, len(all_deriv)

    src = DATA.read_text(encoding="utf-8")
    src = patch_textbook(src, all_deriv)
    DATA.write_text(src, encoding="utf-8")
    print(f"Updated {DATA}")

    write_work_tests_js(all_deriv)


if __name__ == "__main__":
    main()
