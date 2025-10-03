package api

import (
	"net/http"

	"github.com/redis/go-redis/v9"
)

func NewRouter(redisClient *redis.Client) http.Handler {
	mux := http.NewServeMux()

	healthHandler := &HealthHandler{RedisClient: redisClient}
	mux.HandleFunc("GET /api/v1/health", healthHandler.ServeHTTP)

	evaluateHandler := &FlagEvaluationHandler{RedisClient: redisClient}
	mux.HandleFunc("GET /api/v1/evaluate/flags/{flagKey}", evaluateHandler.ServeHTTP)

	return mux
}
