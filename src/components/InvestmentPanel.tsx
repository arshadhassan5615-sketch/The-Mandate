import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'

interface InvestmentOption {
  id: string
  name: string
  description: string
  cost: number
  type: 'luxury' | 'investment' | 'blackmarket'
  action: () => void
}

export default function InvestmentPanel({ onClose }: { onClose: () => void }) {
  const personalWealth = useGameStore(s => s.personal.personalWealth)
  const applyModifiers = useGameStore(s => s.applyModifiers)
  const addFlags = useNarrativeStore(s => s.addFlags)
  const [message, setMessage] = useState<string | null>(null)

  const handlePurchase = (option: InvestmentOption) => {
    if (personalWealth < option.cost) {
      setMessage(`Insufficient funds. You need ₭ ${option.cost.toLocaleString()}.`)
      return
    }
    
    // Deduct wealth
    applyModifiers([{ stat: 'personal.personalWealth', operation: 'add', value: -option.cost }])
    
    // Apply effects
    option.action()
    setMessage(`Purchased: ${option.name}`)
    
    setTimeout(() => setMessage(null), 3000)
  }

  const options: InvestmentOption[] = [
    // LUXURIES (Stress & Family)
    {
      id: 'country_dacha',
      name: 'Country Dacha',
      description: 'A rural estate. Unlocks a recurring stress-relief retreat for your family.',
      cost: 5000,
      type: 'luxury',
      action: () => {
        applyModifiers([
          { stat: 'personal.stressLevel', operation: 'add', value: -20 },
          { stat: 'personal.marriageHealth', operation: 'add', value: 10 }
        ])
        addFlags(['owns_dacha'])
      }
    },
    {
      id: 'liora_piano',
      name: 'Piano for Liora',
      description: 'A grand piano for your daughter. A gesture of love in a loveless house.',
      cost: 800,
      type: 'luxury',
      action: () => {
        applyModifiers([{ stat: 'personal.lioraRelationship', operation: 'add', value: 15 }])
      }
    },
    {
      id: 'tomas_school',
      name: 'Private Academy (Tomas)',
      description: 'Enroll Tomas in a prestigious academy. Removes him from public school risks.',
      cost: 1200,
      type: 'luxury',
      action: () => {
        applyModifiers([{ stat: 'personal.tomasWellbeing', operation: 'add', value: 20 }])
        addFlags(['tomas_in_private_school'])
      }
    },
    {
      id: 'art_collection',
      name: 'State Art Collection',
      description: 'Purchase fine art for the Palace. Boosts your public image as a cultured leader.',
      cost: 2000,
      type: 'luxury',
      action: () => {
        applyModifiers([
          { stat: 'personal.publicImage', operation: 'add', value: 8 },
          { stat: 'factions.workersCoalition', operation: 'add', value: -3 }
        ])
      }
    },
    // INVESTMENTS (High Risk / Reward)
    {
      id: 'war_bonds',
      name: 'State War Bonds',
      description: 'Invest in the Republic. Locks ₭ 2,000 for 4 weeks. Returns ₭ 2,500 and boosts economy.',
      cost: 2000,
      type: 'investment',
      action: () => {
        // Simple version: immediate economy boost, wealth returns via event later
        applyModifiers([{ stat: 'nation.economyHealth', operation: 'add', value: 5 }])
        addFlags(['invested_war_bonds'])
        // Note: A real system would track the 4-week delay and pay out via chainTrigger
      }
    },
    {
      id: 'foreign_currency',
      name: 'Orythian Marks (Illegal)',
      description: 'Hedge against Kroner inflation by buying foreign currency. High scandal risk.',
      cost: 1500,
      type: 'investment',
      action: () => {
        applyModifiers([{ stat: 'nation.corruption', operation: 'add', value: 5 }])
        addFlags(['bought_foreign_currency'])
      }
    },
    // BLACK MARKET (Shadow Ops)
    {
      id: 'fund_krel',
      name: 'Fund Krel Directly',
      description: 'Pay Matthias Krel out of your own pocket. Boosts shadow influence without touching state budget.',
      cost: 1500,
      type: 'blackmarket',
      action: () => {
        applyModifiers([
          { stat: 'shadowInfluence', operation: 'add', value: 15 },
          { stat: 'shadowFootprint', operation: 'add', value: 5 }
        ])
      }
    },
    {
      id: 'bribe_assembly',
      name: 'Bribe Assembly Member',
      description: '₭ 500 per vote. A subtle way to ensure legislation passes.',
      cost: 500,
      type: 'blackmarket',
      action: () => {
        applyModifiers([
          { stat: 'nation.corruption', operation: 'add', value: 2 },
          { stat: 'factions.halvekists', operation: 'add', value: 2 } // Temporary compliance
        ])
      }
    }
  ]

  const typeColors = {
    luxury: '#5a9e6b',
    investment: '#c9a84c',
    blackmarket: '#8b2e2e'
  }

  const typeLabels = {
    luxury: 'LUXURY',
    investment: 'INVESTMENT',
    blackmarket: 'BLACK MARKET'
  }

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1a1815', border: '1px solid rgba(200,144,42,0.3)',
          width: '100%', maxWidth: '640px', maxHeight: '90vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem', borderBottom: '1px solid rgba(200,144,42,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#c9a84c', margin: 0 }}>
              Chancellor's Discretionary Fund
            </h2>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: 'rgba(201,168,76,0.5)', margin: '4px 0 0' }}>
              Available Wealth: ₭ {personalWealth.toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid rgba(200,144,42,0.3)',
            color: '#c9a84c', cursor: 'pointer', fontSize: '1rem', padding: '0.2rem 0.6rem'
          }}>✕</button>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '0.8rem 1.5rem', background: 'rgba(201,168,76,0.1)',
            borderBottom: '1px solid rgba(200,144,42,0.2)',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: '#e8d5a3'
          }}>
            {message}
          </div>
        )}

        {/* Options List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          {options.map(option => {
            const canAfford = personalWealth >= option.cost
            return (
              <div 
                key={option.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1rem', marginBottom: '0.8rem',
                  background: 'rgba(10,8,6,0.5)', border: '1px solid rgba(200,144,42,0.15)',
                  opacity: canAfford ? 1 : 0.5
                }}
              >
                <div style={{ flex: 1, paddingRight: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem',
                      color: typeColors[option.type], border: `1px solid ${typeColors[option.type]}40`,
                      padding: '1px 6px', borderRadius: '2px', textTransform: 'uppercase'
                    }}>
                      {typeLabels[option.type]}
                    </span>
                    <span style={{
                      fontFamily: "'Playfair Display', serif", fontSize: '0.95rem', color: '#e8dcc8'
                    }}>
                      {option.name}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: "'Crimson Text', serif", fontSize: '0.8rem',
                    color: 'rgba(220,210,190,0.6)', margin: 0, fontStyle: 'italic'
                  }}>
                    {option.description}
                  </p>
                </div>
                <button
                  onClick={() => handlePurchase(option)}
                  disabled={!canAfford}
                  style={{
                    background: canAfford ? 'rgba(201,168,76,0.15)' : 'transparent',
                    border: `1px solid ${canAfford ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: canAfford ? '#c9a84c' : 'rgba(255,255,255,0.3)',
                    padding: '0.6rem 1rem', cursor: canAfford ? 'pointer' : 'not-allowed',
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem',
                    whiteSpace: 'nowrap', borderRadius: '2px'
                  }}
                >
                  ₭ {option.cost.toLocaleString()}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
