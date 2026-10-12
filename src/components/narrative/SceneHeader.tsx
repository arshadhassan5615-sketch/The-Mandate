interface SceneHeaderProps {
  title: string
  location: string
  week: number
  sceneType: string
}

// Only urgent scenes get a badge; ordinary meetings stay quiet.
const BADGES: Record<string, { label: string; color: string }> = {
  crisis: { label: 'Crisis', color: 'var(--state-warn)' },
  emergency: { label: 'Emergency', color: 'var(--state-bad)' },
}

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: '11px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
}

export default function SceneHeader({ title, location, week, sceneType }: SceneHeaderProps) {
  if (!title) return null
  const badge = BADGES[sceneType]

  return (
    <header
      className="scene-header"
      style={{
        flexShrink: 0,
        padding: '18px 0 14px',
        marginBottom: '6px',
        borderBottom: '1px solid rgba(181,154,94,0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--brass)' }}>
        <span style={LABEL_STYLE}>Week {week}</span>
        {badge && (
          <span
            style={{
              ...LABEL_STYLE,
              marginLeft: 'auto',
              padding: '2px 8px',
              border: `1px solid ${badge.color}`,
              color: badge.color,
              borderRadius: '2px',
            }}
          >
            {badge.label}
          </span>
        )}
      </div>
      {/* Location on its own line: long datelines wrap cleanly on phones. */}
      {location && (
        <div
          className="scene-header__location"
          style={{ ...LABEL_STYLE, marginTop: '6px', lineHeight: 1.5, color: 'rgba(200,185,155,0.75)' }}
        >
          {location}
        </div>
      )}
      <h2
        style={{
          margin: '8px 0 0',
          fontFamily: 'var(--font-headline)',
          fontSize: 'clamp(20px, 2vw, 26px)',
          fontWeight: 700,
          lineHeight: 1.2,
          color: 'var(--gold-bright)',
        }}
      >
        {title}
      </h2>
    </header>
  )
}
