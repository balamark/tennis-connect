package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq" // PostgreSQL driver
	"github.com/user/tennis-connect/config"
)

// DB is a wrapper around the standard sql.DB
type DB struct {
	*sql.DB
	Config *config.Config
}

// Connect establishes a connection to the database
func Connect(cfg *config.Config) (*DB, error) {
	connStr := cfg.Database.GetConnectionString()

	// Connect to the database
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("error opening database connection: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Check the connection
	err = db.Ping()
	if err != nil {
		return nil, fmt.Errorf("error connecting to the database: %w", err)
	}

	log.Println("Successfully connected to the database")
	return &DB{DB: db, Config: cfg}, nil
}

// RunMigrations applies database migrations from the specified directory
func (db *DB) RunMigrations(migrationsPath string) error {
	if db == nil || db.DB == nil {
		return fmt.Errorf("database not initialized")
	}

	driver, err := postgres.WithInstance(db.DB, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("failed to create postgres driver: %w", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		fmt.Sprintf("file://%s", migrationsPath),
		"postgres", driver)
	if err != nil {
		return fmt.Errorf("failed to create migration instance: %w", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Migrations applied successfully")
	return nil
}

// Close closes the database connection
func (db *DB) Close() error {
	if db == nil || db.DB == nil {
		return nil
	}
	return db.DB.Close()
}

// Ping checks if the database connection is alive
func (db *DB) Ping() error {
	if db == nil || db.DB == nil {
		return fmt.Errorf("database not initialized")
	}
	return db.DB.Ping()
}
