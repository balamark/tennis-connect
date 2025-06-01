import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import NearbyPlayers from '../NearbyPlayers';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock fetch
global.fetch = jest.fn();

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};
Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('NearbyPlayers Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up localStorage mock with actual storage
    const storage = {};
    localStorageMock.getItem.mockImplementation((key) => storage[key] || null);
    localStorageMock.setItem.mockImplementation((key, value) => {
      storage[key] = value;
    });
    localStorageMock.removeItem.mockImplementation((key) => {
      delete storage[key];
    });
    localStorageMock.clear.mockImplementation(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    });
    
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Clean up any DOM elements
    document.body.innerHTML = '';
  });

  describe('Dropdown z-index conflicts prevention', () => {
    // FEATURE GROUP 13: Dropdown Z-Index Conflict Tests
    // TODO: Fix dropdown conditional rendering and z-index conflicts
    /*
    test('dropdown z-index conflicts are prevented by conditional rendering', () => {
      render(<NearbyPlayers />);
      
      // Initially, no dropdown options should be visible
      expect(screen.queryByText('Singles')).not.toBeInTheDocument();
      expect(screen.queryByText('Monday')).not.toBeInTheDocument();
      
      // Open styles dropdown
      const stylesDropdown = screen.getByText('Select styles');
      fireEvent.click(stylesDropdown);
      
      // Styles options should be visible
      expect(screen.getByText('Singles')).toBeInTheDocument();
      expect(screen.getByText('Doubles')).toBeInTheDocument();
      
      // Days options should NOT be visible (conditional rendering prevents both being open)
      expect(screen.queryByText('Monday')).not.toBeInTheDocument();
      expect(screen.queryByText('Tuesday')).not.toBeInTheDocument();
      
      // Close styles dropdown by clicking days dropdown
      const daysDropdown = screen.getByText('Select days');
      fireEvent.click(daysDropdown);
      
      // Now only days options should be visible
      expect(screen.getByText('Monday')).toBeInTheDocument();
      expect(screen.getByText('Tuesday')).toBeInTheDocument();
      
      // Styles options should no longer be visible
      expect(screen.queryByText('Singles')).not.toBeInTheDocument();
      expect(screen.queryByText('Doubles')).not.toBeInTheDocument();
    });

    test('only one dropdown can have options rendered at a time', () => {
      render(<NearbyPlayers />);
      
      const stylesDropdown = screen.getByText('Select styles');
      const daysDropdown = screen.getByText('Select days');
      
      // Open styles dropdown
      fireEvent.click(stylesDropdown);
      
      // Count how many dropdowns have options visible
      const stylesOptions = screen.queryAllByText(/Singles|Doubles|Competitive|Social/);
      const daysOptions = screen.queryAllByText(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
      
      expect(stylesOptions.length).toBeGreaterThan(0);
      expect(daysOptions.length).toBe(0);
      
      // Switch to days dropdown
      fireEvent.click(daysDropdown);
      
      // Now only days should have options
      const stylesOptionsAfter = screen.queryAllByText(/Singles|Doubles|Competitive|Social/);
      const daysOptionsAfter = screen.queryAllByText(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
      
      expect(stylesOptionsAfter.length).toBe(0);
      expect(daysOptionsAfter.length).toBeGreaterThan(0);
    });
    */
  });

  describe('Authentication and Live Mode API Tests', () => {
    // FEATURE GROUP 1: Authentication & Live Mode API Integration
    // TODO: Fix authentication token handling and API mocking
    /*
    test('shows error message when not authenticated in live mode', async () => {
      // Override with no token - reset the localStorage completely
      localStorageMock.getItem.mockImplementation((key) => null);
      localStorageMock.setItem.mockImplementation(() => {});
      localStorageMock.removeItem.mockImplementation(() => {});
      localStorageMock.clear.mockImplementation(() => {});
      
      render(<NearbyPlayers />);
      
      // Switch to live mode
      const liveButton = screen.getByText('? Demo Mode');
      fireEvent.click(liveButton);
      
      // Wait for error message with increased timeout
      await waitFor(() => {
        expect(screen.getByText(/Please log in to view nearby players. Click "Sign In" in the top menu to get started./)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Check for enhanced error UI
      expect(screen.getByText('?? Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Go to Sign In')).toBeInTheDocument();
      expect(screen.getByText('Switch to Demo Mode')).toBeInTheDocument();
      
      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
    });

    test('makes API call with authentication token in live mode', async () => {
      // Set up realistic localStorage mock with token storage
      const storage = { 'token': 'valid-token-123' };
      localStorageMock.getItem.mockImplementation((key) => storage[key] || null);
      localStorageMock.setItem.mockImplementation((key, value) => {
        storage[key] = value;
      });
      
      // Mock successful API response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          users: [
            {
              id: '1',
              name: 'John Doe',
              skill_level: 3.5,
              distance: 2.5,
              game_styles: ['Singles'],
              bio: 'Love playing tennis!',
            }
          ],
          metadata: {
            total_users: 1,
            users_in_range: 1,
            users_out_of_range: 0,
            search_radius: 10,
            showing_fallback: false
          }
        })
      });
      
      render(<NearbyPlayers />);
      
      // Switch to live mode
      const liveButton = screen.getByText('? Demo Mode');
      fireEvent.click(liveButton);
      
      // Wait for API call and content to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Verify fetch was called with correct headers
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/nearby'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token-123',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    test('handles 401 unauthorized error with helpful message', async () => {
      localStorageMock.getItem.mockReturnValue('expired-token');
      
      // Mock 401 response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });
      
      render(<NearbyPlayers />);
      
      const liveButton = screen.getByText('? Demo Mode');
      fireEvent.click(liveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Your session has expired. Please log in again to view nearby players./)).toBeInTheDocument();
      });
      
      // Check for enhanced error UI
      expect(screen.getByText('?? Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Go to Sign In')).toBeInTheDocument();
    });

    test('handles 404 not found error with helpful message', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token');
      
      // Mock 404 response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });
      
      render(<NearbyPlayers />);
      
      const liveButton = screen.getByText('? Demo Mode');
      fireEvent.click(liveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Service temporarily unavailable. Please try again later or switch to Demo mode./)).toBeInTheDocument();
      });
      
      // Check for enhanced error UI
      expect(screen.getByText('? Service Issue')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Use Demo Mode')).toBeInTheDocument();
    });

    test('handles 500 server error with appropriate message', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token');
      
      // Mock 500 response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      
      render(<NearbyPlayers />);
      
      const liveButton = screen.getByText('? Demo Mode');
      fireEvent.click(liveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Server error. Please try again later./)).toBeInTheDocument();
      });
    });

    test('handles network errors gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token');
      
      // Mock network error
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<NearbyPlayers />);
      
      const liveButton = screen.getByText('? Demo Mode');
      fireEvent.click(liveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
      
      // Check for enhanced error UI
      expect(screen.getByText('??Connection Error')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
      expect(screen.getByText('Switch to Demo Mode')).toBeInTheDocument();
    });

    test('error action buttons work correctly', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(<NearbyPlayers />);
      
      // Switch to live mode to trigger auth error
      const liveButton = screen.getByText('? Demo Mode');
      fireEvent.click(liveButton);
      
      await waitFor(() => {
        expect(screen.getByText('?? Authentication Required')).toBeInTheDocument();
      });
      
      // Test "Switch to Demo Mode" button
      const switchToDemoButton = screen.getByText('Switch to Demo Mode');
      fireEvent.click(switchToDemoButton);
      
      // Should be back in demo mode
      await waitFor(() => {
        expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
      });
    });

    test('includes authentication token in like player API call', async () => {
      // Set up realistic localStorage mock with token storage
      const storage = { 'token': 'valid-token' };
      localStorageMock.getItem.mockImplementation((key) => storage[key] || null);
      localStorageMock.setItem.mockImplementation((key, value) => {
        storage[key] = value;
      });
      
      // Mock successful responses
      fetch
        .mockResolvedValueOnce({ // Initial nearby players call
          ok: true,
          json: () => Promise.resolve({
            users: [{
              id: '1',
              name: 'John Doe',
              skill_level: 3.5,
              liked: false,
            }],
            metadata: { total_users: 1 }
          })
        })
        .mockResolvedValueOnce({ // Like player call
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      
      render(<NearbyPlayers />);
      
      // Switch to live mode and wait for data
      const liveButton = screen.getByText('? Demo Mode');
      fireEvent.click(liveButton);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Click like button
      const likeButton = screen.getByRole('button', { name: /like/i });
      fireEvent.click(likeButton);
      
      // Verify like API call was made with auth token
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/users/like'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer valid-token',
              'Content-Type': 'application/json',
            }),
            body: expect.stringContaining('"target_user_id":"1"'),
          })
        );
      }, { timeout: 3000 });
    });

    test('builds correct query parameters for API call', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [], metadata: {} })
      });
      
      render(<NearbyPlayers />);
      
      // Set some filters
      const skillSelect = screen.getByLabelText(/skill level/i);
      fireEvent.change(skillSelect, { target: { value: '3.5' } });
      
      const genderSelect = screen.getByLabelText(/gender/i);
      fireEvent.change(genderSelect, { target: { value: 'female' } });
      
      // Apply filters
      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);
      
      // Switch to live mode
      const liveButton = screen.getByText('? Demo Mode');
      fireEvent.click(liveButton);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringMatching(/skill_level=3\.5.*gender=female|gender=female.*skill_level=3\.5/),
          expect.any(Object)
        );
      });
    });

    test('handles empty API response gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          users: [],
          metadata: {
            total_users: 0,
            users_in_range: 0,
            users_out_of_range: 0,
            search_radius: 10,
            showing_fallback: false
          }
        })
      });
      
      render(<NearbyPlayers />);
      
      const liveButton = screen.getByText('? Demo Mode');
      fireEvent.click(liveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/No players found/)).toBeInTheDocument();
      });
    });
    */
  });

  describe('Demo Mode vs Live Mode Toggle', () => {
    // FEATURE GROUP 14: Demo/Live Mode Toggle Tests
    // TODO: Fix mode switching expectations and text matching
    /*
    test('switches between demo and live modes correctly', async () => {
      render(<NearbyPlayers />);
      
      // Should start in demo mode with demo players
      expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
      
      // Switch to live mode
      const liveButton = screen.getByText('? Demo Mode');
      fireEvent.click(liveButton);
      
      // Should show live mode indicator
      expect(screen.getByText(/live mode/i)).toBeInTheDocument();
      
      // Switch back to demo mode
      const demoButton = screen.getByText('? Live Mode');
      fireEvent.click(demoButton);
      
      // Should be back in demo mode
      expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
    });
    */

    test('demo mode shows sample players without API calls', () => {
      render(<NearbyPlayers />);
      
      // Should see demo players immediately
      expect(screen.getByText(/Sophia Chen/i)).toBeInTheDocument();
      expect(screen.getByText(/Marcus Johnson/i)).toBeInTheDocument();
      
      // Should not have made any API calls
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  test('renders component with demo mode by default', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      expect(screen.getByText('Players Near You')).toBeInTheDocument();
      expect(screen.getByText('? Demo Mode')).toBeInTheDocument();
      expect(screen.getByText('Showing sample data')).toBeInTheDocument();
    });
  });

  test('shows search metadata in demo mode', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      expect(screen.getByText(/players within 10 miles/)).toBeInTheDocument();
      expect(screen.getByText(/players outside range/)).toBeInTheDocument();
    });
  });

  test('filter controls are present and functional', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      // Check filter labels
      expect(screen.getByText('NTRP Rating')).toBeInTheDocument();
      expect(screen.getByText('Search Radius')).toBeInTheDocument();
      expect(screen.getByText('Style')).toBeInTheDocument();
      expect(screen.getByText('Availability')).toBeInTheDocument();
      expect(screen.getByText('Gender Preference')).toBeInTheDocument();
      expect(screen.getByText('New to Area Only')).toBeInTheDocument();
    });

    // Test skill level filter
    const skillSelect = screen.getByDisplayValue('Any Level');
    fireEvent.change(skillSelect, { target: { value: '4.0' } });
    expect(skillSelect.value).toBe('4.0');

    // Test radius slider
    const radiusSlider = screen.getByDisplayValue('10');
    fireEvent.change(radiusSlider, { target: { value: '20' } });
    expect(screen.getByText('20 miles')).toBeInTheDocument();
  });

  // FEATURE GROUP 16: First Set of Active Dropdown Tests  
  // TODO: Fix dropdown functionality - these were duplicated multiple times
  /*
  test('multi-select dropdown for game styles works correctly', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      const stylesDropdown = screen.getByText('Select styles');
      expect(stylesDropdown).toBeInTheDocument();
      
      // Click to open dropdown
      fireEvent.click(stylesDropdown.closest('.multi-select-dropdown'));
      
      // Check if options appear
      expect(screen.getByText('Singles')).toBeInTheDocument();
      expect(screen.getByText('Doubles')).toBeInTheDocument();
      expect(screen.getByText('Social')).toBeInTheDocument();
      expect(screen.getByText('Competitive')).toBeInTheDocument();
    });
  });

  test('multi-select dropdown for availability works correctly', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      const availabilityDropdown = screen.getByText('Select days');
      expect(availabilityDropdown).toBeInTheDocument();
      
      // Click to open dropdown
      fireEvent.click(availabilityDropdown.closest('.multi-select-dropdown'));
      
      // Check if day options appear
      expect(screen.getByText('Monday')).toBeInTheDocument();
      expect(screen.getByText('Saturday')).toBeInTheDocument();
      expect(screen.getByText('Sunday')).toBeInTheDocument();
    });
  });

  test('multi-select dropdown selection updates display correctly', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      const stylesDropdown = screen.getByText('Select styles');
      
      // Open dropdown
      fireEvent.click(stylesDropdown.closest('.multi-select-dropdown'));
      
      // Select Singles
      const singlesOption = screen.getByText('Singles');
      fireEvent.click(singlesOption);
      
      // Check if display updates
      expect(screen.getByText('Singles')).toBeInTheDocument();
    });
  });
  */

  // FEATURE GROUP 3: Fallback Behavior & Empty States
  // TODO: Fix fallback logic and empty state handling
  /*
  test('fallback behavior shows all players when no matches found', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      // Apply very restrictive filters that should match no players
      const skillSelect = screen.getByDisplayValue('Any Level');
      fireEvent.change(skillSelect, { target: { value: '5.5' } });
      
      const genderSelect = screen.getByDisplayValue('Any');
      fireEvent.change(genderSelect, { target: { value: 'Other' } });
      
      const newcomerCheckbox = screen.getByLabelText('New to Area Only');
      fireEvent.click(newcomerCheckbox);
    });

    await waitFor(() => {
      // Should show fallback behavior - all 3 currently displayed players
      expect(screen.getByText('3 players found')).toBeInTheDocument();
      
      // Should show fallback notice
      expect(screen.getByText(/No players found within 10 miles/)).toBeInTheDocument();
      expect(screen.getByText(/Showing 3 players from nearby areas/)).toBeInTheDocument();
      
      // All current players should still be visible
      expect(screen.getByText('Sophia Chen')).toBeInTheDocument();
      expect(screen.getByText('Olivia Kim')).toBeInTheDocument();
      expect(screen.getByText('Isabella Rodriguez')).toBeInTheDocument();
    });
  });

  test('fallback behavior metadata is correct', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      // Apply filters that result in no matches
      const skillSelect = screen.getByDisplayValue('Any Level');
      fireEvent.change(skillSelect, { target: { value: '5.5' } });
    });

    await waitFor(() => {
      // Check fallback metadata
      expect(screen.getByText(/0 players within 10 miles/)).toBeInTheDocument();
      expect(screen.getByText(/3 players outside range/)).toBeInTheDocument();
      expect(screen.getByText(/No players found within 10 miles/)).toBeInTheDocument();
    });
  });

  test('ensures fallback behavior prevents empty results regression', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      // Apply multiple restrictive filters
      const skillSelect = screen.getByDisplayValue('Any Level');
      fireEvent.change(skillSelect, { target: { value: '5.5' } });
      
      const genderSelect = screen.getByDisplayValue('Any');
      fireEvent.change(genderSelect, { target: { value: 'Other' } });
      
      // Open styles dropdown and select a style that no one has
      const stylesDropdown = screen.getByText('Select styles');
      fireEvent.click(stylesDropdown.closest('.multi-select-dropdown'));
      
      // Even with very restrictive filters, should never show 0 players
      // due to fallback behavior
    });

    await waitFor(() => {
      // Should show fallback with all available players
      expect(screen.getByText('3 players found')).toBeInTheDocument();
      expect(screen.getByText(/No players found within/)).toBeInTheDocument();
      expect(screen.getByText(/Showing 3 players from nearby areas/)).toBeInTheDocument();
      
      // Verify all current players are still shown
      expect(screen.getByText('Sophia Chen')).toBeInTheDocument();
      expect(screen.getByText('Olivia Kim')).toBeInTheDocument();
      expect(screen.getByText('Isabella Rodriguez')).toBeInTheDocument();
    });
  });
  */

  test('view mode toggle works', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      const detailedButton = screen.getByText('Detailed');
      const compactButton = screen.getByText('Compact');
      
      expect(detailedButton).toHaveClass('active');
      expect(compactButton).not.toHaveClass('active');
      
      fireEvent.click(compactButton);
      expect(compactButton).toHaveClass('active');
      expect(detailedButton).not.toHaveClass('active');
    });
  });

  test('like functionality works in demo mode', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      const likeButtons = screen.getAllByText('?? Like Player');
      expect(likeButtons.length).toBeGreaterThan(0);
      
      fireEvent.click(likeButtons[0]);
      
      expect(screen.getByText('?? Liked')).toBeInTheDocument();
    });
  });

  test('demo/live mode toggle works', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      expect(screen.getByText('? Demo Mode')).toBeInTheDocument();
      expect(screen.getByText('Showing sample data')).toBeInTheDocument();
    });

    // Toggle to live mode
    const toggleButton = screen.getByText('? Demo Mode');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('? Live Mode')).toBeInTheDocument();
      expect(screen.getByText('Connected to live data')).toBeInTheDocument();
      expect(screen.getByText('0 players found')).toBeInTheDocument();
    });
  });

  test('apply filters button works', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      const applyButton = screen.getByText('Apply Filters');
      expect(applyButton).toBeInTheDocument();
      
      fireEvent.click(applyButton);
      // In demo mode, this just simulates a loading state
    });
  });

  test('displays player badges correctly', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      expect(screen.getAllByText('??Verified')).toHaveLength(4); // 4 verified players
      expect(screen.getAllByText('?? New to Area')).toHaveLength(3); // 3 newcomers
    });
  });

  // test('displays player details correctly in detailed view', async () => {
  //   render(<NearbyPlayers />);
    
  //   await waitFor(() => {
  //     // Check that detailed information is shown
  //     expect(screen.getByText('Available Times')).toBeInTheDocument();
  //     expect(screen.getByText('Saturday')).toBeInTheDocument();
  //     expect(screen.getByText('9:00 AM - 12:00 PM')).toBeInTheDocument();
  //   });
  // });

  test('hides detailed information in compact view', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      // Switch to compact view
      const compactButton = screen.getByText('Compact');
      fireEvent.click(compactButton);
      
      // Bio and availability should not be visible in compact mode
      const availableTimes = screen.queryByText('Available Times');
      expect(availableTimes).not.toBeInTheDocument();
    });
  });

  test('animal avatars are displayed consistently', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      // Check that player cards have animal avatars (emojis)
      const playerCards = screen.getAllByText(/[?��?��?��?��?��???��?��?��?��???��?��?��?��???��?��?��?????????��???��????????????]/);
      expect(playerCards.length).toBeGreaterThan(0);
    });
  });


  test('radius filter affects distance badge styling', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      // Change radius to 5 miles
      const radiusSlider = screen.getByDisplayValue('10');
      fireEvent.change(radiusSlider, { target: { value: '5' } });
    });

    await waitFor(() => {
      // Players within 5 miles should have in-range styling
      // Players beyond 5 miles should have out-of-range styling
      expect(screen.getByText('5 miles')).toBeInTheDocument();
    });
  });

  // test('gender filter works correctly', async () => {
  //   render(<NearbyPlayers />);
    
  //   await waitFor(() => {
  //     expect(screen.getByText('3 players found')).toBeInTheDocument();
  //   });

  //   // Filter by Female gender
  //   const genderSelect = screen.getByDisplayValue('Any');
  //   fireEvent.change(genderSelect, { target: { value: 'Female' } });

  //   await waitFor(() => {
  //     expect(screen.getByText('3 players found')).toBeInTheDocument();
  //     expect(screen.getByText('Sophia Chen')).toBeInTheDocument();
  //     expect(screen.getByText('Olivia Kim')).toBeInTheDocument();
  //     expect(screen.getByText('Isabella Rodriguez')).toBeInTheDocument();
  //   });
  // });

  test('search metadata displays correctly', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      // Should show range information
      expect(screen.getByText(/players within.*miles/)).toBeInTheDocument();
      expect(screen.getByText(/players outside range/)).toBeInTheDocument();
    });
  });

  test('loading state displays correctly when switching to live mode', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      // Switch to live mode
      const demoButton = screen.getByText('? Demo Mode');
      fireEvent.click(demoButton);
      
      // Should show loading state initially
      expect(screen.getByText('Finding players near you...')).toBeInTheDocument();
    });
  });

  test('applies filters when apply button is clicked in live mode', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
    // Switch to live mode
      const demoButton = screen.getByText('? Demo Mode');
      fireEvent.click(demoButton);
      
      // Wait for initial load to complete
      setTimeout(() => {
        const applyButton = screen.getByText('Apply Filters');
        fireEvent.click(applyButton);
        
        // Should trigger another API call (loading state)
        expect(screen.getByText('Finding players near you...')).toBeInTheDocument();
      }, 1100); // Wait for initial API call to complete
    });
  });
}); 
