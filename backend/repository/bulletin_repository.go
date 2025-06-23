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

// BulletinRepository handles database operations related to bulletins
type BulletinRepository struct {
	db *database.DB
}

// NewBulletinRepository creates a new BulletinRepository
func NewBulletinRepository(db *database.DB) *BulletinRepository {
	return &BulletinRepository{db: db}
}

// Create inserts a new bulletin into the database
func (r *BulletinRepository) Create(ctx context.Context, bulletin *models.Bulletin) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if bulletin.ID == uuid.Nil {
		bulletin.ID = uuid.New()
	}
	bulletin.CreatedAt = time.Now()
	bulletin.UpdatedAt = time.Now()
	bulletin.IsActive = true

	_, err = tx.ExecContext(ctx, `
		INSERT INTO bulletins (
			id, user_id, title, description, latitude, longitude, zip_code, city, state,
			court_id, start_time, end_time, skill_level, game_type, is_active,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
	`,
		bulletin.ID, bulletin.UserID, bulletin.Title, bulletin.Description,
		bulletin.Location.Latitude, bulletin.Location.Longitude, bulletin.Location.ZipCode, bulletin.Location.City, bulletin.Location.State,
		bulletin.CourtID, bulletin.StartTime, bulletin.EndTime, bulletin.SkillLevel, bulletin.GameType, bulletin.IsActive,
		bulletin.CreatedAt, bulletin.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert bulletin: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}

