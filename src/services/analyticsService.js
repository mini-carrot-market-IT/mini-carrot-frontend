import { productApi } from '../utils/api'
import { authService } from './authService'

export const analyticsService = {
  // 검색 추적
  async trackSearch(keyword, category = 'all', resultCount = 0, userId = null) {
    try {
      if (!userId) {
        const currentUser = authService.getCurrentUser()
        userId = currentUser?.id || 'anonymous'
      }

      // 카테고리 매핑 적용
      const categoryMapping = {
        '의류': '패션잡화',
        '옷': '패션잡화',
        '패션': '패션잡화',
        '전자기기': '전자제품',
        '가전': '전자제품',
        '아기용품': '유아용품',
        '베이비': '유아용품',
        '운동': '스포츠용품',
        '스포츠': '스포츠용품',
        '음식': '식품',
        '먹거리': '식품'
      }

      const mappedCategory = category === 'all' ? 'all' : (categoryMapping[category] || category)

      console.log(`🔍 검색 추적: 키워드 "${keyword}", 카테고리 ${mappedCategory}, 결과 ${resultCount}개`)

      const response = await productApi.post('/api/analytics/search', {
        keyword,
        category: mappedCategory,
        resultCount,
        userId
      })
      return response
    } catch (error) {
      console.warn('검색 추적 실패:', error.message)
      return null
    }
  },

  // 인기 상품 순위
  async getPopularProducts(limit = 10) {
    try {
      const response = await productApi.get(`/api/products/popular?limit=${limit}`)
      return response.success ? response.data : []
    } catch (error) {
      console.error('인기 상품 조회 실패:', error.message)
      return []
    }
  },

  // 상품 대시보드 통계
  async getProductDashboard() {
    try {
      const response = await productApi.get('/api/products/dashboard')
      return response.success ? response.data : {
        totalProducts: 0,
        soldProducts: 0,
        availableProducts: 0,
        totalPurchases: 0,
        categoryStats: {},
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('상품 대시보드 조회 실패:', error.message)
      return {
        totalProducts: 0,
        soldProducts: 0,
        availableProducts: 0,
        totalPurchases: 0,
        categoryStats: {},
        timestamp: Date.now()
      }
    }
  },

  // Analytics 대시보드 데이터
  async getDashboardStats() {
    try {
      const response = await productApi.get('/api/analytics/dashboard')
      return {
        totalProducts: response.totalProducts || 0,
        totalViews: response.totalViews || 0,
        totalSearches: response.totalSearches || 0,
        categoryStats: response.categoryStats || {},
        topKeywords: response.topKeywords || [],
        message: response.message || '',
        timestamp: response.timestamp || Date.now()
      }
    } catch (error) {
      console.error('대시보드 통계 조회 실패:', error.message)
      return {
        totalProducts: 0,
        totalViews: 0,
        totalSearches: 0,
        categoryStats: {},
        topKeywords: [],
        message: '',
        timestamp: Date.now()
      }
    }
  },

  // 배치 이벤트 전송
  async sendBatchEvents(events) {
    try {
      const response = await productApi.post('/api/analytics/batch', { events })
      return response
    } catch (error) {
      console.error('배치 이벤트 전송 실패:', error.message)
      return null
    }
  }
}

// 실시간 상품 스트림 (SSE)
export class ProductStreamSSE {
  constructor() {
    this.eventSource = null
    this.listeners = {}
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
  }

  connect() {
    try {
      const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://211.188.63.186:31251'
      this.eventSource = new EventSource(`${PRODUCT_SERVICE_URL}/api/products/stream`)
      
      this.eventSource.onopen = () => {
        console.log('🟢 실시간 상품 스트림 연결됨')
        this.reconnectAttempts = 0
        this.emit('connected', { status: 'connected' })
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📦 상품 업데이트:', data)
          this.emit('product-update', data)
        } catch (error) {
          console.warn('상품 스트림 데이터 파싱 실패:', error)
        }
      }

      this.eventSource.onerror = (error) => {
        console.error('❌ 상품 스트림 오류:', error)
        this.emit('error', error)
        
        if (this.eventSource.readyState === EventSource.CLOSED) {
          this.handleReconnect()
        }
      }

      // 특정 이벤트 타입 리스너
      this.eventSource.addEventListener('product-created', (event) => {
        const data = JSON.parse(event.data)
        this.emit('product-created', data)
      })

      this.eventSource.addEventListener('product-updated', (event) => {
        const data = JSON.parse(event.data)
        this.emit('product-updated', data)
      })

    } catch (error) {
      console.error('상품 스트림 연결 실패:', error)
      this.handleReconnect()
    }
  }

  disconnect() {
    console.log('상품 스트림 연결 해제됨')
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.listeners = {}
    this.reconnectAttempts = 0
  }

  addEventListener(eventType, callback) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = []
    }
    this.listeners[eventType].push(callback)
  }

  removeEventListener(eventType, callback) {
    if (this.listeners[eventType]) {
      this.listeners[eventType] = this.listeners[eventType].filter(cb => cb !== callback)
    }
  }

  emit(eventType, data) {
    if (this.listeners[eventType]) {
      this.listeners[eventType].forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`이벤트 리스너 실행 실패 (${eventType}):`, error)
        }
      })
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 상품 스트림 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
      
      setTimeout(() => {
        this.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('❌ 상품 스트림 재연결 포기')
      this.emit('reconnect-failed', { attempts: this.reconnectAttempts })
    }
  }
}

// Analytics 추적기 (배치 처리용)
export class AnalyticsTracker {
  constructor() {
    this.events = []
    this.batchSize = 10
    this.flushInterval = 30000 // 30초
    this.timer = null
    this.startBatchTimer()
  }

  track(eventType, data) {
    this.events.push({
      type: eventType,
      data,
      timestamp: Date.now()
    })

    if (this.events.length >= this.batchSize) {
      this.flush()
    }
  }

  async flush() {
    if (this.events.length === 0) return

    const eventsToSend = [...this.events]
    this.events = []

    try {
      await analyticsService.sendBatchEvents(eventsToSend)
      console.log(`📊 Analytics 이벤트 ${eventsToSend.length}개 전송 완료`)
    } catch (error) {
      console.error('Analytics 이벤트 전송 실패:', error)
      // 실패한 이벤트를 다시 큐에 추가 (최대 재시도 방지)
      if (eventsToSend.length < 100) {
        this.events.unshift(...eventsToSend)
      }
    }
  }

  startBatchTimer() {
    this.timer = setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  destroy() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.flush() // 마지막 이벤트들 전송
  }
} 