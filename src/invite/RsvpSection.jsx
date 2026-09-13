import { useEffect, useRef, useState } from 'react'
import { EVENTS, WEDDING_DATE } from './layout'
import { submitRsvp } from '../lib/rsvpStore'
import './rsvp-section.css'

const ICONS = {
  radha_ke_naam: '/decor/ic-shagun2.png',
  akhand_path: '/decor/ic-jaago2.png',
  shagun: '/decor/ic-shagun2.png',
  jaago: '/decor/ic-jaago2.png',
  anand_karaj: '/decor/ic-anand2.png',
  reception: '/decor/ic-anand2.png',
}

/** Small hook: adds `is-in` when the element scrolls into view (for float-up). */
function useReveal() {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setInView(true), io.disconnect()),
      { threshold: 0.18 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, inView]
}

/**
 * Fully native, floating RSVP form — real React inputs, no baked artwork.
 * Blush background with floating florals + string lights, a glass card holding
 * the form, and a live submit wired to the RSVP store.
 */
export default function RsvpSection({ onSaved }) {
  const [cardRef, inView] = useReveal()
  const [name, setName] = useState('')
  const [attending, setAttending] = useState(null)
  const [guests, setGuests] = useState(1)
  const [picked, setPicked] = useState([])
  const [state, setState] = useState('idle')
  const [error, setError] = useState('')

  function toggleEvent(id) {
    setPicked((p) => (p.includes(id) ? p.filter((e) => e !== id) : [...p, id]))
  }

  async function send() {
    if (state === 'saving' || state === 'done') return
    if (!name.trim()) return fail('Please enter your name')
    if (attending === null) return fail('Please let us know if you can attend')
    setState('saving')
    setError('')
    try {
      await submitRsvp({
        name: name.trim(),
        contact: '',
        attending,
        guests: attending ? guests : 0,
        events: attending ? picked : [],
        message: null,
      })
      setState('done')
      onSaved?.()
    } catch (err) {
      fail(err.message || 'Could not send. Please try again.')
    }
  }
  function fail(msg) {
    setError(msg)
    setState('error')
  }

  return (
    <section className="rsvp-sec" id="rsvp">
      {/* floating decor — string lights, hanging-lantern drapes, floral corners */}
      <img className="rsvp-sec__lights" src="/decor/string-lights.png" alt="" aria-hidden />
      <img className="rsvp-sec__drape rsvp-sec__drape--l" src="/decor/drape.png" alt="" aria-hidden />
      <img className="rsvp-sec__drape rsvp-sec__drape--r" src="/decor/drape.png" alt="" aria-hidden />
      <img className="rsvp-sec__floral rsvp-sec__floral--l" src="/decor/floral-spray.png" alt="" aria-hidden />
      <img className="rsvp-sec__floral rsvp-sec__floral--r" src="/decor/floral-spray.png" alt="" aria-hidden />

      <div className="rsvp-sec__head">
        <p className="rsvp-sec__rsvp">RSVP</p>
        <h2 className="rsvp-sec__title">Kindly Respond</h2>
        <p className="rsvp-sec__before">
          before <strong>September 30, 2026</strong>
        </p>
      </div>

      <div ref={cardRef} className={`rsvp-card ${inView ? 'is-in' : ''}`}>
        {state === 'done' ? (
          <div className="rsvp-thanks">
            <span className="rsvp-thanks__heart">❤</span>
            <h3>Thank you!</h3>
            <p>Your response is saved. We can’t wait to celebrate with you.</p>
            <button
              className="rsvp-btn rsvp-btn--ghost"
              onClick={() => {
                setName('')
                setAttending(null)
                setGuests(1)
                setPicked([])
                setState('idle')
              }}
            >
              Send another
            </button>
          </div>
        ) : (
          <>
            <label className="rsvp-field">
              <span className="rsvp-field__label">Full name</span>
              <input
                className="rsvp-input"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>

            <div className="rsvp-field">
              <span className="rsvp-field__label">Will you be attending?</span>
              <div className="rsvp-attend">
                <button
                  type="button"
                  className={`rsvp-attend__opt ${attending === true ? 'is-on' : ''}`}
                  onClick={() => setAttending(true)}
                >
                  Joyfully, yes! I’ll be there
                </button>
                <button
                  type="button"
                  className={`rsvp-attend__opt ${attending === false ? 'is-on' : ''}`}
                  onClick={() => setAttending(false)}
                >
                  Sadly, I’ll be celebrating from afar
                </button>
              </div>
            </div>

            <div className="rsvp-collapse">
              <div className="rsvp-field">
                <span className="rsvp-field__label">No. of guests attending</span>
                <div className="rsvp-step">
                  <button
                    type="button"
                    className="rsvp-step__btn"
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    aria-label="Fewer guests"
                  >
                    −
                  </button>
                  <span className="rsvp-step__num" key={guests}>
                    {guests}
                  </span>
                  <button
                    type="button"
                    className="rsvp-step__btn"
                    onClick={() => setGuests((g) => Math.min(9, g + 1))}
                    aria-label="More guests"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="rsvp-field rsvp-field--events">
                <span className="rsvp-field__label">~ Events you will be joining ~</span>
                <div className="rsvp-events">
                  {EVENTS.map((ev) => {
                    const on = picked.includes(ev.id)
                    return (
                      <button
                        type="button"
                        key={ev.id}
                        className={`rsvp-event ${on ? 'is-on' : ''}`}
                        onClick={() => toggleEvent(ev.id)}
                        aria-pressed={on}
                      >
                        <img className="rsvp-event__ic" src={ICONS[ev.id]} alt="" aria-hidden />
                        <span className="rsvp-event__text">
                          <strong>{ev.name}</strong>
                          <em>{ev.venue}</em>
                        </span>
                        <span className="rsvp-event__check">{on ? '✓' : ''}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="rsvp-btn"
              onClick={send}
              disabled={state === 'saving'}
            >
              {state === 'saving' ? 'Sending…' : 'Send RSVP'}
            </button>
            {state === 'error' && <p className="rsvp-err">{error}</p>}
          </>
        )}
      </div>

      {/* Bottom lake + gurudwara scene, then the footer */}
      <img className="rsvp-sec__scene" src="/decor/scene-bottom.png" alt="" aria-hidden />
      <footer className="rsvp-foot">
        <p className="rsvp-foot__with">With love</p>
        <p className="rsvp-foot__names">Akashdeep &amp; Harmandip</p>
        <img className="rsvp-foot__div" src="/decor/divider.png" alt="" aria-hidden />
        <p className="rsvp-foot__date">{WEDDING_DATE}</p>
        <p className="rsvp-foot__tag">#HarManSeAkashTak</p>
      </footer>
    </section>
  )
}
