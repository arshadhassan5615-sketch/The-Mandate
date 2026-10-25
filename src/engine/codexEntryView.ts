import type { CodexEntry } from '../types/codex'

export type AppointmentStatus = 'serving' | 'former' | 'candidate'

export interface CabinetSnapshot {
  ministers: Record<string, { id: string } | null>
  dismissedMinisters: { id: string }[]
}

export interface CodexEntryView {
  title: string
  content: string
}

export function appointmentStatus(candidateId: string, cabinet: CabinetSnapshot): AppointmentStatus {
  const isServing = Object.values(cabinet.ministers).some(m => m !== null && m.id === candidateId)
  if (isServing) return 'serving'
  if (cabinet.dismissedMinisters.some(m => m.id === candidateId)) return 'former'
  return 'candidate'
}

export function viewCodexEntry(entry: CodexEntry, cabinet: CabinetSnapshot): CodexEntryView {
  if (!entry.appointment) return { title: entry.title, content: entry.content }

  const { candidateId, role } = entry.appointment
  const status = appointmentStatus(candidateId, cabinet)
  if (status === 'serving') return { title: entry.title, content: entry.content }

  const label = status === 'former' ? `Former ${role}` : `Candidate for ${role}`
  return {
    title: entry.title.replace(`— ${role}`, `— ${label}`),
    content: entry.content.replace(`**${role}.`, `**${label}.`),
  }
}
