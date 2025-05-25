import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // Get user ID from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      const response = await axios.get(`/api/users/profile/${user.id}`);
      setProfile(response.data);
      
      // Initialize form data with current profile
      setFormData(response.data);
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
  };

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
      const styles = [...prev.gameStyles];
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
      await axios.put('/api/users/profile', formData);
      
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
    email: 'user@example.com',
    name: 'Tennis Player',
    skillLevel: 4.0,
    gameStyles: ['Singles', 'Competitive'],
    gender: 'Male',
    isNewToArea: false,
    isVerified: true,
    bio: 'Passionate tennis player looking for competitive matches.',
    preferredTimes: [
      { dayOfWeek: 'Monday', startTime: '18:00', endTime: '20:00' },
      { dayOfWeek: 'Saturday', startTime: '09:00', endTime: '12:00' }
    ],
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      zipCode: '94105',
      city: 'San Francisco',
      state: 'CA'
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
                <span className="info-value">{profile.skillLevel} NTRP</span>
              </div>
              <div className="profile-info-row">
                <span className="info-label">Game Styles:</span>
                <span className="info-value">{profile.gameStyles.join(', ')}</span>
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
            {profile.preferredTimes.length === 0 ? (
              <p>No preferred times set.</p>
            ) : (
              <div className="time-slots-grid">
                {profile.preferredTimes.map((timeSlot, index) => (
                  <div key={index} className="time-slot-card">
                    <h3>{timeSlot.dayOfWeek}</h3>
                    <p>{timeSlot.startTime} - {timeSlot.endTime}</p>
                  </div>
                ))}
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
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isNewToArea"
                    checked={formData.isNewToArea}
                    onChange={handleChange}
                  />
                  I'm new to the area and looking to meet players
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
                  {skillLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Game Styles:</label>
                <div className="checkbox-group">
                  {gameStyles.map(style => (
                    <label key={style} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.gameStyles.includes(style)}
                        onChange={() => handleGameStyleChange(style)}
                      />
                      {style}
                    </label>
                  ))}
                </div>
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