import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { McTitle, Reveal } from './components.jsx'
import { Avatar } from './Account.jsx'
import { useAuth, ROLE_LABEL, ROLE_COLOR, skinUrl } from './auth.jsx'
import SkinViewer from './SkinViewer.jsx'
import { navigate } from './route.js'
import { DISCORD } from './data.js'

export const toDate = (s) => (s ? new Date(s.replace(' ', 'T') + 'Z') : null)
export const fmtDate = (s) => (s ? toDate(s).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–')

function Gate({ children }) {
  const { user, ready, openLogin } = useAuth()
  if (!ready) return <div className="ac-wait">Načítám…</div>
  if (!user) {
    return (
      <div className="ac-gate">
        <Icon name="lock" size={48} />
        <h2>Tohle je jen pro přihlášené</h2>
        <p>Přihlas se, ať se dostaneš ke svému účtu.</p>
        <button className="btn btn-primary" onClick={openLogin}><Icon name="user" size={18} /> Přihlásit se</button>
      </div>
    )
  }
  return children
}

const MODES = [['walk', 'Chůze'], ['idle', 'Stát'], ['wave', 'Mávání']]

export function ProfilePage() {
  const { user, staff, logout, call, refresh } = useAuth()
  const [mode, setMode] = useState('walk')
  const [prev, setPrev] = useState(null) // { url, name }
  const [slim, setSlim] = useState(false)
  const [nick, setNick] = useState('')
  const [drag, setDrag] = useState(false)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)
  useEffect(() => { if (user) { setSlim(user.skin_model === 'slim'); setNick(user.mc_nick || '') } }, [user?.id, user?.skin_ver])

  const pick = (file) => {
    setMsg(null)
    if (!file) return
    if (file.type !== 'image/png') return setMsg({ ok: false, t: 'Skin musí být PNG soubor.' })
    if (file.size > 200000) return setMsg({ ok: false, t: 'Soubor je moc velký (max 200 kB).' })
    const fr = new FileReader()
    fr.onload = () => {
      const img = new Image()
      img.onload = () => {
        if (img.width !== 64 || img.height !== 64) return setMsg({ ok: false, t: `Skin musí mít 64×64 px (tenhle má ${img.width}×${img.height}). Starší formát 64×32 zatím nejde.` })
        setPrev({ url: fr.result, name: file.name })
      }
      img.onerror = () => setMsg({ ok: false, t: 'Obrázek se nepodařilo přečíst.' })
      img.src = fr.result
    }
    fr.readAsDataURL(file)
  }
  const save = async () => {
    setBusy(true); setMsg(null)
    try {
      await call('skin_upload', { method: 'POST', data: { data: prev.url, model: slim ? 'slim' : 'classic' } })
      await refresh(); setPrev(null); setMsg({ ok: true, t: 'Skin je uložený. Takhle tě uvidí ostatní.' })
    } catch (e) { setMsg({ ok: false, t: e.message }) }
    setBusy(false)
  }
  const reset = async () => {
    if (!confirm('Vrátit výchozí skin?')) return
    setBusy(true); setMsg(null)
    try { await call('skin_reset', { method: 'POST' }); await refresh(); setPrev(null); setMsg({ ok: true, t: 'Vrátil se výchozí skin.' }) } catch (e) { setMsg({ ok: false, t: e.message }) }
    setBusy(false)
  }
  const saveProfile = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null)
    try { await call('profile_update', { method: 'POST', data: { mc_nick: nick.trim(), skin_model: slim ? 'slim' : 'classic' } }); await refresh(); setMsg({ ok: true, t: 'Profil je uložený.' }) } catch (er) { setMsg({ ok: false, t: er.message }) }
    setBusy(false)
  }

  const current = skinUrl(user)
  const shown = prev ? prev.url : current
  return (
    <section className="ac-page">
      <div className="wrap">
        <button className="at-back" onClick={() => navigate('home')}><Icon name="arrow" size={16} className="at-back-ico" /> Zpět na hlavní stránku</button>
        <div className="at-head" style={{ marginBottom: 36 }}>
          <span className="kicker">TVŮJ ÚČET</span>
          <McTitle as="h1" className="at-title" text="Pro*fil*" />
        </div>
        <Gate>
          {user && (
            <div className="sk-grid">
              <Reveal className="sk-left">
                <div className="sk-stage">
                  <div className="sk-glow" />
                  <SkinViewer url={shown} slim={slim} mode={mode} />
                  <div className="sk-name"><Avatar name={user.username} size={40} skin={current} /><div><b>{user.username}</b><span className="pf-role" style={{ '--rc': ROLE_COLOR[user.role] }}><i />{ROLE_LABEL[user.role]}</span></div></div>
                  <div className="sk-modes">{MODES.map(([k, l]) => <button key={k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>{l}</button>)}</div>
                  <div className="sk-hint"><Icon name="gamepad" size={14} /> ťahej myší a otáčej</div>
                  {prev && <div className="sk-prev"><Icon name="news" size={15} /> Náhled, zatím neuloženo</div>}
                </div>
              </Reveal>

              <div className="sk-right">
                <Reveal delay={80}>
                  <div className="pf-card sk-card">
                    <h3 className="sk-h"><Icon name="user" size={20} /> Změnit skin</h3>
                    <div className={'sk-drop ' + (drag ? 'over' : '')}
                      onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
                      onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]) }}
                      onClick={() => fileRef.current?.click()} role="button" tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click() }}>
                      <Icon name="plus" size={28} />
                      <b>{prev ? prev.name : 'Přetáhni sem skin'}</b>
                      <small>nebo klikni a vyber PNG soubor · 64×64 px · do 200 kB</small>
                      <input ref={fileRef} type="file" accept="image/png" hidden onChange={(e) => { pick(e.target.files[0]); e.target.value = '' }} />
                    </div>
                    <div className="sk-model">
                      <span>Typ rukou</span>
                      <div className="ap-chips"><button className={!slim ? 'on' : ''} onClick={() => setSlim(false)}>Steve (4 px)</button><button className={slim ? 'on' : ''} onClick={() => setSlim(true)}>Alex (3 px)</button></div>
                    </div>
                    {msg && <div className={msg.ok ? 'md-ok' : 'md-err'} role="alert">{msg.t}</div>}
                    <div className="pf-actions">
                      {prev && <button className="btn btn-primary" disabled={busy} onClick={save}><Icon name="check" size={17} /> {busy ? 'Ukládám…' : 'Uložit skin'}</button>}
                      {prev && <button className="btn btn-ghost" onClick={() => { setPrev(null); setMsg(null) }}>Zrušit náhled</button>}
                      {!prev && current && <a className="btn btn-ghost" href={skinUrl(user, true)} download="skin.png"><Icon name="arrow" size={16} className="dl" /> Stáhnout</a>}
                      {!prev && current && <button className="btn btn-ghost out" disabled={busy} onClick={reset}><Icon name="undo" size={16} /> Výchozí skin</button>}
                    </div>
                    <p className="sk-tip">Tip: skin si můžeš nakreslit nebo stáhnout z webů se Minecraft skiny. Najdeš ho jako soubor PNG 64×64.</p>
                  </div>
                </Reveal>

                <Reveal delay={160}>
                  <form className="pf-card sk-card" onSubmit={saveProfile}>
                    <h3 className="sk-h"><Icon name="gamepad" size={20} /> Minecraft účet</h3>
                    <label>Minecraft nick<input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={16} placeholder="stejný jako ve hře" /></label>
                    <button className="btn btn-ghost" style={{ marginTop: 14 }} disabled={busy}>Uložit nick</button>
                  </form>
                </Reveal>

                <Reveal delay={240}>
                  <div className="pf-card sk-card">
                    <h3 className="sk-h"><Icon name="shield" size={20} /> Účet</h3>
                    <dl className="pf-grid" style={{ marginBottom: 20 }}>
                      <div><dt>Účet vytvořen</dt><dd>{fmtDate(user.created_at)}</dd></div>
                      <div><dt>Poslední přihlášení</dt><dd>{fmtDate(user.last_login)}</dd></div>
                    </dl>
                    <div className="pf-actions">
                      <button className="btn btn-ghost" onClick={() => navigate('password')}><Icon name="key" size={17} /> Změnit heslo</button>
                      <a className="btn btn-ghost" href={DISCORD} target="_blank" rel="noreferrer"><Icon name="headset" size={17} /> Support</a>
                      {staff && <button className="btn btn-primary" onClick={() => navigate('panel')}><Icon name="shield" size={17} /> Admin panel</button>}
                      <button className="btn btn-ghost out" onClick={async () => { await logout(); navigate('home') }}><Icon name="logout" size={17} /> Odhlásit se</button>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          )}
        </Gate>
      </div>
    </section>
  )
}

