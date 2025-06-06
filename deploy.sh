#!/bin/bash

# 🥕 Mini 당근마켓 Frontend 배포 스크립트
# 각 마이크로서비스가 자체적으로 컨테이너 빌드 & 배포하는 전략

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
SERVICE_NAME="mini-carrot-frontend"
IMAGE_NAME="mini-carrot-frontend"
TAG="latest"
PORT="3001"

echo -e "${BLUE}🚀 Mini 당근마켓 Frontend 배포 시작...${NC}"

# 1. 환경 확인
echo -e "${YELLOW}📋 1. 환경 확인...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker가 설치되지 않았습니다.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Node.js/npm이 설치되지 않았습니다.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker와 Node.js 확인 완료${NC}"

# 2. 의존성 설치 및 빌드 테스트
echo -e "${YELLOW}📦 2. 의존성 설치 및 빌드 테스트...${NC}"
npm ci
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Next.js 빌드 성공${NC}"
else
    echo -e "${RED}❌ Next.js 빌드 실패${NC}"
    exit 1
fi

# 3. Docker 이미지 빌드
echo -e "${YELLOW}🐳 3. Docker 이미지 빌드...${NC}"
docker build -t ${IMAGE_NAME}:${TAG} .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker 이미지 빌드 성공${NC}"
else
    echo -e "${RED}❌ Docker 이미지 빌드 실패${NC}"
    exit 1
fi

# 4. 기존 컨테이너 정리
echo -e "${YELLOW}🧹 4. 기존 컨테이너 정리...${NC}"
if docker ps -q -f name=${SERVICE_NAME} | grep -q .; then
    docker stop ${SERVICE_NAME}
    docker rm ${SERVICE_NAME}
    echo -e "${GREEN}✅ 기존 컨테이너 정리 완료${NC}"
fi

# 5. 새 컨테이너 실행
echo -e "${YELLOW}🚀 5. 새 컨테이너 실행...${NC}"
docker run -d \
    --name ${SERVICE_NAME} \
    -p ${PORT}:3000 \
    -e NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:8080 \
    -e NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://localhost:8082 \
    ${IMAGE_NAME}:${TAG}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 컨테이너 실행 성공${NC}"
else
    echo -e "${RED}❌ 컨테이너 실행 실패${NC}"
    exit 1
fi

# 6. 헬스 체크
echo -e "${YELLOW}🏥 6. 헬스 체크...${NC}"
sleep 5

for i in {1..10}; do
    if curl -f http://localhost:${PORT} > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend 서비스 정상 실행 중 (http://localhost:${PORT})${NC}"
        break
    else
        echo -e "${YELLOW}⏳ 서비스 시작 대기 중... ($i/10)${NC}"
        sleep 3
    fi
    
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ 헬스 체크 실패 - 서비스가 시작되지 않았습니다.${NC}"
        echo -e "${YELLOW}📝 컨테이너 로그:${NC}"
        docker logs ${SERVICE_NAME}
        exit 1
    fi
done

# 7. 배포 완료 정보
echo -e "${GREEN}🎉 Frontend 배포 완료!${NC}"
echo -e "${BLUE}📊 배포 정보:${NC}"
echo -e "  - 서비스 이름: ${SERVICE_NAME}"
echo -e "  - 이미지: ${IMAGE_NAME}:${TAG}"
echo -e "  - 포트: ${PORT}"
echo -e "  - URL: http://localhost:${PORT}"
echo -e "  - API 테스트: http://localhost:${PORT}/test-api"

# 8. 컨테이너 상태 확인
echo -e "${BLUE}📋 현재 실행 중인 컨테이너:${NC}"
docker ps --filter name=${SERVICE_NAME} --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "${GREEN}✨ Frontend 마이크로서비스 배포가 완료되었습니다!${NC}" 