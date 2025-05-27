package api

import (
	"net/http"
	"os"
	"strconv"
	"time"

	"zettelkasten/internal/database"
	"zettelkasten/internal/middleware"
	"zettelkasten/internal/queue"
	"zettelkasten/internal/services"

	"github.com/go-chi/chi/v5"
)

type DocumentHandler struct {
	documentService *services.DocumentService
	jobQueue        *queue.JobQueue
	redis           *database.RedisClient
}

func NewDocumentHandler(r chi.Router, documentService *services.DocumentService, jobQueue *queue.JobQueue, redis *database.RedisClient) {
	h := &DocumentHandler{
		documentService: documentService,
		jobQueue:        jobQueue,
		redis:           redis,
	}

	r.Route("/v1/documents", func(r chi.Router) {
		r.Use(middleware.AuthMiddleware(os.Getenv("JWT_SECRET")))
		r.Use(middleware.RateLimitMiddleware(redis, 10, time.Hour)) // 10 uploads per hour

		r.Post("/upload", h.Upload)
		r.Get("/", h.ListDocuments)
		r.Get("/{documentID}/chunks", h.GetDocumentChunks)
		r.Delete("/{documentID}", h.DeleteDocument)
	})
}

func (h *DocumentHandler) Upload(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)

	// Parse multipart form
	err := r.ParseMultipartForm(100 << 20) // 100 MB max
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Failed to parse upload")
		return
	}

	sourceType := r.FormValue("source_type")
	if !isValidSourceType(sourceType) {
		respondWithError(w, http.StatusBadRequest, "Invalid source type")
		return
	}

	files := r.MultipartForm.File["files[]"]
	if len(files) == 0 {
		respondWithError(w, http.StatusBadRequest, "No files uploaded")
		return
	}

	// Create job for processing
	job, err := h.documentService.ProcessUpload(r.Context(), userID, files, sourceType)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to process upload")
		return
	}

	// Queue files for processing
	for _, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			continue
		}
		defer file.Close()

		h.jobQueue.QueueFile(job.ID, userID, file, fileHeader.Filename, sourceType)
	}

	respondWithJSON(w, http.StatusAccepted, map[string]interface{}{
		"job_id":                 job.ID,
		"status":                 "processing",
		"files_received":         len(files),
		"estimated_time_seconds": len(files) * 30,
	})
}

func (h *DocumentHandler) ListDocuments(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)

	// Parse query parameters
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	documents, total, err := h.documentService.ListDocuments(r.Context(), userID, page, limit)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to list documents")
		return
	}

	totalPages := (int(total) + limit - 1) / limit

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"documents": documents,
		"pagination": map[string]interface{}{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": totalPages,
		},
	})
}

func (h *DocumentHandler) GetDocumentChunks(w http.ResponseWriter, r *http.Request) {
	documentID := chi.URLParam(r, "documentID")
	userID := r.Context().Value("user_id").(string)

	chunks, err := h.documentService.GetDocumentChunks(r.Context(), userID, documentID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to get document chunks")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"chunks": chunks,
	})
}

func (h *DocumentHandler) DeleteDocument(w http.ResponseWriter, r *http.Request) {
	documentID := chi.URLParam(r, "documentID")
	userID := r.Context().Value("user_id").(string)

	err := h.documentService.DeleteDocument(r.Context(), userID, documentID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to delete document")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
