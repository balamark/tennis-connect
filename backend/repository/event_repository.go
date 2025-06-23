package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/user/tennis-connect/database"
	"github.com/user/tennis-connect/models"
	"github.com/user/tennis-connect/utils"
)

// EventRepository handles database operations related to events
type EventRepository struct {
	db *database.DB
}

// NewEventRepository creates a new EventRepository
func NewEventRepository(db *database.DB) *EventRepository {
	return &EventRepository{db: db}
}

// Create inserts a new event into the database
func (r *EventRepository) Create(ctx context.Context, event *models.Event) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if event.ID == uuid.Nil {
		event.ID = uuid.New()
	}
	event.CreatedAt = time.Now()
	event.UpdatedAt = time.Now()

	_, err = tx.ExecContext(ctx, `
		INSERT INTO events (
			id, title, description, court_id, latitude, longitude, zip_code, city, state,
			start_time, end_time, host_id, max_players, skill_level, event_type, is_recurring,
			is_newcomer_friendly, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
	`,
		event.ID, event.Title, event.Description, event.CourtID,
		event.Location.Latitude, event.Location.Longitude, event.Location.ZipCode, event.Location.City, event.Location.State,
		event.StartTime, event.EndTime, event.HostID, event.MaxPlayers, event.SkillLevel, event.EventType, event.IsRecurring,
		event.IsNewcomerFriendly, event.CreatedAt, event.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert event: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}

// GetByID retrieves an event by its ID
func (r *EventRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Event, error) {
	event := &models.Event{ID: id}
	err := r.db.QueryRowContext(ctx, `
		SELECT 
			title, description, court_id, latitude, longitude, zip_code, city, state,
			start_time, end_time, host_id, max_players, skill_level, event_type, is_recurring,
			is_newcomer_friendly, created_at, updated_at
		FROM events WHERE id = $1
	`, id).Scan(
		&event.Title, &event.Description, &event.CourtID,
		&event.Location.Latitude, &event.Location.Longitude, &event.Location.ZipCode, &event.Location.City, &event.Location.State,
		&event.StartTime, &event.EndTime, &event.HostID, &event.MaxPlayers, &event.SkillLevel, &event.EventType, &event.IsRecurring,
		&event.IsNewcomerFriendly, &event.CreatedAt, &event.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("event not found")
		}
		return nil, fmt.Errorf("failed to get event: %w", err)
	}

	// Get host name from users table
	var hostName string
	err = r.db.QueryRowContext(ctx, "SELECT name FROM users WHERE id = $1", event.HostID).Scan(&hostName)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to get host name: %w", err)
	}
	event.HostName = hostName

	// Get court name from courts table if court_id is provided
	if event.CourtID != uuid.Nil {
		var courtName string
		err = r.db.QueryRowContext(ctx, "SELECT name FROM courts WHERE id = $1", event.CourtID).Scan(&courtName)
		if err != nil && err != sql.ErrNoRows {
			return nil, fmt.Errorf("failed to get court name: %w", err)
		}
		event.CourtName = courtName
	}

	// Query event RSVPs
	rsvpRows, err := r.db.QueryContext(ctx, `
		SELECT r.id, r.user_id, u.name, r.status, r.created_at, r.updated_at
		FROM event_rsvps r
		JOIN users u ON r.user_id = u.id
		WHERE r.event_id = $1
		ORDER BY r.created_at
	`, id)
	if err != nil {
		return nil, fmt.Errorf("failed to query event RSVPs: %w", err)
	}
	defer rsvpRows.Close()

	event.RSVPs = []models.RSVP{}
	event.Waitlist = []models.RSVP{}
	for rsvpRows.Next() {
		var rsvp models.RSVP
		if err := rsvpRows.Scan(&rsvp.ID, &rsvp.UserID, &rsvp.UserName, &rsvp.Status, &rsvp.CreatedAt, &rsvp.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan event RSVP: %w", err)
		}
		rsvp.EventID = id

		// Sort RSVPs into confirmed list or waitlist
		if rsvp.Status == "Confirmed" {
			event.RSVPs = append(event.RSVPs, rsvp)
		} else if rsvp.Status == "Waitlisted" {
			event.Waitlist = append(event.Waitlist, rsvp)
		}
	}

	return event, nil
}

