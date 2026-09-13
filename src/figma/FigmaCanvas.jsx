import { useEffect } from 'react'
import { CANVAS, ITEMS } from './manifest'
import { textColor, textWeight } from './textboost'
import ScratchFig from './ScratchFig'
import ScallopPanel from './ScallopPanel'
import RsvpFormFig from './RsvpFormFig'
import NoteCard from './NoteCard'
import Countdown from '../invite/Countdown'
import './fig.css'

const DESIGN_W = CANVAS.w
const cqw = (px) => `${(px / DESIGN_W) * 100}cqw`

// Figma nodes replaced by React components (skip generic render).
const SKIP = new Set([
  '234:199',                                              // full-page base rect
  '234:236', '234:232', '234:233', '234:229', '234:230', // scratch -> ScratchFig
  '197:54',                                               // countdown placeholder -> Countdown
  '329:39', '329:36', '329:46', '329:49', '533:683',     // form labels/inputs -> RsvpFormFig
  '329:15', '329:16', '329:17', '329:18',                // flat form panel -> ScallopPanel (3-hill top)
  '448:31',                                               // duplicate footer disc (real music button instead)
])
const GOLD = '#c9a24a'

// Text that lives outside frame 10 in Figma but belongs on the canvas.
const EXTRA = [
  {
    id: 'extra-celeb', kind: 'text', z: 210, exact: true,
    x: 20.56, y: 35.967721275778146, w: 64.25, h: 0.182,
    // y shifted with the taller canvas (Sukhmani card inserted below)
    text: 'A CELEBRATION OF LOVE, FAITH & FOREVER',
    font: 'Cinzel', size: 10, weight: 700, spacing: 1.2, align: 'CENTER', color: '#8b6e38',
  }, // y/h below rescaled for the taller (6993) canvas
  // Punjabi shabad (Anand Karaj verse) at the very top, above the names.
  { id: 'punjabi', kind: 'img', z: 190, x: 26, y: 2.3440502113487893, w: 48, h: 0.972, src: '/figma/punjabi.png', contain: true },

  // Decorative images from Figma for the Note section
  { id: 'msg1', kind: 'img', z: 89, x: -5, y: 81.69591392340207, w: 65, h: 6.5, src: '/figma/msg1.png', contain: true },
  { id: 'msg3', kind: 'img', z: 89, x: 5, y: 81.06827206353273, w: 90, h: 7.6, src: '/figma/msg3.png', contain: true },
  { id: 'msg2', kind: 'img', z: 89, x: 10, y: 81.24759830920968, w: 92, h: 9.2, src: '/figma/msg2.png', contain: true },

  // Flowers flanking the footer date "3rd December, 2026" (406:19 @ x39.7 y99.3)
  { id: 'fl-date-l', kind: 'img', z: 200, x: 29.5, y: 99.21864992955041, w: 8.5, h: 0.525, src: '/credit/857_571.png', contain: true },
  { id: 'fl-date-r', kind: 'img', z: 200, x: 62.5, y: 99.21864992955041, w: 8.5, h: 0.525, src: '/credit/857_572.png', contain: true, flip: true },
]

// Footer texts: shown statically (no scroll reveal — they were firing too late).
const NO_REVEAL = new Set(['406:16', '406:17', '406:18', '406:19'])

// RSVP heading block (RSVP / Kindly Respond / BEFORE / SEPTEMBER 30)
const RSVP_HEAD = new Set(['329:37', '406:13', '406:14', '406:15'])

function variantFor(it) {
  const center = it.x + it.w / 2
  if (it.align === 'CENTER' || (it.size || 0) >= 28) return 'up'
  if (center < 44) return 'left'
  if (center > 56) return 'right'
  return 'up'
}

