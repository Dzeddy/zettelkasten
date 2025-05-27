package services

import (
	"context"
	"fmt"
	"io"
	"log"
	"math"
	"mime/multipart"
	"time"
	"unicode"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"zettelkasten/internal/database"
	"zettelkasten/internal/models"
	"zettelkasten/internal/parsers"
)

type DocumentService struct {
	db               *mongo.Database
	pinecone         *database.PineconeClient
	embeddingService *EmbeddingService
	eventService     *EventService
}

// NewDocumentService constructor
func NewDocumentService(mongodb *mongo.Client, pinecone *database.PineconeClient, embeddingService *EmbeddingService, eventService *EventService) *DocumentService {
	return &DocumentService{
		db:               mongodb.Database("zettelkasten"),
		pinecone:         pinecone,
		embeddingService: embeddingService,
		eventService:     eventService,
	}
}

func (s *DocumentService) ProcessUpload(ctx context.Context, userID string, files []*multipart.FileHeader, sourceType string) (*models.Job, error) {
	// Create job
	job := &models.Job{
		ID:        uuid.New().String(),
		UserID:    userID,
		Status:    "pending",
		Progress:  0,
		CreatedAt: time.Now(),
	}

	return job, nil
}

func (s *DocumentService) ProcessFile(ctx context.Context, jobID, userID string, file io.Reader, filename, sourceType string) error {
	log.Printf("Starting document processing for file: %s (Job: %s)", filename, jobID)

	// Select parser based on source type
	var parser parsers.Parser
	switch sourceType {
	case "notion":
		parser = parsers.NewNotionParser()
	case "obsidian":
		parser = parsers.NewObsidianParser()
	case "roam":
		parser = parsers.NewRoamParser()
	case "logseq":
		parser = parsers.NewLogseqParser()
	default:
		parser = parsers.NewStandardParser()
	}

	chunks, metadata, err := parser.Parse(file, filename)
	if err != nil {
		return fmt.Errorf("parsing failed: %w", err)
	}

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	doc := &models.Document{
		UserID:     userObjectID,
		Title:      getTitle(metadata, filename),
		SourceType: sourceType,
		ChunkCount: len(chunks),
		UploadedAt: time.Now(),
		Metadata:   metadata,
		Status:     "processing_chunks",
	}

	result, err := s.db.Collection("documents").InsertOne(ctx, doc)
	if err != nil {
		return err
	}

	// Set the document ID and emit document created event
	doc.ID = result.InsertedID.(primitive.ObjectID)
	docID := doc.ID.Hex()
	log.Printf("Created document record with ID: %s for file: %s", docID, filename)

	// Emit document created event
	if s.eventService != nil {
		s.eventService.DocumentCreated(userID, doc)
	}

	// Process chunks with embeddings
	log.Printf("Processing %d chunks for file: %s", len(chunks), filename)
	for i, chunk := range chunks {
		log.Printf("Processing chunk %d/%d for file: %s", i+1, len(chunks), filename)
		err := s.processChunk(ctx, userID, docID, chunk, i, sourceType)
		if err != nil {
			log.Printf("Failed to process chunk %d/%d for file %s: %v", i+1, len(chunks), filename, err)
			return err
		}
	}

	log.Printf("Successfully processed all %d chunks for file: %s", len(chunks), filename)

	_, err = s.db.Collection("documents").UpdateOne(
		ctx,
		bson.M{"_id": result.InsertedID},
		bson.M{"$set": bson.M{"status": "completed"}},
	)

	// Emit job completed event
	if err == nil && s.eventService != nil {
		s.eventService.JobCompleted(userID, jobID)
	}

	return err
}

func (s *DocumentService) processChunk(ctx context.Context, userID, docID, content string, index int, sourceType string) error {
	log.Printf("=== Processing Chunk %d ===", index+1)
	log.Printf("Chunk content preview (first 200 chars): %s", truncateString(content, 200))
	log.Printf("Chunk word count: %d", countWords(content))

	// Generate embedding
	embedding, err := s.embeddingService.GenerateEmbedding(content)
	if err != nil {
		log.Printf("Failed to generate embedding for chunk %d: %v", index+1, err)
		return err
	}

	log.Printf("Generated embedding for chunk %d:", index+1)
	log.Printf("  - Embedding dimensions: %d", len(embedding))
	log.Printf("  - First 10 values: %v", truncateFloatSlice(embedding, 10))
	log.Printf("  - Embedding magnitude: %.6f", calculateMagnitude(embedding))

	// Create chunk ID
	chunkID := fmt.Sprintf("%s_%d", docID, index)

	// Store in Pinecone
	vector := database.Vector{
		ID:     chunkID,
		Values: embedding,
		Metadata: map[string]interface{}{
			"user_id":     userID,
			"document_id": docID,
			"content":     content,
			"chunk_index": index,
			"created_at":  time.Now().Unix(),
			"source_type": sourceType,
		},
	}

	err = s.pinecone.Upsert([]database.Vector{vector})
	if err != nil {
		log.Printf("Failed to store embedding in Pinecone for chunk %d: %v", index+1, err)
		return err
	}

	log.Printf("Successfully stored chunk %d in Pinecone with ID: %s", index+1, chunkID)
	log.Printf("=== End Chunk %d ===\n", index+1)

	return nil
}

