# 🥕 Mini 당근마켓 Frontend

> Next.js 기반의 중고거래 플랫폼 - 상품 등록, 구매, 관리가 가능한 완전한 당근마켓 클론

![Next.js](https://img.shields.io/badge/Next.js-13+-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Supported-326CE5?style=for-the-badge&logo=kubernetes)

## 🌟 주요 기능

### 👤 사용자 기능
- ✅ **회원가입/로그인** - 이메일 기반 인증
- ✅ **프로필 관리** - 닉네임, 개인정보 관리
- ✅ **마이페이지** - 내가 등록한 상품 / 구매한 상품 관리

### 🛍️ 상품 기능
- ✅ **상품 등록** - 제목, 설명, 가격, 이미지 업로드, 카테고리 설정
- ✅ **상품 수정/삭제** - 내가 등록한 상품 관리
- ✅ **상품 목록 조회** - 카테고리별 필터링
- ✅ **상품 상세 보기** - 상품 정보 확인 및 구매
- ✅ **원클릭 구매** - 간편한 상품 구매

### 📱 UI/UX
- ✅ **반응형 디자인** - 모바일/태블릿/데스크톱 지원
- ✅ **실시간 이미지 미리보기** - 업로드 전 이미지 확인
- ✅ **직관적인 네비게이션** - 깔끔한 메뉴 구성
- ✅ **로딩 상태 표시** - 사용자 경험 최적화

## 🚀 빠른 시작

### 📋 사전 요구사항

- **Node.js** 18+ 
- **npm** 또는 **yarn**
- **Backend Services** (User Service, Product Service)

### ⚡ 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/YOUR_USERNAME/mini-carrot-frontend.git
cd mini-carrot-frontend

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp .env.example .env.local
# .env.local 파일을 열어서 백엔드 서비스 URL 설정

# 4. 개발 서버 실행
npm run dev

# 5. 브라우저에서 확인
# http://localhost:3000
```

## ⚙️ 환경 설정

### 🔧 환경 변수

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 값들을 설정하세요:

```bash
# Backend API URLs
NEXT_PUBLIC_USER_SERVICE_URL=http://your-user-service-url
NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://your-product-service-url

# 예시 (로컬 개발)
NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:8080
NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://localhost:8082

# 예시 (클라우드 배포)
NEXT_PUBLIC_USER_SERVICE_URL=http://your-server-ip:31250
NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://your-server-ip:31251
```

### 🏗️ Backend Services 설정

이 프론트엔드는 다음 백엔드 서비스가 필요합니다:

1. **User Service** (포트 8080 또는 31250)
   - 회원가입, 로그인, 프로필 관리
   - GitHub: [mini-carrot-user-service](https://github.com/YOUR_USERNAME/mini-carrot-user-service)

2. **Product Service** (포트 8082 또는 31251)
   - 상품 등록, 조회, 구매, 파일 업로드
   - GitHub: [mini-carrot-product-service](https://github.com/YOUR_USERNAME/mini-carrot-product-service)

## 🐳 Docker 배포

### 로컬 Docker 실행

```bash
# Docker 이미지 빌드
docker build -t mini-carrot-frontend .

# 컨테이너 실행
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_USER_SERVICE_URL=http://your-backend-ip:31250 \
  -e NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://your-backend-ip:31251 \
  mini-carrot-frontend
```

### Docker Hub 사용

```bash
# 이미지 빌드 및 푸시
docker build --platform linux/amd64 -t your-dockerhub-username/mini-carrot-frontend:latest .
docker push your-dockerhub-username/mini-carrot-frontend:latest
```

## ☸️ Kubernetes 배포

### 설정 파일 준비

```bash
# 1. Kubernetes 설정 파일 복사
cp k8s/frontend-deployment.yaml.example k8s/frontend-deployment.yaml

# 2. 설정 파일 수정
# - 네임스페이스 변경
# - Docker 이미지 이름 변경  
# - 백엔드 서비스 URL 변경
```

### 배포 실행

```bash
# Kubernetes 클러스터에 배포
kubectl apply -f k8s/frontend-deployment.yaml

# 서비스 상태 확인
kubectl get pods -n your-namespace
kubectl get svc -n your-namespace

# 로그 확인
kubectl logs -f deployment/frontend -n your-namespace
```

## 📁 프로젝트 구조

```
📦 mini-carrot-frontend
├── 📁 public/                    # 정적 파일
├── 📁 src/
│   ├── 📁 components/            # 재사용 가능한 컴포넌트
│   │   ├── 📄 Layout.js         # 전체 레이아웃
│   │   ├── 📄 Header.js         # 헤더/네비게이션
│   │   ├── 📄 ProductCard.js    # 상품 카드
│   │   └── 📄 MyProductCard.js  # 마이페이지 상품 카드
│   ├── 📁 pages/                # Next.js 페이지
│   │   ├── 📄 index.js          # 메인 페이지 (상품 목록)
│   │   ├── 📄 login.js          # 로그인
│   │   ├── 📄 register.js       # 회원가입
│   │   ├── 📄 mypage.js         # 마이페이지
│   │   └── 📁 products/
│   │       ├── 📄 [id].js       # 상품 상세
│   │       ├── 📄 create.js     # 상품 등록
│   │       └── 📁 edit/
│   │           └── 📄 [id].js   # 상품 수정
│   ├── 📁 services/             # API 서비스 계층
│   │   ├── 📄 authService.js    # 인증 관련 API
│   │   └── 📄 productService.js # 상품 관련 API
│   ├── 📁 utils/               # 유틸리티 함수
│   │   └── 📄 api.js           # API 설정 및 헬퍼
│   └── 📁 styles/              # CSS 모듈 스타일
├── 📁 k8s/                      # Kubernetes 배포 파일
├── 📄 .env.example             # 환경변수 템플릿
├── 📄 docker-compose.yml       # Docker Compose 설정
├── 📄 Dockerfile              # Docker 이미지 빌드
└── 📄 SETUP.md                # 상세 설정 가이드
```

## 🎯 주요 화면

| 📱 화면 | 🔗 경로 | 📝 설명 |
|---------|---------|---------|
| 메인 | `/` | 전체 상품 목록, 카테고리 필터링 |
| 로그인 | `/login` | 이메일/비밀번호 로그인 |
| 회원가입 | `/register` | 새 계정 생성 |
| 상품 상세 | `/products/[id]` | 상품 정보 보기 및 구매 |
| 상품 등록 | `/products/create` | 새 상품 등록 |
| 상품 수정 | `/products/edit/[id]` | 내 상품 수정 |
| 마이페이지 | `/mypage` | 내 상품/구매 상품 관리 |

## 🛠️ 개발 가이드

### 🎨 새 컴포넌트 추가

```bash
# 1. 컴포넌트 파일 생성
touch src/components/NewComponent.js

# 2. CSS 모듈 생성  
touch src/styles/NewComponent.module.css

# 3. 컴포넌트에서 스타일 import
import styles from '../styles/NewComponent.module.css'
```

### 🔌 API 서비스 확장

```javascript
// src/services/newService.js
import { apiRequest } from '../utils/api'

export const newService = {
  async getData() {
    return await apiRequest('/api/new-endpoint')
  }
}
```

### 🧪 테스트 실행

```bash
# 개발 서버에서 테스트
npm run dev

# 빌드 테스트
npm run build
npm start

# 백엔드 연결 테스트
curl http://localhost:3000/api/health
```

## 🤝 기여 방법

1. **Fork** 이 저장소
2. **Feature Branch** 생성 (`git checkout -b feature/amazing-feature`)
3. **변경사항 커밋** (`git commit -m 'Add amazing feature'`)
4. **Branch에 Push** (`git push origin feature/amazing-feature`)
5. **Pull Request** 생성

## 📞 지원 및 문의

- 🐛 **버그 리포트**: GitHub Issues
- 💡 **기능 제안**: GitHub Discussions  
- 📚 **문서**: [SETUP.md](./SETUP.md)

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](./LICENSE) 파일을 참조하세요.

---

**⭐ 이 프로젝트가 도움이 되었다면 별표를 눌러주세요!**
