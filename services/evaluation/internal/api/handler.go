package api

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"
)

type HealthResponse struct {
	Status    string   `json:"status"`
	Timestamp string   `json:"timestamp"`
	Services  Services `json:"services"`
}

type Services struct {
	Redis string `json:"redis"`
}

type HealthHandler struct {
	RedisClient *redis.Client
}

func (h *HealthHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	status := "OK"
	redisStatus := "OK"
	httpStatus := http.StatusOK

	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	if err := h.RedisClient.Ping(ctx).Err(); err != nil {
		redisStatus = "ERROR"
		httpStatus = http.StatusServiceUnavailable
	}
	if redisStatus == "ERROR" {
		status = "ERROR"
	}

	response := HealthResponse{
		Status:    status,
		Timestamp: time.Now().Format(time.RFC3339),
		Services: Services{
			Redis: redisStatus,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(httpStatus)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

type FlagEvaluationResponse struct {
	Value interface{} `json:"value"`
}

type FlagEvaluationHandler struct {
	RedisClient *redis.Client
}

func (h *FlagEvaluationHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	sdkKey := r.Header.Get("Authorization")
	if sdkKey == "" {
		http.Error(w, "Authorization header with sdk_key is required", http.StatusUnauthorized)
		return
	}

	flagKey := r.PathValue("flagKey")
	if flagKey == "" {
		http.Error(w, "Flag key is required in the URL path", http.StatusBadRequest)
		return
	}

	redisKey := fmt.Sprintf("flag:%s:%s", sdkKey, flagKey)

	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	val, err := h.RedisClient.Get(ctx, redisKey).Result()
	if err != nil {
		if err == redis.Nil {
			composeResponse(w, nil)
			return
		}

		log.Printf("ERROR: Redis GET comman failed for key '%s': %v", redisKey, err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	var data interface{}
	if err := json.Unmarshal([]byte(val), &data); err != nil {
		log.Printf("ERROR: Failed to unmarshal data for key '%s', value %v, error: %v", redisKey, val, err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	composeResponse(w, data)
}

func composeResponse(w http.ResponseWriter, value interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-XSS-Protection", "1; mode=block")
	w.Header().Set("Content-Security-Policy", "default-src 'none'")
	w.Header().Set("X-Frame-Options", "DENY")

	w.Header().Del("X-Powered-By")
	w.Header().Del("Server")

	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(FlagEvaluationResponse{Value: value}); err != nil {
		log.Printf("ERROR: Failed to encode response: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}
