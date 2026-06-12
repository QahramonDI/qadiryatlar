"""Extract full literary work texts from textbook PDFs — v2 with cleanup."""
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

WORK_PATTERNS = [
    {"id": "marvarid", "titles": ["Marvarid"], "author": "Meri Joslin"},
    {"id": "temir-qoziq", "titles": ["Temir qoziq"], "author": None},
    {"id": "vatan-yoshlari", "titles": ["Vatan yoshlari"], "author": "Azim Suyun"},
    {"id": "chin-va-yolgon", "titles": ["Chin va Yolg'on", "Chin va Yolg‘on"], "author": "Po'lat Mo'min"},
    {"id": "ona-qarzi", "titles": ["Ona qarzi"], "author": "Hind xalq ertagi"},
    {"id": "zardoz", "titles": ["Zardo'z", "Zardo‘z"], "author": "Ravshan Isoqov"},
    {"id": "karim-polvon", "titles": ["Karim polvon"], "author": "Abdulla Saidov"},
]

STOP_PATTERNS = [
    r"^@ELEKTRON",
    r"^\d+\.\s",
    r"^Savollarga",
    r"^Savol",
    r"^Test",
    r"^Topishmoq",
    r"^Maqol",
    r"^She'rni ifodali",
    r"^Hikoyani",
    r"^Matnni",
    r"^Rasm",
    r"^Quyida",
    r"^Berilgan",
    r"^Audiomatn",
    r"^\d+-dars",
    r"^\d+-mavzu",
    r"^P$",
    r"^Ф$",
    r"^&$",
    r"^□$",
    r"^Л$",
    r"^G$",
    r"^H$",
    r"^J$",
    r"^К$",
    r"^У$",
    r"^W ",
    r"^CJ$",
    r"^\[V \]$",
    r"^fa t\?",
    r"^n$",
    r"^a$",
    r"^I$",
    r"^j$",
    r"^e$",
    r"^q$",
    r"^t$",
    r"^f$",
    r"^Ъ$",
    r"^Ш$",
    r"^mm$",
    r"^•",
    r"^«",
    r"^Ф ",
    r"^Ц ",
    r"^Л ",
    r"^□",
    r"^jtT",
    r"^ТодЧаг",
    r"^M UNDARIJA",
    r"^Darslik holati",
    r"^Maqollarni",
    r"^Hikmatli",
    r"^Po'lat Mo'min$",
    r"^Polat Mo'min$",
    r"^Abdulla Saidov$",
    r"^Meri Joslin$",
    r"^Azim Suyun$",
    r"^Ravshan Isoqov$",
    r"^Hind xalq ertagi$",
    r"^\(Hind xalq ertagi\)$",
    r"^Hikoyat\)$",
    r"^\(Hikoyat\)$",
    r"^She'r",
    r"^Xalq",
    r"^O'zbekiston",
    r"^Aziz bolajonlar",
    r"^Qadrli o'quvchi",
    r"^Mazkur kitob",
    r"^© ",
    r"^Aydarova",
    r"^Toirova",
    r"^Umumiy o'rta",
    r"^“Novda",
    r"^Toshkent",
    r"^Muharrir",
    r"^Badiiy",
    r"^Musahhih",
    r"^Rassom",
    r"^Kompyuterda",
    r"^Nashriyot",
    r"^Adadi",
    r"^Shartli",
    r"^Mashinada",
    r"^Bichimi",
    r"^Buyurtma",
    r"^nasi -",
    r"^daxldor -",
    r"^mas'ul -",
    r"^abadiy-",
    r"^qoziq -",
    r"^taLmovsiramoq",
    r"^jez -",
    r"^tashbeh -",
    r"^tuynuk -",
    r"^irmoq -",
    r"^langar cho'p -",
    r"^Doston bu -",
    r"^Chevar$",
    r"^Qambar Ota$",
    r"^Paxtazorga",
    r"^Oqshom",
    r"^Boburjon",
    r"^Muhammad Bobur$",
    r"^Qutlug",
    r"^Zahiriddin",
    r"^G'iyos Kornilov$",
    r"^Sirli sandiq$",
    r"^Toshkent viloyati",
    r"^Zahiriddin Muhammad",
    r"^Abulqosim",
    r"^Abu Ali",
    r"^Ibn Sino",
    r"^Odamlarning botiri",
    r"^Haqiqatni ochinglar",
    r"^Ilm aql",
    r"^Kasb-hunarlarning",
    r"^Inson hayotda",
    r"^Harflarni kichrayib",
    r"^arChev",
    r"^Ona duosi",
    r"^• Qambar",
    r"^• lining",
    r"^Onajonim zardo'z",
    r"^0 ‘z hunarin",
    r"^Tikar qo'shib",
    r"^Zar iplari",
    r"^Yal-yal yonib",
    r"^Zardo'z chopon",
    r"^Ko'ylakcham",
    r"^Duo qilar",
    r"^Ko'ylakning",
    r"^Gul “ ekar",
    r"^Ipak ipdan",
    r"^Bir shaharda",
    r"^Bor ekan-da",
    r"^Mir kuni",
    r"^Assalomu",
    r"^Vaalaykum",
    r"^Unday bo'lsa",
    r"^Voy, do'stim",
    r"^Men bor ekanman",
    r"^Ikkovlari",
    r"^Kunlardan bir",
    r"^Bulut bobo",
    r"^Shamol bobo",
    r"^Kesakvoy",
    r"^Qog'ozvoy",
    r"^Dengiz bo'yida",
    r"^Bir kuni ular",
    r"^Ruben",
    r"^Josh",
    r"^Yangi uymi",
    r"^Rahmat, -",
    r"^Nima uchun Ruben",
    r"^Nima deb o'ylaysiz",
    r"^Nima uchun qiz",
    r"^Ikkita misol",
    r"^Siz marvarid",
    r"^Uni qayerlarda",
    r"^Zargarlar",
    r"^Quyidagi rasmlarni",
    r"^Kuz kelishi bilan Oyqor",
    r"^Rasmga e'tibor",
    r"^Mahalliy aholi musobaqa",
    r"^Mana, bir necha",
    r"^Bugun Karim",
    r"^Butun fikr",
    r"^Bakovul baland",
    r"^1\.$",
    r"^2\.$",
    r"^3\.$",
    r"^4\.$",
    r"^5\.$",
    r"^6\.$",
    r"^7\.$",
    r"^8\.$",
    r"^9\.$",
    r"^10\.$",
    r"^fo jr$",
    r"^davangirga",
    r"^Atrofida sheriklari",
    r"^Uch otliq",
    r"^raqibining",
    r"^Bir og'izdan",
    r"^Yomonlarning",
    r"^Hurmat, izzat",
    r"^Chin -  insonga",
    r"^Kimki bo'lsa",
    r"^Dushmandan",
    r"^Rost va yolg'on",
    r"^Nima uchun yolg'on",
    r"^Alisher Navoiyning",
    r"^“So'zda",
    r"^Rafiq degan",
    r"^Dadasi shunday",
    r"^“Hisobot”",
    r"^Buni eshitib",
    r"^Shundan keyin",
    r"^Maqolni davom",
    r"^Onaning ko'ngli",
    r"^Bolaning ko'ngli",
    r"^Maqolni o'qing",
    r"^M$",
    r"^Biz o'zbek yoshlari",
    r"^Millatning bir",
    r"^Mardona-mardona",
    r"^Ota-bobolardan",
    r"^Nomusi, vijdoni",
    r"^Ona 0 ‘zbekiston",
    r"^Abadiy porlasin",
    r"^\^ $",
    r"^-dars$",
    r"^4$",
    r"^5-dars$",
    r"^9-dars$",
    r"^17-mavzu$",
    r"^14-mavzu$",
    r"^11-mavzu$",
    r"^3-mavzu$",
    r"^4-mavzu$",
    r"^5-dars$",
    r"^8-dars$",
    r"^6-dars$",
    r"^7-mavzu$",
    r"^21-mavzu$",
    r"^5-dars\. Marvarid",
    r"^Boshida halqasi",
    r"^so'rasam, egasi",
]


