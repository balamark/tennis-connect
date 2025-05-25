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

// LoadConfig loads configuration based on the environment
func LoadConfig() *Config {
	// Load environment defaults
	var config *Config

	// Get environment
	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}

	// Initialize config with environment defaults
	switch env {
	case "production":
		config = loadProductionConfig()
	case "test":
		config = loadTestConfig()
	default:
		config = loadDevelopmentConfig()
	}

	// Override with environment variables
	config = overrideWithEnvVars(config)

	return config
}

// loadDevelopmentConfig loads development environment configuration
func loadDevelopmentConfig() *Config {
	// Server config
	serverConfig := ServerConfig{
		Port: "8080",
		Host: "",
	}

	// Database config
	dbConfig := DatabaseConfig{
		Host:     "localhost",
		Port:     "5432",
		User:     "postgres",
		Password: "postgres",
		DBName:   "tennis_connect_dev",
		SSLMode:  "disable",
	}

	// JWT config
	jwtConfig := JWTConfig{
		Secret:     "your-development-secret-key",
		Expiration: 60, // minutes
	}

	return &Config{
		Environment: "development",
		Server:      serverConfig,
		Database:    dbConfig,
		JWT:         jwtConfig,
	}
}

// loadProductionConfig loads production environment configuration
func loadProductionConfig() *Config {
	// Server config
	serverConfig := ServerConfig{
		Port: "8080",
		Host: "",
	}

	// Database config
	dbConfig := DatabaseConfig{
		Host:     "db",
		Port:     "5432",
		User:     "app_user",
		Password: "use_env_variable",
		DBName:   "tennis_connect_prod",
		SSLMode:  "require",
	}

	// JWT config
	jwtConfig := JWTConfig{
		Secret:     "use_env_variable",
		Expiration: 30, // minutes
	}

	return &Config{
		Environment: "production",
		Server:      serverConfig,
		Database:    dbConfig,
		JWT:         jwtConfig,
	}
}

// loadTestConfig loads test environment configuration
func loadTestConfig() *Config {
	// Server config
	serverConfig := ServerConfig{
		Port: "8081", // Use a different port for tests
		Host: "",
	}

	// Database config
	dbConfig := DatabaseConfig{
		Host:     "localhost",
		Port:     "5432",
		User:     "postgres",
		Password: "postgres",
		DBName:   "tennis_connect_test",
		SSLMode:  "disable",
	}

	// JWT config
	jwtConfig := JWTConfig{
		Secret:     "test-secret-key",
		Expiration: 60, // minutes
	}

	return &Config{
		Environment: "test",
		Server:      serverConfig,
		Database:    dbConfig,
		JWT:         jwtConfig,
	}
}

// overrideWithEnvVars overrides configuration with environment variables
func overrideWithEnvVars(config *Config) *Config {
	// Server config
	if port := os.Getenv("SERVER_PORT"); port != "" {
		config.Server.Port = port
	}
	if host := os.Getenv("SERVER_HOST"); host != "" {
		config.Server.Host = host
	}

	// Database config
	if host := os.Getenv("DB_HOST"); host != "" {
		config.Database.Host = host
	}
	if port := os.Getenv("DB_PORT"); port != "" {
		config.Database.Port = port
	}
	if user := os.Getenv("DB_USER"); user != "" {
		config.Database.User = user
	}
	if password := os.Getenv("DB_PASSWORD"); password != "" {
		config.Database.Password = password
	}
	if dbName := os.Getenv("DB_NAME"); dbName != "" {
		config.Database.DBName = dbName
	}
	if sslMode := os.Getenv("DB_SSLMODE"); sslMode != "" {
		config.Database.SSLMode = sslMode
	}

	// JWT config
	if secret := os.Getenv("JWT_SECRET"); secret != "" {
		config.JWT.Secret = secret
	}
	if expirationStr := os.Getenv("JWT_EXPIRATION"); expirationStr != "" {
		if expiration, err := strconv.Atoi(expirationStr); err == nil {
			config.JWT.Expiration = expiration
		}
	}

	return config
}

// IsDevelopment returns true if the environment is development
func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

// IsProduction returns true if the environment is production
func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}

// IsTest returns true if the environment is test
func (c *Config) IsTest() bool {
	return c.Environment == "test"
}

// Helper to get environment variables with defaults
func getEnvOrDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
