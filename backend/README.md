# Zettelkasten Backend API

A scalable backend for semantic search over personal knowledge bases. This system allows users to upload their notes from various platforms (Notion, Obsidian, Roam, Logseq) and perform intelligent semantic search using vector embeddings.

## Features

- **Multi-format support**: Notion, Obsidian, Roam, Logseq, and standard text files
- **Intelligent text chunking**: Preserves document structure while optimizing for search
- **Vector embeddings**: Uses OpenAI embeddings for semantic understanding
- **Semantic search**: Powered by Pinecone vector database
- **Background processing**: Async job queue for large uploads with persistence
- **Job persistence**: Automatically resumes interrupted jobs on server restart
- **Detailed logging**: Real-time progress tracking for document processing
- **Redis caching**: Performance optimization for frequent queries
- **JWT authentication**: Secure user management
- **Rate limiting**: API protection and fair usage
- **Graceful shutdown**: Proper handling of in-progress jobs during server shutdown
- **Docker support**: Easy deployment and development

## Architecture

- **Go Backend**: Chi router with modular service architecture
- **MongoDB**: User data and document metadata storage
- **Redis**: Caching, rate limiting, and job queue
- **Pinecone**: Vector storage and similarity search
- **Nginx**: Reverse proxy with rate limiting
- **Docker**: Containerized deployment

## Quick Start

### Prerequisites

- Go 1.21+
- Docker and Docker Compose
- API keys for:
  - OpenAI (for embeddings)
  - Pinecone (for vector storage)
  - Email service (SendGrid, Resend, etc.)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zettelkasten-backend
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up
   ```

4. **Or run locally**
   ```bash
   # Install dependencies
   go mod download
   
   # Start MongoDB and Redis
   docker-compose up mongo redis
   
   # Run the application
   go run cmd/main.go
   ```

The API will be available at `http://localhost:8080`

## API Documentation

### Authentication

#### Sign Up
```bash
curl -X POST http://localhost:8080/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "name": "John Doe"
  }'
```

#### Login
```bash
curl -X POST http://localhost:8080/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'
```

### Document Upload

```bash
curl -X POST http://localhost:8080/v1/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "files[]=@obsidian_vault.zip" \
  -F "source_type=obsidian"
```

### Semantic Search

```bash
curl -X POST http://localhost:8080/v1/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning optimization",
    "limit": 10,
    "similarity_threshold": 0.8
  }'
```

## Project Structure

```
.
├── cmd/
│   └── main.go              # Application entry point
├── internal/
│   ├── api/                 # HTTP handlers
│   │   ├── auth_handler.go
│   │   ├── document_handler.go
│   │   ├── search_handler.go
│   │   ├── user_handler.go
│   │   ├── analytics_handler.go
│   │   └── utils.go
│   ├── config/              # Configuration management
│   │   └── config.go
│   ├── database/            # Database clients
│   │   ├── mongodb.go
│   │   ├── redis.go
│   │   └── pinecone.go
│   ├── middleware/          # HTTP middleware
│   │   ├── auth.go
│   │   └── ratelimit.go
│   ├── models/              # Data models
│   │   ├── user.go
│   │   ├── document.go
│   │   ├── chunk.go
│   │   └── job.go
│   ├── parsers/             # Document parsers
│   │   ├── interface.go
│   │   ├── obsidian.go
│   │   ├── notion.go
│   │   ├── roam.go
│   │   ├── logseq.go
│   │   └── standard.go
│   ├── queue/               # Job queue system
│   │   └── job_queue.go
│   └── services/            # Business logic
│       ├── auth.go
│       ├── document.go
│       ├── embedding.go
│       ├── search.go
│       └── email.go
├── docker-compose.yml       # Development setup
├── Dockerfile               # Container build
├── go.mod                   # Go dependencies
└── README.md               # This file
```

## Configuration

Environment variables (see `env.example`):

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 8080) |
| `MONGO_URI` | MongoDB connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `PINECONE_API_KEY` | Pinecone API key | Yes |
| `PINECONE_ENVIRONMENT` | Pinecone environment | Yes |
| `PINECONE_INDEX` | Pinecone index name | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `EMAIL_API_KEY` | Email service API key | Yes |
| `EMAIL_FROM` | From email address | Yes |

## Job Processing & Persistence

The backend includes a robust job processing system with the following features:

### Real-time Logging
- **File Processing Status**: Logs show which file is currently being processed
- **Chunk Progress**: Detailed progress tracking for each chunk within a document
- **Error Reporting**: Comprehensive error logging with context
- **Performance Metrics**: Processing time and throughput information

### Job Persistence
- **Automatic Recovery**: Jobs interrupted by server restarts are automatically resumed
- **State Tracking**: Job status is persisted in Redis with 7-day retention
- **Graceful Shutdown**: Server shutdown waits for current jobs to complete or safely re-queues them
- **Error Handling**: Failed jobs are marked appropriately with detailed error messages

### Example Log Output
```
2024/01/15 10:30:15 Starting job queue processor...
2024/01/15 10:30:15 Checking for unprocessed jobs to resume...
2024/01/15 10:30:15 No interrupted jobs found to resume
2024/01/15 10:30:20 Queued file for processing: my_notes.zip (Job ID: abc123, User ID: user456, Source: obsidian)
2024/01/15 10:30:20 Processing file: my_notes.zip (Job ID: abc123, User ID: user456, Source: obsidian)
2024/01/15 10:30:20 Starting document processing for file: my_notes.zip (Job: abc123)
2024/01/15 10:30:20 Using obsidian parser for file: my_notes.zip
2024/01/15 10:30:21 Successfully parsed file my_notes.zip into 45 chunks
2024/01/15 10:30:21 Processing 45 chunks for file: my_notes.zip
2024/01/15 10:30:21 Processing chunk 1/45 for file: my_notes.zip
2024/01/15 10:30:22 Processing chunk 2/45 for file: my_notes.zip
...
2024/01/15 10:31:15 Successfully processed all 45 chunks for file: my_notes.zip
2024/01/15 10:31:15 Document processing completed successfully for file: my_notes.zip
2024/01/15 10:31:15 Successfully processed file: my_notes.zip
```

## Supported File Formats

### Obsidian
- Markdown files with frontmatter
- Automatic tag extraction
- Header-based chunking

### Notion
- JSON exports
- Page hierarchy preservation
- Property extraction

### Roam Research
- JSON/EDN exports
- Block structure preservation
- Bi-directional links

### Logseq
- Markdown with block structure
- Tag and property extraction

### Standard
- Plain text files
- Markdown files
- PDF files (future)

## Rate Limits

- Authentication endpoints: 5 requests/minute
- Upload endpoints: 10 requests/hour
- Search endpoints: 100 requests/minute
- Other endpoints: 60 requests/minute

## Development

### Running Tests
```bash
go test ./...
```

### Building
```bash
go build -o zettelkasten ./cmd/main.go
```

### Docker Build
```bash
docker build -t zettelkasten-backend .
```

## Production Deployment

1. **Set up SSL certificates**
2. **Configure environment variables**
3. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Monitoring and Observability

- Structured JSON logging
- Request/response logging
- Error tracking integration ready
- Health check endpoint: `/health`

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting per user
- Input validation and sanitization
- CORS configuration
- SQL injection prevention

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Webhook notifications
- [ ] Advanced search filters
- [ ] Document versioning
- [ ] Collaborative features
- [ ] Alternative embedding models
- [ ] Full-text search alongside vector search
- [ ] Mobile app API
- [ ] Browser extension support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API specification

---

Built with ❤️ for the second brain community 