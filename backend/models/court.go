package models

import (
	"time"

	"github.com/google/uuid"
)

type Court struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	Location    Location  `json:"location"`
	ImageURL    string    `json:"image_url,omitempty"`
	CourtType   string    `json:"court_type"` // Clay, Hard, Grass, etc.
	IsPublic    bool      `json:"is_public"`
	Amenities   []string  `json:"amenities,omitempty"` // Lights, Water, Restrooms, etc.
	ContactInfo string    `json:"contact_info,omitempty"`
	Website     string    `json:"website,omitempty"`
	CheckIns    []CheckIn `json:"check_ins,omitempty"`
	Popularity  int       `json:"popularity"` // Calculated based on check-ins
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CheckIn represents a user checking in at a court
type CheckIn struct {
	ID         uuid.UUID  `json:"id"`
	CourtID    uuid.UUID  `json:"court_id"`
	UserID     uuid.UUID  `json:"user_id"`
	UserName   string     `json:"user_name"`
	CheckedIn  time.Time  `json:"checked_in"`
	CheckedOut *time.Time `json:"checked_out,omitempty"`
	Message    string     `json:"message,omitempty"` // Optional message, e.g., "Looking for a hitting partner!"
}

// IsActive returns true if the check-in is still active (user hasn't checked out)
func (c *CheckIn) IsActive() bool {
	return c.CheckedOut == nil
}
