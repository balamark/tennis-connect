package repository

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/user/tennis-connect/models"
)

func TestBookingRepository_Create(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	db, cleanup := setupTestDB(t)
	defer cleanup()

	bookingRepo := NewBookingRepository(db)
	userRepo := NewUserRepository(db)
	courtRepo := NewCourtRepository(db)
	ctx := context.Background()

	// Create test user
	user := &models.User{
		Email:        "booking@example.com",
		PasswordHash: "password123",
		Name:         "Booking User",
		SkillLevel:   4.0,
		GameStyles:   []string{"Singles"},
		Gender:       "Male",
		Location: models.Location{
			Latitude:  37.7749,
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
	}
	err := userRepo.Create(ctx, user)
	require.NoError(t, err, "Failed to create test user")

	// Create test court
	court := &models.Court{
		Name:        "Test Court",
		Description: "A test court for booking",
		Location: models.Location{
			Latitude:  37.7749,
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
		CourtType:   "Hard",
		IsPublic:    true,
		Amenities:   []string{"Lights", "Water"},
		ContactInfo: "test@example.com",
	}
	err = courtRepo.Create(ctx, court)
	require.NoError(t, err, "Failed to create test court")

	// Create booking
	startTime := time.Now().Add(24 * time.Hour) // Tomorrow
	endTime := startTime.Add(time.Hour)         // 1 hour duration

	booking := &models.Booking{
		CourtID:     court.ID,
		UserID:      user.ID,
		StartTime:   startTime,
		EndTime:     endTime,
		Status:      models.BookingStatusPending,
		PlayerCount: 2,
		GameType:    "Singles",
		Notes:       "Test booking",
	}

	err = bookingRepo.Create(ctx, booking)
	assert.NoError(t, err, "Create should not return an error")
	assert.NotEqual(t, uuid.Nil, booking.ID, "Booking ID should be set")

	// Verify booking was created
	createdBooking, err := bookingRepo.GetByID(ctx, booking.ID)
	assert.NoError(t, err, "GetByID should not return an error")
	assert.Equal(t, booking.ID, createdBooking.ID, "Booking ID should match")
	assert.Equal(t, court.ID, createdBooking.CourtID, "Court ID should match")
	assert.Equal(t, user.ID, createdBooking.UserID, "User ID should match")
	assert.Equal(t, "Singles", createdBooking.GameType, "Game type should match")
}

func TestBookingRepository_CheckConflicts(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	db, cleanup := setupTestDB(t)
	defer cleanup()

	bookingRepo := NewBookingRepository(db)
	userRepo := NewUserRepository(db)
	courtRepo := NewCourtRepository(db)
	ctx := context.Background()

	// Create test user and court
	user := &models.User{
		Email:        "conflict@example.com",
		PasswordHash: "password123",
		Name:         "Conflict User",
		SkillLevel:   4.0,
		GameStyles:   []string{"Singles"},
		Gender:       "Male",
		Location: models.Location{
			Latitude:  37.7749,
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
	}
	err := userRepo.Create(ctx, user)
	require.NoError(t, err)

	court := &models.Court{
		Name:        "Conflict Test Court",
		Description: "A test court for conflict testing",
		Location: models.Location{
			Latitude:  37.7749,
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
		CourtType:   "Hard",
		IsPublic:    true,
		Amenities:   []string{"Lights", "Water"},
		ContactInfo: "test@example.com",
	}
	err = courtRepo.Create(ctx, court)
	require.NoError(t, err)

	// Create first booking
	startTime := time.Now().Add(24 * time.Hour)
	endTime := startTime.Add(time.Hour)

	booking1 := &models.Booking{
		CourtID:     court.ID,
		UserID:      user.ID,
		StartTime:   startTime,
		EndTime:     endTime,
		Status:      models.BookingStatusConfirmed,
		PlayerCount: 2,
		GameType:    "Singles",
	}
	err = bookingRepo.Create(ctx, booking1)
	require.NoError(t, err)

	// Try to create overlapping booking
	booking2 := &models.Booking{
		CourtID:     court.ID,
		UserID:      user.ID,
		StartTime:   startTime.Add(30 * time.Minute), // Overlaps with first booking
		EndTime:     endTime.Add(30 * time.Minute),
		Status:      models.BookingStatusPending,
		PlayerCount: 2,
		GameType:    "Singles",
	}

	err = bookingRepo.Create(ctx, booking2)
	assert.Error(t, err, "Should return error for overlapping booking")
	assert.Contains(t, err.Error(), "not available", "Error should mention availability")
}

func TestBookingRepository_GetAvailability(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	db, cleanup := setupTestDB(t)
	defer cleanup()

	bookingRepo := NewBookingRepository(db)
	userRepo := NewUserRepository(db)
	courtRepo := NewCourtRepository(db)
	ctx := context.Background()

	// Create test user and court
	user := &models.User{
		Email:        "availability@example.com",
		PasswordHash: "password123",
		Name:         "Availability User",
		SkillLevel:   4.0,
		GameStyles:   []string{"Singles"},
		Gender:       "Male",
		Location: models.Location{
			Latitude:  37.7749,
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
	}
	err := userRepo.Create(ctx, user)
	require.NoError(t, err)

	court := &models.Court{
		Name:        "Availability Test Court",
		Description: "A test court for availability testing",
		Location: models.Location{
			Latitude:  37.7749,
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
		CourtType:   "Hard",
		IsPublic:    true,
		Amenities:   []string{"Lights", "Water"},
		ContactInfo: "test@example.com",
	}
	err = courtRepo.Create(ctx, court)
	require.NoError(t, err)

	// Create a booking for tomorrow 2-3 PM
	tomorrow := time.Now().Add(24 * time.Hour)
	tomorrowDate := time.Date(tomorrow.Year(), tomorrow.Month(), tomorrow.Day(), 0, 0, 0, 0, tomorrow.Location())

	booking := &models.Booking{
		CourtID:     court.ID,
		UserID:      user.ID,
		StartTime:   time.Date(tomorrow.Year(), tomorrow.Month(), tomorrow.Day(), 14, 0, 0, 0, tomorrow.Location()),
		EndTime:     time.Date(tomorrow.Year(), tomorrow.Month(), tomorrow.Day(), 15, 0, 0, 0, tomorrow.Location()),
		Status:      models.BookingStatusConfirmed,
		PlayerCount: 2,
		GameType:    "Singles",
	}
	err = bookingRepo.Create(ctx, booking)
	require.NoError(t, err)

	// Get availability for tomorrow
	availability, err := bookingRepo.GetAvailability(ctx, court.ID, tomorrowDate)
	assert.NoError(t, err, "GetAvailability should not return an error")
	assert.Equal(t, court.ID, availability.CourtID, "Court ID should match")
	assert.Equal(t, tomorrowDate.Format("2006-01-02"), availability.Date, "Date should match")
	assert.Len(t, availability.TimeSlots, 16, "Should have 16 time slots (6 AM to 10 PM)")

	// Check that 2-3 PM slot is not available
	var slot2PM *models.TimeSlotAvailability
	for _, slot := range availability.TimeSlots {
		if slot.StartTime.Hour() == 14 { // 2 PM
			slot2PM = &slot
			break
		}
	}
	require.NotNil(t, slot2PM, "Should find 2 PM slot")
	assert.False(t, slot2PM.IsAvailable, "2 PM slot should not be available")
	assert.NotNil(t, slot2PM.BookingID, "Should have booking ID for unavailable slot")

	// Check that 3-4 PM slot is available
	var slot3PM *models.TimeSlotAvailability
	for _, slot := range availability.TimeSlots {
		if slot.StartTime.Hour() == 15 { // 3 PM
			slot3PM = &slot
			break
		}
	}
	require.NotNil(t, slot3PM, "Should find 3 PM slot")
	assert.True(t, slot3PM.IsAvailable, "3 PM slot should be available")
	assert.Nil(t, slot3PM.BookingID, "Should not have booking ID for available slot")
}
