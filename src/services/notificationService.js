import apiClient, { buildParams } from './apiClient';

export const notificationService = {
    getAllNotifications: (params = {}) => apiClient.get('/notifications', { params: buildParams(params) }),
    getNotificationById: (id) => apiClient.get(`/notifications/${id}`),
    updateNotification: (id, data) => apiClient.put(`/notifications/${id}`, data),
    deleteNotification: (id) => apiClient.delete(`/notifications/${id}`),
    markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
    markAllAsRead: () => apiClient.put('/notifications/read-all'),
    deleteAllNotifications: () => apiClient.delete('/notifications'),
    getNotificationStats: () => apiClient.get('/notifications/stats'),
    getLatestNotifications: (limit = 10) => apiClient.get('/notifications/latest', { params: { limit } }),
};
