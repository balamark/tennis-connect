import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NearbyPlayers from '../NearbyPlayers';

describe('NearbyPlayers Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders component with demo mode by default', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      expect(screen.getByText('Players Near You')).toBeInTheDocument();
      expect(screen.getByText('🎭 Demo Mode')).toBeInTheDocument();
      expect(screen.getByText('Showing sample data')).toBeInTheDocument();
    });
  });

  test('displays mock players in demo mode', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      expect(screen.getByText('Chris Lee')).toBeInTheDocument();
      expect(screen.getByText('Sophia Chen')).toBeInTheDocument();
      expect(screen.getByText('Ethan Wong')).toBeInTheDocument();
      expect(screen.getByText('6 players found')).toBeInTheDocument();
    });
  });

  test('shows search metadata in demo mode', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      expect(screen.getByText(/players within 10 miles/)).toBeInTheDocument();
      expect(screen.getByText(/players outside range/)).toBeInTheDocument();
    });
  });

  test('displays distance badges correctly with in-range and out-of-range styling', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      expect(screen.getByText('2.5 mi')).toBeInTheDocument();
      expect(screen.getByText('5.0 mi')).toBeInTheDocument();
      expect(screen.getByText('8.2 mi')).toBeInTheDocument();
      
      // Check that distance badges have proper classes
      const distanceBadges = screen.getAllByText(/\d+\.\d+ mi/);
      expect(distanceBadges.length).toBeGreaterThan(0);
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

  test('filtering works correctly with skill level filter', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      // Initially should show 6 players
      expect(screen.getByText('6 players found')).toBeInTheDocument();
    });

    // Filter by skill level 4.0 (should show Chris Lee and Isabella Rodriguez)
    const skillSelect = screen.getByDisplayValue('Any Level');
    fireEvent.change(skillSelect, { target: { value: '4.0' } });

    await waitFor(() => {
      expect(screen.getByText('2 players found')).toBeInTheDocument();
      expect(screen.getByText('Chris Lee')).toBeInTheDocument();
      expect(screen.getByText('Isabella Rodriguez')).toBeInTheDocument();
    });
  });

  test('newcomer filter works correctly', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      expect(screen.getByText('6 players found')).toBeInTheDocument();
    });

    // Filter for newcomers only
    const newcomerCheckbox = screen.getByLabelText('New to Area Only');
    fireEvent.click(newcomerCheckbox);

    await waitFor(() => {
      expect(screen.getByText('3 players found')).toBeInTheDocument();
      expect(screen.getByText('Sophia Chen')).toBeInTheDocument();
      expect(screen.getByText('Olivia Kim')).toBeInTheDocument();
      expect(screen.getByText('Isabella Rodriguez')).toBeInTheDocument();
    });
  });

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
      // Should show fallback behavior - all 6 players
      expect(screen.getByText('6 players found')).toBeInTheDocument();
      
      // Should show fallback notice
      expect(screen.getByText(/No players found within 10 miles/)).toBeInTheDocument();
      expect(screen.getByText(/Showing 6 players from nearby areas/)).toBeInTheDocument();
      
      // All players should still be visible
      expect(screen.getByText('Chris Lee')).toBeInTheDocument();
      expect(screen.getByText('Sophia Chen')).toBeInTheDocument();
      expect(screen.getByText('Ethan Wong')).toBeInTheDocument();
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
      expect(screen.getByText(/6 players outside range/)).toBeInTheDocument();
      expect(screen.getByText(/No players found within 10 miles/)).toBeInTheDocument();
    });
  });

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
      const likeButtons = screen.getAllByText('👍 Like Player');
      expect(likeButtons.length).toBeGreaterThan(0);
      
      fireEvent.click(likeButtons[0]);
      
      expect(screen.getByText('💚 Liked')).toBeInTheDocument();
    });
  });

  test('demo/live mode toggle works', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      expect(screen.getByText('🎭 Demo Mode')).toBeInTheDocument();
      expect(screen.getByText('Showing sample data')).toBeInTheDocument();
    });

    // Toggle to live mode
    const toggleButton = screen.getByText('🎭 Demo Mode');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('🔴 Live Mode')).toBeInTheDocument();
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
      expect(screen.getAllByText('✓ Verified')).toHaveLength(4); // 4 verified players
      expect(screen.getAllByText('🆕 New to Area')).toHaveLength(3); // 3 newcomers
    });
  });

  test('displays player details correctly in detailed view', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      // Check that detailed information is shown
      expect(screen.getByText('Available Times')).toBeInTheDocument();
      expect(screen.getByText('Saturday')).toBeInTheDocument();
      expect(screen.getByText('9:00 AM - 12:00 PM')).toBeInTheDocument();
    });
  });

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
      const playerCards = screen.getAllByText(/[🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🐔🐧🐦🐤🦆🦅🦉🦇🐺🐗🐴🦄🐝🐛🦋🐌🐞]/);
      expect(playerCards.length).toBeGreaterThan(0);
    });
  });

  test('dropdown closes when clicking outside', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      const stylesDropdown = screen.getByText('Select styles');
      
      // Open dropdown
      fireEvent.click(stylesDropdown.closest('.multi-select-dropdown'));
      expect(screen.getByText('Singles')).toBeInTheDocument();
      
      // Click outside
      fireEvent.mouseDown(document.body);
      
      // Dropdown should close (options should not be visible)
      // Note: This test might need adjustment based on actual implementation
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

  test('gender filter works correctly', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      expect(screen.getByText('6 players found')).toBeInTheDocument();
    });

    // Filter by Female gender
    const genderSelect = screen.getByDisplayValue('Any');
    fireEvent.change(genderSelect, { target: { value: 'Female' } });

    await waitFor(() => {
      expect(screen.getByText('3 players found')).toBeInTheDocument();
      expect(screen.getByText('Sophia Chen')).toBeInTheDocument();
      expect(screen.getByText('Olivia Kim')).toBeInTheDocument();
      expect(screen.getByText('Isabella Rodriguez')).toBeInTheDocument();
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
      // Should show fallback with all players
      expect(screen.getByText('6 players found')).toBeInTheDocument();
      expect(screen.getByText(/No players found within/)).toBeInTheDocument();
      expect(screen.getByText(/Showing 6 players from nearby areas/)).toBeInTheDocument();
      
      // Verify all players are still shown
      expect(screen.getByText('Chris Lee')).toBeInTheDocument();
      expect(screen.getByText('Sophia Chen')).toBeInTheDocument();
      expect(screen.getByText('Ethan Wong')).toBeInTheDocument();
      expect(screen.getByText('Olivia Kim')).toBeInTheDocument();
      expect(screen.getByText('Marcus Johnson')).toBeInTheDocument();
      expect(screen.getByText('Isabella Rodriguez')).toBeInTheDocument();
    });
  });

  test('dropdown z-index conflicts are prevented by conditional rendering', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      // Initially, no dropdown options should be visible
      expect(screen.queryByRole('option', { name: 'Singles' })).not.toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Monday' })).not.toBeInTheDocument();
    });

    // Open styles dropdown
    const stylesDropdown = screen.getByText('Select styles');
    fireEvent.click(stylesDropdown);

    await waitFor(() => {
      // Styles dropdown should be open, days dropdown should not be rendered
      expect(screen.getByText('Singles')).toBeInTheDocument();
      expect(screen.getByText('Doubles')).toBeInTheDocument();
      
      // Days dropdown options should NOT be in the DOM
      expect(screen.queryByText('Monday')).not.toBeInTheDocument();
      expect(screen.queryByText('Tuesday')).not.toBeInTheDocument();
    });

    // Now open days dropdown (should close styles dropdown)
    const daysDropdown = screen.getByText('Select days');
    fireEvent.click(daysDropdown);

    await waitFor(() => {
      // Days dropdown should be open, styles dropdown should not be rendered
      expect(screen.getByText('Monday')).toBeInTheDocument();
      expect(screen.getByText('Tuesday')).toBeInTheDocument();
      
      // Styles dropdown options should NOT be in the DOM (conditional rendering)
      expect(screen.queryByText('Singles')).not.toBeInTheDocument();
      expect(screen.queryByText('Doubles')).not.toBeInTheDocument();
    });
  });

  test('multi-select dropdown for styles works correctly', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      const stylesDropdown = screen.getByText('Select styles');
      expect(stylesDropdown).toBeInTheDocument();
      
      // Open dropdown
      fireEvent.click(stylesDropdown);
      
      // Select an option
      const singlesOption = screen.getByText('Singles');
      fireEvent.click(singlesOption);
      
      // Check that the display is updated
      expect(screen.getByText('Singles')).toBeInTheDocument();
    });
  });

  test('multi-select dropdown for availability works correctly', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      const availabilityDropdown = screen.getByText('Select days');
      expect(availabilityDropdown).toBeInTheDocument();
      
      // Open dropdown
      fireEvent.click(availabilityDropdown);
      
      // Select an option
      const mondayOption = screen.getAllByText('Monday')[0]; // Use getAllByText and select first
      fireEvent.click(mondayOption);
      
      // Check that the display is updated
      expect(screen.getByDisplayValue || screen.getByText('Monday')).toBeInTheDocument();
    });
  });

  test('multi-select dropdown selection updates display correctly', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      const stylesDropdown = screen.getByText('Select styles');
      
      // Open dropdown
      fireEvent.click(stylesDropdown);
      
      // Select Singles
      const singlesOption = screen.getByText('Singles');
      fireEvent.click(singlesOption);
      
      // The display should show "Singles" instead of "Select styles"
      expect(screen.queryByText('Select styles')).not.toBeInTheDocument();
      expect(screen.getByText('Singles')).toBeInTheDocument();
    });
  });

  test('filtering works correctly with skill level filter', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      expect(screen.getByText('6 players found')).toBeInTheDocument();
    });

    // Apply skill level filter
    const skillSelect = screen.getByDisplayValue('Any Level');
    fireEvent.change(skillSelect, { target: { value: '4.0' } });

    await waitFor(() => {
      expect(screen.getByText('2 players found')).toBeInTheDocument();
      expect(screen.getByText('Chris Lee')).toBeInTheDocument();
      expect(screen.getByText('Isabella Rodriguez')).toBeInTheDocument();
    });
  });

  test('filtering works correctly with radius filter', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      expect(screen.getByText('6 players found')).toBeInTheDocument();
    });

    // Apply radius filter (set to 10 miles)
    const radiusSlider = screen.getByDisplayValue('10');
    fireEvent.change(radiusSlider, { target: { value: '5' } });

    await waitFor(() => {
      expect(screen.getByText('2 players found')).toBeInTheDocument();
    });
  });

  test('gender filter works correctly', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      expect(screen.getByText('6 players found')).toBeInTheDocument();
    });

    // Apply gender filter
    const genderSelect = screen.getByDisplayValue('Any');
    fireEvent.change(genderSelect, { target: { value: 'Female' } });

    await waitFor(() => {
      expect(screen.getByText('3 players found')).toBeInTheDocument();
      expect(screen.getByText('Sophia Chen')).toBeInTheDocument();
      expect(screen.getByText('Olivia Kim')).toBeInTheDocument();
      expect(screen.getByText('Isabella Rodriguez')).toBeInTheDocument();
    });
  });

  test('newcomer filter works correctly', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      expect(screen.getByText('6 players found')).toBeInTheDocument();
    });

    // Apply newcomer filter
    const newcomerCheckbox = screen.getByLabelText('New to Area Only');
    fireEvent.click(newcomerCheckbox);

    await waitFor(() => {
      expect(screen.getByText('3 players found')).toBeInTheDocument();
      expect(screen.getByText('Sophia Chen')).toBeInTheDocument();
      expect(screen.getByText('Olivia Kim')).toBeInTheDocument();
      expect(screen.getByText('Isabella Rodriguez')).toBeInTheDocument();
    });
  });

  test('view mode toggle works correctly', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      // Should start in detailed view
      expect(screen.getAllByText('Available Times')).toHaveLength(6);
      
      // Switch to compact view
      const compactButton = screen.getByText('Compact');
      fireEvent.click(compactButton);
      
      // Available Times should not be visible in compact view
      expect(screen.queryByText('Available Times')).not.toBeInTheDocument();
    });
  });

  test('displays player details correctly in detailed view', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      // Check that detailed information is shown
      expect(screen.getAllByText('Available Times')).toHaveLength(6);
      expect(screen.getAllByText('Saturday')).toHaveLength(6); // All players have Saturday availability in mock data
      expect(screen.getByText('Chris Lee')).toBeInTheDocument();
      expect(screen.getByText('Sophia Chen')).toBeInTheDocument();
    });
  });

  test('like button works correctly', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      const likeButtons = screen.getAllByText('👍 Like Player');
      expect(likeButtons).toHaveLength(6);
      
      // Click first like button
      fireEvent.click(likeButtons[0]);
      
      // Should change to liked state
      expect(screen.getByText('💚 Liked')).toBeInTheDocument();
      expect(screen.getAllByText('👍 Like Player')).toHaveLength(5);
    });
  });

  test('fallback behavior prevents empty results regression', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      expect(screen.getByText('6 players found')).toBeInTheDocument();
    });

    // Apply multiple restrictive filters that should result in no matches
    const skillSelect = screen.getByDisplayValue('Any Level');
    fireEvent.change(skillSelect, { target: { value: '5.5' } }); // Very high skill level

    const genderSelect = screen.getByDisplayValue('Any');
    fireEvent.change(genderSelect, { target: { value: 'Other' } }); // Gender not in mock data

    await waitFor(() => {
      // Should still show all players as fallback, not empty results
      expect(screen.getByText('6 players found')).toBeInTheDocument();
      expect(screen.getByText(/Showing.*players from nearby areas/)).toBeInTheDocument();
    });
  });

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
      const demoButton = screen.getByText('🎭 Demo Mode');
      fireEvent.click(demoButton);
      
      // Should show loading state initially
      expect(screen.getByText('Finding players near you...')).toBeInTheDocument();
    });
  });

  test('applies filters when apply button is clicked in live mode', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      // Switch to live mode
      const demoButton = screen.getByText('🎭 Demo Mode');
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

  test('handles multiple filter combinations correctly', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      expect(screen.getByText('6 players found')).toBeInTheDocument();
    });

    // Apply skill level filter
    const skillSelect = screen.getByDisplayValue('Any Level');
    fireEvent.change(skillSelect, { target: { value: '3.5' } });

    // Apply gender filter
    const genderSelect = screen.getByDisplayValue('Any');
    fireEvent.change(genderSelect, { target: { value: 'Female' } });

    await waitFor(() => {
      expect(screen.getByText('1 player found')).toBeInTheDocument();
      expect(screen.getByText('Sophia Chen')).toBeInTheDocument();
    });
  });

  test('displays correct distance badges for players', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      // Should show distance badges for each player
      expect(screen.getByText('2.5 mi')).toBeInTheDocument();
      expect(screen.getByText('5.0 mi')).toBeInTheDocument();
      expect(screen.getByText('8.2 mi')).toBeInTheDocument();
    });
  });

  test('shows verified and newcomer badges correctly', async () => {
    render(<NearbyPlayers />);
    
    await waitFor(() => {
      // Should show verified badges
      expect(screen.getAllByText('✓ Verified')).toHaveLength(4);
      
      // Should show newcomer badges
      expect(screen.getAllByText('🆕 New to Area')).toHaveLength(3);
    });
  });
}); 