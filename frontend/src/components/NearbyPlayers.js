import React, { useState, useCallback } from 'react';
import api from '../api/config';
import useFetch from '../hooks/useFetch';
import './NearbyPlayers.css';

const NearbyPlayers = () => {
  const [demoMode, setDemoMode] = useState(true); // Start in demo mode
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

  // Mock data for development with famous tennis players (moved outside to prevent recreation)
  const getMockPlayers = useCallback(() => [
    {
      id: '1',
      name: 'Novak Djokovic',
      skillLevel: 5.5,
      gameStyles: ['Singles', 'Competitive'],
      isVerified: true,
      isNewToArea: false,
      gender: 'Male',
      photo: 'https://images.unsplash.com/photo-1554284126-aa88f22d8b74?w=150&h=150&fit=crop&crop=face',
      bio: 'Former World No. 1, looking for competitive matches',
      preferredTimes: [
        { dayOfWeek: 'Monday', startTime: '07:00', endTime: '09:00' },
        { dayOfWeek: 'Wednesday', startTime: '07:00', endTime: '09:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '2',
      name: 'Carlos Alcaraz',
      skillLevel: 5.5,
      gameStyles: ['Singles', 'Doubles', 'Competitive'],
      isVerified: true,
      isNewToArea: true,
      gender: 'Male',
      photo: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=150&h=150&fit=crop&crop=face',
      bio: 'Rising star, eager to play with local talent',
      preferredTimes: [
        { dayOfWeek: 'Tuesday', startTime: '17:00', endTime: '19:00' },
        { dayOfWeek: 'Saturday', startTime: '10:00', endTime: '12:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '3',
      name: 'Iga Swiatek',
      skillLevel: 5.5,
      gameStyles: ['Singles', 'Competitive'],
      isVerified: true,
      isNewToArea: false,
      gender: 'Female',
      photo: 'https://images.unsplash.com/photo-1594736797933-d0f7dea99b02?w=150&h=150&fit=crop&crop=face',
      bio: 'Multiple Grand Slam champion, training in the area',
      preferredTimes: [
        { dayOfWeek: 'Thursday', startTime: '08:00', endTime: '10:00' },
        { dayOfWeek: 'Sunday', startTime: '09:00', endTime: '11:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '4',
      name: 'Jannik Sinner',
      skillLevel: 5.5,
      gameStyles: ['Singles', 'Doubles', 'Competitive'],
      isVerified: true,
      isNewToArea: true,
      gender: 'Male',
      photo: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=150&h=150&fit=crop&crop=face',
      bio: 'Italian rising star, looking for practice partners',
      preferredTimes: [
        { dayOfWeek: 'Monday', startTime: '15:00', endTime: '17:00' },
        { dayOfWeek: 'Friday', startTime: '15:00', endTime: '17:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '5',
      name: 'Aryna Sabalenka',
      skillLevel: 5.5,
      gameStyles: ['Singles', 'Competitive'],
      isVerified: true,
      isNewToArea: false,
      gender: 'Female',
      photo: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=150&h=150&fit=crop&crop=face',
      bio: 'Powerful baseline player, loves competitive tennis',
      preferredTimes: [
        { dayOfWeek: 'Wednesday', startTime: '16:00', endTime: '18:00' },
        { dayOfWeek: 'Saturday', startTime: '11:00', endTime: '13:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '6',
      name: 'Daniil Medvedev',
      skillLevel: 5.5,
      gameStyles: ['Singles', 'Competitive'],
      isVerified: true,
      isNewToArea: false,
      gender: 'Male',
      photo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=face',
      bio: 'Strategic player with unique style, enjoys long rallies',
      preferredTimes: [
        { dayOfWeek: 'Tuesday', startTime: '10:00', endTime: '12:00' },
        { dayOfWeek: 'Thursday', startTime: '10:00', endTime: '12:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '7',
      name: 'Coco Gauff',
      skillLevel: 5.0,
      gameStyles: ['Singles', 'Doubles', 'Social'],
      isVerified: true,
      isNewToArea: true,
      gender: 'Female',
      photo: 'https://images.unsplash.com/photo-1582655008695-f3d1a00e1b1c?w=150&h=150&fit=crop&crop=face',
      bio: 'Young talent with big dreams, loves meeting new players',
      preferredTimes: [
        { dayOfWeek: 'Monday', startTime: '14:00', endTime: '16:00' },
        { dayOfWeek: 'Sunday', startTime: '14:00', endTime: '16:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '8',
      name: 'Holger Rune',
      skillLevel: 5.0,
      gameStyles: ['Singles', 'Competitive'],
      isVerified: true,
      isNewToArea: true,
      gender: 'Male',
      photo: 'https://images.unsplash.com/photo-1564415637254-92c6e4b0b6e3?w=150&h=150&fit=crop&crop=face',
      bio: 'Danish talent with aggressive style, always up for a challenge',
      preferredTimes: [
        { dayOfWeek: 'Friday', startTime: '09:00', endTime: '11:00' },
        { dayOfWeek: 'Sunday', startTime: '16:00', endTime: '18:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '9',
      name: 'Elena Rybakina',
      skillLevel: 5.5,
      gameStyles: ['Singles', 'Competitive'],
      isVerified: true,
      isNewToArea: false,
      gender: 'Female',
      photo: 'https://images.unsplash.com/photo-1552308995-2baac1ad5490?w=150&h=150&fit=crop&crop=face',
      bio: 'Kazakh powerhouse with incredible serve, seeking practice',
      preferredTimes: [
        { dayOfWeek: 'Wednesday', startTime: '11:00', endTime: '13:00' },
        { dayOfWeek: 'Saturday', startTime: '08:00', endTime: '10:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '10',
      name: 'Stefanos Tsitsipas',
      skillLevel: 5.0,
      gameStyles: ['Singles', 'Doubles', 'Social'],
      isVerified: true,
      isNewToArea: false,
      gender: 'Male',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: 'Greek player with artistic style, enjoys social tennis too',
      preferredTimes: [
        { dayOfWeek: 'Thursday', startTime: '17:00', endTime: '19:00' },
        { dayOfWeek: 'Sunday', startTime: '10:00', endTime: '12:00' }
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
      console.warn('User not authenticated, showing demo data');
      return getMockPlayers();
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
      return response.data.users || [];
    } catch (error) {
      console.warn('API call failed, falling back to demo data:', error);
      return getMockPlayers();
    }
  }, [demoMode, filters.skillLevel, gameStylesString, preferredDaysString, filters.isNewcomer, filters.gender, filters.radius, filters.gameStyles.length, filters.preferredDays.length, getMockPlayers]);

  // Use the custom hook
  const { data: players, loading, error, refetch, setData: setPlayers } = useFetch(
    fetchPlayersFunction,
    [],
    {
      getMockData: getMockPlayers,
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

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <div>🎾 Finding tennis players near you...</div>
      </div>
    );
  }

  if (error) {
    return <div className="error">⚠️ {error}</div>;
  }

  return (
    <div className="nearby-players-container">
      {/* Sidebar Filters */}
      <div className="filters-sidebar">
        <h2>Find Your Perfect Tennis Partner 🎾</h2>
        
        <div className="filter-group">
          <label htmlFor="skillLevel">Skill Level (NTRP):</label>
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

        <div className="filter-group">
          <label htmlFor="radius">Search Radius:</label>
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

        <div className="filter-group">
          <fieldset>
            <legend>Game Styles:</legend>
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
          </fieldset>
        </div>

        <div className="filter-group">
          <fieldset>
            <legend>Preferred Days:</legend>
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
          </fieldset>
        </div>

        <div className="filter-group">
          <label htmlFor="gender">Gender Preference:</label>
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

        <div className="filter-group">
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
                    src={player.photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'} 
                    alt={player.name}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
                    }}
                  />
                  <div className="skill-badge">{player.skillLevel} NTRP</div>
                </div>
                
                <div className="player-info">
                  <div className="player-header">
                    <h3>{player.name}</h3>
                  </div>
                  
                  <div className="player-badges">
                    {player.isVerified && <span className="badge verified">✓ Verified</span>}
                    {player.isNewToArea && <span className="badge newcomer">🏠 New to Area</span>}
                  </div>
                  
                  <div className="player-details">
                    <div className="detail-item">
                      <strong>🎾</strong> {player.gameStyles.join(', ')}
                    </div>
                    <div className="detail-item">
                      <strong>📍</strong> {player.location.city}, {player.location.state}
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
                      {player.preferredTimes.map((time, index) => (
                        <li key={index}>
                          <span className="day">{time.dayOfWeek}</span>
                          <span className="time">{time.startTime} - {time.endTime}</span>
                        </li>
                      ))}
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