/**
 * 影响评估引擎
 *
 * 根据台风距离 + 风力等级，输出小白用户能理解的影响描述和行动建议。
 * 核心逻辑：距离 × 强度 → 4 档评估等级
 */

import type { TyphoonLevel } from '../types/typhoon'

export type ImpactLevel = 'safe' | 'watch' | 'warning' | 'danger'

export interface ImpactAssessment {
  level: ImpactLevel
  label: string           // 简短标签，如"安全"、"危险！"
  description: string     // 影响描述（1句话）
  suggestions: Suggestion[]
}

export interface Suggestion {
  icon: string      // emoji
  text: string      // 简短建议
}

// ===== 强度分级 =====
function intensityScore(level: TyphoonLevel): number {
  switch (level) {
    case '超强台风': return 5
    case '强台风': return 4
    case '台风': return 3
    case '强热带风暴': return 2
    case '热带风暴': return 1
    case '热带低压': return 0
  }
}

// ===== 评估主函数 =====
export function assessImpact(
  distanceKm: number,
  level: TyphoonLevel
): ImpactAssessment {
  const str = intensityScore(level)

  // --- 安全 ---
  if (distanceKm > 1000) {
    return safeAssessment()
  }
  if (distanceKm > 500 && str <= 1) {
    return safeAssessment()
  }

  // --- 关注 ---
  if (distanceKm > 500 && str >= 2) {
    return watchAssessment(str)
  }
  if (distanceKm > 200 && str <= 1) {
    return watchAssessment(str)
  }

  // --- 注意 ---
  if (distanceKm > 200 && str >= 2 && str <= 3) {
    return warningAssessment()
  }
  if (distanceKm <= 200 && str <= 1) {
    return warningAssessment()
  }

  // --- 危险 ---
  if (distanceKm <= 200 && str >= 2) {
    return dangerAssessment(str)
  }
  if (distanceKm <= 500 && str >= 4) {
    return dangerAssessment(str)
  }

  // fallback
  return watchAssessment(str)
}

// ===== 各等级模板 =====

function safeAssessment(): ImpactAssessment {
  return {
    level: 'safe',
    label: '安全',
    description: '台风距离你很远，暂无明显影响',
    suggestions: [
      { icon: '📱', text: '继续关注台风动态' },
      { icon: '✅', text: '无需特殊准备' },
    ],
  }
}

function watchAssessment(_str: number): ImpactAssessment {
  return {
    level: 'watch',
    label: '关注',
    description: '台风正在靠近，请注意留意后续动态',
    suggestions: [
      { icon: '👀', text: '密切关注台风动向' },
      { icon: '📋', text: '提前查看家中应急物资' },
      { icon: '🏖️', text: '避免前往海边和低洼地区' },
    ],
  }
}

function warningAssessment(): ImpactAssessment {
  return {
    level: 'warning',
    label: '注意！',
    description: '台风可能带来强风暴雨，请提前做好准备',
    suggestions: [
      { icon: '🪟', text: '关好门窗，收好阳台物品' },
      { icon: '🚶', text: '减少不必要的外出' },
      { icon: '🍞', text: '储备1-2天的食物和饮用水' },
      { icon: '📻', text: '关注官方台风预警信息' },
    ],
  }
}

function dangerAssessment(str: number): ImpactAssessment {
  const desc = str >= 4
    ? '强台风即将直接袭击！可能带来12级以上大风和特大暴雨'
    : '台风可能带来强风暴雨，请立即采取防护措施'

  return {
    level: 'danger',
    label: '危险！',
    description: desc,
    suggestions: [
      { icon: '🏠', text: '待在室内，远离窗户' },
      { icon: '🪟', text: '确保所有门窗已锁好' },
      { icon: '🔦', text: '备好手电筒、充电宝、急救包' },
      { icon: '🍞', text: '储备2-3天的食物和饮用水' },
      { icon: '📻', text: '持续关注官方紧急预警' },
      { icon: '🏃', text: '必要时前往政府指定的避难场所' },
    ],
  }
}

// ===== 级别对应的 UI 颜色配置 =====
export const impactColorConfig: Record<ImpactLevel, {
  bg: string
  border: string
  text: string
  ring: string
  glow: string
}> = {
  safe: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    ring: '#10B981',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
  },
  watch: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    text: 'text-yellow-400',
    ring: '#EAB308',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    ring: '#F59E0B',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.25)]',
  },
  danger: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-400',
    ring: '#EF4444',
    glow: 'shadow-[0_0_40px_rgba(239,68,68,0.3)]',
  },
}

// ===== 预测可信度 =====

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'veryLow'

export interface ConfidenceInfo {
  level: ConfidenceLevel
  label: string           // "高" / "中" / "较低" / "低"
  errorKm: number         // 该时效的平均路径误差 (km)
  description: string     // 一句话说明
}

/**
 * 根据预报时效返回预测可信度
 *
 * 数据来源：中国气象局历年台风路径预报误差统计
 * - 12h 平均误差 ~50km
 * - 24h 平均误差 ~75km
 * - 48h 平均误差 ~150km
 * - 72h 平均误差 ~250km
 * - 96h 平均误差 ~350km
 * - 120h 平均误差 ~450km
 */
export function getForecastConfidence(hoursAhead: number): ConfidenceInfo {
  if (hoursAhead <= 0) {
    return {
      level: 'high',
      label: '实况',
      errorKm: 0,
      description: '当前实测位置',
    }
  }
  if (hoursAhead <= 24) {
    return {
      level: 'high',
      label: '可信度高',
      errorKm: hoursAhead <= 12 ? 50 : 75,
      description: `实际位置大概率在 ±${hoursAhead <= 12 ? 50 : 75}km 范围内`,
    }
  }
  if (hoursAhead <= 48) {
    return {
      level: 'medium',
      label: '可信度中等',
      errorKm: 150,
      description: '实际位置可能在 ±150km 范围内',
    }
  }
  if (hoursAhead <= 72) {
    return {
      level: 'low',
      label: '可信度较低',
      errorKm: 250,
      description: '3天后偏差可能较大，实际位置可能在 ±250km 范围',
    }
  }
  if (hoursAhead <= 96) {
    return {
      level: 'veryLow',
      label: '可信度低',
      errorKm: 350,
      description: '4天后仅供参考，误差可达 ±350km',
    }
  }
  return {
    level: 'veryLow',
    label: '仅供参考',
    errorKm: 450,
    description: '5天后仅为趋势判断，误差可达 ±450km',
  }
}

export const confidenceColorConfig: Record<ConfidenceLevel, {
  bg: string
  text: string
  ring: string
}> = {
  high:     { bg: 'bg-emerald-500/15', text: 'text-emerald-400', ring: '#10B981' },
  medium:   { bg: 'bg-yellow-500/15', text: 'text-yellow-400',  ring: '#EAB308' },
  low:      { bg: 'bg-orange-500/15', text: 'text-orange-400',  ring: '#F97316' },
  veryLow:  { bg: 'bg-red-500/15',    text: 'text-red-400',     ring: '#EF4444' },
}
