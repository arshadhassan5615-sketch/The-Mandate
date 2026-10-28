import { getCharacterColor } from '../portraits/CharacterPortraits'
import { CHARACTERS } from '../../data/characters/roster'
import { GOVERNANCE_CAST_NAMES } from '../../data/characters/governanceCast'

const CHAR_NAMES: Record<string, string> = {
  katerin_ashavel: 'Chancellor Ashavel',
  vyktor_reznik: 'Vyktor Reznik',
  jonas_ashavel: 'Jonas Ashavel',
  liora_ashavel: 'Liora Ashavel',
  tomas_ashavel: 'Tomas Ashavel',
  gregor_maric: 'Gregor Marić',
  aldric_theron: 'Prof. Aldric Theron',
  irina_dusek: 'Colonel Dusek',
  colonel_dusek: 'Colonel Dusek',
  stanislov_renek: 'Archbishop Renek',
  archbishop_renek: 'Archbishop Renek',
  danika_oberlin: 'Danika Oberlin',
  drazen_kolvar: 'Dražen Kolvar',
  delegate_kolvar: 'Delegate Kolvar',
  elara_vostane: 'Elara Vostane',
  elena_braskov: 'Elena Braskov',
  nikolai_perov: 'General Perov',
  general_brenner: 'General Brenner',
  general_vass: 'General Vass',
  oskar_brenner: 'Gen. Brenner',
  soraya_khaled: 'Soraya Khaled',
  lucan_vael: 'Lucan Vael',
  nadia_voss: 'Nadia Voss',
  harrison_cole: 'Amb. Harrison Cole',
  yevgeni_stahl: 'Commissar Stahl',
  stefan_morvec: 'Stefan Morvec',
  aleksei_morvec: 'Aleksei Morvec',
  dragan_vukov: 'Marshal Vukov',
  elodie_marchand: 'Elodie Marchand',
  radovan_skala: 'Warlord Skala',
  maren_tovik: 'Maren Tovik',
  viktor_dorne: 'Viktor Dorne',
  serida_valk: 'Serida Valk',
  roman_kesic: 'Roman Kešić',
  petra_solec: 'Petra Solec',
  vera_sorin: 'Vera Sorin',
  henryk_borac: 'Henryk Borač',
  marta_solen: 'Dr. Marta Solén',
  petr_horak: 'Petr Horák',
  lena_kaspar: 'Dr. Lena Kaspar',
  august_meln: 'Dr. August Meln',
  benedikt_varro: 'Benedikt Varro',
  sofia_drenek: 'Sofia Drenek',
  orin_valdek: 'Orin Valdek',
  daria_voss: 'Daria Voss',
  matthias_krel: 'Matthias Krel',
  emilian_voss: 'Dr. Emilian Voss',
  aleksander_igor: 'Aleksander Igor',
  andrei_luca: 'President Luca',
  rena_vasic: 'Commandant Vasić',
  lev_stanko: 'Deputy Commissioner Stančko',
  mirko_solc: 'Dr. Mirko Šolc',
  idris_kaelen: 'Idris Kaelen',
  minister_volkov: 'Minister Volkov',
  other_oligarchs: 'The Oligarchs',
  generic: 'Official',
}

export function charName(id: string): string {
  return CHAR_NAMES[id] ?? GOVERNANCE_CAST_NAMES[id] ?? id.replace(/_/g, ' ')
}

// Saturated per-character label tints for the recurring cast (Suzerain reference).
// Anyone not listed falls back to the shared portrait palette.
const SPEAKER_TINT: Record<string, string> = {
  // The Ashavels: warm reds and tans
  katerin_ashavel: '#d95a4a', jonas_ashavel: '#d4a86a', liora_ashavel: '#e39ab0', tomas_ashavel: '#c9b48a',
  // Inner circle
  vyktor_reznik: '#8fb3e0', danika_oberlin: '#e0954f', elara_vostane: '#d4b04c', aldric_theron: '#9d8fe0',
  gregor_maric: '#b4785a', drazen_kolvar: '#5f8fd6', delegate_kolvar: '#5f8fd6',
  irina_dusek: '#7fb069', colonel_dusek: '#7fb069', matthias_krel: '#8fa58e',
  // Power brokers and the church
  lucan_vael: '#b97fd6', stanislov_renek: '#c77aa6', archbishop_renek: '#c77aa6',
  stefan_morvec: '#b08a4a', aleksei_morvec: '#a8925e', oskar_brenner: '#9fae55', nikolai_perov: '#8d9e6b',
  nadia_voss: '#4bb3b0', emilian_voss: '#6fb8d6', serida_valk: '#d27f8f', maren_tovik: '#c99fd1',
  viktor_dorne: '#b7a46a', elena_braskov: '#dba67a', vera_sorin: '#84c4b4', roman_kesic: '#8aa0b8',
  // Foreign and other recurring voices
  benedikt_varro: '#a0a0c8', aleksander_igor: '#c2a07a', andrei_luca: '#8bc0a0', idris_kaelen: '#7ab5c2',
  lena_kaspar: '#9ec97a', orin_valdek: '#b3a3d9', harrison_cole: '#6f9ad1', yevgeni_stahl: '#a86a6a',
  soraya_khaled: '#d9b98a', dragan_vukov: '#9a8a6a',
}

export const PLAYER_LABEL_COLOR = '#d95a4a'

export function speakerColor(id: string): string {
  return SPEAKER_TINT[id] ?? getCharacterColor(id)
}

// Roster ids carry a "character_" prefix; scene speaker ids do not.
const ROLE_BY_ID: ReadonlyMap<string, string> = new Map(
  CHARACTERS.map(c => [c.id.replace(/^character_/, ''), c.title]),
)

export function speakerRole(id: string): string | undefined {
  return ROLE_BY_ID.get(id.replace(/^character_/, ''))
}
