import React, { useState, useEffect } from 'react';
import { bookingApi } from '../api/bookingApi';

const MatchingSession = ({ booking, onJoinSession, onCreateSession }) => {
  const [matchingSessions, setMatchingSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    skill_level_min: 3.0,
    skill_level_max: 5.0,
    game_type: 'Singles',
    max_players: 2,
    notes: ''
  });

  // Load matching sessions for the booking
  useEffect(() => {
    if (booking) {
      loadMatchingSessions();
    }
  }, [booking]);

  const loadMatchingSessions = async () => {
    try {
      setLoading(true);
      // This would be an API call to get matching sessions for the booking
      // For now, we'll use mock data
      const mockSessions = [
        {
          id: 1,
          booking_id: booking.id,
          skill_level_min: 3.0,
          skill_level_max: 5.0,
          game_type: 'Singles',
          max_players: 2,
          current_players: 1,
          status: 'open',
          created_by: {
            name: 'John Doe',
            skill_level: 4.0
          },
          players: [
            {
              id: 1,
              name: 'John Doe',
              skill_level: 4.0,
              is_creator: true
            }
          ]
        },
        {
          id: 2,
          booking_id: booking.id,
          skill_level_min: 2.5,
          skill_level_max: 4.0,
          game_type: 'Doubles',
          max_players: 4,
          current_players: 2,
          status: 'open',
          created_by: {
            name: 'Jane Smith',
            skill_level: 3.5
          },
          players: [
            {
              id: 2,
              name: 'Jane Smith',
              skill_level: 3.5,
              is_creator: true
            },
            {
              id: 3,
              name: 'Mike Johnson',
              skill_level: 3.0,
              is_creator: false
            }
          ]
        }
      ];
      setMatchingSessions(mockSessions);
    } catch (error) {
      console.error('Error loading matching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (sessionId) => {
    try {
      setLoading(true);
      // This would be an API call to join the session
      console.log('Joining session:', sessionId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Successfully joined the session!');
      await loadMatchingSessions(); // Refresh sessions
      
      if (onJoinSession) {
        onJoinSession(sessionId);
      }
    } catch (error) {
      console.error('Error joining session:', error);
      alert('Failed to join session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      setLoading(true);
      
      const sessionData = {
        ...newSessionData,
        booking_id: booking.id
      };
      
      // This would be an API call to create the session
      console.log('Creating session:', sessionData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Session created successfully!');
      setShowCreateForm(false);
      setNewSessionData({
        skill_level_min: 3.0,
        skill_level_max: 5.0,
        game_type: 'Singles',
        max_players: 2,
        notes: ''
      });
      
      await loadMatchingSessions(); // Refresh sessions
      
      if (onCreateSession) {
        onCreateSession(sessionData);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!booking) {
    return (
      <div className="p-4 text-center text-gray-500">
        Please select a booking to view matching sessions.
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Booking Info */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="text-lg font-bold text-[#0d141c] mb-2">
          {booking.court_name} - {formatDate(booking.start_time)}
        </h3>
        <p className="text-sm text-[#49739c]">
          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
        </p>
      </div>

      {/* Create Session Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center justify-center px-4 py-2 bg-[#0c7ff2] text-white rounded-lg hover:bg-[#0a6fd1] transition-colors"
          disabled={loading}
        >
          {showCreateForm ? 'Cancel' : 'Create Matching Session'}
        </button>
      </div>

      {/* Create Session Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <h4 className="text-md font-bold text-[#0d141c] mb-4">Create New Session</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0d141c] mb-1">
                Game Type
              </label>
              <select
                value={newSessionData.game_type}
                onChange={(e) => setNewSessionData(prev => ({ ...prev, game_type: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0c7ff2] focus:border-transparent"
              >
                <option value="Singles">Singles</option>
                <option value="Doubles">Doubles</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0d141c] mb-1">
                Max Players
              </label>
              <select
                value={newSessionData.max_players}
                onChange={(e) => setNewSessionData(prev => ({ ...prev, max_players: parseInt(e.target.value) }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0c7ff2] focus:border-transparent"
              >
                <option value={2}>2 Players</option>
                <option value={4}>4 Players</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0d141c] mb-1">
                Min Skill Level
              </label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.5"
                value={newSessionData.skill_level_min}
                onChange={(e) => setNewSessionData(prev => ({ ...prev, skill_level_min: parseFloat(e.target.value) }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0c7ff2] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0d141c] mb-1">
                Max Skill Level
              </label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.5"
                value={newSessionData.skill_level_max}
                onChange={(e) => setNewSessionData(prev => ({ ...prev, skill_level_max: parseFloat(e.target.value) }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0c7ff2] focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[#0d141c] mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={newSessionData.notes}
              onChange={(e) => setNewSessionData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional information about the session..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0c7ff2] focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCreateSession}
              disabled={loading}
              className="px-4 py-2 bg-[#0c7ff2] text-white rounded-lg hover:bg-[#0a6fd1] transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </div>
      )}

      {/* Matching Sessions List */}
      <div>
        <h4 className="text-md font-bold text-[#0d141c] mb-4">Available Sessions</h4>
        
        {loading && matchingSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Loading sessions...</div>
        ) : matchingSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No matching sessions available. Create one to get started!
          </div>
        ) : (
          <div className="space-y-4">
            {matchingSessions.map((session) => (
              <div key={session.id} className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-medium text-[#0d141c]">
                      {session.game_type} Session
                    </h5>
                    <p className="text-sm text-[#49739c]">
                      Created by {session.created_by.name} (Skill: {session.created_by.skill_level})
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    session.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {session.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  <div>
                    <span className="text-[#49739c]">Players:</span>
                    <span className="ml-1 text-[#0d141c]">
                      {session.current_players}/{session.max_players}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#49739c]">Skill Range:</span>
                    <span className="ml-1 text-[#0d141c]">
                      {session.skill_level_min} - {session.skill_level_max}
                    </span>
                  </div>
                </div>

                {session.players.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-[#49739c] mb-1">Players:</p>
                    <div className="flex flex-wrap gap-2">
                      {session.players.map((player) => (
                        <span
                          key={player.id}
                          className={`px-2 py-1 rounded text-xs ${
                            player.is_creator 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {player.name} ({player.skill_level})
                          {player.is_creator && ' ★'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {session.current_players < session.max_players && session.status === 'open' && (
                  <button
                    onClick={() => handleJoinSession(session.id)}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-[#0c7ff2] text-white rounded-lg hover:bg-[#0a6fd1] transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Joining...' : 'Join Session'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchingSession; 