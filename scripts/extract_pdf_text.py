"""Extract literary works from Uzbek textbook PDFs and match to TEXTBOOK_WORKS."""
import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

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
    {"id": "marvarid", "title": "Marvarid"},
    {"id": "temir-qoziq", "title": "Temir qoziq"},
    {"id": "vatan-yoshlari", "title": "Vatan yoshlari"},
    {"id": "chin-va-yolgon", "title": "Chin va yolg'on"},
    {"id": "ona-qarzi", "title": "Ona qarzi"},
    {"id": "zardoz", "title": "Zardo'z"},
    {"id": "karim-polvon", "title": "Karim polvon"},
    {"id": "dustlik-kemasi", "title": "Do'stlik kemasi"},
    {"id": "saxiy-dehqon", "title": "Saxiy dehqon"},
    {"id": "adolatli-qozi", "title": "Adolatli qozi"},
    {"id": "boburning-bolaligi", "title": "Boburning bolaligi"},
    {"id": "mehribon-qiz", "title": "Mehribon qiz"},
    {"id": "halol-savdogar", "title": "Halol savdogar"},
    {"id": "mehnat-bahosi", "title": "Mehnatning bahosi"},
    {"id": "yolgonchi-cho'pon", "title": "Yolg'onchi cho'pon"},
    {"id": "ota-nasihati", "title": "Ota nasihati"},
    {"id": "kitob-dosti", "title": "Kitob — eng yaxshi do'st"},
    {"id": "mardlik-qissasi", "title": "Mard bola"},
    {"id": "navruz-bayrami", "title": "Navro'z keldi"},
    {"id": "oltin-tarvuz", "title": "Oltin tarvuz"},
]

# Alternate title patterns in textbooks
TITLE_ALIASES = {
    "kitob-dosti": ["Kitob — eng yaxshi do'st", "Kitob - eng yaxshi do'st", "Kitob eng yaxshi do'st"],
    "mardlik-qissasi": ["Mard bola", "Mardlik qissasi"],
    "navruz-bayrami": ["Navro'z keldi", "Navruz keldi"],
    "mehnat-bahosi": ["Mehnatning bahosi", "Mehnat bahosi"],
    "zardoz": ["Zardo'z", "Zardoz"],
}


def normalize(s: str) -> str:
    s = s.lower().strip()
    for a, b in [("'", "'"), ("ʻ", "'"), ("ʼ", "'"), ("`", "'"), ("—", "-"), ("–", "-"), ("«", ""), ("»", ""), (""", ""), (""", "")]:
        s = s.replace(a, b)
    s = re.sub(r"\s+", " ", s)
    return s


def extract_all_text() -> str:
    parts = []
    for i, path in enumerate(PDF_PATHS, 1):
        p = Path(path)
        if not p.exists():
            print(f"MISSING: {path}", file=sys.stderr)
            continue
        doc = fitz.open(path)
        text = []
        for page in doc:
            text.append(page.get_text())
        doc.close()
        chunk = "\n".join(text)
        parts.append(f"\n\n===== PDF {i}: {p.name} =====\n\n{chunk}")
        print(f"PDF {i}: {len(chunk)} chars, {len(doc)} pages" if False else f"PDF {i}: {len(chunk)} chars", file=sys.stderr)
    return "\n".join(parts)


def find_title_positions(text: str, work: dict) -> list[int]:
    titles = [work["title"]] + TITLE_ALIASES.get(work["id"], [])
    positions = []
    norm_text = text
    for title in titles:
        for variant in [title, title.upper(), title.title()]:
            idx = 0
            while True:
                pos = norm_text.find(variant, idx)
                if pos == -1:
                    # try normalized
                    break
                positions.append(pos)
                idx = pos + 1
    # Also try normalized matching line by line
    lines = text.split("\n")
    offset = 0
    norm_titles = {normalize(t) for t in titles}
    for line in lines:
        nl = normalize(line.strip())
        for nt in norm_titles:
            if nl == nt or (len(nt) > 5 and nt in nl and len(nl) < len(nt) + 20):
                positions.append(offset)
        offset += len(line) + 1
    return sorted(set(positions))


