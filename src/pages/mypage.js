import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { productService } from '../services/productService'
import { authService } from '../services/authService'
import Layout from '../components/Layout'
import ProductCard from '../components/ProductCard'
import MyProductCard from '../components/MyProductCard'
import styles from '../styles/MyPage.module.css'

export default function MyPage() {
  const router = useRouter()
  const [myProducts, setMyProducts] = useState([])
  const [purchasedProducts, setPurchasedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('my') // 'my' or 'purchased'

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      setLoading(true)
      const [myProductsResponse, purchasedProductsResponse] = await Promise.all([
        productService.getMyProducts(),
        productService.getPurchasedProducts()
      ])
      
      // Product Service 응답 구조: {success: true, data: products}
      const myProductsList = myProductsResponse.success && myProductsResponse.data ? myProductsResponse.data : []
      const purchasedProductsList = purchasedProductsResponse.success && purchasedProductsResponse.data ? purchasedProductsResponse.data : []
      
      setMyProducts(myProductsList)
      setPurchasedProducts(purchasedProductsList)
    } catch (error) {
      console.error('데이터 로딩 실패:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // 상품 업데이트 시 데이터 다시 로드
  const handleProductUpdate = () => {
    loadData()
  }

  if (loading) {
    return (
      <Layout>
        <div className={styles.loading}>로딩 중...</div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className={styles.error}>오류: {error}</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>마이페이지</h1>
        
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'my' ? styles.active : ''}`}
            onClick={() => setActiveTab('my')}
          >
            내가 등록한 상품 ({myProducts.length})
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'purchased' ? styles.active : ''}`}
            onClick={() => setActiveTab('purchased')}
          >
            구매한 상품 ({purchasedProducts.length})
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'my' && (
            <div className={styles.section}>
              {myProducts.length === 0 ? (
                <div className={styles.empty}>
                  <p>등록한 상품이 없습니다.</p>
                  <button 
                    onClick={() => router.push('/products/create')}
                    className={styles.createButton}
                  >
                    상품 등록하기
                  </button>
                </div>
              ) : (
                <div className={styles.productsGrid}>
                  {myProducts.map(product => (
                    <MyProductCard 
                      key={product.productId} 
                      product={product} 
                      onUpdate={handleProductUpdate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'purchased' && (
            <div className={styles.section}>
              {purchasedProducts.length === 0 ? (
                <div className={styles.empty}>
                  <p>구매한 상품이 없습니다.</p>
                  <button 
                    onClick={() => router.push('/')}
                    className={styles.shopButton}
                  >
                    상품 둘러보기
                  </button>
                </div>
              ) : (
                <div className={styles.productsGrid}>
                  {purchasedProducts.map(product => (
                    <ProductCard key={product.productId} product={product} isPurchased={true} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
} 