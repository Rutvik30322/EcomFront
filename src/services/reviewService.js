import apiClient, { buildParams } from './apiClient';

export const reviewService = {
    getAllReviews: (params = {}) => apiClient.get('/reviews', { params: buildParams(params) }),
    getReviewById: (id) => apiClient.get(`/reviews/${id}`),
    approveReview: (id, isApproved) => apiClient.put(`/reviews/${id}/approve`, { isApproved }),
    deleteReview: (id) => apiClient.delete(`/reviews/${id}/admin`),
};
