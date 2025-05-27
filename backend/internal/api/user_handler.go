package api

import (
	"encoding/json"
	"net/http"
	"os"

	"zettelkasten/internal/middleware"
	"zettelkasten/internal/services"

	"github.com/go-chi/chi/v5"
)

type UserHandler struct {
	authService *services.AuthService
}

func NewUserHandler(r chi.Router, authService *services.AuthService) {
	h := &UserHandler{authService: authService}

	r.Route("/v1/user", func(r chi.Router) {
		r.Use(middleware.AuthMiddleware(os.Getenv("JWT_SECRET")))

		r.Get("/profile", h.GetProfile)
		r.Put("/profile", h.UpdateProfile)
	})
}

func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)

	user, err := h.authService.GetUserByID(r.Context(), userID)
	if err != nil {
		respondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"id":         user.ID.Hex(),
		"email":      user.Email,
		"name":       user.Name,
		"created_at": user.CreatedAt,
		"stats": map[string]interface{}{
			"total_documents": 0,
			"total_chunks":    0,
			"storage_used_mb": 0,
		},
	})
}

func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)

	var req struct {
		Name        string                 `json:"name"`
		Preferences map[string]interface{} `json:"preferences"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Preferences != nil {
		updates["preferences"] = req.Preferences
	}

	err := h.authService.UpdateUser(r.Context(), userID, updates)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Profile updated successfully",
	})
}
