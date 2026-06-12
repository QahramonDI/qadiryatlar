"""Apply full works from docx to site: work-fulltexts.js + textbook-data metadata."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
DOCX_JSON = Path(__file__).parent / "extracted-works.json"
DATA = ROOT / "js" / "textbook-data.js"
FULLTEXTS_JS = ROOT / "js" / "work-fulltexts.js"

# Sayt work id -> docx work number (1..20)
SITE_TO_DOCX = {
    "temir-qoziq": 1,
    "karim-polvon": 2,
    "chin-va-yolgon": 3,
    "mehnat-bahosi": 4,
    "dustlik-kemasi": 5,
    "saxiy-dehqon": 6,
    "zardoz": 7,
    "halol-savdogar": 8,
    "ota-nasihati": 9,
    "mehribon-qiz": 10,
    "ona-qarzi": 11,
    "adolatli-qozi": 12,
    "yolgonchi-cho'pon": 13,
    "navruz-bayrami": 14,
    "kitob-dosti": 15,
    "mardlik-qissasi": 16,
    "vatan-yoshlari": 17,
    "marvarid": 18,
    "boburning-bolaligi": 19,
    "oltin-tarvuz": 20,
}

VALUE_MAP = {
    "vatanparvarlik": "vatanparvarlik",
    "vatan": "vatanparvarlik",
    "vatan muhabbati": "vatanparvarlik",
    "halollik": "halollik",
    "axloq": "halollik",
    "do'stlik": "dustlik",
    "do‘stlik": "dustlik",
    "kamtarlik": "dustlik",
    "mehnatsevarlik": "mehnatsevarlik",
    "mehr-oqibat": "mehribonlik",
    "mehr": "mehribonlik",
    "oila": "mehribonlik",
    "onalik": "ota-onaga-hurmat",
    "keksalarni hurmat": "ota-onaga-hurmat",
    "kitob": "masuliyat",
    "ilm": "masuliyat",
    "meros": "masuliyat",
    "tarix": "vatanparvarlik",
    "bobolar merosi": "vatanparvarlik",
    "tabiatni asrash": "vatanparvarlik",
    "mardlik": "masuliyat",
    "milliy sport": "vatanparvarlik",
    "tarbiya": "ota-onaga-hurmat",
    "odob": "halollik",
    "saxovatlilik": "saxovat",
    "saxovat": "saxovat",
    "adolat": "adolat",
    "insof": "adolat",
}


def parse_meta(meta_lines):
    meta = {"author": "", "genre": "", "grade": 3, "valueHint": ""}
    line = " | ".join(meta_lines)
    m = re.search(r"Muallif:\s*([^|]+)", line)
    if m:
        meta["author"] = m.group(1).strip()
    m = re.search(r"Janr:\s*([^|]+)", line)
    if m:
        g = m.group(1).strip()
        g = re.sub(r"\s*\([^)]*\)", "", g).strip().lower()
        meta["genre"] = g.split()[0] if g else ""
    m = re.search(r"Sinf:\s*(\d+)-sinf", line)
    if m:
        meta["grade"] = int(m.group(1))
    m = re.search(r"Qadriyat:\s*(.+)$", line)
    if m:
        meta["valueHint"] = m.group(1).strip().lower()
    return meta


def body_to_fulltext(body):
    paras = []
    for p in body:
        t = p.strip()
        if t:
            paras.append(t)
    return "\n\n".join(paras)


def guess_value_main(hint: str) -> str:
    if not hint:
        return "halollik"
    h = hint.lower().replace("'", "'").replace("'", "'")
    for key, val in VALUE_MAP.items():
        if key in h:
            return val
    return "halollik"


def summary_from_text(text: str, max_len=280) -> str:
    t = re.sub(r"\s+", " ", text).strip()
    if len(t) <= max_len:
        return t
    cut = t[: max_len - 1].rsplit(" ", 1)[0]
    return cut + "…"


def moral_from_hint(hint: str, title: str) -> str:
    h = (hint or "").lower()
    if "vatan" in h:
        return "Vatan — yagona va muqaddas; uni sevish har bir farzandning burchi."
    if "do'st" in h or "do‘st" in h:
        return "Haqiqiy do'stlik saxovat va kamtarlik bilan namoyon bo'ladi."
    if "mehnat" in h:
        return "Mehnat qiluvchi har doim hurmatga loyiq."
    if "halol" in h or "axloq" in h or "odob" in h:
        return "Halollik va odob insonning eng yaxshi bezagi."
    if "ona" in h or "keksa" in h or "mehr" in h:
        return "Ota-onaga va katta yoshlarga mehr — aziz qadriyat."
    if "kitob" in h or "ilm" in h:
        return "Kitob — bilim manbai va eng yaxshi do'st."
    if "tabiat" in h:
        return "Tabiatni asrash — hammamizning burchimiz."
    if "meros" in h or "tarix" in h or "bobolar" in h:
        return "Bobolar merosini asrab, ularga munosib avlod bo'lish kerak."
    if "mardlik" in h or "sport" in h:
        return "Mardlik va jasorat milliy g'ururimizning ramzi."
    if "adolat" in h or "insof" in h:
        return "Adolat — haqiqatni topish va insof bilan hukm qilish."
    return f"«{title}» asari orqali qadriyatlarni o'rganamiz."


def keywords_from_title(title: str) -> list[str]:
    stop = {"va", "nima", "deydi", "sening", "kim", "munosib", "bilganlar", "the"}
    words = re.findall(r"[A-Za-zА-Яа-яЁёO'o'ʻO'g'ʻ]+", title.lower())
    out = []
    for w in words:
        if len(w) > 2 and w not in stop and w not in out:
            out.append(w)
    return out[:4] or [title.split()[0].lower()]


def js_string(s: str) -> str:
    return (
        s.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\r", "")
        .replace("\n", "\\n")
    )


def build_fulltexts_js(fulltexts: dict) -> str:
    lines = ["/* To'liq asar matnlari — darslik (docx) matniga mos */", "const WORK_FULLTEXTS = {"]
    ids = list(SITE_TO_DOCX.keys())
    for i, wid in enumerate(ids):
        text = fulltexts.get(wid, "")
        if not text:
            continue
        comma = "," if i < len(ids) - 1 else ""
        lines.append(f'  "{wid}": {json.dumps(text, ensure_ascii=False)}{comma}')
    lines.append("};")
    return "\n".join(lines) + "\n"


def patch_textbook_data(works_by_num, src: str) -> str:
    for wid, num in SITE_TO_DOCX.items():
        w = works_by_num[num]
        meta = parse_meta(w["meta_lines"])
        full = body_to_fulltext(w["body"])
        title = w["title"]
        author = meta["author"] or "Darslik"
        grade = meta["grade"]
        genre = meta["genre"] or "matn"
        value_main = guess_value_main(meta["valueHint"])
        summary = summary_from_text(full[:600] if full else title)

        block_pat = rf'(id: "{re.escape(wid)}",[\s\S]*?)(    keywords: \[[^\]]*\],)'
        m = re.search(block_pat, src)
        if not m:
            print(f"SKIP block {wid}")
            continue

        block = m.group(1)
        moral = moral_from_hint(meta["valueHint"], title)
        kws = keywords_from_title(title)
        safe = lambda s: s.replace('"', "'")

        block = re.sub(r'title: "[^"]*"', f'title: "{safe(title)}"', block, count=1)
        block = re.sub(r'author: "[^"]*"', f'author: "{safe(author)}"', block, count=1)
        block = re.sub(r"grade: \d+", f"grade: {grade}", block, count=1)
        block = re.sub(r'genre: "[^"]*"', f'genre: "{genre}"', block, count=1)
        block = re.sub(r'valueMain: "[^"]*"', f'valueMain: "{value_main}"', block, count=1)
        block = re.sub(
            r'summary:\s*\n(?:\s*"[^"]*"(?:\s*\+\s*\n\s*"[^"]*")*)',
            f'summary:\n      "{safe(summary)}"',
            block,
            count=1,
        )
        block = re.sub(r'moral: "[^"]*"', f'moral: "{safe(moral)}"', block, count=1)
        block = re.sub(r"\n    fullText:[\s\S]*?(?=\n    questions:)", '\n    fullText: "",', block)

        new_kw = "    keywords: " + json.dumps(kws, ensure_ascii=False) + ","
        src = src[: m.start()] + block + new_kw + src[m.end() :]
        print(f"OK meta {wid} -> {title}")

    return src


def main():
    works = json.loads(DOCX_JSON.read_text(encoding="utf-8"))
    works_by_num = {w["num"]: w for w in works}

    fulltexts = {}
    for wid, num in SITE_TO_DOCX.items():
        fulltexts[wid] = body_to_fulltext(works_by_num[num]["body"])

    FULLTEXTS_JS.write_text(build_fulltexts_js(fulltexts), encoding="utf-8")
    print(f"Wrote {FULLTEXTS_JS}")

    src = DATA.read_text(encoding="utf-8")
    src = patch_textbook_data(works_by_num, src)
    DATA.write_text(src, encoding="utf-8")
    print(f"Updated {DATA}")


if __name__ == "__main__":
    main()
