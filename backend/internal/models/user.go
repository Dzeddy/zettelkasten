package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email         string             `bson:"email" json:"email"`
	PasswordHash  string             `bson:"password_hash" json:"-"`
	Name          string             `bson:"name" json:"name"`
	EmailVerified bool               `bson:"email_verified" json:"email_verified"`
	CreatedAt     time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"updated_at"`
	Preferences   UserPreferences    `bson:"preferences" json:"preferences"`
}

type UserPreferences struct {
	DefaultSimilarityThreshold float32 `bson:"default_similarity_threshold" json:"default_similarity_threshold"`
	ChunkSizePreference        string  `bson:"chunk_size_preference" json:"chunk_size_preference"`
}
