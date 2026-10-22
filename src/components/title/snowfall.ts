export interface Flake {
  x: number
  y: number
  r: number
  speed: number
  drift: number
  phase: number
  alpha: number
}

export const FLAKE_COUNT = 110

export const LAYERS = [ // far → near
  { share: 0.45, rMin: 0.7, rMax: 1.3, speedMin: 14, speedMax: 24, alpha: 0.5 },
  { share: 0.35, rMin: 1.3, rMax: 2.2, speedMin: 24, speedMax: 38, alpha: 0.75 },
  { share: 0.2, rMin: 2.2, rMax: 3.6, speedMin: 38, speedMax: 58, alpha: 0.95 },
] as const

/** Steady leftward wind so snow falls from top-right to bottom-left (px/s, negative = towards the left) */
export const WIND_BASE = -26

type SnowLayer = (typeof LAYERS)[number]

const TWO_PI = Math.PI * 2
const DRIFT_MIN_PX = 6
const DRIFT_RANGE_PX = 10
const MAX_STEP_SEC = 0.05
const WIND_REFERENCE_SPEED = 40
const WIND_AMP_PRIMARY = 5
const WIND_RATE_PRIMARY = 0.23
const WIND_AMP_SECONDARY = 3
const WIND_RATE_SECONDARY = 0.61
const RESPAWN_X_SPAN = 1.35
const WIND_PHASE_SECONDARY = 1.3
const SWAY_RATE = 1.1
const SWAY_STRENGTH = 0.6

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t
}

function createFlake(
  layer: SnowLayer,
  width: number,
  height: number,
  rand: () => number,
): Flake {
  return {
    x: rand() * width,
    y: rand() * height,
    r: lerp(layer.rMin, layer.rMax, rand()),
    speed: lerp(layer.speedMin, layer.speedMax, rand()),
    drift: DRIFT_MIN_PX + rand() * DRIFT_RANGE_PX,
    phase: rand() * TWO_PI,
    alpha: layer.alpha,
  }
}

export function createFlakes(
  width: number,
  height: number,
  rand: () => number = Math.random,
): Flake[] {
  const flakes: Flake[] = []
  let remaining = FLAKE_COUNT
  LAYERS.forEach((layer, index) => {
    const isLast = index === LAYERS.length - 1
    const count = isLast ? remaining : Math.round(FLAKE_COUNT * layer.share)
    remaining -= count
    for (let i = 0; i < count; i++) {
      flakes.push(createFlake(layer, width, height, rand))
    }
  })
  return flakes
}

export function windAt(timeSec: number): number {
  return (
    WIND_BASE +
    WIND_AMP_PRIMARY * Math.sin(timeSec * WIND_RATE_PRIMARY) +
    WIND_AMP_SECONDARY * Math.sin(timeSec * WIND_RATE_SECONDARY + WIND_PHASE_SECONDARY)
  )
}

function wrapX(x: number, r: number, width: number): number {
  if (x < -r) return width + r
  if (x > width + r) return -r
  return x
}

function stepFlake(
  flake: Flake,
  dtSec: number,
  timeSec: number,
  width: number,
  height: number,
  rand: () => number,
): Flake {
  const gust = windAt(timeSec) * (flake.speed / WIND_REFERENCE_SPEED)
  const sway = Math.cos(timeSec * SWAY_RATE + flake.phase) * flake.drift * SWAY_STRENGTH
  const movedX = flake.x + (gust + sway) * dtSec
  const movedY = flake.y + flake.speed * dtSec

  if (movedY - flake.r > height) {
    return { ...flake, x: rand() * width * RESPAWN_X_SPAN, y: -flake.r }
  }
  return { ...flake, x: wrapX(movedX, flake.r, width), y: movedY }
}

export function stepFlakes(
  flakes: readonly Flake[],
  dtSec: number,
  timeSec: number,
  width: number,
  height: number,
  rand: () => number = Math.random,
): Flake[] {
  const clampedDt = Math.min(dtSec, MAX_STEP_SEC)
  return flakes.map(flake => stepFlake(flake, clampedDt, timeSec, width, height, rand))
}
