package models

import (
	"time"

	"github.com/google/uuid"
)

type Bulletin struct {
	ID          uuid.UUID          `json:"id"`
	UserID      uuid.UUID          `json:"user_id"`
	UserName    string             `json:"user_name"`
	Title       string             `json:"title"`
	Description string             `json:"description"`
	Location    Location           `json:"location,omitempty"`
	CourtID     *uuid.UUID         `json:"court_id,omitempty"`
	CourtName   string             `json:"court_name,omitempty"`
	StartTime   time.Time          `json:"start_time"`
	EndTime     time.Time          `json:"end_time"`
	SkillLevel  string             `json:"skill_level,omitempty"` // NTRP rating or description
	GameType    string             `json:"game_type,omitempty"`   // Singles, Doubles, Either
	Responses   []BulletinResponse `json:"responses,omitempty"`
	IsActive    bool               `json:"is_active"` // Will be false after EndTime
	CreatedAt   time.Time          `json:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at"`
}

// BulletinResponse represents a user's response to a bulletin
type BulletinResponse struct {
	ID         uuid.UUID `json:"id"`
	BulletinID uuid.UUID `json:"bulletin_id"`
	UserID     uuid.UUID `json:"user_id"`
	UserName   string    `json:"user_name"`
	Message    string    `json:"message"`
	Status     string    `json:"status"` // Pending, Accepted, Declined
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// IsExpired returns true if the bulletin has expired (current time is after EndTime)
func (b *Bulletin) IsExpired() bool {
	return time.Now().After(b.EndTime)
}

// Expire sets the bulletin to inactive
func (b *Bulletin) Expire() {
	b.IsActive = false
	b.UpdatedAt = time.Now()
}

// AcceptResponse changes a response status to Accepted
func (b *Bulletin) AcceptResponse(responseID uuid.UUID) {
	for i := range b.Responses {
		if b.Responses[i].ID == responseID {
			b.Responses[i].Status = "Accepted"
			b.Responses[i].UpdatedAt = time.Now()
			return
		}
	}
}
