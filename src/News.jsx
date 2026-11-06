import { useState } from 'react'
import Icon from './Icon.jsx'
import { Reveal, McTitle, SectionHead } from './components.jsx'
import { posts, tagMeta, readMin } from './posts.js'
import { navigate, useSlug } from './route.js'
import { DISCORD } from './data.js'

const fmt = (d) => new Date(d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtShort = (d) => new Date(d).toLocaleDateString('cs-CZ')

function Cover({ p, big }) {
  const m = tagMeta[p.tag] || tagMeta['Oznámení']
  return (
    <div className={'nw-cover ' + (big ? 'big' : '')} style={{ '--c': m.c }} aria-hidden="true">
      <span className="nw-px" />
      <Icon name={m.icon} size={big ? 120 : 72} className="nw-cico" />
    </div>
  )
}

function PostCard({ p, feature, delay = 0 }) {
  const m = tagMeta[p.tag] || tagMeta['Oznámení']
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', e.clientX - r.left + 'px')
    e.currentTarget.style.setProperty('--my', e.clientY - r.top + 'px')
  }
  return (
    <Reveal delay={delay} className={'nw-wrap ' + (feature ? 'feature' : '')}>
      <a className="nw-card" href={'#/novinky/' + p.slug} style={{ '--c': m.c }} onMouseMove={onMove}>
        <div className="nw-top">
          <Cover p={p} big={feature} />
          <span className="nw-tag"><i />{p.tag}</span>
          <span className="nw-date"><Icon name="calendar" size={13} /> {fmtShort(p.date)}</span>
        </div>
        <div className="nw-body">
          <h3>{p.title}</h3>
          <p>{p.excerpt}</p>
          <div className="nw-foot">
            <span className="nw-min"><Icon name="clock" size={14} /> {readMin(p)} min čtení</span>
            <b className="nw-more">Číst dál <Icon name="arrow" size={15} className="arr" /></b>
          </div>
        </div>
      </a>
    </Reveal>
  )
}

export function News() {
  const latest = posts.slice(0, 3)
  return (
    <section id="novinky" className="section">
      <div className="wrap">
        <SectionHead k="NOVINKY" t="Co je *nového*" d="Poslední zprávy z GameTeamu. Všechno ostatní najdeš v archivu." />
        <div className="nw-grid">
          {latest.map((p, i) => <PostCard key={p.slug} p={p} feature={i === 0} delay={i * 110} />)}
        </div>
        <Reveal className="center nw-all">
          <a className="btn btn-ghost" href="#/novinky">Všechny novinky <Icon name="arrow" size={16} className="arr" /></a>
        </Reveal>
      </div>
    </section>
  )
}

export function NewsList() {
  const [tag, setTag] = useState('Vše')
  const tags = ['Vše', ...Object.keys(tagMeta)]
  const list = posts.filter((p) => tag === 'Vše' || p.tag === tag)
  return (
    <section className="nw-page">
      <div className="wrap">
        <button className="at-back" onClick={() => navigate('home')}><Icon name="arrow" size={16} className="at-back-ico" /> Zpět na hlavní stránku</button>
        <div className="at-head">
          <span className="kicker">ARCHIV</span>
          <McTitle as="h1" className="at-title" text="Nov*inky*" />
          <Reveal delay={200}><p>Všechno, co se děje kolem GameTeamu. Nejnovější nahoře.</p></Reveal>
        </div>
        <div className="tabs nw-tabs">
          {tags.map((t) => <button key={t} className={tag === t ? 'on' : ''} onClick={() => setTag(t)}>{t}</button>)}
        </div>
        <div className="nw-list">
          {list.map((p, i) => <PostCard key={p.slug + tag} p={p} delay={i * 90} />)}
          {!list.length && <p className="nw-empty">V téhle kategorii zatím nic není.</p>}
        </div>
      </div>
    </section>
  )
}

export function Post() {
  const slug = useSlug()
  const idx = posts.findIndex((p) => p.slug === slug)
  const [copied, setCopied] = useState(false)
  if (idx < 0) {
    return (
      <section className="nw-page"><div className="wrap narrow center">
        <McTitle as="h1" className="at-title" text="Článek *nenalezen*" />
        <p style={{ margin: '20px 0 30px' }}>Takový článek tu není. Možná byl přesunut.</p>
        <a className="btn btn-primary" href="#/novinky">Všechny novinky</a>
      </div></section>
    )
  }
  const p = posts[idx], m = tagMeta[p.tag] || tagMeta['Oznámení']
  const prev = posts[idx + 1], next = posts[idx - 1]
  const share = async () => {
    try { await navigator.clipboard.writeText(location.href) } catch {  }
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }
  const more = posts.filter((x) => x.slug !== p.slug).slice(0, 2)
  return (
    <article className="nw-page post" style={{ '--c': m.c }} key={p.slug}>
      <div className="wrap narrow">
        <button className="at-back" onClick={() => navigate('news')}><Icon name="arrow" size={16} className="at-back-ico" /> Všechny novinky</button>
        <header className="po-head">
          <div className="po-meta">
            <span className="nw-tag"><i />{p.tag}</span>
            <span><Icon name="calendar" size={14} /> {fmt(p.date)}</span>
            <span><Icon name="clock" size={14} /> {readMin(p)} min čtení</span>
          </div>
          <McTitle as="h1" className="po-title" text={p.title} />
        </header>
        <Reveal><Cover p={p} big /></Reveal>
        <div className="po-body">
          {p.body.map((b, i) => {
            if (b.t === 'h') return <Reveal key={i} as="h2" className="po-h">{b.x}</Reveal>
            if (b.t === 'quote') return <Reveal key={i} as="blockquote" className="po-quote">{b.x}</Reveal>
            if (b.t === 'list') return <Reveal key={i} as="ul" className="po-list">{b.items.map((it) => <li key={it}>{it}</li>)}</Reveal>
            return <Reveal key={i} as="p" className="po-p">{b.x}</Reveal>
          })}
        </div>
        <div className="po-actions">
          <button className="btn btn-ghost" onClick={share}><Icon name={copied ? 'check' : 'link'} size={17} /> {copied ? 'Odkaz zkopírován' : 'Kopírovat odkaz'}</button>
          <a className="btn btn-primary" href={DISCORD} target="_blank" rel="noreferrer"><Icon name="discord" size={18} /> Diskutovat na Discordu</a>
        </div>
        <div className="po-nav">
          {prev ? <a href={'#/novinky/' + prev.slug} className="po-pn"><small><Icon name="arrow" size={14} className="at-back-ico" /> Starší</small><b>{prev.title}</b></a> : <span />}
          {next ? <a href={'#/novinky/' + next.slug} className="po-pn r"><small>Novější <Icon name="arrow" size={14} /></small><b>{next.title}</b></a> : <span />}
        </div>
        <h3 className="po-more-h">Další novinky</h3>
        <div className="nw-list two">
          {more.map((x, i) => <PostCard key={x.slug} p={x} delay={i * 90} />)}
        </div>
      </div>
    </article>
  )
}
