import type { Typhoon, TyphoonLevel } from '../types/typhoon'
import { directionToText } from '../utils/distance'
import GlassCard from './GlassCard'

interface InfoPanelProps {
  typhoon: Typhoon
  userCity: string
}

const levelBadge: Record<TyphoonLevel, { bg: string; text: string }> = {
  '热带低压': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  '热带风暴': { bg: 'bg-green-500/20', text: 'text-green-400' },
  '强热带风暴': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  '台风': { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  '强台风': { bg: 'bg-red-500/20', text: 'text-red-400' },
  '超强台风': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
}

export default function InfoPanel({ typhoon }: InfoPanelProps) {
  const badge = levelBadge[typhoon.level]

  return (
    <GlassCard className="p-5 space-y-4 min-w-[300px]">
      {/* 台风名称 & 等级 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs tracking-widest text-[var(--color-text-muted)] uppercase">
            {typhoon.code} · {typhoon.nameCN}
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text)] mt-0.5">{typhoon.nameCN}</h2>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
          🌀 {typhoon.level}
        </span>
      </div>

      {/* 分割线 */}
      <div className="h-px bg-gradient-to-r from-[var(--color-separator)] via-[var(--color-border)] to-transparent" />

      {/* 数据网格 */}
      <div className="grid grid-cols-2 gap-3">
        <DataItem label="中心气压" value={`${typhoon.pressure} hPa`} />
        <DataItem label="最大风速" value={`${typhoon.maxWind} km/h`} />
        <DataItem
          label="移动方向"
          value={`${directionToText(typhoon.direction)}偏${typhoon.direction % 45 > 0 ? directionToText((Math.floor(typhoon.direction / 45) + 1) * 45) : ''}`}
        />
        <DataItem label="移动速度" value={`${typhoon.speed} km/h`} />
      </div>

      {/* 分割线 */}
      <div className="h-px bg-gradient-to-r from-[var(--color-separator)] via-[var(--color-border)] to-transparent" />

      {/* 影响圈层 */}
      <div>
        <div className="text-xs tracking-widest text-[var(--color-text-muted)] uppercase mb-2">影响范围</div>
        <div className="space-y-1.5">
          <RingBar level="7级风圈" km={typhoon.impactRings.level7} color="#FBBF24" />
          <RingBar level="10级风圈" km={typhoon.impactRings.level10} color="#F59E0B" />
          <RingBar level="12级风圈" km={typhoon.impactRings.level12} color="#EF4444" />
        </div>
      </div>

      {/* 更新时间 */}
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-faint)]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        数据更新于 {new Date(typhoon.updatedAt).toLocaleString('zh-CN')}
      </div>
    </GlassCard>
  )
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--color-panel-bg)] rounded-lg p-3">
      <div className="text-xs text-[var(--color-text-muted)] mb-0.5">{label}</div>
      <div className="text-sm font-semibold text-[var(--color-text-strong)]">{value}</div>
    </div>
  )
}

function RingBar({ level, km, color }: { level: string; km: number; color: string }) {
  const maxKm = 400
  const width = Math.min((km / maxKm) * 100, 100)
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--color-text-dim)] w-16">{level}</span>
      <div className="flex-1 h-2 bg-[var(--color-panel-bg)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-[var(--color-text-dim)] w-14 text-right">{km} km</span>
    </div>
  )
}
