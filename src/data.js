export const IP = 'play.gameteam.cz'
export const DISCORD = 'https://discord.gg/gameteam'

export const servers = [
  { id: 'skyblock', name: 'SkyBlock', status: 'live', icon: 'island', color: '#4fd1a5',
    desc: 'Malý ostrov, kus oblohy a nic dalšího. Zbytek si vydělej, postav a rozšiř sám. Nebo s partou.',
    tags: ['Ostrovy', 'Ekonomika', 'Co-op'], version: '1.20+' },
  { id: 'parkour', name: 'Parkour', status: 'live', icon: 'mountain', color: '#38bdf8',
    desc: 'Mapy od rozcvičky po „proč jsem do toho vůbec šel“. Žebříčky ukážou, kdo skáče nejlíp.',
    tags: ['Mapy', 'Žebříčky', 'Checkpointy'], version: '1.20+' },
  { id: 'prison', name: 'Prison', status: 'soon', icon: 'lock', color: '#f59e0b',
    desc: 'Kopej, prodávej, postupuj. Až se dostaneš nahoru, začni znovu s prestiží. Chystáme.',
    tags: ['Doly', 'Ranky', 'Prestiž'], version: '1.20+' },
  { id: 'klasik', name: 'Klasik', status: 'soon', icon: 'pickaxe', color: '#a78bfa',
    desc: 'Čistý survival bez kudrlinek. Pro ty, kdo chtějí jen svět, kámoše a krumpáč. Chystáme.',
    tags: ['Survival', 'Vanilla'], version: '1.20+' },
]

export const steps = [
  { n: '01', k: 'KROK 1 · DISCORD', t: 'Naskoč na Discord', d: 'Tam padne všechno první: whitelist, termín otevření i první eventy.' },
  { n: '02', k: 'KROK 2 · ADRESA', t: 'Zapiš si adresu', d: 'Zatím tě nikam nepustí, ale ať ji máš po ruce, až to půjde.' },
  { n: '03', k: 'KROK 3 · POMOC', t: 'Něco nejde?', d: 'Na hru se zeptej v chatu, na účet nebo reporty založ ticket.' },
]

export const news = [
  { date: '2026-11-01', tag: 'Oznámení', t: 'GameTeam je zpět', d: 'Ano, je to pravda. Dáváme dohromady minihry i partu a jedeme znovu. Všechno nejdřív na Discordu.' },
  { date: '2026-10-24', tag: 'Minihry', t: 'SkyBlock a Parkour jsou skoro hotové', d: 'Ladíme ostrovy, mapy a žebříčky. Až to poběží, jak má, otevřeme whitelist.' },
  { date: '2026-10-12', tag: 'Komunita', t: 'Staří hráči, ozvěte se', d: 'Měl jsi u nás kdysi účet? Napiš na Discord, jméno ti pohlídáme.' },
]

export const features = [
  { i: 'zap', t: 'Rychlé servery', d: 'Dedikovaný hardware a nízký ping pro hráče z CZ a SK.' },
  { i: 'shield', t: 'Férová hra', d: 'Aktivní moderátoři a anti-cheat. Žádný pay-to-win.' },
  { i: 'chat', t: 'Česká komunita', d: 'Hraj s lidmi, kteří mluví tvým jazykem. Eventy každý týden.' },
  { i: 'ticket', t: 'Rychlý support', d: 'Ticket systém na Discordu, odpovíme co nejdřív.' },
  { i: 'trophy', t: 'Žebříčky a soutěže', d: 'Sezónní žebříčky a odměny pro nejlepší hráče.' },
  { i: 'refresh', t: 'Pravidelné updaty', d: 'Nový obsah, opravy a novinky bez zbytečných výpadků.' },
]

export const stats = [
  { v: 24, s: '/7', l: 'Otevřeno' },
  { v: 4, s: '', l: 'Herní módy' },
  { v: 1000, s: '+', l: 'Členů komunity' },
  { v: 0, s: ' ms', l: 'Výmluvy na lag', alt: '<50' },
]

export const faq = [
  { q: 'Kdy se to otevře?', a: 'Datum zatím nemáme. Až bude, napíšeme ho na Discord jako první. Žádné „brzy“ donekonečna.' },
  { q: 'Je to zadarmo?', a: 'Ano. Hrát se dá zadarmo a nic za peníze nebude dávat výhodu ve hře.' },
  { q: 'Na jaké verzi hrajete?', a: 'Java Edition 1.20 a novější. Přesnou verzi doladíme před otevřením whitelistu.' },
  { q: 'Měl jsem u vás účet. Co teď?', a: 'Napiš na Discord. Postup pro staré hráče zveřejníme tam.' },
  { q: 'Kam nahlásím hráče nebo problém?', a: 'Založ ticket na Discordu. Ozve se ti někdo z teamu.' },
]
