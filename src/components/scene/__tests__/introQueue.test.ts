import { describe, it, expect } from 'vitest'
import {
  buildIntroQueue,
  ESTABLISHING_MS,
  matchEstablishingShot,
  resolvePanelImage,
  STILL_DEFAULT_MS,
  type EstablishingShot,
  type IntroDeps,
} from '../introQueue'

const SHOTS: EstablishingShot[] = [
  { prefix: "Chancellor's Private Study", image: 'private_study', label: 'The Private Study' },
  { prefix: "Chancellor's Office", image: 'chancellors_office', label: "The Chancellor's Office" },
  { prefix: 'Cabinet Room', image: 'cabinet_room', label: 'The Cabinet Room' },
]

const deps: IntroDeps = {
  art: key => (key === 'inauguration' ? 'url:inauguration' : key === 'harbour' ? 'url:harbour' : null),
  establishing: location => (location.startsWith('Cabinet Room') ? { image: 'url:cabinet', label: 'The Cabinet Room' } : null),
  minister: () => null,
  variants: () => [],
}

describe('buildIntroQueue', () => {
  it('returns no cards for a null scene', () => {
    expect(buildIntroQueue(null, deps)).toEqual([])
  })

  it('resolves known still keys and skips unknown ones silently', () => {
    const scene = {
      cutscene: {
        panels: [
          { image: 'inauguration', caption: 'First' },
          { image: 'missing_key', caption: 'Lost' },
          { image: 'harbour', caption: 'Second', durationMs: 4000 },
        ],
      },
    }

    const queue = buildIntroQueue(scene, deps)

    expect(queue).toEqual([
      { kind: 'still', image: 'url:inauguration', caption: 'First', durationMs: STILL_DEFAULT_MS },
      { kind: 'still', image: 'url:harbour', caption: 'Second', durationMs: 4000 },
    ])
  })

  it('applies the default still duration when a panel declares none', () => {
    const queue = buildIntroQueue({ cutscene: { panels: [{ image: 'inauguration' }] } }, deps)

    expect(queue).toEqual([
      { kind: 'still', image: 'url:inauguration', caption: undefined, durationMs: STILL_DEFAULT_MS },
    ])
  })

  it('returns only still and establishing cards', () => {
    const scene = { location: 'Cabinet Room', cutscene: { panels: [{ image: 'inauguration', caption: 'Cap' }] } }

    const queue = buildIntroQueue(scene, deps, { allowEstablishing: true })

    expect(queue).toHaveLength(1)
    expect(queue.every(card => card.kind === 'still')).toBe(true)
  })

  it('does not mutate the scene', () => {
    const scene = { cutscene: { panels: [{ image: 'inauguration', caption: 'Cap' }] } }
    const sceneBefore = structuredClone(scene)

    buildIntroQueue(scene, deps)

    expect(scene).toEqual(sceneBefore)
  })
})

function registryDeps(
  registry: Record<string, string>,
  ministers: Partial<Record<'defense' | 'labor', string>> = {},
): IntroDeps {
  return {
    ...deps,
    art: key => registry[key] ?? null,
    minister: ministry => ministers[ministry as 'defense' | 'labor'] ?? null,
    variants: key => Object.keys(registry).filter(k => k.startsWith(`${key}__`)).sort(),
  }
}

