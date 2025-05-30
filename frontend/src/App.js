import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import Header from './components/Header';
import NearbyPlayers from './components/NearbyPlayers';
import TennisCourts from './components/TennisCourts';
import PlayBulletin from './components/PlayBulletin';
import Events from './components/Events';
import Communities from './components/Communities';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import BookCourt from './components/BookCourt';
import MySessions from './components/MySessions';

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
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 group/design-root overflow-x-hidden font-sans">
        <div className="layout-container flex h-full grow flex-col">
          <Header 
            isAuthenticated={isAuthenticated}
            userName={userName}
            onLogout={handleLogout}
          />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<NearbyPlayers />} />
              <Route path="/find-partner" element={<NearbyPlayers />} />
              <Route path="/book-court" element={<BookCourt />} />
              <Route path="/courts" element={<TennisCourts />} />
              <Route path="/my-sessions" element={
                isAuthenticated ? 
                  <MySessions /> : 
                  <Navigate to="/login" replace />
              } />
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
        </div>
      </div>
    </Router>
  );
}

export default App; 