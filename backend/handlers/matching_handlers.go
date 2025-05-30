package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/user/tennis-connect/models"
	"github.com/user/tennis-connect/repository"
)

// MatchingHandlers handles HTTP requests for player matching operations
type MatchingHandlers struct {
	matchingRepo *repository.MatchingRepository
	courtRepo    *repository.CourtRepository
	userRepo     *repository.UserRepository
}

// NewMatchingHandlers creates a new MatchingHandlers instance
func NewMatchingHandlers(matchingRepo *repository.MatchingRepository, courtRepo *repository.CourtRepository, userRepo *repository.UserRepository) *MatchingHandlers {
	return &MatchingHandlers{
		matchingRepo: matchingRepo,
		courtRepo:    courtRepo,
		userRepo:     userRepo,
	}
}

// CreateMatchSession handles POST /api/matching/sessions
func (h *MatchingHandlers) CreateMatchSession(c *gin.Context) {
	var req models.MatchingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Get user ID from context
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID, ok := userIDValue.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get user details for skill level
	user, err := h.userRepo.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Set defaults
	if req.StartTime == "" {
		req.StartTime = "17:00" // Default to 5:00 PM
	}
	if req.Duration == 0 {
		req.Duration = 60 // Default to 1 hour
	}
	if req.GameType == "" {
		req.GameType = "Singles"
	}
	if req.SkillLevel == 0 {
		req.SkillLevel = user.SkillLevel // Use user's skill level
	}

	// Parse date and time
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
		return
	}

	startTime, err := time.Parse("15:04", req.StartTime)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start time format. Use HH:MM"})
		return
	}

	// Combine date and time
	startDateTime := time.Date(date.Year(), date.Month(), date.Day(),
		startTime.Hour(), startTime.Minute(), 0, 0, time.Local)
	endDateTime := startDateTime.Add(time.Duration(req.Duration) * time.Minute)

	// Validate court exists
	court, err := h.courtRepo.GetByID(c.Request.Context(), req.CourtID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Court not found"})
		return
	}

	// Determine max players based on game type
	maxPlayers := 2
	if req.GameType == "Doubles" {
		maxPlayers = 4
	}

	// Create match session
	session := &models.MatchSession{
		CourtID:    req.CourtID,
		StartTime:  startDateTime,
		EndTime:    endDateTime,
		GameType:   req.GameType,
		SkillLevel: req.SkillLevel,
		Status:     models.MatchingStatusPending,
		MaxPlayers: maxPlayers,
	}

	err = h.matchingRepo.CreateMatchSession(c.Request.Context(), session)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create match session: %v", err)})
		return
	}

	// Automatically join the creator to the session
	err = h.matchingRepo.JoinMatchSession(c.Request.Context(), session.ID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to join match session: %v", err)})
		return
	}

	// Populate court information
	session.Court = court

	c.JSON(http.StatusCreated, session)
}

// JoinMatchSession handles POST /api/matching/sessions/:sessionID/join
func (h *MatchingHandlers) JoinMatchSession(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("sessionID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID, ok := userIDValue.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	err = h.matchingRepo.JoinMatchSession(c.Request.Context(), sessionID, userID)
	if err != nil {
		if strings.Contains(err.Error(), "full") {
			c.JSON(http.StatusConflict, gin.H{"error": "Match session is full"})
			return
		}
		if strings.Contains(err.Error(), "already in") {
			c.JSON(http.StatusConflict, gin.H{"error": "User already in match session"})
			return
		}
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Match session not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to join match session: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully joined match session"})
}

// GetMatchSession handles GET /api/matching/sessions/:sessionID
func (h *MatchingHandlers) GetMatchSession(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("sessionID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	session, err := h.matchingRepo.GetMatchSession(c.Request.Context(), sessionID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Match session not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get match session: %v", err)})
		return
	}

	// Populate court information
	court, err := h.courtRepo.GetByID(c.Request.Context(), session.CourtID)
	if err == nil {
		session.Court = court
	}

	// Populate user information for players
	for i, player := range session.Players {
		user, err := h.userRepo.GetByID(c.Request.Context(), player.UserID)
		if err == nil {
			session.Players[i].User = user
		}
	}

	// Populate user information for pairings
	for i, pairing := range session.Matches {
		if user, err := h.userRepo.GetByID(c.Request.Context(), pairing.Player1ID); err == nil {
			session.Matches[i].Player1 = user
		}
		if user, err := h.userRepo.GetByID(c.Request.Context(), pairing.Player2ID); err == nil {
			session.Matches[i].Player2 = user
		}
		if pairing.Player3ID != nil {
			if user, err := h.userRepo.GetByID(c.Request.Context(), *pairing.Player3ID); err == nil {
				session.Matches[i].Player3 = user
			}
		}
		if pairing.Player4ID != nil {
			if user, err := h.userRepo.GetByID(c.Request.Context(), *pairing.Player4ID); err == nil {
				session.Matches[i].Player4 = user
			}
		}
	}

	c.JSON(http.StatusOK, session)
}

