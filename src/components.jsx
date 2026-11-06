import { useEffect, useRef, useState } from 'react'
import { IP, DISCORD, servers, steps, news, features, stats, faq } from './data.js'
import Icon from './Icon.jsx'
import { useInView, useCountUp } from './hooks.js'
import { useRoute, navigate, scrollToSection } from './route.js'
import { UserMenu } from './Account.jsx'

export function Reveal({ children, delay = 0, as: Tag = 'div', className = '', ...rest }) {
  const [ref, seen] = useInView()
  return (
    <Tag ref={ref} className={'reveal ' + (seen ? 'in ' : '') + className} style={{ transitionDelay: delay + 'ms' }} {...rest}>
      {children}
    </Tag>
  )
}

/* ---------- animated background: floating voxel cubes ---------- */
export function Background() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    const ctx = c.getContext('2d')
    let w, h, raf, mx = 0, my = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      w = c.width = innerWidth * dpr
      h = c.height = innerHeight * dpr
      c.style.width = innerWidth + 'px'
      c.style.height = innerHeight + 'px'
    }
    resize()
    const cols = ['232,176,46', '214,126,24', '150,95,40']
    const P = Array.from({ length: 70 }, () => ({
      x: Math.random(), y: Math.random(), z: Math.random() * 0.9 + 0.1,
      s: Math.random() * 14 + 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.01,
      c: cols[Math.floor(Math.random() * 3)], sq: false,
    }))
    const move = (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5 }
    addEventListener('resize', resize)
    addEventListener('mousemove', move)
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of P) {
        p.y -= 0.00012 * p.z
        p.r += p.vr
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random() }
        const x = (p.x + mx * 0.04 * p.z) * w
        const y = (p.y + my * 0.04 * p.z) * h
        const s = p.s * p.z * dpr
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(p.r)
        ctx.globalAlpha = 0.1 + p.z * 0.35
        if (p.sq) {
          ctx.strokeStyle = 'rgba(' + p.c + ',1)'
          ctx.fillStyle = 'rgba(' + p.c + ',.12)'
          ctx.lineWidth = dpr
          ctx.fillRect(-s / 2, -s / 2, s, s)
          ctx.strokeRect(-s / 2, -s / 2, s, s)
        } else {
          ctx.fillStyle = 'rgba(' + p.c + ',1)'
          ctx.fillRect(-1.5 * dpr, -1.5 * dpr, 3 * dpr, 3 * dpr)
        }
        ctx.restore()
      }
      if (!reduce) raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', resize)
      removeEventListener('mousemove', move)
    }
  }, [])
  return <canvas ref={ref} className="bg-canvas" aria-hidden="true" />
}

/* ---------- navbar ---------- */
const links = [['minihry', 'Minihry'], ['start', 'Jak začít'], ['novinky', 'Novinky'], ['faq', 'FAQ'], ['komunita', 'Komunita'], ['admin', 'AdminTeam']]

