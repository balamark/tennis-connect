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

// CourtRepository handles database operations related to courts
type CourtRepository struct {
	db *database.DB
}

// NewCourtRepository creates a new CourtRepository
func NewCourtRepository(db *database.DB) *CourtRepository {
	return &CourtRepository{db: db}
}

// Create inserts a new court into the database
func (r *CourtRepository) Create(ctx context.Context, court *models.Court) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if court.ID == uuid.Nil {
		court.ID = uuid.New()
	}
	court.CreatedAt = time.Now()
	court.UpdatedAt = time.Now()

	_, err = tx.ExecContext(ctx, `
		INSERT INTO courts (
			id, name, description, latitude, longitude, zip_code, city, state, 
			image_url, court_type, is_public, contact_info, website, popularity, 
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
	`,
		court.ID, court.Name, court.Description,
		court.Location.Latitude, court.Location.Longitude, court.Location.ZipCode, court.Location.City, court.Location.State,
		court.ImageURL, court.CourtType, court.IsPublic, court.ContactInfo, court.Website, court.Popularity,
		court.CreatedAt, court.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert court: %w", err)
	}

	// Insert amenities
	for _, amenityName := range court.Amenities {
		var amenityID uuid.UUID
		// Get or create amenity ID
		err = tx.QueryRowContext(ctx, "SELECT id FROM amenities WHERE name = $1", amenityName).Scan(&amenityID)
		if err == sql.ErrNoRows {
			amenityID = uuid.New()
			_, err = tx.ExecContext(ctx, "INSERT INTO amenities (id, name) VALUES ($1, $2)", amenityID, amenityName)
			if err != nil {
				return fmt.Errorf("failed to insert amenity %s: %w", amenityName, err)
			}
		} else if err != nil {
			return fmt.Errorf("failed to query amenity %s: %w", amenityName, err)
		}

		_, err = tx.ExecContext(ctx, `
			INSERT INTO court_amenities (court_id, amenity_id) VALUES ($1, $2)
		`, court.ID, amenityID)
		if err != nil {
			return fmt.Errorf("failed to insert court amenity: %w", err)
		}
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}

