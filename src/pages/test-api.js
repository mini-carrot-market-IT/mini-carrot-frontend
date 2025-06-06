import { useState } from 'react'
import { authService } from '../services/authService'
import { productService } from '../services/productService'
import Layout from '../components/Layout'

export default function TestApi() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const addResult = (test, result, success = true) => {
    setResults(prev => [...prev, {
      test,
      result: JSON.stringify(result, null, 2),
      success,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const testUserService = async () => {
    setLoading(true)
    
    try {
      // 회원가입 테스트
      try {
        const registerResponse = await authService.register({
          email: `test${Date.now()}@test.com`,
          password: 'test123456',
          nickname: `테스터${Date.now()}`
        })
        addResult('User Service - 회원가입', registerResponse)
      } catch (error) {
        addResult('User Service - 회원가입', error.message, false)
      }

      // 로그인 테스트
      try {
        const loginResponse = await authService.login({
          email: 'frontend@test.com',
          password: 'password123'
        })
        addResult('User Service - 로그인', loginResponse)
        
        // 로그인 성공 시 JWT 토큰 정보 표시
        if (loginResponse.success && loginResponse.data && loginResponse.data.token) {
          addResult('JWT 토큰 저장', { token: authService.getToken(), user: authService.getCurrentUser() })
        }
      } catch (error) {
        addResult('User Service - 로그인', error.message, false)
      }

      // 프로필 조회 테스트
      try {
        const profileResponse = await authService.getProfile()
        addResult('User Service - 프로필 조회', profileResponse)
      } catch (error) {
        addResult('User Service - 프로필 조회', error.message, false)
      }

    } catch (error) {
      addResult('User Service 전체', error.message, false)
    } finally {
      setLoading(false)
    }
  }

  const testProductService = async () => {
    setLoading(true)
    
    try {
      // 상품 목록 조회 테스트
      try {
        const productsResponse = await productService.getProducts()
        addResult('Product Service - 상품 목록 조회', productsResponse)
      } catch (error) {
        addResult('Product Service - 상품 목록 조회', error.message, false)
      }

      // 카테고리별 상품 조회 테스트
      try {
        const categoryResponse = await productService.getProducts('전자기기')
        addResult('Product Service - 카테고리별 상품 조회', categoryResponse)
      } catch (error) {
        addResult('Product Service - 카테고리별 상품 조회', error.message, false)
      }

      // JWT 인증이 필요한 API 테스트
      if (authService.isAuthenticated()) {
        try {
          const myProductsResponse = await productService.getMyProducts()
          addResult('Product Service - 내 상품 목록 (JWT 인증)', myProductsResponse)
        } catch (error) {
          addResult('Product Service - 내 상품 목록 (JWT 인증)', error.message, false)
        }

        try {
          const purchasedResponse = await productService.getPurchasedProducts()
          addResult('Product Service - 구매한 상품 목록 (JWT 인증)', purchasedResponse)
        } catch (error) {
          addResult('Product Service - 구매한 상품 목록 (JWT 인증)', error.message, false)
        }

        // 상품 등록 테스트
        try {
          const createResponse = await productService.createProduct({
            title: `테스트 상품 ${Date.now()}`,
            description: 'User Service ↔ Product Service 연동 테스트용 상품입니다.',
            price: 50000,
            category: '기타',
            imageUrl: '/uploads/test.jpg'
          })
          addResult('Product Service - 상품 등록 (JWT 인증)', createResponse)
        } catch (error) {
          addResult('Product Service - 상품 등록 (JWT 인증)', error.message, false)
        }
      } else {
        addResult('JWT 인증 필요', '로그인 후 JWT 토큰이 필요한 API를 테스트할 수 있습니다.', false)
      }

    } catch (error) {
      addResult('Product Service 전체', error.message, false)
    } finally {
      setLoading(false)
    }
  }

  const testFullFlow = async () => {
    setLoading(true)
    
    try {
      addResult('전체 플로우 테스트 시작', '사용자 로그인 → 상품 등록 → 상품 조회 플로우를 테스트합니다.')
      
      // 1. 사용자 로그인
      const loginResponse = await authService.login({
        email: 'frontend@test.com',
        password: 'password123'
      })
      
      if (!loginResponse.success) {
        throw new Error('로그인 실패')
      }
      
      addResult('1단계: User Service 로그인', loginResponse)
      
      // 2. Product Service에 상품 등록 (User Service JWT 토큰 사용)
      const productData = {
        title: `연동 테스트 상품 ${Date.now()}`,
        description: 'User Service JWT 토큰으로 Product Service에 등록하는 테스트 상품입니다.',
        price: 99000,
        category: '전자기기',
        imageUrl: null
      }
      
      const createResponse = await productService.createProduct(productData)
      addResult('2단계: Product Service 상품 등록 (User Service JWT 사용)', createResponse)
      
      // 3. 등록된 상품을 내 상품 목록에서 확인
      const myProductsResponse = await productService.getMyProducts()
      addResult('3단계: Product Service 내 상품 목록 조회', myProductsResponse)
      
      // 4. 전체 상품 목록에서도 확인
      const allProductsResponse = await productService.getProducts()
      addResult('4단계: Product Service 전체 상품 목록 조회', allProductsResponse)
      
      addResult('전체 플로우 테스트 완료', '🎉 User Service ↔ Product Service 연동이 성공적으로 완료되었습니다!', true)

    } catch (error) {
      addResult('전체 플로우 테스트 실패', error.message, false)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <Layout>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>🧪 마이크로서비스 연동 테스트</h1>
        
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
          <h3>현재 상태</h3>
          <p><strong>로그인 상태:</strong> {authService.isAuthenticated() ? '✅ 로그인됨' : '❌ 로그아웃됨'}</p>
          <p><strong>JWT 토큰:</strong> {authService.getToken() ? '✅ 있음' : '❌ 없음'}</p>
          <p><strong>사용자 정보:</strong> {authService.getCurrentUser() ? `${authService.getCurrentUser().nickname} (${authService.getCurrentUser().email})` : '없음'}</p>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={testUserService} 
            disabled={loading}
            style={{ marginRight: '10px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            User Service 테스트
          </button>
          <button 
            onClick={testProductService} 
            disabled={loading}
            style={{ marginRight: '10px', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            Product Service 테스트
          </button>
          <button 
            onClick={testFullFlow} 
            disabled={loading}
            style={{ marginRight: '10px', padding: '10px 20px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px' }}
          >
            🚀 전체 연동 플로우 테스트
          </button>
          <button 
            onClick={clearResults}
            style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            결과 지우기
          </button>
        </div>

        <div>
          <h2>테스트 결과</h2>
          {results.length === 0 ? (
            <p>아직 테스트 결과가 없습니다. 위의 버튼을 클릭하여 테스트를 시작하세요.</p>
          ) : (
            results.map((result, index) => (
              <div 
                key={index} 
                style={{ 
                  marginBottom: '15px', 
                  padding: '15px', 
                  border: `2px solid ${result.success ? '#28a745' : '#dc3545'}`,
                  borderRadius: '8px',
                  backgroundColor: result.success ? '#d4edda' : '#f8d7da'
                }}
              >
                <h3 style={{ margin: '0 0 10px 0', color: result.success ? '#155724' : '#721c24' }}>
                  {result.success ? '✅' : '❌'} {result.test} 
                  <span style={{ fontSize: '0.8em', color: '#666', fontWeight: 'normal' }}>
                    ({result.timestamp})
                  </span>
                </h3>
                <pre style={{ 
                  background: '#f8f9fa', 
                  padding: '10px', 
                  borderRadius: '5px',
                  overflow: 'auto',
                  fontSize: '12px',
                  maxHeight: '300px'
                }}>
                  {result.result}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
} 