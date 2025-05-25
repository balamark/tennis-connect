package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID             uuid.UUID  `json:"id"`
	Email          string     `json:"email"`
	PasswordHash   string     `json:"-"`
	Name           string     `json:"name"`
	ProfilePicture string     `json:"profile_picture,omitempty"`
	Location       Location   `json:"location"`
	SkillLevel     float32    `json:"skill_level"` // NTRP rating (1.0-7.0)
	PreferredTimes []TimeSlot `json:"preferred_times"`
	GameStyles     []string   `json:"game_styles"` // Singles, doubles, competitive, social
	Bio            string     `json:"bio,omitempty"`
	IsVerified     bool       `json:"is_verified"`
	IsNewToArea    bool       `json:"is_new_to_area"`
	Gender         string     `json:"gender,omitempty"` // For safety filters
	Distance       float64    `json:"distance,omitempty"` // Distance in miles (calculated field, not stored in DB)
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	ZipCode   string  `json:"zip_code"`
	City      string  `json:"city"`
	State     string  `json:"state"`
}

type TimeSlot struct {
	DayOfWeek string `json:"day_of_week"` // Monday, Tuesday, etc.
	StartTime string `json:"start_time"`  // 24-hour format: "14:00"
	EndTime   string `json:"end_time"`    // 24-hour format: "16:00"
}

// PlayerMatch represents a potential match between two players
type PlayerMatch struct {
	ID         uuid.UUID `json:"id"`
	User1ID    uuid.UUID `json:"user1_id"`
	User2ID    uuid.UUID `json:"user2_id"`
	User1Liked bool      `json:"user1_liked"`
	User2Liked bool      `json:"user2_liked"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// IsMatch returns true if both players have liked each other
func (pm *PlayerMatch) IsMatch() bool {
	return pm.User1Liked && pm.User2Liked
}
