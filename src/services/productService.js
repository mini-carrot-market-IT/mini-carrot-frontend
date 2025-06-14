import { productApi } from '../utils/api'
import { analyticsService } from './analyticsService'

export const productService = {
  // 상품 목록 조회
  async getProducts(category = '') {
    try {
      const url = category ? `/api/products?category=${encodeURIComponent(category)}` : '/api/products'
      const response = await productApi.get(url)
      
      // Product Service 응답 구조: {success: true, data: products}
      return response.success ? response : response
    } catch (error) {
      throw new Error(error.message || '상품 목록을 가져오는데 실패했습니다.')
    }
  },

  // 상품 상세 조회 (성능 향상된 버전)
  async getProduct(id) {
    try {
      // 빠른 조회 API 사용 (백엔드 v1.5.4 성능 개선)
      const response = await productApi.get(`/api/products/${id}/fast`)
      
      // 조회 이벤트 추적 (비동기, 에러 무시)
      if (response.success && response.data) {
        analyticsService.trackProductView(id, response.data.category)
      }
      
      // Product Service 응답 구조: {success: true, data: product}
      return response.success ? response : response
    } catch (error) {
      // 빠른 API 실패 시 기존 API로 폴백
      console.warn('빠른 상품 조회 실패, 기존 API로 재시도:', error.message)
      try {
        const fallbackResponse = await productApi.get(`/api/products/${id}`)
        return fallbackResponse.success ? fallbackResponse : fallbackResponse
      } catch (fallbackError) {
        throw new Error(fallbackError.message || '상품 정보를 가져오는데 실패했습니다.')
      }
    }
  },

  // 상품 검색 (수정됨: 한글 URL 인코딩 처리)
  async searchProducts(query, category = 'all') {
    try {
      let url = `/api/products/search`
      const queryParams = []
      
      if (query && query.trim()) {
        // 한글 검색어를 URL 인코딩하여 처리
        queryParams.push(`query=${encodeURIComponent(query.trim())}`)
      }
      if (category && category !== 'all') {
        queryParams.push(`category=${encodeURIComponent(category)}`)
      }
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`
      }
      
      console.log('🔍 검색 URL:', url) // 디버깅용 로그
      
      const response = await productApi.get(url)
      
      // 검색 이벤트 추적 (비동기, 에러 무시)
      try {
        if (response.success && response.data) {
          await analyticsService.trackSearch(query, category, response.data.length)
        }
      } catch (analyticsError) {
        console.warn('Analytics tracking failed:', analyticsError)
      }
      
      return response.success ? response.data : response.data
    } catch (error) {
      console.error('검색 오류:', error)
      throw new Error(error.message || '상품 검색에 실패했습니다.')
    }
  },

  // 파일 업로드
  async uploadFile(file) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await productApi.post('/api/files/upload', formData)
      
      // Product Service 응답 구조: {success: true, data: {imageUrl}}
      return response.success ? response : response
    } catch (error) {
      throw new Error(error.message || '파일 업로드에 실패했습니다.')
    }
  },

  // 상품 등록
  async createProduct(productData) {
    try {
      const response = await productApi.post('/api/products', {
        title: productData.title,
        description: productData.description,
        price: productData.price,
        category: productData.category,
        imageUrl: productData.imageUrl
      })
      
      // Product Service 응답 구조: {success: true, data: {productId, status}}
      return response.success ? response : response
    } catch (error) {
      throw new Error(error.message || '상품 등록에 실패했습니다.')
    }
  },

  // 상품 구매
  async buyProduct(id) {
    try {
      const response = await productApi.post(`/api/products/${id}/buy`)
      
      // Product Service 응답 구조: {success: true, data: purchase}
      return response.success ? response : response
    } catch (error) {
      throw new Error(error.message || '상품 구매에 실패했습니다.')
    }
  },

  // 내가 등록한 상품 목록
  async getMyProducts() {
    try {
      const response = await productApi.get('/api/products/mine')
      
      // Product Service 응답 구조: {success: true, data: products}
      return response.success ? response : response
    } catch (error) {
      throw new Error(error.message || '내 상품 목록을 가져오는데 실패했습니다.')
    }
  },

  // 내가 구매한 상품 목록
  async getPurchasedProducts() {
    try {
      const response = await productApi.get('/api/products/purchased')
      
      // Product Service 응답 구조: {success: true, data: products}
      return response.success ? response : response
    } catch (error) {
      throw new Error(error.message || '구매한 상품 목록을 가져오는데 실패했습니다.')
        }
  },

  // 상품 수정용 조회 (자신의 상품만)
  async getProductForEdit(id) {
    try {
      const response = await productApi.get(`/api/products/${id}/edit`)
      
      // Product Service 응답 구조: {success: true, data: product}
      return response.success ? response : response
    } catch (error) {
      throw new Error(error.message || '상품 수정 정보를 가져오는데 실패했습니다.')
    }
  },

  // 상품 수정
  async updateProduct(id, productData) {
    try {
      const response = await productApi.put(`/api/products/${id}`, {
        title: productData.title,
        description: productData.description,
        price: productData.price,
        category: productData.category,
        imageUrl: productData.imageUrl
      })
      
      // Product Service 응답 구조: {success: true, message, data}
      return response.success ? response : response
    } catch (error) {
      throw new Error(error.message || '상품 수정에 실패했습니다.')
    }
  },

  // 상품 삭제
  async deleteProduct(id) {
    try {
      const response = await productApi.delete(`/api/products/${id}`)
      
      // Product Service 응답 구조: {success: true, message, data}
      return response.success ? response : response
    } catch (error) {
      throw new Error(error.message || '상품 삭제에 실패했습니다.')
    }
  },

  // 사용자별 상품 통계 조회 (백엔드 v1.5.4 신규 API)
  async getUserProductStats(userId) {
    try {
      console.log('🔍 사용자 상품 통계 조회 시도:', userId)
      
      // 타임아웃과 함께 요청
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5초 타임아웃
      
      const response = await productApi.get(`/api/products/stats/${userId}`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      // Product Service 응답 구조: {success: true, data: {registeredCount, purchasedCount, ...}}
      if (response.success && response.data) {
        console.log('✅ 사용자 통계 조회 성공:', response.data)
        return response
      } else {
        throw new Error('통계 데이터가 없습니다')
      }
    } catch (error) {
      console.warn('⚠️ 사용자 상품 통계 조회 실패:', error.message)
      
      // 네트워크 오류나 새 API 미구현 시 기존 방식으로 폴백
      try {
        console.log('🔄 기존 방식으로 통계 계산 시도...')
        const [myProducts, purchasedProducts] = await Promise.allSettled([
          this.getMyProducts(),
          this.getPurchasedProducts()
        ])
        
        const myCount = myProducts.status === 'fulfilled' && myProducts.value.success 
          ? (myProducts.value.data?.length || 0) : 0
        const purchasedCount = purchasedProducts.status === 'fulfilled' && purchasedProducts.value.success 
          ? (purchasedProducts.value.data?.length || 0) : 0
        
        console.log('✅ 폴백 통계 계산 완료:', { myCount, purchasedCount })
        
        return {
          success: true,
          data: {
            registeredCount: myCount,
            purchasedCount: purchasedCount,
            soldCount: 0, // 판매 완료는 별도 API 필요
            totalSalesAmount: 0,
            totalPurchaseAmount: 0
          }
        }
      } catch (fallbackError) {
        console.error('❌ 폴백 통계 계산도 실패:', fallbackError.message)
        
        // 최종 기본값 반환
        return {
          success: true,
          data: {
            registeredCount: 0,
            purchasedCount: 0,
            soldCount: 0,
            totalSalesAmount: 0,
            totalPurchaseAmount: 0
          }
        }
      }
    }
  }
} 