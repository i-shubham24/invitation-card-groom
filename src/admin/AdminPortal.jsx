import { useEffect, useMemo, useState } from 'react'
import { fetchAllRsvps, deleteAllRsvps, isRemote } from '../lib/rsvpStore'
import { supabase } from '../lib/supabase'
import { EVENTS } from '../invite/layout'
import './admin.css'

const EVENT_NAME = Object.fromEntries(EVENTS.map((e) => [e.id, e.name]))

const normName = (n) => String(n || '').trim().toLowerCase().replace(/\s+/g, ' ')
function mergeByName(rows) {
  const map = new Map()
  for (const r of rows || []) {
    const k = normName(r.name)
    const cur = map.get(k)
    if (!cur) { map.set(k, { ...r }); continue }
    if (cur.attending == null && r.attending != null) {
      cur.attending = r.attending; cur.guests = r.guests; cur.events = r.events
    }
    if (!cur.message && r.message) cur.message = r.message
    if (!cur.contact && r.contact) cur.contact = r.contact
    if (r.created_at && (!cur.created_at || r.created_at < cur.created_at)) cur.created_at = r.created_at
  }
  return [...map.values()].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
}

function toCSV(rows) {
  const head = ['Name', 'Attending', 'Guests', 'Events', 'Message', 'Contact', 'When']
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = rows.map((r) =>
    [
      r.name,
      r.attending ? 'Yes' : 'No',
      r.guests ?? 0,
      (r.events || []).map((id) => EVENT_NAME[id] || id).join('; '),
      r.message || '',
      r.contact || '',
      r.created_at ? new Date(r.created_at).toLocaleString() : '',
    ]
      .map(esc)
      .join(','),
  )
  return [head.join(','), ...lines].join('\n')
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!isRemote) {
      // In local mode without Supabase, just bypass
      setErr('Supabase not connected. This login is disabled.')
      return
    }
    setLoading(true)
    setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setErr(error.message)
      setLoading(false)
    }
  }

  return (
    <form className="adm-login" onSubmit={submit}>
      <h1>Wedding RSVP Admin</h1>
      {!isRemote && <p style={{color: '#b23b3b', marginBottom: '1rem', textAlign: 'center'}}>Supabase not connected! Cannot log in.</p>}
      <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
      {err && <p className="adm-err">{err}</p>}
      <button type="submit" disabled={loading || !isRemote}>{loading ? 'Signing in...' : 'Sign in'}</button>
    </form>
  )
}

function Dashboard({ onLogout }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      setRows(mergeByName(await fetchAllRsvps()))
    } catch (e) {
      setError(e.message || 'Failed to load')
      setRows([])
    }
  }
  useEffect(() => { load() }, [])

  const stats = useMemo(() => {
    const r = rows || []
    const attending = r.filter((x) => x.attending)
    const guests = attending.reduce((s, x) => s + (Number(x.guests) || 0), 0)
    const perEvent = EVENTS.map((e) => ({
      name: e.name,
      count: attending.filter((x) => (x.events || []).includes(e.id)).length,
    }))
    return { total: r.length, yes: attending.length, no: r.length - attending.length, guests, perEvent }
  }, [rows])

  async function clearAll() {
    if (!window.confirm('Delete ALL responses? This cannot be undone (use it to clear test entries).')) return
    setError('')
    try {
      await deleteAllRsvps()
      await load()
    } catch (e) {
      setError(e.message || 'Failed to clear')
    }
  }

  function download() {
    const blob = new Blob([toCSV(rows || [])], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rsvp-responses-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="adm">
      <header className="adm__bar">
        <h1>RSVP Responses</h1>
        <div className="adm__actions">
          <button onClick={load}>↻ Refresh</button>
          <button onClick={download} disabled={!rows || !rows.length}>↓ Export CSV</button>
          <button className="adm__danger" onClick={clearAll} disabled={!rows || !rows.length}>✗ Clear all</button>
          <button className="adm__logout" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      {!isRemote && (
        <p className="adm__note">
          ⚠️ Showing <strong>this device's</strong> local responses. Connect Supabase
          (env vars) to collect everyone's responses centrally.
        </p>
      )}
      {error && <p className="adm-err">{error}</p>}

      <section className="adm__stats">
        <div className="adm__stat"><b>{stats.total}</b><span>Responses</span></div>
        <div className="adm__stat adm__stat--yes"><b>{stats.yes}</b><span>Attending</span></div>
        <div className="adm__stat adm__stat--no"><b>{stats.no}</b><span>Declined</span></div>
        <div className="adm__stat"><b>{stats.guests}</b><span>Total guests</span></div>
        {stats.perEvent.map((e) => (
          <div className="adm__stat adm__stat--ev" key={e.name}><b>{e.count}</b><span>{e.name}</span></div>
        ))}
      </section>

      {rows == null ? (
        <p className="adm__loading">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="adm__empty">No responses yet.</p>
      ) : (
        <div className="adm__tablewrap">
          <table className="adm__table">
            <thead>
              <tr><th>#</th><th>Name</th><th>Attending</th><th>Guests</th><th>Events</th><th>Message</th><th>When</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id || i} className={r.attending ? '' : 'is-no'}>
                  <td>{i + 1}</td>
                  <td>{r.name}</td>
                  <td>{r.attending === true ? '✓ Yes' : r.attending === false ? '✗ No' : '💬 Wish'}</td>
                  <td>{r.attending ? r.guests : '-'}</td>
                  <td>{(r.events || []).map((id) => EVENT_NAME[id] || id).join(', ') || '-'}</td>
                  <td className="adm__msg">{r.message || '-'}</td>
                  <td>{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function AdminPortal() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isRemote) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="adm"><p className="adm__loading">Checking authentication...</p></div>

  if (!session && isRemote) {
    return <Login />
  }

  // If local, bypass auth just so we can see the local storage dashboard
  return <Dashboard onLogout={async () => { if (isRemote) await supabase.auth.signOut() }} />
}
