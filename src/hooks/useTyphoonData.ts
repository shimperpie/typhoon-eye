import { useState, useEffect, useCallback } from 'react'
import type { Typhoon } from '../types/typhoon'
import { fetchAllTyphoons } from '../services/typhoonApi'
import { mockTyphoons } from '../data/mockData'

interface TyphoonDataState {
  typhoons: Typhoon[]
  loading: boolean
  error: string | null
  usingMock: boolean
  refresh: () => void
}

/**
 * 台风实时数据 Hook
 *
 * - 首次加载从 CMA 获取数据
 * - 每 10 分钟自动刷新
 * - CMA 不可用时自动回退到 Mock 数据
 */
export function useTyphoonData(): TyphoonDataState {
  const [typhoons, setTyphoons] = useState<Typhoon[]>(mockTyphoons)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMock, setUsingMock] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchAllTyphoons()
      if (data.length > 0) {
        setTyphoons(data)
        setUsingMock(false)
        setError(null)
      } else {
        // 没有活跃台风，保留上次数据或 Mock
        console.info('当前没有活跃台风')
        setUsingMock(false)
        setTyphoons([])
        setError(null)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '数据获取失败'
      console.warn('CMA 数据获取失败，使用 Mock 数据:', msg)
      setError(msg)
      setUsingMock(true)
      setTyphoons(mockTyphoons)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // 每 10 分钟轮询一次
    const interval = setInterval(fetchData, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  return { typhoons, loading, error, usingMock, refresh: fetchData }
}
