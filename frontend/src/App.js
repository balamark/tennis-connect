import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import NearbyPlayers from './components/NearbyPlayers';
import TennisCourts from './components/TennisCourts';
import PlayBulletin from './components/PlayBulletin';
import Events from './components/Events';
import Communities from './components/Communities';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');

  const updateUserInfo = useCallback(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      try {
        const user = JSON.parse(userData);
        setUserName(user.name || 'My Profile');
      } catch (err) {
        console.error('Error parsing user data:', err);
        setUserName('My Profile');
      }
    } else {
      setIsAuthenticated(false);
      setUserName('');
    }
  }, []);

  useEffect(() => {
    updateUserInfo();
  }, [updateUserInfo]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUserName('');
  };

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="app-logo">
            <h1>TennisConnect</h1>
          </div>
          <nav className="app-nav">
            <Link to="/" className="nav-link">Players Near You</Link>
            <Link to="/courts" className="nav-link">Court Finder</Link>
            <Link to="/bulletins" className="nav-link">Bulletin</Link>
            <Link to="/events" className="nav-link">Events</Link>
            <Link to="/communities" className="nav-link">Communities</Link>
          </nav>
          <div className="user-controls">
            {isAuthenticated ? (
              <div className="user-menu">
                <Link to="/profile" className="profile-link">{userName}</Link>
                <button className="logout-button" onClick={handleLogout}>Sign Out</button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="login-button">Sign In</Link>
                <Link to="/register" className="register-button">Register</Link>
              </div>
            )}
          </div>
        </header>
        
        <main className="app-content">
          <Routes>
            <Route path="/" element={<NearbyPlayers />} />
            <Route path="/courts" element={<TennisCourts />} />
            <Route path="/bulletins" element={<PlayBulletin />} />
            <Route path="/events" element={<Events />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/login" element={
              isAuthenticated ? 
                <Navigate to="/" replace /> : 
                <Login setIsAuthenticated={setIsAuthenticated} updateUserInfo={updateUserInfo} />
            } />
            <Route path="/register" element={
              isAuthenticated ? 
                <Navigate to="/" replace /> : 
                <Register updateUserInfo={updateUserInfo} />
            } />
            <Route path="/profile" element={
              isAuthenticated ? 
                <Profile /> : 
                <Navigate to="/login" replace />
            } />
          </Routes>
        </main>
        
        <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} TennisConnect</p>
        </footer>
      </div>
    </Router>
  );
}

export default App; 