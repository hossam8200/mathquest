// WebAudio-based sound synthesis. No asset files needed.
// Client-side only — must be called from a 'use client' component.

type SoundName = 'correct' | 'wrong' | 'coin' | 'click' | 'levelup' | 'flip' | 'match' | 'lose'

let ctx: AudioContext | null = null
let muted = false

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch {
      return null
    }
  }
  return ctx
}

export function setMuted(m: boolean) {
  muted = m
}

export function isMuted(): boolean {
  return muted
}

function tone(freq: number, durationMs: number, when = 0, type: OscillatorType = 'sine', gain = 0.2) {
  const c = getCtx()
  if (!c || muted) return
  const now = c.currentTime + when / 1000
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, now)
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(gain, now + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)
  osc.connect(g).connect(c.destination)
  osc.start(now)
  osc.stop(now + durationMs / 1000 + 0.05)
}

export function play(name: SoundName) {
  if (muted) return
  switch (name) {
    case 'correct':
      // Happy rising arpeggio
      tone(523.25, 120, 0, 'sine', 0.2)    // C5
      tone(659.25, 120, 90, 'sine', 0.2)   // E5
      tone(783.99, 200, 180, 'sine', 0.22) // G5
      break
    case 'wrong':
      // Soft descending
      tone(311.13, 180, 0, 'triangle', 0.18) // Eb4
      tone(233.08, 280, 130, 'triangle', 0.18) // Bb3
      break
    case 'coin':
      tone(880, 80, 0, 'square', 0.14)
      tone(1318.51, 140, 70, 'square', 0.14)
      break
    case 'click':
      tone(440, 60, 0, 'sine', 0.1)
      break
    case 'flip':
      tone(660, 50, 0, 'sine', 0.12)
      break
    case 'match':
      tone(659.25, 80, 0, 'sine', 0.18)
      tone(880, 100, 60, 'sine', 0.18)
      break
    case 'levelup':
      tone(523.25, 120, 0, 'square', 0.16)
      tone(659.25, 120, 100, 'square', 0.16)
      tone(783.99, 120, 200, 'square', 0.16)
      tone(1046.5, 300, 300, 'square', 0.18)
      break
    case 'lose':
      tone(392, 200, 0, 'triangle', 0.16)
      tone(311.13, 300, 180, 'triangle', 0.16)
      tone(261.63, 400, 360, 'triangle', 0.16)
      break
  }
}

// Some browsers require a user gesture to start the audio context.
export function unlockAudio() {
  const c = getCtx()
  if (c && c.state === 'suspended') {
    c.resume().catch(() => {})
  }
}
