package environments

import "github.com/user/tennis-connect/config"

// Production returns production environment configuration defaults
func Production() *config.Config {
	// Server config
	serverConfig := config.ServerConfig{
		Port: "8080", // Default, should be overridden by environment variable
		Host: "",
	}

	// Database config - use strong defaults, but expect env vars to override
	dbConfig := config.DatabaseConfig{
		Host:     "db", // Assuming a container setup where "db" is the database host
		Port:     "5432",
		User:     "app_user",
		Password: "use_env_variable", // This should be overridden by env variable
		DBName:   "tennis_connect_prod",
		SSLMode:  "require", // Use SSL in production
	}

	// JWT config
	jwtConfig := config.JWTConfig{
		Secret:     "use_env_variable", // This should be overridden by env variable
		Expiration: 30,                 // minutes
	}

	return &config.Config{
		Environment: "production",
		Server:      serverConfig,
		Database:    dbConfig,
		JWT:         jwtConfig,
	}
}
