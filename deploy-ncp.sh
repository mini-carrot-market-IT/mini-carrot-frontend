#!/bin/bash

# 🥕 Mini 당근마켓 Frontend - 네이버 클라우드 배포 스크립트
# 업데이트된 모든 기능이 포함된 최신 버전 배포

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
DOCKER_IMAGE="hwangsk0419/mini-carrot-frontend:latest"
NAMESPACE="tuk-trainee12"
DEPLOYMENT_NAME="frontend"

echo -e "${BLUE}🚀 Mini 당근마켓 Frontend NCP 배포 시작...${NC}"

# 1. 환경 확인
echo -e "${YELLOW}📋 1. 환경 확인...${NC}"
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl이 설치되지 않았습니다.${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker가 설치되지 않았습니다.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ kubectl과 Docker 확인 완료${NC}"

# 2. Kubernetes 클러스터 연결 확인
echo -e "${YELLOW}🔗 2. Kubernetes 클러스터 연결 확인...${NC}"
if ! kubectl get nodes &> /dev/null; then
    echo -e "${RED}❌ Kubernetes 클러스터에 연결할 수 없습니다.${NC}"
    echo -e "${YELLOW}💡 kubectl 설정을 확인해주세요.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Kubernetes 클러스터 연결 확인 완료${NC}"

# 3. 네임스페이스 확인
echo -e "${YELLOW}📦 3. 네임스페이스 확인...${NC}"
if ! kubectl get namespace ${NAMESPACE} &> /dev/null; then
    echo -e "${YELLOW}⚠️ 네임스페이스 ${NAMESPACE}가 존재하지 않습니다. 생성합니다...${NC}"
    kubectl create namespace ${NAMESPACE}
fi

echo -e "${GREEN}✅ 네임스페이스 ${NAMESPACE} 확인 완료${NC}"

# 4. Docker 이미지 빌드 및 푸시
echo -e "${YELLOW}🐳 4. Docker 이미지 빌드 및 푸시...${NC}"

# 로컬 이미지 빌드 (NCP 환경용)
echo -e "${BLUE}📦 Docker 이미지 빌드 중...${NC}"
docker build \
  --build-arg NEXT_PUBLIC_USER_SERVICE_URL=http://211.188.63.186:31207 \
  --build-arg NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://211.188.63.186:31251 \
  --build-arg NEXT_PUBLIC_ENVIRONMENT=production \
  --build-arg NEXT_PUBLIC_APP_VERSION=2.0.0 \
  -t ${DOCKER_IMAGE} .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker 이미지 빌드 성공${NC}"
else
    echo -e "${RED}❌ Docker 이미지 빌드 실패${NC}"
    exit 1
fi

# Docker Hub에 푸시
echo -e "${BLUE}📤 Docker 이미지 푸시 중...${NC}"
docker push ${DOCKER_IMAGE}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker 이미지 푸시 성공${NC}"
else
    echo -e "${RED}❌ Docker 이미지 푸시 실패${NC}"
    exit 1
fi

# 5. 기존 배포 정리 (있다면)
echo -e "${YELLOW}🧹 5. 기존 배포 정리...${NC}"
if kubectl get deployment ${DEPLOYMENT_NAME} -n ${NAMESPACE} &> /dev/null; then
    echo -e "${BLUE}기존 배포를 삭제합니다...${NC}"
    kubectl delete deployment ${DEPLOYMENT_NAME} -n ${NAMESPACE}
    kubectl delete service frontend-service -n ${NAMESPACE} 2>/dev/null || true
    kubectl delete configmap frontend-config -n ${NAMESPACE} 2>/dev/null || true
    
    # 삭제 완료 대기
    echo -e "${BLUE}삭제 완료 대기 중...${NC}"
    sleep 10
fi

# 6. Kubernetes 배포
echo -e "${YELLOW}☸️ 6. Kubernetes 배포...${NC}"
kubectl apply -f k8s/frontend-simple.yaml

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Kubernetes 배포 성공${NC}"
else
    echo -e "${RED}❌ Kubernetes 배포 실패${NC}"
    exit 1
fi

# 7. 배포 상태 확인
echo -e "${YELLOW}🔍 7. 배포 상태 확인...${NC}"

# Pod 시작 대기
echo -e "${BLUE}Pod 시작 대기 중...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Pod 시작 완료${NC}"
else
    echo -e "${RED}❌ Pod 시작 타임아웃${NC}"
    echo -e "${YELLOW}📝 Pod 상태 확인:${NC}"
    kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME}
    kubectl logs -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME} --tail=20
    exit 1
fi

# 8. 서비스 정보 확인
echo -e "${YELLOW}🌐 8. 서비스 정보 확인...${NC}"

# 노드 IP 가져오기
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}')
if [ -z "$NODE_IP" ]; then
    NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
fi

# 서비스 포트 가져오기
SERVICE_PORT=$(kubectl get service frontend-service -n ${NAMESPACE} -o jsonpath='{.spec.ports[0].nodePort}')

# 9. 헬스 체크
echo -e "${YELLOW}🏥 9. 헬스 체크...${NC}"
FRONTEND_URL="http://${NODE_IP}:${SERVICE_PORT}"

echo -e "${BLUE}Frontend URL: ${FRONTEND_URL}${NC}"
echo -e "${BLUE}헬스 체크 시작...${NC}"

for i in {1..15}; do
    if curl -f ${FRONTEND_URL} > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend 서비스 정상 동작 확인!${NC}"
        break
    else
        echo -e "${YELLOW}⏳ 서비스 시작 대기 중... ($i/15)${NC}"
        sleep 10
    fi
    
    if [ $i -eq 15 ]; then
        echo -e "${RED}❌ 헬스 체크 실패${NC}"
        echo -e "${YELLOW}📝 Pod 로그:${NC}"
        kubectl logs -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME} --tail=30
        echo -e "${YELLOW}📝 Pod 상태:${NC}"
        kubectl describe pods -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME}
        exit 1
    fi
done

# 10. 배포 완료 정보
echo -e "${GREEN}🎉 Frontend NCP 배포 완료!${NC}"
echo -e "${BLUE}📊 배포 정보:${NC}"
echo -e "  - 네임스페이스: ${NAMESPACE}"
echo -e "  - 배포명: ${DEPLOYMENT_NAME}"
echo -e "  - Docker 이미지: ${DOCKER_IMAGE}"
echo -e "  - Frontend URL: ${FRONTEND_URL}"
echo -e "  - API 테스트: ${FRONTEND_URL}/test-api"

# 11. 현재 상태 확인
echo -e "${BLUE}📋 현재 배포 상태:${NC}"
kubectl get all -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME}

echo -e "${GREEN}✨ Mini 당근마켓 Frontend가 네이버 클라우드에 성공적으로 배포되었습니다!${NC}"
echo -e "${BLUE}🔗 접속 URL: ${FRONTEND_URL}${NC}"

# 12. 추가 정보
echo -e "${YELLOW}📝 추가 명령어:${NC}"
echo -e "  로그 확인: kubectl logs -f -n ${NAMESPACE} deployment/${DEPLOYMENT_NAME}"
echo -e "  상태 확인: kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME}"
echo -e "  배포 삭제: kubectl delete -f k8s/frontend-simple.yaml" 