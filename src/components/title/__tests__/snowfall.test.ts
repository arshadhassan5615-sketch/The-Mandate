import { describe, it, expect } from 'vitest'
import { FLAKE_COUNT, LAYERS, createFlakes, stepFlakes, windAt, type Flake } from '../snowfall'

const LCG_MULTIPLIER = 1664525
const LCG_INCREMENT = 1013904223
const LCG_MODULUS = 4294967296
const WIDTH = 300
const HEIGHT = 400
const STEP_SEC = 0.05
const TIME_SEC = 3.7

function seededRand(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * LCG_MULTIPLIER + LCG_INCREMENT) % LCG_MODULUS
    return state / LCG_MODULUS
  }
}

function makeFlake(overrides: Partial<Flake> = {}): Flake {
  return { x: 100, y: 100, r: 1, speed: 20, drift: 8, phase: 0.5, alpha: 0.6, ...overrides }
}

const neverRand = (): number => 0.5

describe('createFlakes', () => {
  it('creates exactly FLAKE_COUNT flakes split 50/39/21 across the layers', () => {
    const flakes = createFlakes(WIDTH, HEIGHT, seededRand(1))
    expect(flakes).toHaveLength(FLAKE_COUNT)
    expect(FLAKE_COUNT).toBe(110)

    const countFor = (alpha: number) => flakes.filter(f => f.alpha === alpha).length
    expect(countFor(LAYERS[0].alpha)).toBe(50)
    expect(countFor(LAYERS[1].alpha)).toBe(39)
    expect(countFor(LAYERS[2].alpha)).toBe(21)
  })

  it('keeps every flake inside its layer radius and speed range and inside the canvas', () => {
    const flakes = createFlakes(WIDTH, HEIGHT, seededRand(7))
    for (const layer of LAYERS) {
      const inLayer = flakes.filter(f => f.alpha === layer.alpha)
      for (const flake of inLayer) {
        expect(flake.r).toBeGreaterThanOrEqual(layer.rMin)
        expect(flake.r).toBeLessThanOrEqual(layer.rMax)
        expect(flake.speed).toBeGreaterThanOrEqual(layer.speedMin)
        expect(flake.speed).toBeLessThanOrEqual(layer.speedMax)
      }
    }
    for (const flake of flakes) {
      expect(flake.x).toBeGreaterThanOrEqual(0)
      expect(flake.x).toBeLessThan(WIDTH)
      expect(flake.y).toBeGreaterThanOrEqual(0)
      expect(flake.y).toBeLessThan(HEIGHT)
    }
  })
})

describe('windAt', () => {
  it('matches the gusting leftward wind formula', () => {
    const expected = -26 + 5 * Math.sin(TIME_SEC * 0.23) + 3 * Math.sin(TIME_SEC * 0.61 + 1.3)
    expect(windAt(TIME_SEC)).toBeCloseTo(expected, 10)
  })

  it('is always negative so snow never drifts right', () => {
    for (let t = 0; t <= 60; t += 0.5) {
      expect(windAt(t)).toBeLessThan(0)
    }
  })
})

describe('stepFlakes', () => {
  it('does not mutate the input flakes', () => {
    const flakes = createFlakes(WIDTH, HEIGHT, seededRand(3))
    const snapshot = structuredClone(flakes)
    stepFlakes(flakes, STEP_SEC, TIME_SEC, WIDTH, HEIGHT, seededRand(4))
    expect(flakes).toEqual(snapshot)
  })

  it('moves a flake down by speed * dt', () => {
    const flake = makeFlake({ y: 100, speed: 30 })
    const [next] = stepFlakes([flake], STEP_SEC, TIME_SEC, WIDTH, HEIGHT, neverRand)
    expect(next.y).toBeCloseTo(100 + 30 * STEP_SEC, 10)
  })

  it('respawns a flake that falls past the bottom to y = -r', () => {
    const flake = makeFlake({ y: HEIGHT + 10, r: 1.5 })
    const [next] = stepFlakes([flake], STEP_SEC, TIME_SEC, WIDTH, HEIGHT, neverRand)
    expect(next.y).toBe(-1.5)
    expect(next.x).toBeGreaterThanOrEqual(0)
    expect(next.x).toBeLessThan(WIDTH * 1.35)
    expect(next.x).toBeCloseTo(0.5 * WIDTH * 1.35, 10)
    expect(next.r).toBe(flake.r)
    expect(next.speed).toBe(flake.speed)
    expect(next.alpha).toBe(flake.alpha)
  })

  it('wraps a flake past the right edge to x = -r', () => {
    const flake = makeFlake({ x: WIDTH + 5, r: 1 })
    const [next] = stepFlakes([flake], STEP_SEC, TIME_SEC, WIDTH, HEIGHT, neverRand)
    expect(next.x).toBe(-1)
  })

  it('wraps a flake past the left edge to x = width + r', () => {
    const flake = makeFlake({ x: -5, r: 1 })
    const [next] = stepFlakes([flake], STEP_SEC, TIME_SEC, WIDTH, HEIGHT, neverRand)
    expect(next.x).toBe(WIDTH + 1)
  })

  it('clamps dt so a huge time jump moves no further than a 0.05 s step', () => {
    const flakes = createFlakes(WIDTH, HEIGHT, seededRand(9))
    const clamped = stepFlakes(flakes, 10, TIME_SEC, WIDTH, HEIGHT, seededRand(11))
    const reference = stepFlakes(flakes, STEP_SEC, TIME_SEC, WIDTH, HEIGHT, seededRand(11))
    expect(clamped).toEqual(reference)
  })
})
