// Display names for the provincial-governance cast: governors, people's
// representatives and business bidders. Name lookups fall back to this map so
// these characters never show as their raw ids.
import { GOVERNORS } from '../governors'

export const GOVERNANCE_CAST_NAMES: Readonly<Record<string, string>> = {
  ...Object.fromEntries(GOVERNORS.map(g => [g.characterId, g.name])),
  milena_sova: 'Milena Sova',
  vesna_darko: 'Vesna Darko',
  teodor_wrenn: 'Teodor Wrenn',
  ana_kovar: 'Ana Kovar',
  ulrich_kessler: 'Dr. Ulrich Kessler',
  marta_ruzicka: 'Marta Ruzicka',
  oskar_halm: 'Oskar Halm',
}
