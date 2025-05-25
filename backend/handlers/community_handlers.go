package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/user/tennis-connect/models"
)

// GetCommunities returns a list of communities filtered by location
func GetCommunities(c *gin.Context) {
	// Parse location parameters
	lat, _ := strconv.ParseFloat(c.DefaultQuery("latitude", "37.7749"), 64)
	lng, _ := strconv.ParseFloat(c.DefaultQuery("longitude", "-122.4194"), 64)
	radius, _ := strconv.ParseFloat(c.DefaultQuery("radius", "25"), 64) // Wider radius for communities

	// Optional filters
	communityType := c.Query("type") // General, Women-only, Beginners, etc.

	// TODO: Implement actual database query with filters
	// For demonstration purposes, we'll use these variables in comments
	_ = lat
	_ = lng
	_ = radius
	_ = communityType

	// Mock response with some communities
	communities := []models.Community{
		{
			ID:          uuid.New(),
			Name:        "SF Tennis Players",
			Description: "A community for all tennis players in San Francisco",
			Location: models.Location{
				Latitude:  37.7749,
				Longitude: -122.4194,
				ZipCode:   "94105",
				City:      "San Francisco",
				State:     "CA",
			},
			Type:      "General",
			CreatedBy: uuid.New(),
			Members: []models.Member{
				{
					ID:       uuid.New(),
					UserID:   uuid.New(),
					UserName: "Admin User",
					Role:     "Admin",
					JoinedAt: time.Now().Add(-30 * 24 * time.Hour),
				},
				{
					ID:       uuid.New(),
					UserID:   uuid.New(),
					UserName: "Regular User",
					Role:     "Member",
					JoinedAt: time.Now().Add(-15 * 24 * time.Hour),
				},
			},
			CreatedAt: time.Now().Add(-30 * 24 * time.Hour),
			UpdatedAt: time.Now().Add(-7 * 24 * time.Hour),
		},
		{
			ID:          uuid.New(),
			Name:        "Women's Tennis SF",
			Description: "A community for women tennis players in San Francisco",
			Location: models.Location{
				Latitude:  37.7749,
				Longitude: -122.4194,
				ZipCode:   "94105",
				City:      "San Francisco",
				State:     "CA",
			},
			Type:      "Women-only",
			CreatedBy: uuid.New(),
			Members: []models.Member{
				{
					ID:       uuid.New(),
					UserID:   uuid.New(),
					UserName: "Admin User",
					Role:     "Admin",
					JoinedAt: time.Now().Add(-45 * 24 * time.Hour),
				},
			},
			CreatedAt: time.Now().Add(-45 * 24 * time.Hour),
			UpdatedAt: time.Now().Add(-10 * 24 * time.Hour),
		},
		{
			ID:          uuid.New(),
			Name:        "Tennis Beginners Bay Area",
			Description: "A supportive community for beginning tennis players",
			Location: models.Location{
				Latitude:  37.7749,
				Longitude: -122.4194,
				ZipCode:   "94105",
				City:      "San Francisco",
				State:     "CA",
			},
			Type:      "Beginners",
			CreatedBy: uuid.New(),
			Members: []models.Member{
				{
					ID:       uuid.New(),
					UserID:   uuid.New(),
					UserName: "Admin User",
					Role:     "Admin",
					JoinedAt: time.Now().Add(-60 * 24 * time.Hour),
				},
			},
			CreatedAt: time.Now().Add(-60 * 24 * time.Hour),
			UpdatedAt: time.Now().Add(-5 * 24 * time.Hour),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"communities": communities,
	})
}

