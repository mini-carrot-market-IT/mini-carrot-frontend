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

      // 카테고리 매핑 (백엔드에서 지원하지 않는 카테고리를 지원하는 카테고리로 변환)
      const categoryMapping = {
        '의류': 'fashion',
        '옷': 'fashion',
        '패션': 'fashion',
        '패션잡화': 'fashion',
        '전자기기': 'electronics',
        '전자제품': 'electronics',
        '가전': 'electronics',
        '아기용품': 'baby',
        '유아용품': 'baby',
        '베이비': 'baby',
        '운동': 'sports',
        '스포츠용품': 'sports',
        '스포츠': 'sports',
        '음식': 'food',
        '식품': 'food',
        '먹거리': 'food',
        '신발': 'shoes',
        '기타': 'other'
      }

      // 영어 카테고리로 매핑 (백엔드에서 한글 처리 문제 방지)
      const mappedCategory = categoryMapping[category] || 'other'
      
      console.log(`📊 상품 조회 추적: 상품 ${productId}, 카테고리 ${category} -> ${mappedCategory}`)
      
      // POST 요청으로 JSON body 전송
      const response = await productApi.post(`/api/analytics/view/${productId}`, {
        category: mappedCategory,
        userId: userId
      })
      
      console.log('✅ 조회 추적 성공:', response)
      return response
    } catch (error) {
      // 분석 실패는 사용자 경험에 영향을 주지 않음
      console.warn('조회 추적 실패:', error.message)
      return null
    }
  },

  // 검색 추적 (수정됨: POST 요청으로 변경)
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

  // 실시간 조회수 가져오기
  async getViewCount(productId) {
    try {
      console.log(`🔍 조회수 API 호출 시작: 상품 ${productId}`);
      const response = await productApi.get(`/api/analytics/product/${productId}/views`)
      console.log(`👁️ 조회수 조회 원본 응답: 상품 ${productId}`, response)
      
      // API 응답 구조: {"productId": 59, "viewCount": 4}
      if (response && typeof response.viewCount === 'number') {
        console.log(`✅ 조회수 파싱 성공: ${response.viewCount}`)
        return response.viewCount
      } else if (response && response.data && typeof response.data.viewCount === 'number') {
        console.log(`✅ 조회수 파싱 성공 (data): ${response.data.viewCount}`)
        return response.data.viewCount
      } else if (response && response.success && response.data && typeof response.data.viewCount === 'number') {
        console.log(`✅ 조회수 파싱 성공 (success.data): ${response.data.viewCount}`)
        return response.data.viewCount
      }
      
      console.warn(`⚠️ 조회수 파싱 실패, 응답 구조:`, response)
      console.warn(`⚠️ 응답 타입: ${typeof response}, viewCount 타입: ${typeof response?.viewCount}`)
      return 0
    } catch (error) {
      console.error(`❌ 조회수 조회 실패 (상품 ${productId}):`, error.message)
      console.error(`❌ 전체 에러 객체:`, error)
      return 0
    }
  },

  // 인기 상품 순위 (새로운 API 사용)
  async getPopularProducts(limit = 10) {
    try {
      const response = await productApi.get(`/api/products/popular?limit=${limit}`)
      // 새로운 응답 구조: {success: true, data: products}
      return response.success ? response.data : []
    } catch (error) {
      console.error('인기 상품 조회 실패:', error.message)
      return []
    }
  },

  // 상품 대시보드 통계 (새로운 API)
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

  // Analytics 대시보드 데이터 (수정됨)
  async getDashboardStats() {
    try {
      const response = await productApi.get('/api/analytics/dashboard')
      // 새로운 백엔드 응답 형식에 따라 수정
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
      console.warn('배치 이벤트 전송 실패:', error.message)
      return null
    }
  }
}

// 실시간 상품 스트림 SSE 클래스 (새로운 기능)
export class ProductStreamSSE {
  constructor() {
    this.eventSource = null
    this.listeners = new Map()
    this.isConnected = false
  }

  // 실시간 상품 스트림 연결
  connect() {
    if (this.eventSource) {
      this.disconnect()
    }

    try {
      this.eventSource = new EventSource('http://211.188.63.186:31251/api/stream/products')
      
      this.eventSource.onopen = () => {
        console.log('🟢 실시간 상품 스트림 연결됨')
        this.isConnected = true
        this.emit('connected')
      }

      this.eventSource.onmessage = (event) => {
        try {
          const products = JSON.parse(event.data)
          console.log('📦 실시간 상품 데이터:', products)
          this.emit('products', products)
        } catch (error) {
          console.error('상품 스트림 데이터 파싱 오류:', error)
        }
      }

      this.eventSource.onerror = (error) => {
        console.error('❌ 상품 스트림 연결 오류:', error)
        this.isConnected = false
        this.emit('error', error)
      }

    } catch (error) {
      console.error('상품 스트림 연결 실패:', error)
    }
  }

  // 연결 해제
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      this.isConnected = false
      console.log('상품 스트림 연결 해제됨')
    }
  }

  // 이벤트 리스너 추가
  addEventListener(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType).push(callback)
  }

  // 이벤트 리스너 제거
  removeEventListener(eventType, callback) {
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // 이벤트 발생
  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`상품 스트림 이벤트 처리 오류 (${eventType}):`, error)
        }
      })
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

// 전역 인스턴스들
export const globalAnalytics = typeof window !== 'undefined' ? new AnalyticsTracker() : null
export const globalProductStream = typeof window !== 'undefined' ? new ProductStreamSSE() : null 