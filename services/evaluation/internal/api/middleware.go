package api

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
)

type ctxKeyLogger struct{}

func LogginMiddleware(next http.Handler, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		requestID := uuid.New().String()

		requestLogger := logger.With(
			"request_id", requestID,
			"method", r.Method,
			"path", r.URL.Path,
		)

		ctx := context.WithValue(r.Context(), ctxKeyLogger{}, requestLogger)

		next.ServeHTTP(w, r.WithContext(ctx))

		requestLogger.Info("Request completed", "duration", time.Since(start))
	})
}
