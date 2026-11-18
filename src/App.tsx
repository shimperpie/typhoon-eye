import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TyphoonMap from './components/TyphoonMap'
import InfoPanel from './components/InfoPanel'
import DistanceMeter from './components/DistanceMeter'
import ImpactCard from './components/ImpactCard'
import ForecastTimeline from './components/ForecastTimeline'
import GlassCard from './components/GlassCard'
import MobileDrawer from './components/MobileDrawer'
import { useUserLocation } from './hooks/useUserLocation'
import { useTheme } from './hooks/useTheme'
import { useTyphoonData } from './hooks/useTyphoonData'
import { getDistance, getDistanceLevel } from './utils/distance'
import { assessImpact, getForecastConfidence } from './utils/impact'
import type { Coordinate, ForecastPoint } from './types/typhoon'

export default function App() {
  const { location: userLocation, loading, error, isDefault } = useUserLocation()
  const [selectedId, setSelectedId] = useState<string>('')
  const [panelOpen, setPanelOpen] = useState(true)
  const { theme, toggle: toggleTheme } = useTheme()
  const { typhoons, loading: dataLoading, usingMock } = useTyphoonData()

  // 自动上报用户访问（静默执行，不影响主功能）

  // 预报点选中状态: null = 显示距离表, number = 显示影响评估卡
  const [selectedForecastIndex, setSelectedForecastIndex] = useState<number | null>(null)

  // 切换台风时重置预报点选中
  const handleTyphoonSelect = useCallback((id: string) => {
    setSelectedId(id)
    setSelectedForecastIndex(null)
  }, [])

  // 选中台风不存在时自动回退到第一个
  const selectedTyphoon = useMemo(() => {
    const found = typhoons.find((t) => t.id === selectedId)
    return found || typhoons[0] || null
  }, [typhoons, selectedId])

  // 当前距离信息
  const distanceInfo = selectedTyphoon
    ? getDistanceLevel(getDistance(userLocation, selectedTyphoon.center))
    : null

  // 选中的预报点
  const selectedForecast: ForecastPoint | null = useMemo(() => {
    if (selectedForecastIndex === null || !selectedTyphoon) return null
    return selectedTyphoon.forecast[selectedForecastIndex] || null
  }, [selectedTyphoon, selectedForecastIndex])

  // 地图焦点坐标
  const focusCoord: Coordinate | null = selectedForecast
    ? { lat: selectedForecast.lat, lng: selectedForecast.lng }
    : null

  // 预报点的影响评估
  const forecastAssessment = useMemo(() => {
    if (!selectedForecast) return null
    const dist = getDistance(userLocation, selectedForecast)
    return assessImpact(dist, selectedForecast.level)
  }, [selectedForecast, userLocation])

  // 预报点的可信度
  const forecastConfidence = useMemo(() => {
    if (!selectedForecast || selectedForecast.hoursAhead <= 0) return null
    return getForecastConfidence(selectedForecast.hoursAhead)
  }, [selectedForecast])

  const cityName = isDefault ? '上海' : '你'

  if (loading || dataLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-pulse">🌀</div>
          <div className="text-[var(--color-text-dim)] text-lg">正在定位…</div>
          <div className="text-[var(--color-text-faint)] text-sm">
            根据用户隐私政策，本网站不会上传/记录你的位置。
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full h-full relative bg-[var(--color-bg)] overflow-hidden ${theme === 'light' ? 'light' : ''}`}>
      {/* ===== 全屏地图 (z-0 确保在底层) ===== */}
      <div className="absolute inset-0 z-0">
        <TyphoonMap
          typhoons={typhoons}
          userLocation={userLocation}
          selectedTyphoonId={selectedId}
          onTyphoonSelect={handleTyphoonSelect}
          focusCoord={focusCoord}
          uncertaintyRadiusKm={forecastConfidence?.errorKm}
        />
      </div>

      {/* ===== 顶部导航栏 ===== */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="absolute top-0 left-0 right-0 z-[800] glass border-b border-[var(--color-border-light)]"
      >
        <div className="max-w-full mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌀</span>
            <span className="text-lg font-bold text-[var(--color-text)] tracking-wide">
              台风眼
            </span>
            <span className="hidden md:inline text-xs text-[var(--color-text-muted)] tracking-widest uppercase">
              Typhoon Eye
            </span>
          </div>

          {/* 右侧控件 */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* 主题切换按钮 */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer
                bg-[var(--color-panel-bg)] hover:bg-[var(--color-panel-bg-hover)] text-lg"
              title={theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {usingMock && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/15 border border-amber-500/25">
                <span className="text-xs text-amber-400">⚠ 演示数据</span>
              </div>
            )}

            {/* 活跃台风数 — 仅桌面端 */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-panel-bg)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-[var(--color-text-dim)]">
                {typhoons.length} 个活跃台风
              </span>
            </div>

            {/* 位置指示 — 仅桌面端 */}
            <div className="hidden md:flex text-xs">
              {error ? (
                <span className="text-amber-400/70" title={error}>
                  📍 {cityName}（默认）
                </span>
              ) : (
                <span className="text-[var(--color-text-muted)]">
                  📍 {isDefault ? '上海（默认）' : '已定位'}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* ===== 左侧：台风选择器（桌面端） ===== */}
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="hidden md:flex absolute left-4 top-20 z-[800] flex-col gap-2"
      >
        {typhoons.map((typhoon) => (
          <button
            key={typhoon.id}
            onClick={() => handleTyphoonSelect(typhoon.id)}
            className={`
              glass-light rounded-xl px-4 py-3 text-left transition-all duration-300 cursor-pointer
              hover:bg-[var(--color-panel-bg-hover)]
              ${selectedId === typhoon.id
                ? 'border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                : 'border-[var(--color-border-light)]'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🌀</span>
              <div>
                <div className="text-sm font-semibold text-[var(--color-text)]">{typhoon.nameCN}</div>
                <div className="text-xs text-[var(--color-text-muted)]">{typhoon.level} · {typhoon.code}</div>
              </div>
            </div>
            {/* 距离 */}
            <div className="mt-1.5 text-xs text-[var(--color-text-dim)]">
              距{cityName}{' '}
              <span className="text-[var(--color-text-strong)] font-semibold tabular-nums">
                {getDistance(userLocation, typhoon.center)}
              </span> km
            </div>
          </button>
        ))}
      </motion.div>

      {/* ===== 移动端：横向滑动台风胶囊 ===== */}
      {typhoons.length > 1 && (
        <div className="md:hidden absolute top-14 left-0 right-0 z-[800] px-2">
          <div
            className="flex gap-2 overflow-x-auto py-2 px-1"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {typhoons.map((typhoon) => {
              const dist = getDistance(userLocation, typhoon.center)
              const isSelected = selectedId === typhoon.id
              return (
                <button
                  key={typhoon.id}
                  onClick={() => handleTyphoonSelect(typhoon.id)}
                  className={`shrink-0 glass-light rounded-full px-4 py-1.5 text-xs font-medium transition-all whitespace-nowrap cursor-pointer
                    ${isSelected
                      ? 'border border-blue-500/40 text-[var(--color-text-strong)] bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                      : 'border border-[var(--color-border-light)] text-[var(--color-text-dim)]'
                    }
                  `}
                >
                  🌀 {typhoon.nameCN} · 距{cityName}{dist}km
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== 右侧：详细信息面板（桌面端） ===== */}
      <AnimatePresence>
        {panelOpen && selectedTyphoon && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="hidden md:block absolute right-4 top-20 z-[800]"
          >
            <InfoPanel typhoon={selectedTyphoon} userCity={cityName} />

            {/* 预测路径时间线（可点击） */}
            <ForecastTimeline
              forecast={selectedTyphoon.forecast}
              userLocation={userLocation}
              cityName={cityName}
              selectedIndex={selectedForecastIndex}
              onSelect={setSelectedForecastIndex}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 面板切换按钮（仅桌面端） */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => setPanelOpen(!panelOpen)}
        className="hidden md:flex absolute right-4 bottom-24 z-[800] glass-light rounded-full w-10 h-10 items-center justify-center text-[var(--color-text-dim)] hover:text-[var(--color-text-strong)] transition-colors cursor-pointer"
        title={panelOpen ? '收起面板' : '展开面板'}
      >
        {panelOpen ? '◀' : '▶'}
      </motion.button>

      {/* ===== 底部中央：距离仪表 或 影响评估卡（仅桌面端） ===== */}
      <AnimatePresence mode="wait">
        {forecastAssessment && selectedForecast ? (
          <motion.div
            key="impact"
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ duration: 0.4, type: 'spring' }}
            className="hidden md:flex absolute bottom-0 left-0 right-0 z-[800] justify-center pb-8"
          >
            <ImpactCard
              assessment={forecastAssessment}
              confidence={forecastConfidence ?? undefined}
              timeLabel={selectedForecast.time}
              distanceKm={getDistance(userLocation, selectedForecast)}
              typhoonName={selectedTyphoon!.nameCN}
              cityName={cityName}
              onClose={() => setSelectedForecastIndex(null)}
            />
          </motion.div>
        ) : distanceInfo && selectedTyphoon ? (
          <motion.div
            key="distance"
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.6, type: 'spring' }}
            className="hidden md:flex absolute bottom-0 left-0 right-0 z-[800] justify-center pb-8"
          >
            <GlassCard glow className="px-10 py-6 scan-line">
              <DistanceMeter
                distanceKm={distanceInfo.distance}
                label={distanceInfo.label}
                level={distanceInfo.level}
                cityName={cityName}
                typhoonName={selectedTyphoon.nameCN}
              />
            </GlassCard>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ===== 移动端：底部抽屉面板 ===== */}
      {selectedTyphoon && (
        <div className="md:hidden">
          <MobileDrawer
            typhoon={selectedTyphoon}
            userLocation={userLocation}
            cityName={cityName}
            selectedForecastIndex={selectedForecastIndex}
            onSelectForecast={setSelectedForecastIndex}
            forecastAssessment={forecastAssessment}
            forecastConfidence={forecastConfidence}
          />
        </div>
      )}

      {/* ===== 底部提示（仅桌面端） ===== */}
      <div className="hidden md:block absolute bottom-2 left-4 z-[800] text-xs text-[var(--color-text-faint)]">
        数据来源于中央气象台 · 实际台风信息请以中国气象局发布为准
      </div>
    </div>
  )
}
