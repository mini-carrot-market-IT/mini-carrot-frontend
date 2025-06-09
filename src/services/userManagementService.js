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

  // 닉네임 변경
  async changeNickname(newNickname) {
    try {
      const response = await userApi.put(`/api/users/nickname?newNickname=${encodeURIComponent(newNickname)}`)
      
      // 성공 시 로컬 스토리지의 사용자 정보 업데이트
      if (response.success && response.data && typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data))
      }
      
      return response.success ? response : response
    } catch (error) {
      throw new Error(error.message || '닉네임 변경에 실패했습니다.')
    }
  },

  // 비밀번호 변경
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