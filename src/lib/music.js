/**
 * Shared background-music controller (single <audio> for the whole site).
 * The envelope's heart-tap starts it (that tap is the user gesture browsers
 * require to allow sound); the music button toggles/pauses the same element.
 */
let audio = null

function get() {
  if (!audio) {
    audio = new Audio('/media/laavan-phere.mp3')
    audio.loop = true
    audio.volume = 0.6
    audio.preload = 'auto'
  }
  return audio
}

/** Start playback. Call this from within a user gesture (e.g. the heart tap). */
export function playMusic() {
  return get().play()
}

export function toggleMusic() {
  const a = get()
  if (a.paused) return a.play()
  a.pause()
  return Promise.resolve()
}

export function isMusicPlaying() {
  return audio ? !audio.paused : false
}

/** Subscribe to play/pause changes; returns an unsubscribe fn. */
export function onMusicChange(cb) {
  const a = get()
  a.addEventListener('play', cb)
  a.addEventListener('pause', cb)
  return () => {
    a.removeEventListener('play', cb)
    a.removeEventListener('pause', cb)
  }
}
