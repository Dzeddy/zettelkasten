package queue

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"time"

	"zettelkasten/internal/database"
	"zettelkasten/internal/models"
	"zettelkasten/internal/services"
)

type JobQueue struct {
	redis           *database.RedisClient
	documentService *services.DocumentService
	eventService    *services.EventService
	// embeddingService is removed
}

type JobItem struct {
	JobID      string    `json:"job_id"`
	UserID     string    `json:"user_id"`
	Filename   string    `json:"filename"`
	SourceType string    `json:"source_type"`
	FileData   []byte    `json:"file_data"`
	CreatedAt  time.Time `json:"created_at"`
	Status     string    `json:"status"`
}

func NewJobQueue(redis *database.RedisClient, docService *services.DocumentService, eventService *services.EventService) *JobQueue {
	return &JobQueue{
		redis:           redis,
		documentService: docService,
		eventService:    eventService,
	}
}

func (q *JobQueue) Start() {
	q.StartWithContext(context.Background())
}

func (q *JobQueue) StartWithContext(ctx context.Context) {
	log.Println("Starting job queue processor...")

	// Resume any unprocessed jobs on startup
	q.resumeUnprocessedJobs()

	for {
		select {
		case <-ctx.Done():
			log.Println("Job queue processor shutting down...")
			return
		default:
			// Pop job from queue with shorter timeout to check context more frequently
			jobData, err := q.redis.BRPop(2*time.Second, "job_queue")
			if err != nil {
				// Check if context was cancelled during the wait
				if ctx.Err() != nil {
					log.Println("Job queue processor shutting down...")
					return
				}
				time.Sleep(1 * time.Second)
				continue
			}

			if len(jobData) < 2 {
				continue
			}

			var job JobItem
			if err := json.Unmarshal([]byte(jobData[1]), &job); err != nil {
				log.Printf("Error unmarshaling job: %v", err)
				continue
			}

			// Log the currently processed file
			log.Printf("Processing file: %s (Job ID: %s, User ID: %s, Source: %s)",
				job.Filename, job.JobID, job.UserID, job.SourceType)

			// Process job with context
			q.processJobWithContext(ctx, &job)
		}
	}
}

// resumeUnprocessedJobs checks for any jobs that were being processed when the server shut down
func (q *JobQueue) resumeUnprocessedJobs() {
	log.Println("Checking for unprocessed jobs to resume...")

	// Get all job keys that might be in processing state
	keys, err := q.redis.Keys("job:*")
	if err != nil {
		log.Printf("Error getting job keys: %v", err)
		return
	}

	resumedCount := 0
	for _, key := range keys {
		// Skip error keys
		if len(key) > 6 && key[len(key)-7:] == ":errors" {
			continue
		}

		jobData, err := q.redis.Get(key)
		if err != nil {
			continue
		}

		var jobStatus map[string]interface{}
		if err := json.Unmarshal([]byte(jobData), &jobStatus); err != nil {
			continue
		}

		// Check if job was in processing state
		if status, ok := jobStatus["status"].(string); ok && status == "processing" {
			// Extract job ID from key (format: "job:jobID")
			jobID := key[4:] // Remove "job:" prefix

			// Try to get the original job item from persistent storage
			persistentJobData, err := q.redis.Get(fmt.Sprintf("persistent_job:%s", jobID))
			if err != nil {
				log.Printf("Could not find persistent job data for job %s", jobID)
				// Mark as failed since we can't resume without the original data
				q.updateJobStatus(jobID, "failed", 100)
				q.addJobError(jobID, "Job data lost during server restart")
				continue
			}

			var job JobItem
			if err := json.Unmarshal([]byte(persistentJobData), &job); err != nil {
				log.Printf("Error unmarshaling persistent job %s: %v", jobID, err)
				continue
			}

			log.Printf("Resuming interrupted job: %s (File: %s)", jobID, job.Filename)

			// Reset status to pending and re-queue
			job.Status = "pending"
			q.updateJobStatus(jobID, "pending", 0)

			// Re-queue the job
			jobData, err := json.Marshal(job)
			if err != nil {
				log.Printf("Error marshaling job for re-queue: %v", err)
				continue
			}

			if err := q.redis.LPush("job_queue", string(jobData)); err != nil {
				log.Printf("Error re-queuing job %s: %v", jobID, err)
				continue
			}

			resumedCount++
		}
	}

	if resumedCount > 0 {
		log.Printf("Resumed %d interrupted jobs", resumedCount)
	} else {
		log.Println("No interrupted jobs found to resume")
	}
}

