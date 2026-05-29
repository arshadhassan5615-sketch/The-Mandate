import { useEffect } from 'react'

export interface HotkeyBinding {
  key: string
  ctrl?: boolean
  handler: () => void
  enabled?: () => boolean
}

export function useHotkeys(bindings: HotkeyBinding[]): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      for (const b of bindings) {
        const ctrlOk = b.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey)
        if (e.key.toLowerCase() === b.key.toLowerCase() && ctrlOk) {
          if (b.enabled && !b.enabled()) continue
          e.preventDefault()
          b.handler()
          return
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [bindings])
}
