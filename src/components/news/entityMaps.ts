import { CHARACTERS } from '../../data/characters/roster'

export const PROVINCE_ENTRIES: Record<string, string> = {
  'Ashenmere': 'province_ashenmere',
  'Kravenstal': 'province_kravenstal',
  'Thornfeld': 'province_thornfeld',
  'Sevagrad': 'province_sevagrad',
  'Aldenmoor': 'province_aldenmoor',
  'Dravenhollow': 'province_dravenhollow',
}

export const FACTION_NAMES: Record<string, string> = {
  'Halvekist': 'faction_halvekists',
  'Halvekists': 'faction_halvekists',
  "Workers' Coalition": 'faction_workers_coalition',
  "Workers' Unity Coalition": 'faction_workers_coalition',
  'Workers Coalition': 'faction_workers_coalition',
  'Reformist Bloc': 'faction_reformists',
  'Civic Renewal Movement': 'faction_reformists',
  'Iron Covenant': 'faction_iron_covenant',
  'Church of the Eternal Flame': 'ideology_church_eternal_flame',
  'Church': 'ideology_church_eternal_flame',
  'Business Consortium': 'faction_business_consortium',
  "Business Class": 'faction_business_consortium',
  'Dravenni Council': 'faction_dravenni',
  'Dravenni': 'faction_dravenni',
  'Dravenni Liberation Front': 'faction_dravenni',
}

export const NATION_ENTRIES: Record<string, string> = {
  'Veltria': 'veltria_overview',
  'Veltrian': 'veltria_overview',
  'Tyvaren': 'nation_tyvaren_confederation',
  'Tyvaren Confederation': 'nation_tyvaren_confederation',
  'Morivask': 'nation_morivask',
  'Lytheira': 'nation_lytheira',
  'Arcturian Commonwealth': 'nation_arcturian_commonwealth',
  'Orythian Dominion': 'nation_orythian_dominion',
  'Asturien Forum': 'nation_asturien_forum',
}

export const TERM_ENTRIES: Record<string, string> = {
  'BNI': 'history_bni',
  'Bureau of National Integrity': 'history_bni',
  'Halvek Constitution': 'laws_halvek_constitution',
  'Constitution': 'laws_halvek_constitution',
  'Krone': 'economy_krone',
  'Halvek': 'history_halvek_regime',
  'Thalassic Sea': 'geography_thalassic_sea',
}

/** Every codex id the entity linker can produce, including roster characters. */
export function allEntityCodexIds(): string[] {
  const ids = [
    ...CHARACTERS.map(char => char.codexEntryId),
    ...Object.values(PROVINCE_ENTRIES),
    ...Object.values(FACTION_NAMES),
    ...Object.values(NATION_ENTRIES),
    ...Object.values(TERM_ENTRIES),
  ]
  return [...new Set(ids)]
}
