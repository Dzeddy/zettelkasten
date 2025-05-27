package services

import (
	"time"

	"zettelkasten/internal/models"
	ws "zettelkasten/internal/websocket"
)

type EventService struct {
	hub *ws.Hub
}

func NewEventService(hub *ws.Hub) *EventService {
	return &EventService{hub: hub}
}

// Document Events
func (s *EventService) DocumentCreated(userID string, document *models.Document) {
	s.hub.SendToUser(userID, "document:created", map[string]interface{}{
		"document":  document,
		"timestamp": time.Now().Unix(),
	})
}

func (s *EventService) DocumentDeleted(userID, documentID string) {
	s.hub.SendToUser(userID, "document:deleted", map[string]interface{}{
		"document_id": documentID,
		"timestamp":   time.Now().Unix(),
	})
}

func (s *EventService) DocumentsUpdated(userID string, documents []models.Document) {
	s.hub.SendToUser(userID, "documents:updated", map[string]interface{}{
		"documents": documents,
		"timestamp": time.Now().Unix(),
	})
}

// Job Events
func (s *EventService) JobProgressUpdate(userID, jobID string, progress int, status string) {
	s.hub.SendToUser(userID, "job-progress", map[string]interface{}{
		"job_id":    jobID,
		"progress":  progress,
		"status":    status,
		"timestamp": time.Now().Unix(),
	})
}

func (s *EventService) JobCompleted(userID, jobID string) {
	s.hub.SendToUser(userID, "job-completed", map[string]interface{}{
		"job_id":    jobID,
		"timestamp": time.Now().Unix(),
	})
}

func (s *EventService) JobFailed(userID, jobID string, error string) {
	s.hub.SendToUser(userID, "job-failed", map[string]interface{}{
		"job_id":    jobID,
		"error":     error,
		"timestamp": time.Now().Unix(),
	})
}
