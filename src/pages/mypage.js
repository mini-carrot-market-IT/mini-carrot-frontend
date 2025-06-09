import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { productService } from '../services/productService'
import { authService } from '../services/authService'
import { userManagementService } from '../services/userManagementService'
import { notificationService } from '../services/notificationService'
import Layout from '../components/Layout'
import ProductCard from '../components/ProductCard'
import MyProductCard from '../components/MyProductCard'
import styles from '../styles/MyPage.module.css'

export default function MyPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [myProducts, setMyProducts] = useState([])
  const [purchasedProducts, setPurchasedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('my') // 'my', 'purchased', 'profile'
  
  // 프로필 수정 관련 상태
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [newNickname, setNewNickname] = useState('')
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }
    
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)
    setNewNickname(currentUser?.nickname || '')
    
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

  // 닉네임 변경
  const handleNicknameChange = async () => {
    if (!newNickname.trim()) {
      alert('닉네임을 입력해주세요.')
      return
    }

    if (newNickname === user?.nickname) {
      setIsEditingNickname(false)
      return
    }

    try {
      setProfileLoading(true)
      const response = await userManagementService.changeNickname(newNickname)
      
      if (response.success) {
        setUser(response.data)
        setIsEditingNickname(false)
        notificationService.showUserNotification('profile_updated')
        alert('닉네임이 성공적으로 변경되었습니다.')
      }
    } catch (error) {
      alert('닉네임 변경에 실패했습니다: ' + error.message)
      setNewNickname(user?.nickname || '')
    } finally {
      setProfileLoading(false)
    }
  }

  // 비밀번호 변경
  const handlePasswordChange = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.')
      return
    }

    if (newPassword.length < 6) {
      alert('새 비밀번호는 6자 이상이어야 합니다.')
      return
    }

    try {
      setProfileLoading(true)
      const response = await userManagementService.changePassword(currentPassword, newPassword)
      
      if (response.success) {
        setIsEditingPassword(false)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        notificationService.showUserNotification('password_changed')
        alert('비밀번호가 성공적으로 변경되었습니다.')
      }
    } catch (error) {
      alert('비밀번호 변경에 실패했습니다: ' + error.message)
    } finally {
      setProfileLoading(false)
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

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>마이페이지</h1>
        
        {/* 사용자 정보 섹션 */}
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>👤</div>
          <div className={styles.userDetails}>
            <h2>{user?.nickname}님</h2>
            <p>{user?.email}</p>
          </div>
        </div>

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
          <button 
            className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            프로필 설정
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

          {activeTab === 'profile' && (
            <div className={styles.section}>
              <div className={styles.profileSettings}>
                {/* 닉네임 변경 */}
                <div className={styles.settingItem}>
                  <h3>닉네임 변경</h3>
                  <div className={styles.settingContent}>
                    {isEditingNickname ? (
                      <div className={styles.editForm}>
                        <input
                          type="text"
                          value={newNickname}
                          onChange={(e) => setNewNickname(e.target.value)}
                          placeholder="새 닉네임"
                          className={styles.input}
                          disabled={profileLoading}
                        />
                        <div className={styles.buttonGroup}>
                          <button 
                            onClick={handleNicknameChange}
                            className={styles.saveButton}
                            disabled={profileLoading}
                          >
                            {profileLoading ? '저장 중...' : '저장'}
                          </button>
                          <button 
                            onClick={() => {
                              setIsEditingNickname(false)
                              setNewNickname(user?.nickname || '')
                            }}
                            className={styles.cancelButton}
                            disabled={profileLoading}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.currentValue}>
                        <span>현재 닉네임: {user?.nickname}</span>
                        <button 
                          onClick={() => setIsEditingNickname(true)}
                          className={styles.editButton}
                        >
                          수정
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 비밀번호 변경 */}
                <div className={styles.settingItem}>
                  <h3>비밀번호 변경</h3>
                  <div className={styles.settingContent}>
                    {isEditingPassword ? (
                      <div className={styles.editForm}>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({
                            ...prev,
                            currentPassword: e.target.value
                          }))}
                          placeholder="현재 비밀번호"
                          className={styles.input}
                          disabled={profileLoading}
                        />
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({
                            ...prev,
                            newPassword: e.target.value
                          }))}
                          placeholder="새 비밀번호 (6자 이상)"
                          className={styles.input}
                          disabled={profileLoading}
                        />
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({
                            ...prev,
                            confirmPassword: e.target.value
                          }))}
                          placeholder="새 비밀번호 확인"
                          className={styles.input}
                          disabled={profileLoading}
                        />
                        <div className={styles.buttonGroup}>
                          <button 
                            onClick={handlePasswordChange}
                            className={styles.saveButton}
                            disabled={profileLoading}
                          >
                            {profileLoading ? '변경 중...' : '변경'}
                          </button>
                          <button 
                            onClick={() => {
                              setIsEditingPassword(false)
                              setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                            }}
                            className={styles.cancelButton}
                            disabled={profileLoading}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.currentValue}>
                        <span>비밀번호를 변경할 수 있습니다</span>
                        <button 
                          onClick={() => setIsEditingPassword(true)}
                          className={styles.editButton}
                        >
                          변경
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 계정 정보 */}
                <div className={styles.settingItem}>
                  <h3>계정 정보</h3>
                  <div className={styles.settingContent}>
                    <div className={styles.accountInfo}>
                      <p><strong>이메일:</strong> {user?.email}</p>
                      <p><strong>가입일:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
} 