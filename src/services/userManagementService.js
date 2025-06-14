import { userApi } from '../utils/api'

export const userManagementService = {
  // 사용자 목록 조회
  async getUsers(page = 0, size = 20) {
    try {
      const response = await userApi.get(`/api/users?page=${page}&size=${size}`)
      return response.success ? response : response
    } catch (error) {
      throw new Error(error.message || '사용자 목록을 가져오는데 실패했습니다.')
    }
  },

  // 사용자 검색 (이메일/닉네임)
  async searchUsers(keyword, page = 0, size = 20) {
    try {
      const response = await userApi.get(`/api/users/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
      return response.success ? response : response
    } catch (error) {
      throw new Error(error.message || '사용자 검색에 실패했습니다.')
    }
  },

  // 사용자 삭제 (관리자용)
  async deleteUser(userId) {
    try {
      const response = await userApi.delete(`/api/users/${userId}`)
      return response.success ? response : response
    } catch (error) {
      throw new Error(error.message || '사용자 삭제에 실패했습니다.')
    }
  },

  // 닉네임 변경 (새로운 JSON body 방식)
  async changeNickname(newNickname) {
    try {
      const response = await userApi.put('/api/users/nickname', {
        newNickname: newNickname
      })
      
      // 성공 시 로컬 스토리지의 사용자 정보 업데이트
      if (response.success && response.data && typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data))
      }
      
      return response.success ? response : response
    } catch (error) {
      throw new Error(error.message || '닉네임 변경에 실패했습니다.')
    }
  },

  // 비밀번호 변경 (JSON body 방식 유지)
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await userApi.put('/api/users/password', {
        currentPassword,
        newPassword
      })
      return response.success ? response : response
    } catch (error) {
      throw new Error(error.message || '비밀번호 변경에 실패했습니다.')
    }
  },

  // 사용자 대시보드 (새로운 API)
  async getUserDashboard() {
    try {
      const response = await userApi.get('/api/users/dashboard')
      return response.success ? response : response
    } catch (error) {
      console.error('사용자 대시보드 조회 실패:', error.message)
      // 백엔드 구현 전까지 기본값 반환
      return {
        success: true,
        data: {
          profile: {
            userId: null,
            email: '',
            nickname: ''
          },
          stats: {
            registeredProducts: 0,
            purchasedProducts: 0,
            likedProducts: 0,
            totalTransactions: 0
          },
          recentActivity: []
        }
      }
    }
  },

  // 내가 등록한 상품 (새로운 API)
  async getMyProducts() {
    try {
      const response = await userApi.get('/api/users/products/mine')
      return response.success ? response : response
    } catch (error) {
      console.error('내 상품 목록 조회 실패:', error.message)
      return {
        success: true,
        data: {
          message: "Product Service와 연동이 필요합니다.",
          products: []
        }
      }
    }
  },

  // 구매한 상품 (새로운 API)
  async getPurchasedProducts() {
    try {
      const response = await userApi.get('/api/users/products/purchased')
      return response.success ? response : response
    } catch (error) {
      console.error('구매한 상품 목록 조회 실패:', error.message)
      return {
        success: true,
        data: {
          message: "Product Service와 연동이 필요합니다.",
          products: []
        }
      }
    }
  },

  // 찜한 상품 (새로운 API)
  async getLikedProducts() {
    try {
      const response = await userApi.get('/api/users/products/liked')
      return response.success ? response : response
    } catch (error) {
      console.error('찜한 상품 목록 조회 실패:', error.message)
      return {
        success: true,
        data: {
          message: "Product Service와 연동이 필요합니다.",
          products: []
        }
      }
    }
  },

  // 사용자 통계 조회
  async getUserStats() {
    try {
      const response = await userApi.get('/api/users/stats')
      return response.success ? response.data : {}
    } catch (error) {
      console.error('사용자 통계 조회 실패:', error.message)
      return {}
    }
  },

  // 활성 사용자 수 조회
  async getActiveUsersCount() {
    try {
      const response = await userApi.get('/api/users/active-count')
      return response.success ? response.data.count : 0
    } catch (error) {
      console.error('활성 사용자 수 조회 실패:', error.message)
      return 0
    }
  }
} 