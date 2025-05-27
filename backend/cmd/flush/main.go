package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/go-redis/redis/v8"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	var (
		mongoURI      = flag.String("mongo-uri", "mongodb://localhost:27017", "MongoDB connection URI")
		redisAddr     = flag.String("redis-addr", "localhost:6379", "Redis server address")
		redisPassword = flag.String("redis-password", "", "Redis password")
		dbName        = flag.String("db-name", "zettelkasten", "Database name")
		mongoOnly     = flag.Bool("mongodb-only", false, "Flush only MongoDB")
		redisOnly     = flag.Bool("redis-only", false, "Flush only Redis")
		skipBackup    = flag.Bool("skip-backup", false, "Skip creating backup before flush")
		force         = flag.Bool("force", false, "Skip confirmation prompt")
	)
	flag.Parse()

	fmt.Println("🗑️  Zettelkasten Database Flush Utility")
	fmt.Println("======================================")

	if !*force {
		fmt.Print("⚠️  WARNING: This will permanently delete all data!\n")
		fmt.Print("Are you sure you want to continue? (type 'yes' to confirm): ")
		var confirmation string
		fmt.Scanln(&confirmation)
		if confirmation != "yes" {
			fmt.Println("Operation cancelled.")
			os.Exit(0)
		}
	}

	ctx := context.Background()

	// Flush MongoDB
	if !*redisOnly {
		if err := flushMongoDB(ctx, *mongoURI, *dbName, *skipBackup); err != nil {
			log.Fatalf("Failed to flush MongoDB: %v", err)
		}
	}

	// Flush Redis
	if !*mongoOnly {
		if err := flushRedis(ctx, *redisAddr, *redisPassword); err != nil {
			log.Fatalf("Failed to flush Redis: %v", err)
		}
	}

	fmt.Println("\n🎉 Database flush completed successfully!")
}

func flushMongoDB(ctx context.Context, uri, dbName string, skipBackup bool) error {
	fmt.Println("\n🗄️  Flushing MongoDB...")

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return fmt.Errorf("failed to connect to MongoDB: %w", err)
	}
	defer client.Disconnect(ctx)

	// Test connection
	if err := client.Ping(ctx, nil); err != nil {
		return fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	db := client.Database(dbName)

	// Create backup if not skipped
	if !skipBackup {
		fmt.Println("📦 Creating backup...")
		if err := createBackup(ctx, db); err != nil {
			fmt.Printf("⚠️  Warning: Failed to create backup: %v\n", err)
		}
	}

	// Get all collection names
	collections, err := db.ListCollectionNames(ctx, map[string]interface{}{})
	if err != nil {
		return fmt.Errorf("failed to list collections: %w", err)
	}

	// Drop all collections
	fmt.Println("🗑️  Dropping collections...")
	for _, collection := range collections {
		fmt.Printf("  Dropping: %s\n", collection)
		if err := db.Collection(collection).Drop(ctx); err != nil {
			fmt.Printf("  ⚠️  Warning: Failed to drop %s: %v\n", collection, err)
		}
	}

	fmt.Println("✅ MongoDB flushed successfully")
	return nil
}

func flushRedis(ctx context.Context, redisAddr, redisPassword string) error {
	fmt.Println("\n🔄 Flushing Redis...")

	// Connect to Redis
	client := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: redisPassword,
	})
	defer client.Close()

	// Test connection
	if err := client.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("failed to ping Redis: %w", err)
	}

	// Show current key count
	keyCount, err := client.DBSize(ctx).Result()
	if err == nil {
		fmt.Printf("📋 Current keys in Redis: %d\n", keyCount)
	}

	// Flush all databases
	fmt.Println("🗑️  Flushing all Redis databases...")
	if err := client.FlushAll(ctx).Err(); err != nil {
		return fmt.Errorf("failed to flush Redis: %w", err)
	}

	fmt.Println("✅ Redis flushed successfully")
	return nil
}

func createBackup(ctx context.Context, db *mongo.Database) error {
	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("backup_%s.log", timestamp)

	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	collections, err := db.ListCollectionNames(ctx, map[string]interface{}{})
	if err != nil {
		return err
	}

	file.WriteString(fmt.Sprintf("=== BACKUP CREATED AT %s ===\n", time.Now().Format(time.RFC3339)))
	file.WriteString(fmt.Sprintf("Database: %s\n", db.Name()))
	file.WriteString(fmt.Sprintf("Collections: %v\n\n", collections))

	for _, collName := range collections {
		file.WriteString(fmt.Sprintf("=== COLLECTION: %s ===\n", collName))

		cursor, err := db.Collection(collName).Find(ctx, map[string]interface{}{})
		if err != nil {
			file.WriteString(fmt.Sprintf("Error reading collection: %v\n", err))
			continue
		}

		count := 0
		for cursor.Next(ctx) {
			var doc map[string]interface{}
			if err := cursor.Decode(&doc); err != nil {
				continue
			}
			file.WriteString(fmt.Sprintf("Document %d: %+v\n", count+1, doc))
			count++
		}
		cursor.Close(ctx)

		file.WriteString(fmt.Sprintf("Total documents: %d\n\n", count))
	}

	fmt.Printf("📦 Backup saved to: %s\n", filename)
	return nil
}
