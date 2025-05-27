package websocket

import (
	"log"
	"sync"
)

type Hub struct {
	clients    map[string]map[*Client]bool // userID -> clients
	broadcast  chan Message
	Register   chan *Client
	Unregister chan *Client
	mu         sync.RWMutex
}

type Message struct {
	Type    string                 `json:"type"`
	UserID  string                 `json:"user_id,omitempty"`
	Payload map[string]interface{} `json:"payload"`
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]bool),
		broadcast:  make(chan Message, 256),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			if h.clients[client.UserID] == nil {
				h.clients[client.UserID] = make(map[*Client]bool)
			}
			h.clients[client.UserID][client] = true
			h.mu.Unlock()
			log.Printf("Client registered for user %s", client.UserID)

		case client := <-h.Unregister:
			h.mu.Lock()
			if clients, ok := h.clients[client.UserID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.Send)
					if len(clients) == 0 {
						delete(h.clients, client.UserID)
					}
				}
			}
			h.mu.Unlock()
			log.Printf("Client unregistered for user %s", client.UserID)

		case message := <-h.broadcast:
			h.mu.RLock()
			// Send to all clients of the specific user
			if message.UserID != "" {
				if clients, ok := h.clients[message.UserID]; ok {
					for client := range clients {
						select {
						case client.Send <- message:
						default:
							close(client.Send)
							delete(clients, client)
						}
					}
				}
			} else {
				// Broadcast to all clients
				for _, clients := range h.clients {
					for client := range clients {
						select {
						case client.Send <- message:
						default:
							close(client.Send)
							delete(clients, client)
						}
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

// SendToUser sends a message to all clients of a specific user
func (h *Hub) SendToUser(userID string, messageType string, payload map[string]interface{}) {
	message := Message{
		Type:    messageType,
		UserID:  userID,
		Payload: payload,
	}
	h.broadcast <- message
}
