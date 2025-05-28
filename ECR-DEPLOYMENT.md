# ECR Deployment Setup

This repository is configured to automatically build and push Docker images to AWS ECR when you push to Git. Here's how it works and how to use it.

## 🚀 Automatic Deployment

When you run `git push`, the following happens automatically:

1. **Pre-push Hook Triggers**: Git runs the pre-push hook before pushing your code
2. **ECR Authentication**: Authenticates Docker with your AWS ECR registry
3. **Image Build**: Builds the Docker image from `backend/Dockerfile`
4. **Image Tag**: Tags the image for ECR
5. **Image Push**: Pushes the image to ECR
6. **Git Push Continues**: If successful, your git push continues normally

## 📋 Prerequisites

Before using the automatic deployment, ensure you have:

1. **AWS CLI installed and configured**:
   ```bash
   aws configure
   ```

2. **Docker installed and running**:
   - Download from [docker.com](https://docs.docker.com/get-docker/)
   - Make sure Docker Desktop is running

3. **AWS ECR permissions**:
   - Your AWS credentials must have ECR permissions
   - The ECR repository will be created automatically if it doesn't exist

## ⚙️ Configuration

Edit the `.ecr-config` file to customize your deployment settings:

```bash
# ECR Deployment Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=471112671504
REPOSITORY_NAME=zettelkasten-backend
IMAGE_TAG=latest
DOCKERFILE_PATH=backend

# Optional: Skip deployment on certain branches
SKIP_BRANCHES="develop,feature/*"

# Optional: Enable verbose logging
VERBOSE=false
```

## 🛠️ Manual Deployment

You can also run the deployment manually:

```bash
# Basic deployment
./deploy-ecr.sh

# Deployment with cleanup (removes local images after push)
./deploy-ecr.sh --cleanup

# Verbose deployment (shows all Docker output)
VERBOSE=true ./deploy-ecr.sh
```

## 🔧 Disabling Automatic Deployment

If you want to disable automatic deployment temporarily:

### Option 1: Skip for specific branches
Add branch names to `SKIP_BRANCHES` in `.ecr-config`:
```bash
SKIP_BRANCHES="develop,feature/*,no-deploy"
```

### Option 2: Disable the hook temporarily
```bash
# Rename the hook to disable it
mv .git/hooks/pre-push .git/hooks/pre-push.disabled

# Re-enable later
mv .git/hooks/pre-push.disabled .git/hooks/pre-push
```

### Option 3: Push without hooks
```bash
git push --no-verify
```

## 📊 What Gets Deployed

- **Source**: `backend/Dockerfile`
- **Image Name**: `zettelkasten-backend:latest`
- **ECR URI**: `471112671504.dkr.ecr.us-east-1.amazonaws.com/zettelkasten-backend:latest`

## 🐛 Troubleshooting

### Common Issues

1. **"AWS CLI not found"**:
   - Install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

2. **"Docker not running"**:
   - Start Docker Desktop
   - Check with: `docker info`

3. **"AWS credentials not configured"**:
   - Run: `aws configure`
   - Or set environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

4. **"Permission denied"**:
   - Check AWS IAM permissions for ECR
   - Ensure your user has `ecr:*` permissions

5. **"Repository does not exist"**:
   - The script will create the repository automatically
   - If it fails, create manually in AWS Console

### Debug Mode

Run with verbose output to see detailed logs:

```bash
VERBOSE=true ./deploy-ecr.sh
```

### Manual Commands

If you need to run the commands manually:

```bash
# 1. Authenticate
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 471112671504.dkr.ecr.us-east-1.amazonaws.com

# 2. Build
cd backend
docker build -t zettelkasten-backend .

# 3. Tag
docker tag zettelkasten-backend:latest 471112671504.dkr.ecr.us-east-1.amazonaws.com/zettelkasten-backend:latest

# 4. Push
docker push 471112671504.dkr.ecr.us-east-1.amazonaws.com/zettelkasten-backend:latest
```

## 📁 Files Overview

- `.git/hooks/pre-push` - Git hook that triggers on `git push`
- `deploy-ecr.sh` - Standalone deployment script
- `.ecr-config` - Configuration file for deployment settings
- `ECR-DEPLOYMENT.md` - This documentation file

## 🔄 Workflow

```
git add .
git commit -m "Your changes"
git push origin main
    ↓
Pre-push hook runs
    ↓
Docker image builds
    ↓
Image pushes to ECR
    ↓
Git push completes
    ↓
✅ Done!
```

Your Docker image is now available in ECR and ready for deployment to AWS services like ECS, EKS, App Runner, etc. 