import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { productService } from '../../services/productService'
import { authService } from '../../services/authService'
import Layout from '../../components/Layout'
import styles from '../../styles/ProductForm.module.css'

export default function CreateProduct() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    imageFile: null
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState('')

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      alert('로그인이 필요합니다.')
      router.push('/login')
    }
  }, [router])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
    setFormData(prev => ({
      ...prev,
        imageFile: file
    }))
      
      // 이미지 미리보기
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. 이미지 파일 업로드 (선택사항)
      let imageUrl = null
      if (formData.imageFile) {
        setUploading(true)
        const uploadResponse = await productService.uploadFile(formData.imageFile)
        
        // Product Service 응답 구조: {success: true, data: {imageUrl}}
        if (uploadResponse.success && uploadResponse.data) {
          imageUrl = uploadResponse.data.imageUrl
        }
        setUploading(false)
      }
      
      // 2. 상품 정보 등록
      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseInt(formData.price),
        category: formData.category,
        imageUrl: imageUrl
      }
      
      const createResponse = await productService.createProduct(productData)
      
      // Product Service 응답 구조: {success: true, data: {productId, status}}
      if (createResponse.success) {
        alert('🎉 상품이 성공적으로 등록되었습니다!\n마이페이지에서 확인하실 수 있습니다.')
        
        // 실시간 스트림 업데이트 (백엔드 v1.5.4에서 자동 처리)
        console.log('✅ 상품 등록 완료, 실시간 업데이트 예정:', createResponse.data)
        
        // 마이페이지로 이동하여 등록된 상품 확인
        router.push('/mypage?tab=my')
      } else {
        throw new Error('상품 등록에 실패했습니다.')
      }
    } catch (error) {
      alert('상품 등록 실패: ' + error.message)
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>상품 등록</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title">상품명</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="상품명을 입력하세요"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category">카테고리</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">카테고리 선택</option>
              <option value="전자제품">전자제품</option>
              <option value="패션잡화">패션잡화</option>
              <option value="유아용품">유아용품</option>
              <option value="스포츠용품">스포츠용품</option>
              <option value="식품">식품</option>
              <option value="신발">신발</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="price">가격 (원)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="가격을 입력하세요"
              min="0"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="imageFile">상품 이미지</label>
            <input
              type="file"
              id="imageFile"
              name="imageFile"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className={styles.imagePreview}>
                <img src={imagePreview} alt="미리보기" />
                <p>업로드할 이미지 미리보기</p>
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">상품 설명</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="상품에 대한 자세한 설명을 입력하세요"
              rows="5"
              required
            />
          </div>

          <div className={styles.actions}>
            <button 
              type="button" 
              onClick={() => router.back()}
              className={styles.cancelButton}
              disabled={loading}
            >
              취소
            </button>
            <button 
              type="submit" 
              disabled={loading || uploading}
              className={styles.submitButton}
            >
              {uploading ? '이미지 업로드 중...' : loading ? '등록 중...' : '상품 등록'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
} 