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

// CourtHandler handles court-related HTTP requests
type CourtHandler struct {
	courtRepo *repository.CourtRepository
}

// NewCourtHandler creates a new CourtHandler
func NewCourtHandler(courtRepo *repository.CourtRepository) *CourtHandler {
	return &CourtHandler{
		courtRepo: courtRepo,
	}
}

// GetCourts returns a list of courts filtered by location
func (h *CourtHandler) GetCourts(c *gin.Context) {
	// Parse location parameters
	lat, _ := strconv.ParseFloat(c.DefaultQuery("latitude", "37.7749"), 64)
	lng, _ := strconv.ParseFloat(c.DefaultQuery("longitude", "-122.4194"), 64)
	radius, _ := strconv.ParseFloat(c.DefaultQuery("radius", "10"), 64)

	// Optional filters
	courtType := c.Query("court_type")
	amenities := c.QueryArray("amenities")
	isPublicOnly := c.Query("public_only") == "true"
	hasActivePlayers := c.Query("has_active_players") == "true"

	// Pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	// Query the database
	ctx := context.Background()
	courts, totalCount, err := h.courtRepo.GetCourts(ctx, lat, lng, radius, courtType, amenities, isPublicOnly, hasActivePlayers, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch courts: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"courts": courts,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": totalCount,
		},
	})
}

// GetCourtDetails returns details for a specific court
func (h *CourtHandler) GetCourtDetails(c *gin.Context) {
	courtID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid court ID"})
		return
	}

	// Get court from database
	ctx := context.Background()
	court, err := h.courtRepo.GetByID(ctx, courtID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Court not found: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, court)
}

// CheckInToCourt handles a user checking in at a court
func (h *CourtHandler) CheckInToCourt(c *gin.Context) {
	courtID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid court ID"})
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

	var checkInData struct {
		Message string `json:"message"`
	}

	if err := c.ShouldBindJSON(&checkInData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create check-in
	checkIn := &models.CheckIn{
		CourtID:   courtID,
		UserID:    userID,
		UserName:  userName.(string),
		CheckedIn: time.Now(),
		Message:   checkInData.Message,
	}

	// Save to database
	ctx := context.Background()
	err = h.courtRepo.CheckInUser(ctx, checkIn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check in: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, checkIn)
}

// CheckOutFromCourt handles a user checking out from a court
func (h *CourtHandler) CheckOutFromCourt(c *gin.Context) {
	courtID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid court ID"})
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

	// Perform checkout
	ctx := context.Background()
	checkIn, err := h.courtRepo.CheckOutUser(ctx, courtID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check out: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, checkIn)
}
