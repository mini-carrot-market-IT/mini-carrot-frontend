import { productApi } from '../utils/api'

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

  // 상품 상세 조회
  async getProduct(id) {
    try {
      const response = await productApi.get(`/api/products/${id}`)
      
      // Product Service 응답 구조: {success: true, data: product}
      return response.success ? response : response
    } catch (error) {
      throw new Error(error.message || '상품 정보를 가져오는데 실패했습니다.')
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
  }
} 