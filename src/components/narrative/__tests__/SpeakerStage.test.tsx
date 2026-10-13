import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SpeakerStage from '../SpeakerStage'
import SceneBackdrop from '../SceneBackdrop'
import { charName } from '../speakers'

const props = { isPhone: false, rightInset: '600px', phoneBottom: '60vh' }

describe('SpeakerStage', () => {
  it('stands the current speaker on stage with a name plate', () => {
    render(<SpeakerStage speakerIds={["vyktor_reznik"]} {...props} />)
    expect(screen.getByTestId('speaker-plate')).toHaveTextContent(charName('vyktor_reznik'))
  })

  it('is empty before anyone has spoken', () => {
    render(<SpeakerStage speakerIds={[]} {...props} />)
    expect(screen.queryByTestId('speaker-plate')).toBeNull()
  })
})

describe('SpeakerStage exchange', () => {
  it('stands both speakers on stage, lighting only the one speaking', () => {
    render(<SpeakerStage speakerIds={['gregor_maric', 'elara_vostane']} {...props} />)
    const figures = screen.getAllByTestId('speaker-figure')
    expect(figures).toHaveLength(2)
    expect(figures.filter(f => f.dataset.speaking === 'true')).toHaveLength(1)
    expect(screen.getByTestId('speaker-stage')).toHaveAttribute('data-duel', 'true')
  })
})

describe('SceneBackdrop', () => {
  it('paints location art behind the conversation', () => {
    render(<SceneBackdrop location="Situation Room, Ashenmere Palace" isEmergency={false} />)
    expect(screen.getByTestId('scene-backdrop').style.backgroundImage).toMatch(/url\(/)
  })
})
