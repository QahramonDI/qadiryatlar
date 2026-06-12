"""Extract full literary work texts — v3: longest narrative block per title."""
import json
import re
from pathlib import Path

import fitz

PDF_PATHS = [
    r"c:\Users\Abdullayev\Downloads\Telegram Desktop\3-sinf O'qish savodxonligi 1-qism (@elekton_darslikbot).pdf",
    r"c:\Users\Abdullayev\Downloads\Telegram Desktop\3-sinf O'qish savodxonligi 2-qism (@elekton_darslikbot).pdf",
    r"c:\Users\Abdullayev\Downloads\Telegram Desktop\3-sinf O'qish savodxonligi 3-qism (@elekton_darslikbot).pdf",
    r"c:\Users\Abdullayev\Downloads\Telegram Desktop\3-sinf O'qish savodxonligi 4-qism (@elekton_darslikbot).pdf",
    r"c:\Users\Abdullayev\Downloads\Telegram Desktop\4-sinf-Oqish-savodxonligi-1-qism.pdf",
    r"c:\Users\Abdullayev\Downloads\Telegram Desktop\4-sinf-Oqish-savodxonligi-2-qism.pdf",
    r"c:\Users\Abdullayev\Downloads\Telegram Desktop\4-sinf-Oqish-savodxonligi-3-qism.pdf",
    r"c:\Users\Abdullayev\Downloads\Telegram Desktop\4-sinf-Oqish-savodxonligi-4-qism.pdf",
]

WORKS = [
    {"id": "marvarid", "titles": ["Marvarid"]},
    {"id": "temir-qoziq", "titles": ["Temir qoziq"]},
    {"id": "vatan-yoshlari", "titles": ["Vatan yoshlari"]},
    {"id": "chin-va-yolgon", "titles": ["Chin va Yolg'on", "Chin va Yolg'on", "Chin va Yolg'on"]},
    {"id": "ona-qarzi", "titles": ["Ona qarzi"]},
    {"id": "zardoz", "titles": ["Zardo'z", "Zardo'z"]},
    {"id": "karim-polvon", "titles": ["Karim polvon"]},
]

ALL_TITLES = []
for w in WORKS:
    ALL_TITLES.extend([(w["id"], t) for t in w["titles"]])


def norm(s: str) -> str:
    s = s.lower().strip()
    for a, b in [("'", "'"), ("ʻ", "'"), ("ʼ", "'"), ("'", "'"), ("'", "'"), ("—", "-"), ("–", "-")]:
        s = s.replace(a, b)
    return re.sub(r"\s+", " ", s)


def is_title(line: str, titles: list[str]) -> bool:
    n = norm(line.strip())
    return any(norm(t) == n for t in titles)


def is_any_title(line: str) -> bool:
    n = norm(line.strip())
    return any(norm(t) == n for _, t in ALL_TITLES)


def is_exercise_start(line: str) -> bool:
    s = line.strip()
    if re.match(r"^(Savollarga|Savol|Testlarni|Test |Topshiriq|She'rni ifodali|Hikoyani qismlarga|Hikoyani diqqat|Maqollarni yod|Hikoyat mazmunini so'zlab)", s, re.I):
        return True
    if re.match(r"^1\.\s", s) and len(s) < 120:
        return True
    if re.match(r"^&\s*$", s):
        return True
    return False


def clean_line(line: str) -> str:
    line = line.strip()
    if not line or line.startswith("@ELEKTRON"):
        return ""
    if re.match(r"^\d+-(dars|mavzu)\s*$", line, re.I):
        return ""
    if re.match(r"^(P|Ф|G|H|J|К|У|Л|□|CJ|mm|a|n|I|j|e|q|t|f|Ъ|Ш)$", line):
        return ""
    return line


def clean_text(text: str) -> str:
    text = re.sub(r"@ELEKTRON_DARSLIKBOT[^\n]*", "", text)
    for old, new in [
        ("0 'sha", "O'sha"), ("0 'zi", "O'zi"), ("0 'zbek", "O'zbek"),
        ("0 't ", "O't "), ("0 'qigan", "O'qigan"), ("0 'n ", "On "),
        ("q o 'y a d i", "qoyadi"), ("bo'lib", "bo'lib"), ("ko'r", "ko'r"),
        ("'", "'"), ("'", "'"), ("'", "'"),
    ]:
        text = text.replace(old, new)
    paras = []
    for p in re.split(r"\n\s*\n", text):
        p = " ".join(clean_line(l) for l in p.split("\n") if clean_line(l))
        p = re.sub(r"\s+", " ", p).strip()
        if p and len(p) > 15:
            paras.append(p)
    return "\n\n".join(paras)


def extract_all() -> str:
    parts = []
    for path in PDF_PATHS:
        doc = fitz.open(path)
        parts.append("\n".join(page.get_text() for page in doc))
        doc.close()
    return "\n".join(parts)


def extract_work(lines: list[str], work: dict) -> str | None:
    best = ""
    i = 0
    while i < len(lines):
        if is_title(lines[i], work["titles"]):
            # skip title + metadata until narrative
            j = i + 1
            skipped_meta = 0
            while j < len(lines) and skipped_meta < 25:
                s = lines[j].strip()
                if not s or s.startswith("@ELEKTRON"):
                    j += 1
                    continue
                if is_title(s, work["titles"]):
                    j += 1
                    continue
                # narrative start heuristics
                if len(s) > 40 or s.startswith("-") or s.startswith('"') or s.startswith("«") or s.startswith("Dengiz") or s.startswith("Bir ") or s.startswith("Kuz ") or s.startswith("Rafiq") or s.startswith("Biz o") or s.startswith("Onajonim") or s.startswith("Kuz kelishi"):
                    break
                j += 1
                skipped_meta += 1
            body_lines = []
            while j < len(lines):
                s = lines[j].strip()
                if is_any_title(s) and not is_title(s, work["titles"]):
                    break
                if is_exercise_start(s) and len(body_lines) > 3:
                    break
                cl = clean_line(lines[j])
                if cl:
                    body_lines.append(cl)
                j += 1
            candidate = clean_text("\n".join(body_lines))
            if len(candidate) > len(best):
                best = candidate
        i += 1
    return best if len(best) > 100 else None


def main():
    text = extract_all()
    lines = text.split("\n")
    out = Path(__file__).parent / "extracted"
    out.mkdir(exist_ok=True)
    results = {}
    for work in WORKS:
        ft = extract_work(lines, work)
        if ft:
            results[work["id"]] = ft
            (out / f"{work['id']}.txt").write_text(ft, encoding="utf-8")
            print(f"OK {work['id']}: {len(ft)} chars, ~{ft.count(chr(10))+1} paras")
        else:
            print(f"MISS {work['id']}")
    (out / "fulltexts.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
