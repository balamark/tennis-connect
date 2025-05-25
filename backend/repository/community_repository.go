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

// CommunityRepository handles database operations related to communities
type CommunityRepository struct {
	db *database.DB
}

// NewCommunityRepository creates a new CommunityRepository
func NewCommunityRepository(db *database.DB) *CommunityRepository {
	return &CommunityRepository{db: db}
}

// Create inserts a new community into the database
func (r *CommunityRepository) Create(ctx context.Context, community *models.Community) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if community.ID == uuid.Nil {
		community.ID = uuid.New()
	}
	community.CreatedAt = time.Now()
	community.UpdatedAt = time.Now()

	_, err = tx.ExecContext(ctx, `
		INSERT INTO communities (
			id, name, description, latitude, longitude, zip_code, city, state,
			image_url, type, created_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`,
		community.ID, community.Name, community.Description,
		community.Location.Latitude, community.Location.Longitude, community.Location.ZipCode, community.Location.City, community.Location.State,
		community.ImageURL, community.Type, community.CreatedBy, community.CreatedAt, community.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert community: %w", err)
	}

	// Add creator as admin member
	memberID := uuid.New()
	_, err = tx.ExecContext(ctx, `
		INSERT INTO community_members (
			id, community_id, user_id, role, joined_at
		) VALUES ($1, $2, $3, $4, $5)
	`,
		memberID, community.ID, community.CreatedBy, "Admin", time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to add creator as member: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}

// GetByID retrieves a community by its ID
func (r *CommunityRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Community, error) {
	community := &models.Community{ID: id}
	err := r.db.QueryRowContext(ctx, `
		SELECT 
			name, description, latitude, longitude, zip_code, city, state,
			image_url, type, created_by, created_at, updated_at
		FROM communities WHERE id = $1
	`, id).Scan(
		&community.Name, &community.Description,
		&community.Location.Latitude, &community.Location.Longitude, &community.Location.ZipCode, &community.Location.City, &community.Location.State,
		&community.ImageURL, &community.Type, &community.CreatedBy, &community.CreatedAt, &community.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("community not found")
		}
		return nil, fmt.Errorf("failed to get community: %w", err)
	}

	// Query members
	memberRows, err := r.db.QueryContext(ctx, `
		SELECT m.id, m.user_id, u.name, m.role, m.joined_at
		FROM community_members m
		JOIN users u ON m.user_id = u.id
		WHERE m.community_id = $1
		ORDER BY m.joined_at
	`, id)
	if err != nil {
		return nil, fmt.Errorf("failed to query community members: %w", err)
	}
	defer memberRows.Close()

	community.Members = []models.Member{}
	for memberRows.Next() {
		var member models.Member
		if err := memberRows.Scan(&member.ID, &member.UserID, &member.UserName, &member.Role, &member.JoinedAt); err != nil {
			return nil, fmt.Errorf("failed to scan community member: %w", err)
		}
		member.CommunityID = id
		community.Members = append(community.Members, member)
	}

	// Query messages
	messageRows, err := r.db.QueryContext(ctx, `
		SELECT m.id, m.user_id, u.name, m.content, m.reply_to, m.created_at, m.updated_at
		FROM community_messages m
		JOIN users u ON m.user_id = u.id
		WHERE m.community_id = $1
		ORDER BY m.created_at DESC
		LIMIT 50
	`, id)
	if err != nil {
		return nil, fmt.Errorf("failed to query community messages: %w", err)
	}
	defer messageRows.Close()

	community.Messages = []models.Message{}
	for messageRows.Next() {
		var message models.Message
		var replyTo sql.NullString // For NULL values
		if err := messageRows.Scan(&message.ID, &message.UserID, &message.UserName, &message.Content, &replyTo, &message.CreatedAt, &message.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan community message: %w", err)
		}
		message.CommunityID = id
		if replyTo.Valid {
			replyToUUID, err := uuid.Parse(replyTo.String)
			if err == nil {
				message.ReplyTo = &replyToUUID
			}
		}
		community.Messages = append(community.Messages, message)
	}

	return community, nil
}