const navIcons = { minihry: 'gamepad', start: 'play', novinky: 'news', faq: 'chat', komunita: 'users', admin: 'shield' }

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')
  const [pill, setPill] = useState({ l: 0, w: 0, on: false })
  const [ok, copy] = useCopy()
  const route = useRoute()
  const linksRef = useRef(null)
  useEffect(() => {
    const on = () => {
      setScrolled(scrollY > 20)
      let cur = ''
      for (const [id] of links) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top < innerHeight * 0.4) cur = id
      }
      setActive(route === 'admin' ? 'admin' : (route === 'news' || route === 'post') ? 'novinky' : cur)
    }
    on()
    addEventListener('scroll', on, { passive: true })
    return () => removeEventListener('scroll', on)
  }, [route])
  useEffect(() => {
    const place = () => {
      const el = linksRef.current?.querySelector('a.act')
      if (el && linksRef.current.offsetParent) setPill({ l: el.offsetLeft, w: el.offsetWidth, on: true })
      else setPill((p) => ({ ...p, on: false }))
    }
    place()
    addEventListener('resize', place)
    return () => removeEventListener('resize', place)
  }, [active])
  const go = (id) => (e) => {
    e.preventDefault()
    setOpen(false)
    scrollToSection(id)
  }
  return (
    <header className={'nav ' + (scrolled ? 'scrolled' : '')}>
      <div className="wrap">
        <div className="nav-bar">
          <a href="#top" className="logo" onClick={(e) => { e.preventDefault(); setOpen(false); scrollToSection('top') }}>
            <img className="logo-img" src="logo.png" alt="GameTeam.cz logo" /><span className="logo-t">Game<b>Team</b></span>
          </a>
          <nav className={'links ' + (open ? 'open' : '')} ref={linksRef}>
            <span className="nav-pill" style={{ transform: 'translateX(' + pill.l + 'px)', width: pill.w, opacity: pill.on ? 1 : 0 }} />
            {links.map(([id, l]) => (
              <a key={id} href={id === 'admin' ? '#/admin-team' : '#' + id} className={active === id ? 'act' : ''} onClick={go(id)}>
                <Icon name={navIcons[id]} size={16} className="nl-ico" />{l}
              </a>
            ))}
            <div className="nav-mob">
              <UserMenu onNavigate={() => setOpen(false)} />
              <button className="nav-ip" onClick={copy}><Icon name={ok ? 'check' : 'copy'} size={16} /> {ok ? 'Zkopírováno' : IP}</button>
              <a className="btn btn-primary" href={DISCORD} target="_blank" rel="noreferrer"><Icon name="discord" size={18} /> Přidat se</a>
            </div>
          </nav>
          <div className="nav-act">
            <button className={'nav-ip ' + (ok ? 'ok' : '')} onClick={copy} title="Zkopírovat IP adresu">
              <span className="nip-dot" /><span className="nip-t">{ok ? 'Zkopírováno' : IP}</span><Icon name={ok ? 'check' : 'copy'} size={15} />
            </button>
            <UserMenu />
            <a className="btn btn-sm btn-primary nav-cta" href={DISCORD} target="_blank" rel="noreferrer"><Icon name="discord" size={18} /> Přidat se</a>
          </div>
          <button className={'burger ' + (open ? 'x' : '')} onClick={() => setOpen(!open)} aria-label="Menu"><i /><i /><i /></button>
        </div>
      </div>
    </header>
  )
}

/* ---------- copy IP ---------- */
export function useCopy() {
  const [ok, setOk] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(IP)
    } catch {
      const t = document.createElement('textarea')
      t.value = IP
      document.body.appendChild(t)
      t.select()
      document.execCommand('copy')
      t.remove()
    }
    setOk(true)
    setTimeout(() => setOk(false), 1800)
  }
  return [ok, copy]
}


/* ---------- mega nadpis ---------- */
function MegaTitle() {
  const ref = useRef(null)
  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg')
    el.style.setProperty('--rx', (-y * 12).toFixed(2) + 'deg')
  }
  const reset = () => { ref.current?.style.setProperty('--ry', '0deg'); ref.current?.style.setProperty('--rx', '0deg') }
  const sparks = Array.from({ length: 12 }, (_, i) => ({
    left: (8 + ((i * 37) % 86)) + '%', top: (-30 + ((i * 53) % 150)) + '%',
    d: (1.6 + (i % 5) * 0.5) + 's', dl: ((i * 0.37) % 2.2) + 's', s: 4 + (i % 3) * 3,
  }))
  return (
    <h1 className="mega" aria-label="GameTeam je ZPĚT" ref={ref} onMouseMove={onMove} onMouseLeave={reset}>
      <span className="mega-line" aria-hidden="true">
        {'GameTeam'.split('').map((ch, i) => (
          <span key={i} className={'ltr ' + (i >= 4 ? 'gold' : '')} style={{ '--i': i }}>{ch}</span>
        ))}
      </span>
      <span className="mega-line l2" aria-hidden="true">
        <span className="je">
          {'je'.split('').map((ch, i) => <span key={i} className="ltr" style={{ '--i': 8 + i }}>{ch}</span>)}
        </span>
        <span className="plaque">
          <span className="plaque-bg" />
          <span className="plaque-txt">
            {'ZPĚT'.split('').map((ch, i) => <span key={i} className="pl" style={{ '--i': i }}>{ch}</span>)}
          </span>
          <span className="shine-wrap"><span className="shine" /></span>
          {sparks.map((s, i) => <i key={i} className="spark" style={{ left: s.left, top: s.top, width: s.s, height: s.s, animationDuration: s.d, animationDelay: s.dl }} />)}
        </span>
        <span className="shock" />
      </span>
    </h1>
  )
}

