export const tagMeta = {
  'Oznámení': { c: '#ffd54a', icon: 'zap' },
  'Minihry': { c: '#4fd1a5', icon: 'gamepad' },
  'Komunita': { c: '#8f9cff', icon: 'users' },
}

export const posts = [
  {
    slug: 'gameteam-je-zpet', date: '2026-11-01', tag: 'Oznámení',
    title: 'GameTeam je zpět',
    excerpt: 'Ano, je to pravda. Dáváme dohromady minihry i partu a jedeme znovu. Všechno nejdřív na Discordu.',
    body: [
      { t: 'p', x: 'Ano, čteš dobře. GameTeam se vrací. Po tichu, které trvalo až příliš dlouho, dáváme dohromady minihry, tým i komunitu a jedeme znovu.' },
      { t: 'quote', x: 'Byli jsme tu. Pak přišlo ticho. Teď jsme zpět.' },
      { t: 'h', x: 'Co se děje právě teď' },
      { t: 'p', x: 'Ladíme první minihry, stavíme whitelist a připravujeme Discord tak, aby tam každý našel odpověď na to, co ho zajímá. Žádný chaos, žádné „brzy™“ bez konce.' },
      { t: 'list', items: ['whitelist a Discord se chystají', 'SkyBlock a Parkour jsou první na řadě', 'Prison a Klasik přijdou hned za nimi'] },
      { t: 'h', x: 'Kde se dozvíš novinky' },
      { t: 'p', x: 'Všechno důležité padne nejdřív na našem Discordu. Kdo tam bude od začátku, ten se o otevření dozví jako první.' },
    ],
  },
  {
    slug: 'skyblock-a-parkour-jsou-skoro-hotove', date: '2026-10-24', tag: 'Minihry',
    title: 'SkyBlock a Parkour jsou skoro hotové',
    excerpt: 'Ladíme ostrovy, mapy a žebříčky. Až to poběží, jak má, otevřeme whitelist.',
    body: [
      { t: 'p', x: 'První dvě minihry mají za sebou nejhorší část. Zbývá doladit detaily, které se na první pohled neřeší, ale hráč je pozná okamžitě.' },
      { t: 'h', x: 'SkyBlock' },
      { t: 'p', x: 'Malý ostrov, kus oblohy a nic dalšího. Zbytek si vyděláš, postavíš a rozšíříš sám. Nebo s partou. Teď ladíme ekonomiku, aby se vyplatilo hrát pořád, ne jen první večer.' },
      { t: 'h', x: 'Parkour' },
      { t: 'p', x: 'Mapy od rozcvičky po „proč jsem do toho vůbec šel“. Žebříčky ukážou, kdo skáče nejlíp, a checkpointy tě ušetří nervů.' },
      { t: 'quote', x: 'Whitelist otevřeme ve chvíli, kdy bude fungovat všechno, co slíbíme. Ne dřív.' },
    ],
  },
  {
    slug: 'stari-hraci-ozvete-se', date: '2026-10-12', tag: 'Komunita',
    title: 'Staří hráči, ozvěte se',
    excerpt: 'Měl jsi u nás kdysi účet? Napiš na Discord, jméno ti pohlídáme.',
    body: [
      { t: 'p', x: 'GameTeam nikdy nebyl o serveru, ale o lidech. Proto bychom rádi, aby se ti, kdo tu kdysi hráli, mohli vrátit, ať už jen koukat, nebo zase stavět.' },
      { t: 'h', x: 'Jak na to' },
      { t: 'list', items: ['naskoč na náš Discord', 'napiš, jak ses jmenoval ve hře', 'zbytek vyřešíme spolu'] },
      { t: 'p', x: 'Postup pro staré hráče zveřejníme na Discordu. Zatím nám stačí, že se ozveš.' },
    ],
  },
  {
    slug: 'jak-bude-fungovat-whitelist', date: '2026-10-05', tag: 'Oznámení',
    title: 'Jak bude fungovat whitelist',
    excerpt: 'Proč whitelist, kdy se otevře a kde se o něm dozvíš první.',
    body: [
      { t: 'p', x: 'Whitelist není překážka, ale pojistka. Pomáhá nám držet minihry férové a komunitu příjemnou, zvlášť hned po otevření, kdy je největší nápor.' },
      { t: 'h', x: 'Co to znamená pro tebe' },
      { t: 'list', items: ['všechno proběhne přes Discord', 'bez zbytečných formulářů', 'nic nebude za peníze'] },
      { t: 'p', x: 'Přesné datum zatím nemáme, a nechceme ti ho slibovat naslepo. Jakmile bude jasné, napíšeme ho na Discord jako první.' },
    ],
  },
  {
    slug: 'prison-a-klasik-pripravujeme', date: '2026-09-28', tag: 'Minihry',
    title: 'Prison a Klasik: co chystáme dál',
    excerpt: 'Po SkyBlocku a Parkouru přijde těžba a čistý survival. Malý pohled do zákulisí.',
    body: [
      { t: 'p', x: 'Zatímco první dvě minihry dostávají poslední úpravy, v zákulisí už rostou další dvě.' },
      { t: 'h', x: 'Prison' },
      { t: 'p', x: 'Kopej, prodávej, postupuj. Až se dostaneš nahoru, začni znovu s prestiží.' },
      { t: 'h', x: 'Klasik' },
      { t: 'p', x: 'Čistý survival bez kudrlinek. Pro ty, kdo chtějí jen svět, kámoše a krumpáč.' },
      { t: 'quote', x: 'Nejdřív první dvě na nohou, pak další. Radši méně, ale pořádně.' },
    ],
  },
]

export const readMin = (p) => Math.max(1, Math.ceil(p.body.map((b) => (b.x || b.items.join(' '))).join(' ').split(/\s+/).length / 120))
