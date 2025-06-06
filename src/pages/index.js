import { useState, useEffect } from 'react'
import { productService } from '../services/productService'
import ProductCard from '../components/ProductCard'
import Layout from '../components/Layout'
import styles from '../styles/Home.module.css'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError('') // 이전 에러 초기화
      const response = await productService.getProducts()
      
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

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Mini 당근마켓</h1>
        <div className={styles.productsGrid}>
          {products.length === 0 ? (
            <div className={styles.empty}>등록된 상품이 없습니다.</div>
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