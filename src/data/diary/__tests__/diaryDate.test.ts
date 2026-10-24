import { describe, expect, it } from 'vitest'
import { diaryDate } from '../diaryEntries'
import { diaryDate as diaryTemplateDate } from '../diaryTemplates'

describe('diaryDate', () => {
  it('uses the canonical upper-case date with the week suffix', () => {
    expect(diaryDate(40)).toBe('1 OCTOBER 1963 — WEEK 40')
  })

  it('shows the correct year past week 52', () => {
    expect(diaryDate(54)).toBe('7 JANUARY 1964 — WEEK 54')
  })

  it('matches the diaryTemplates copy', () => {
    expect(diaryTemplateDate(54)).toBe(diaryDate(54))
  })
})
