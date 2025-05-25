package environments

import "github.com/user/tennis-connect/config"

// Development returns development environment configuration defaults
func Development() *config.Config {
	// Server config
	serverConfig := config.ServerConfig{
		Port: "8080",
		Host: "",
	}

	// Database config
	dbConfig := config.DatabaseConfig{
		Host:     "localhost",
		Port:     "5432",
		User:     "postgres",
		Password: "postgres",
		DBName:   "tennis_connect_dev",
		SSLMode:  "disable",
	}

	// JWT config
	jwtConfig := config.JWTConfig{
		Secret:     "your-development-secret-key",
		Expiration: 60, // minutes
	}

	return &config.Config{
		Environment: "development",
		Server:      serverConfig,
		Database:    dbConfig,
		JWT:         jwtConfig,
	}
}
