package models

import (
	"time"

	"github.com/google/uuid"
)

// BookingStatus represents the status of a booking
type BookingStatus string

const (
	BookingStatusPending   BookingStatus = "pending"
	BookingStatusConfirmed BookingStatus = "confirmed"
	BookingStatusCancelled BookingStatus = "cancelled"
	BookingStatusCompleted BookingStatus = "completed"
)

// Booking represents a court reservation
type Booking struct {
	ID          uuid.UUID     `json:"id"`
	CourtID     uuid.UUID     `json:"court_id"`
	UserID      uuid.UUID     `json:"user_id"`
	StartTime   time.Time     `json:"start_time"`
	EndTime     time.Time     `json:"end_time"`
	Status      BookingStatus `json:"status"`
	PlayerCount int           `json:"player_count"` // Number of players expected
	GameType    string        `json:"game_type"`    // Singles, Doubles, etc.
	Notes       string        `json:"notes,omitempty"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`

	// Populated fields (not stored in DB)
	Court *Court `json:"court,omitempty"`
	User  *User  `json:"user,omitempty"`
}

// IsActive returns true if the booking is active (confirmed and not past end time)
func (b *Booking) IsActive() bool {
	return b.Status == BookingStatusConfirmed && time.Now().Before(b.EndTime)
}

// CanBeCancelled returns true if the booking can be cancelled
func (b *Booking) CanBeCancelled() bool {
	return (b.Status == BookingStatusPending || b.Status == BookingStatusConfirmed) &&
		time.Now().Before(b.StartTime.Add(-30*time.Minute)) // Can cancel up to 30 minutes before
}

// BookingRequest represents a request to book a court
type BookingRequest struct {
	CourtID     uuid.UUID `json:"court_id" validate:"required"`
	Date        string    `json:"date" validate:"required"` // YYYY-MM-DD format
	StartTime   string    `json:"start_time"`               // HH:MM format, defaults to 17:00
	Duration    int       `json:"duration"`                 // Duration in minutes, defaults to 60
	PlayerCount int       `json:"player_count"`             // Number of players, defaults to 2
	GameType    string    `json:"game_type"`                // Singles, Doubles, etc.
	Notes       string    `json:"notes,omitempty"`
}

// TimeSlotAvailability represents the availability of a time slot
type TimeSlotAvailability struct {
	StartTime   time.Time  `json:"start_time"`
	EndTime     time.Time  `json:"end_time"`
	IsAvailable bool       `json:"is_available"`
	BookingID   *uuid.UUID `json:"booking_id,omitempty"` // If not available, which booking is using it
}

// CourtAvailability represents the availability of a court for a specific date
type CourtAvailability struct {
	CourtID   uuid.UUID              `json:"court_id"`
	Date      string                 `json:"date"`
	TimeSlots []TimeSlotAvailability `json:"time_slots"`
}
