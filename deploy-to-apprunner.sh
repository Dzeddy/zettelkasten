#!/bin/bash

# Configuration
AWS_REGION="us-east-1"  # Change this to your preferred region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPOSITORY_NAME="zettelkasten-backend"
IMAGE_TAG="latest"
SERVICE_NAME="zettelkasten-backend"

echo "🚀 Starting deployment to AWS AppRunner..."

# Step 1: Create ECR repository if it doesn't exist
echo "📦 Creating ECR repository..."
aws ecr describe-repositories --repository-names $REPOSITORY_NAME --region $AWS_REGION 2>/dev/null || \
aws ecr create-repository --repository-name $REPOSITORY_NAME --region $AWS_REGION

# Step 2: Get ECR login token
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Step 3: Build Docker image
echo "🔨 Building Docker image..."
cd backend
docker build -t $REPOSITORY_NAME:$IMAGE_TAG .

# Step 4: Tag image for ECR
echo "🏷️  Tagging image for ECR..."
docker tag $REPOSITORY_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME:$IMAGE_TAG

# Step 5: Push image to ECR
echo "⬆️  Pushing image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME:$IMAGE_TAG

# Step 6: Create AppRunner service (if it doesn't exist)
echo "🏃 Creating AppRunner service..."

# Check if service exists
SERVICE_ARN=$(aws apprunner list-services --region $AWS_REGION --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" --output text)

if [ -z "$SERVICE_ARN" ]; then
    echo "Creating new AppRunner service..."
    aws apprunner create-service \
        --service-name $SERVICE_NAME \
        --source-configuration '{
            "ImageRepository": {
                "ImageIdentifier": "'$AWS_ACCOUNT_ID'.dkr.ecr.'$AWS_REGION'.amazonaws.com/'$REPOSITORY_NAME':'$IMAGE_TAG'",
                "ImageConfiguration": {
                    "Port": "8080",
                    "RuntimeEnvironmentVariables": {
                        "PORT": "8080"
                    }
                },
                "ImageRepositoryType": "ECR"
            },
            "AutoDeploymentsEnabled": true
        }' \
        --instance-configuration '{
            "Cpu": "1 vCPU",
            "Memory": "2 GB"
        }' \
        --region $AWS_REGION
else
    echo "Updating existing AppRunner service..."
    aws apprunner update-service \
        --service-arn $SERVICE_ARN \
        --source-configuration '{
            "ImageRepository": {
                "ImageIdentifier": "'$AWS_ACCOUNT_ID'.dkr.ecr.'$AWS_REGION'.amazonaws.com/'$REPOSITORY_NAME':'$IMAGE_TAG'",
                "ImageConfiguration": {
                    "Port": "8080",
                    "RuntimeEnvironmentVariables": {
                        "PORT": "8080"
                    }
                },
                "ImageRepositoryType": "ECR"
            },
            "AutoDeploymentsEnabled": true
        }' \
        --region $AWS_REGION
fi

echo "✅ Deployment initiated! Check the AWS AppRunner console for status."
echo "🌐 Your service will be available at the AppRunner service URL once deployment completes." 