/**
 * CMA（中央气象台）台风数据服务
 *
 * 数据来源：typhoon.nmc.cn（中国气象局台风网）
 * 服务端将上游 JSONP 响应解析为 JSON。
 * 费用：完全免费，无需 API Key
 */

import type { Typhoon, TyphoonLevel, ForecastPoint, ImpactRings } from '../types/typhoon'

// ===== 自有后端 API 端点（代理 CMA 数据，解决 HTTPS 混合内容问题） =====
const API_BASE = '/api'

// ===== 强度等级映射 =====
const INTENSITY_MAP: Record<string, TyphoonLevel> = {
  TD: '热带低压',
  TS: '热带风暴',
  STS: '强热带风暴',
  TY: '台风',
  STY: '强台风',
  SuperTY: '超强台风',
}

// ===== 风向字符串 → 角度 =====
const DIRECTION_MAP: Record<string, number> = {
  N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
  E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
  S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
  W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
}

// ===== 原始 CMA 数据类型 =====
type CmaListItem = [number, string, string, number, number, unknown, string | null, string]

/** 单个轨迹点 */
type CmaTrackPoint = [
  number,           // [0] 点ID
  string,           // [1] 时间 "YYYYMMDDHHMM"
  number,           // [2] 时间戳
  string,           // [3] 强度代码 (TD/TS/STS/TY/STY/SuperTY)
  number,           // [4] 经度
  number,           // [5] 纬度
  number,           // [6] 中心气压 hPa
  number,           // [7] 最大风速 m/s
  string,           // [8] 移动方向 (N/NE/E/SE/S/SW/W/NW 等)
  number,           // [9] 移动速度 km/h
  CmaWindRadii[],   // [10] 风圈半径数组
  { BABJ?: CmaBABJEntry[] } | null,  // [11] 预报数据
  [string, string, null, null] | null  // [12] 格式化时间描述
]

/** 风圈半径: ["30KTS"|"50KTS"|"64KTS", NE半径, SE半径, SW半径, NW半径, 点ID] */
type CmaWindRadii = [string, number, number, number, number, number]

/** BABJ 预报点 */
type CmaBABJEntry = [number, string, number, number, number, number, string, string]

interface CmaDetailResponse {
  typhoon: [
    number,              // [0] 台风ID
    string,              // [1] 英文名
    string,              // [2] 中文名
    number,              // [3] 台风编号
    number,              // [4] ??
    unknown,             // [5] ??
    string | null,       // [6] 名字含义
    string,              // [7] 状态 ("start"|"stop")
    CmaTrackPoint[],     // [8] 轨迹点数组
    unknown[]            // [9] 交叉引用数据（忽略）
  ]
}

// ===== 工具函数 =====

function ts13(): number {
  return Date.now()
}

function parseCmaTime(timeStr: string): string {
  // "YYYYMMDDHHMM" → ISO 字符串
  const Y = timeStr.slice(0, 4)
  const M = timeStr.slice(4, 6)
  const D = timeStr.slice(6, 8)
  const h = timeStr.slice(8, 10)
  const m = timeStr.slice(10, 12)
  return `${Y}-${M}-${D}T${h}:${m}:00+08:00`
}

