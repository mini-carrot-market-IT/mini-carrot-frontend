import { userApi } from '../utils/api'
import { notificationService } from './notificationService'

export const authService = {
  // 회원가입 (수정됨: 500 에러 처리 추가)
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
        
        // 회원가입 환영 알림 및 실시간 알림 연결
        setTimeout(async () => {
          notificationService.showUserNotification('welcome')
          
          // User Service SSE 연결 시작 (실시간 알림용)
          try {
            const { globalUserSSE } = await import('./userNotificationService')
            if (globalUserSSE) {
              globalUserSSE.connect()
            }
          } catch (error) {
            console.warn('User SSE 연결 실패:', error)
          }
        }, 1500)
      }
      
      return response
    } catch (error) {
      // ⚠️ 중요: User Service에서 500 에러가 발생해도 실제로는 회원가입이 성공할 수 있음
      if (error.message.includes('500') || error.status === 500) {
        console.warn('회원가입 응답에서 500 에러 발생했지만 실제로는 성공했을 수 있습니다.')
        
        // 성공으로 처리하되 사용자에게 안내
        return {
          success: true,
          needsVerification: true,
          message: '회원가입이 처리되었습니다. 로그인을 시도해보세요.',
          data: null
        }
      }
      
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
        
        // 로그인 후 User SSE 연결 시작
        setTimeout(async () => {
          try {
            const { globalUserSSE } = await import('./userNotificationService')
            if (globalUserSSE) {
              globalUserSSE.connect()
            }
          } catch (error) {
            console.warn('User SSE 연결 실패:', error)
          }
        }, 1000)
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
    
    // User SSE 연결 해제
    try {
      import('./userNotificationService').then(({ globalUserSSE }) => {
        if (globalUserSSE) {
          globalUserSSE.disconnect()
        }
      })
    } catch (error) {
      console.warn('User SSE 해제 실패:', error)
    }
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
  },

  // User Service 연결 상태 확인 (새로운 기능)
  async checkUserServiceStatus() {
    try {
      const response = await userApi.get('/api/notifications/status')
      return response
    } catch (error) {
      console.warn('User Service 상태 확인 실패:', error)
      return { connectedUsers: 0, status: 'disconnected' }
    }
  },

  // 테스트 알림 전송 (새로운 기능)
  async sendTestNotification(userId) {
    try {
      const response = await userApi.post(`/api/notifications/test/${userId}`)
      return response
    } catch (error) {
      console.warn('테스트 알림 전송 실패:', error)
      return { success: false, message: error.message }
    }
  }
} 