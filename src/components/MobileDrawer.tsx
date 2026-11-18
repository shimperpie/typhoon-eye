import { useState, useEffect, useCallback } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import type { Typhoon, ForecastPoint, Coordinate } from '../types/typhoon'
import type { ImpactAssessment, ConfidenceInfo } from '../utils/impact'
import { getDistance } from '../utils/distance'
import { getForecastConfidence, confidenceColorConfig, impactColorConfig } from '../utils/impact'

interface MobileDrawerProps {
  typhoon: Typhoon
  userLocation: Coordinate
  cityName: string
  selectedForecastIndex: number | null
  onSelectForecast: (index: number | null) => void
  forecastAssessment: ImpactAssessment | null
  forecastConfidence: ConfidenceInfo | null
}

// SSR 安全的窗口高度（服务端回退值）
const safeWinHeight = () =>
  typeof window !== 'undefined' ? window.innerHeight : 900

export default function MobileDrawer({
  typhoon,
  userLocation,
  cityName,
  selectedForecastIndex,
  onSelectForecast,
  forecastAssessment,
  forecastConfidence,
}: MobileDrawerProps) {
  const winH = safeWinHeight()
  // 全屏位置：top = 10vh；半屏位置：top = 60vh
  const FULL_Y = winH * 0.1
  const HALF_Y = winH * 0.6

  // 用 useMotionValue 驱动 Y 位置，实现真正的拖拽
  const y = useMotionValue(0)
  const [snapState, setSnapState] = useState<'half' | 'full'>('half')

  // 初始化 Y 位置为半屏
  useEffect(() => {
    y.set(HALF_Y)
  }, [HALF_Y, y])

  // 选中预报点时自动展开全屏
  useEffect(() => {
    if (selectedForecastIndex !== null) {
      animate(y, FULL_Y, { type: 'spring', stiffness: 350, damping: 32 })
      setSnapState('full')
    }
  }, [selectedForecastIndex, FULL_Y, y])

  // 拖拽结束：根据速度和位置自动吸附
  const handleDragEnd = useCallback(
    (_: any, info: { velocity: { y: number } }) => {
      const currentY = y.get()
      const velocity = info.velocity.y

      if (velocity < -300) {
        // 快速上滑 → 全屏
        animate(y, FULL_Y, { type: 'spring', stiffness: 350, damping: 32 })
        setSnapState('full')
      } else if (velocity > 300) {
        // 快速下滑 → 半屏
        animate(y, HALF_Y, { type: 'spring', stiffness: 350, damping: 32 })
        setSnapState('half')
      } else {
        // 慢速 → 吸附到更近的位置
        const midPoint = (FULL_Y + HALF_Y) / 2
        const target = currentY < midPoint ? FULL_Y : HALF_Y
        animate(y, target, { type: 'spring', stiffness: 350, damping: 32 })
        setSnapState(target === FULL_Y ? 'full' : 'half')
      }
    },
    [FULL_Y, HALF_Y, y],
  )

  // 点击手柄切换半屏/全屏
  const toggleDrawer = useCallback(() => {
    const target = snapState === 'half' ? FULL_Y : HALF_Y
    animate(y, target, { type: 'spring', stiffness: 350, damping: 32 })
    setSnapState(snapState === 'half' ? 'full' : 'half')
  }, [snapState, FULL_Y, HALF_Y, y])

  const distance = getDistance(userLocation, typhoon.center)
  const isShowingAssessment = selectedForecastIndex !== null && forecastAssessment
  const forecast = typhoon.forecast

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: FULL_Y, bottom: HALF_Y }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      style={{ y, top: 0, height: '90vh' }}
      initial={{ y: HALF_Y }}
      className="absolute left-0 right-0 z-[800] rounded-t-2xl
        bg-[var(--color-glass-bg)] backdrop-blur-xl
        border-t border-[var(--color-border)]
        shadow-[0_-8px_32px_rgba(0,0,0,0.3)]
        overflow-hidden"
    >
      {/* 拖拽手柄区域 — 整个顶部区域都可拖拽 */}
      <div
        onClick={toggleDrawer}
        className="flex flex-col items-center pt-3 pb-2 cursor-pointer active:opacity-70"
      >
        <div className="w-10 h-1 rounded-full bg-[var(--color-text-muted)]/50" />
        {/* 提示文字 — 根据当前吸附状态动态更新 */}
        <span className="text-[10px] text-[var(--color-text-faint)] mt-1">
          {snapState === 'half' ? '上滑查看更多' : '下滑收起'}
        </span>
      </div>

      {/* Typhoon summary header */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">🌀</span>
            <div className="min-w-0">
              <div className="text-base font-semibold text-[var(--color-text)] truncate">
                {typhoon.nameCN}
              </div>
              <div className="text-xs text-[var(--color-text-dim)]">
                {typhoon.level}
              </div>
            </div>
          </div>
          <div className="text-xs text-[var(--color-text-dim)] shrink-0 ml-2 text-right">
            <div>📍 距{cityName}</div>
            <div className="font-semibold text-[var(--color-text-strong)] tabular-nums text-sm">
              {distance.toLocaleString()} km
            </div>
          </div>
        </div>
        {/* Quick stats bar */}
        <div className="flex gap-3 mt-2 text-[11px] text-[var(--color-text-muted)]">
          <span>💨 {typhoon.maxWind}km/h</span>
          <span>📉 {typhoon.pressure}hPa</span>
          <span>🚀 {typhoon.speed}km/h</span>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent mx-4" />

      {/* Scrollable content */}
      <div
        className="overflow-y-auto px-4 pt-3 pb-4"
        style={{ maxHeight: 'calc(90vh - 130px)' }}
      >
        {isShowingAssessment ? (
          <AssessmentView
            assessment={forecastAssessment}
            confidence={forecastConfidence}
            onBack={() => onSelectForecast(null)}
          />
        ) : (
          <ForecastListView
            forecast={forecast}
            userLocation={userLocation}
            cityName={cityName}
            selectedIndex={selectedForecastIndex}
            onSelect={onSelectForecast}
          />
        )}
      </div>

      {/* Data source attribution — mobile */}
      <div className="absolute bottom-2 left-4 right-4 text-[10px] text-[var(--color-text-faint)] text-center">
        数据来源于中央气象台 · 实际台风信息请以中国气象局发布为准
      </div>
    </motion.div>
  )
}

