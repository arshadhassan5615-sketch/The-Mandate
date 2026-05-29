// Katerin Ashavel appearance silhouettes — used by CharacterCustomization and KaterinHUD.
// Each component returns SVG children for a 200x240 viewBox portrait.

const S = '#2d2318'   // silhouette
const H = '#1e1710'   // hair (darker)

export function Professional() {
  return (
    <>
      <ellipse cx="100" cy="33" rx="13" ry="10" fill={H}/>
      <path d="M70,74 Q67,40 100,36 Q133,40 130,74 Q126,53 100,50 Q74,53 70,74 Z" fill={H}/>
      <ellipse cx="100" cy="78" rx="32" ry="38" fill={S}/>
      <rect x="88" y="114" width="24" height="22" fill={S}/>
      <path d="M0,240 L0,160 Q25,150 62,142 L80,134 L88,136 L100,152 L112,136 L120,134 L138,142 Q175,150 200,160 L200,240 Z" fill={S}/>
      <path d="M88,136 L82,152 L68,170 L80,170 L100,152 Z" fill={S}/>
      <path d="M112,136 L118,152 L132,170 L120,170 L100,152 Z" fill={S}/>
    </>
  )
}

export function Austere() {
  return (
    <>
      <path d="M70,76 Q68,40 100,36 Q132,40 130,76 Q128,55 100,52 Q72,55 70,76 Z" fill={H}/>
      <ellipse cx="100" cy="80" rx="31" ry="38" fill={S}/>
      <rect x="88" y="116" width="24" height="18" fill={S}/>
      <path d="M0,240 L0,162 Q25,152 60,144 L78,136 L88,130 Q94,122 100,120 Q106,122 112,130 L122,136 L140,144 Q175,152 200,162 L200,240 Z" fill={S}/>
      <path d="M88,130 Q88,116 100,114 Q112,116 112,130 Q112,136 100,138 Q88,136 88,130 Z" fill={S}/>
    </>
  )
}

export function Approachable() {
  return (
    <>
      <path d="M71,70 Q59,95 54,130 Q48,158 64,170 Q66,140 74,114 Q75,60 100,46 Q125,60 126,114 Q134,140 136,170 Q152,158 146,130 Q141,95 129,70 Q126,38 100,34 Q74,38 71,70 Z" fill={H}/>
      <ellipse cx="100" cy="78" rx="32" ry="38" fill={S}/>
      <rect x="87" y="114" width="26" height="22" fill={S}/>
      <path d="M0,240 L0,164 Q22,154 56,146 L74,138 L88,132 Q100,144 112,132 L126,138 L144,146 Q178,154 200,164 L200,240 Z" fill={S}/>
    </>
  )
}

export function Military() {
  return (
    <>
      <path d="M71,78 Q69,44 100,40 Q131,44 129,78 Q127,57 100,54 Q73,57 71,78 Z" fill={H}/>
      <ellipse cx="100" cy="80" rx="31" ry="37" fill={S}/>
      <rect x="88" y="115" width="24" height="20" fill={S}/>
      <path d="M0,240 L0,157 Q22,147 56,140 L74,132 L88,128 L100,132 L112,128 L126,132 L144,140 Q178,147 200,157 L200,240 Z" fill={S}/>
      <path d="M88,128 L85,144 L97,144 L100,138 L103,144 L115,144 L112,128 Z" fill={S}/>
      <path d="M46,140 L68,132 L74,142 L52,150 Z" fill={S}/>
      <path d="M154,140 L132,132 L126,142 L148,150 Z" fill={S}/>
      <circle cx="85" cy="162" r="5" fill="#c8902a" opacity="0.55"/>
    </>
  )
}
