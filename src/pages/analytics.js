import { useState, useEffect } from 'react'
import Link from 'next/link'
import { analyticsService, globalProductStream } from '../services/analyticsService'
import { globalRealTimeUpdates } from '../services/notificationService'
import { authService } from '../services/authService'
import RealTimeDashboard, { useRealTimeUpdates } from '../components/RealTimeUpdates'
import { useUserNotifications, userNotificationService } from '../services/userNotificationService'
import styles from '../styles/Analytics.module.css'

export default function Analytics() {
  const [user, setUser] = useState(null)
  const [dashboardStats, setDashboardStats] = useState({})
  const [productDashboard, setProductDashboard] = useState({})
  const [popularProducts, setPopularProducts] = useState([])
  const [realtimeProducts, setRealtimeProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [productStreamConnected, setProductStreamConnected] = useState(false)
  
  // 실시간 업데이트 Hook 사용
  const { isConnected, stats: realTimeStats } = useRealTimeUpdates()
  
  // User 실시간 알림 Hook 사용
  const { 
    isConnected: userSSEConnected, 
    notifications: userNotifications, 
    sendTestNotification,
    clearNotifications 
  } = useUserNotifications()

  useEffect(() => {
    // 로그인 체크
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      window.location.href = '/login'
      return
    }
    setUser(currentUser)
    console.log('🔍 현재 로그인 사용자:', currentUser)

    // 초기 데이터 로드
    loadDashboardData()

    // 실시간 업데이트 연결
    if (globalRealTimeUpdates) {
      globalRealTimeUpdates.connect()
      
      // 실시간 통계 업데이트 리스너 등록
      globalRealTimeUpdates.addEventListener('STATS_UPDATE', handleStatsUpdate)
    }

    // 실시간 상품 스트림 연결
    if (globalProductStream) {
      globalProductStream.connect()
      
      // 실시간 상품 데이터 리스너 등록
      globalProductStream.addEventListener('connected', () => {
        setProductStreamConnected(true)
      })
      
      globalProductStream.addEventListener('products', (products) => {
        setRealtimeProducts(products)
        console.log('📦 실시간 상품 업데이트:', products.length, '개')
      })
      
      globalProductStream.addEventListener('error', () => {
        setProductStreamConnected(false)
      })
    }

    // 1분마다 데이터 갱신
    const interval = setInterval(loadDashboardData, 60000)

    return () => {
      clearInterval(interval)
      if (globalRealTimeUpdates) {
        globalRealTimeUpdates.removeEventListener('STATS_UPDATE', handleStatsUpdate)
      }
      if (globalProductStream) {
        globalProductStream.disconnect()
      }
    }
  }, [])



  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [analyticsStats, productStats, popular] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getProductDashboard(),
        analyticsService.getPopularProducts(10)
      ])
      
      setDashboardStats(analyticsStats)
      setProductDashboard(productStats)
      setPopularProducts(popular)
    } catch (err) {
      setError('대시보드 데이터를 불러오는데 실패했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }



  const handleStatsUpdate = (data) => {
    // 실시간 통계 업데이트
    setDashboardStats(prev => ({ ...prev, ...data }))
  }



  if (loading && !dashboardStats.totalViews) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>📊 대시보드 로딩 중...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logo}>🥕 미니 당근</Link>
          <nav className={styles.nav}>
            <Link href="/">홈</Link>
            <Link href="/mypage">마이페이지</Link>
            <span className={styles.user}>안녕하세요, {user?.nickname}님!</span>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.titleSection}>
          <h1>📊 실시간 분석 대시보드</h1>
          <p>미니 당근의 실시간 통계를 확인하세요</p>
          <div className={styles.connectionStatusGroup}>
            <div className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
              {isConnected ? '🟢 Analytics SSE 연결됨' : '🔴 Analytics SSE 연결 끊김'}
            </div>
            <div className={`${styles.connectionStatus} ${productStreamConnected ? styles.connected : styles.disconnected}`}>
              {productStreamConnected ? '🟢 Product Stream 연결됨' : '🔴 Product Stream 연결 끊김'}
            </div>
            <div className={`${styles.connectionStatus} ${userSSEConnected ? styles.connected : styles.disconnected}`}>
              {userSSEConnected ? '🟢 User SSE 연결됨' : '🔴 User SSE 연결 끊김'}
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {/* 핵심 통계 카드 섹션 */}
        <section className={styles.statsCards}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👁️</div>
            <div className={styles.statContent}>
              <h3>총 조회수</h3>
              <p className={styles.statNumber}>
                {(realTimeStats.totalViews || dashboardStats.totalViews || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔍</div>
            <div className={styles.statContent}>
              <h3>총 검색 수</h3>
              <p className={styles.statNumber}>
                {(realTimeStats.totalSearches || dashboardStats.totalSearches || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📦</div>
            <div className={styles.statContent}>
              <h3>전체 상품</h3>
              <p className={styles.statNumber}>
                {(productDashboard.totalProducts || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statContent}>
              <h3>판매 완료</h3>
              <p className={styles.statNumber}>
                {(productDashboard.soldProducts || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* 실시간 상품 스트림 섹션 */}
        {productStreamConnected && realtimeProducts.length > 0 && (
          <section className={styles.realtimeProducts}>
            <h2>🔴 실시간 상품 업데이트 ({realtimeProducts.length}개)</h2>
            <div className={styles.productGrid}>
              {realtimeProducts.slice(0, 6).map((product) => (
                <div key={product.productId} className={styles.realtimeProductCard}>
                  <img 
                    src={product.imageUrl ? `http://211.188.63.186:31251${product.imageUrl}` : '/images/default-product.svg'} 
                    alt={product.title}
                    className={styles.realtimeProductImage}
                    onError={(e) => {
                      e.target.src = '/images/default-product.svg'
                    }}
                  />
                  <div className={styles.realtimeProductInfo}>
                    <h4>{product.title}</h4>
                    <p className={styles.realtimePrice}>{product.price?.toLocaleString()}원</p>
                    <p className={styles.realtimeCategory}>{product.category}</p>
                    <span className={`${styles.realtimeStatus} ${product.status === 'SOLD' ? styles.sold : styles.available}`}>
                      {product.status === 'SOLD' ? '판매완료' : '판매중'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 인기 상품 TOP 5 */}
        <section className={styles.popularProducts}>
          <h2>🔥 인기 상품 TOP 5</h2>
          <div className={styles.popularList}>
            {popularProducts.length > 0 ? (
              popularProducts.slice(0, 5).map((product, index) => (
                <div key={product.productId} className={styles.popularItem}>
                  <div className={styles.rank}>#{index + 1}</div>
                  <div className={styles.productInfo}>
                    <img 
                      src={product.imageUrl ? `http://211.188.63.186:31251${product.imageUrl}` : '/images/default-product.svg'} 
                      alt={product.title}
                      className={styles.productImage}
                      onError={(e) => {
                        e.target.src = '/images/default-product.svg'
                      }}
                    />
                    <div className={styles.productDetails}>
                      <h4>{product.title}</h4>
                      <p className={styles.price}>{product.price?.toLocaleString()}원</p>
                      <p className={styles.category}>{product.category}</p>
                    </div>
                  </div>
                  <div className={styles.views}>
                    <span className={`${styles.status} ${product.status === 'SOLD' ? styles.sold : styles.available}`}>
                      {product.status === 'SOLD' ? '판매완료' : '판매중'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                📊 아직 데이터가 없습니다
              </div>
            )}
          </div>
        </section>

        {/* 카테고리별 상품 분포 */}
        {productDashboard.categoryStats && Object.keys(productDashboard.categoryStats).length > 0 && (
          <section className={styles.categoryDistribution}>
            <h2>📊 카테고리별 상품 분포</h2>
            <div className={styles.categoryGrid}>
              {Object.entries(productDashboard.categoryStats)
                .sort(([,a], [,b]) => b - a) // 상품 수 많은 순으로 정렬
                .map(([category, count]) => (
                <div key={category} className={styles.categoryItem}>
                  <span className={styles.categoryName}>{category}</span>
                  <span className={styles.categoryCount}>{count}개</span>
                  <div className={styles.categoryBar}>
                    <div 
                      className={styles.categoryBarFill}
                      style={{ 
                        width: `${(count / Math.max(...Object.values(productDashboard.categoryStats))) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* User SSE 실시간 알림 테스트 섹션 */}
        <section className={styles.userNotifications}>
          <h2>🔔 실시간 사용자 알림</h2>
          <div className={styles.notificationStatus}>
            <div className={`${styles.connectionStatus} ${userSSEConnected ? styles.connected : styles.disconnected}`}>
              {userSSEConnected ? '🟢 User SSE 연결됨' : '🔴 User SSE 연결 끊김'}
            </div>
            <button 
              className={styles.testButton}
              onClick={sendTestNotification}
              disabled={!userSSEConnected}
            >
              🧪 테스트 알림 보내기
            </button>
            <button 
              className={styles.clearButton}
              onClick={clearNotifications}
            >
              🗑️ 알림 지우기
            </button>
          </div>
          
          <div className={styles.notificationList}>
            {userNotifications.length > 0 ? (
              userNotifications.slice(-3).reverse().map((notification) => (
                <div key={notification.id} className={`${styles.notificationItem} ${styles[notification.type]}`}>
                  <div className={styles.notificationHeader}>
                    <span className={styles.notificationTitle}>{notification.title}</span>
                    <span className={styles.notificationTime}>
                      {notification.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={styles.notificationMessage}>
                    {notification.message}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyNotifications}>
                📭 아직 받은 실시간 알림이 없습니다
              </div>
            )}
          </div>
        </section>


      </main>
    </div>
  )
} 