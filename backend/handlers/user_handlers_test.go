package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/user/tennis-connect/models"
	"github.com/user/tennis-connect/utils"
)

// Mock user repository for testing
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) Create(ctx context.Context, user *models.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) Update(ctx context.Context, user *models.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepository) GetNearbyUsers(ctx context.Context, latitude, longitude, radius float64, filters map[string]interface{}) ([]*models.User, error) {
	args := m.Called(ctx, latitude, longitude, radius, filters)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.User), args.Error(1)
}

func (m *MockUserRepository) VerifyPassword(ctx context.Context, email, password string) (bool, *models.User, error) {
	args := m.Called(ctx, email, password)
	if args.Get(1) == nil {
		return args.Bool(0), nil, args.Error(2)
	}
	return args.Bool(0), args.Get(1).(*models.User), args.Error(2)
}

// setupTestRouter sets up a test router with the given handler
func setupTestRouter(userHandler *UserHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Set up JWT manager for testing
	jwtManager := utils.NewJWTManager("test-secret", 60)
	router.Use(func(c *gin.Context) {
		c.Set("jwtManager", jwtManager)
		c.Next()
	})

	router.POST("/api/users/register", userHandler.RegisterUser)
	router.POST("/api/users/login", userHandler.LoginUser)
	router.GET("/api/users/profile/:id", userHandler.GetUserProfile)
	router.PUT("/api/users/profile", userHandler.UpdateUserProfile)
	router.GET("/api/users/nearby", userHandler.GetNearbyUsers)
	router.POST("/api/users/like/:id", userHandler.LikeUser)

	return router
}