def norm(s: str) -> str:
    s = s.lower().strip()
    for a, b in [("'", "'"), ("ʻ", "'"), ("ʼ", "'"), ("‘", "'"), ("'", "'"), ("—", "-"), ("–", "-")]:
        s = s.replace(a, b)
    return re.sub(r"\s+", " ", s)


def extract_all() -> str:
    parts = []
    for path in PDF_PATHS:
        doc = fitz.open(path)
        parts.append("\n".join(page.get_text() for page in doc))
        doc.close()
    return "\n".join(parts)


def is_stop(line: str) -> bool:
    s = line.strip()
    if not s:
        return False
    if len(s) <= 2 and not re.search(r"[a-zA-Zа-яА-Яўғқҳ]", s):
        return True
    for pat in STOP_PATTERNS:
        if re.match(pat, s, re.I):
            return True
    if re.match(r"^\d+\s*$", s):
        return True
    if re.match(r"^[A-ZА-ЯЎҒҚҲ]$", s):
        return True
    return False


def is_title_line(line: str, titles: list[str]) -> bool:
    s = norm(line)
    for t in titles:
        nt = norm(t)
        if s == nt or s.startswith(nt + " ") and len(line) < len(t) + 50:
            return True
    return False


def extract_work(text: str, work: dict) -> str | None:
    lines = text.split("\n")
    best = ""
    i = 0
    while i < len(lines):
        if is_title_line(lines[i], work["titles"]):
            # Skip title block: title, lesson, author bio until narrative starts
            j = i + 1
            body = []
            started = False
            while j < len(lines):
                line = lines[j]
                stripped = line.strip()
                # Another work title ends this section
                for other in WORK_PATTERNS:
                    if other["id"] != work["id"] and is_title_line(stripped, other["titles"]):
                        j = len(lines)
                        break
                else:
                    if is_stop(stripped):
                        if started and len(body) > 5:
                            break
                        j += 1
                        continue
                    if not started:
                        # narrative indicators
                        if len(stripped) > 30 or stripped.startswith("-") or stripped.startswith('"') or stripped.startswith("«"):
                            started = True
                        elif work["id"] == "chin-va-yolgon" and re.match(r"^(Bir|Chin|Yolg)", stripped):
                            started = True
                        elif work["id"] == "vatan-yoshlari" and stripped.startswith("Biz "):
                            started = True
                        elif work["id"] == "zardoz" and stripped.startswith("Onajonim"):
                            started = True
                        else:
                            j += 1
                            continue
                    if stripped:
                        body.append(stripped)
                    j += 1
            candidate = clean_body("\n\n".join(body))
            if len(candidate) > len(best):
                best = candidate
        i += 1
    return best if len(best) > 80 else None