// Helper function to truncate strings for logging
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

// Helper function to truncate float slices for logging
func truncateFloatSlice(slice []float32, maxLen int) []float32 {
	if len(slice) <= maxLen {
		return slice
	}
	return slice[:maxLen]
}

// Helper function to calculate vector magnitude
func calculateMagnitude(vector []float32) float64 {
	var sum float64
	for _, val := range vector {
		sum += float64(val * val)
	}
	return math.Sqrt(sum)
}

// Helper function to count words
func countWords(text string) int {
	if text == "" {
		return 0
	}

	words := 0
	inWord := false

	for _, r := range text {
		if unicode.IsSpace(r) || unicode.IsPunct(r) {
			if inWord {
				words++
				inWord = false
			}
		} else {
			inWord = true
		}
	}

	// Count the last word if text doesn't end with space/punct
	if inWord {
		words++
	}

	return words
}

func (s *DocumentService) ListDocuments(ctx context.Context, userID string, page, limit int) ([]models.Document, int64, error) {
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, 0, err
	}

	filter := bson.M{"user_id": userObjectID}

	// Count total documents
	total, err := s.db.Collection("documents").CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Find documents with pagination
	skip := int64((page - 1) * limit)
	limitInt64 := int64(limit)
	cursor, err := s.db.Collection("documents").Find(
		ctx,
		filter,
		&options.FindOptions{
			Skip:  &skip,
			Limit: &limitInt64,
			Sort:  bson.M{"uploaded_at": -1},
		},
	)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var documents []models.Document
	if err := cursor.All(ctx, &documents); err != nil {
		return nil, 0, err
	}

	return documents, total, nil
}

func (s *DocumentService) DeleteDocument(ctx context.Context, userID, documentID string) error {
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	docObjectID, err := primitive.ObjectIDFromHex(documentID)
	if err != nil {
		return err
	}

	// Delete from MongoDB
	_, err = s.db.Collection("documents").DeleteOne(ctx, bson.M{
		"_id":     docObjectID,
		"user_id": userObjectID,
	})

	if err == nil && s.eventService != nil {
		// Emit document deleted event
		s.eventService.DocumentDeleted(userID, documentID)
	}

	// TODO: Delete vectors from Pinecone
	// This would require implementing a delete by metadata filter in Pinecone

	return err
}

func (s *DocumentService) GetDocumentChunks(ctx context.Context, userID, documentID string) ([]models.Chunk, error) {
	// Verify user owns the document
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	docObjectID, err := primitive.ObjectIDFromHex(documentID)
	if err != nil {
		return nil, err
	}

	// Check if document exists and belongs to user
	var doc models.Document
	err = s.db.Collection("documents").FindOne(ctx, bson.M{
		"_id":     docObjectID,
		"user_id": userObjectID,
	}).Decode(&doc)
	if err != nil {
		return nil, err
	}

	// Query Pinecone for all chunks of this document
	// We'll use a dummy vector for the query since we're filtering by metadata
	dummyVector := make([]float32, 1536) // OpenAI embedding dimension

	filter := map[string]interface{}{
		"user_id":     userID,
		"document_id": documentID,
	}

	queryResponse, err := s.pinecone.Query(dummyVector, int(doc.ChunkCount*2), filter) // Get more than expected to ensure we get all
	if err != nil {
		return nil, err
	}

	// Convert Pinecone results to Chunk models
	var chunks []models.Chunk
	for _, match := range queryResponse.Matches {
		metadataMap := match.Vector.Metadata.AsMap()

		chunk := models.Chunk{
			ID:         match.Vector.Id,
			DocumentID: documentID,
			UserID:     userID,
			Content:    getStringFromMetadata(metadataMap, "content"),
			ChunkIndex: int(getFloatFromMetadata(metadataMap, "chunk_index")),
			Metadata:   metadataMap,
			CreatedAt:  time.Unix(int64(getFloatFromMetadata(metadataMap, "created_at")), 0),
		}
		chunks = append(chunks, chunk)
	}

	// Sort chunks by index
	for i := 0; i < len(chunks)-1; i++ {
		for j := i + 1; j < len(chunks); j++ {
			if chunks[i].ChunkIndex > chunks[j].ChunkIndex {
				chunks[i], chunks[j] = chunks[j], chunks[i]
			}
		}
	}

	return chunks, nil
}

// Helper function to get float from metadata
func getFloatFromMetadata(metadata map[string]interface{}, key string) float64 {
	if value, ok := metadata[key].(float64); ok {
		return value
	}
	if value, ok := metadata[key].(int); ok {
		return float64(value)
	}
	return 0
}

func getTitle(metadata map[string]interface{}, filename string) string {
	if title, ok := metadata["title"].(string); ok && title != "" {
		return title
	}
	return filename
}
