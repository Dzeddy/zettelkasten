package config

import (
	"os"
)

type Config struct {
	Port           string
	MongoURI       string
	RedisAddr      string
	RedisPassword  string
	PineconeAPIKey string
	PineconeIndex  string
	PineconeCloud  string
	PineconeRegion string
	PineconeModel  string // New: To specify the embedding model
	OpenAIAPIKey   string
	JWTSecret      string
	EmailAPIKey    string
	EmailFrom      string
}

func Load() *Config {
	return &Config{
		Port:           getEnv("PORT", "8080"),
		MongoURI:       getEnv("MONGO_URI", "mongodb://localhost:27017/zettelkasten"),
		RedisAddr:      getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword:  getEnv("REDIS_PASSWORD", ""),
		PineconeAPIKey: getEnv("PINECONE_API_KEY", ""),
		PineconeIndex:  getEnv("PINECONE_INDEX", "zettelkasten"),
		PineconeCloud:  getEnv("PINECONE_CLOUD", "aws"),
		PineconeRegion: getEnv("PINECONE_REGION", "us-east-1"),
		PineconeModel:  getEnv("PINECONE_MODEL", "text-embedding-3-small"), // Default model
		OpenAIAPIKey:   getEnv("OPENAI_API_KEY", ""),
		JWTSecret:      getEnv("JWT_SECRET", ""),
		EmailAPIKey:    getEnv("EMAIL_API_KEY", ""),
		EmailFrom:      getEnv("EMAIL_FROM", "noreply@zettelkasten.app"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		// Simple conversion - in production you might want better error handling
		if value == "1536" {
			return 1536
		} else if value == "3072" {
			return 3072
		}
	}
	return defaultValue
}
