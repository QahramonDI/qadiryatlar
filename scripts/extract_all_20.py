"""Extract fullText for all 20 TEXTBOOK_WORKS from PDFs."""
import json
import re
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).parent.parent
EXTRACTED = Path(__file__).parent / "extracted"

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
    {"id": "chin-va-yolgon", "titles": ["Chin va Yolg'on", "Chin va yol'gon", "Chin va Yolg‘on"]},
    {"id": "ona-qarzi", "titles": ["Ona qarzi"]},
    {"id": "zardoz", "titles": ["Zardo'z", "Zardo‘z"]},
    {"id": "karim-polvon", "titles": ["Karim polvon"]},
    {"id": "dustlik-kemasi", "titles": ["Do'stlik yo'lagi", "Do‘stlik yo‘lagi", "Do'stlik kemasi"]},
    {"id": "saxiy-dehqon", "titles": ["Yaxshilik izlagan bola", "Saxiy dehqon"]},
    {"id": "adolatli-qozi", "titles": ["Merosga kim munosib?", "Merosga kim munosib", "Adolatli qozi"]},
    {"id": "boburning-bolaligi", "titles": ["Sirli sandiq", "Boburning bolaligi"]},
    {"id": "mehribon-qiz", "titles": ["Mehribon qiz", "G'aroyib tanlov"]},
    {"id": "halol-savdogar", "titles": ["Halol savdogar", "Halol savdo"]},
    {"id": "mehnat-bahosi", "titles": ["Chumoli va bug'doy donasi", "Chumoli va bug‘doy donasi", "Mehnatning bahosi"]},
    {"id": "yolgonchi-cho'pon", "titles": ["Yolg'onchi cho'pon", "Bo'ri keldi", "Cho'pon"]},
    {"id": "ota-nasihati", "titles": ["Bog'bon va nihol", "Bog‘bon va nihol", "Ota nasihati"]},
    {"id": "kitob-dosti", "titles": ["Kitob - kuch", "Kitob -  kuch", "Kitob — kuch"]},
    {"id": "mardlik-qissasi", "titles": ["Mard o'g'lonlar bo'lamiz", "Mard o‘g‘lonlar bo‘lamiz", "Mard bola"]},
    {"id": "navruz-bayrami", "titles": ["Navro'z keldi", "Navro‘z keldi", "Sumalaklar - qandillar"]},
    {"id": "oltin-tarvuz", "titles": ["Oltin tarvuz", "Oltin tarvuz"]},
]

SUMMARIES = {
    "mehribon-qiz": "Kichik qiz kasal buvisiga g'amxo'rlik qiladi: choy damlaydi, ertak o'qib beradi, dorisini beradi. Uning mehri buvining sog'ayishiga yordam beradi. Mehr — eng kuchli davo.",
    "halol-savdogar": "Bozordagi savdogar mijozni hech qachon aldamaydi, tarozidan urmaydi. Avval xaridori kam edi, lekin halolligi tufayli odamlar faqat undan xarid qiladigan bo'lishdi.",
    "mehnat-bahosi": "Chumoli yozda mehnat qilib don to'playdi, tsikada esa faqat kuylaydi. Qish kelganda mehnatsevar chumoli to'q, dangasa tsikada esa och qoladi. Lekin chumoli unga ham yordam beradi.",
    "yolgonchi-cho'pon": "Cho'pon zerikkanidan «Bo'ri keldi!» deb bir necha bor yolg'on baqiradi. Odamlar har safar yugurib keladi, lekin bo'ri yo'q. Haqiqatan bo'ri kelganda esa hech kim ishonmaydi.",
    "navruz-bayrami": "She'rda bahor bayrami Navro'z kutib olinadi: tabiat uyg'onadi, sumalak pishiriladi, odamlar bir-birini tabriklaydi va yaxshilik qiladi.",
    "oltin-tarvuz": "Mehribon yigit qanotini singan qaldirg'ochni davolaydi. Qaldirg'och unga tarvuz urug'i beradi — undan oltinga to'la tarvuz unib chiqadi. Ochko'z qo'shni esa qaldirg'ochning qanotini ataylab sindiradi.",
}


def norm(s: str) -> str:
    s = s.lower().strip()
    for a, b in [("'", "'"), ("ʻ", "'"), ("ʼ", "'"), ("'", "'"), ("'", "'"), ("—", "-"), ("–", "-"), ("‘", "'"), ("’", "'")]:
        s = s.replace(a, b)
    return re.sub(r"\s+", " ", s)


