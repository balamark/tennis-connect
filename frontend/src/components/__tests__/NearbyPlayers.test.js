import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NearbyPlayers from '../NearbyPlayers';
import api from '../../api/config';

// Mock the API
jest.mock('../../api/config');
const mockedApi = api;

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

describe('NearbyPlayers Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Mock successful geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194
        }
      });
    });
  });

  test('renders component with demo mode by default', async () => {
    render(<NearbyPlayers />);
    
    // Wait for the component to finish loading (demo mode has a 500ms delay)
    await waitFor(() => {
      expect(screen.getByText('Players Near You')).toBeInTheDocument();
      expect(screen.getByText('🎭 Demo Mode - Click for Live Data')).toBeInTheDocument();
      expect(screen.getByText('Find Your Perfect Tennis Partner 🎾')).toBeInTheDocument();
    });
  });

  test('displays fallback notice when no players in range', async () => {
    // Mock API response with fallback scenario
    const mockResponse = {
      data: {
        users: [
          {
            id: '1',
            name: 'Far Player',
            skillLevel: 4.0,
            gameStyles: ['Singles'],
            distance: 25.5,
            location: { city: 'Far City', state: 'CA' },
            preferredTimes: []
          }
        ],
        metadata: {
          total_users: 1,
          users_in_range: 0,
          users_out_of_range: 1,
          search_radius: 10,
          showing_fallback: true
        }
      }
    };

    mockedApi.get.mockResolvedValue(mockResponse);
    localStorage.setItem('token', 'fake-token');

    render(<NearbyPlayers />);
    
    // Wait for demo mode to load first
    await waitFor(() => {
      expect(screen.getByText('🎭 Demo Mode - Click for Live Data')).toBeInTheDocument();
    });
    
    // Switch to live mode
    fireEvent.click(screen.getByText('🎭 Demo Mode - Click for Live Data'));
    
    await waitFor(() => {
      expect(screen.getByText(/No players found within 10 miles/)).toBeInTheDocument();
      expect(screen.getByText(/Showing 1 players from a wider area/)).toBeInTheDocument();
    });
  });

  test('displays range info when some players are out of range', async () => {
    // Mock API response with mixed scenario
    const mockResponse = {
      data: {
        users: [
          {
            id: '1',
            name: 'Close Player',
            skillLevel: 4.0,
            gameStyles: ['Singles'],
            distance: 5.2,
            location: { city: 'Close City', state: 'CA' },
            preferredTimes: []
          },
          {
            id: '2',
            name: 'Far Player',
            skillLevel: 4.0,
            gameStyles: ['Doubles'],
            distance: 15.8,
            location: { city: 'Far City', state: 'CA' },
            preferredTimes: []
          }
        ],
        metadata: {
          total_users: 2,
          users_in_range: 1,
          users_out_of_range: 1,
          search_radius: 10,
          showing_fallback: false
        }
      }
    };

    mockedApi.get.mockResolvedValue(mockResponse);
    localStorage.setItem('token', 'fake-token');

    render(<NearbyPlayers />);
    
    // Wait for demo mode to load first
    await waitFor(() => {
      expect(screen.getByText('🎭 Demo Mode - Click for Live Data')).toBeInTheDocument();
    });
    
    // Switch to live mode
    fireEvent.click(screen.getByText('🎭 Demo Mode - Click for Live Data'));
    
    await waitFor(() => {
      expect(screen.getByText(/1 players within 10 miles/)).toBeInTheDocument();
      expect(screen.getByText(/1 additional players shown from wider area/)).toBeInTheDocument();
    });
  });

  test('displays distance badges correctly', async () => {
    const mockResponse = {
      data: {
        users: [
          {
            id: '1',
            name: 'Close Player',
            skillLevel: 4.0,
            gameStyles: ['Singles'],
            distance: 5.2,
            location: { city: 'Close City', state: 'CA' },
            preferredTimes: []
          },
          {
            id: '2',
            name: 'Far Player',
            skillLevel: 4.0,
            gameStyles: ['Doubles'],
            distance: 15.8,
            location: { city: 'Far City', state: 'CA' },
            preferredTimes: []
          }
        ],
        metadata: {
          total_users: 2,
          users_in_range: 1,
          users_out_of_range: 1,
          search_radius: 10,
          showing_fallback: false
        }
      }
    };

    mockedApi.get.mockResolvedValue(mockResponse);
    localStorage.setItem('token', 'fake-token');

    render(<NearbyPlayers />);
    
    // Wait for demo mode to load first
    await waitFor(() => {
      expect(screen.getByText('🎭 Demo Mode - Click for Live Data')).toBeInTheDocument();
    });
    
    // Switch to live mode
    fireEvent.click(screen.getByText('🎭 Demo Mode - Click for Live Data'));
    
    await waitFor(() => {
      // Check for distance badges
      expect(screen.getByText('5.2 mi')).toBeInTheDocument();
      expect(screen.getByText('15.8 mi')).toBeInTheDocument();
    });

    // Check CSS classes for distance badges
    const inRangeBadge = screen.getByText('5.2 mi');
    const outOfRangeBadge = screen.getByText('15.8 mi');
    
    expect(inRangeBadge).toHaveClass('in-range');
    expect(outOfRangeBadge).toHaveClass('out-of-range');
  });

  test('handles missing data gracefully', async () => {
    const mockResponse = {
      data: {
        users: [
          {
            id: '1',
            name: 'Incomplete Player',
            skillLevel: null,
            gameStyles: null,
            location: null,
            preferredTimes: null
          }
        ],
        metadata: {
          total_users: 1,
          users_in_range: 1,
          users_out_of_range: 0,
          search_radius: 10,
          showing_fallback: false
        }
      }
    };

    mockedApi.get.mockResolvedValue(mockResponse);
    localStorage.setItem('token', 'fake-token');

    render(<NearbyPlayers />);
    
    // Wait for demo mode to load first
    await waitFor(() => {
      expect(screen.getByText('🎭 Demo Mode - Click for Live Data')).toBeInTheDocument();
    });
    
    // Switch to live mode
    fireEvent.click(screen.getByText('🎭 Demo Mode - Click for Live Data'));
    
    await waitFor(() => {
      expect(screen.getByText('Incomplete Player')).toBeInTheDocument();
      expect(screen.getByText('Not specified')).toBeInTheDocument(); // For game styles
      expect(screen.getByText('Location not specified')).toBeInTheDocument();
      expect(screen.getByText('No times specified')).toBeInTheDocument();
      expect(screen.getByText('N/A NTRP')).toBeInTheDocument(); // For skill level
    });
  });

  test('filters work correctly with new metadata', async () => {
    const mockResponse = {
      data: {
        users: [
          {
            id: '1',
            name: 'Filtered Player',
            skillLevel: 4.0,
            gameStyles: ['Singles'],
            distance: 5.2,
            location: { city: 'Test City', state: 'CA' },
            preferredTimes: []
          }
        ],
        metadata: {
          total_users: 1,
          users_in_range: 1,
          users_out_of_range: 0,
          search_radius: 10,
          showing_fallback: false
        }
      }
    };

    mockedApi.get.mockResolvedValue(mockResponse);
    localStorage.setItem('token', 'fake-token');

    render(<NearbyPlayers />);
    
    // Wait for demo mode to load first
    await waitFor(() => {
      expect(screen.getByText('🎭 Demo Mode - Click for Live Data')).toBeInTheDocument();
    });
    
    // Switch to live mode
    fireEvent.click(screen.getByText('🎭 Demo Mode - Click for Live Data'));
    
    // Wait for the live mode to load
    await waitFor(() => {
      expect(screen.getByLabelText('Skill Level (NTRP):')).toBeInTheDocument();
    });
    
    // Change skill level filter
    const skillSelect = screen.getByLabelText('Skill Level (NTRP):');
    fireEvent.change(skillSelect, { target: { value: '4.0' } });
    
    // Apply filters
    fireEvent.click(screen.getByText('🔍 Apply Filters'));
    
    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('skill_level=4.0')
      );
    });
  });

  test('handles API errors gracefully', async () => {
    mockedApi.get.mockRejectedValue(new Error('API Error'));
    localStorage.setItem('token', 'fake-token');

    render(<NearbyPlayers />);
    
    // Wait for demo mode to load first
    await waitFor(() => {
      expect(screen.getByText('🎭 Demo Mode - Click for Live Data')).toBeInTheDocument();
    });
    
    // Switch to live mode
    fireEvent.click(screen.getByText('🎭 Demo Mode - Click for Live Data'));
    
    // Should fall back to demo data (check for famous tennis players from mock data)
    await waitFor(() => {
      expect(screen.getByText('Novak Djokovic')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('like functionality works', async () => {
    const mockResponse = {
      data: {
        users: [
          {
            id: '1',
            name: 'Likeable Player',
            skillLevel: 4.0,
            gameStyles: ['Singles'],
            distance: 5.2,
            location: { city: 'Test City', state: 'CA' },
            preferredTimes: []
          }
        ],
        metadata: {
          total_users: 1,
          users_in_range: 1,
          users_out_of_range: 0,
          search_radius: 10,
          showing_fallback: false
        }
      }
    };

    const mockLikeResponse = {
      data: {
        success: true,
        is_match: false
      }
    };

    mockedApi.get.mockResolvedValue(mockResponse);
    mockedApi.post.mockResolvedValue(mockLikeResponse);
    localStorage.setItem('token', 'fake-token');

    render(<NearbyPlayers />);
    
    // Wait for demo mode to load first
    await waitFor(() => {
      expect(screen.getByText('🎭 Demo Mode - Click for Live Data')).toBeInTheDocument();
    });
    
    // Switch to live mode
    fireEvent.click(screen.getByText('🎭 Demo Mode - Click for Live Data'));
    
    await waitFor(() => {
      expect(screen.getByText('Likeable Player')).toBeInTheDocument();
    });

    // Click like button
    const likeButton = screen.getByText('💖 Like Player');
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/users/like/1');
      expect(screen.getByText('💚 Liked')).toBeInTheDocument();
    });
  });
}); 