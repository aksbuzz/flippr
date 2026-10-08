package config

import (
	"github.com/redis/go-redis/v9"
)

type RedisConfig struct {
	Address  string
	Password string
	DB       int
}

func NewRedisClient(cfg RedisConfig) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     cfg.Address,
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	return client, nil
}
