package api

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"

	ws "zettelkasten/internal/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow connections from localhost for development
		origin := r.Header.Get("Origin")
		return origin == "http://localhost:3000" || origin == "http://127.0.0.1:3000"
	},
}

type WebSocketHandler struct {
	hub *ws.Hub
}

func NewWebSocketHandler(r chi.Router, hub *ws.Hub) {
	h := &WebSocketHandler{hub: hub}

	r.Route("/v1/events", func(r chi.Router) {
		r.Get("/ws", h.HandleWebSocket)
	})
}

func (h *WebSocketHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Extract token from query parameter
	tokenString := r.URL.Query().Get("token")
	if tokenString == "" {
		log.Printf("WebSocket connection rejected: no token provided")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Validate JWT token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil || !token.Valid {
		log.Printf("WebSocket connection rejected: invalid token")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		log.Printf("WebSocket connection rejected: invalid token claims")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userID := claims["user_id"].(string)

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("websocket upgrade error: %v", err)
		return
	}

	client := &ws.Client{
		Hub:    h.hub,
		Conn:   conn,
		Send:   make(chan ws.Message, 256),
		UserID: userID,
	}

	h.hub.Register <- client

	// Send initial connection success message
	client.Send <- ws.Message{
		Type: "connected",
		Payload: map[string]interface{}{
			"message": "WebSocket connection established",
		},
	}

	go client.WritePump()
	go client.ReadPump()
}