/* ---------- karta servera (ako záznam v Minecraft multiplayeri) ---------- */
function StatusCard() {
  const [ok, copy] = useCopy()
  const ref = useRef(null)
  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--ty', (x * 10).toFixed(2) + 'deg')
    el.style.setProperty('--tx', (-y * 8).toFixed(2) + 'deg')
    el.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(1) + '%')
    el.style.setProperty('--gy', ((y + 0.5) * 100).toFixed(1) + '%')
  }
  const reset = () => { ['--ty', '--tx'].forEach((k) => ref.current?.style.setProperty(k, '0deg')) }
  return (
    <Reveal className="sc-wrap" delay={150}>
      <div className="sc" ref={ref} onMouseMove={onMove} onMouseLeave={reset}>
        <div className="sc-shine" />
        <div className="sc-top">
          <img className="sc-icon" src="logo.png" alt="" />
          <div className="sc-motd">
            <b>GameTeam<em>.cz</em></b>
            <span><i>GameTeam</i> je <i className="w">ZPĚT!</i></span>
          </div>
          <div className="sc-ping" title="Server zatím neběží" aria-label="Offline">
            {[1, 2, 3, 4, 5].map((n) => <i key={n} style={{ height: n * 4 + 2 }} />)}
            <span>OFFLINE</span>
          </div>
        </div>

        <div className="sc-chips">
          <span className="badge prep"><i /> Chystáme to</span>
          <span className="chip"><Icon name="cog" size={14} /> Java 1.20+</span>
          <span className="chip"><Icon name="user" size={14} /> – / –</span>
        </div>

        <div className="sc-label">IP ADRESA</div>
        <div className="sc-slot">
          <code>{IP}<span className="caret" /></code>
          <button className={'btn btn-sm ' + (ok ? 'btn-ok' : 'btn-primary')} onClick={copy}>
            {ok ? <><Icon name="check" size={16} /> Zkopírováno</> : <><Icon name="copy" size={16} /> Kopírovat</>}
          </button>
        </div>

        <div className="sc-wl">
          <div className="sc-wl-head"><span><Icon name="lock" size={15} /> Whitelist</span><b>zatím zavřený</b></div>
          <div className="xp"><div className="xp-fill" /><div className="xp-segs">{Array.from({ length: 14 }, (_, i) => <i key={i} />)}</div></div>
          <small>Otevření oznámíme na Discordu jako první.</small>
        </div>

        <a className="btn btn-primary block sc-play" href={DISCORD} target="_blank" rel="noreferrer">
          <Icon name="play" size={16} /> PLAY <span>na Discordu</span>
        </a>
      </div>
    </Reveal>
  )
}

