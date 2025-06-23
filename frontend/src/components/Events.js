import React from 'react';
import ComingSoon from './ComingSoon';
import './Events.css';

const Events = () => {
  // Show Coming Soon message for now since this feature is not fully implemented
  return (
    <ComingSoon 
      title="Tennis Events" 
      message="Discover and join exciting tennis events in your area! From tournaments to casual rallies, find the perfect match for your skill level."
      icon="🎾"
    />
  );

  // The rest of the component code is commented out for now
  /*
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    skillLevel: '',
    eventType: '',
    newcomerFriendly: false,
    startDate: '',
    endDate: ''
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userRSVPs, setUserRSVPs] = useState({}); // Track user's RSVPs
  
  const eventTypes = ['Open Rally', 'Tournament', 'Clinic', 'Doubles', 'Singles'];
  const skillLevels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      // Build query parameters
      let queryParams = new URLSearchParams();

      if (filters.skillLevel) {
        queryParams.append('skill_level', filters.skillLevel);
      }

      if (filters.eventType) {
        queryParams.append('event_type', filters.eventType);
      }

      if (filters.newcomerFriendly) {
        queryParams.append('newcomer_friendly', 'true');
      }

      if (filters.startDate) {
        queryParams.append('start_date', filters.startDate);
      }

      if (filters.endDate) {
        queryParams.append('end_date', filters.endDate);
      }

      // Get user's location to find nearby events or use default San Francisco location
      try {
        const position = await getCurrentPosition();
        queryParams.append('latitude', position.coords.latitude);
        queryParams.append('longitude', position.coords.longitude);
        queryParams.append('radius', '25'); // 25 miles radius
      } catch (error) {
        console.warn("Couldn't get location, using default San Francisco location");
        // Default to San Francisco coordinates
        queryParams.append('latitude', '37.7749');
        queryParams.append('longitude', '-122.4194');
        queryParams.append('radius', '25');
      }

      const response = await axios.get(`/api/events?${queryParams}`);
      const eventsData = response.data.events || [];
      
      // Format dates and collect user's existing RSVPs
      const formattedEvents = eventsData.map(event => {
        const userRSVP = event.RSVPs?.find(rsvp => {
          // In a real app, check against actual user ID
          return rsvp.userName === "Player 1"; // Mock check for demo
        });
        
        if (userRSVP) {
          setUserRSVPs(prev => ({
            ...prev,
            [event.id]: userRSVP.status
          }));
        }
        
        return event;
      });
      
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
      
      // For development: use mock data if API call fails
      const mockEvents = getMockEvents();
      setEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  }, [filters.skillLevel, filters.eventType, filters.newcomerFriendly, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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

  const handleApplyFilters = () => {
    fetchEvents();
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
  };

  const handleRSVP = async (eventId, status) => {
    try {
      await axios.post(`/api/events/${eventId}/rsvp`, {
        status: status
      });
      
      // Update local state to reflect the RSVP
      setUserRSVPs(prev => ({
        ...prev,
        [eventId]: status
      }));
      
      // If we have a selected event, update it
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent(prev => ({
          ...prev,
          userRSVPStatus: status
        }));
      }
      
      alert(`You have successfully ${status.toLowerCase()}ed for this event!`);
    } catch (err) {
      console.error('Error RSVPing to event:', err);
      alert('Failed to RSVP. Please try again.');
    }
  };

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

  const getAvailableSpots = (event) => {
    const confirmedRSVPs = event.RSVPs?.filter(rsvp => rsvp.status === 'Confirmed') || [];
    return Math.max(0, event.maxPlayers - confirmedRSVPs.length);
  };

  // Mock data for development
  const getMockEvents = () => [
    {
      id: '1',
      title: 'Saturday Morning Open Rally',
      description: 'Join us for a fun morning of tennis! All skill levels welcome.',
      courtName: 'Golden Gate Park Tennis Courts',
      location: {
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94117'
      },
      startTime: new Date(Date.now() + 4 * 24 * 3600000).toISOString(), // 4 days from now
      endTime: new Date(Date.now() + 4 * 24 * 3600000 + 3 * 3600000).toISOString(), // 3 hours later
      hostName: 'Tennis Club SF',
      maxPlayers: 16,
      skillLevel: 'All Levels',
      eventType: 'Open Rally',
      isRecurring: true,
      isNewcomerFriendly: true,
      RSVPs: [
        {
          id: 'rsvp1',
          userName: 'Player 1',
          status: 'Confirmed'
        },
        {
          id: 'rsvp2',
          userName: 'Player 2',
          status: 'Confirmed'
        }
      ]
    },
    {
      id: '2',
      title: 'Tuesday Evening Doubles',
      description: 'Intermediate to advanced doubles play. Partners will be rotated throughout the event.',
      courtName: 'Mission Bay Tennis Club',
      location: {
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94158'
      },
      startTime: new Date(Date.now() + 7 * 24 * 3600000).toISOString(), // 7 days from now
      endTime: new Date(Date.now() + 7 * 24 * 3600000 + 2 * 3600000).toISOString(), // 2 hours later
      hostName: 'John Smith',
      maxPlayers: 12,
      skillLevel: 'Intermediate',
      eventType: 'Doubles',
      isRecurring: true,
      isNewcomerFriendly: false,
      RSVPs: []
    }
  ];

  if (loading) {
    return <div className="loading">Loading events...</div>;
  }

  if (error && events.length === 0) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="events-container">
      <h1>Tennis Events</h1>
      
      <div className="events-layout">
        <div className="filters-sidebar">
          <h2>Filters</h2>
          
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
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="eventType">Event Type:</label>
            <select
              id="eventType"
              name="eventType"
              value={filters.eventType}
              onChange={handleFilterChange}
            >
              <option value="">Any type</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-group">
            <label className="checkbox-item">
              <input
                type="checkbox"
                name="newcomerFriendly"
                checked={filters.newcomerFriendly}
                onChange={handleFilterChange}
              />
              <span className="checkbox-text">Newcomer Friendly</span>
            </label>
          </div>
          
          <button 
            className="apply-filters-button" 
            onClick={handleApplyFilters}
          >
            Apply Filters
          </button>
          
          <div className="events-list">
            <h3>Upcoming Events</h3>
            {events.length === 0 ? (
              <div className="no-events">No events found matching your criteria.</div>
            ) : (
              <ul>
                {events.map(event => (
                  <li 
                    key={event.id} 
                    className={`event-list-item ${selectedEvent?.id === event.id ? 'selected' : ''}`}
                    onClick={() => handleEventSelect(event)}
                  >
                    <div className="event-list-title">{event.title}</div>
                    <div className="event-list-meta">
                      <span className="event-date">{new Date(event.startTime).toLocaleDateString()}</span>
                      <span className="event-type">{event.eventType}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="event-details-section">
          {selectedEvent ? (
            <div className="event-details">
              <h2>{selectedEvent.title}</h2>
              <div className="event-host">Hosted by {selectedEvent.hostName}</div>
              
              <div className="event-badges">
                <span className="event-badge skill-level">{selectedEvent.skillLevel}</span>
                <span className="event-badge type">{selectedEvent.eventType}</span>
                {selectedEvent.isNewcomerFriendly && (
                  <span className="event-badge newcomer">Newcomer Friendly</span>
                )}
                {selectedEvent.isRecurring && (
                  <span className="event-badge recurring">Recurring</span>
                )}
              </div>
              
              <p className="event-description">{selectedEvent.description}</p>
              
              <div className="event-info-grid">
                <div className="event-info-item">
                  <span className="info-label">When:</span>
                  <span className="info-value">
                    {formatDateTime(selectedEvent.startTime)} to {formatDateTime(selectedEvent.endTime).split(', ')[1]}
                  </span>
                </div>
                
                <div className="event-info-item">
                  <span className="info-label">Where:</span>
                  <span className="info-value">
                    {selectedEvent.courtName}<br />
                    {selectedEvent.location.city}, {selectedEvent.location.state} {selectedEvent.location.zipCode}
                  </span>
                </div>
                
                <div className="event-info-item">
                  <span className="info-label">Capacity:</span>
                  <span className="info-value">
                    {getAvailableSpots(selectedEvent)} spots available out of {selectedEvent.maxPlayers}
                  </span>
                </div>
              </div>
              
              <div className="event-rsvp-section">
                <h3>RSVP to this event</h3>
                
                {userRSVPs[selectedEvent.id] ? (
                  <div className="user-rsvp-status">
                    <p>Your RSVP status: <strong>{userRSVPs[selectedEvent.id]}</strong></p>
                    {userRSVPs[selectedEvent.id] !== 'Cancelled' && (
                      <button 
                        className="cancel-rsvp-button"
                        onClick={() => handleRSVP(selectedEvent.id, 'Cancelled')}
                      >
                        Cancel RSVP
                      </button>
                    )}
                    {userRSVPs[selectedEvent.id] === 'Cancelled' && (
                      <button 
                        className="rsvp-button"
                        onClick={() => handleRSVP(selectedEvent.id, 'Confirmed')}
                        disabled={getAvailableSpots(selectedEvent) === 0}
                      >
                        RSVP Again
                      </button>
                    )}
                  </div>
                ) : (
                  <button 
                    className="rsvp-button"
                    onClick={() => handleRSVP(selectedEvent.id, 'Confirmed')}
                    disabled={getAvailableSpots(selectedEvent) === 0}
                  >
                    {getAvailableSpots(selectedEvent) === 0 ? 'Event Full - Join Waitlist' : 'RSVP Now'}
                  </button>
                )}
              </div>
              
              <div className="event-participants">
                <h3>Participants ({selectedEvent.RSVPs?.length || 0})</h3>
                {selectedEvent.RSVPs && selectedEvent.RSVPs.length > 0 ? (
                  <div className="participants-list">
                    {selectedEvent.RSVPs.map(rsvp => (
                      <div key={rsvp.id} className="participant-item">
                        <span className="participant-name">{rsvp.userName}</span>
                        <span className={`participant-status ${rsvp.status.toLowerCase()}`}>
                          {rsvp.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-participants">Be the first to RSVP!</p>
                )}
              </div>
            </div>
          ) : (
            <div className="no-event-selected">
              <div className="placeholder-message">
                <h3>Select an event to view details</h3>
                <p>Browse the events on the left to see details and RSVP.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  */
};

export default Events; 