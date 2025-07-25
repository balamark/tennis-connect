import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/config';
import './Auth.css';

const Login = ({ setIsAuthenticated, updateUserInfo }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Don't auto-clear errors - let users read them until they fix the issue
    // Error will be cleared only on successful login or form resubmission
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear any previous errors when attempting login

    try {
      const response = await api.post('/users/login', formData);
      
      // Store token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userName', response.data.user.name || '');
      
      // Update auth state and user info
      setIsAuthenticated(true);
      if (updateUserInfo) {
        updateUserInfo(response.data.user.name || '');
      }
      
      // Redirect to home page
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.error || t('auth.errors.loginFailed');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('auth.signIn')}</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
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
          
          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>
        
        <div className="auth-link">
          {t('auth.dontHaveAccount')} <span onClick={() => navigate('/register')}>{t('auth.register')}</span>
        </div>
      </div>
    </div>
  );
};

export default Login; 