import { describe, it, expect } from 'vitest'
import { NEWS_TEMPLATES } from '../newsTemplates'
import { provincesForArticle, type HomeProvinceId } from '../../../engine/provinceNews'

const NARRATIVE_SCENES = import.meta.glob('../../narrative/**/*.json', {
  eager: true,
  import: 'default',
})

function collectChoiceIdsAndFlags(node: unknown, found: Set<string>): void {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectChoiceIdsAndFlags(item, found)
    }
    return
  }

  if (node === null || typeof node !== 'object') {
    return
  }

  const record = node as Record<string, unknown>

  if (typeof record.id === 'string' && 'text' in record) {
    found.add(record.id)
  }

  if (Array.isArray(record.flags)) {
    for (const flag of record.flags) {
      if (typeof flag === 'string') {
        found.add(flag)
      }
    }
  }

  for (const value of Object.values(record)) {
    collectChoiceIdsAndFlags(value, found)
  }
}

interface NewsPaper {
  headline: string
  body: string
}

function papersForTrigger(trigger: string): NewsPaper[] {
  const template = NEWS_TEMPLATES.find((candidate) => candidate.trigger === trigger)
  if (!template) {
    throw new Error(`No news template for trigger ${trigger}`)
  }
  return [template.herald, template.standard, template.worker, template.times, template.gazette]
    .filter((paper): paper is NewsPaper => paper !== undefined)
}

function collectNarrativeTriggerSources(): Set<string> {
  const found = new Set<string>()
  for (const scene of Object.values(NARRATIVE_SCENES)) {
    collectChoiceIdsAndFlags(scene, found)
  }
  return found
}

describe('news template triggers', () => {
  it('every news template trigger is produced by a narrative choice id or flag', () => {
    // Arrange
    const sources = collectNarrativeTriggerSources()

    // Act
    const missing = NEWS_TEMPLATES
      .map((template) => template.trigger)
      .filter((trigger) => !trigger.startsWith('__'))
      .filter((trigger) => !sources.has(trigger))

    // Assert
    expect(missing.length, `Unwired news triggers: ${missing.join(', ')}`).toBe(0)
  })

  it('Sevagrad and Aldenmoor have stories', () => {
    // Arrange
    const storyExpectations: Array<{ provinceId: HomeProvinceId; triggers: string[] }> = [
      {
        provinceId: 'sevagrad',
        triggers: [
          'contractor_fort_state',
          'contractor_fort_vael',
          'contractor_fort_foreign_consult',
          'fort_redesign_defensive',
          'fort_continue_as_planned',
          'refugee_border_closure',
          'refugee_international_appeal',
        ],
      },
      {
        provinceId: 'aldenmoor',
        triggers: [
          'contractor_highway_state',
          'contractor_highway_vael',
          'contractor_highway_foreign',
          'highway_reroute',
          'highway_bulldoze',
        ],
      },
    ]

    // Act
    const unnamed = storyExpectations.flatMap(({ provinceId, triggers }) =>
      triggers.flatMap((trigger) =>
        papersForTrigger(trigger)
          .filter((paper) => !provincesForArticle(paper).includes(provinceId))
          .map(() => `${trigger} (${provinceId})`),
      ),
    )

    // Assert
    expect(unnamed, `Papers that do not name their province: ${unnamed.join(', ')}`).toEqual([])
  })
})
