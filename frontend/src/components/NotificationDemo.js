import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationDemo = () => {
  const { simulateNewNotification, clearAllNotifications, notifications, unreadCount } = useNotifications();

  const handleSimulateMatchRequest = () => {
    simulateNewNotification('match_request');
  };

  const handleSimulateBookingConfirmed = () => {
    simulateNewNotification('booking_confirmed');
  };

  const handleSimulateSessionReminder = () => {
    simulateNewNotification('session_reminder');
  };

  const handleClearAll = () => {
    clearAllNotifications();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-[#0d141c] mb-6">Notification System Demo</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Demo Controls */}
          <div>
            <h3 className="text-lg font-semibold text-[#0d141c] mb-4">Test Notifications</h3>
            <div className="space-y-3">
              <button
                onClick={handleSimulateMatchRequest}
                className="w-full px-4 py-2 bg-[#0c7ff2] text-white rounded-lg hover:bg-[#0a6fd1] transition-colors"
              >
                Simulate Match Request
              </button>
              
              <button
                onClick={handleSimulateBookingConfirmed}
                className="w-full px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors"
              >
                Simulate Booking Confirmed
              </button>
              
              <button
                onClick={handleSimulateSessionReminder}
                className="w-full px-4 py-2 bg-[#f59e0b] text-white rounded-lg hover:bg-[#d97706] transition-colors"
              >
                Simulate Session Reminder
              </button>
              
              <button
                onClick={handleClearAll}
                className="w-full px-4 py-2 bg-[#ef4444] text-white rounded-lg hover:bg-[#dc2626] transition-colors"
              >
                Clear All Notifications
              </button>
            </div>
          </div>

          {/* Stats */}
          <div>
            <h3 className="text-lg font-semibold text-[#0d141c] mb-4">Current Stats</h3>
            <div className="space-y-3">
              <div className="p-3 bg-[#f8f9fa] rounded-lg">
                <div className="text-sm text-[#4a739c]">Total Notifications</div>
                <div className="text-xl font-bold text-[#0d141c]">{notifications.length}</div>
              </div>
              
              <div className="p-3 bg-[#f8f9ff] rounded-lg border border-[#0c7ff2]">
                <div className="text-sm text-[#4a739c]">Unread Notifications</div>
                <div className="text-xl font-bold text-[#0c7ff2]">{unreadCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-[#f0f2f5] rounded-lg">
          <h4 className="font-semibold text-[#0d141c] mb-2">How to Test:</h4>
          <ul className="text-sm text-[#4a739c] space-y-1">
            <li>• Click the buttons above to simulate different types of notifications</li>
            <li>• Check the notification bell icon in the header for the unread count badge</li>
            <li>• Click the bell icon to open the notification dropdown</li>
            <li>• Click on notifications to mark them as read</li>
            <li>• Use "Mark all read" to clear all unread notifications</li>
            <li>• For match requests, you can accept or decline directly from the notification</li>
          </ul>
        </div>

        {/* Features */}
        <div className="mt-6 p-4 bg-[#f8f9ff] rounded-lg border border-[#0c7ff2]">
          <h4 className="font-semibold text-[#0d141c] mb-2">Notification Features:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#4a739c]">
            <div>
              <strong>Visual Indicators:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Unread count badge on bell icon</li>
                <li>• Blue dot for unread notifications</li>
                <li>• Different background for unread items</li>
                <li>• Custom icons for different notification types</li>
              </ul>
            </div>
            <div>
              <strong>Interactive Elements:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Click to mark as read</li>
                <li>• Accept/Decline buttons for match requests</li>
                <li>• Mark all as read functionality</li>
                <li>• Click outside to close dropdown</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemo; 