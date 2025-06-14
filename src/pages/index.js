import { useState, useEffect } from 'react'
import { productService } from '../services/productService'
import { analyticsService, globalProductStream } from '../services/analyticsService'
import { globalRealTimeUpdates, notificationService } from '../services/notificationService'
import ProductCard from '../components/ProductCard'
import Layout from '../components/Layout'
import styles from '../styles/Home.module.css'

export default function Home() {
  const [products, setProducts] = useState([])
  const [popularProducts, setPopularProducts] = useState([])
  const [realtimeProducts, setRealtimeProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isSearching, setIsSearching] = useState(false)
  const [productStreamConnected, setProductStreamConnected] = useState(false)

  useEffect(() => {
    loadProducts()
    loadPopularProducts()
    
    // 실시간 상품 스트림 연결
    if (globalProductStream) {
      globalProductStream.connect()
      
      globalProductStream.addEventListener('connected', () => {
        setProductStreamConnected(true)
        console.log('🟢 메인 페이지: 상품 스트림 연결됨')
      })
      
      globalProductStream.addEventListener('products', (products) => {
        setRealtimeProducts(products)
        console.log('📦 메인 페이지: 실시간 상품 업데이트', products.length, '개')
      })
      
      globalProductStream.addEventListener('error', () => {
        setProductStreamConnected(false)
      })
    }
    
    return () => {
      if (globalProductStream) {
        globalProductStream.disconnect()
      }
    }
  }, [])

  const loadProducts = async (category = '') => {
    try {
      setLoading(true)
      setError('') // 이전 에러 초기화
      const response = await productService.getProducts(category)
      
      // Product Service 응답 구조: {success: true, data: products}
      const productList = response.success && response.data ? response.data : []
      setProducts(productList)
    } catch (error) {
      console.error('상품 목록 로딩 실패:', error)
      
      // Product Service 연결 오류인 경우 더 구체적인 메시지
      if (error.message.includes('Product Service')) {
        setError('상품 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
      } else {
        setError(`상품 목록을 불러올 수 없습니다: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadPopularProducts = async () => {
    try {
      const popular = await analyticsService.getPopularProducts(6)
      setPopularProducts(popular)
    } catch (error) {
      console.error('인기 상품 로딩 실패:', error)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchKeyword.trim()) {
      loadProducts(selectedCategory === 'all' ? '' : selectedCategory)
      return
    }

    try {
      setIsSearching(true)
      setError('')
      
      const results = await productService.searchProducts(searchKeyword, selectedCategory)
      setProducts(results || [])
    } catch (error) {
      console.error('검색 실패:', error)
      setError(`검색에 실패했습니다: ${error.message}`)
    } finally {
      setIsSearching(false)
    }
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setSearchKeyword('') // 검색어 초기화
    loadProducts(category === 'all' ? '' : category)
  }

  const categories = [
    { value: 'all', label: '전체' },
    { value: '전자제품', label: '전자제품' },
    { value: '패션잡화', label: '패션잡화' },
    { value: '유아용품', label: '유아용품' },
    { value: '스포츠용품', label: '스포츠용품' },
    { value: '식품', label: '식품' },
    { value: '신발', label: '신발' }
  ]

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1>🥕 Mini 당근마켓</h1>
          <p>우리 동네 중고 마켓</p>
        </div>

        {/* 검색 및 필터 섹션 */}
        <div className={styles.searchSection}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              placeholder="상품을 검색해보세요..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className={styles.searchInput}
            />
            <button 
              type="submit" 
              className={styles.searchButton}
              disabled={isSearching}
            >
              {isSearching ? '검색 중...' : '🔍 검색'}
            </button>
          </form>

          <div className={styles.categoryFilter}>
            {categories.map(category => (
              <button
                key={category.value}
                className={`${styles.categoryButton} ${
                  selectedCategory === category.value ? styles.active : ''
                }`}
                onClick={() => handleCategoryChange(category.value)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* 인기 상품 섹션 */}
        {popularProducts.length > 0 && (
          <section className={styles.popularSection}>
            <h2>🔥 인기 상품</h2>
            <div className={styles.popularGrid}>
              {popularProducts.map(product => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 실시간 상품 스트림 섹션 */}
        {productStreamConnected && realtimeProducts.length > 0 && (
          <section className={styles.realtimeSection}>
            <h2>🔴 실시간 업데이트 상품</h2>
            <p className={styles.realtimeDescription}>
              지금 이 순간 업데이트된 최신 상품들을 확인하세요!
            </p>
            <div className={styles.realtimeGrid}>
              {realtimeProducts.slice(0, 8).map(product => (
                <ProductCard key={`realtime-${product.productId}`} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {/* 상품 목록 섹션 */}
        <section className={styles.productsSection}>
          <div className={styles.sectionHeader}>
            <h2>
              {searchKeyword ? `"${searchKeyword}" 검색 결과` : 
               selectedCategory === 'all' ? '전체 상품' : `${selectedCategory} 상품`}
            </h2>
            <span className={styles.productCount}>
              {products.length}개의 상품
            </span>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>상품을 불러오는 중...</p>
            </div>
          ) : products.length > 0 ? (
            <div className={styles.productGrid}>
              {products.map(product => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📦</div>
              <h3>상품이 없습니다</h3>
              <p>
                {searchKeyword 
                  ? '검색 조건에 맞는 상품이 없습니다. 다른 키워드로 검색해보세요.'
                  : '아직 등록된 상품이 없습니다. 첫 번째 상품을 등록해보세요!'
                }
              </p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
} 