def is_likely_heading(line: str, title: str) -> bool:
    line = line.strip()
    if not line or len(line) > 80:
        return False
    nt = normalize(title)
    nl = normalize(line)
    if nl == nt:
        return True
    aliases = TITLE_ALIASES.get("", [])  # noqa
    for alias in [title] + TITLE_ALIASES.get("", []):
        if normalize(alias) == nl:
            return True
    return nl == nt or (nt in nl and len(line) < len(title) + 30)


def extract_works(text: str) -> dict[str, str]:
    """Find work sections by title headings."""
    lines = text.split("\n")
    
    # Build list of (line_idx, work_id) for headings
    headings = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue
        for work in WORKS:
            titles = [work["title"]] + TITLE_ALIASES.get(work["id"], [])
            for title in titles:
                nt = normalize(title)
                nl = normalize(stripped)
                if nl == nt or (len(nt) >= 8 and nl.startswith(nt) and len(stripped) < len(title) + 40):
                    headings.append((i, work["id"], stripped))
                    break
    
    # Deduplicate: keep first occurrence per work (or best)
    seen = {}
    for idx, wid, title_line in headings:
        if wid not in seen:
            seen[wid] = (idx, title_line)
    
    # Sort by line index
    ordered = sorted(seen.items(), key=lambda x: x[1][0])
    
    # All work title norms for end detection
    all_title_norms = set()
    for work in WORKS:
        for t in [work["title"]] + TITLE_ALIASES.get(work["id"], []):
            all_title_norms.add(normalize(t))
    
    results = {}
    for j, (wid, (start_idx, title_line)) in enumerate(ordered):
        end_idx = ordered[j + 1][1][0] if j + 1 < len(ordered) else len(lines)
        
        body_lines = []
        started = False
        for k in range(start_idx, end_idx):
            line = lines[k].strip()
            if k == start_idx:
                started = True
                continue  # skip title line
            if not started:
                continue
            # Stop at exercise markers
            if re.match(r"^(Savollar?|Test|Topshiriq|O['']?qing|O['']?qib|Izoh|Lug['']?at)", line, re.I):
                break
            if re.match(r"^\d+\.\s", line) and k > start_idx + 3:
                # numbered questions section
                if any(w in line.lower() for w in ["savol", "javob", "tanlang"]):
                    break
            body_lines.append(lines[k])
        
        body = "\n".join(body_lines).strip()
        # Clean up excessive whitespace
        body = re.sub(r"\n{3,}", "\n\n", body)
        body = re.sub(r"[ \t]+\n", "\n", body)
        if len(body) > 100:
            results[wid] = body
    
    return results


def main():
    out_dir = Path(__file__).parent / "extracted"
    out_dir.mkdir(exist_ok=True)
    
    print("Extracting PDF text...", file=sys.stderr)
    full_text = extract_all_text()
    (out_dir / "all_text.txt").write_text(full_text, encoding="utf-8")
    print(f"Total: {len(full_text)} chars", file=sys.stderr)
    
    works = extract_works(full_text)
    
    report = {"found": [], "missing": [], "works": {}}
    for work in WORKS:
        wid = work["id"]
        if wid in works:
            report["found"].append(wid)
            report["works"][wid] = {
                "title": work["title"],
                "length": len(works[wid]),
                "preview": works[wid][:300],
                "fullText": works[wid],
            }
            (out_dir / f"{wid}.txt").write_text(works[wid], encoding="utf-8")
            print(f"FOUND: {wid} ({len(works[wid])} chars)", file=sys.stderr)
        else:
            report["missing"].append(wid)
            print(f"MISSING: {wid}", file=sys.stderr)
    
    (out_dir / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"found": report["found"], "missing": report["missing"], "counts": {k: len(v["fullText"]) for k, v in report["works"].items()}}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
