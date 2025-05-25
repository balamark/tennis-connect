package utils

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJWTManager_GenerateToken(t *testing.T) {
	jwtManager := NewJWTManager("test-secret", 60)
	userID := uuid.New()
	email := "test@example.com"
	name := "Test User"

	token, err := jwtManager.GenerateToken(userID, email, name)

	require.NoError(t, err)
	assert.NotEmpty(t, token)
}

func TestJWTManager_ValidateToken(t *testing.T) {
	jwtManager := NewJWTManager("test-secret", 60)
	userID := uuid.New()
	email := "test@example.com"
	name := "Test User"

	// Generate a token
	token, err := jwtManager.GenerateToken(userID, email, name)
	require.NoError(t, err)

	// Validate the token
	claims, err := jwtManager.ValidateToken(token)
	require.NoError(t, err)

	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, email, claims.Email)
	assert.Equal(t, name, claims.Name)
	assert.Equal(t, "tennis-connect", claims.Issuer)
	assert.Equal(t, userID.String(), claims.Subject)
}

func TestJWTManager_ValidateToken_InvalidToken(t *testing.T) {
	jwtManager := NewJWTManager("test-secret", 60)

	// Test with invalid token
	_, err := jwtManager.ValidateToken("invalid-token")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to parse token")
}

func TestJWTManager_ValidateToken_WrongSecret(t *testing.T) {
	jwtManager1 := NewJWTManager("secret1", 60)
	jwtManager2 := NewJWTManager("secret2", 60)

	userID := uuid.New()
	email := "test@example.com"
	name := "Test User"

	// Generate token with first manager
	token, err := jwtManager1.GenerateToken(userID, email, name)
	require.NoError(t, err)

	// Try to validate with second manager (different secret)
	_, err = jwtManager2.ValidateToken(token)
	assert.Error(t, err)
}

func TestJWTManager_ValidateToken_ExpiredToken(t *testing.T) {
	// Create manager with very short expiration (1 second)
	jwtManager := &JWTManager{
		secretKey:  "test-secret",
		expiration: time.Millisecond * 100, // 100ms expiration
	}
	userID := uuid.New()
	email := "test@example.com"
	name := "Test User"

	// Generate token
	token, err := jwtManager.GenerateToken(userID, email, name)
	require.NoError(t, err)

	// Wait for expiration
	time.Sleep(time.Millisecond * 200)

	// Try to validate expired token
	_, err = jwtManager.ValidateToken(token)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "token is expired")
}

func TestJWTManager_RefreshToken(t *testing.T) {
	jwtManager := NewJWTManager("test-secret", 60)
	userID := uuid.New()
	email := "test@example.com"
	name := "Test User"

	// Generate original token
	originalToken, err := jwtManager.GenerateToken(userID, email, name)
	require.NoError(t, err)

	// Wait a moment to ensure different timestamps
	time.Sleep(time.Millisecond * 10)

	// Refresh the token
	newToken, err := jwtManager.RefreshToken(originalToken)
	require.NoError(t, err)
	assert.NotEmpty(t, newToken)

	// Validate the new token
	claims, err := jwtManager.ValidateToken(newToken)
	require.NoError(t, err)
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, email, claims.Email)
	assert.Equal(t, name, claims.Name)
}

func TestJWTManager_RefreshToken_InvalidToken(t *testing.T) {
	jwtManager := NewJWTManager("test-secret", 60)

	// Try to refresh invalid token
	_, err := jwtManager.RefreshToken("invalid-token")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid token for refresh")
}

func TestJWTManager_ExtractUserIDFromToken(t *testing.T) {
	jwtManager := NewJWTManager("test-secret", 60)
	userID := uuid.New()
	email := "test@example.com"
	name := "Test User"

	// Generate token
	token, err := jwtManager.GenerateToken(userID, email, name)
	require.NoError(t, err)

	// Extract user ID
	extractedUserID, err := jwtManager.ExtractUserIDFromToken(token)
	require.NoError(t, err)
	assert.Equal(t, userID, extractedUserID)
}

func TestJWTManager_ExtractUserIDFromToken_InvalidToken(t *testing.T) {
	jwtManager := NewJWTManager("test-secret", 60)

	// Try to extract from invalid token
	_, err := jwtManager.ExtractUserIDFromToken("invalid-token")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to parse token")
}

func TestNewJWTManager(t *testing.T) {
	secret := "test-secret"
	expiration := 30

	jwtManager := NewJWTManager(secret, expiration)

	assert.NotNil(t, jwtManager)
	assert.Equal(t, secret, jwtManager.secretKey)
	assert.Equal(t, time.Duration(expiration)*time.Minute, jwtManager.expiration)
}

func TestJWTClaims_TokenStructure(t *testing.T) {
	jwtManager := NewJWTManager("test-secret", 60)
	userID := uuid.New()
	email := "test@example.com"
	name := "Test User"

	// Generate token
	token, err := jwtManager.GenerateToken(userID, email, name)
	require.NoError(t, err)

	// Validate and check claims structure
	claims, err := jwtManager.ValidateToken(token)
	require.NoError(t, err)

	// Check that all required fields are present
	assert.NotZero(t, claims.UserID)
	assert.NotEmpty(t, claims.Email)
	assert.NotEmpty(t, claims.Name)
	assert.NotZero(t, claims.IssuedAt)
	assert.NotNil(t, claims.ExpiresAt)
	assert.NotNil(t, claims.IssuedAt)
	assert.NotNil(t, claims.NotBefore)
	assert.NotEmpty(t, claims.Issuer)
	assert.NotEmpty(t, claims.Subject)
}
