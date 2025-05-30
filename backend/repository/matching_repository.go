package repository

import (
	"context"
	"database/sql"
	"fmt"
	"sort"
	"time"

	"github.com/google/uuid"
	"github.com/user/tennis-connect/database"
	"github.com/user/tennis-connect/models"
)

// MatchingRepository handles database operations related to player matching
type MatchingRepository struct {
	db *database.DB
}

// NewMatchingRepository creates a new MatchingRepository
func NewMatchingRepository(db *database.DB) *MatchingRepository {
	return &MatchingRepository{db: db}
}

// CreateMatchSession creates a new match session
func (r *MatchingRepository) CreateMatchSession(ctx context.Context, session *models.MatchSession) error {
	if session.ID == uuid.Nil {
		session.ID = uuid.New()
	}
	session.CreatedAt = time.Now()
	session.UpdatedAt = time.Now()

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO match_sessions (
			id, court_id, start_time, end_time, game_type, skill_level,
			status, max_players, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`,
		session.ID, session.CourtID, session.StartTime, session.EndTime,
		session.GameType, session.SkillLevel, session.Status, session.MaxPlayers,
		session.CreatedAt, session.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create match session: %w", err)
	}

	return nil
}

// GetMatchSession retrieves a match session by ID
func (r *MatchingRepository) GetMatchSession(ctx context.Context, sessionID uuid.UUID) (*models.MatchSession, error) {
	session := &models.MatchSession{}
	err := r.db.QueryRowContext(ctx, `
		SELECT 
			id, court_id, start_time, end_time, game_type, skill_level,
			status, max_players, created_at, updated_at
		FROM match_sessions WHERE id = $1
	`, sessionID).Scan(
		&session.ID, &session.CourtID, &session.StartTime, &session.EndTime,
		&session.GameType, &session.SkillLevel, &session.Status, &session.MaxPlayers,
		&session.CreatedAt, &session.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("match session not found")
		}
		return nil, fmt.Errorf("failed to get match session: %w", err)
	}

	// Load players
	players, err := r.GetMatchPlayers(ctx, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to load players: %w", err)
	}
	session.Players = players

	// Load pairings
	pairings, err := r.GetPlayerPairings(ctx, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to load pairings: %w", err)
	}
	session.Matches = pairings

	return session, nil
}

// JoinMatchSession adds a player to a match session
func (r *MatchingRepository) JoinMatchSession(ctx context.Context, sessionID, userID uuid.UUID) error {
	// Check if session exists and has space
	session, err := r.GetMatchSession(ctx, sessionID)
	if err != nil {
		return err
	}

	if len(session.Players) >= session.MaxPlayers {
		return fmt.Errorf("match session is full")
	}

	// Check if user is already in the session
	for _, player := range session.Players {
		if player.UserID == userID {
			return fmt.Errorf("user already in match session")
		}
	}

	// Calculate priority based on user's availability
	priority := r.calculatePlayerPriority(ctx, userID, session.StartTime)

	matchPlayer := &models.MatchPlayer{
		ID:             uuid.New(),
		MatchSessionID: sessionID,
		UserID:         userID,
		JoinedAt:       time.Now(),
		Priority:       priority,
	}

	_, err = r.db.ExecContext(ctx, `
		INSERT INTO match_players (
			id, match_session_id, user_id, joined_at, preference_score, priority
		) VALUES ($1, $2, $3, $4, $5, $6)
	`,
		matchPlayer.ID, matchPlayer.MatchSessionID, matchPlayer.UserID,
		matchPlayer.JoinedAt, matchPlayer.PreferenceScore, matchPlayer.Priority,
	)
	if err != nil {
		return fmt.Errorf("failed to join match session: %w", err)
	}

	// If we have enough players, trigger matching
	if len(session.Players)+1 >= 2 {
		go r.TriggerMatching(context.Background(), sessionID)
	}

	return nil
}

// GetMatchPlayers retrieves players in a match session
func (r *MatchingRepository) GetMatchPlayers(ctx context.Context, sessionID uuid.UUID) ([]models.MatchPlayer, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT 
			id, match_session_id, user_id, joined_at, preference_score, priority
		FROM match_players 
		WHERE match_session_id = $1
		ORDER BY priority DESC, joined_at ASC
	`, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to query match players: %w", err)
	}
	defer rows.Close()

	var players []models.MatchPlayer
	for rows.Next() {
		player := models.MatchPlayer{}
		err := rows.Scan(
			&player.ID, &player.MatchSessionID, &player.UserID,
			&player.JoinedAt, &player.PreferenceScore, &player.Priority,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan match player: %w", err)
		}
		players = append(players, player)
	}

	return players, nil
}

