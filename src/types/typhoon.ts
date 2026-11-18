// 台风等级枚举
export type TyphoonLevel =
  | '热带低压'
  | '热带风暴'
  | '强热带风暴'
  | '台风'
  | '强台风'
  | '超强台风'

// 地理坐标
export interface Coordinate {
  lat: number
  lng: number
}

// 预测路径点
export interface ForecastPoint extends Coordinate {
  /** 预计到达时间 */
  time: string
  /** 该点的风力等级 */
  level: TyphoonLevel
  /** 最大风速 (km/h) */
  maxWind: number
  /** 预报时效（小时，从当前起算；0=实况） */
  hoursAhead: number
}

// 台风影响范围
export interface ImpactRings {
  /** 12级风圈半径 (km) */
  level12: number
  /** 10级风圈半径 (km) */
  level10: number
  /** 7级风圈半径 (km) */
  level7: number
}

// 台风完整数据
export interface Typhoon {
  /** 台风编号 */
  id: string
  /** 中文名称 */
  nameCN: string
  /** 国际编号 */
  code: string
  /** 当前等级 */
  level: TyphoonLevel
  /** 当前中心位置 */
  center: Coordinate
  /** 中心气压 (hPa) */
  pressure: number
  /** 最大风速 (km/h) */
  maxWind: number
  /** 移动方向 (度) */
  direction: number
  /** 移动速度 (km/h) */
  speed: number
  /** 影响圈层 */
  impactRings: ImpactRings
  /** 预测路径 */
  forecast: ForecastPoint[]
  /** 历史轨迹，按时间排序（旧→新），最后一个点就是当前位置 */
  track: Coordinate[]
  /** 数据更新时间 */
  updatedAt: string
}

// 距离分级
export type DistanceLevel = 'critical' | 'warning' | 'watch' | 'safe'

export interface DistanceInfo {
  /** 距离 (km) */
  distance: number
  /** 分级 */
  level: DistanceLevel
  /** 标签 */
  label: string
  /** 预计影响时间 */
  estimatedHours: number | null
}
