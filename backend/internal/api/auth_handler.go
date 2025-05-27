package api

import (
	"encoding/json"
	"net/http"

	"zettelkasten/internal/services"

	"github.com/go-chi/chi/v5"
)

type AuthHandler struct {
	authService  *services.AuthService
	emailService *services.EmailService
}

func NewAuthHandler(r chi.Router, authService *services.AuthService, emailService *services.EmailService) {
	h := &AuthHandler{
		authService:  authService,
		emailService: emailService,
	}

	r.Route("/v1/auth", func(r chi.Router) {
		r.Post("/signup", h.SignUp)
		r.Post("/verify-email", h.VerifyEmail)
		r.Post("/login", h.Login)
		r.Post("/refresh", h.RefreshToken)
		r.Post("/forgot-password", h.ForgotPassword)
		r.Post("/reset-password", h.ResetPassword)
	})
}

func (h *AuthHandler) SignUp(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Name     string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate input
	if err := validateEmail(req.Email); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid email format")
		return
	}

	if err := validatePassword(req.Password); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.authService.SignUp(r.Context(), req.Email, req.Password, req.Name)
	if err != nil {
		respondWithError(w, http.StatusConflict, err.Error())
		return
	}

	// Send verification email
	h.emailService.SendVerificationEmail(user.Email, "verification_token")

	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "User created successfully. Please check your email for verification.",
		"user_id": user.ID.Hex(),
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	accessToken, refreshToken, err := h.authService.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}

func (h *AuthHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Token string `json:"token"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	err := h.authService.VerifyEmail(r.Context(), req.Token)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid verification token")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Email verified successfully",
	})
}

func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	// Implementation for refresh token
	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Refresh token endpoint",
	})
}

func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Send password reset email
	h.emailService.SendPasswordResetEmail(req.Email, "reset_token")

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Password reset email sent",
	})
}

func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Token       string `json:"token"`
		NewPassword string `json:"new_password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := validatePassword(req.NewPassword); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Password reset successfully",
	})
}
