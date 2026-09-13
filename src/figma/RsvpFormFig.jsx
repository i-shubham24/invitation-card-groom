import { useState } from 'react'
import { EVENTS } from '../invite/layout'
import { submitRsvp } from '../lib/rsvpStore'

const IC = {
  radha_ke_naam: '/decor/ic-radha2.png',
  akhand_path: '/decor/ic-akhand2.png',
  shagun: '/decor/ic-shagun2.png',
  jaago: '/decor/ic-jaago2.png',
  anand: '/decor/ic-anand2.png',
  reception: '/decor/ic-anand2.png',
}
// Per-icon normalization so every medallion renders the same size and centered
// (the source art has different scale/offset baked in; measured + corrected).
const IC_FIX = {
  radha_ke_naam: 'scale(0.936)',
  akhand_path: 'scale(0.936)',
  shagun: 'scale(0.936)',
  jaago: 'scale(0.936)',
  anand: 'scale(0.936)',
  reception: 'scale(0.936)',
}
const mapUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
const DONE_KEY = 'wedding-rsvp-done-v2' // per-device: 'yes' | 'no'

function Confirmation({ attending }) {
  return (
    <div className="rff__thanks">
      <span>❤</span>
      {attending ? (
        <>
          <p>Yay! We&rsquo;ll be waiting for you to celebrate with us. See you there!</p>
          <div className="rff__contact">
            <p className="rff__contact-line">
              Sehdev and Singh family will be waiting for your presence.
            </p>
            <p className="rff__contact-head">Contact details</p>
            <p>Mohit Sehdev: <a href="tel:+918194963318">+91 81949 63318</a></p>
            <p>Mr Kuldip Singh: <a href="tel:+19029991999">+1 902 999 1999</a></p>
          </div>
        </>
      ) : (
        <p>
          We&rsquo;ll miss you — but we&rsquo;ll be celebrating you from afar.
          <br />Thank you for letting us know. ❤
        </p>
      )}
    </div>
  )
}

/**
 * RsvpFormFig — the RSVP form (Figma-styled), placed in the RSVP background.
 * One submission per device; "Sadly" collapses the details and just submits.
 */
export default function RsvpFormFig({ onSaved }) {
  const already = typeof localStorage !== 'undefined' ? localStorage.getItem(DONE_KEY) : null
  const [name, setName] = useState('')
  const [attending, setAttending] = useState(null)
  const [guests, setGuests] = useState(1)
  const [picked, setPicked] = useState([])
  const [state, setState] = useState(already ? 'done' : 'idle')
  const [doneAttending, setDoneAttending] = useState(already === 'yes')
  const [error, setError] = useState('')

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((e) => e !== id) : [...p, id]))

  async function send() {
    if (state === 'saving' || state === 'done') return
    if (!name.trim()) return (setError('Please enter your name'), setState('error'))
    if (attending === null) return (setError('Please choose an option'), setState('error'))
    setState('saving'); setError('')
    try {
      await submitRsvp({
        name: name.trim(), contact: '', attending,
        guests: attending ? guests : 0, events: attending ? picked : [], message: null,
      })
      try { localStorage.setItem(DONE_KEY, attending ? 'yes' : 'no') } catch { /* ignore */ }
      setDoneAttending(attending)
      setState('done')
      onSaved?.()
    } catch (e) { setError(e.message || 'Could not send'); setState('error') }
  }

  if (state === 'done') return <Confirmation attending={doneAttending} />

  return (
    <div className="rff">
      <label className="rff__label">Full name</label>
      <input className="rff__input" type="text" placeholder="Enter your name"
        value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} />

      <label className="rff__label">Will you be attending?</label>
      <div className="rff__attend">
        <button type="button" className={`rff__pill ${attending === true ? 'on' : ''}`} onClick={() => setAttending(true)}>
          Joyfully, yes! I&rsquo;ll be there
        </button>
        <button type="button" className={`rff__pill ${attending === false ? 'on' : ''}`} onClick={() => setAttending(false)}>
          Sadly, I&rsquo;ll be celebrating from afar
        </button>
      </div>

      {/* Details only when the guest is (or might be) attending */}
      {attending !== false && (
        <>
          <label className="rff__label">No. of guests attending</label>
          <div className="rff__step">
            <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} aria-label="fewer">−</button>
            <span key={guests}>{guests}</span>
            <button type="button" onClick={() => setGuests((g) => Math.min(9, g + 1))} aria-label="more">+</button>
          </div>

          <p className="rff__eventshead">~ Events you will be joining ~</p>
          <div className="rff__events">
            {EVENTS.map((ev) => {
              const on = picked.includes(ev.id)
              return (
                <div key={ev.id} className={`rff__event ${on ? 'on' : ''}`}>
                  <button type="button" className="rff__eventmain" onClick={() => toggle(ev.id)} aria-pressed={on}>
                    <img src={IC[ev.id]} alt="" aria-hidden style={{ transform: IC_FIX[ev.id] }} />
                    <span className="rff__eventtext">
                      <strong>{ev.name}</strong>
                      <em>📍 {ev.venue}</em>
                    </span>
                  </button>
                  <button type="button" className="rff__map" onClick={(e) => { e.stopPropagation(); window.open(mapUrl(ev.map), '_blank'); }} aria-label="Map">Map</button>
                  <button type="button" className={`rff__toggle ${on ? 'on' : ''}`} onClick={() => toggle(ev.id)} aria-label={`Select ${ev.name}`}>
                    <div className="rff__toggle-knob"></div>
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}

      <button type="button" className="rff__send" onClick={send} disabled={state === 'saving'}>
        {state === 'saving' ? 'Sending…' : attending === false ? 'Submit' : 'Send RSVP'}
      </button>
      {state === 'error' && <p className="rff__err">{error}</p>}
    </div>
  )
}
