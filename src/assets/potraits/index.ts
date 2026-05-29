// Portrait images — folder is "potraits" (existing folder name, not a typo we own)
// All 25 characters present as .jpeg files

import katerin_ashavel from './katerin_ashavel.jpeg'
import jonas_ashavel from './jonas_ashavel.jpeg'
import liora_ashavel from './liora_ashavel.jpeg'
import tomas_ashavel from './tomas_ashavel.jpeg'
import vyktor_reznik from './vyktor_reznik.jpeg'
import elara_vostane from './elara_vostane.jpeg'
import gregor_maric from './gregor_maric.jpeg'
import irina_dusek from './irina_dusek.jpeg'
import aldric_theron from './aldric_theron.jpeg'
import danika_oberlin from './danika_oberlin.jpeg'
import stanislov_renek from './stanislov_renek.jpeg'
import drazen_kolvar from './drazen_kolvar.jpeg'
import soraya_khaled from './soraya_khaled.jpeg'
import lucan_vael from './lucan_vael.jpeg'
import oskar_brenner from './oskar_brenner.jpeg'
import nadia_voss from './nadia_voss.jpeg'
import elena_braskov from './elena_braskov.jpeg'
import maren_tovik from './maren_tovik.jpeg'
import viktor_dorne from './viktor_dorne.jpeg'
import serida_valk from './serida_valk.jpeg'
import gavril_soren from './gavril_soren.jpeg'
import harrison_cole from './harrison_cole.jpeg'
import yevgeni_stahl from './yevgeni_stahl.jpeg'
import dragan_vukov from './dragan_vukov.jpeg'
import idris_kaelen from './idris_kaelen.jpeg'

export const PORTRAITS: Record<string, string> = {
  katerin_ashavel,
  jonas_ashavel,
  liora_ashavel,
  tomas_ashavel,
  vyktor_reznik,
  elara_vostane,
  gregor_maric,
  irina_dusek,
  aldric_theron,
  danika_oberlin,
  stanislov_renek,
  drazen_kolvar,
  soraya_khaled,
  lucan_vael,
  oskar_brenner,
  nadia_voss,
  elena_braskov,
  maren_tovik,
  viktor_dorne,
  serida_valk,
  gavril_soren,
  harrison_cole,
  yevgeni_stahl,
  dragan_vukov,
  idris_kaelen,
}

export function getPortrait(characterId: string): string | null {
  return PORTRAITS[characterId] ?? null
}
