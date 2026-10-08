package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
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
		slog.Error("Failed to create Redis client", "err", err)
		os.Exit(1)
	}
	defer redisClient.Close()

	pingCtx, cancelPing := context.WithTimeout(context.Background(), 5*time.Second)
	err = redisClient.Ping(pingCtx).Err()
	cancelPing()
	if err != nil {
		slog.Error("Failed to connect to Redis", "err", err)
		os.Exit(1)
	}
	slog.Info("Connected to Redis")

	handler := api.LoggingMiddleware(
		api.CORS(api.NewRouter(redisClient), cfg.Server.CORSAllowedOrigins),
		logger,
	)

	server := &http.Server{
		Addr:         cfg.Server.Address,
		Handler:      handler,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  15 * time.Second,
	}

	// Stop on SIGINT/SIGTERM and let in-flight requests finish.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	serverErr := make(chan error, 1)
	go func() {
		slog.Info("Starting server", "addr", cfg.Server.Address, "cors_origins", cfg.Server.CORSAllowedOrigins)
		serverErr <- server.ListenAndServe()
	}()

	select {
	case err := <-serverErr:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("Could not listen", "addr", cfg.Server.Address, "err", err)
			os.Exit(1)
		}
	case <-ctx.Done():
		slog.Info("Shutting down")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			slog.Error("Graceful shutdown failed", "err", err)
			os.Exit(1)
		}
	}
}
