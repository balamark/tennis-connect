package utils

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

// GeocodingResult represents the result from a geocoding service
type GeocodingResult struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	City      string  `json:"city"`
	Country   string  `json:"country"`
}

// GeocodeCity converts a city name to coordinates using a free geocoding service
func GeocodeCity(city string) (*GeocodingResult, error) {
	if city == "" {
		return nil, fmt.Errorf("city name cannot be empty")
	}

	// Use BigDataCloud's free geocoding API
	baseURL := "https://api.bigdatacloud.net/data/geocode-city"
	params := url.Values{}
	params.Add("city", city)
	params.Add("countryId", "") // Leave empty to search globally
	params.Add("adminId", "")   // Leave empty to search all admin areas

	fullURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get(fullURL)
	if err != nil {
		return nil, fmt.Errorf("failed to make geocoding request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("geocoding service returned status %d", resp.StatusCode)
	}

	var result struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
		City      string  `json:"city"`
		Country   string  `json:"countryName"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode geocoding response: %w", err)
	}

	// Validate that we got valid coordinates
	if result.Latitude == 0 && result.Longitude == 0 {
		return nil, fmt.Errorf("geocoding service did not return valid coordinates for city: %s", city)
	}

	return &GeocodingResult{
		Latitude:  result.Latitude,
		Longitude: result.Longitude,
		City:      result.City,
		Country:   result.Country,
	}, nil
}

// GetDefaultCoordinatesForCity returns hardcoded coordinates for common cities
// This serves as a fallback when the geocoding service fails
func GetDefaultCoordinatesForCity(city string) (*GeocodingResult, bool) {
	coordinates := map[string]GeocodingResult{
		"Taipei": {
			Latitude:  25.0330,
			Longitude: 121.5654,
			City:      "Taipei",
			Country:   "Taiwan",
		},
		"Taitung": {
			Latitude:  22.7583,
			Longitude: 121.1444,
			City:      "Taitung",
			Country:   "Taiwan",
		},
		"Luye": {
			Latitude:  22.9068,
			Longitude: 121.1249,
			City:      "Luye",
			Country:   "Taiwan",
		},
		"Paris": {
			Latitude:  48.8566,
			Longitude: 2.3522,
			City:      "Paris",
			Country:   "France",
		},
		"Frankfurt": {
			Latitude:  50.1109,
			Longitude: 8.6821,
			City:      "Frankfurt",
			Country:   "Germany",
		},
		"Queenstown": {
			Latitude:  -45.0312,
			Longitude: 168.6626,
			City:      "Queenstown",
			Country:   "New Zealand",
		},
		"Auckland": {
			Latitude:  -36.8485,
			Longitude: 174.7633,
			City:      "Auckland",
			Country:   "New Zealand",
		},
	}

	if coord, exists := coordinates[city]; exists {
		return &coord, true
	}
	return nil, false
}

// GeocodeWithFallback tries to geocode a city, falling back to hardcoded coordinates
func GeocodeWithFallback(city string) (*GeocodingResult, error) {
	// First try the geocoding service
	result, err := GeocodeCity(city)
	if err == nil && result != nil {
		return result, nil
	}

	// If geocoding fails, try hardcoded coordinates
	if fallback, exists := GetDefaultCoordinatesForCity(city); exists {
		return fallback, nil
	}

	// If all else fails, return Taiwan coordinates as default
	return &GeocodingResult{
		Latitude:  25.0330,
		Longitude: 121.5654,
		City:      city,
		Country:   "Taiwan",
	}, nil
} 