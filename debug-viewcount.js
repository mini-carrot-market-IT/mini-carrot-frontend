// 브라우저 Console에서 실행할 조회수 디버깅 스크립트

console.log('🔍 조회수 디버깅 시작...');

// 1. 직접 API 호출 테스트
async function testViewCountAPI() {
  console.log('📡 직접 API 호출 테스트...');
  
  try {
    const response = await fetch('http://211.188.63.186:31251/api/analytics/product/59/views');
    const data = await response.json();
    console.log('✅ 직접 API 응답:', data);
    return data;
  } catch (error) {
    console.error('❌ 직접 API 호출 실패:', error);
    return null;
  }
}

// 2. analyticsService 함수 테스트
async function testAnalyticsService() {
  console.log('🔧 analyticsService.getViewCount 테스트...');
  
  try {
    // analyticsService가 전역에 있는지 확인
    if (typeof window !== 'undefined' && window.analyticsService) {
      const count = await window.analyticsService.getViewCount(59);
      console.log('✅ analyticsService 응답:', count);
      return count;
    } else {
      console.warn('⚠️ analyticsService가 전역에 없음');
      return null;
    }
  } catch (error) {
    console.error('❌ analyticsService 호출 실패:', error);
    return null;
  }
}

// 3. ProductCard 컴포넌트 상태 확인
function checkProductCards() {
  console.log('🎯 ProductCard 컴포넌트 상태 확인...');
  
  const productCards = document.querySelectorAll('[data-product-id]');
  console.log(`📦 발견된 상품 카드 수: ${productCards.length}`);
  
  productCards.forEach((card, index) => {
    const productId = card.getAttribute('data-product-id');
    const viewCountElement = card.querySelector('.view-count');
    const viewCountText = viewCountElement ? viewCountElement.textContent : 'N/A';
    
    console.log(`📊 상품 ${productId}: 표시된 조회수 = "${viewCountText}"`);
  });
}

// 4. 로컬 스토리지 확인
function checkLocalStorage() {
  console.log('💾 로컬 스토리지 조회수 캐시 확인...');
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('viewCount_')) {
      const value = localStorage.getItem(key);
      console.log(`📝 ${key}: ${value}`);
    }
  }
}

// 5. 전체 테스트 실행
async function runFullTest() {
  console.log('🚀 전체 조회수 디버깅 테스트 시작...');
  console.log('='.repeat(50));
  
  // API 직접 호출
  const directAPI = await testViewCountAPI();
  
  // analyticsService 호출
  const serviceAPI = await testAnalyticsService();
  
  // ProductCard 상태 확인
  checkProductCards();
  
  // 로컬 스토리지 확인
  checkLocalStorage();
  
  console.log('='.repeat(50));
  console.log('📋 테스트 결과 요약:');
  console.log(`- 직접 API 호출: ${directAPI ? `성공 (조회수: ${directAPI.viewCount})` : '실패'}`);
  console.log(`- analyticsService: ${serviceAPI !== null ? `성공 (조회수: ${serviceAPI})` : '실패'}`);
  console.log('🔍 위 정보를 개발자에게 전달해주세요.');
}

// 즉시 실행
runFullTest(); 