import { useState } from 'react'
import Icon from './Icon.jsx'
import { Reveal, McTitle } from './components.jsx'
import { navigate } from './route.js'

const team = [
  { role: 'MAJITEL', color: '#f3d43a', big: true, members: [{ n: 'TimoLp268' }] },
  { role: 'DEVELOPER', color: '#2fd3e6', members: [{ n: 'Internetak' }, { n: 'vlcik128' }, { n: 'CreeperFace' }] },
  { role: 'ADMIN', color: '#ef4444', members: [
    { n: 'Kub1sEej', s: 'SkyBlock' }, { n: 'CandyCZ01', s: 'Technické záležitosti' }, { n: 'hbtygrikCZ', s: 'Prison SkyBlock' },
    { n: '_Artem1s', s: 'Vedení týmu' }, { n: 'mrmila', s: 'SkyBlock' }, { n: 'Elizabethphoebe', s: 'Prison Parkour' },
  ] },
  { role: 'MODERATOR', color: '#60a5fa', members: [{ n: 'MrRemi' }, { n: 'aeryn', s: 'Skiny' }, { n: 'vepexsus' }, { n: 'MikiZvanek' }] },
  { role: 'HELPER', color: '#53e82f', members: [{ n: 'vepexiprincess' }, { n: 'MaweCzech' }] },
  { role: 'BUILDER', color: '#f59e0b', members: [{ n: 'Heantha' }, { n: 'TheFrederick' }] },
]

/* skin hráča: mc-heads -> minotar -> náhradná ikona */
const sources = (n) => [
  `skins/${encodeURIComponent(n)}.png`,
  `https://mc-heads.net/body/${encodeURIComponent(n)}/200`,
  `https://minotar.net/armor/body/${encodeURIComponent(n)}/200.png`,
]

function Skin({ name }) {
  const [i, setI] = useState(0)
  const src = sources(name)
  if (i >= src.length) return <span className="skin-fallback"><Icon name="user" size={54} /></span>
  return <img className="skin" src={src[i]} alt={'Skin hráče ' + name} loading="lazy" onError={() => setI(i + 1)} />
}

function Card({ m, color, big, delay }) {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    e.currentTarget.style.setProperty('--ry', (x * 12).toFixed(1) + 'deg')
    e.currentTarget.style.setProperty('--rx', (-y * 10).toFixed(1) + 'deg')
    e.currentTarget.style.setProperty('--mx', (x + 0.5) * 100 + '%')
    e.currentTarget.style.setProperty('--my', (y + 0.5) * 100 + '%')
  }
  const reset = (e) => { e.currentTarget.style.setProperty('--ry', '0deg'); e.currentTarget.style.setProperty('--rx', '0deg') }
  return (
    <Reveal delay={delay} className="at-wrap">
      <div className={'at-card ' + (big ? 'big' : '')} style={{ '--rc': color }} onMouseMove={onMove} onMouseLeave={reset}>
        <div className="at-stage">
          <span className="at-glow" />
          <span className="at-floor" />
          <Skin name={m.n} />
        </div>
        <div className="at-name">
          <b>{m.n}</b>
          {m.s && <small>{m.s}</small>}
        </div>
      </div>
    </Reveal>
  )
}

export default function AdminTeam() {
  return (
    <section className="at-page">
      <div className="wrap">
        <button className="at-back" onClick={() => navigate('home')}><Icon name="arrow" size={16} className="at-back-ico" /> Zpět na hlavní stránku</button>
        <div className="at-head">
          <span className="kicker">NAŠE PARTA</span>
          <McTitle as="h1" className="at-title" text="Admin*Team*" />
          <Reveal delay={200}><p>Lidé, kteří se starají o to, aby GameTeam běžel férově, rychle a s dobrou náladou.</p></Reveal>
        </div>
        <div className="at-groups">
          {team.map((g) => (
            <section key={g.role} className="at-group" style={{ '--rc': g.color }}>
              <Reveal className="at-role">
                <span className="at-line l" /><i className="at-dia" /><h2>{g.role}</h2><i className="at-dia" /><span className="at-line r" />
              </Reveal>
              <div className="at-grid">
                {g.members.map((m, i) => <Card key={m.n} m={m} color={g.color} big={g.big} delay={i * 90} />)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
