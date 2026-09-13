import { supabase } from './supabase'

const LOCAL_KEY = 'wedding-rsvps-v2'
export const isRemote = Boolean(supabase)

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}
function writeLocal(rows) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows))
}

const normName = (n) => String(n || '').trim().toLowerCase().replace(/\s+/g, ' ')

function meaningful(entry) {
  const p = {}
  if (entry.contact) p.contact = entry.contact
  if (entry.attending !== null && entry.attending !== undefined) {
    p.attending = entry.attending
    p.guests = entry.guests
    p.events = entry.events
  }
  if (entry.message != null && String(entry.message).trim()) p.message = entry.message
  return p
}

export async function submitRsvp(entry) {
  const key = normName(entry.name)

  if (!isRemote) {
    const rows = readLocal()
    const idx = rows.findIndex((r) => normName(r.name) === key)
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...meaningful(entry) }
      writeLocal(rows)
      return rows[idx]
    }
    const row = { id: `local-${Date.now()}`, ...entry, created_at: new Date().toISOString() }
    rows.unshift(row)
    writeLocal(rows)
    return row
  }

  // Always INSERT. The admin panel's mergeByName will combine multiple 
  // entries (RSVP + Note) from the same person.
  // This allows us to revoke UPDATE permissions from the public anon role.
  const payload = { ...entry, created_at: new Date().toISOString() }
  const { data, error } = await supabase.from('rsvps').insert([payload]).select()
  
  if (error) throw new Error(error.message || 'Could not save your RSVP')
  return data[0]
}

export async function deleteAllRsvps() {
  if (!isRemote) {
    writeLocal([])
    return
  }
  
  // Note: RLS allows DELETE only for authenticated users (the admin).
  // This will fail if the user is not logged in.
  const { error } = await supabase.from('rsvps').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw new Error(error.message || 'Could not clear responses')
}

export async function fetchAllRsvps() {
  if (!isRemote) return readLocal()
  
  // RLS requires the user to be authenticated to read all RSVPs.
  const { data, error } = await supabase.from('rsvps').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message || 'Could not load responses')
  return data
}

export async function fetchWishes(limit = 24) {
  if (!isRemote) {
    return readLocal().filter((r) => r.message?.trim()).slice(0, limit)
  }

  // RLS allows anon to read rows where message is not null.
  const { data, error } = await supabase
    .from('rsvps')
    .select('name,message,created_at')
    .not('message', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)
    
  if (error) return []
  return data.filter((r) => r.message?.trim())
}
