package config

import (
	"os"
	"strings"
)

type Config struct {
	Server ServerConfig
	Redis  RedisConfig
}

type ServerConfig struct {
	Address string
	// CORSAllowedOrigins lists origins allowed to call the API from a browser.
	// Empty (the default) disables CORS; "*" allows any origin.
	CORSAllowedOrigins []string
}

func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Address:            getEnv("SERVER_ADDRESS", ":8080"),
			CORSAllowedOrigins: splitList(getEnv("CORS_ALLOWED_ORIGINS", "")),
		},
		Redis: RedisConfig{
			Address:  getEnv("REDIS_ADDR", "localhost:6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       0,
		},
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func splitList(value string) []string {
	var out []string
	for _, part := range strings.Split(value, ",") {
		if part = strings.TrimSpace(part); part != "" {
			out = append(out, part)
		}
	}
	return out
}
