package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"

	"zettelkasten/internal/api"
	"zettelkasten/internal/config"
	"zettelkasten/internal/database"
	"zettelkasten/internal/queue"
	"zettelkasten/internal/services"
	ws "zettelkasten/internal/websocket"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize database connections
	mongodb := database.NewMongoDB(cfg.MongoURI)
	redis := database.NewRedis(cfg.RedisAddr, cfg.RedisPassword)

	// Updated Pinecone initialization
	pineconeClient, err := database.NewPinecone(cfg.PineconeAPIKey, cfg.PineconeIndex)
	if err != nil {
		log.Fatalf("Fatal: Failed to initialize Pinecone client: %v", err)
	}

	if cfg.PineconeAPIKey != "" {
		log.Println("Checking Pinecone index status...")
		// Updated call to EnsureIndexExists
		err := pineconeClient.EnsureIndexExists(context.Background(), cfg.PineconeModel, cfg.PineconeCloud, cfg.PineconeRegion)
		if err != nil {
			log.Printf("Warning: Failed to ensure Pinecone index exists: %v", err)
			log.Println("The application will continue, but vector operations may fail")
		} else {
			log.Println("Pinecone index is ready")
		}
	}

	// Initialize WebSocket hub
	wsHub := ws.NewHub()
	go wsHub.Run()

	// Initialize services
	embeddingService := services.NewEmbeddingService(cfg.OpenAIAPIKey)
	authService := services.NewAuthService(mongodb, redis, cfg.JWTSecret)
	eventService := services.NewEventService(wsHub)
	documentService := services.NewDocumentService(mongodb, pineconeClient, embeddingService, eventService)
	searchService := services.NewSearchService(pineconeClient, redis, embeddingService)
	emailService := services.NewEmailService(cfg.EmailAPIKey, cfg.EmailFrom)

	jobQueue := queue.NewJobQueue(redis, documentService, eventService)

	// Start job queue in a goroutine with context for graceful shutdown
	queueCtx, queueCancel := context.WithCancel(context.Background())
	go func() {
		defer queueCancel()
		jobQueue.StartWithContext(queueCtx)
	}()

	// Initialize router
	r := chi.NewRouter()

	// CORS middleware
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)
	r.Use(middleware.RequestID)
	r.Use(middleware.Timeout(60 * time.Second))

	// Initialize API handlers
	api.NewAuthHandler(r, authService, emailService)
	api.NewDocumentHandler(r, documentService, jobQueue, redis)
	api.NewSearchHandler(r, searchService, embeddingService, redis)
	api.NewUserHandler(r, authService)
	api.NewAnalyticsHandler(r, mongodb)
	api.NewWebSocketHandler(r, wsHub)

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	// Start server
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		log.Printf("Server starting on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit

	log.Println("Shutting down server...")

	// Cancel job queue context to stop processing new jobs
	queueCancel()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exiting")
}
