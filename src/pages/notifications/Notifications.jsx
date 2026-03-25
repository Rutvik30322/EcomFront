import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { notificationService } from '../../services/api';
import PageLayout from '../../components/ui/PageLayout';
import Pagination from '../../components/ui/Pagination';
import RefreshBanner from '../../components/ui/RefreshBanner';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import styles from './Notifications.module.css';
import editIcon from "../../assets/svg/edit.svg";
import tickIcon from "../../assets/svg/check.svg";
import cancelIcon from "../../assets/svg/cancel.svg";
import { useTranslation } from 'react-i18next';

const Notifications = () => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({
    delete: false,
    edit: false,
    markRead: false,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [notificationToEdit, setNotificationToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    message: '',
    type: 'other',
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  // Track tab counts separately so they are always accurate regardless of active tab
  const [tabCounts, setTabCounts] = useState({ all: 0, unread: 0, read: 0 });
  const { onDataUpdate, socket } = useSocket();
  const navigate = useNavigate();

  // Fetch tab counts (all, unread, read) from API separately so counts are always accurate
  const fetchTabCounts = async () => {
    try {
      const [allRes, unreadRes] = await Promise.all([
        notificationService.getAllNotifications({ page: 1, limit: 1 }),
        notificationService.getAllNotifications({ page: 1, limit: 1, read: 'false' }),
      ]);
      const allTotal = allRes.data?.data?.pagination?.total || 0;
      const unreadTotal = unreadRes.data?.data?.pagination?.total || 0;
      setTabCounts({ all: allTotal, unread: unreadTotal, read: allTotal - unreadTotal });
    } catch (error) {
      // silently ignore count fetch errors
    }
  };

  const fetchNotifications = async (page = 1, activeFilter = filter, retryCount = 0) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };

      if (activeFilter === 'unread') {
        params.read = 'false';
      } else if (activeFilter === 'read') {
        params.read = 'true';
      }

      const response = await notificationService.getAllNotifications(params);
      if (response.data && response.data.data) {
        setNotifications(response.data.data.notifications || []);
        setPagination(response.data.data.pagination || { page: 1, pages: 1, total: 0 });
      }
      // Refresh tab counts after every successful fetch
      fetchTabCounts();
    } catch (error) {
      if ((error?.message?.includes('Duplicate request prevented') ||
        error?.message === 'Duplicate request prevented') &&
        retryCount < 2) {
        setTimeout(() => {
          fetchNotifications(page, activeFilter, retryCount + 1);
        }, 600);
        return;
      }

      if (!error?.message?.includes('Duplicate request prevented') &&
        error?.message !== 'Duplicate request prevented') {
        console.error('Error fetching notifications:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, filter); // Always start from page 1 when filter changes
  }, [filter]);

  useEffect(() => {
    if (!onDataUpdate) return;

    const unsubscribe = onDataUpdate('notifications', (action, payload) => {

      if (action === 'create') {

        fetchNotifications(1);
      }
    });

    return unsubscribe;
  }, [onDataUpdate]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification) => {

      fetchNotifications(1);
    };

    socket.on('notification', handleNotification);

    return () => {
      if (socket) {
        socket.off('notification', handleNotification);
      }
    };
  }, [socket]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return t('Just now');
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes > 1 ? t('minutes ago') : t('minute ago')}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours > 1 ? t('hours ago') : t('hour ago')}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days > 1 ? t('days ago') : t('day ago')}`;
    }
  };

  const formatFullDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return '📦';
      case 'customer':
        return '👤';
      case 'user':
        return '👥';
      case 'product':
        return '📦';
      case 'review':
        return '⭐';
      default:
        return '🔔';
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'order':
        return t('Order');
      case 'customer':
        return t('Customer');
      case 'user':
        return t('User');
      case 'product':
        return t('Product');
      case 'review':
        return t('Review');
      default:
        return t('Notification');
    }
  };

  const handleNotificationClick = async (notification) => {
    // If not read, mark it as read first
    if (!notification.read) {
      try {
        setActionLoading(prev => ({ ...prev, markRead: true }));
        await notificationService.markAsRead(notification._id);
        fetchNotifications(pagination.page, filter);
      } catch (error) {
        console.error('Error marking notification as read on click:', error);
      } finally {
        setActionLoading(prev => ({ ...prev, markRead: false }));
      }
    }

    // Only navigate if the notification has a valid linked entity
    if (notification.type === 'order' && notification.data?.orderId) {
      navigate('/orders');
    } else if ((notification.type === 'customer' || notification.type === 'user') && notification.data?.userId) {
      navigate('/users');
    }
    // For product, review, other types — stay on notifications page
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      setActionLoading(prev => ({ ...prev, markRead: true }));
      await notificationService.markAsRead(notificationId);
      await fetchNotifications(pagination.page, filter);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, markRead: false }));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(prev => ({ ...prev, markRead: true }));
      await notificationService.markAllAsRead();
      await fetchNotifications(1, filter);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, markRead: false }));
    }
  };

  const handleEdit = (notification) => {
    setNotificationToEdit(notification);
    setEditFormData({
      title: notification.title || '',
      message: notification.message || '',
      type: notification.type || 'other',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!notificationToEdit) return;

    try {
      setActionLoading(prev => ({ ...prev, edit: true }));
      await notificationService.updateNotification(notificationToEdit._id, editFormData);
      setShowEditModal(false);
      setNotificationToEdit(null);
      await fetchNotifications(pagination.page, filter);
    } catch (error) {
      console.error('Error updating notification:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, edit: false }));
    }
  };

  const handleDelete = (notification) => {
    setNotificationToDelete(notification);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!notificationToDelete) return;

    try {
      setActionLoading(prev => ({ ...prev, delete: true }));
      await notificationService.deleteNotification(notificationToDelete._id);
      setShowDeleteModal(false);
      setNotificationToDelete(null);
      await fetchNotifications(pagination.page, filter);
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const handlePageChange = async (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    await fetchNotifications(newPage, filter);
  };

  return (
    <>
      <PageLayout
        title={t("Notifications")}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        loading={loading || actionLoading.delete || actionLoading.edit || actionLoading.markRead}
        loadingMessage={
          actionLoading.delete ? t('Deleting notification...') :
            actionLoading.edit ? t('Updating notification...') :
              actionLoading.markRead ? t('Updating...') : t('Loading notifications...')
        }
      >
        <RefreshBanner show={loading && notifications.length > 0} label="notifications" />

        <div className={styles.notificationsHeader}>
          <div className={styles.headerInfo}>
            <h2 className={styles.pageTitle}>{t('All Notifications')}</h2>
            <p className={styles.subtitle}>
              {tabCounts.all} {t('total')} • {tabCounts.unread} {t('unread')}
            </p>
          </div>
          <div className={styles.headerActions}>
            {tabCounts.unread > 0 && (
              <button
                className={styles.markAllReadBtn}
                onClick={handleMarkAllAsRead}
                disabled={actionLoading.markRead}
              >
                {t('Mark All as Read')}
              </button>
            )}
          </div>
        </div>

        { }
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('All')} ({tabCounts.all})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'unread' ? styles.active : ''}`}
            onClick={() => setFilter('unread')}
          >
            {t('Unread')} ({tabCounts.unread})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'read' ? styles.active : ''}`}
            onClick={() => setFilter('read')}
          >
            {t('Read')} ({tabCounts.read})
          </button>
        </div>

        { }
        <div className={styles.tableContainer}>
          {notifications.length === 0 && !loading ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔔</div>
              <h3>{t('No notifications')}</h3>
              <p>
                {filter === 'unread'
                  ? t("You're all caught up! No unread notifications.")
                  : filter === 'read'
                    ? t('No read notifications yet.')
                    : t('No notifications yet. New notifications will appear here.')}
              </p>
            </div>
          ) : (
            <>
              <table className={styles.notificationsTable}>
                <thead>
                  <tr>
                    <th>{t('Sr No')}</th>
                    <th>{t('Type')}</th>
                    <th>{t('Title')}</th>
                    <th>{t('Message')}</th>
                    <th>{t('Time')}</th>
                    <th>{t('Status')}</th>
                    <th>{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notification, index) => (
                    <tr
                      key={notification._id}
                      className={`${styles.tableRow} ${!notification.read ? styles.unreadRow : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <td>{(pagination.page - 1) * (pagination.limit || 10) + index + 1}</td>
                      <td>
                        <div className={styles.typeCell}>
                          <span className={styles.typeIcon}>
                            {getNotificationIcon(notification.type)}
                          </span>
                          <span className={styles.typeLabel}>
                            {getNotificationTypeLabel(notification.type)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.titleCell}>
                          <strong>{notification.title}</strong>
                          {!notification.read && (
                            <span className={styles.unreadDot}></span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.messageCell}>
                          {notification.message}
                        </div>
                      </td>
                      <td>
                        <div className={styles.timeCell}>
                          <span className={styles.timeAgo}>
                            {formatTime(notification.createdAt)}
                          </span>
                          <span className={styles.fullDate}>
                            {formatFullDate(notification.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${notification.read ? styles.readBadge : styles.unreadBadge}`}>
                          {notification.read ? t('Read') : t('Unread')}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button
                            className={styles.actionBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(notification);
                            }}
                            title={t("Edit")}
                          >
                            <img src={editIcon} alt="edit" width={50} />
                          </button>
                          {!notification.read && (
                            <button
                              className={styles.actionBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification._id);
                              }}
                              title={t("Mark as read")}
                              disabled={actionLoading.markRead}
                            >
                              <img src={tickIcon} alt="tick" width={50} />
                            </button>
                          )}
                          <button
                            className={styles.actionBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification);
                            }}
                            title={t("Delete")}
                            disabled={actionLoading.delete}
                          >
                            <img src={cancelIcon} alt="cancel" width={50} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
                className={styles.paginationContainer}
                btnClassName={styles.paginationBtn}
                infoClassName={styles.paginationInfo}
                showTotal={false}
              />
            </>
          )}
        </div>
      </PageLayout>

      { }
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{t('Edit Notification')}</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className={styles.editForm}>
              <div className={styles.formGroup}>
                <label htmlFor="type">{t('Type')} *</label>
                <select
                  id="type"
                  name="type"
                  value={editFormData.type}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, type: e.target.value }))}
                  required
                >
                  <option value="order">{t('Order')}</option>
                  <option value="customer">{t('Customer')}</option>
                  <option value="user">{t('User')}</option>
                  <option value="product">{t('Product')}</option>
                  <option value="review">{t('Review')}</option>
                  <option value="other">{t('Other')}</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="title">{t('Title *')}</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder={t("Enter notification title")}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="message">{t('Message *')}</label>
                <textarea
                  id="message"
                  name="message"
                  value={editFormData.message}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, message: e.target.value }))}
                  required
                  placeholder={t("Enter notification message")}
                  rows={4}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowEditModal(false)}
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={actionLoading.edit}
                >
                  {actionLoading.edit ? t('Updating...') : t('Update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      { }
      <DeleteConfirmationModal
        show={showDeleteModal}
        title={t("Delete Notification")}
        message={t("Are you sure you want to delete this notification?")}
        itemName={notificationToDelete?.title}
        itemDetails={notificationToDelete ? [
          { label: t('Type'), value: getNotificationTypeLabel(notificationToDelete.type) },
          { label: t('Message'), value: notificationToDelete.message },
        ] : []}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setNotificationToDelete(null);
        }}
        loading={actionLoading.delete}
        confirmText={t("Delete Notification")}
        cancelText={t("Cancel")}
      />
    </>
  );
};

export default Notifications;
