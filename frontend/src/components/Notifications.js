// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const Notifications = ({ isOpen, onClose }) => {
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getNotificationIcon = (type, icon) => {
    if (icon === 'court') {
      return (
        <div className="w-10 h-10 bg-[#0c7ff2] rounded-full flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="6" width="18" height="12" rx="2" stroke="white" strokeWidth="2" fill="none"/>
            <line x1="12" y1="6" x2="12" y2="18" stroke="white" strokeWidth="2"/>
            <line x1="3" y1="12" x2="21" y2="12" stroke="white" strokeWidth="2"/>
          </svg>
        </div>
      );
    }
    
    if (icon === 'reminder') {
      return (
        <div className="w-10 h-10 bg-[#f59e0b] rounded-full flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none"/>
            <polyline points="12,6 12,12 16,14" stroke="white" strokeWidth="2"/>
          </svg>
        </div>
      );
    }
    
    if (icon === 'group') {
      return (
        <div className="w-10 h-10 bg-[#10b981] rounded-full flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" fill="none"/>
            <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="white" strokeWidth="2" fill="none"/>
          </svg>
        </div>
      );
    }
    
    return (
      <div className="w-10 h-10 bg-[#4a739c] rounded-full flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" stroke="white" strokeWidth="2" fill="none"/>
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" stroke="white" strokeWidth="2" fill="none"/>
        </svg>
      </div>
    );
  };

  const handleNotificationClick = (notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Handle different notification types
    switch (notification.type) {
      case 'match_request':
        // Navigate to match requests or show match details
        console.log('Navigate to match request:', notification);
        break;
      case 'booking_confirmed':
        // Navigate to bookings
        console.log('Navigate to bookings:', notification);
        break;
      case 'partner_found':
        // Navigate to matches
        console.log('Navigate to matches:', notification);
        break;
      case 'session_reminder':
        // Navigate to sessions
        console.log('Navigate to sessions:', notification);
        break;
      case 'group_invite':
        // Navigate to groups
        console.log('Navigate to groups:', notification);
        break;
      default:
        console.log('Notification clicked:', notification);
    }
  };

  const handleAcceptMatch = (notification, event) => {
    event.stopPropagation();
    console.log('Accept match request:', notification);
    // Here you would typically make an API call to accept the match
    markAsRead(notification.id);
  };

  const handleDeclineMatch = (notification, event) => {
    event.stopPropagation();
    console.log('Decline match request:', notification);
    // Here you would typically make an API call to decline the match
    markAsRead(notification.id);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-[#e7edf4] z-50 max-h-[500px] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#e7edf4]">
        <div className="flex items-center gap-2">
          <h3 className="text-[#0d141c] text-lg font-bold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-[#0c7ff2] text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="text-[#0c7ff2] text-sm font-medium hover:text-[#0a6fd1]"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-[#f0f2f5] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" stroke="#4a739c" strokeWidth="2" fill="none"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" stroke="#4a739c" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <p className="text-[#4a739c] text-sm">No notifications yet</p>
            <p className="text-[#4a739c] text-xs mt-1">We'll notify you when something happens</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 border-b border-[#f0f2f5] hover:bg-[#f8f9fa] cursor-pointer transition-colors ${
                !notification.read ? 'bg-[#f8f9ff]' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar or Icon */}
                {notification.avatar ? (
                  <img
                    src={notification.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  getNotificationIcon(notification.type, notification.icon)
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-[#0d141c] text-sm font-medium mb-1">
                        {notification.title}
                      </p>
                      <p className="text-[#4a739c] text-sm leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-[#4a739c] text-xs mt-2">
                        {notification.time}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-[#0c7ff2] rounded-full mt-1 ml-2 flex-shrink-0"></div>
                    )}
                  </div>

                  {/* Action buttons for match requests */}
                  {notification.actionRequired && notification.type === 'match_request' && (
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={(e) => handleAcceptMatch(notification, e)}
                        className="px-3 py-1 bg-[#0c7ff2] text-white text-xs font-medium rounded-md hover:bg-[#0a6fd1] transition-colors"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={(e) => handleDeclineMatch(notification, e)}
                        className="px-3 py-1 bg-[#f0f2f5] text-[#4a739c] text-xs font-medium rounded-md hover:bg-[#e7edf4] transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-[#e7edf4] bg-[#f8f9fa]">
          <button className="w-full text-[#0c7ff2] text-sm font-medium hover:text-[#0a6fd1] transition-colors">
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications; 