// GetAvailableMatchSessions handles GET /api/matching/sessions/available
func (h *MatchingHandlers) GetAvailableMatchSessions(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID, ok := userIDValue.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	// Parse optional filters
	var courtID *uuid.UUID
	if courtIDStr := c.Query("court_id"); courtIDStr != "" {
		if id, err := uuid.Parse(courtIDStr); err == nil {
			courtID = &id
		}
	}

	gameType := c.Query("game_type")

	sessions, err := h.matchingRepo.GetAvailableMatchSessions(c.Request.Context(), userID, courtID, gameType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get available match sessions: %v", err)})
		return
	}

	// Populate court information for each session
	for _, session := range sessions {
		court, err := h.courtRepo.GetByID(c.Request.Context(), session.CourtID)
		if err == nil {
			session.Court = court
		}
	}

	c.JSON(http.StatusOK, sessions)
}

// SubmitFeedback handles POST /api/matching/feedback
func (h *MatchingHandlers) SubmitFeedback(c *gin.Context) {
	var feedback models.PlayerFeedback
	if err := c.ShouldBindJSON(&feedback); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID, ok := userIDValue.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	// Set the from_user_id from the authenticated user
	feedback.FromUserID = userID

	// Validate rating ranges
	if feedback.Rating < 1 || feedback.Rating > 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rating must be between 1 and 5"})
		return
	}
	if feedback.CourtRating != 0 && (feedback.CourtRating < 1 || feedback.CourtRating > 5) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Court rating must be between 1 and 5"})
		return
	}
	if feedback.MatchQuality != 0 && (feedback.MatchQuality < 1 || feedback.MatchQuality > 5) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Match quality must be between 1 and 5"})
		return
	}

	err := h.matchingRepo.SubmitFeedback(c.Request.Context(), &feedback)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to submit feedback: %v", err)})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Feedback submitted successfully"})
}

// TriggerMatching handles POST /api/matching/sessions/:sessionID/match
func (h *MatchingHandlers) TriggerMatching(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("sessionID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	err = h.matchingRepo.TriggerMatching(c.Request.Context(), sessionID)
	if err != nil {
		if strings.Contains(err.Error(), "not enough players") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Not enough players for matching"})
			return
		}
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Match session not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to trigger matching: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Matching completed successfully"})
}

// GetUserMatchHistory handles GET /api/users/:userID/matches
func (h *MatchingHandlers) GetUserMatchHistory(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("userID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Check authorization
	requestingUserIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	requestingUserID, ok := requestingUserIDValue.(uuid.UUID)
	if !ok || requestingUserID != userID {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Parse limit parameter (for future use when implementing actual match history)
	_ = c.DefaultQuery("limit", "10")

	// This would require additional repository methods to get user's match history
	// For now, return empty array as placeholder
	matches := []interface{}{}

	c.JSON(http.StatusOK, gin.H{
		"matches": matches,
		"total":   0,
	})
}

// GetMatchingStats handles GET /api/matching/stats
func (h *MatchingHandlers) GetMatchingStats(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID, ok := userIDValue.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get available sessions count
	availableSessions, err := h.matchingRepo.GetAvailableMatchSessions(c.Request.Context(), userID, nil, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get stats"})
		return
	}

	stats := gin.H{
		"available_sessions": len(availableSessions),
		"total_matches":      0,               // Would be calculated from user's match history
		"average_rating":     0.0,             // Would be calculated from feedback
		"preferred_courts":   []interface{}{}, // Would be calculated from user's booking/match history
	}

	c.JSON(http.StatusOK, stats)
}
