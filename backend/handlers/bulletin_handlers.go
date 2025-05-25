package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/user/tennis-connect/models"
)

// GetBulletins returns a list of active bulletins filtered by location
func GetBulletins(c *gin.Context) {
	// Parse location parameters
	lat, _ := strconv.ParseFloat(c.DefaultQuery("latitude", "37.7749"), 64)
	lng, _ := strconv.ParseFloat(c.DefaultQuery("longitude", "-122.4194"), 64)
	radius, _ := strconv.ParseFloat(c.DefaultQuery("radius", "10"), 64)

	// Optional filters
	skillLevel := c.Query("skill_level")
	gameType := c.Query("game_type")     // Singles, Doubles, Either
	startAfter := c.Query("start_after") // ISO time format: YYYY-MM-DDTHH:MM:SS
	showExpired := c.Query("show_expired") == "true"

	// Parse startAfter if provided
	var startAfterTime time.Time
	var err error
	if startAfter != "" {
		startAfterTime, err = time.Parse(time.RFC3339, startAfter)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_after format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)"})
			return
		}
	} else {
		startAfterTime = time.Now() // Default to now
	}

	// TODO: Implement actual database query with filters
	// For demonstration purposes, we'll use these variables in comments
	_ = lat
	_ = lng
	_ = radius
	_ = skillLevel
	_ = gameType
	_ = startAfterTime
	_ = showExpired

	// Mock response with some bulletins
	bulletins := []models.Bulletin{
		{
			ID:          uuid.New(),
			UserID:      uuid.New(),
			UserName:    "Alice Tennis",
			Title:       "Looking for singles match this evening",
			Description: "I'm available for a competitive singles match around 6-8pm. NTRP 4.0 player.",
			Location: models.Location{
				Latitude:  37.7694,
				Longitude: -122.4862,
				ZipCode:   "94117",
				City:      "San Francisco",
				State:     "CA",
			},
			CourtID:    nil,
			CourtName:  "Anywhere in SF",
			StartTime:  time.Now().Add(5 * time.Hour),
			EndTime:    time.Now().Add(7 * time.Hour),
			SkillLevel: "4.0",
			GameType:   "Singles",
			Responses: []models.BulletinResponse{
				{
					ID:        uuid.New(),
					UserID:    uuid.New(),
					UserName:  "Bob Racket",
					Message:   "I'm interested! I'm 4.0 as well. Can meet at Golden Gate Park courts?",
					Status:    "Pending",
					CreatedAt: time.Now().Add(-30 * time.Minute),
					UpdatedAt: time.Now().Add(-30 * time.Minute),
				},
			},
			IsActive:  true,
			CreatedAt: time.Now().Add(-2 * time.Hour),
			UpdatedAt: time.Now().Add(-2 * time.Hour),
		},
		{
			ID:          uuid.New(),
			UserID:      uuid.New(),
			UserName:    "Charlie Net",
			Title:       "Doubles partner needed for Saturday morning",
			Description: "Looking for a doubles partner for Saturday morning. I'm NTRP 3.5.",
			Location: models.Location{
				Latitude:  37.7725,
				Longitude: -122.3875,
				ZipCode:   "94158",
				City:      "San Francisco",
				State:     "CA",
			},
			StartTime:  time.Now().Add(48 * time.Hour),
			EndTime:    time.Now().Add(52 * time.Hour),
			SkillLevel: "3.5",
			GameType:   "Doubles",
			Responses:  []models.BulletinResponse{},
			IsActive:   true,
			CreatedAt:  time.Now().Add(-12 * time.Hour),
			UpdatedAt:  time.Now().Add(-12 * time.Hour),
		},
	}

	// Add an expired bulletin if requested
	if showExpired {
		expiredBulletin := models.Bulletin{
			ID:          uuid.New(),
			UserID:      uuid.New(),
			UserName:    "Dave Tennis",
			Title:       "Hit this morning?",
			Description: "Looking for a casual hit this morning.",
			Location: models.Location{
				Latitude:  37.7749,
				Longitude: -122.4194,
				ZipCode:   "94105",
				City:      "San Francisco",
				State:     "CA",
			},
			StartTime:  time.Now().Add(-4 * time.Hour),
			EndTime:    time.Now().Add(-2 * time.Hour),
			SkillLevel: "3.0-4.0",
			GameType:   "Either",
			Responses:  []models.BulletinResponse{},
			IsActive:   false,
			CreatedAt:  time.Now().Add(-24 * time.Hour),
			UpdatedAt:  time.Now().Add(-4 * time.Hour),
		}
		bulletins = append(bulletins, expiredBulletin)
	}

	c.JSON(http.StatusOK, gin.H{
		"bulletins": bulletins,
	})
}

