import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Typhoon, Coordinate } from '../types/typhoon'
import { getDistance } from '../utils/distance'

interface TyphoonMapProps {
  typhoons: Typhoon[]
  userLocation: Coordinate
  selectedTyphoonId?: string
  onTyphoonSelect: (id: string) => void
  focusCoord?: Coordinate | null
  uncertaintyRadiusKm?: number
}

// --- 自定义台风图标 ---
function createTyphoonIcon(_level: string, isSelected: boolean) {
  const size = isSelected ? 52 : 38
  return L.divIcon({
    className: 'typhoon-marker',
    html: `<div style="
      width:${size}px;height:${size}px;
      display:flex;align-items:center;justify-content:center;
      font-size:${size * 0.7}px;
      filter:drop-shadow(0 0 ${isSelected ? 12 : 6}px rgba(239,68,68,0.6));
      ${isSelected ? 'animation:pulse-marker 1.5s ease-in-out infinite;' : ''}
    ">🌀</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// --- 用户位置图标 ---
const userIcon = L.divIcon({
  className: 'user-marker',
  html: `<div style="
    width:20px;height:20px;
    background:#3B82F6;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 0 16px rgba(59,130,246,0.6);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

// --- 预测路径点图标 ---
function createForecastIcon(_level: string) {
  return L.divIcon({
    className: 'forecast-marker',
    html: `<div style="
      width:10px;height:10px;
      background:white;
      border-radius:50%;
      opacity:0.7;
      box-shadow:0 0 6px rgba(255,255,255,0.4);
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  })
}

// --- 等级对应颜色 ---
function getTyphoonColor(level: string): string {
  switch (level) {
    case '超强台风': return '#A855F7'
    case '强台风': return '#EF4444'
    case '台风': return '#F97316'
    case '强热带风暴': return '#FBBF24'
    case '热带风暴': return '#22C55E'
    default: return '#3B82F6'
  }
}

// --- 地图自动定位 ---
function MapAutoView({ center, zoom }: { center: Coordinate; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom, { animate: true })
  }, [map, center.lat, center.lng, zoom])
  return null
}

// --- 飞到预报位置 ---
function FlyToFocus({ coord }: { coord: Coordinate }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([coord.lat, coord.lng], 6, { animate: true, duration: 0.8 })
  }, [map, coord.lat, coord.lng])
  return null
}

export default function TyphoonMap({
  typhoons, userLocation, selectedTyphoonId, onTyphoonSelect, focusCoord, uncertaintyRadiusKm,
}: TyphoonMapProps) {
  const [showSatellite, setShowSatellite] = useState(false)

  // 选中台风
  const selectedTyphoon = useMemo(
    () => typhoons.find((t) => t.id === selectedTyphoonId) || typhoons[0],
    [typhoons, selectedTyphoonId]
  )

  // 地图中心和缩放
  const mapCenter = focusCoord || selectedTyphoon?.center || userLocation
  const mapZoom = focusCoord ? 6 : selectedTyphoon ? 5 : 4

  if (!selectedTyphoon) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/40 text-lg">
        当前没有活跃台风 🎉
      </div>
    )
  }

  const trajectoryColor = getTyphoonColor(selectedTyphoon.level)

  // 历史轨迹坐标数组（实线）
  const historyCoords: [number, number][] = selectedTyphoon.track.map(
    (p) => [p.lat, p.lng] as [number, number]
  )

  // 预测路径坐标数组（虚线）
  const forecastCoords: [number, number][] = [
    [selectedTyphoon.center.lat, selectedTyphoon.center.lng],
    ...selectedTyphoon.forecast.map((p) => [p.lat, p.lng] as [number, number]),
  ]

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={mapZoom}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
      >
        {/* 高德地图中文瓦片 + CSS暗色滤镜 (免费无需Key) */}
        <TileLayer
          url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
          subdomains={['1', '2', '3', '4']}
          className="dark-map-tiles"
        />

        {/* 卫星云图叠加层（条件渲染） */}
        {showSatellite && (
          <TileLayer
            url="https://apiv2.weather.naive.net/0.1/satellite/{z}/{x}/{y}"
            opacity={0.6}
          />
        )}

        <MapAutoView center={mapCenter} zoom={mapZoom} />

        {/* ===== 用户位置 ===== */}
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>
            <div className="text-sm font-semibold text-[var(--color-popup-text)]">📍 你的位置</div>
            {selectedTyphoon && (
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>
                距{selectedTyphoon.nameCN}：{getDistance(userLocation, selectedTyphoon.center)} km
              </div>
            )}
          </Popup>
        </Marker>

        {/* ===== 所有台风标记（点击切换台风） ===== */}
        {typhoons.map((typhoon) => {
          const isSelected = typhoon.id === selectedTyphoon.id
          return (
            <Marker
              key={typhoon.id}
              position={[typhoon.center.lat, typhoon.center.lng]}
              icon={createTyphoonIcon(typhoon.level, isSelected)}
              eventHandlers={{
                click: () => onTyphoonSelect(typhoon.id),
              }}
            />
          )
        })}

        {/* ===== 选中台风：影响圈层 ===== */}
        {selectedTyphoon && (
          <>
            {/* 12级风圈 - 红色 */}
            <Circle
              center={[selectedTyphoon.center.lat, selectedTyphoon.center.lng]}
              radius={selectedTyphoon.impactRings.level12 * 1000}
              pathOptions={{
                color: '#EF4444',
                fillColor: '#EF4444',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '6 3',
              }}
            >
              <Tooltip permanent direction="top" className="ring-tooltip">
                <span style={{ color: '#EF4444', fontSize: '11px' }}>12级风圈</span>
              </Tooltip>
            </Circle>

            {/* 10级风圈 - 橙色 */}
            <Circle
              center={[selectedTyphoon.center.lat, selectedTyphoon.center.lng]}
              radius={selectedTyphoon.impactRings.level10 * 1000}
              pathOptions={{
                color: '#F59E0B',
                fillColor: '#F59E0B',
                fillOpacity: 0.06,
                weight: 1.5,
                dashArray: '6 3',
              }}
            >
              <Tooltip permanent direction="bottom" className="ring-tooltip">
                <span style={{ color: '#F59E0B', fontSize: '11px' }}>10级风圈</span>
              </Tooltip>
            </Circle>

            {/* 7级风圈 - 黄色 */}
            <Circle
              center={[selectedTyphoon.center.lat, selectedTyphoon.center.lng]}
              radius={selectedTyphoon.impactRings.level7 * 1000}
              pathOptions={{
                color: '#FBBF24',
                fillColor: '#FBBF24',
                fillOpacity: 0.04,
                weight: 1.5,
                dashArray: '6 3',
              }}
            >
              <Tooltip permanent direction="left" className="ring-tooltip">
                <span style={{ color: '#FBBF24', fontSize: '11px' }}>7级风圈</span>
              </Tooltip>
            </Circle>

            {/* ===== 历史轨迹（实线） ===== */}
            {historyCoords.length >= 2 && (
              <Polyline
                positions={historyCoords}
                pathOptions={{
                  color: trajectoryColor,
                  weight: 2.5,
                  opacity: 0.9,
                }}
              />
            )}

            {/* ===== 预测轨迹连线（虚线） ===== */}
            <Polyline
              positions={forecastCoords}
              pathOptions={{
                color: trajectoryColor,
                weight: 2.5,
                opacity: 0.8,
                dashArray: '10 6',
              }}
            />

            {/* 轨迹流动动画（覆盖层，视觉加强） */}
            <Polyline
              positions={forecastCoords}
              pathOptions={{
                color: trajectoryColor,
                weight: 1,
                opacity: 0.3,
              }}
            />

            {/* ===== 预测路径时间点 ===== */}
            {selectedTyphoon.forecast.map((point, i) => (
              <Marker
                key={`fc-${i}`}
                position={[point.lat, point.lng]}
                icon={createForecastIcon(point.level)}
              >
                <Tooltip permanent direction="top" className="forecast-tooltip">
                  <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
                    {point.time.split(' ')[0]}<br />
                    {point.level}
                  </div>
                </Tooltip>
              </Marker>
            ))}

            {/* ===== 轨迹起始连线动画端点 ===== */}
            <Circle
              center={[selectedTyphoon.center.lat, selectedTyphoon.center.lng]}
              radius={15000}
              pathOptions={{
                color: trajectoryColor,
                fillColor: trajectoryColor,
                fillOpacity: 0.15,
                weight: 0,
              }}
            />
          </>
        )}

        {/* ===== 距离连线（用户 → 台风中心 / 预报点） ===== */}
        {selectedTyphoon && (
          <Polyline
            positions={[
              [userLocation.lat, userLocation.lng],
              [focusCoord?.lat ?? selectedTyphoon.center.lat, focusCoord?.lng ?? selectedTyphoon.center.lng],
            ]}
            pathOptions={{
              color: focusCoord ? '#3B82F6' : '#6B7280',
              weight: focusCoord ? 2 : 1,
              opacity: focusCoord ? 0.7 : 0.4,
              dashArray: focusCoord ? '8 4' : '4 8',
            }}
          />
        )}

        {/* ===== 预报焦点动画 ===== */}
        {focusCoord && (
          <>
            <FlyToFocus coord={focusCoord} />
            {/* 不确定性圆（灰色虚线，表示预报误差范围） */}
            {uncertaintyRadiusKm && uncertaintyRadiusKm > 0 && (
              <Circle
                center={[focusCoord.lat, focusCoord.lng]}
                radius={uncertaintyRadiusKm * 1000}
                pathOptions={{
                  color: '#9CA3AF',
                  fillColor: '#9CA3AF',
                  fillOpacity: 0.06,
                  weight: 1.5,
                  dashArray: '4 6',
                }}
              >
                <Tooltip permanent direction="top" className="ring-tooltip">
                  <span style={{ color: '#9CA3AF', fontSize: '10px' }}>
                    预测偏差范围 ±{uncertaintyRadiusKm}km
                  </span>
                </Tooltip>
              </Circle>
            )}
            {/* 脉冲标记 */}
            <Circle
              center={[focusCoord.lat, focusCoord.lng]}
              radius={30000}
              pathOptions={{
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 0.12,
                weight: 2,
              }}
            />
            {/* 内圈脉冲 */}
            <Circle
              center={[focusCoord.lat, focusCoord.lng]}
              radius={8000}
              pathOptions={{
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 0.2,
                weight: 0,
              }}
            >
              <Tooltip permanent direction="bottom" className="ring-tooltip">
                <span style={{ color: '#3B82F6', fontSize: '12px', fontWeight: 600 }}>
                  📍 预报位置
                </span>
              </Tooltip>
            </Circle>
          </>
        )}
      </MapContainer>

      {/* 卫星云图切换按钮 — 桌面右上角，移动端左下角 */}
      <button
        onClick={() => setShowSatellite(!showSatellite)}
        className="absolute z-[1000] rounded-xl px-3 py-2 text-xs font-medium
          bg-[var(--color-glass)] text-[var(--color-text-strong)]
          hover:bg-[var(--color-glass-hover)] transition-colors cursor-pointer
          border border-[var(--color-border-light)]
          bottom-[50vh] left-4
          md:bottom-auto md:left-auto
          md:top-20 md:right-4"
      >
        {showSatellite ? '🛰️ 隐藏云图' : '🛰️ 显示云图'}
      </button>
    </div>
  )
}
