# Docker Deployment with GitHub Actions

This document explains the automated Docker build and deployment setup for the Zettelkasten backend using GitHub Actions and GitHub Container Registry (GHCR).

## 🚀 Quick Start

1. **Push to main branch** - The workflow will automatically build and publish your Docker image
2. **Make the package public** (see instructions below)
3. **Use the published image** in your AWS deployments

## 📁 Files Added

- `.github/workflows/docker-build-publish.yml` - Main workflow file
- `.github/workflows/README.md` - Detailed workflow documentation
- `scripts/test-docker.sh` - Local testing script
- `DOCKER_DEPLOYMENT.md` - This guide

## 🔧 Workflow Features

### Automatic Triggers
- ✅ Push to `main` or `develop` branches
- ✅ Pull requests to `main`
- ✅ GitHub releases
- ✅ Only runs when backend files change

### Multi-Platform Support
- ✅ Builds for `linux/amd64` (Intel/AMD)
- ✅ Builds for `linux/arm64` (ARM/Apple Silicon)
- ✅ AWS-compatible images

### Security & Quality
- ✅ Vulnerability scanning with Trivy
- ✅ Build attestation for supply chain security
- ✅ Non-root user in containers
- ✅ Layer caching for faster builds

## 📦 Published Image Location

Your images will be available at:
```
ghcr.io/[your-github-username]/zettlekasten/zettelkasten-backend
```

### Available Tags
- `latest` - Latest from main branch
- `main` - Latest from main branch  
- `develop` - Latest from develop branch
- `pr-123` - Pull request builds
- `main-abc1234` - Commit-specific builds
- `v1.0.0` - Release versions

## 🧪 Testing Locally

Before pushing, test your Docker build locally:

```bash
# Run the test script
./scripts/test-docker.sh

# Or manually build and test
cd backend
docker build -t zettelkasten-backend .
docker run -p 8080:8080 zettelkasten-backend
```

## 🌐 Making Images Public

To make your Docker images publicly accessible:

1. Go to your GitHub repository
2. Click the "Packages" tab
3. Click on `zettelkasten-backend`
4. Go to "Package settings"
5. Scroll to "Danger Zone"
6. Click "Change visibility" → "Public"

## ☁️ AWS Deployment Examples

### AWS ECS/Fargate

Create a task definition:
```json
{
  "family": "zettelkasten-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "ghcr.io/[username]/zettlekasten/zettelkasten-backend:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "MONGO_URI",
          "value": "mongodb://your-mongo-host:27017/zettelkasten"
        },
        {
          "name": "REDIS_URL", 
          "value": "redis://your-redis-host:6379"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/zettelkasten-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## 🔐 Environment Variables

Your backend expects these environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `PORT` | Port to listen on | No (defaults to 8080) |
| `PINECONE_API_KEY` | Pinecone API key | No | 