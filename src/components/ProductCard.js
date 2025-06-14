import Link from 'next/link'
import { useState, useEffect } from 'react'
import { apiUtils } from '../utils/api'
import { analyticsService } from '../services/analyticsService'
import styles from '../styles/ProductCard.module.css'

export default function ProductCard({ product, isPurchased = false }) {
  const [viewCount, setViewCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (product?.productId) {
      loadViewCount()
    }
  }, [product?.productId])

  // 조회수 로딩 함수 (재시도 로직 포함)
  const loadViewCount = async () => {
    if (!product?.productId) return
    
    try {
      setIsLoading(true)
      
      // 로컬 스토리지에서 캐시된 조회수 먼저 확인
      const cacheKey = `viewCount_${product.productId}`
      const cachedCount = localStorage.getItem(cacheKey)
      if (cachedCount) {
        setViewCount(parseInt(cachedCount))
      }
      
      // 서버에서 최신 조회수 가져오기
      const count = await analyticsService.getViewCount(product.productId)
      console.log(`📊 상품 ${product.productId} 조회수 로딩:`, count)
      
      if (count >= 0) {
        setViewCount(count)
        // 로컬 스토리지에 캐시
        localStorage.setItem(cacheKey, count.toString())
      }
    } catch (error) {
      console.warn('조회수 로딩 실패:', error)
      // 캐시된 값이 없으면 0으로 설정
      if (!localStorage.getItem(`viewCount_${product.productId}`)) {
        setViewCount(0)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 상품 클릭 시 조회수 증가
  const handleProductClick = async () => {
    if (product?.productId) {
      try {
        // 조회수 즉시 증가 (UI 반응성)
        const newCount = viewCount + 1
        setViewCount(newCount)
        
        // 로컬 스토리지 즉시 업데이트
        const cacheKey = `viewCount_${product.productId}`
        localStorage.setItem(cacheKey, newCount.toString())
        
        // 백엔드에 조회 추적
        await analyticsService.trackProductView(product.productId, product.category)
        
        // 1초 후 실제 조회수 다시 가져오기 (정확성 보장)
        setTimeout(async () => {
          try {
            const actualCount = await analyticsService.getViewCount(product.productId)
            if (actualCount >= 0) {
              setViewCount(actualCount)
              localStorage.setItem(cacheKey, actualCount.toString())
            }
          } catch (error) {
            console.warn('조회수 재조회 실패:', error)
          }
        }, 1000)
      } catch (error) {
        console.warn('조회 추적 실패:', error)
        // 실패시 증가된 조회수를 원래대로
        setViewCount(prev => Math.max(0, prev - 1))
        const cacheKey = `viewCount_${product.productId}`
        localStorage.setItem(cacheKey, Math.max(0, viewCount - 1).toString())
      }
    }
  }

  if (!product) return null

  return (
    <div 
      className={`${styles.productCard} ${product.status === 'SOLD' ? styles.sold : ''}`}
      data-product-id={product.productId}
    >
      <Link href={`/products/${product.productId}`} onClick={handleProductClick}>
        <div className={styles.productImage}>
          <img 
            src={apiUtils.getImageUrl(product.imageUrl)} 
            alt={product.title}
            onError={(e) => {
              e.target.src = '/images/default-product.svg'
            }}
          />
          {product.status === 'SOLD' && (
            <div className={styles.soldOverlay}>
              <span>판매완료</span>
            </div>
          )}
        </div>
        <div className={styles.productInfo}>
          <h3 className={styles.title}>{product.title}</h3>
          <p className={styles.price}>{product.price?.toLocaleString()}원</p>
          <p className={styles.category}>{product.category}</p>
          <div className={styles.metadata}>
            <span className="view-count">
              👁️ {isLoading ? '...' : viewCount.toLocaleString()}
            </span>
            {isPurchased && product.sellerNickname && (
              <span className={styles.seller}>판매자: {product.sellerNickname}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
} 