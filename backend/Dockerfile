FROM golang:1.24-alpine AS builder
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/main.go

FROM alpine:latest AS runner
WORKDIR /app
RUN apk add --no-cache ca-certificates

COPY --from=builder /src/main .

EXPOSE 8080
ENTRYPOINT ["./main"]
