# Stage 1: Builder
FROM --platform=linux/amd64 golang:1.21-alpine AS builder

# Set the working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Set target architecture and OS for the Go build
# This is crucial for cross-compilation, e.g., building on arm64 (Mac M1/M2/M3) for amd64 (typical Linux servers)
ENV GOOS=linux
ENV GOARCH=amd64
ENV CGO_ENABLED=0

# Copy go.mod and go.sum first to leverage Docker cache for dependencies
COPY go.mod go.sum ./
RUN go mod download
RUN go mod verify # Good practice to verify dependencies

# Copy the rest of the source code
COPY . .

# Build the application with explicit target platform
# CGO_ENABLED=0 is good for static binaries
# -ldflags="-s -w" can reduce binary size by stripping debug symbols
RUN GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -a -ldflags="-s -w" -installsuffix cgo -o main ./cmd/main.go

# Stage 2: Final image
FROM --platform=linux/amd64 alpine:latest

# Install ca-certificates for HTTPS requests if your app makes them
RUN apk --no-cache add ca-certificates

# Create a non-root user and group for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set the working directory
WORKDIR /home/appuser

# Copy the built binary from the builder stage
COPY --from=builder /app/main .

# Ensure the binary is executable by the new user
RUN chown appuser:appgroup ./main && chmod +x ./main

# Switch to the non-root user
USER appuser

# Expose the port the application listens on
EXPOSE 8080

# Command to run the application
# The application will look for environment variables for configuration (e.g., MONGO_URI)
CMD ["./main"]
