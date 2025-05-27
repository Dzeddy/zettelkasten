package api

import (
	"net/http"
	"os"

	"zettelkasten/internal/middleware"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/mongo"
)

type AnalyticsHandler struct {
	db *mongo.Client
}

func NewAnalyticsHandler(r chi.Router, mongodb *mongo.Client) {
	h := &AnalyticsHandler{db: mongodb}

	r.Route("/v1/analytics", func(r chi.Router) {
		r.Use(middleware.AuthMiddleware(os.Getenv("JWT_SECRET")))

		r.Get("/usage", h.GetUsage)
	})
}

func (h *AnalyticsHandler) GetUsage(w http.ResponseWriter, r *http.Request) {
	// userID := r.Context().Value("user_id").(string)

	// Mock analytics data
	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"period": "month",
		"stats": map[string]interface{}{
			"searches_performed": 145,
			"documents_uploaded": 12,
			"chunks_processed":   890,
			"api_calls":          467,
		},
		"daily_breakdown": []map[string]interface{}{
			{
				"date":      "2025-05-01",
				"searches":  5,
				"uploads":   1,
				"api_calls": 15,
			},
		},
	})
}
