import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { productService } from '../../../services/productService'
import { authService } from '../../../services/authService'
import Layout from '../../../components/Layout'
import styles from '../../../styles/ProductForm.module.css'

export default function EditProduct() {
  const router = useRouter()
  const { id } = router.query
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    imageFile: null,
    currentImageUrl: ''
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }

    if (id) {
      loadProductData()
    }
  }, [router, id])

  const loadProductData = async () => {
    try {
      setInitialLoading(true)
      const response = await productService.getProductForEdit(id)
      
      if (response.success && response.data) {
        const product = response.data
        setFormData({
          title: product.title || '',
          description: product.description || '',
          price: product.price?.toString() || '',
          category: product.category || '',
          imageFile: null,
          currentImageUrl: product.imageUrl || ''
        })
        setImagePreview(product.imageUrl || '')
      } else {
        alert('상품 정보를 불러올 수 없습니다.')
        router.push('/mypage')
      }
    } catch (error) {
      alert('상품 정보 로딩 실패: ' + error.message)
      router.push('/mypage')
    } finally {
      setInitialLoading(false)
    }
  }

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
      // 1. 새로운 이미지가 있으면 업로드
      let imageUrl = formData.currentImageUrl
      if (formData.imageFile) {
        setUploading(true)
        const uploadResponse = await productService.uploadFile(formData.imageFile)
        
        if (uploadResponse.success && uploadResponse.data) {
          imageUrl = uploadResponse.data.imageUrl
        }
        setUploading(false)
      }
      
      // 2. 상품 정보 수정
      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseInt(formData.price),
        category: formData.category,
        imageUrl: imageUrl
      }
      
      const updateResponse = await productService.updateProduct(id, productData)
      
      if (updateResponse.success) {
        alert('상품이 성공적으로 수정되었습니다!')
        router.push('/mypage')
      } else {
        throw new Error('상품 수정에 실패했습니다.')
      }
    } catch (error) {
      alert('상품 수정 실패: ' + error.message)
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  if (initialLoading) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.loading}>상품 정보를 불러오는 중...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>상품 수정</h1>
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
              <option value="전자기기">전자기기</option>
              <option value="의류">의류</option>
              <option value="도서">도서</option>
              <option value="가구">가구</option>
              <option value="스포츠">스포츠</option>
              <option value="기타">기타</option>
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
                <p>{formData.imageFile ? '새로 업로드할 이미지' : '현재 이미지'}</p>
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
              {uploading ? '이미지 업로드 중...' : loading ? '수정 중...' : '상품 수정'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
} 