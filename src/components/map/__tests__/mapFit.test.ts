import { describe, it, expect } from 'vitest'
import { countryBounds, desktopZoom, phoneZoom, panToCenter, clampPan } from '../mapFit'
import { MAP_RENDER_WIDTH, MAP_RENDER_HEIGHT, PROVINCE_PIN_POSITIONS } from '../../../engine/LocationResolver'

const PHONE = { vw: 390, vh: 844, chrome: 140 }

describe('countryBounds', () => {
  it('contains every Veltrian province pin but not Sovarka', () => {
    const b = countryBounds()
    for (const id of ['ashenmere', 'kravenstal', 'dravenhollow', 'thornfeld', 'aldenmoor', 'sevagrad'] as const) {
      const p = PROVINCE_PIN_POSITIONS[id]
      expect(p.x).toBeGreaterThan(b.left)
      expect(p.x).toBeLessThan(b.right)
      expect(p.y).toBeGreaterThan(b.top)
      expect(p.y).toBeLessThan(b.bottom)
    }
    expect(PROVINCE_PIN_POSITIONS.sovarka.y).toBeGreaterThan(b.bottom)
  })
})

describe('phoneZoom', () => {
  it('fits the whole country on a 390px phone', () => {
    const b = countryBounds()
    const zoom = phoneZoom(PHONE.vw, PHONE.vh, PHONE.chrome)
    expect((b.right - b.left) * zoom).toBeLessThanOrEqual(PHONE.vw)
    expect((b.bottom - b.top) * zoom).toBeLessThanOrEqual(PHONE.vh - PHONE.chrome)
  })

  it('zooms out further than the desktop rule would on a phone', () => {
    expect(phoneZoom(PHONE.vw, PHONE.vh, PHONE.chrome)).toBeLessThan(desktopZoom(PHONE.vw, PHONE.vh))
  })
})

describe('desktopZoom', () => {
  it('always covers the viewport', () => {
    const zoom = desktopZoom(1440, 900)
    expect(MAP_RENDER_WIDTH * zoom).toBeGreaterThanOrEqual(1440)
    expect(MAP_RENDER_HEIGHT * zoom).toBeGreaterThanOrEqual(900)
  })
})

describe('clampPan', () => {
  it('keeps a map larger than the viewport against its edges', () => {
    expect(clampPan(50, 50, 1, 1440, 900)).toEqual({ x: 0, y: 0 })
    expect(clampPan(-99999, -99999, 1, 1440, 900)).toEqual({ x: 1440 - MAP_RENDER_WIDTH, y: 900 - MAP_RENDER_HEIGHT })
  })

  it('centres the map on an axis where it is smaller than the viewport', () => {
    const zoom = 0.3
    const { y } = clampPan(0, -500, zoom, 390, 844)
    expect(y).toBe(Math.round((844 - MAP_RENDER_HEIGHT * zoom) / 2))
  })
})

describe('panToCenter', () => {
  it('puts the country centre in the middle of the screen', () => {
    const b = countryBounds()
    const zoom = phoneZoom(PHONE.vw, PHONE.vh, PHONE.chrome)
    const pan = panToCenter(b, zoom, PHONE.vw, PHONE.vh)
    const centreOnScreen = pan.x + ((b.left + b.right) / 2) * zoom
    expect(Math.abs(centreOnScreen - PHONE.vw / 2)).toBeLessThanOrEqual(1)
  })
})
