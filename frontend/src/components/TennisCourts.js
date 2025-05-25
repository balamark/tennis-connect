import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/config';
import './TennisCourts.css';

const TennisCourts = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    courtType: '',
    amenities: [],
    priceRange: 'all',
    availability: 'all'
  });

  const courtTypes = ['Hard Court', 'Clay Court', 'Grass Court', 'Indoor', 'Outdoor'];
  const amenityOptions = ['Lighting', 'Pro Shop', 'Parking', 'Restrooms', 'Locker Rooms', 'Cafe', 'Equipment Rental'];

  const fetchCourts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get user's location for nearby courts or use default San Francisco location
      let latitude, longitude;
      try {
        const position = await getCurrentPosition();
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (locationError) {
        console.warn('Could not get user location, using default San Francisco location');
        // Default to San Francisco coordinates
        latitude = 37.7749;
        longitude = -122.4194;
      }

      // Build query parameters
      let queryParams = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        radius: '25' // 25 miles radius
      });

      if (filters.courtType) {
        queryParams.append('court_type', filters.courtType);
      }

      if (filters.amenities.length > 0) {
        queryParams.append('amenities', filters.amenities.join(','));
      }

      if (filters.priceRange !== 'all') {
        queryParams.append('price_range', filters.priceRange);
      }

      if (filters.availability !== 'all') {
        queryParams.append('availability', filters.availability);
      }

      // Fetch courts from API
      const response = await api.get(`/courts?${queryParams}`);
      setCourts(response.data.courts || []);
    } catch (err) {
      console.error('Error fetching courts:', err);
      setError('Failed to load tennis courts. Please try again later.');
      
      // For development: use mock data if API call fails
      setCourts(getMockCourts());
    } finally {
      setLoading(false);
    }
  }, [filters.courtType, filters.amenities, filters.priceRange, filters.availability]);

  useEffect(() => {
    fetchCourts();
  }, [fetchCourts]);

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
    fetchCourts();
  };

  const handleCheckIn = async (courtId) => {
    try {
      await api.post(`/courts/checkin/${courtId}`);
      
      // Update UI to show check-in status
      setCourts(prev => 
        prev.map(court => 
          court.id === courtId ? { ...court, checkedIn: true } : court
        )
      );
      
      alert('Successfully checked in to the court!');
    } catch (err) {
      console.error('Error checking in:', err);
      alert('Failed to check in. Please try again.');
    }
  };

  const handleCheckOut = async (courtId) => {
    try {
      await api.post(`/courts/checkout/${courtId}`);
      
      // Update UI to show check-out status
      setCourts(prev => 
        prev.map(court => 
          court.id === courtId ? { ...court, checkedIn: false } : court
        )
      );
      
      alert('Successfully checked out from the court!');
    } catch (err) {
      console.error('Error checking out:', err);
      alert('Failed to check out. Please try again.');
    }
  };

  // Mock data for development with famous tennis venues
  const getMockCourts = () => [
    {
      id: '1',
      name: 'Wimbledon All England Lawn Tennis Club',
      type: 'Grass Court',
      image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=250&fit=crop',
      address: '123 Championship Way, San Francisco, CA 94117',
      distance: '2.3 miles',
      rating: 5.0,
      pricePerHour: 150,
      amenities: ['Lighting', 'Pro Shop', 'Parking', 'Restrooms', 'Locker Rooms', 'Cafe'],
      description: 'Experience the prestige of grass court tennis at our Wimbledon-inspired facility.',
      availability: 'Available',
      courts: 8,
      checkedIn: false,
      features: ['Championship grass courts', 'Professional maintenance', 'Historic atmosphere'],
      contact: {
        phone: '(415) 555-0123',
        email: 'info@wimbledonsf.com',
        website: 'www.wimbledonsf.com'
      }
    },
    {
      id: '2',
      name: 'Roland Garros Clay Courts',
      type: 'Clay Court',
      image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400&h=250&fit=crop',
      address: '456 French Open Blvd, San Francisco, CA 94158',
      distance: '3.1 miles',
      rating: 4.9,
      pricePerHour: 120,
      amenities: ['Lighting', 'Pro Shop', 'Parking', 'Restrooms', 'Equipment Rental'],
      description: 'Authentic red clay courts that replicate the French Open experience.',
      availability: 'Available',
      courts: 12,
      checkedIn: false,
      features: ['Authentic red clay surface', 'European-style facilities', 'Professional coaching'],
      contact: {
        phone: '(415) 555-0124',
        email: 'info@rolandgarrossf.com',
        website: 'www.rolandgarrossf.com'
      }
    },
    {
      id: '3',
      name: 'US Open Hard Courts',
      type: 'Hard Court',
      image: 'https://images.unsplash.com/photo-1554284126-aa88f22d8b74?w=400&h=250&fit=crop',
      address: '789 Arthur Ashe Ave, San Francisco, CA 94105',
      distance: '1.8 miles',
      rating: 4.8,
      pricePerHour: 100,
      amenities: ['Lighting', 'Pro Shop', 'Parking', 'Restrooms', 'Locker Rooms', 'Cafe', 'Equipment Rental'],
      description: 'State-of-the-art hard courts with the same surface used at the US Open.',
      availability: 'Available',
      courts: 16,
      checkedIn: false,
      features: ['DecoTurf surface', 'Stadium lighting', 'Professional tournaments'],
      contact: {
        phone: '(415) 555-0125',
        email: 'info@usopensf.com',
        website: 'www.usopensf.com'
      }
    },
    {
      id: '4',
      name: 'Australian Open Courts',
      type: 'Hard Court',
      image: 'https://images.unsplash.com/photo-1594736797933-d0f7dea99b02?w=400&h=250&fit=crop',
      address: '321 Melbourne Park Dr, San Francisco, CA 94102',
      distance: '4.2 miles',
      rating: 4.7,
      pricePerHour: 110,
      amenities: ['Lighting', 'Pro Shop', 'Parking', 'Restrooms', 'Cafe'],
      description: 'Modern hard courts with retractable roofs for all-weather play.',
      availability: 'Busy',
      courts: 10,
      checkedIn: false,
      features: ['Retractable roof', 'Climate control', 'Modern facilities'],
      contact: {
        phone: '(415) 555-0126',
        email: 'info@ausopensf.com',
        website: 'www.ausopensf.com'
      }
    },
    {
      id: '5',
      name: 'Golden Gate Park Tennis Center',
      type: 'Outdoor',
      image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=250&fit=crop',
      address: '555 Golden Gate Park, San Francisco, CA 94117',
      distance: '2.7 miles',
      rating: 4.5,
      pricePerHour: 45,
      amenities: ['Lighting', 'Parking', 'Restrooms'],
      description: 'Beautiful outdoor courts surrounded by the natural beauty of Golden Gate Park.',
      availability: 'Available',
      courts: 6,
      checkedIn: false,
      features: ['Scenic location', 'Public access', 'Well-maintained courts'],
      contact: {
        phone: '(415) 555-0127',
        email: 'info@ggptennis.com',
        website: 'www.ggptennis.com'
      }
    },
    {
      id: '6',
      name: 'Presidio Tennis Club',
      type: 'Indoor',
      image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&h=250&fit=crop',
      address: '888 Presidio Blvd, San Francisco, CA 94129',
      distance: '3.5 miles',
      rating: 4.6,
      pricePerHour: 85,
      amenities: ['Pro Shop', 'Parking', 'Restrooms', 'Locker Rooms', 'Cafe', 'Equipment Rental'],
      description: 'Premium indoor facility with climate-controlled courts and luxury amenities.',
      availability: 'Available',
      courts: 8,
      checkedIn: false,
      features: ['Climate controlled', 'Premium facilities', 'Professional instruction'],
      contact: {
        phone: '(415) 555-0128',
        email: 'info@presidiotennis.com',
        website: 'www.presidiotennis.com'
      }
    }
  ];

  if (loading) {
    return <div className="loading">Loading tennis courts...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="tennis-courts-container">
      <h1>🎾 Tennis Courts Near You</h1>
      
      <div className="filters-container">
        <h2>Find Your Perfect Court</h2>
        
        <div className="filter-group">
          <label>Court Type:</label>
          <select 
            name="courtType" 
            value={filters.courtType} 
            onChange={handleFilterChange}
          >
            <option value="">All types</option>
            {courtTypes.map(type => (
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
          <label>Price Range:</label>
          <select 
            name="priceRange" 
            value={filters.priceRange} 
            onChange={handleFilterChange}
          >
            <option value="all">All prices</option>
            <option value="budget">Budget ($20-50/hr)</option>
            <option value="mid">Mid-range ($50-100/hr)</option>
            <option value="premium">Premium ($100+/hr)</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Availability:</label>
          <select 
            name="availability" 
            value={filters.availability} 
            onChange={handleFilterChange}
          >
            <option value="all">All courts</option>
            <option value="available">Available now</option>
            <option value="busy">Show busy courts</option>
          </select>
        </div>
        
        <button 
          className="apply-filters-button" 
          onClick={handleApplyFilters}
        >
          Apply Filters
        </button>
      </div>
      
      <div className="courts-list">
        {courts.length === 0 ? (
          <div className="no-courts">No courts found matching your criteria.</div>
        ) : (
          courts.map(court => (
            <div key={court.id} className="court-card">
              <div className="court-image">
                <img 
                  src={court.image} 
                  alt={court.name}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=250&fit=crop';
                  }}
                />
                <div className="court-status">
                  <span className={`status-badge ${court.availability.toLowerCase()}`}>
                    {court.availability}
                  </span>
                </div>
              </div>
              
              <div className="court-info">
                <div className="court-header">
                  <h3>{court.name}</h3>
                  <div className="court-rating">
                    <span className="stars">{'★'.repeat(Math.floor(court.rating))}</span>
                    <span className="rating-number">{court.rating}</span>
                  </div>
                </div>
                
                <div className="court-details">
                  <p className="court-type">🏟️ {court.type}</p>
                  <p className="court-address">📍 {court.address}</p>
                  <p className="court-distance">📏 {court.distance} away</p>
                  <p className="court-price">💰 ${court.pricePerHour}/hour</p>
                  <p className="court-count">🎾 {court.courts} courts available</p>
                </div>
                
                <div className="court-description">
                  <p>{court.description}</p>
                </div>
                
                <div className="court-features">
                  <h4>Features:</h4>
                  <ul>
                    {court.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="court-amenities">
                  <h4>Amenities:</h4>
                  <div className="amenities-list">
                    {court.amenities.map((amenity, index) => (
                      <span key={index} className="amenity-tag">{amenity}</span>
                    ))}
                  </div>
                </div>
                
                <div className="court-contact">
                  <h4>Contact:</h4>
                  <p>📞 {court.contact.phone}</p>
                  <p>✉️ {court.contact.email}</p>
                  <p>🌐 {court.contact.website}</p>
                </div>
              </div>
              
              <div className="court-actions">
                {court.checkedIn ? (
                  <button 
                    className="checkout-button"
                    onClick={() => handleCheckOut(court.id)}
                  >
                    Check Out
                  </button>
                ) : (
                  <button 
                    className="checkin-button"
                    onClick={() => handleCheckIn(court.id)}
                    disabled={court.availability === 'Busy'}
                  >
                    {court.availability === 'Busy' ? 'Court Busy' : 'Check In'}
                  </button>
                )}
                <button 
                  className="book-button"
                  onClick={() => alert('Court booking feature coming soon! Please contact the court directly for now.')}
                >
                  Book Court
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TennisCourts; 