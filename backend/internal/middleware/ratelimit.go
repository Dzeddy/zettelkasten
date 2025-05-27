package middleware

import (
	"fmt"
	"net/http"
	"time"

	"zettelkasten/internal/database"
)

func RateLimitMiddleware(redis *database.RedisClient, limit int, window time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userID := r.Context().Value("user_id").(string)
			key := fmt.Sprintf("rate_limit:%s:%s", userID, r.URL.Path)

			count, err := redis.Incr(key)
			if err != nil {
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				return
			}

			if count == 1 {
				redis.Expire(key, window)
			}

			if count > int64(limit) {
				w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", limit))
				w.Header().Set("X-RateLimit-Remaining", "0")
				http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
				return
			}

			w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", limit))
			w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", limit-int(count)))

			next.ServeHTTP(w, r)
		})
	}
}
