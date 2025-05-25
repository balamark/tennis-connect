package environments

import "github.com/user/tennis-connect/config"

// Test returns test environment configuration defaults
func Test() *config.Config {
	// Server config
	serverConfig := config.ServerConfig{
		Port: "8081", // Use a different port for tests
		Host: "",
	}

	// Database config
	dbConfig := config.DatabaseConfig{
		Host:     "localhost",
		Port:     "5432",
		User:     "postgres",
		Password: "postgres",
		DBName:   "tennis_connect_test",
		SSLMode:  "disable",
	}

	// JWT config
	jwtConfig := config.JWTConfig{
		Secret:     "test-secret-key",
		Expiration: 60, // minutes
	}

	return &config.Config{
		Environment: "test",
		Server:      serverConfig,
		Database:    dbConfig,
		JWT:         jwtConfig,
	}
}
