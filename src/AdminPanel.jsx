import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { McTitle } from './components.jsx'
import { useAuth, ROLE_LABEL, ROLE_COLOR } from './auth.jsx'
import { toDate, fmtDate } from './AccountPages.jsx'
import { navigate } from './route.js'

const ago = (s) => {
  if (!s) return '–'
  const m = Math.round((Date.now() - toDate(s).getTime()) / 60000)
  if (m < 2) return 'právě teď'
  if (m < 60) return `před ${m} min`
  if (m < 60 * 24) return `před ${Math.round(m / 60)} h`
  return `před ${Math.round(m / 1440)} dny`
}
const playtime = (min) => (min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`)
const when = (b) => (b.expires_at ? 'do ' + fmtDate(b.expires_at) : 'trvale')
const STATUS = { active: ['Aktivní', '#ef4444'], expired: ['Vypršel', '#a89a85'], removed: ['Zrušen', '#4fd1a5'] }

const REASONS = ['Cheaty / hacky', 'Spam v chatu', 'Urážky hráčů', 'Griefing', 'Zneužití chyby', 'Nevhodný nick']
const DURATIONS = [['1 hodina', 60], ['6 hodin', 360], ['1 den', 1440], ['7 dní', 10080], ['30 dní', 43200], ['Trvale', 0]]

function Badge({ s }) { const [t, c] = STATUS[s]; return <span className="ap-badge" style={{ '--c': c }}><i />{t}</span> }

function Pager({ page, total, per, set }) {
  const pages = Math.max(1, Math.ceil(total / per))
  if (pages <= 1) return null
  return (
    <div className="ap-pager">
      <button disabled={page <= 1} onClick={() => set(page - 1)}><Icon name="arrow" size={15} className="at-back-ico" /></button>
      <span>{page} / {pages} <small>({total})</small></span>
      <button disabled={page >= pages} onClick={() => set(page + 1)}><Icon name="arrow" size={15} /></button>
    </div>
  )
}

/* ---------- Prehľad ---------- */
function Overview({ go }) {
  const { call, can } = useAuth()
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  const load = useCallback(() => call('admin_stats').then(setD).catch((e) => setErr(e.message)), [call])
  useEffect(() => { load() }, [load])
  if (err) return <div className="md-err">{err}</div>
  if (!d) return <div className="ac-wait">Načítám…</div>
  const cards = [
    ['users', 'Hráčů v databázi', d.players, '#ffd54a'],
    ['ban', 'Aktivní bany', d.active_bans, '#ef4444'],
    ['calendar', 'Banů za 7 dní', d.bans_7d, '#f59e0b'],
    ['user', 'Nových hráčů (7 dní)', d.new_players_7d, '#4fd1a5'],
  ]
  return (
    <div>
      {d.demo > 0 && can(3) && (
        <div className="ap-note">
          <Icon name="news" size={18} /> V databázi je <b>{d.demo}</b> ukázkových hráčů.
          <button className="btn btn-sm btn-ghost" onClick={async () => { if (confirm('Smazat ukázkové hráče i jejich bany?')) { await call('purge_demo', { method: 'POST' }); load() } }}>Smazat ukázková data</button>
        </div>
      )}
      <div className="ap-stats">
        {cards.map(([ic, l, v, c]) => (
          <div key={l} className="ap-stat" style={{ '--c': c }}><span className="ap-sico"><Icon name={ic} size={22} /></span><b>{v}</b><small>{l}</small></div>
        ))}
      </div>
      <div className="ap-two">
        <div className="ap-box">
          <h3>Rychlé akce</h3>
          <div className="ap-quick">
            <button onClick={() => go('menu')}><Icon name="ban" size={20} /> Zabanovat hráče</button>
            <button onClick={() => go('bans')}><Icon name="shield" size={20} /> Otevřít ban list</button>
            <button onClick={() => go('players')}><Icon name="users" size={20} /> Přehled hráčů</button>
          </div>
        </div>
        <div className="ap-box">
          <h3>Poslední akce</h3>
          {d.recent.length === 0 && <p>Zatím nic.</p>}
          <ul className="ap-log">
            {d.recent.map((r, i) => (
              <li key={i}><b>{r.user}</b> <em>{r.action}</em> <span>{r.detail}</span><time>{ago(r.ts)}</time></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ---------- Detail hráča ---------- */
function PlayerModal({ id, onClose, onBan, onChanged }) {
  const { call, can } = useAuth()
  const [d, setD] = useState(null)
  const load = useCallback(() => call('player', { query: { id } }).then(setD), [call, id])
  useEffect(() => { load() }, [load])
  const unban = async (b) => {
    const why = prompt('Důvod zrušení banu (nepovinné):')
    if (why === null) return
    await call('ban_remove', { method: 'POST', data: { id: b.id, reason: why } }); load(); onChanged()
  }
  if (!d) return <div className="md-back"><div className="md ap-md"><div className="ac-wait">Načítám…</div></div></div>
  const p = d.player
  const active = d.bans.find((b) => b.status === 'active')
  return (
    <div className="md-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="md ap-md" role="dialog" aria-modal="true">
        <button className="md-x" onClick={onClose} aria-label="Zavřít">×</button>
        <div className="ap-pl-head">
          <span className="av big">{p.nick[0].toUpperCase()}</span>
          <div><h2>{p.nick}</h2>{active ? <Badge s="active" /> : <span className="ap-badge" style={{ '--c': '#4fd1a5' }}><i />Bez aktivního banu</span>}</div>
        </div>
        <dl className="pf-grid">
          <div><dt>První vstup</dt><dd>{fmtDate(p.first_seen)}</dd></div>
          <div><dt>Naposledy</dt><dd>{ago(p.last_seen)}</dd></div>
          <div><dt>Odehráno</dt><dd>{playtime(p.playtime_min)}</dd></div>
          <div><dt>Poslední minihra</dt><dd>{p.last_game || <em>–</em>}</dd></div>
        </dl>
        <h3 className="ap-h3">Historie banů ({d.bans.length})</h3>
        {d.bans.length === 0 && <p>Tenhle hráč nikdy nebyl zabanován.</p>}
        <ul className="ap-hist">
          {d.bans.map((b) => (
            <li key={b.id}>
              <div><Badge s={b.status} /> <b>{b.reason}</b></div>
              <small>{fmtDate(b.created_at)} · {b.by_name} · {when(b)}{b.removed_by ? ` · zrušil ${b.removed_by}` : ''}</small>
              {b.status === 'active' && can(2) && <button className="btn btn-sm btn-ghost" onClick={() => unban(b)}><Icon name="undo" size={15} /> Zrušit ban</button>}
            </li>
          ))}
        </ul>
        {can(2) && !active && <button className="btn btn-primary" onClick={() => onBan(p.nick)}><Icon name="ban" size={17} /> Zabanovat</button>}
      </div>
    </div>
  )
}

/* ---------- Hráči ---------- */
function Players({ onBan }) {
  const { call, can } = useAuth()
  const [q, setQ] = useState(''); const [filter, setFilter] = useState('all'); const [sort, setSort] = useState('last_seen'); const [page, setPage] = useState(1)
  const [data, setData] = useState(null); const [sel, setSel] = useState(null); const [err, setErr] = useState('')
  const [nick, setNick] = useState('')
  const t = useRef(null)
  const load = useCallback(() => {
    call('players', { query: { q, filter, sort, page } }).then(setData).catch((e) => setErr(e.message))
  }, [call, q, filter, sort, page])
  useEffect(() => { clearTimeout(t.current); t.current = setTimeout(load, 220); return () => clearTimeout(t.current) }, [load])
  const add = async (e) => {
    e.preventDefault(); setErr('')
    try { await call('player_add', { method: 'POST', data: { nick } }); setNick(''); load() } catch (er) { setErr(er.message) }
  }
  return (
    <div>
      <div className="ap-tools">
        <label className="ap-search"><Icon name="search" size={18} /><input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Hledat hráče…" /></label>
        <div className="ap-chips">
          {[['all', 'Všichni'], ['banned', 'Zabanovaní'], ['clean', 'Bez banu']].map(([k, l]) => <button key={k} className={filter === k ? 'on' : ''} onClick={() => { setFilter(k); setPage(1) }}>{l}</button>)}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Řazení">
          <option value="last_seen">Naposledy online</option><option value="nick">Podle jména</option><option value="playtime">Podle odehraného času</option><option value="first_seen">Nejnovější</option>
        </select>
      </div>
      {can(2) && (
        <form className="ap-add" onSubmit={add}>
          <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Přidat hráče ručně (nick)" maxLength={16} />
          <button className="btn btn-sm btn-ghost" disabled={!nick}><Icon name="plus" size={16} /> Přidat</button>
        </form>
      )}
      {err && <div className="md-err">{err}</div>}
      {!data ? <div className="ac-wait">Načítám…</div> : (
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead><tr><th>Hráč</th><th>Minihra</th><th>Odehráno</th><th>Naposledy</th><th>Stav</th><th /></tr></thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} onClick={() => setSel(p.id)}>
                  <td><span className="av sm">{p.nick[0].toUpperCase()}</span><b>{p.nick}</b></td>
                  <td>{p.last_game || '–'}</td><td>{playtime(p.playtime_min)}</td><td>{ago(p.last_seen)}</td>
                  <td>{p.banned > 0 ? <Badge s="active" /> : <span className="ap-badge" style={{ '--c': '#4fd1a5' }}><i />V pořádku</span>}{p.bans_count > 0 && <small className="ap-cnt">{p.bans_count}× ban</small>}</td>
                  <td className="r" onClick={(e) => e.stopPropagation()}>
                    {can(2) && p.banned === 0 && <button className="btn btn-sm btn-ghost" onClick={() => onBan(p.nick)}><Icon name="ban" size={15} /> Ban</button>}
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && <tr><td colSpan={6} className="empty">Nikdo takový tu není.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={data.page} total={data.total} per={data.per} set={setPage} />}
      {sel && <PlayerModal id={sel} onClose={() => setSel(null)} onBan={(n) => { setSel(null); onBan(n) }} onChanged={load} />}
    </div>
  )
}

/* ---------- Ban list ---------- */
function Bans() {
  const { call, can } = useAuth()
  const [status, setStatus] = useState('active'); const [q, setQ] = useState(''); const [page, setPage] = useState(1)
  const [data, setData] = useState(null); const [err, setErr] = useState('')
  const t = useRef(null)
  const load = useCallback(() => { call('bans', { query: { status, q, page } }).then(setData).catch((e) => setErr(e.message)) }, [call, status, q, page])
  useEffect(() => { clearTimeout(t.current); t.current = setTimeout(load, 220); return () => clearTimeout(t.current) }, [load])
  const unban = async (b) => {
    const why = prompt(`Zrušit ban hráči ${b.nick}?\nDůvod (nepovinné):`)
    if (why === null) return
    try { await call('ban_remove', { method: 'POST', data: { id: b.id, reason: why } }); load() } catch (e) { setErr(e.message) }
  }
  return (
    <div>
      <div className="ap-tools">
        <label className="ap-search"><Icon name="search" size={18} /><input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Hráč, důvod nebo admin…" /></label>
        <div className="ap-chips">
          {[['active', 'Aktivní'], ['expired', 'Vypršelé'], ['removed', 'Zrušené'], ['all', 'Vše']].map(([k, l]) => <button key={k} className={status === k ? 'on' : ''} onClick={() => { setStatus(k); setPage(1) }}>{l}</button>)}
        </div>
      </div>
      {err && <div className="md-err">{err}</div>}
      {!data ? <div className="ac-wait">Načítám…</div> : (
        <div className="ap-table-wrap">
          <table className="ap-table static">
            <thead><tr><th>Hráč</th><th>Důvod</th><th>Délka</th><th>Zabanoval</th><th>Kdy</th><th>Stav</th><th /></tr></thead>
            <tbody>
              {data.items.map((b) => (
                <tr key={b.id}>
                  <td><span className="av sm">{b.nick[0].toUpperCase()}</span><b>{b.nick}</b></td>
                  <td className="rs">{b.reason}</td><td>{when(b)}</td><td>{b.by_name}</td><td>{fmtDate(b.created_at)}</td>
                  <td><Badge s={b.status} /></td>
                  <td className="r">{b.status === 'active' && can(2) && <button className="btn btn-sm btn-ghost" onClick={() => unban(b)}><Icon name="undo" size={15} /> Zrušit</button>}</td>
                </tr>
              ))}
              {data.items.length === 0 && <tr><td colSpan={7} className="empty">Žádné bany v téhle kategorii.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={data.page} total={data.total} per={data.per} set={setPage} />}
    </div>
  )
}

/* ---------- Ban menu ---------- */
function BanMenu({ prefill, onDone }) {
  const { call, can } = useAuth()
  const [nick, setNick] = useState(prefill || '')
  const [reason, setReason] = useState(''); const [min, setMin] = useState(1440); const [custom, setCustom] = useState('')
  const [sug, setSug] = useState([]); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false)
  useEffect(() => { setNick(prefill || '') }, [prefill])
  useEffect(() => {
    if (nick.length < 2) { setSug([]); return }
    const t = setTimeout(() => call('players', { query: { q: nick, filter: 'clean' } }).then((d) => setSug(d.items.slice(0, 5).map((x) => x.nick))).catch(() => {}), 200)
    return () => clearTimeout(t)
  }, [nick, call])
  if (!can(2)) return <div className="ac-gate small"><Icon name="lock" size={36} /><p>Banovat můžou moderátoři a výš.</p></div>
  const minutes = custom ? Math.max(0, parseInt(custom, 10) || 0) : min
  const submit = async (e) => {
    e.preventDefault(); setMsg(null); setBusy(true)
    try {
      await call('ban_create', { method: 'POST', data: { nick: nick.trim(), reason: reason.trim(), minutes } })
      setMsg({ ok: true, t: `Hráč ${nick} byl zabanován.` }); setNick(''); setReason(''); onDone?.()
    } catch (er) { setMsg({ ok: false, t: er.message }) }
    setBusy(false)
  }
  return (
    <form className="ap-ban" onSubmit={submit}>
      <div className="ap-ban-main">
        <label>Nick hráče
          <input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={16} required placeholder="např. CreeperSlayer" autoComplete="off" />
          {sug.length > 0 && nick && !sug.includes(nick) && <div className="ap-sug">{sug.map((s) => <button type="button" key={s} onClick={() => setNick(s)}>{s}</button>)}</div>}
        </label>
        <label>Důvod
          <div className="ap-chips wrap">{REASONS.map((r) => <button type="button" key={r} className={reason === r ? 'on' : ''} onClick={() => setReason(r)}>{r}</button>)}</div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={255} required placeholder="Napiš důvod, uvidí ho hráč i ostatní admini" />
        </label>
        <label>Délka
          <div className="ap-chips wrap">{DURATIONS.map(([l, v]) => <button type="button" key={l} className={!custom && min === v ? 'on' : ''} onClick={() => { setMin(v); setCustom('') }}>{l}</button>)}</div>
          <input value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))} placeholder="…nebo vlastní počet minut" inputMode="numeric" />
        </label>
      </div>
      <aside className="ap-ban-sum">
        <h3>Shrnutí</h3>
        <div className="ap-sum-row"><span>Hráč</span><b>{nick || '–'}</b></div>
        <div className="ap-sum-row"><span>Důvod</span><b>{reason || '–'}</b></div>
        <div className="ap-sum-row"><span>Délka</span><b>{minutes === 0 ? 'Trvale' : minutes >= 1440 ? `${Math.round(minutes / 1440)} dní` : minutes >= 60 ? `${Math.round(minutes / 60)} h` : `${minutes} min`}</b></div>
        {msg && <div className={msg.ok ? 'md-ok' : 'md-err'} role="alert">{msg.t}</div>}
        <button className="btn btn-primary block ap-danger" disabled={busy || !nick || reason.length < 3}><Icon name="ban" size={18} /> {busy ? 'Banuju…' : 'Zabanovat'}</button>
      </aside>
    </form>
  )
}

/* ---------- Tím ---------- */
function Team() {
  const { call, user, can } = useAuth()
  const [items, setItems] = useState(null); const [err, setErr] = useState('')
  const load = useCallback(() => call('users').then((d) => setItems(d.items)).catch((e) => setErr(e.message)), [call])
  useEffect(() => { load() }, [load])
  if (!can(3)) return null
  const change = async (u, role) => {
    setErr('')
    try { await call('set_role', { method: 'POST', data: { id: u.id, role } }); load() } catch (e) { setErr(e.message) }
  }
  return (
    <div>
      {err && <div className="md-err">{err}</div>}
      {!items ? <div className="ac-wait">Načítám…</div> : (
        <div className="ap-table-wrap">
          <table className="ap-table static">
            <thead><tr><th>Uživatel</th><th>MC nick</th><th>Registrace</th><th>Role</th></tr></thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td><span className="av sm">{u.username[0].toUpperCase()}</span><b>{u.username}</b>{u.id === user.id && <small className="ap-cnt">to jsi ty</small>}</td>
                  <td>{u.mc_nick || '–'}</td><td>{fmtDate(u.created_at)}</td>
                  <td>
                    <select value={u.role} disabled={u.id === user.id} onChange={(e) => change(u, e.target.value)} style={{ color: ROLE_COLOR[u.role] }}>
                      {Object.entries(ROLE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ---------- panel ---------- */
export default function AdminPanel() {
  const { user, ready, staff, can, openLogin } = useAuth()
  const [tab, setTab] = useState('overview')
  const [prefill, setPrefill] = useState('')
  const [rev, setRev] = useState(0)
  const toBan = (n) => { setPrefill(n); setTab('menu') }
  const tabs = [['overview', 'Přehled', 'chart'], ['players', 'Hráči', 'users'], ['bans', 'Ban list', 'shield'], ['menu', 'Ban menu', 'ban'], ...(can(3) ? [['team', 'Tým', 'key']] : [])]
  return (
    <section className="ap-page">
      <div className="wrap">
        <button className="at-back" onClick={() => navigate('home')}><Icon name="arrow" size={16} className="at-back-ico" /> Zpět na hlavní stránku</button>
        <div className="at-head" style={{ marginBottom: 30 }}>
          <span className="kicker">PRO TÝM</span>
          <McTitle as="h1" className="at-title" text="Admin*Panel*" />
          {user && <p><span className="pf-role" style={{ '--rc': ROLE_COLOR[user.role] }}><i />{ROLE_LABEL[user.role]}</span> {user.username}</p>}
        </div>
        {!ready ? <div className="ac-wait">Načítám…</div> : !user ? (
          <div className="ac-gate"><Icon name="lock" size={48} /><h2>Tady se nesmí bez přihlášení</h2><p>Přihlas se účtem, který má oprávnění týmu.</p>
            <button className="btn btn-primary" onClick={openLogin}><Icon name="user" size={18} /> Přihlásit se</button></div>
        ) : !staff ? (
          <div className="ac-gate"><Icon name="shield" size={48} /><h2>Na admin panel nemáš oprávnění</h2><p>Tahle část je jen pro tým GameTeamu. Máš pocit, že je to chyba? Napiš nám na Discord.</p>
            <button className="btn btn-ghost" onClick={() => navigate('home')}>Zpět na web</button></div>
        ) : (
          <>
            <nav className="ap-tabs" role="tablist">
              {tabs.map(([k, l, ic]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><Icon name={ic} size={17} /> {l}</button>)}
            </nav>
            <div className="ap-body" key={tab + rev}>
              {tab === 'overview' && <Overview go={setTab} />}
              {tab === 'players' && <Players onBan={toBan} />}
              {tab === 'bans' && <Bans />}
              {tab === 'menu' && <BanMenu prefill={prefill} onDone={() => setPrefill('')} />}
              {tab === 'team' && <Team />}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
