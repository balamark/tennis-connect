package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/user/tennis-connect/models"
	"github.com/user/tennis-connect/utils"
)

// UserRepositoryInterface defines the interface for user repository operations
type UserRepositoryInterface interface {
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	GetNearbyUsers(ctx context.Context, latitude, longitude, radius float64, filters map[string]interface{}) ([]*models.User, error)
	VerifyPassword(ctx context.Context, email, password string) (bool, *models.User, error)
}

// UserHandler handles user-related HTTP requests
type UserHandler struct {
	userRepo UserRepositoryInterface
}

// NewUserHandler creates a new UserHandler
func NewUserHandler(userRepo UserRepositoryInterface) *UserHandler {
	return &UserHandler{
		userRepo: userRepo,
	}
}

// RegisterUser handles user registration
func (h *UserHandler) RegisterUser(c *gin.Context) {
	var registrationData struct {
		Name        string          `json:"name" binding:"required"`
		Email       string          `json:"email" binding:"required"`
		Password    string          `json:"password" binding:"required"`
		SkillLevel  float32         `json:"skillLevel" binding:"required"`
		GameStyles  []string        `json:"gameStyles"`
		Gender      string          `json:"gender"`
		IsNewToArea bool            `json:"isNewToArea"`
		Location    models.Location `json:"location"`
	}

	if err := c.ShouldBindJSON(&registrationData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data: " + err.Error()})
		return
	}

	// Validate email format
	if !strings.Contains(registrationData.Email, "@") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})
		return
	}

	// Validate password length
	if len(registrationData.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters long"})
		return
	}

	// Validate skill level range
	if registrationData.SkillLevel < 1.0 || registrationData.SkillLevel > 7.0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Skill level must be between 1.0 and 7.0"})
		return
	}

	// Normalize email to lowercase
	registrationData.Email = strings.ToLower(strings.TrimSpace(registrationData.Email))
	registrationData.Name = strings.TrimSpace(registrationData.Name)

	// Check if user already exists
	ctx := context.Background()
	existingUser, err := h.userRepo.GetByEmail(ctx, registrationData.Email)
	if err == nil && existingUser != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "An account with this email already exists"})
		return
	}

	// Create user model
	user := models.User{
		Name:         registrationData.Name,
		Email:        registrationData.Email,
		PasswordHash: registrationData.Password, // This will be hashed in the repository
		SkillLevel:   registrationData.SkillLevel,
		GameStyles:   registrationData.GameStyles,
		Gender:       registrationData.Gender,
		IsNewToArea:  registrationData.IsNewToArea,
		Location:     registrationData.Location,
	}

	// Create user in the database
	err = h.userRepo.Create(ctx, &user)
	if err != nil {
		// Check for specific database errors
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			c.JSON(http.StatusConflict, gin.H{"error": "An account with this email already exists"})
			return
		}

		// Log the actual error for debugging
		fmt.Printf("User creation error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create account. Please try again."})
		return
	}

	// Return user without sensitive information
	user.PasswordHash = "" // Don't expose the password hash
	c.JSON(http.StatusCreated, gin.H{
		"message": "Account created successfully",
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
		},
	})
}

// LoginUser handles user login
func (h *UserHandler) LoginUser(c *gin.Context) {
	var loginData struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&loginData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify credentials
	ctx := context.Background()
	valid, user, err := h.userRepo.VerifyPassword(ctx, loginData.Email, loginData.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Login error: " + err.Error()})
		return
	}

	if !valid || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Get JWT manager from context (set by main.go)
	jwtManager, exists := c.Get("jwtManager")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "JWT manager not available"})
		return
	}

	// Generate JWT token
	token, err := jwtManager.(*utils.JWTManager).GenerateToken(user.ID, user.Email, user.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
			"name":  user.Name,
		},
	})
}

