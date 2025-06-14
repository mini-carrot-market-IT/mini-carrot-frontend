import { useState, useEffect, useRef } from 'react'

export class RealTimeUpdates {
  constructor() {
    this.eventSource = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.isConnected = false
  }

  connect() {
    if (this.eventSource) {
      this.disconnect()
    }

    try {
      this.eventSource = new EventSource('http://211.188.63.186:31251/api/analytics/stream')
      
      this.eventSource.addEventListener('connection', (event) => {
        console.log('SSE 연결됨:', JSON.parse(event.data))
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit('connection', JSON.parse(event.data))
      })

      this.eventSource.addEventListener('stats', (event) => {
        const stats = JSON.parse(event.data)
        this.emit('stats', stats)
      })

      this.eventSource.addEventListener('view', (event) => {
        const viewData = JSON.parse(event.data)
        this.emit('view', viewData)
      })

      this.eventSource.addEventListener('search', (event) => {
        const searchData = JSON.parse(event.data)
        this.emit('search', searchData)
      })

      this.eventSource.onerror = (error) => {
        console.error('SSE 연결 오류:', error)
        this.isConnected = false
        this.emit('error', error)
        this.handleReconnect()
      }

      this.eventSource.onopen = () => {
        console.log('SSE 연결 열림')
        this.isConnected = true
        this.emit('open')
      }

    } catch (error) {
      console.error('SSE 연결 실패:', error)
      this.handleReconnect()
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`SSE 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
      
      setTimeout(() => {
        this.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('SSE 재연결 포기')
      this.emit('giveup')
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      this.isConnected = false
    }
  }

  addEventListener(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType).push(callback)
  }

  removeEventListener(eventType, callback) {
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`SSE 이벤트 처리 오류 (${eventType}):`, error)
        }
      })
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    }
  }
}

// React Hook for Real-time Updates
export function useRealTimeUpdates() {
  const [isConnected, setIsConnected] = useState(false)
  const [stats, setStats] = useState({})
  const [viewCount, setViewCount] = useState(0)
  const realTimeRef = useRef(null)

  useEffect(() => {
    // RealTimeUpdates 인스턴스 생성
    realTimeRef.current = new RealTimeUpdates()
    
    // 이벤트 리스너 등록
    realTimeRef.current.addEventListener('connection', () => {
      setIsConnected(true)
    })

    realTimeRef.current.addEventListener('stats', (newStats) => {
      setStats(newStats)
    })

    realTimeRef.current.addEventListener('view', (viewData) => {
      setViewCount(prev => prev + 1)
    })

    realTimeRef.current.addEventListener('error', () => {
      setIsConnected(false)
    })

    realTimeRef.current.addEventListener('giveup', () => {
      setIsConnected(false)
    })

    // 연결 시작
    realTimeRef.current.connect()

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      if (realTimeRef.current) {
        realTimeRef.current.disconnect()
      }
    }
  }, [])

  return {
    isConnected,
    stats,
    viewCount,
    realTimeUpdates: realTimeRef.current
  }
}

// React Component for Real-time Dashboard
export default function RealTimeDashboard() {
  const { isConnected, stats } = useRealTimeUpdates()

  return (
    <div className="real-time-dashboard">
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 실시간 연결됨' : '🔴 연결 끊김'}
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>총 상품 수</h3>
          <p className="stat-number">{stats.totalProducts || 0}</p>
        </div>
        <div className="stat-card">
          <h3>총 조회수</h3>
          <p className="stat-number">{stats.totalViews || 0}</p>
        </div>
        <div className="stat-card">
          <h3>총 검색 수</h3>
          <p className="stat-number">{stats.totalSearches || 0}</p>
        </div>
      </div>

      {stats.topKeywords && stats.topKeywords.length > 0 && (
        <div className="top-keywords">
          <h3>인기 검색어</h3>
          <div className="keywords-list">
            {stats.topKeywords.slice(0, 5).map((keyword, index) => (
              <span key={index} className="keyword-tag">
                #{keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 