// GetCommunityDetails returns details for a specific community
func GetCommunityDetails(c *gin.Context) {
	communityID := c.Param("id")

	// TODO: Implement actual community retrieval from database

	// Mock a community for the response
	community := models.Community{
		ID:          uuid.MustParse(communityID),
		Name:        "SF Tennis Players",
		Description: "A community for all tennis players in San Francisco",
		Location: models.Location{
			Latitude:  37.7749,
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
		Type:      "General",
		CreatedBy: uuid.New(),
		Members: []models.Member{
			{
				ID:       uuid.New(),
				UserID:   uuid.New(),
				UserName: "Admin User",
				Role:     "Admin",
				JoinedAt: time.Now().Add(-30 * 24 * time.Hour),
			},
			{
				ID:       uuid.New(),
				UserID:   uuid.New(),
				UserName: "Regular User",
				Role:     "Member",
				JoinedAt: time.Now().Add(-15 * 24 * time.Hour),
			},
		},
		Messages: []models.Message{
			{
				ID:        uuid.New(),
				UserID:    uuid.New(),
				UserName:  "Admin User",
				Content:   "Welcome to the SF Tennis Players community!",
				CreatedAt: time.Now().Add(-29 * 24 * time.Hour),
				UpdatedAt: time.Now().Add(-29 * 24 * time.Hour),
			},
			{
				ID:        uuid.New(),
				UserID:    uuid.New(),
				UserName:  "Regular User",
				Content:   "Thanks for creating this group! Is anyone free for a hit this weekend at Golden Gate Park?",
				CreatedAt: time.Now().Add(-14 * 24 * time.Hour),
				UpdatedAt: time.Now().Add(-14 * 24 * time.Hour),
			},
			{
				ID:        uuid.New(),
				UserID:    uuid.New(),
				UserName:  "Admin User",
				Content:   "I'm free on Saturday morning if anyone wants to play!",
				CreatedAt: time.Now().Add(-7 * 24 * time.Hour),
				UpdatedAt: time.Now().Add(-7 * 24 * time.Hour),
				ReplyTo:   nil,
			},
		},
		CreatedAt: time.Now().Add(-30 * 24 * time.Hour),
		UpdatedAt: time.Now().Add(-7 * 24 * time.Hour),
	}

	c.JSON(http.StatusOK, community)
}

// CreateCommunity handles creating a new community
func CreateCommunity(c *gin.Context) {
	var community models.Community
	if err := c.ShouldBindJSON(&community); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from auth context
	userID, _ := c.Get("userID")
	userName, _ := c.Get("userName")

	// TODO: Implement actual community creation with database
	// For demonstration purposes, we'll use these variables in comments
	_ = userID
	_ = userName

	// Mock response
	community.ID = uuid.New()
	community.CreatedBy = userID.(uuid.UUID)
	community.CreatedAt = time.Now()
	community.UpdatedAt = time.Now()

	// Add creator as admin member
	adminMember := models.Member{
		ID:          uuid.New(),
		CommunityID: community.ID,
		UserID:      userID.(uuid.UUID),
		UserName:    userName.(string),
		Role:        "Admin",
		JoinedAt:    time.Now(),
	}
	community.Members = []models.Member{adminMember}

	c.JSON(http.StatusCreated, community)
}

// JoinCommunity handles a user joining a community
func JoinCommunity(c *gin.Context) {
	communityID := c.Param("id")

	// Get user ID from auth context
	userID, _ := c.Get("userID")
	userName, _ := c.Get("userName")

	// TODO: Implement actual join with database
	// For demonstration purposes, we'll use these variables in comments
	_ = communityID
	_ = userID
	_ = userName

	// Mock response
	member := models.Member{
		ID:          uuid.New(),
		CommunityID: uuid.MustParse(communityID),
		UserID:      userID.(uuid.UUID),
		UserName:    userName.(string),
		Role:        "Member",
		JoinedAt:    time.Now(),
	}

	c.JSON(http.StatusOK, member)
}

// PostCommunityMessage handles posting a message to a community
func PostCommunityMessage(c *gin.Context) {
	communityID := c.Param("id")

	// Get user ID from auth context
	userID, _ := c.Get("userID")
	userName, _ := c.Get("userName")

	var messageData struct {
		Content string     `json:"content" binding:"required"`
		ReplyTo *uuid.UUID `json:"reply_to,omitempty"`
	}

	if err := c.ShouldBindJSON(&messageData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Implement actual message posting with database
	// For demonstration purposes, we'll use these variables in comments
	_ = communityID
	_ = userID
	_ = userName

	// Mock response
	message := models.Message{
		ID:          uuid.New(),
		CommunityID: uuid.MustParse(communityID),
		UserID:      userID.(uuid.UUID),
		UserName:    userName.(string),
		Content:     messageData.Content,
		ReplyTo:     messageData.ReplyTo,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	c.JSON(http.StatusCreated, message)
}

// GetCommunityMessages returns messages for a specific community
func GetCommunityMessages(c *gin.Context) {
	communityID := c.Param("id")

	// Pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	// TODO: Implement actual message retrieval from database with pagination
	// For demonstration purposes, we'll use these variables in comments
	_ = communityID
	_ = page
	_ = limit

	// Mock response with some messages
	messages := []models.Message{
		{
			ID:          uuid.New(),
			CommunityID: uuid.MustParse(communityID),
			UserID:      uuid.New(),
			UserName:    "Admin User",
			Content:     "Welcome to the community!",
			CreatedAt:   time.Now().Add(-29 * 24 * time.Hour),
			UpdatedAt:   time.Now().Add(-29 * 24 * time.Hour),
		},
		{
			ID:          uuid.New(),
			CommunityID: uuid.MustParse(communityID),
			UserID:      uuid.New(),
			UserName:    "Regular User",
			Content:     "Thanks for creating this group! Is anyone free for a hit this weekend?",
			CreatedAt:   time.Now().Add(-14 * 24 * time.Hour),
			UpdatedAt:   time.Now().Add(-14 * 24 * time.Hour),
		},
		{
			ID:          uuid.New(),
			CommunityID: uuid.MustParse(communityID),
			UserID:      uuid.New(),
			UserName:    "Another User",
			Content:     "I'm free on Saturday afternoon if anyone wants to play doubles!",
			CreatedAt:   time.Now().Add(-7 * 24 * time.Hour),
			UpdatedAt:   time.Now().Add(-7 * 24 * time.Hour),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": 3, // Total number of messages
		},
	})
}
