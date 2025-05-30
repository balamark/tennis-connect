package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/user/tennis-connect/database"
	"github.com/user/tennis-connect/models"
)

// BookingRepository handles database operations related to bookings
type BookingRepository struct {
	db *database.DB
}

// NewBookingRepository creates a new BookingRepository
func NewBookingRepository(db *database.DB) *BookingRepository {
	return &BookingRepository{db: db}
}

// Create creates a new booking
func (r *BookingRepository) Create(ctx context.Context, booking *models.Booking) error {
	if booking.ID == uuid.Nil {
		booking.ID = uuid.New()
	}
	booking.CreatedAt = time.Now()
	booking.UpdatedAt = time.Now()

	// Validate booking time
	if booking.StartTime.Before(time.Now()) {
		return fmt.Errorf("cannot book court in the past")
	}
	if booking.EndTime.Before(booking.StartTime) {
		return fmt.Errorf("end time must be after start time")
	}

	// Check for conflicts
	conflicts, err := r.CheckConflicts(ctx, booking.CourtID, booking.StartTime, booking.EndTime, uuid.Nil)
	if err != nil {
		return fmt.Errorf("failed to check conflicts: %w", err)
	}
	if len(conflicts) > 0 {
		return fmt.Errorf("court is not available during the requested time")
	}

	_, err = r.db.ExecContext(ctx, `
		INSERT INTO bookings (
			id, court_id, user_id, start_time, end_time, status, 
			player_count, game_type, notes, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`,
		booking.ID, booking.CourtID, booking.UserID, booking.StartTime, booking.EndTime,
		booking.Status, booking.PlayerCount, booking.GameType, booking.Notes,
		booking.CreatedAt, booking.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create booking: %w", err)
	}

	return nil
}

// GetByID retrieves a booking by its ID
func (r *BookingRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Booking, error) {
	booking := &models.Booking{}
	err := r.db.QueryRowContext(ctx, `
		SELECT 
			id, court_id, user_id, start_time, end_time, status,
			player_count, game_type, notes, created_at, updated_at
		FROM bookings WHERE id = $1
	`, id).Scan(
		&booking.ID, &booking.CourtID, &booking.UserID, &booking.StartTime, &booking.EndTime,
		&booking.Status, &booking.PlayerCount, &booking.GameType, &booking.Notes,
		&booking.CreatedAt, &booking.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("booking not found")
		}
		return nil, fmt.Errorf("failed to get booking: %w", err)
	}

	return booking, nil
}

// GetByUserID retrieves bookings for a specific user
func (r *BookingRepository) GetByUserID(ctx context.Context, userID uuid.UUID, includeCompleted bool) ([]*models.Booking, error) {
	query := `
		SELECT 
			id, court_id, user_id, start_time, end_time, status,
			player_count, game_type, notes, created_at, updated_at
		FROM bookings 
		WHERE user_id = $1
	`
	args := []interface{}{userID}

	if !includeCompleted {
		query += " AND status != 'completed' AND status != 'cancelled'"
	}

	query += " ORDER BY start_time ASC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query user bookings: %w", err)
	}
	defer rows.Close()

	var bookings []*models.Booking
	for rows.Next() {
		booking := &models.Booking{}
		err := rows.Scan(
			&booking.ID, &booking.CourtID, &booking.UserID, &booking.StartTime, &booking.EndTime,
			&booking.Status, &booking.PlayerCount, &booking.GameType, &booking.Notes,
			&booking.CreatedAt, &booking.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan booking: %w", err)
		}
		bookings = append(bookings, booking)
	}

	return bookings, nil
}

