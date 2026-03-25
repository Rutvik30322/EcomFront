import apiClient, { buildParams } from './apiClient';

export const bannerService = {
    getAllBanners: (params = {}) => apiClient.get('/banners', { params: buildParams(params) }),
    getBannerById: (id) => apiClient.get(`/banners/${id}`),
    createBanner: (data) => apiClient.post('/banners', data),
    updateBanner: (id, data) => apiClient.put(`/banners/${id}`, data),
    deleteBanner: (id) => apiClient.delete(`/banners/${id}`),
};
