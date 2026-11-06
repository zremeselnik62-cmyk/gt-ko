import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

/* Prihlásenie: PHP API (api/index.php) + session cookie + CSRF token */
const API = 'api/index.php'
const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)
export const skinUrl = (u, download = false) => (u && u.skin_ver ? `api/index.php?r=skin&id=${u.id}&v=${u.skin_ver}${download ? '&download=1' : ''}` : null)

export const ROLE_LABEL = { player: 'Hráč', helper: 'Helper', moderator: 'Moderátor', admin: 'Admin', owner: 'Majitel' }
export const ROLE_COLOR = { player: '#a89a85', helper: '#53e82f', moderator: '#60a5fa', admin: '#ef4444', owner: '#f3d43a' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [modal, setModal] = useState(null) // null | 'login' | 'register'
  const csrf = useRef('')

  const call = useCallback(async (r, { method = 'GET', data, query } = {}) => {
    const qs = query ? '&' + new URLSearchParams(query).toString() : ''
    let res
    try {
      res = await fetch(API + '?r=' + r + qs, {
        method,
        credentials: 'same-origin',
        headers: method === 'POST' ? { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf.current } : undefined,
        body: method === 'POST' ? JSON.stringify(data || {}) : undefined,
      })
    } catch {
      throw new Error('Server neodpovídá. Běží Apache v XAMPPu?')
    }
    let j = null
    try { j = await res.json() } catch { throw new Error('API vrátilo neplatnou odpověď (chybí PHP?).') }
    if (!res.ok) { const e = new Error(j?.error || 'Něco se pokazilo.'); e.status = res.status; throw e }
    return j
  }, [])

  const refresh = useCallback(async () => {
    try {
      const j = await call('me')
      csrf.current = j.csrf
      setUser(j.user)
    } catch { setUser(null) }
    setReady(true)
  }, [call])

  useEffect(() => { refresh() }, [refresh])

  const value = {
    user, ready, modal, setModal, call, refresh,
    openLogin: () => setModal('login'),
    openRegister: () => setModal('register'),
    async login(username, password) {
      const j = await call('login', { method: 'POST', data: { username, password } })
      await refresh(); return j.user
    },
    async register(username, password, mc_nick) {
      const j = await call('register', { method: 'POST', data: { username, password, mc_nick } })
      await refresh(); return j.user
    },
    async logout() {
      const j = await call('logout', { method: 'POST' })
      csrf.current = j.csrf; setUser(null)
    },
    changePassword: (old, nw) => call('change_password', { method: 'POST', data: { old, new: nw } }),
    staff: !!user && user.level >= 1,
    can: (lvl) => !!user && user.level >= lvl,
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
