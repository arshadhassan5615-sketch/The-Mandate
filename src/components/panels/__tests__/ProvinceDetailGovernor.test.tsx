import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProvinceDetail from '../ProvinceDetail'
import { useNarrativeStore } from '../../../stores/narrativeStore'

describe('ProvinceDetail governor row', () => {
  beforeEach(() => {
    useNarrativeStore.setState({ activeFlags: [] })
  })

  it('shows the incumbent governor and Halvek appointee label when no governor flag is set', () => {
    render(<ProvinceDetail initialProvince="kravenstal" onClose={() => {}} />)
    expect(screen.getByText('Governor')).toBeInTheDocument()
    expect(screen.getByText('Bohdan Kral · Halvek appointee')).toBeInTheDocument()
  })

  it('shows the appointed governor and Your appointee label when the appointment flag is active', () => {
    useNarrativeStore.setState({ activeFlags: ['governor_kravenstal_appointed_novak'] })
    render(<ProvinceDetail initialProvince="kravenstal" onClose={() => {}} />)
    expect(screen.getByText('Hana Novak · Your appointee')).toBeInTheDocument()
    expect(screen.queryByText('Bohdan Kral · Halvek appointee')).not.toBeInTheDocument()
  })
})
