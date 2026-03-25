import apiClient, { buildParams } from './apiClient';

export const adminService = {
    getAllAdmins: (params = {}) => apiClient.get('/admins', { params: buildParams(params) }),
    getAdminById: (id) => apiClient.get(`/admins/${id}`),
    createAdmin: (data) => apiClient.post('/admins', data),
    updateAdmin: (id, data) => apiClient.put(`/admins/${id}`, data),
    deleteAdmin: (id) => apiClient.delete(`/admins/${id}`),
    toggleAdminStatus: (id) => apiClient.put(`/admins/${id}/toggle-status`),
};
