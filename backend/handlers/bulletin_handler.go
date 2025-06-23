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

// BulletinHandler handles bulletin-related HTTP requests
type BulletinHandler struct {
	bulletinRepo *repository.BulletinRepository
}

// NewBulletinHandler creates a new BulletinHandler
func NewBulletinHandler(bulletinRepo *repository.BulletinRepository) *BulletinHandler {
	return &BulletinHandler{
		bulletinRepo: bulletinRepo,
	}
}

// GetBulletins returns a list of active bulletins filtered by location
func (h *BulletinHandler) GetBulletins(c *gin.Context) {
	// Parse location parameters
	lat, _ := strconv.ParseFloat(c.DefaultQuery("latitude", "37.7749"), 64)
	lng, _ := strconv.ParseFloat(c.DefaultQuery("longitude", "-122.4194"), 64)
	radiusStr := c.Query("radius")
	var radius float64 = -1 // -1 means no radius limit
	if radiusStr != "" {
		radius, _ = strconv.ParseFloat(radiusStr, 64)
	}

	// Optional filters
	skillLevel := c.Query("skill_level")
	gameType := c.Query("game_type")     // Singles, Doubles, Either
	startAfter := c.Query("start_after") // ISO time format: YYYY-MM-DDTHH:MM:SS
	showExpired := c.Query("show_expired") == "true"

	// Pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	// Build filters map
	filters := map[string]interface{}{}
	if skillLevel != "" {
		filters["skillLevel"] = skillLevel
	}
	if gameType != "" {
		filters["gameType"] = gameType
	}
	if showExpired {
		filters["showExpired"] = true
	}

	// Parse startAfter if provided
	if startAfter != "" {
		startAfterTime, err := time.Parse(time.RFC3339, startAfter)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_after format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)"})
			return
		}
		filters["startAfter"] = startAfterTime
	}

	// Query the database
	ctx := context.Background()
	bulletins, totalCount, err := h.bulletinRepo.GetBulletins(ctx, lat, lng, radius, filters, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bulletins: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"bulletins": bulletins,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": totalCount,
		},
	})
}

// CreateBulletin handles creating a new "looking to play" bulletin
func (h *BulletinHandler) CreateBulletin(c *gin.Context) {
	var bulletin models.Bulletin
	if err := c.ShouldBindJSON(&bulletin); err != nil {
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

	// Validate time range
	if bulletin.StartTime.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Start time must be in the future"})
		return
	}

	if bulletin.EndTime.Before(bulletin.StartTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "End time must be after start time"})
		return
	}

	// Set user information
	bulletin.UserID = userID
	bulletin.UserName = userName.(string)
	bulletin.IsActive = true

	// If latitude and longitude are not provided, set default values based on city
	if bulletin.Location.Latitude == 0 && bulletin.Location.Longitude == 0 {
		// Set default coordinates based on city or use a geocoding service
		// For now, use San Francisco as default if no coordinates provided
		bulletin.Location.Latitude = 37.7749
		bulletin.Location.Longitude = -122.4194
		
		// In a production system, you would geocode the city/state/zipcode
		// to get actual coordinates
	}

	// Save to database
	ctx := context.Background()
	err := h.bulletinRepo.Create(ctx, &bulletin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create bulletin: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, bulletin)
}

// RespondToBulletin handles a user responding to a bulletin
func (h *BulletinHandler) RespondToBulletin(c *gin.Context) {
	bulletinIDStr := c.Param("id")
	bulletinID, err := uuid.Parse(bulletinIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bulletin ID"})
		return
	}

	// Get user ID from auth context to verify ownership
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

	var responseData struct {
		Message string `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&responseData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create response
	response := models.BulletinResponse{
		BulletinID: bulletinID,
		UserID:     userID,
		UserName:   userName.(string),
		Message:    responseData.Message,
		Status:     "Pending",
	}

	// Save to database
	ctx := context.Background()
	err = h.bulletinRepo.CreateResponse(ctx, &response)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create response: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// UpdateBulletinResponseStatus handles accepting or declining a bulletin response
func (h *BulletinHandler) UpdateBulletinResponseStatus(c *gin.Context) {
	bulletinIDStr := c.Param("id")
	responseIDStr := c.Param("response_id")

	bulletinID, err := uuid.Parse(bulletinIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bulletin ID"})
		return
	}

	responseID, err := uuid.Parse(responseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid response ID"})
		return
	}

	var statusData struct {
		Status string `json:"status" binding:"required"` // Accepted or Declined
	}

	if err := c.ShouldBindJSON(&statusData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status
	if statusData.Status != "Accepted" && statusData.Status != "Declined" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status must be 'Accepted' or 'Declined'"})
		return
	}

	// Get user ID from auth context to verify ownership
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// In a real app, verify that the user owns the bulletin
	// This would use userIDStr to check ownership
	// For now, we'll skip this check and just use the existence check above
	_ = userIDStr // Mark as used to avoid compiler warning

	// Update the response status
	ctx := context.Background()
	response, err := h.bulletinRepo.UpdateResponseStatus(ctx, bulletinID, responseID, statusData.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update response status: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// DeleteBulletin handles deleting a bulletin
func (h *BulletinHandler) DeleteBulletin(c *gin.Context) {
	bulletinIDStr := c.Param("id")
	bulletinID, err := uuid.Parse(bulletinIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bulletin ID"})
		return
	}

	// Get user ID from auth context to verify ownership
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

	// Delete from database
	ctx := context.Background()
	err = h.bulletinRepo.DeleteBulletin(ctx, bulletinID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete bulletin: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Bulletin deleted successfully",
	})
}
