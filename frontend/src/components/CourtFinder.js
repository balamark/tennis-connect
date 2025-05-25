import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './CourtFinder.css';

// Fix for default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon for courts with active players
const activeCourtIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const CourtFinder = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: 37.7749, lng: -122.4194 }); // Default: San Francisco
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [filters, setFilters] = useState({
    courtType: '',
    hasActivePlayers: false,
    isPublicOnly: false,
    amenities: [],
  });

  const courtTypeOptions = ['All', 'Hard', 'Clay', 'Grass', 'Indoor'];
  const amenityOptions = ['Lights', 'Restrooms', 'Water', 'Pro Shop', 'Lessons'];

  useEffect(() => {
    // Get user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        fetchCourts(position.coords.latitude, position.coords.longitude);
      },
      () => {
        // Fallback to default location if geolocation is not available
        fetchCourts(userLocation.lat, userLocation.lng);
      }
    );
  }, []);

  const fetchCourts = async (lat, lng) => {
    setLoading(true);
    try {
      // Build query parameters
      let queryParams = new URLSearchParams({
        latitude: lat,
        longitude: lng,
        radius: 10
      });

      if (filters.courtType && filters.courtType !== 'All') {
        queryParams.append('court_type', filters.courtType);
      }

      if (filters.hasActivePlayers) {
        queryParams.append('has_active_players', 'true');
      }

      if (filters.isPublicOnly) {
        queryParams.append('public_only', 'true');
      }

      if (filters.amenities.length > 0) {
        filters.amenities.forEach(amenity => {
          queryParams.append('amenities', amenity);
        });
      }

      const response = await axios.get(`/api/courts?${queryParams}`);
      setCourts(response.data.courts || []);
    } catch (err) {
      console.error('Error fetching courts:', err);
      setError('Failed to load tennis courts. Please try again later.');
      
      // For development: use mock data if API call fails
      setCourts(getMockCourts());
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFilters(prev => ({ ...prev, [name]: checked }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAmenityChange = (amenity) => {
    setFilters(prev => {
      const amenities = [...prev.amenities];
      if (amenities.includes(amenity)) {
        return { ...prev, amenities: amenities.filter(a => a !== amenity) };
      } else {
        return { ...prev, amenities: [...amenities, amenity] };
      }
    });
  };

  const handleApplyFilters = () => {
    fetchCourts(userLocation.lat, userLocation.lng);
  };

  const handleCourtSelect = (court) => {
    setSelectedCourt(court);
  };

  const handleCheckIn = async (courtId) => {
    try {
      const message = prompt('Add a message for other players (optional):');
      
      await axios.post(`/api/courts/checkin/${courtId}`, {
        message: message || ''
      });
      
      // Refresh court data after check-in
      fetchCourts(userLocation.lat, userLocation.lng);
      
      alert('You have successfully checked in!');
    } catch (err) {
      console.error('Error checking in:', err);
      alert('Failed to check in. Please try again.');
    }
  };

  // Mock data for development
  const getMockCourts = () => [
    {
      id: '1',
      name: 'Golden Gate Park Tennis Courts',
      description: 'Public tennis courts in Golden Gate Park',
      location: {
        latitude: 37.7694,
        longitude: -122.4862,
        zipCode: '94117',
        city: 'San Francisco',
        state: 'CA'
      },
      courtType: 'Hard',
      isPublic: true,
      amenities: ['Lights', 'Restrooms', 'Water'],
      popularity: 85,
      contactInfo: 'SF Recreation & Parks: (415) 831-5500',
      website: 'https://sfrecpark.org/770/Golden-Gate-Park-Tennis-Center',
      checkIns: [
        {
          id: 'checkin1',
          userId: 'user1',
          userName: 'Tennis Player 1',
          checkedIn: new Date(Date.now() - 30 * 60000).toISOString(),
          message: 'Looking for a singles match!'
        },
        {
          id: 'checkin2',
          userId: 'user2',
          userName: 'Tennis Player 2',
          checkedIn: new Date(Date.now() - 15 * 60000).toISOString(),
          message: 'Here for an hour, intermediate player.'
        }
      ]
    },
    {
      id: '2',
      name: 'Mission Bay Tennis Club',
      description: 'Private tennis club with multiple courts',
      location: {
        latitude: 37.7725,
        longitude: -122.3875,
        zipCode: '94158',
        city: 'San Francisco',
        state: 'CA'
      },
      courtType: 'Clay',
      isPublic: false,
      amenities: ['Lights', 'Restrooms', 'Water', 'Pro Shop', 'Lessons'],
      popularity: 75,
      contactInfo: '(415) 555-1234',
      website: 'https://example.com/missionbaytennis',
      checkIns: []
    }
  ];

  if (loading) {
    return <div className="loading">Loading courts...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="court-finder-container">
      <h1>Tennis Court Finder</h1>
      
      <div className="court-finder-layout">
        <div className="filters-section">
          <h2>Filters</h2>
          
          <div className="filter-group">
            <label>Court Type:</label>
            <select
              name="courtType"
              value={filters.courtType}
              onChange={handleFilterChange}
            >
              {courtTypeOptions.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Amenities:</label>
            <div className="checkbox-group">
              {amenityOptions.map(amenity => (
                <label key={amenity} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(amenity)}
                    onChange={() => handleAmenityChange(amenity)}
                  />
                  {amenity}
                </label>
              ))}
            </div>
          </div>
          
          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPublicOnly"
                checked={filters.isPublicOnly}
                onChange={handleFilterChange}
              />
              Public courts only
            </label>
          </div>
          
          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hasActivePlayers"
                checked={filters.hasActivePlayers}
                onChange={handleFilterChange}
              />
              Courts with active players
            </label>
          </div>
          
          <button
            className="apply-filters-button"
            onClick={handleApplyFilters}
          >
            Apply Filters
          </button>
          
          <div className="courts-list">
            <h3>Nearby Courts</h3>
            {courts.length === 0 ? (
              <div className="no-courts">No courts found matching your criteria.</div>
            ) : (
              <ul>
                {courts.map(court => (
                  <li 
                    key={court.id} 
                    className={`court-list-item ${selectedCourt?.id === court.id ? 'selected' : ''}`}
                    onClick={() => handleCourtSelect(court)}
                  >
                    <div className="court-list-name">{court.name}</div>
                    <div className="court-list-meta">
                      <span className="court-type">{court.courtType}</span>
                      {court.checkIns && court.checkIns.length > 0 && (
                        <span className="court-active-players">
                          {court.checkIns.length} active
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="map-section">
          <MapContainer 
            center={[userLocation.lat, userLocation.lng]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* User location marker */}
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>Your location</Popup>
            </Marker>
            
            {/* Court markers */}
            {courts.map(court => (
              <Marker 
                key={court.id} 
                position={[court.location.latitude, court.location.longitude]}
                icon={court.checkIns && court.checkIns.length > 0 ? activeCourtIcon : new L.Icon.Default()}
                eventHandlers={{
                  click: () => handleCourtSelect(court)
                }}
              >
                <Popup>
                  <div className="court-popup">
                    <h3>{court.name}</h3>
                    <p>{court.description}</p>
                    <p><strong>Type:</strong> {court.courtType}</p>
                    <p><strong>Public:</strong> {court.isPublic ? 'Yes' : 'No'}</p>
                    {court.checkIns && court.checkIns.length > 0 && (
                      <p><strong>Active Players:</strong> {court.checkIns.length}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        
        {selectedCourt && (
          <div className="court-details-section">
            <h2>{selectedCourt.name}</h2>
            <p className="court-description">{selectedCourt.description}</p>
            
            <div className="court-info-grid">
              <div className="court-info-item">
                <h3>Court Details</h3>
                <p><strong>Type:</strong> {selectedCourt.courtType}</p>
                <p><strong>Access:</strong> {selectedCourt.isPublic ? 'Public' : 'Private'}</p>
                <p><strong>Popularity:</strong> {selectedCourt.popularity}%</p>
                <p><strong>Amenities:</strong> {selectedCourt.amenities.join(', ')}</p>
              </div>
              
              <div className="court-info-item">
                <h3>Contact</h3>
                <p>{selectedCourt.contactInfo}</p>
                {selectedCourt.website && (
                  <p><a href={selectedCourt.website} target="_blank" rel="noopener noreferrer">Visit Website</a></p>
                )}
              </div>
            </div>
            
            <div className="check-ins-section">
              <div className="check-ins-header">
                <h3>Currently Playing</h3>
                <button 
                  className="check-in-button"
                  onClick={() => handleCheckIn(selectedCourt.id)}
                >
                  Check In
                </button>
              </div>
              
              {selectedCourt.checkIns && selectedCourt.checkIns.length > 0 ? (
                <div className="active-players-list">
                  {selectedCourt.checkIns.map(checkIn => (
                    <div key={checkIn.id} className="active-player">
                      <div className="player-name">{checkIn.userName}</div>
                      <div className="check-in-time">
                        {new Date(checkIn.checkedIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      {checkIn.message && (
                        <div className="player-message">{checkIn.message}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-active-players">No players currently checked in.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourtFinder; 