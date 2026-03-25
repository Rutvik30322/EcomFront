import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useSelector(state => state.auth);
  const socketRef = useRef(null);
  const dataUpdateCallbacksRef = useRef({});

  useEffect(() => {

    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        setSocket(null);
        setIsConnected(false);
        setNotifications([]);
      }
      return;
    }

    const apiBaseUrl = 'https://ecombackend-krq1.onrender.com/api';
    const backendUrl = apiBaseUrl.replace('/api', ''); // Remove /api to get base URL

    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {

      setIsConnected(true);

      newSocket.emit('join-admin');
    });

    newSocket.on('disconnect', () => {

      setIsConnected(false);
    });

    newSocket.on('notification', (notification) => {

      setNotifications((prev) => {

        const exists = prev.some(n => n.id === notification.id);
        if (exists) return prev;

        return [notification, ...prev];
      });

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id,
        });
      }
    });

    newSocket.on('data-update', (data) => {
      const { type, action, payload } = data;

      if (dataUpdateCallbacksRef.current[type]) {
        dataUpdateCallbacksRef.current[type].forEach(callback => {
          try {
            callback(action, payload);
          } catch (error) {
            console.error(`Error in data update callback for ${type}:`, error);
          }
        });
      }
    });

    newSocket.on('dashboard-stats-update', (stats) => {

      if (dataUpdateCallbacksRef.current.dashboard) {
        dataUpdateCallbacksRef.current.dashboard.forEach(callback => {
          try {
            callback('update', stats);
          } catch (error) {
            console.error('Error in dashboard stats update callback:', error);
          }
        });
      }

      if (dataUpdateCallbacksRef.current.dashboard) {
        dataUpdateCallbacksRef.current.dashboard.forEach(callback => {
          try {
            callback('update', { stats });
          } catch (error) {
            console.error('Error in dashboard data update callback:', error);
          }
        });
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔔 Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated]);

  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  };

  const removeNotification = (notificationId) => {
    setNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const onDataUpdate = (type, callback) => {
    if (!dataUpdateCallbacksRef.current[type]) {
      dataUpdateCallbacksRef.current[type] = [];
    }
    dataUpdateCallbacksRef.current[type].push(callback);

    return () => {
      if (dataUpdateCallbacksRef.current[type]) {
        dataUpdateCallbacksRef.current[type] = dataUpdateCallbacksRef.current[type].filter(
          cb => cb !== callback
        );
      }
    };
  };

  const value = {
    socket,
    notifications,
    isConnected,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    onDataUpdate, // Add real-time data update subscription
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
