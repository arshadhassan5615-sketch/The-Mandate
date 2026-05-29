// Web Audio API sound engine — all sounds synthesized programmatically.
// No external audio files required.

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let ambientGain: GainNode | null = null
let uiGain: GainNode | null = null
let cityNoiseNode: AudioScheduledSourceNode | null = null
let pianoInterval: ReturnType<typeof setInterval> | null = null
let initialized = false

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    masterGain = ctx.createGain()
    ambientGain = ctx.createGain()
    uiGain = ctx.createGain()
    ambientGain.connect(masterGain)
    uiGain.connect(masterGain)
    masterGain.connect(ctx.destination)
  }
  return ctx
}

// ─── Volume / mute control ────────────────────────────────────────────────────

let _masterVolume = 0.5
let _ambientVolume = 0.35
let _uiVolume = 0.6
let _masterMuted = false

export function setAudioSettings(opts: {
  masterVolume?: number
  ambientVolume?: number
  uiVolume?: number
  masterMuted?: boolean
}) {
  if (opts.masterVolume !== undefined) _masterVolume = opts.masterVolume
  if (opts.ambientVolume !== undefined) _ambientVolume = opts.ambientVolume
  if (opts.uiVolume !== undefined) _uiVolume = opts.uiVolume
  if (opts.masterMuted !== undefined) _masterMuted = opts.masterMuted

  if (masterGain) {
    masterGain.gain.value = _masterMuted ? 0 : _masterVolume
  }
  if (ambientGain) {
    ambientGain.gain.value = _masterMuted ? 0 : _ambientVolume
  }
  if (uiGain) {
    uiGain.gain.value = _masterMuted ? 0 : _uiVolume
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function noiseBuffer(durationSec: number): AudioBuffer {
  const c = getCtx()
  const len = Math.floor(c.sampleRate * durationSec)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function playNoise(
  durationSec: number,
  lowFreq: number,
  highFreq: number,
  vol = 0.15,
  destination: AudioNode = uiGain!,
) {
  const c = getCtx()
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(durationSec)

  const bandpass = c.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = (lowFreq + highFreq) / 2
  bandpass.Q.value = (lowFreq + highFreq) / 2 / (highFreq - lowFreq)

  const env = c.createGain()
  env.gain.setValueAtTime(0, c.currentTime)
  env.gain.linearRampToValueAtTime(vol, c.currentTime + 0.01)
  env.gain.linearRampToValueAtTime(0, c.currentTime + durationSec)

  src.connect(bandpass)
  bandpass.connect(env)
  env.connect(destination)
  src.start(c.currentTime)
  src.stop(c.currentTime + durationSec)
}

function playTone(
  freq: number,
  durationSec: number,
  vol = 0.12,
  type: OscillatorType = 'sine',
  destination: AudioNode = uiGain!,
) {
  const c = getCtx()
  const osc = c.createOscillator()
  osc.type = type
  osc.frequency.value = freq

  const env = c.createGain()
  env.gain.setValueAtTime(0, c.currentTime)
  env.gain.linearRampToValueAtTime(vol, c.currentTime + 0.008)
  env.gain.linearRampToValueAtTime(0, c.currentTime + durationSec)

  osc.connect(env)
  env.connect(destination)
  osc.start(c.currentTime)
  osc.stop(c.currentTime + durationSec)
}

// ─── Ambient Loops ─────────────────────────────────────────────────────────────

export function startAmbient(sceneType?: string) {
  if (!initialized) {
    getCtx()
    initialized = true
  }
  stopAmbient()
  startCityAmbience()
  if (sceneType === 'personal') startPiano()
}

export function stopAmbient() {
  stopCityAmbience()
  stopPiano()
}

// ── City ambience (distant muffled rumble) ────────────────────────────────────

function startCityAmbience() {
  const c = getCtx()
  const buf = noiseBuffer(4)
  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = true

  const lowpass = c.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 350

  const env = c.createGain()
  env.gain.value = 0.06

  // Slow modulation for "breathing" city feel
  const lfo = c.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.12
  const lfoGain = c.createGain()
  lfoGain.gain.value = 0.02
  lfo.connect(lfoGain)
  lfoGain.connect(env.gain)
  lfo.start()

  src.connect(lowpass)
  lowpass.connect(env)
  env.connect(ambientGain!)
  src.start()
  cityNoiseNode = src
}

function stopCityAmbience() {
  if (cityNoiseNode) {
    try { cityNoiseNode.stop() } catch { /* already stopped */ }
    cityNoiseNode = null
  }
}

// ── Sparse piano (family/personal scenes) ─────────────────────────────────────

const PIANO_NOTES = [
  [523, 659], [587, 698], [523, 659], [440, 554],
  [494, 587], [523, 659], [392, 494], [440, 554],
  [523, 659], [698, 880], [659, 784], [587, 698],
  [523, 659], [440, 554], [392, 494], [349, 440],
]

let pianoNoteIdx = 0

function startPiano() {
  const c = getCtx()
  const playNote = () => {
    if (!ambientGain) return
    const [f1, f2] = PIANO_NOTES[pianoNoteIdx % PIANO_NOTES.length]
    pianoNoteIdx++

    const dur = 1.8 + Math.random() * 0.6
    const vol = 0.025 + Math.random() * 0.015
    const startTime = c.currentTime

    for (const freq of [f1, f2]) {
      const osc = c.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      const env = c.createGain()
      env.gain.setValueAtTime(0, startTime)
      env.gain.linearRampToValueAtTime(vol, startTime + 0.06)
      env.gain.linearRampToValueAtTime(vol * 0.6, startTime + 0.3)
      env.gain.linearRampToValueAtTime(0, startTime + dur)
      osc.connect(env)
      env.connect(ambientGain)
      osc.start(startTime)
      osc.stop(startTime + dur)
    }
  }
  playNote()
  pianoInterval = setInterval(playNote, 3500 + Math.random() * 2000)
}

function stopPiano() {
  if (pianoInterval) { clearInterval(pianoInterval); pianoInterval = null }
}

// ─── UI One-Shot Sounds ────────────────────────────────────────────────────────

export function playTypewriterKey() {
  const c = getCtx()
  if (!uiGain) return
  // Quick filtered click — metallic tap
  const osc = c.createOscillator()
  osc.type = 'square'
  osc.frequency.value = 80 + Math.random() * 120

  const env = c.createGain()
  env.gain.setValueAtTime(0.03, c.currentTime)
  env.gain.linearRampToValueAtTime(0, c.currentTime + 0.015)

  const bandpass = c.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 2500
  bandpass.Q.value = 0.8

  osc.connect(bandpass)
  bandpass.connect(env)
  env.connect(uiGain)
  osc.start(c.currentTime)
  osc.stop(c.currentTime + 0.02)
}

let lastKeyTime = 0
export function playTypewriterKeyThrottled() {
  const now = performance.now()
  if (now - lastKeyTime < 45) return // throttle to ~22 keys/sec max
  lastKeyTime = now
  playTypewriterKey()
}

export function playPaperShuffle() {
  if (!uiGain) return
  playNoise(0.22, 800, 3500, 0.1, uiGain)
  setTimeout(() => playNoise(0.18, 600, 2800, 0.07, uiGain), 80)
}

export function playStamp() {
  if (!uiGain) return
  const c = getCtx()
  // Low thud
  const osc = c.createOscillator()
  osc.type = 'triangle'
  osc.frequency.value = 55
  const env = c.createGain()
  env.gain.setValueAtTime(0.18, c.currentTime)
  env.gain.linearRampToValueAtTime(0, c.currentTime + 0.2)
  osc.connect(env)
  env.connect(uiGain)
  osc.start(c.currentTime)
  osc.stop(c.currentTime + 0.2)
  // Subtle high click for the "stamp" feel
  setTimeout(() => {
    playTone(900, 0.03, 0.06, 'square', uiGain!)
  }, 40)
}

export function playChime() {
  if (!uiGain) return
  const c = getCtx()
  const notes = [523, 659, 784] // C5, E5, G5
  notes.forEach((freq, i) => {
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const env = c.createGain()
    const t = c.currentTime + i * 0.1
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.08, t + 0.03)
    env.gain.linearRampToValueAtTime(0, t + 0.5)
    osc.connect(env)
    env.connect(uiGain!)
    osc.start(t)
    osc.stop(t + 0.5)
  })
}

export function playCodexUnlock() {
  if (!uiGain) return
  const c = getCtx()
  const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const env = c.createGain()
    const t = c.currentTime + i * 0.12
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.07, t + 0.04)
    env.gain.linearRampToValueAtTime(0, t + 0.7)
    osc.connect(env)
    env.connect(uiGain!)
    osc.start(t)
    osc.stop(t + 0.7)
  })
}

export function playPageTurn() {
  if (!uiGain) return
  playNoise(0.15, 400, 2000, 0.08, uiGain)
  setTimeout(() => playNoise(0.12, 500, 1800, 0.05, uiGain), 60)
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────────

export function resumeAudioContext() {
  if (ctx && ctx.state === 'suspended') {
    ctx.resume()
  }
}

export function destroyAudio() {
  stopAmbient()
  if (ctx) {
    ctx.close()
    ctx = null
    masterGain = null
    ambientGain = null
    uiGain = null
    initialized = false
  }
}
