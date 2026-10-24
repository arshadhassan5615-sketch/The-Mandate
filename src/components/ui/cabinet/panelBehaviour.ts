import { useEffect } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react'

// Shared behaviour of the side panels: focus on open, focus back on close,
// Escape to close, and arrow-key navigation of a tablist.
// The panels are non-modal: they take focus when they open and give it back when
// they close, but they do not trap focus.

// The TopBar's More button. The desktop medallion and the phone tool both carry this label.
const MORE_BUTTON_SELECTOR = 'button[aria-label="More"]'

/** An element that still sits in the document and can take focus. The body does not count. */
function canTakeFocus(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement
    && element !== document.body
    && element.isConnected
    && !element.hasAttribute('disabled')
}

/** Gives focus back to the opener, or to the More button when the opener has left the page. */
export function restoreFocus(opener: Element | null): void {
  if (canTakeFocus(opener)) {
    opener.focus()
    return
  }
  const moreButton = document.querySelector(MORE_BUTTON_SELECTOR)
  if (canTakeFocus(moreButton)) moreButton.focus()
}

/** Index of the tab an arrow, Home or End key moves to, wrapping at both ends. Null for other keys. */
export function nextTabIndex(key: string, current: number, count: number): number | null {
  switch (key) {
    case 'ArrowRight': return (current + 1) % count
    case 'ArrowLeft': return (current - 1 + count) % count
    case 'Home': return 0
    case 'End': return count - 1
    default: return null
  }
}

export function handleTablistKeyDown(event: ReactKeyboardEvent<HTMLDivElement>): void {
  const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'))
  const current = tabs.indexOf(event.target as HTMLElement)
  if (current === -1) return
  const next = nextTabIndex(event.key, current, tabs.length)
  const nextTab = next === null ? undefined : tabs[next]
  if (!nextTab) return
  event.preventDefault()
  // Clicking the tab selects it through its own onSelect handler.
  nextTab.focus()
  nextTab.click()
}

/**
 * Focuses the first target that is rendered when the panel mounts, and hands focus back
 * to whatever had it when the panel unmounts.
 */
export function useFocusOnOpen(targets: Array<RefObject<HTMLElement | null>>): void {
  useEffect(() => {
    const opener = document.activeElement
    const focusTarget = targets.map((target) => target.current).find((element) => element != null)
    focusTarget?.focus()
    return () => restoreFocus(opener)
    // The refs are stable objects and the effect must run once per mount, so the
    // array identity (which changes every render) is deliberately not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/** Closes the panel on Escape. */
export function useEscapeToClose(onClose: () => void): void {
  useEffect(() => {
    // Capture phase so Escape closes this panel only, not the next overlay
    // in App's Escape chain as well.
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [onClose])
}