const strength = (p) => {
  let s = 0
  if (p.length >= 8) s++
  if (p.length >= 12) s++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++
  return s
}

export function PasswordPage() {
  const { changePassword } = useAuth()
  const [f, setF] = useState({ old: '', nw: '', again: '' })
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const st = strength(f.nw)
  const submit = async (e) => {
    e.preventDefault(); setMsg(null)
    if (f.nw !== f.again) return setMsg({ ok: false, t: 'Nová hesla se neshodují.' })
    setBusy(true)
    try { await changePassword(f.old, f.nw); setMsg({ ok: true, t: 'Heslo bylo změněno.' }); setF({ old: '', nw: '', again: '' }) }
    catch (er) { setMsg({ ok: false, t: er.message }) }
    setBusy(false)
  }
  return (
    <section className="ac-page">
      <div className="wrap narrow">
        <button className="at-back" onClick={() => navigate('profile')}><Icon name="arrow" size={16} className="at-back-ico" /> Zpět na profil</button>
        <div className="at-head" style={{ marginBottom: 36 }}>
          <span className="kicker">BEZPEČNOST</span>
          <McTitle as="h1" className="at-title" text="Změnit *heslo*" />
        </div>
        <Gate>
          <Reveal>
            <form className="pf-card pw" onSubmit={submit}>
              <label>Staré heslo<input type="password" value={f.old} onChange={set('old')} autoComplete="current-password" required /></label>
              <label>Nové heslo<input type="password" value={f.nw} onChange={set('nw')} autoComplete="new-password" minLength={8} maxLength={72} required /></label>
              <div className="pw-meter" data-s={st}><i /><i /><i /><i /><span>{['příliš krátké', 'slabé', 'ujde', 'dobré', 'silné'][st]}</span></div>
              <label>Nové heslo znovu<input type="password" value={f.again} onChange={set('again')} autoComplete="new-password" required /></label>
              {msg && <div className={msg.ok ? 'md-ok' : 'md-err'} role="alert">{msg.t}</div>}
              <button className="btn btn-primary block" disabled={busy}><Icon name="key" size={17} /> {busy ? 'Ukládám…' : 'Změnit heslo'}</button>
            </form>
          </Reveal>
        </Gate>
      </div>
    </section>
  )
}
