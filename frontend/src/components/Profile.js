import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/config';
import './Profile.css';
import Modal from './Modal';

const Profile = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  
  // Common cities for easy selection with flags
  const commonCities = [
    { name: 'Taipei', flag: '🇹🇼' },
    { name: 'Taitung', flag: '🇹🇼' },
    { name: 'Luye', flag: '🇹🇼' },
    { name: 'Paris', flag: '🇫🇷' },
    { name: 'Frankfurt', flag: '🇩🇪' },
    { name: 'Queenstown', flag: '🇳🇿' },
    { name: 'Auckland', flag: '🇳🇿' }
  ];
  
  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });
  
  // Submission loading state
  const [submitting, setSubmitting] = useState(false);
  
  const gameStyles = [
    { key: 'Singles', label: t('nearbyPlayers.gameStyles.singles') },
    { key: 'Doubles', label: t('nearbyPlayers.gameStyles.doubles') },
    { key: 'Competitive', label: t('nearbyPlayers.gameStyles.competitive') },
    { key: 'Social', label: t('nearbyPlayers.gameStyles.social') }
  ];
  const skillLevels = ['2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5+'];
  const daysOfWeek = [
    { key: 'Monday', label: t('profile.monday') },
    { key: 'Tuesday', label: t('profile.tuesday') },
    { key: 'Wednesday', label: t('profile.wednesday') },
    { key: 'Thursday', label: t('profile.thursday') },
    { key: 'Friday', label: t('profile.friday') },
    { key: 'Saturday', label: t('profile.saturday') },
    { key: 'Sunday', label: t('profile.sunday') }
  ];

  // Helper function to format time from various formats
  const formatTime = (timeString) => {
    console.log('Formatting time:', timeString, typeof timeString);
    
    if (!timeString || timeString === null || timeString === undefined) {
      console.log('Time is null/undefined, returning 00:00');
      return '00:00';
    }
    
    // Convert to string if it's not already
    const timeStr = String(timeString);
    
    // If it's already in HH:MM format, return as is
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      return timeStr.padStart(5, '0'); // Ensure it's HH:MM format
    }
    
    // If it's a full timestamp (e.g., "0000-01-01T09:00:00Z"), extract time
    if (timeStr.includes('T')) {
      const timePart = timeStr.split('T')[1];
      if (timePart) {
        return timePart.substring(0, 5); // Get HH:MM part
      }
    }
    
    // If it's just time with seconds (e.g., "09:00:00"), remove seconds
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr.substring(0, 5);
    }
    
    // If it's a number (minutes from midnight), convert to HH:MM
    const timeNum = Number(timeStr);
    if (!isNaN(timeNum)) {
      const hours = Math.floor(timeNum / 60);
      const minutes = timeNum % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Fallback - if we get here, something's wrong with the data
    console.warn('Unable to format time:', timeString, 'returning 00:00');
    return '00:00';
  };

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      // Get user ID from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      const response = await api.get(`/users/profile/${user.id}`);
      const profileData = {
        ...response.data,
        gameStyles: response.data.game_styles || [],
        preferredTimes: response.data.preferred_times || [],
        location: response.data.location || { latitude: 0, longitude: 0, zipCode: '', city: '', state: '' },
        skillLevel: response.data.skill_level ? response.data.skill_level.toString() : '',
        isNewToArea: response.data.is_new_to_area || false,
        isVerified: response.data.is_verified || false
      };
      setProfile(profileData);
      
      // Initialize form data with current profile
      setFormData(profileData);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle city selection from suggestions
  const handleCitySelect = (city) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        city,
        // Clear coordinates so backend will geocode the new city
        latitude: 0,
        longitude: 0
      }
    }));
    setShowCitySuggestions(false);
  };
  
  // Handle manual city input changes
  const handleCityChange = (e) => {
    const city = e.target.value;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        city,
        // Clear coordinates when city changes manually so backend will geocode
        latitude: city !== prev.location.city ? 0 : prev.location.latitude,
        longitude: city !== prev.location.city ? 0 : prev.location.longitude
      }
    }));
  };
  
  // Get user's current location
  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              latitude,
              longitude
            }
          }));
          // Try to get city name from coordinates using reverse geocoding
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
            .then(response => response.json())
            .then(data => {
              if (data.city || data.locality) {
                setFormData(prev => ({
                  ...prev,
                  location: {
                    ...prev.location,
                    city: data.city || data.locality
                  }
                }));
              }
            })
            .catch(err => console.error('Reverse geocoding failed:', err));
          setLocationLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setModalState({
            isOpen: true,
            type: 'error',
            title: 'Location Error',
            message: 'Unable to get your location. Please enter your city manually.'
          });
          setLocationLoading(false);
        }
      );
    } else {
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Location Not Supported',
        message: 'Geolocation is not supported by this browser.'
      });
      setLocationLoading(false);
    }
  };

  const handleGameStyleChange = (style) => {
    setFormData(prev => {
      const styles = [...(prev.gameStyles || [])];
      if (styles.includes(style)) {
        return { ...prev, gameStyles: styles.filter(s => s !== style) };
      } else {
        return { ...prev, gameStyles: [...styles, style] };
      }
    });
  };

  const handleTimeSlotChange = (index, field, value) => {
    setFormData(prev => {
      const timeSlots = [...prev.preferredTimes];
      timeSlots[index] = { ...timeSlots[index], [field]: value };
      return { ...prev, preferredTimes: timeSlots };
    });
  };

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      preferredTimes: [
        ...prev.preferredTimes,
        { dayOfWeek: 'Monday', startTime: '09:00', endTime: '11:00' }
      ]
    }));
  };

  const removeTimeSlot = (index) => {
    setFormData(prev => ({
      ...prev,
      preferredTimes: prev.preferredTimes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check authentication first
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user.id) {
      setModalState({
        isOpen: true,
        type: 'error',
        title: t('profile.authRequired'),
        message: t('profile.loginToUpdate')
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Prepare data for API - convert to snake_case field names
      const submitData = {
        name: formData.name,
        bio: formData.bio || '',
        skill_level: parseFloat(formData.skillLevel),
        game_styles: formData.gameStyles || [],
        preferred_times: (formData.preferredTimes || []).map(time => ({
          day_of_week: time.dayOfWeek,
          start_time: time.startTime,
          end_time: time.endTime
        })),
        is_new_to_area: formData.isNewToArea || false,
        gender: formData.gender || '',
        location: {
          latitude: formData.location?.latitude || 0,
          longitude: formData.location?.longitude || 0,
          zip_code: formData.location?.zipCode || '',
          city: formData.location?.city || '',
          state: formData.location?.state || ''
        }
      };
      
      console.log('Submitting profile data:', submitData);
      
      await api.put('/users/profile', submitData);
      
      // Update local profile
      setProfile(formData);
      setEditing(false);
      
      // Show success modal
      setModalState({
        isOpen: true,
        type: 'success',
        title: t('common.success'),
        message: t('profile.profileUpdated')
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      
      let errorMessage = t('profile.updateFailed');
      
      if (err.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid profile data. Please check your inputs.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      // Show error modal
      setModalState({
        isOpen: true,
        type: 'error',
        title: t('common.error'),
        message: errorMessage
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  if (error && !profile) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>{t('profile.title')}</h1>
        {!editing && (
          <button 
            className="edit-profile-button"
            onClick={() => setEditing(true)}
          >
            {t('profile.editProfile')}
          </button>
        )}
      </div>
      
      {!editing ? (
        <div className="profile-view">
          <div className="profile-info-grid">
            <div className="profile-info-card">
              <h2>{t('profile.personalInformation')}</h2>
              <div className="profile-info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{profile.name}</span>
              </div>
              <div className="profile-info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{profile.email}</span>
              </div>
              <div className="profile-info-row">
                <span className="info-label">Location:</span>
                <span className="info-value">{profile.location.city}, {profile.location.state} {profile.location.zipCode}</span>
              </div>
              {profile.gender && (
                <div className="profile-info-row">
                  <span className="info-label">Gender:</span>
                  <span className="info-value">{profile.gender}</span>
                </div>
              )}
              <div className="profile-badges">
                {profile.isVerified && <span className="badge verified">Verified Player</span>}
                {profile.isNewToArea && <span className="badge newcomer">New to Area</span>}
              </div>
            </div>
            
            <div className="profile-info-card">
              <h2>{t('profile.tennisInformation')}</h2>
              <div className="profile-info-row">
                <span className="info-label">Skill Level:</span>
                <span className="info-value">
                  {profile.skillLevel ? `${profile.skillLevel} NTRP` : 'Not specified'}
                </span>
              </div>
              <div className="profile-info-row">
                <span className="info-label">Game Styles:</span>
                <span className="info-value">
                  {profile.gameStyles && profile.gameStyles.length > 0 
                    ? profile.gameStyles.join(', ') 
                    : 'Not specified'
                  }
                </span>
              </div>
              {profile.bio && (
                <div className="profile-bio">
                  <h3>Bio</h3>
                  <p>{profile.bio}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="profile-availability">
            <h2>{t('profile.preferredPlayingTime')}</h2>
            {(() => {
              console.log('Profile preferred times:', profile.preferredTimes);
              return null;
            })()}
            {!profile.preferredTimes || profile.preferredTimes.length === 0 ? (
              <p>No preferred times set.</p>
            ) : (
              <div className="time-slots-grid">
                {profile.preferredTimes.map((timeSlot, index) => {
                  console.log(`Time slot ${index}:`, timeSlot);
                  return (
                    <div key={index} className="time-slot-card">
                      <h3>{timeSlot.dayOfWeek || timeSlot.day_of_week || 'Unknown Day'}</h3>
                      <p>{formatTime(timeSlot.startTime || timeSlot.start_time)} - {formatTime(timeSlot.endTime || timeSlot.end_time)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick City Explorer */}
          <div className="profile-city-explorer">
            <h2>🌍 {t('profile.exploreOtherCities')}</h2>
            <p className="explorer-description">
              Discover tennis communities in popular cities around the world
            </p>
            <div className="city-explorer-buttons">
              {commonCities.filter(city => city.name !== profile.location?.city).map(city => (
                <button
                  key={city.name}
                  className="city-explorer-button"
                  onClick={() => {
                    // Navigate to nearby players with city filter
                    window.location.href = `/nearby-players?explore=${encodeURIComponent(city.name)}`;
                  }}
                >
                  <span className="city-name">{city.name}</span>
                  <span className="city-icon">{city.flag}</span>
                </button>
              ))}
            </div>
            <div className="explorer-hint">
              💡 Click any city to see tennis players there
            </div>
          </div>
        </div>
      ) : (
        <div className="profile-form-container">
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>{t('profile.personalInformation')}</h2>
              <div className="form-group">
                <label htmlFor="name">{t('profile.name')}</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">{t('profile.email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled // Email cannot be changed
                />
              </div>
              
              {/* City Field - Required for finding nearby players */}
              <div className="form-group">
                <label htmlFor="location.city">
                  City <span className="required">*</span>
                  <small className="field-hint">Used to find nearby tennis players</small>
                </label>
                <div className="city-input-container">
                  <input
                    type="text"
                    id="location.city"
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleCityChange}
                    onFocus={() => setShowCitySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                    placeholder="Enter your city"
                    required
                  />
                  <button
                    type="button"
                    className="location-button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    title="Use current location"
                  >
                    {locationLoading ? '📍' : '🎯'}
                  </button>
                </div>
                
                {/* City Suggestions */}
                {showCitySuggestions && (
                  <div className="city-suggestions">
                    <div className="suggestions-header">Popular cities:</div>
                    {commonCities.map(city => (
                      <button
                        key={city.name}
                        type="button"
                        className="city-suggestion"
                        onClick={() => handleCitySelect(city.name)}
                      >
                        {city.flag} {city.name}
                      </button>
                    ))}
                  </div>
                )}
                
                <small className="form-text text-muted">
                  💡 Your city helps us connect you with nearby players. You can use the location button to auto-detect.
                </small>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location.zipCode">Zip Code (optional)</label>
                  <input
                    type="text"
                    id="location.zipCode"
                    name="location.zipCode"
                    value={formData.location.zipCode}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="location.state">State (optional)</label>
                  <input
                    type="text"
                    id="location.state"
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="gender">Gender (for safety filters)</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Prefer not to say</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    name="isNewToArea"
                    checked={formData.isNewToArea}
                    onChange={handleChange}
                  />
                  <span className="checkbox-text">I'm new to the area and looking to meet players</span>
                </label>
              </div>
            </div>
            
            <div className="form-section">
              <h2>{t('profile.tennisInformation')}</h2>
              
              <div className="form-group">
                <label htmlFor="skillLevel">{t('profile.skillLevel')}</label>
                <select
                  id="skillLevel"
                  name="skillLevel"
                  value={formData.skillLevel}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select your skill level</option>
                  {skillLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <fieldset>
                  <legend>Game Styles:</legend>
                  <div className="checkbox-group">
                    {gameStyles.map(style => (
                      <label key={style.key} className="checkbox-item">
                        <input
                          type="checkbox"
                          name="gameStyles"
                          value={style.key}
                          checked={formData.gameStyles && formData.gameStyles.includes(style.key)}
                          onChange={() => handleGameStyleChange(style.key)}
                        />
                        <span className="checkbox-text">{style.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
              
              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  placeholder="Tell others about your tennis background and what you're looking for"
                  rows="4"
                />
              </div>
            </div>
            
            <div className="form-section">
              <div className="time-slots-header">
                <h2>{t('profile.preferredPlayingTime')}</h2>
                <button 
                  type="button" 
                  className="add-time-slot-button"
                  onClick={addTimeSlot}
                >
                  + {t('profile.addTimeSlot')}
                </button>
              </div>
              
              {formData.preferredTimes.map((timeSlot, index) => (
                <div key={index} className="time-slot-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('profile.dayOfWeek')}</label>
                      <select
                        value={timeSlot.dayOfWeek}
                        onChange={(e) => handleTimeSlotChange(index, 'dayOfWeek', e.target.value)}
                      >
                        {daysOfWeek.map(day => (
                          <option key={day.key} value={day.key}>{day.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>{t('profile.startTime')}</label>
                      <input
                        type="time"
                        value={timeSlot.startTime}
                        onChange={(e) => handleTimeSlotChange(index, 'startTime', e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>{t('profile.endTime')}</label>
                      <input
                        type="time"
                        value={timeSlot.endTime}
                        onChange={(e) => handleTimeSlotChange(index, 'endTime', e.target.value)}
                      />
                    </div>
                    
                    <button
                      type="button"
                      className="remove-time-slot-button"
                      onClick={() => removeTimeSlot(index)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="form-actions">
                            <button 
                type="submit" 
                className="save-profile-button"
                disabled={submitting}
              >
                {submitting ? t('common.loading') : t('profile.saveChanges')}
              </button>
              <button 
                type="button" 
                className="cancel-button"
                disabled={submitting}
                onClick={() => {
                  setFormData(profile);  
                  setEditing(false);
                }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Modern Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
      />
    </div>
  );
};

export default Profile; 