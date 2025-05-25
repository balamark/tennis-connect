package handlers

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/user/tennis-connect/models"
	"github.com/user/tennis-connect/repository"
	"github.com/user/tennis-connect/utils"
)

// UserHandler handles user-related HTTP requests
type UserHandler struct {
	userRepo *repository.UserRepository
}

// NewUserHandler creates a new UserHandler
func NewUserHandler(userRepo *repository.UserRepository) *UserHandler {
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
	ctx := context.Background()
	err := h.userRepo.Create(ctx, &user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user: " + err.Error()})
		return
	}

	// Return user without sensitive information
	user.PasswordHash = "" // Don't expose the password hash
	c.JSON(http.StatusCreated, user)
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

	// Return the results
	c.JSON(http.StatusOK, gin.H{
		"users": nearbyUsers,
	})
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
