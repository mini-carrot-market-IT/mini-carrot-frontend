import { userApi } from '../utils/api'

export const authService = {
  // 회원가입
  async register(userData) {
    try {
      const response = await userApi.post('/api/users/register', {
        email: userData.email,
        password: userData.password,
        nickname: userData.nickname
      })
      
      // User Service 응답 구조: {success: true, data: {token, user}}
      if (response.success && response.data) {
        if (response.data.token && typeof window !== 'undefined') {
          localStorage.setItem('token', response.data.token)
        }
        if (response.data.user && typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(response.data.user))
        }
      }
      
      return response
    } catch (error) {
      throw new Error(error.message || '회원가입에 실패했습니다.')
    }
  },

  // 로그인
  async login(credentials) {
    try {
      const response = await userApi.post('/api/users/login', {
        email: credentials.email,
        password: credentials.password
      })
      
      // User Service 응답 구조: {success: true, data: {token, user}}
      if (response.success && response.data) {
        if (response.data.token && typeof window !== 'undefined') {
          localStorage.setItem('token', response.data.token)
        }
        if (response.data.user && typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(response.data.user))
        }
      }
      
      return response
    } catch (error) {
      throw new Error(error.message || '로그인에 실패했습니다.')
    }
  },

  // 프로필 조회
  async getProfile() {
    try {
      const response = await userApi.get('/api/users/profile')
      
      // User Service 응답 구조: {success: true, data: user}
      if (response.success && response.data && typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data))
      }
      
      return response
    } catch (error) {
      throw new Error(error.message || '프로필 조회에 실패했습니다.')
    }
  },

  // 로그아웃
  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },

  // 현재 사용자 정보 가져오기
  getCurrentUser() {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  // 토큰 가져오기
  getToken() {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  },

  // 로그인 상태 확인
  isAuthenticated() {
    return !!this.getToken()
  }
} 