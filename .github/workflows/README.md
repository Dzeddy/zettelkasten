# GitHub Workflows Documentation

## Docker Build and Publish Workflow

This workflow automatically builds and publishes the Zettelkasten backend Docker image to GitHub Container Registry (GHCR).

### Workflow Triggers

The workflow runs on:
- **Push to main/develop**: Builds and publishes with appropriate tags
- **Pull Requests to main**: Builds image for testing (tagged with PR number)
- **Releases**: Builds and publishes with semantic version tags

### Published Image Location

The Docker images are published to:
```
ghcr.io/[your-username]/zettlekasten/zettelkasten-backend
```

### Available Tags

- `latest` - Latest build from main branch
- `main` - Latest build from main branch
- `develop` - Latest build from develop branch
- `pr-[number]` - Pull request builds
- `[branch]-[sha]` - Branch builds with commit SHA
- `v[version]` - Release versions (e.g., v1.0.0, v1.0)

### Using the Published Image

#### Pull and Run Locally
```bash
# Pull the latest image
docker pull ghcr.io/[your-username]/zettlekasten/zettelkasten-backend:latest

# Run the container
docker run -p 8080:8080 \
  -e MONGO_URI="your-mongo-connection-string" \
  -e REDIS_URL="your-redis-connection-string" \
  ghcr.io/[your-username]/zettlekasten/zettelkasten-backend:latest
```

#### AWS Deployment

The image is AWS-compatible and can be deployed to:

**AWS ECS/Fargate:**
```json
{
  "family": "zettelkasten-backend",
  "taskDefinition": {
    "containerDefinitions": [
      {
        "name": "backend",
        "image": "ghcr.io/[your-username]/zettlekasten/zettelkasten-backend:latest",
        "portMappings": [
          {
            "containerPort": 8080,
            "protocol": "tcp"
          }
        ],
        "environment": [
          {
            "name": "MONGO_URI",
            "value": "your-mongo-connection-string"
          }
        ]
      }
    ]
  }
}
```

**AWS Lambda (with container support):**
```bash
# Deploy to Lambda
aws lambda create-function \
  --function-name zettelkasten-backend \
  --package-type Image \
  --code ImageUri=ghcr.io/[your-username]/zettlekasten/zettelkasten-backend:latest \
  --role arn:aws:iam::your-account:role/lambda-execution-role
```

**AWS App Runner:**
```yaml
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "Using pre-built image from GHCR"
run:
  runtime-version: latest
  command: ./main
  network:
    port: 8080
    env: PORT
```

### Making Images Public

To make your images publicly accessible:

1. Go to your GitHub repository
2. Navigate to "Packages" tab
3. Click on the `zettelkasten-backend` package
4. Go to "Package settings"
5. Scroll down to "Danger Zone"
6. Click "Change visibility" and select "Public"

### Security Features

The workflow includes:
- **Vulnerability scanning** with Trivy
- **Build attestation** for supply chain security
- **Multi-platform builds** (AMD64 and ARM64)
- **Layer caching** for faster builds
- **Non-root user** in the container for security

### Environment Variables

The backend expects these environment variables:
- `MONGO_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `PORT` - Port to listen on (defaults to 8080)
- `JWT_SECRET` - Secret for JWT token signing
- `PINECONE_API_KEY` - Pinecone API key (if using vector search)

### Troubleshooting

**Build Failures:**
- Check the Actions tab for detailed logs
- Ensure the Dockerfile builds successfully locally
- Verify all dependencies are properly specified in go.mod

**Permission Issues:**
- Ensure the repository has "Actions" enabled
- Check that the `GITHUB_TOKEN` has package write permissions
- Verify the workflow has the correct permissions block

**Image Pull Issues:**
- Make sure the package is set to public visibility
- Use the correct image name format
- Check that the tag exists in the package registry 