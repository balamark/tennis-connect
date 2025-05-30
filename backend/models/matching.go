package models

import (
	"time"

	"github.com/google/uuid"
)

// MatchingStatus represents the status of a match
type MatchingStatus string

const (
	MatchingStatusPending   MatchingStatus = "pending"
	MatchingStatusMatched   MatchingStatus = "matched"
	MatchingStatusConfirmed MatchingStatus = "confirmed"
	MatchingStatusCancelled MatchingStatus = "cancelled"
	MatchingStatusCompleted MatchingStatus = "completed"
)

// MatchSession represents a matching session for a specific court and time
type MatchSession struct {
	ID         uuid.UUID      `json:"id"`
	CourtID    uuid.UUID      `json:"court_id"`
	StartTime  time.Time      `json:"start_time"`
	EndTime    time.Time      `json:"end_time"`
	GameType   string         `json:"game_type"`   // Singles, Doubles
	SkillLevel float32        `json:"skill_level"` // Target skill level
	Status     MatchingStatus `json:"status"`
	MaxPlayers int            `json:"max_players"` // 2 for singles, 4 for doubles
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`

	// Populated fields
	Court   *Court          `json:"court,omitempty"`
	Players []MatchPlayer   `json:"players,omitempty"`
	Matches []PlayerPairing `json:"matches,omitempty"`
}

// MatchPlayer represents a player in a matching session
type MatchPlayer struct {
	ID              uuid.UUID `json:"id"`
	MatchSessionID  uuid.UUID `json:"match_session_id"`
	UserID          uuid.UUID `json:"user_id"`
	JoinedAt        time.Time `json:"joined_at"`
	PreferenceScore float32   `json:"preference_score"` // Calculated preference score
	Priority        int       `json:"priority"`         // Higher priority for fewer available slots

	// Populated fields
	User *User `json:"user,omitempty"`
}

// PlayerPairing represents a pairing between players
type PlayerPairing struct {
	ID                 uuid.UUID      `json:"id"`
	MatchSessionID     uuid.UUID      `json:"match_session_id"`
	Player1ID          uuid.UUID      `json:"player1_id"`
	Player2ID          uuid.UUID      `json:"player2_id"`
	Player3ID          *uuid.UUID     `json:"player3_id,omitempty"` // For doubles
	Player4ID          *uuid.UUID     `json:"player4_id,omitempty"` // For doubles
	CompatibilityScore float32        `json:"compatibility_score"`
	Status             MatchingStatus `json:"status"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`

	// Populated fields
	Player1 *User `json:"player1,omitempty"`
	Player2 *User `json:"player2,omitempty"`
	Player3 *User `json:"player3,omitempty"`
	Player4 *User `json:"player4,omitempty"`
}

// PlayerFeedback represents feedback after a match
type PlayerFeedback struct {
	ID            uuid.UUID `json:"id"`
	PairingID     uuid.UUID `json:"pairing_id"`
	FromUserID    uuid.UUID `json:"from_user_id"`
	ToUserID      uuid.UUID `json:"to_user_id"`
	Rating        int       `json:"rating"` // 1-5 rating
	Comments      string    `json:"comments,omitempty"`
	CourtRating   int       `json:"court_rating"` // 1-5 rating for court condition
	CourtComments string    `json:"court_comments,omitempty"`
	MatchQuality  int       `json:"match_quality"` // 1-5 rating for match quality
	CreatedAt     time.Time `json:"created_at"`

	// Populated fields
	FromUser *User `json:"from_user,omitempty"`
	ToUser   *User `json:"to_user,omitempty"`
}

// MatchingRequest represents a request to join a matching session
type MatchingRequest struct {
	CourtID    uuid.UUID `json:"court_id" validate:"required"`
	Date       string    `json:"date" validate:"required"` // YYYY-MM-DD format
	StartTime  string    `json:"start_time"`               // HH:MM format, defaults to 17:00
	Duration   int       `json:"duration"`                 // Duration in minutes, defaults to 60
	GameType   string    `json:"game_type"`                // Singles, Doubles
	SkillLevel float32   `json:"skill_level,omitempty"`    // Optional skill level preference
}

// MatchingCriteria represents criteria for matching players
type MatchingCriteria struct {
	SkillLevelRange    float32 `json:"skill_level_range"`   // +/- range for skill matching
	TimeSlotTolerance  int     `json:"time_slot_tolerance"` // Minutes of tolerance for time matching
	PreferenceWeight   float32 `json:"preference_weight"`   // Weight for historical preferences
	AvailabilityWeight float32 `json:"availability_weight"` // Weight for player availability
	SkillWeight        float32 `json:"skill_weight"`        // Weight for skill compatibility
}

// DefaultMatchingCriteria returns default matching criteria
func DefaultMatchingCriteria() MatchingCriteria {
	return MatchingCriteria{
		SkillLevelRange:    0.5, // +/- 0.5 skill level
		TimeSlotTolerance:  30,  // 30 minutes tolerance
		PreferenceWeight:   0.3, // 30% weight for preferences
		AvailabilityWeight: 0.4, // 40% weight for availability
		SkillWeight:        0.3, // 30% weight for skill
	}
}

// CalculateCompatibilityScore calculates compatibility between two players
func (p *PlayerPairing) CalculateCompatibilityScore(player1, player2 *User, criteria MatchingCriteria) float32 {
	// Skill compatibility (0-1 score)
	skillDiff := abs(player1.SkillLevel - player2.SkillLevel)
	skillScore := max(0, 1.0-(skillDiff/criteria.SkillLevelRange))

	// Time preference compatibility (simplified)
	timeScore := float32(0.8) // Default good compatibility

	// Historical preference score (would be calculated from feedback)
	preferenceScore := float32(0.7) // Default neutral preference

	// Weighted total
	totalScore := (skillScore * criteria.SkillWeight) +
		(timeScore * criteria.AvailabilityWeight) +
		(preferenceScore * criteria.PreferenceWeight)

	return totalScore
}

// Helper functions
func abs(x float32) float32 {
	if x < 0 {
		return -x
	}
	return x
}

func max(a, b float32) float32 {
	if a > b {
		return a
	}
	return b
}
