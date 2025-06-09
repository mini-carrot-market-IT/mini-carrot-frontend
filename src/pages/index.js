import { useState, useEffect } from 'react'
import { productService } from '../services/productService'
import { analyticsService } from '../services/analyticsService'
import { globalRealTimeUpdates, notificationService } from '../services/notificationService'
import ProductCard from '../components/ProductCard'
import Layout from '../components/Layout'
import styles from '../styles/Home.module.css'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    loadProducts()
    
    // 웹 푸시 알림 권한 요청
    notificationService.requestNotificationPermission()
    
    // 실시간 업데이트 연결
    if (globalRealTimeUpdates) {
      globalRealTimeUpdates.connect()
    }
    
    return () => {
      if (globalRealTimeUpdates) {
        globalRealTimeUpdates.disconnect()
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

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchKeyword.trim()) {
      loadProducts(selectedCategory === 'all' ? '' : selectedCategory)
      return
    }

    try {
      setIsSearching(true)
      setError('')
      const response = await productService.searchProducts(searchKeyword, selectedCategory)
      
      const productList = response.success && response.data ? response.data : []
      setProducts(productList)
    } catch (error) {
      console.error('상품 검색 실패:', error)
      setError(`상품 검색에 실패했습니다: ${error.message}`)
    } finally {
      setIsSearching(false)
    }
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setSearchKeyword('')
    loadProducts(category === 'all' ? '' : category)
  }

  if (loading) return <Layout><div className={styles.loading}>로딩 중...</div></Layout>
  
  if (error) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>⚠️ 오류 발생</h2>
            <p>{error}</p>
            <button onClick={loadProducts} className={styles.retryButton}>
              다시 시도
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const categories = [
    { value: 'all', label: '전체' },
    { value: 'electronics', label: '전자제품' },
    { value: 'fashion', label: '패션' },
    { value: 'home', label: '생활용품' },
    { value: 'books', label: '도서' },
    { value: 'sports', label: '스포츠' }
  ]

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>🥕 Mini 당근마켓</h1>
        
        {/* 검색 및 카테고리 섹션 */}
        <div className={styles.searchSection}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="상품을 검색하세요..."
              className={styles.searchInput}
            />
            <select 
              value={selectedCategory} 
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={styles.categorySelect}
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <button type="submit" className={styles.searchButton} disabled={isSearching}>
              {isSearching ? '검색중...' : '🔍 검색'}
            </button>
          </form>
        </div>

        <div className={styles.productsGrid}>
          {products.length === 0 ? (
            <div className={styles.empty}>
              {searchKeyword ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.'}
            </div>
          ) : (
            products.map(product => (
              <ProductCard key={product.productId} product={product} />
            ))
          )}
        </div>
      </div>
    </Layout>
  )
} 