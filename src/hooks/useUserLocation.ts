import { useState, useEffect } from 'react'
import type { Coordinate } from '../types/typhoon'
import { SHANGHAI } from '../data/mockData'

interface UserLocationState {
  location: Coordinate
  loading: boolean
  error: string | null
  isDefault: boolean // 是否使用默认位置
}

export function useUserLocation(): UserLocationState {
  const [state, setState] = useState<UserLocationState>({
    location: SHANGHAI,
    loading: true,
    error: null,
    isDefault: true,
  })

  useEffect(() => {
    const useDefault = (error: string) => {
      setState({ location: SHANGHAI, loading: false, error, isDefault: true })
    }

    if (!navigator.geolocation) {
      useDefault('你的浏览器不支持定位，已使用默认位置（上海）')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          location: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
          loading: false,
          error: null,
          isDefault: false,
        })
      },
      () => useDefault('浏览器定位不可用，已使用默认位置（上海）'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    )
  }, [])

  return state
}