function formatTimeLabel(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function mapIntensity(code: string): TyphoonLevel {
  return INTENSITY_MAP[code] || '热带低压'
}

function mapDirection(dir: string): number {
  return DIRECTION_MAP[dir] ?? 0
}

/** 从风圈数组中提取各级最大半径 */
function extractWindRadii(radiiArr: CmaWindRadii[]): ImpactRings {
  let level7 = 0   // 30KTS ≈ 7级风
  let level10 = 0  // 50KTS ≈ 10级风
  let level12 = 0  // 64KTS ≈ 12级风

  for (const r of radiiArr) {
    // r = ["30KTS", NE, SE, SW, NW, pointID]
    const maxRadius = Math.max(r[1], r[2], r[3], r[4])
    switch (r[0]) {
      case '30KTS': level7 = maxRadius; break
      case '50KTS': level10 = maxRadius; break
      case '64KTS': level12 = maxRadius; break
    }
  }

  return { level7, level10, level12 }
}

// ===== 公开 API =====

/** 获取当前活跃台风列表（通过自有后端代理） */
async function fetchActiveTyphoonList(): Promise<CmaListItem[]> {
  const url = `${API_BASE}/typhoon/list?t=${ts13()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`获取台风列表失败: HTTP ${res.status}`)
  const data = await res.json()
  return (data.typhoonList || []).filter((item: CmaListItem) => item[7] === 'start')
}

/** 获取单个台风详情并转换为我们的格式（通过自有后端代理） */
async function fetchTyphoonDetail(typhoonId: number): Promise<Typhoon | null> {
  const url = `${API_BASE}/typhoon/${typhoonId}?t=${ts13()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`获取台风详情失败: ${typhoonId}`)
  const data = await res.json()
  return transformTyphoon(data)
}

/** 获取所有活跃台风数据 */
export async function fetchAllTyphoons(): Promise<Typhoon[]> {
  const list = await fetchActiveTyphoonList()

  if (list.length === 0) return []

  const results = await Promise.allSettled(
    list.map((item) => fetchTyphoonDetail(item[0]))
  )

  const typhoons = results
    .filter((r): r is PromiseFulfilledResult<Typhoon | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((t): t is Typhoon => t !== null)

  if (typhoons.length === 0) throw new Error('活跃台风详情暂时不可用')
  return typhoons
}

// ===== 数据转换 =====

function transformTyphoon(raw: CmaDetailResponse): Typhoon | null {
  try {
    const t = raw.typhoon
    const typhoonId = String(t[0])
    const code = String(t[3])
    const nameCN = t[2]
    const trackPoints = t[8]

    if (!trackPoints || trackPoints.length === 0) return null

    // ---- 分离实况点和提取预报 ----
    const latestPoint = trackPoints[trackPoints.length - 1]

    // 基本字段（从最新点提取）
    const lng = latestPoint[4]
    const lat = latestPoint[5]
    const pressure = latestPoint[6]
    const windSpeedMs = latestPoint[7]
    const windSpeedKmh = Math.round(windSpeedMs * 3.6)
    const level = mapIntensity(latestPoint[3])
    const direction = mapDirection(latestPoint[8])
    const speed = latestPoint[9]

    // 更新时间
    const timeStr = latestPoint[1]
    const updatedAt = timeStr.length >= 12 ? parseCmaTime(timeStr) : new Date().toISOString()

    // ---- 历史轨迹（所有实况点的坐标） ----
    const track = trackPoints.map((p) => ({ lat: p[5], lng: p[4] }))

    // ---- 影响圈层（用 CMA 实际风圈数据） ----
    const radiiArr = latestPoint[10] || []
    const impactRings: ImpactRings = radiiArr.length > 0
      ? extractWindRadii(radiiArr)
      : estimateWindRadii(windSpeedMs)

    // ---- 预报路径 ----
    const forecast: ForecastPoint[] = []

    // 当前实况点
    forecast.push({
      time: '当前',
      lat,
      lng,
      level,
      maxWind: windSpeedKmh,
      hoursAhead: 0,
    })

    // 从最新实况点的 BABJ 提取预报
    const babj = latestPoint[11]
    if (babj && babj.BABJ) {
      const baseTime = new Date(parseCmaTime(timeStr))

      for (const entry of babj.BABJ) {
        const fcHours = entry[0]
        const fcLng = entry[2]
        const fcLat = entry[3]
        const fcWindMs = entry[5]
        const fcCode = entry[7] || ''
        const fcLevel = mapIntensity(fcCode)
        const fcWindKmh = Math.round(fcWindMs * 3.6)

        if (isNaN(fcLat) || isNaN(fcLng) || fcLat === 0) continue

        const fcTime = new Date(baseTime.getTime() + fcHours * 3600000)

        forecast.push({
          time: formatTimeLabel(fcTime.toISOString()),
          lat: fcLat,
          lng: fcLng,
          level: fcLevel,
          maxWind: fcWindKmh,
          hoursAhead: fcHours,
        })
      }
    }

    return {
      id: typhoonId,
      code,
      nameCN,
      level,
      center: { lat, lng },
      pressure,
      maxWind: windSpeedKmh,
      direction,
      speed,
      impactRings,
      forecast,
      track,
      updatedAt,
    }
  } catch (err) {
    console.error('CMA 台风数据转换失败:', err)
    return null
  }
}

/** 降级方案：根据风速估算风圈半径 */
function estimateWindRadii(windSpeedMs: number): ImpactRings {
  const s = windSpeedMs
  return {
    level7:  s >= 17.2 ? Math.round(100 + s * 6) : 0,
    level10: s >= 24.5 ? Math.round(50 + s * 3.5) : 0,
    level12: s >= 32.7 ? Math.round(25 + s * 1.5) : 0,
  }
}
