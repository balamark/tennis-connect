package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/user/tennis-connect/config"
	"github.com/user/tennis-connect/database"
	"github.com/user/tennis-connect/handlers"
	"github.com/user/tennis-connect/repository"
)

func main() {
	// Load environment variables based on APP_ENV
	loadEnvForEnvironment()

	// Load configuration
	cfg := config.LoadConfig()

	// Configure Gin mode based on environment
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	// Connect to database
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Run migrations if not in production (in production, migrations should be run separately)
	if !cfg.IsProduction() {
		migrationsPath := filepath.Join(".", "migrations")
		if err := db.RunMigrations(migrationsPath); err != nil {
			log.Fatalf("Failed to run migrations: %v", err)
		}
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	courtRepo := repository.NewCourtRepository(db)
	bulletinRepo := repository.NewBulletinRepository(db)
	eventRepo := repository.NewEventRepository(db)
	communityRepo := repository.NewCommunityRepository(db)

	// Initialize handlers
	userHandler := handlers.NewUserHandler(userRepo)
	courtHandler := handlers.NewCourtHandler(courtRepo)
	bulletinHandler := handlers.NewBulletinHandler(bulletinRepo)
	eventHandler := handlers.NewEventHandler(eventRepo)
	communityHandler := handlers.NewCommunityHandler(communityRepo)

	// Initialize Gin router
	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization"},
		AllowCredentials: true,
	}))

	// Routes
	setupRoutes(r, userHandler, courtHandler, bulletinHandler, eventHandler, communityHandler)

	// Start server
	serverAddr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	fmt.Printf("Server running in %s mode on %s\n", cfg.Environment, serverAddr)
	if err := r.Run(serverAddr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// loadEnvForEnvironment loads environment variables based on APP_ENV
func loadEnvForEnvironment() {
	// Default to development environment
	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}

	// Load base .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load environment-specific .env file
	envFile := fmt.Sprintf(".env.%s", env)
	if err := godotenv.Load(envFile); err != nil {
		log.Printf("No %s file found, using base environment variables", envFile)
	}

	// Set APP_ENV if not already set
	if os.Getenv("APP_ENV") == "" {
		os.Setenv("APP_ENV", env)
	}
}

func setupRoutes(r *gin.Engine, userHandler *handlers.UserHandler,
	courtHandler *handlers.CourtHandler, bulletinHandler *handlers.BulletinHandler,
	eventHandler *handlers.EventHandler, communityHandler *handlers.CommunityHandler) {
	// API routes
	api := r.Group("/api")
	{
		// Health check
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status": "ok",
			})
		})

		// User routes
		userRoutes := api.Group("/users")
		{
			userRoutes.POST("/register", userHandler.RegisterUser)
			userRoutes.POST("/login", userHandler.LoginUser)
			userRoutes.GET("/profile/:id", authMiddleware(), userHandler.GetUserProfile)
			userRoutes.PUT("/profile", authMiddleware(), userHandler.UpdateUserProfile)
			userRoutes.GET("/nearby", authMiddleware(), userHandler.GetNearbyUsers)
			userRoutes.POST("/like/:id", authMiddleware(), userHandler.LikeUser)
		}

		// Courts routes
		courtRoutes := api.Group("/courts")
		{
			courtRoutes.GET("/", authMiddleware(), courtHandler.GetCourts)
			courtRoutes.GET("/:id", authMiddleware(), courtHandler.GetCourtDetails)
			courtRoutes.POST("/checkin/:id", authMiddleware(), courtHandler.CheckInToCourt)
			courtRoutes.POST("/checkout/:id", authMiddleware(), courtHandler.CheckOutFromCourt)
		}

		// Events routes
		eventRoutes := api.Group("/events")
		{
			eventRoutes.GET("/", authMiddleware(), eventHandler.GetEvents)
			eventRoutes.GET("/:id", authMiddleware(), eventHandler.GetEventDetails)
			eventRoutes.POST("/", authMiddleware(), eventHandler.CreateEvent)
			eventRoutes.POST("/:id/rsvp", authMiddleware(), eventHandler.RSVPToEvent)
		}

		// Looking-to-play bulletin routes
		bulletinRoutes := api.Group("/bulletins")
		{
			bulletinRoutes.GET("/", authMiddleware(), bulletinHandler.GetBulletins)
			bulletinRoutes.POST("/", authMiddleware(), bulletinHandler.CreateBulletin)
			bulletinRoutes.POST("/:id/respond", authMiddleware(), bulletinHandler.RespondToBulletin)
			bulletinRoutes.PUT("/:id/response/:response_id", authMiddleware(), bulletinHandler.UpdateBulletinResponseStatus)
			bulletinRoutes.DELETE("/:id", authMiddleware(), bulletinHandler.DeleteBulletin)
		}

		// Community routes
		communityRoutes := api.Group("/communities")
		{
			communityRoutes.GET("/", authMiddleware(), communityHandler.GetCommunities)
			communityRoutes.GET("/:id", authMiddleware(), communityHandler.GetCommunityDetails)
			communityRoutes.POST("/", authMiddleware(), communityHandler.CreateCommunity)
			communityRoutes.POST("/:id/join", authMiddleware(), communityHandler.JoinCommunity)
			communityRoutes.POST("/:id/message", authMiddleware(), communityHandler.PostCommunityMessage)
			communityRoutes.GET("/:id/messages", authMiddleware(), communityHandler.GetCommunityMessages)
		}
	}
}

// Mock authentication middleware for development
func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// In a real app, this would validate the JWT token from the Authorization header
		// and set user information in the context

		// For development, we'll just set mock user data
		c.Set("userID", "00000000-0000-0000-0000-000000000000")
		c.Set("userName", "Test User")

		c.Next()
	}
}
