# 🚀 Mini 당근마켓 Frontend 배포 가이드

> **최종 업데이트**: 2024년 12월 - NCP 배포 환경 안정화 완료

## 📋 배포 환경 현황

### ✅ **서비스 상태 (정상 운영 중)**

| 서비스 | 포트 | 상태 | 용도 |
|--------|------|------|------|
| **User Service** | `31207` | ✅ Ready | 사용자 인증, JWT, 프로필 관리 |
| **Product Service** | `31251` | ✅ Ready | 상품 관리, 파일 업로드, 구매 |
| **MySQL Database** | `31206` | ✅ Ready | 통합 데이터베이스 (minicarrot) |
| **RabbitMQ** | `31215` | ✅ Ready | 메시지 큐, 이벤트 처리 |
| **Grafana** | `31300` | ✅ Ready | 모니터링 대시보드 |
| **Prometheus** | `31290` | ✅ Ready | 메트릭 수집 |

### 🔗 **API 엔드포인트**

```bash
# NCP 배포 환경
USER_SERVICE_URL=http://{NCP_NODE_IP}:31207
PRODUCT_SERVICE_URL=http://{NCP_NODE_IP}:31251

# 개발 환경
USER_SERVICE_URL=http://localhost:8080
PRODUCT_SERVICE_URL=http://localhost:8081
```

---

## 🚀 빠른 배포

### **1단계: 저장소 클론 및 설정**

```bash
# 저장소 클론
git clone https://github.com/YOUR_USERNAME/mini-carrot-frontend.git
cd mini-carrot-frontend

# 환경 변수 설정
cp env.example .env.local

# .env.local 파일 수정
# {NCP_NODE_IP}를 실제 서버 IP로 변경
```

### **2단계: 로컬 개발 환경**

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 확인
open http://localhost:3000
```

### **3단계: Docker 배포**

```bash
# Docker 이미지 빌드 및 배포
./deploy.sh

# 또는 수동 빌드
docker build -t mini-carrot-frontend:latest .
docker run -p 3001:3000 \
  -e NEXT_PUBLIC_USER_SERVICE_URL=http://{NCP_NODE_IP}:31207 \
  -e NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://{NCP_NODE_IP}:31251 \
  mini-carrot-frontend:latest
```

---

## 🔧 환경별 상세 설정

### **🌍 Production (NCP 환경)**

```bash
# .env.production
NEXT_PUBLIC_USER_SERVICE_URL=http://211.188.63.186:31207
NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://211.188.63.186:31251
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_VERSION=2.0.0
NEXT_PUBLIC_API_TIMEOUT=10000
```

### **🛠 Development (로컬 환경)**

```bash
# .env.local
NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:8080
NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://localhost:8081
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_DEBUG_MODE=true
```

### **🧪 Testing (백엔드 연동 테스트)**

```bash
# 백엔드 서비스 상태 확인
curl http://{NCP_NODE_IP}:31207/actuator/health  # User Service
curl http://{NCP_NODE_IP}:31251/actuator/health  # Product Service

# Frontend API 테스트 페이지
http://localhost:3000/test-api
```

---

## 🐳 Docker 배포 상세

### **기본 Docker 명령어**

```bash
# 이미지 빌드 (NCP 환경용)
docker build \
  --build-arg NEXT_PUBLIC_USER_SERVICE_URL=http://{NCP_NODE_IP}:31207 \
  --build-arg NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://{NCP_NODE_IP}:31251 \
  --build-arg NEXT_PUBLIC_ENVIRONMENT=production \
  -t mini-carrot-frontend:ncp .

# 컨테이너 실행
docker run -d \
  --name mini-carrot-frontend \
  -p 3001:3000 \
  -e NEXT_PUBLIC_USER_SERVICE_URL=http://{NCP_NODE_IP}:31207 \
  -e NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://{NCP_NODE_IP}:31251 \
  mini-carrot-frontend:ncp

# 로그 확인
docker logs -f mini-carrot-frontend

# 컨테이너 중지/삭제
docker stop mini-carrot-frontend
docker rm mini-carrot-frontend
```

### **Docker Hub 배포**

```bash
# Docker Hub에 푸시
docker tag mini-carrot-frontend:ncp YOUR_DOCKERHUB/mini-carrot-frontend:latest
docker push YOUR_DOCKERHUB/mini-carrot-frontend:latest

# Docker Hub에서 실행
docker run -d \
  --name mini-carrot-frontend \
  -p 3001:3000 \
  -e NEXT_PUBLIC_USER_SERVICE_URL=http://{NCP_NODE_IP}:31207 \
  -e NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://{NCP_NODE_IP}:31251 \
  YOUR_DOCKERHUB/mini-carrot-frontend:latest
