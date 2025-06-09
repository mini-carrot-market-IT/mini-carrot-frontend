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

  if (!product) return null

  return (
    <div 
      className={`${styles.productCard} ${product.status === 'SOLD' ? styles.sold : ''}`}
      data-product-id={product.productId}
    >
      <Link href={`/products/${product.productId}`}>
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