package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/user/tennis-connect/models"
	"github.com/user/tennis-connect/repository"
)

// BookingHandlers handles HTTP requests for booking operations
type BookingHandlers struct {
	bookingRepo *repository.BookingRepository
	courtRepo   *repository.CourtRepository
	userRepo    *repository.UserRepository
}

// NewBookingHandlers creates a new BookingHandlers instance
func NewBookingHandlers(bookingRepo *repository.BookingRepository, courtRepo *repository.CourtRepository, userRepo *repository.UserRepository) *BookingHandlers {
	return &BookingHandlers{
		bookingRepo: bookingRepo,
		courtRepo:   courtRepo,
		userRepo:    userRepo,
	}
}

// CreateBooking handles POST /api/bookings
func (h *BookingHandlers) CreateBooking(c *gin.Context) {
	var req models.BookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Get user ID from context (set by auth middleware)
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

	// Set defaults
	if req.StartTime == "" {
		req.StartTime = "17:00" // Default to 5:00 PM
	}
	if req.Duration == 0 {
		req.Duration = 60 // Default to 1 hour
	}
	if req.PlayerCount == 0 {
		req.PlayerCount = 2 // Default to 2 players
	}
	if req.GameType == "" {
		req.GameType = "Singles"
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

	// Create booking
	booking := &models.Booking{
		CourtID:     req.CourtID,
		UserID:      userID,
		StartTime:   startDateTime,
		EndTime:     endDateTime,
		Status:      models.BookingStatusPending,
		PlayerCount: req.PlayerCount,
		GameType:    req.GameType,
		Notes:       req.Notes,
	}

	err = h.bookingRepo.Create(c.Request.Context(), booking)
	if err != nil {
		if strings.Contains(err.Error(), "not available") {
			c.JSON(http.StatusConflict, gin.H{"error": "Court is not available during the requested time"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create booking: %v", err)})
		return
	}

	// Auto-confirm booking (in a real system, this might require payment or approval)
	err = h.bookingRepo.UpdateStatus(c.Request.Context(), booking.ID, models.BookingStatusConfirmed)
	if err != nil {
		// Log error but don't fail the request
		fmt.Printf("Warning: Failed to auto-confirm booking: %v\n", err)
	} else {
		booking.Status = models.BookingStatusConfirmed
	}

	// Populate court information
	booking.Court = court

	c.JSON(http.StatusCreated, booking)
}

// GetBooking handles GET /api/bookings/:id
func (h *BookingHandlers) GetBooking(c *gin.Context) {
	bookingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid booking ID"})
		return
	}

	booking, err := h.bookingRepo.GetByID(c.Request.Context(), bookingID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get booking: %v", err)})
		return
	}

	// Populate court and user information
	court, err := h.courtRepo.GetByID(c.Request.Context(), booking.CourtID)
	if err == nil {
		booking.Court = court
	}

	user, err := h.userRepo.GetByID(c.Request.Context(), booking.UserID)
	if err == nil {
		booking.User = user
	}

	c.JSON(http.StatusOK, booking)
}

// GetUserBookings handles GET /api/users/:userID/bookings
func (h *BookingHandlers) GetUserBookings(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("userID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Check if requesting user can access these bookings
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

	includeCompleted := c.Query("include_completed") == "true"

	bookings, err := h.bookingRepo.GetByUserID(c.Request.Context(), userID, includeCompleted)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get user bookings: %v", err)})
		return
	}

	// Populate court information for each booking
	for _, booking := range bookings {
		court, err := h.courtRepo.GetByID(c.Request.Context(), booking.CourtID)
		if err == nil {
			booking.Court = court
		}
	}

	c.JSON(http.StatusOK, bookings)
}

// GetCourtAvailability handles GET /api/courts/:courtID/availability
func (h *BookingHandlers) GetCourtAvailability(c *gin.Context) {
	courtID, err := uuid.Parse(c.Param("courtID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid court ID"})
		return
	}

	dateStr := c.DefaultQuery("date", time.Now().Format("2006-01-02"))

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
		return
	}

	availability, err := h.bookingRepo.GetAvailability(c.Request.Context(), courtID, date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get court availability: %v", err)})
		return
	}

	c.JSON(http.StatusOK, availability)
}

// CancelBooking handles DELETE /api/bookings/:id
func (h *BookingHandlers) CancelBooking(c *gin.Context) {
	bookingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid booking ID"})
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

	err = h.bookingRepo.Cancel(c.Request.Context(), bookingID, userID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
			return
		}
		if strings.Contains(err.Error(), "does not belong") {
			c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized to cancel this booking"})
			return
		}
		if strings.Contains(err.Error(), "cannot be cancelled") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Booking cannot be cancelled (too close to start time)"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to cancel booking: %v", err)})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetUpcomingBookings handles GET /api/users/:userID/bookings/upcoming
func (h *BookingHandlers) GetUpcomingBookings(c *gin.Context) {
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

	limitStr := c.DefaultQuery("limit", "5")
	limit := 5 // Default limit
	if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
		limit = parsedLimit
	}

	bookings, err := h.bookingRepo.GetUpcomingBookings(c.Request.Context(), userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get upcoming bookings: %v", err)})
		return
	}

	// Populate court information
	for _, booking := range bookings {
		court, err := h.courtRepo.GetByID(c.Request.Context(), booking.CourtID)
		if err == nil {
			booking.Court = court
		}
	}

	c.JSON(http.StatusOK, bookings)
}

// GetCourtBookings handles GET /api/courts/:courtID/bookings
func (h *BookingHandlers) GetCourtBookings(c *gin.Context) {
	courtID, err := uuid.Parse(c.Param("courtID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid court ID"})
		return
	}

	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	var startDate, endDate time.Time
	if startDateStr == "" {
		startDate = time.Now().Truncate(24 * time.Hour) // Start of today
	} else {
		startDate, err = time.Parse("2006-01-02", startDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format. Use YYYY-MM-DD"})
			return
		}
	}

	if endDateStr == "" {
		endDate = startDate.Add(7 * 24 * time.Hour) // Default to 7 days from start
	} else {
		endDate, err = time.Parse("2006-01-02", endDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format. Use YYYY-MM-DD"})
			return
		}
	}

	// Set time to end of day for endDate
	endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 0, endDate.Location())

	bookings, err := h.bookingRepo.GetByCourtID(c.Request.Context(), courtID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get court bookings: %v", err)})
		return
	}

	// Populate user information (but not sensitive data)
	for _, booking := range bookings {
		user, err := h.userRepo.GetByID(c.Request.Context(), booking.UserID)
		if err == nil {
			// Only include public user information
			booking.User = &models.User{
				ID:   user.ID,
				Name: user.Name,
			}
		}
	}

	c.JSON(http.StatusOK, bookings)
}
