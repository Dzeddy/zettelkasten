package models

import "time"

type Job struct {
	ID              string     `json:"id"`
	UserID          string     `json:"user_id"`
	Status          string     `json:"status"`
	Progress        int        `json:"progress"`
	TotalChunks     int        `json:"total_chunks"`
	ProcessedChunks int        `json:"processed_chunks"`
	Errors          []string   `json:"errors"`
	CreatedAt       time.Time  `json:"created_at"`
	CompletedAt     *time.Time `json:"completed_at,omitempty"`
}
