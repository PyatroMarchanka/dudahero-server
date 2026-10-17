import { IAppUpdate } from "../../interfaces/appUpdate";

// Feature highlights from pull requests merged into main of the dudar repo.
// Upserted into the app_updates collection on startup (see appUpdatesApi.seedUpdates).
// To announce a new feature, add an entry with a new key here.
export const appUpdatesSeed: IAppUpdate[] = [
  {
    key: "dudar-148",
    date: new Date("2026-10-16"),
    prNumbers: [148],
    translations: {
      en: {
        title: "Music sheets as a real score",
        description: "Sheet music now looks like a conventional score, with proper bars, ties, rests and grace notes.",
      },
      be: {
        title: "Ноты як сапраўдная партытура",
        description: "Ноты цяпер выглядаюць як звычайная партытура: з тактамі, лігамі, паўзамі і фаршлагамі.",
      },
      pl: {
        title: "Nuty jak prawdziwa partytura",
        description: "Nuty wyglądają teraz jak klasyczna partytura, z taktami, łukami, pauzami i ozdobnikami.",
      },
    },
  },
  {
    key: "dudar-146",
    date: new Date("2026-10-16"),
    prNumbers: [146],
    translations: {
      en: {
        title: "In sync with Bluetooth headphones",
        description:
          "The fingering and the notes roll now stay in time with the sound on Bluetooth headphones. A new \"Sound sync\" setting lets you fine-tune it for your device.",
      },
      be: {
        title: "Сінхранізацыя з Bluetooth-навушнікамі",
        description:
          "Аплікатура і стужка нот цяпер не спяшаюцца перад гукам у Bluetooth-навушніках. Новая налада «Сінхранізацыя гуку» дазваляе падладзіць яе пад вашу прыладу.",
      },
      pl: {
        title: "Synchronizacja ze słuchawkami Bluetooth",
        description:
          "Palcowanie i taśma nut nadążają teraz za dźwiękiem w słuchawkach Bluetooth. Nowe ustawienie „Synchronizacja dźwięku” pozwala dopasować je do urządzenia.",
      },
    },
  },
  {
    key: "dudar-141",
    date: new Date("2026-10-15"),
    prNumbers: [141, 143],
    translations: {
      en: {
        title: "Favorite songs",
        description: "Tap the heart next to a song to save it to your favorites and find it quickly in the song list.",
      },
      be: {
        title: "Улюбёныя песні",
        description: "Націсніце сэрца побач з песняй, каб дадаць яе ва ўлюбёныя і хутка знаходзіць у спісе.",
      },
      pl: {
        title: "Ulubione utwory",
        description: "Kliknij serce obok utworu, aby dodać go do ulubionych i szybko znaleźć na liście.",
      },
    },
  },
  {
    key: "dudar-138",
    date: new Date("2026-10-11"),
    prNumbers: [138, 139],
    translations: {
      en: {
        title: "Flute Hero: tin whistle",
        description:
          "A sister site for the tin whistle, with its own flute sound and fingering. Your whistle key is saved to your account. Sopilka and recorder are coming next.",
      },
      be: {
        title: "Flute Hero: ірландскі вістл",
        description:
          "Новы сайт для ірландскага вістла з уласным гучаннем і аплікатурай. Строй вістла захоўваецца ў вашым акаўнце. Хутка дададзім сопілку і блокфлейту.",
      },
      pl: {
        title: "Flute Hero: tin whistle",
        description:
          "Siostrzana strona dla tin whistle z własnym brzmieniem fletu i palcowaniem. Strój fletu zapisuje się na koncie. Wkrótce sopiłka i flet prosty.",
      },
    },
  },
  {
    key: "dudar-137",
    date: new Date("2026-09-25"),
    prNumbers: [137],
    translations: {
      en: {
        title: "Drag the notes roll",
        description: "Drag the scrolling notes left or right to jump to any place in the melody.",
      },
      be: {
        title: "Перацягвайце стужку нот",
        description: "Перацягніце стужку нот улева ці ўправа, каб перайсці ў любое месца мелодыі.",
      },
      pl: {
        title: "Przeciągaj taśmę nut",
        description: "Przeciągnij przewijane nuty w lewo lub w prawo, aby przejść do dowolnego miejsca melodii.",
      },
    },
  },
  {
    key: "dudar-136",
    date: new Date("2026-09-24"),
    prNumbers: [136],
    translations: {
      en: {
        title: "Smoother tempo and loops",
        description:
          "Changing the tempo during playback no longer makes the melody drift, and loops wrap around cleanly. The metronome got its own button.",
      },
      be: {
        title: "Плаўны тэмп і паўторы",
        description:
          "Змена тэмпу падчас прайгравання больш не збівае мелодыю, а паўтор тактаў працуе без збояў. У метранома з'явілася асобная кнопка.",
      },
      pl: {
        title: "Płynniejsze tempo i pętle",
        description:
          "Zmiana tempa w trakcie odtwarzania nie rozjeżdża już melodii, a pętle zapętlają się płynnie. Metronom ma teraz osobny przycisk.",
      },
    },
  },
  {
    key: "dudar-135",
    date: new Date("2026-09-24"),
    prNumbers: [135],
    translations: {
      en: {
        title: "Play tunes from ABC notation",
        description: "Paste a tune in ABC notation and Duda Hero plays it with fingering, just like the songs in the catalog.",
      },
      be: {
        title: "Мелодыі ў нотацыі ABC",
        description: "Устаўце мелодыю ў нотацыі ABC, і Duda Hero прайграе яе з аплікатурай, як песні з каталога.",
      },
      pl: {
        title: "Melodie z notacji ABC",
        description: "Wklej melodię w notacji ABC, a Duda Hero zagra ją z palcowaniem, tak jak utwory z katalogu.",
      },
    },
  },
  {
    key: "dudar-131",
    date: new Date("2026-07-26"),
    prNumbers: [131],
    translations: {
      en: {
        title: "Faster song loading and new tunes",
        description: "Melodies now load straight from the site, so they open faster, and new songs were added.",
      },
      be: {
        title: "Хутчэйшая загрузка і новыя мелодыі",
        description: "Мелодыі цяпер загружаюцца непасрэдна з сайта, таму адкрываюцца хутчэй. Дададзены новыя песні.",
      },
      pl: {
        title: "Szybsze ładowanie i nowe melodie",
        description: "Melodie ładują się teraz bezpośrednio ze strony, więc otwierają się szybciej. Doszły też nowe utwory.",
      },
    },
  },
  {
    key: "dudar-129",
    date: new Date("2026-05-04"),
    prNumbers: [129, 130],
    translations: {
      en: {
        title: "See the first notes before you play",
        description: "The notes roll and fingering show the start of the melody before you press play, so you can get ready.",
      },
      be: {
        title: "Першыя ноты яшчэ да пачатку",
        description: "Стужка нот і аплікатура паказваюць пачатак мелодыі яшчэ да націску «Play», каб вы паспелі падрыхтавацца.",
      },
      pl: {
        title: "Pierwsze nuty przed startem",
        description: "Taśma nut i palcowanie pokazują początek melodii jeszcze przed naciśnięciem „Play”, żebyś mógł się przygotować.",
      },
    },
  },
  {
    key: "dudar-128",
    date: new Date("2026-02-12"),
    prNumbers: [128],
    translations: {
      en: {
        title: "Learning Book",
        description: "Step-by-step lessons on playing the bagpipes, organized by topic.",
      },
      be: {
        title: "Кніга навучання",
        description: "Пакрокавыя ўрокі ігры на дудзе, згрупаваныя па тэмах.",
      },
      pl: {
        title: "Książka do nauki",
        description: "Lekcje gry na dudach krok po kroku, uporządkowane według tematów.",
      },
    },
  },
  {
    key: "dudar-125",
    date: new Date("2025-10-10"),
    prNumbers: [125, 126, 127],
    translations: {
      en: {
        title: "Great Polish Bagpipe",
        description: "The Great Polish Bagpipe joined the collection, with a reworked instrument selector.",
      },
      be: {
        title: "Дуда велькапольская",
        description: "У калекцыі з'явілася дуда велькапольская, а выбар інструмента перароблены.",
      },
      pl: {
        title: "Duda wielkopolska",
        description: "Do kolekcji dołączyła duda wielkopolska, a wybór instrumentu został przebudowany.",
      },
    },
  },
  {
    key: "dudar-121",
    date: new Date("2025-04-20"),
    prNumbers: [121],
    translations: {
      en: {
        title: "Articles",
        description: "Read articles about bagpipes, their history and playing techniques.",
      },
      be: {
        title: "Артыкулы",
        description: "Чытайце артыкулы пра дуды, іх гісторыю і тэхніку ігры.",
      },
      pl: {
        title: "Artykuły",
        description: "Czytaj artykuły o dudach, ich historii i technice gry.",
      },
    },
  },
  {
    key: "dudar-120",
    date: new Date("2025-04-01"),
    prNumbers: [120],
    translations: {
      en: {
        title: "Sheet music view",
        description: "Switch from the bagpipe view to sheet music and follow the melody in notes.",
      },
      be: {
        title: "Прагляд нот",
        description: "Пераключайцеся з выгляду дуды на ноты і сачыце за мелодыяй па нотах.",
      },
      pl: {
        title: "Widok nut",
        description: "Przełącz widok dud na nuty i śledź melodię w zapisie nutowym.",
      },
    },
  },
];