// GetByCourtID retrieves bookings for a specific court
func (r *BookingRepository) GetByCourtID(ctx context.Context, courtID uuid.UUID, startDate, endDate time.Time) ([]*models.Booking, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT 
			id, court_id, user_id, start_time, end_time, status,
			player_count, game_type, notes, created_at, updated_at
		FROM bookings 
		WHERE court_id = $1 
		AND start_time >= $2 
		AND end_time <= $3
		AND status IN ('pending', 'confirmed')
		ORDER BY start_time ASC
	`, courtID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to query court bookings: %w", err)
	}
	defer rows.Close()

	var bookings []*models.Booking
	for rows.Next() {
		booking := &models.Booking{}
		err := rows.Scan(
			&booking.ID, &booking.CourtID, &booking.UserID, &booking.StartTime, &booking.EndTime,
			&booking.Status, &booking.PlayerCount, &booking.GameType, &booking.Notes,
			&booking.CreatedAt, &booking.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan booking: %w", err)
		}
		bookings = append(bookings, booking)
	}

	return bookings, nil
}

// CheckConflicts checks for booking conflicts
func (r *BookingRepository) CheckConflicts(ctx context.Context, courtID uuid.UUID, startTime, endTime time.Time, excludeBookingID uuid.UUID) ([]*models.Booking, error) {
	query := `
		SELECT 
			id, court_id, user_id, start_time, end_time, status,
			player_count, game_type, notes, created_at, updated_at
		FROM bookings 
		WHERE court_id = $1 
		AND status IN ('pending', 'confirmed')
		AND (
			(start_time <= $2 AND end_time > $2) OR
			(start_time < $3 AND end_time >= $3) OR
			(start_time >= $2 AND end_time <= $3)
		)
	`
	args := []interface{}{courtID, startTime, endTime}

	if excludeBookingID != uuid.Nil {
		query += " AND id != $4"
		args = append(args, excludeBookingID)
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to check conflicts: %w", err)
	}
	defer rows.Close()

	var conflicts []*models.Booking
	for rows.Next() {
		booking := &models.Booking{}
		err := rows.Scan(
			&booking.ID, &booking.CourtID, &booking.UserID, &booking.StartTime, &booking.EndTime,
			&booking.Status, &booking.PlayerCount, &booking.GameType, &booking.Notes,
			&booking.CreatedAt, &booking.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan conflict: %w", err)
		}
		conflicts = append(conflicts, booking)
	}

	return conflicts, nil
}

// GetAvailability gets court availability for a specific date
func (r *BookingRepository) GetAvailability(ctx context.Context, courtID uuid.UUID, date time.Time) (*models.CourtAvailability, error) {
	// Define operating hours (6 AM to 10 PM)
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 6, 0, 0, 0, date.Location())
	endOfDay := time.Date(date.Year(), date.Month(), date.Day(), 22, 0, 0, 0, date.Location())

	// Get existing bookings for the day
	bookings, err := r.GetByCourtID(ctx, courtID, startOfDay, endOfDay)
	if err != nil {
		return nil, fmt.Errorf("failed to get court bookings: %w", err)
	}

	// Generate time slots (1-hour intervals)
	availability := &models.CourtAvailability{
		CourtID:   courtID,
		Date:      date.Format("2006-01-02"),
		TimeSlots: []models.TimeSlotAvailability{},
	}

	for current := startOfDay; current.Before(endOfDay); current = current.Add(time.Hour) {
		slotEnd := current.Add(time.Hour)
		isAvailable := true
		var conflictingBookingID *uuid.UUID

		// Check if this slot conflicts with any booking
		for _, booking := range bookings {
			if current.Before(booking.EndTime) && slotEnd.After(booking.StartTime) {
				isAvailable = false
				conflictingBookingID = &booking.ID
				break
			}
		}

		slot := models.TimeSlotAvailability{
			StartTime:   current,
			EndTime:     slotEnd,
			IsAvailable: isAvailable,
			BookingID:   conflictingBookingID,
		}
		availability.TimeSlots = append(availability.TimeSlots, slot)
	}

	return availability, nil
}

// UpdateStatus updates the status of a booking
func (r *BookingRepository) UpdateStatus(ctx context.Context, bookingID uuid.UUID, status models.BookingStatus) error {
	result, err := r.db.ExecContext(ctx, `
		UPDATE bookings 
		SET status = $1, updated_at = $2
		WHERE id = $3
	`, status, time.Now(), bookingID)
	if err != nil {
		return fmt.Errorf("failed to update booking status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("booking not found")
	}

	return nil
}

// Cancel cancels a booking
func (r *BookingRepository) Cancel(ctx context.Context, bookingID uuid.UUID, userID uuid.UUID) error {
	// First check if the booking exists and belongs to the user
	booking, err := r.GetByID(ctx, bookingID)
	if err != nil {
		return err
	}

	if booking.UserID != userID {
		return fmt.Errorf("booking does not belong to user")
	}

	if !booking.CanBeCancelled() {
		return fmt.Errorf("booking cannot be cancelled")
	}

	return r.UpdateStatus(ctx, bookingID, models.BookingStatusCancelled)
}

// GetUpcomingBookings gets upcoming bookings for a user
func (r *BookingRepository) GetUpcomingBookings(ctx context.Context, userID uuid.UUID, limit int) ([]*models.Booking, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT 
			id, court_id, user_id, start_time, end_time, status,
			player_count, game_type, notes, created_at, updated_at
		FROM bookings 
		WHERE user_id = $1 
		AND start_time > $2
		AND status IN ('pending', 'confirmed')
		ORDER BY start_time ASC
		LIMIT $3
	`, userID, time.Now(), limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query upcoming bookings: %w", err)
	}
	defer rows.Close()

	var bookings []*models.Booking
	for rows.Next() {
		booking := &models.Booking{}
		err := rows.Scan(
			&booking.ID, &booking.CourtID, &booking.UserID, &booking.StartTime, &booking.EndTime,
			&booking.Status, &booking.PlayerCount, &booking.GameType, &booking.Notes,
			&booking.CreatedAt, &booking.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan booking: %w", err)
		}
		bookings = append(bookings, booking)
	}

	return bookings, nil
}
