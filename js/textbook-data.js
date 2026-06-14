/* =====================================================================
   textbook-data.js
   "Qadriyatlar Kaledaskopi" — badiiy asarlar ma'lumotlar bazasi
   3–4-sinf "O'qish savodxonligi" darsliklari asosida.
   Har bir asar obyekti:
     id          - noyob identifikator
     title       - asar sarlavhasi
     author      - muallif
     grade       - sinf (3 yoki 4)
     genre       - janr (she'r / hikoya / ertak / matn / masal)
     part        - darslik qismi (1 yoki 2)
     valueMain   - asosiy qadriyat (qiymat id)
     values      - barcha tegishli qadriyatlar (id massivi)
     summary     - qisqacha mazmun
     moral       - asardan olinadigan saboq
     fullText    - darslikdan olingan to'liq matn (ixtiyoriy)
     questions   - darslik savollari (matn massivi)
     tests       - ko'p tanlovli testlar [{q, options[], correct}]
     crossword   - krossvord lug'ati [{word, clue}]
     illustration- {emoji, gradient} yoki {img}
     keywords    - kalit so'zlar massivi
   ===================================================================== */

const TEXTBOOK_WORKS = [
  {
    id: "marvarid",
    title: "Yagonadir Vataning sening!",
    author: "Xurshid Davron",
    grade: 4,
    genre: "matn",
    part: 1,
    valueMain: "vatanparvarlik",
    values: ["vatanparvarlik", "mehribonlik"],
    summary:
      "Vatan o‘zi nima? Donishmandlardan biri: “Vatan — bu sening kindik qoning tomgan tuproq”, — desa, ikkinchisi: “Vatan — bu sen suygan odamlar manzili!” — deydi. Boshqasi: “Vatan — millat xotirasi”, — deb zavqlanadi. Biz Vatan kalimasiga ne-ne so‘zlarni…",
    moral: "Vatan yagona va bebaho, uni sevish inson qalbini yuksaltiradi.",
    fullText: "",
    questions: [
      "Donishmandlar Vatanni qanday tushuntirishadi?",
      "Fransiyadagi daraxt voqeasi nima haqida?",
      "Vatan nima uchun yagona?",
      "Vatan tuyg'usi qanday sirli aloqa?",
    ],
    tests: [
      {
        q: "Asar muallifi kim?",
        options: ["Xurshid Davron", "Boltaboy Eshmurotov", "Pirmat Shermuhammedov", "Rauf Tolib"],
        correct: 0,
      },
      {
        q: "Vatan nima deb aytilgan?",
        options: ["Kindik qon tomgan tuproq", "Faqat shahar", "Faqat kitob", "Faqat pul"],
        correct: 0,
      },
      {
        q: "Daraxtlar nega qurib qoldi?",
        options: ["Vatan tuyg'usiz ekilgan", "Suv ko'p", "Shamol", "Yomg'ir"],
        correct: 0,
      },
      {
        q: "Daraxt qayerdan olib kelingan?",
        options: ["Amerikadan", "Fransiyadan", "Hindistondan", "Xitoydan"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["4-sinf", "3-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Vatan muhabbati", "Yolg'on", "Hasad", "Dangasalik"],
        correct: 0,
      },
      {
        q: "Vatan qanday?",
        options: ["Yagona va muqaddas", "Ko'p", "Keraksiz", "Arzon"],
        correct: 0,
      },
      {
        q: "Asar qaysi janrga kiradi?",
        options: ["Matn", "She'r", "Ertak", "Masal"],
        correct: 0,
      },
      {
        q: "Vatan muhabbati nimaga qo'shiladi?",
        options: ["Ota-ona va do'stlarga mehr", "Hasad", "Yolg'on", "Qo'rquv"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["Vatan yagona va mukarram", "Vatan muhim emas", "Chet el yaxshi", "Daraxt ekmaslik kerak"],
        correct: 0,
      },
    ],
    crossword: [],
    illustration: { emoji: "🦪", gradient: "linear-gradient(135deg,#7fb2d6,#2e6f9e)" },
    keywords: ["yagonadir", "vataning"],
  },
  {
    id: "temir-qoziq",
    title: "Vatan madhi dillarda",
    author: "Darslik",
    grade: 3,
    genre: "matn",
    part: 1,
    valueMain: "vatanparvarlik",
    values: ["vatanparvarlik", "masuliyat"],
    summary:
      "Vatan! Bu so‘z bizning qalbimizga ona allasidan, uning qaynoq muhabbatidan singadi. Agar ma’lum bir muddat o‘z uyimizdan sal olisroqda yashab qolsak, ko‘nglimiz g‘ash bo‘laveradi. Har qanday ko‘ngilochar narsalar ham bizni quvontira olmaydi. Negaki, biz o‘z…",
    moral: "Vatan muhabbati qalbdagi eng muqaddas tuyg'ulardan biridir.",
    fullText: "",
    questions: [
      "Vatanni sevish qanday ko'rinishlarda namoyon bo'ladi?",
      "Matnda qaysi tuyg'ular haqida gapiriladi?",
      "Nega uzoqda yashab qolganimizda Vatanni sog'inamiz?",
      "O'zbekiston haqida matnda nimalar aytilgan?",
    ],
    tests: [
      {
        q: "Matn qaysi qadriyat haqida?",
        options: ["Vatanparvarlik", "Yolg'on", "Hasad", "Dangasalik"],
        correct: 0,
      },
      {
        q: "Vatanga muhabbat nimadan boshlanadi?",
        options: ["Ona allasidan singadi", "Pul topishdan", "Sayohatdan", "O'yindan"],
        correct: 0,
      },
      {
        q: "Matn qaysi sinf darsligiga tegishli?",
        options: ["3-sinf", "4-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "Ulg'ayganimiz sari qanday tuyg'ular uyg'onadi?",
        options: ["Vatanga muhabbat, ota-onaga hurmat", "Faqat o'yin", "Hasad", "Yolg'on"],
        correct: 0,
      },
      {
        q: "Matn janri nima?",
        options: ["Matn", "She'r", "Ertak", "Masal"],
        correct: 0,
      },
      {
        q: "O'zbekiston qanday o'lkalar?",
        options: ["Serquyosh, bog'lari jannat shivirlaydigan", "Faqat cho'l", "Faqat tog'", "Dengiz oroli"],
        correct: 0,
      },
      {
        q: "Buyuk bobolarimiz haqida nima deyiladi?",
        options: ["Faxrlanamiz va munosib avlod bo'lamiz", "Unutamiz", "Yolg'on gapiramiz", "Qo'rqamiz"],
        correct: 0,
      },
      {
        q: "Vatanni ardoqlash nima degani?",
        options: ["Muqaddas bilish", "E'tiborsiz qoldirish", "Tark etish", "Haqorat qilish"],
        correct: 0,
      },
      {
        q: "Tuyg'ularning asosi nima?",
        options: ["Muhabbat", "Yolg'on", "Hasad", "Qo'rquv"],
        correct: 0,
      },
      {
        q: "Matn saboqi nima?",
        options: ["Vatanni sevish haqiqiy inson fazilati", "Vatandan qochish kerak", "Uzoqda yashash yaxshi", "O'yin muhim"],
        correct: 0,
      },
    ],
    crossword: [
      { word: "OZBEKISTON", clue: "Bizning ona yurtimiz nomi?", displayAnswer: "O‘zbekiston" },
      { word: "VATAN", clue: "Inson tug‘ilib o‘sgan muqaddas joy nima?", displayAnswer: "Vatan" },
      { word: "MUHABBAT", clue: "Vatanga muhabbatning asosi bo‘lgan tuyg‘u?", displayAnswer: "Muhabbat" },
      { word: "OZBEKISTON", clue: "Buyuk alloma va olimlar yetishib chiqqan yurt?", displayAnswer: "O‘zbekiston" },
      { word: "VATANPARVAR", clue: "Vatanni sevuvchi inson qanday ataladi?", displayAnswer: "Vatanparvar" },
    ],
    illustration: { emoji: "⭐", gradient: "linear-gradient(135deg,#3a4a7a,#1a2347)" },
    keywords: ["vatan", "madhi", "dillarda"],
  },
  {
    id: "vatan-yoshlari",
    title: "Yurt madhi",
    author: "Dilshod Rajab",
    grade: 3,
    genre: "she'r",
    part: 1,
    valueMain: "vatanparvarlik",
    values: ["vatanparvarlik"],
    summary:
      "Yurtimizni aylandik, Maqtovga so‘z sayladik: Toshkent asli bosh shahar, Bag‘ri nur-quyosh shahar. Sirdaryo — gulistonim, Jizzax — bog‘-u bo‘stonim. Maydonlarda mard kelgan Qashqadaryo, Surxonim. Samarqanddan aytaymi, Yer yuzining sayqali. G‘urur qo‘shar…",
    moral: "Yurt go'zalligini sevish Vatanga mehrni kuchaytiradi.",
    fullText: "",
    questions: [
      "She'rda qaysi viloyatlar tilga olinadi?",
      "Toshkent qanday tasvirlanadi?",
      "Temur bobom haykali qayerda?",
      "She'rning umumiy g'oyasi nima?",
    ],
    tests: [
      {
        q: "She'r muallifi kim?",
        options: ["Dilshod Rajab", "Zafar Diyor", "Abdulla Oripov", "Mirtemir"],
        correct: 0,
      },
      {
        q: "Bosh shahar qaysi?",
        options: ["Toshkent", "Samarqand", "Buxoro", "Andijon"],
        correct: 0,
      },
      {
        q: "Temur bobom haykali qayerda?",
        options: ["Samarqand", "Toshkent", "Buxoro", "Xorazm"],
        correct: 0,
      },
      {
        q: "Ilm uyi qaysi shahar?",
        options: ["Buxoro", "Toshkent", "Namangan", "Jizzax"],
        correct: 0,
      },
      {
        q: "Asar qaysi janrga kiradi?",
        options: ["She'r", "Hikoya", "Ertak", "Matn"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Vatanparvarlik", "Yolg'on", "Hasad", "Dangasalik"],
        correct: 0,
      },
      {
        q: "She'r oxirida qaysi so'z takrorlanadi?",
        options: ["O'zbekistonim", "Toshkent", "Samarqand", "Buxoro"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["3-sinf", "4-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "Qoraqalpoq qanday tasvirlanadi?",
        options: ["Qoshi qora, qalbi oq", "Yolg'on", "Dangasa", "Qo'rqoq"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["Yurtimizni sevish va maqtash", "Chet el yaxshi", "Viloyatlar muhim emas", "Tarixni unutish"],
        correct: 0,
      },
    ],
    crossword: [],
    illustration: { emoji: "🇺🇿", gradient: "linear-gradient(135deg,#1aa3d6,#0b6b3a)" },
    keywords: ["yurt", "madhi"],
  },
  {
    id: "chin-va-yolgon",
    title: "Chin do‘st",
    author: "Nasiba Erxonova",
    grade: 3,
    genre: "hikoya",
    part: 2,
    valueMain: "dustlik",
    values: ["dustlik", "mehribonlik"],
    summary:
      "Qadim zamonda emas, biz yashab turgan kunlarning birida o‘zimizning mamlakatda ishlab chiqarilgan mashinalar har tomondan yo‘lga tushishibdi. Yurtning turli chetlaridan manzil tomon oshiqayotgan mashinalari taqdir taqozosi bilan bir yo‘lda uchrashib,…",
    moral: "Haqiqiy do'st kuchini yordam va kamtarlik bilan ko'rsatadi.",
    fullText: "",
    questions: [
      "Uch ulov nima haqida bahslashdi?",
      "Kamtar ulov qanday yordam berdi?",
      "Asarning asosiy saboqi nima?",
      "Nega katta ulov oxirida pushaymon bo'ldi?",
    ],
    tests: [
      {
        q: "Asarda nechta mashina uchrashadi?",
        options: ["Uchta", "Ikkita", "To'rtta", "Bitta"],
        correct: 0,
      },
      {
        q: "Eng kamtar ulov nima qildi?",
        options: ["Yoqilg'i va suv berdi", "Faqat maqtandi", "Ketib qoldi", "Janjal qildi"],
        correct: 0,
      },
      {
        q: "Asar muallifi kim?",
        options: ["Nasiba Erxonova", "Abdulla Saidov", "Jo'ra Rahim", "Xurshid Davron"],
        correct: 0,
      },
      {
        q: "Katta ulov nima deb maqtangan?",
        options: ["Eng kuchli ekanman", "Kamtar ekanman", "Chiroyli emasman", "Yordam bermayman"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Do'stlik va kamtarlik", "Mag'rurlik", "Yolg'on", "Hasad"],
        correct: 0,
      },
      {
        q: "Uchinchi ulov nima degan?",
        options: ["Kimning qanaqaligini vaqt ko'rsatadi", "Men eng kuchliman", "Ketaman", "Yomonman"],
        correct: 0,
      },
      {
        q: "Katta ulov oxirida nima dedi?",
        options: ["Eng kuchli, kamtar va mehribon sensan", "Men yaxshiman", "Ket", "Yomon"],
        correct: 0,
      },
      {
        q: "Asar qaysi janrga kiradi?",
        options: ["Hikoya", "She'r", "Ertak", "Matn"],
        correct: 0,
      },
      {
        q: "Bejirim ulov nima qildi?",
        options: ["Yuzini yuvib chiroyini tikladi", "Buzildi", "Ketdi", "Yig'ladi"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["Haqiqiy kuch kamtarlik va yordamda", "Mag'rurlik yaxshi", "Yolg'on kerak", "Yordam bermaslik"],
        correct: 0,
      },
    ],
    crossword: [
      { word: "MEHRIBON", clue: "Mashinalarga yordam bergan ulov qanday fazilatli edi?", displayAnswer: "Mehribon" },
      { word: "DOSTLIK", clue: "Asarning asosiy qadriyati?", displayAnswer: "Do‘stlik" },
      { word: "KIBR", clue: "Katta ulovning yomon odati?", displayAnswer: "Kibr" },
      { word: "SAXOVAT", clue: "Yordam berish orqali namoyon bo‘ladigan fazilat?", displayAnswer: "Saxovat" },
      { word: "KAMTARLIK", clue: "Chin do‘stning muhim sifati?", displayAnswer: "Kamtarlik" },
    ],
    illustration: { emoji: "⚖️", gradient: "linear-gradient(135deg,#e6b04a,#c26b1a)" },
    keywords: ["chin", "do‘st"],
  },
  {
    id: "ona-qarzi",
    title: "Ona qarzi",
    author: "Darslik",
    grade: 3,
    genre: "ertak",
    part: 1,
    valueMain: "ota-onaga-hurmat",
    values: ["ota-onaga-hurmat", "mehribonlik"],
    summary:
      "Rafiq degan bola bo‘lgan ekan. Bir kuni u dadasining nimalardir yozayotganini ko‘rib, qiziqib so‘rabdi: — Dada, nima qilyapsiz? Hadeb nimalarni yozyapsiz? Dadasi shunday javob beribdi: — Hisobotlarni to‘ldiryapman, o‘g‘lim. Rafiq hali kichkina bo‘lgani uchun…",
    moral: "Onaning mehrini hech qanday xizmat yoki pul bilan o'lchab bo'lmaydi.",
    fullText: "",
    questions: [
      "Rafiq nima uchun hisobot yozdi?",
      "Ona qanday javob qog'oz qoldirdi?",
      "Rafiq nima tushundi?",
      "Ona o'g'liga qanday nasihat berdi?",
    ],
    tests: [
      {
        q: "Rafiq qanday bola?",
        options: ["Rafiq", "Karim", "Tohir", "Muhammad"],
        correct: 0,
      },
      {
        q: "Rafiq nima yozdi?",
        options: ["Oyidan pul so'ragan hisobot", "She'r", "Xat", "Ertak"],
        correct: 0,
      },
      {
        q: "Ona qarzini qancha deb yozdi?",
        options: ["0 rupiya 00 paysa", "2 rupiya 80 paysa", "10 rupiya", "100 rupiya"],
        correct: 0,
      },
      {
        q: "Rafiq qancha pul topdi?",
        options: ["2 rupiya 80 paysa", "0 paysa", "5 rupiya", "1 rupiya"],
        correct: 0,
      },
      {
        q: "Asar qaysi janrga kiradi?",
        options: ["Ertak", "She'r", "Matn", "Masal"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Onalik va mehr", "Pul", "Yolg'on", "Hasad"],
        correct: 0,
      },
      {
        q: "Rafiq oxirida nima qildi?",
        options: ["Onaning oyog'iga tashlandi va kechirim so'radi", "Ketdi", "Yig'lamadi", "Pul oldi"],
        correct: 0,
      },
      {
        q: "Ona nima tiladi?",
        options: ["Halol, insofli, rostgo'y bo'lsin", "Boy bo'lsin", "Ko'p pul top", "O'ynasin"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["3-sinf", "4-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["Ona mehrini hech narsa bilan o'lchab bo'lmaydi", "Pul olish kerak", "Hisobot yomon", "Ona qarzdor"],
        correct: 0,
      },
    ],
    crossword: [],
    illustration: { emoji: "💗", gradient: "linear-gradient(135deg,#e87fa0,#c2456b)" },
    keywords: ["ona", "qarzi"],
  },
  {
    id: "zardoz",
    title: "Orolim",
    author: "Rauf Tolib",
    grade: 3,
    genre: "she'r",
    part: 2,
    valueMain: "vatanparvarlik",
    values: ["vatanparvarlik", "masuliyat"],
    summary:
      "— Ey bolajon, bolajon, Qanday o‘ylar dilingda? O‘ltiribsan parishon, Bahor yashnar elingda. — Mehmon g‘ozlarim, ko‘ring, Tabiat topdi zavol. Suvsiz qolib daryolar, Qurib bormoqda Orol. — Ey, bolajon, bolajon, Qo‘y, o‘rtanma alamda. Biz-la yurt kez, Yo‘llar…",
    moral: "Ona yurt tabiati va Orol dardi har birimizni befarq qoldirmasligi kerak.",
    fullText: "",
    questions: [
      "She'rda bola nima haqida xavotir bildiradi?",
      "Orol haqida nima deyiladi?",
      "Katta odam bolaga nima maslahat beradi?",
      "Tabiatni asrash haqida qanday fikr bildiriladi?",
    ],
    tests: [
      {
        q: "She'r muallifi kim?",
        options: ["Rauf Tolib", "Dilshod Rajab", "Nabijon Ermat", "Xurshid Davron"],
        correct: 0,
      },
      {
        q: "Bola nima haqida xavotirlanadi?",
        options: ["Orol suvssiz qolmoqda", "Maktab", "O'yin", "Non"],
        correct: 0,
      },
      {
        q: "Asar qaysi janrga kiradi?",
        options: ["She'r", "Hikoya", "Ertak", "Matn"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Vatan va tabiat", "Yolg'on", "Hasad", "Dangasalik"],
        correct: 0,
      },
      {
        q: "Bola Orolni qanday ataydi?",
        options: ["Ona Orol bittadir", "Keraksiz", "Katta dengiz", "Chet el"],
        correct: 0,
      },
      {
        q: "Daryolar nima bo'lmoqda?",
        options: ["Qurib bormoqda", "Ko'paymoqda", "Rang o'zgarmoqda", "Suzmoqda"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["3-sinf", "4-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "Katta odam bolani nima deb chaqiradi?",
        options: ["Bolajon", "Do'stim", "Ustoz", "Bola"],
        correct: 0,
      },
      {
        q: "She'r qaysi mavzuda?",
        options: ["Orol va tabiat muammosi", "O'yin", "Maktab", "Bayram"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["Vatan tabiatini asrash kerak", "Suv keraksiz", "Xavotirlanmaslik kerak", "O'ynash muhim"],
        correct: 0,
      },
    ],
    crossword: [
      { word: "OROL", clue: "Qurib borayotgan dengiz?", displayAnswer: "Orol" },
      { word: "GOZLAR", clue: "She’r qahramonlari bo‘lgan qushlar?", displayAnswer: "G‘ozlar" },
      { word: "OZBEKISTON", clue: "Orol joylashgan yurt?", displayAnswer: "O‘zbekiston" },
      { word: "TABIAT", clue: "Asarning asosiy mavzusi?", displayAnswer: "Tabiat" },
      { word: "DENGIZ", clue: "Orolning avvalgi holati?", displayAnswer: "Dengiz" },
    ],
    illustration: { emoji: "👃", gradient: "linear-gradient(135deg,#8ecae6,#219ebc)" },
    keywords: ["orolim"],
  },
  {
    id: "karim-polvon",
    title: "Karim polvon",
    author: "Abdulla Saidov",
    grade: 3,
    genre: "hikoya",
    part: 1,
    valueMain: "vatanparvarlik",
    values: ["vatanparvarlik", "masuliyat"],
    summary:
      "Kuz kelishi bilan Oyqor tog‘i etagidan to qishloqlarning qir-adirlarigacha qiyg‘os gullarga burkanib, chamanzorga aylanadi. Ekinzor va bog‘lar yanada yashnab ko‘zni quvontiradi. Bu paytda qishloqlarda turli tantana, marosim va to‘y-hashamlar bir-biriga…",
    moral: "Mardlik va mahorat milliy g'urur bilan uyg'un bo'lsa, inson hurmat topadi.",
    fullText: "",
    questions: [
      "Karim polvon o'z otini qanday parvarish qiladi?",
      "Uloq-ko'pkari bahsida nima sodir bo'ldi?",
      "Haqiqiy polvonlik qanday fazilatlarda namoyon bo'ladi?",
      "Milliy o'yinlar nima uchun muhim?",
    ],
    tests: [
      {
        q: "Karim qaysi milliy o'yin bilan shug'ullanadi?",
        options: ["Uloq-ko'pkari", "Shaxmat", "Futbol", "Suzish"],
        correct: 0,
      },
      {
        q: "Karim qanday ot bilan mashg'ul?",
        options: ["Jiyron qashqa", "Eshak", "Tuy", "Sigir"],
        correct: 0,
      },
      {
        q: "Asar muallifi kim?",
        options: ["Abdulla Saidov", "Mirtemir", "Nasiba Erxonova", "Dilshod Rajab"],
        correct: 0,
      },
      {
        q: "Karim polvon qanday g'olib bo'ldi?",
        options: ["Uloqni siqib ushlab, ot choptirib", "Yugurib", "Yolg'on gapirgan", "Raqibni urgan"],
        correct: 0,
      },
      {
        q: "Qaysi tog' etagida voqea bo'ladi?",
        options: ["Oyqor tog'i", "Tog'chok", "Alp", "Ural"],
        correct: 0,
      },
      {
        q: "Bakovul nima e'lon qildi?",
        options: ["Karim polvon g'olib bo'ldi", "Yomg'ir yog'di", "Musobaqa bekor", "Raqib yutdi"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["3-sinf", "4-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Mardlik va milliy sport", "Yolg'on", "Hasad", "Dangasalik"],
        correct: 0,
      },
      {
        q: "Karim polvon nima qildi?",
        options: ["Otni yuvib-tarab parvarishladi", "Uy qurdi", "Kitob sotdi", "Baliq tutdi"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["Mehnat va mardlik hurmatga sazovor", "Dangasalik yaxshi", "Raqibni kamsitish kerak", "O'tni e'tiborsiz qoldirish"],
        correct: 0,
      },
    ],
    crossword: [
      { word: "KARIM", clue: "Asardagi bosh qahramon kim?", displayAnswer: "Karim" },
      { word: "JIYRONQASHQA", clue: "Karim polvonning oti qanday edi?", displayAnswer: "Jiyronqashqa" },
      { word: "KOPKARI", clue: "Milliy sport turi?", displayAnswer: "Ko‘pkari" },
      { word: "POLVON", clue: "Musobaqada g‘olib bo‘lgan kim?", displayAnswer: "Polvon" },
      { word: "CHAVANDOZ", clue: "Ot ustidagi sportchi nima deyiladi?", displayAnswer: "Chavandoz" },
    ],
    illustration: { emoji: "🐎", gradient: "linear-gradient(135deg,#4a9e5c,#1f6b3a)" },
    keywords: ["karim", "polvon"],
  },
  {
    id: "dustlik-kemasi",
    title: "Do‘stlik yo‘lagi",
    author: "Darslik",
    grade: 3,
    genre: "hikoya",
    part: 2,
    valueMain: "dustlik",
    values: ["dustlik", "saxovat"],
    summary:
      "Bir shaharda ikki qo‘shni yashar ekan. Qish kelib, qalin qor yog‘a boshlabdi. Qo‘shnilardan biri erta turib, darvozasi oldidagi qorni kurab, katta yo‘l tomonga yo‘lak ochibdi. Ishini tugatib qarasa, qo‘shnisi darvozasi oldidan yo‘lak ochib bo‘lgan ekan.…",
    moral: "Saxovatli do'stlar bor joyda yo'llar ham, ko'ngillar ham ochiladi.",
    fullText: "",
    questions: [
      "Ikki qo'shni nima uchun kurashdi?",
      "Yo'lak qanday ochiladi?",
      "Qo''shni oxirida nima javob berdi?",
      "Asar qanday saboq beradi?",
    ],
    tests: [
      {
        q: "Ikki qo'shni nima qilish uchun kurashdi?",
        options: ["Birinchi bo'lib yo'lak ochish", "Uy qurish", "Sayohat", "O'yin"],
        correct: 0,
      },
      {
        q: "Birinchi qo'shni nima qildi?",
        options: ["Qorni kurab yo'lak ochdi", "Uxlab qoldi", "Ketdi", "Yig'ladi"],
        correct: 0,
      },
      {
        q: "Ikkinchi qo'shni qorni kuradimi?",
        options: ["Yo'q, do'stlar kelib-ketadi", "Ha, har kuni", "Ba'zan", "Hech qachon ochilmaydi"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Do'stlik va saxovatlilik", "Hasad", "Yolg'on", "Mag'rurlik"],
        correct: 0,
      },
      {
        q: "Qishda nima bo'ladi?",
        options: ["Qalin qor yog'adi", "Issiq", "Yomg'ir", "Shamol yo'q"],
        correct: 0,
      },
      {
        q: "Birinchi qo'shni nima deb o'yladi?",
        options: ["Ertaga ertaroq chiqaman", "Hech narsa qilmayman", "Ketaman", "Yig'layman"],
        correct: 0,
      },
      {
        q: "Asar qaysi janrga kiradi?",
        options: ["Hikoya (rivoyat)", "She'r", "Ertak", "Matn"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["3-sinf", "4-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "Yo'lak qayerga ochiladi?",
        options: ["Katta yo'l tomonga", "Uy ichiga", "Bog'ga", "Daryoga"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["Do'stlik saxovat bilan namoyon bo'ladi", "Mag'rurlik yaxshi", "Yolg'on kerak", "Yakka yurish kerak"],
        correct: 0,
      },
    ],
    crossword: [
      { word: "QOR", clue: "Yo‘lak nimadan ochilgan edi?", displayAnswer: "Qor" },
      { word: "DOSTLIK", clue: "Asardagi asosiy qadriyat?", displayAnswer: "Do‘stlik" },
      { word: "DOSTLAR", clue: "Qo‘shnining yo‘lagini kimlar ochib ketardi?", displayAnswer: "Do‘stlar" },
      { word: "QOR", clue: "Qish faslining belgisi?", displayAnswer: "Qor" },
      { word: "DOSTLAR", clue: "Yaxshi insonning ko‘p bo‘ladigan yaqinlari?", displayAnswer: "Do‘stlar" },
    ],
    illustration: { emoji: "⛵", gradient: "linear-gradient(135deg,#39b3c6,#1a6f8e)" },
    keywords: ["do‘stlik", "yo‘lagi"],
  },
  {
    id: "saxiy-dehqon",
    title: "Tabiat zanjiri",
    author: "Darslik",
    grade: 3,
    genre: "rivoyat",
    part: 1,
    valueMain: "masuliyat",
    values: ["masuliyat", "vatanparvarlik"],
    summary:
      "Tog‘larning qor va muz bilan qoplangan bag‘rida kunlardan bir kuni irmoq tug‘ildi. Tug‘ildi-yu, jildirab pastga intildi. Yo‘lda o‘ziga o‘xshagan tiniq irmoqchalarni uchratib, ular bilan birlashib daryo hosil qildi. Daryo borgan sari kuch olib, yo‘lida…",
    moral: "Tabiatni asrash insonning mas'uliyati va kelajak oldidagi burchidir.",
    fullText: "",
    questions: [
      "Daryo qanday paydo bo'ldi va kuch oldi?",
      "Odamlar daryoni qanday ifloslantirdi?",
      "Daryo nima uchun to'xtab qoldi?",
      "Bolalar va yo'lovchi nima qildi?",
    ],
    tests: [
      {
        q: "Daryo qayerda tug'ildi?",
        options: ["Tog' bag'ridan", "Shahardan", "Dengizdan", "Cho'ldan"],
        correct: 0,
      },
      {
        q: "Daryo nima uchun kasal bo'ldi?",
        options: ["Chiqindilar va zahar", "Sovuq", "Qurg'oqchilik", "Bo'ri"],
        correct: 0,
      },
      {
        q: "Kim daryoni tozaladi?",
        options: ["Bolalar va yo'lovchi", "Faqat politsiya", "Hech kim", "Savdogarlar"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Tabiatni asrash", "Ifloslantirish", "Yolg'on", "Hasad"],
        correct: 0,
      },
      {
        q: "Daryo birinchi kimga mehr his qildi?",
        options: ["Insonga", "Bo'riga", "Qushga", "Baliqqa"],
        correct: 0,
      },
      {
        q: "Shahardan keyin daryo qayerga oqdi?",
        options: ["O'rmon tomonga", "Tog'ga", "Dengizga", "Cho'lga"],
        correct: 0,
      },
      {
        q: "Asar qaysi janrga kiradi?",
        options: ["Rivoyat", "She'r", "Ertak", "Masal"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["3-sinf", "4-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "Daryo nima uchun yana yashashga intildi?",
        options: ["Odamlar yordam berdi", "Hech narsa bo'lmadi", "Qochdi", "O'ldi"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["Tabiatni asrash va tozalash kerak", "Ifloslantirish mumkin", "Daryo keraksiz", "Yordam bermaslik"],
        correct: 0,
      },
    ],
    crossword: [
      { word: "IRMOQ", clue: "Tog‘dan oqib tushadigan suv?", displayAnswer: "Irmoq" },
      { word: "DARYO", clue: "Irmoqlar birlashib nimani hosil qiladi?", displayAnswer: "Daryo" },
      { word: "CHIQINDI", clue: "Daryoni ifloslantirgan narsalar?", displayAnswer: "Chiqindi" },
      { word: "TABIAT", clue: "Asarning asosiy mavzusi?", displayAnswer: "Tabiat" },
      { word: "BOLALAR", clue: "Daryoni tozalaganlar kimlar?", displayAnswer: "Bolalar" },
    ],
    illustration: { emoji: "🌾", gradient: "linear-gradient(135deg,#e0c044,#b8860b)" },
    keywords: ["tabiat", "zanjiri"],
  },
  {
    id: "adolatli-qozi",
    title: "Merosga kim munosib?",
    author: "Darslik",
    grade: 3,
    genre: "rivoyat",
    part: 2,
    valueMain: "halollik",
    values: ["halollik", "adolat"],
    summary:
      "Qadim zamonlarda mo‘ysafid bo‘lib qolgan badavlat otalardan biri voyaga yetgan besh o‘g‘lini yoniga o‘tqizib, o‘g‘rilik, poraxo‘rlik, kishi haqiga xiyonat, tuhmat qilish gunoh ekanini tushuntirib, bunga amal qilmaganlar jazoga tortilishi va merosdan mahrum…",
    moral: "Halollik qo'rquvdan emas, ichki e'tiqoddan boshlanadi.",
    fullText: "",
    questions: [
      "Ota o'g'illari halolligini qanday sinadi?",
      "Kenja o'g'il hamyonni ko'rganda nima qildi?",
      "Ota katta o'g'ilga nima javob berdi?",
      "Haqiqiy halollik nimadan farq qiladi?",
    ],
    tests: [
      {
        q: "Ota nechta o'g'li bor?",
        options: ["Besh", "Uch", "Ikki", "To'rt"],
        correct: 0,
      },
      {
        q: "Ota nima tashlab qo'ydi?",
        options: ["Oltin solingan hamyonlar", "Kitoblar", "Non", "Gul"],
        correct: 0,
      },
      {
        q: "Kenja o'g'il nima qildi?",
        options: ["Hamyonni olib, yo'qotgan odam izlab, faqirga xayr qildi", "Yashirdi", "O'g'irladi", "Ketdi"],
        correct: 0,
      },
      {
        q: "Meros kimga berildi?",
        options: ["Kenja o'g'ilga", "Katta o'g'ilga", "Hech kimga", "Hammasiga"],
        correct: 0,
      },
      {
        q: "Katta o'g'il nima qilgan?",
        options: ["Ko'rdi, lekin olmadi", "Oldi", "Yashirdi", "Sotdi"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Halollik va axloq", "Yolg'on", "Hasad", "Ochko'zlik"],
        correct: 0,
      },
      {
        q: "Ota katta o'g'ilning pokligini qanday baholadi?",
        options: ["Qo'rqishdan, haqiqiy halollikdan emas", "Haqiqiy halollik", "Yaxshi", "Dono"],
        correct: 0,
      },
      {
        q: "Asar qaysi janrga kiradi?",
        options: ["Rivoyat", "She'r", "Ertak", "Matn"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["3-sinf", "4-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["Haqiqiy halollik ichki e'tiqoddan keladi", "Qo'rqish yaxshi", "Oltin olish kerak", "Yashirish kerak"],
        correct: 0,
      },
    ],
    crossword: [],
    illustration: { emoji: "⚖️", gradient: "linear-gradient(135deg,#9e7bd6,#5a3a9e)" },
    keywords: ["merosga"],
  },
  {
    id: "boburning-bolaligi",
    title: "Sohibqiron bobom mening",
    author: "Miltiqboy Xonnazarov",
    grade: 4,
    genre: "she'r",
    part: 1,
    valueMain: "vatanparvarlik",
    values: ["vatanparvarlik", "masuliyat"],
    summary:
      "Bobolarim daho bo‘lgan Ko‘hna ona zaminda, Ishi bilan dong taratgan Poyonsiz keng jahonda. Dono bo‘lib bobolarim Fan beshigin tebratgan. Yana biri olim bo‘lib, Osmon sirin o‘rgatgan. Bitta bobom asos solgan Algoritm faniga. Tabib bobom g‘ishtin qo‘ygan…",
    moral: "Buyuk bobolar merosi bilim, mehnat va Vatanga xizmatga chorlaydi.",
    fullText: "",
    questions: [
      "She'rda qanday bobolar tilga olinadi?",
      "Sohibqiron bobom kim?",
      "Temur bobom qanday ishlar qilgan?",
      "She'r yoshlarni nima qilishga chaqiradi?",
    ],
    tests: [
      {
        q: "She'r muallifi kim?",
        options: ["Miltiqboy Xonnazarov", "Dilshod Rajab", "Xurshid Davron", "Nabijon Ermat"],
        correct: 0,
      },
      {
        q: "Sohibqiron bobom kim?",
        options: ["Amir Temur", "Bobur", "Beruniy", "Navoiy"],
        correct: 0,
      },
      {
        q: "Temur nima qilgan?",
        options: ["El-u yurtga bosh bo'lgan, qo'shnilarni ozod qilgan", "Faqat o'ynagan", "Ketgan", "Uxlagan"],
        correct: 0,
      },
      {
        q: "«Kuch — adolatda» degan kim?",
        options: ["Temur bobom", "Rafiq", "Tohir", "Karim"],
        correct: 0,
      },
      {
        q: "Asar qaysi janrga kiradi?",
        options: ["She'r", "Hikoya", "Ertak", "Matn"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Tarix va bobolar merosi", "Yolg'on", "Hasad", "Dangasalik"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["4-sinf", "3-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "Bobolar qanday?",
        options: ["Daho va dono", "Dangasa", "Yolg'onchi", "Qo'rqoq"],
        correct: 0,
      },
      {
        q: "Yoshlar nima qilishga chaqiriladi?",
        options: ["O'qish, mehnat, Vatan sha'ni uchun xizmat", "Dam olish", "Uxlash", "Ketish"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["Bobolar merosiga munosib bo'lish", "Tarixni unutish", "O'yin muhim", "Mehnat keraksiz"],
        correct: 0,
      },
    ],
    crossword: [],
    illustration: { emoji: "📜", gradient: "linear-gradient(135deg,#c9a04a,#7b3f00)" },
    keywords: ["sohibqiron", "bobom", "mening"],
  },
  {
    id: "mehribon-qiz",
    title: "Keksalarni hurmat qil",
    author: "Miltiqboy Xonnazarov",
    grade: 3,
    genre: "she'r",
    part: 1,
    valueMain: "ota-onaga-hurmat",
    values: ["ota-onaga-hurmat", "mehribonlik"],
    summary:
      "Keksa kishilarni, bolam, hurmat qil, Ularni jon bolam, farishta deb bil. Duosi ularning tuganmas boylik, Senga so‘rab turar bir umr sog‘liq. Ko‘rganda ularning qo‘lini olgin, Ko‘nglini ko‘tarib, ahvolin so‘rgin. Ularni taklif qilgin uyning to‘rigiga, Choy…",
    moral: "Keksalarni hurmat qilish, duosini olish katta fazilatdir.",
    fullText: "",
    questions: [
      "She'rda keksalarga qanday munosabat bildiriladi?",
      "Keksa kishilarning duosi nima?",
      "Boladan nima qilish so'raladi?",
      "Nasihat va tinglash nima uchun muhim?",
    ],
    tests: [
      {
        q: "She'r muallifi kim?",
        options: ["Miltiqboy Xonnazarov", "Dilshod Rajab", "Zamira Ro'ziyeva", "Nasiba Erxonova"],
        correct: 0,
      },
      {
        q: "Keksa kishilarni nima deb bilish kerak?",
        options: ["Farishta", "Do'st", "Raqib", "Begona"],
        correct: 0,
      },
      {
        q: "Keksa kishilarning duosi nima?",
        options: ["Tuganmas boylik", "Pul", "Uy", "Kitob"],
        correct: 0,
      },
      {
        q: "Ko'rganda nima qilish kerak?",
        options: ["Qo'lini olish va ahvolini so'rash", "Ketish", "Jim turish", "Yugurish"],
        correct: 0,
      },
      {
        q: "Asar qaysi janrga kiradi?",
        options: ["She'r", "Hikoya", "Ertak", "Matn"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Keksalarni hurmat", "Yolg'on", "Hasad", "Dangasalik"],
        correct: 0,
      },
      {
        q: "Keksa kishilarni qayerga taklif qilish kerak?",
        options: ["Uyning to'rigiga", "Hovliga", "Ko'chaga", "Bozorga"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["3-sinf", "4-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "Nasihatni nima qilish kerak?",
        options: ["Tinglab, aytganini qilish", "Unutish", "Kulish", "Rad etish"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["Keksalarni hurmat qilish fazilat", "Yoshlar muhimroq", "Duoni e'tiborsiz qoldirish", "Choy bermaslik"],
        correct: 0,
      },
    ],
    crossword: [
      { word: "KEKSALAR", clue: "Hurmat qilinadigan insonlar?", displayAnswer: "Keksalar" },
      { word: "DUO", clue: "Keksalarning ezgu tilagi?", displayAnswer: "Duo" },
      { word: "NUR", clue: "Ularning yuzidan yog‘iladigan narsa?", displayAnswer: "Nur" },
      { word: "HURMAT", clue: "Keksalarga ko‘rsatiladigan fazilat?", displayAnswer: "Hurmat" },
      { word: "KEKSA", clue: "Nasihat beruvchi inson?", displayAnswer: "Keksa" },
    ],
    illustration: { emoji: "🫖", gradient: "linear-gradient(135deg,#e89a7f,#c2562a)" },
    keywords: ["keksalarni", "hurmat", "qil"],
  },
  {
    id: "halol-savdogar",
    title: "Abu Rayhon Beruniy",
    author: "Pirmat Shermuhammedov",
    grade: 3,
    genre: "hikoya",
    part: 2,
    valueMain: "masuliyat",
    values: ["masuliyat", "vatanparvarlik"],
    summary:
      "Abu Rayhon Beruniy Xorazmning qadimiy poytaxti Kot (Kat) shahrida tug‘ilgan. Yoshligidanoq ilm-fanga juda qiziqqan. Ayniqsa, matematika, astronomiya, geografiya va tabiiyot fanlariga doir ko‘p risolalarni o‘qib o‘rgangan. Shu bilan birga qadimgi xorazm…",
    moral: "Ilmga intilish va ustozga hurmat buyuklikka eltadi.",
    fullText: "",
    questions: [
      "Abu Rayhon Beruniy qayerda tug'ilgan?",
      "Muhammad bolasi qanday qiziqish bildirdi?",
      "Usturlob nima uchun ishlatiladi?",
      "Abu Nasr bolaga qanday shart qo'ydi?",
    ],
    tests: [
      {
        q: "Beruniy qayerda tug'ilgan?",
        options: ["Kot (Kat) shahri", "Toshkent", "Samarqand", "Buxoro"],
        correct: 0,
      },
      {
        q: "Asar muallifi kim?",
        options: ["Pirmat Shermuhammedov", "Abdulla Saidov", "Jo'ra Rahim", "Boltaboy Eshmurotov"],
        correct: 0,
      },
      {
        q: "Muhammad bolasi qanday ism?",
        options: ["Muhammad", "Ahmad", "Karim", "Temur"],
        correct: 0,
      },
      {
        q: "Abu Nasr qanday asbob ishlatadi?",
        options: ["Usturlob", "Tarozi", "Bolg'a", "Kitob"],
        correct: 0,
      },
      {
        q: "Usturlob nima uchun?",
        options: ["Quyosh va yulduz harakatini kuzatish", "Non kesish", "Yer haydash", "Suv olish"],
        correct: 0,
      },
      {
        q: "Beruniy qaysi fanlarga qiziqgan?",
        options: ["Matematika, astronomiya, geografiya", "Faqat she'r", "Faqat sport", "Faqat savdo"],
        correct: 0,
      },
      {
        q: "Abu Nasr bolaga nima va'da qildi?",
        options: ["O'rgataman", "Ket", "Yolg'on", "Pul beraman"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["3-sinf", "4-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Ilm va tarix", "Yolg'on", "Hasad", "Dangasalik"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["Ilm olish va bilim izlash ulug' ish", "O'yin yaxshi", "Uxlash kerak", "Yulduzlardan qo'rqish"],
        correct: 0,
      },
    ],
    crossword: [
      { word: "BERUNIY", clue: "Buyuk allomaning ismi?", displayAnswer: "Beruniy" },
      { word: "ASTRONOMIYA", clue: "U qiziqqan fanlardan biri?", displayAnswer: "Astronomiya" },
      { word: "USTURLOB", clue: "Yulduzlarni kuzatish uchun ishlatilgan asbob?", displayAnswer: "Usturlob" },
      { word: "XORAZM", clue: "Beruniy tug‘ilgan hudud?", displayAnswer: "Xorazm" },
      { word: "OLIM", clue: "Ilmli inson nima deyiladi?", displayAnswer: "Olim" },
    ],
    illustration: { emoji: "⚖️", gradient: "linear-gradient(135deg,#d99a3a,#a35c12)" },
    keywords: ["abu", "rayhon", "beruniy"],
  },
  {
    id: "mehnat-bahosi",
    title: "Mehnat qurollari nima deydi?",
    author: "Ne’mat Dushayev",
    grade: 3,
    genre: "she'r",
    part: 2,
    valueMain: "mehnatsevarlik",
    values: ["mehnatsevarlik"],
    summary:
      "Bolg‘a Dangasa demang meni, Men har ishda chaqqonman. Bultur bir qop yong‘oqni Bitta o‘zim chaqqanman. Bir qop yong‘oqqa, ehhe, Qancha odam to‘yrnoqda. Mix deysizmi, bolg‘avoy O‘zi qoqib qo‘ymoqda. Ombur Xato qilsa bolg‘avoy, Darrovda tuzataman. Qiyshiq…",
    moral: "Har bir mehnat quroli halol mehnatga xizmat qilganda qadrlidir.",
    fullText: "",
    questions: [
      "She'rda qaysi mehnat qurollari gapiradi?",
      "Bolg'a o'zini qanday ta'riflaydi?",
      "Mehnat qurollari nima o'rgatadi?",
      "Arra nima haqida ogohlantiradi?",
    ],
    tests: [
      {
        q: "She'r muallifi kim?",
        options: ["Ne'mat Dushayev", "Nabijon Ermat", "Dilshod Rajab", "Miltiqboy Xonnazarov"],
        correct: 0,
      },
      {
        q: "Bolg'a nima qilgan?",
        options: ["Bir qop yong'oqni chaqqan", "Uxlagan", "O'ynagan", "Yig'ladi"],
        correct: 0,
      },
      {
        q: "Ombur nima qiladi?",
        options: ["Qiyshiq mixni tuzatadi", "Ovqat pishiradi", "Kitob o'qiydi", "Sayohat qiladi"],
        correct: 0,
      },
      {
        q: "Pansha nima ish biladi?",
        options: ["Xashak yig'ish va sabzi qazish", "Baliq tutish", "Ot minish", "She'r yozish"],
        correct: 0,
      },
      {
        q: "Arra nima qiladi?",
        options: ["Daraxt va taxtani arralaydi", "Suv oladi", "Non pishiradi", "Gul ekadi"],
        correct: 0,
      },
      {
        q: "Asar qaysi janrga kiradi?",
        options: ["She'r", "Hikoya", "Ertak", "Matn"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Mehnatsevarlik", "Dangasalik", "Yolg'on", "Hasad"],
        correct: 0,
      },
      {
        q: "Bolg'a o'ziga nima deyishini xohlamaydi?",
        options: ["Dangasa", "Mehnatkash", "Chaqqon", "Kuchli"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["3-sinf", "4-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "She'r saboqi nima?",
        options: ["Har bir mehnat qimmatli va foydali", "Ish qilmaslik kerak", "Faqat o'ynash", "Qurol yomon"],
        correct: 0,
      },
    ],
    crossword: [
      { word: "BOLGA", clue: "Yong‘oq chaqqan asbob?", displayAnswer: "Bolg‘a" },
      { word: "OMBUR", clue: "Mix sug‘uradigan asbob?", displayAnswer: "Ombur" },
      { word: "PANSHAXA", clue: "Xashak yig‘adigan asbob?", displayAnswer: "Panshaxa" },
      { word: "ARRA", clue: "Taxta kesadigan asbob?", displayAnswer: "Arra" },
      { word: "MEHNAT", clue: "Asarning asosiy g‘oyasi?", displayAnswer: "Mehnat" },
    ],
    illustration: { emoji: "🐜", gradient: "linear-gradient(135deg,#b8923a,#6b4a12)" },
    keywords: ["mehnat", "qurollari"],
  },
  {
    id: "yolgonchi-cho'pon",
    title: "Bir butun oy, o‘n ikki yulduz",
    author: "Jo‘ra Rahim",
    grade: 3,
    genre: "ertak",
    part: 1,
    valueMain: "halollik",
    values: ["halollik", "masuliyat"],
    summary:
      "Juda qadim zamonda chol-u kampir bor edi. O‘g‘il va qiz ko‘rmagan, dastyorga-chi, zor edi. Ikkalasi ham ahil, aqlda edi dono. Shuning uchun qo‘shnilar hurmatlardi doimo. Kampir uyda o‘tirar, qilib uyning yumushin. Choi omoch-la yer haydab, tamomlar dala…",
    moral: "To'g'rilik va odob kichik ishda ham insonni ulug'laydi.",
    fullText: "",
    questions: [
      "Kampir Tohirga nima topshirdi?",
      "Tohir yo'lda nima qildi?",
      "«Bir butun oy, o'n ikki yulduz» nima degani?",
      "Kampir bolani nima uchun tarbiya qildi?",
    ],
    tests: [
      {
        q: "Asar muallifi kim?",
        options: ["Jo'ra Rahim", "Ezop", "Pirmat Shermuhammedov", "Anvar Obidjon"],
        correct: 0,
      },
      {
        q: "Tohir kimga ovqat olib bordi?",
        options: ["Boboga", "Onaga", "Do'stga", "Qo'shniga"],
        correct: 0,
      },
      {
        q: "Tohir yo'lda nima yedi?",
        options: ["Yarim qatlam va olti chuchvara", "Hech narsa", "Butun ovqat", "Non"],
        correct: 0,
      },
      {
        q: "«Oltita yulduz» nima?",
        options: ["Olti dona chuchvara", "Oy", "Yulduz", "Non"],
        correct: 0,
      },
      {
        q: "«Yarim oy» nima?",
        options: ["Yarim qatlam", "Oyning yarmi", "Yarim non", "Yarim idish"],
        correct: 0,
      },
      {
        q: "Tohir dastlab nima dedi?",
        options: ["Yechganim yo'q", "Hammasini yedim", "Topolmadim", "Ketdim"],
        correct: 0,
      },
      {
        q: "Asar qaysi janrga kiradi?",
        options: ["Ertak", "She'r", "Matn", "Masal"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Halollik va odob", "Yolg'on", "Hasad", "Ochko'zlik"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["3-sinf", "4-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["To'g'ri gapirish va tan olish kerak", "Yolg'on yaxshi", "Yashirish kerak", "Ovqat yemaslik"],
        correct: 0,
      },
    ],
    crossword: [],
    illustration: { emoji: "🐺", gradient: "linear-gradient(135deg,#8a8f9e,#4a4f5e)" },
    keywords: ["o‘n", "yulduz"],
  },
  {
    id: "ota-nasihati",
    title: "Bog‘bon va nihol",
    author: "Darslik",
    grade: 3,
    genre: "rivoyat",
    part: 1,
    valueMain: "ota-onaga-hurmat",
    values: ["ota-onaga-hurmat", "masuliyat"],
    summary:
      "Qadim zamonda bir bog‘bon bo‘lgan ekan. Ularning yakka-yu yagona farzandi bolib, juda tantiq ekan. Bog‘bon bolasiga tanbeh bersa, xotini o‘rtaga tushib: “Qo‘yavering, katta bo‘lsa, esi kirib qoladi”, — der ekan. Bog‘bon xotinining gapi xato ekanini…",
    moral: "Farzand tarbiyasini vaqtida mehr va talabchanlik bilan boshlash kerak.",
    fullText: "",
    questions: [
      "Bog'bon nima uchun ikkita nihol ekdi?",
      "Qaysi nihol yaxshi meva berdi va nega?",
      "Xotini bolani qanday asrab qolardi?",
      "Asar tarbiya haqida nima o'rgatadi?",
    ],
    tests: [
      {
        q: "Bog'bon nechta nihol ekdi?",
        options: ["Ikkita bir xil", "Bitta", "Uchta", "To'rtta"],
        correct: 0,
      },
      {
        q: "Qaysi nihol serhosil bo'ldi?",
        options: ["Shoxlari kesilgan", "Kesilmagan", "Ikkalasi ham", "Hech biri"],
        correct: 0,
      },
      {
        q: "Kesilmagan nihol nima bo'ldi?",
        options: ["Qiyshiq, foydasiz daraxt", "Eng baland", "Eng chiroyli", "Meva ko'p"],
        correct: 0,
      },
      {
        q: "Xotini nima der edi?",
        options: ["Katta bo'lsa, esi kirib qoladi", "Tanbeh bering", "Ursin", "Ketsin"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Tarbiya", "Yolg'on", "Hasad", "Dangasalik"],
        correct: 0,
      },
      {
        q: "Bog'bon bolasini qanday deb ataydi?",
        options: ["Tantiq", "Jasur", "Dono", "Katta"],
        correct: 0,
      },
      {
        q: "Asar qaysi janrga kiradi?",
        options: ["Rivoyat", "She'r", "Ertak", "Matn"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["3-sinf", "4-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "Oradan qancha yil o'tdi?",
        options: ["Uch yil", "Bir yil", "O'n yil", "Bir oy"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["To'g'ri tarbiyani vaqtida qilish kerak", "Bolani asrab qolish yaxshi", "Shox kesmaslik kerak", "Tantiqlik yaxshi"],
        correct: 0,
      },
    ],
    crossword: [
      { word: "BOGBON", clue: "Nihol parvarish qiluvchi kishi?", displayAnswer: "Bog‘bon" },
      { word: "NIHOL", clue: "Daraxtning yosh holati?", displayAnswer: "Nihol" },
      { word: "TARBIYA", clue: "Asardagi asosiy g‘oya?", displayAnswer: "Tarbiya" },
      { word: "DARAXT", clue: "Meva beruvchi o‘simlik?", displayAnswer: "Daraxt" },
      { word: "NAZORAT", clue: "Farzand tarbiyasida muhim omil?", displayAnswer: "Nazorat" },
    ],
    illustration: { emoji: "🌳", gradient: "linear-gradient(135deg,#6b9e4a,#3a6b1f)" },
    keywords: ["bog‘bon", "nihol"],
  },
  {
    id: "kitob-dosti",
    title: "Kitob — kuch",
    author: "Nabijon Ermat",
    grade: 3,
    genre: "she'r",
    part: 2,
    valueMain: "masuliyat",
    values: ["masuliyat", "mehnatsevarlik"],
    summary:
      "Kitob sevgan insonga Kitob erur xazina. Kitob o‘qimaganlar O‘zidan qilsin gina. Kitobsiz uy zim-ziyo, Yo‘qdir tuynuk, eshigi. Zulmat uni qurshaydi, Allalamas beshigi. Kuch bo‘lsa — kuch topilar Pashshada ham, baliqda. Savodsizlik shiori Hammaga bir qullikda.…",
    moral: "Kitob bilim, kuch va yorug' kelajak manbaidir.",
    fullText: "",
    questions: [
      "She'rda kitob nima deb ataladi?",
      "Kitobsiz uy qanday tasvirlanadi?",
      "Kitob insonga nima beradi?",
      "Nega kitobni non kabi e'zoz qilish kerak?",
    ],
    tests: [
      {
        q: "She'r muallifi kim?",
        options: ["Nabijon Ermat", "Zamira Ro'ziyeva", "Dilshod Rajab", "Ne'mat Dushayev"],
        correct: 0,
      },
      {
        q: "Kitob insonga nima?",
        options: ["Xazina", "Yuk", "Dushman", "O'yinchoq"],
        correct: 0,
      },
      {
        q: "Kitobsiz uy qanday?",
        options: ["Zim-ziyo", "Yorug'", "Katta", "Yangi"],
        correct: 0,
      },
      {
        q: "Kitob nima qiladi?",
        options: ["Yaxshi-yomonni farqlaydi", "Uxlatadi", "Alam qiladi", "Yig'latadi"],
        correct: 0,
      },
      {
        q: "Asar qaysi janrga kiradi?",
        options: ["She'r", "Hikoya", "Ertak", "Matn"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Kitob va ilm", "Yolg'on", "Hasad", "Dangasalik"],
        correct: 0,
      },
      {
        q: "Kitob kimga meros?",
        options: ["Bobolardan", "Do'stdan", "Dushmandan", "Hech kimga"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["3-sinf", "4-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "Zukkolik nima?",
        options: ["Ulug' qurol", "Yomon narsa", "O'yin", "Uy"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["Kitob — bilim manbai va kuch", "Kitob keraksiz", "O'qish yomon", "Savodsizlik yaxshi"],
        correct: 0,
      },
    ],
    crossword: [],
    illustration: { emoji: "📚", gradient: "linear-gradient(135deg,#5a8fd6,#2a4f9e)" },
    keywords: ["kitob", "kuch"],
  },
  {
    id: "mardlik-qissasi",
    title: "Kitobni do‘st bilganlar",
    author: "Zamira Ro‘ziyeva",
    grade: 3,
    genre: "she'r",
    part: 2,
    valueMain: "vatanparvarlik",
    values: ["vatanparvarlik", "dustlik", "masuliyat"],
    summary:
      "O‘zligin anglay bilar, Kitobni do‘st bilganlar. Baxt yo‘lin tanlay bilar, Kitobni do‘st bilganlar. Ko‘zga surtar tuprog‘in, Suyar gul-u yaprog‘in. Qovjiratmas chorbog‘in, Kitobni do‘st bilganlar. Ona tilim manim der, Sha’ni yuksalganim der. Pastlatsa kim —…",
    moral: "Kitobni do'st bilgan inson o'zligini, tilini va Vatanini qadrlaydi.",
    fullText: "",
    questions: [
      "Kitobni do'st bilganlar qanday odamlar?",
      "Ona til haqida nima deyiladi?",
      "Kitob insonga qanday yo'l ko'rsatadi?",
      "Nega kitob vatanparvarlikka olib boradi?",
    ],
    tests: [
      {
        q: "She'r muallifi kim?",
        options: ["Zamira Ro'ziyeva", "Nabijon Ermat", "Miltiqboy Xonnazarov", "Dilshod Rajab"],
        correct: 0,
      },
      {
        q: "Kitobni do'st bilganlar nima qiladi?",
        options: ["O'zligini anglaydi", "Adashadi", "Uxlashadi", "O'ynashadi"],
        correct: 0,
      },
      {
        q: "Ona til haqida nima deyiladi?",
        options: ["Mani der, sha'ni yuksalganim der", "Keraksiz", "Yomon", "Chet til"],
        correct: 0,
      },
      {
        q: "Asar qaysi janrga kiradi?",
        options: ["She'r", "Hikoya", "Ertak", "Matn"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Kitob va vatanparvarlik", "Yolg'on", "Hasad", "Dangasalik"],
        correct: 0,
      },
      {
        q: "Kitobni do'st bilganlar qanday?",
        options: ["Asl vatanparvar", "Gumroh", "Yolg'onchi", "Dangasa"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["3-sinf", "4-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "She'rda millat faxri nima?",
        options: ["Kitobni do'st bilish", "O'yin", "Uxlash", "Hasad"],
        correct: 0,
      },
      {
        q: "Kitob har kuni nima beradi?",
        options: ["Kashfiyot", "Yolg'on", "Hasad", "Qo'rquv"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["Kitob — eng yaxshi do'st va yo'l ko'rsatuvchi", "Kitob keraksiz", "O'qimaslik yaxshi", "Ona tilni unutish"],
        correct: 0,
      },
    ],
    crossword: [],
    illustration: { emoji: "🌊", gradient: "linear-gradient(135deg,#3aa3c6,#1a5f8e)" },
    keywords: ["kitobni", "do‘st", "bilganlar"],
  },
  {
    id: "navruz-bayrami",
    title: "Mehr urug‘i",
    author: "Darslik",
    grade: 3,
    genre: "rivoyat",
    part: 2,
    valueMain: "mehribonlik",
    values: ["mehribonlik", "saxovat"],
    summary:
      "Qadim zamonda bir badavlat odam bo‘lgan ekan. U bir kuni tush ko‘ribdi. Tushida bozorda yurgan emish. Bir do‘konning ichiga kiribdi. Sotuvchi chol unga peshvoz chiqib, nima kerakligini so‘rabdi. Haligi odam: — Men boy-badavlat odamman, hech narsaga hojatim…",
    moral: "Mehr-oqibat urug'i avvalo inson qalbiga ekiladi.",
    fullText: "",
    questions: [
      "Badavlat odam tushida nima ko'rdi?",
      "Do'konda qanday narsalar sotiladi?",
      "Urug'lar nima uchun berildi?",
      "Uyg'ongach odam nima qilishga qaror qildi?",
    ],
    tests: [
      {
        q: "Odaml tushida qayerda yuradi?",
        options: ["Bozorda", "Maktabda", "Tog'da", "Daryoda"],
        correct: 0,
      },
      {
        q: "Do'konda qanday narsalar bor?",
        options: ["Do'stlik, muhabbat va oqibat urug'lari", "Non", "Kitob", "Oltin"],
        correct: 0,
      },
      {
        q: "Urug'larni qanday ishlatish kerak?",
        options: ["Suv bilan yutib yuborish", "Yerga ekish", "Sotish", "Tashlash"],
        correct: 0,
      },
      {
        q: "Urug'lar qanday parvarish qilinadi?",
        options: ["Qalbdan, o'zi ekadi", "Hech qanday", "Boshqasi ekadi", "Suv quyilmaydi"],
        correct: 0,
      },
      {
        q: "Asar qaysi janrga kiradi?",
        options: ["Rivoyat", "She'r", "Ertak", "Matn"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Mehr-oqibat va oila", "Yolg'on", "Hasad", "Dangasalik"],
        correct: 0,
      },
      {
        q: "Uyg'ongach nima esiga tushdi?",
        options: ["Keksa onasi", "Do'sti", "Kitobi", "O'yini"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["3-sinf", "4-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "Qutichada nechta urug' bor?",
        options: ["Uch dona", "Bitta", "O'n", "Hech"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["Mehr va muhabbatni o'zing parvarish qil", "Urug' sotish kerak", "Onani unutish", "Tush muhim emas"],
        correct: 0,
      },
    ],
    crossword: [],
    illustration: { emoji: "🪁", gradient: "linear-gradient(135deg,#4aa3e6,#2a6fb0)" },
    keywords: ["mehr", "urug‘i"],
  },
  {
    id: "oltin-tarvuz",
    title: "Vatan — jon fidolikdir",
    author: "Boltaboy Eshmurotov",
    grade: 4,
    genre: "matn",
    part: 2,
    valueMain: "vatanparvarlik",
    values: ["vatanparvarlik", "masuliyat"],
    summary:
      "Xalqimizda buyuk bir falsafiy gap yuradi: “Vatan ostonadan boshlanadi”. Bu hikmatomuz iboraga qanday qoyil qolmaslik mumkin. Buyuk istiqlolimiz bizga ona Vatanimizning qadriga yetishni, uni asrab-avaylashni o‘rgatdi. Biz kindik qonimiz to‘kilgan shu muqaddas…",
    moral: "Vatanparvarlik shior emas, yurt tinchligi uchun mas'uliyatdir.",
    fullText: "",
    questions: [
      "«Vatan ostonadan boshlanadi» degani nimani anglatadi?",
      "Haqiqiy vatanparvar kim?",
      "Vatanparvarlik qanday fazilat?",
      "Nega vatanparvarlik shior emas?",
    ],
    tests: [
      {
        q: "Asar muallifi kim?",
        options: ["Boltaboy Eshmurotov", "Xurshid Davron", "Pirmat Shermuhammedov", "Abdulla Saidov"],
        correct: 0,
      },
      {
        q: "Xalqimizda qanday gap yuradi?",
        options: ["Vatan ostonadan boshlanadi", "Vatan uzoqda", "Vatan keraksiz", "Vatan faqat shahar"],
        correct: 0,
      },
      {
        q: "Haqiqiy vatanparvar nima qiladi?",
        options: ["Vatanni asraydi, xizmat qiladi", "Ketadi", "Unutadi", "Haqqorat qiladi"],
        correct: 0,
      },
      {
        q: "Vatanparvarlik nima?",
        options: ["Jonni fido qilish", "Oddiy shior", "O'yin", "Pul topish"],
        correct: 0,
      },
      {
        q: "Asar qaysi sinf darsligida?",
        options: ["4-sinf", "3-sinf", "5-sinf", "2-sinf"],
        correct: 0,
      },
      {
        q: "Asarning qadriyati qaysi?",
        options: ["Vatanparvarlik", "Yolg'on", "Hasad", "Dangasalik"],
        correct: 0,
      },
      {
        q: "Asar qaysi janrga kiradi?",
        options: ["Matn", "She'r", "Ertak", "Masal"],
        correct: 0,
      },
      {
        q: "Vatan tinchligini nima qilish kerak?",
        options: ["Ko'z qo'zachigiday asrash", "Unutish", "Buzish", "E'tiborsiz qoldirish"],
        correct: 0,
      },
      {
        q: "Kindik qon qayerga to'kilgan?",
        options: ["Muqaddas tuproqqa", "Dengizga", "Tog'ga", "Chet elga"],
        correct: 0,
      },
      {
        q: "Asar saboqi nima?",
        options: ["Vatanparvarlik — jon fidolik", "Vatan muhim emas", "Faqat shior yetarli", "Xizmat keraksiz"],
        correct: 0,
      },
    ],
    crossword: [],
    illustration: { emoji: "🍉", gradient: "linear-gradient(135deg,#4aa85c,#c0354a)" },
    keywords: ["vatan", "jon", "fidolikdir"],
  },
];

if (typeof WORK_FULLTEXTS !== "undefined") {
  TEXTBOOK_WORKS.forEach((w) => {
    if (WORK_FULLTEXTS[w.id]) w.fullText = WORK_FULLTEXTS[w.id];
  });
}

/* Asarni id bo'yicha topish yordamchisi */
function getWorkById(id) {
  return TEXTBOOK_WORKS.find((w) => w.id === id) || null;
}

if (typeof window !== "undefined") {
  window.TEXTBOOK_WORKS = TEXTBOOK_WORKS;
  window.getWorkById = getWorkById;
}
