import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { useAuth, ROLE_LABEL, ROLE_COLOR, skinUrl } from './auth.jsx'
import { navigate, useRoute } from './route.js'
import { DISCORD } from './data.js'

/* ---------- avatar (iniciála v zlatom kruhu) ---------- */
export function Avatar({ name, size = 38, skin = null }) {
  if (skin) {
    const k = size / 8
    const s = { width: size, height: size, backgroundSize: `${64 * k}px ${64 * k}px, ${64 * k}px ${64 * k}px`,
      backgroundImage: `url(${skin}), url(${skin})`, backgroundPosition: `${-40 * k}px ${-8 * k}px, ${-8 * k}px ${-8 * k}px` }
    return <span className="av skinned" style={s} role="img" aria-label={name} />
  }
  return <span className="av" style={{ width: size, height: size, fontSize: size * 0.42 }}>{(name || '?').slice(0, 1).toUpperCase()}</span>
}

/* ---------- menu účtu v navbare ---------- */
export function UserMenu({ onNavigate }) {
  const { user, ready, openLogin, logout, staff } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const route = useRoute()
  useEffect(() => { setOpen(false) }, [route])
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    addEventListener('mousedown', close); addEventListener('keydown', esc)
    return () => { removeEventListener('mousedown', close); removeEventListener('keydown', esc) }
  }, [])
  if (!ready) return <span className="um-skel" />
  if (!user) {
    return <button className="btn btn-sm btn-ghost um-login" onClick={() => { onNavigate?.(); openLogin() }}><Icon name="user" size={17} /> Přihlásit se</button>
  }
  const go = (to) => () => { setOpen(false); onNavigate?.(); navigate(to) }
  return (
    <div className="um" ref={ref}>
      <button className={'um-btn ' + (open ? 'open' : '')} onClick={() => setOpen(!open)} aria-expanded={open}>
        <Avatar name={user.username} skin={skinUrl(user)} />
        <span className="um-name">{user.username}</span>
        <Icon name="chev" size={16} className="um-chev" />
      </button>
      <div className={'um-pop ' + (open ? 'show' : '')} role="menu">
        <div className="um-head"><Avatar name={user.username} size={44} skin={skinUrl(user)} /><div><b>{user.username}</b><small style={{ color: ROLE_COLOR[user.role] }}>{ROLE_LABEL[user.role]}</small></div></div>
        <button role="menuitem" onClick={go('profile')}><Icon name="user" size={19} /> Profil</button>
        <button role="menuitem" onClick={go('password')}><Icon name="key" size={19} /> Změnit heslo</button>
        <a role="menuitem" href={DISCORD} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}><Icon name="headset" size={19} /> Support</a>
        {staff && <button role="menuitem" onClick={go('panel')}><Icon name="shield" size={19} /> Admin panel</button>}
        <hr />
        <button role="menuitem" className="out" onClick={async () => { setOpen(false); await logout(); navigate('home') }}><Icon name="logout" size={19} /> Odhlásit se</button>
      </div>
    </div>
  )
}

/* ---------- prihlasovacie okno ---------- */
export function AuthModal() {
  const { modal, setModal, login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ username: '', password: '', mc_nick: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const first = useRef(null)
  useEffect(() => { if (modal) { setMode(modal); setErr(''); setTimeout(() => first.current?.focus(), 80) } }, [modal])
  useEffect(() => {
    if (!modal) return
    const esc = (e) => { if (e.key === 'Escape') setModal(null) }
    addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [modal, setModal])
  if (!modal) return null
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      if (mode === 'login') await login(f.username.trim(), f.password)
      else await register(f.username.trim(), f.password, f.mc_nick.trim())
      setModal(null); setF({ username: '', password: '', mc_nick: '' })
    } catch (er) { setErr(er.message) }
    setBusy(false)
  }
  return (
    <div className="md-back" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null) }}>
      <form className="md" onSubmit={submit} role="dialog" aria-modal="true" aria-label={mode === 'login' ? 'Přihlášení' : 'Registrace'}>
        <button type="button" className="md-x" onClick={() => setModal(null)} aria-label="Zavřít">×</button>
        <img className="md-logo" src="logo.png" alt="" />
        <h2>{mode === 'login' ? 'Vítej zpátky' : 'Vytvoř si účet'}</h2>
        <p className="md-sub">{mode === 'login' ? 'Přihlas se na GameTeam.' : 'Pár vteřin a jsi uvnitř.'}</p>
        <div className="md-tabs">
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setErr('') }}>Přihlášení</button>
          <button type="button" className={mode === 'register' ? 'on' : ''} onClick={() => { setMode('register'); setErr('') }}>Registrace</button>
        </div>
        <label>Uživatelské jméno
          <input ref={first} value={f.username} onChange={set('username')} maxLength={16} autoComplete="username" required placeholder="např. Steve_CZ" />
        </label>
        {mode === 'register' && (
          <label>Minecraft nick <em>(nepovinné)</em>
            <input value={f.mc_nick} onChange={set('mc_nick')} maxLength={16} placeholder="stejný jako ve hře" />
          </label>
        )}
        <label>Heslo
          <input type="password" value={f.password} onChange={set('password')} maxLength={72} minLength={mode === 'register' ? 8 : undefined}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required placeholder={mode === 'register' ? 'aspoň 8 znaků' : '••••••••'} />
        </label>
        {err && <div className="md-err" role="alert">{err}</div>}
        <button className="btn btn-primary block" disabled={busy}>{busy ? 'Chvilku…' : mode === 'login' ? 'Přihlásit se' : 'Vytvořit účet'}</button>
        <small className="md-foot">
          {mode === 'login' ? <>Nemáš účet? <button type="button" onClick={() => setMode('register')}>Zaregistruj se</button></> : <>Už máš účet? <button type="button" onClick={() => setMode('login')}>Přihlas se</button></>}
        </small>
      </form>
    </div>
  )
}
