package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"zettelkasten/internal/database"
)

type SearchService struct {
	pinecone         *database.PineconeClient
	redis            *database.RedisClient
	embeddingService *EmbeddingService
}

type SearchFilters struct {
	SourceTypes []string   `json:"source_types"`
	DateRange   *DateRange `json:"date_range"`
	Tags        []string   `json:"tags"`
}

type DateRange struct {
	From time.Time `json:"from"`
	To   time.Time `json:"to"`
}

type SearchResult struct {
	ID              string                 `json:"id"`
	Content         string                 `json:"content"`
	SimilarityScore float32                `json:"similarity_score"`
	Source          SearchSource           `json:"source"`
	Metadata        map[string]interface{} `json:"metadata"`
	Context         *SearchContext         `json:"context,omitempty"`
}

type SearchSource struct {
	DocumentID   string `json:"document_id"`
	Title        string `json:"title"`
	Type         string `json:"type"`
	OriginalPath string `json:"original_path"`
}

type SearchContext struct {
	Before string `json:"before"`
	After  string `json:"after"`
}

type SearchResponse struct {
	Results              []SearchResult `json:"results"`
	TotalResults         int            `json:"total_results"`
	QueryEmbeddingTimeMs int64          `json:"query_embedding_time_ms"`
	SearchTimeMs         int64          `json:"search_time_ms"`
}

func NewSearchService(pinecone *database.PineconeClient, redis *database.RedisClient, embeddingService *EmbeddingService) *SearchService {
	return &SearchService{
		pinecone:         pinecone,
		redis:            redis,
		embeddingService: embeddingService,
	}
}

func (s *SearchService) Search(ctx context.Context, userID, query string, limit int, filters SearchFilters, similarityThreshold float32) (*SearchResponse, error) {
	// Check cache first
	cacheKey := fmt.Sprintf("search:%s:%s:%d", userID, query, limit)
	if cached, err := s.redis.Get(cacheKey); err == nil {
		var response SearchResponse
		if json.Unmarshal([]byte(cached), &response) == nil {
			return &response, nil
		}
	}

	// Generate embedding for query
	embeddingStart := time.Now()
	queryEmbedding, err := s.embeddingService.GenerateEmbedding(query)
	if err != nil {
		return nil, err
	}
	embeddingTime := time.Since(embeddingStart).Milliseconds()

	// Build Pinecone filter
	pineconeFilter := map[string]interface{}{
		"user_id": userID,
	}

	if len(filters.SourceTypes) > 0 {
		pineconeFilter["source_type"] = map[string]interface{}{
			"$in": filters.SourceTypes,
		}
	}

	if filters.DateRange != nil {
		pineconeFilter["created_at"] = map[string]interface{}{
			"$gte": filters.DateRange.From.Unix(),
			"$lte": filters.DateRange.To.Unix(),
		}
	}

	// Perform search
	searchStart := time.Now()
	queryResponse, err := s.pinecone.Query(queryEmbedding, limit, pineconeFilter)
	if err != nil {
		return nil, err
	}
	searchTime := time.Since(searchStart).Milliseconds()

	// Process results
	var results []SearchResult
	for _, match := range queryResponse.Matches {
		if match.Score < similarityThreshold {
			continue
		}

		// Convert metadata from structpb.Struct to map
		metadataMap := match.Vector.Metadata.AsMap()

		result := SearchResult{
			ID:              match.Vector.Id,
			Content:         getStringFromMetadata(metadataMap, "content"),
			SimilarityScore: match.Score,
			Source: SearchSource{
				DocumentID:   getStringFromMetadata(metadataMap, "document_id"),
				Title:        getStringFromMetadata(metadataMap, "title"),
				Type:         getStringFromMetadata(metadataMap, "source_type"),
				OriginalPath: getStringFromMetadata(metadataMap, "original_path"),
			},
			Metadata: metadataMap,
		}

		results = append(results, result)
	}

	response := &SearchResponse{
		Results:              results,
		TotalResults:         len(results),
		QueryEmbeddingTimeMs: embeddingTime,
		SearchTimeMs:         searchTime,
	}

	// Cache results for 1 hour
	if responseData, err := json.Marshal(response); err == nil {
		s.redis.Set(cacheKey, string(responseData), time.Hour)
	}

	return response, nil
}

func getStringFromMetadata(metadata map[string]interface{}, key string) string {
	if value, ok := metadata[key].(string); ok {
		return value
	}
	return ""
}
