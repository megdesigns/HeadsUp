// The signature sound that plays as the plane passes mid-screen: the Duck
// "quack" sample, plus Mia's short bell ring (synthesized, no sample needed). Shared by the overlay (real flights) and settings (previews).
import quackUrl from './overlay/quack.wav'

export type SoundPack = { id: string; name: string; free: boolean }

export const SOUNDS: SoundPack[] = [
  { id: 'quack', name: 'Duck', free: true },
  { id: 'ring', name: 'Mia', free: true }
]

export function soundById(id: string | undefined): SoundPack {
  return SOUNDS.find((s) => s.id === id) ?? SOUNDS[0]
}

const URLS: Record<string, string> = {
  quack: quackUrl
}

const buffers: Record<string, AudioBuffer> = {}
const loading: Record<string, Promise<void>> = {}

/** Decodes one sample once and caches it. */
function load(ctx: AudioContext, id: string): Promise<void> {
  if (buffers[id]) return Promise.resolve()
  const url = URLS[id]
  if (!url) return Promise.resolve()
  if (!loading[id]) {
    loading[id] = fetch(url)
      .then((r) => r.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((decoded) => {
        buffers[id] = decoded
      })
      .catch(() => {
        delete loading[id]
      })
  }
  return loading[id]
}

/** Warms up the default sample so the first flight isn't silent. */
export function preloadSounds(ctx: AudioContext): void {
  void load(ctx, 'quack')
}

/**
 * Plays the chosen animal sound. The sample loads asynchronously and plays as
 * soon as it's ready (never before `when`).
 */
export function playSound(ctx: AudioContext, id: string, when?: number, volume = 0.9): void {
  const at = when ?? ctx.currentTime
  if (id === 'ring') {
    playRing(ctx, Math.max(at, ctx.currentTime), volume)
    return
  }
  void load(ctx, id).then(() => {
    const buffer = buffers[id]
    if (!buffer) return
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.value = volume
    src.connect(gain).connect(ctx.destination)
    src.start(Math.max(at, ctx.currentTime))
  })
}

/**
 * Mia's sound: a short, bright bell "brring" — two quick strikes of a small
 * bell (a few inharmonic sine partials, each decaying fast), ~0.6s total.
 */
function playRing(ctx: AudioContext, at: number, volume: number): void {
  const out = ctx.createGain()
  out.gain.value = volume * 0.5
  out.connect(ctx.destination)

  const partials = [
    { ratio: 1, gain: 1, decay: 0.45 },
    { ratio: 2.76, gain: 0.45, decay: 0.28 },
    { ratio: 5.4, gain: 0.22, decay: 0.16 }
  ]
  const strike = (t: number, base: number): void => {
    for (const p of partials) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = base * p.ratio
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(p.gain, t + 0.006)
      g.gain.exponentialRampToValueAtTime(0.0001, t + p.decay)
      osc.connect(g).connect(out)
      osc.start(t)
      osc.stop(t + p.decay + 0.02)
    }
  }
  strike(at, 1318.5) // E6
  strike(at + 0.14, 1318.5)
}