describe('resolvePanelImage', () => {
  const registry = { x: 'url:x', x__a: 'url:x__a', x__b: 'url:x__b' }

  it('picks the variant for the minister holding the ministry', () => {
    const panel = { image: 'x', variantBy: 'defense' as const }

    expect(resolvePanelImage(panel, registryDeps(registry, { defense: 'b' }))).toBe('url:x__b')
  })

  it('falls back to the base key when no variant exists for that minister', () => {
    const panel = { image: 'x', variantBy: 'defense' as const }

    expect(resolvePanelImage(panel, registryDeps(registry, { defense: 'c' }))).toBe('url:x')
  })

  it('falls back to the first variant when there is no base and no matching minister', () => {
    const panel = { image: 'x', variantBy: 'defense' as const }
    const variantsOnly = { x__a: 'url:x__a', x__b: 'url:x__b' }

    expect(resolvePanelImage(panel, registryDeps(variantsOnly))).toBe('url:x__a')
    expect(resolvePanelImage(panel, registryDeps(variantsOnly, { defense: 'c' }))).toBe('url:x__a')
  })

  it('returns null when nothing is registered for the panel', () => {
    const panel = { image: 'x', variantBy: 'labor' as const }

    expect(resolvePanelImage(panel, registryDeps({}, { labor: 'a' }))).toBeNull()
  })

  it('uses only the base key when the panel has no variantBy', () => {
    expect(resolvePanelImage({ image: 'x' }, registryDeps(registry, { defense: 'b' }))).toBe('url:x')
    expect(resolvePanelImage({ image: 'x' }, registryDeps({ x__b: 'url:x__b' }, { defense: 'b' }))).toBeNull()
  })
})

describe('matchEstablishingShot', () => {
  it('matches a location by exact prefix', () => {
    expect(matchEstablishingShot('Cabinet Room', SHOTS)).toEqual(SHOTS[2])
  })

  it('matches case-insensitively and ignores surrounding whitespace', () => {
    expect(matchEstablishingShot('  cabinet ROOM — Emergency  ', SHOTS)).toEqual(SHOTS[2])
  })

  it('prefers the more specific study prefix over the office prefix', () => {
    expect(matchEstablishingShot("Chancellor's Private Study — Ashenmere Palace", SHOTS)).toEqual(SHOTS[0])
    expect(matchEstablishingShot("Chancellor's Office — Late Evening", SHOTS)).toEqual(SHOTS[1])
  })

  it('returns null for an unknown location', () => {
    expect(matchEstablishingShot('Finance Ministry — Budget Office', SHOTS)).toBeNull()
  })
})

describe('buildIntroQueue establishing shots', () => {
  const establishingDeps: IntroDeps = { ...deps, establishing: () => ({ image: 'url:cabinet', label: 'The Cabinet Room' }) }

  it('leads with an establishing card when allowed and the scene has no stills', () => {
    const queue = buildIntroQueue({ location: 'Cabinet Room' }, establishingDeps, { allowEstablishing: true })

    expect(queue).toEqual([
      { kind: 'establishing', image: 'url:cabinet', label: 'The Cabinet Room', detail: undefined, durationMs: ESTABLISHING_MS },
    ])
  })

  it('omits the establishing card when the scene already has a still', () => {
    const scene = { location: 'Cabinet Room', cutscene: { panels: [{ image: 'inauguration' }] } }

    const queue = buildIntroQueue(scene, establishingDeps, { allowEstablishing: true })

    expect(queue.map(c => c.kind)).toEqual(['still'])
  })

  it('omits the establishing card when allowEstablishing is false', () => {
    expect(buildIntroQueue({ location: 'Cabinet Room' }, establishingDeps)).toEqual([])
    expect(buildIntroQueue({ location: 'Cabinet Room' }, establishingDeps, { allowEstablishing: false })).toEqual([])
  })

  it('omits the establishing card when deps has no shot for the location', () => {
    const noShot: IntroDeps = { ...deps, establishing: () => null }

    expect(buildIntroQueue({ location: 'Cabinet Room' }, noShot, { allowEstablishing: true })).toEqual([])
  })

  it('parses the detail from the part after an em-dash', () => {
    const queue = buildIntroQueue({ location: 'Cabinet Room — Emergency Session' }, establishingDeps, { allowEstablishing: true })

    expect(queue[0]).toMatchObject({ kind: 'establishing', detail: 'Emergency Session' })
  })

  it('leaves the detail undefined when the location has no em-dash', () => {
    const queue = buildIntroQueue({ location: 'Cabinet Room' }, establishingDeps, { allowEstablishing: true })

    expect(queue).toEqual([
      { kind: 'establishing', image: 'url:cabinet', label: 'The Cabinet Room', durationMs: ESTABLISHING_MS },
    ])
  })
})
