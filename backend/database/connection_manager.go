package database

import (
	"fmt"
	"log"
	"time"

	"github.com/user/tennis-connect/config"
)

// ConnectionManager handles database connections with retry logic
type ConnectionManager struct {
	config    *config.Config
	db        *DB
	isHealthy bool
	retries   int
	maxRetries int
}

// NewConnectionManager creates a new connection manager
func NewConnectionManager(cfg *config.Config) *ConnectionManager {
	return &ConnectionManager{
		config:     cfg,
		maxRetries: 10, // Maximum retry attempts
		retries:    0,
		isHealthy:  false,
	}
}

// ConnectWithRetry attempts to connect to the database with retry logic
func (cm *ConnectionManager) ConnectWithRetry() (*DB, error) {
	for cm.retries < cm.maxRetries {
		db, err := Connect(cm.config)
		if err == nil {
			cm.db = db
			cm.isHealthy = true
			log.Printf("Successfully connected to database after %d attempts", cm.retries+1)
			return db, nil
		}

		cm.retries++
		backoffDuration := time.Duration(cm.retries*cm.retries) * time.Second // Exponential backoff
		if backoffDuration > 30*time.Second {
			backoffDuration = 30 * time.Second // Cap at 30 seconds
		}

		log.Printf("Database connection attempt %d/%d failed: %v. Retrying in %v...", 
			cm.retries, cm.maxRetries, err, backoffDuration)
		
		time.Sleep(backoffDuration)
	}

	return nil, fmt.Errorf("failed to connect to database after %d attempts", cm.maxRetries)
}

// StartBackgroundReconnection starts a background goroutine that attempts to reconnect if connection is lost
func (cm *ConnectionManager) StartBackgroundReconnection() {
	go func() {
		ticker := time.NewTicker(30 * time.Second) // Check every 30 seconds
		defer ticker.Stop()

		for range ticker.C {
			if !cm.isHealthy {
				log.Println("Database connection lost, attempting to reconnect...")
				db, err := cm.ConnectWithRetry()
				if err == nil {
					cm.db = db
					cm.isHealthy = true
					log.Println("Database connection restored")
				}
			} else if cm.db != nil {
				// Ping the database to check if connection is still alive
				if err := cm.db.Ping(); err != nil {
					log.Printf("Database ping failed: %v", err)
					cm.isHealthy = false
					cm.retries = 0 // Reset retry counter
				}
			}
		}
	}()
}

// GetDatabase returns the current database connection if healthy
func (cm *ConnectionManager) GetDatabase() *DB {
	if cm.isHealthy && cm.db != nil {
		return cm.db
	}
	return nil
}

// IsHealthy returns whether the database connection is healthy
func (cm *ConnectionManager) IsHealthy() bool {
	return cm.isHealthy
}

// SetDatabase manually sets the database connection and marks it as healthy
func (cm *ConnectionManager) SetDatabase(db *DB) {
	cm.db = db
	cm.isHealthy = true
	cm.retries = 0
}

// GetConnectionStatus returns detailed connection status
func (cm *ConnectionManager) GetConnectionStatus() map[string]interface{} {
	status := map[string]interface{}{
		"healthy":     cm.isHealthy,
		"attempts":    cm.retries,
		"max_retries": cm.maxRetries,
		"connected":   cm.db != nil,
	}

	if cm.db != nil {
		status["connection_string"] = cm.config.Database.GetConnectionString()
	}

	return status
} 