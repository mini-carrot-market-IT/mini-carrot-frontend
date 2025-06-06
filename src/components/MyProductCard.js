import { useState } from 'react'
import { useRouter } from 'next/router'
import { productService } from '../services/productService'
import { apiUtils } from '../utils/api'
import styles from '../styles/MyProductCard.module.css'

export default function MyProductCard({ product, onUpdate }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleEdit = () => {
    router.push(`/products/edit/${product.productId}`)
  }

  const handleDelete = async () => {
    if (!confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      return
    }

    try {
      setLoading(true)
      const response = await productService.deleteProduct(product.productId)
      
      if (response.success) {
        alert('상품이 삭제되었습니다.')
        onUpdate() // 부모 컴포넌트에서 데이터 다시 로드
      } else {
        alert('상품 삭제에 실패했습니다.')
      }
    } catch (error) {
      alert('상품 삭제 실패: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleProductClick = () => {
    router.push(`/products/${product.productId}`)
  }

  // 판매 상태 텍스트
  const getStatusText = (status) => {
    switch (status) {
      case 'AVAILABLE': return '판매중'
      case 'SOLD': return '판매완료'
      case 'HIDDEN': return '숨김'
      default: return status
    }
  }

  // 판매 상태 클래스
  const getStatusClass = (status) => {
    switch (status) {
      case 'AVAILABLE': return styles.available
      case 'SOLD': return styles.sold
      case 'HIDDEN': return styles.hidden
      default: return ''
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer} onClick={handleProductClick}>
        <img 
          src={apiUtils.getImageUrl(product.imageUrl)} 
          alt={product.title}
          className={styles.image}
        />
        <div className={`${styles.status} ${getStatusClass(product.status)}`}>
          {getStatusText(product.status)}
        </div>
      </div>
      
      <div className={styles.content}>
        <h3 className={styles.title} onClick={handleProductClick}>
          {product.title}
        </h3>
        <p className={styles.price}>
          {apiUtils.formatPrice(product.price)}원
        </p>
        <p className={styles.category}>{product.category}</p>
        
        <div className={styles.actions}>
          <button 
            onClick={handleEdit}
            className={styles.editButton}
            disabled={loading || product.status === 'SOLD'}
          >
            수정
          </button>
          <button 
            onClick={handleDelete}
            className={styles.deleteButton}
            disabled={loading || product.status === 'SOLD'}
          >
            {loading ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
} 