import { motion } from 'framer-motion'
import type { ImpactAssessment, ConfidenceInfo } from '../utils/impact'
import { impactColorConfig, confidenceColorConfig } from '../utils/impact'

interface ImpactCardProps {
  assessment: ImpactAssessment
  confidence?: ConfidenceInfo
  timeLabel: string
  distanceKm: number
  typhoonName: string
  cityName: string
  onClose: () => void
}

export default function ImpactCard({
  assessment,
  confidence,
  timeLabel,
  distanceKm,
  typhoonName,
  cityName,
  onClose,
}: ImpactCardProps) {
  const colors = impactColorConfig[assessment.level]
  const formattedDistance = distanceKm >= 1000
    ? `${(distanceKm / 1000).toFixed(1)}k`
    : distanceKm.toString()

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ duration: 0.35 }}
      className={`${colors.glow} rounded-xl border ${colors.border} ${colors.bg} backdrop-blur-xl px-8 py-5 min-w-[380px] max-w-[520px]`}
    >
      {/* 头部：时间 + 距离 + 关闭 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-text-dim)]">
            🌀 {typhoonName} · {timeLabel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-text-dim)]">
            距{cityName}{' '}
            <strong className="text-[var(--color-text-strong)] tabular-nums">
              {formattedDistance}
            </strong> km
          </span>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer text-xs"
            title="返回距离表"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 影响等级 */}
      <div className={`flex items-center gap-3 mb-3`}>
        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: colors.ring,
            boxShadow: `0 0 12px ${colors.ring}`,
          }}
        />
        <span className={`text-lg font-bold ${colors.text}`}>
          {assessment.level === 'safe' ? '🟢' : assessment.level === 'watch' ? '🟡' : assessment.level === 'warning' ? '🟠' : '🔴'}{' '}
          {assessment.label}
        </span>
        <span className="text-sm text-[var(--color-text-dim)]">
          {assessment.description}
        </span>
      </div>

      {/* 预测可信度 */}
      {confidence && confidence.level !== 'high' && (
        <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${confidenceColorConfig[confidence.level].bg}`}>
          <span className="text-xs">🎯</span>
          <span className={`text-xs ${confidenceColorConfig[confidence.level].text}`}>
            {confidence.description}
          </span>
        </div>
      )}

      {/* 建议列表 */}
      <div className="grid grid-cols-2 gap-2">
        {assessment.suggestions.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-panel-bg)]"
          >
            <span className="text-base">{s.icon}</span>
            <span className="text-xs text-[var(--color-text-dim)]">{s.text}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
