package models

import (
	"time"

	"github.com/google/uuid"
)

type Event struct {
	ID                 uuid.UUID `json:"id"`
	Title              string    `json:"title"`
	Description        string    `json:"description"`
	CourtID            uuid.UUID `json:"court_id"`
	CourtName          string    `json:"court_name"`
	Location           Location  `json:"location"`
	StartTime          time.Time `json:"start_time"`
	EndTime            time.Time `json:"end_time"`
	HostID             uuid.UUID `json:"host_id"`
	HostName           string    `json:"host_name"`
	MaxPlayers         int       `json:"max_players"`
	SkillLevel         string    `json:"skill_level,omitempty"` // Beginner, Intermediate, Advanced, or NTRP range
	EventType          string    `json:"event_type"`            // Open Rally, Tournament, Clinic, etc.
	IsRecurring        bool      `json:"is_recurring"`
	RSVPs              []RSVP    `json:"rsvps,omitempty"`
	Waitlist           []RSVP    `json:"waitlist,omitempty"`
	IsNewcomerFriendly bool      `json:"is_newcomer_friendly"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// RSVP represents a user's RSVP to an event
type RSVP struct {
	ID        uuid.UUID `json:"id"`
	EventID   uuid.UUID `json:"event_id"`
	UserID    uuid.UUID `json:"user_id"`
	UserName  string    `json:"user_name"`
	Status    string    `json:"status"` // Confirmed, Waitlisted, Cancelled
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// GetConfirmedRSVPs returns a slice of RSVPs with Confirmed status
func (e *Event) GetConfirmedRSVPs() []RSVP {
	var confirmed []RSVP
	for _, rsvp := range e.RSVPs {
		if rsvp.Status == "Confirmed" {
			confirmed = append(confirmed, rsvp)
		}
	}
	return confirmed
}

// HasAvailableSpots returns true if the event has spots available
func (e *Event) HasAvailableSpots() bool {
	return len(e.GetConfirmedRSVPs()) < e.MaxPlayers
}

// MoveFromWaitlist moves users from the waitlist to confirmed if spots are available
func (e *Event) MoveFromWaitlist() {
	availableSpots := e.MaxPlayers - len(e.GetConfirmedRSVPs())

	if availableSpots <= 0 || len(e.Waitlist) == 0 {
		return
	}

	// Move users from waitlist to confirmed, up to the number of available spots
	for i := 0; i < min(availableSpots, len(e.Waitlist)); i++ {
		e.Waitlist[i].Status = "Confirmed"
		e.RSVPs = append(e.RSVPs, e.Waitlist[i])
	}

	// Remove moved users from waitlist
	if availableSpots >= len(e.Waitlist) {
		e.Waitlist = []RSVP{}
	} else {
		e.Waitlist = e.Waitlist[availableSpots:]
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
