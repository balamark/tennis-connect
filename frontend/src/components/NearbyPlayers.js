import React, { useState, useEffect, useCallback } from 'react';
import './NearbyPlayers.css';
import { useDemoMode } from '../contexts/DemoModeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getMockPlayers } from '../data/mockData';
import Modal from './Modal';

const NearbyPlayers = () => {
  const { isDemoMode, enableDemoMode } = useDemoMode();
  const { addNotification } = useNotifications();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('compact'); // 'detailed' or 'compact'
  const [searchMetadata, setSearchMetadata] = useState(null);
  const [likedPlayers, setLikedPlayers] = useState(new Set());
  const [matches, setMatches] = useState([]);
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Filter states
  const [filters, setFilters] = useState({
    skillLevel: '',
    radius: 10,
    gameStyles: [],
    preferredDays: [],
    gender: '',
    isNewcomer: false
  });

  // Dropdown states for multi-select
  const [stylesDropdownOpen, setStylesDropdownOpen] = useState(false);
  const [daysDropdownOpen, setDaysDropdownOpen] = useState(false);

  const showModal = (type, title, message) => {
    setModal({
      isOpen: true,
      type,
      title,
      message
    });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  // Load liked players and matches from localStorage
  useEffect(() => {
    const savedLikes = localStorage.getItem('likedPlayers');
    const savedMatches = localStorage.getItem('playerMatches');
    
    if (savedLikes) {
      try {
        setLikedPlayers(new Set(JSON.parse(savedLikes)));
      } catch (e) {
        console.error('Error loading liked players:', e);
      }
    }
    
    if (savedMatches) {
      try {
        setMatches(JSON.parse(savedMatches));
      } catch (e) {
        console.error('Error loading matches:', e);
      }
    }
  }, []);

  // Save liked players to localStorage
  const saveLikedPlayers = (likes) => {
    localStorage.setItem('likedPlayers', JSON.stringify(Array.from(likes)));
  };

  // Save matches to localStorage
  const saveMatches = (matchList) => {
    localStorage.setItem('playerMatches', JSON.stringify(matchList));
  };

  // Apply filters to player list
  const applyFilters = useCallback((playerList) => {
    return playerList.filter(player => {
      if (filters.skillLevel && Math.abs(player.skillLevel - parseFloat(filters.skillLevel)) > 0.5) {
        return false;
      }
      if (filters.gameStyles.length > 0 && !filters.gameStyles.some(style => player.gameStyles.includes(style))) {
        return false;
      }
      if (filters.preferredDays.length > 0 && !filters.preferredDays.some(day => 
        player.preferredTimes.some(time => time.dayOfWeek === day)
      )) {
        return false;
      }
      if (filters.gender && player.gender !== filters.gender) {
        return false;
      }
      if (filters.isNewcomer && !player.isNewToArea) {
        return false;
      }
      return true;
    });
  }, [filters]);

  // Function to fetch all users as fallback - defined BEFORE fetchNearbyPlayers
  const fetchAllUsers = useCallback(async (token, apiUrl) => {
    try {
      console.log('🌍 Attempting expanded search...');
      
      // Try a reasonable expanded search (the backend already has fallback logic)
      // Don't use unrealistic distances for worldwide app - max 200 miles is reasonable
      const maxReasonableRadius = Math.max(filters.radius * 2, 200); // Double current radius or 200 miles, whichever is larger
      
      console.log(`📍 Trying expanded search with ${maxReasonableRadius} mile radius...`);
      
      const response = await fetch(`${apiUrl}/users/nearby?radius=${maxReasonableRadius}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];
        
        if (users.length > 0) {
          console.log(`✅ Found ${users.length} users within ${maxReasonableRadius} miles`);
          
          // Apply client-side filtering for skills, gender, etc.
          const filteredUsers = users.filter(user => {
            if (filters.skillLevel && user.skill_level !== filters.skillLevel) return false;
            if (filters.gender && user.gender !== filters.gender) return false;
            if (filters.isNewcomer && !user.is_new_to_area) return false;
            if (filters.gameStyles.length > 0 && !filters.gameStyles.some(style => 
              user.game_styles?.includes(style) || user.gameStyles?.includes(style)
            )) return false;
            return true;
          });

          const usersToShow = filteredUsers.length > 0 ? filteredUsers : users;
          
          // Mark all users as having liked status
          const usersWithLikeStatus = usersToShow.map(user => ({
            ...user,
            liked: likedPlayers.has(user.id),
            isMatch: matches.some(match => match.playerId === user.id)
          }));
          
          setPlayers(usersWithLikeStatus);
          setSearchMetadata({
            total_users: usersWithLikeStatus.length,
            users_in_range: usersWithLikeStatus.filter(p => p.distance && p.distance <= filters.radius).length,
            users_out_of_range: usersWithLikeStatus.filter(p => !p.distance || p.distance > filters.radius).length,
            search_radius: filters.radius,
            actual_search_radius: maxReasonableRadius,
            showing_fallback: true,
            original_search_radius: filters.radius
          });
          return;
        }
      }
      
      // If still no users found, show helpful message
      console.log(`❌ No users found even with expanded search up to ${maxReasonableRadius} miles`);
      throw new Error(`No tennis players found within ${maxReasonableRadius} miles. This app is growing - check back soon as more players join your area!`);
      
    } catch (err) {
      console.error('Error fetching users with expanded search:', err);
      throw err;
    }
  }, [filters, likedPlayers, matches]);

  // Real API call for live mode - now defined AFTER fetchAllUsers
  const fetchNearbyPlayers = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://tennis-connect-backend-552905514167.us-central1.run.app'
          : 'http://localhost:8080');
      
      // Check if user is authenticated
      if (!token) {
        throw new Error('Please log in to view nearby players. Click "Sign In" in the top menu to get started.');
      }
      
      // Build query parameters
      const params = new URLSearchParams({
        radius: filters.radius.toString(),
        ...(filters.skillLevel && { skill_level: filters.skillLevel }),
        ...(filters.gender && { gender: filters.gender }),
        ...(filters.isNewcomer && { is_newcomer: 'true' }),
        ...(filters.gameStyles.length > 0 && { game_styles: filters.gameStyles.join(',') }),
        ...(filters.preferredDays.length > 0 && { preferred_days: filters.preferredDays.join(',') })
      });

      const response = await fetch(`${apiUrl}/users/nearby?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again to view nearby players.');
        } else if (response.status === 404) {
          // For 404, try to fetch all users instead of showing error
          console.log('No players found in radius, attempting to fetch all users...');
          return await fetchAllUsers(token, apiUrl);
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else if (response.status >= 500) {
          throw new Error('Server is experiencing issues. Please try again later.');
        } else {
          // For other errors, try to fetch all users as fallback
          console.log('API error, attempting to fetch all users as fallback...');
          return await fetchAllUsers(token, apiUrl);
        }
      }

      const data = await response.json();
      
      // Handle the real API response
      const realPlayers = data.users || [];
      
      // If no players found in radius, try to get all users
      if (realPlayers.length === 0) {
        console.log('No players in radius, fetching all users...');
        return await fetchAllUsers(token, apiUrl);
      }
      
      const metadata = data.metadata || {
        total_users: realPlayers.length,
        users_in_range: realPlayers.filter(p => p.distance <= filters.radius).length,
        users_out_of_range: realPlayers.filter(p => p.distance > filters.radius).length,
        search_radius: filters.radius,
        showing_fallback: false
      };

      setPlayers(realPlayers);
      setSearchMetadata(metadata);

    } catch (err) {
      console.error('Error fetching nearby players:', err);
      // Instead of showing error, try to fetch all users as final fallback
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.REACT_APP_API_URL || 
          (process.env.NODE_ENV === 'production' 
            ? 'https://tennis-connect-backend-552905514167.us-central1.run.app'
            : 'http://localhost:8080');
        if (token) {
          await fetchAllUsers(token, apiUrl);
          return;
        }
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
      
      setError(err.message || 'Failed to load players. Please check your connection and try again.');
      setPlayers([]);
      setSearchMetadata({
        total_users: 0,
        users_in_range: 0,
        users_out_of_range: 0,
        search_radius: filters.radius,
        showing_fallback: false
      });
    } finally {
      setLoading(false);
    }
  }, [filters, fetchAllUsers]);

  useEffect(() => {
    // Check if there's a city to explore from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const exploreCity = urlParams.get('explore');
    
    if (exploreCity && !isDemoMode) {
      // Auto-explore the specified city
      handleViewCityPlayers(decodeURIComponent(exploreCity));
      // Clear the URL param to avoid repeated calls
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    if (isDemoMode) {
      // Clear any previous error states when entering demo mode
      setError('');
      setLoading(false);
      
      const allPlayers = getMockPlayers();
      const filteredPlayers = applyFilters(allPlayers);
      
      // Implement fallback behavior: if no players found nearby, show all players
      if (filteredPlayers.length === 0) {
        setPlayers(allPlayers);
        setSearchMetadata({
          total_users: allPlayers.length,
          users_in_range: 0,
          users_out_of_range: allPlayers.length,
          search_radius: filters.radius,
          showing_fallback: true
        });
      } else {
        setPlayers(filteredPlayers);
        const inRange = filteredPlayers.filter(p => p.distance <= filters.radius).length;
        const outOfRange = filteredPlayers.filter(p => p.distance > filters.radius).length;
        
        setSearchMetadata({
          total_users: filteredPlayers.length,
          users_in_range: inRange,
          users_out_of_range: outOfRange,
          search_radius: filters.radius,
          showing_fallback: false
        });
      }
    } else {
      // In live mode, clear demo data and fetch real users from API
      setPlayers([]);
      setSearchMetadata(null);
      fetchNearbyPlayers();
    }
  }, [isDemoMode, filters, applyFilters, fetchNearbyPlayers]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMultiSelectChange = (filterName, value) => {
    setFilters(prev => {
      const currentValues = [...prev[filterName]];
      if (currentValues.includes(value)) {
        return { ...prev, [filterName]: currentValues.filter(v => v !== value) };
      } else {
        return { ...prev, [filterName]: [...currentValues, value] };
      }
    });
  };

  const handleStylesDropdownToggle = (e) => {
    e.stopPropagation();
    const newState = !stylesDropdownOpen;
    setStylesDropdownOpen(newState);
    setDaysDropdownOpen(false); // Close other dropdown
    
    // Update filter group z-index
    const filterGroup = e.target.closest('.filter-group');
    if (filterGroup) {
      if (newState) {
        filterGroup.classList.add('dropdown-open');
      } else {
        filterGroup.classList.remove('dropdown-open');
      }
    }
  };

  const handleDaysDropdownToggle = (e) => {
    e.stopPropagation();
    const newState = !daysDropdownOpen;
    setDaysDropdownOpen(newState);
    setStylesDropdownOpen(false); // Close other dropdown
    
    // Update filter group z-index
    const filterGroup = e.target.closest('.filter-group');
    if (filterGroup) {
      if (newState) {
        filterGroup.classList.add('dropdown-open');
      } else {
        filterGroup.classList.remove('dropdown-open');
      }
    }
  };

  const handleStyleOptionClick = (e, style) => {
    e.stopPropagation();
    handleMultiSelectChange('gameStyles', style);
  };

  const handleDayOptionClick = (e, day) => {
    e.stopPropagation();
    handleMultiSelectChange('preferredDays', day);
  };

  const handleApplyFilters = () => {
    if (!isDemoMode) {
      fetchNearbyPlayers();
    }
  };

  const viewPlayerContact = (playerId) => {
    const match = matches.find(match => match.playerId === playerId);
    if (match) {
      setModal({
        isOpen: true,
        type: 'info',
        title: `Contact ${match.playerName}`,
        message: `
Contact Information:
📧 Email: ${match.contactInfo.email}
📱 Phone: ${match.contactInfo.phone}
💬 LINE ID: ${match.contactInfo.lineId}

Matched on: ${new Date(match.matchedAt).toLocaleDateString()}

Good luck with your tennis match! 🎾
        `.trim(),
        actionLabel: 'Close',
        onAction: closeModal
      });
    }
  };

  const handleLikePlayer = async (playerId) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const targetPlayer = players.find(p => p.id === playerId);
      
      if (!targetPlayer) {
        showModal('error', 'Error', 'Player not found');
        return;
      }

      const isCurrentlyLiked = likedPlayers.has(playerId);
      const newLikedState = new Set(likedPlayers);
      
      if (isCurrentlyLiked) {
        // Unlike the player
        newLikedState.delete(playerId);
        setLikedPlayers(newLikedState);
        saveLikedPlayers(newLikedState);
        
        // Remove from matches if it was a match
        const newMatches = matches.filter(match => match.playerId !== playerId);
        setMatches(newMatches);
        saveMatches(newMatches);
        
        showModal('info', 'Unliked', `You unliked ${targetPlayer.name || 'this player'}`);
      } else {
        // Like the player
        newLikedState.add(playerId);
        setLikedPlayers(newLikedState);
        saveLikedPlayers(newLikedState);
        
        // Simulate checking if it's a mutual like (in real app, this would be from backend)
        const isMutualLike = Math.random() > 0.7; // 30% chance of mutual like for demo
        
        if (isMutualLike) {
          // It's a match!
          const newMatch = {
            playerId: playerId,
            playerName: targetPlayer.name || 'Unknown Player',
            playerAvatar: targetPlayer.avatar,
            matchedAt: new Date().toISOString(),
            contactInfo: {
              email: targetPlayer.email || `${targetPlayer.name?.toLowerCase().replace(' ', '.')}@example.com`,
              phone: targetPlayer.phone || 'Not provided',
              lineId: targetPlayer.lineId || 'Not provided'
            }
          };
          
          const newMatches = [newMatch, ...matches];
          setMatches(newMatches);
          saveMatches(newMatches);
          
          // Send notification about the match
          addNotification({
            type: 'partner_found',
            title: '🎾 It\'s a Match!',
            message: `You and ${targetPlayer.name || 'this player'} liked each other! You can now exchange contact information.`,
            avatar: targetPlayer.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
            actionRequired: true,
            playerId: playerId
          });
          
          showModal('success', '🎾 It\'s a Match!', 
            `You and ${targetPlayer.name || 'this player'} liked each other! Check your notifications to connect.`);
        } else {
          // Just a like, notify the other player (in real app)
          showModal('success', 'Like Sent!', 
            `You liked ${targetPlayer.name || 'this player'}! If they like you back, you'll be notified.`);
          
          // Simulate sending notification to the liked player (in real app, this would be via backend)
          // For demo purposes, we'll add it to current user's notifications as if we're the target
          setTimeout(() => {
            if (Math.random() > 0.8) { // 20% chance they like back immediately
              addNotification({
                type: 'match_request',
                title: 'Someone Liked You!',
                message: `${currentUser.name || 'Someone'} liked your profile. Check them out!`,
                avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
                actionRequired: false
              });
            }
          }, 2000);
        }
      }

      if (!isDemoMode) {
        // Make real API call to like/unlike player
        const token = localStorage.getItem('token');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
        
        try {
          await fetch(`${apiUrl}/users/like`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              target_user_id: playerId,
              action: isCurrentlyLiked ? 'unlike' : 'like'
            }),
          });
        } catch (apiError) {
          console.error('API error liking player:', apiError);
          // Don't revert local state since the action already happened
        }
      }
      
      // Update the players list to reflect the new liked state
      setPlayers(prev => prev.map(player => 
        player.id === playerId 
          ? { 
              ...player, 
              liked: !isCurrentlyLiked,
              isMatch: matches.some(match => match.playerId === playerId) || (!isCurrentlyLiked && Math.random() > 0.7)
            }
          : player
      ));
      
    } catch (error) {
      console.error('Error liking player:', error);
      showModal('error', 'Error', 'Failed to like player. Please try again.');
    }
  };

  const getAnimalAvatar = (userId, name) => {
    const animals = [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', 
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
      '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
      '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞'
    ];
    
    // Use a simple hash of the user ID to consistently assign an animal
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const animalIndex = Math.abs(hash) % animals.length;
    return animals[animalIndex];
  };

  // eslint-disable-next-line no-unused-vars
  const formatTime = (availableTime) => {
    const [hours, minutes] = availableTime.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getSelectedItemsDisplay = (items, placeholder) => {
    if (items.length === 0) return placeholder;
    if (items.length === 1) return items[0];
    return `${items.length} selected`;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.multi-select-dropdown')) {
        setStylesDropdownOpen(false);
        setDaysDropdownOpen(false);
        // Remove dropdown-open class from all filter groups
        document.querySelectorAll('.filter-group.dropdown-open').forEach(group => {
          group.classList.remove('dropdown-open');
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  
  // Handle viewing players from a specific city
  const handleViewCityPlayers = useCallback(async (cityName) => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://tennis-connect-backend-552905514167.us-central1.run.app'
          : 'http://localhost:8080');
      
      if (!token) {
        throw new Error('Please log in to view players from other cities.');
      }
      
      // Build query parameters for city-specific search
      const params = new URLSearchParams({
        city: cityName,
        radius: '1000', // Large radius to get all players from that city
        ...(filters.skillLevel && { skill_level: filters.skillLevel }),
        ...(filters.gender && { gender: filters.gender }),
        ...(filters.isNewcomer && { is_newcomer: 'true' }),
        ...(filters.gameStyles.length > 0 && { game_styles: filters.gameStyles.join(',') }),
        ...(filters.preferredDays.length > 0 && { preferred_days: filters.preferredDays.join(',') })
      });

      const response = await fetch(`${apiUrl}/users/by-city?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        } else if (response.status === 404) {
          throw new Error(`No players found in ${cityName}.`);
        } else {
          throw new Error('Failed to load players from this city.');
        }
      }

      const data = await response.json();
      const cityPlayers = data.users || [];
      
      setPlayers(cityPlayers);
      setSearchMetadata({
        total_users: cityPlayers.length,
        users_in_range: cityPlayers.length,
        users_out_of_range: 0,
        search_radius: 1000,
        showing_city: cityName,
        city_search: true
      });

    } catch (err) {
      console.error('Error fetching city players:', err);
      setError(err.message || `Failed to load players from ${cityName}. Please try again.`);
      setPlayers([]);
      setSearchMetadata({
        total_users: 0,
        users_in_range: 0,
        users_out_of_range: 0,
        search_radius: filters.radius,
        showing_city: cityName,
        city_search: true
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Enhanced error display component
  const renderError = () => {
    if (!error) return null;

    const isAuthError = error.includes('log in') || error.includes('session has expired');
    const isServiceError = error.includes('temporarily unavailable') || error.includes('Service');
    const isNoPlayersError = error.includes('No players found') || error.includes('No users found');
    
    // Don't show the red error box for "no players found" - this is handled elsewhere
    if (isNoPlayersError) {
      return null;
    }
    
    return (
      <div className="error-with-suggestion">
        <div className="error-title">
          {isAuthError ? '🔐 Authentication Required' : 
           isServiceError ? '⚠️ Service Issue' : 
           '❌ Connection Error'}
        </div>
        <div className="error-message">{error}</div>
        
        {isAuthError && (
          <div className="error-actions">
            <button 
              className="error-action-button"
              onClick={() => window.location.href = '/login'}
            >
              Go to Sign In
            </button>
            <button 
              className="error-action-button secondary"
              onClick={enableDemoMode}
            >
              Switch to Demo Mode
            </button>
          </div>
        )}
        
        {isServiceError && (
          <div className="error-actions">
            <button 
              className="error-action-button"
              onClick={() => {
                setError('');
                if (!isDemoMode) {
                  fetchNearbyPlayers();
                }
              }}
            >
              Try Again
            </button>
            <button 
              className="error-action-button secondary"
              onClick={enableDemoMode}
            >
              Use Demo Mode
            </button>
          </div>
        )}
        
        {!isAuthError && !isServiceError && (
          <div className="error-actions">
            <button 
              className="error-action-button"
              onClick={() => {
                setError('');
                if (!isDemoMode) {
                  fetchNearbyPlayers();
                }
              }}
            >
              Retry
            </button>
            <button 
              className="error-action-button secondary"
              onClick={enableDemoMode}
            >
              Switch to Demo Mode
            </button>
          </div>
        )}
        
        <div className="error-suggestion">
          💡 Demo mode works offline and doesn't require a login
        </div>
      </div>
    );
  };

  return (
    <div className="nearby-players-container">
      {/* Modern Filter Sidebar */}
      <div className="filters-sidebar">
        <h2>Players Near You</h2>
        
        {/* Demo Mode Toggle - Now handled globally */}
        <div className="demo-mode-toggle">
          <div className="toggle-container">
            <div className="demo-indicator">
              {isDemoMode ? 'Showing sample players for testing' : 'Connected to live player database'}
            </div>
          </div>
        </div>

        {/* NTRP Rating Filter */}
        <div className="filter-group" data-filter="skill">
          <label>NTRP Rating</label>
          <select
            name="skillLevel"
            value={filters.skillLevel}
            onChange={handleFilterChange}
          >
            <option value="">Any Level</option>
            <option value="2.0">2.0</option>
            <option value="2.5">2.5</option>
            <option value="3.0">3.0</option>
            <option value="3.5">3.5</option>
            <option value="4.0">4.0</option>
            <option value="4.5">4.5</option>
            <option value="5.0">5.0</option>
            <option value="5.5">5.5+</option>
          </select>
        </div>

        {/* Search Radius Filter */}
        <div className="filter-group" data-filter="radius">
          <label>Search Radius</label>
          
          {/* Quick radius selection buttons */}
          <div className="radius-quick-select">
            {[10, 25, 50, 100, 200].map(distance => (
              <button
                key={distance}
                type="button"
                className={`radius-button ${filters.radius === distance ? 'active' : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, radius: distance }))}
              >
                {distance} mi
              </button>
            ))}
          </div>
          
          {/* Advanced radius control */}
          <details className="radius-advanced">
            <summary>Custom distance</summary>
            <div className="radius-slider-container">
              <input
                type="range"
                name="radius"
                min="1"
                max="500"
                value={filters.radius}
                onChange={handleFilterChange}
              />
              <div className="range-display">
                <span>1 mi</span>
                <span>{filters.radius} miles</span>
                <span>500 mi</span>
              </div>
            </div>
          </details>
          
          <div className="radius-hint">
            💡 Larger radius shows more players but longer travel distances
          </div>
        </div>

        {/* Game Style Filter - Multi-select dropdown */}
        <div className="filter-group" data-filter="styles">
          <label>Style</label>
          <div className={`multi-select-dropdown ${stylesDropdownOpen ? 'open' : ''}`}>
            <div className="multi-select-trigger" onClick={handleStylesDropdownToggle}>
              <span className={`selected-items-display ${filters.gameStyles.length > 0 ? 'has-selections' : ''}`}>
                {getSelectedItemsDisplay(filters.gameStyles, 'Select styles')}
              </span>
            </div>
            {stylesDropdownOpen && (
              <div className="multi-select-options">
                {['Singles', 'Doubles', 'Social', 'Competitive'].map(style => (
                  <div 
                    key={style} 
                    className={`multi-select-option ${filters.gameStyles.includes(style) ? 'selected' : ''}`}
                    onClick={(e) => handleStyleOptionClick(e, style)}
                  >
                    {style}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preferred Days Filter - Multi-select dropdown */}
        <div className="filter-group" data-filter="days">
          <label>Availability</label>
          <div className={`multi-select-dropdown ${daysDropdownOpen ? 'open' : ''}`}>
            <div className="multi-select-trigger" onClick={handleDaysDropdownToggle}>
              <span className={`selected-items-display ${filters.preferredDays.length > 0 ? 'has-selections' : ''}`}>
                {getSelectedItemsDisplay(filters.preferredDays, 'Select days')}
              </span>
            </div>
            {daysDropdownOpen && (
              <div className="multi-select-options">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <div 
                    key={day} 
                    className={`multi-select-option ${filters.preferredDays.includes(day) ? 'selected' : ''}`}
                    onClick={(e) => handleDayOptionClick(e, day)}
                  >
                    {day}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Gender Preference Filter */}
        <div className="filter-group" data-filter="gender">
          <label>Gender Preference</label>
          <select
            name="gender"
            value={filters.gender}
            onChange={handleFilterChange}
          >
            <option value="">Any</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Newcomer Filter */}
        <div className="filter-group" data-filter="newcomer">
          <label className="checkbox-item">
            <input
              type="checkbox"
              name="isNewcomer"
              checked={filters.isNewcomer}
              onChange={handleFilterChange}
            />
            <span className="checkbox-text">New to Area Only</span>
          </label>
        </div>

        <button className="apply-filters-button" onClick={handleApplyFilters}>
          Apply Filters
        </button>
        
        {/* Suggested Cities Section */}
        <div className="suggested-cities-section">
          <h3>🌍 Explore Other Cities</h3>
          <p className="section-description">
            View tennis players from popular cities around the world
          </p>
          <div className="city-buttons-grid">
            {commonCities.map(city => (
              <button
                key={city.name}
                className="city-explore-button"
                onClick={() => handleViewCityPlayers(city.name)}
                disabled={loading}
              >
                <span className="city-name">{city.name}</span>
                <span className="city-icon">{city.flag}</span>
              </button>
            ))}
          </div>
          <div className="explore-hint">
            💡 Click any city to see tennis players there
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-header">
          <div className="results-count">
            {players.length} player{players.length !== 1 ? 's' : ''} found
          </div>
          <div className="view-toggle">
            <button 
              className={`view-button ${viewMode === 'detailed' ? 'active' : ''}`}
              onClick={() => setViewMode('detailed')}
            >
              Detailed
            </button>
            <button 
              className={`view-button ${viewMode === 'compact' ? 'active' : ''}`}
              onClick={() => setViewMode('compact')}
            >
              Compact
            </button>
          </div>
        </div>

        {/* Search Metadata */}
        {searchMetadata && (
          <div className="search-metadata">
            {searchMetadata.city_search && (
              <div className="city-search-notice">
                🌍 Showing players from {searchMetadata.showing_city}
                <button 
                  className="back-to-nearby-button"
                  onClick={() => {
                    if (!isDemoMode) {
                      fetchNearbyPlayers();
                    } else {
                      // Reset to demo mode players
                      const allPlayers = getMockPlayers();
                      const filteredPlayers = applyFilters(allPlayers);
                      setPlayers(filteredPlayers);
                      setSearchMetadata({
                        total_users: filteredPlayers.length,
                        users_in_range: filteredPlayers.filter(p => p.distance <= filters.radius).length,
                        users_out_of_range: filteredPlayers.filter(p => p.distance > filters.radius).length,
                        search_radius: filters.radius,
                        showing_fallback: false
                      });
                    }
                  }}
                >
                  ← Back to Nearby Players
                </button>
              </div>
            )}
            {searchMetadata.showing_fallback && !searchMetadata.city_search && (
              <div className="fallback-notice">
                No players found within {searchMetadata.search_radius} miles. 
                Showing {searchMetadata.users_out_of_range} players from nearby areas.
              </div>
            )}
            {!searchMetadata.city_search && (
              <div className="range-info">
                {searchMetadata.users_in_range} players within {searchMetadata.search_radius} miles, 
                {searchMetadata.users_out_of_range} players outside range
              </div>
            )}
            {searchMetadata.city_search && (
              <div className="range-info">
                Found {searchMetadata.total_users} players in {searchMetadata.showing_city}
              </div>
            )}
          </div>
        )}

        {/* Players List */}
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Finding players near you...</p>
          </div>
        ) : error ? (
          <div className="error">
            {renderError()}
          </div>
        ) : players.length === 0 ? (
          <div className="no-players">
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎾</div>
              <h3 style={{ color: '#1976d2', marginBottom: '12px' }}>No Players Found</h3>
              <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                {!isDemoMode 
                  ? "No tennis players found in your area yet. This community is growing!"
                  : "Try adjusting your filters to see more players."
                }
              </p>
              {!isDemoMode && (
                <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px', margin: '16px 0', fontSize: '14px' }}>
                  <p><strong>💡 Tips to find players:</strong></p>
                  <ul style={{ textAlign: 'left', margin: '8px 0', paddingLeft: '20px' }}>
                    <li>Try increasing your search radius</li>
                    <li>Remove skill level or other filters</li>
                    <li>Check back later as more players join</li>
                    <li>Invite friends to create profiles</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {searchMetadata?.showing_fallback && (
              <div className="fallback-notice" style={{
                background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                border: '1px solid #2196f3',
                borderRadius: '12px',
                padding: '16px',
                margin: '0 0 20px 0',
                fontSize: '14px',
                color: '#1976d2',
                boxShadow: '0 2px 8px rgba(33, 150, 243, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>📍</span>
                  <strong>Expanded Search Active</strong>
                </div>
                <div style={{ lineHeight: '1.5' }}>
                  No players found within {searchMetadata.original_search_radius} miles of your location.
                  <br />
                  <strong>Expanded to {searchMetadata.actual_search_radius} miles</strong> - found {searchMetadata.total_users} players in your region!
                  <br />
                  <em style={{ color: '#7B1FA2' }}>💡 Like players to start connecting and find your perfect tennis partner</em>
                </div>
              </div>
            )}
            
            <div className={`players-list ${viewMode}`}>
              {players.map(player => (
                <div key={player.id} className="player-card">
                  {!isDemoMode && (
                    <div className={`distance-badge ${player.distance && player.distance <= filters.radius ? 'in-range' : 'out-of-range'}`}>
                      {player.distance ? `${player.distance} mi` : 'Distance N/A'}
                    </div>
                  )}
                  
                  <div className="player-photo">
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      borderRadius: '50%'
                    }}>
                      {getAnimalAvatar(player.id, player.name)}
                    </div>
                    <div className="skill-badge">{player.skillLevel}</div>
                  </div>
                  
                  <div className="player-info">
                    <h3 className="player-name">{player.name}</h3>
                    <div className="player-details">
                      <span className="location">{player.location?.city || 'Location not specified'}</span>
                      {!isDemoMode && player.distance && (
                        <span className="distance">{player.distance} miles away</span>
                      )}
                      <span className="game-styles">
                        {player.gameStyles?.join(', ') || 'Any style'}
                      </span>
                      {player.isNewToArea && (
                        <span className="newcomer-badge">New to Area</span>
                      )}
                    </div>
                    {player.bio && (
                      <p className="player-bio">{player.bio}</p>
                    )}
                  </div>
                  
                  <div className="player-actions">
                    {matches.some(match => match.playerId === player.id) ? (
                      <div className="match-actions">
                        <div className="match-indicator">
                          ⭐ It's a Match!
                        </div>
                        <button 
                          className="view-contact-button"
                          onClick={() => viewPlayerContact(player.id)}
                        >
                          💬 Contact Info
                        </button>
                      </div>
                    ) : (
                      <button 
                        className={`like-button ${likedPlayers.has(player.id) ? 'liked' : ''}`}
                        onClick={() => handleLikePlayer(player.id)}
                        disabled={!isDemoMode && !localStorage.getItem('token')}
                      >
                        {likedPlayers.has(player.id) ? '💚 Liked' : '👍 Like'}
                      </button>
                    )}
                    
                    {likedPlayers.has(player.id) && !matches.some(match => match.playerId === player.id) && (
                      <div className="like-status">
                        Waiting for response...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Modal for notifications and contact info */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        actionLabel={modal.actionLabel}
        cancelLabel={modal.cancelLabel}
        onAction={modal.onAction}
        onCancel={closeModal}
      />
    </div>
  );
};

export default NearbyPlayers; 