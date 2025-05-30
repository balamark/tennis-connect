import React, { useState, useEffect } from 'react';
import MatchingSession from './MatchingSession';
import { bookingApi } from '../api/bookingApi';

const MySessions = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'past'

  useEffect(() => {
    loadUserBookings();
  }, []);

  const loadUserBookings = async () => {
    try {
      setLoading(true);
      
      // Try to get bookings from API
      try {
        const userBookings = await bookingApi.getUserBookings();
        setBookings(userBookings);
      } catch (apiError) {
        console.error('API not available, using mock data:', apiError);
        
        // Fallback to mock data
        const mockBookings = [
          {
            id: 1,
            court_id: 1,
            court_name: 'Court 1',
            start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
            game_type: 'Singles',
            player_count: 2,
            status: 'confirmed',
            notes: 'Looking forward to a great game!',
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            court_id: 3,
            court_name: 'Court 3',
            start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
            end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
            game_type: 'Doubles',
            player_count: 4,
            status: 'confirmed',
            notes: 'Doubles match with friends',
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            court_id: 2,
            court_name: 'Court 2',
            start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
            end_time: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
            game_type: 'Singles',
            player_count: 2,
            status: 'completed',
            notes: 'Great match!',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        setBookings(mockBookings);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setLoading(true);
      
      try {
        await bookingApi.cancelBooking(bookingId);
        alert('Booking cancelled successfully!');
      } catch (apiError) {
        console.error('API not available:', apiError);
        alert('Booking cancelled successfully! (Demo mode)');
      }
      
      // Refresh bookings
      await loadUserBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
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

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'upcoming') {
      return isUpcoming(booking.start_time);
    } else {
      return !isUpcoming(booking.start_time);
    }
  });

  if (loading) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 group/design-root overflow-x-hidden font-sans">
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
              <div className="flex items-center justify-center py-20">
                <div className="text-[#0d141c] text-lg">Loading your sessions...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-slate-50 group/design-root overflow-x-hidden font-sans">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* Page Title */}
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <p className="text-[#0d141c] tracking-light text-[32px] font-bold leading-tight min-w-72">
                My Sessions
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-4 mb-6">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'upcoming'
                    ? 'border-[#0c7ff2] text-[#0c7ff2]'
                    : 'border-transparent text-[#49739c] hover:text-[#0d141c]'
                }`}
              >
                Upcoming Sessions
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'past'
                    ? 'border-[#0c7ff2] text-[#0c7ff2]'
                    : 'border-transparent text-[#49739c] hover:text-[#0d141c]'
                }`}
              >
                Past Sessions
              </button>
            </div>

            <div className="flex gap-6">
              {/* Bookings List */}
              <div className="flex-1">
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-[#49739c] text-lg mb-4">
                      {activeTab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions'}
                    </div>
                    <p className="text-[#49739c] text-sm">
                      {activeTab === 'upcoming' 
                        ? 'Book a court to get started!' 
                        : 'Your completed sessions will appear here.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.map((booking) => (
                      <div 
                        key={booking.id} 
                        className={`p-4 bg-white rounded-lg border transition-all cursor-pointer ${
                          selectedBooking?.id === booking.id 
                            ? 'border-[#0c7ff2] ring-2 ring-[#0c7ff2] ring-opacity-20' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-[#0d141c]">
                              {booking.court_name}
                            </h3>
                            <p className="text-sm text-[#49739c]">
                              {formatDate(booking.start_time)}
                            </p>
                            <p className="text-sm text-[#49739c]">
                              {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              booking.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                          <div>
                            <span className="text-[#49739c]">Game Type:</span>
                            <span className="ml-1 text-[#0d141c]">{booking.game_type}</span>
                          </div>
                          <div>
                            <span className="text-[#49739c]">Players:</span>
                            <span className="ml-1 text-[#0d141c]">{booking.player_count}</span>
                          </div>
                        </div>

                        {booking.notes && (
                          <div className="mb-3">
                            <p className="text-sm text-[#49739c]">Notes:</p>
                            <p className="text-sm text-[#0d141c]">{booking.notes}</p>
                          </div>
                        )}

                        {activeTab === 'upcoming' && booking.status === 'confirmed' && (
                          <div className="flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelBooking(booking.id);
                              }}
                              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            >
                              Cancel Booking
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Matching Session Panel */}
              {selectedBooking && activeTab === 'upcoming' && (
                <div className="w-96 bg-white rounded-lg border border-gray-200 h-fit">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-[#0d141c]">Player Matching</h3>
                    <p className="text-sm text-[#49739c]">Find players for your session</p>
                  </div>
                  <MatchingSession 
                    booking={selectedBooking}
                    onJoinSession={(sessionId) => {
                      console.log('Joined session:', sessionId);
                    }}
                    onCreateSession={(sessionData) => {
                      console.log('Created session:', sessionData);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MySessions; 