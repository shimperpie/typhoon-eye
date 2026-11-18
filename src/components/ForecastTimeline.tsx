import type { ForecastPoint, Coordinate } from '../types/typhoon'
import { getDistance } from '../utils/distance'
import { getForecastConfidence, confidenceColorConfig } from '../utils/impact'
import GlassCard from './GlassCard'

interface ForecastTimelineProps {
  forecast: ForecastPoint[]
  userLocation: Coordinate
  cityName: string
  selectedIndex: number | null
  onSelect: (index: number | null) => void
}

export default function ForecastTimeline({
  forecast,
  userLocation,
  cityName,
  selectedIndex,
  onSelect,
}: ForecastTimelineProps) {
  return (
    <GlassCard className="mt-3 p-4 min-w-[300px]">
      <div className="text-xs tracking-widest text-[var(--color-text-muted)] uppercase mb-3">
        预测路径 · 点击查看影响
      </div>
      <div className="space-y-1.5">
        {forecast.map((point, i) => {
          const dist = getDistance(userLocation, point)
          const isSelected = selectedIndex === i
          const isClosest = forecast.findIndex(
            (p) => getDistance(userLocation, p) <= dist
          ) === i

          return (
            <button
              key={i}
              onClick={() => onSelect(isSelected ? null : i)}
              className={`w-full text-left flex items-center gap-3 p-2 rounded-lg text-sm transition-all duration-200 cursor-pointer
                ${isSelected
                  ? 'bg-blue-500/15 border border-blue-500/30 ring-1 ring-blue-500/20'
                  : isClosest && dist < 500
                    ? 'bg-red-500/10 border border-red-500/20'
                    : 'bg-[var(--color-panel-bg)] border border-transparent hover:bg-[var(--color-panel-bg-hover)]'
                }
              `}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background:
                    point.level === '超强台风' || point.level === '强台风'
                      ? '#EF4444'
                      : point.level === '台风'
                        ? '#F97316'
                        : '#FBBF24',
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[var(--color-text-strong)] truncate">
                  {i === 0 ? '📍 当前' : `🕐 ${point.time}`}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {point.level} · {point.maxWind} km/h
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-[var(--color-text-dim)]">
                  距{cityName}
                </div>
                <div
                  className={`text-sm font-semibold tabular-nums ${
                    dist < 200
                      ? 'text-red-400'
                      : dist < 500
                        ? 'text-amber-400'
                        : 'text-[var(--color-text-dim)]'
                  }`}
                >
                  {dist} km
                </div>
                {/* 可信度标签（当前点不显示） */}
                {point.hoursAhead > 0 && (
                  <div className="mt-0.5">
                    {(() => {
                      const c = getForecastConfidence(point.hoursAhead)
                      const colors = confidenceColorConfig[c.level]
                      return (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                          {c.label}
                        </span>
                      )
                    })()}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </GlassCard>
  )
}
