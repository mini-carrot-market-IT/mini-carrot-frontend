import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { productService } from '../../services/productService'
import { authService } from '../../services/authService'
import { apiUtils } from '../../utils/api'
import Layout from '../../components/Layout'
import styles from '../../styles/ProductDetail.module.css'

export default function ProductDetail() {
  const router = useRouter()
  const { id } = router.query
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [purchasing, setPurchasing] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated())
  }, [])

  useEffect(() => {
    if (id) {
      loadProduct()
    }
  }, [id])

  const loadProduct = async () => {
        try {
      setLoading(true)
      const response = await productService.getProduct(id)
      
      // Product Service 응답 구조: {success: true, data: product}
      if (response.success && response.data) {
        setProduct(response.data)
      } else {
        throw new Error('상품 정보를 불러올 수 없습니다.')
      }
        } catch (error) {
      console.error('상품 로딩 실패:', error)
      setError(error.message)
    } finally {
          setLoading(false)
        }
      }

  const handleBuy = async () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }

    if (window.confirm('정말 구매하시겠습니까?')) {
      try {
        setPurchasing(true)
        const response = await productService.buyProduct(id)
        
        // Product Service 응답 구조: {success: true, data: purchase}
        if (response.success) {
          alert('구매가 완료되었습니다!')
          await loadProduct()
        } else {
          throw new Error('구매 처리에 실패했습니다.')
        }
      } catch (error) {
        alert('구매 실패: ' + error.message)
      } finally {
        setPurchasing(false)
      }
    }
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

  if (!product) {
    return (
      <Layout>
        <div className={styles.error}>상품을 찾을 수 없습니다.</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.productDetail}>
          <div className={styles.imageSection}>
            <img 
              src={apiUtils.getImageUrl(product.imageUrl)} 
              alt={product.title}
              className={styles.productImage}
            />
          </div>
          
          <div className={styles.infoSection}>
            <h1 className={styles.title}>{product.title}</h1>
            <p className={styles.price}>{product.price?.toLocaleString()}원</p>
            <p className={styles.description}>{product.description}</p>
            
            <div className={styles.meta}>
              <p>판매자: {product.sellerNickname}</p>
              <p>카테고리: {product.category}</p>
            </div>

            <div className={styles.actions}>
              {product.status === 'AVAILABLE' ? (
                <button 
                  onClick={handleBuy}
                  disabled={purchasing}
                  className={styles.buyButton}
                >
                  {purchasing ? '구매 중...' : '구매하기'}
                </button>
              ) : (
                <button disabled className={styles.soldButton}>
                  판매완료
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 