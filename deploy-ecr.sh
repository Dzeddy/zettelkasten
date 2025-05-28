#!/bin/bash

# Standalone ECR Deployment Script
# This script can be run manually or called by Git hooks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🔄 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Get the root directory of the git repository
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT"

# Load configuration
if [ -f ".ecr-config" ]; then
    source .ecr-config
    print_status "Loaded configuration from .ecr-config"
else
    print_warning "No .ecr-config found, using default values"
    AWS_REGION="us-east-1"
    AWS_ACCOUNT_ID="471112671504"
    REPOSITORY_NAME="zettelkasten-backend"
    IMAGE_TAG="latest"
    DOCKERFILE_PATH="backend"
fi

# Check if we should skip deployment for current branch
if [ -n "$SKIP_BRANCHES" ] && git rev-parse --git-dir > /dev/null 2>&1; then
    CURRENT_BRANCH=$(git branch --show-current)
    for skip_pattern in $(echo $SKIP_BRANCHES | tr "," "\n"); do
        if [[ "$CURRENT_BRANCH" == $skip_pattern ]]; then
            print_warning "Skipping deployment for branch: $CURRENT_BRANCH"
            exit 0
        fi
    done
fi

print_status "Starting ECR deployment for zettelkasten-backend..."

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    echo "   Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install it first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Dockerfile exists
if [ ! -f "$DOCKERFILE_PATH/Dockerfile" ]; then
    print_error "Dockerfile not found at $DOCKERFILE_PATH/Dockerfile"
    exit 1
fi

print_success "All prerequisites met!"

# Set up variables
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
FULL_IMAGE_URI="$ECR_URI/$REPOSITORY_NAME:$IMAGE_TAG"

print_status "Configuration:"
echo "  AWS Region: $AWS_REGION"
echo "  AWS Account ID: $AWS_ACCOUNT_ID"
echo "  Repository: $REPOSITORY_NAME"
echo "  Image Tag: $IMAGE_TAG"
echo "  Dockerfile Path: $DOCKERFILE_PATH"
echo "  Full Image URI: $FULL_IMAGE_URI"

# Step 1: Create ECR repository if it doesn't exist
print_status "Ensuring ECR repository exists..."
aws ecr describe-repositories --repository-names $REPOSITORY_NAME --region $AWS_REGION 2>/dev/null || {
    print_status "Creating ECR repository..."
    aws ecr create-repository --repository-name $REPOSITORY_NAME --region $AWS_REGION
    print_success "ECR repository created!"
}

# Step 2: Authenticate Docker to ECR
print_status "Authenticating Docker to ECR..."
if aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI; then
    print_success "Successfully authenticated with ECR!"
else
    print_error "Failed to authenticate with ECR"
    exit 1
fi

# Step 3: Build Docker image
print_status "Building Docker image..."
cd "$DOCKERFILE_PATH"
if [ "$VERBOSE" = "true" ]; then
    docker build -t $REPOSITORY_NAME .
else
    docker build -t $REPOSITORY_NAME . > /dev/null
fi

if [ $? -eq 0 ]; then
    print_success "Docker image built successfully!"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Step 4: Tag image for ECR
print_status "Tagging image for ECR..."
if docker tag $REPOSITORY_NAME:latest $FULL_IMAGE_URI; then
    print_success "Image tagged successfully!"
else
    print_error "Failed to tag Docker image"
    exit 1
fi

# Step 5: Push image to ECR
print_status "Pushing image to ECR..."
if [ "$VERBOSE" = "true" ]; then
    docker push $FULL_IMAGE_URI
else
    docker push $FULL_IMAGE_URI > /dev/null
fi

if [ $? -eq 0 ]; then
    print_success "Successfully pushed image to ECR!"
else
    print_error "Failed to push Docker image to ECR"
    exit 1
fi

# Step 6: Clean up local images (optional)
if [ "$1" = "--cleanup" ]; then
    print_status "Cleaning up local images..."
    docker rmi $REPOSITORY_NAME:latest $FULL_IMAGE_URI 2>/dev/null || true
    print_success "Local images cleaned up!"
fi

print_success "🎉 ECR deployment completed successfully!"
echo ""
echo "📋 Summary:"
echo "  Image URI: $FULL_IMAGE_URI"
echo "  Region: $AWS_REGION"
echo "  Repository: $REPOSITORY_NAME"
echo "  Tag: $IMAGE_TAG"
echo ""
echo "🚀 Your image is now available in AWS ECR and ready for deployment!"

# Return to original directory
cd "$REPO_ROOT" 