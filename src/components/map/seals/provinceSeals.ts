// Province seal data: emblem, field colour and size for each province's map seal.
export type SealEmblem = 'compass' | 'hammer_pick' | 'wheat' | 'fortress' | 'anchor' | 'mountain'
export type SealProvinceId = 'ashenmere' | 'kravenstal' | 'thornfeld' | 'sevagrad' | 'aldenmoor' | 'dravenhollow'

export interface SealSpec {
  name: string
  emblem: SealEmblem
  field: string
  isCapital: boolean
}

export const PROVINCE_SEALS: Record<SealProvinceId, SealSpec> = {
  ashenmere:    { name: 'Ashenmere',    emblem: 'compass',     field: '#2b4a7a', isCapital: true },
  kravenstal:   { name: 'Kravenstal',   emblem: 'hammer_pick', field: '#8a4a32', isCapital: false },
  thornfeld:    { name: 'Thornfeld',    emblem: 'wheat',       field: '#a9853a', isCapital: false },
  sevagrad:     { name: 'Sevagrad',     emblem: 'fortress',    field: '#556052', isCapital: false },
  aldenmoor:    { name: 'Aldenmoor',    emblem: 'anchor',      field: '#3f6f73', isCapital: false },
  dravenhollow: { name: 'Dravenhollow', emblem: 'mountain',    field: '#4a5a3a', isCapital: false },
}

/** Seal diameters in map pixels. */
export const SEAL_SIZE = { capital: 215, city: 175 } as const

export function sealSizeFor(id: SealProvinceId): number {
  return PROVINCE_SEALS[id].isCapital ? SEAL_SIZE.capital : SEAL_SIZE.city
}

/** Vertical squash of a seal lying on the map (height = size * SEAL_TILT_RATIO). */
export const SEAL_TILT_RATIO = 0.74

/** Seals sit above their map point, like the buildings they replaced, so the map's printed names stay readable. */
export const SEAL_LIFT_RATIO = 0.6
export function sealLift(id: SealProvinceId): number {
  return Math.round(sealSizeFor(id) * SEAL_TILT_RATIO * SEAL_LIFT_RATIO)
}
