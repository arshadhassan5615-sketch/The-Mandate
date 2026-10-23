import type { CutscenePanel, NarrativeNode } from '../../types/narrative'
import type { MinistryType } from '../../types/minister'

/** One card in the scene intro: a painted still or a location establishing shot. */
export type IntroCard =
  | { kind: 'still'; image: string; caption?: string; durationMs: number }
  | { kind: 'establishing'; image: string; label: string; detail?: string; durationMs: number }

/** A location-to-painting entry from establishingShots.json. First matching prefix wins. */
export interface EstablishingShot {
  prefix: string
  image: string
  label: string
}

export const STILL_DEFAULT_MS = 6000
export const ESTABLISHING_MS = 3500

const LOCATION_DETAIL_SEPARATOR = ' — '

/** Lookups the queue needs. Injected so the builder stays pure and testable. */
export interface IntroDeps {
  art: (key: string) => string | null
  /** Resolved establishing-shot URL and label for a scene location, or null when none is available. */
  establishing: (location: string) => { image: string; label: string } | null
  /** Appointed minister id for a ministry, or null when the post is empty. */
  minister: (ministry: MinistryType) => string | null
  /** Registered `<key>__<ministerId>` variant keys for a still, sorted. */
  variants: (key: string) => string[]
}

export interface IntroQueueOptions {
  /** Whether a location establishing shot may lead the queue (the caller decides, e.g. once per week). */
  allowEstablishing: boolean
}

/**
 * Resolves a panel to an image URL. A `variantBy` panel prefers the variant for
 * the appointed minister, then the base still, then any variant. Unresolvable
 * panels yield null.
 */
export function resolvePanelImage(panel: CutscenePanel, deps: IntroDeps): string | null {
  if (panel.variantBy === undefined) return deps.art(panel.image)
  const ministerId = deps.minister(panel.variantBy)
  const ownVariant = ministerId ? deps.art(`${panel.image}__${ministerId}`) : null
  if (ownVariant !== null) return ownVariant
  const base = deps.art(panel.image)
  if (base !== null) return base
  const [firstVariant] = deps.variants(panel.image)
  return firstVariant === undefined ? null : deps.art(firstVariant)
}

/**
 * Finds the establishing shot whose prefix starts the (trimmed, case-insensitive)
 * location. Pure: the shot list is not mutated.
 */
export function matchEstablishingShot(
  location: string,
  shots: readonly EstablishingShot[],
): EstablishingShot | null {
  const normalised = location.trim().toLowerCase()
  return shots.find(shot => normalised.startsWith(shot.prefix.toLowerCase())) ?? null
}

function buildStills(
  scene: Pick<NarrativeNode, 'cutscene'>,
  deps: IntroDeps,
): IntroCard[] {
  const panels = scene.cutscene?.panels ?? []
  const stills: IntroCard[] = []
  for (const panel of panels) {
    const url = resolvePanelImage(panel, deps)
    if (url === null) continue
    stills.push({
      kind: 'still',
      image: url,
      caption: panel.caption,
      durationMs: panel.durationMs ?? STILL_DEFAULT_MS,
    })
  }
  return stills
}

/** The part of a location after an em-dash separator, or undefined when there is none. */
function locationDetail(location: string): string | undefined {
  const index = location.indexOf(LOCATION_DETAIL_SEPARATOR)
  if (index === -1) return undefined
  const detail = location.slice(index + LOCATION_DETAIL_SEPARATOR.length).trim()
  return detail.length > 0 ? detail : undefined
}

function buildEstablishing(
  location: string | undefined,
  deps: IntroDeps,
): IntroCard[] {
  if (location === undefined) return []
  const shot = deps.establishing(location)
  if (shot === null) return []
  const detail = locationDetail(location)
  return [{
    kind: 'establishing',
    image: shot.image,
    label: shot.label,
    detail,
    durationMs: ESTABLISHING_MS,
  }]
}

/**
 * Builds the cards shown before a scene's dialogue: the painted stills; when
 * there are none and the caller allows it, a location establishing shot.
 * Pure: the scene is not mutated.
 */
export function buildIntroQueue(
  scene: (Pick<NarrativeNode, 'cutscene'> & { location?: string }) | null,
  deps: IntroDeps,
  opts: IntroQueueOptions = { allowEstablishing: false },
): IntroCard[] {
  if (scene === null) return []
  const stills = buildStills(scene, deps)
  if (stills.length === 0 && opts.allowEstablishing) {
    return buildEstablishing(scene.location, deps)
  }
  return stills
}
