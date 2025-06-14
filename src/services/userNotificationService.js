import { useState, useEffect, useRef } from 'react'
import { userApi } from '../utils/api'
import { authService } from './authService'

// User Service SSE 실시간 알림 클래스
export class UserNotificationSSE {
  constructor() {
    this.eventSource = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.isConnected = false
  }

  // SSE 연결 시작
  connect() {
    const currentUser = authService.getCurrentUser()
    if (!currentUser?.userId && !currentUser?.id) {
      console.warn('로그인된 사용자가 없어서 SSE 연결을 시작할 수 없습니다.')
      return
    }

    if (this.eventSource) {
      this.disconnect()
    }

    try {
      // User Service SSE 엔드포인트로 연결 (userId 또는 id 필드 사용)
      const userId = currentUser.userId || currentUser.id
      const sseUrl = `http://211.188.63.186:31207/api/notifications/stream/${userId}`
      console.log('🔗 User SSE 연결 시도:', sseUrl)
      this.eventSource = new EventSource(sseUrl)
      
      // 연결 성공 이벤트
      this.eventSource.addEventListener('connected', (event) => {
        try {
          const data = this.safeParseJSON(event.data)
          console.log('🟢 User SSE 연결됨:', data)
          this.isConnected = true
          this.reconnectAttempts = 0
          this.emit('connected', data)
        } catch (error) {
          console.warn('User SSE connected 이벤트 파싱 오류:', error, 'Raw data:', event.data)
        }
      })

      // 회원가입 완료 알림
      this.eventSource.addEventListener('user_registration', (event) => {
        try {
          const data = this.safeParseJSON(event.data)
          console.log('🎉 회원가입 완료 알림:', data)
          this.emit('user_registration', data)
          this.showWelcomeNotification(data)
        } catch (error) {
          console.warn('User SSE user_registration 이벤트 파싱 오류:', error, 'Raw data:', event.data)
        }
      })

      // 프로필 업데이트 알림
      this.eventSource.addEventListener('profile_update', (event) => {
        try {
          const data = this.safeParseJSON(event.data)
          console.log('✅ 프로필 업데이트 알림:', data)
          this.emit('profile_update', data)
          this.showProfileUpdateNotification(data)
        } catch (error) {
          console.warn('User SSE profile_update 이벤트 파싱 오류:', error, 'Raw data:', event.data)
        }
      })

      // 테스트 알림
      this.eventSource.addEventListener('test', (event) => {
        try {
          const data = this.safeParseJSON(event.data)
          console.log('🧪 테스트 알림:', data)
          this.emit('test', data)
          this.showTestNotification(data)
        } catch (error) {
          console.warn('User SSE test 이벤트 파싱 오류:', error, 'Raw data:', event.data)
        }
      })

      // 에러 처리
      this.eventSource.onerror = (error) => {
        console.error('❌ User SSE 연결 오류:', error)
        this.isConnected = false
        this.emit('error', error)
        this.handleReconnect()
      }

      // 연결 열림
      this.eventSource.onopen = () => {
        console.log('🔗 User SSE 연결 열림')
        this.isConnected = true
        this.emit('open')
      }

    } catch (error) {
      console.error('User SSE 연결 실패:', error)
      this.handleReconnect()
    }
  }

  // 재연결 처리
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 User SSE 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
      
      setTimeout(() => {
        this.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('❌ User SSE 재연결 포기')
      this.emit('giveup')
    }
  }

  // 안전한 JSON 파싱
  safeParseJSON(data) {
    try {
      // 이미 객체인 경우 그대로 반환
      if (typeof data === 'object') {
        return data
      }
      
      // 문자열인 경우 JSON 파싱 시도
      if (typeof data === 'string') {
        // 단순 텍스트 메시지인 경우 객체로 래핑
        if (!data.startsWith('{') && !data.startsWith('[')) {
          return { message: data }
        }
        return JSON.parse(data)
      }
      
      // 기타 경우 기본 객체 반환
      return { message: String(data) }
    } catch (error) {
      console.warn('JSON 파싱 실패, 원본 데이터 반환:', data)
      return { message: String(data) }
    }
  }

