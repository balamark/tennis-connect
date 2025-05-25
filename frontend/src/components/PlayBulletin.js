import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PlayBulletin.css';

const PlayBulletin = () => {
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExpired, setShowExpired] = useState(false);
  const [filters, setFilters] = useState({
    skillLevel: '',
    gameType: '',
    startAfter: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [newBulletin, setNewBulletin] = useState({
    title: '',
    description: '',
    location: {
      zipCode: '',
      city: '',
      state: '',
    },
    courtId: '',
    courtName: '',
    startTime: '',
    endTime: '',
    skillLevel: '',
    gameType: 'Either',
  });
  const [responseForm, setResponseForm] = useState({
    bulletinId: '',
    message: '',
  });

  const gameTypeOptions = ['Singles', 'Doubles', 'Either'];
  const skillLevels = ['2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5+'];

  useEffect(() => {
    fetchBulletins();
  }, []);

  const fetchBulletins = async () => {
    setLoading(true);
    try {
      // Build query parameters
      let queryParams = new URLSearchParams();

      if (filters.skillLevel) {
        queryParams.append('skill_level', filters.skillLevel);
      }

      if (filters.gameType) {
        queryParams.append('game_type', filters.gameType);
      }

      if (filters.startAfter) {
        const startAfterDate = new Date(filters.startAfter);
        queryParams.append('start_after', startAfterDate.toISOString());
      }

      if (showExpired) {
        queryParams.append('show_expired', 'true');
      }

      // Get user's location to find nearby bulletins
      try {
        const position = await getCurrentPosition();
        queryParams.append('latitude', position.coords.latitude);
        queryParams.append('longitude', position.coords.longitude);
        queryParams.append('radius', '25'); // 25 miles radius
      } catch (error) {
        console.error("Couldn't get location, using default search area");
      }

      const response = await axios.get(`/api/bulletins?${queryParams}`);
      setBulletins(response.data.bulletins || []);
    } catch (err) {
      console.error('Error fetching bulletins:', err);
      setError('Failed to load bulletins. Please try again later.');
      
      // For development: use mock data if API call fails
      setBulletins(getMockBulletins());
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
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    fetchBulletins();
  };

  const handleNewBulletinChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setNewBulletin(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setNewBulletin(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateBulletin = async (e) => {
    e.preventDefault();
    
    try {
      // Format dates correctly for API
      const formattedBulletin = {
        ...newBulletin,
        startTime: new Date(newBulletin.startTime).toISOString(),
        endTime: new Date(newBulletin.endTime).toISOString(),
      };
      
      await axios.post('/api/bulletins', formattedBulletin);
      
      // Reset form and fetch updated bulletins
      setNewBulletin({
        title: '',
        description: '',
        location: {
          zipCode: '',
          city: '',
          state: '',
        },
        courtId: '',
        courtName: '',
        startTime: '',
        endTime: '',
        skillLevel: '',
        gameType: 'Either',
      });
      
      setShowForm(false);
      fetchBulletins();
      
      alert('Your bulletin has been posted!');
    } catch (err) {
      console.error('Error creating bulletin:', err);
      alert('Failed to create bulletin. Please try again.');
    }
  };

  const handleShowResponseForm = (bulletinId) => {
    setResponseForm({
      bulletinId,
      message: '',
    });
  };

  const handleResponseChange = (e) => {
    setResponseForm(prev => ({
      ...prev,
      message: e.target.value
    }));
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`/api/bulletins/${responseForm.bulletinId}/respond`, {
        message: responseForm.message
      });
      
      // Reset form and fetch updated bulletins
      setResponseForm({
        bulletinId: '',
        message: '',
      });
      
      fetchBulletins();
      
      alert('Your response has been sent!');
    } catch (err) {
      console.error('Error responding to bulletin:', err);
      alert('Failed to respond. Please try again.');
    }
  };

  const handleDeleteBulletin = async (bulletinId) => {
    if (window.confirm('Are you sure you want to delete this bulletin?')) {
      try {
        await axios.delete(`/api/bulletins/${bulletinId}`);
        
        // Fetch updated bulletins
        fetchBulletins();
        
        alert('Bulletin deleted successfully!');
      } catch (err) {
        console.error('Error deleting bulletin:', err);
        alert('Failed to delete bulletin. Please try again.');
      }
    }
  };

  // Helper functions
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUserBulletin = (bulletin) => {
    // In a real app, check if the bulletin belongs to the current user
    // For now, we'll just mock this functionality
    return Math.random() > 0.7; // 30% chance it's "yours"
  };

  // Mock data for development
  const getMockBulletins = () => [
    {
      id: '1',
      userId: 'user1',
      userName: 'Alice Tennis',
      title: 'Looking for singles match this evening',
      description: 'I\'m available for a competitive singles match around 6-8pm. NTRP 4.0 player.',
      location: {
        zipCode: '94117',
        city: 'San Francisco',
        state: 'CA',
      },
      courtName: 'Anywhere in SF',
      startTime: new Date(Date.now() + 5 * 3600000).toISOString(), // 5 hours from now
      endTime: new Date(Date.now() + 7 * 3600000).toISOString(),   // 7 hours from now
      skillLevel: '4.0',
      gameType: 'Singles',
      responses: [
        {
          id: 'resp1',
          userId: 'user2',
          userName: 'Bob Racket',
          message: 'I\'m interested! I\'m 4.0 as well. Can meet at Golden Gate Park courts?',
          status: 'Pending',
          createdAt: new Date(Date.now() - 30 * 60000).toISOString(), // 30 mins ago
        }
      ],
      isActive: true,
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
    },
    {
      id: '2',
      userId: 'user3',
      userName: 'Charlie Net',
      title: 'Doubles partner needed for Saturday morning',
      description: 'Looking for a doubles partner for Saturday morning. I\'m NTRP 3.5.',
      location: {
        zipCode: '94158',
        city: 'San Francisco',
        state: 'CA',
      },
      startTime: new Date(Date.now() + 48 * 3600000).toISOString(), // 48 hours from now
      endTime: new Date(Date.now() + 52 * 3600000).toISOString(),   // 52 hours from now
      skillLevel: '3.5',
      gameType: 'Doubles',
      responses: [],
      isActive: true,
      createdAt: new Date(Date.now() - 12 * 3600000).toISOString(), // 12 hours ago
    }
  ];

  if (loading) {
    return <div className="loading">Loading bulletins...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="play-bulletin-container">
      <div className="bulletin-header">
        <h1>Looking to Play</h1>
        <button 
          className="create-bulletin-button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Post a Bulletin'}
        </button>
      </div>
      
      {showForm && (
        <div className="bulletin-form-container">
          <h2>Post a New Bulletin</h2>
          <form className="bulletin-form" onSubmit={handleCreateBulletin}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={newBulletin.title}
                onChange={handleNewBulletinChange}
                placeholder="e.g., Looking for a hitting partner this weekend"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={newBulletin.description}
                onChange={handleNewBulletinChange}
                placeholder="Provide more details about your availability and preferences"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location.zipCode">Zip Code</label>
                <input
                  type="text"
                  id="location.zipCode"
                  name="location.zipCode"
                  value={newBulletin.location.zipCode}
                  onChange={handleNewBulletinChange}
                  placeholder="e.g., 94117"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="location.city">City</label>
                <input
                  type="text"
                  id="location.city"
                  name="location.city"
                  value={newBulletin.location.city}
                  onChange={handleNewBulletinChange}
                  placeholder="e.g., San Francisco"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="location.state">State</label>
                <input
                  type="text"
                  id="location.state"
                  name="location.state"
                  value={newBulletin.location.state}
                  onChange={handleNewBulletinChange}
                  placeholder="e.g., CA"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="courtName">Preferred Court (optional)</label>
              <input
                type="text"
                id="courtName"
                name="courtName"
                value={newBulletin.courtName}
                onChange={handleNewBulletinChange}
                placeholder="e.g., Golden Gate Park Tennis Courts, or 'Any court in SF'"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">Start Time</label>
                <input
                  type="datetime-local"
                  id="startTime"
                  name="startTime"
                  value={newBulletin.startTime}
                  onChange={handleNewBulletinChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="endTime">End Time</label>
                <input
                  type="datetime-local"
                  id="endTime"
                  name="endTime"
                  value={newBulletin.endTime}
                  onChange={handleNewBulletinChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="skillLevel">Skill Level</label>
                <select
                  id="skillLevel"
                  name="skillLevel"
                  value={newBulletin.skillLevel}
                  onChange={handleNewBulletinChange}
                  required
                >
                  <option value="">Select skill level</option>
                  {skillLevels.map(level => (
                    <option key={level} value={level}>{level} NTRP</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="gameType">Game Type</label>
                <select
                  id="gameType"
                  name="gameType"
                  value={newBulletin.gameType}
                  onChange={handleNewBulletinChange}
                  required
                >
                  {gameTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button type="submit" className="submit-bulletin-button">Post Bulletin</button>
          </form>
        </div>
      )}
      
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="skillLevel">Skill Level:</label>
          <select
            id="skillLevel"
            name="skillLevel"
            value={filters.skillLevel}
            onChange={handleFilterChange}
          >
            <option value="">Any level</option>
            {skillLevels.map(level => (
              <option key={level} value={level}>{level} NTRP</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="gameType">Game Type:</label>
          <select
            id="gameType"
            name="gameType"
            value={filters.gameType}
            onChange={handleFilterChange}
          >
            <option value="">Any type</option>
            {gameTypeOptions.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="startAfter">Available After:</label>
          <input
            type="datetime-local"
            id="startAfter"
            name="startAfter"
            value={filters.startAfter}
            onChange={handleFilterChange}
          />
        </div>
        
        <div className="filter-group checkbox-filter">
          <label>
            <input
              type="checkbox"
              checked={showExpired}
              onChange={() => setShowExpired(!showExpired)}
            />
            Show expired bulletins
          </label>
        </div>
        
        <button 
          className="apply-filters-button" 
          onClick={handleApplyFilters}
        >
          Apply Filters
        </button>
      </div>
      
      <div className="bulletins-list">
        {bulletins.length === 0 ? (
          <div className="no-bulletins">
            No bulletins found matching your criteria. Create one to get started!
          </div>
        ) : (
          bulletins.map(bulletin => (
            <div 
              key={bulletin.id} 
              className={`bulletin-card ${!bulletin.isActive ? 'expired' : ''}`}
            >
              <div className="bulletin-header">
                <div className="bulletin-title-section">
                  <h3>{bulletin.title}</h3>
                  <div className="bulletin-meta">
                    <span className="bulletin-user">{bulletin.userName}</span>
                    <span className="bulletin-time">
                      Posted: {new Date(bulletin.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {isUserBulletin(bulletin) && (
                  <button
                    className="delete-bulletin-button"
                    onClick={() => handleDeleteBulletin(bulletin.id)}
                  >
                    ×
                  </button>
                )}
              </div>
              
              <div className="bulletin-details">
                <p className="bulletin-description">{bulletin.description}</p>
                
                <div className="bulletin-info-grid">
                  <div className="bulletin-info-item">
                    <span className="info-label">When:</span>
                    <span className="info-value">
                      {formatDateTime(bulletin.startTime)} - {formatDateTime(bulletin.endTime).split(', ')[1]}
                    </span>
                  </div>
                  
                  <div className="bulletin-info-item">
                    <span className="info-label">Where:</span>
                    <span className="info-value">
                      {bulletin.courtName || 'Not specified'} ({bulletin.location.city}, {bulletin.location.state})
                    </span>
                  </div>
                  
                  <div className="bulletin-info-item">
                    <span className="info-label">Skill Level:</span>
                    <span className="info-value">{bulletin.skillLevel} NTRP</span>
                  </div>
                  
                  <div className="bulletin-info-item">
                    <span className="info-label">Game Type:</span>
                    <span className="info-value">{bulletin.gameType}</span>
                  </div>
                </div>
                
                {bulletin.isActive && !isUserBulletin(bulletin) && (
                  <div className="bulletin-actions">
                    {responseForm.bulletinId === bulletin.id ? (
                      <form className="response-form" onSubmit={handleSendResponse}>
                        <textarea
                          placeholder="Write your response... (e.g., I'm interested in playing!)"
                          value={responseForm.message}
                          onChange={handleResponseChange}
                          required
                        />
                        <div className="response-form-actions">
                          <button type="submit" className="send-response-button">Send</button>
                          <button 
                            type="button" 
                            className="cancel-response-button"
                            onClick={() => setResponseForm({ bulletinId: '', message: '' })}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button 
                        className="respond-button"
                        onClick={() => handleShowResponseForm(bulletin.id)}
                      >
                        Respond
                      </button>
                    )}
                  </div>
                )}
                
                {isUserBulletin(bulletin) && bulletin.responses && bulletin.responses.length > 0 && (
                  <div className="bulletin-responses">
                    <h4>Responses ({bulletin.responses.length})</h4>
                    {bulletin.responses.map(response => (
                      <div key={response.id} className="response-card">
                        <div className="response-header">
                          <span className="response-user">{response.userName}</span>
                          <span className="response-time">
                            {new Date(response.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="response-message">{response.message}</p>
                        {response.status === 'Pending' && (
                          <div className="response-actions">
                            <button className="accept-response-button">Accept</button>
                            <button className="decline-response-button">Decline</button>
                          </div>
                        )}
                        {response.status !== 'Pending' && (
                          <div className={`response-status ${response.status.toLowerCase()}`}>
                            {response.status}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {!bulletin.isActive && (
                  <div className="bulletin-expired">
                    This bulletin has expired
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlayBulletin; 