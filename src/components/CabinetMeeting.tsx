import { useState } from 'react'
import type { MinisterRequest, MinisterRequestOption } from '../types/minister'
import { useCabinetStore } from '../stores/cabinetStore'

interface CabinetMeetingProps {
  requests: MinisterRequest[]
  onComplete: () => void
}

export const CabinetMeeting: React.FC<CabinetMeetingProps> = ({ requests, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [resolved, setResolved] = useState<string[]>([])

  const { completeRequest, updateLoyalty, updateSatisfaction, getAllMinisters } = useCabinetStore()

  if (requests.length === 0) {
    onComplete()
    return null
  }

  const current = requests[currentIndex]
  const minister = getAllMinisters().find(m => m.id === current.minister_id) ?? null

  const handleDecision = (option: MinisterRequestOption) => {
    setSelectedOption(option.id)
    completeRequest(current.id)
    if (minister) {
      updateLoyalty(minister.ministry, option.loyalty_effect)
      updateSatisfaction(minister.ministry, option.satisfaction_effect)
    }
    setResolved(prev => [...prev, current.id])
  }

  const handleNext = () => {
    if (currentIndex < requests.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedOption(null)
    } else {
      onComplete()
    }
  }

  const isLast = currentIndex === requests.length - 1
  const selectedData = current.options.find(o => o.id === selectedOption)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      top: '40px',
      background: 'rgba(8,6,4,0.95)',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Georgia, serif',
      paddingRight: '60px',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 48px 16px',
        borderBottom: '1px solid rgba(201,168,76,0.3)',
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontSize: '9px',
            letterSpacing: '3px',
            color: 'rgba(201,168,76,0.5)',
            marginBottom: '4px',
          }}>
            CABINET MEETING · WEEKLY REPORTS
          </div>
          <div style={{
            fontSize: '18px',
            color: '#e8d5a3',
            fontWeight: 700,
            fontStyle: 'italic',
          }}>
            {current.title}
          </div>
        </div>
        <div style={{
          fontSize: '11px',
          color: 'rgba(201,168,76,0.4)',
        }}>
          {currentIndex + 1} of {requests.length}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '32px 48px',
        display: 'flex',
        gap: '40px',
      }}>
        {/* Minister portrait + info */}
        {minister && (
          <div style={{
            width: '180px',
            flexShrink: 0,
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: '2px solid rgba(201,168,76,0.4)',
              overflow: 'hidden',
              margin: '0 auto 12px',
              background: 'rgba(201,168,76,0.1)',
            }}>
              <img
                src={minister.portrait}
                alt={minister.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
            <div style={{
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: 700,
              color: '#e8d5a3',
              marginBottom: '4px',
            }}>
              {minister.name}
            </div>
            <div style={{
              textAlign: 'center',
              fontSize: '10px',
              color: 'rgba(201,168,76,0.6)',
              letterSpacing: '1px',
              marginBottom: '16px',
            }}>
              {minister.title}
            </div>

            {/* Loyalty bar */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '3px',
              }}>
                <span style={{
                  fontSize: '9px',
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '1px',
                }}>LOYALTY</span>
                <span style={{
                  fontSize: '9px',
                  color: '#c9a84c',
                }}>
                  {minister.current_loyalty}
                </span>
              </div>
              <div style={{
                height: '3px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '2px',
              }}>
                <div style={{
                  width: `${minister.current_loyalty}%`,
                  height: '100%',
                  background: '#c9a84c',
                  borderRadius: '2px',
                }} />
              </div>
            </div>

            {/* Satisfaction bar */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '3px',
              }}>
                <span style={{
                  fontSize: '9px',
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '1px',
                }}>SATISFACTION</span>
                <span style={{
                  fontSize: '9px',
                  color: minister.satisfaction > 50 ? '#2d7a3a' : '#c0392b',
                }}>
                  {minister.satisfaction}
                </span>
              </div>
              <div style={{
                height: '3px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '2px',
              }}>
                <div style={{
                  width: `${minister.satisfaction}%`,
                  height: '100%',
                  background: minister.satisfaction > 50 ? '#2d7a3a' : '#c0392b',
                  borderRadius: '2px',
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Report + Options */}
        <div style={{ flex: 1 }}>
          {/* Minister's report */}
          <div style={{
            background: 'rgba(201,168,76,0.04)',
            border: '1px solid rgba(201,168,76,0.15)',
            borderLeft: '3px solid rgba(201,168,76,0.5)',
            padding: '20px 24px',
            marginBottom: '28px',
            borderRadius: '2px',
          }}>
            <div style={{
              fontSize: '9px',
              letterSpacing: '2px',
              color: 'rgba(201,168,76,0.5)',
              marginBottom: '10px',
            }}>
              {minister ? (minister.name.toUpperCase() + ' REPORTS —') : 'MINISTER REPORTS —'}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#e8d5a3',
              lineHeight: '1.75',
              fontStyle: 'italic',
            }}>
              &ldquo;{current.description}&rdquo;
            </div>
          </div>

          {/* Options */}
          {!selectedOption ? (
            <div>
              <div style={{
                fontSize: '9px',
                letterSpacing: '3px',
                color: 'rgba(201,168,76,0.5)',
                marginBottom: '14px',
              }}>
                YOUR RESPONSE —
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}>
                {current.options.map(option => (
                  <div
                    key={option.id}
                    onClick={() => handleDecision(option)}
                    style={{
                      padding: '16px 20px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(201,168,76,0.2)',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(201,168,76,0.08)'
                      e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'
                    }}
                  >
                    <div style={{
                      fontSize: '13px',
                      color: '#e8d5a3',
                      marginBottom: '6px',
                    }}>
                      {option.text}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: 'rgba(255,255,255,0.35)',
                      fontStyle: 'italic',
                    }}>
                      {option.consequence}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                fontSize: '9px',
                letterSpacing: '3px',
                color: '#2d7a3a',
                marginBottom: '14px',
              }}>
                DECISION RECORDED —
              </div>
              <div style={{
                padding: '16px 20px',
                background: 'rgba(45,122,58,0.08)',
                border: '1px solid rgba(45,122,58,0.3)',
                borderRadius: '2px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#e8d5a3',
                fontStyle: 'italic',
              }}>
                {selectedData?.text}
              </div>
              <button
                onClick={handleNext}
                style={{
                  background: '#c9a84c',
                  color: '#1a1410',
                  border: 'none',
                  padding: '12px 32px',
                  fontFamily: 'Georgia, serif',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {isLast ? 'Conclude Meeting →' : 'Next Report →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
