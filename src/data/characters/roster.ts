import type { FactionState, PersonalState } from '../../types/gameState'

export type CharacterCategory = 'cabinet' | 'parliament' | 'foreign' | 'family' | 'other'

export interface CharacterMapEntry {
  id: string
  name: string
  title: string
  category: CharacterCategory
  description: string
  factionKey?: keyof FactionState
  personalKey?: keyof PersonalState
  codexEntryId: string
}

export const RELATIONSHIP_THRESHOLDS = [
  { min: 80, label: 'Your closest ally' },
  { min: 65, label: 'Loyal and dependable' },
  { min: 50, label: 'Loyal but wary' },
  { min: 35, label: 'Cautiously neutral' },
  { min: 20, label: 'Skeptical of your leadership' },
  { min: 0,  label: 'Openly hostile' },
] as const

export function getRelationshipLabel(score: number): string {
  return RELATIONSHIP_THRESHOLDS.find(t => score >= t.min)?.label ?? 'Unknown'
}

export const CHARACTERS: CharacterMapEntry[] = [
  // ── Cabinet ──────────────────────────────────────────────────────
  {
    id: 'character_vyktor_reznik',
    name: 'Vyktor Reznik',
    title: 'Chief of Staff',
    category: 'cabinet',
    description: 'Your closest advisor. A man who has made a career of being indispensable to powerful people — but has chosen to be indispensable to you.',
    factionKey: 'reformists',
    codexEntryId: 'character_vyktor_reznik',
  },
  {
    id: 'character_danika_oberlin',
    name: 'Danika Oberlin',
    title: 'Minister of the Interior',
    category: 'cabinet',
    description: 'A career civil servant who stayed through three Halvekist administrations. Her institutional knowledge is unparalleled; her loyalties are still being tested.',
    factionKey: 'reformists',
    codexEntryId: 'character_danika_oberlin',
  },
  {
    id: 'character_elara_vostane',
    name: 'Elara Vostane',
    title: 'Minister of Finance',
    category: 'cabinet',
    description: 'The finest economic mind of her generation. She believes in numbers the way some people believe in scripture — and she will follow them wherever they lead.',
    factionKey: 'businessClass',
    codexEntryId: 'character_elara_vostane',
  },
  {
    id: 'character_gregor_maric',
    name: 'Gregor Marić',
    title: 'Minister of Labor',
    category: 'cabinet',
    description: 'A foundry foreman who became a union organizer who became a minister. He still wears work boots under his ministerial suit.',
    factionKey: 'workersCoalition',
    codexEntryId: 'character_gregor_maric',
  },
  {
    id: 'character_aldric_theron',
    name: 'Prof. Aldric Theron',
    title: 'Minister of Justice',
    category: 'cabinet',
    description: 'A constitutional scholar who spent thirty years writing about what a just Veltria would look like. Now he is trying to build one.',
    factionKey: 'reformists',
    codexEntryId: 'character_aldric_theron',
  },
  {
    id: 'character_colonel_dusek',
    name: 'Col. Irina Dusek',
    title: 'Minister of Defense',
    category: 'cabinet',
    description: 'The highest-ranking woman in Veltrian military history. Her oath is to the constitution — a fact that has become more relevant than anyone anticipated.',
    factionKey: 'ironCovenant',
    codexEntryId: 'character_colonel_dusek',
  },

  // ── Parliament ───────────────────────────────────────────────────
  {
    id: 'character_drazen_kolvar',
    name: 'Drazen Kolvar',
    title: 'Leader of the Halvekist Opposition',
    category: 'parliament',
    description: 'The architect of the Halvekist political machine. He has outlasted four governments and two constitutional crises. He is watching yours with professional interest.',
    factionKey: 'halvekists',
    codexEntryId: 'character_drazen_kolvar',
  },

  // ── Family ───────────────────────────────────────────────────────
  {
    id: 'character_jonas_ashavel',
    name: 'Jonas Ashavel',
    title: 'Your Husband',
    category: 'family',
    description: 'An architect who married a reformer and woke up married to a Chancellor. He is still figuring out what that means.',
    personalKey: 'marriageHealth',
    codexEntryId: 'character_jonas_ashavel',
  },
  {
    id: 'character_liora_ashavel',
    name: 'Liora Ashavel',
    title: 'Your Daughter',
    category: 'family',
    description: 'Twenty-two years old and already sharper than half the people in the press gallery. She inherited your principles and none of your patience.',
    personalKey: 'lioraRelationship',
    codexEntryId: 'character_liora_ashavel',
  },
  {
    id: 'character_tomas_ashavel',
    name: 'Tomas Ashavel',
    title: 'Your Son',
    category: 'family',
    description: 'Fourteen. Fame is harder on him than anyone admits. He is looking for somewhere to belong — and not everyone offering belongs is worthy of him.',
    personalKey: 'tomasWellbeing',
    codexEntryId: 'character_tomas_ashavel',
  },

  // ── Other ────────────────────────────────────────────────────────
  {
    id: 'character_lucan_vael',
    name: 'Margrave Lucan Vael',
    title: 'Industrialist and Oligarch',
    category: 'other',
    description: 'Controls thirteen percent of Veltrian heavy industry. He does not make political donations — he makes investments. The distinction is the point.',
    factionKey: 'businessClass',
    codexEntryId: 'character_lucan_vael',
  },
  {
    id: 'character_stanislov_renek',
    name: 'Archbishop Stanislov Renek',
    title: 'Primate of the Veltrian Church',
    category: 'other',
    description: 'The spiritual leader of a nation that is losing its faith in institutions — including his. He is trying to keep the Church relevant. That makes him either an ally or a threat.',
    factionKey: 'church',
    codexEntryId: 'character_stanislov_renek',
  },
  {
    id: 'character_nadia_voss',
    name: 'Nadia Voss',
    title: 'Investigative Journalist',
    category: 'other',
    description: 'The most feared byline in Veltria. She does not care about access or favor — she cares about what happened, and she will find out.',
    factionKey: 'reformists',
    codexEntryId: 'character_nadia_voss',
  },
  {
    id: 'character_maren_tovik',
    name: 'Maren Tovik',
    title: 'Chief Investigator, Bureau of Civic Accountability',
    category: 'other',
    description: 'A former prosecutor who put twelve Halvek-era officials behind bars before she turned forty. Incorruptible, unsentimental, and constitutionally incapable of looking the other way. If she is investigating you, you will not know until it is too late.',
    factionKey: 'reformists',
    codexEntryId: 'character_maren_tovik',
  },
  {
    id: 'character_viktor_dorne',
    name: 'Viktor Dorne',
    title: 'Director, State Security Directorate',
    category: 'other',
    description: 'Twenty-two years in the BNI under Halvek. He survived the transition — barely — by being too useful to purge. Cold, efficient, and utterly loyal to whoever signs his pay orders. He does not ask questions about morality. He asks questions about what you need done.',
    factionKey: 'halvekists',
    codexEntryId: 'character_viktor_dorne',
  },
  {
    id: 'character_elena_braskov',
    name: 'Elena Braskov',
    title: 'Media Magnate',
    category: 'other',
    description: 'Owner of Veltrian National Broadcasting and The Ashenmere Herald. She inherited the empire from her father, who built it under Halvek\'s patronage. She is not an ideologue — she sells influence, and treats information as currency.',
    factionKey: 'businessClass',
    codexEntryId: 'character_elena_braskov',
  },
  {
    id: 'character_serida_valk',
    name: 'Serida Valk',
    title: 'Personal Aide and Driver',
    category: 'other',
    description: 'A former schoolteacher from Kravenstal who became an activist, then your campaign volunteer, now your most loyal aide. She is not political — she is human. She has a husband, Andrik, and a young daughter, Mina. She represents the ordinary Veltrians affected by your policies, and she is not afraid to tell you when they are being hurt.',
    codexEntryId: 'character_serida_valk',
  },
  {
    id: 'character_gavril_soren',
    name: 'Marshal Gavril Soren',
    title: 'Former Chief of Staff to Edvard Halvek',
    category: 'parliament',
    description: 'The last surviving member of Halvek\'s inner circle. He served as Halvek\'s Chief of Staff for 15 years — the architect of the regime\'s day-to-day operations. After the transition, he was granted legal immunity in exchange for a peaceful transfer of power. He lives in a grand estate in Thornfeld, treated as a hero by the old guard. He is 74, distinguished, and utterly unrepentant.',
    factionKey: 'halvekists',
    codexEntryId: 'character_gavril_soren',
  },
]

export const CATEGORY_LABELS: Record<CharacterCategory, string> = {
  cabinet:    'Cabinet',
  parliament: 'Parliament',
  foreign:    'Foreign',
  family:     'Family',
  other:      'Other',
}
