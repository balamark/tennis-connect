import React, { useState, useEffect, useCallback } from 'react';
import ComingSoon from './ComingSoon';
import axios from 'axios';
import useFetch from '../hooks/useFetch';
import './Communities.css';

const Communities = () => {
  // Show Coming Soon message for now since this feature is not fully implemented
  return (
    <ComingSoon 
      title="Tennis Communities" 
      message="Join tennis communities in your area! Connect with players, share tips, and organize group activities."
      icon="👥"
    />
  );

  // The rest of the component code is commented out for now
  /*
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    radius: '25' // miles
  });

  const communityTypes = ['General', 'Women-only', 'Beginners', 'Location-based', 'Advanced'];

  // Mock data for development
  const getMockCommunities = () => [
    {
      id: '1',
      name: 'SF Tennis Players',
      description: 'A community for all tennis players in San Francisco',
      location: {
        city: 'San Francisco',
        state: 'CA'
      },
      type: 'General',
      members: [
        {
          id: 'member1',
          userName: 'Admin User',
          role: 'Admin',
          joinedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString() // 30 days ago
        },
        {
          id: 'member2',
          userName: 'Regular User',
          role: 'Member',
          joinedAt: new Date(Date.now() - 15 * 24 * 3600000).toISOString() // 15 days ago
        }
      ],
      createdAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString() // 30 days ago
    },
    {
      id: '2',
      name: 'Women\'s Tennis SF',
      description: 'A community for women tennis players in San Francisco',
      location: {
        city: 'San Francisco',
        state: 'CA'
      },
      type: 'Women-only',
      members: [
        {
          id: 'member3',
          userName: 'Admin User',
          role: 'Admin',
          joinedAt: new Date(Date.now() - 45 * 24 * 3600000).toISOString() // 45 days ago
        }
      ],
      createdAt: new Date(Date.now() - 45 * 24 * 3600000).toISOString() // 45 days ago
    },
    {
      id: '3',
      name: 'Tennis Beginners Bay Area',
      description: 'A supportive community for beginning tennis players',
      location: {
        city: 'San Francisco',
        state: 'CA'
      },
      type: 'Beginners',
      members: [
        {
          id: 'member4',
          userName: 'Admin User',
          role: 'Admin',
          joinedAt: new Date(Date.now() - 60 * 24 * 3600000).toISOString() // 60 days ago
        }
      ],
      createdAt: new Date(Date.now() - 60 * 24 * 3600000).toISOString() // 60 days ago
    }
  ];

  const getMockMessages = () => [
    {
      id: 'msg1',
      userName: 'Admin User',
      content: 'Welcome to the community! This is a place to discuss all things tennis in the Bay Area.',
      createdAt: new Date(Date.now() - 29 * 24 * 3600000).toISOString() // 29 days ago
    },
    {
      id: 'msg2',
      userName: 'Regular User',
      content: 'Thanks for creating this group! Is anyone free for a hit this weekend at Golden Gate Park?',
      createdAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString() // 14 days ago
    },
    {
      id: 'msg3',
      userName: 'Admin User',
      content: 'I\'m free on Saturday morning if anyone wants to play!',
      createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString() // 7 days ago
    }
  ];

  // Define the fetch function for communities
  const fetchCommunitiesFunction = useCallback(async (location) => {
    // Build query parameters
    let queryParams = new URLSearchParams();

    if (filters.type) {
      queryParams.append('type', filters.type);
    }

    if (filters.radius) {
      queryParams.append('radius', filters.radius);
    }

    queryParams.append('latitude', location.latitude);
    queryParams.append('longitude', location.longitude);

    const response = await axios.get(`/api/communities?${queryParams}`);
    return response.data.communities || [];
  }, [filters.type, filters.radius]);

  // Use the custom hook for communities
  const { data: communities, loading, error, refetch } = useFetch(
    fetchCommunitiesFunction,
    [filters.type, filters.radius],
    {
      getMockData: getMockCommunities,
      useLocation: true,
      autoFetch: true
    }
  );

  const fetchCommunityMessages = useCallback(async (communityId) => {
    setMessagesLoading(true);
    try {
      const response = await axios.get(`/api/communities/${communityId}/messages`);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Error fetching community messages:', err);
      // Use mock messages
      setMessages(getMockMessages());
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCommunity) {
      fetchCommunityMessages(selectedCommunity.id);
    }
  }, [selectedCommunity, fetchCommunityMessages]);



  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    refetch();
  };

  const handleCommunitySelect = (community) => {
    setSelectedCommunity(community);
  };

  const handleJoinCommunity = async (communityId) => {
    try {
      await axios.post(`/api/communities/${communityId}/join`);
      
      // Update the selected community to show the user as a member
      const userInfo = JSON.parse(localStorage.getItem('user')) || { name: 'Current User' };
      
      setSelectedCommunity(prev => {
        if (!prev) return null;
        
        const newMember = {
          id: 'temp-id-' + Date.now(),
          userId: userInfo.id || 'temp-user-id',
          userName: userInfo.name,
          role: 'Member',
          joinedAt: new Date().toISOString()
        };
        
        return {
          ...prev,
          members: [...prev.members, newMember]
        };
      });
      
      alert('You have successfully joined this community!');
    } catch (err) {
      console.error('Error joining community:', err);
      alert('Failed to join community. Please try again.');
    }
  };

  const handlePostMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedCommunity) return;
    
    try {
      const response = await axios.post(`/api/communities/${selectedCommunity.id}/message`, {
        content: newMessage
      });
      
      // Add the new message to the list
      setMessages(prev => [response.data, ...prev]);
      
      // Clear the input
      setNewMessage('');
    } catch (err) {
      console.error('Error posting message:', err);
      alert('Failed to post message. Please try again.');
      
      // For development: add mock message
      const userInfo = JSON.parse(localStorage.getItem('user')) || { name: 'Current User' };
      const mockMessage = {
        id: 'temp-id-' + Date.now(),
        content: newMessage,
        userName: userInfo.name,
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [mockMessage, ...prev]);
      setNewMessage('');
    }
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatJoinDate = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isUserMember = (community) => {
    if (!community || !community.members) return false;
    
    // In a real app, check against actual user ID
    // For demo, just check if there's a member with the userName "Current User"
    const userInfo = JSON.parse(localStorage.getItem('user')) || { name: 'Current User' };
    return community.members.some(member => member.userName === userInfo.name);
  };

  if (loading) {
    return <div className="loading">Loading communities...</div>;
  }

  if (error && communities.length === 0) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="communities-container">
      <h1>Tennis Communities</h1>
      
      <div className="communities-layout">
        <div className="communities-sidebar">
          <div className="filters-section">
            <h2>Find Communities</h2>
            
            <div className="filter-group">
              <label htmlFor="type">Community Type:</label>
              <select
                id="type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">All types</option>
                {communityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="radius">Distance (miles):</label>
              <input
                type="range"
                id="radius"
                name="radius"
                min="5"
                max="100"
                value={filters.radius}
                onChange={handleFilterChange}
              />
              <span>{filters.radius} miles</span>
            </div>
            
            <button 
              className="apply-filters-button" 
              onClick={handleApplyFilters}
            >
              Apply Filters
            </button>
          </div>
          
          <div className="communities-list">
            <h3>Communities</h3>
            {communities.length === 0 ? (
              <div className="no-communities">No communities found matching your criteria.</div>
            ) : (
              <ul>
                {communities.map(community => (
                  <li 
                    key={community.id} 
                    className={`community-list-item ${selectedCommunity?.id === community.id ? 'selected' : ''}`}
                    onClick={() => handleCommunitySelect(community)}
                  >
                    <div className="community-list-name">{community.name}</div>
                    <div className="community-list-meta">
                      <span className="community-type">{community.type}</span>
                      <span className="community-members">{community.members.length} members</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="community-content">
          {selectedCommunity ? (
            <div className="community-details">
              <div className="community-header">
                <h2>{selectedCommunity.name}</h2>
                <span className="community-badge">{selectedCommunity.type}</span>
              </div>
              
              <p className="community-description">{selectedCommunity.description}</p>
              
              <div className="community-meta">
                <div className="community-location">
                  <i className="location-icon">📍</i> {selectedCommunity.location.city}, {selectedCommunity.location.state}
                </div>
                <div className="community-created">
                  Created {formatJoinDate(selectedCommunity.createdAt)}
                </div>
              </div>
              
              {!isUserMember(selectedCommunity) && (
                <button 
                  className="join-community-button"
                  onClick={() => handleJoinCommunity(selectedCommunity.id)}
                >
                  Join Community
                </button>
              )}
              
              <div className="community-content-tabs">
                <div className="tab-section">
                  <div className="messages-section">
                    <h3>Community Discussion</h3>
                    
                    {isUserMember(selectedCommunity) && (
                      <form className="post-message-form" onSubmit={handlePostMessage}>
                        <textarea
                          placeholder="Write a message to the community..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          required
                        />
                        <button type="submit" className="post-button">Post Message</button>
                      </form>
                    )}
                    
                    {messagesLoading ? (
                      <div className="loading-messages">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="no-messages">No messages yet in this community.</div>
                    ) : (
                      <div className="messages-list">
                        {messages.map(message => (
                          <div key={message.id} className="message-card">
                            <div className="message-header">
                              <span className="message-author">{message.userName}</span>
                              <span className="message-time">{formatDateTime(message.createdAt)}</span>
                            </div>
                            <div className="message-content">{message.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="members-section">
                    <h3>Members ({selectedCommunity.members.length})</h3>
                    <div className="members-list">
                      {selectedCommunity.members.map(member => (
                        <div key={member.id} className="member-item">
                          <div className="member-name">
                            {member.userName}
                            {member.role === 'Admin' && (
                              <span className="admin-badge">Admin</span>
                            )}
                          </div>
                          <div className="member-joined">
                            Joined {formatJoinDate(member.joinedAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-community-selected">
              <div className="placeholder-message">
                <h3>Select a community to view details</h3>
                <p>Join tennis communities to connect with local players, participate in discussions, and find playing partners.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  */
};

export default Communities; 