func (q *JobQueue) QueueFile(jobID, userID string, file io.Reader, filename, sourceType string) error {
	job := JobItem{
		JobID:      jobID,
		UserID:     userID,
		Filename:   filename,
		SourceType: sourceType,
		CreatedAt:  time.Now(),
		Status:     "pending",
	}

	// Read file data
	data, err := io.ReadAll(file)
	if err != nil {
		return err
	}
	job.FileData = data

	// Store persistent copy of job data for recovery
	persistentJobData, err := json.Marshal(job)
	if err != nil {
		return err
	}

	// Store with longer expiration (7 days) for recovery purposes
	if err := q.redis.Set(fmt.Sprintf("persistent_job:%s", jobID), string(persistentJobData), 7*24*time.Hour); err != nil {
		log.Printf("Warning: Could not store persistent job data for %s: %v", jobID, err)
	}

	// Push to queue
	jobData, err := json.Marshal(job)
	if err != nil {
		return err
	}

	log.Printf("Queued file for processing: %s (Job ID: %s, User ID: %s, Source: %s)",
		filename, jobID, userID, sourceType)

	return q.redis.LPush("job_queue", string(jobData))
}

func (q *JobQueue) processJob(job *JobItem) {
	q.processJobWithContext(context.Background(), job)
}

func (q *JobQueue) processJobWithContext(ctx context.Context, job *JobItem) {
	// Update job status and emit event
	q.updateJobStatus(job.JobID, "processing", 0)
	if q.eventService != nil {
		q.eventService.JobProgressUpdate(job.UserID, job.JobID, 0, "processing")
	}

	job.Status = "processing"
	log.Printf("Started processing file: %s", job.Filename)

	// Check if context was cancelled before starting processing
	if ctx.Err() != nil {
		log.Printf("Job processing cancelled for file: %s", job.Filename)
		// Re-queue the job since it wasn't processed
		jobData, _ := json.Marshal(*job)
		q.redis.LPush("job_queue", string(jobData))
		return
	}

	// Process file
	err := q.documentService.ProcessFile(
		ctx,
		job.JobID,
		job.UserID,
		bytes.NewReader(job.FileData),
		job.Filename,
		job.SourceType,
	)

	if err != nil {
		log.Printf("Failed to process file %s: %v", job.Filename, err)
		q.updateJobStatus(job.JobID, "failed", 100)
		q.addJobError(job.JobID, err.Error())
		if q.eventService != nil {
			q.eventService.JobFailed(job.UserID, job.JobID, err.Error())
		}
		job.Status = "failed"
	} else {
		log.Printf("Successfully processed file: %s", job.Filename)
		q.updateJobStatus(job.JobID, "completed", 100)
		if q.eventService != nil {
			q.eventService.JobCompleted(job.UserID, job.JobID)
		}
		job.Status = "completed"
	}

	// Clean up persistent job data after completion/failure
	q.redis.Del(fmt.Sprintf("persistent_job:%s", job.JobID))
}

func (q *JobQueue) updateJobStatus(jobID, status string, progress int) {
	key := fmt.Sprintf("job:%s", jobID)
	jobData := map[string]interface{}{
		"status":   status,
		"progress": progress,
	}

	if status == "completed" || status == "failed" {
		jobData["completed_at"] = time.Now()
	}

	data, _ := json.Marshal(jobData)
	q.redis.Set(key, string(data), 24*time.Hour)
}

func (q *JobQueue) addJobError(jobID, errorMsg string) {
	key := fmt.Sprintf("job:%s:errors", jobID)
	q.redis.LPush(key, errorMsg)
}

func (q *JobQueue) GetJobStatus(jobID, userID string) (*models.Job, error) {
	key := fmt.Sprintf("job:%s", jobID)
	data, err := q.redis.Get(key)
	if err != nil {
		return nil, err
	}

	var jobData map[string]interface{}
	if err := json.Unmarshal([]byte(data), &jobData); err != nil {
		return nil, err
	}

	job := &models.Job{
		ID:     jobID,
		UserID: userID,
	}

	if status, ok := jobData["status"].(string); ok {
		job.Status = status
	}

	if progress, ok := jobData["progress"].(float64); ok {
		job.Progress = int(progress)
	}

	return job, nil
}