// GetPlayerPairings retrieves pairings for a match session
func (r *MatchingRepository) GetPlayerPairings(ctx context.Context, sessionID uuid.UUID) ([]models.PlayerPairing, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT 
			id, match_session_id, player1_id, player2_id, player3_id, player4_id,
			compatibility_score, status, created_at, updated_at
		FROM player_pairings 
		WHERE match_session_id = $1
		ORDER BY compatibility_score DESC
	`, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to query player pairings: %w", err)
	}
	defer rows.Close()

	var pairings []models.PlayerPairing
	for rows.Next() {
		pairing := models.PlayerPairing{}
		err := rows.Scan(
			&pairing.ID, &pairing.MatchSessionID, &pairing.Player1ID, &pairing.Player2ID,
			&pairing.Player3ID, &pairing.Player4ID, &pairing.CompatibilityScore,
			&pairing.Status, &pairing.CreatedAt, &pairing.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan player pairing: %w", err)
		}
		pairings = append(pairings, pairing)
	}

	return pairings, nil
}

// TriggerMatching performs intelligent matching for a session
func (r *MatchingRepository) TriggerMatching(ctx context.Context, sessionID uuid.UUID) error {
	session, err := r.GetMatchSession(ctx, sessionID)
	if err != nil {
		return err
	}

	if len(session.Players) < 2 {
		return fmt.Errorf("not enough players for matching")
	}

	// Get user details for all players
	userRepo := NewUserRepository(r.db)
	var users []*models.User
	for _, player := range session.Players {
		user, err := userRepo.GetByID(ctx, player.UserID)
		if err != nil {
			continue // Skip if user not found
		}
		users = append(users, user)
	}

	// Generate pairings based on game type
	var pairings []models.PlayerPairing
	criteria := models.DefaultMatchingCriteria()

	if session.GameType == "Singles" {
		pairings = r.generateSinglesPairings(users, session, criteria)
	} else {
		pairings = r.generateDoublesPairings(users, session, criteria)
	}

	// Save pairings to database
	for _, pairing := range pairings {
		err := r.CreatePlayerPairing(ctx, &pairing)
		if err != nil {
			return fmt.Errorf("failed to create pairing: %w", err)
		}
	}

	// Update session status
	_, err = r.db.ExecContext(ctx, `
		UPDATE match_sessions 
		SET status = 'matched', updated_at = $1
		WHERE id = $2
	`, time.Now(), sessionID)
	if err != nil {
		return fmt.Errorf("failed to update session status: %w", err)
	}

	return nil
}

// generateSinglesPairings creates optimal singles pairings
func (r *MatchingRepository) generateSinglesPairings(users []*models.User, session *models.MatchSession, criteria models.MatchingCriteria) []models.PlayerPairing {
	var pairings []models.PlayerPairing

	// Sort users by skill level for better matching
	sort.Slice(users, func(i, j int) bool {
		return users[i].SkillLevel < users[j].SkillLevel
	})

	// Create pairings with adjacent skill levels
	for i := 0; i < len(users)-1; i += 2 {
		if i+1 < len(users) {
			pairing := models.PlayerPairing{
				ID:             uuid.New(),
				MatchSessionID: session.ID,
				Player1ID:      users[i].ID,
				Player2ID:      users[i+1].ID,
				Status:         models.MatchingStatusMatched,
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}
			pairing.CompatibilityScore = pairing.CalculateCompatibilityScore(users[i], users[i+1], criteria)
			pairings = append(pairings, pairing)
		}
	}

	return pairings
}

// generateDoublesPairings creates optimal doubles pairings
func (r *MatchingRepository) generateDoublesPairings(users []*models.User, session *models.MatchSession, criteria models.MatchingCriteria) []models.PlayerPairing {
	var pairings []models.PlayerPairing

	if len(users) < 4 {
		return pairings // Need at least 4 players for doubles
	}

	// Sort by skill level
	sort.Slice(users, func(i, j int) bool {
		return users[i].SkillLevel < users[j].SkillLevel
	})

	// Create balanced teams (mix skill levels)
	if len(users) >= 4 {
		pairing := models.PlayerPairing{
			ID:             uuid.New(),
			MatchSessionID: session.ID,
			Player1ID:      users[0].ID,             // Lowest skill
			Player2ID:      users[len(users)-1].ID,  // Highest skill
			Player3ID:      &users[1].ID,            // Second lowest
			Player4ID:      &users[len(users)-2].ID, // Second highest
			Status:         models.MatchingStatusMatched,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		// Calculate compatibility for the team
		avgScore := (pairing.CalculateCompatibilityScore(users[0], users[len(users)-1], criteria) +
			pairing.CalculateCompatibilityScore(users[1], users[len(users)-2], criteria)) / 2
		pairing.CompatibilityScore = avgScore

		pairings = append(pairings, pairing)
	}

	return pairings
}

// CreatePlayerPairing creates a new player pairing
func (r *MatchingRepository) CreatePlayerPairing(ctx context.Context, pairing *models.PlayerPairing) error {
	if pairing.ID == uuid.Nil {
		pairing.ID = uuid.New()
	}
	pairing.CreatedAt = time.Now()
	pairing.UpdatedAt = time.Now()

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO player_pairings (
			id, match_session_id, player1_id, player2_id, player3_id, player4_id,
			compatibility_score, status, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`,
		pairing.ID, pairing.MatchSessionID, pairing.Player1ID, pairing.Player2ID,
		pairing.Player3ID, pairing.Player4ID, pairing.CompatibilityScore,
		pairing.Status, pairing.CreatedAt, pairing.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create player pairing: %w", err)
	}

	return nil
}