  // 연결 해제
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      this.isConnected = false
      console.log('User SSE 연결 해제됨')
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
          console.error(`User SSE 이벤트 처리 오류 (${eventType}):`, error)
        }
      })
    }
  }

  // 환영 알림 표시
  showWelcomeNotification(data) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🥕 미니 당근에 오신 것을 환영합니다!', {
        body: `${data.nickname}님, 첫 상품을 등록해보세요!`,
        icon: '/favicon.ico',
        tag: 'welcome',
        requireInteraction: true
      })

      notification.onclick = () => {
        window.focus()
        window.location.href = '/products/create'
        notification.close()
      }

      setTimeout(() => notification.close(), 8000)
    }
  }

  // 프로필 업데이트 알림 표시
  showProfileUpdateNotification(data) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('✅ 프로필이 업데이트되었습니다', {
        body: '프로필 변경사항이 성공적으로 저장되었어요.',
        icon: '/favicon.ico',
        tag: 'profile-update'
      })

      notification.onclick = () => {
        window.focus()
        window.location.href = '/mypage'
        notification.close()
      }

      setTimeout(() => notification.close(), 5000)
    }
  }

  // 테스트 알림 표시
  showTestNotification(data) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🧪 테스트 알림', {
        body: data.message || '실시간 알림이 정상적으로 작동하고 있습니다!',
        icon: '/favicon.ico',
        tag: 'test'
      })

      setTimeout(() => notification.close(), 3000)
    }
  }

  // 연결 상태 반환
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    }
  }
}

// User Notification Service
export const userNotificationService = {
  // 연결 상태 확인
  async checkConnectionStatus() {
    try {
      const response = await userApi.get('/api/notifications/status')
      return response.status === 'active'
    } catch (error) {
      console.error('연결 상태 확인 실패:', error)
      return false
    }
  },

  // 테스트 알림 전송
  async sendTestNotification(userId) {
    try {
      const response = await userApi.post(`/api/notifications/test/${userId}`)
      return response.success
    } catch (error) {
      console.error('테스트 알림 전송 실패:', error)
      return false
    }
  },

  // 브라우저 알림 권한 요청
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('이 브라우저는 알림을 지원하지 않습니다.')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }
}

// React Hook for User Notifications
export function useUserNotifications() {
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const sseRef = useRef(null)

  useEffect(() => {
    console.log('🔗 User SSE Hook 초기화 시작')
    
    // SSE 인스턴스 생성
    sseRef.current = new UserNotificationSSE()
    
    // 이벤트 리스너 등록
    sseRef.current.addEventListener('connected', () => {
      console.log('✅ User SSE Hook: 연결됨')
      setIsConnected(true)
    })

    sseRef.current.addEventListener('user_registration', (data) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'welcome',
        title: '환영합니다!',
        message: `${data.nickname}님, 미니 당근에 오신 것을 환영합니다!`,
        timestamp: new Date()
      }])
    })

    sseRef.current.addEventListener('profile_update', (data) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'update',
        title: '프로필 업데이트',
        message: '프로필이 성공적으로 업데이트되었습니다.',
        timestamp: new Date()
      }])
    })

    sseRef.current.addEventListener('test', (data) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'test',
        title: '테스트 알림',
        message: data.message || '테스트 알림입니다.',
        timestamp: new Date()
      }])
    })

    sseRef.current.addEventListener('error', () => {
      console.log('❌ User SSE Hook: 연결 오류')
      setIsConnected(false)
    })

    sseRef.current.addEventListener('giveup', () => {
      console.log('❌ User SSE Hook: 재연결 포기')
      setIsConnected(false)
    })

    // 연결 시작
    console.log('🚀 User SSE Hook: 연결 시작')
    sseRef.current.connect()

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      if (sseRef.current) {
        sseRef.current.disconnect()
      }
    }
  }, [])

  const sendTestNotification = async () => {
    const currentUser = authService.getCurrentUser()
    if (currentUser?.id) {
      return await userNotificationService.sendTestNotification(currentUser.id)
    }
    return false
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  return {
    isConnected,
    notifications,
    sendTestNotification,
    clearNotifications,
    userSSE: sseRef.current
  }
}

// 전역 User SSE 인스턴스
export const globalUserSSE = typeof window !== 'undefined' ? new UserNotificationSSE() : null 