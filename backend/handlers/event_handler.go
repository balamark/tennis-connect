package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/user/tennis-connect/models"
	"github.com/user/tennis-connect/repository"
)

// EventHandler handles event-related HTTP requests
type EventHandler struct {
	eventRepo *repository.EventRepository
}

// NewEventHandler creates a new EventHandler
func NewEventHandler(eventRepo *repository.EventRepository) *EventHandler {
	return &EventHandler{
		eventRepo: eventRepo,
	}
}

// GetEvents returns a list of events filtered by location and date
func (h *EventHandler) GetEvents(c *gin.Context) {
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

	// Pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

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

	// Build filters map
	filters := map[string]interface{}{}
	if skillLevel != "" {
		filters["skillLevel"] = skillLevel
	}
	if eventType != "" {
		filters["eventType"] = eventType
	}
	if newcomerFriendly {
		filters["newcomerFriendly"] = true
	}
	filters["startDate"] = startDate
	filters["endDate"] = endDate

	// Query the database
	ctx := context.Background()
	events, totalCount, err := h.eventRepo.GetEvents(ctx, lat, lng, radius, filters, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch events: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"events": events,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": totalCount,
		},
	})
}

// GetEventDetails returns details for a specific event
func (h *EventHandler) GetEventDetails(c *gin.Context) {
	eventIDStr := c.Param("id")
	eventID, err := uuid.Parse(eventIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	ctx := context.Background()
	event, err := h.eventRepo.GetByID(ctx, eventID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	c.JSON(http.StatusOK, event)
}

// CreateEvent handles creating a new event
func (h *EventHandler) CreateEvent(c *gin.Context) {
	var event models.Event
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from auth context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID, ok := userIDStr.(uuid.UUID)
	if !ok {
		// Try to parse the string
		var err error
		userID, err = uuid.Parse(userIDStr.(string))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}
	}
	userName, _ := c.Get("userName")

	// Validate event times
	if event.StartTime.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Start time must be in the future"})
		return
	}

	if event.EndTime.Before(event.StartTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "End time must be after start time"})
		return
	}

	// Set host information
	event.HostID = userID
	event.HostName = userName.(string)

	// Save to database
	ctx := context.Background()
	err := h.eventRepo.Create(ctx, &event)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, event)
}

// RSVPToEvent handles a user RSVP to an event
func (h *EventHandler) RSVPToEvent(c *gin.Context) {
	eventIDStr := c.Param("id")
	eventID, err := uuid.Parse(eventIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	// Get user ID from auth context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID, ok := userIDStr.(uuid.UUID)
	if !ok {
		// Try to parse the string
		userID, err = uuid.Parse(userIDStr.(string))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}
	}
	userName, _ := c.Get("userName")

	var rsvpData struct {
		Status string `json:"status" binding:"required"` // Confirmed, Cancelled
	}

	if err := c.ShouldBindJSON(&rsvpData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create RSVP
	rsvp := models.RSVP{
		EventID:  eventID,
		UserID:   userID,
		UserName: userName.(string),
		Status:   rsvpData.Status,
	}

	// Save to database
	ctx := context.Background()
	err = h.eventRepo.CreateRSVP(ctx, &rsvp)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create RSVP: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, rsvp)
}
