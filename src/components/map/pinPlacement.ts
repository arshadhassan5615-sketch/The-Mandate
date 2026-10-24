import { PROVINCE_SEALS, SEAL_TILT_RATIO, sealLift, sealSizeFor, type SealProvinceId } from './seals/provinceSeals'

/** Where a map pin's tip sits relative to the province anchor: centred, just above the medal. */
export const PIN_TIP_OFFSET_X = 0

const FALLBACK_PIN_TIP_OFFSET_Y = -40

/** Pin bottom sits on the upper face of the province seal. */
export function pinTipOffsetY(provinceId: string): number {
  if (!(provinceId in PROVINCE_SEALS)) return FALLBACK_PIN_TIP_OFFSET_Y
  const sealHeight = sealSizeFor(provinceId as SealProvinceId) * SEAL_TILT_RATIO
  return -Math.round(sealHeight * 0.46) - sealLift(provinceId as SealProvinceId)
}