// GetByID retrieves a bulletin by its ID
func (r *BulletinRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Bulletin, error) {
	bulletin := &models.Bulletin{ID: id}
	err := r.db.QueryRowContext(ctx, `
		SELECT 
			user_id, title, description, latitude, longitude, zip_code, city, state,
			court_id, start_time, end_time, skill_level, game_type, is_active,
			created_at, updated_at
		FROM bulletins WHERE id = $1
	`, id).Scan(
		&bulletin.UserID, &bulletin.Title, &bulletin.Description,
		&bulletin.Location.Latitude, &bulletin.Location.Longitude, &bulletin.Location.ZipCode, &bulletin.Location.City, &bulletin.Location.State,
		&bulletin.CourtID, &bulletin.StartTime, &bulletin.EndTime, &bulletin.SkillLevel, &bulletin.GameType, &bulletin.IsActive,
		&bulletin.CreatedAt, &bulletin.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("bulletin not found")
		}
		return nil, fmt.Errorf("failed to get bulletin: %w", err)
	}

	// Get user name from users table
	var userName string
	err = r.db.QueryRowContext(ctx, "SELECT name FROM users WHERE id = $1", bulletin.UserID).Scan(&userName)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to get user name: %w", err)
	}
	bulletin.UserName = userName

	// Get court name from courts table if court_id is provided
	if bulletin.CourtID != nil {
		var courtName string
		err = r.db.QueryRowContext(ctx, "SELECT name FROM courts WHERE id = $1", *bulletin.CourtID).Scan(&courtName)
		if err != nil && err != sql.ErrNoRows {
			return nil, fmt.Errorf("failed to get court name: %w", err)
		}
		bulletin.CourtName = courtName
	}

	// Query bulletin responses
	responseRows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, message, status, created_at, updated_at
		FROM bulletin_responses 
		WHERE bulletin_id = $1
		ORDER BY created_at DESC
	`, id)
	if err != nil {
		return nil, fmt.Errorf("failed to query bulletin responses: %w", err)
	}
	defer responseRows.Close()

	bulletin.Responses = []models.BulletinResponse{}
	for responseRows.Next() {
		var response models.BulletinResponse
		var userID uuid.UUID
		if err := responseRows.Scan(&response.ID, &userID, &response.Message, &response.Status, &response.CreatedAt, &response.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan bulletin response: %w", err)
		}
		response.BulletinID = id
		response.UserID = userID

		// Get user name from users table
		var responderName string
		err = r.db.QueryRowContext(ctx, "SELECT name FROM users WHERE id = $1", userID).Scan(&responderName)
		if err != nil && err != sql.ErrNoRows {
			return nil, fmt.Errorf("failed to get responder name: %w", err)
		}
		response.UserName = responderName

		bulletin.Responses = append(bulletin.Responses, response)
	}

	return bulletin, nil
}

// GetBulletins retrieves bulletins with filtering and pagination
func (r *BulletinRepository) GetBulletins(ctx context.Context, latitude, longitude float64, radius float64, filters map[string]interface{}, page, limit int) ([]*models.Bulletin, int, error) {
	// Base query - include distance calculation only if radius is specified
	var baseQuery string
	if radius >= 0 {
		baseQuery = `
			SELECT 
				id, user_id, title, description, latitude, longitude, zip_code, city, state,
				court_id, start_time, end_time, skill_level, game_type, is_active,
				created_at, updated_at,
				( 6371 * acos( cos( radians($1) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians($2) ) + sin( radians($1) ) * sin( radians( latitude ) ) ) ) AS distance
			FROM bulletins
		`
	} else {
		baseQuery = `
			SELECT 
				id, user_id, title, description, latitude, longitude, zip_code, city, state,
				court_id, start_time, end_time, skill_level, game_type, is_active,
				created_at, updated_at,
				0 AS distance
			FROM bulletins
		`
	}
	countQuery := `SELECT COUNT(*) FROM bulletins`

	whereClauses := []string{}
	var args []interface{}
	var argCount int
	
	if radius >= 0 {
		args = []interface{}{latitude, longitude}
		argCount = 3
	} else {
		args = []interface{}{}
		argCount = 1
	}

	// Add filters
	if skillLevel, ok := filters["skillLevel"].(string); ok && skillLevel != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("skill_level = $%d", argCount))
		args = append(args, skillLevel)
		argCount++
	}

	if gameType, ok := filters["gameType"].(string); ok && gameType != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("game_type = $%d", argCount))
		args = append(args, gameType)
		argCount++
	}

	if startAfter, ok := filters["startAfter"].(time.Time); ok {
		whereClauses = append(whereClauses, fmt.Sprintf("start_time > $%d", argCount))
		args = append(args, startAfter)
		argCount++
	}

	// By default, only show active bulletins
	if showExpired, ok := filters["showExpired"].(bool); !ok || !showExpired {
		whereClauses = append(whereClauses, "is_active = TRUE")
	}

	// Combine WHERE clauses
	if len(whereClauses) > 0 {
		baseQuery += " WHERE " + utils.JoinStrings(whereClauses, " AND ")
		countQuery += " WHERE " + utils.JoinStrings(whereClauses, " AND ")
	}

	// Add distance filter only if radius is specified (radius >= 0)
	if radius >= 0 {
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
	}

	// Get total count for pagination
	var totalBulletins int
	// Use all current args for count (pagination args haven't been added yet)
	countArgs := args
	err := r.db.QueryRowContext(ctx, countQuery, countArgs...).Scan(&totalBulletins)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count bulletins: %w", err)
	}

	// Add ordering and pagination
	baseQuery += " ORDER BY start_time ASC LIMIT $" + fmt.Sprintf("%d", argCount) + " OFFSET $" + fmt.Sprintf("%d", argCount+1)
	args = append(args, limit, (page-1)*limit)

	rows, err := r.db.QueryContext(ctx, baseQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query bulletins: %w", err)
	}
	defer rows.Close()

	bulletins := []*models.Bulletin{}
	userIDs := []uuid.UUID{} // To fetch usernames later

	for rows.Next() {
		bulletin := &models.Bulletin{}
		var distance float64 // to scan the calculated distance
		err := rows.Scan(
			&bulletin.ID, &bulletin.UserID, &bulletin.Title, &bulletin.Description,
			&bulletin.Location.Latitude, &bulletin.Location.Longitude, &bulletin.Location.ZipCode, &bulletin.Location.City, &bulletin.Location.State,
			&bulletin.CourtID, &bulletin.StartTime, &bulletin.EndTime, &bulletin.SkillLevel, &bulletin.GameType, &bulletin.IsActive,
			&bulletin.CreatedAt, &bulletin.UpdatedAt, &distance,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan bulletin: %w", err)
		}

		bulletins = append(bulletins, bulletin)
		userIDs = append(userIDs, bulletin.UserID)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating bulletin rows: %w", err)
	}

	// Fetch usernames and court names for bulletins
	for i, bulletin := range bulletins {
		var userName string
		err = r.db.QueryRowContext(ctx, "SELECT name FROM users WHERE id = $1", bulletin.UserID).Scan(&userName)
		if err != nil && err != sql.ErrNoRows {
			return nil, 0, fmt.Errorf("failed to get user name: %w", err)
		}
		bulletins[i].UserName = userName

		// Get court name from courts table if court_id is provided
		if bulletin.CourtID != nil {
			var courtName string
			err = r.db.QueryRowContext(ctx, "SELECT name FROM courts WHERE id = $1", *bulletin.CourtID).Scan(&courtName)
			if err != nil && err != sql.ErrNoRows {
				return nil, 0, fmt.Errorf("failed to get court name: %w", err)
			}
			bulletins[i].CourtName = courtName
		}

		// Fetch bulletin responses
		responseRows, err := r.db.QueryContext(ctx, `
			SELECT id, user_id, message, status, created_at, updated_at
			FROM bulletin_responses 
			WHERE bulletin_id = $1
			ORDER BY created_at DESC
		`, bulletin.ID)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to query bulletin responses: %w", err)
		}

		bulletins[i].Responses = []models.BulletinResponse{}
		for responseRows.Next() {
			var response models.BulletinResponse
			var userID uuid.UUID
			if err := responseRows.Scan(&response.ID, &userID, &response.Message, &response.Status, &response.CreatedAt, &response.UpdatedAt); err != nil {
				responseRows.Close()
				return nil, 0, fmt.Errorf("failed to scan bulletin response: %w", err)
			}
			response.BulletinID = bulletin.ID
			response.UserID = userID

			// Get user name for response
			var responderName string
			err = r.db.QueryRowContext(ctx, "SELECT name FROM users WHERE id = $1", userID).Scan(&responderName)
			if err != nil && err != sql.ErrNoRows {
				responseRows.Close()
				return nil, 0, fmt.Errorf("failed to get responder name: %w", err)
			}
			response.UserName = responderName

			bulletins[i].Responses = append(bulletins[i].Responses, response)
		}
		responseRows.Close()
	}

	return bulletins, totalBulletins, nil
}

// CreateResponse adds a response to a bulletin
func (r *BulletinRepository) CreateResponse(ctx context.Context, response *models.BulletinResponse) error {
	if response.ID == uuid.Nil {
		response.ID = uuid.New()
	}
	response.CreatedAt = time.Now()
	response.UpdatedAt = time.Now()
	response.Status = "Pending" // Default status

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO bulletin_responses (
			id, bulletin_id, user_id, message, status, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
	`,
		response.ID, response.BulletinID, response.UserID, response.Message, response.Status, response.CreatedAt, response.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create bulletin response: %w", err)
	}
	return nil
}

