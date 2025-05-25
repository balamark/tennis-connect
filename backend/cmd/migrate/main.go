package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"
	"github.com/user/tennis-connect/config"
)

func main() {
	// Load environment variables
	loadEnvForEnvironment()

	// Load configuration
	cfg := config.LoadConfig()

	// Setup migration directory path
	migrationsDir := getMigrationsDir()

	// Create migration instance
	connectionString := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.DBName,
		cfg.Database.SSLMode,
	)

	// Create a new migrate instance
	m, err := migrate.New(
		"file://"+migrationsDir,
		connectionString,
	)
	if err != nil {
		log.Fatalf("Error creating migration instance: %v", err)
	}

	// Determine action to take
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "up":
			// Apply all up migrations
			if err := m.Up(); err != nil && err != migrate.ErrNoChange {
				log.Fatalf("Error applying migrations: %v", err)
			}
		case "down":
			// Apply all down migrations
			if err := m.Down(); err != nil && err != migrate.ErrNoChange {
				log.Fatalf("Error reverting migrations: %v", err)
			}
		case "goto":
			if len(os.Args) < 3 {
				log.Fatalf("Please provide version number for goto command")
			}
			version, err := strconv.ParseUint(os.Args[2], 10, 64)
			if err != nil {
				log.Fatalf("Invalid version number: %v", err)
			}
			if err := m.Migrate(uint(version)); err != nil && err != migrate.ErrNoChange {
				log.Fatalf("Error migrating to version %d: %v", version, err)
			}
		case "force":
			if len(os.Args) < 3 {
				log.Fatalf("Please provide version number for force command")
			}
			version, err := strconv.ParseUint(os.Args[2], 10, 64)
			if err != nil {
				log.Fatalf("Invalid version number: %v", err)
			}
			if err := m.Force(int(version)); err != nil {
				log.Fatalf("Error forcing version %d: %v", version, err)
			}
		case "create":
			if len(os.Args) < 3 {
				log.Fatalf("Please provide migration name")
			}
			createMigration(migrationsDir, os.Args[2])
		default:
			showHelp()
		}
	} else {
		// Default behavior: run all migrations
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			log.Fatalf("Error applying migrations: %v", err)
		}
	}

	// Get migration version
	version, dirty, err := m.Version()
	if err != nil && err != migrate.ErrNilVersion {
		log.Fatalf("Error getting migration version: %v", err)
	}

	// Print success message
	if err == migrate.ErrNilVersion {
		log.Println("Database is clean, no migrations applied")
	} else {
		status := "clean"
		if dirty {
			status = "dirty"
		}
		log.Printf("Migration successful. Current version: %d (%s)", version, status)
	}
}

// createMigration creates a new migration file
func createMigration(dir, name string) {
	timestamp := time.Now().Format("20060102150405")
	baseName := fmt.Sprintf("%s_%s", timestamp, name)

	upFileName := filepath.Join(dir, baseName+".up.sql")
	downFileName := filepath.Join(dir, baseName+".down.sql")

	// Create up migration file
	upFile, err := os.Create(upFileName)
	if err != nil {
		log.Fatalf("Error creating up migration file: %v", err)
	}
	defer upFile.Close()

	// Create down migration file
	downFile, err := os.Create(downFileName)
	if err != nil {
		log.Fatalf("Error creating down migration file: %v", err)
	}
	defer downFile.Close()

	log.Printf("Created migration files:\n%s\n%s", upFileName, downFileName)
}

// getMigrationsDir returns the path to the migrations directory
func getMigrationsDir() string {
	// Get the absolute path of the current executable
	execPath, err := os.Executable()
	if err != nil {
		execPath = "."
	}

	// Determine the migrations directory
	migrationsPaths := []string{
		"./migrations",  // From current working directory
		"../migrations", // One directory up
		filepath.Join(filepath.Dir(execPath), "migrations"), // Relative to executable
	}

	// Try each path until we find one with migration files
	for _, path := range migrationsPaths {
		absPath, err := filepath.Abs(path)
		if err != nil {
			continue
		}

		if _, err := os.Stat(absPath); err == nil {
			return absPath
		}
	}

	// Default to ./migrations if no other path is found
	return "./migrations"
}

// loadEnvForEnvironment loads environment variables based on APP_ENV
func loadEnvForEnvironment() {
	// Try to load .env file
	envFiles := []string{
		".env",
		"../.env",
	}

	for _, file := range envFiles {
		if _, err := os.Stat(file); err == nil {
			if err := godotenv.Load(file); err != nil {
				log.Printf("Warning: Error loading %s file: %v", file, err)
			} else {
				break
			}
		}
	}

	// Check if APP_ENV is set
	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "development"
		os.Setenv("APP_ENV", appEnv)
	}

	// Try to load environment-specific .env file
	envFileName := fmt.Sprintf(".env.%s", appEnv)
	envFiles = []string{
		envFileName,
		"../" + envFileName,
	}

	for _, file := range envFiles {
		if _, err := os.Stat(file); err == nil {
			if err := godotenv.Load(file); err != nil {
				log.Printf("Warning: Error loading %s file: %v", file, err)
			} else {
				break
			}
		}
	}
}

// showHelp displays usage information
func showHelp() {
	fmt.Println("Database Migration Utility")
	fmt.Println("\nUsage:")
	fmt.Println("  migrate [command] [args]")
	fmt.Println("\nCommands:")
	fmt.Println("  (none)       Run all pending migrations (same as 'up')")
	fmt.Println("  up           Apply all pending migrations")
	fmt.Println("  down         Revert all migrations")
	fmt.Println("  goto VERSION Migrate to specific version")
	fmt.Println("  force VERSION Force set version without running migrations")
	fmt.Println("  create NAME  Create a new migration")
	fmt.Println("\nExamples:")
	fmt.Println("  migrate                      # Apply all migrations")
	fmt.Println("  migrate up                   # Apply all migrations")
	fmt.Println("  migrate down                 # Revert all migrations")
	fmt.Println("  migrate goto 20221015120000  # Migrate to specific version")
	fmt.Println("  migrate create add_users     # Create migration files")
}
