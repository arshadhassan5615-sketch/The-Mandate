import React from 'react'

interface EBProps { children: React.ReactNode }
interface EBState { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('GAME CRASH:', error)
    console.error('COMPONENT STACK:', info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', inset: 0,
          background: '#0a0a0f',
          color: '#c9a84c',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
          padding: '40px',
          gap: '16px',
          zIndex: 9999,
        }}>
          <div style={{ fontSize: '20px', fontFamily: "'Playfair Display', serif" }}>
            THE MANDATE — ERROR
          </div>
          <div style={{
            color: '#ff6b6b',
            fontSize: '14px',
            maxWidth: '800px',
            textAlign: 'center',
          }}>
            {this.state.error?.message}
          </div>
          <div style={{
            color: '#666',
            fontSize: '11px',
            maxWidth: '800px',
            whiteSpace: 'pre-wrap',
            textAlign: 'left',
          }}>
            {this.state.error?.stack?.slice(0, 500)}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 24px',
              background: '#c9a84c',
              color: '#000',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: "'Special Elite', monospace",
            }}
          >
            Reload Game
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
