'use client'

interface VialProps {
  fromColor: string
  toColor: string
  mg: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: { width: 28, height: 56, capH: 11, capW: 18, bodyR: 10 },
  md: { width: 36, height: 72, capH: 14, capW: 24, bodyR: 13 },
  lg: { width: 48, height: 96, capH: 18, capW: 30, bodyR: 17 },
  xl: { width: 64, height: 128, capH: 24, capW: 40, bodyR: 22 },
}

export default function Vial({
  fromColor = '#EEF2FD',
  toColor = '#3B82F6',
  mg,
  size = 'md',
  className = '',
}: VialProps) {
  const s = sizes[size]
  const id = `vial-${(toColor ?? 'default').replace('#', '')}-${size}`

  return (
    <svg
      width={s.width}
      height={s.height}
      viewBox={`0 0 ${s.width} ${s.height}`}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={fromColor} />
          <stop offset="100%" stopColor={toColor} />
        </linearGradient>
        <linearGradient id={`cap-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fromColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={toColor} stopOpacity="0.7" />
        </linearGradient>
        <filter id={`shadow-${id}`}>
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor={toColor} floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Cap */}
      <rect
        x={(s.width - s.capW) / 2}
        y={0}
        width={s.capW}
        height={s.capH}
        rx="3"
        fill={`url(#cap-${id})`}
      />
      {/* Cap shine */}
      <rect
        x={(s.width - s.capW) / 2 + 3}
        y={2}
        width={4}
        height={s.capH - 4}
        rx="2"
        fill="rgba(255,255,255,0.5)"
      />
      {/* Body */}
      <rect
        x={(s.width - s.bodyR * 2) / 2}
        y={s.capH}
        width={s.bodyR * 2}
        height={s.height - s.capH - s.bodyR}
        fill={`url(#grad-${id})`}
        filter={`url(#shadow-${id})`}
      />
      {/* Bottom rounded */}
      <ellipse
        cx={s.width / 2}
        cy={s.height - s.bodyR}
        rx={s.bodyR}
        ry={s.bodyR}
        fill={toColor}
      />
      {/* Glass shine left */}
      <rect
        x={(s.width - s.bodyR * 2) / 2 + 4}
        y={s.capH + 6}
        width={5}
        height={s.height - s.capH - s.bodyR - 16}
        rx="2.5"
        fill="rgba(255,255,255,0.4)"
      />
      {/* Glass shine right */}
      <rect
        x={(s.width - s.bodyR * 2) / 2 + 11}
        y={s.capH + 10}
        width={2}
        height={(s.height - s.capH - s.bodyR - 16) * 0.4}
        rx="1"
        fill="rgba(255,255,255,0.2)"
      />
      {/* Label area */}
      <rect
        x={(s.width - s.bodyR * 2) / 2 + 3}
        y={s.capH + (s.height - s.capH) * 0.3}
        width={s.bodyR * 2 - 6}
        height={(s.height - s.capH) * 0.28}
        rx="2"
        fill="rgba(255,255,255,0.25)"
      />
      {/* mg text */}
      <text
        x={s.width / 2}
        y={s.height - 6}
        textAnchor="middle"
        fontSize={size === 'xl' ? 10 : size === 'lg' ? 8 : 7}
        fontWeight="600"
        fill="rgba(255,255,255,0.9)"
        fontFamily="system-ui, sans-serif"
      >
        {mg}
      </text>
    </svg>
  )
}