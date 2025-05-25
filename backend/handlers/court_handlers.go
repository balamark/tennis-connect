package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/user/tennis-connect/models"
)

// GetCourts returns a list of courts filtered by location
func GetCourts(c *gin.Context) {
	// Parse location parameters
	lat, _ := strconv.ParseFloat(c.DefaultQuery("latitude", "37.7749"), 64)
	lng, _ := strconv.ParseFloat(c.DefaultQuery("longitude", "-122.4194"), 64)
	radius, _ := strconv.ParseFloat(c.DefaultQuery("radius", "10"), 64)

	// Optional filters
	courtType := c.Query("court_type")
	amenities := c.QueryArray("amenities")
	isPublicOnly := c.Query("public_only") == "true"
	hasActivePlayers := c.Query("has_active_players") == "true"

	// TODO: Implement actual database query with filters
	// For demonstration purposes, these parameters are used in comments
	_ = lat
	_ = lng
	_ = radius
	_ = courtType
	_ = amenities
	_ = isPublicOnly
	_ = hasActivePlayers

	// Mock response with some courts
	courts := []models.Court{
		{
			ID:          uuid.New(),
			Name:        "Golden Gate Park Tennis Courts",
			Description: "Public tennis courts in Golden Gate Park",
			Location: models.Location{
				Latitude:  37.7694,
				Longitude: -122.4862,
				ZipCode:   "94117",
				City:      "San Francisco",
				State:     "CA",
			},
			CourtType:   "Hard",
			IsPublic:    true,
			Amenities:   []string{"Lights", "Restrooms", "Water"},
			Popularity:  85,
			ContactInfo: "SF Recreation & Parks: (415) 831-5500",
			Website:     "https://sfrecpark.org/770/Golden-Gate-Park-Tennis-Center",
			CheckIns: []models.CheckIn{
				{
					ID:        uuid.New(),
					UserID:    uuid.New(),
					UserName:  "Tennis Player 1",
					CheckedIn: time.Now().Add(-30 * time.Minute),
					Message:   "Looking for a singles match!",
				},
				{
					ID:        uuid.New(),
					UserID:    uuid.New(),
					UserName:  "Tennis Player 2",
					CheckedIn: time.Now().Add(-15 * time.Minute),
					Message:   "Here for an hour, intermediate player.",
				},
			},
			CreatedAt: time.Now().Add(-24 * 30 * time.Hour),
			UpdatedAt: time.Now().Add(-24 * time.Hour),
		},
		{
			ID:          uuid.New(),
			Name:        "Mission Bay Tennis Club",
			Description: "Private tennis club with multiple courts",
			Location: models.Location{
				Latitude:  37.7725,
				Longitude: -122.3875,
				ZipCode:   "94158",
				City:      "San Francisco",
				State:     "CA",
			},
			CourtType:   "Clay",
			IsPublic:    false,
			Amenities:   []string{"Lights", "Restrooms", "Water", "Pro Shop", "Lessons"},
			Popularity:  75,
			ContactInfo: "(415) 555-1234",
			Website:     "https://example.com/missionbaytennis",
			CheckIns:    []models.CheckIn{},
			CreatedAt:   time.Now().Add(-24 * 60 * time.Hour),
			UpdatedAt:   time.Now().Add(-24 * 2 * time.Hour),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"courts": courts,
	})
}

// GetCourtDetails returns details for a specific court
func GetCourtDetails(c *gin.Context) {
	courtID := c.Param("id")

	// TODO: Implement actual court retrieval from database

	// Mock a court for the response
	court := models.Court{
		ID:          uuid.MustParse(courtID),
		Name:        "Golden Gate Park Tennis Courts",
		Description: "Public tennis courts in Golden Gate Park",
		Location: models.Location{
			Latitude:  37.7694,
			Longitude: -122.4862,
			ZipCode:   "94117",
			City:      "San Francisco",
			State:     "CA",
		},
		CourtType:   "Hard",
		IsPublic:    true,
		Amenities:   []string{"Lights", "Restrooms", "Water"},
		Popularity:  85,
		ContactInfo: "SF Recreation & Parks: (415) 831-5500",
		Website:     "https://sfrecpark.org/770/Golden-Gate-Park-Tennis-Center",
		CheckIns: []models.CheckIn{
			{
				ID:        uuid.New(),
				UserID:    uuid.New(),
				UserName:  "Tennis Player 1",
				CheckedIn: time.Now().Add(-30 * time.Minute),
				Message:   "Looking for a singles match!",
			},
			{
				ID:        uuid.New(),
				UserID:    uuid.New(),
				UserName:  "Tennis Player 2",
				CheckedIn: time.Now().Add(-15 * time.Minute),
				Message:   "Here for an hour, intermediate player.",
			},
		},
		CreatedAt: time.Now().Add(-24 * 30 * time.Hour),
		UpdatedAt: time.Now().Add(-24 * time.Hour),
	}

	c.JSON(http.StatusOK, court)
}

// CheckInToCourt handles a user checking in at a court
func CheckInToCourt(c *gin.Context) {
	courtID := c.Param("id")

	// Get user ID from auth context
	userID, _ := c.Get("userID")
	userName, _ := c.Get("userName")

	var checkInData struct {
		Message string `json:"message"`
	}

	if err := c.ShouldBindJSON(&checkInData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Implement actual check-in with database
	// For demonstration purposes, these parameters are used in comments
	_ = courtID
	_ = userID
	_ = userName

	// Mock response
	checkIn := models.CheckIn{
		ID:        uuid.New(),
		CourtID:   uuid.MustParse(courtID),
		UserID:    userID.(uuid.UUID),
		UserName:  userName.(string),
		CheckedIn: time.Now(),
		Message:   checkInData.Message,
	}

	c.JSON(http.StatusCreated, checkIn)
}

// CheckOutFromCourt handles a user checking out from a court
func CheckOutFromCourt(c *gin.Context) {
	courtID := c.Param("id")

	// Get user ID from auth context
	userID, _ := c.Get("userID")

	// TODO: Implement actual check-out with database
	// For demonstration purposes, these parameters are used in comments
	_ = courtID
	_ = userID

	// Mock response
	now := time.Now()
	checkIn := models.CheckIn{
		ID:         uuid.New(),
		CourtID:    uuid.MustParse(courtID),
		UserID:     userID.(uuid.UUID),
		UserName:   "User Name", // Would get this from the database
		CheckedIn:  time.Now().Add(-1 * time.Hour),
		CheckedOut: &now,
	}

	c.JSON(http.StatusOK, checkIn)
}
