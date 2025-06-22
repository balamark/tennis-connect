import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/config';
import { useDemoMode } from '../contexts/DemoModeContext';
import { getMockBulletins } from '../data/mockData';
import Modal from './Modal';

const PlayBulletin = () => {
  const { isDemoMode } = useDemoMode();
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showingMockData, setShowingMockData] = useState(false);
  const [showExpired] = useState(false);
  const [filters, setFilters] = useState({
    skillLevel: '',
    gameType: '',
    startAfter: '',
  });
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
        queryParams.append('radius', '25'); // 25 miles radius
      } catch (error) {
        console.warn("Couldn't get location, using default San Francisco location");
        // Default to San Francisco coordinates
        queryParams.append('latitude', '37.7749');
        queryParams.append('longitude', '-122.4194');
        queryParams.append('radius', '25');
      }

      const response = await api.get(`/bulletins?${queryParams}`);
      setBulletins(response.data.bulletins || []);
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
  }, [isDemoMode, filters.skillLevel, filters.gameType, filters.startAfter, showExpired]);

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
      showModal('error', 'Authentication Required', 'Please log in to create a bulletin. Click "Sign In" in the top menu.');
      return;
    }
    
    try {
      // Format dates correctly for API
      const formattedBulletin = {
        ...newBulletin,
        startTime: new Date(newBulletin.startTime).toISOString(),
        endTime: new Date(newBulletin.endTime).toISOString(),
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
      fetchBulletins();
      
      showModal('success', 'Bulletin Posted', 'Your bulletin has been posted!');
    } catch (err) {
      console.error('Error creating bulletin:', err);
      
      if (err.response?.status === 401) {
        showModal('error', 'Authentication Required', 'Your session has expired. Please log in again to create a bulletin.');
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (err.response?.status === 403) {
        showModal('error', 'Access Denied', 'You do not have permission to create bulletins. Please ensure you are logged in.');
      } else {
        const errorMessage = err.response?.data?.error || 'Failed to create bulletin. Please try again.';
        showModal('error', 'Error', errorMessage);
      }
    }
  };

  const handleShowResponseForm = (bulletinId) => {
    setResponseForm({
      bulletinId,
      message: '',
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
      showModal('error', 'Authentication Required', 'Please log in to respond to bulletins. Click "Sign In" in the top menu.');
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
      
      showModal('success', 'Response Sent', 'Your response has been sent!');
    } catch (err) {
      console.error('Error responding to bulletin:', err);
      
      if (err.response?.status === 401) {
        showModal('error', 'Authentication Required', 'Your session has expired. Please log in again to respond to bulletins.');
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (err.response?.status === 403) {
        showModal('error', 'Access Denied', 'You do not have permission to respond to bulletins. Please ensure you are logged in.');
      } else {
        const errorMessage = err.response?.data?.error || 'Failed to respond. Please try again.';
        showModal('error', 'Error', errorMessage);
      }
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
          showModal('error', 'Error', 'Failed to delete bulletin. Please try again.');
        }
      }
    });
  };

  // Helper functions (removed unused formatDateTime)

  const isUserBulletin = (bulletin) => {
    // Check if the bulletin belongs to the current user
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = currentUser.id;
    
    // If no current user or no bulletin userId, return false
    if (!currentUserId || !bulletin.userId) {
      return false;
    }
    
    return bulletin.userId === currentUserId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-[#0d141c] text-lg">Loading bulletins...</div>
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
                <p className="text-[#0d141c] tracking-light text-[32px] font-bold leading-tight">Play Bulletin Board</p>
                <p className="text-[#49739c] text-sm font-normal leading-normal">Find a match partner or respond to requests from other players. 🎾</p>
                
                {/* Mock data / Error indicator */}
                {(showingMockData || error) && (
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
                        (showingMockData ? 'Unable to connect to server. Showing sample bulletins to demonstrate the feature.' : error) :
                        'No bulletins found in your area. Showing sample bulletins to demonstrate the feature.'
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
                  <option value="">Skill Level</option>
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
                  <option value="">Game Type</option>
                  {gameTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
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
              <button 
                onClick={handleApplyFilters}
                className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-[#3d98f4] text-white pl-4 pr-4 hover:bg-[#2d88e4] transition-colors"
              >
                <span className="text-sm font-medium leading-normal">Apply Filters</span>
              </button>
            </div>

            <h2 className="text-[#0d141c] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Available Matches</h2>
            
            {/* Bulletins List */}
            <div className="space-y-4 px-4">
              {bulletins.length === 0 ? (
                <div className="text-center py-8 text-[#49739c]">
                  No bulletins found matching your criteria. Create one to get started!
                </div>
              ) : (
                bulletins.map(bulletin => (
                  <div key={bulletin.id} className="p-4">
                    <div className="flex items-stretch justify-between gap-4 rounded-xl">
                      <div className="flex flex-col gap-1 flex-[2_2_0px]">
                        <p className="text-[#49739c] text-sm font-normal leading-normal">Posted by {bulletin.userName}</p>
                        <p className="text-[#0d141c] text-base font-bold leading-tight">{bulletin.title}</p>
                        <p className="text-[#49739c] text-sm font-normal leading-normal">
                          Date: {new Date(bulletin.startTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} | 
                          Time: {new Date(bulletin.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} | 
                          Location: {bulletin.courtName} | 
                          Skill Level: {bulletin.skillLevel}
                        </p>
                        
                        {/* Response form */}
                        {bulletin.isActive && !isUserBulletin(bulletin) && (
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

                        {/* User's bulletin responses */}
                        {isUserBulletin(bulletin) && bulletin.responses && bulletin.responses.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <h4 className="text-[#0d141c] font-medium">Responses ({bulletin.responses.length})</h4>
                            {bulletin.responses.map(response => (
                              <div key={response.id} className="bg-[#f8f9fa] p-3 rounded-lg">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-[#0d141c] font-medium text-sm">{response.userName}</span>
                                  <span className="text-[#49739c] text-xs">
                                    {new Date(response.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-[#49739c] text-sm">{response.message}</p>
                                {response.status === 'Pending' && (
                                  <div className="flex gap-2 mt-2">
                                    <button 
                                      className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                                      onClick={() => alert('Accept/Decline functionality coming soon!')}
                                    >
                                      Accept
                                    </button>
                                    <button 
                                      className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                                      onClick={() => alert('Accept/Decline functionality coming soon!')}
                                    >
                                      Decline
                                    </button>
                                  </div>
                                )}
                                {response.status !== 'Pending' && (
                                  <div className={`inline-block px-2 py-1 text-xs rounded mt-2 ${
                                    response.status === 'Accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {response.status}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Delete button for user's bulletins */}
                        {isUserBulletin(bulletin) && (
                          <button
                            onClick={() => handleDeleteBulletin(bulletin.id)}
                            className="mt-2 text-red-600 text-sm hover:text-red-800 transition-colors self-start"
                          >
                            Delete Bulletin
                          </button>
                        )}
                      </div>
                      <div
                        className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex-1"
                        style={{backgroundImage: `url("https://images.unsplash.com/photo-1554284126-aa88f22d8b74?w=400&h=300&fit=crop")`}}
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