```

---

## ☸️ Kubernetes 배포

### **배포 파일 설정**

```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: your-namespace
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: YOUR_DOCKERHUB/mini-carrot-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_USER_SERVICE_URL
          value: "http://211.188.63.186:31207"
        - name: NEXT_PUBLIC_PRODUCT_SERVICE_URL
          value: "http://211.188.63.186:31251"
        - name: NEXT_PUBLIC_ENVIRONMENT
          value: "production"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: your-namespace
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 3000
    nodePort: 32000
  type: NodePort
```

### **Kubernetes 배포 실행**

```bash
# 네임스페이스 생성
kubectl create namespace your-namespace

# 배포 실행
kubectl apply -f k8s/frontend-deployment.yaml

# 상태 확인
kubectl get pods -n your-namespace
kubectl get svc -n your-namespace

# 로그 확인
kubectl logs -f deployment/frontend -n your-namespace

# 서비스 접속
http://{NODE_IP}:32000
```

---

## 🔍 문제 해결

### **일반적인 문제들**

#### **1. API 연결 실패**
```bash
# 증상: 백엔드 서비스 연결 불가
# 해결: 서비스 상태 확인
curl http://{NCP_NODE_IP}:31207/actuator/health
curl http://{NCP_NODE_IP}:31251/actuator/health

# 네트워크 연결 확인
telnet {NCP_NODE_IP} 31207
telnet {NCP_NODE_IP} 31251
```

#### **2. JWT 인증 오류**
```bash
# 증상: 토큰 만료 또는 인증 실패
# 해결: 로그인 재시도, 토큰 확인
localStorage.getItem('token')  # 브라우저 개발자 도구에서
```

#### **3. 이미지 업로드 실패**
```bash
# 증상: 파일 업로드 실패
# 해결: Product Service 파일 업로드 엔드포인트 확인
curl -X POST http://{NCP_NODE_IP}:31251/api/files/upload \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -F "file=@test.jpg"
```

#### **4. 환경 변수 인식 실패**
```bash
# 증상: API URL이 localhost로 설정됨
# 해결: .env.local 파일 확인 및 재시작
cat .env.local
npm run dev  # 개발 서버 재시작
```

### **로그 확인 방법**

```bash
# Docker 로그
docker logs mini-carrot-frontend

# Next.js 빌드 로그
npm run build

# 브라우저 개발자 도구
# F12 → Console 탭에서 JavaScript 오류 확인
# Network 탭에서 API 요청/응답 확인
```

---

## 📊 모니터링 및 성능

### **Grafana 대시보드**

```bash
# 접속 정보
URL: http://{NCP_NODE_IP}:31300
Username: admin
Password: MiniCarrot2024

# 모니터링 지표
- Frontend 응답 시간
- API 호출 성공률
- 사용자 활성도
- 에러율
```

### **성능 최적화 팁**

```javascript
// 1. API 요청 타임아웃 설정
const config = {
  timeout: 10000,  // 10초
  retries: 3
};

// 2. 이미지 최적화
<Image 
  src={imageUrl} 
  width={300} 
  height={200}
  loading="lazy"
  alt="상품 이미지"
/>

// 3. 코드 분할
const AnalyticsPage = dynamic(() => import('./analytics'), {
  loading: () => <p>Loading...</p>
});
```

---

## 🔐 보안 설정

### **환경 변수 보안**

```bash
# 민감한 정보는 환경 변수로 관리
NEXT_PUBLIC_API_KEY=your-api-key
JWT_SECRET=your-jwt-secret

# .env.local 파일은 .gitignore에 포함
echo ".env.local" >> .gitignore
```

### **CORS 설정**

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        ],
      },
    ];
  },
};
```

---

## 📞 지원 및 문의

### **긴급 상황 체크리스트**

- [ ] 백엔드 서비스 Health Check 확인
- [ ] 네트워크 연결 상태 확인
- [ ] 환경 변수 설정 확인
- [ ] Docker/Kubernetes 리소스 상태 확인
- [ ] 로그 파일 분석

### **연락처**

- **기술 지원**: Grafana 대시보드 참조
- **버그 리포트**: GitHub Issues
- **문서 업데이트**: 이 파일 수정 후 PR 생성

---

## 🎯 배포 체크리스트

### **배포 전 확인사항**

- [ ] 백엔드 서비스 정상 동작 확인
- [ ] 환경 변수 올바른 설정 확인
- [ ] Docker 이미지 빌드 성공 확인
- [ ] 로컬 테스트 통과 확인

### **배포 후 확인사항**

- [ ] Frontend 서비스 정상 접속 확인
- [ ] API 연동 테스트 통과 확인
- [ ] 주요 기능 동작 확인 (로그인, 상품 등록, 구매)
- [ ] 모니터링 대시보드 정상 동작 확인

**🎉 배포 완료! 안정적인 서비스 운영을 위해 주기적으로 모니터링해주세요.** 