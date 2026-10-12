import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SceneHeader from '../SceneHeader'

describe('SceneHeader', () => {
  it('shows the scene title, location and week', () => {
    render(<SceneHeader title="The First Month" location="Chancellery, Ashenmere" week={6} sceneType="meeting" />)
    expect(screen.getByRole('heading', { name: 'The First Month' })).toBeInTheDocument()
    expect(screen.getByText('Chancellery, Ashenmere')).toBeInTheDocument()
    expect(screen.getByText('Week 6')).toBeInTheDocument()
  })

  it('flags crisis and emergency scenes', () => {
    const { rerender } = render(<SceneHeader title="Strike" location="Kravenstal" week={9} sceneType="crisis" />)
    expect(screen.getByText('Crisis')).toBeInTheDocument()
    rerender(<SceneHeader title="Coup" location="Ashenmere" week={37} sceneType="emergency" />)
    expect(screen.getByText('Emergency')).toBeInTheDocument()
  })

  it('shows no badge for ordinary scenes', () => {
    render(<SceneHeader title="Dinner" location="Residence" week={3} sceneType="personal" />)
    expect(screen.queryByText('Crisis')).toBeNull()
    expect(screen.queryByText('Emergency')).toBeNull()
  })

  it('leaves out an empty location instead of printing a stray separator', () => {
    const { container } = render(<SceneHeader title="Untitled" location="" week={1} sceneType="event" />)
    expect(container.querySelector('.scene-header__location')).toBeNull()
  })

  it('renders nothing when there is no title', () => {
    const { container } = render(<SceneHeader title="" location="Ashenmere" week={1} sceneType="event" />)
    expect(container).toBeEmptyDOMElement()
  })
})
