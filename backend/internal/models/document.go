package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Document struct {
	ID         primitive.ObjectID     `bson:"_id,omitempty" json:"id"`
	UserID     primitive.ObjectID     `bson:"user_id" json:"user_id"`
	Title      string                 `bson:"title" json:"title"`
	SourceType string                 `bson:"source_type" json:"source_type"`
	ChunkCount int                    `bson:"chunk_count" json:"chunk_count"`
	UploadedAt time.Time              `bson:"uploaded_at" json:"uploaded_at"`
	Metadata   map[string]interface{} `bson:"metadata" json:"metadata"`
	Status     string                 `bson:"status" json:"status"`
}
