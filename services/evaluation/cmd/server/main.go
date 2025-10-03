package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/aksbuzz/flippr/services/evaluation/internal/api"
	"github.com/aksbuzz/flippr/services/evaluation/internal/config"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)
	cfg := config.Load()

	redisClient, err := config.NewRedisClient(cfg.Redis)
	if err != nil {
		slog.Error("Failed to connect to Redis", "err", err)
		os.Exit(1)
	}
	defer redisClient.Close()

	ctx, cancel := context.WithTimeout((context.Background()), 5*time.Second)
	defer cancel()
	if err := redisClient.Ping(ctx).Err(); err != nil {
		slog.Error("Failed to connect to Redis", "err", err)
		os.Exit(1)
	}

	slog.Info("Connected to Redis")

	router := api.LogginMiddleware(api.NewRouter(redisClient), logger)

	server := &http.Server{
		Addr:         cfg.Server.Address,
		Handler:      router,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  15 * time.Second,
	}

	slog.Info("Starting server", "port", cfg.Server.Address)

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		slog.Error("Could not listen on %s: %v", cfg.Server.Address, err)
		os.Exit(1)
	}
}
