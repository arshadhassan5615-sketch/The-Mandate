export type CodexCategory =
  | 'nations'
  | 'history'
  | 'characters'
  | 'ideologies'
  | 'economy'
  | 'laws'
  | 'journal'

export interface CodexEntry {
  id: string
  category: CodexCategory
  title: string
  content: string          // lightweight markdown: **bold**, *italic*, ## heading, - list
  unlockCondition: 'start' | string  // 'start' = always visible; 'met' = once its character first speaks; otherwise a flag name
  // Minister candidates only: ties the entry to a cabinet appointment so the title and lead line can reflect it.
  appointment?: { candidateId: string; role: string }
}

export const CATEGORY_LABELS: Record<CodexCategory, string> = {
  nations:    'Nations & Geography',
  history:    'History',
  characters: 'Characters',
  ideologies: 'Ideologies',
  economy:    'Economy',
  laws:       'Laws & Constitution',
  journal:    'Personal Journal',
}