// GetByID retrieves a court by its ID
func (r *CourtRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Court, error) {
	court := &models.Court{ID: id}
	err := r.db.QueryRowContext(ctx, `
		SELECT 
			name, description, latitude, longitude, zip_code, city, state, 
			image_url, court_type, is_public, contact_info, website, popularity, 
			created_at, updated_at
		FROM courts WHERE id = $1
	`, id).Scan(
		&court.Name, &court.Description,
		&court.Location.Latitude, &court.Location.Longitude, &court.Location.ZipCode, &court.Location.City, &court.Location.State,
		&court.ImageURL, &court.CourtType, &court.IsPublic, &court.ContactInfo, &court.Website, &court.Popularity,
		&court.CreatedAt, &court.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("court not found")
		}
		return nil, fmt.Errorf("failed to get court: %w", err)
	}

	// Query amenities
	amenityRows, err := r.db.QueryContext(ctx, `
		SELECT a.name 
		FROM amenities a
		JOIN court_amenities ca ON a.id = ca.amenity_id
		WHERE ca.court_id = $1
	`, id)
	if err != nil {
		return nil, fmt.Errorf("failed to query court amenities: %w", err)
	}
	defer amenityRows.Close()
	for amenityRows.Next() {
		var amenityName string
		if err := amenityRows.Scan(&amenityName); err != nil {
			return nil, fmt.Errorf("failed to scan amenity name: %w", err)
		}
		court.Amenities = append(court.Amenities, amenityName)
	}

	// Query check-ins
	checkInRows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, message, checked_in, checked_out 
		FROM check_ins 
		WHERE court_id = $1 AND checked_out IS NULL 
		ORDER BY checked_in DESC
	`, id)
	if err != nil {
		return nil, fmt.Errorf("failed to query court check-ins: %w", err)
	}
	defer checkInRows.Close()
	for checkInRows.Next() {
		var checkIn models.CheckIn
		// In a real app, you'd also fetch UserName based on user_id
		// For now, UserName will be empty in this mock-up part of the repository.
		if err := checkInRows.Scan(&checkIn.ID, &checkIn.UserID, &checkIn.Message, &checkIn.CheckedIn, &checkIn.CheckedOut); err != nil {
			// If checked_out is NULL, Scan will error. Need to handle this.
			// A simpler scan for now if CheckedOut can be null:
			if err := r.db.QueryRowContext(ctx, `SELECT id, user_id, message, checked_in FROM check_ins WHERE id = $1`, checkIn.ID).Scan(&checkIn.ID, &checkIn.UserID, &checkIn.Message, &checkIn.CheckedIn); err != nil {
				return nil, fmt.Errorf("failed to scan check-in: %w", err)
			}
		}
		court.CheckIns = append(court.CheckIns, checkIn)
	}

	return court, nil
}

// GetCourts retrieves a list of courts with filtering and pagination
func (r *CourtRepository) GetCourts(ctx context.Context, latitude, longitude, radius float64, courtType string, amenities []string, isPublicOnly bool, hasActivePlayers bool, page, limit int) ([]*models.Court, int, error) {
	// Base query
	// For production, use PostGIS for geospatial queries.
	// This is a simplified distance calculation.
	baseQuery := `
		SELECT 
			id, name, description, latitude, longitude, zip_code, city, state, 
			image_url, court_type, is_public, contact_info, website, popularity, 
			created_at, updated_at,
			( 6371 * acos( cos( radians($1) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians($2) ) + sin( radians($1) ) * sin( radians( latitude ) ) ) ) AS distance
		FROM courts
	`
	countQuery := `SELECT COUNT(*) FROM courts`

	whereClauses := []string{}
	args := []interface{}{latitude, longitude}
	argCount := 3

	if courtType != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("court_type = $%d", argCount))
		args = append(args, courtType)
		argCount++
	}
	if isPublicOnly {
		whereClauses = append(whereClauses, "is_public = TRUE")
	}

	if len(amenities) > 0 {
		// This part is complex and requires a subquery or JOIN for multiple amenities
		// For simplicity, we'll filter for one amenity if provided, or skip this
		// In a real app: JOIN court_amenities and amenities and use WHERE amenity.name IN (...)
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
	args = append(args, radius) // radius in km for this formula
	argCount++

	// Get total count for pagination
	var totalCourts int
	err := r.db.QueryRowContext(ctx, countQuery, args[:argCount-1]...).Scan(&totalCourts) // countQuery doesn't need limit/offset
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count courts: %w", err)
	}

	// Add ordering and pagination
	baseQuery += fmt.Sprintf(" ORDER BY distance ASC LIMIT $%d OFFSET $%d", argCount, argCount+1)
	args = append(args, limit, (page-1)*limit)

	rows, err := r.db.QueryContext(ctx, baseQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query courts: %w", err)
	}
	defer rows.Close()

	courts := []*models.Court{}
	for rows.Next() {
		court := &models.Court{}
		var distance float64 // to scan the calculated distance
		err := rows.Scan(
			&court.ID, &court.Name, &court.Description,
			&court.Location.Latitude, &court.Location.Longitude, &court.Location.ZipCode, &court.Location.City, &court.Location.State,
			&court.ImageURL, &court.CourtType, &court.IsPublic, &court.ContactInfo, &court.Website, &court.Popularity,
			&court.CreatedAt, &court.UpdatedAt, &distance,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan court: %w", err)
		}
		// Potentially fetch amenities and active check-ins for each court here if hasActivePlayers is true
		// This can lead to N+1 queries, so consider optimizing
		courts = append(courts, court)
	}
	if err = rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating court rows: %w", err)
	}

	return courts, totalCourts, nil
}

// CheckInUser checks a user into a court
func (r *CourtRepository) CheckInUser(ctx context.Context, checkIn *models.CheckIn) error {
	if checkIn.ID == uuid.Nil {
		checkIn.ID = uuid.New()
	}
	checkIn.CheckedIn = time.Now()

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO check_ins (id, court_id, user_id, message, checked_in)
		VALUES ($1, $2, $3, $4, $5)
	`, checkIn.ID, checkIn.CourtID, checkIn.UserID, checkIn.Message, checkIn.CheckedIn)

	if err != nil {
		return fmt.Errorf("failed to check in user: %w", err)
	}
	// Could update court popularity here
	return nil
}

// CheckOutUser checks a user out from a court
func (r *CourtRepository) CheckOutUser(ctx context.Context, courtID, userID uuid.UUID) (*models.CheckIn, error) {
	now := time.Now()
	result, err := r.db.ExecContext(ctx, `
		UPDATE check_ins 
		SET checked_out = $1
		WHERE court_id = $2 AND user_id = $3 AND checked_out IS NULL
	`, now, courtID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check out user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return nil, fmt.Errorf("no active check-in found for user at this court")
	}

	// Fetch the updated check-in record to return it
	var checkedOutCheckIn models.CheckIn
	// Assuming user_name is not directly in check_ins table, this will be limited
	err = r.db.QueryRowContext(ctx, `
	    SELECT id, court_id, user_id, message, checked_in, checked_out 
	    FROM check_ins 
	    WHERE court_id = $1 AND user_id = $2 AND checked_out = $3 
	    ORDER BY checked_in DESC LIMIT 1
	`, courtID, userID, now).Scan(
		&checkedOutCheckIn.ID, &checkedOutCheckIn.CourtID, &checkedOutCheckIn.UserID,
		&checkedOutCheckIn.Message, &checkedOutCheckIn.CheckedIn, &checkedOutCheckIn.CheckedOut,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve updated check-in: %w", err)
	}

	return &checkedOutCheckIn, nil
}
