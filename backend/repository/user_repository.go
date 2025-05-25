package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/user/tennis-connect/database"
	"github.com/user/tennis-connect/models"
	"golang.org/x/crypto/bcrypt"
)

// UserRepository handles database operations related to users
type UserRepository struct {
	db *database.DB
}

// NewUserRepository creates a new UserRepository
func NewUserRepository(db *database.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create inserts a new user into the database
func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	// Hash the password before storing
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.PasswordHash), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Begin transaction
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Generate a new UUID if not provided
	if user.ID == uuid.Nil {
		user.ID = uuid.New()
	}

	// Insert user
	_, err = tx.ExecContext(ctx, `
		INSERT INTO users (
			id, email, password_hash, name, profile_picture, 
			latitude, longitude, zip_code, city, state,
			skill_level, bio, is_verified, is_new_to_area, gender,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, 
			$6, $7, $8, $9, $10,
			$11, $12, $13, $14, $15,
			$16, $17
		)
	`,
		user.ID, user.Email, string(hashedPassword), user.Name, user.ProfilePicture,
		user.Location.Latitude, user.Location.Longitude, user.Location.ZipCode, user.Location.City, user.Location.State,
		user.SkillLevel, user.Bio, user.IsVerified, user.IsNewToArea, user.Gender,
		time.Now(), time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to insert user: %w", err)
	}

	// Insert game styles
	for _, style := range user.GameStyles {
		var styleID uuid.UUID
		err = tx.QueryRowContext(ctx, "SELECT id FROM game_styles WHERE name = $1", style).Scan(&styleID)
		if err != nil {
			return fmt.Errorf("failed to find game style '%s': %w", style, err)
		}

		_, err = tx.ExecContext(ctx, `
			INSERT INTO user_game_styles (user_id, game_style_id)
			VALUES ($1, $2)
		`, user.ID, styleID)
		if err != nil {
			return fmt.Errorf("failed to insert user game style: %w", err)
		}
	}

	// Insert preferred times
	for _, timeSlot := range user.PreferredTimes {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO preferred_times (id, user_id, day_of_week, start_time, end_time)
			VALUES ($1, $2, $3, $4, $5)
		`, uuid.New(), user.ID, timeSlot.DayOfWeek, timeSlot.StartTime, timeSlot.EndTime)
		if err != nil {
			return fmt.Errorf("failed to insert preferred time: %w", err)
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user := &models.User{ID: id}

	// Query user's basic information
	err := r.db.QueryRowContext(ctx, `
		SELECT email, name, profile_picture, 
			   latitude, longitude, zip_code, city, state,
			   skill_level, bio, is_verified, is_new_to_area, gender,
			   created_at, updated_at
		FROM users
		WHERE id = $1
	`, id).Scan(
		&user.Email, &user.Name, &user.ProfilePicture,
		&user.Location.Latitude, &user.Location.Longitude, &user.Location.ZipCode, &user.Location.City, &user.Location.State,
		&user.SkillLevel, &user.Bio, &user.IsVerified, &user.IsNewToArea, &user.Gender,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Query game styles
	rows, err := r.db.QueryContext(ctx, `
		SELECT gs.name
		FROM user_game_styles ugs
		JOIN game_styles gs ON ugs.game_style_id = gs.id
		WHERE ugs.user_id = $1
	`, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get user game styles: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var style string
		if err := rows.Scan(&style); err != nil {
			return nil, fmt.Errorf("failed to scan game style: %w", err)
		}
		user.GameStyles = append(user.GameStyles, style)
	}

	// Query preferred times
	timeRows, err := r.db.QueryContext(ctx, `
		SELECT day_of_week, start_time, end_time
		FROM preferred_times
		WHERE user_id = $1
	`, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get preferred times: %w", err)
	}
	defer timeRows.Close()

	for timeRows.Next() {
		var timeSlot models.TimeSlot
		if err := timeRows.Scan(&timeSlot.DayOfWeek, &timeSlot.StartTime, &timeSlot.EndTime); err != nil {
			return nil, fmt.Errorf("failed to scan time slot: %w", err)
		}
		user.PreferredTimes = append(user.PreferredTimes, timeSlot)
	}

	return user, nil
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	var id uuid.UUID
	err := r.db.QueryRowContext(ctx, "SELECT id FROM users WHERE email = $1", email).Scan(&id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user ID: %w", err)
	}

	return r.GetByID(ctx, id)
}

// Update updates a user's information
func (r *UserRepository) Update(ctx context.Context, user *models.User) error {
	// Begin transaction
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Update user
	_, err = tx.ExecContext(ctx, `
		UPDATE users SET
			name = $1,
			profile_picture = $2,
			latitude = $3,
			longitude = $4,
			zip_code = $5,
			city = $6,
			state = $7,
			skill_level = $8,
			bio = $9,
			is_verified = $10,
			is_new_to_area = $11,
			gender = $12,
			updated_at = $13
		WHERE id = $14
	`,
		user.Name, user.ProfilePicture,
		user.Location.Latitude, user.Location.Longitude, user.Location.ZipCode, user.Location.City, user.Location.State,
		user.SkillLevel, user.Bio, user.IsVerified, user.IsNewToArea, user.Gender,
		time.Now(), user.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	// Delete existing game styles
	_, err = tx.ExecContext(ctx, "DELETE FROM user_game_styles WHERE user_id = $1", user.ID)
	if err != nil {
		return fmt.Errorf("failed to delete game styles: %w", err)
	}

	// Insert updated game styles
	for _, style := range user.GameStyles {
		var styleID uuid.UUID
		err = tx.QueryRowContext(ctx, "SELECT id FROM game_styles WHERE name = $1", style).Scan(&styleID)
		if err != nil {
			return fmt.Errorf("failed to find game style '%s': %w", style, err)
		}

		_, err = tx.ExecContext(ctx, `
			INSERT INTO user_game_styles (user_id, game_style_id)
			VALUES ($1, $2)
		`, user.ID, styleID)
		if err != nil {
			return fmt.Errorf("failed to insert user game style: %w", err)
		}
	}

	// Delete existing preferred times
	_, err = tx.ExecContext(ctx, "DELETE FROM preferred_times WHERE user_id = $1", user.ID)
	if err != nil {
		return fmt.Errorf("failed to delete preferred times: %w", err)
	}

	// Insert updated preferred times
	for _, timeSlot := range user.PreferredTimes {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO preferred_times (id, user_id, day_of_week, start_time, end_time)
			VALUES ($1, $2, $3, $4, $5)
		`, uuid.New(), user.ID, timeSlot.DayOfWeek, timeSlot.StartTime, timeSlot.EndTime)
		if err != nil {
			return fmt.Errorf("failed to insert preferred time: %w", err)
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetNearbyUsers finds users near the given location
func (r *UserRepository) GetNearbyUsers(ctx context.Context, latitude, longitude float64, radius float64, filters map[string]interface{}) ([]*models.User, error) {
	// Base query with spatial proximity calculation
	// This uses a basic Euclidean distance calculation
	// For production systems, consider using PostGIS for more accurate distance calculations
	query := `
		SELECT id, 
			   SQRT(POWER(latitude - $1, 2) + POWER(longitude - $2, 2)) AS distance
		FROM users
		WHERE id != $3 -- Exclude the requesting user
	`

	args := []interface{}{latitude, longitude, filters["userID"]}
	argCount := 4 // Start counting from 4 (we've used 3 args already)

	// Apply filters
	if skillLevel, ok := filters["skillLevel"].(float32); ok {
		query += fmt.Sprintf(" AND ABS(skill_level - $%d) <= 0.5", argCount)
		args = append(args, skillLevel)
		argCount++
	}

	if gender, ok := filters["gender"].(string); ok && gender != "" {
		query += fmt.Sprintf(" AND gender = $%d", argCount)
		args = append(args, gender)
		argCount++
	}

	if isNewcomer, ok := filters["isNewcomer"].(bool); ok && isNewcomer {
		query += " AND is_new_to_area = TRUE"
	}

	// Order by distance and apply limit
	query += " ORDER BY distance ASC LIMIT 50"

	// Execute query
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query nearby users: %w", err)
	}
	defer rows.Close()

	// Process results
	var userIDs []uuid.UUID
	for rows.Next() {
		var userID uuid.UUID
		var distance float64
		if err := rows.Scan(&userID, &distance); err != nil {
			return nil, fmt.Errorf("failed to scan user row: %w", err)
		}

		// Convert distance to miles if needed (this is a simplified calculation)
		// In production, use proper geospatial calculations
		distanceMiles := distance * 69.0 // Rough conversion from degrees to miles

		// Check if within radius
		if distanceMiles <= radius {
			userIDs = append(userIDs, userID)
		}
	}

	// Fetch full user details for filtered users
	users := make([]*models.User, 0, len(userIDs))
	for _, id := range userIDs {
		user, err := r.GetByID(ctx, id)
		if err != nil {
			continue // Skip failed fetches
		}

		// Additional filtering for game styles if needed
		if gameStyles, ok := filters["gameStyles"].([]string); ok && len(gameStyles) > 0 {
			matches := false
			for _, filterStyle := range gameStyles {
				for _, userStyle := range user.GameStyles {
					if filterStyle == userStyle {
						matches = true
						break
					}
				}
				if matches {
					break
				}
			}
			if !matches {
				continue // Skip if no game style matches
			}
		}

		// Additional filtering for preferred days if needed
		if preferredDays, ok := filters["preferredDays"].([]string); ok && len(preferredDays) > 0 {
			matches := false
			for _, filterDay := range preferredDays {
				for _, timeSlot := range user.PreferredTimes {
					if filterDay == timeSlot.DayOfWeek {
						matches = true
						break
					}
				}
				if matches {
					break
				}
			}
			if !matches {
				continue // Skip if no preferred day matches
			}
		}

		users = append(users, user)
	}

	return users, nil
}

// VerifyPassword checks if the provided password matches the stored hash
func (r *UserRepository) VerifyPassword(ctx context.Context, email, password string) (bool, *models.User, error) {
	var (
		id           uuid.UUID
		passwordHash string
	)

	err := r.db.QueryRowContext(ctx, "SELECT id, password_hash FROM users WHERE email = $1", email).Scan(&id, &passwordHash)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil, nil
		}
		return false, nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Compare password with hash
	err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password))
	if err != nil {
		return false, nil, nil
	}

	// Get full user details if password matches
	user, err := r.GetByID(ctx, id)
	if err != nil {
		return true, nil, fmt.Errorf("failed to get user details: %w", err)
	}

	return true, user, nil
}
