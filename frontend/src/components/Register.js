import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/config';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    skillLevel: '',
    gameStyles: [],
    gender: '',
    isNewToArea: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const gameStyleOptions = ['Singles', 'Doubles', 'Social', 'Competitive'];
  const skillLevels = ['2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5+'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Clear error when user starts typing
    if (error) {
      setError('');
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

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Full name is required');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (!formData.skillLevel) {
      setError('Please select your skill level');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Prepare data for API
    const userData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      skillLevel: parseFloat(formData.skillLevel),
      gameStyles: formData.gameStyles,
      gender: formData.gender,
      isNewToArea: formData.isNewToArea,
      location: {
        // Default location (can be updated later in profile)
        latitude: 37.7749,
        longitude: -122.4194,
        zipCode: '',
        city: '',
        state: ''
      }
    };

    try {
      const response = await api.post('/users/register', userData);
      console.log('Registration successful:', response.data);
      
      // Clear form and error
      setError('');
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        skillLevel: '',
        gameStyles: [],
        gender: '',
        isNewToArea: false
      });
      
      alert('Registration successful! Please sign in.');
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle different types of errors
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.status === 400) {
        setError('Please check your information and try again.');
      } else if (err.response?.status === 409) {
        setError('An account with this email already exists.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError('Failed to register. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h2>Create an Account</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
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
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
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
          </div>
          
          <div className="form-group">
            <label>Game Styles:</label>
            <div className="checkbox-group">
              {gameStyleOptions.map(style => (
                <label key={style} className="checkbox-label" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.gameStyles.includes(style)}
                    onChange={() => handleGameStyleChange(style)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ cursor: 'pointer' }}>{style}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label className="checkbox-label" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="isNewToArea"
                checked={formData.isNewToArea}
                onChange={handleChange}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ cursor: 'pointer' }}>I'm new to the area and looking to meet players</span>
            </label>
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="auth-link">
          Already have an account? <span onClick={() => navigate('/login')}>Sign In</span>
        </div>
      </div>
    </div>
  );
};

export default Register; 