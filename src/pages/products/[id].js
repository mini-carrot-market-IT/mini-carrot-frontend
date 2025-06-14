import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { productService } from '../../services/productService'
import { authService } from '../../services/authService'
import { analyticsService } from '../../services/analyticsService'
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
  const [viewCount, setViewCount] = useState(0)

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
      setError('') // 이전 오류 초기화
      
      const response = await productService.getProduct(id)
      
      // Product Service 응답 구조: {success: true, data: product}
      if (response.success && response.data) {
        setProduct(response.data)
        
        // 조회수 가져오기
        try {
          const count = await analyticsService.getViewCount(id)
          setViewCount(count)
        } catch (error) {
          console.warn('조회수 조회 실패:', error)
          setViewCount(0)
        }
      } else {
        throw new Error('상품 정보를 불러올 수 없습니다.')
      }
    } catch (error) {
      console.error('상품 로딩 실패:', error)
      // 네트워크 오류나 일시적 오류인 경우 재시도 안내
      if (error.message.includes('Failed to fetch') || error.message.includes('500')) {
        setError('상품 정보를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      } else {
        setError(error.message)
      }
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

    if (window.confirm(`${product.title}\n가격: ${product.price?.toLocaleString()}원\n\n정말 구매하시겠습니까?`)) {
      try {
        setPurchasing(true)
        const response = await productService.buyProduct(id)
        
        // Product Service 응답 구조: {success: true, data: purchase}
        if (response.success) {
          alert('🎉 구매가 완료되었습니다!\n마이페이지에서 구매 내역을 확인할 수 있습니다.')
          // 상품 상태 즉시 업데이트 (서버 재조회 없이)
          setProduct(prev => ({ ...prev, status: 'SOLD' }))
          // 마이페이지로 이동 옵션 제공
          if (window.confirm('구매한 상품을 마이페이지에서 확인하시겠습니까?')) {
            router.push('/mypage?tab=purchased')
          }
        } else {
          throw new Error('구매 처리에 실패했습니다.')
        }
      } catch (error) {
        console.error('구매 오류:', error)
        if (error.message.includes('찾을 수 없습니다')) {
          alert('❌ 이미 판매된 상품이거나 존재하지 않는 상품입니다.')
        } else if (error.message.includes('토큰')) {
          alert('❌ 로그인이 만료되었습니다. 다시 로그인해주세요.')
          router.push('/login')
        } else {
          alert('❌ 구매 실패: ' + error.message)
        }
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
              <p className={styles.viewCount}>👁️ 조회수: {viewCount.toLocaleString()}</p>
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