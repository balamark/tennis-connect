package repository

import (
	"context"
	"fmt"
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

	// Test - filter by skill level (should find users within 0.5 range)
	filters["skillLevel"] = float32(4.0)
	users, err = repo.GetNearbyUsers(ctx, mainUser.Location.Latitude, mainUser.Location.Longitude, 10, filters)
	assert.NoError(t, err, "GetNearbyUsers with skill filter should not return an error")
	assert.Equal(t, 2, len(users), "Should find 2 nearby users within skill level range (3.5-4.5)")
	// Check that we found users within the skill range
	foundInRange := 0
	for _, user := range users {
		if user.SkillLevel >= 3.5 && user.SkillLevel <= 4.5 {
			foundInRange++
		}
	}
	assert.Equal(t, 2, foundInRange, "Should find 2 users within skill level range")

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

// TestUserRepository_GetNearbyUsers_FallbackBehavior tests the fallback behavior when no users are found within radius
func TestUserRepository_GetNearbyUsers_FallbackBehavior(t *testing.T) {
	// Skip if not in test environment
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	db := setupTestDB(t)
	defer db.Close()

	// Clear any existing test data
	clearTestData(t, db)

	repo := NewUserRepository(db)
	ctx := context.Background()

	// Create main user in San Francisco
	mainUser := &models.User{
		Email:        "main@fallback.com",
		PasswordHash: "password123",
		Name:         "Main User",
		SkillLevel:   4.0,
		GameStyles:   []string{"Singles", "Competitive"},
		Gender:       "Male",
		Location: models.Location{
			Latitude:  37.7749, // San Francisco
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
	}
	err := repo.Create(ctx, mainUser)
	require.NoError(t, err, "Failed to create main user")

	// Create users very far away (different continents)
	farUsers := []*models.User{
		{
			Email:        "tokyo@fallback.com",
			PasswordHash: "password123",
			Name:         "Tokyo User",
			SkillLevel:   4.0,
			GameStyles:   []string{"Singles", "Competitive"},
			Gender:       "Male",
			Location: models.Location{
				Latitude:  35.6762, // Tokyo, Japan
				Longitude: 139.6503,
				ZipCode:   "100-0001",
				City:      "Tokyo",
				State:     "Tokyo",
			},
		},
		{
			Email:        "london@fallback.com",
			PasswordHash: "password123",
			Name:         "London User",
			SkillLevel:   4.0,
			GameStyles:   []string{"Singles", "Competitive"},
			Gender:       "Female",
			Location: models.Location{
				Latitude:  51.5074, // London, UK
				Longitude: -0.1278,
				ZipCode:   "SW1A 1AA",
				City:      "London",
				State:     "England",
			},
		},
		{
			Email:        "sydney@fallback.com",
			PasswordHash: "password123",
			Name:         "Sydney User",
			SkillLevel:   4.0,
			GameStyles:   []string{"Singles", "Competitive"},
			Gender:       "Male",
			Location: models.Location{
				Latitude:  -33.8688, // Sydney, Australia
				Longitude: 151.2093,
				ZipCode:   "2000",
				City:      "Sydney",
				State:     "NSW",
			},
		},
	}

	for _, user := range farUsers {
		err := repo.Create(ctx, user)
		require.NoError(t, err, "Failed to create far user: %s", user.Name)
	}

	// Test 1: Search with very small radius (1 mile) - should trigger fallback
	filters := map[string]interface{}{
		"userID": mainUser.ID,
	}
	users, err := repo.GetNearbyUsers(ctx, mainUser.Location.Latitude, mainUser.Location.Longitude, 1.0, filters)
	assert.NoError(t, err, "GetNearbyUsers should not return an error")
	assert.Equal(t, 3, len(users), "Should return all 3 far users as fallback when none in range")

	// Verify all returned users have distance information
	for _, user := range users {
		assert.Greater(t, user.Distance, 1.0, "All users should be outside the 1-mile radius")
		assert.NotEmpty(t, user.Name, "User should have a name")
		assert.NotNil(t, user.GameStyles, "GameStyles should be initialized")
		assert.NotNil(t, user.PreferredTimes, "PreferredTimes should be initialized")
	}

	// Test 2: Search with very large radius - should return users normally (not fallback)
	users, err = repo.GetNearbyUsers(ctx, mainUser.Location.Latitude, mainUser.Location.Longitude, 25000.0, filters)
	assert.NoError(t, err, "GetNearbyUsers should not return an error")
	assert.Equal(t, 3, len(users), "Should return all 3 users within large radius")

	// Test 3: Test fallback limit (create more than 20 users to test the 20-user limit)
	for i := 0; i < 25; i++ {
		extraUser := &models.User{
			Email:        fmt.Sprintf("extra%d@fallback.com", i),
			PasswordHash: "password123",
			Name:         fmt.Sprintf("Extra User %d", i),
			SkillLevel:   4.0,
			GameStyles:   []string{"Singles", "Competitive"},
			Gender:       "Male",
			Location: models.Location{
				Latitude:  float64(40 + i), // Spread across different latitudes
				Longitude: float64(100 + i),
				ZipCode:   "00000",
				City:      "Far City",
				State:     "Far State",
			},
		}
		err := repo.Create(ctx, extraUser)
		require.NoError(t, err, "Failed to create extra user")
	}

	// Test fallback with limit
	users, err = repo.GetNearbyUsers(ctx, mainUser.Location.Latitude, mainUser.Location.Longitude, 0.1, filters)
	assert.NoError(t, err, "GetNearbyUsers should not return an error")
	assert.Equal(t, 20, len(users), "Should return exactly 20 users as fallback limit")
}

// TestUserRepository_GetNearbyUsers_DistanceCalculation tests distance calculation accuracy
func TestUserRepository_GetNearbyUsers_DistanceCalculation(t *testing.T) {
	// Skip if not in test environment
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	db := setupTestDB(t)
	defer db.Close()

	// Clear any existing test data
	clearTestData(t, db)

	repo := NewUserRepository(db)
	ctx := context.Background()

	// Create main user
	mainUser := &models.User{
		Email:        "main@distance.com",
		PasswordHash: "password123",
		Name:         "Main User",
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
	err := repo.Create(ctx, mainUser)
	require.NoError(t, err, "Failed to create main user")

	// Create a user at a known distance
	nearUser := &models.User{
		Email:        "near@distance.com",
		PasswordHash: "password123",
		Name:         "Near User",
		SkillLevel:   4.0,
		GameStyles:   []string{"Singles"},
		Gender:       "Male",
		Location: models.Location{
			Latitude:  37.7849, // About 0.01 degrees north (roughly 0.7 miles)
			Longitude: -122.4194,
			ZipCode:   "94109",
			City:      "San Francisco",
			State:     "CA",
		},
	}
	err = repo.Create(ctx, nearUser)
	require.NoError(t, err, "Failed to create near user")

	// Test distance calculation
	filters := map[string]interface{}{
		"userID": mainUser.ID,
	}
	users, err := repo.GetNearbyUsers(ctx, mainUser.Location.Latitude, mainUser.Location.Longitude, 5.0, filters)
	assert.NoError(t, err, "GetNearbyUsers should not return an error")
	assert.Equal(t, 1, len(users), "Should find 1 nearby user")

	if len(users) > 0 {
		assert.Greater(t, users[0].Distance, 0.0, "Distance should be greater than 0")
		assert.Less(t, users[0].Distance, 2.0, "Distance should be less than 2 miles for this test case")
		assert.Equal(t, "Near User", users[0].Name, "Should find the correct user")
	}
}
