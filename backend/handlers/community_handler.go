package handlers

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/user/tennis-connect/models"
	"github.com/user/tennis-connect/repository"
)

// CommunityHandler handles community-related HTTP requests
type CommunityHandler struct {
	communityRepo *repository.CommunityRepository
}

// NewCommunityHandler creates a new CommunityHandler
func NewCommunityHandler(communityRepo *repository.CommunityRepository) *CommunityHandler {
	return &CommunityHandler{
		communityRepo: communityRepo,
	}
}

// GetCommunities returns a list of communities filtered by location
func (h *CommunityHandler) GetCommunities(c *gin.Context) {
	// Parse location parameters
	lat, _ := strconv.ParseFloat(c.DefaultQuery("latitude", "37.7749"), 64)
	lng, _ := strconv.ParseFloat(c.DefaultQuery("longitude", "-122.4194"), 64)
	radius, _ := strconv.ParseFloat(c.DefaultQuery("radius", "25"), 64) // Default 25 miles for communities

	// Optional filters
	communityType := c.Query("type") // General, Location-based, Women-only, etc.

	// Pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	// Build filters map
	filters := map[string]interface{}{}
	if communityType != "" {
		filters["type"] = communityType
	}

	// Query the database
	ctx := context.Background()
	communities, totalCount, err := h.communityRepo.GetCommunities(ctx, lat, lng, radius, filters, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch communities: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"communities": communities,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": totalCount,
		},
	})
}

// GetCommunityDetails returns details for a specific community
func (h *CommunityHandler) GetCommunityDetails(c *gin.Context) {
	communityIDStr := c.Param("id")
	communityID, err := uuid.Parse(communityIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID"})
		return
	}

	ctx := context.Background()
	community, err := h.communityRepo.GetByID(ctx, communityID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Community not found"})
		return
	}

	c.JSON(http.StatusOK, community)
}

// CreateCommunity handles creating a new community
func (h *CommunityHandler) CreateCommunity(c *gin.Context) {
	var community models.Community
	if err := c.ShouldBindJSON(&community); err != nil {
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

	// Set creator information
	community.CreatedBy = userID

	// Save to database
	ctx := context.Background()
	err := h.communityRepo.Create(ctx, &community)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create community: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, community)
}

// JoinCommunity handles a user joining a community
func (h *CommunityHandler) JoinCommunity(c *gin.Context) {
	communityIDStr := c.Param("id")
	communityID, err := uuid.Parse(communityIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID"})
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

	// Join community
	ctx := context.Background()
	member, err := h.communityRepo.JoinCommunity(ctx, communityID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join community: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, member)
}

// PostCommunityMessage handles posting a message in a community
func (h *CommunityHandler) PostCommunityMessage(c *gin.Context) {
	communityIDStr := c.Param("id")
	communityID, err := uuid.Parse(communityIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID"})
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

	var messageData struct {
		Content string     `json:"content" binding:"required"`
		ReplyTo *uuid.UUID `json:"reply_to,omitempty"`
	}

	if err := c.ShouldBindJSON(&messageData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create message
	message := models.Message{
		CommunityID: communityID,
		UserID:      userID,
		UserName:    userName.(string),
		Content:     messageData.Content,
		ReplyTo:     messageData.ReplyTo,
	}

	// Save to database
	ctx := context.Background()
	err = h.communityRepo.PostMessage(ctx, &message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to post message: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, message)
}

// GetCommunityMessages handles retrieving messages from a community
func (h *CommunityHandler) GetCommunityMessages(c *gin.Context) {
	communityIDStr := c.Param("id")
	communityID, err := uuid.Parse(communityIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID"})
		return
	}

	// Pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	// Get messages
	ctx := context.Background()
	messages, totalCount, err := h.communityRepo.GetMessages(ctx, communityID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": totalCount,
		},
	})
}