// CreateBulletin handles creating a new "looking to play" bulletin
func CreateBulletin(c *gin.Context) {
	var bulletin models.Bulletin
	if err := c.ShouldBindJSON(&bulletin); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from auth context
	userID, _ := c.Get("userID")
	userName, _ := c.Get("userName")

	// Validate time range
	if bulletin.StartTime.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Start time must be in the future"})
		return
	}

	if bulletin.EndTime.Before(bulletin.StartTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "End time must be after start time"})
		return
	}

	// TODO: Implement actual bulletin creation with database
	// For demonstration purposes, we'll use these variables in comments
	_ = userID
	_ = userName

	// Mock response
	bulletin.ID = uuid.New()
	bulletin.UserID = userID.(uuid.UUID)
	bulletin.UserName = userName.(string)
	bulletin.IsActive = true
	bulletin.CreatedAt = time.Now()
	bulletin.UpdatedAt = time.Now()

	c.JSON(http.StatusCreated, bulletin)
}

// RespondToBulletin handles a user responding to a bulletin
func RespondToBulletin(c *gin.Context) {
	bulletinID := c.Param("id")

	// Get user ID from auth context
	userID, _ := c.Get("userID")
	userName, _ := c.Get("userName")

	var responseData struct {
		Message string `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&responseData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Implement actual response with database
	// For demonstration purposes, we'll use these variables in comments
	_ = bulletinID
	_ = userID
	_ = userName

	// Mock response
	response := models.BulletinResponse{
		ID:         uuid.New(),
		BulletinID: uuid.MustParse(bulletinID),
		UserID:     userID.(uuid.UUID),
		UserName:   userName.(string),
		Message:    responseData.Message,
		Status:     "Pending",
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	c.JSON(http.StatusCreated, response)
}

// UpdateBulletinResponseStatus handles accepting or declining a bulletin response
func UpdateBulletinResponseStatus(c *gin.Context) {
	bulletinID := c.Param("id")
	responseID := c.Param("response_id")

	var statusData struct {
		Status string `json:"status" binding:"required"` // Accepted or Declined
	}

	if err := c.ShouldBindJSON(&statusData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from auth context to verify ownership
	userID, _ := c.Get("userID")

	// TODO: Implement actual status update with database
	// For demonstration purposes, we'll use these variables in comments
	_ = bulletinID
	_ = responseID
	_ = userID

	// Mock response
	response := models.BulletinResponse{
		ID:         uuid.MustParse(responseID),
		BulletinID: uuid.MustParse(bulletinID),
		UserID:     uuid.New(), // In a real app, this would be the responder's ID
		UserName:   "Responder Name",
		Message:    "I'm interested in playing!",
		Status:     statusData.Status,
		CreatedAt:  time.Now().Add(-30 * time.Minute),
		UpdatedAt:  time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// DeleteBulletin handles deleting a bulletin
func DeleteBulletin(c *gin.Context) {
	bulletinID := c.Param("id")

	// Get user ID from auth context to verify ownership
	userID, _ := c.Get("userID")

	// TODO: Implement actual deletion with database
	// For demonstration purposes, we'll use these variables in comments
	_ = bulletinID
	_ = userID

	c.JSON(http.StatusOK, gin.H{
		"message": "Bulletin deleted successfully",
	})
}