// GetEvents retrieves events with filtering and pagination
func (r *EventRepository) GetEvents(ctx context.Context, latitude, longitude float64, radius float64, filters map[string]interface{}, page, limit int) ([]*models.Event, int, error) {
	// Base query with geospatial filtering
	baseQuery := `
		SELECT 
			id, title, description, court_id, latitude, longitude, zip_code, city, state,
			start_time, end_time, host_id, max_players, skill_level, event_type, is_recurring,
			is_newcomer_friendly, created_at, updated_at,
			( 6371 * acos( cos( radians($1) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians($2) ) + sin( radians($1) ) * sin( radians( latitude ) ) ) ) AS distance
		FROM events
	`
	countQuery := `SELECT COUNT(*) FROM events`

	whereClauses := []string{}
	args := []interface{}{latitude, longitude}
	argCount := 3

	// Add filters
	if skillLevel, ok := filters["skillLevel"].(string); ok && skillLevel != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("skill_level = $%d", argCount))
		args = append(args, skillLevel)
		argCount++
	}

	if eventType, ok := filters["eventType"].(string); ok && eventType != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("event_type = $%d", argCount))
		args = append(args, eventType)
		argCount++
	}

	if newcomerFriendly, ok := filters["newcomerFriendly"].(bool); ok && newcomerFriendly {
		whereClauses = append(whereClauses, "is_newcomer_friendly = TRUE")
	}

	if startDate, ok := filters["startDate"].(time.Time); ok {
		whereClauses = append(whereClauses, fmt.Sprintf("start_time >= $%d", argCount))
		args = append(args, startDate)
		argCount++
	}

	if endDate, ok := filters["endDate"].(time.Time); ok {
		whereClauses = append(whereClauses, fmt.Sprintf("start_time <= $%d", argCount))
		args = append(args, endDate)
		argCount++
	}

	// By default, only show future events
	if _, ok := filters["startDate"].(time.Time); !ok {
		whereClauses = append(whereClauses, fmt.Sprintf("start_time >= $%d", argCount))
		args = append(args, time.Now())
		argCount++
	}

	// Combine WHERE clauses
	if len(whereClauses) > 0 {
		baseQuery += " WHERE " + utils.JoinStrings(whereClauses, " AND ")
		countQuery += " WHERE " + utils.JoinStrings(whereClauses, " AND ")
	}

	// Add distance filter
	distanceFilter := fmt.Sprintf("( 6371 * acos( cos( radians($1) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians($2) ) + sin( radians($1) ) * sin( radians( latitude ) ) ) ) < $%d", argCount)
	if len(whereClauses) == 0 {
		baseQuery += " WHERE " + distanceFilter
		countQuery += " WHERE " + distanceFilter
	} else {
		baseQuery += " AND " + distanceFilter
		countQuery += " AND " + distanceFilter
	}
	args = append(args, radius) // radius in km
	argCount++

	// Get total count for pagination
	var totalEvents int
	err := r.db.QueryRowContext(ctx, countQuery, args[:argCount-1]...).Scan(&totalEvents)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count events: %w", err)
	}

	// Add ordering and pagination
	baseQuery += " ORDER BY start_time ASC LIMIT $" + fmt.Sprintf("%d", argCount) + " OFFSET $" + fmt.Sprintf("%d", argCount+1)
	args = append(args, limit, (page-1)*limit)

	rows, err := r.db.QueryContext(ctx, baseQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query events: %w", err)
	}
	defer rows.Close()

	events := []*models.Event{}
	hostIDs := []uuid.UUID{} // To fetch host names later

	for rows.Next() {
		event := &models.Event{}
		var distance float64 // to scan the calculated distance
		err := rows.Scan(
			&event.ID, &event.Title, &event.Description, &event.CourtID,
			&event.Location.Latitude, &event.Location.Longitude, &event.Location.ZipCode, &event.Location.City, &event.Location.State,
			&event.StartTime, &event.EndTime, &event.HostID, &event.MaxPlayers, &event.SkillLevel, &event.EventType, &event.IsRecurring,
			&event.IsNewcomerFriendly, &event.CreatedAt, &event.UpdatedAt, &distance,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan event: %w", err)
		}

		events = append(events, event)
		hostIDs = append(hostIDs, event.HostID)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating event rows: %w", err)
	}

	// Fetch host names and RSVPs for events
	for i, event := range events {
		// Get host name
		var hostName string
		err = r.db.QueryRowContext(ctx, "SELECT name FROM users WHERE id = $1", event.HostID).Scan(&hostName)
		if err != nil && err != sql.ErrNoRows {
			return nil, 0, fmt.Errorf("failed to get host name: %w", err)
		}
		events[i].HostName = hostName

		// Get court name if court_id is provided
		if event.CourtID != uuid.Nil {
			var courtName string
			err = r.db.QueryRowContext(ctx, "SELECT name FROM courts WHERE id = $1", event.CourtID).Scan(&courtName)
			if err != nil && err != sql.ErrNoRows {
				return nil, 0, fmt.Errorf("failed to get court name: %w", err)
			}
			events[i].CourtName = courtName
		}

		// Get RSVP count and preview
		rsvpRows, err := r.db.QueryContext(ctx, `
			SELECT r.id, r.user_id, u.name, r.status, r.created_at, r.updated_at
			FROM event_rsvps r
			JOIN users u ON r.user_id = u.id
			WHERE r.event_id = $1 AND r.status = 'Confirmed'
			ORDER BY r.created_at
			LIMIT 10
		`, event.ID)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to query event RSVPs: %w", err)
		}

		events[i].RSVPs = []models.RSVP{}
		for rsvpRows.Next() {
			var rsvp models.RSVP
			if err := rsvpRows.Scan(&rsvp.ID, &rsvp.UserID, &rsvp.UserName, &rsvp.Status, &rsvp.CreatedAt, &rsvp.UpdatedAt); err != nil {
				rsvpRows.Close()
				return nil, 0, fmt.Errorf("failed to scan event RSVP: %w", err)
			}
			rsvp.EventID = event.ID
			events[i].RSVPs = append(events[i].RSVPs, rsvp)
		}
		rsvpRows.Close()
	}

	return events, totalEvents, nil
}

