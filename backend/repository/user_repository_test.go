package repository

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/user/tennis-connect/config"
	"github.com/user/tennis-connect/database"
	"github.com/user/tennis-connect/models"
)

// setupTestDB sets up a test database connection
func setupTestDB(t *testing.T) *database.DB {
	// Load test configuration
	cfg := config.LoadConfig()
	cfg.Environment = "test"

	// Connect to database
	db, err := database.Connect(cfg)
	require.NoError(t, err, "Failed to connect to test database")

	// Run migrations
	err = db.RunMigrations("../migrations")
	require.NoError(t, err, "Failed to run migrations")

	// Clear test data
	clearTestData(t, db)

	return db
}

// clearTestData clears all test data from the database
func clearTestData(t *testing.T, db *database.DB) {
	// Clear tables in the correct order to avoid foreign key constraints
	tables := []string{
		"player_matches",
		"community_messages",
		"community_members",
		"communities",
		"event_rsvps",
		"events",
		"bulletin_responses",
		"bulletins",
		"check_ins",
		"court_amenities",
		"courts",
		"preferred_times",
		"user_game_styles",
		"users",
	}

	for _, table := range tables {
		_, err := db.Exec("DELETE FROM " + table)
		require.NoError(t, err, "Failed to clear table: "+table)
	}
}

