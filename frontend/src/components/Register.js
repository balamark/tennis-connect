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
    // Clear error when user starts typing (but only after a longer delay so users can read the message)
    if (error) {
      setTimeout(() => setError(''), 2000); // Increased from 100ms to 2 seconds
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Don't clear error immediately - only clear it on successful registration
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    // Prepare data for API
    const userData = {
      name: formData.name,
      email: formData.email,
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
      await api.post('/users/register', userData);
      // Clear error only on successful registration
      setError('');
      alert('Registration successful! Please sign in.');
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Failed to register. Please try again.');
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