/* ---------- hero ---------- */
export function Hero() {
  const [ok, copy] = useCopy()
  const go = (id) => (e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }
  const trio = [['users', 'Parta', 'staří známí i nováčci'], ['gamepad', 'Minihry', 'SkyBlock a Parkour'], ['headset', 'Pomoc', 'Discord a tickety']]
  return (
    <section className="hero" id="top">
      <div className="wrap hero-in">
        <div className="hero-copy">
          <a className="status-pill" href="#start" onClick={go('start')}>
            <span className="sp-live"><i /><i /></span>
            <span className="sp-txt"><b>Whitelist</b> a <b>Discord</b> se chystají</span>
            <span className="sp-go"><Icon name="arrow" size={15} /></span>
          </a>
          <MegaTitle />
          <p className="lead">Ano, opravdu. GameTeam se vrací a pořád je to jen a jen <b>Minecraft</b>. První minihry jsou skoro na startu, další přijdou hned za nimi.</p>
          <div className="cta">
            <a className="btn btn-primary" href="#start" onClick={go('start')}>Jak začít <Icon name="arrow" size={18} className="arr" /></a>
            <a className="btn btn-ghost" href="#minihry" onClick={go('minihry')}>Minihry</a>
          </div>
          <div className="trio">
            {trio.map(([i, t, d]) => (
              <div key={t} className="trio-i"><span className="ibox"><Icon name={i} size={22} /></span><div><b>{t}</b><small>{d}</small></div></div>
            ))}
          </div>
        </div>
        <StatusCard />
      </div>
      <div className="scroll-hint" aria-hidden="true"><i /></div>
    </section>
  )
}

export function Marquee() {
  const items = ['ZPĚT', 'MINIHRY', 'SKYBLOCK', 'PARKOUR', 'PRISON', 'KLASIK', 'DISCORD', 'GAMETEAM']
  return (
    <div className="marquee" aria-hidden="true">
      <div className="mq-track">
        {[...items, ...items, ...items, ...items].map((t, i) => <span key={i}>{t}<em>◆</em></span>)}
      </div>
    </div>
  )
}

/* nadpis v štýle Minecraft loga: *zlaté* slová, písmená padajú pri odkrytí */
export function McTitle({ text, as: Tag = 'h2', className = '' }) {
  const [ref, seen] = useInView({ threshold: 0.35 })
  const chars = []
  text.split('*').forEach((seg, pi) => [...seg].forEach((ch) => chars.push({ ch, gold: pi % 2 === 1 })))
  const words = [[]]
  chars.forEach((x) => { if (x.ch === ' ') words.push([]); else words[words.length - 1].push(x) })
  let n = 0
  return (
    <Tag ref={ref} className={'mc-h ' + (seen ? 'in ' : '') + className} aria-label={text.split('*').join('')}>
      {words.filter((w) => w.length).map((w, wi) => (
        <span key={wi} className="mw" aria-hidden="true">
          {w.map((x, i) => <span key={i} className={'ltr' + (x.gold ? ' gold' : '')} style={{ '--i': n++ }}>{x.ch}</span>)}
        </span>
      ))}
    </Tag>
  )
}

export function SectionHead({ k, t, d }) {
  return (
    <div className="sec-head">
      <Reveal><span className="kicker">{k}</span></Reveal>
      <McTitle text={t} />
      {d && <Reveal delay={200}><p>{d}</p></Reveal>}
    </div>
  )
}

/* card with cursor spotlight */
export function Spot({ children, className = '', color, ...p }) {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', e.clientX - r.left + 'px')
    e.currentTarget.style.setProperty('--my', e.clientY - r.top + 'px')
  }
  return (
    <div className={'card spot ' + className} onMouseMove={onMove} style={color ? { '--c': color } : undefined} {...p}>
      {children}
    </div>
  )
}

