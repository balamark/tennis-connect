import React, { useState, useEffect, useCallback } from 'react';
import './NearbyPlayers.css';
import { useDemoMode } from '../contexts/DemoModeContext';
import { getMockPlayers } from '../data/mockData';

const NearbyPlayers = () => {
  const { isDemoMode, enableDemoMode } = useDemoMode();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('compact'); // 'detailed' or 'compact'
  const [searchMetadata, setSearchMetadata] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    skillLevel: '',
    radius: 10,
    gameStyles: [],
    preferredDays: [],
    gender: '',
    isNewcomer: false
  });

  // Dropdown states for multi-select
  const [stylesDropdownOpen, setStylesDropdownOpen] = useState(false);
  const [daysDropdownOpen, setDaysDropdownOpen] = useState(false);



  // Apply filters to player list
  const applyFilters = useCallback((playerList) => {
    return playerList.filter(player => {
      if (filters.skillLevel && Math.abs(player.skillLevel - parseFloat(filters.skillLevel)) > 0.5) {
        return false;
      }
      if (filters.gameStyles.length > 0 && !filters.gameStyles.some(style => player.gameStyles.includes(style))) {
        return false;
      }
      if (filters.preferredDays.length > 0 && !filters.preferredDays.some(day => 
        player.preferredTimes.some(time => time.dayOfWeek === day)
      )) {
        return false;
      }
      if (filters.gender && player.gender !== filters.gender) {
        return false;
      }
      if (filters.isNewcomer && !player.isNewToArea) {
        return false;
      }
      return true;
    });
  }, [filters]);

  // Real API call for live mode
  const fetchNearbyPlayers = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://tennis-connect-backend-552905514167.us-central1.run.app'
          : 'http://localhost:8080');
      
      // Check if user is authenticated
      if (!token) {
        throw new Error('Please log in to view nearby players. Click "Sign In" in the top menu to get started.');
      }
      
      // Build query parameters
      const params = new URLSearchParams({
        radius: filters.radius.toString(),
        ...(filters.skillLevel && { skill_level: filters.skillLevel }),
        ...(filters.gender && { gender: filters.gender }),
        ...(filters.isNewcomer && { is_newcomer: 'true' }),
        ...(filters.gameStyles.length > 0 && { game_styles: filters.gameStyles.join(',') }),
        ...(filters.preferredDays.length > 0 && { preferred_days: filters.preferredDays.join(',') })
      });

      const response = await fetch(`${apiUrl}/api/users/nearby?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again to view nearby players.');
        } else if (response.status === 404) {
          // For 404, try to fetch all users instead of showing error
          console.log('No players found in radius, attempting to fetch all users...');
          return await fetchAllUsers(token, apiUrl);
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else if (response.status >= 500) {
          throw new Error('Server is experiencing issues. Please try again later.');
        } else {
          // For other errors, try to fetch all users as fallback
          console.log('API error, attempting to fetch all users as fallback...');
          return await fetchAllUsers(token, apiUrl);
        }
      }

      const data = await response.json();
      
      // Handle the real API response
      const realPlayers = data.users || [];
      
      // If no players found in radius, try to get all users
      if (realPlayers.length === 0) {
        console.log('No players in radius, fetching all users...');
        return await fetchAllUsers(token, apiUrl);
      }
      
      const metadata = data.metadata || {
        total_users: realPlayers.length,
        users_in_range: realPlayers.filter(p => p.distance <= filters.radius).length,
        users_out_of_range: realPlayers.filter(p => p.distance > filters.radius).length,
        search_radius: filters.radius,
        showing_fallback: false
      };

      setPlayers(realPlayers);
      setSearchMetadata(metadata);

    } catch (err) {
      console.error('Error fetching nearby players:', err);
             // Instead of showing error, try to fetch all users as final fallback
       try {
         const token = localStorage.getItem('token');
         const apiUrl = process.env.REACT_APP_API_URL || 
           (process.env.NODE_ENV === 'production' 
             ? 'https://tennis-connect-backend-552905514167.us-central1.run.app'
             : 'http://localhost:8080');
        if (token) {
          await fetchAllUsers(token, apiUrl);
          return;
        }
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
      
      setError(err.message || 'Failed to load players. Please check your connection and try again.');
      setPlayers([]);
      setSearchMetadata({
        total_users: 0,
        users_in_range: 0,
        users_out_of_range: 0,
        search_radius: filters.radius,
        showing_fallback: false
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // New function to fetch all users as fallback
  const fetchAllUsers = async (token, apiUrl) => {
    try {
      // Try to fetch all users without radius restriction
      const allUsersResponse = await fetch(`${apiUrl}/api/users/nearby?radius=1000`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (allUsersResponse.ok) {
        const allUsersData = await allUsersResponse.json();
        const allUsers = allUsersData.users || [];
        
        if (allUsers.length > 0) {
          // Apply client-side filtering for skills, gender, etc.
          const filteredUsers = allUsers.filter(user => {
            if (filters.skillLevel && user.skillLevel !== filters.skillLevel) return false;
            if (filters.gender && user.gender !== filters.gender) return false;
            if (filters.isNewcomer && !user.isNewToArea) return false;
            // Add more filters as needed
            return true;
          });

          const usersToShow = filteredUsers.length > 0 ? filteredUsers : allUsers;
          
          setPlayers(usersToShow);
          setSearchMetadata({
            total_users: usersToShow.length,
            users_in_range: usersToShow.filter(p => p.distance && p.distance <= filters.radius).length,
            users_out_of_range: usersToShow.filter(p => !p.distance || p.distance > filters.radius).length,
            search_radius: filters.radius,
            showing_fallback: true
          });
          return;
        }
      }
      
      throw new Error('No users found in database');
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      // Clear any previous error states when entering demo mode
      setError('');
      setLoading(false);
      
      const allPlayers = getMockPlayers();
      const filteredPlayers = applyFilters(allPlayers);
      
      // Implement fallback behavior: if no players found nearby, show all players
      if (filteredPlayers.length === 0) {
        setPlayers(allPlayers);
        setSearchMetadata({
          total_users: allPlayers.length,
          users_in_range: 0,
          users_out_of_range: allPlayers.length,
          search_radius: filters.radius,
          showing_fallback: true
        });
      } else {
        setPlayers(filteredPlayers);
        const inRange = filteredPlayers.filter(p => p.distance <= filters.radius).length;
        const outOfRange = filteredPlayers.filter(p => p.distance > filters.radius).length;
        
        setSearchMetadata({
          total_users: filteredPlayers.length,
          users_in_range: inRange,
          users_out_of_range: outOfRange,
          search_radius: filters.radius,
          showing_fallback: false
        });
      }
    } else {
      // In live mode, clear demo data and fetch real users from API
      setPlayers([]);
      setSearchMetadata(null);
      fetchNearbyPlayers();
    }
  }, [isDemoMode, filters, applyFilters, fetchNearbyPlayers]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMultiSelectChange = (filterName, value) => {
    setFilters(prev => {
      const currentValues = [...prev[filterName]];
      if (currentValues.includes(value)) {
        return { ...prev, [filterName]: currentValues.filter(v => v !== value) };
      } else {
        return { ...prev, [filterName]: [...currentValues, value] };
      }
    });
  };

  const handleStylesDropdownToggle = (e) => {
    e.stopPropagation();
    const newState = !stylesDropdownOpen;
    setStylesDropdownOpen(newState);
    setDaysDropdownOpen(false); // Close other dropdown
    
    // Update filter group z-index
    const filterGroup = e.target.closest('.filter-group');
    if (filterGroup) {
      if (newState) {
        filterGroup.classList.add('dropdown-open');
      } else {
        filterGroup.classList.remove('dropdown-open');
      }
    }
  };

  const handleDaysDropdownToggle = (e) => {
    e.stopPropagation();
    const newState = !daysDropdownOpen;
    setDaysDropdownOpen(newState);
    setStylesDropdownOpen(false); // Close other dropdown
    
    // Update filter group z-index
    const filterGroup = e.target.closest('.filter-group');
    if (filterGroup) {
      if (newState) {
        filterGroup.classList.add('dropdown-open');
      } else {
        filterGroup.classList.remove('dropdown-open');
      }
    }
  };

  const handleStyleOptionClick = (e, style) => {
    e.stopPropagation();
    handleMultiSelectChange('gameStyles', style);
  };

  const handleDayOptionClick = (e, day) => {
    e.stopPropagation();
    handleMultiSelectChange('preferredDays', day);
  };

  const handleApplyFilters = () => {
    if (!isDemoMode) {
      fetchNearbyPlayers();
    }
  };

  const handleLikePlayer = async (playerId) => {
    try {
      if (!isDemoMode) {
        // Make real API call to like player
        const token = localStorage.getItem('token');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
        
        await fetch(`${apiUrl}/api/users/like`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ target_user_id: playerId }),
        });
      }
      
      setPlayers(prev => prev.map(player => 
        player.id === playerId 
          ? { ...player, liked: !player.liked }
          : player
      ));
      
      console.log('Liked player:', playerId);
    } catch (error) {
      console.error('Error liking player:', error);
    }
  };

  const getAnimalAvatar = (userId, name) => {
    const animals = [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', 
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
      '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
      '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞'
    ];
    
    // Use a simple hash of the user ID to consistently assign an animal
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const animalIndex = Math.abs(hash) % animals.length;
    return animals[animalIndex];
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getSelectedItemsDisplay = (items, placeholder) => {
    if (items.length === 0) return placeholder;
    if (items.length === 1) return items[0];
    return `${items.length} selected`;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.multi-select-dropdown')) {
        setStylesDropdownOpen(false);
        setDaysDropdownOpen(false);
        // Remove dropdown-open class from all filter groups
        document.querySelectorAll('.filter-group.dropdown-open').forEach(group => {
          group.classList.remove('dropdown-open');
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Enhanced error display component
  const renderError = () => {
    if (!error) return null;

    const isAuthError = error.includes('log in') || error.includes('session has expired');
    const isServiceError = error.includes('temporarily unavailable') || error.includes('Service');
    
    return (
      <div className="error-with-suggestion">
        <div className="error-title">
          {isAuthError ? '🔐 Authentication Required' : 
           isServiceError ? '⚠️ Service Issue' : 
           '❌ Connection Error'}
        </div>
        <div className="error-message">{error}</div>
        
        {isAuthError && (
          <div className="error-actions">
            <button 
              className="error-action-button"
              onClick={() => window.location.href = '/login'}
            >
              Go to Sign In
            </button>
            <button 
              className="error-action-button secondary"
              onClick={enableDemoMode}
            >
              Switch to Demo Mode
            </button>
          </div>
        )}
        
        {isServiceError && (
          <div className="error-actions">
            <button 
              className="error-action-button"
              onClick={() => {
                setError('');
                if (!isDemoMode) {
                  fetchNearbyPlayers();
                }
              }}
            >
              Try Again
            </button>
            <button 
              className="error-action-button secondary"
              onClick={enableDemoMode}
            >
              Use Demo Mode
            </button>
          </div>
        )}
        
        {!isAuthError && !isServiceError && (
          <div className="error-actions">
            <button 
              className="error-action-button"
              onClick={() => {
                setError('');
                if (!isDemoMode) {
                  fetchNearbyPlayers();
                }
              }}
            >
              Retry
            </button>
            <button 
              className="error-action-button secondary"
              onClick={enableDemoMode}
            >
              Switch to Demo Mode
            </button>
          </div>
        )}
        
        <div className="error-suggestion">
          💡 Demo mode works offline and doesn't require a login
        </div>
      </div>
    );
  };

  return (
    <div className="nearby-players-container">
      {/* Modern Filter Sidebar */}
      <div className="filters-sidebar">
        <h2>Players Near You</h2>
        
        {/* Demo Mode Toggle - Now handled globally */}
        <div className="demo-mode-toggle">
          <div className="toggle-container">
            <div className="demo-indicator">
              {isDemoMode ? 'Showing sample players for testing' : 'Connected to live player database'}
            </div>
          </div>
        </div>

        {/* NTRP Rating Filter */}
        <div className="filter-group" data-filter="skill">
          <label>NTRP Rating</label>
          <select
            name="skillLevel"
            value={filters.skillLevel}
            onChange={handleFilterChange}
          >
            <option value="">Any Level</option>
            <option value="2.0">2.0</option>
            <option value="2.5">2.5</option>
            <option value="3.0">3.0</option>
            <option value="3.5">3.5</option>
            <option value="4.0">4.0</option>
            <option value="4.5">4.5</option>
            <option value="5.0">5.0</option>
            <option value="5.5">5.5+</option>
          </select>
        </div>

        {/* Search Radius Filter */}
        <div className="filter-group" data-filter="radius">
          <label>Search Radius</label>
          <input
            type="range"
            name="radius"
            min="1"
            max="50"
            value={filters.radius}
            onChange={handleFilterChange}
          />
          <div className="range-display">
            <span>1 mi</span>
            <span>{filters.radius} miles</span>
            <span>50 mi</span>
          </div>
        </div>

        {/* Game Style Filter - Multi-select dropdown */}
        <div className="filter-group" data-filter="styles">
          <label>Style</label>
          <div className={`multi-select-dropdown ${stylesDropdownOpen ? 'open' : ''}`}>
            <div className="multi-select-trigger" onClick={handleStylesDropdownToggle}>
              <span className={`selected-items-display ${filters.gameStyles.length > 0 ? 'has-selections' : ''}`}>
                {getSelectedItemsDisplay(filters.gameStyles, 'Select styles')}
              </span>
            </div>
            {stylesDropdownOpen && (
              <div className="multi-select-options">
                {['Singles', 'Doubles', 'Social', 'Competitive'].map(style => (
                  <div 
                    key={style} 
                    className={`multi-select-option ${filters.gameStyles.includes(style) ? 'selected' : ''}`}
                    onClick={(e) => handleStyleOptionClick(e, style)}
                  >
                    {style}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preferred Days Filter - Multi-select dropdown */}
        <div className="filter-group" data-filter="days">
          <label>Availability</label>
          <div className={`multi-select-dropdown ${daysDropdownOpen ? 'open' : ''}`}>
            <div className="multi-select-trigger" onClick={handleDaysDropdownToggle}>
              <span className={`selected-items-display ${filters.preferredDays.length > 0 ? 'has-selections' : ''}`}>
                {getSelectedItemsDisplay(filters.preferredDays, 'Select days')}
              </span>
            </div>
            {daysDropdownOpen && (
              <div className="multi-select-options">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <div 
                    key={day} 
                    className={`multi-select-option ${filters.preferredDays.includes(day) ? 'selected' : ''}`}
                    onClick={(e) => handleDayOptionClick(e, day)}
                  >
                    {day}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Gender Preference Filter */}
        <div className="filter-group" data-filter="gender">
          <label>Gender Preference</label>
          <select
            name="gender"
            value={filters.gender}
            onChange={handleFilterChange}
          >
            <option value="">Any</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Newcomer Filter */}
        <div className="filter-group" data-filter="newcomer">
          <label className="checkbox-item">
            <input
              type="checkbox"
              name="isNewcomer"
              checked={filters.isNewcomer}
              onChange={handleFilterChange}
            />
            <span className="checkbox-text">New to Area Only</span>
          </label>
        </div>

        <button className="apply-filters-button" onClick={handleApplyFilters}>
          Apply Filters
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-header">
          <div className="results-count">
            {players.length} player{players.length !== 1 ? 's' : ''} found
          </div>
          <div className="view-toggle">
            <button 
              className={`view-button ${viewMode === 'detailed' ? 'active' : ''}`}
              onClick={() => setViewMode('detailed')}
            >
              Detailed
            </button>
            <button 
              className={`view-button ${viewMode === 'compact' ? 'active' : ''}`}
              onClick={() => setViewMode('compact')}
            >
              Compact
            </button>
          </div>
        </div>

        {/* Search Metadata */}
        {searchMetadata && (
          <div className="search-metadata">
            {searchMetadata.showing_fallback && (
              <div className="fallback-notice">
                No players found within {searchMetadata.search_radius} miles. 
                Showing {searchMetadata.users_out_of_range} players from nearby areas.
              </div>
            )}
            <div className="range-info">
              {searchMetadata.users_in_range} players within {searchMetadata.search_radius} miles, 
              {searchMetadata.users_out_of_range} players outside range
            </div>
          </div>
        )}

        {/* Players List */}
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Finding players near you...</p>
          </div>
        ) : error ? (
          <div className="error">
            {renderError()}
          </div>
        ) : players.length === 0 ? (
          <div className="no-players">
            <p>No players found matching your criteria.</p>
            <p>Try adjusting your filters or expanding your search radius.</p>
          </div>
        ) : (
          <div>
            {searchMetadata?.showing_fallback && (
              <div className="fallback-notice" style={{
                background: '#e3f2fd',
                border: '1px solid #2196f3',
                borderRadius: '8px',
                padding: '12px',
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: '#1976d2'
              }}>
                <strong>📍 Expanded Search:</strong> No players found within {searchMetadata.search_radius} miles. 
                Showing all {searchMetadata.total_users} available players - some may be outside your preferred radius.
              </div>
            )}
            
            <div className={`players-list ${viewMode}`}>
              {players.map(player => (
                <div key={player.id} className="player-card">
                  {!isDemoMode && (
                    <div className={`distance-badge ${player.distance && player.distance <= filters.radius ? 'in-range' : 'out-of-range'}`}>
                      {player.distance ? `${player.distance} mi` : 'Distance N/A'}
                    </div>
                  )}
                  
                  <div className="player-photo">
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      borderRadius: '50%'
                    }}>
                      {getAnimalAvatar(player.id, player.name)}
                    </div>
                    <div className="skill-badge">{player.skillLevel}</div>
                  </div>
                  
                  <div className="player-info">
                    <h3 className="player-name">{player.name}</h3>
                    <div className="player-details">
                      <span className="location">{player.location?.city || 'Location not specified'}</span>
                      {!isDemoMode && player.distance && (
                        <span className="distance">{player.distance} miles away</span>
                      )}
                      <span className="game-styles">
                        {player.gameStyles?.join(', ') || 'Any style'}
                      </span>
                      {player.isNewToArea && (
                        <span className="newcomer-badge">New to Area</span>
                      )}
                    </div>
                    {player.bio && (
                      <p className="player-bio">{player.bio}</p>
                    )}
                  </div>
                  
                  <div className="player-actions">
                    <button 
                      className="like-button" 
                      onClick={() => handleLikePlayer(player.id)}
                      disabled={!isDemoMode && !localStorage.getItem('token')}
                    >
                      👍 Like
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyPlayers; 