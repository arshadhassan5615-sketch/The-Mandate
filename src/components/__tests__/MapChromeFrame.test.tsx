// Structural tests for MapChromeFrame: chrome stays, top/bottom HUD rails gone.
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import MapChromeFrame from '../MapChromeFrame'

describe('MapChromeFrame', () => {
  it('does not render top/bottom linear-gradient HUD rails', () => {
    const { container } = render(<MapChromeFrame />)
    const html = container.innerHTML
    expect(html).not.toMatch(/linear-gradient\(180deg,\s*rgba\(10,\s*8,\s*5/)
    expect(html).not.toMatch(/linear-gradient\(0deg,\s*rgba\(10,\s*8,\s*5/)
    expect(html).not.toMatch(/gradient rail/i)
  })

  it('still renders edge vignette and corner flourishes', () => {
    const { container } = render(<MapChromeFrame />)
    const html = container.innerHTML
    expect(html).toMatch(/radial-gradient/)
    // four corner flourish divs + hairline + vignette under the root
    const root = container.firstElementChild as HTMLElement
    expect(root.style.position).toBe('fixed')
    expect(root.style.pointerEvents).toBe('none')
    expect(root.children.length).toBeGreaterThanOrEqual(5)
  })
})
