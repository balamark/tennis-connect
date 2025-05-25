package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/user/tennis-connect/models"
)

// GetEvents returns a list of events filtered by location and date
func GetEvents(c *gin.Context) {
	// Parse location parameters
	lat, _ := strconv.ParseFloat(c.DefaultQuery("latitude", "37.7749"), 64)
	lng, _ := strconv.ParseFloat(c.DefaultQuery("longitude", "-122.4194"), 64)
	radius, _ := strconv.ParseFloat(c.DefaultQuery("radius", "10"), 64)

	// Optional filters
	skillLevel := c.Query("skill_level")
	eventType := c.Query("event_type") // Open Rally, Tournament, etc.
	newcomerFriendly := c.Query("newcomer_friendly") == "true"
	startDateStr := c.Query("start_date") // ISO format: YYYY-MM-DD
	endDateStr := c.Query("end_date")     // ISO format: YYYY-MM-DD

	// Parse dates if provided
	var startDate, endDate time.Time
	var err error
	if startDateStr != "" {
		startDate, err = time.Parse("2006-01-02", startDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format. Use YYYY-MM-DD"})
			return
		}
	} else {
		startDate = time.Now() // Default to today
	}

	if endDateStr != "" {
		endDate, err = time.Parse("2006-01-02", endDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format. Use YYYY-MM-DD"})
			return
		}
	} else {
		// Default to 2 weeks from now
		endDate = startDate.Add(14 * 24 * time.Hour)
	}

	// TODO: Implement actual database query with filters
	// For demonstration purposes, we'll use these variables in comments
	_ = lat
	_ = lng
	_ = radius
	_ = skillLevel
	_ = eventType
	_ = newcomerFriendly
	_ = startDate
	_ = endDate

	// Mock response with some events
	events := []models.Event{
		{
			ID:          uuid.New(),
			Title:       "Saturday Morning Open Rally",
			Description: "Join us for a fun morning of tennis! All skill levels welcome.",
			CourtID:     uuid.New(),
			CourtName:   "Golden Gate Park Tennis Courts",
			Location: models.Location{
				Latitude:  37.7694,
				Longitude: -122.4862,
				ZipCode:   "94117",
				City:      "San Francisco",
				State:     "CA",
			},
			StartTime:          time.Now().Add(48 * time.Hour).Truncate(time.Hour).Add(9 * time.Hour),  // Next Saturday 9:00 AM
			EndTime:            time.Now().Add(48 * time.Hour).Truncate(time.Hour).Add(12 * time.Hour), // Next Saturday 12:00 PM
			HostID:             uuid.New(),
			HostName:           "Tennis Club SF",
			MaxPlayers:         16,
			SkillLevel:         "All Levels",
			EventType:          "Open Rally",
			IsRecurring:        true,
			IsNewcomerFriendly: true,
			RSVPs: []models.RSVP{
				{
					ID:        uuid.New(),
					UserID:    uuid.New(),
					UserName:  "Player 1",
					Status:    "Confirmed",
					CreatedAt: time.Now().Add(-24 * time.Hour),
					UpdatedAt: time.Now().Add(-24 * time.Hour),
				},
				{
					ID:        uuid.New(),
					UserID:    uuid.New(),
					UserName:  "Player 2",
					Status:    "Confirmed",
					CreatedAt: time.Now().Add(-18 * time.Hour),
					UpdatedAt: time.Now().Add(-18 * time.Hour),
				},
			},
			CreatedAt: time.Now().Add(-7 * 24 * time.Hour),
			UpdatedAt: time.Now().Add(-24 * time.Hour),
		},
		{
			ID:          uuid.New(),
			Title:       "Tuesday Evening Doubles",
			Description: "Intermediate to advanced doubles play. Partners will be rotated throughout the event.",
			CourtID:     uuid.New(),
			CourtName:   "Mission Bay Tennis Club",
			Location: models.Location{
				Latitude:  37.7725,
				Longitude: -122.3875,
				ZipCode:   "94158",
				City:      "San Francisco",
				State:     "CA",
			},
			StartTime:          time.Now().Add(72 * time.Hour).Truncate(time.Hour).Add(18 * time.Hour), // Next Tuesday 6:00 PM
			EndTime:            time.Now().Add(72 * time.Hour).Truncate(time.Hour).Add(20 * time.Hour), // Next Tuesday 8:00 PM
			HostID:             uuid.New(),
			HostName:           "John Smith",
			MaxPlayers:         12,
			SkillLevel:         "Intermediate (NTRP 3.5-4.0)",
			EventType:          "Doubles Clinic",
			IsRecurring:        true,
			IsNewcomerFriendly: false,
			RSVPs:              []models.RSVP{},
			CreatedAt:          time.Now().Add(-14 * 24 * time.Hour),
			UpdatedAt:          time.Now().Add(-2 * 24 * time.Hour),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"events": events,
	})
}

