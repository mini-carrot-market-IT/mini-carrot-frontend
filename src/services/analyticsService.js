import { productApi } from '../utils/api'
import { authService } from './authService'

export const analyticsService = {
  // 상품 조회 추적
  async trackProductView(productId, category = '', userId = null) {
    try {
      // 사용자 ID가 없으면 현재 로그인된 사용자 정보 사용
      if (!userId) {
        const currentUser = authService.getCurrentUser()
        userId = currentUser?.id || 'anonymous'
      }

      const url = `/api/analytics/view/${productId}?category=${encodeURIComponent(category)}&userId=${userId}`
      const response = await productApi.post(url)
      return response
    } catch (error) {
      // 분석 실패는 사용자 경험에 영향을 주지 않음
      console.warn('조회 추적 실패:', error.message)
      return null
    }
  },

  // 검색 추적
  async trackSearch(keyword, category = 'all', resultCount = 0, userId = null) {
    try {
      if (!userId) {
        const currentUser = authService.getCurrentUser()
        userId = currentUser?.id || 'anonymous'
      }

      const response = await productApi.post('/api/analytics/search', {
        keyword,
        category,
        resultCount,
        userId
      })
      return response
    } catch (error) {
      console.warn('검색 추적 실패:', error.message)
      return null
    }
  },

  // 실시간 조회수 가져오기
  async getViewCount(productId) {
    try {
      const response = await productApi.get(`/api/analytics/product/${productId}/views`)
      return response.success ? response.data.viewCount : 0
    } catch (error) {
      console.warn('조회수 조회 실패:', error.message)
      return 0
    }
  },

  // 인기 상품 순위
  async getPopularProducts(limit = 10) {
    try {
      const response = await productApi.get(`/api/analytics/popular-products?limit=${limit}`)
      return response.success ? response.data : []
    } catch (error) {
      console.error('인기 상품 조회 실패:', error.message)
      return []
    }
  },

  // 카테고리별 통계
  async getCategoryStats(category) {
    try {
      const response = await productApi.get(`/api/analytics/category/${category}/stats`)
      return response.success ? response.data : {}
    } catch (error) {
      console.error('카테고리 통계 조회 실패:', error.message)
      return {}
    }
  },

  // 실시간 대시보드 데이터
  async getDashboardStats() {
    try {
      const response = await productApi.get('/api/analytics/dashboard')
      return response.success ? response.data : {}
    } catch (error) {
      console.error('대시보드 통계 조회 실패:', error.message)
      return {}
    }
  },

  // 배치 이벤트 전송
  async sendBatchEvents(events) {
    try {
      const response = await productApi.post('/api/analytics/batch', { events })
      return response
    } catch (error) {
      console.warn('배치 이벤트 전송 실패:', error.message)
      return null
    }
  }
}

// 분석 이벤트 배치 처리 클래스
export class AnalyticsTracker {
  constructor() {
    this.eventQueue = []
    this.batchSize = 10
    this.flushInterval = 5000 // 5초
    
    // 주기적으로 배치 전송
    if (typeof window !== 'undefined') {
      this.intervalId = setInterval(() => this.flush(), this.flushInterval)
      
      // 페이지 종료 시 남은 이벤트 전송
      window.addEventListener('beforeunload', () => this.flush())
    }
  }

  track(eventType, data) {
    this.eventQueue.push({
      eventType,
      data,
      timestamp: Date.now()
    })

    // 큐가 가득 차면 즉시 전송
    if (this.eventQueue.length >= this.batchSize) {
      this.flush()
    }
  }

  async flush() {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    try {
      await analyticsService.sendBatchEvents(events)
    } catch (error) {
      console.warn('배치 이벤트 전송 실패:', error.message)
      // 실패한 이벤트를 다시 큐에 추가 (선택사항)
      // this.eventQueue.unshift(...events)
    }
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
    this.flush()
  }
}

// 전역 분석 추적기 인스턴스
export const globalAnalytics = typeof window !== 'undefined' ? new AnalyticsTracker() : null 