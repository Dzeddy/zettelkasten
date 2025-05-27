# Zettelkasten – Connected Knowledge Platform

## Overview

Zettelkasten is a full‑stack platform that transforms heterogeneous notes into an interlinked knowledge graph. It ingests files or exports from Notion, Obsidian, Roam Research, Logseq, and plain text, fragments them into *atomic* note “zettels”, embeds each fragment with OpenAI, and persists vectors in Pinecone for millisecond‑scale semantic search.

### What is a Zettelkasten?

A *Zettelkasten* (“slip‑box”) is a knowledge management technique introduced by sociologist Niklas Luhmann. Every idea is stored in its own atomic note and linked bidirectionally to related notes. The result is a densely connected graph that supports emergent insight and long‑term retrieval.

This project automates the hard parts:

* **Automatic chunking** – documents are split into ≤ 100‑sentence fragments.
* **Semantic embeddings** – each chunk converted to a 1 536‑D vector via OpenAI.
* **Vector search** – Pinecone cosine similarity finds relevant notes across your corpus.
* **Typed filters & analytics** – MongoDB metadata plus Redis rate limits and caches.
* **Realtime events** – WebSockets broadcast job progress and search usage.
* **Modern UI** – React + TypeScript + Tailwind for dark/light dashboards.

## Architecture

```
┌──────────┐      HTTP/WS       ┌───────────────┐
│ Frontend │  ◄───────────────► │ Go API (chi)  │
└──────────┘                    ├───────────────┤
                               │ Services      │
                               │  • Auth (JWT) │
                               │  • Documents  │
                               │  • Search     │
                               │  • Events     │
                               └───────────────┘
                                   │
        ┌────────────┬─────────────┼─────────────┐
        │            │             │             │
   MongoDB      Redis cache   Pinecone DB   Email provider
 (metadata)    & queues       (vectors)     (SMTP/API)
```

* **Language**: Go 1.22 backend, React + TS 5 frontend.
* **Persistence**: MongoDB for documents/users, Redis for rate‑limits + job queue.
* **Vector store**: Pinecone Serverless (1536‑dimensional cosine).
* **Auth**: JWT access & refresh, Bcrypt passwords, email verification.
* **CI**: `go test ./...` + `npm test` (add as needed).

## Quick Start

### Prerequisites

| Dependency | Version                       | Purpose          |
| ---------- | ----------------------------- | ---------------- |
| Go         | ≥1.22                         | backend build    |
| Node / npm | ≥20 / ≥10                     | frontend build   |
| MongoDB    | ≥6                            | metadata store   |
| Redis      | ≥7                            | caching & queues |
| Pinecone   | account                       | vector index     |
| OpenAI key | any embedding model supported |                  |

### Environment

Create a `.env` at `backend/` (or export variables) with at least:

```
PORT=8080
MONGO_URI=mongodb://localhost:27017/zettelkasten
REDIS_ADDR=localhost:6379
JWT_SECRET=change_me
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_INDEX=zettelkasten
EMAIL_API_KEY=optional
EMAIL_FROM=noreply@zettelkasten.app
```

### Build & Run

```bash
# Backend
cd backend
go run ./cmd/main.go
# or
go build -o zk ./cmd && ./zk

# Frontend (separate terminal)
cd frontend
npm install
npm run dev      # Vite dev server on :5173
```

Visit `http://localhost:5173` and sign up. The UI connects to the Go API on :8080.

### Upload Workflow

1. Authenticate → obtain JWT.
2. POST `/v1/documents/upload` with `multipart/form-data`:

   * `files[]`    – one or many files
   * `source_type` – {standard|notion|obsidian|roam|logseq}
3. Backend stores job metadata in Redis; worker parses → chunks → embeds → upserts.
4. WebSocket broadcasts progress on channel `ws://localhost:8080/ws`.

### Search API

```bash
POST /v1/search
{
  "query": "quantum computing",
  "limit": 20,
  "similarity_threshold": 0.7,
  "filters": {
    "source_types": ["notion", "obsidian"]
  }
}
```

Response includes ranked chunks with metadata and similarity scores.

## Testing

```bash
# unit tests
cd backend && go test ./...
cd frontend && npm run test
```

## Production Notes

* Deploy the Go binary behind Nginx or Caddy; enable TLS.
* Use separate Redis DB for cache and job queue if desired.
* Scale document processing workers horizontally by running additional instances of `JobQueue.Start`.
* Optional: containerise with Docker; map ports 8080 (API) and 5173 (static build).

## License

MIT (see LICENSE).