def clean_body(text: str) -> str:
    text = re.sub(r"@ELEKTRON_DARSLIKBOT[^\n]*", "", text)
    text = re.sub(r"0 ['']?sha\b", "O'sha", text)
    text = re.sub(r"0 ['']?zi\b", "O'zi", text)
    text = re.sub(r"0 ['']?zbek\b", "O'zbek", text)
    text = re.sub(r"0 ['']?t\b", "O't", text)
    text = re.sub(r"0 ['']?qigan\b", "O'qigan", text)
    text = re.sub(r"q o ['']?y a d i", "qoyadi", text)
    text = re.sub(r"bo['']?lib", "bo'lib", text)
    text = re.sub(r"ko['']?r", "ko'r", text)
    text = re.sub(r"yo['']?l", "yo'l", text)
    text = re.sub(r"do['']?st", "do'st", text)
    text = re.sub(r"o['']?g['']?il", "o'g'il", text)
    text = re.sub(r"o['']?qituvchi", "o'qituvchi", text)
    text = re.sub(r"o['']?yin", "o'yin", text)
    text = re.sub(r"o['']?z", "o'z", text)
    text = re.sub(r"['']", "'", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    # merge broken dialogue lines
    lines = []
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            if lines and lines[-1] != "":
                lines.append("")
            continue
        if lines and lines[-1].endswith("-") and line[0].islower():
            lines[-1] = lines[-1][:-1] + line
        else:
            lines.append(line)
    return "\n".join(lines).strip()


def main():
    text = extract_all()
    out = Path(__file__).parent / "extracted"
    out.mkdir(exist_ok=True)
    results = {}
    for work in WORK_PATTERNS:
        ft = extract_work(text, work)
        if ft:
            results[work["id"]] = ft
            (out / f"{work['id']}.txt").write_text(ft, encoding="utf-8")
            print(f"OK {work['id']}: {len(ft)} chars")
        else:
            print(f"MISS {work['id']}")
    (out / "fulltexts.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
