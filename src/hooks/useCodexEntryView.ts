import { useMemo } from 'react'
import { useCabinetStore } from '../stores/cabinetStore'
import type { CodexEntry } from '../types/codex'
import { viewCodexEntry } from '../engine/codexEntryView'
import type { CabinetSnapshot, CodexEntryView } from '../engine/codexEntryView'

export function useCabinetSnapshot(): CabinetSnapshot {
  const ministers = useCabinetStore(s => s.ministers)
  const dismissedMinisters = useCabinetStore(s => s.dismissedMinisters)
  return useMemo(() => ({ ministers, dismissedMinisters }), [ministers, dismissedMinisters])
}

export function useCodexEntryView(entry: CodexEntry | null): CodexEntryView | null {
  const snapshot = useCabinetSnapshot()
  return useMemo(() => (entry ? viewCodexEntry(entry, snapshot) : null), [entry, snapshot])
}
