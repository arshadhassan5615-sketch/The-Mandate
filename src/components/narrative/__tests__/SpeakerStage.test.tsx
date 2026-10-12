import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SpeakerStage from '../SpeakerStage'
import SceneBackdrop from '../SceneBackdrop'
import { charName } from '../speakers'

const props = { isPhone: false, rightInset: '600px', phoneBottom: '60vh' }

describe('SpeakerStage', () => {
  it('stands the current speaker on stage with a name plate', () => {
    render(<SpeakerStage speakerId="vyktor_reznik" {...props} />)
    expect(screen.getByTestId('speaker-plate')).toHaveTextContent(charName('vyktor_reznik'))
  })

  it('is empty before anyone has spoken', () => {
    render(<SpeakerStage speakerId={null} {...props} />)
    expect(screen.queryByTestId('speaker-plate')).toBeNull()
  })
})

describe('SceneBackdrop', () => {
  it('paints location art behind the conversation', () => {
    render(<SceneBackdrop location="Situation Room, Ashenmere Palace" isEmergency={false} />)
    expect(screen.getByTestId('scene-backdrop').style.backgroundImage).toMatch(/url\(/)
  })
})
