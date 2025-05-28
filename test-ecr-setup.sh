#!/bin/bash

# Test script to verify ECR deployment setup
# This script checks all prerequisites without actually deploying

echo "🧪 Testing ECR Deployment Setup..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Function to print test results
test_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

test_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((ERRORS++))
}

test_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "📋 Checking prerequisites..."

# Check if AWS CLI is installed
if command -v aws &> /dev/null; then
    test_pass "AWS CLI is installed"
    
    # Check AWS credentials
    if aws sts get-caller-identity &> /dev/null; then
        test_pass "AWS credentials are configured"
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        echo "   Account ID: $ACCOUNT_ID"
    else
        test_fail "AWS credentials are not configured (run 'aws configure')"
    fi
else
    test_fail "AWS CLI is not installed"
fi

# Check if Docker is installed
if command -v docker &> /dev/null; then
    test_pass "Docker is installed"
    
    # Check if Docker is running
    if docker info &> /dev/null; then
        test_pass "Docker is running"
    else
        test_fail "Docker is not running (start Docker Desktop)"
    fi
else
    test_fail "Docker is not installed"
fi

echo ""
echo "📁 Checking files..."

# Check if required files exist
if [ -f "deploy-ecr.sh" ]; then
    test_pass "deploy-ecr.sh exists"
    if [ -x "deploy-ecr.sh" ]; then
        test_pass "deploy-ecr.sh is executable"
    else
        test_fail "deploy-ecr.sh is not executable (run 'chmod +x deploy-ecr.sh')"
    fi
else
    test_fail "deploy-ecr.sh not found"
fi

if [ -f ".ecr-config" ]; then
    test_pass ".ecr-config exists"
else
    test_warn ".ecr-config not found (will use default values)"
fi

if [ -f ".git/hooks/pre-push" ]; then
    test_pass "Git pre-push hook exists"
    if [ -x ".git/hooks/pre-push" ]; then
        test_pass "Git pre-push hook is executable"
    else
        test_fail "Git pre-push hook is not executable (run 'chmod +x .git/hooks/pre-push')"
    fi
else
    test_fail "Git pre-push hook not found"
fi

if [ -f "backend/Dockerfile" ]; then
    test_pass "Dockerfile exists in backend/"
else
    test_fail "Dockerfile not found in backend/"
fi

echo ""
echo "⚙️  Checking configuration..."

# Load and display configuration
if [ -f ".ecr-config" ]; then
    source .ecr-config
    echo "   AWS Region: $AWS_REGION"
    echo "   AWS Account ID: $AWS_ACCOUNT_ID"
    echo "   Repository Name: $REPOSITORY_NAME"
    echo "   Image Tag: $IMAGE_TAG"
    echo "   Dockerfile Path: $DOCKERFILE_PATH"
    
    if [ -n "$SKIP_BRANCHES" ]; then
        echo "   Skip Branches: $SKIP_BRANCHES"
    fi
else
    echo "   Using default configuration"
fi

echo ""
echo "🔍 Testing ECR access..."

# Test ECR access (without actually doing anything)
AWS_REGION=${AWS_REGION:-"us-east-1"}
REPOSITORY_NAME=${REPOSITORY_NAME:-"zettelkasten-backend"}

if command -v aws &> /dev/null && aws sts get-caller-identity &> /dev/null; then
    if aws ecr describe-repositories --repository-names $REPOSITORY_NAME --region $AWS_REGION &> /dev/null; then
        test_pass "ECR repository '$REPOSITORY_NAME' exists"
    else
        test_warn "ECR repository '$REPOSITORY_NAME' does not exist (will be created automatically)"
    fi
    
    # Test ECR login (without actually logging in)
    if aws ecr get-login-password --region $AWS_REGION &> /dev/null; then
        test_pass "ECR authentication test passed"
    else
        test_fail "ECR authentication test failed (check permissions)"
    fi
fi

echo ""
echo "📊 Summary"
echo "=========="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your ECR deployment setup is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Make some changes to your code"
    echo "2. Run: git add . && git commit -m 'Test deployment'"
    echo "3. Run: git push"
    echo "4. Watch the automatic deployment happen!"
    echo ""
    echo "Or test manually with: ./deploy-ecr.sh"
else
    echo -e "${RED}❌ Found $ERRORS error(s). Please fix them before using the deployment.${NC}"
    echo ""
    echo "Common fixes:"
    echo "- Install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    echo "- Install Docker: https://docs.docker.com/get-docker/"
    echo "- Configure AWS: aws configure"
    echo "- Start Docker Desktop"
    echo "- Fix file permissions: chmod +x deploy-ecr.sh .git/hooks/pre-push"
fi

exit $ERRORS 