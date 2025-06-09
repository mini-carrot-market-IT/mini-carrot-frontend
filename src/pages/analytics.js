import { useState, useEffect } from 'react'
import Link from 'next/link'
import { analyticsService } from '../services/analyticsService'
import { globalRealTimeUpdates } from '../services/notificationService'
import { authService } from '../services/authService'
import styles from '../styles/Analytics.module.css'

export default function Analytics() {
  const [user, setUser] = useState(null)
  const [dashboardStats, setDashboardStats] = useState({})
  const [popularProducts, setPopularProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categoryStats, setCategoryStats] = useState({})

  useEffect(() => {
    // 로그인 체크
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      window.location.href = '/login'
      return
    }
    setUser(currentUser)

    // 초기 데이터 로드
    loadDashboardData()

    // 실시간 업데이트 연결
    if (globalRealTimeUpdates) {
      globalRealTimeUpdates.connect()
      
      // 실시간 통계 업데이트 리스너 등록
      globalRealTimeUpdates.addEventListener('STATS_UPDATE', handleStatsUpdate)
    }

    // 1분마다 데이터 갱신
    const interval = setInterval(loadDashboardData, 60000)

    return () => {
      clearInterval(interval)
      if (globalRealTimeUpdates) {
        globalRealTimeUpdates.removeEventListener('STATS_UPDATE', handleStatsUpdate)
      }
    }
  }, [])

  useEffect(() => {
    if (selectedCategory !== 'all') {
      loadCategoryStats(selectedCategory)
    }
  }, [selectedCategory])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [stats, popular] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getPopularProducts(10)
      ])
      
      setDashboardStats(stats)
      setPopularProducts(popular)
    } catch (err) {
      setError('대시보드 데이터를 불러오는데 실패했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCategoryStats = async (category) => {
    try {
      const stats = await analyticsService.getCategoryStats(category)
      setCategoryStats(stats)
    } catch (err) {
      console.error('카테고리 통계 조회 실패:', err)
    }
  }

  const handleStatsUpdate = (data) => {
    // 실시간 통계 업데이트
    setDashboardStats(prev => ({ ...prev, ...data }))
  }

  const categories = [
    { value: 'all', label: '전체' },
    { value: 'electronics', label: '전자제품' },
    { value: 'fashion', label: '패션' },
    { value: 'home', label: '생활용품' },
    { value: 'books', label: '도서' },
    { value: 'sports', label: '스포츠' }
  ]

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
        </div>

        {error && (
          <div className={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {/* 통계 카드 섹션 */}
        <section className={styles.statsCards}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👁️</div>
            <div className={styles.statContent}>
              <h3>총 조회수</h3>
              <p className={styles.statNumber}>
                {dashboardStats.totalViews?.toLocaleString() || '0'}
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <h3>활성 사용자</h3>
              <p className={styles.statNumber}>
                {dashboardStats.activeUsers?.toLocaleString() || '0'}
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📦</div>
            <div className={styles.statContent}>
              <h3>등록된 상품</h3>
              <p className={styles.statNumber}>
                {dashboardStats.totalProducts?.toLocaleString() || '0'}
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statContent}>
              <h3>완료된 거래</h3>
              <p className={styles.statNumber}>
                {dashboardStats.totalSales?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </section>

        {/* 인기 상품 섹션 */}
        <section className={styles.popularProducts}>
          <h2>🔥 실시간 인기 상품 TOP 10</h2>
          <div className={styles.popularList}>
            {popularProducts.length > 0 ? (
              popularProducts.map((product, index) => (
                <div key={product.id} className={styles.popularItem}>
                  <div className={styles.rank}>#{index + 1}</div>
                  <div className={styles.productInfo}>
                    <img 
                      src={product.imageUrl || '/images/default-product.svg'} 
                      alt={product.title}
                      className={styles.productImage}
                    />
                    <div className={styles.productDetails}>
                      <h4>{product.title}</h4>
                      <p className={styles.price}>{product.price?.toLocaleString()}원</p>
                      <p className={styles.category}>{product.category}</p>
                    </div>
                  </div>
                  <div className={styles.views}>
                    👁️ {product.viewCount?.toLocaleString() || 0}
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

        {/* 카테고리별 분석 섹션 */}
        <section className={styles.categoryAnalysis}>
          <h2>📋 카테고리별 분석</h2>
          <div className={styles.categorySelector}>
            {categories.map(category => (
              <button
                key={category.value}
                className={`${styles.categoryButton} ${
                  selectedCategory === category.value ? styles.active : ''
                }`}
                onClick={() => setSelectedCategory(category.value)}
              >
                {category.label}
              </button>
            ))}
          </div>

          {selectedCategory !== 'all' && categoryStats && (
            <div className={styles.categoryStats}>
              <div className={styles.categoryStatItem}>
                <h4>총 상품 수</h4>
                <p>{categoryStats.totalProducts?.toLocaleString() || 0}</p>
              </div>
              <div className={styles.categoryStatItem}>
                <h4>총 조회수</h4>
                <p>{categoryStats.totalViews?.toLocaleString() || 0}</p>
              </div>
              <div className={styles.categoryStatItem}>
                <h4>평균 가격</h4>
                <p>{categoryStats.avgPrice?.toLocaleString() || 0}원</p>
              </div>
              <div className={styles.categoryStatItem}>
                <h4>판매 완료</h4>
                <p>{categoryStats.soldItems?.toLocaleString() || 0}</p>
              </div>
            </div>
          )}
        </section>

        {/* 실시간 활동 피드 */}
        <section className={styles.activityFeed}>
          <h2>⚡ 실시간 활동</h2>
          <div className={styles.activityList}>
            <div className={styles.activityItem}>
              <span className={styles.activityTime}>방금 전</span>
              <span className={styles.activityText}>새로운 상품이 등록되었습니다</span>
            </div>
            <div className={styles.activityItem}>
              <span className={styles.activityTime}>1분 전</span>
              <span className={styles.activityText}>거래가 완료되었습니다</span>
            </div>
            <div className={styles.activityItem}>
              <span className={styles.activityTime}>3분 전</span>
              <span className={styles.activityText}>새로운 사용자가 가입했습니다</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
} 