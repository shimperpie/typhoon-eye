interface DistanceMeterProps {
  distanceKm: number
  label: string
  level: 'critical' | 'warning' | 'watch' | 'safe'
  cityName: string
  typhoonName: string
}

const levelConfig = {
  critical: {
    ringColor: '#EF4444',
    textColor: 'text-red-400',
    bgGlow: 'shadow-[0_0_40px_rgba(239,68,68,0.3)]',
    pulse: true,
  },
  warning: {
    ringColor: '#F59E0B',
    textColor: 'text-amber-400',
    bgGlow: 'shadow-[0_0_30px_rgba(245,158,11,0.25)]',
    pulse: true,
  },
  watch: {
    ringColor: '#FBBF24',
    textColor: 'text-yellow-400',
    bgGlow: 'shadow-[0_0_20px_rgba(251,191,36,0.2)]',
    pulse: false,
  },
  safe: {
    ringColor: '#10B981',
    textColor: 'text-emerald-400',
    bgGlow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    pulse: false,
  },
}

export default function DistanceMeter({
  distanceKm,
  label,
  level,
  cityName,
  typhoonName,
}: DistanceMeterProps) {
  const config = levelConfig[level]
  const formattedDistance = distanceKm >= 1000
    ? `${(distanceKm / 1000).toFixed(1)}k`
    : distanceKm.toString()

  return (
    <div className="flex flex-col items-center gap-2">
      {/* 标签行 */}
      <div className="flex items-center gap-2 text-sm tracking-widest text-[var(--color-text-dim)] uppercase">
        <span className="w-2 h-2 rounded-full bg-white/20" />
        {typhoonName} · 距{cityName}
      </div>

      {/* 巨大距离数字 */}
      <div className={`relative flex items-baseline gap-1 ${config.textColor}`}>
        <span
          className="text-[120px] font-extrabold leading-none tracking-tighter tabular-nums"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          {formattedDistance}
        </span>
        <span className="text-3xl font-light text-[var(--color-text-dim)]">公里</span>
      </div>

      {/* 脉冲环 + 状态 */}
      <div className="flex items-center gap-3">
        <div className="relative">
          {config.pulse && (
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-40"
              style={{ backgroundColor: config.ringColor }}
            />
          )}
          <div
            className="relative w-3 h-3 rounded-full"
            style={{ backgroundColor: config.ringColor, boxShadow: `0 0 12px ${config.ringColor}` }}
          />
        </div>
        <span className={`text-lg font-medium ${config.textColor}`}>{label}</span>
      </div>
    </div>
  )
}
