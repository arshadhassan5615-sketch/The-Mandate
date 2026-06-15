// Portrait images — folder is "potraits" (existing folder name, not a typo we own)

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
import stefan_morvec from './stefan_morvec.jpeg'
import aleksei_morvec from './aleksei_morvec.jpeg'
import nikolai_perov from './nikolai_perov.jpeg'
import general_vass from './general_vass.jpeg'
import roman_kesic from './roman_kesic.jpeg'
import petra_solec from './petra_solec.jpeg'
import vera_sorin from './vera_sorin.jpeg'
import henryk_borac from './henryk_borac.jpeg'
import marta_solen from './marta_solen.jpeg'
import petr_horak from './petr_horak.jpeg'
import lena_kaspar from './lena_kaspar.jpeg'
import august_meln from './august_meln.jpeg'
import benedikt_varro from './benedikt_varro.jpeg'
import sofia_drenek from './sofia_drenek.jpeg'
import orin_valdek from './orin_valdek.jpeg'
import daria_voss from './daria_voss.jpeg'
import emilian_voss from './emilian_voss.jpeg'
import aleksander_igor from './aleksander_igor.jpeg'
import matthias_krel from './matthias_krel.jpeg'
import andrei_luca from './andrei_luca.jpeg'
import rena_vasic from './rena_vasic.jpeg'
import lev_stanko from './lev_stanko.jpeg'
import mirko_solc from './mirko_solc.jpeg'

export const PORTRAITS: Record<string, string> = {
  katerin_ashavel,
  jonas_ashavel,
  liora_ashavel,
  tomas_ashavel,
  vyktor_reznik,
  elara_vostane,
  gregor_maric,
  irina_dusek,
  colonel_dusek: irina_dusek,
  aldric_theron,
  danika_oberlin,
  stanislov_renek,
  drazen_kolvar,
  soraya_khaled,
  lucan_vael,
  oskar_brenner,
  general_vass,
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
  stefan_morvec,
  aleksei_morvec,
  nikolai_perov,
  roman_kesic,
  petra_solec,
  vera_sorin,
  henryk_borac,
  marta_solen,
  petr_horak,
  lena_kaspar,
  august_meln,
  benedikt_varro,
  sofia_drenek,
  orin_valdek,
  daria_voss,
  emilian_voss,
  aleksander_igor,
  matthias_krel,
  andrei_luca,
  rena_vasic,
  lev_stanko,
  mirko_solc,
}

export function getPortrait(characterId: string): string | null {
  return PORTRAITS[characterId] ?? null
}