// GetEventDetails returns details for a specific event
func GetEventDetails(c *gin.Context) {
	eventID := c.Param("id")

	// TODO: Implement actual event retrieval from database

	// Mock an event for the response
	event := models.Event{
		ID:          uuid.MustParse(eventID),
		Title:       "Saturday Morning Open Rally",
		Description: "Join us for a fun morning of tennis! All skill levels welcome.",
		CourtID:     uuid.New(),
		CourtName:   "Golden Gate Park Tennis Courts",
		Location: models.Location{
			Latitude:  37.7694,
			Longitude: -122.4862,
			ZipCode:   "94117",
			City:      "San Francisco",
			State:     "CA",
		},
		StartTime:          time.Now().Add(48 * time.Hour).Truncate(time.Hour).Add(9 * time.Hour),  // Next Saturday 9:00 AM
		EndTime:            time.Now().Add(48 * time.Hour).Truncate(time.Hour).Add(12 * time.Hour), // Next Saturday 12:00 PM
		HostID:             uuid.New(),
		HostName:           "Tennis Club SF",
		MaxPlayers:         16,
		SkillLevel:         "All Levels",
		EventType:          "Open Rally",
		IsRecurring:        true,
		IsNewcomerFriendly: true,
		RSVPs: []models.RSVP{
			{
				ID:        uuid.New(),
				UserID:    uuid.New(),
				UserName:  "Player 1",
				Status:    "Confirmed",
				CreatedAt: time.Now().Add(-24 * time.Hour),
				UpdatedAt: time.Now().Add(-24 * time.Hour),
			},
			{
				ID:        uuid.New(),
				UserID:    uuid.New(),
				UserName:  "Player 2",
				Status:    "Confirmed",
				CreatedAt: time.Now().Add(-18 * time.Hour),
				UpdatedAt: time.Now().Add(-18 * time.Hour),
			},
		},
		CreatedAt: time.Now().Add(-7 * 24 * time.Hour),
		UpdatedAt: time.Now().Add(-24 * time.Hour),
	}

	c.JSON(http.StatusOK, event)
}

// CreateEvent handles creating a new event
func CreateEvent(c *gin.Context) {
	var event models.Event
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from auth context
	userID, _ := c.Get("userID")
	userName, _ := c.Get("userName")

	// TODO: Implement actual event creation with database
	// For demonstration purposes, we'll use these variables in comments
	_ = userID
	_ = userName

	// Mock response
	event.ID = uuid.New()
	event.HostID = userID.(uuid.UUID)
	event.HostName = userName.(string)
	event.CreatedAt = time.Now()
	event.UpdatedAt = time.Now()

	c.JSON(http.StatusCreated, event)
}

// RSVPToEvent handles a user RSVPing to an event
func RSVPToEvent(c *gin.Context) {
	eventID := c.Param("id")

	// Get user ID from auth context
	userID, _ := c.Get("userID")
	userName, _ := c.Get("userName")

	var rsvpData struct {
		Status string `json:"status" binding:"required"` // Confirmed, Cancelled
	}

	if err := c.ShouldBindJSON(&rsvpData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Implement actual RSVP with database
	// For demonstration purposes, we'll use these variables in comments
	_ = eventID
	_ = userID
	_ = userName

	// Mock response
	rsvp := models.RSVP{
		ID:        uuid.New(),
		EventID:   uuid.MustParse(eventID),
		UserID:    userID.(uuid.UUID),
		UserName:  userName.(string),
		Status:    rsvpData.Status,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Mock event to demonstrate waitlist functionality
	event := models.Event{
		ID:         uuid.MustParse(eventID),
		MaxPlayers: 2, // Small number to demonstrate waitlist
		RSVPs: []models.RSVP{
			{
				Status: "Confirmed",
			},
			{
				Status: "Confirmed",
			},
		},
	}

	response := gin.H{
		"rsvp": rsvp,
	}

	// Check if the event is full and add to waitlist
	if !event.HasAvailableSpots() && rsvpData.Status == "Confirmed" {
		rsvp.Status = "Waitlisted"
		response["message"] = "Event is full. You've been added to the waitlist."
	}

	c.JSON(http.StatusOK, response)
}
