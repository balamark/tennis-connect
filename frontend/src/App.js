import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import Header from './components/Header';
import Home from './components/Home';
import NearbyPlayers from './components/NearbyPlayers';
import BookCourt from './components/BookCourt';
import TennisCourts from './components/TennisCourts';
import MySessions from './components/MySessions';
import PlayBulletin from './components/PlayBulletin';
import Events from './components/Events';
import Communities from './components/Communities';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import NotificationDemo from './components/NotificationDemo';
import { NotificationProvider } from './contexts/NotificationContext';
import { DemoModeProvider } from './contexts/DemoModeContext';
import DemoModeBanner from './components/DemoModeBanner';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Check if user is already logged in (e.g., from localStorage)
    const token = localStorage.getItem('token');
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedUserName = localStorage.getItem('userName');
    const savedUser = localStorage.getItem('user');
    
    if ((savedAuth === 'true' || token) && savedUser) {
      setIsAuthenticated(true);
      setUserName(savedUserName || '');
    }
  }, []);

  const updateUserInfo = (name) => {
    setUserName(name);
    localStorage.setItem('userName', name);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserName('');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <DemoModeProvider>
      <NotificationProvider>
        <Router>
          <div className="relative flex size-full min-h-screen flex-col bg-slate-50 group/design-root overflow-x-hidden font-sans">
            <div className="layout-container flex h-full grow flex-col">
              <Header 
                isAuthenticated={isAuthenticated}
                userName={userName}
                onLogout={handleLogout}
              />
              
              <DemoModeBanner />
              
              <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/nearby-players" element={<NearbyPlayers />} />
                <Route path="/find-partner" element={<NearbyPlayers />} />
                <Route path="/book-court" element={<BookCourt />} />
                <Route path="/courts" element={<TennisCourts />} />
                <Route path="/court-finder" element={<TennisCourts />} />
                <Route path="/my-sessions" element={
                  isAuthenticated ? 
                    <MySessions /> : 
                    <Navigate to="/login" replace />
                } />
                <Route path="/play-bulletin" element={<PlayBulletin />} />
                <Route path="/bulletins" element={<PlayBulletin />} />
                <Route path="/events" element={<Events />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/notifications-demo" element={<NotificationDemo />} />
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
    </NotificationProvider>
    </DemoModeProvider>
  );
}

export default App; 