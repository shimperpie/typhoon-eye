import type { Typhoon } from '../types/typhoon'

// 模拟台风数据 - 模拟真实台风场景
// 实际使用时替换为气象局API数据
export const mockTyphoons: Typhoon[] = [
  {
    id: 'typhoon-2024-03',
    nameCN: '海燕',
    code: '2403',
    level: '强台风',
    center: { lat: 25.8, lng: 124.5 }, // 台湾东北海域
    pressure: 945,
    maxWind: 162,
    direction: 315, // 西北方向
    speed: 22,
    impactRings: {
      level12: 80,  // 12级风圈 80km
      level10: 150, // 10级风圈 150km
      level7: 320,  // 7级风圈 320km
    },
    forecast: [
      { lat: 25.8, lng: 124.5, time: '当前', level: '强台风', maxWind: 175, hoursAhead: 0 },
      { lat: 26.8, lng: 123.3, time: '7月7日 20:00', level: '强台风', maxWind: 175, hoursAhead: 12 },
      { lat: 28.2, lng: 122.0, time: '7月8日 08:00', level: '台风', maxWind: 140, hoursAhead: 24 },
      { lat: 29.5, lng: 121.0, time: '7月8日 20:00', level: '强热带风暴', maxWind: 100, hoursAhead: 36 },
      { lat: 31.0, lng: 120.5, time: '7月9日 08:00', level: '热带风暴', maxWind: 70, hoursAhead: 48 },
      { lat: 33.0, lng: 120.0, time: '7月9日 20:00', level: '热带低压', maxWind: 50, hoursAhead: 60 },
    ],
    track: [
      { lat: 22.0, lng: 128.2 },
      { lat: 23.2, lng: 127.0 },
      { lat: 24.5, lng: 125.8 },
      { lat: 25.8, lng: 124.5 },  // 当前位置
    ],
    updatedAt: '2024-07-07T14:00:00Z',
  },
  {
    id: 'typhoon-2024-04',
    nameCN: '悟空',
    code: '2404',
    level: '台风',
    center: { lat: 16.2, lng: 132.8 }, // 菲律宾以东
    pressure: 970,
    maxWind: 130,
    direction: 290, // 西北偏西
    speed: 18,
    impactRings: {
      level12: 50,
      level10: 100,
      level7: 220,
    },
    forecast: [
      { lat: 16.2, lng: 132.8, time: '当前', level: '台风', maxWind: 130, hoursAhead: 0 },
      { lat: 17.0, lng: 131.2, time: '7月7日 20:00', level: '台风', maxWind: 140, hoursAhead: 12 },
      { lat: 18.5, lng: 129.0, time: '7月8日 08:00', level: '强台风', maxWind: 155, hoursAhead: 24 },
      { lat: 20.0, lng: 127.0, time: '7月8日 20:00', level: '强台风', maxWind: 160, hoursAhead: 36 },
      { lat: 22.0, lng: 125.0, time: '7月9日 08:00', level: '台风', maxWind: 140, hoursAhead: 48 },
      { lat: 24.0, lng: 123.0, time: '7月9日 20:00', level: '台风', maxWind: 130, hoursAhead: 60 },
    ],
    track: [
      { lat: 12.5, lng: 137.0 },
      { lat: 13.8, lng: 135.6 },
      { lat: 15.0, lng: 134.2 },
      { lat: 16.2, lng: 132.8 },  // 当前位置
    ],
    updatedAt: '2024-07-07T14:00:00Z',
  },
]

// 上海坐标
export const SHANGHAI = { lat: 31.2304, lng: 121.4737 }
