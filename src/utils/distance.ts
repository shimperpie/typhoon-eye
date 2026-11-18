import type { Coordinate, DistanceInfo, DistanceLevel, Typhoon } from '../types/typhoon'

// Haversine 公式计算两点间距离 (返回公里数)
export function getDistance(a: Coordinate, b: Coordinate): number {
  const R = 6371 // 地球半径 (km)
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const aVal =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal))
  return Math.round(R * c)
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

// 根据距离判断影响等级
export function getDistanceLevel(distanceKm: number): DistanceInfo {
  let level: DistanceLevel
  let label: string
  let estimatedHours: number | null = null

  if (distanceKm < 200) {
    level = 'critical'
    label = '台风就在附近！请待在室内！'
    estimatedHours = 0
  } else if (distanceKm < 500) {
    level = 'warning'
    label = '台风正在靠近，注意防范'
    estimatedHours = estimateHours(distanceKm, 20) // 假设20km/h
  } else if (distanceKm < 1000) {
    level = 'watch'
    label = '距离较远，持续关注'
    estimatedHours = estimateHours(distanceKm, 20)
  } else {
    level = 'safe'
    label = '当前无直接影响'
    estimatedHours = null
  }

  return { distance: distanceKm, level, label, estimatedHours }
}

function estimateHours(distanceKm: number, speedKmh: number): number {
  return Math.round(distanceKm / speedKmh)
}

// 获取离用户最近的台风
export function getNearestTyphoon(
  userLocation: Coordinate,
  typhoons: Typhoon[]
): Typhoon | null {
  if (typhoons.length === 0) return null
  let nearest = typhoons[0]
  let minDist = getDistance(userLocation, nearest.center)
  for (let i = 1; i < typhoons.length; i++) {
    const dist = getDistance(userLocation, typhoons[i].center)
    if (dist < minDist) {
      minDist = dist
      nearest = typhoons[i]
    }
  }
  return nearest
}

// 方向角度转中文描述
export function directionToText(deg: number): string {
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  const index = Math.round(deg / 45) % 8
  return dirs[index]
}