// GetUserProfile retrieves a user's profile
func (h *UserHandler) GetUserProfile(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ctx := context.Background()
	user, err := h.userRepo.GetByID(ctx, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Don't expose sensitive information
	user.PasswordHash = ""
	c.JSON(http.StatusOK, user)
}

// UpdateUserProfile updates a user's profile
func (h *UserHandler) UpdateUserProfile(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from auth context
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Convert to UUID
	userID, err := uuid.Parse(userIDValue.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Ensure the user ID in the path matches the authenticated user
	user.ID = userID

	ctx := context.Background()
	err = h.userRepo.Update(ctx, &user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user: " + err.Error()})
		return
	}

	// Don't expose sensitive information
	user.PasswordHash = ""
	c.JSON(http.StatusOK, user)
}

// GetNearbyUsers gets users near the authenticated user with filtering
func (h *UserHandler) GetNearbyUsers(c *gin.Context) {
	// Get user ID from auth context
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Convert to UUID
	userID, err := uuid.Parse(userIDValue.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Parse filter parameters
	skillLevel := c.Query("skill_level")
	gameStyles := c.Query("game_styles")
	preferredDays := c.Query("preferred_days")
	radius, _ := strconv.ParseFloat(c.DefaultQuery("radius", "10"), 64) // Default to 10 miles
	isNewcomer := c.Query("is_newcomer") == "true"
	gender := c.Query("gender")

	// Parse location parameters
	lat, _ := strconv.ParseFloat(c.DefaultQuery("latitude", "37.7749"), 64)
	lng, _ := strconv.ParseFloat(c.DefaultQuery("longitude", "-122.4194"), 64)

	// Build filters map
	filters := map[string]interface{}{
		"userID": userID,
	}

	if skillLevel != "" {
		level, err := strconv.ParseFloat(skillLevel, 32)
		if err == nil {
			filters["skillLevel"] = float32(level)
		}
	}

	if gameStyles != "" {
		filters["gameStyles"] = strings.Split(gameStyles, ",")
	}

	if preferredDays != "" {
		filters["preferredDays"] = strings.Split(preferredDays, ",")
	}

	if gender != "" {
		filters["gender"] = gender
	}

	if isNewcomer {
		filters["isNewcomer"] = true
	}

	// Find nearby users
	ctx := context.Background()
	nearbyUsers, err := h.userRepo.GetNearbyUsers(ctx, lat, lng, radius, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch nearby users: " + err.Error()})
		return
	}

	// Check if any users are within the specified radius
	usersInRange := 0
	usersOutOfRange := 0
	for _, user := range nearbyUsers {
		if user.Distance <= radius {
			usersInRange++
		} else {
			usersOutOfRange++
		}
	}

	// Return the results with metadata
	response := gin.H{
		"users": nearbyUsers,
		"metadata": gin.H{
			"total_users":        len(nearbyUsers),
			"users_in_range":     usersInRange,
			"users_out_of_range": usersOutOfRange,
			"search_radius":      radius,
			"showing_fallback":   usersOutOfRange > 0 && usersInRange == 0,
		},
	}

	c.JSON(http.StatusOK, response)
}

// LikeUser handles a user liking another user's profile
func (h *UserHandler) LikeUser(c *gin.Context) {
	// Get user ID from auth context
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Convert to UUID
	userID, err := uuid.Parse(userIDValue.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get target user ID from path
	targetUserID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target user ID"})
		return
	}

	// Prevent users from liking themselves
	if userID == targetUserID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot like yourself"})
		return
	}

	// TODO: Implement player match functionality using repository
	// For now, just return a mock response
	isMatch := true // Assume it's a match for this example

	response := gin.H{
		"success": true,
	}

	if isMatch {
		response["is_match"] = true
		response["message"] = "It's a match! You can now message each other."
	}

	c.JSON(http.StatusOK, response)
}

// RegisterUser handles user registration - legacy handler for compatibility
func RegisterUser(c *gin.Context) {
	// This is a wrapper for the new handler structure
	// It would be used during transition to the new architecture
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented. Use the new handler structure."})
}

// LoginUser handles user login - legacy handler for compatibility
func LoginUser(c *gin.Context) {
	// This is a wrapper for the new handler structure
	// It would be used during transition to the new architecture
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented. Use the new handler structure."})
}

// GetUserProfile retrieves a user's profile - legacy handler for compatibility
func GetUserProfile(c *gin.Context) {
	// This is a wrapper for the new handler structure
	// It would be used during transition to the new architecture
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented. Use the new handler structure."})
}

// UpdateUserProfile updates a user's profile - legacy handler for compatibility
func UpdateUserProfile(c *gin.Context) {
	// This is a wrapper for the new handler structure
	// It would be used during transition to the new architecture
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented. Use the new handler structure."})
}

// GetNearbyUsers gets users near the authenticated user - legacy handler for compatibility
func GetNearbyUsers(c *gin.Context) {
	// This is a wrapper for the new handler structure
	// It would be used during transition to the new architecture
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented. Use the new handler structure."})
}

// LikeUser handles a user liking another user's profile - legacy handler for compatibility
func LikeUser(c *gin.Context) {
	// This is a wrapper for the new handler structure
	// It would be used during transition to the new architecture
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented. Use the new handler structure."})
}
