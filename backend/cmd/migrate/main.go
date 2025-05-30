package main

import (
	"fmt"
	"log"
	"os"
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

	// Setup migration directory path (use relative path to avoid Windows issues)
	migrationsDir := "file://migrations"

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
	m, err := migrate.New(migrationsDir, connectionString)
	if err != nil {
		log.Fatalf("Error creating migration instance: %v", err)
	}
	defer m.Close()

	// Determine action to take
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "up":
			// Apply all up migrations
			if err := m.Up(); err != nil && err != migrate.ErrNoChange {
				log.Fatalf("Error applying migrations: %v", err)
			}
			log.Println("Migrations applied successfully")
		case "down":
			// Apply one down migration
			if err := m.Steps(-1); err != nil && err != migrate.ErrNoChange {
				log.Fatalf("Error reverting migration: %v", err)
			}
			log.Println("Migration reverted successfully")
		case "status":
			// Show current migration status
			showStatus(m)
			return
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
			log.Printf("Migrated to version %d successfully", version)
		case "force":
			if len(os.Args) < 3 {
				log.Fatalf("Please provide version number for force command")
			}
			version, err := strconv.ParseInt(os.Args[2], 10, 64)
			if err != nil {
				log.Fatalf("Invalid version number: %v", err)
			}
			if err := m.Force(int(version)); err != nil {
				log.Fatalf("Error forcing version %d: %v", version, err)
			}
			log.Printf("Forced version to %d successfully", version)
		case "create":
			if len(os.Args) < 3 {
				log.Fatalf("Please provide migration name")
			}
			createMigration(os.Args[2])
			return
		default:
			showHelp()
			return
		}
	} else {
		// Default behavior: run all migrations
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			log.Fatalf("Error applying migrations: %v", err)
		}
		log.Println("Migrations applied successfully")
	}

	// Show final status
	showStatus(m)
}

// createMigration creates a new migration file
func createMigration(name string) {
	timestamp := time.Now().Format("20060102150405")
	baseName := fmt.Sprintf("%s_%s", timestamp, name)

	upFileName := fmt.Sprintf("migrations/%s.up.sql", baseName)
	downFileName := fmt.Sprintf("migrations/%s.down.sql", baseName)

	// Create up migration file
	upFile, err := os.Create(upFileName)
	if err != nil {
		log.Fatalf("Error creating up migration file: %v", err)
	}
	defer upFile.Close()

	// Write template content
	upFile.WriteString("-- Add your up migration SQL here\n")

	// Create down migration file
	downFile, err := os.Create(downFileName)
	if err != nil {
		log.Fatalf("Error creating down migration file: %v", err)
	}
	defer downFile.Close()

	// Write template content
	downFile.WriteString("-- Add your down migration SQL here\n")

	log.Printf("Created migration files:\n%s\n%s", upFileName, downFileName)
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

// showStatus shows the current migration status
func showStatus(m *migrate.Migrate) {
	version, dirty, err := m.Version()
	if err != nil && err != migrate.ErrNilVersion {
		log.Printf("Error getting migration version: %v", err)
		return
	}

	if err == migrate.ErrNilVersion {
		log.Println("Database is clean, no migrations applied")
	} else {
		status := "clean"
		if dirty {
			status = "dirty"
		}
		log.Printf("Current migration status: version %d (%s)", version, status)
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
	fmt.Println("  down         Revert the last migration")
	fmt.Println("  status       Show current migration status")
	fmt.Println("  goto VERSION Migrate to specific version")
	fmt.Println("  force VERSION Force set version without running migrations")
	fmt.Println("  create NAME  Create a new migration")
	fmt.Println("\nExamples:")
	fmt.Println("  migrate                      # Apply all migrations")
	fmt.Println("  migrate up                   # Apply all migrations")
	fmt.Println("  migrate down                 # Revert last migration")
	fmt.Println("  migrate status               # Show current migration status")
	fmt.Println("  migrate goto 2               # Migrate to version 2")
	fmt.Println("  migrate force 2              # Force version to 2")
	fmt.Println("  migrate create add_users     # Create migration files")
}
