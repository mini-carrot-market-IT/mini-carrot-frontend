# Mini Carrot Frontend 설정 가이드

## 개발 환경 설정

### 필수 요구사항
- Node.js 18.0.0 이상
- npm 또는 yarn

### 설치 및 실행

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **환경 변수 설정**
   프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```
   브라우저에서 http://localhost:3000 으로 접속

4. **프로덕션 빌드**
   ```bash
   npm run build
   npm start
   ```

## 프로젝트 구조

```
src/
├── pages/              # Next.js 페이지 라우팅
│   ├── index.js        # 홈페이지
│   ├── login.js        # 로그인 페이지
│   ├── register.js     # 회원가입 페이지
│   ├── profile.js      # 프로필 페이지
│   └── products/       # 상품 관련 페이지
│       ├── index.js    # 상품 목록
│       ├── [id].js     # 상품 상세
│       └── create.js   # 상품 등록
├── components/         # 재사용 가능한 컴포넌트
│   ├── Layout.js       # 전체 레이아웃
│   ├── Header.js       # 헤더 컴포넌트
│   └── ProductCard.js  # 상품 카드 컴포넌트
├── services/           # API 서비스 함수
│   ├── authService.js  # 인증 관련 API
│   └── productService.js # 상품 관련 API
├── utils/              # 유틸리티 함수
│   └── api.js          # API 설정 및 헬퍼
└── styles/             # 스타일 파일
    └── globals.css     # 전역 CSS
```

## 주요 기능

### 인증 시스템
- 회원가입 및 로그인
- JWT 토큰 기반 인증
- 로컬 스토리지를 통한 상태 관리

### 상품 관리
- 상품 목록 조회
- 상품 상세 정보 조회
- 상품 등록 (이미지 업로드 포함)
- 상품 검색

### UI/UX
- 반응형 디자인
- 당근마켓 스타일의 UI
- 모바일 친화적 인터페이스

## API 연동

백엔드 API 서버가 필요합니다. 다음 엔드포인트들이 구현되어야 합니다:

### 인증 API
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입

### 상품 API
- `GET /api/products` - 상품 목록 조회
- `GET /api/products/:id` - 상품 상세 조회
- `POST /api/products` - 상품 등록
- `PUT /api/products/:id` - 상품 수정
- `DELETE /api/products/:id` - 상품 삭제
- `GET /api/products/search` - 상품 검색

## 배포

### Docker를 사용한 배포
```bash
docker build -t mini-carrot-frontend .
docker run -p 3000:3000 mini-carrot-frontend
```

### Vercel 배포
1. Vercel 계정 생성
2. GitHub 저장소 연결
3. 환경 변수 설정
4. 자동 배포

## 개발 가이드

### 새로운 페이지 추가
1. `src/pages/` 디렉토리에 새 파일 생성
2. Next.js 파일 기반 라우팅 활용
3. Layout 컴포넌트로 감싸기

### 새로운 컴포넌트 추가
1. `src/components/` 디렉토리에 새 파일 생성
2. 재사용 가능하도록 props 설계
3. CSS 클래스명은 BEM 방식 권장

### API 서비스 추가
1. `src/services/` 디렉토리에 서비스 파일 생성
2. `src/utils/api.js`의 api 객체 활용
3. 에러 처리 포함

## 문제 해결

### 자주 발생하는 문제들

1. **CORS 에러**
   - 백엔드 서버에서 CORS 설정 확인
   - API URL 환경 변수 확인

2. **이미지 로딩 실패**
   - public 디렉토리에 placeholder 이미지 추가
   - 이미지 경로 확인

3. **빌드 에러**
   - Node.js 버전 확인
   - 의존성 재설치: `rm -rf node_modules package-lock.json && npm install`

## 기여하기

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 라이선스

MIT License 