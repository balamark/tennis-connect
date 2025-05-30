import React, { useState, useCallback } from 'react';
import api from '../api/config';
import useFetch from '../hooks/useFetch';
import './NearbyPlayers.css';

const NearbyPlayers = () => {
  const [demoMode, setDemoMode] = useState(true); // Start in demo mode
  const [metadata, setMetadata] = useState(null); // Store search metadata
  const [filters, setFilters] = useState({
    skillLevel: '',
    gameStyles: [],
    preferredDays: [],
    radius: '10',
    isNewcomer: false,
    gender: ''
  });

  const gameStyleOptions = ['Singles', 'Doubles', 'Social', 'Competitive'];
  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const skillLevels = ['2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5+'];

  // Mock data for development with realistic tennis players (matching database seed data)
  const getMockPlayers = useCallback(() => [
    {
      id: '550e8400-e29b-41d4-a716-446655440101',
      name: 'Sarah Chen',
      skill_level: 4.5,
      game_styles: ['Singles', 'Competitive'],
      is_verified: true,
      is_new_to_area: false,
      gender: 'Female',
      photo: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=400&fit=crop&crop=face',
      bio: 'Former college player, love competitive singles and doubles. Always looking for challenging matches!',
      preferred_times: [
        { day_of_week: 'Saturday', start_time: '09:00', end_time: '12:00' },
        { day_of_week: 'Thursday', start_time: '18:00', end_time: '20:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440102',
      name: 'Mike Rodriguez',
      skill_level: 4.2,
      game_styles: ['Singles', 'Competitive'],
      is_verified: true,
      is_new_to_area: false,
      gender: 'Male',
      photo: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=400&fit=crop&crop=face',
      bio: 'Tennis coach and USTA tournament player. Happy to help beginners improve their game.',
      preferred_times: [
        { day_of_week: 'Saturday', start_time: '09:00', end_time: '12:00' },
        { day_of_week: 'Thursday', start_time: '18:00', end_time: '20:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440103',
      name: 'Emma Johnson',
      skill_level: 3.8,
      game_styles: ['Doubles', 'Social'],
      is_verified: true,
      is_new_to_area: true,
      gender: 'Female',
      photo: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop&crop=face',
      bio: 'Weekend warrior who loves doubles. New to the city and looking to meet tennis friends!',
      preferred_times: [
        { day_of_week: 'Saturday', start_time: '09:00', end_time: '12:00' },
        { day_of_week: 'Sunday', start_time: '10:00', end_time: '14:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440104',
      name: 'David Kim',
      skill_level: 4.0,
      game_styles: ['Singles', 'Doubles'],
      is_verified: true,
      is_new_to_area: false,
      gender: 'Male',
      photo: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&h=400&fit=crop&crop=face',
      bio: 'Software engineer by day, tennis enthusiast by evening. Love playing at Presidio courts.',
      preferred_times: [
        { day_of_week: 'Saturday', start_time: '09:00', end_time: '12:00' },
        { day_of_week: 'Tuesday', start_time: '18:00', end_time: '20:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440105',
      name: 'Lisa Patel',
      skill_level: 3.5,
      game_styles: ['Doubles', 'Social'],
      is_verified: true,
      is_new_to_area: false,
      gender: 'Female',
      photo: 'https://images.unsplash.com/photo-1582655008695-f3d1a00e1b1c?w=400&h=400&fit=crop&crop=face',
      bio: 'Beginner-friendly player who enjoys social tennis. Always up for a fun rally session!',
      preferred_times: [
        { day_of_week: 'Saturday', start_time: '09:00', end_time: '12:00' },
        { day_of_week: 'Sunday', start_time: '10:00', end_time: '14:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440106',
      name: 'Alex Thompson',
      skill_level: 4.3,
      game_styles: ['Singles', 'Competitive'],
      is_verified: true,
      is_new_to_area: false,
      gender: 'Male',
      photo: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=400&fit=crop&crop=face',
      bio: 'Competitive player with 15+ years experience. Looking for regular hitting partners.',
      preferred_times: [
        { day_of_week: 'Saturday', start_time: '09:00', end_time: '12:00' },
        { day_of_week: 'Tuesday', start_time: '18:00', end_time: '20:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440107',
      name: 'Maria Garcia',
      skill_level: 3.9,
      game_styles: ['Doubles', 'Social'],
      is_verified: true,
      is_new_to_area: false,
      gender: 'Female',
      photo: 'https://images.unsplash.com/photo-1552308995-2baac1ad5490?w=400&h=400&fit=crop&crop=face',
      bio: 'Tennis mom who plays while kids are at school. Love morning matches and clinics.',
      preferred_times: [
        { day_of_week: 'Saturday', start_time: '09:00', end_time: '12:00' },
        { day_of_week: 'Sunday', start_time: '10:00', end_time: '14:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440108',
      name: 'James Wilson',
      skill_level: 4.1,
      game_styles: ['Singles', 'Competitive'],
      is_verified: true,
      is_new_to_area: false,
      gender: 'Male',
      photo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face',
      bio: 'Former high school tennis captain. Enjoy both singles and doubles, prefer early morning games.',
      preferred_times: [
        { day_of_week: 'Saturday', start_time: '09:00', end_time: '12:00' },
        { day_of_week: 'Tuesday', start_time: '18:00', end_time: '20:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440109',
      name: 'Rachel Brown',
      skill_level: 3.7,
      game_styles: ['Doubles', 'Social'],
      is_verified: true,
      is_new_to_area: false,
      gender: 'Female',
      photo: 'https://images.unsplash.com/photo-1564415637254-92c6e4b0b6e3?w=400&h=400&fit=crop&crop=face',
      bio: 'Recreational player who loves the social aspect of tennis. Always down for post-game coffee!',
      preferred_times: [
        { day_of_week: 'Saturday', start_time: '09:00', end_time: '12:00' },
        { day_of_week: 'Sunday', start_time: '10:00', end_time: '14:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440110',
      name: 'Chris Lee',
      skill_level: 4.4,
      game_styles: ['Singles', 'Competitive'],
      is_verified: true,
      is_new_to_area: false,
      gender: 'Male',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      bio: 'Tournament player and tennis instructor. Available for lessons and competitive matches.',
      preferred_times: [
        { day_of_week: 'Saturday', start_time: '09:00', end_time: '12:00' },
        { day_of_week: 'Thursday', start_time: '18:00', end_time: '20:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    }
  ], []);

  // Extract complex expressions to avoid ESLint warnings
  const gameStylesString = filters.gameStyles.join(',');
  const preferredDaysString = filters.preferredDays.join(',');

  // Define the fetch function for the custom hook
  const fetchPlayersFunction = useCallback(async (location) => {
    // If in demo mode, return mock data
    if (demoMode) {
      // Add a small delay to simulate real API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return getMockPlayers();
    }

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('User not authenticated in live mode');
      throw new Error('Please log in to see nearby players');
    }

    // Build query parameters
    let queryParams = new URLSearchParams({
      latitude: location.latitude,
      longitude: location.longitude,
      radius: filters.radius
    });

    if (filters.skillLevel) {
      queryParams.append('skill_level', filters.skillLevel);
    }

    if (filters.gameStyles.length > 0) {
      queryParams.append('game_styles', gameStylesString);
    }

    if (filters.preferredDays.length > 0) {
      queryParams.append('preferred_days', preferredDaysString);
    }

    if (filters.isNewcomer) {
      queryParams.append('is_newcomer', 'true');
    }

    if (filters.gender) {
      queryParams.append('gender', filters.gender);
    }

    try {
      // Fetch players from API
      const response = await api.get(`/users/nearby?${queryParams}`);
      const data = response.data;
      
      // Store metadata for UI feedback
      if (data.metadata) {
        setMetadata(data.metadata);
      }
      
      return data.users || [];
    } catch (error) {
      console.error('API call failed in live mode:', error);
      throw new Error('Failed to load players. Please check your connection and try again.');
    }
  }, [demoMode, filters.skillLevel, gameStylesString, preferredDaysString, filters.isNewcomer, filters.gender, filters.radius, filters.gameStyles.length, filters.preferredDays.length, getMockPlayers]);

  // Use the custom hook
  const { data: players, loading, error, refetch, setData: setPlayers } = useFetch(
    fetchPlayersFunction,
    [],
    {
      useLocation: !demoMode, // Only use location when not in demo mode
      autoFetch: true
    }
  );

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFilters(prev => ({ ...prev, [name]: checked }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleGameStyleChange = (style) => {
    setFilters(prev => {
      const gameStyles = [...prev.gameStyles];
      if (gameStyles.includes(style)) {
        return { ...prev, gameStyles: gameStyles.filter(s => s !== style) };
      } else {
        return { ...prev, gameStyles: [...gameStyles, style] };
      }
    });
  };

  const handleDayChange = (day) => {
    setFilters(prev => {
      const preferredDays = [...prev.preferredDays];
      if (preferredDays.includes(day)) {
        return { ...prev, preferredDays: preferredDays.filter(d => d !== day) };
      } else {
        return { ...prev, preferredDays: [...preferredDays, day] };
      }
    });
  };

  const handleApplyFilters = () => {
    refetch();
  };

  // Note: Removed useEffect that was causing infinite loop
  // The useFetch hook will automatically refetch when fetchPlayersFunction changes
  // ESLint warnings have been resolved by extracting complex expressions and adding all dependencies

  const handleLikePlayer = async (playerId) => {
    try {
      const response = await api.post(`/users/like/${playerId}`);
      if (response.data.is_match) {
        alert(response.data.message);
      } else {
        // Update UI to show the player has been liked
        setPlayers(prev => 
          prev.map(player => 
            player.id === playerId ? { ...player, liked: true } : player
          )
        );
      }
    } catch (err) {
      console.error('Error liking player:', err);
      alert('Failed to like player. Please try again.');
    }
  };

  // Generate cartoon animal avatar based on user ID
  const getAnimalAvatar = (userId, name) => {
    const animals = [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', 
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
      '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🐺', '🐗'
    ];
    
    // Use a simple hash of the user ID to consistently pick the same animal
    const hash = userId ? userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0) : name.length;
    
    const animalIndex = Math.abs(hash) % animals.length;
    const animal = animals[animalIndex];
    
    // Create a colorful background
    const colors = [
      '#FFB6C1', '#87CEEB', '#98FB98', '#F0E68C', '#DDA0DD',
      '#F4A460', '#87CEFA', '#90EE90', '#FFE4B5', '#D8BFD8'
    ];
    const colorIndex = Math.abs(hash) % colors.length;
    const bgColor = colors[colorIndex];
    
    // Return a simple data URL with URL encoding instead of base64
    const svg = `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="150" height="150" fill="${bgColor}"/><text x="75" y="85" font-size="60" text-anchor="middle" dominant-baseline="middle">${animal}</text></svg>`;
    
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  // Helper function to format time from various formats
  const formatTime = (timeString) => {
    if (!timeString) return '00:00';
    
    // If it's already in HH:MM format, return as is
    if (/^\d{2}:\d{2}$/.test(timeString)) {
      return timeString;
    }
    
    // If it's a full timestamp (e.g., "0000-01-01T09:00:00Z"), extract time
    if (timeString.includes('T')) {
      const timePart = timeString.split('T')[1];
      if (timePart) {
        return timePart.substring(0, 5); // Get HH:MM part
      }
    }
    
    // If it's just time with seconds (e.g., "09:00:00"), remove seconds
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
      return timeString.substring(0, 5);
    }
    
    // Fallback
    return timeString;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <div>🎾 Finding tennis players near you...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <div className="error-content">
          <h2>⚠️ {error}</h2>
          {!demoMode && error.includes('log in') && (
            <div className="error-actions">
              <p>You need to be logged in to see real players near you.</p>
              <button 
                className="demo-toggle-button"
                onClick={() => setDemoMode(true)}
              >
                🎭 Switch to Demo Mode
              </button>
            </div>
          )}
          {!demoMode && error.includes('connection') && (
            <div className="error-actions">
              <p>Please check your internet connection and try again.</p>
              <button 
                className="retry-button"
                onClick={() => refetch()}
              >
                🔄 Retry
              </button>
              <button 
                className="demo-toggle-button"
                onClick={() => setDemoMode(true)}
              >
                🎭 Switch to Demo Mode
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="nearby-players-container">
      {/* Sidebar Filters */}
      <div className="filters-sidebar">
        <h2>Find Your Perfect Tennis Partner 🎾</h2>
        
        <div className="filter-group" data-filter="skill">
          <label htmlFor="skillLevel">Skill Level (NTRP)</label>
          <select
            id="skillLevel"
            name="skillLevel"
            value={filters.skillLevel}
            onChange={handleFilterChange}
          >
            <option value="">All Levels</option>
            {skillLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <div className="filter-group" data-filter="radius">
          <label htmlFor="radius">Search Radius</label>
          <input
            type="range"
            id="radius"
            name="radius"
            min="1"
            max="50"
            value={filters.radius}
            onChange={handleFilterChange}
          />
          <div className="range-display">{filters.radius} miles</div>
        </div>

        <div className="filter-group" data-filter="styles">
          <label>Game Styles</label>
          <div className="checkbox-group">
            {gameStyleOptions.map(style => (
              <label 
                key={style} 
                htmlFor={`gameStyle-${style}`}
                className={`checkbox-label ${filters.gameStyles.includes(style) ? 'checked' : ''}`}
              >
                <input
                  type="checkbox"
                  id={`gameStyle-${style}`}
                  name={`gameStyle-${style}`}
                  checked={filters.gameStyles.includes(style)}
                  onChange={() => handleGameStyleChange(style)}
                />
                {style}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group" data-filter="days">
          <label>Preferred Days</label>
          <div className="checkbox-group">
            {dayOptions.map(day => (
              <label 
                key={day} 
                htmlFor={`day-${day}`}
                className={`checkbox-label ${filters.preferredDays.includes(day) ? 'checked' : ''}`}
              >
                <input
                  type="checkbox"
                  id={`day-${day}`}
                  name={`day-${day}`}
                  checked={filters.preferredDays.includes(day)}
                  onChange={() => handleDayChange(day)}
                />
                {day.substring(0, 3)}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group" data-filter="gender">
          <label htmlFor="gender">Gender Preference</label>
          <select
            id="gender"
            name="gender"
            value={filters.gender}
            onChange={handleFilterChange}
          >
            <option value="">No Preference</option>
            <option value="Female">Women Only</option>
            <option value="Male">Men Only</option>
          </select>
        </div>

        <div className="filter-group" data-filter="newcomer">
          <label htmlFor="isNewcomer" className={`checkbox-label ${filters.isNewcomer ? 'checked' : ''}`}>
            <input
              type="checkbox"
              id="isNewcomer"
              name="isNewcomer"
              checked={filters.isNewcomer}
              onChange={handleFilterChange}
            />
            Show only newcomers to the area
          </label>
        </div>

        <button className="apply-filters-button" onClick={handleApplyFilters}>
          🔍 Apply Filters
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Players Near You</h1>
          <button 
            className={`demo-toggle-button ${demoMode ? 'demo-active' : 'live-active'}`}
            onClick={() => setDemoMode(!demoMode)}
          >
            {demoMode ? '🎭 Demo Mode - Click for Live Data' : '🌐 Live Mode - Click for Demo'}
          </button>
        </div>
        
        <div className="content-header">
          <div className="results-count">
            {players.length === 0 ? 'No players found' : `${players.length} players found`}
            {demoMode && <span className="demo-indicator"> (Demo Data)</span>}
          </div>
          
          {/* Show metadata when available */}
          {metadata && !demoMode && (
            <div className="search-metadata">
              {metadata.showing_fallback && (
                <div className="fallback-notice">
                  ⚠️ No players found within {metadata.search_radius} miles. 
                  Showing {metadata.total_users} players from a wider area - they may be willing to travel!
                </div>
              )}
              {!metadata.showing_fallback && metadata.users_out_of_range > 0 && (
                <div className="range-info">
                  📍 {metadata.users_in_range} players within {metadata.search_radius} miles, 
                  {metadata.users_out_of_range} additional players shown from wider area
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="players-list">
          {players.length === 0 ? (
            <div className="no-players">
              🎾 No players found matching your criteria. Try adjusting your filters!
            </div>
          ) : (
            players.map(player => (
              <div key={player.id} className="player-card">
                <div className="player-photo">
                  <img 
                    src={player.photo || getAnimalAvatar(player.id, player.name)} 
                    alt={player.name}
                    onError={(e) => {
                      e.target.src = getAnimalAvatar(player.id, player.name);
                    }}
                  />
                  <div className="skill-badge">{player.skill_level || 'N/A'} NTRP</div>
                </div>
                
                <div className="player-info">
                  <div className="player-header">
                    <h3>{player.name}</h3>
                  </div>
                  
                  <div className="player-badges">
                    {player.is_verified && <span className="badge verified">✓ Verified</span>}
                    {player.is_new_to_area && <span className="badge newcomer">🏠 New to Area</span>}
                  </div>
                  
                  <div className="player-details">
                    <div className="detail-item">
                      <strong>🎾</strong> {player.game_styles && player.game_styles.length > 0 ? player.game_styles.join(', ') : 'Not specified'}
                    </div>
                    <div className="detail-item">
                      <strong>📍</strong> {player.location ? `${player.location.city || 'Unknown'}, ${player.location.state || 'Unknown'}` : 'Location not specified'}
                      {player.distance && !demoMode && (
                        <span className={`distance-badge ${player.distance > parseInt(filters.radius) ? 'out-of-range' : 'in-range'}`}>
                          {player.distance.toFixed(1)} mi
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {player.bio && (
                    <div className="player-bio">
                      <p>"{player.bio}"</p>
                    </div>
                  )}
                  
                  <div className="availability">
                    <h4>Available Times</h4>
                    <ul>
                      {player.preferred_times && player.preferred_times.length > 0 ? (
                        player.preferred_times.map((time, index) => (
                          <li key={index}>
                            <span className="day">{time.day_of_week || 'Unknown'}</span>
                            <span className="time">{formatTime(time.start_time) || '00:00'} - {formatTime(time.end_time) || '00:00'}</span>
                          </li>
                        ))
                      ) : (
                        <li>
                          <span className="day">No times specified</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                
                <div className="player-actions">
                  <button 
                    className={`like-button ${player.liked ? 'liked' : ''}`}
                    onClick={() => handleLikePlayer(player.id)}
                    disabled={player.liked}
                  >
                    {player.liked ? '💚 Liked' : '💖 Like Player'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NearbyPlayers; 