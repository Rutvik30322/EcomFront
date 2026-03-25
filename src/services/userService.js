import apiClient, { buildParams } from './apiClient';

export const userService = {
    getAllUsers: (params = {}) => apiClient.get('/users', { params: buildParams(params) }),
    getUserById: (id) => apiClient.get(`/users/${id}`),
    createUser: (data) => apiClient.post('/users', data),
    updateUser: (id, data) => apiClient.put(`/users/${id}`, data),
    deleteUser: (id) => apiClient.delete(`/users/${id}`),
    toggleUserStatus: (id) => apiClient.put(`/users/${id}/toggle-status`),
};
