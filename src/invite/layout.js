/**
 * Layout map for the invitation.
 * ----------------------------------------------------------------------------
 * The visual layer is the original Figma/PDF artwork, rendered to 9 gap-free
 * JPEG slices that stack to reconstruct the full 428 x 6123 card. Interactive
 * overlays are positioned in PAGE PERCENTAGES (relative to the whole card), so
 * they stay locked to the artwork at any width.
 *
 * All coordinates were measured directly from the source PDF (text search +
 * pixel sampling), not eyeballed.
 */

// The artwork layer now covers slices s1–s8 only (0–86% of the original card).
// The RSVP + footer (old s9) is rebuilt natively in RsvpSection, so the artwork
// container's aspect ratio and the scratch position are scaled to that 0–86%.
const ARTWORK_FRACTION = 0.86
export const CARD_RATIO = 14.3061 * ARTWORK_FRACTION // ≈ 12.303

// Ordered, gap-free slices of the artwork (first one loads eagerly).
export const SLICES = [
  's1.jpg', 's2.jpg', 's3.jpg', 's4.jpg',
  's5.jpg', 's6.jpg', 's7.jpg', 's8.jpg',
]

// Colours sampled from the artwork so overlays blend seamlessly.
export const C = {
  scratchCoat: '#f2c4bd',
  scratchCard: '#f9d3ce',
  pill: '#e8c1b3',
  pillActive: '#c98a76',
  card: '#f9d1c7',
  send: '#c2a39a',
  ink: '#6b4a44',
  placeholder: '#a98d82',
  gold: '#b98a4e',
  footer: '#d58682',
  contactBg: '#dfaca3',
}

// Scratch card region — page % rescaled to the s1–s8 artwork container
// (original 5.62% / 1.55% of the full card ÷ 0.86).
export const SCRATCH = { left: 26.4, top: 6.535, width: 47.5, height: 1.802 }

// RSVP interactive zones (page %), measured against the artwork controls.
export const RSVP = {
  card: { left: 7.3, top: 89.5, width: 86.2, height: 6.7 },
  name: { left: 19.3, top: 90.06, width: 61.7, height: 0.44 },
  attendYes: { left: 21.4, top: 90.8, width: 26.5, height: 0.55 },
  attendNo: { left: 50.6, top: 90.8, width: 26.8, height: 0.55 },
  minus: { left: 18.5, top: 91.72, width: 8, height: 0.46 },
  guests: { left: 43, top: 91.72, width: 14, height: 0.46 },
  plus: { left: 73.5, top: 91.72, width: 8, height: 0.46 },
  events: [
    { id: 'shagun', top: 92.44, checkX: 77 },
    { id: 'jaago', top: 93.11, checkX: 77 },
    { id: 'anand', top: 93.77, checkX: 77 },
    { id: 'reception', top: 94.4, checkX: 77 },
  ],
  eventRow: { left: 8.8, width: 72, height: 0.6 },
  send: { left: 36.5, top: 95.02, width: 27, height: 0.72 },
}

// Event metadata for the RSVP form. `venue` is shown; `map` opens Google Maps.
export const EVENTS = [
  { id: 'radha_ke_naam', name: 'Radha Ke Naam', venue: 'At Residence', map: 'At Residence' },
  { id: 'akhand_path', name: 'Akhand Path Bhog', venue: 'At Residence', map: 'At Residence' },
  { id: 'shagun', name: 'Shagun', venue: 'At Blessings Resort, Rayya', map: 'Blessings Resort, Rayya' },
  { id: 'jaago', name: 'Jaago', venue: 'At Green Tulip, Amritsar', map: 'Green Tulip, Amritsar' },
  { id: 'anand', name: 'Anand Karaj', venue: 'At Baba Shri Chand Ji Gurudwara, Sandhu Colony, Amritsar', map: 'Baba Shri Chand Ji Gurudwara, Sandhu Colony, Amritsar' },
  { id: 'reception', name: 'Wedding reception', venue: 'At Maribella Resort, Amritsar', map: 'Maribella Resort, Amritsar' },
]

export const COUPLE = 'Akashdeep Singh Sehdev & Harmandip Kaur'
export const WEDDING_DATE = '3 December, 2026'
// Month is 0-indexed: 11 = December. Used by the countdown.
export const WEDDING_AT = new Date(2026, 11, 3, 10, 0, 0)
