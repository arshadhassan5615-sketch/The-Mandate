import type { MouseEvent, PointerEvent } from 'react'

/** How long a finger must rest on a codex link before it opens the Codex. */
export const LONG_PRESS_MS = 450

// jsdom has no matchMedia, so this reads as a mouse-driven device there.
export function isCoarsePointer(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(pointer: coarse)').matches
}

interface PressState {
  timer: ReturnType<typeof setTimeout> | null
  longPressed: boolean
}

// Press state lives per link element, not in the handler closure. Handlers are
// recreated on every render, and typing re-renders the column while a finger is
// down, so closure state would be lost mid-press and the timer could fire after
// its release. Keying by currentTarget keeps one state object per DOM node.
const pressStates = new WeakMap<Element, PressState>()

function stateFor(target: Element): PressState {
  const existing = pressStates.get(target)
  if (existing) return existing
  const created: PressState = { timer: null, longPressed: false }
  pressStates.set(target, created)
  return created
}

function clearPressTimer(target: Element): void {
  const state = stateFor(target)
  if (state.timer !== null) clearTimeout(state.timer)
  state.timer = null
}

/**
 * Codex link handlers. Mouse: a click opens the Codex. Coarse pointer (touch):
 * a short tap falls through to the conversation so it advances, a press held for
 * LONG_PRESS_MS opens the Codex, and the phone's long-press menu is suppressed.
 * Pointer-up/leave/cancel receive the event so the state can be found per element.
 */
export function codexLinkHandlers(open: () => void): {
  onClick: (e: MouseEvent) => void
  onPointerDown: (e: PointerEvent) => void
  onPointerUp: (e: PointerEvent) => void
  onPointerLeave: (e: PointerEvent) => void
  onPointerCancel: (e: PointerEvent) => void
  onContextMenu: (e: MouseEvent) => void
  'data-codex-link': true
} {
  return {
    onClick: (e) => {
      if (!isCoarsePointer()) {
        e.stopPropagation()
        open()
        return
      }
      const state = stateFor(e.currentTarget)
      if (state.longPressed) {
        // The Codex is already open from the long press; swallow the click.
        e.stopPropagation()
        state.longPressed = false
      }
      // Otherwise do nothing, so the click bubbles and the column advances.
    },
    onPointerDown: (e) => {
      if (e.pointerType === 'mouse' || !isCoarsePointer()) return
      const target = e.currentTarget
      const state = stateFor(target)
      clearPressTimer(target)
      state.longPressed = false
      state.timer = setTimeout(() => {
        state.timer = null
        state.longPressed = true
        open()
      }, LONG_PRESS_MS)
    },
    onPointerUp: (e) => clearPressTimer(e.currentTarget),
    onPointerLeave: (e) => clearPressTimer(e.currentTarget),
    onPointerCancel: (e) => clearPressTimer(e.currentTarget),
    onContextMenu: (e) => {
      if (isCoarsePointer()) e.preventDefault()
    },
    'data-codex-link': true,
  }
}
