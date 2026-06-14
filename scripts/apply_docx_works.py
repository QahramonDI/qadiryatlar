"""Update static textbook works from a DOCX source file.

The site keeps base textbook metadata in js/textbook-data.js and the long
reading texts in js/work-fulltexts.js. This script only rewrites those static
works; admin/Supabase works are untouched.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
DATA_JS = ROOT / "js" / "textbook-data.js"
FULLTEXTS_JS = ROOT / "js" / "work-fulltexts.js"

DEFAULT_DOCX = Path(
    "/Users/qahramonjonabdullayev/Library/Containers/ru.keepcoder.Telegram/Data/tmp/Новый документ (13).docx"
)

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

VALUE_OVERRIDES = {
    1: ("vatanparvarlik", ["vatanparvarlik", "masuliyat"]),
    2: ("vatanparvarlik", ["vatanparvarlik", "masuliyat"]),
    3: ("dustlik", ["dustlik", "mehribonlik"]),
    4: ("mehnatsevarlik", ["mehnatsevarlik"]),
    5: ("dustlik", ["dustlik", "saxovat"]),
    6: ("masuliyat", ["masuliyat", "vatanparvarlik"]),
    7: ("vatanparvarlik", ["vatanparvarlik", "masuliyat"]),
    8: ("masuliyat", ["masuliyat", "vatanparvarlik"]),
    9: ("ota-onaga-hurmat", ["ota-onaga-hurmat", "masuliyat"]),
    10: ("ota-onaga-hurmat", ["ota-onaga-hurmat", "mehribonlik"]),
    11: ("ota-onaga-hurmat", ["ota-onaga-hurmat", "mehribonlik"]),
    12: ("halollik", ["halollik", "adolat"]),
    13: ("halollik", ["halollik", "masuliyat"]),
    14: ("mehribonlik", ["mehribonlik", "saxovat"]),
    15: ("masuliyat", ["masuliyat", "mehnatsevarlik"]),
    16: ("vatanparvarlik", ["vatanparvarlik", "dustlik", "masuliyat"]),
    17: ("vatanparvarlik", ["vatanparvarlik"]),
    18: ("vatanparvarlik", ["vatanparvarlik", "mehribonlik"]),
    19: ("vatanparvarlik", ["vatanparvarlik", "masuliyat"]),
    20: ("vatanparvarlik", ["vatanparvarlik", "masuliyat"]),
}

MORAL_OVERRIDES = {
    1: "Vatan muhabbati qalbdagi eng muqaddas tuyg'ulardan biridir.",
    2: "Mardlik va mahorat milliy g'urur bilan uyg'un bo'lsa, inson hurmat topadi.",
    3: "Haqiqiy do'st kuchini yordam va kamtarlik bilan ko'rsatadi.",
    4: "Har bir mehnat quroli halol mehnatga xizmat qilganda qadrlidir.",
    5: "Saxovatli do'stlar bor joyda yo'llar ham, ko'ngillar ham ochiladi.",
    6: "Tabiatni asrash insonning mas'uliyati va kelajak oldidagi burchidir.",
    7: "Ona yurt tabiati va Orol dardi har birimizni befarq qoldirmasligi kerak.",
    8: "Ilmga intilish va ustozga hurmat buyuklikka eltadi.",
    9: "Farzand tarbiyasini vaqtida mehr va talabchanlik bilan boshlash kerak.",
    10: "Keksalarni hurmat qilish, duosini olish katta fazilatdir.",
    11: "Onaning mehrini hech qanday xizmat yoki pul bilan o'lchab bo'lmaydi.",
    12: "Halollik qo'rquvdan emas, ichki e'tiqoddan boshlanadi.",
    13: "To'g'rilik va odob kichik ishda ham insonni ulug'laydi.",
    14: "Mehr-oqibat urug'i avvalo inson qalbiga ekiladi.",
    15: "Kitob bilim, kuch va yorug' kelajak manbaidir.",
    16: "Kitobni do'st bilgan inson o'zligini, tilini va Vatanini qadrlaydi.",
    17: "Yurt go'zalligini sevish Vatanga mehrni kuchaytiradi.",
    18: "Vatan yagona va bebaho, uni sevish inson qalbini yuksaltiradi.",
    19: "Buyuk bobolar merosi bilim, mehnat va Vatanga xizmatga chorlaydi.",
    20: "Vatanparvarlik shior emas, yurt tinchligi uchun mas'uliyatdir.",
}


@dataclass
class Work:
    num: int
    title: str
    meta: str
    body: list[str]


def paragraph_text(paragraph: ET.Element, ns_uri: str) -> str:
    parts: list[str] = []
    for node in paragraph.iter():
        if node.tag == f"{{{ns_uri}}}t":
            parts.append(node.text or "")
        elif node.tag == f"{{{ns_uri}}}br":
            parts.append("\n")
    text = "".join(parts)
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    return text.strip()


def read_docx_paragraphs(path: Path) -> list[str]:
    ns_uri = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    with ZipFile(path) as docx:
        root = ET.fromstring(docx.read("word/document.xml"))
    return [paragraph_text(p, ns_uri) for p in root.findall(f".//{{{ns_uri}}}body/{{{ns_uri}}}p")]


def parse_works(paragraphs: list[str]) -> list[Work]:
    works: list[Work] = []
    current: Work | None = None
    header_re = re.compile(r"^(\d+)\.\s+(.+)$")

    for paragraph in paragraphs:
        match = header_re.match(paragraph)
        if match:
            if current:
                works.append(current)
            current = Work(num=int(match.group(1)), title=match.group(2).strip(), meta="", body=[])
            continue
        if not current or not paragraph:
            continue
        if not current.meta and ("Janr:" in paragraph or "Muallif:" in paragraph or "Sinf:" in paragraph):
            current.meta = paragraph.strip()
        else:
            current.body.append(paragraph.strip())

    if current:
        works.append(current)
    return works


def parse_meta(meta: str) -> dict[str, str | int]:
    out: dict[str, str | int] = {"author": "Darslik", "genre": "matn", "grade": 3}
    author = re.search(r"Muallif:\s*([^|]+)", meta)
    if author:
        out["author"] = author.group(1).strip()
    genre = re.search(r"Janr:\s*([^|]+)", meta)
    if genre:
        raw = re.sub(r"\s*\([^)]*\)", "", genre.group(1).strip()).lower()
        raw = raw.replace("she’r", "she'r").replace("sheʼr", "she'r")
        out["genre"] = raw.split()[0] if raw else "matn"
    grade = re.search(r"Sinf:\s*(\d+)-sinf", meta)
    if grade:
        out["grade"] = int(grade.group(1))
    return out


def full_text(work: Work) -> str:
    return "\n\n".join(p for p in (p.strip() for p in work.body) if p)


def summary_from_text(text: str, max_len: int = 260) -> str:
    compact = re.sub(r"\s+", " ", text).strip()
    if len(compact) <= max_len:
        return compact
    return compact[: max_len - 1].rsplit(" ", 1)[0] + "…"


def keywords_from_title(title: str) -> list[str]:
    stop = {"va", "nima", "deydi", "sening", "kim", "munosib", "bir", "butun", "o'n", "ikki"}
    words = re.findall(r"[A-Za-zÀ-žА-Яа-яЁёʻ‘’'-]+", title.lower())
    keywords: list[str] = []
    for word in words:
        word = word.strip("'-‘’")
        if len(word) > 2 and word not in stop and word not in keywords:
            keywords.append(word)
    return keywords[:4] or [title.split()[0].lower()]


def js_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def replace_string_prop(block: str, key: str, value: str) -> str:
    return re.sub(rf'{key}: "[^"]*"', f"{key}: {js_string(value)}", block, count=1)


def replace_number_prop(block: str, key: str, value: int) -> str:
    return re.sub(rf"{key}: \d+", f"{key}: {value}", block, count=1)


def replace_array_prop(block: str, key: str, value: list[str]) -> str:
    return re.sub(rf"{key}: \[[^\]]*\]", f"{key}: {json.dumps(value, ensure_ascii=False)}", block, count=1)


def replace_multiline_summary(block: str, value: str) -> str:
    return re.sub(r"summary:\s*[\s\S]*?\n    moral:", f"summary:\n      {js_string(value)},\n    moral:", block, count=1)


def find_work_block(source: str, work_id: str) -> tuple[int, int]:
    id_pos = source.find(f'id: "{work_id}"')
    if id_pos < 0:
        raise ValueError(f"Work id not found: {work_id}")
    start = source.rfind("  {", 0, id_pos)
    end_marker = "\n  },"
    end = source.find(end_marker, id_pos)
    if start < 0 or end < 0:
        raise ValueError(f"Could not locate full object for {work_id}")
    return start, end + len(end_marker)


def patch_textbook_data(source: str, works_by_num: dict[int, Work]) -> str:
    for work_id, num in SITE_TO_DOCX.items():
        work = works_by_num[num]
        meta = parse_meta(work.meta)
        value_main, values = VALUE_OVERRIDES[num]
        text = full_text(work)

        start, end = find_work_block(source, work_id)
        block = source[start:end]
        block = replace_string_prop(block, "title", work.title)
        block = replace_string_prop(block, "author", str(meta["author"]))
        block = replace_number_prop(block, "grade", int(meta["grade"]))
        block = replace_string_prop(block, "genre", str(meta["genre"]))
        block = replace_string_prop(block, "valueMain", value_main)
        block = replace_array_prop(block, "values", values)
        block = replace_multiline_summary(block, summary_from_text(text))
        block = replace_string_prop(block, "moral", MORAL_OVERRIDES[num])
        block = re.sub(r'\n    fullText:[\s\S]*?(?=\n    questions:)', '\n    fullText: "",', block, count=1)
        block = replace_array_prop(block, "keywords", keywords_from_title(work.title))
        source = source[:start] + block + source[end:]
    return source


def build_fulltexts_js(works_by_num: dict[int, Work]) -> str:
    lines = [
        "/* To'liq asar matnlari — DOCX darslik matniga mos */",
        "const WORK_FULLTEXTS = {",
    ]
    for index, (work_id, num) in enumerate(SITE_TO_DOCX.items()):
        comma = "," if index < len(SITE_TO_DOCX) - 1 else ""
        lines.append(f'  "{work_id}": {js_string(full_text(works_by_num[num]))}{comma}')
    lines.append("};")
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--docx", type=Path, default=DEFAULT_DOCX)
    args = parser.parse_args()

    paragraphs = read_docx_paragraphs(args.docx)
    works = parse_works(paragraphs)
    works_by_num = {work.num: work for work in works}
    missing = sorted(set(SITE_TO_DOCX.values()) - set(works_by_num))
    if missing:
        raise SystemExit(f"DOCX ichida topilmagan asarlar: {missing}")

    FULLTEXTS_JS.write_text(build_fulltexts_js(works_by_num), encoding="utf-8")
    DATA_JS.write_text(patch_textbook_data(DATA_JS.read_text(encoding="utf-8"), works_by_num), encoding="utf-8")
    print(f"Updated {len(SITE_TO_DOCX)} static works from {args.docx}")


if __name__ == "__main__":
    main()
