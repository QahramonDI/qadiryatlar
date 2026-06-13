/* Har bir asar uchun 10 ta ko'p tanlovli savol — asar mazmuniga mos */
const WORK_TESTS = {
  "marvarid": [
    {
      "q": "Matnda Vatan qanday ta'riflanadi?",
      "options": [
        "Kindik qoni tomgan tuproq va suygan odamlar manzili",
        "Faqat xaritadagi joy",
        "Faqat katta shahar",
        "Faqat tog' va daryo"
      ],
      "correct": 0
    },
    {
      "q": "Donishmandlardan biri Vatanni nimaga tenglashtiradi?",
      "options": [
        "Sening kindik qoning tomgan tuproqqa",
        "Oltin sandiqqa",
        "Uzoq safarga",
        "Katta bozorga"
      ],
      "correct": 0
    },
    {
      "q": "Matnda Vatan kalimasiga qaysi so'zlar qo'shib aytiladi?",
      "options": [
        "Vatan tuprog'i, Vatan tuyg'usi, Vatan tarixi",
        "Vatan o'yini, Vatan savdosi, Vatan shovqini",
        "Vatan yuki, Vatan narxi, Vatan bozori",
        "Vatan qushi, Vatan toshi, Vatan qog'ozi"
      ],
      "correct": 0
    },
    {
      "q": "Vatanga muhabbat nimadan boshlanishi aytiladi?",
      "options": [
        "Ona qishloq dalalari va ona tuproqqa mehrdan",
        "Chet elga ketishdan",
        "Faqat kitob yodlashdan",
        "Pul yig'ishdan"
      ],
      "correct": 0
    },
    {
      "q": "Amerikadan Fransiyaga olib kelingan daraxtlar nima uchun qurib qoladi?",
      "options": [
        "O'z yurtidagi qurg'oqchilik bilan sirli bog'liq bo'lgani uchun",
        "Ularni hech kim ko'rmagani uchun",
        "Ular umuman daraxt bo'lmagani uchun",
        "Qushlar uchib ketgani uchun"
      ],
      "correct": 0
    },
    {
      "q": "Daraxtlar haqidagi voqea matnda qaysi tuyg'uni tushuntiradi?",
      "options": [
        "Vatan tuyg'usini",
        "Hasadni",
        "Savdo qilishni",
        "Dangasalikni"
      ],
      "correct": 0
    },
    {
      "q": "Matnga ko'ra Vatan nimaga o'xshatiladi?",
      "options": [
        "Ona kabi yagona",
        "Oddiy buyum",
        "Almashtiriladigan kiyim",
        "Bozordagi narsa"
      ],
      "correct": 0
    },
    {
      "q": "Matnning asosiy qadriyati qaysi?",
      "options": [
        "Vatanparvarlik",
        "Ochko'zlik",
        "Yolg'onchilik",
        "Maqtanchoqlik"
      ],
      "correct": 0
    },
    {
      "q": "Matnda inson uchun havo, quyosh, suv, non va ota-ona qanday sanaladi?",
      "options": [
        "Aziz va muqaddas",
        "Keraksiz",
        "Faqat bezak",
        "Unutilgan"
      ],
      "correct": 0
    },
    {
      "q": "Matndan olinadigan asosiy xulosa nima?",
      "options": [
        "Vatan yagona, muqaddas va bebaho",
        "Vatan tez-tez almashtiriladi",
        "Vatan faqat boylarga kerak",
        "Vatan haqida o'ylamaslik kerak"
      ],
      "correct": 0
    }
  ],
  "temir-qoziq": [
    {
      "q": "Matnda Vatan tuyg'usi qalbga nimadan singishi aytiladi?",
      "options": [
        "Ona allasi va mehri orqali",
        "Faqat dars jadvalidan",
        "Bozor shovqinidan",
        "Sport musobaqasidan"
      ],
      "correct": 0
    },
    {
      "q": "O'z uyimizdan uzoqda yashab qolsak, matnga ko'ra qanday holat bo'ladi?",
      "options": [
        "Ko'nglimiz g'ash bo'ladi",
        "Hammasi unutiladi",
        "Faqat kulamiz",
        "Hech narsa sezilmaydi"
      ],
      "correct": 0
    },
    {
      "q": "Matnda Vatanga muhabbatning bir ko'rinishi sifatida nima aytiladi?",
      "options": [
        "O'z go'shasini qo'msash",
        "Do'stni aldash",
        "Dangasa bo'lish",
        "Faqat sovrin olish"
      ],
      "correct": 0
    },
    {
      "q": "Vatanga tegishli narsalarni qanday bilish kerak?",
      "options": [
        "Muqaddas bilish",
        "E'tiborsiz qoldirish",
        "Sotib yuborish",
        "Masxara qilish"
      ],
      "correct": 0
    },
    {
      "q": "Ulg'aygan sari qaysi tuyg'ular uyg'onishi aytiladi?",
      "options": [
        "Vatanga muhabbat, ota-onaga hurmat, ajdodlarga iftixor",
        "Faqat hasad va g'azab",
        "Faqat o'yin-kulgi",
        "Qo'rquv va yolg'on"
      ],
      "correct": 0
    },
    {
      "q": "Matnga ko'ra tuyg'ularning asosi nima?",
      "options": [
        "Muhabbat",
        "Yolg'on",
        "Boylik",
        "Shovqin"
      ],
      "correct": 0
    },
    {
      "q": "O'zbekiston qanday o'lka sifatida tasvirlanadi?",
      "options": [
        "Bog'larida jannat shivirlaydigan serquyosh o'lka",
        "Faqat sovuq sahro",
        "Kimsasiz orol",
        "Qorong'i makon"
      ],
      "correct": 0
    },
    {
      "q": "Matnda buyuk bobolarimizga nisbatan qanday munosabat bildiriladi?",
      "options": [
        "Ular bilan faxrlanish va munosib avlod bo'lish",
        "Ularni unutish",
        "Ulardan voz kechish",
        "Ularni tanimaslik"
      ],
      "correct": 0
    },
    {
      "q": "Matn qaysi qadriyatni kuchaytiradi?",
      "options": [
        "Vatanparvarlik",
        "Ochko'zlik",
        "Yolg'on",
        "Loqaydlik"
      ],
      "correct": 0
    },
    {
      "q": "Asosiy xulosa qaysi?",
      "options": [
        "Vatanni sevish haqiqiy inson fazilatidir",
        "Vatan muhim emas",
        "Uydan uzoqlashish eng katta maqsad",
        "Ajdodlarni bilish shart emas"
      ],
      "correct": 0
    }
  ],
  "vatan-yoshlari": [
    {
      "q": "She'rda Toshkent qanday ta'riflanadi?",
      "options": [
        "Asli bosh shahar, bag'ri nur-quyosh shahar",
        "Kimsasiz qishloq",
        "Qorli cho'l",
        "Tinch dengiz"
      ],
      "correct": 0
    },
    {
      "q": "She'rda Sirdaryo qanday ataladi?",
      "options": [
        "Gulistonim",
        "Qora tog'im",
        "Sokin dengizim",
        "Uzoq orolim"
      ],
      "correct": 0
    },
    {
      "q": "Maydonlarda mard kelgan hududlar qaysilar?",
      "options": [
        "Qashqadaryo va Surxon",
        "Andijon va Namangan",
        "Xorazm va Buxoro",
        "Toshkent va Navoiy"
      ],
      "correct": 0
    },
    {
      "q": "Samarqand nimaning sayqali deb tasvirlanadi?",
      "options": [
        "Yer yuzining",
        "Dengizlarning",
        "Bozorlarning",
        "Bulutlarning"
      ],
      "correct": 0
    },
    {
      "q": "She'rda Temur bobom haykali qanday tuyg'u uyg'otadi?",
      "options": [
        "G'urur qo'shadi",
        "Qo'rquv soladi",
        "Uyqu keltiradi",
        "Xafa qiladi"
      ],
      "correct": 0
    },
    {
      "q": "Buxoro she'rda qanday joy sifatida berilgan?",
      "options": [
        "Ilm uyi",
        "Sport maydoni",
        "Sokin orol",
        "Qorli cho'l"
      ],
      "correct": 0
    },
    {
      "q": "Xorazm haqida nima maqtaladi?",
      "options": [
        "Savlat-u san'ati",
        "Yomg'iri",
        "Qori",
        "Shovqini"
      ],
      "correct": 0
    },
    {
      "q": "Qoraqalpoq she'rda qanday tasvirlanadi?",
      "options": [
        "Qoshi qora, qalbi oq qadrdon",
        "Begona mehmon",
        "Jangchi qush",
        "Sokin daraxt"
      ],
      "correct": 0
    },
    {
      "q": "Farg'ona, Andijon va Namangan tilga olinganda nima ochiladi?",
      "options": [
        "Bahr-u dil",
        "Temir eshik",
        "Qorli yo'l",
        "Bo'sh sandiq"
      ],
      "correct": 0
    },
    {
      "q": "She'rning asosiy g'oyasi nima?",
      "options": [
        "O'zbekiston hududlarini mehr bilan madh etish",
        "Viloyatlarni unutish",
        "Faqat bitta shaharni sevish",
        "Yurtni tark etish"
      ],
      "correct": 0
    }
  ],
  "chin-va-yolgon": [
    {
      "q": "Hikoyada yo'lda nechta ulov birga ketadi?",
      "options": [
        "Uchta",
        "Ikkita",
        "Beshta",
        "Bitta"
      ],
      "correct": 0
    },
    {
      "q": "Kattaroq ulov o'zini qanday ko'rsatadi?",
      "options": [
        "Hammadan kuchli va obro'li deb keriladi",
        "Eng kichik deb uyaltiradi",
        "Indamay yuradi",
        "Yordam so'raydi"
      ],
      "correct": 0
    },
    {
      "q": "Bejirim uzungina ulov nimasi bilan maqtanadi?",
      "options": [
        "Chiroyi bilan",
        "Yoqilg'isi bilan",
        "Suv tashishi bilan",
        "Kamtarligi bilan"
      ],
      "correct": 0
    },
    {
      "q": "Uchinchi ulov boshida qanday yo'l tutadi?",
      "options": [
        "Jim turib, vaqt ko'rsatishini aytadi",
        "Hammaga baqiradi",
        "Yo'lni tark etadi",
        "Boshqalarni aldab ketadi"
      ],
      "correct": 0
    },
    {
      "q": "Katta ulovning yoqilg'isi kamayganda kim yordam beradi?",
      "options": [
        "Uchinchi ulov",
        "Bejirim ulov",
        "Hech kim",
        "Yo'lovchi bola"
      ],
      "correct": 0
    },
    {
      "q": "Bejirim ulovning nima tugab qoladi?",
      "options": [
        "Suv",
        "G'ildirak",
        "Oyna",
        "Kitob"
      ],
      "correct": 0
    },
    {
      "q": "Uchinchi ulov yordam berishda nimani unutadi?",
      "options": [
        "Dilni og'rituvchi gaplarni",
        "Yo'lni",
        "Ismini",
        "Yoqilg'ini"
      ],
      "correct": 0
    },
    {
      "q": "Katta ulov oxirida uchinchi mashinani qanday tan oladi?",
      "options": [
        "Eng kuchli, kamtar va mehribon deb",
        "Eng chiroyli deb",
        "Eng sekin deb",
        "Eng yolg'onchi deb"
      ],
      "correct": 0
    },
    {
      "q": "Hikoyaning asosiy qadriyati nima?",
      "options": [
        "Kamtarlik va chin do'stlik",
        "Maqtanchoqlik",
        "Hasad",
        "Yolg'on"
      ],
      "correct": 0
    },
    {
      "q": "Asardan qanday saboq olinadi?",
      "options": [
        "Chin do'st gap bilan emas, yordam bilan bilinadi",
        "Faqat o'zingni maqtash kerak",
        "Yordam bermaslik foydali",
        "Do'stni qiynash kerak"
      ],
      "correct": 0
    }
  ],
  "ona-qarzi": [
    {
      "q": "Rafiq dadasidan qaysi so'z ma'nosini so'raydi?",
      "options": [
        "Hisobot",
        "Savdo",
        "Ijara",
        "Sovrin"
      ],
      "correct": 0
    },
    {
      "q": "Dadasi hisobotni qanday tushuntiradi?",
      "options": [
        "Qilingan ishlar uchun davlatga yoziladigan qog'oz deb",
        "O'yin qoidasi deb",
        "Do'kondagi ro'yxat deb",
        "She'r daftar deb"
      ],
      "correct": 0
    },
    {
      "q": "Rafiq nima deb o'ylab qoladi?",
      "options": [
        "Uyda qilgan ishlari uchun oyisidan pul olishi kerak deb",
        "Maktabga bormaslik kerak deb",
        "Dadasi xato qilgan deb",
        "Pulni yashirish kerak deb"
      ],
      "correct": 0
    },
    {
      "q": "Rafiq oyisidan qaysi ishlari uchun haq yozadi?",
      "options": [
        "Ukasini ovqatlantirgani, do'kondan narsa olgani, non keltirgani uchun",
        "Dars o'qimagani uchun",
        "Ko'chada o'ynagani uchun",
        "Mehmon kutgani uchun"
      ],
      "correct": 0
    },
    {
      "q": "Oyisi Rafiqqa pul bilan birga nima qo'yadi?",
      "options": [
        "O'zining hisoboti yozilgan qog'oz",
        "Yangi o'yinchoq",
        "Bo'sh daftar",
        "Shirinlik retsepti"
      ],
      "correct": 0
    },
    {
      "q": "Oyisi Rafiqdan bolani tarbiya qilish va boqish haqini qancha deb yozadi?",
      "options": [
        "0 rupiya 00 paysa",
        "2 rupiya 80 paysa",
        "10 rupiya",
        "1 rupiya"
      ],
      "correct": 0
    },
    {
      "q": "Rafiq qog'ozni o'qigach nima qiladi?",
      "options": [
        "Oyisining oyog'iga tashlanib kechirim so'raydi",
        "Pulni yashiradi",
        "Uyidan chiqib ketadi",
        "Kulib yuboradi"
      ],
      "correct": 0
    },
    {
      "q": "Rafiq nimani tushunadi?",
      "options": [
        "Onasi oldidagi qarzini umr bo'yi to'lay olmasligini",
        "Uy yumushi keraksizligini",
        "Pul hammasidan ustunligini",
        "Hisobot yozmaslik kerakligini"
      ],
      "correct": 0
    },
    {
      "q": "Onasi Rafiqqa qanday bo'lishni tilaydi?",
      "options": [
        "Halol, insofli, rostgo'y bo'lishni",
        "Boy va maqtanchoq bo'lishni",
        "Dangasa bo'lishni",
        "Hammadan pul so'rashni"
      ],
      "correct": 0
    },
    {
      "q": "Asarning asosiy saboqi nima?",
      "options": [
        "Ona mehrini pul bilan o'lchab bo'lmaydi",
        "Har xizmat uchun pul so'rash kerak",
        "Hisobot yozish zarar",
        "Uyda yordam bermaslik kerak"
      ],
      "correct": 0
    }
  ],
  "zardoz": [
    {
      "q": "She'rda bolajon nima sababdan parishon?",
      "options": [
        "Orolning suvsiz qolib, tabiat zavol topayotganidan",
        "O'yinchoq yo'qolganidan",
        "Mehmon kelmaganidan",
        "Kitob topilmaganidan"
      ],
      "correct": 0
    },
    {
      "q": "Bolajon kimlarga murojaat qiladi?",
      "options": [
        "Mehmon g'ozlarga",
        "Baliqlarga",
        "Chavandozlarga",
        "Savdogarlarga"
      ],
      "correct": 0
    },
    {
      "q": "G'ozlar bolajonga nima deydi?",
      "options": [
        "Yurt kez, dengiz ko'p-ku olamda deydi",
        "Uyga qayt deydi",
        "Suv ichma deydi",
        "Orolni unut deydi"
      ],
      "correct": 0
    },
    {
      "q": "Bolajon uchun qaysi joy yagona?",
      "options": [
        "Ona Orol",
        "Begona dengiz",
        "Tog' cho'qqisi",
        "Bozor"
      ],
      "correct": 0
    },
    {
      "q": "She'rda tabiatning qaysi muammosi ko'rsatiladi?",
      "options": [
        "Daryolar suvsiz qolib, Orol qurib borishi",
        "Daraxtlar juda ko'payishi",
        "Qor yog'masligi",
        "Quyosh chiqmasligi"
      ],
      "correct": 0
    },
    {
      "q": "Bolajon boshqa dengizlar ko'p bo'lsa ham nimani aytadi?",
      "options": [
        "Ona Orol bittadir",
        "Hammasi bir xil",
        "Orol kerak emas",
        "Dengizlar kichik"
      ],
      "correct": 0
    },
    {
      "q": "She'r qanday tuyg'uni uyg'otadi?",
      "options": [
        "Ona yurt tabiatiga mehr va qayg'urish",
        "Tabiatga loqaydlik",
        "Maqtanchoqlik",
        "Ochko'zlik"
      ],
      "correct": 0
    },
    {
      "q": "She'rning janri nima?",
      "options": [
        "She'r",
        "Hikoya",
        "Ertak",
        "Maqola"
      ],
      "correct": 0
    },
    {
      "q": "She'rda 'Orolim' degan murojaat nimani bildiradi?",
      "options": [
        "Orolga yaqinlik va mehrni",
        "Begonalikni",
        "Hazilni",
        "Qo'rquvni"
      ],
      "correct": 0
    },
    {
      "q": "Asosiy xulosa qaysi?",
      "options": [
        "Tabiat va ona yurtni asrash kerak",
        "Daryolarni unutish kerak",
        "Boshqa joylar kifoya",
        "G'ozlarni haydash kerak"
      ],
      "correct": 0
    }
  ],
  "karim-polvon": [
    {
      "q": "Voqealar qaysi fasl kelishi bilan boshlanadi?",
      "options": [
        "Kuz",
        "Qish",
        "Bahor",
        "Yoz"
      ],
      "correct": 0
    },
    {
      "q": "Karim polvon qanday otini parvarishlaydi?",
      "options": [
        "Jiyron qashqasini",
        "Qora tuyasini",
        "Oq eshagini",
        "Ko'k sigirini"
      ],
      "correct": 0
    },
    {
      "q": "Karim polvon qaysi milliy o'yinga tayyorlanadi?",
      "options": [
        "Uloq-ko'pkari",
        "Kurashsiz yugurish",
        "Shaxmat",
        "Suzish"
      ],
      "correct": 0
    },
    {
      "q": "Musobaqa oldidan u otiga nima qildirib chiqadi?",
      "options": [
        "Yangi taqa qoqtiradi",
        "Yangi egar sotadi",
        "Otini yashiradi",
        "Otini almashtiradi"
      ],
      "correct": 0
    },
    {
      "q": "Karim polvon raqibining qanday holatiga parvo qilmaydi?",
      "options": [
        "Dimog'i balandligiga",
        "Yoshi kichikligiga",
        "Oti yo'qligiga",
        "Kulganiga"
      ],
      "correct": 0
    },
    {
      "q": "Polvon uloqni qanday qo'lga oladi?",
      "options": [
        "Oldingi oyoqlaridan siqib ushlab tortib oladi",
        "Sotib oladi",
        "Yerga tashlaydi",
        "Raqibga beradi"
      ],
      "correct": 0
    },
    {
      "q": "U uloqni olgach nima qiladi?",
      "options": [
        "Taqimiga bosib, otini yon tomonga buradi",
        "Maydondan qochadi",
        "Otini to'xtatadi",
        "Uloqni tashlab ketadi"
      ],
      "correct": 0
    },
    {
      "q": "Bakovul nimani e'lon qiladi?",
      "options": [
        "Karim polvon g'olib bo'lganini",
        "Musobaqa bekorligini",
        "Raqib ketganini",
        "Otlar yo'qolganini"
      ],
      "correct": 0
    },
    {
      "q": "Asarda Karim polvonning qaysi fazilatlari ko'rinadi?",
      "options": [
        "Tayyorgarlik, matonat va mahorat",
        "Dangasalik",
        "Yolg'onchilik",
        "Qo'rqoqlik"
      ],
      "correct": 0
    },
    {
      "q": "Hikoyadan olinadigan saboq nima?",
      "options": [
        "Mehnat va tayyorgarlik g'alabaga yetaklaydi",
        "Omad uchun tayyorgarlik kerak emas",
        "Raqibni mensimaslik foydali",
        "Otni parvarishlamaslik kerak"
      ],
      "correct": 0
    }
  ],
  "dustlik-kemasi": [
    {
      "q": "Hikoyada qish kelgach nima yog'a boshlaydi?",
      "options": [
        "Qalin qor",
        "Yomg'ir",
        "Do'l",
        "Tuproq"
      ],
      "correct": 0
    },
    {
      "q": "Qo'shnilardan biri erta turib nima qiladi?",
      "options": [
        "Darvozasi oldidagi qorni kurab yo'lak ochadi",
        "Daraxt ekadi",
        "Kitob o'qiydi",
        "Bozorga ketadi"
      ],
      "correct": 0
    },
    {
      "q": "U qo'shnisining yo'lagini ko'rib nima deb o'ylaydi?",
      "options": [
        "Ertaga vaqtliroq chiqib birinchi bo'laman deb",
        "Qo'shnim yo'q deb",
        "Qor yog'maydi deb",
        "Yo'lak kerak emas deb"
      ],
      "correct": 0
    },
    {
      "q": "U uchinchi safar qachon ko'chaga chiqadi?",
      "options": [
        "Kun yorishmasidan",
        "Tush payti",
        "Kechasi uxlab qolgach",
        "Ertasi kechqurun"
      ],
      "correct": 0
    },
    {
      "q": "Qo'shnisining yo'lagi nega doim ochilib qoladi?",
      "options": [
        "Uyiga kelib-ketadigan do'stlari tufayli",
        "U kechasi qor kuragani uchun",
        "Shamol uchirgani uchun",
        "Bolalar buzib ketgani uchun"
      ],
      "correct": 0
    },
    {
      "q": "Hikoyada birinchi qo'shni nimaga hayron bo'ladi?",
      "options": [
        "Qo'shnisi chiqmagan bo'lsa ham yo'lak tayyorligiga",
        "Qor yog'maganiga",
        "Do'stlar kelmaganiga",
        "Uy yo'qolganiga"
      ],
      "correct": 0
    },
    {
      "q": "Qo'shnining javobi qaysi qadriyatni ko'rsatadi?",
      "options": [
        "Do'stlikni",
        "Yolg'onni",
        "Ochko'zlikni",
        "Hasadni"
      ],
      "correct": 0
    },
    {
      "q": "Yo'lak hikoyada nimaning belgisi bo'lib keladi?",
      "options": [
        "Do'stlar borib-kelib turadigan mehr yo'lining",
        "Faqat qorning",
        "Savdo joyining",
        "Musobaqaning"
      ],
      "correct": 0
    },
    {
      "q": "Asar qahramoni qo'shnisidan nimani so'raydi?",
      "options": [
        "Yo'lakni qachon ochishga ulgurasiz deb",
        "Nega kitob o'qimaysiz deb",
        "Nega ot minmaysiz deb",
        "Qayerdan oltin topdingiz deb"
      ],
      "correct": 0
    },
    {
      "q": "Asosiy xulosa nima?",
      "options": [
        "Haqiqiy do'stlik inson yo'lini ochadi",
        "Birinchi bo'lish hammasidan muhim",
        "Qo'shnidan hasad qilish kerak",
        "Qorni hech kim kuramasin"
      ],
      "correct": 0
    }
  ],
  "saxiy-dehqon": [
    {
      "q": "Matn boshida irmoq qayerda tug'iladi?",
      "options": [
        "Tog'larning qor va muz bilan qoplangan bag'rida",
        "Bozor yonida",
        "Cho'l o'rtasida",
        "Shahar ko'chasida"
      ],
      "correct": 0
    },
    {
      "q": "Irmoq yo'lda nima hosil qiladi?",
      "options": [
        "Boshqa irmoqlar bilan birlashib daryo",
        "Quduq",
        "Ko'lmak",
        "Bulut"
      ],
      "correct": 0
    },
    {
      "q": "Daryo birinchi uchratgan insondan nimani his qiladi?",
      "options": [
        "Mehr, kuch va irodani",
        "Yolg'onni",
        "Qo'rquvni",
        "Sovuqlikni"
      ],
      "correct": 0
    },
    {
      "q": "Odamlar daryodan qanday foydalanadi?",
      "options": [
        "Ichadi, cho'miladi, tegirmon aylantiradi",
        "Uni butunlay unutadi",
        "Unga kitob beradi",
        "Uni osmonga ko'taradi"
      ],
      "correct": 0
    },
    {
      "q": "Yomon odamlar daryoga nima qiladi?",
      "options": [
        "Ifloslantirib, chiqindi tashlaydi",
        "Uni tozalaydi",
        "Gul ekadi",
        "Suvini ko'paytiradi"
      ],
      "correct": 0
    },
    {
      "q": "Shahardan chiqqach daryoning holati qanday bo'ladi?",
      "options": [
        "Kasallangan, rangi o'zgargan, tubi chiqindiga to'lgan",
        "Yanada tiniq",
        "Butunlay qurimagan va oppoq",
        "Oltin bilan to'lgan"
      ],
      "correct": 0
    },
    {
      "q": "Pokiza paytida uchratgan yo'lovchi daryoga qanday qaraydi?",
      "options": [
        "Achingancha g'amgin qaraydi",
        "Masxara qiladi",
        "Ko'rmagandek o'tadi",
        "Sotib oladi"
      ],
      "correct": 0
    },
    {
      "q": "Yo'lovchi daryoga yordam berish uchun kimlarni olib keladi?",
      "options": [
        "Bolalarni",
        "Savdogarlarni",
        "Chavandozlarni",
        "G'ozlarni"
      ],
      "correct": 0
    },
    {
      "q": "Daryoda yana qanday hissiyot uyg'onadi?",
      "options": [
        "Yashashga intilish hissi",
        "Umidsizlik",
        "G'azab",
        "Uyqu"
      ],
      "correct": 0
    },
    {
      "q": "Matnning asosiy saboqi nima?",
      "options": [
        "Tabiatni ifloslantirmasdan, asrab-tozalash kerak",
        "Daryoga chiqindi tashlash mumkin",
        "Suv hech kimga kerak emas",
        "Yordam berish befoyda"
      ],
      "correct": 0
    }
  ],
  "adolatli-qozi": [
    {
      "q": "Badavlat ota o'g'illariga nimalar gunoh ekanini tushuntiradi?",
      "options": [
        "O'g'rilik, poraxo'rlik, kishi haqiga xiyonat va tuhmat",
        "Kitob o'qish",
        "Mehnat qilish",
        "Mehmon kutish"
      ],
      "correct": 0
    },
    {
      "q": "Ota farzandlarini sinash uchun nima qiladi?",
      "options": [
        "Sayil yo'lida oltin solingan hamyonlar tashlab qo'yadi",
        "Ularga sovg'a beradi",
        "Uyini sotadi",
        "Ularni shaharga yubormaydi"
      ],
      "correct": 0
    },
    {
      "q": "Ayrim o'g'illar nega hamyonni olmaydi?",
      "options": [
        "Otam ko'rib qolsa merosdan mahrum qiladi deb qo'rqadi",
        "Hamyonni ko'rmagani uchun",
        "Oltinni tanimagani uchun",
        "Hamyon juda og'ir bo'lgani uchun"
      ],
      "correct": 0
    },
    {
      "q": "Kenja o'g'il hamyonni ko'rgach nima haqida o'ylaydi?",
      "options": [
        "Yo'qotgan odamning holati va mashaqqatini",
        "O'ziga yangi kiyim olishni",
        "Akalari bilan maqtanishni",
        "Hamyonni yashirishni"
      ],
      "correct": 0
    },
    {
      "q": "Egasi chiqmagach kenja o'g'il oltinni nima qiladi?",
      "options": [
        "Ko'pchilik orasida bir faqirga xayr qiladi",
        "Uyiga olib ketadi",
        "Akasiga beradi",
        "Daryoga tashlaydi"
      ],
      "correct": 0
    },
    {
      "q": "Ota merosni kimga beradi?",
      "options": [
        "Kenja o'g'ilga",
        "Katta o'g'ilga",
        "Hamma teng oladi",
        "Hech kimga bermaydi"
      ],
      "correct": 0
    },
    {
      "q": "Katta o'g'il nega norozilik bildiradi?",
      "options": [
        "U ham hamyonni ko'rib, birovning haqi deb olmaganini aytadi",
        "Meros kerak emasligi uchun",
        "Kenja o'g'ilni ko'rmagani uchun",
        "Ota ketgani uchun"
      ],
      "correct": 0
    },
    {
      "q": "Ota katta o'g'ilning olmasligini qanday baholaydi?",
      "options": [
        "Qo'rquvdan tug'ilgan, chin poklik emas deb",
        "Eng oliy halollik deb",
        "Hazil deb",
        "Unutilgan ish deb"
      ],
      "correct": 0
    },
    {
      "q": "Kenja o'g'ilning qilmishi nimadan kelib chiqqan?",
      "options": [
        "Ichki e'tiqod va insonlarga mehrdan",
        "Jazodan qo'rqishdan",
        "Maqtanchoqlikdan",
        "Boylik istagidan"
      ],
      "correct": 0
    },
    {
      "q": "Asar xulosasi nima?",
      "options": [
        "Haqiqiy halollik tashqi qo'rquvdan emas, ichki e'tiqoddan bo'ladi",
        "Oltinni topgan odamniki",
        "Faqirga yordam kerak emas",
        "Meros uchun hamma narsa mumkin"
      ],
      "correct": 0
    }
  ],
  "boburning-bolaligi": [
    {
      "q": "She'rda bobolar qanday tasvirlanadi?",
      "options": [
        "Daho, olim, dono va ish bilan dong taratgan",
        "Dangasa",
        "Yolg'onchi",
        "Begona"
      ],
      "correct": 0
    },
    {
      "q": "She'rda qaysi bobom algoritm faniga asos solgani aytiladi?",
      "options": [
        "Bobolarimdan biri",
        "Temur bobom",
        "Tabib bobom",
        "Kolumb"
      ],
      "correct": 0
    },
    {
      "q": "She'rda tabib bobom nimaga g'isht qo'ygani aytiladi?",
      "options": [
        "Tibbiyot faniga",
        "Savdo yo'liga",
        "Dengizga",
        "Bog'ga"
      ],
      "correct": 0
    },
    {
      "q": "Xarita chizgan bobom haqida nima deyiladi?",
      "options": [
        "Amerikani Kolumbdan ko'p ilgari kashf aylagan",
        "Hech narsa bilmagan",
        "Faqat she'r yozgan",
        "Ot minmagan"
      ],
      "correct": 0
    },
    {
      "q": "She'rning ikkinchi qismida qaysi buyuk bobom ulug'lanadi?",
      "options": [
        "Amir Temur",
        "Abu Rayhon Beruniy",
        "Rafiq",
        "Karim polvon"
      ],
      "correct": 0
    },
    {
      "q": "Amir Temur qanday bobom deb ataladi?",
      "options": [
        "Sohibqiron",
        "Savdogar",
        "Bog'bon",
        "Cho'pon"
      ],
      "correct": 0
    },
    {
      "q": "Amir Temur kimlarni Turon zamindan quvgani aytiladi?",
      "options": [
        "Tajovuzkor Chingizlarni",
        "Do'stlarni",
        "Bolalarni",
        "Olimlarni"
      ],
      "correct": 0
    },
    {
      "q": "Temur bobom bilimdon va hunarmandlarga qanday munosabatda bo'lgan?",
      "options": [
        "Qo'llagan va imkon bergan",
        "Ularni haydagan",
        "Ularni unutgan",
        "Ularni tanimagan"
      ],
      "correct": 0
    },
    {
      "q": "She'r oxirida bolalar nimaga amal qilishini aytadi?",
      "options": [
        "Temir bobom o'gitiga",
        "Yolg'on gapga",
        "Dangasalik odatiga",
        "Qo'rquvga"
      ],
      "correct": 0
    },
    {
      "q": "She'rning asosiy g'oyasi nima?",
      "options": [
        "Ajdodlarga munosib bo'lib, Vatan uchun xizmat qilish",
        "Ajdodlarni unutish",
        "Mehnatdan qochish",
        "Yurtni tark etish"
      ],
      "correct": 0
    }
  ],
  "mehribon-qiz": [
    {
      "q": "She'r kimlarni hurmat qilishga chaqiradi?",
      "options": [
        "Keksa kishilarni",
        "Faqat boylarni",
        "Faqat bolalarni",
        "Begonalarni"
      ],
      "correct": 0
    },
    {
      "q": "Keksalar she'rda qanday deb bilinsin deyiladi?",
      "options": [
        "Farishta deb",
        "Dushman deb",
        "Savdogar deb",
        "O'yinchi deb"
      ],
      "correct": 0
    },
    {
      "q": "Keksalarning duosi qanday boylik deb tasvirlanadi?",
      "options": [
        "Tuganmas boylik",
        "Keraksiz narsa",
        "Og'ir yuk",
        "Bo'sh gap"
      ],
      "correct": 0
    },
    {
      "q": "Keksalarni ko'rganda nima qilish kerak?",
      "options": [
        "Qo'lini olib, ahvolini so'rash",
        "Yuz o'girish",
        "Masxara qilish",
        "Indamay qochish"
      ],
      "correct": 0
    },
    {
      "q": "Ularni uyga taklif qilganda qayerga o'tqazish aytiladi?",
      "options": [
        "Uyning to'rigiga",
        "Eshik oldiga",
        "Ko'chaga",
        "Omborga"
      ],
      "correct": 0
    },
    {
      "q": "She'rda keksalarga qanday xizmat qilish tilga olinadi?",
      "options": [
        "Choy quyib uzatish",
        "Ularni kutdirmaslik uchun haydash",
        "Sovg'asini olish",
        "Ishini ko'paytirish"
      ],
      "correct": 0
    },
    {
      "q": "Har bir so'zidan nima terib olish kerak?",
      "options": [
        "Ma'nolar",
        "Toshlar",
        "Pul",
        "Qog'oz"
      ],
      "correct": 0
    },
    {
      "q": "Keksalarning yuzidan nima yog'ilib turadi deyiladi?",
      "options": [
        "Nur",
        "Qor",
        "Chang",
        "Suv"
      ],
      "correct": 0
    },
    {
      "q": "She'r qaysi qadriyatga bag'ishlangan?",
      "options": [
        "Keksalarga hurmat",
        "Ochko'zlik",
        "Yolg'on",
        "Hasad"
      ],
      "correct": 0
    },
    {
      "q": "She'rning xulosasi nima?",
      "options": [
        "Keksalarni e'zozlab, nasihatiga amal qilish kerak",
        "Keksalardan uzoq yurish kerak",
        "Duoni qadrlamaslik kerak",
        "Hurmat faqat so'zda bo'ladi"
      ],
      "correct": 0
    }
  ],
  "halol-savdogar": [
    {
      "q": "Hikoya kim haqida?",
      "options": [
        "Abu Rayhon Beruniy",
        "Karim polvon",
        "Rafiq",
        "Bog'bon"
      ],
      "correct": 0
    },
    {
      "q": "Beruniy qayerda tug'ilgani aytiladi?",
      "options": [
        "Xorazmning Kot shahrida",
        "Toshkentda",
        "Samarqand bozorida",
        "Farg'ona vodiysida"
      ],
      "correct": 0
    },
    {
      "q": "Beruniy yoshligida nimalarga qiziqqan?",
      "options": [
        "Ilm-fan, matematika, astronomiya, geografiya va tabiiyotga",
        "Faqat savdoga",
        "Faqat ot chopishga",
        "Faqat o'yinga"
      ],
      "correct": 0
    },
    {
      "q": "Beruniy qaysi tillarni o'rgangan?",
      "options": [
        "Qadimgi xorazm, turkiy, fors va arab tillarini",
        "Faqat rus tilini",
        "Faqat ingliz tilini",
        "Hech bir tilni"
      ],
      "correct": 0
    },
    {
      "q": "Hikoyada Abu Nasr tepalik ustida nima bilan mashg'ul?",
      "options": [
        "Usturlob o'lchash bilan",
        "Uloq chopish bilan",
        "Non yopish bilan",
        "Daryo tozalash bilan"
      ],
      "correct": 0
    },
    {
      "q": "Bola ustozdan nimani so'raydi?",
      "options": [
        "Usturlob nima ekanini",
        "Oltin qayerdaligini",
        "Ot qayerdaligini",
        "Qor qachon yog'ishini"
      ],
      "correct": 0
    },
    {
      "q": "Abu Nasr usturlob bilan nimani kuzatishini aytadi?",
      "options": [
        "Quyosh va yulduzlar harakatini",
        "Daryo oqimini",
        "Uloqni",
        "Bozor narxini"
      ],
      "correct": 0
    },
    {
      "q": "Bolaning ismi nima?",
      "options": [
        "Muhammad",
        "Rafiq",
        "Karim",
        "Tohir"
      ],
      "correct": 0
    },
    {
      "q": "Abu Nasr bolaga qanday shart qo'yadi?",
      "options": [
        "U bilan shaharga ketishini",
        "Uyga qaytmasligini",
        "Pul topishini",
        "Uloq olib kelishini"
      ],
      "correct": 0
    },
    {
      "q": "Hikoyaning asosiy saboqi nima?",
      "options": [
        "Ilmga qiziqish va ustozga ergashish yuksalishga boshlaydi",
        "Savol bermaslik kerak",
        "Yulduzlarni kuzatish foydasiz",
        "Til o'rganish kerak emas"
      ],
      "correct": 0
    }
  ],
  "mehnat-bahosi": [
    {
      "q": "She'rda bolg'a o'zini qanday tanishtiradi?",
      "options": [
        "Har ishda chaqqonman deb",
        "Dangasaman deb",
        "Suv tashiman deb",
        "Kitob o'qiyman deb"
      ],
      "correct": 0
    },
    {
      "q": "Bolg'a bultur nima qilganini aytadi?",
      "options": [
        "Bir qop yong'oqni chaqqanini",
        "Daryo tozalaganini",
        "Uloq olganini",
        "Oltin topganini"
      ],
      "correct": 0
    },
    {
      "q": "Ombur xato qilsa nima qiladi?",
      "options": [
        "Darrov tuzatadi",
        "Yashirib qo'yadi",
        "Kuladi",
        "Uxlaydi"
      ],
      "correct": 0
    },
    {
      "q": "Ombur qiyshiq mixni nima qiladi?",
      "options": [
        "Sug'urib, to'g'rilab uzatadi",
        "Sindira boshlaydi",
        "Bo'yaydi",
        "Suvga tashlaydi"
      ],
      "correct": 0
    },
    {
      "q": "Panshaxa nimalarni bilishini aytadi?",
      "options": [
        "Xashak yig'ish va sabzi qazishni",
        "Yulduz kuzatishni",
        "Daryo tozalashni",
        "She'r yozishni"
      ],
      "correct": 0
    },
    {
      "q": "Panshaxa uy-ro'zg'orga qanday qarashishini aytadi?",
      "options": [
        "Yoz-u qish ishim beshda deb",
        "Hech ish qilmayman deb",
        "Faqat uxlayman deb",
        "Faqat gapiraman deb"
      ],
      "correct": 0
    },
    {
      "q": "Arra qanday ish bajarishini aytadi?",
      "options": [
        "Shox, daraxt yoki taxtani arralaydi",
        "Choy quyadi",
        "Non yopadi",
        "Suv ichadi"
      ],
      "correct": 0
    },
    {
      "q": "Arra odamlarni nimadan ogohlantiradi?",
      "options": [
        "Qo'l yaralanishidan ehtiyot bo'lishdan",
        "Qor yog'ishidan",
        "Oltin yo'qolishidan",
        "Kitob o'qishdan"
      ],
      "correct": 0
    },
    {
      "q": "She'rda mehnat qurollari qanday ko'rsatilgan?",
      "options": [
        "Har biri foydali ish bajaradigan yordamchi sifatida",
        "Keraksiz buyum sifatida",
        "Yolg'onchi qahramon sifatida",
        "Faqat bezak sifatida"
      ],
      "correct": 0
    },
    {
      "q": "She'rning asosiy saboqi nima?",
      "options": [
        "Har bir mehnat qurolining qadri va vazifasi bor",
        "Mehnat qilish kerak emas",
        "Asboblarni hurmat qilmaslik kerak",
        "Ishni oxiriga yetkazmaslik kerak"
      ],
      "correct": 0
    }
  ],
  "yolgonchi-cho'pon": [
    {
      "q": "Ertakda chol qayerga ketadi?",
      "options": [
        "Qirga, bug'doy o'rish uchun",
        "Bozorga",
        "Shaharga",
        "Daryoga"
      ],
      "correct": 0
    },
    {
      "q": "Kampir ovqatni kim orqali boboga yuboradi?",
      "options": [
        "Qo'shni o'g'li Tohir orqali",
        "Karim orqali",
        "Rafiq orqali",
        "Savdogar orqali"
      ],
      "correct": 0
    },
    {
      "q": "Kampir Tohirga boboga nima deb aytishni tayinlaydi?",
      "options": [
        "Bir butun oy, o'n ikki yulduz",
        "Yarim oy, oltita yulduz",
        "Oltin hamyon",
        "Mehr urug'i"
      ],
      "correct": 0
    },
    {
      "q": "Tohir yo'lda nima qiladi?",
      "options": [
        "Tugunni yechib ovqatdan yeydi",
        "Ovqatni ko'paytiradi",
        "Uyga qaytadi",
        "Bobo bilan keladi"
      ],
      "correct": 0
    },
    {
      "q": "Tugunda nima bor edi?",
      "options": [
        "Bir qatlama va chuchvaralar",
        "Oltin va kumush",
        "Kitob va daftar",
        "Meva urug'lari"
      ],
      "correct": 0
    },
    {
      "q": "Bobo Tohirga kampirga nima deb aytishni buyuradi?",
      "options": [
        "Yarimta oy, oltita yulduz",
        "Bir butun oy, o'n ikki yulduz",
        "Hech narsa qolmadi",
        "Qor yog'di"
      ],
      "correct": 0
    },
    {
      "q": "Kampir 'yarim oy' nimani anglatishini tushuntiradi?",
      "options": [
        "Yarimta qatlama",
        "Yarimta non",
        "Yarimta oy",
        "Yarimta hamyon"
      ],
      "correct": 0
    },
    {
      "q": "Oltita yulduz nimani bildiradi?",
      "options": [
        "Olti dona chuchvara",
        "Olti bola",
        "Olti ot",
        "Olti kitob"
      ],
      "correct": 0
    },
    {
      "q": "Tohirning asosiy xatosi nima?",
      "options": [
        "Yeganini tan olmay, yolg'on gapirishi",
        "Ovqat olib borgani",
        "Tez yurgani",
        "Boboni ko'rgani"
      ],
      "correct": 0
    },
    {
      "q": "Ertakning saboqi nima?",
      "options": [
        "To'g'ri gapirish kerak",
        "Yolg'on foyda keltiradi",
        "Ovqatni yashirish kerak",
        "Tayinlangan gapni unutish kerak"
      ],
      "correct": 0
    }
  ],
  "ota-nasihati": [
    {
      "q": "Bog'bonning farzandi qanday tasvirlanadi?",
      "options": [
        "Yakka-yu yagona va juda tantiq",
        "Juda mehnatkash",
        "Keksa",
        "Savdogar"
      ],
      "correct": 0
    },
    {
      "q": "Bog'bon bolasiga tanbeh bersa, xotini nima deydi?",
      "options": [
        "Katta bo'lsa, esi kirib qoladi deydi",
        "Darrov jazolang deydi",
        "Bog'ga olib boring deydi",
        "Kitob bering deydi"
      ],
      "correct": 0
    },
    {
      "q": "Bog'bon xotiniga fikrini tushuntirish uchun nima ekadi?",
      "options": [
        "Ikkita bir xil nihol",
        "Bir dona gul",
        "Uchta qovun",
        "O'n ikki daraxt"
      ],
      "correct": 0
    },
    {
      "q": "Bog'bon nihollarga qanday parvarish qiladi?",
      "options": [
        "Bir xil o'g'it soladi",
        "Faqat bittasiga suv beradi",
        "Ikkalasini ham tashlab qo'yadi",
        "Ikkalasini kesib tashlaydi"
      ],
      "correct": 0
    },
    {
      "q": "Bog'bon nihollardan biriga nima qiladi?",
      "options": [
        "Ortiqcha shoxlarini kesadi",
        "Ildizini uzadi",
        "Suv bermaydi",
        "Mevasini yashiradi"
      ],
      "correct": 0
    },
    {
      "q": "Kesib turilgan nihol qanday daraxt bo'ladi?",
      "options": [
        "Baland, chiroyli va serhosil",
        "Qiyshiq va foydasiz",
        "Qurib qolgan",
        "Mevasiz buta"
      ],
      "correct": 0
    },
    {
      "q": "Tegilmagan nihol qanday bo'ladi?",
      "options": [
        "Shoxlari tarvaqaylab, qiyshiq va kam mevali",
        "Eng serhosil",
        "To'g'ri va baland",
        "Butunlay oltin"
      ],
      "correct": 0
    },
    {
      "q": "Bog'bon bu misol bilan nimani tushuntiradi?",
      "options": [
        "To'g'ri tarbiyani bolalikdan qilish kerakligini",
        "Daraxt kesish yomonligini",
        "O'g'it kerak emasligini",
        "Meva yeyish zararli ekanini"
      ],
      "correct": 0
    },
    {
      "q": "Asarda nihol nimaga o'xshatiladi?",
      "options": [
        "Bola tarbiyasiga",
        "Bozorga",
        "Daryoga",
        "Oltin hamyonga"
      ],
      "correct": 0
    },
    {
      "q": "Asarning asosiy saboqi nima?",
      "options": [
        "Farzandni vaqtida to'g'ri tarbiyalash zarur",
        "Bolani hech qachon tarbiyalamaslik kerak",
        "Ortiqcha shoxlar foydali",
        "Tantiqlik yaxshi fazilat"
      ],
      "correct": 0
    }
  ],
  "kitob-dosti": [
    {
      "q": "She'rda kitob sevgan inson uchun kitob nima deyiladi?",
      "options": [
        "Xazina",
        "Yuk",
        "Oddiy qog'oz",
        "O'yinchoq"
      ],
      "correct": 0
    },
    {
      "q": "Kitobsiz uy qanday tasvirlanadi?",
      "options": [
        "Zim-ziyo, tuynuk va eshigi yo'qdek",
        "Nurli saroy",
        "Bog'",
        "Dengiz"
      ],
      "correct": 0
    },
    {
      "q": "Kitobsizlik shiori nimaga tenglashtiriladi?",
      "options": [
        "Hammaga bir qullikka",
        "Ozodlikka",
        "Quvonchga",
        "G'alabaga"
      ],
      "correct": 0
    },
    {
      "q": "Kitobga oshno bo'lgan kishi nimani farqlaydi?",
      "options": [
        "Yaxshi-yomonni",
        "Faqat ranglarni",
        "Faqat narxlarni",
        "Faqat shamolni"
      ],
      "correct": 0
    },
    {
      "q": "Kitobga oshno inson qanday ish ko'radi?",
      "options": [
        "Aql bilan",
        "Jahl bilan",
        "Tasodifan",
        "Qo'rqib"
      ],
      "correct": 0
    },
    {
      "q": "She'r o'quvchini nima bilan oshno bo'lishga chaqiradi?",
      "options": [
        "Kitob bilan",
        "Yolg'on bilan",
        "Dangasalik bilan",
        "Hasad bilan"
      ],
      "correct": 0
    },
    {
      "q": "She'rda zukkolik qanday ataladi?",
      "options": [
        "Ulug' qurol",
        "Og'ir yuk",
        "Keraksiz gap",
        "Bo'sh sandiq"
      ],
      "correct": 0
    },
    {
      "q": "Kitobni nimadek e'zoz qilish aytiladi?",
      "options": [
        "Non kabi",
        "Tosh kabi",
        "O'yinchoq kabi",
        "Pul kabi"
      ],
      "correct": 0
    },
    {
      "q": "Kitob nimaga yetaklaydi?",
      "options": [
        "Ilmga",
        "Yolg'onga",
        "Dangasalikka",
        "Adashishga"
      ],
      "correct": 0
    },
    {
      "q": "She'rning asosiy xulosasi nima?",
      "options": [
        "Kitob insonni zukko va yorqin yo'lga boshlaydi",
        "Kitob kerak emas",
        "Savodsizlik foydali",
        "Kitobsiz uy eng yaxshi"
      ],
      "correct": 0
    }
  ],
  "mardlik-qissasi": [
    {
      "q": "She'rda kimlar o'zligini anglay oladi?",
      "options": [
        "Kitobni do'st bilganlar",
        "Kitobdan qochganlar",
        "Yolg'onchilar",
        "Dangasalar"
      ],
      "correct": 0
    },
    {
      "q": "Kitobni do'st bilganlar qanday yo'lni tanlay biladi?",
      "options": [
        "Baxt yo'lini",
        "Yolg'on yo'lini",
        "Adashgan yo'lni",
        "Qo'rquv yo'lini"
      ],
      "correct": 0
    },
    {
      "q": "She'rda ular nimani suyar deyiladi?",
      "options": [
        "Gul-u yaprog'ini",
        "Hasadni",
        "Shovqinni",
        "Oltinni"
      ],
      "correct": 0
    },
    {
      "q": "Kitobni do'st bilganlar ona tili haqida nima deydi?",
      "options": [
        "Ona tilim manim der",
        "Kerak emas der",
        "Begona der",
        "Unut der"
      ],
      "correct": 0
    },
    {
      "q": "Ona tilini pastlatsa, kim deb biladi?",
      "options": [
        "G'anim",
        "Do'st",
        "Ustoz",
        "Mehmon"
      ],
      "correct": 0
    },
    {
      "q": "Kitobni do'st bilganlarning e'tiqodi qanday?",
      "options": [
        "Adashmas",
        "Adashgan",
        "Yo'q",
        "Sust"
      ],
      "correct": 0
    },
    {
      "q": "Ularning faxri nima bo'ladi?",
      "options": [
        "Millatning faxri",
        "Zalolat",
        "Maqtanchoqlik",
        "Qo'rquv"
      ],
      "correct": 0
    },
    {
      "q": "She'rda mardlik qayerga xos deyiladi?",
      "options": [
        "Fe'liga",
        "Uyqusiga",
        "Savdosiga",
        "Hasadiga"
      ],
      "correct": 0
    },
    {
      "q": "Kitobni do'st bilganlar qanday inson sifatida ko'rsatiladi?",
      "options": [
        "Asl vatanparvar",
        "Loqayd",
        "Yolg'onchi",
        "Ochko'z"
      ],
      "correct": 0
    },
    {
      "q": "She'rning asosiy g'oyasi nima?",
      "options": [
        "Kitob insonni vatanparvar, mard va ongli qiladi",
        "Kitob insonni zaif qiladi",
        "Kitob faqat bezak",
        "Kitobni unutish kerak"
      ],
      "correct": 0
    }
  ],
  "navruz-bayrami": [
    {
      "q": "Badavlat odam tushida qayerda yurganini ko'radi?",
      "options": [
        "Bozorda",
        "Daladan",
        "Maktabda",
        "Daryoda"
      ],
      "correct": 0
    },
    {
      "q": "Do'konda unga kim peshvoz chiqadi?",
      "options": [
        "Sotuvchi chol",
        "Yosh bola",
        "Bog'bon",
        "Chavandoz"
      ],
      "correct": 0
    },
    {
      "q": "Badavlat odam o'zini qanday tanishtiradi?",
      "options": [
        "Boy-badavlatman, hech narsaga hojatim yo'q deb",
        "Kambag'alman deb",
        "Ustozman deb",
        "Yo'qolib qoldim deb"
      ],
      "correct": 0
    },
    {
      "q": "U aslida qaysi narsalar kerakligini aytadi?",
      "options": [
        "Do'stlik, muhabbat va oqibat",
        "Oltin, kumush va taxt",
        "Non, suv va kiyim",
        "Ot, egar va taqa"
      ],
      "correct": 0
    },
    {
      "q": "Sotuvchi chol bu narsalarni qanday deb ta'riflaydi?",
      "options": [
        "Juda arzon, ammo o'ta kamyob",
        "Juda qimmat va keraksiz",
        "Faqat bozorda topiladi",
        "Hech kimga kerak emas"
      ],
      "correct": 0
    },
    {
      "q": "Chol qutichadan nima chiqaradi?",
      "options": [
        "Uch dona urug'",
        "Uch dona tanga",
        "Uchta kitob",
        "Uchta qush"
      ],
      "correct": 0
    },
    {
      "q": "Chol urug'larni nima urug'lari deb aytadi?",
      "options": [
        "Mehr-oqibat va muhabbat urug'lari",
        "Tarvuz urug'lari",
        "Bug'doy urug'lari",
        "Daraxt urug'lari"
      ],
      "correct": 0
    },
    {
      "q": "Urug'larni qanday ekish kerakligi aytiladi?",
      "options": [
        "Bir qultum suv bilan yutib yuborish kerak",
        "Yerga chuqur ko'mish kerak",
        "Bozorga sotish kerak",
        "Qutida saqlash kerak"
      ],
      "correct": 0
    },
    {
      "q": "Uyg'ongach badavlat odam kimni ziyorat qilishga jazm qiladi?",
      "options": [
        "Keksa onasini",
        "Savdogarni",
        "Qo'shnisini",
        "Chavandozni"
      ],
      "correct": 0
    },
    {
      "q": "Rivoyatning asosiy saboqi nima?",
      "options": [
        "Mehr, oqibat va muhabbatni qalbda parvarish qilish kerak",
        "Boylik hamma narsaga yetadi",
        "Do'stlik bozorda sotiladi",
        "Onani ziyorat qilish shart emas"
      ],
      "correct": 0
    }
  ],
  "oltin-tarvuz": [
    {
      "q": "Matnda qaysi hikmatli gap tilga olinadi?",
      "options": [
        "Vatan ostonadan boshlanadi",
        "Yolg'onning umri uzun",
        "Kitob kerak emas",
        "Mehnat og'ir yuk"
      ],
      "correct": 0
    },
    {
      "q": "Buyuk istiqlolimiz bizga nimani o'rgatgani aytiladi?",
      "options": [
        "Ona Vatan qadriga yetish va uni asrab-avaylashni",
        "Vatanni unutishni",
        "Faqat sayohat qilishni",
        "Mehnatdan qochishni"
      ],
      "correct": 0
    },
    {
      "q": "Biz nimani hech qachon yodimizdan chiqarmasligimiz kerak?",
      "options": [
        "Shu Vatan farzandlari ekanimizni",
        "Do'stlarni aldashni",
        "Kitobni tashlashni",
        "Qor yog'ishini"
      ],
      "correct": 0
    },
    {
      "q": "Matnga ko'ra haqiqiy vatanparvar qanday bo'ladi?",
      "options": [
        "Vatani bilan faxrlanadi, tinch va totuv ko'rishni xohlaydi",
        "Vatanni tark etadi",
        "Faqat shior aytadi",
        "Loqayd bo'ladi"
      ],
      "correct": 0
    },
    {
      "q": "Vatanga nisbatan qanday bo'lish kerakligi aytiladi?",
      "options": [
        "Mehribon, mardona va jonkuyar",
        "Loqayd",
        "Hasadgo'y",
        "Yolg'onchi"
      ],
      "correct": 0
    },
    {
      "q": "Vatanga astoydil nima qilish kerak?",
      "options": [
        "Xizmat qilish",
        "Zarar yetkazish",
        "Unutish",
        "Sotish"
      ],
      "correct": 0
    },
    {
      "q": "Vatan tinchligini qanday asrash kerak?",
      "options": [
        "Ko'z qorachig'iday",
        "Oddiy buyumday",
        "E'tiborsiz",
        "Faqat so'zda"
      ],
      "correct": 0
    },
    {
      "q": "Vatanparvarlik matnda qanday tushuntiriladi?",
      "options": [
        "Oddiy shior emas, jonni fido qilish",
        "Faqat bayram kuni aytiladigan so'z",
        "Keraksiz odat",
        "Faqat rasm chizish"
      ],
      "correct": 0
    },
    {
      "q": "Matnning asosiy qadriyati qaysi?",
      "options": [
        "Vatanparvarlik",
        "Ochko'zlik",
        "Yolg'on",
        "Dangasalik"
      ],
      "correct": 0
    },
    {
      "q": "Asosiy xulosa nima?",
      "options": [
        "Vatanni sevish, asrash va unga xizmat qilish kerak",
        "Vatan haqida o'ylamaslik kerak",
        "Tinchlikni qadrlamaslik kerak",
        "Shior yetarli, amal kerak emas"
      ],
      "correct": 0
    }
  ]
};

function applyWorkTests() {
  if (typeof TEXTBOOK_WORKS === 'undefined') return;
  TEXTBOOK_WORKS.forEach((w) => {
    if (WORK_TESTS[w.id]) w.tests = WORK_TESTS[w.id];
  });
}

applyWorkTests();

if (typeof window !== 'undefined') {
  window.WORK_TESTS = WORK_TESTS;
  window.applyWorkTests = applyWorkTests;
}