/* ---------- how to start ---------- */
export function Steps() {
  const [ok, copy] = useCopy()
  const info = [
    { icon: 'discord', c: '#7c8cff' },
    { icon: 'copy', c: '#ffd54a' },
    { icon: 'headset', c: '#4fd1a5' },
  ]
  return (
    <section id="start" className="section">
      <div className="wrap">
        <SectionHead k="JAK NA TO" t="Začni *takhle*" d="Tři kroky a jsi uvnitř, až se brány otevřou." />
        <div className="st-grid">
          <span className="st-path" aria-hidden="true"><i /></span>
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 140} className="st-item">
              <Spot className="st-card" color={info[i].c}>
                <div className="st-top">
                  <span className="st-num"><b>{i + 1}</b></span>
                  <span className="st-ico"><Icon name={info[i].icon} size={26} /></span>
                </div>
                <span className="st-kicker">{s.k}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
                <div className="st-action">
                  {i === 0 && <a className="btn btn-primary" href={DISCORD} target="_blank" rel="noreferrer"><Icon name="discord" size={18} /> Otevřít Discord</a>}
                  {i === 1 && (
                    <button className={'st-ip ' + (ok ? 'ok' : '')} onClick={copy}>
                      <code>{IP}</code><span>{ok ? <><Icon name="check" size={15} /> Hotovo</> : <><Icon name="copy" size={15} /> Kopírovat</>}</span>
                    </button>
                  )}
                  {i === 2 && <a className="btn btn-ghost" href={DISCORD} target="_blank" rel="noreferrer"><Icon name="ticket" size={18} /> Založit ticket</a>}
                </div>
              </Spot>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- servers ---------- */
export function Servers() {
  const [sel, setSel] = useState('all')
  const list = servers.filter((s) => sel === 'all' || (sel === 'live' ? s.status === 'live' : s.status === 'soon'))
  const tabs = [['all', 'Všechny minihry'], ['live', 'První na řadě'], ['soon', 'Chystáme']]
  return (
    <section id="minihry" className="section alt">
      <div className="wrap rel">
        <SectionHead k="MINIHRY" t="Do čeho *skočit*" d="SkyBlock a Parkour jsou první na řadě. Prison a Klasik přijdou hned za nimi." />
        <div className="tabs">
          {tabs.map(([id, l]) => <button key={id} className={sel === id ? 'on' : ''} onClick={() => setSel(id)}>{l}</button>)}
        </div>
        <div className="grid2">
          {list.map((s, i) => (
            <Reveal key={s.id + sel} delay={i * 90}>
              <Spot className="server" color={s.color}>
                <div className="srv-banner" aria-hidden="true"><i /><i /><i /></div>
                <div className="srv-top">
                  <span className="srv-ico"><Icon name={s.icon} size={32} /></span>
                  <span className={'badge ' + (s.status === 'live' ? 'live' : 'soon')}><i />{s.status === 'live' ? 'PRVNÍ NA ŘADĚ' : 'CHYSTÁME'}</span>
                </div>
                <h3>{s.name}</h3>
                <p>{s.desc}</p>
                <div className="tags">{s.tags.map((t) => <span key={t}>{t}</span>)}</div>
                <div className="srv-foot">
                  <span><Icon name="cog" size={15} /> Java {s.version}</span>
                  <a href={DISCORD} target="_blank" rel="noreferrer" className="more">{s.status === 'live' ? 'Hrát' : 'Hlídat'} <Icon name="arrow" size={15} className="arr" /></a>
                </div>
              </Spot>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- manifest: GameTeam je zpět ---------- */
export function Manifesto() {
  return (
    <section id="zpet" className="section manifesto">
      <div className="wrap">
        <div className="mf-lines">
          <McTitle as="p" className="mf mf1" text="Byli jsme tu." />
          <McTitle as="p" className="mf mf2" text="Pak přišlo ticho." />
          <McTitle as="p" className="mf mf3" text="Teď jsme *ZPĚT.*" />
        </div>
        <div className="mf-grid">
          <Reveal className="mf-storywrap">
            <Spot className="mf-story-card">
              <span className="mf-quote" aria-hidden="true">“</span>
              <p>
                GameTeam není další minihry z pásu, co vyrostly přes noc. Je to <mark>parta</mark>, která se v Minecraftu znala,
                hádala o kolo na spawnu a pak se zase smířila u společného hradu.
              </p>
              <p>
                Minihry jsme postavili <mark>znovu od základů</mark>. Pocit, že tu někoho znáš a můžeš se zeptat, jsme nechali.
              </p>
              <div className="mf-chips">
                <span><b>24/7</b> otevřeno, hned jak to doladíme</span>
                <span><b>CZ/SK</b> česky a slovensky</span>
                <span><b>0×</b> pay-to-win</span>
              </div>
            </Spot>
          </Reveal>
          <div className="mf-cols">
            {[
              { t: 'Co zůstalo', k: 'OLD', icon: 'users', c: '#ffd54a', items: [['users', 'čeština a lidi, co se znají'], ['shield', 'žádné pay-to-win'], ['chat', 'ptát se je dovoleno']] },
              { t: 'Co je nové', k: 'NEW', icon: 'zap', c: '#4fd1a5', items: [['cube', 'minihry postavené od nuly'], ['discord', 'whitelist a tickety přes Discord'], ['trophy', 'žebříčky a eventy od prvního dne']] },
            ].map((col, ci) => (
              <Reveal key={col.t} delay={150 + ci * 130}>
                <Spot className="mf-col" color={col.c}>
                  <div className="mf-col-head">
                    <span className="mf-col-ico"><Icon name={col.icon} size={22} /></span>
                    <h3>{col.t}</h3>
                    <em>{col.k === 'OLD' ? 'tradice' : 'novinka'}</em>
                  </div>
                  <ul className="mf-list">
                    {col.items.map(([ic, tx], i) => (
                      <li key={tx} style={{ '--i': i }}><span><Icon name={ic} size={17} /></span>{tx}</li>
                    ))}
                  </ul>
                </Spot>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- roadmapa ---------- */
const road = [
  { s: 'done', t: 'Návrat oznámen', d: 'GameTeam je zpět. Tohle už máš za sebou.' },
  { s: 'now', t: 'Whitelist a Discord', d: 'Právě to dolaďujeme. Tady se dozvíš všechno první.' },
  { s: 'next', t: 'SkyBlock a Parkour', d: 'První dvě minihry. Otevřeme je spolu.' },
  { s: 'next', t: 'Prison', d: 'Přijde, jakmile budou první dvě stát na nohou.' },
  { s: 'next', t: 'Klasik', d: 'Čistý survival na závěr. Stejně si ho nenecháš ujít.' },
]
export function Roadmap() {
  return (
    <section id="cesta" className="section alt">
      <div className="wrap narrow">
        <SectionHead k="PLÁN" t="Cesta *zpátky*" />
        <div className="road">
          {road.map((r, i) => (
            <Reveal key={r.t} delay={i * 90} className={'road-i ' + r.s}>
              <span className="road-dot">{r.s === 'done' ? <Icon name="check" size={16} /> : r.s === 'now' ? <i /> : null}</span>
              <div><h3>{r.t}{r.s === 'now' && <em>teď</em>}</h3><p>{r.d}</p></div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- news ---------- */
export function News() {
  return (
    <section id="novinky" className="section">
      <div className="wrap">
        <SectionHead k="NOVINKY" t="Co je *nového*" />
        <div className="news">
          {news.map((n, i) => (
            <Reveal key={n.t} delay={i * 110}>
              <Spot className="news-i">
                <div className="news-meta"><span className="tagp">{n.tag}</span><time>{new Date(n.date).toLocaleDateString('cs-CZ')}</time></div>
                <h3>{n.t}</h3><p>{n.d}</p><span className="more">Číst dál <Icon name="arrow" size={15} className="arr" /></span>
              </Spot>
            </Reveal>
          ))}
        </div>
        <Reveal className="center"><a className="btn btn-ghost" href={DISCORD} target="_blank" rel="noreferrer">Víc novinek na Discordu</a></Reveal>
      </div>
    </section>
  )
}

/* ---------- faq ---------- */
export function FAQ() {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="section alt">
      <div className="wrap narrow">
        <SectionHead k="FAQ" t="Ptáš se, my *odpovídáme*" />
        <div className="faq">
          {faq.map((f, i) => (
            <Reveal key={f.q} delay={i * 60} className={'faq-i ' + (open === i ? 'open' : '')}>
              <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}><span>{f.q}</span><i>+</i></button>
              <div className="faq-a"><div><p>{f.a}</p></div></div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- discord cta ---------- */
export function Community() {
  const [ok, copy] = useCopy()
  return (
    <section id="komunita" className="section">
      <div className="wrap">
        <Reveal className="big-cta">
          <div className="glow" />
          <span className="kicker">NEZMEŠKEJ TO</span>
          <McTitle text="Buď u toho *od začátku*" />
          <p>Na Discordu padne první informace o whitelistu i o dni otevření. Kdo tam bude od začátku, ten stojí ve frontě jako první.</p>
          <div className="cta center">
            <a className="btn btn-primary btn-lg" href={DISCORD} target="_blank" rel="noreferrer"><Icon name="gamepad" size={20} /> Na Discord</a>
            <button className="btn btn-ghost btn-lg" onClick={copy}>{ok ? <><Icon name="check" size={18} /> Zkopírováno</> : <><Icon name="copy" size={18} /> Kopírovat IP: {IP}</>}</button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function Footer() {
  const go = (id) => (e) => { e.preventDefault(); scrollToSection(id) }
  const nav = [['home', 'Home', 'top'], ['gamepad', 'Minihry', 'minihry'], ['headset', 'Support', 'faq'], ['news', 'Novinky', 'novinky'], ['shield', 'AdminTeam', 'admin']]
  const socials = [
    { i: 'discord', t: 'Discord', s: 'discord.gg/gameteam', h: DISCORD, c: '#7c8cff' },
    { i: 'instagram', t: 'Instagram', s: '@gameteam.cz', h: 'https://instagram.com/gameteam.cz', c: '#f56c9a' },
    { i: 'facebook', t: 'Facebook', s: 'gameteam.cz', h: 'https://facebook.com/gameteam.cz', c: '#5b9bff' },
  ]
  return (
    <footer className="footer">
      <div className="wrap foot-in">
        <div className="foot-brand">
          <div className="fb-head">
            <img className="logo-img" src="logo.png" alt="GameTeam.cz logo" />
            <div><b>GameTeam</b><span>My jsme byli a vždy budeme Minecraft!</span></div>
          </div>
          <p>CZ/SK Minecraft komunita se zaměřením na minihry, eventy a férovou hru.</p>
          <div className="soc-row">
            {socials.map((s) => (
              <a key={s.t} className="soc-btn" style={{ '--sc': s.c }} href={s.h} target="_blank" rel="noreferrer" aria-label={s.t}><Icon name={s.i} size={20} /></a>
            ))}
            <a className="soc-btn" style={{ '--sc': '#e8b02e' }} href="mailto:info@gameteam.cz" aria-label="E-mail"><Icon name="mail" size={20} /></a>
          </div>
        </div>
        <div>
          <h4>Navigace</h4>
          {nav.map(([i, l, id]) => <a key={l} className="flink" href={id === 'admin' ? '#/admin-team' : '#' + id} onClick={go(id)}><Icon name={i} size={17} />{l}</a>)}
        </div>
        <div>
          <h4>Social</h4>
          {socials.map((s) => (
            <a key={s.t} className="flink two" style={{ '--sc': s.c }} href={s.h} target="_blank" rel="noreferrer">
              <Icon name={s.i} size={19} /><span>{s.t}<small>{s.s}</small></span>
            </a>
          ))}
        </div>
        <div>
          <h4>Kontakt</h4>
          <a className="flink two" style={{ '--sc': '#e8b02e' }} href="mailto:info@gameteam.cz"><Icon name="mail" size={19} /><span>E-mail<small>info@gameteam.cz</small></span></a>
        </div>
      </div>
      <div className="wrap copy">© {new Date().getFullYear()} GameTeam • Všechna práva vyhrazena • S Mojangem ani Microsoftem nemáme nic společného</div>
    </footer>
  )
}