// TestUserRepository_Create tests the Create method of UserRepository
func TestUserRepository_Create(t *testing.T) {
	// Skip if not in test environment
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	db := setupTestDB(t)
	defer db.Close()

	repo := NewUserRepository(db)
	ctx := context.Background()

	// Test data
	user := &models.User{
		Email:        "test@example.com",
		PasswordHash: "password123", // Will be hashed by the repository
		Name:         "Test User",
		SkillLevel:   4.0,
		GameStyles:   []string{"Singles", "Competitive"},
		IsVerified:   false,
		IsNewToArea:  true,
		Gender:       "Male",
		Location: models.Location{
			Latitude:  37.7749,
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
		PreferredTimes: []models.TimeSlot{
			{
				DayOfWeek: "Monday",
				StartTime: "18:00",
				EndTime:   "20:00",
			},
		},
	}

	// Test
	err := repo.Create(ctx, user)
	assert.NoError(t, err, "Create should not return an error")
	assert.NotEqual(t, uuid.Nil, user.ID, "User ID should be set")

	// Verify
	createdUser, err := repo.GetByEmail(ctx, "test@example.com")
	assert.NoError(t, err, "GetByEmail should not return an error")
	assert.Equal(t, user.ID, createdUser.ID, "User ID should match")
	assert.Equal(t, "Test User", createdUser.Name, "Name should match")
	assert.Equal(t, 4.0, float64(createdUser.SkillLevel), "Skill level should match")
	assert.Equal(t, 2, len(createdUser.GameStyles), "Game styles count should match")
	assert.Equal(t, 1, len(createdUser.PreferredTimes), "Preferred times count should match")
	assert.Equal(t, "Monday", createdUser.PreferredTimes[0].DayOfWeek, "Day of week should match")
}

// TestUserRepository_GetByID tests the GetByID method of UserRepository
func TestUserRepository_GetByID(t *testing.T) {
	// Skip if not in test environment
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	db := setupTestDB(t)
	defer db.Close()

	repo := NewUserRepository(db)
	ctx := context.Background()

	// Create test user
	user := &models.User{
		Email:        "getbyid@example.com",
		PasswordHash: "password123",
		Name:         "Get By ID User",
		SkillLevel:   3.5,
		GameStyles:   []string{"Doubles", "Social"},
		IsVerified:   true,
		IsNewToArea:  false,
		Gender:       "Female",
		Location: models.Location{
			Latitude:  37.7833,
			Longitude: -122.4167,
			ZipCode:   "94109",
			City:      "San Francisco",
			State:     "CA",
		},
	}

	err := repo.Create(ctx, user)
	require.NoError(t, err, "Failed to create test user")

	// Test
	fetchedUser, err := repo.GetByID(ctx, user.ID)
	assert.NoError(t, err, "GetByID should not return an error")
	assert.Equal(t, user.ID, fetchedUser.ID, "User ID should match")
	assert.Equal(t, "Get By ID User", fetchedUser.Name, "Name should match")
	assert.Equal(t, 3.5, float64(fetchedUser.SkillLevel), "Skill level should match")

	// Test with non-existent ID
	nonExistentID := uuid.New()
	_, err = repo.GetByID(ctx, nonExistentID)
	assert.Error(t, err, "GetByID with non-existent ID should return an error")
}

// TestUserRepository_Update tests the Update method of UserRepository
func TestUserRepository_Update(t *testing.T) {
	// Skip if not in test environment
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	db := setupTestDB(t)
	defer db.Close()

	repo := NewUserRepository(db)
	ctx := context.Background()

	// Create test user
	user := &models.User{
		Email:        "update@example.com",
		PasswordHash: "password123",
		Name:         "Update User",
		SkillLevel:   3.0,
		GameStyles:   []string{"Singles"},
		IsVerified:   false,
		IsNewToArea:  true,
		Gender:       "Male",
		Location: models.Location{
			Latitude:  37.7739,
			Longitude: -122.4312,
			ZipCode:   "94107",
			City:      "San Francisco",
			State:     "CA",
		},
	}

	err := repo.Create(ctx, user)
	require.NoError(t, err, "Failed to create test user")

	// Update user
	user.Name = "Updated Name"
	user.SkillLevel = 4.0
	user.GameStyles = []string{"Singles", "Doubles"}
	user.IsVerified = true
	user.PreferredTimes = []models.TimeSlot{
		{
			DayOfWeek: "Tuesday",
			StartTime: "17:00",
			EndTime:   "19:00",
		},
	}

	// Test
	err = repo.Update(ctx, user)
	assert.NoError(t, err, "Update should not return an error")

	// Verify
	updatedUser, err := repo.GetByID(ctx, user.ID)
	assert.NoError(t, err, "GetByID should not return an error")
	assert.Equal(t, "Updated Name", updatedUser.Name, "Name should be updated")
	assert.Equal(t, 4.0, float64(updatedUser.SkillLevel), "Skill level should be updated")
	assert.Equal(t, 2, len(updatedUser.GameStyles), "Game styles count should be updated")
	assert.True(t, updatedUser.IsVerified, "IsVerified should be updated")
	assert.Equal(t, 1, len(updatedUser.PreferredTimes), "Preferred times count should be updated")
	assert.Equal(t, "Tuesday", updatedUser.PreferredTimes[0].DayOfWeek, "Day of week should be updated")
}

// TestUserRepository_GetNearbyUsers tests the GetNearbyUsers method of UserRepository
func TestUserRepository_GetNearbyUsers(t *testing.T) {
	// Skip if not in test environment
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	db := setupTestDB(t)
	defer db.Close()

	repo := NewUserRepository(db)
	ctx := context.Background()

	// Create main user
	mainUser := &models.User{
		Email:        "main@example.com",
		PasswordHash: "password123",
		Name:         "Main User",
		SkillLevel:   4.0,
		GameStyles:   []string{"Singles", "Competitive"},
		Gender:       "Male",
		Location: models.Location{
			Latitude:  37.7749,
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
	}
	err := repo.Create(ctx, mainUser)
	require.NoError(t, err, "Failed to create main user")

	// Create nearby users
	nearbyUsers := []*models.User{
		{
			Email:        "nearby1@example.com",
			PasswordHash: "password123",
			Name:         "Nearby User 1",
			SkillLevel:   3.5,
			GameStyles:   []string{"Singles", "Social"},
			Gender:       "Female",
			IsNewToArea:  true,
			Location: models.Location{
				Latitude:  37.7739,
				Longitude: -122.4212,
				ZipCode:   "94107",
				City:      "San Francisco",
				State:     "CA",
			},
		},
		{
			Email:        "nearby2@example.com",
			PasswordHash: "password123",
			Name:         "Nearby User 2",
			SkillLevel:   4.0,
			GameStyles:   []string{"Doubles", "Competitive"},
			Gender:       "Male",
			Location: models.Location{
				Latitude:  37.7833,
				Longitude: -122.4167,
				ZipCode:   "94109",
				City:      "San Francisco",
				State:     "CA",
			},
		},
		{
			Email:        "far@example.com",
			PasswordHash: "password123",
			Name:         "Far User",
			SkillLevel:   3.0,
			GameStyles:   []string{"Singles"},
			Gender:       "Female",
			Location: models.Location{
				Latitude:  38.5816,
				Longitude: -121.4944,
				ZipCode:   "95814",
				City:      "Sacramento",
				State:     "CA",
			},
		},
	}

	for _, user := range nearbyUsers {
		err := repo.Create(ctx, user)
		require.NoError(t, err, "Failed to create nearby user")
	}

	// Test - get all nearby users
	filters := map[string]interface{}{
		"userID": mainUser.ID,
	}
	users, err := repo.GetNearbyUsers(ctx, mainUser.Location.Latitude, mainUser.Location.Longitude, 10, filters)
	assert.NoError(t, err, "GetNearbyUsers should not return an error")
	assert.Equal(t, 2, len(users), "Should find 2 nearby users within 10 miles")

	// Test - filter by skill level
	filters["skillLevel"] = float32(4.0)
	users, err = repo.GetNearbyUsers(ctx, mainUser.Location.Latitude, mainUser.Location.Longitude, 10, filters)
	assert.NoError(t, err, "GetNearbyUsers with skill filter should not return an error")
	assert.Equal(t, 1, len(users), "Should find 1 nearby user with skill level 4.0")
	assert.Equal(t, "Nearby User 2", users[0].Name, "Should find the user with matching skill level")

	// Test - filter by gender
	filters = map[string]interface{}{
		"userID": mainUser.ID,
		"gender": "Female",
	}
	users, err = repo.GetNearbyUsers(ctx, mainUser.Location.Latitude, mainUser.Location.Longitude, 10, filters)
	assert.NoError(t, err, "GetNearbyUsers with gender filter should not return an error")
	assert.Equal(t, 1, len(users), "Should find 1 nearby female user")
	assert.Equal(t, "Nearby User 1", users[0].Name, "Should find the female user")

	// Test - filter by newcomer status
	filters = map[string]interface{}{
		"userID":     mainUser.ID,
		"isNewcomer": true,
	}
	users, err = repo.GetNearbyUsers(ctx, mainUser.Location.Latitude, mainUser.Location.Longitude, 10, filters)
	assert.NoError(t, err, "GetNearbyUsers with newcomer filter should not return an error")
	assert.Equal(t, 1, len(users), "Should find 1 nearby newcomer user")
	assert.Equal(t, "Nearby User 1", users[0].Name, "Should find the newcomer user")
}

// TestUserRepository_VerifyPassword tests the VerifyPassword method of UserRepository
func TestUserRepository_VerifyPassword(t *testing.T) {
	// Skip if not in test environment
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	db := setupTestDB(t)
	defer db.Close()

	repo := NewUserRepository(db)
	ctx := context.Background()

	// Create test user
	user := &models.User{
		Email:        "password@example.com",
		PasswordHash: "password123",
		Name:         "Password User",
		SkillLevel:   3.5,
	}

	err := repo.Create(ctx, user)
	require.NoError(t, err, "Failed to create test user")

	// Test with correct password
	valid, retrievedUser, err := repo.VerifyPassword(ctx, "password@example.com", "password123")
	assert.NoError(t, err, "VerifyPassword should not return an error")
	assert.True(t, valid, "Password should be valid")
	assert.NotNil(t, retrievedUser, "User should be returned")
	assert.Equal(t, "Password User", retrievedUser.Name, "Name should match")

	// Test with incorrect password
	valid, retrievedUser, err = repo.VerifyPassword(ctx, "password@example.com", "wrongpassword")
	assert.NoError(t, err, "VerifyPassword should not return an error even with wrong password")
	assert.False(t, valid, "Password should be invalid")
	assert.Nil(t, retrievedUser, "User should not be returned")

	// Test with non-existent email
	valid, retrievedUser, err = repo.VerifyPassword(ctx, "nonexistent@example.com", "password123")
	assert.NoError(t, err, "VerifyPassword should not return an error for non-existent user")
	assert.False(t, valid, "Password should be invalid for non-existent user")
	assert.Nil(t, retrievedUser, "User should not be returned")
}