function Item({ it }) {
  const base = {
    position: 'absolute', left: `${it.x}%`, top: `${it.y}%`,
    width: `${it.w}%`, height: `${it.h}%`, zIndex: it.z, opacity: it.o ?? 1,
  }

  if (it.kind === 'img') {
    // Full-width section backgrounds bleed to the site edges (no side gaps on
    // mobile). The inset event cards (~86% wide) and photos/florals keep their
    // exact Figma placement.
    const isBg = it.w > 92 && !it.noBg
    const style = isBg
      ? { ...base, left: it.bleedL || '-2%', width: it.bleedW || '104%' }
      : { ...base,
          borderRadius: it.r ? cqw(it.r) : undefined, // round the schedule cards
          objectFit: it.contain ? 'contain' : undefined,
          transform: it.flip ? 'scaleX(-1)' : undefined }
    return (
      <img className="fig__img" src={it.src} alt="" aria-hidden draggable="false"
        loading={it.y < 18 ? 'eager' : 'lazy'} decoding="async" style={style} />
    )
  }

  if (it.kind === 'text') {
    const reveal = !NO_REVEAL.has(it.id)
    return (
      <div className={reveal ? `fig__text rv rv--${variantFor(it)}` : 'fig__text'}
        style={{
          left: `${it.x}%`, top: `${it.y}%`, width: `${it.w}%`, zIndex: it.z,
          fontFamily: `'${it.font}', 'Cormorant Garamond', serif`,
          fontSize: cqw(it.size), fontWeight: textWeight(it),
          letterSpacing: it.spacing ? cqw(it.spacing) : 'normal',
          lineHeight: it.lineh ? cqw(it.lineh) : 1.15,
          color: textColor(it), textAlign: (it.align || 'left').toLowerCase(),
          textShadow: it.shadow || undefined,
          // Respect the designer's explicit line breaks only ? never auto-wrap
          // (bolder text was overflowing its box and wrapping to extra lines).
          whiteSpace: it.text.includes('\n') ? 'pre' : 'nowrap',
        }}>
        {it.text}
      </div>
    )
  }

  // shapes: dots (ellipse), connector/divider lines, or solid rects
  if (it.ellipse) {
    return <div style={{ ...base, background: it.fill || it.stroke || '#c98a76', borderRadius: '50%' }} />
  }
  if (it.line || it.w < 0.5 || it.h < 0.5) {
    const horizontal = it.w >= it.h
    const thick = cqw(Math.max(it.sw || 1.2, 1.2))
    return (
      <div style={{
        position: 'absolute', left: `${it.x}%`, top: `${it.y}%`, zIndex: it.z,
        width: horizontal ? `${it.w}%` : thick,
        height: horizontal ? thick : `${it.h}%`,
        background: it.stroke || it.fill || GOLD, opacity: it.o ?? 1,
      }} />
    )
  }
  return (
    <div style={{ ...base, background: it.fill || 'transparent',
      opacity: it.fillOpacity != null ? it.fillOpacity : base.opacity,
      borderRadius: it.r ? cqw(it.r) : undefined }} />
  )
}

/** Robust scroll-based reveal (IntersectionObserver proved unreliable).
 *  Only starts once the site is opened, so the first-page text animates in. */
function useScrollReveal(active) {
  useEffect(() => {
    if (!active) return
    const root = document.querySelector('.fig')
    if (!root) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const reveal = () => {
      const vh = window.innerHeight
      root.querySelectorAll('.rv:not(.is-in)').forEach((el) => {
        const r = el.getBoundingClientRect()
        // Reveal as the element rises to about mid-screen (feels deliberate + quicker)
        if (reduced || (r.top < vh * 0.68 && r.bottom > vh * 0.05)) el.classList.add('is-in')
      })
    }
    reveal()
    let tick = false
    const onScroll = () => {
      if (tick) return
      tick = true
      requestAnimationFrame(() => { tick = false; reveal() })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    // re-run while images load and layout settles
    const iv = setInterval(reveal, 300)
    const stop = setTimeout(() => clearInterval(iv), 6000)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      clearInterval(iv); clearTimeout(stop)
    }
  }, [active])
}

export default function FigmaCanvas({ onRsvpSaved, opened }) {
  useScrollReveal(opened)
  const scratch = ITEMS.find((i) => i.id === '234:236')
  const cdBox = ITEMS.find((i) => i.id === '197:54')

  return (
    <div className="fig" style={{ aspectRatio: `${CANVAS.w} / ${CANVAS.h}` }}>
      {[...ITEMS.filter((it) => !SKIP.has(it.id)), ...EXTRA].map((it) => (
        <Item key={it.id} it={it} />
      ))}

      {scratch && <ScratchFig rect={{ x: 24, y: 4.867, w: 52, h: 1.300 }} />}

      {/* Inline countdown, in the empty space below "Until Our Forever Begins" */}
      {cdBox && (
        <div className="cd-inline" style={{ left: '8%', top: `${cdBox.y}%`, width: '84%' }}>
          <Countdown />
        </div>
      )}

      {/* Form background — scalloped "3 curve hills" panel (replaces the flat
          Figma ellipses/rect). Sits below the RSVP text + controls.
          y/h shifted with the taller canvas (Sukhmani card inserted above). */}
      <ScallopPanel x={5.841} y={88.958} w={86.817} h={7.044} />

      {/* Inputs laid over the "A Few Words to Treasure" note card */}
      <NoteCard />

      {/* Real form inside the Figma RSVP background */}
      <div className="fig__form">
        <RsvpFormFig onSaved={onRsvpSaved} />
      </div>
    </div>
  )
}
