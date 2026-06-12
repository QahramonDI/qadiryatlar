"""Finalize and clean extracted full texts."""
import json
import re
from pathlib import Path

EXTRACTED = Path(__file__).parent / "extracted"

# Hand-curated / cleaned from PDF extraction
FULLTEXTS = {
    "marvarid": """Dengiz bo'yida boy hamda kambag'al bolalar barchasi birgalikda o'ynashar edi.

Bir kuni ular suvga chuqurroq sho'ng'ish uchun dengizning o'rtarog'iga borishdi. "Men topgan narsaga qarang!" — deb baqirdi bir bola. "Bu marvarid, — dedi boshqasi, — u judayam chiroyli". Bolalar uni ko'rish uchun yig'ildilar. Ular marvaridning naqadar chiroyli va yorqinligini ko'rib, uni ushlab ko'rgilari kelardi. Ammo buni so'rashga hech kim jur'at eta olmadi...

"Uni olsam bo'ladimi? Ha, u chindan ham chiroyli ekan". Bu birinchi bo'lib gapirgan bola edi.

"Bu haqiqatdan ham Joshniki. U topdi", — dedi qizlardan biri.

"Ruben, marvaridni sen olaqol, — dedi Josh. — Chunki u senga judayam yoqib qoldi". O'sha kundan boshlab, bolalar Rubenni kamroq ko'radigan bo'lishdi. Ular tashqarida, toza havoda o'ynayotgan paytda Ruben ichkaridan chiqmay, marvaridlar haqida ma'lumotlar o'rganish bilan mashg'ul bo'lardi. U dengiz chig'anoqlari ichida marvaridlar qanday hosil bo'lishini bilib oldi. Oila a'zolari undan qanday sovg'a olishni orzu qilayotganini so'rashganida, u doim marvaridlari bo'lishini xohlashini aytardi. "Men katta bo'lsam, marvarid savdosi bilan shug'ullanuvchi tadbirkor bo'laman", — derdi u.

Kun kelib shunday bo'ldi ham. Ruben do'stlari bilan xayrlashib, bolaligi o'tgan uyini, dengiz yaqinidagi ona shahrini tark etib, marvarid savdolari bo'ladigan katta shaharlarga jo'nab ketdi. O'zidagi mayda marvaridlarni katta, bejirim marvaridga almashtirdi. Shundan so'ng u baliqchilar to'r tashlab ov qiladigan okean qirg'og'iga bordi va yangi marvaridlar topish maqsadida chig'anoqlar izlashga kirishdi. Nihoyat kattagina, dumaloq bir marvaridni topib oldi.

Ruben dengizning eng sara marvaridlar topish mumkin bo'lgan yerlarigacha sayohat qildi, u yerlarda suvning tubi ko'pincha kumush va pushti rangda tovlanib turardi. Vaqtlar o'tib, u badavlat odamga aylandi. Undan marvarid xarid qilish uchun dunyoning turli tomonlaridan savdogarlar tashrif buyurishardi.

Biroq Ruben boyib ketgan bo'lsa ham, baxtli emasdi. U borgan sari o'z bolaligi o'tgan dengiz bo'yidagi shaharchani ko'p eslab, sog'ina boshladi. Ayniqsa, birinchi topgan marvaridini unga hadya qilib yuborgan eski do'sti Josh naqadar saxiy bo'lganini qayta-qayta yodga olardi.

Kunlarning birida: "Ruben! — degan ovoz eshitildi. — Seni ko'rganimdan xursandman!" U dengiz sohilida farzandlari bilan birga o'ynab yurgan Josh edi. Ruben do'stini uchratganidan juda baxtiyor bo'ldi, oradan ko'p yillar o'tgan, uzoq yillar ko'rishmagan bo'lsalar ham, u Josh bilan soatlab suhbatlashib o'tirdi.

"Men yetarlicha dunyo kezdim, yetarlicha boylik orttirdim, — dedi Ruben. — Endi faqat o'zim tug'ilib-o'sgan qadrdon go'shamga qaytib, o'sha yerda tinch-sokin hayot kechirishni istayman. Bir zamonlar menga qilgan saxiyliging evaziga men ham senga bir hadya qilsam deyman. Ayt, nima istaysan? Yangi uymi yoki hashamatli katta kemami?"

"Rahmat, — dedi Josh, — ammo menga oddiy hayotim yoqadi, menga yangi uy ham, katta kema ham kerak emas. Menimcha, biz qila oladigan eng yaxshi ish — bu boyligimizni boshqalar bilan baham ko'rib yashash. Shundagina hammamiz o'z hayotimizdan mamnun, baxtli yashashimiz mumkin".

Ruben Josh undan hech narsa so'ramaganidan avvaliga hayron qoldi, keyin esa o'zi shuncha boylik orttirgani bilan baxt topa olmagani esiga tushdi-yu, jilmayib qo'ydi. "Haqsan! Biz sen aytgan ishni, albatta, qilamiz", — deb javob qildi u.""",

    "temir-qoziq": """Boshida halqasi ham, hatto uzilib qolgan bir-ikki qarich arqoni ham bor. O'rtoqlarimdan "Kimning qozig'i?" — deb so'rasam, egasi chiqmadi. Sevinib ketdim. Sigirimni yangi qoziqqa bog'lab qo'ydim. Endiyam sug'urib ko'rsin-chi!

O'sha kuni emas-ku, ertasiga g'alati ish bo'ldi. Kechasi endi uxlagan ekanman, oyim: "Adang chaqiryaptilar, turarkansan", — deb qoldi. Hayron bo'lib ayvonga chiqsam, otam qovog'ini uyib o'tiribdi. Qo'lida o'sha temir qoziq.

— Qayoqdan olding buni? — dedi tahdid bilan.

Otamdan qattiq hayiqardik. Qo'rqib ketdim.

— Topib oldim.

— Qayerdan?

— Jiydazordan.

— Qaysi jiydaning tagidan?

— Qiyshiq jiydaning.

— Jiydaning to'g'risi bo'lmaydi. Qaysi birining tagidan? Ko'rsang, taniysanmi o'sha jiydani?

— Taniyman, — dedim qo'rqa-pisa.

Otam qo'limga qoziqni tutqazdi.

— Xuddi o'sha jiydaning tagiga tashlab kelasan.

Yuragim orqamga tortib ketdi. Jiydazorda ajina borligi esimga tushib, talmovsirab qoldim. Ayvon burchagida turgan oyim yalindi:

— Tashlab keladi, adasi, tong otsin, albatta, tashlab keladi.

— Sen aralashma! — dedi otam e'tirozga o'rin qoldirmaydigan ohangda.

Uyg'onib, ichkaridan chiqqan akam hammasini tushundi, shekilli, nimchasini kiya boshlagan edi, otam jerkib berdi:

— Sen qayoqqa?

— Birga borib kelamiz.

— Yo'q! — dedi otam shiddat bilan. — O'zi topganmi, o'zi oborib qoyadi.

Kuz. Salqin tushib qolgan. G'ira-shira ko'roydin... Qo'limda muzdek temir qoziq bilan yo'lga tushdim. Jiydazor-ku, uzoq emas. Ammo unga yetguncha Darxon arig'i ustidagi ko'hna ko'prikdan o'tish kerak. Odam yolg'iz qolsa, kunduzi ham qo'rqadigan qing'ir-qiyshiq jiyda chakalakzori orasiga kirish kerak. Aksiga olib yaramas qoziqni Qonqus anhori bo'yidagi daraxt tagidan topganman...

Salqin havodanmi, qo'rquvdanmi oyog'im qaltirab ko'prikdan o'tdim. G'ira-shira ko'roydinda sirli sukunat cho'kkan jiydazorga kirdim. Nazarimda, har bir daraxt orqasida nimadir berkinib turgandek edi. Qayerdadir boyqush "huv-huv"ladi... Rostini aytsam, Qonqus bo'yigacha bormadim. Qo'limdagi qoziqni kuchim boricha uloqtirib, orqaga qarab yugurdim.

Oyim bilan akam ko'chaga chiqib kutib turishgan ekan...

Labimga uchuq toshib, bir-ikki kun achishib yurganini hisobga olmaganda, hech nima bo'lmadi... faqat oradan bir oycha o'tgach, otam shu masalaga qaytib, bir gap aytdi:

— Sen topib olgan qoziqqa bog'langan sigir arqonini uzib, adashib ketgan bo'lsa, yoki birov o'g'irlagan bo'lsa-da, qoziq sening uyingdan chiqsa, egasi seni o'g'ri gumon qilsa, nima bo'ladi?""",

    "vatan-yoshlari": """Biz o'zbek yoshlari, Vatan yoshlari,
Vatan taqdiriga taqdirdosh nasi.
Millatning bir jon-u bir tan yoshlari,
Buyuk kelajakka daxldor, mas'ul!

Mardona-mardona tashlaylik qadam,
Ozod yurt, obod yurt bo'lsin mukarram!
Ota-bobolardan jasorat meros,
Barhayot shonlari, ular kimniki?
Nomusi, vijdoni, e'tiqod-ixlos,
Barchasi bizniki, barchamizniki!

Mardona-mardona tashlaylik qadam,
Ozod yurt, obod yurt bo'lsin mukarram!

Ona O'zbekiston yo'li porloq, oq,
O, uning ertasi o'zimizdadir.
Abadiy porlasin muqaddas bayroq,
El-yurtga qo'limiz ko'ksimizdadir!

Mardona-mardona tashlaylik qadam,
Ozod yurt, obod yurt bo'lsin mukarram!""",

    "chin-va-yolgon": """Bir og'izdan chiqsa ham ikkov,
Chinga Yolg'on bo'lar edi g'ov.
Yolg'on goho og'iz to'ldirib,
Va'da berar rosa ko'pirib.
Sirim aslo ochilmasin deb,
Yurar Yolg'on ich-etini yeb.
Shu sababdan egri yo'l chizar,
Anqov bilan laqmani izlar.
Yomonlarning ko'nglin chog' etar,
Yaxshilarni yo'ldan chalg'itar.
Hurmat, izzat topganidan Chin,
Yurar edi misoli lochin.
Chin — quyoshning nuriga o'xshar,
Uning bilan hamma yoq yashnar.
Chin — insonga suv va havodir,
Har narsaga doimo qodir.
Kimki bo'lsa, Chinga hamroh, do'st,
Unda bo'lmas sira kam-u ko'st.
Dushmandan ham battardir Yolg'on,
Unga dildan bermangiz makon.""",

    "ona-qarzi": """Rafiq degan bola bo'lgan ekan. Bir kuni u dadasining nimalardir yozayotganini ko'rib, qiziqib so'rabdi:

— Dada, nima qilyapsiz? Hadeb nimalarni yozyapsiz?

Dadasi shunday javob beribdi:

— Hisobotlarni to'ldiryapman, o'g'lim.

Rafiq hali kichkina bo'lgani uchun "Hisobot" so'zini tushunmas ekan.

— "Hisobot" nima degani, dada? — deb so'rabdi u.

— Hisobotmi? — debdi dadasi o'g'liga qarab. — Buning ma'nosi shuki, men davlat ishini qilaman, qilgan ishim uchun davlat menga pul to'laydi. Lekin men qanday ishlar qilganimni, kimlarga qanday ishlar qildirganimni davlat qayerdan biladi? Shuning uchun men falon-falon ishlar bajarildi, shu ishlar uchun menga falon rupiya miqdorida pul to'lanishi kerak, deb qog'oz to'ldiraman. Ana shu qog'oz "Hisobot" deyiladi.

Buni eshitib, Rafiqning dilidan shunday o'ylar kechibdi: "Dadam qilgan ishlari uchun davlatdan pul olar ekanlar, demak, men ham uyda qilgan ishlarim uchun oyimdan pul olishim kerak. Axir, ba'zida oyim kechalari ham ish buyurgan paytlari bo'lgan-ku?"

Shundan keyin Rafiq bir varaq qog'oz bilan ruchka olibdi-da, o'zicha shunday deb yozibdi:

"Oyimning Rafiqdan qarzi:
Oyim Rafiqdan quyida keltirilgan miqdorda pul qarz bo'lib, uni to'lab qo'yishi lozim:
Bir oyda ukamni ovqatlantirganim haqi — 1 rupiya 00 paysa,
Bir oyda do'kondan narsa xarid qilib kelganim haqi — 1 rupiya 00 paysa,
Bir oyda non keltirib berganim haqi — 0 rupiya 80 paysa,
Hammasi bo'lib, 2 rupiya 80 paysa bo'ladi".

Rafiq "Hisobot"ni oyisi qand-shakar saqlaydigan javon ichiga tashlab qo'yibdi. Ertasiga kelib o'sha joyni qarasa, pul yotibdi! Rafiq shosha-pisha pulni olibdi-da, sanab ko'ribdi. Roppa-rosa ikki rupiya sakson paysa. U o'zida yo'q suyunibdi. Suyunmay bo'ladimi? Bu yoqdan "Hisobot" yozdi, bu yoqdan mehnat haqi oldi. Lekin pul bilan birga oyisi bir qog'oz ham qo'ygan ekan. Rafiq qog'ozni olib undagi yozuvni o'qiy boshlabdi:

"Rafiqning oyisidan qarzi:
Rafiq oyisidan quyidagi miqdorda qarzdor bo'lib, qarzini tezda to'lashi kerak:
On ikki yilgacha uni tarbiya qilish haqi — 0 rupiya 00 paysa,
On ikki yilgacha uni boqib, qomini to'yg'izish haqi — 0 rupiya 00 paysa,
On ikki yilgacha unga kiyimlar, sut, qatiq va boshqa mayda-chuydalar olib berish haqi — 0 rupiya 00 paysa,
Hammasi bo'lib, 0 rupiya 00 paysa".

Rafiq hang-u mang bo'lib qolibdi. U yugurib borib, o'zini oyisining oyog'iga tashlab:

— Oyijon! Meni kechiring, ahmoqlik qilibman. Xato qilibman! — debdi yig'lamoqdan beri bo'lib. — O'ylab qarasam, bir zamonda bajargan xizmatimni ham minnat qilibman. Lekin siz ko'zimni ochdingiz, bo'ynimdagi sizning qarzingizni umr bo'yi ham to'lay olmayman. Uncha-muncha qilgan ishlarim esa, bu qarzning mingdan biriga ham arzimaydi.

Soddadil o'g'lining og'zidan bu gaplarni eshitib, onasi dil-dilidan suyunibdi va o'g'liga shunday debdi:

— O'g'lim, halol bo'l. Insofli bo'l, hech kimga yomonlik qilma. Rostgo'y bo'l. Birovlarning dilini og'ritguvchi dilozor bo'lma. Mening sendan tilagim shu.

Rafiq: "Aytgan gapingizdan chiqmayman, siz o'ylaganday odam bo'lishga harakat qilaman", — deb oyisiga so'z beribdi.""",

    "zardoz": """Onajonim zardo'z chevar,
O'z hunarin jondan sevar.
Tikar qo'shib mehr qo'rin,
Quyosh boqar sochib zarin.
Zar iplari kumush, tilla,
Mohir qolda kirar tilga.
Yal-yal yonib, tillolanib,
Ko'z o'ynatar jilolanib.

Zardo'z chopon, zardo'z do'ppi,
Ikki yuzi shirmoy lo'ppi.
Qizlar kelar gul-gul yonib,
Tovus misol zar tovlanib.
Ko'ylakcham ham zar yoqali,
Zar do'ppim ham zar uqali.
Duo qilar ustoz — onam,
Zarga to'lsin zarrin olam.""",

    "karim-polvon": """Kuz kelishi bilan Oyqor tog'i etagidan to qishloqlarning qir-adirlarigacha qiyg'os gullarga burkanib, chamanzorga aylanadi. Ekinzor va bog'lar yanada yashnab ko'zni quvontiradi. Bu paytda qishloqlarda turli tantana, marosim va to'y-hashamlar bir-biriga ulanib ketadi. Odamlarning xursandchiligi va shod-xurramligining chek-chegarasi yo'q. Sayhonlikda xalqimizning iftixori bo'lgan milliy o'yinlar hamda uloq-ko'pkari bahslariga hozirlik ko'rila boshlanadi.

Mahalliy aholi musobaqa oldidan bu yerga sekin-asta ko'chib kela boshlaydi. Ko'pchilikning nigohi otlarga qaratilgan. Otlar orasida yulduzni ko'zlovchi to'riq, buyruq, qamishquloq, oqqoptol, chavkar kabi zotdor otlar ham bor. Murosasiz bahslarda ularning qaysilari katta sovrinlarga ega bo'lisharkin? Qaysi suvoriyga omad kulib boqarkin?

Mana, bir necha kundirki, Karim polvon jilvalarga boy jiyron qashqasini mehr bilan yuvib-tarab, parvarishlaydi. Uloq-ko'pkari bahslarida qatnashish uchun yolga yangi taqa ham qoqtirib chiqqan.

Bugun Karim polvon uchun o'zgacha kun. Butun fikr-u xayoli jiyron qashqasida. G'alabaning yuki og'ir bo'ladi. U bir piyola choy ichar-ichmas o'rnidan qo'zg'aldi. Egar-jabduqlarini ko'zdan kechirib, maydon tomon ot soldi. U ot ustida ortiqcha kuch ishlatmas, o'zini erkin tutar, nigohi to'radagi otlarga qaratilgandi.

Karim polvon uloq olib kelayotgan shopmo'ylov davangirga ro'para keldi. Uning uloqni mahkam tutib kelayotgani ko'rinib turardi. Atrofida sheriklari ham bor. Uch otliq bir yon bo'ldi, Karim polvon bir tomon. Shunda polvon raqibining dimog'i balandligiga parvo qilmay, uloqning oldingi oyoqlaridan siqib ushlab, baravar ot choptirib ketaverdi. U yo'l-yo'lakay uloqni tortib olgach, taqimiga yaxshilab bosdi-da, arg'umog'ini shartta yon tomonga burdi. Raqibning oti o'z zalvari bilan oldinga o'tib ketdi. Polvon tezroq to'radan chiqishga intilardi.

Bakovul baland ovoz bilan: "Chavandozlarning ustozi Karim polvon g'olib bo'ldi", deya e'lon qilganda, shu yerda hozir bo'lganlar uning sha'niga tahsinlar o'qishdi.""",
}


def js_string(s: str) -> str:
    """Format as JS template literal friendly string with + concatenation for textbook-data.js style."""
    parts = s.split("\n\n")
    lines = []
    for i, p in enumerate(parts):
        escaped = p.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
        chunk = f'      "{escaped}"'
        if i < len(parts) - 1:
            chunk += ' +'
        lines.append(chunk)
    return "\n".join(lines)


def main():
    EXTRACTED.mkdir(exist_ok=True)
    (EXTRACTED / "fulltexts.json").write_text(
        json.dumps(FULLTEXTS, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    for wid, text in FULLTEXTS.items():
        (EXTRACTED / f"{wid}.txt").write_text(text, encoding="utf-8")
        print(f"{wid}: {len(text)} chars")


if __name__ == "__main__":
    main()
