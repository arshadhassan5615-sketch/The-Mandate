import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

/** Conversation controls: a press on one of these never advances the text or starts a hold. */
export const NO_ADVANCE_SELECTOR = 'button, a, input, textarea, select, [role="button"], [data-no-advance]'

/** How long a finger must rest on the conversation before it starts skipping, like holding Ctrl. */
export const TOUCH_HOLD_MS = 500

/** A finger that travels further than this is scrolling, not holding. */
const HOLD_SLOP_PX = 10

/**
 * Touch equivalent of holding Ctrl: a finger held on the conversation column for
 * TOUCH_HOLD_MS reports held until it lifts. Presses on controls (matched by
 * ignoreSelector) and presses that move are not holds. The tap that ends a hold
 * is swallowed so lifting the finger does not advance one extra line.
 * Listeners sit on the window so a release outside the column is never missed.
 */
export function useTouchHold(
  columnRef: RefObject<HTMLElement | null>,
  ignoreSelector: string,
): { held: boolean; heldRef: RefObject<boolean> } {
  const heldRef = useRef(false)
  const [held, setHeldState] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    let start: { id: number; x: number; y: number } | null = null
    let swallowClick = false

    const setHeld = (next: boolean) => {
      heldRef.current = next
      setHeldState(next)
    }
    const clearTimer = () => {
      if (timer !== null) clearTimeout(timer)
      timer = null
    }
    const release = () => {
      clearTimer()
      start = null
      if (heldRef.current) {
        swallowClick = true
        setHeld(false)
      }
    }

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return
      const target = e.target as Element | null
      if (!target || !columnRef.current?.contains(target)) return
      if (target.closest(ignoreSelector)) return
      release()
      swallowClick = false
      start = { id: e.pointerId, x: e.clientX, y: e.clientY }
      timer = setTimeout(() => {
        timer = null
        setHeld(true)
      }, TOUCH_HOLD_MS)
    }
    const onMove = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > HOLD_SLOP_PX) release()
    }
    const onUp = (e: PointerEvent) => {
      if (start && e.pointerId === start.id) release()
    }
    const onClick = (e: MouseEvent) => {
      if (!swallowClick) return
      swallowClick = false
      e.stopPropagation()
      e.preventDefault()
    }
    // The phone's long-press menu would steal the finger while skipping.
    const onContextMenu = (e: MouseEvent) => {
      if (start || heldRef.current) e.preventDefault()
    }

    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    window.addEventListener('blur', release)
    window.addEventListener('click', onClick, true)
    window.addEventListener('contextmenu', onContextMenu)
    return () => {
      clearTimer()
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('blur', release)
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('contextmenu', onContextMenu)
      heldRef.current = false
    }
  }, [columnRef, ignoreSelector])

  return { held, heldRef }
}
