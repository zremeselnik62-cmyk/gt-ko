import { useEffect, useState } from 'react'

const tips = [
  'Generuji svět…',
  'Načítám terén a ostrovy…',
  'Spawnuji creepery…',
  'Kopu diamanty…',
  'Připojuji se na play.gameteam.cz…',
  'Zapínám parkour mapy…',
  'Leštím zlato…',
  'GameTeam je ZPĚT!',
]

const MIN_MS = 2800

export default function Loader() {
  const [pct, setPct] = useState(0)
  const [phase, setPhase] = useState('load') // load -> done -> gone
  useEffect(() => {
    document.documentElement.classList.remove('ready')
    document.body.style.overflow = 'hidden'
    const t0 = performance.now()
    let raf, loaded = document.readyState === 'complete'
    const onLoad = () => { loaded = true }
    addEventListener('load', onLoad)
    let finished = false
    const step = () => {
      if (finished) return
      const el = performance.now() - t0
      const k = Math.min(1, el / MIN_MS)
      const eased = 1 - Math.pow(1 - k, 2.2)
      // do 90 % podľa času, 100 % až keď je stránka načítaná
      const p = loaded ? eased * 100 : Math.min(90, eased * 90)
      setPct(p)
      if (loaded && k >= 1) { finished = true; setPct(100); setPhase('done') }
    }
    const loop = () => { step(); if (!finished) raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    // poistka: keď je karta na pozadí, rAF stojí, tak to dotiahne časovač
    const iv = setInterval(step, 200)
    return () => { finished = true; cancelAnimationFrame(raf); clearInterval(iv); removeEventListener('load', onLoad) }
  }, [])

  useEffect(() => {
    if (phase !== 'done') return
    const t1 = setTimeout(() => { document.documentElement.classList.add('ready') }, 650)
    const t2 = setTimeout(() => { setPhase('gone'); document.body.style.overflow = '' }, 1500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [phase])

  if (phase === 'gone') return null
  const tip = tips[Math.min(tips.length - 1, Math.floor((pct / 100) * tips.length))]
  const segs = 20
  return (
    <div className={'loader ' + (phase === 'done' ? 'out' : '')} role="status" aria-label="Načítání">
      <div className="ld-curtain top" />
      <div className="ld-curtain bot" />
      <div className="ld-center">
        <img className="ld-logo" src="logo.png" alt="" />
        <div className="ld-title">Game<b>Team</b><span>.cz</span></div>
        <div className="ld-bar" aria-hidden="true">
          <div className="ld-fill" style={{ width: pct + '%' }} />
          <div className="ld-segs">{Array.from({ length: segs }, (_, i) => <i key={i} />)}</div>
        </div>
        <div className="ld-row"><span className="ld-tip">{tip}</span><b>{Math.floor(pct)}%</b></div>
      </div>
      <div className="ld-px" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => (
          <i key={i} style={{ left: (i * 37) % 100 + '%', animationDelay: (i * 0.23) % 3 + 's', animationDuration: 3 + (i % 4) + 's', width: 6 + (i % 3) * 4, height: 6 + (i % 3) * 4 }} />
        ))}
      </div>
    </div>
  )
}
