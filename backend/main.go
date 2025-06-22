package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/user/tennis-connect/config"
	"github.com/user/tennis-connect/database"
	"github.com/user/tennis-connect/handlers"
	"github.com/user/tennis-connect/repository"
	"github.com/user/tennis-connect/utils"
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

	// Initialize database connection manager
	dbManager := database.NewConnectionManager(cfg)
	
	// Start background reconnection handler
	dbManager.StartBackgroundReconnection()
	
	// Attempt initial connection with retry logic
	var db *database.DB
	var err error
	if cfg.IsProduction() {
		// In production, try connecting once and if it fails, let background reconnection handle it
		log.Println("Attempting initial database connection...")
		db, err = database.Connect(cfg)
		if err != nil {
			log.Printf("Initial database connection failed: %v", err)
			log.Printf("Service will start but database-dependent endpoints will not work")
			log.Printf("Background reconnection is active and will continue trying to connect")
			db = nil
		} else {
			log.Println("Successfully connected to database on startup")
			// Set the manager's internal state
			dbManager.SetDatabase(db)
		}
	} else {
		// In development, use the full retry logic
		db, err = dbManager.ConnectWithRetry()
		if err != nil {
			log.Fatalf("Failed to connect to database: %v", err)
		}
	}
	
	if db != nil {
		defer db.Close()
		
		// Run migrations if not in production (in production, migrations should be run separately)
		if !cfg.IsProduction() {
			migrationsPath := filepath.Join(".", "migrations")
			if err := db.RunMigrations(migrationsPath); err != nil {
				log.Fatalf("Failed to run migrations: %v", err)
			}
		}
	}

	// Initialize repositories (will be nil if database connection failed)
	var userRepo *repository.UserRepository
	var courtRepo *repository.CourtRepository
	var bulletinRepo *repository.BulletinRepository
	var eventRepo *repository.EventRepository
	var communityRepo *repository.CommunityRepository
	
	if db != nil {
		userRepo = repository.NewUserRepository(db)
		courtRepo = repository.NewCourtRepository(db)
		bulletinRepo = repository.NewBulletinRepository(db)
		eventRepo = repository.NewEventRepository(db)
		communityRepo = repository.NewCommunityRepository(db)
	}

	// Initialize JWT manager
	jwtManager := utils.NewJWTManager(cfg.JWT.Secret, cfg.JWT.Expiration)

	// Initialize handlers (will be nil if database connection failed)
	var userHandler *handlers.UserHandler
	var courtHandler *handlers.CourtHandler
	var bulletinHandler *handlers.BulletinHandler
	var eventHandler *handlers.EventHandler
	var communityHandler *handlers.CommunityHandler
	
	if db != nil {
		userHandler = handlers.NewUserHandler(userRepo)
		courtHandler = handlers.NewCourtHandler(courtRepo)
		bulletinHandler = handlers.NewBulletinHandler(bulletinRepo)
		eventHandler = handlers.NewEventHandler(eventRepo)
		communityHandler = handlers.NewCommunityHandler(communityRepo)
	}

	// Initialize Gin router
	r := gin.Default()

	// Set JWT manager in context for handlers
	r.Use(func(c *gin.Context) {
		c.Set("jwtManager", jwtManager)
		c.Next()
	})

	// Configure CORS
	allowedOrigins := []string{"http://localhost:3000", "http://localhost:80", "http://localhost"}
	if cfg.IsProduction() {
		// Add production frontend URLs here
		allowedOrigins = append(allowedOrigins, 
			"https://tennis-connect-frontend-552905514167.us-central1.run.app",
			"https://*.appspot.com",
		)
	}
	
	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization"},
		AllowCredentials: true,
	}))

	// Routes
	setupRoutes(r, userHandler, courtHandler, bulletinHandler, eventHandler, communityHandler, jwtManager, dbManager)

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
	eventHandler *handlers.EventHandler, communityHandler *handlers.CommunityHandler, jwtManager *utils.JWTManager, dbManager *database.ConnectionManager) {
	
	// Middleware to check database connection
	requireDatabase := func(c *gin.Context) {
		if !dbManager.IsHealthy() || userHandler == nil || courtHandler == nil || bulletinHandler == nil || eventHandler == nil || communityHandler == nil {
			c.JSON(503, gin.H{
				"error": "Database connection unavailable",
				"message": "This endpoint requires database connectivity which is currently unavailable",
				"database_status": dbManager.GetConnectionStatus(),
			})
			c.Abort()
			return
		}
		c.Next()
	}
	// API routes
	api := r.Group("/api")
	{
		// Health check
		api.GET("/health", func(c *gin.Context) {
			response := gin.H{
				"status": "ok",
				"message": "Tennis Connect API is running",
				"database": dbManager.GetConnectionStatus(),
			}
			
			// Set HTTP status based on database health
			statusCode := 200
			if !dbManager.IsHealthy() {
				statusCode = 503 // Service Unavailable for degraded state
				response["status"] = "degraded"
				response["message"] = "API is running but database is unavailable"
			}
			
			c.JSON(statusCode, response)
		})

		// User routes
		userRoutes := api.Group("/users")
		userRoutes.Use(requireDatabase)
		{
			userRoutes.POST("/register", userHandler.RegisterUser)
			userRoutes.POST("/login", userHandler.LoginUser)
			userRoutes.GET("/profile/:id", authMiddleware(jwtManager), userHandler.GetUserProfile)
			userRoutes.PUT("/profile", authMiddleware(jwtManager), userHandler.UpdateUserProfile)
			userRoutes.GET("/nearby", authMiddleware(jwtManager), userHandler.GetNearbyUsers)
			userRoutes.POST("/like/:id", authMiddleware(jwtManager), userHandler.LikeUser)
		}

		// Courts routes
		courtRoutes := api.Group("/courts")
		courtRoutes.Use(requireDatabase)
		{
			courtRoutes.GET("/", authMiddleware(jwtManager), courtHandler.GetCourts)
			courtRoutes.GET("/:id", authMiddleware(jwtManager), courtHandler.GetCourtDetails)
			courtRoutes.POST("/checkin/:id", authMiddleware(jwtManager), courtHandler.CheckInToCourt)
			courtRoutes.POST("/checkout/:id", authMiddleware(jwtManager), courtHandler.CheckOutFromCourt)
		}

		// Events routes
		eventRoutes := api.Group("/events")
		eventRoutes.Use(requireDatabase)
		{
			eventRoutes.GET("/", authMiddleware(jwtManager), eventHandler.GetEvents)
			eventRoutes.GET("/:id", authMiddleware(jwtManager), eventHandler.GetEventDetails)
			eventRoutes.POST("/", authMiddleware(jwtManager), eventHandler.CreateEvent)
			eventRoutes.POST("/:id/rsvp", authMiddleware(jwtManager), eventHandler.RSVPToEvent)
		}

		// Looking-to-play bulletin routes
		bulletinRoutes := api.Group("/bulletins")
		bulletinRoutes.Use(requireDatabase)
		{
			bulletinRoutes.GET("/", authMiddleware(jwtManager), bulletinHandler.GetBulletins)
			bulletinRoutes.POST("/", authMiddleware(jwtManager), bulletinHandler.CreateBulletin)
			bulletinRoutes.POST("/:id/respond", authMiddleware(jwtManager), bulletinHandler.RespondToBulletin)
			bulletinRoutes.PUT("/:id/response/:response_id", authMiddleware(jwtManager), bulletinHandler.UpdateBulletinResponseStatus)
			bulletinRoutes.DELETE("/:id", authMiddleware(jwtManager), bulletinHandler.DeleteBulletin)
		}

		// Community routes
		communityRoutes := api.Group("/communities")
		communityRoutes.Use(requireDatabase)
		{
			communityRoutes.GET("/", authMiddleware(jwtManager), communityHandler.GetCommunities)
			communityRoutes.GET("/:id", authMiddleware(jwtManager), communityHandler.GetCommunityDetails)
			communityRoutes.POST("/", authMiddleware(jwtManager), communityHandler.CreateCommunity)
			communityRoutes.POST("/:id/join", authMiddleware(jwtManager), communityHandler.JoinCommunity)
			communityRoutes.POST("/:id/message", authMiddleware(jwtManager), communityHandler.PostCommunityMessage)
			communityRoutes.GET("/:id/messages", authMiddleware(jwtManager), communityHandler.GetCommunityMessages)
		}
	}
}

// Authentication middleware using JWT
func authMiddleware(jwtManager *utils.JWTManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Check if it starts with "Bearer "
		if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		// Extract the token
		tokenString := authHeader[7:]

		// Validate the token
		claims, err := jwtManager.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Set user information in the context
		c.Set("userID", claims.UserID.String())
		c.Set("userName", claims.Name)
		c.Set("userEmail", claims.Email)

		c.Next()
	}
}
