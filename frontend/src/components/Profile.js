import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/config';
import './Profile.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  
  const gameStyles = ['Singles', 'Doubles', 'Competitive', 'Social'];
  const skillLevels = ['2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5+'];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
      
      // For development: use mock data if API call fails
      const mockProfile = getMockProfile();
      setProfile(mockProfile);
      setFormData(mockProfile);
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
    try {
      // Prepare data for API - convert to snake_case field names
      const submitData = {
        ...formData,
        skill_level: parseFloat(formData.skillLevel),
        game_styles: formData.gameStyles,
        preferred_times: formData.preferredTimes.map(time => ({
          day_of_week: time.dayOfWeek,
          start_time: time.startTime,
          end_time: time.endTime
        })),
        is_new_to_area: formData.isNewToArea,
        // Remove the camelCase versions to avoid confusion
        skillLevel: undefined,
        gameStyles: undefined,
        preferredTimes: undefined,
        isNewToArea: undefined
      };
      
      await api.put('/users/profile', submitData);
      
      // Update local profile
      setProfile(formData);
      setEditing(false);
      
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile. Please try again.');
    }
  };

  // Mock data for development
  const getMockProfile = () => ({
    id: '1',
    email: 'balamark@hotmail.com',
    name: 'Mark Wang',
    skillLevel: '3.5', // Keep as string for form compatibility
    gameStyles: ['Singles', 'Doubles', 'Social'],
    gender: 'Male',
    isNewToArea: true,
    isVerified: true,
    bio: 'casual hit',
    preferredTimes: [
      { dayOfWeek: 'Monday', startTime: '18:00', endTime: '20:00' },
      { dayOfWeek: 'Wednesday', startTime: '19:00', endTime: '21:00' },
      { dayOfWeek: 'Saturday', startTime: '09:00', endTime: '12:00' }
    ],
    location: {
      latitude: 36.1699,
      longitude: -115.1398,
      zipCode: '89101',
      city: 'Las Vegas',
      state: 'NV'
    }
  });

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error && !profile) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        {!editing && (
          <button 
            className="edit-profile-button"
            onClick={() => setEditing(true)}
          >
            Edit Profile
          </button>
        )}
      </div>
      
      {!editing ? (
        <div className="profile-view">
          <div className="profile-info-grid">
            <div className="profile-info-card">
              <h2>Personal Information</h2>
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
              <h2>Tennis Information</h2>
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
            <h2>Preferred Playing Times</h2>
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
        </div>
      ) : (
        <div className="profile-form-container">
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>Personal Information</h2>
              <div className="form-group">
                <label htmlFor="name">Name</label>
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
                <label htmlFor="email">Email</label>
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
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location.zipCode">Zip Code</label>
                  <input
                    type="text"
                    id="location.zipCode"
                    name="location.zipCode"
                    value={formData.location.zipCode}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="location.city">City</label>
                  <input
                    type="text"
                    id="location.city"
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="location.state">State</label>
                  <input
                    type="text"
                    id="location.state"
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleChange}
                    required
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
              <h2>Tennis Information</h2>
              
              <div className="form-group">
                <label htmlFor="skillLevel">Skill Level (NTRP)</label>
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
                      <label key={style} className="checkbox-item">
                        <input
                          type="checkbox"
                          name="gameStyles"
                          value={style}
                          checked={formData.gameStyles && formData.gameStyles.includes(style)}
                          onChange={() => handleGameStyleChange(style)}
                        />
                        <span className="checkbox-text">{style}</span>
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
                <h2>Preferred Playing Times</h2>
                <button 
                  type="button" 
                  className="add-time-slot-button"
                  onClick={addTimeSlot}
                >
                  + Add Time Slot
                </button>
              </div>
              
              {formData.preferredTimes.map((timeSlot, index) => (
                <div key={index} className="time-slot-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Day</label>
                      <select
                        value={timeSlot.dayOfWeek}
                        onChange={(e) => handleTimeSlotChange(index, 'dayOfWeek', e.target.value)}
                      >
                        {daysOfWeek.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Start Time</label>
                      <input
                        type="time"
                        value={timeSlot.startTime}
                        onChange={(e) => handleTimeSlotChange(index, 'startTime', e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>End Time</label>
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
              <button type="submit" className="save-profile-button">Save Profile</button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => {
                  setFormData(profile);
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile; 