// CreateRSVP creates a new RSVP for an event
func (r *EventRepository) CreateRSVP(ctx context.Context, rsvp *models.RSVP) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Check if user has already RSVPed to this event
	var existingID uuid.UUID
	var existingStatus string
	err = tx.QueryRowContext(ctx, "SELECT id, status FROM event_rsvps WHERE event_id = $1 AND user_id = $2", rsvp.EventID, rsvp.UserID).Scan(&existingID, &existingStatus)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to check existing RSVP: %w", err)
	}

	if err == nil {
		// User has already RSVPed, update the status
		_, err := tx.ExecContext(ctx, "UPDATE event_rsvps SET status = $1, updated_at = $2 WHERE id = $3", rsvp.Status, time.Now(), existingID)
		if err != nil {
			return fmt.Errorf("failed to update RSVP: %w", err)
		}
		rsvp.ID = existingID
	} else {
		// New RSVP
		if rsvp.ID == uuid.Nil {
			rsvp.ID = uuid.New()
		}
		rsvp.CreatedAt = time.Now()
		rsvp.UpdatedAt = time.Now()

		// Check if the event is full and the RSVP is a confirmation
		if rsvp.Status == "Confirmed" {
			var confirmedCount int
			var maxPlayers int
			err = tx.QueryRowContext(ctx, `
				SELECT COUNT(*), e.max_players 
				FROM event_rsvps r 
				JOIN events e ON r.event_id = e.id 
				WHERE r.event_id = $1 AND r.status = 'Confirmed'
				GROUP BY e.max_players
			`, rsvp.EventID).Scan(&confirmedCount, &maxPlayers)

			if err != nil && err != sql.ErrNoRows {
				return fmt.Errorf("failed to check event capacity: %w", err)
			}

			// If we got a row back and the event is full, add to waitlist instead
			if err == nil && confirmedCount >= maxPlayers {
				rsvp.Status = "Waitlisted"
			}
		}

		// Insert the new RSVP
		_, err = tx.ExecContext(ctx, `
			INSERT INTO event_rsvps (
				id, event_id, user_id, status, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6)
		`,
			rsvp.ID, rsvp.EventID, rsvp.UserID, rsvp.Status, rsvp.CreatedAt, rsvp.UpdatedAt,
		)
		if err != nil {
			return fmt.Errorf("failed to insert RSVP: %w", err)
		}
	}

	// If a user cancels, check if we can move someone from the waitlist
	if rsvp.Status == "Cancelled" && existingStatus == "Confirmed" {
		// Get the next person on the waitlist
		var waitlistID uuid.UUID
		var waitlistUserID uuid.UUID
		err = tx.QueryRowContext(ctx, `
			SELECT id, user_id FROM event_rsvps 
			WHERE event_id = $1 AND status = 'Waitlisted' 
			ORDER BY created_at ASC 
			LIMIT 1
		`, rsvp.EventID).Scan(&waitlistID, &waitlistUserID)

		if err == nil {
			// Move this person from waitlist to confirmed
			_, err = tx.ExecContext(ctx, "UPDATE event_rsvps SET status = 'Confirmed', updated_at = $1 WHERE id = $2", time.Now(), waitlistID)
			if err != nil {
				return fmt.Errorf("failed to update waitlist RSVP: %w", err)
			}

			// In a real app, we'd send a notification to this user
		}
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}

// GetRSVP retrieves an RSVP by user ID and event ID
func (r *EventRepository) GetRSVP(ctx context.Context, eventID, userID uuid.UUID) (*models.RSVP, error) {
	var rsvp models.RSVP
	err := r.db.QueryRowContext(ctx, `
		SELECT id, status, created_at, updated_at
		FROM event_rsvps
		WHERE event_id = $1 AND user_id = $2
	`, eventID, userID).Scan(&rsvp.ID, &rsvp.Status, &rsvp.CreatedAt, &rsvp.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("RSVP not found")
		}
		return nil, fmt.Errorf("failed to get RSVP: %w", err)
	}

	rsvp.EventID = eventID
	rsvp.UserID = userID

	// Get user name
	var userName string
	err = r.db.QueryRowContext(ctx, "SELECT name FROM users WHERE id = $1", userID).Scan(&userName)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to get user name: %w", err)
	}
	rsvp.UserName = userName

	return &rsvp, nil
}
