import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NearbyPlayers.css';

const NearbyPlayers = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    skillLevel: '',
    gameStyles: [],
    preferredDays: [],
    radius: '10',
    isNewcomer: false,
    gender: ''
  });

  const gameStyleOptions = ['Singles', 'Doubles', 'Competitive', 'Social'];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const skillLevels = ['2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5+'];

  useEffect(() => {
    fetchNearbyPlayers();
  }, []);

  const fetchNearbyPlayers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get user's location
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      // Build query parameters
      let queryParams = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        radius: filters.radius
      });

      if (filters.skillLevel) {
        queryParams.append('skill_level', filters.skillLevel);
      }

      if (filters.gameStyles.length > 0) {
        queryParams.append('game_styles', filters.gameStyles.join(','));
      }

      if (filters.preferredDays.length > 0) {
        queryParams.append('preferred_days', filters.preferredDays.join(','));
      }

      if (filters.isNewcomer) {
        queryParams.append('is_newcomer', 'true');
      }

      if (filters.gender) {
        queryParams.append('gender', filters.gender);
      }

      // Fetch players from API
      const response = await axios.get(`/api/users/nearby?${queryParams}`);
      setPlayers(response.data.users || []);
    } catch (err) {
      console.error('Error fetching nearby players:', err);
      setError('Failed to fetch nearby players. Please try again later.');
      
      // For development: use mock data if API call fails
      setPlayers(getMockPlayers());
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });
  };

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
    fetchNearbyPlayers();
  };

  const handleLikePlayer = async (playerId) => {
    try {
      const response = await axios.post(`/api/users/like/${playerId}`);
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

  // Mock data for development
  const getMockPlayers = () => [
    {
      id: '1',
      name: 'Alice Tennis',
      skillLevel: 3.5,
      gameStyles: ['Singles', 'Social'],
      isVerified: true,
      isNewToArea: true,
      gender: 'Female',
      preferredTimes: [
        { dayOfWeek: 'Tuesday', startTime: '17:00', endTime: '19:00' },
        { dayOfWeek: 'Sunday', startTime: '10:00', endTime: '12:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    },
    {
      id: '2',
      name: 'Bob Racket',
      skillLevel: 4.0,
      gameStyles: ['Singles', 'Doubles', 'Competitive'],
      isVerified: true,
      isNewToArea: false,
      gender: 'Male',
      preferredTimes: [
        { dayOfWeek: 'Monday', startTime: '18:00', endTime: '20:00' },
        { dayOfWeek: 'Thursday', startTime: '18:00', endTime: '20:00' }
      ],
      location: {
        city: 'San Francisco',
        state: 'CA'
      }
    }
  ];

  if (loading) {
    return <div className="loading">Loading nearby players...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="nearby-players-container">
      <h1>Players Near You</h1>
      
      <div className="filters-container">
        <h2>Filters</h2>
        
        <div className="filter-group">
          <label>Skill Level (NTRP):</label>
          <select 
            name="skillLevel" 
            value={filters.skillLevel} 
            onChange={handleFilterChange}
          >
            <option value="">Any level</option>
            {skillLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Game Style:</label>
          <div className="checkbox-group">
            {gameStyleOptions.map(style => (
              <label key={style} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.gameStyles.includes(style)}
                  onChange={() => handleGameStyleChange(style)}
                />
                {style}
              </label>
            ))}
          </div>
        </div>
        
        <div className="filter-group">
          <label>Preferred Days:</label>
          <div className="checkbox-group">
            {daysOfWeek.map(day => (
              <label key={day} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.preferredDays.includes(day)}
                  onChange={() => handleDayChange(day)}
                />
                {day.substring(0, 3)}
              </label>
            ))}
          </div>
        </div>
        
        <div className="filter-group">
          <label>Distance (miles):</label>
          <input
            type="range"
            name="radius"
            min="1"
            max="50"
            value={filters.radius}
            onChange={handleFilterChange}
          />
          <span>{filters.radius} miles</span>
        </div>
        
        <div className="filter-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="isNewcomer"
              checked={filters.isNewcomer}
              onChange={handleFilterChange}
            />
            Show only newcomers to the area
          </label>
        </div>
        
        <div className="filter-group">
          <label>Gender Filter (for safety):</label>
          <select 
            name="gender" 
            value={filters.gender} 
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            <option value="Female">Women only</option>
            <option value="Male">Men only</option>
          </select>
        </div>
        
        <button 
          className="apply-filters-button" 
          onClick={handleApplyFilters}
        >
          Apply Filters
        </button>
      </div>
      
      <div className="players-list">
        {players.length === 0 ? (
          <div className="no-players">No players found matching your criteria.</div>
        ) : (
          players.map(player => (
            <div key={player.id} className="player-card">
              <div className="player-info">
                <h3>{player.name}</h3>
                <div className="player-badges">
                  {player.isVerified && <span className="badge verified">Verified</span>}
                  {player.isNewToArea && <span className="badge newcomer">New to Area</span>}
                </div>
                <p><strong>Skill Level:</strong> {player.skillLevel} NTRP</p>
                <p><strong>Game Styles:</strong> {player.gameStyles.join(', ')}</p>
                <p><strong>Location:</strong> {player.location.city}, {player.location.state}</p>
                
                <div className="availability">
                  <h4>Preferred Times:</h4>
                  <ul>
                    {player.preferredTimes.map((time, index) => (
                      <li key={index}>
                        {time.dayOfWeek}: {time.startTime} - {time.endTime}
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
                  {player.liked ? 'Liked' : 'Like'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NearbyPlayers; 