// ---- Forecast list sub-component ----
function ForecastListView({
  forecast,
  userLocation,
  cityName,
  selectedIndex,
  onSelect,
}: {
  forecast: ForecastPoint[]
  userLocation: Coordinate
  cityName: string
  selectedIndex: number | null
  onSelect: (index: number | null) => void
}) {
  return (
    <div>
      <div className="text-xs tracking-widest text-[var(--color-text-muted)] uppercase mb-2">
        🕐 预测路径 · 点击查看影响
      </div>
      <div className="space-y-1.5">
        {forecast.map((point, i) => {
          const dist = getDistance(userLocation, point)
          const isSelected = selectedIndex === i

          return (
            <button
              key={i}
              onClick={() => onSelect(isSelected ? null : i)}
              className={`w-full text-left flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer
                ${
                  isSelected
                    ? 'bg-blue-500/15 border border-blue-500/30 ring-1 ring-blue-500/20'
                    : 'bg-[var(--color-panel-bg)] border border-transparent active:bg-[var(--color-panel-bg-hover)]'
                }
              `}
            >
              {/* Level dot */}
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
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[var(--color-text-strong)] text-xs truncate">
                  {i === 0 ? '📍 当前位置' : `🕐 ${point.time}`}
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)]">
                  {point.level} · {point.maxWind} km/h
                </div>
              </div>
              {/* Distance */}
              <div className="text-right shrink-0">
                <div className="text-[11px] text-[var(--color-text-dim)]">
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
                {/* Confidence badge */}
                {point.hoursAhead > 0 && (
                  <div className="mt-0.5">
                    {(() => {
                      const c = getForecastConfidence(point.hoursAhead)
                      const colors = confidenceColorConfig[c.level]
                      return (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
                        >
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
    </div>
  )
}

// ---- Impact assessment sub-component ----
function AssessmentView({
  assessment,
  confidence,
  onBack,
}: {
  assessment: ImpactAssessment
  confidence: ConfidenceInfo | null
  onBack: () => void
}) {
  const colors = impactColorConfig[assessment.level]

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors mb-3 cursor-pointer"
      >
        ← 返回预报列表
      </button>

      {/* Impact level header */}
      <div className={`flex items-center gap-2 mb-3 p-3 rounded-xl ${colors.bg} ${colors.border} border`}>
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{
            backgroundColor: colors.ring,
            boxShadow: `0 0 12px ${colors.ring}`,
          }}
        />
        <span className={`text-base font-bold ${colors.text}`}>
          {assessment.level === 'safe'
            ? '🟢'
            : assessment.level === 'watch'
              ? '🟡'
              : assessment.level === 'warning'
                ? '🟠'
                : '🔴'}{' '}
          {assessment.label}
        </span>
        <span className="text-xs text-[var(--color-text-dim)]">
          {assessment.description}
        </span>
      </div>

      {/* Confidence warning */}
      {confidence && confidence.level !== 'high' && (
        <div
          className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${confidenceColorConfig[confidence.level].bg}`}
        >
          <span className="text-xs">🎯</span>
          <span className={`text-xs ${confidenceColorConfig[confidence.level].text}`}>
            {confidence.description}
          </span>
        </div>
      )}

      {/* Suggestions */}
      <div className="space-y-1.5">
        {assessment.suggestions.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-panel-bg)]"
          >
            <span className="text-sm">{s.icon}</span>
            <span className="text-xs text-[var(--color-text-dim)]">{s.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
