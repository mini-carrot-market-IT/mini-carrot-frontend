import Link from 'next/link'
import { useState, useEffect } from 'react'
import { apiUtils } from '../utils/api'
import { analyticsService } from '../services/analyticsService'
import styles from '../styles/ProductCard.module.css'

export default function ProductCard({ product, isPurchased = false }) {
  const [viewCount, setViewCount] = useState(0)
  
  useEffect(() => {
    if (product?.productId) {
      // 실시간 조회수 가져오기
      analyticsService.getViewCount(product.productId)
        .then(count => setViewCount(count))
        .catch(() => setViewCount(0))
    }
  }, [product?.productId])

  // 상품 클릭 시 조회수 증가
  const handleProductClick = async () => {
    if (product?.productId) {
      try {
        // 조회수 즉시 증가 (UI 반응성)
        setViewCount(prev => prev + 1)
        
        // 백엔드에 조회 추적
        await analyticsService.trackProductView(product.productId, product.category)
        
        // 실제 조회수 다시 가져오기 (정확성 보장)
        setTimeout(async () => {
          try {
            const actualCount = await analyticsService.getViewCount(product.productId)
            setViewCount(actualCount)
          } catch (error) {
            console.warn('조회수 재조회 실패:', error)
          }
        }, 1000)
      } catch (error) {
        console.warn('조회 추적 실패:', error)
        // 실패시 증가된 조회수를 원래대로
        setViewCount(prev => Math.max(0, prev - 1))
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
            <span className="view-count">👁️ {viewCount.toLocaleString()}</span>
            {isPurchased && product.sellerNickname && (
              <span className={styles.seller}>판매자: {product.sellerNickname}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
} 