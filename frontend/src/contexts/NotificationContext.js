import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock initial notifications
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        type: 'match_request',
        title: 'New Match Request',
        message: 'Alex wants to play tennis with you on Oct 26, 6:00 PM',
        time: '2 minutes ago',
        read: false,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
        actionRequired: true,
        createdAt: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
      },
      {
        id: 2,
        type: 'booking_confirmed',
        title: 'Court Booking Confirmed',
        message: 'Your booking for Court 1 on July 15, 8:00 AM has been confirmed',
        time: '1 hour ago',
        read: false,
        icon: 'court',
        createdAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
      },
      {
        id: 3,
        type: 'partner_found',
        title: 'Partner Found',
        message: 'Chris accepted your match request for tomorrow at 7:00 PM',
        time: '3 hours ago',
        read: true,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      },
      {
        id: 4,
        type: 'session_reminder',
        title: 'Session Reminder',
        message: 'Your tennis session with David starts in 30 minutes',
        time: '5 hours ago',
        read: true,
        icon: 'reminder',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
      },
      {
        id: 5,
        type: 'group_invite',
        title: 'Group Invitation',
        message: 'You\'ve been invited to join "Central Park Tennis Club"',
        time: '1 day ago',
        read: true,
        icon: 'group',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      }
    ];

    setNotifications(mockNotifications);
    updateUnreadCount(mockNotifications);
  }, []);

  const updateUnreadCount = (notificationList) => {
    const count = notificationList.filter(n => !n.read).length;
    setUnreadCount(count);
  };

  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now(),
      read: false,
      createdAt: new Date(),
      time: 'Just now'
    };
    
    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    updateUnreadCount(updatedNotifications);
  };

  const markAsRead = (notificationId) => {
    const updatedNotifications = notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );
    setNotifications(updatedNotifications);
    updateUnreadCount(updatedNotifications);
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
  };

  const removeNotification = (notificationId) => {
    const updatedNotifications = notifications.filter(
      notification => notification.id !== notificationId
    );
    setNotifications(updatedNotifications);
    updateUnreadCount(updatedNotifications);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Simulate receiving new notifications
  const simulateNewNotification = (type = 'match_request') => {
    const notificationTypes = {
      match_request: {
        type: 'match_request',
        title: 'New Match Request',
        message: 'Someone wants to play tennis with you!',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
        actionRequired: true
      },
      booking_confirmed: {
        type: 'booking_confirmed',
        title: 'Court Booking Confirmed',
        message: 'Your court booking has been confirmed',
        icon: 'court'
      },
      session_reminder: {
        type: 'session_reminder',
        title: 'Session Reminder',
        message: 'Your tennis session starts soon',
        icon: 'reminder'
      }
    };

    addNotification(notificationTypes[type] || notificationTypes.match_request);
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    simulateNewNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 