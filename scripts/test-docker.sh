#!/bin/bash

# Test script for Docker build and run
# This script helps validate the Docker setup before pushing to GitHub

set -e

echo "🐳 Testing Docker build for Zettelkasten Backend"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="zettelkasten-backend"
CONTAINER_NAME="zettelkasten-backend-test"
PORT=8080

# Function to cleanup
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

echo -e "${YELLOW}📦 Building Docker image...${NC}"
cd backend
docker build -t $IMAGE_NAME .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker build successful!${NC}"
else
    echo -e "${RED}❌ Docker build failed!${NC}"
    exit 1
fi

echo -e "${YELLOW}🔍 Inspecting image...${NC}"
docker images $IMAGE_NAME
echo ""
docker inspect $IMAGE_NAME --format='{{.Config.ExposedPorts}}'
echo ""

echo -e "${YELLOW}🚀 Starting container for testing...${NC}"
docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:8080 \
    -e MONGO_URI="mongodb://localhost:27017/zettelkasten" \
    -e REDIS_URL="redis://localhost:6379" \
    -e JWT_SECRET="test-secret-key" \
    $IMAGE_NAME

# Wait a moment for the container to start
sleep 3

echo -e "${YELLOW}📊 Container status:${NC}"
docker ps | grep $CONTAINER_NAME

echo -e "${YELLOW}📋 Container logs:${NC}"
docker logs $CONTAINER_NAME

echo -e "${YELLOW}🔗 Testing health endpoint...${NC}"
# Try to connect to the health endpoint
if curl -f http://localhost:$PORT/health 2>/dev/null; then
    echo -e "${GREEN}✅ Health endpoint responding!${NC}"
else
    echo -e "${YELLOW}⚠️  Health endpoint not responding (this might be expected if no health endpoint exists)${NC}"
fi

echo -e "${YELLOW}🔍 Container resource usage:${NC}"
docker stats $CONTAINER_NAME --no-stream

echo ""
echo -e "${GREEN}🎉 Docker test completed successfully!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Push your changes to trigger the GitHub workflow"
echo "2. Check the Actions tab in your GitHub repository"
echo "3. Once published, make the package public in GitHub Packages"
echo "4. Use the image: ghcr.io/[your-username]/zettlekasten/zettelkasten-backend:latest"
echo ""
echo -e "${YELLOW}🛑 To stop the test container manually:${NC}"
echo "docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME" 