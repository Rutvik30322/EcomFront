import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { adminLogout } from '../../store/slices/authSlice';
import { getMe } from '../../services/authService';
import { useSocket } from '../../contexts/SocketContext';
import { useTranslation } from 'react-i18next';
import styles from './Header.module.css';
import logoutIcon from "../../assets/svg/logout.svg";
import notificationIcon from "../../assets/svg/notification.svg";
import notificationoffIcon from "../../assets/svg/notificationoff.svg";

const Header = ({ title, onRefresh, refreshLoading, onMenuToggle }) => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const notificationRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user: adminFromStore } = useSelector(state => state.auth);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, isConnected } = useSocket();

  const handleMenuToggle = onMenuToggle || (() => {
    console.warn('onMenuToggle not provided to Header component');
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {

    if (adminFromStore) {
      setAdminData(adminFromStore);
    } else {
      loadAdminData();
    }
  }, [adminFromStore]);

  const loadAdminData = async () => {
    try {

      const token = localStorage.getItem('adminToken');
      if (!token) {

        if (adminFromStore) {
          setAdminData(adminFromStore);
        }
        return;
      }

      const response = await getMe();
      if (response && response.admin) {
        setAdminData(response.admin);
      } else if (response && response.user) {

        setAdminData(response.user);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);

      if (err.response?.status === 401) {

        if (adminFromStore) {
          setAdminData(adminFromStore);
        }
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    if (notificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationOpen]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {

    localStorage.clear();
    sessionStorage.clear();
    dispatch(adminLogout());
    setShowLogoutModal(false);
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const toggleNotifications = () => {
    setNotificationOpen(!notificationOpen);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.type === 'order' && notification.data?.orderId) {
      navigate(`/orders`);
      setNotificationOpen(false);
    } else if ((notification.type === 'customer' || notification.type === 'user') && notification.data?.userId) {
      navigate(`/users`);
      setNotificationOpen(false);
    }
  };

  const adminName = adminData?.name || 'Admin';
  const adminPicture = adminData?.profilePicture || null;

  return (
    <>
      <header className={styles.dashboardHeader}>
        <div className={styles.headerLeft}>
          <button
            className={styles.menuToggleBtn}
            onClick={handleMenuToggle}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <h1 className={styles.dashboardTitle}>{t(title || 'Admin Panel')}</h1>
        </div>

        <div className={styles.headerRight}>
          { }

          { }
          <div className={styles.notificationContainer} ref={notificationRef}>
            <button
              className={styles.notificationBtn}
              onClick={toggleNotifications}
              aria-label="Notifications"
              title="Notifications"
            >
              <span className={styles.notificationIcon}>
                {isConnected ? <img src={notificationIcon} alt="notifications" width={30} /> : <img src={notificationoffIcon} alt="notificationsoff" width={30} />}
              </span>
              {unreadCount > 0 && (
                <span className={styles.notificationBadge}>
                  {unreadCount}
                </span>
              )}
            </button>

            { }
            {notificationOpen && (
              <div className={styles.notificationPanel}>
                <div className={styles.notificationHeader}>
                  <h3>{t('Notifications')} {!isConnected && <span className={styles.connectionStatus}>({t('Disconnected')})</span>}</h3>
                  <div className={styles.notificationHeaderActions}>
                    {notifications.length > 0 && (
                      <button
                        className={styles.markAllReadBtn}
                        onClick={markAllAsRead}
                        title={t('Mark all read')}
                      >
                        {t('Mark all read')}
                      </button>
                    )}
                    <button
                      className={styles.closeNotificationBtn}
                      onClick={() => setNotificationOpen(false)}
                      aria-label="Close notifications"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {notifications.length > 0 && (
                  <div className={styles.viewAllContainer}>
                    <button
                      className={styles.viewAllBtn}
                      onClick={() => {
                        navigate('/notifications');
                        setNotificationOpen(false);
                      }}
                    >
                      {t('View All Notifications')} →
                    </button>
                  </div>
                )}
                <div className={styles.notificationList}>
                  {notifications.length === 0 ? (
                    <div className={styles.noNotifications}>
                      <p>{t('No notifications')}</p>
                      {!isConnected && (
                        <p className={styles.connectionMessage}>
                          {t('Reconnecting to notification server...')}
                        </p>
                      )}
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className={styles.notificationIconWrapper}>
                          {notification.type === 'order' && '📦'}
                          {notification.type === 'customer' && '👤'}
                          {notification.type === 'user' && '👥'}
                          {notification.type === 'product' && '📦'}
                        </div>
                        <div className={styles.notificationContent}>
                          <p className={styles.notificationTitle}>{notification.title}</p>
                          <p className={styles.notificationMessage}>{notification.message}</p>
                          <span className={styles.notificationTime}>
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        {!notification.read && (
                          <div className={styles.unreadIndicator}></div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          { }
          <div className={styles.profileSection}>
            {adminPicture ? (
              <img
                src={adminPicture}
                alt={adminName}
                className={styles.profilePicture}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={styles.profileInitials}
              style={{ display: adminPicture ? 'none' : 'flex' }}
            >
              {adminName.charAt(0).toUpperCase()}
            </div>
            <span className={styles.profileName}>{adminName}</span>
          </div>

          { }
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <img src={logoutIcon} alt="Logout" width="25" />
          </button>

        </div>
      </header>

      { }
      {showLogoutModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '14px',
            padding: '2rem',
            width: '100%',
            maxWidth: '380px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔒</div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', color: '#1f2937', fontWeight: 700 }}>
              {t('Confirm Logout')}
            </h3>
            <p style={{ margin: '0 0 1.75rem', color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {t('Are you sure you want to logout?')}<br />{t('Your session will be cleared.')}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={cancelLogout}
                style={{
                  flex: 1, padding: '0.65rem 1rem',
                  border: '1px solid #d1d5db', borderRadius: '8px',
                  background: 'white', color: '#374151',
                  fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.target.style.background = '#f3f4f6'}
                onMouseLeave={e => e.target.style.background = 'white'}
              >
                {t('Cancel')}
              </button>
              <button
                onClick={confirmLogout}
                style={{
                  flex: 1, padding: '0.65rem 1rem',
                  border: 'none', borderRadius: '8px',
                  background: '#381230', color: 'white',
                  fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.target.style.background = '#7C4168'}
                onMouseLeave={e => e.target.style.background = '#381230'}
              >
                {t('Logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
