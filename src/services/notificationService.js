import { productApi } from '../utils/api'

export const notificationService = {
  // 웹 푸시 알림 권한 요청
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('이 브라우저는 웹 알림을 지원하지 않습니다.')
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  },

  // 푸시 알림 표시
  showNotification(title, options = {}) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/badge-icon.png',
        tag: 'mini-carrot',
        ...options
      })

      // 알림 클릭 시 처리
      notification.onclick = (event) => {
        event.preventDefault()
        window.focus()
        if (options.url) {
          window.location.href = options.url
        }
        notification.close()
      }

      // 5초 후 자동 닫기
      setTimeout(() => notification.close(), 5000)
      
      return notification
    }
    return null
  },

  // 상품 관련 알림
  showProductNotification(type, product) {
    const notifications = {
      'new_product': {
        title: '🆕 새로운 상품이 등록되었어요!',
        body: `${product.title} - ${this.formatPrice(product.price)}원`,
        icon: product.imageUrl || '/images/default-product.svg',
        url: `/products/${product.id}`
      },
      'price_change': {
        title: '💰 가격이 변경되었습니다',
        body: `${product.title} - ${this.formatPrice(product.price)}원`,
        icon: product.imageUrl || '/images/default-product.svg',
        url: `/products/${product.id}`
      },
      'sold_out': {
        title: '🔥 상품이 판매되었습니다!',
        body: `축하합니다! "${product.title}"이 판매되었어요.`,
        icon: product.imageUrl || '/images/default-product.svg',
        url: `/mypage`
      }
    }

    const notification = notifications[type]
    if (notification) {
      this.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        url: notification.url
      })
    }
  },

  // 사용자 관련 알림
  showUserNotification(type, data = {}) {
    const notifications = {
      'welcome': {
        title: '🎉 미니 당근에 오신 것을 환영합니다!',
        body: '첫 상품을 등록해보세요.',
        url: '/products/create'
      },
      'profile_updated': {
        title: '✅ 프로필이 업데이트되었습니다',
        body: '프로필 변경사항이 저장되었어요.',
        url: '/mypage'
      },
      'password_changed': {
        title: '🔒 비밀번호가 변경되었습니다',
        body: '계정 보안이 업데이트되었어요.',
        url: '/mypage'
      }
    }

    const notification = notifications[type]
    if (notification) {
      this.showNotification(notification.title, {
        body: notification.body,
        url: notification.url,
        ...data
      })
    }
  },

  // 가격 포맷팅 유틸리티
  formatPrice(price) {
    return new Intl.NumberFormat('ko-KR').format(price)
  }
}

// Server-Sent Events (SSE) 클래스
export class RealTimeUpdates {
  constructor() {
    this.eventSource = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 5000
  }

  // SSE 연결 시작
  connect() {
    if (this.eventSource) {
      this.eventSource.close()
    }

    try {
      this.eventSource = new EventSource('/api/analytics/stream')
      
      this.eventSource.onopen = () => {
        console.log('실시간 업데이트 연결됨')
        this.reconnectAttempts = 0
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('SSE 메시지 파싱 오류:', error)
        }
      }

      this.eventSource.onerror = (error) => {
        console.error('SSE 연결 오류:', error)
        this.handleReconnect()
      }

    } catch (error) {
      console.error('SSE 연결 실패:', error)
      this.handleReconnect()
    }
  }

  // 메시지 처리
  handleMessage(data) {
    const { type, ...payload } = data
    
    // 등록된 리스너들에게 이벤트 전달
    const listeners = this.listeners.get(type) || []
    listeners.forEach(listener => {
      try {
        listener(payload)
      } catch (error) {
        console.error(`SSE 리스너 오류 (${type}):`, error)
      }
    })

    // 기본 처리
    switch (type) {
      case 'VIEW_COUNT_UPDATE':
        this.updateViewCount(payload.productId, payload.newCount)
        break
      case 'NEW_PRODUCT':
        notificationService.showProductNotification('new_product', payload.product)
        break
      case 'PRICE_CHANGE':
        notificationService.showProductNotification('price_change', payload.product)
        break
      case 'PRODUCT_SOLD':
        notificationService.showProductNotification('sold_out', payload.product)
        break
    }
  }

  // 재연결 처리
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`SSE 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
      
      setTimeout(() => {
        this.connect()
      }, this.reconnectDelay)
    } else {
      console.error('SSE 재연결 포기')
    }
  }

  // 이벤트 리스너 등록
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type).push(listener)
  }

  // 이벤트 리스너 제거
  removeEventListener(type, listener) {
    const listeners = this.listeners.get(type) || []
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  // 실시간 조회수 업데이트
  updateViewCount(productId, newCount) {
    const elements = document.querySelectorAll(`[data-product-id="${productId}"] .view-count`)
    elements.forEach(element => {
      element.textContent = `👁️ ${newCount.toLocaleString()}`
      
      // 애니메이션 효과
      element.classList.add('view-count-updated')
      setTimeout(() => element.classList.remove('view-count-updated'), 1000)
    })
  }

  // 연결 종료
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.listeners.clear()
  }
}

// 전역 실시간 업데이트 인스턴스
export const globalRealTimeUpdates = typeof window !== 'undefined' ? new RealTimeUpdates() : null 