// TestUserHandler_RegisterUser tests the RegisterUser method
func TestUserHandler_RegisterUser(t *testing.T) {
	// Setup mock repository
	mockRepo := new(MockUserRepository)
	userHandler := NewUserHandler(mockRepo)
	router := setupTestRouter(userHandler)

	// Test data
	registrationData := map[string]interface{}{
		"email":       "test@example.com",
		"password":    "password123",
		"name":        "Test User",
		"skillLevel":  4.0,
		"gameStyles":  []string{"Singles", "Competitive"},
		"gender":      "Male",
		"isNewToArea": false,
		"location": map[string]interface{}{
			"latitude":  37.7749,
			"longitude": -122.4194,
			"zipCode":   "94105",
			"city":      "San Francisco",
			"state":     "CA",
		},
	}

	// Setup expectations
	mockRepo.On("Create", mock.Anything, mock.MatchedBy(func(u *models.User) bool {
		return u.Email == "test@example.com" && u.Name == "Test User"
	})).Return(nil)

	// Create request
	jsonData, _ := json.Marshal(registrationData)
	req, _ := http.NewRequest("POST", "/api/users/register", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	// Perform request
	router.ServeHTTP(resp, req)

	// Assert
	assert.Equal(t, http.StatusCreated, resp.Code)
	mockRepo.AssertExpectations(t)

	// Verify response
	var response models.User
	err := json.Unmarshal(resp.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "test@example.com", response.Email)
	assert.Equal(t, "Test User", response.Name)
	assert.Equal(t, "", response.PasswordHash, "Password hash should not be exposed")
}

// TestUserHandler_LoginUser tests the LoginUser method
func TestUserHandler_LoginUser(t *testing.T) {
	// Setup mock repository
	mockRepo := new(MockUserRepository)
	userHandler := NewUserHandler(mockRepo)
	router := setupTestRouter(userHandler)

	// Test data
	loginData := map[string]string{
		"email":    "test@example.com",
		"password": "password123",
	}

	testUser := &models.User{
		ID:    uuid.New(),
		Email: "test@example.com",
		Name:  "Test User",
	}

	// Setup expectations
	mockRepo.On("VerifyPassword", mock.Anything, "test@example.com", "password123").
		Return(true, testUser, nil)

	// Create request
	jsonData, _ := json.Marshal(loginData)
	req, _ := http.NewRequest("POST", "/api/users/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	// Perform request
	router.ServeHTTP(resp, req)

	// Assert
	assert.Equal(t, http.StatusOK, resp.Code)
	mockRepo.AssertExpectations(t)

	// Verify response
	var response map[string]interface{}
	err := json.Unmarshal(resp.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Contains(t, response, "token")
	assert.Contains(t, response, "user")
}

// TestUserHandler_GetUserProfile tests the GetUserProfile method
func TestUserHandler_GetUserProfile(t *testing.T) {
	// Setup mock repository
	mockRepo := new(MockUserRepository)
	userHandler := NewUserHandler(mockRepo)
	router := setupTestRouter(userHandler)

	// Test data
	userID := uuid.New()
	testUser := &models.User{
		ID:          userID,
		Email:       "test@example.com",
		Name:        "Test User",
		SkillLevel:  4.0,
		GameStyles:  []string{"Singles", "Competitive"},
		IsVerified:  true,
		IsNewToArea: false,
		Gender:      "Male",
		Location: models.Location{
			Latitude:  37.7749,
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
	}

	// Setup expectations
	mockRepo.On("GetByID", mock.Anything, userID).Return(testUser, nil)

	// Create request
	req, _ := http.NewRequest("GET", "/api/users/profile/"+userID.String(), nil)
	resp := httptest.NewRecorder()

	// Perform request
	router.ServeHTTP(resp, req)

	// Assert
	assert.Equal(t, http.StatusOK, resp.Code)
	mockRepo.AssertExpectations(t)

	// Verify response
	var response models.User
	err := json.Unmarshal(resp.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, userID, response.ID)
	assert.Equal(t, "test@example.com", response.Email)
	assert.Equal(t, "Test User", response.Name)
	assert.Equal(t, "", response.PasswordHash, "Password hash should not be exposed")
}

// TestUserHandler_UpdateUserProfile tests the UpdateUserProfile method
func TestUserHandler_UpdateUserProfile(t *testing.T) {
	// Setup mock repository
	mockRepo := new(MockUserRepository)
	userHandler := NewUserHandler(mockRepo)

	// Test data
	userID := uuid.New()
	user := models.User{
		ID:          userID,
		Email:       "test@example.com",
		Name:        "Updated User",
		SkillLevel:  4.5,
		GameStyles:  []string{"Singles", "Doubles", "Competitive"},
		IsVerified:  true,
		IsNewToArea: false,
		Gender:      "Male",
		Location: models.Location{
			Latitude:  37.7749,
			Longitude: -122.4194,
			ZipCode:   "94105",
			City:      "San Francisco",
			State:     "CA",
		},
	}

	// Setup router with authentication middleware simulation
	authRouter := gin.New()
	authRouter.PUT("/api/users/profile", func(c *gin.Context) {
		// Simulate authentication middleware
		c.Set("userID", userID.String())
		userHandler.UpdateUserProfile(c)
	})

	// Setup expectations
	mockRepo.On("Update", mock.Anything, mock.MatchedBy(func(u *models.User) bool {
		return u.ID == userID && u.Name == "Updated User"
	})).Return(nil)

	// Create request
	jsonData, _ := json.Marshal(user)
	req, _ := http.NewRequest("PUT", "/api/users/profile", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	// Perform request
	authRouter.ServeHTTP(resp, req)

	// Assert
	assert.Equal(t, http.StatusOK, resp.Code)
	mockRepo.AssertExpectations(t)

	// Verify response
	var response models.User
	err := json.Unmarshal(resp.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, userID, response.ID)
	assert.Equal(t, "Updated User", response.Name)
	assert.Equal(t, "", response.PasswordHash, "Password hash should not be exposed")
}

// TestUserHandler_GetNearbyUsers tests the GetNearbyUsers method
func TestUserHandler_GetNearbyUsers(t *testing.T) {
	// Setup mock repository
	mockRepo := new(MockUserRepository)
	userHandler := NewUserHandler(mockRepo)

	// Test data
	userID := uuid.New()
	nearbyUsers := []*models.User{
		{
			ID:          uuid.New(),
			Name:        "Nearby User 1",
			SkillLevel:  3.5,
			GameStyles:  []string{"Singles", "Social"},
			Gender:      "Female",
			IsNewToArea: true,
		},
		{
			ID:         uuid.New(),
			Name:       "Nearby User 2",
			SkillLevel: 4.0,
			GameStyles: []string{"Doubles", "Competitive"},
			Gender:     "Male",
		},
	}

	// Setup router with authentication middleware simulation
	router := gin.New()
	router.GET("/api/users/nearby", func(c *gin.Context) {
		// Simulate authentication middleware
		c.Set("userID", userID.String())
		userHandler.GetNearbyUsers(c)
	})

	// Setup expectations - match any filter arguments
	mockRepo.On("GetNearbyUsers", mock.Anything, mock.AnythingOfType("float64"), mock.AnythingOfType("float64"), mock.AnythingOfType("float64"), mock.Anything).
		Return(nearbyUsers, nil)

	// Create request
	req, _ := http.NewRequest("GET", "/api/users/nearby?latitude=37.7749&longitude=-122.4194&radius=10", nil)
	resp := httptest.NewRecorder()

	// Perform request
	router.ServeHTTP(resp, req)

	// Assert
	assert.Equal(t, http.StatusOK, resp.Code)
	mockRepo.AssertExpectations(t)

	// Verify response
	var response map[string]interface{}
	err := json.Unmarshal(resp.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Contains(t, response, "users")
	usersArray, ok := response["users"].([]interface{})
	assert.True(t, ok)
	assert.Equal(t, 2, len(usersArray))
}

// TestUserHandler_LikeUser tests the LikeUser method
func TestUserHandler_LikeUser(t *testing.T) {
	// Setup mock repository
	mockRepo := new(MockUserRepository)
	userHandler := NewUserHandler(mockRepo)

	// Test data
	userID := uuid.New()
	targetUserID := uuid.New()

	// Setup router with authentication middleware simulation
	router := gin.New()
	router.POST("/api/users/like/:id", func(c *gin.Context) {
		// Simulate authentication middleware
		c.Set("userID", userID.String())
		userHandler.LikeUser(c)
	})

	// Create request
	req, _ := http.NewRequest("POST", "/api/users/like/"+targetUserID.String(), nil)
	resp := httptest.NewRecorder()

	// Perform request
	router.ServeHTTP(resp, req)

	// Assert
	assert.Equal(t, http.StatusOK, resp.Code)

	// Verify response
	var response map[string]interface{}
	err := json.Unmarshal(resp.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Contains(t, response, "success")
	assert.Equal(t, true, response["success"])
	assert.Contains(t, response, "is_match")
	assert.Equal(t, true, response["is_match"])
}

// TestUserHandler_GetNearbyUsers_WithMetadata tests the GetNearbyUsers method with metadata response
func TestUserHandler_GetNearbyUsers_WithMetadata(t *testing.T) {
	// Setup mock repository
	mockRepo := new(MockUserRepository)
	userHandler := NewUserHandler(mockRepo)

	// Test data - users with distance information
	userID := uuid.New()
	nearbyUsers := []*models.User{
		{
			ID:         uuid.New(),
			Name:       "Close User",
			SkillLevel: 4.0,
			GameStyles: []string{"Singles"},
			Gender:     "Male",
			Distance:   5.2, // Within 10-mile radius
		},
		{
			ID:         uuid.New(),
			Name:       "Far User",
			SkillLevel: 4.0,
			GameStyles: []string{"Doubles"},
			Gender:     "Female",
			Distance:   15.8, // Outside 10-mile radius
		},
	}

	// Setup router with authentication middleware simulation
	router := gin.New()
	router.GET("/api/users/nearby", func(c *gin.Context) {
		// Simulate authentication middleware
		c.Set("userID", userID.String())
		userHandler.GetNearbyUsers(c)
	})

	// Setup expectations
	mockRepo.On("GetNearbyUsers", mock.Anything, mock.AnythingOfType("float64"), mock.AnythingOfType("float64"), mock.AnythingOfType("float64"), mock.Anything).
		Return(nearbyUsers, nil)

	// Create request
	req, _ := http.NewRequest("GET", "/api/users/nearby?latitude=37.7749&longitude=-122.4194&radius=10", nil)
	resp := httptest.NewRecorder()

	// Perform request
	router.ServeHTTP(resp, req)

	// Assert
	assert.Equal(t, http.StatusOK, resp.Code)
	mockRepo.AssertExpectations(t)

	// Verify response structure
	var response map[string]interface{}
	err := json.Unmarshal(resp.Body.Bytes(), &response)
	require.NoError(t, err)

	// Check that response contains both users and metadata
	assert.Contains(t, response, "users")
	assert.Contains(t, response, "metadata")

	// Verify metadata structure
	metadata, ok := response["metadata"].(map[string]interface{})
	assert.True(t, ok, "Metadata should be a map")
	assert.Contains(t, metadata, "total_users")
	assert.Contains(t, metadata, "users_in_range")
	assert.Contains(t, metadata, "users_out_of_range")
	assert.Contains(t, metadata, "search_radius")
	assert.Contains(t, metadata, "showing_fallback")

	// Verify metadata values
	assert.Equal(t, float64(2), metadata["total_users"])
	assert.Equal(t, float64(1), metadata["users_in_range"])
	assert.Equal(t, float64(1), metadata["users_out_of_range"])
	assert.Equal(t, float64(10), metadata["search_radius"])
	assert.Equal(t, false, metadata["showing_fallback"]) // Not fallback since we have users in range
}

// TestUserHandler_GetNearbyUsers_FallbackScenario tests the fallback scenario
func TestUserHandler_GetNearbyUsers_FallbackScenario(t *testing.T) {
	// Setup mock repository
	mockRepo := new(MockUserRepository)
	userHandler := NewUserHandler(mockRepo)

	// Test data - all users outside radius (fallback scenario)
	userID := uuid.New()
	fallbackUsers := []*models.User{
		{
			ID:         uuid.New(),
			Name:       "Far User 1",
			SkillLevel: 4.0,
			GameStyles: []string{"Singles"},
			Gender:     "Male",
			Distance:   25.3, // Outside 10-mile radius
		},
		{
			ID:         uuid.New(),
			Name:       "Far User 2",
			SkillLevel: 3.5,
			GameStyles: []string{"Doubles"},
			Gender:     "Female",
			Distance:   18.7, // Outside 10-mile radius
		},
	}

	// Setup router with authentication middleware simulation
	router := gin.New()
	router.GET("/api/users/nearby", func(c *gin.Context) {
		// Simulate authentication middleware
		c.Set("userID", userID.String())
		userHandler.GetNearbyUsers(c)
	})

	// Setup expectations
	mockRepo.On("GetNearbyUsers", mock.Anything, mock.AnythingOfType("float64"), mock.AnythingOfType("float64"), mock.AnythingOfType("float64"), mock.Anything).
		Return(fallbackUsers, nil)

	// Create request
	req, _ := http.NewRequest("GET", "/api/users/nearby?latitude=37.7749&longitude=-122.4194&radius=10", nil)
	resp := httptest.NewRecorder()

	// Perform request
	router.ServeHTTP(resp, req)

	// Assert
	assert.Equal(t, http.StatusOK, resp.Code)
	mockRepo.AssertExpectations(t)

	// Verify response structure
	var response map[string]interface{}
	err := json.Unmarshal(resp.Body.Bytes(), &response)
	require.NoError(t, err)

	// Verify metadata for fallback scenario
	metadata, ok := response["metadata"].(map[string]interface{})
	assert.True(t, ok, "Metadata should be a map")

	// Verify fallback metadata values
	assert.Equal(t, float64(2), metadata["total_users"])
	assert.Equal(t, float64(0), metadata["users_in_range"])
	assert.Equal(t, float64(2), metadata["users_out_of_range"])
	assert.Equal(t, float64(10), metadata["search_radius"])
	assert.Equal(t, true, metadata["showing_fallback"]) // Should be true since no users in range
}
