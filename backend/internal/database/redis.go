package database

import (
	"context"
	"time"

	"github.com/go-redis/redis/v8"
)

type RedisClient struct {
	client *redis.Client
}

func NewRedis(addr, password string) *RedisClient {
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       0, // use default DB
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		panic(err)
	}

	return &RedisClient{client: client}
}

func (r *RedisClient) Set(key string, value interface{}, expiration time.Duration) error {
	return r.client.Set(context.Background(), key, value, expiration).Err()
}

func (r *RedisClient) Get(key string) (string, error) {
	return r.client.Get(context.Background(), key).Result()
}

func (r *RedisClient) Incr(key string) (int64, error) {
	return r.client.Incr(context.Background(), key).Result()
}

func (r *RedisClient) Expire(key string, expiration time.Duration) error {
	return r.client.Expire(context.Background(), key, expiration).Err()
}

func (r *RedisClient) LPush(key string, values ...interface{}) error {
	return r.client.LPush(context.Background(), key, values...).Err()
}

func (r *RedisClient) BRPop(timeout time.Duration, keys ...string) ([]string, error) {
	return r.client.BRPop(context.Background(), timeout, keys...).Result()
}

func (r *RedisClient) Keys(pattern string) ([]string, error) {
	return r.client.Keys(context.Background(), pattern).Result()
}

func (r *RedisClient) Del(keys ...string) error {
	return r.client.Del(context.Background(), keys...).Err()
}
