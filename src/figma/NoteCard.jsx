import { useState } from 'react'
import { submitRsvp } from '../lib/rsvpStore'

const DONE_KEY = 'wedding-note-done'

export default function NoteCard({ style }) {
  const [name, setName] = useState('')
  const [blessing, setBlessing] = useState('')
  const [done, setDone] = useState(
    typeof localStorage !== 'undefined' && !!localStorage.getItem(DONE_KEY),
  )

  async function save() {
    if (done || !blessing.trim()) return
    try {
      await submitRsvp({
        name: name.trim() || 'A guest', contact: '', attending: null,
        guests: 0, events: [], message: blessing.trim(),
      })
      try { localStorage.setItem(DONE_KEY, '1') } catch { /* ignore */ }
      setDone(true)
    } catch { /* keep editable; they can retry */ }
  }

  return (
    <div className="fig__note" style={style}>
      {/* The Interactive Form */}
      {done ? (
        <div className="note__thanks">Thank you for your blessing ♥</div>
      ) : (
        <div className="note__bg">
          <input
            className="note__name" type="text" value={name} maxLength={100}
            onChange={(e) => setName(e.target.value)} aria-label="Name" placeholder="Name"
          />
          <textarea
            className="note__msg" value={blessing} rows={3} maxLength={1000}
            onChange={(e) => setBlessing(e.target.value)}
            aria-label="Write your heartfelt blessings" placeholder="Write your heartfelt blessings..."
          />
          <button className="note__submit" onClick={save}>Submit</button>
        </div>
      )}
    </div>
  )
}
