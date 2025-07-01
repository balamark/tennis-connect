import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/config';
import './Auth.css';

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    skillLevel: '',
    gameStyles: [],
    gender: '',
    isNewToArea: false,
    city: '',
    location: {
      latitude: null,
      longitude: null
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const navigate = useNavigate();
  
  const gameStyleOptions = [
    { key: 'Singles', label: t('nearbyPlayers.gameStyles.singles') },
    { key: 'Doubles', label: t('nearbyPlayers.gameStyles.doubles') },
    { key: 'Social', label: t('nearbyPlayers.gameStyles.social') },
    { key: 'Competitive', label: t('nearbyPlayers.gameStyles.competitive') }
  ];
  const skillLevels = ['2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5+'];
  
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'isNewToArea') {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };
  
  const handleGameStyleChange = (event) => {
    const { value, checked } = event.target;
    
    setFormData(prev => {
      const styles = [...prev.gameStyles];
      if (checked && !styles.includes(value)) {
        return { ...prev, gameStyles: [...styles, value] };
      } else if (!checked && styles.includes(value)) {
        return { ...prev, gameStyles: styles.filter(s => s !== value) };
      }
      return prev;
    });
    
    // Clear error when user interacts
    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError(t('auth.errors.fullNameRequired'));
      return false;
    }
    
    if (!formData.email.trim()) {
      setError(t('auth.errors.emailRequired'));
      return false;
    }
    
    if (!formData.email.includes('@')) {
      setError(t('auth.errors.validEmailRequired'));
      return false;
    }
    
    if (!formData.password) {
      setError(t('auth.errors.passwordRequired'));
      return false;
    }
    
    if (formData.password.length < 6) {
      setError(t('auth.errors.passwordMinLength'));
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.errors.passwordsDoNotMatch'));
      return false;
    }
    
    if (!formData.skillLevel) {
      setError(t('auth.errors.skillLevelRequired'));
      return false;
    }
    
    if (!formData.city.trim()) {
      setError(t('auth.errors.cityRequired'));
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
        latitude: formData.location.latitude || 0,
        longitude: formData.location.longitude || 0,
        zipCode: '',
        city: formData.city.trim(),
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
        isNewToArea: false,
        city: '',
        location: {
          latitude: null,
          longitude: null
        }
      });
      
      alert(t('auth.registrationSuccessful'));
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle different types of errors
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.status === 400) {
        setError(t('auth.errors.checkInfoAndRetry'));
      } else if (err.response?.status === 409) {
        setError(t('auth.errors.accountExists'));
      } else if (err.response?.status >= 500) {
        setError(t('auth.errors.serverError'));
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError(t('auth.errors.networkError'));
      } else {
        setError(t('auth.errors.registrationFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle city selection from suggestions
  const handleCitySelect = (city) => {
    setFormData(prev => ({ 
      ...prev, 
      city,
      // Clear coordinates so backend will geocode the new city
      location: {
        ...prev.location,
        latitude: null,
        longitude: null
      }
    }));
    setShowCitySuggestions(false);
    if (error) {
      setError('');
    }
  };
  
  // Handle manual city input changes
  const handleCityChange = (e) => {
    const city = e.target.value;
    setFormData(prev => ({
      ...prev,
      city,
      // Clear coordinates when city changes manually so backend will geocode
      location: {
        ...prev.location,
        latitude: city !== prev.city ? null : prev.location.latitude,
        longitude: city !== prev.city ? null : prev.location.longitude
      }
    }));
    if (error) {
      setError('');
    }
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
            location: { latitude, longitude }
          }));
          // Try to get city name from coordinates using reverse geocoding
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
            .then(response => response.json())
            .then(data => {
              if (data.city || data.locality) {
                setFormData(prev => ({
                  ...prev,
                  city: data.city || data.locality
                }));
              }
            })
            .catch(err => console.error('Reverse geocoding failed:', err));
          setLocationLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError(t('auth.errors.unableToGetLocation'));
          setLocationLoading(false);
        }
      );
    } else {
      setError(t('auth.errors.geolocationNotSupported'));
      setLocationLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h2>{t('auth.createAccount')}</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t('auth.fullName')}</label>
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
            <label htmlFor="email">{t('auth.email')}</label>
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
              <label htmlFor="password">{t('auth.password')}</label>
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
              <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
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
              <label htmlFor="skillLevel">{t('auth.skillLevel')}</label>
              <select
                id="skillLevel"
                name="skillLevel"
                value={formData.skillLevel}
                onChange={handleChange}
                required
              >
                <option value="">{t('auth.selectSkillLevel')}</option>
                {skillLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="gender">{t('auth.gender')}</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">{t('auth.preferNotToSay')}</option>
                <option value="Female">{t('auth.female')}</option>
                <option value="Male">{t('auth.male')}</option>
                <option value="Other">{t('auth.other')}</option>
              </select>
            </div>
          </div>

          {/* City Field - Required for finding nearby players */}
          <div className="form-group">
            <label htmlFor="city">
              {t('auth.city')} <span className="required">{t('auth.cityRequired')}</span>
              <small className="field-hint">{t('auth.cityHint')}</small>
            </label>
            <div className="city-input-container">
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleCityChange}
                onFocus={() => setShowCitySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                placeholder={t('auth.enterCity')}
                required
              />
              <button
                type="button"
                className="location-button"
                onClick={getCurrentLocation}
                disabled={locationLoading}
                title={t('auth.useCurrentLocation')}
              >
                {locationLoading ? '📍' : '🎯'}
              </button>
            </div>
            
            {/* City Suggestions */}
            {showCitySuggestions && (
              <div className="city-suggestions">
                <div className="suggestions-header">{t('auth.popularCities')}</div>
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
              {t('auth.cityHelpsConnect')}
            </small>
          </div>
          
          <div className="form-group">
            <fieldset>
              <legend>{t('auth.gameStyles')}</legend>
              <div className="checkbox-group">
                {gameStyleOptions.map(style => (
                  <label key={style.key} className="checkbox-item">
                    <input
                      type="checkbox"
                      name="gameStyles"
                      value={style.key}
                      checked={formData.gameStyles.includes(style.key)}
                      onChange={handleGameStyleChange}
                    />
                    <span className="checkbox-text">{style.label}</span>
                  </label>
                ))}
              </div>
              <small id="game-styles-help" className="form-text text-muted">
                {t('auth.selectGameStyles')}
              </small>
            </fieldset>
          </div>
          
          <div className="form-group">
            <label className="checkbox-item">
              <input
                type="checkbox"
                name="isNewToArea"
                checked={formData.isNewToArea}
                onChange={handleChange}
                aria-describedby="new-to-area-help"
              />
              <span className="checkbox-text">{t('auth.newToArea')}</span>
            </label>
            <small id="new-to-area-help" className="form-text text-muted">
              {t('auth.newToAreaHelp')}
            </small>
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
          </button>
        </form>
        
        <div className="auth-link">
          {t('auth.alreadyHaveAccount')} <span onClick={() => navigate('/login')}>{t('auth.signIn')}</span>
        </div>
      </div>
    </div>
  );
};

export default Register; 