// GetCommunities retrieves communities with filtering and pagination
func (r *CommunityRepository) GetCommunities(ctx context.Context, latitude, longitude float64, radius float64, filters map[string]interface{}, page, limit int) ([]*models.Community, int, error) {
	// Base query with geospatial filtering
	baseQuery := `
		SELECT 
			id, name, description, latitude, longitude, zip_code, city, state,
			image_url, type, created_by, created_at, updated_at,
			( 6371 * acos( cos( radians($1) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians($2) ) + sin( radians($1) ) * sin( radians( latitude ) ) ) ) AS distance
		FROM communities
	`
	countQuery := `SELECT COUNT(*) FROM communities`

	whereClauses := []string{}
	args := []interface{}{latitude, longitude}
	argCount := 3

	// Add filters
	if communityType, ok := filters["type"].(string); ok && communityType != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("type = $%d", argCount))
		args = append(args, communityType)
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
	var totalCommunities int
	err := r.db.QueryRowContext(ctx, countQuery, args[:argCount-1]...).Scan(&totalCommunities)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count communities: %w", err)
	}

	// Add ordering and pagination
	baseQuery += " ORDER BY distance ASC LIMIT $" + fmt.Sprintf("%d", argCount) + " OFFSET $" + fmt.Sprintf("%d", argCount+1)
	args = append(args, limit, (page-1)*limit)

	rows, err := r.db.QueryContext(ctx, baseQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query communities: %w", err)
	}
	defer rows.Close()

	communities := []*models.Community{}

	for rows.Next() {
		community := &models.Community{}
		var distance float64 // to scan the calculated distance
		err := rows.Scan(
			&community.ID, &community.Name, &community.Description,
			&community.Location.Latitude, &community.Location.Longitude, &community.Location.ZipCode, &community.Location.City, &community.Location.State,
			&community.ImageURL, &community.Type, &community.CreatedBy, &community.CreatedAt, &community.UpdatedAt, &distance,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan community: %w", err)
		}

		// Get member count for each community
		var memberCount int
		err = r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM community_members WHERE community_id = $1", community.ID).Scan(&memberCount)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to get member count: %w", err)
		}

		// Query first few members for preview
		memberRows, err := r.db.QueryContext(ctx, `
			SELECT m.id, m.user_id, u.name, m.role, m.joined_at
			FROM community_members m
			JOIN users u ON m.user_id = u.id
			WHERE m.community_id = $1
			ORDER BY m.joined_at
			LIMIT 5
		`, community.ID)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to query community members preview: %w", err)
		}

		community.Members = []models.Member{}
		for memberRows.Next() {
			var member models.Member
			if err := memberRows.Scan(&member.ID, &member.UserID, &member.UserName, &member.Role, &member.JoinedAt); err != nil {
				memberRows.Close()
				return nil, 0, fmt.Errorf("failed to scan community member: %w", err)
			}
			member.CommunityID = community.ID
			community.Members = append(community.Members, member)
		}
		memberRows.Close()

		communities = append(communities, community)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating community rows: %w", err)
	}

	return communities, totalCommunities, nil
}

// JoinCommunity adds a user as a member of a community
func (r *CommunityRepository) JoinCommunity(ctx context.Context, communityID, userID uuid.UUID) (*models.Member, error) {
	// Check if user is already a member
	var existingCount int
	err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM community_members WHERE community_id = $1 AND user_id = $2", communityID, userID).Scan(&existingCount)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing membership: %w", err)
	}
	if existingCount > 0 {
		return nil, fmt.Errorf("user is already a member of this community")
	}

	// Create new member
	memberID := uuid.New()
	joinedAt := time.Now()
	role := "Member" // Default role for new members

	_, err = r.db.ExecContext(ctx, `
		INSERT INTO community_members (
			id, community_id, user_id, role, joined_at
		) VALUES ($1, $2, $3, $4, $5)
	`,
		memberID, communityID, userID, role, joinedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to add member: %w", err)
	}

	// Get user name
	var userName string
	err = r.db.QueryRowContext(ctx, "SELECT name FROM users WHERE id = $1", userID).Scan(&userName)
	if err != nil {
		return nil, fmt.Errorf("failed to get user name: %w", err)
	}

	// Create and return the member
	member := &models.Member{
		ID:          memberID,
		CommunityID: communityID,
		UserID:      userID,
		UserName:    userName,
		Role:        role,
		JoinedAt:    joinedAt,
	}

	return member, nil
}

// PostMessage adds a message to a community
func (r *CommunityRepository) PostMessage(ctx context.Context, message *models.Message) error {
	if message.ID == uuid.Nil {
		message.ID = uuid.New()
	}
	message.CreatedAt = time.Now()
	message.UpdatedAt = time.Now()

	// Check if user is a member of the community
	var memberCount int
	err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM community_members WHERE community_id = $1 AND user_id = $2", message.CommunityID, message.UserID).Scan(&memberCount)
	if err != nil {
		return fmt.Errorf("failed to check membership: %w", err)
	}
	if memberCount == 0 {
		return fmt.Errorf("user is not a member of this community")
	}

	// Insert the message
	_, err = r.db.ExecContext(ctx, `
		INSERT INTO community_messages (
			id, community_id, user_id, content, reply_to, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
	`,
		message.ID, message.CommunityID, message.UserID, message.Content, message.ReplyTo, message.CreatedAt, message.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to post message: %w", err)
	}

	return nil
}

// GetMessages retrieves messages for a community with pagination
func (r *CommunityRepository) GetMessages(ctx context.Context, communityID uuid.UUID, page, limit int) ([]models.Message, int, error) {
	// Query for total count
	var totalMessages int
	err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM community_messages WHERE community_id = $1", communityID).Scan(&totalMessages)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count messages: %w", err)
	}

	// Query messages with pagination
	offset := (page - 1) * limit
	messageRows, err := r.db.QueryContext(ctx, `
		SELECT m.id, m.user_id, u.name, m.content, m.reply_to, m.created_at, m.updated_at
		FROM community_messages m
		JOIN users u ON m.user_id = u.id
		WHERE m.community_id = $1
		ORDER BY m.created_at DESC
		LIMIT $2 OFFSET $3
	`, communityID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query messages: %w", err)
	}
	defer messageRows.Close()

	messages := []models.Message{}
	for messageRows.Next() {
		var message models.Message
		var replyTo sql.NullString // For NULL values
		if err := messageRows.Scan(&message.ID, &message.UserID, &message.UserName, &message.Content, &replyTo, &message.CreatedAt, &message.UpdatedAt); err != nil {
			return nil, 0, fmt.Errorf("failed to scan message: %w", err)
		}
		message.CommunityID = communityID
		if replyTo.Valid {
			replyToUUID, err := uuid.Parse(replyTo.String)
			if err == nil {
				message.ReplyTo = &replyToUUID
			}
		}
		messages = append(messages, message)
	}

	if err = messageRows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating message rows: %w", err)
	}

	return messages, totalMessages, nil
}
