import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/config';
import { useDemoMode } from '../contexts/DemoModeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getMockBulletins } from '../data/mockData';
import Modal from './Modal';
import './PlayBulletin.css';
import { useTranslation } from 'react-i18next';

const PlayBulletin = () => {
  const { isDemoMode } = useDemoMode();
  const { addNotification } = useNotifications();
  const { t } = useTranslation();
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showingMockData, setShowingMockData] = useState(false);
  const [showExpired] = useState(false);
  const [filters, setFilters] = useState({
    skillLevel: '',
    gameType: '',
    startAfter: new Date().toISOString().slice(0, 16), // Default to today
  });
  const [searchRadius, setSearchRadius] = useState(25); // Default 25 miles
  const [showForm, setShowForm] = useState(false);
  const [newBulletin, setNewBulletin] = useState({
    title: '',
    description: '',
    location: {
      zipCode: '',
      city: '',
      state: '',
    },
    courtId: '',
    courtName: '',
    startTime: '',
    endTime: '',
    skillLevel: '',
    gameType: 'Either',
  });
  const [responseForm, setResponseForm] = useState({
    bulletinId: '',
    message: '',
  });
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const gameTypeOptions = ['Singles', 'Doubles', 'Either'];
  const skillLevels = ['2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5+'];

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

  const fetchBulletins = useCallback(async () => {
    setLoading(true);
    
    // Use mock data in demo mode
    if (isDemoMode) {
      setBulletins(getMockBulletins());
      setShowingMockData(true);
      setError(null);
      setLoading(false);
      return;
    }
    
    try {
      // Build query parameters
      let queryParams = new URLSearchParams();

      if (filters.skillLevel) {
        queryParams.append('skill_level', filters.skillLevel);
      }

      if (filters.gameType) {
        queryParams.append('game_type', filters.gameType);
      }

      if (filters.startAfter) {
        const startAfterDate = new Date(filters.startAfter);
        queryParams.append('start_after', startAfterDate.toISOString());
      }

      if (showExpired) {
        queryParams.append('show_expired', 'true');
      }

      // Get user's location to find nearby bulletins or use default San Francisco location
      try {
        const position = await getCurrentPosition();
        queryParams.append('latitude', position.coords.latitude);
        queryParams.append('longitude', position.coords.longitude);
        if (searchRadius < 999) {
          queryParams.append('radius', searchRadius.toString());
        }
        // If searchRadius is 999 (All Distances), don't send radius parameter
      } catch (error) {
        console.warn("Couldn't get location, using default San Francisco location");
        // Default to San Francisco coordinates
        queryParams.append('latitude', '37.7749');
        queryParams.append('longitude', '-122.4194');
        if (searchRadius < 999) {
          queryParams.append('radius', searchRadius.toString());
        }
        // If searchRadius is 999 (All Distances), don't send radius parameter
      }

      const response = await api.get(`/bulletins?${queryParams}`);
      let bulletins = response.data.bulletins || [];
      
      // In live mode, filter out seed/demo data (has specific UUID patterns)
      if (!isDemoMode) {
        bulletins = bulletins.filter(bulletin => 
          !bulletin.id.startsWith('550e8400-e29b-41d4-a716-44665544') // Filter out seed data
        );
      }
      
      setBulletins(bulletins);
      setShowingMockData(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching bulletins:', err);
      setError('Failed to load bulletins. Please try again later.');
      // In live mode, don't show mock data on error - just show empty state
      setBulletins([]);
      setShowingMockData(false);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, filters.skillLevel, filters.gameType, filters.startAfter, showExpired, searchRadius]);

  useEffect(() => {
    fetchBulletins();
  }, [fetchBulletins]);

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    fetchBulletins();
  };

  const handleRadiusChange = (e) => {
    const value = parseInt(e.target.value);
    setSearchRadius(value);
  };

  const handleNewBulletinChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setNewBulletin(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setNewBulletin(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateBulletin = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      showModal('error', 'Please Sign In', 'You need to be signed in to create a bulletin. Click "Sign In" in the top menu.');
      return;
    }
    
    try {
      // Format dates correctly for API
      const formattedBulletin = {
        title: newBulletin.title,
        description: newBulletin.description,
        location: {
          zip_code: newBulletin.location.zipCode,
          city: newBulletin.location.city,
          state: newBulletin.location.state,
          latitude: 0, // Will be set by backend default
          longitude: 0, // Will be set by backend default
        },
        court_id: newBulletin.courtId || null,
        start_time: new Date(newBulletin.startTime).toISOString(),
        end_time: new Date(newBulletin.endTime).toISOString(),
        skill_level: newBulletin.skillLevel,
        game_type: newBulletin.gameType,
      };
      
      await api.post('/bulletins', formattedBulletin);
      
      // Reset form and fetch updated bulletins
      setNewBulletin({
        title: '',
        description: '',
        location: {
          zipCode: '',
          city: '',
          state: '',
        },
        courtId: '',
        courtName: '',
        startTime: '',
        endTime: '',
        skillLevel: '',
        gameType: 'Either',
      });
      
      setShowForm(false);
      
      // Temporarily expand search radius to ensure user sees their new bulletin
      const expandedRadius = searchRadius === 999 ? 999 : Math.max(searchRadius * 2, 50); // Keep all distances or double current radius
      
      // Fetch bulletins with expanded radius to show the newly created bulletin
      try {
        let queryParams = new URLSearchParams();
        
        if (filters.skillLevel) {
          queryParams.append('skill_level', filters.skillLevel);
        }
        if (filters.gameType) {
          queryParams.append('game_type', filters.gameType);
        }
        if (filters.startAfter) {
          const startAfterDate = new Date(filters.startAfter);
          queryParams.append('start_after', startAfterDate.toISOString());
        }
        if (showExpired) {
          queryParams.append('show_expired', 'true');
        }
        
                 // Use expanded radius to ensure newly created bulletin appears
         try {
           const position = await getCurrentPosition();
           queryParams.append('latitude', position.coords.latitude);
           queryParams.append('longitude', position.coords.longitude);
           if (expandedRadius < 999) {
             queryParams.append('radius', expandedRadius);
           }
         } catch (error) {
           console.warn("Couldn't get location, using default San Francisco location");
           queryParams.append('latitude', '37.7749');
           queryParams.append('longitude', '-122.4194');
           if (expandedRadius < 999) {
             queryParams.append('radius', expandedRadius);
           }
         }
        
        const response = await api.get(`/bulletins?${queryParams}`);
        let bulletins = response.data.bulletins || [];
        
        // In live mode, filter out seed/demo data
        if (!isDemoMode) {
          bulletins = bulletins.filter(bulletin => 
            !bulletin.id.startsWith('550e8400-e29b-41d4-a716-44665544')
          );
        }
        
        setBulletins(bulletins);
        setShowingMockData(false);
        setError(null);
        
        // After a short delay, revert to normal radius
        setTimeout(() => {
          fetchBulletins();
        }, 2000);
        
      } catch (fetchError) {
        console.error('Error fetching bulletins after creation:', fetchError);
        // Fall back to normal fetch
        fetchBulletins();
      }
      
      showModal('success', 'Bulletin Posted', 'Your bulletin has been posted!');
    } catch (err) {
      console.error('Error creating bulletin:', err);
      
      if (err.response?.status === 401) {
        showModal('error', 'Session Expired', 'Your login session has expired. Please sign in again to create a bulletin.');
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (err.response?.status === 403) {
        showModal('error', 'Permission Denied', 'You do not have permission to create bulletins. Please ensure you are logged in.');
      } else {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to create bulletin. Please try again.';
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Unable to Create Bulletin',
          message: errorMessage,
          retryLabel: 'Try Again',
          cancelLabel: 'Cancel',
          onRetry: () => {
            setModal({ isOpen: false });
            // Retry the bulletin creation
            const form = document.querySelector('form');
            if (form) {
              handleCreateBulletin({ preventDefault: () => {} });
            }
          },
          onCancel: () => setModal({ isOpen: false })
        });
      }
    }
  };

  const handleShowResponseForm = (bulletinId) => {
    // Find bulletin details to pre-fill response message
    const bulletin = bulletins.find(b => b.id === bulletinId);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Create default response message with location, time, and contact info
    let defaultMessage = '';
    if (bulletin) {
      const startTime = bulletin.start_time ? new Date(bulletin.start_time).toLocaleString() : 'TBD';
      const location = bulletin.court_name || `${bulletin.location?.city || 'TBD'}, ${bulletin.location?.state || 'TBD'}`;
      
      defaultMessage = `Hi! I'm interested in playing tennis with you.

📍 Location: ${location}
⏰ Time: ${startTime}
🎾 Skill Level: ${bulletin.skill_level || 'TBD'}
🏆 Game Type: ${bulletin.game_type || 'Either'}

Feel free to reach out to me at:
📱 Phone: [Your phone number]
💬 LINE ID: [Your LINE ID]

Looking forward to playing with you!`;
    }

    setResponseForm({
      bulletinId,
      message: defaultMessage,
    });
  };

  const handleResponseChange = (e) => {
    setResponseForm(prev => ({
      ...prev,
      message: e.target.value
    }));
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      showModal('error', 'Please Sign In', 'You need to be signed in to respond to bulletins. Click "Sign In" in the top menu.');
      return;
    }
    
    try {
      await api.post(`/bulletins/${responseForm.bulletinId}/respond`, {
        message: responseForm.message
      });
      
      // Reset form and fetch updated bulletins
      setResponseForm({
        bulletinId: '',
        message: '',
      });
      
      fetchBulletins();
      
      // Find the bulletin details for notification
      const targetBulletin = bulletins.find(b => b.id === responseForm.bulletinId);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (targetBulletin) {
        // NOTE: In a real app, this notification would be sent to the bulletin owner
        // via backend/websocket. Here we simulate it for demo purposes.
        // The bulletin owner (targetBulletin.user_id) should get the notification,
        // not the person responding (currentUser.id)
        
        addNotification({
          type: 'match_request',
          title: 'New Match Request',
          message: `${currentUser.name || 'Someone'} responded to your "${targetBulletin.title}" bulletin`,
          avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
          actionRequired: true,
          bulletinId: targetBulletin.id,
          responderId: currentUser.id
        });
      }
      
      showModal('success', 'Response Sent', 'Your response has been sent to the bulletin owner! They will be notified and can accept or decline your request.');
    } catch (err) {
      console.error('Error responding to bulletin:', err);
      
      if (err.response?.status === 401) {
        showModal('error', 'Session Expired', 'Your login session has expired. Please sign in again to respond to bulletins.');
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (err.response?.status === 403) {
        showModal('error', 'Permission Denied', 'You do not have permission to respond to bulletins. Please ensure you are logged in.');
      } else {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to respond. Please try again.';
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Unable to Send Response',
          message: errorMessage,
          retryLabel: 'Try Again',
          cancelLabel: 'Cancel',
          onRetry: () => {
            setModal({ isOpen: false });
            // Retry the response sending
            handleSendResponse({ preventDefault: () => {} });
          },
          onCancel: () => setModal({ isOpen: false })
        });
      }
    }
  };

  const handleResponseAction = async (bulletinId, responseId, action) => {
    try {
      await api.put(`/bulletins/${bulletinId}/response/${responseId}`, {
        status: action
      });
      
      fetchBulletins();
      
      // Find the response details to notify the person who responded
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const targetBulletin = bulletins.find(b => b.id === bulletinId);
      
      // NOTE: In a real app, this notification would be sent to the responder
      // via backend/websocket. Here we simulate it for demo purposes.
      // The person who responded should get the notification about acceptance/decline
      
      addNotification({
        type: action === 'Accepted' ? 'partner_found' : 'match_declined',
        title: action === 'Accepted' ? 'Partner Found!' : 'Response Update',
        message: action === 'Accepted' 
          ? `Your match request for "${targetBulletin?.title || 'a tennis match'}" has been accepted! Check your messages for contact details.`
          : `Your match request for "${targetBulletin?.title || 'a tennis match'}" was declined. Keep looking for other matches!`,
        avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
      });
      
      showModal('success', 'Response Updated', `Response ${action.toLowerCase()} successfully!`);
    } catch (err) {
      console.error('Error updating response:', err);
      showModal('error', 'Update Failed', 'Failed to update response. Please try again.');
    }
  };

  const handleDeleteBulletin = (bulletinId) => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Delete Bulletin',
      message: 'Are you sure you want to delete this bulletin? This action cannot be undone.',
      actionLabel: 'Delete',
      cancelLabel: 'Cancel',
      onAction: async () => {
        try {
          await api.delete(`/bulletins/${bulletinId}`);
          fetchBulletins();
          showModal('success', 'Bulletin Deleted', 'Bulletin deleted successfully!');
        } catch (err) {
          console.error('Error deleting bulletin:', err);
          const errorMessage = err.response?.data?.error || err.message || 'Failed to delete bulletin. Please try again.';
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Unable to Delete Bulletin',
            message: errorMessage,
            retryLabel: 'Try Again',
            cancelLabel: 'Cancel',
            onRetry: () => {
              setModal({ isOpen: false });
              handleDeleteBulletin(bulletinId); // Retry the same operation
            },
            onCancel: () => setModal({ isOpen: false })
          });
        }
      }
    });
  };

  // Helper functions
  const getTennisImage = (bulletinId, gameType, courtName) => {
    // Court-specific images
    const courtImages = {
      'Golden Gate Park': "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop", // Park tennis courts
      'Mission Bay': "https://images.unsplash.com/photo-1544966503-7e33b7f9e23d?w=400&h=300&fit=crop", // Modern tennis facility
      'Presidio': "https://images.unsplash.com/photo-1585518419759-7fe2e0fbf8a6?w=400&h=300&fit=crop", // Professional courts
    };

    // Game type specific images
    const gameTypeImages = {
      'Doubles': "https://images.unsplash.com/photo-1561043433-aaf687c4cf04?w=400&h=300&fit=crop", // Doubles court
      'Singles': "https://images.unsplash.com/photo-1552072805-b3f9e9a8e1a8?w=400&h=300&fit=crop", // Singles action
    };

    // General tennis images for variety
    const generalImages = [
      "https://images.unsplash.com/photo-1554284126-aa88f22d8b74?w=400&h=300&fit=crop", // Tennis court aerial
      "https://images.unsplash.com/photo-1569935228399-d38b31844ad9?w=400&h=300&fit=crop", // Tennis ball and racket
      "https://images.unsplash.com/photo-1494622526613-9fc2b16e8b3e?w=400&h=300&fit=crop", // Tennis racket close-up
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop", // Tennis court with shadows
      "https://images.unsplash.com/photo-1490653651676-c91b6c8e2bab?w=400&h=300&fit=crop", // Tennis net view
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=300&fit=crop", // Tennis balls
    ];

    // Check for court-specific image first
    if (courtName) {
      for (const [courtKey, image] of Object.entries(courtImages)) {
        if (courtName.toLowerCase().includes(courtKey.toLowerCase())) {
          return image;
        }
      }
    }

    // Then check game type
    if (gameType && gameTypeImages[gameType]) {
      return gameTypeImages[gameType];
    }

    // Fall back to general tennis images based on bulletin ID
    const imageIndex = parseInt(bulletinId.slice(-1), 16) % generalImages.length;
    return generalImages[imageIndex];
  };

  const isUserBulletin = (bulletin) => {
    // Check if the bulletin belongs to the current user
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = currentUser.id;
    
    // If no current user or no bulletin user_id, return false
    if (!currentUserId || !bulletin.user_id) {
      return false;
    }
    
    return bulletin.user_id === currentUserId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-[#0d141c] text-lg">{t('bulletin.loading')}</div>
      </div>
    );
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-slate-50 group/design-root overflow-x-hidden" style={{fontFamily: '"Spline Sans", "Noto Sans", sans-serif'}}>
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <div className="flex min-w-72 flex-col gap-3">
                <p className="text-[#0d141c] tracking-light text-[32px] font-bold leading-tight">{t('bulletin.title')}</p>
                <p className="text-[#49739c] text-sm font-normal leading-normal">{t('bulletin.subtitle')}</p>
                
                {/* Mock data / Error indicator */}
                {(showingMockData || (error && !showingMockData)) && (
                  <div className={`rounded-lg p-3 mt-2 ${error && !showingMockData ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                    <div className="flex items-center gap-2">
                      {(error && !showingMockData) ? (
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">!</span>
                        </div>
                      ) : (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">i</span>
                        </div>
                      )}
                      <p className={`${error && !showingMockData ? 'text-red-700' : 'text-blue-700'} text-sm font-medium`}>
                        {error && !showingMockData ? 'Error' : 'Demo Mode'}
                      </p>
                    </div>
                    <p className={`${error && !showingMockData ? 'text-red-600' : 'text-blue-600'} text-xs mt-1`}>
                      {error ? 
                        (showingMockData ? t('bulletin.demo.errorMessage') : error) :
                        t('bulletin.demo.demoMessage')
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex gap-3 p-3 flex-wrap pr-4">
              <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-[#e7edf4] pl-4 pr-4">
                <label htmlFor="filter-skill-level" className="sr-only">Filter by Skill Level</label>
                <select
                  id="filter-skill-level"
                  name="skillLevel"
                  value={filters.skillLevel}
                  onChange={handleFilterChange}
                  className="text-[#0d141c] text-sm font-medium leading-normal bg-transparent border-none outline-none"
                >
                  <option value="">{t('bulletin.filters.skillLevel')}</option>
                  {skillLevels.map(level => (
                    <option key={level} value={level}>{level} NTRP</option>
                  ))}
                </select>
              </div>
              <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-[#e7edf4] pl-4 pr-4">
                <label htmlFor="filter-game-type" className="sr-only">Filter by Game Type</label>
                <select
                  id="filter-game-type"
                  name="gameType"
                  value={filters.gameType}
                  onChange={handleFilterChange}
                  className="text-[#0d141c] text-sm font-medium leading-normal bg-transparent border-none outline-none"
                >
                  <option value="">{t('bulletin.filters.gameType')}</option>
                  {gameTypeOptions.map(type => (
                    <option key={type} value={type}>{t(`bulletin.gameTypes.${type.toLowerCase()}`)}</option>
                  ))}
                </select>
              </div>
              <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-[#e7edf4] pl-4 pr-4">
                <label htmlFor="filter-start-after" className="sr-only">Filter by Available After</label>
                <input
                  id="filter-start-after"
                  type="datetime-local"
                  name="startAfter"
                  value={filters.startAfter}
                  onChange={handleFilterChange}
                  className="text-[#0d141c] text-sm font-medium leading-normal bg-transparent border-none outline-none"
                  placeholder="Available After"
                />
              </div>
              {/* Search Radius Slider */}
              <div className="flex items-center gap-x-3 rounded-xl bg-[#e7edf4] pl-4 pr-4 py-2" title={searchRadius === 999 ? 'Search all bulletins regardless of distance' : `Search within ${searchRadius} miles of your location`}>
                <label htmlFor="search-radius" className="text-[#0d141c] text-sm font-medium leading-normal whitespace-nowrap min-w-[90px]">
                  {searchRadius === 999 ? t('bulletin.distance.allDistances') : `${searchRadius} ${t('bulletin.distance.miles')}`}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="search-radius"
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={searchRadius === 999 ? 100 : searchRadius}
                    onChange={handleRadiusChange}
                    className="w-24 h-3 bg-[#c4d5e6] rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3d98f4 0%, #3d98f4 ${searchRadius === 999 ? 100 : (searchRadius - 5) / 95 * 100}%, #c4d5e6 ${searchRadius === 999 ? 100 : (searchRadius - 5) / 95 * 100}%, #c4d5e6 100%)`
                    }}
                  />
                  <button
                    onClick={() => setSearchRadius(999)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      searchRadius === 999 
                        ? 'bg-[#3d98f4] text-white' 
                        : 'bg-white text-[#3d98f4] border border-[#3d98f4] hover:bg-[#3d98f4] hover:text-white'
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>
              <button 
                onClick={handleApplyFilters}
                className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-[#3d98f4] text-white pl-4 pr-4 hover:bg-[#2d88e4] transition-colors"
              >
                <span className="text-sm font-medium leading-normal">{t('nearbyPlayers.filters.applyFilters')}</span>
              </button>
            </div>

            <div className="flex justify-between items-center px-4 pb-3 pt-5">
              <h2 className="text-[#0d141c] text-[22px] font-bold leading-tight tracking-[-0.015em]">Available Matches</h2>
              {!isDemoMode && !loading && (
                <span className="text-[#49739c] text-sm">
                  {bulletins.length} bulletin{bulletins.length !== 1 ? 's' : ''} {searchRadius === 999 ? 'found' : `within ${searchRadius} miles`}
                </span>
              )}
            </div>
            
            {/* Bulletins List */}
            <div className="space-y-4 px-4">
              {bulletins.length === 0 ? (
                <div className="text-center py-8 text-[#49739c]">
                  {isDemoMode ? 
                    'No bulletins found matching your criteria. Create one to get started!' :
                    `No bulletins found ${searchRadius === 999 ? '' : `within ${searchRadius} miles `}matching your criteria. ${searchRadius === 999 ? 'Create one to get started!' : 'Try increasing the search radius or create one to get started!'}`
                  }
                </div>
              ) : (
                bulletins.map(bulletin => (
                  <div key={bulletin.id} className="p-4">
                    <div className="flex items-stretch justify-between gap-4 rounded-xl">
                      <div className="flex flex-col gap-1 flex-[2_2_0px]">
                        <p className="text-[#49739c] text-sm font-normal leading-normal">Posted by {bulletin.user_name}</p>
                        <p className="text-[#0d141c] text-base font-bold leading-tight">{bulletin.title}</p>
                        <p className="text-[#49739c] text-sm font-normal leading-normal">
                          Date: {new Date(bulletin.start_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} | 
                          Time: {new Date(bulletin.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} | 
                          Location: {bulletin.court_name || bulletin.location?.city || 'Not specified'} | 
                          Skill Level: {bulletin.skill_level || 'Not specified'}
                        </p>
                        
                        {/* Response form for other users' bulletins */}
                        {bulletin.is_active && !isUserBulletin(bulletin) && (
                          <div className="mt-3">
                            {responseForm.bulletinId === bulletin.id ? (
                              <form onSubmit={handleSendResponse} className="space-y-2">
                                <textarea
                                  placeholder="Write your response..."
                                  value={responseForm.message}
                                  onChange={handleResponseChange}
                                  required
                                  className="w-full p-2 border border-[#e7edf4] rounded-lg text-sm resize-none"
                                  rows="3"
                                />
                                <div className="flex gap-2">
                                  <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-[#3d98f4] text-white text-sm font-medium rounded-lg hover:bg-[#2d88e4] transition-colors"
                                  >
                                    Send
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => setResponseForm({ bulletinId: '', message: '' })}
                                    className="px-4 py-2 bg-[#e7edf4] text-[#0d141c] text-sm font-medium rounded-lg hover:bg-[#d7dde4] transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button 
                                onClick={() => handleShowResponseForm(bulletin.id)}
                                className="px-4 py-2 bg-[#3d98f4] text-white text-sm font-medium rounded-lg hover:bg-[#2d88e4] transition-colors"
                              >
                                Respond
                              </button>
                            )}
                          </div>
                        )}

                        {/* Status indicator for user's own bulletins */}
                        {bulletin.is_active && isUserBulletin(bulletin) && (
                          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-700 text-sm font-medium">
                              📝 This is your bulletin - Others can respond to you
                            </p>
                          </div>
                        )}

                        {/* User's bulletin responses */}
                        {isUserBulletin(bulletin) && bulletin.responses && bulletin.responses.length > 0 && (
                          <div className="mt-4 space-y-3">
                            <h4 className="text-[#0d141c] font-semibold text-lg">Responses ({bulletin.responses.length})</h4>
                            {bulletin.responses.map(response => {
                              // Helper function to format date safely
                              const formatResponseDate = (response) => {
                                const dateStr = response.createdAt || response.created_at || response.date_created || response.timestamp;
                                if (!dateStr) return 'Recently';
                                
                                try {
                                  const date = new Date(dateStr);
                                  if (isNaN(date.getTime())) return 'Recently';
                                  
                                  const now = new Date();
                                  const diffInHours = (now - date) / (1000 * 60 * 60);
                                  
                                  if (diffInHours < 1) return 'Just now';
                                  if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
                                  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
                                  
                                  return date.toLocaleDateString();
                                } catch (error) {
                                  return 'Recently';
                                }
                              };

                              return (
                                <div key={response.id} className="border border-[#e7edf4] bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                  {/* Response Header */}
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                      {/* User Avatar */}
                                      <div className="w-10 h-10 bg-[#3d98f4] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                        {(response.user_name || response.userName || 'U').charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <span className="text-[#0d141c] font-semibold text-sm">
                                          {response.user_name || response.userName || 'Anonymous User'}
                                        </span>
                                        <div className="text-[#49739c] text-xs">
                                          {formatResponseDate(response)}
                                        </div>
                                      </div>
                                    </div>
                                    {/* Status Badge */}
                                    {response.status !== 'Pending' && (
                                      <div className={`px-3 py-1 text-xs font-medium rounded-full ${
                                        response.status === 'Accepted' 
                                          ? 'bg-green-100 text-green-700 border border-green-200' 
                                          : 'bg-red-100 text-red-700 border border-red-200'
                                      }`}>
                                        {response.status}
                                      </div>
                                    )}
                                  </div>

                                  {/* Response Message */}
                                  <div className="mb-3">
                                    <p className="text-[#0d141c] text-sm leading-relaxed whitespace-pre-wrap">
                                      {response.message}
                                    </p>
                                  </div>

                                  {/* Action Buttons for Pending Responses */}
                                  {response.status === 'Pending' && (
                                    <div className="flex gap-2 pt-2 border-t border-[#f0f2f5]">
                                      <button 
                                        className="flex-1 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                        onClick={() => handleResponseAction(bulletin.id, response.id, 'Accepted')}
                                      >
                                        ✓ Accept
                                      </button>
                                      <button 
                                        className="flex-1 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                        onClick={() => handleResponseAction(bulletin.id, response.id, 'Declined')}
                                      >
                                        ✗ Decline
                                      </button>
                                    </div>
                                  )}

                                  {/* Accepted/Declined Status Message */}
                                  {response.status === 'Accepted' && (
                                    <div className="pt-2 border-t border-[#f0f2f5]">
                                      <p className="text-green-600 text-sm font-medium flex items-center gap-2">
                                        ✓ You accepted this match request
                                      </p>
                                    </div>
                                  )}
                                  {response.status === 'Declined' && (
                                    <div className="pt-2 border-t border-[#f0f2f5]">
                                      <p className="text-red-600 text-sm font-medium flex items-center gap-2">
                                        ✗ You declined this match request
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Delete button for user's bulletins */}
                        {isUserBulletin(bulletin) && (
                          <button
                            onClick={() => handleDeleteBulletin(bulletin.id)}
                            className="mt-3 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors self-start"
                          >
                            🗑️ Delete Bulletin
                          </button>
                        )}
                      </div>
                      <div
                        className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex-1"
                        style={{backgroundImage: `url("${getTennisImage(bulletin.id, bulletin.game_type, bulletin.court_name)}")`}}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Post New Request Button */}
            <div className="flex px-4 py-3 justify-end">
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#3d98f4] text-slate-50 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#2d88e4] transition-colors"
              >
                <span className="truncate">{showForm ? 'Cancel' : 'Post a New Request'}</span>
              </button>
            </div>

            {/* Create Bulletin Form */}
            {showForm && (
              <div className="p-4 bg-white rounded-xl border border-[#e7edf4] mx-4 mb-4">
                <h2 className="text-[#0d141c] text-xl font-bold mb-4">Post a New Bulletin</h2>
                <form onSubmit={handleCreateBulletin} className="space-y-4">
                  <div>
                    <label htmlFor="bulletin-title" className="block text-[#0d141c] text-sm font-medium mb-1">Title</label>
                    <input
                      id="bulletin-title"
                      type="text"
                      name="title"
                      value={newBulletin.title}
                      onChange={handleNewBulletinChange}
                      placeholder="e.g., Looking for a hitting partner this weekend"
                      required
                      className="w-full p-3 border border-[#e7edf4] rounded-lg text-[#0d141c] focus:outline-none focus:ring-2 focus:ring-[#3d98f4] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bulletin-description" className="block text-[#0d141c] text-sm font-medium mb-1">Description</label>
                    <textarea
                      id="bulletin-description"
                      name="description"
                      value={newBulletin.description}
                      onChange={handleNewBulletinChange}
                      placeholder="Provide more details about your availability and preferences"
                      required
                      rows="3"
                      className="w-full p-3 border border-[#e7edf4] rounded-lg text-[#0d141c] focus:outline-none focus:ring-2 focus:ring-[#3d98f4] focus:border-transparent resize-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="bulletin-zipCode" className="block text-[#0d141c] text-sm font-medium mb-1">Zip Code <span className="text-[#49739c] text-xs">(optional)</span></label>
                      <input
                        id="bulletin-zipCode"
                        type="text"
                        name="location.zipCode"
                        value={newBulletin.location.zipCode}
                        onChange={handleNewBulletinChange}
                        placeholder="e.g., 94117"
                        className="w-full p-3 border border-[#e7edf4] rounded-lg text-[#0d141c] focus:outline-none focus:ring-2 focus:ring-[#3d98f4] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="bulletin-city" className="block text-[#0d141c] text-sm font-medium mb-1">City</label>
                      <input
                        id="bulletin-city"
                        type="text"
                        name="location.city"
                        value={newBulletin.location.city}
                        onChange={handleNewBulletinChange}
                        placeholder="e.g., San Francisco"
                        required
                        className="w-full p-3 border border-[#e7edf4] rounded-lg text-[#0d141c] focus:outline-none focus:ring-2 focus:ring-[#3d98f4] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="bulletin-state" className="block text-[#0d141c] text-sm font-medium mb-1">State <span className="text-[#49739c] text-xs">(optional)</span></label>
                      <input
                        id="bulletin-state"
                        type="text"
                        name="location.state"
                        value={newBulletin.location.state}
                        onChange={handleNewBulletinChange}
                        placeholder="e.g., CA"
                        className="w-full p-3 border border-[#e7edf4] rounded-lg text-[#0d141c] focus:outline-none focus:ring-2 focus:ring-[#3d98f4] focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="bulletin-courtName" className="block text-[#0d141c] text-sm font-medium mb-1">Preferred Court (optional)</label>
                    <input
                      id="bulletin-courtName"
                      type="text"
                      name="courtName"
                      value={newBulletin.courtName}
                      onChange={handleNewBulletinChange}
                      placeholder="e.g., Golden Gate Park Tennis Courts"
                      className="w-full p-3 border border-[#e7edf4] rounded-lg text-[#0d141c] focus:outline-none focus:ring-2 focus:ring-[#3d98f4] focus:border-transparent"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="bulletin-startTime" className="block text-[#0d141c] text-sm font-medium mb-1">Start Time</label>
                      <input
                        id="bulletin-startTime"
                        type="datetime-local"
                        name="startTime"
                        value={newBulletin.startTime}
                        onChange={handleNewBulletinChange}
                        required
                        className="w-full p-3 border border-[#e7edf4] rounded-lg text-[#0d141c] focus:outline-none focus:ring-2 focus:ring-[#3d98f4] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="bulletin-endTime" className="block text-[#0d141c] text-sm font-medium mb-1">End Time</label>
                      <input
                        id="bulletin-endTime"
                        type="datetime-local"
                        name="endTime"
                        value={newBulletin.endTime}
                        onChange={handleNewBulletinChange}
                        required
                        className="w-full p-3 border border-[#e7edf4] rounded-lg text-[#0d141c] focus:outline-none focus:ring-2 focus:ring-[#3d98f4] focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="bulletin-skillLevel" className="block text-[#0d141c] text-sm font-medium mb-1">Skill Level</label>
                      <select
                        id="bulletin-skillLevel"
                        name="skillLevel"
                        value={newBulletin.skillLevel}
                        onChange={handleNewBulletinChange}
                        required
                        className="w-full p-3 border border-[#e7edf4] rounded-lg text-[#0d141c] focus:outline-none focus:ring-2 focus:ring-[#3d98f4] focus:border-transparent"
                      >
                        <option value="">Select skill level</option>
                        {skillLevels.map(level => (
                          <option key={level} value={level}>{level} NTRP</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="bulletin-gameType" className="block text-[#0d141c] text-sm font-medium mb-1">Game Type</label>
                      <select
                        id="bulletin-gameType"
                        name="gameType"
                        value={newBulletin.gameType}
                        onChange={handleNewBulletinChange}
                        required
                        className="w-full p-3 border border-[#e7edf4] rounded-lg text-[#0d141c] focus:outline-none focus:ring-2 focus:ring-[#3d98f4] focus:border-transparent"
                      >
                        {gameTypeOptions.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="w-full py-3 bg-[#3d98f4] text-white font-bold rounded-lg hover:bg-[#2d88e4] transition-colors"
                  >
                    Post Bulletin
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
              <Modal
          isOpen={modal.isOpen}
          type={modal.type}
          title={modal.title}
          message={modal.message}
          actionLabel={modal.actionLabel}
          cancelLabel={modal.cancelLabel}
          onAction={modal.onAction}
          onClose={closeModal}
        />
    </div>
  );
};

export default PlayBulletin; 