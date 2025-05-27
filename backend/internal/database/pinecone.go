package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/pinecone-io/go-pinecone/v3/pinecone"
	"google.golang.org/protobuf/types/known/structpb"
)

// PineconeClient now wraps the official Pinecone Go client.
type PineconeClient struct {
	client    *pinecone.Client
	indexName string
}

// Vector is now defined within the database package for clarity.
type Vector struct {
	ID       string
	Values   []float32
	Metadata map[string]interface{}
}

// QueryResponse is aliased for consistency.
type QueryResponse struct {
	Matches []*pinecone.ScoredVector
	Usage   *pinecone.Usage
}

// NewPinecone initializes the new Pinecone client.
func NewPinecone(apiKey, indexName string) (*PineconeClient, error) {
	pc, err := pinecone.NewClient(pinecone.NewClientParams{
		ApiKey: apiKey,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create Pinecone client: %w", err)
	}

	return &PineconeClient{
		client:    pc,
		indexName: indexName,
	}, nil
}

// EnsureIndexExists checks for and creates a serverless index if it doesn't exist.
func (p *PineconeClient) EnsureIndexExists(ctx context.Context, model, cloud, region string) error {
	indexes, err := p.client.ListIndexes(ctx)
	if err != nil {
		return fmt.Errorf("failed to list indexes: %w", err)
	}

	for _, index := range indexes {
		if index.Name == p.indexName {
			log.Printf("Pinecone index '%s' already exists.", p.indexName)
			return nil
		}
	}

	log.Printf("Index '%s' not found. Creating a new serverless index...", p.indexName)

	// Convert cloud string to pinecone.Cloud type
	var cloudType pinecone.Cloud
	switch cloud {
	case "aws":
		cloudType = pinecone.Aws
	case "gcp":
		cloudType = pinecone.Gcp
	case "azure":
		cloudType = pinecone.Azure
	default:
		cloudType = pinecone.Aws
	}

	// For now, create a standard serverless index since integrated inference may not be available
	metric := pinecone.Cosine
	dimension := int32(1536) // Default for text-embedding-3-small

	_, err = p.client.CreateServerlessIndex(ctx, &pinecone.CreateServerlessIndexRequest{
		Name:      p.indexName,
		Cloud:     cloudType,
		Region:    region,
		Metric:    &metric,
		Dimension: &dimension,
	})

	if err != nil {
		return fmt.Errorf("failed to create serverless index: %w", err)
	}

	log.Printf("Successfully initiated creation of index '%s'. It may take a moment to become available.", p.indexName)
	time.Sleep(5 * time.Second) // Give it a moment to initialize.

	return nil
}

// UpsertByText is a placeholder - for now we'll need to use the embedding service
func (p *PineconeClient) UpsertByText(ctx context.Context, vectors []*pinecone.Vector) error {
	idx, err := p.client.DescribeIndex(ctx, p.indexName)
	if err != nil {
		return fmt.Errorf("failed to describe index: %w", err)
	}

	idxConnection, err := p.client.Index(pinecone.NewIndexConnParams{Host: idx.Host})
	if err != nil {
		return fmt.Errorf("failed to get index connection: %w", err)
	}

	_, err = idxConnection.UpsertVectors(ctx, vectors)
	return err
}

// QueryByText is a placeholder - for now we'll need to use the embedding service
func (p *PineconeClient) QueryByText(ctx context.Context, queryVector []float32, topK uint32, filter map[string]interface{}) (*QueryResponse, error) {
	idx, err := p.client.DescribeIndex(ctx, p.indexName)
	if err != nil {
		return nil, fmt.Errorf("failed to describe index: %w", err)
	}

	idxConnection, err := p.client.Index(pinecone.NewIndexConnParams{Host: idx.Host})
	if err != nil {
		return nil, fmt.Errorf("failed to get index connection: %w", err)
	}

	var metadataFilter *structpb.Struct
	if filter != nil {
		metadataFilter, _ = structpb.NewStruct(filter)
	}

	response, err := idxConnection.QueryByVectorValues(ctx, &pinecone.QueryByVectorValuesRequest{
		Vector:          queryVector,
		TopK:            topK,
		MetadataFilter:  metadataFilter,
		IncludeMetadata: true,
		IncludeValues:   false,
	})

	if err != nil {
		return nil, err
	}

	return &QueryResponse{
		Matches: response.Matches,
		Usage:   response.Usage,
	}, nil
}

// Legacy methods for backward compatibility
// Upsert method for backward compatibility
func (p *PineconeClient) Upsert(vectors []Vector) error {
	ctx := context.Background()

	idx, err := p.client.DescribeIndex(ctx, p.indexName)
	if err != nil {
		return fmt.Errorf("failed to describe index: %w", err)
	}

	idxConnection, err := p.client.Index(pinecone.NewIndexConnParams{Host: idx.Host})
	if err != nil {
		return fmt.Errorf("failed to get index connection: %w", err)
	}

	// Convert legacy Vector format to pinecone.Vector format
	var pineconeVectors []*pinecone.Vector
	for _, v := range vectors {
		meta, err := structpb.NewStruct(v.Metadata)
		if err != nil {
			return fmt.Errorf("failed to convert metadata: %w", err)
		}

		pineconeVectors = append(pineconeVectors, &pinecone.Vector{
			Id:       v.ID,
			Values:   &v.Values,
			Metadata: meta,
		})
	}

	_, err = idxConnection.UpsertVectors(ctx, pineconeVectors)
	return err
}

// Query method for backward compatibility
func (p *PineconeClient) Query(vector []float32, topK int, filter map[string]interface{}) (*QueryResponse, error) {
	ctx := context.Background()

	idx, err := p.client.DescribeIndex(ctx, p.indexName)
	if err != nil {
		return nil, fmt.Errorf("failed to describe index: %w", err)
	}

	idxConnection, err := p.client.Index(pinecone.NewIndexConnParams{Host: idx.Host})
	if err != nil {
		return nil, fmt.Errorf("failed to get index connection: %w", err)
	}

	var metadataFilter *structpb.Struct
	if filter != nil {
		metadataFilter, _ = structpb.NewStruct(filter)
	}

	response, err := idxConnection.QueryByVectorValues(ctx, &pinecone.QueryByVectorValuesRequest{
		Vector:          vector,
		TopK:            uint32(topK),
		MetadataFilter:  metadataFilter,
		IncludeMetadata: true,
		IncludeValues:   false,
	})

	if err != nil {
		return nil, err
	}

	return &QueryResponse{
		Matches: response.Matches,
		Usage:   response.Usage,
	}, nil
}