// SubmitFeedback submits feedback for a completed match
func (r *MatchingRepository) SubmitFeedback(ctx context.Context, feedback *models.PlayerFeedback) error {
	if feedback.ID == uuid.Nil {
		feedback.ID = uuid.New()
	}
	feedback.CreatedAt = time.Now()

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO player_feedback (
			id, pairing_id, from_user_id, to_user_id, rating, comments,
			court_rating, court_comments, match_quality, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (pairing_id, from_user_id, to_user_id) 
		DO UPDATE SET 
			rating = EXCLUDED.rating,
			comments = EXCLUDED.comments,
			court_rating = EXCLUDED.court_rating,
			court_comments = EXCLUDED.court_comments,
			match_quality = EXCLUDED.match_quality
	`,
		feedback.ID, feedback.PairingID, feedback.FromUserID, feedback.ToUserID,
		feedback.Rating, feedback.Comments, feedback.CourtRating,
		feedback.CourtComments, feedback.MatchQuality, feedback.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to submit feedback: %w", err)
	}

	return nil
}

// GetAvailableMatchSessions gets available match sessions for a user
func (r *MatchingRepository) GetAvailableMatchSessions(ctx context.Context, userID uuid.UUID, courtID *uuid.UUID, gameType string) ([]*models.MatchSession, error) {
	query := `
		SELECT 
			ms.id, ms.court_id, ms.start_time, ms.end_time, ms.game_type, 
			ms.skill_level, ms.status, ms.max_players, ms.created_at, ms.updated_at,
			COUNT(mp.id) as current_players
		FROM match_sessions ms
		LEFT JOIN match_players mp ON ms.id = mp.match_session_id
		WHERE ms.status = 'pending'
		AND ms.start_time > $1
		AND ms.id NOT IN (
			SELECT match_session_id FROM match_players WHERE user_id = $2
		)
	`
	args := []interface{}{time.Now(), userID}
	argCount := 3

	if courtID != nil {
		query += fmt.Sprintf(" AND ms.court_id = $%d", argCount)
		args = append(args, *courtID)
		argCount++
	}

	if gameType != "" {
		query += fmt.Sprintf(" AND ms.game_type = $%d", argCount)
		args = append(args, gameType)
		argCount++
	}

	query += `
		GROUP BY ms.id, ms.court_id, ms.start_time, ms.end_time, ms.game_type, 
				 ms.skill_level, ms.status, ms.max_players, ms.created_at, ms.updated_at
		HAVING COUNT(mp.id) < ms.max_players
		ORDER BY ms.start_time ASC
	`

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query available match sessions: %w", err)
	}
	defer rows.Close()

	var sessions []*models.MatchSession
	for rows.Next() {
		session := &models.MatchSession{}
		var currentPlayers int
		err := rows.Scan(
			&session.ID, &session.CourtID, &session.StartTime, &session.EndTime,
			&session.GameType, &session.SkillLevel, &session.Status, &session.MaxPlayers,
			&session.CreatedAt, &session.UpdatedAt, &currentPlayers,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan match session: %w", err)
		}
		sessions = append(sessions, session)
	}

	return sessions, nil
}

// calculatePlayerPriority calculates priority based on player's availability
func (r *MatchingRepository) calculatePlayerPriority(ctx context.Context, userID uuid.UUID, sessionTime time.Time) int {
	// Count how many other available sessions the user could join
	sessions, err := r.GetAvailableMatchSessions(ctx, userID, nil, "")
	if err != nil {
		return 0
	}

	// Higher priority for users with fewer options
	return max(0, 10-len(sessions))
}

// Helper function
func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
