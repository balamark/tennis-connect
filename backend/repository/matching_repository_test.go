package repository

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/user/tennis-connect/models"
)

func TestMatchingRepository_CreateMatchSession(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	db, cleanup := setupTestDB(t)
	defer cleanup()

	matchingRepo := NewMatchingRepository(db)
	userRepo := NewUserRepository(db)
	courtRepo := NewCourtRepository(db)
	ctx := context.Background()

	// Create test user
	user := &models.User{
		Email:        "matching@example.com",
		PasswordHash: "password123",
		Name:         "Matching User",
		SkillLevel:   4.0,
		GameStyles:   []string{"Singles"},
		Gender:       "Male",
		Location: models.Location{
			Latitude:  37.7749,
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
	}
	err := userRepo.Create(ctx, user)
	require.NoError(t, err, "Failed to create test user")

	// Create test court
	court := &models.Court{
		Name:        "Matching Test Court",
		Description: "A test court for matching",
		Location: models.Location{
			Latitude:  37.7749,
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
		CourtType:   "Hard",
		IsPublic:    true,
		Amenities:   []string{"Lights", "Water"},
		ContactInfo: "test@example.com",
	}
	err = courtRepo.Create(ctx, court)
	require.NoError(t, err, "Failed to create test court")

	// Create match session
	startTime := time.Now().Add(24 * time.Hour) // Tomorrow
	endTime := startTime.Add(time.Hour)         // 1 hour duration

	session := &models.MatchSession{
		CourtID:    court.ID,
		StartTime:  startTime,
		EndTime:    endTime,
		GameType:   "Singles",
		SkillLevel: 4.0,
		Status:     models.MatchingStatusPending,
		MaxPlayers: 2,
	}

	err = matchingRepo.CreateMatchSession(ctx, session)
	assert.NoError(t, err, "CreateMatchSession should not return an error")
	assert.NotEqual(t, uuid.Nil, session.ID, "Session ID should be set")

	// Verify session was created
	createdSession, err := matchingRepo.GetMatchSession(ctx, session.ID)
	assert.NoError(t, err, "GetMatchSession should not return an error")
	assert.Equal(t, session.ID, createdSession.ID, "Session ID should match")
	assert.Equal(t, court.ID, createdSession.CourtID, "Court ID should match")
	assert.Equal(t, "Singles", createdSession.GameType, "Game type should match")
	assert.Equal(t, float32(4.0), createdSession.SkillLevel, "Skill level should match")
}

func TestMatchingRepository_JoinMatchSession(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	db, cleanup := setupTestDB(t)
	defer cleanup()

	matchingRepo := NewMatchingRepository(db)
	userRepo := NewUserRepository(db)
	courtRepo := NewCourtRepository(db)
	ctx := context.Background()

	// Create test users
	user1 := &models.User{
		Email:        "player1@example.com",
		PasswordHash: "password123",
		Name:         "Player 1",
		SkillLevel:   4.0,
		GameStyles:   []string{"Singles"},
		Gender:       "Male",
		Location: models.Location{
			Latitude:  37.7749,
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
	}
	err := userRepo.Create(ctx, user1)
	require.NoError(t, err)

	user2 := &models.User{
		Email:        "player2@example.com",
		PasswordHash: "password123",
		Name:         "Player 2",
		SkillLevel:   3.5,
		GameStyles:   []string{"Singles"},
		Gender:       "Female",
		Location: models.Location{
			Latitude:  37.7749,
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
	}
	err = userRepo.Create(ctx, user2)
	require.NoError(t, err)

	// Create test court
	court := &models.Court{
		Name:        "Join Test Court",
		Description: "A test court for joining",
		Location: models.Location{
			Latitude:  37.7749,
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
		CourtType:   "Hard",
		IsPublic:    true,
		Amenities:   []string{"Lights", "Water"},
		ContactInfo: "test@example.com",
	}
	err = courtRepo.Create(ctx, court)
	require.NoError(t, err)

	// Create match session
	startTime := time.Now().Add(24 * time.Hour)
	endTime := startTime.Add(time.Hour)

	session := &models.MatchSession{
		CourtID:    court.ID,
		StartTime:  startTime,
		EndTime:    endTime,
		GameType:   "Singles",
		SkillLevel: 4.0,
		Status:     models.MatchingStatusPending,
		MaxPlayers: 2,
	}
	err = matchingRepo.CreateMatchSession(ctx, session)
	require.NoError(t, err)

	// Join session with first user
	err = matchingRepo.JoinMatchSession(ctx, session.ID, user1.ID)
	assert.NoError(t, err, "JoinMatchSession should not return an error")

	// Join session with second user
	err = matchingRepo.JoinMatchSession(ctx, session.ID, user2.ID)
	assert.NoError(t, err, "JoinMatchSession should not return an error")

	// Get match players
	players, err := matchingRepo.GetMatchPlayers(ctx, session.ID)
	assert.NoError(t, err, "GetMatchPlayers should not return an error")
	assert.Len(t, players, 2, "Should have 2 players in the session")

	// Verify players
	playerIDs := make(map[uuid.UUID]bool)
	for _, player := range players {
		playerIDs[player.UserID] = true
	}
	assert.True(t, playerIDs[user1.ID], "User1 should be in the session")
	assert.True(t, playerIDs[user2.ID], "User2 should be in the session")
}

func TestMatchingRepository_TriggerMatching(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	db, cleanup := setupTestDB(t)
	defer cleanup()

	matchingRepo := NewMatchingRepository(db)
	userRepo := NewUserRepository(db)
	courtRepo := NewCourtRepository(db)
	ctx := context.Background()

	// Create test users with different skill levels
	users := []*models.User{
		{
			Email:        "player1@matching.com",
			PasswordHash: "password123",
			Name:         "Player 1",
			SkillLevel:   4.0,
			GameStyles:   []string{"Singles"},
			Gender:       "Male",
			Location: models.Location{
				Latitude:  37.7749,
				Longitude: -122.4194,
				ZipCode:   "94105",
				City:      "San Francisco",
				State:     "CA",
			},
		},
		{
			Email:        "player2@matching.com",
			PasswordHash: "password123",
			Name:         "Player 2",
			SkillLevel:   3.8,
			GameStyles:   []string{"Singles"},
			Gender:       "Female",
			Location: models.Location{
				Latitude:  37.7749,
				Longitude: -122.4194,
				ZipCode:   "94105",
				City:      "San Francisco",
				State:     "CA",
			},
		},
	}

	for _, user := range users {
		err := userRepo.Create(ctx, user)
		require.NoError(t, err)
	}

	// Create test court
	court := &models.Court{
		Name:        "Trigger Test Court",
		Description: "A test court for triggering matches",
		Location: models.Location{
			Latitude:  37.7749,
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
		CourtType:   "Hard",
		IsPublic:    true,
		Amenities:   []string{"Lights", "Water"},
		ContactInfo: "test@example.com",
	}
	err := courtRepo.Create(ctx, court)
	require.NoError(t, err)

	// Create match session
	startTime := time.Now().Add(24 * time.Hour)
	endTime := startTime.Add(time.Hour)

	session := &models.MatchSession{
		CourtID:    court.ID,
		StartTime:  startTime,
		EndTime:    endTime,
		GameType:   "Singles",
		SkillLevel: 4.0,
		Status:     models.MatchingStatusPending,
		MaxPlayers: 2,
	}
	err = matchingRepo.CreateMatchSession(ctx, session)
	require.NoError(t, err)

	// Join session with both users
	for _, user := range users {
		err = matchingRepo.JoinMatchSession(ctx, session.ID, user.ID)
		require.NoError(t, err)
	}

	// Trigger matching
	err = matchingRepo.TriggerMatching(ctx, session.ID)
	assert.NoError(t, err, "TriggerMatching should not return an error")

	// Get player pairings
	pairings, err := matchingRepo.GetPlayerPairings(ctx, session.ID)
	assert.NoError(t, err, "GetPlayerPairings should not return an error")
	assert.Len(t, pairings, 1, "Should have 1 pairing for 2 players")

	// Verify pairing
	pairing := pairings[0]
	assert.NotEqual(t, uuid.Nil, pairing.Player1ID, "Player1ID should be set")
	assert.NotEqual(t, uuid.Nil, pairing.Player2ID, "Player2ID should be set")
	assert.Greater(t, pairing.CompatibilityScore, float32(0), "Compatibility score should be greater than 0")
}
