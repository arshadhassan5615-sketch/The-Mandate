import { getCharacterColor } from '../portraits/CharacterPortraits'
import { CHARACTERS } from '../../data/characters/roster'

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
  return CHAR_NAMES[id] ?? id.replace(/_/g, ' ')
}

// Saturated per-character label tints (Suzerain reference). Anyone not listed
// falls back to the shared portrait palette.
const SPEAKER_TINT: Record<string, string> = {
  katerin_ashavel: '#d95a4a', vyktor_reznik: '#a3b6d3', drazen_kolvar: '#c96a3b',
  stefan_morvec: '#b08a4a', lucan_vael: '#9b7bd6', matthias_krel: '#7b8f7a',
  nadia_voss: '#4ba3b8', oskar_brenner: '#8c9a4c', irina_dusek: '#7fb069',
  jonas_ashavel: '#d4a86a', elara_vostane: '#c9a84c', aldric_theron: '#b9a0d0',
  danika_oberlin: '#d99a5b', gregor_maric: '#c25d4b',
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
