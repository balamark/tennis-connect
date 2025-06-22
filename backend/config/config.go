package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds all application configuration
type Config struct {
	Environment string
	Server      ServerConfig
	Database    DatabaseConfig
	JWT         JWTConfig
}

// ServerConfig holds server-related configuration
type ServerConfig struct {
	Port string
	Host string
}

// DatabaseConfig holds database connection configuration
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// JWTConfig holds JWT-related configuration
type JWTConfig struct {
	Secret     string
	Expiration int // in minutes
}

// GetConnectionString returns a formatted database connection string
func (c *DatabaseConfig) GetConnectionString() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, c.Password, c.DBName, c.SSLMode,
	)
}

// LoadConfig loads configuration with sensible defaults, overridden by environment variables
func LoadConfig() *Config {
	// Default configuration that works for both local and deployment
	config := &Config{
		Environment: getEnvOrDefault("APP_ENV", "development"),
		Server: ServerConfig{
			Port: getEnvOrDefault("PORT", getEnvOrDefault("SERVER_PORT", "8080")),
			Host: getEnvOrDefault("SERVER_HOST", ""),
		},
		Database: DatabaseConfig{
			Host:     getEnvOrDefault("DB_HOST", "db"),
			Port:     getEnvOrDefault("DB_PORT", "5432"),
			User:     getEnvOrDefault("DB_USER", "postgres"),
			Password: getEnvOrDefault("DB_PASSWORD", "postgres"),
			DBName:   getEnvOrDefault("DB_NAME", "tennis_connect"),
			SSLMode:  getEnvOrDefault("DB_SSLMODE", "disable"),
		},
		JWT: JWTConfig{
			Secret:     getEnvOrDefault("JWT_SECRET", "tennis-connect-secret-key-change-in-production"),
			Expiration: getEnvAsIntOrDefault("JWT_EXPIRATION", 60), // minutes
		},
	}

	return config
}

// Helper functions
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsIntOrDefault(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// Utility methods for environment checking
func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}
