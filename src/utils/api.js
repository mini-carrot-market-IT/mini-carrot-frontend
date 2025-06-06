// API 기본 설정
const USER_SERVICE_URL = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:8080'
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:8082'

// HTTP 요청을 위한 기본 함수
async function request(baseUrl, url, options = {}) {
  const config = {
    headers: {
      ...options.headers,
    },
    ...options,
  }

  // FormData가 아닌 경우에만 Content-Type을 application/json으로 설정
  if (!(config.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
  }

  // 토큰이 있으면 Authorization 헤더에 추가
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${baseUrl}${url}`, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }
    
    return response
  } catch (error) {
    console.error('API 요청 실패:', error)
    
    // 연결 오류인 경우 더 구체적인 메시지 제공
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_FAILED')) {
      const serviceName = baseUrl.includes('8080') ? 'User Service' : 'Product Service'
      throw new Error(`${serviceName} 서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.`)
    }
    
    throw error
  }
}

// User Service API
export const userApi = {
  get: (url, options = {}) => {
    return request(USER_SERVICE_URL, url, {
      method: 'GET',
      ...options,
    })
  },

  post: (url, data, options = {}) => {
    const config = { ...options }
    
    if (data instanceof FormData) {
      // FormData인 경우 body를 그대로 사용하고 Content-Type은 브라우저가 자동 설정
      config.body = data
    } else {
      // JSON 데이터인 경우 문자열로 변환
      config.body = JSON.stringify(data)
    }

    return request(USER_SERVICE_URL, url, {
      method: 'POST',
      ...config,
    })
  },

  put: (url, data, options = {}) => {
    return request(USER_SERVICE_URL, url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    })
  },

  delete: (url, options = {}) => {
    return request(USER_SERVICE_URL, url, {
      method: 'DELETE',
      ...options,
    })
  }
}

// Product Service API
export const productApi = {
  get: (url, options = {}) => {
    return request(PRODUCT_SERVICE_URL, url, {
      method: 'GET',
      ...options,
    })
  },

  post: (url, data, options = {}) => {
    const config = { ...options }
    
    if (data instanceof FormData) {
      // FormData인 경우 body를 그대로 사용하고 Content-Type은 브라우저가 자동 설정
      config.body = data
    } else {
      // JSON 데이터인 경우 문자열로 변환
      config.body = JSON.stringify(data)
    }

    return request(PRODUCT_SERVICE_URL, url, {
      method: 'POST',
      ...config,
    })
  },

  put: (url, data, options = {}) => {
    return request(PRODUCT_SERVICE_URL, url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    })
  },

  delete: (url, options = {}) => {
    return request(PRODUCT_SERVICE_URL, url, {
      method: 'DELETE',
      ...options,
    })
  }
}

// 기존 api 객체는 호환성을 위해 유지 (User Service 사용)
export const api = userApi

// 유틸리티 함수들
export const apiUtils = {
  // Product Service 이미지 URL 생성
  getImageUrl: (imagePath) => {
    if (!imagePath) return '/images/default-product.svg'
    if (imagePath.startsWith('http')) return imagePath
    return `${PRODUCT_SERVICE_URL}${imagePath}`
  },

  // 에러 메시지 추출
  getErrorMessage: (error) => {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    if (error?.response?.data?.message) return error.response.data.message
    if (error?.response?.data?.error) return error.response.data.error
    return '알 수 없는 오류가 발생했습니다.'
  },

  // 날짜 포맷팅
  formatDate: (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '오늘'
    if (diffDays === 2) return '어제'
    if (diffDays <= 7) return `${diffDays}일 전`
    
    return date.toLocaleDateString('ko-KR')
  },

  // 가격 포맷팅
  formatPrice: (price) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }
} 