// UpdateResponseStatus updates the status of a bulletin response
func (r *BulletinRepository) UpdateResponseStatus(ctx context.Context, bulletinID, responseID uuid.UUID, status string) (*models.BulletinResponse, error) {
	now := time.Now()

	// Verify the bulletin exists and belongs to the user (should be done at handler level)
	result, err := r.db.ExecContext(ctx, `
		UPDATE bulletin_responses 
		SET status = $1, updated_at = $2
		WHERE id = $3 AND bulletin_id = $4
	`, status, now, responseID, bulletinID)
	if err != nil {
		return nil, fmt.Errorf("failed to update response status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return nil, fmt.Errorf("response not found or not associated with this bulletin")
	}

	// Fetch the updated response
	var response models.BulletinResponse
	err = r.db.QueryRowContext(ctx, `
		SELECT id, bulletin_id, user_id, message, status, created_at, updated_at
		FROM bulletin_responses
		WHERE id = $1
	`, responseID).Scan(
		&response.ID, &response.BulletinID, &response.UserID, &response.Message, &response.Status, &response.CreatedAt, &response.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch updated response: %w", err)
	}

	// Get user name from users table
	var userName string
	err = r.db.QueryRowContext(ctx, "SELECT name FROM users WHERE id = $1", response.UserID).Scan(&userName)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to get user name: %w", err)
	}
	response.UserName = userName

	return &response, nil
}

// DeleteBulletin deletes a bulletin
func (r *BulletinRepository) DeleteBulletin(ctx context.Context, bulletinID, userID uuid.UUID) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// First verify the bulletin exists and belongs to the user
	var count int
	err = tx.QueryRowContext(ctx, "SELECT COUNT(*) FROM bulletins WHERE id = $1 AND user_id = $2", bulletinID, userID).Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to verify bulletin ownership: %w", err)
	}
	if count == 0 {
		return fmt.Errorf("bulletin not found or you don't have permission to delete it")
	}

	// Delete all associated responses first
	_, err = tx.ExecContext(ctx, "DELETE FROM bulletin_responses WHERE bulletin_id = $1", bulletinID)
	if err != nil {
		return fmt.Errorf("failed to delete bulletin responses: %w", err)
	}

	// Then delete the bulletin
	result, err := tx.ExecContext(ctx, "DELETE FROM bulletins WHERE id = $1 AND user_id = $2", bulletinID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete bulletin: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("bulletin not found or you don't have permission to delete it")
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}