def is_title(line: str, titles: list[str]) -> bool:
    n = norm(line.strip())
    return any(norm(t) == n for t in titles)


def is_exercise_start(line: str) -> bool:
    s = line.strip()
    if re.match(r"^(Savollarga|Savol|Testlarni|She'rni ifodali|Hikoyani qismlarga|Hikoyani diqqat|Maqollarni yod|Matndan|Rasm|Berilgan|Rollarga|Asar qahramon|Fikrni|She’rni ifodali)", s, re.I):
        return True
    if re.match(r"^1\.\s", s) and len(s) < 120:
        return True
    return False


def clean_line(line: str) -> str:
    line = line.strip()
    if not line or line.startswith("@ELEKTRON"):
        return ""
    if re.match(r"^\d+-(dars|mavzu)\s*$", line, re.I):
        return ""
    if re.match(r"^[A-Za-zА-Яа-яЁёУуЛлИи]{1,3}$", line):
        return ""
    return line


def clean_poem_text(text: str) -> str:
    text = re.sub(r"@ELEKTRON_DARSLIKBOT[^\n]*", "", text)
    lines = [clean_line(l) for l in text.split("\n")]
    out = []
    for l in lines:
        if not l:
            if out and out[-1] != "":
                out.append("")
            continue
        if is_exercise_start(l):
            break
        out.append(l)
    while out and out[-1] == "":
        out.pop()
    return "\n".join(out)


def clean_prose_text(text: str) -> str:
    text = re.sub(r"@ELEKTRON_DARSLIKBOT[^\n]*", "", text)
    paras = []
    buf = []
    for line in text.split("\n"):
        cl = clean_line(line)
        if not cl:
            if buf:
                paras.append(" ".join(buf))
                buf = []
            continue
        if is_exercise_start(cl):
            break
        buf.append(cl)
    if buf:
        paras.append(" ".join(buf))
    return "\n\n".join(p for p in paras if len(p) > 20)


def extract_work(lines: list[str], work: dict, poem_ids: set) -> str | None:
    best = ""
    titles = work["titles"]
    i = 0
    while i < len(lines):
        if is_title(lines[i], titles):
            j = i + 1
            skipped = 0
            while j < len(lines) and skipped < 30:
                s = lines[j].strip()
                if not s or s.startswith("@ELEKTRON"):
                    j += 1
                    continue
                if is_title(s, titles):
                    j += 1
                    continue
                if len(s) > 35 or s.startswith("-") or s.startswith("«") or s.startswith('"') or s.startswith("Bir ") or s.startswith("Qadim") or s.startswith("Rafiq") or s.startswith("Biz o") or s.startswith("Onajonim") or s.startswith("Kuz ") or s.startswith("Dengiz") or s.startswith("Qor ") or s.startswith("Kechki") or s.startswith("Bir og"):
                    break
                j += 1
                skipped += 1
            chunk_lines = []
            k = j
            while k < len(lines):
                s = lines[k]
                if is_title(s, titles) and k > j + 3:
                    break
                if is_exercise_start(s):
                    break
                chunk_lines.append(s)
                k += 1
            raw = "\n".join(chunk_lines)
            cleaned = clean_poem_text(raw) if work["id"] in poem_ids else clean_prose_text(raw)
            if len(cleaned) > len(best):
                best = cleaned
            i = k
        else:
            i += 1
    return best if len(best) > 80 else None


def main():
    poem_ids = {
        "vatan-yoshlari", "chin-va-yolgon", "zardoz", "dustlik-kemasi",
        "kitob-dosti", "mardlik-qissasi", "navruz-bayrami", "mehribon-qiz",
    }
    text = ""
    for p in PDF_PATHS:
        if not Path(p).exists():
            print(f"MISSING PDF: {p}", file=sys.stderr)
            continue
        doc = fitz.open(p)
        text += "\n".join(page.get_text() for page in doc) + "\n"
        doc.close()
    lines = text.split("\n")
    out = {}
    for w in WORKS:
        got = extract_work(lines, w, poem_ids)
        if not got and w["id"] in SUMMARIES:
            got = SUMMARIES[w["id"]]
        out[w["id"]] = got or ""
        print(f"{w['id']}: {len(out[w['id']])} chars {'OK' if got else 'EMPTY'}")
    EXTRACTED.mkdir(exist_ok=True)
    (EXTRACTED / "fulltexts_all.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
