package api

import (
	"encoding/json"
	"net/http"
	"os"
	"time"

	"zettelkasten/internal/database"
	"zettelkasten/internal/middleware"
	"zettelkasten/internal/services"

	"github.com/go-chi/chi/v5"
)

type SearchHandler struct {
	searchService    *services.SearchService
	embeddingService *services.EmbeddingService
	redis            *database.RedisClient
}

func NewSearchHandler(r chi.Router, searchService *services.SearchService, embeddingService *services.EmbeddingService, redis *database.RedisClient) {
	h := &SearchHandler{
		searchService:    searchService,
		embeddingService: embeddingService,
		redis:            redis,
	}

	r.Route("/v1/search", func(r chi.Router) {
		r.Use(middleware.AuthMiddleware(os.Getenv("JWT_SECRET")))
		r.Use(middleware.RateLimitMiddleware(redis, 100, time.Minute))

		r.Post("/", h.Search)
		r.Post("/with-llm", h.SearchWithLLM)
	})
}

func (h *SearchHandler) Search(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)

	var req struct {
		Query               string                 `json:"query"`
		Limit               int                    `json:"limit"`
		Filters             services.SearchFilters `json:"filters"`
		IncludeContext      bool                   `json:"include_context"`
		SimilarityThreshold float32                `json:"similarity_threshold"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Set defaults
	if req.Limit == 0 {
		req.Limit = 10
	}
	if req.SimilarityThreshold == 0 {
		req.SimilarityThreshold = 0.7
	}

	results, err := h.searchService.Search(r.Context(), userID, req.Query, req.Limit, req.Filters, req.SimilarityThreshold)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Search failed")
		return
	}

	respondWithJSON(w, http.StatusOK, results)
}

func (h *SearchHandler) SearchWithLLM(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Query        string                 `json:"query"`
		SearchParams map[string]interface{} `json:"search_params"`
		LLMParams    map[string]interface{} `json:"llm_params"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// This would integrate with an LLM service
	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"llm_response": "LLM integration coming soon",
		"sources_used": []interface{}{},
		"tokens_used":  0,
	})
}
