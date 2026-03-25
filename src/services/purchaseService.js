import apiClient, { buildParams } from './apiClient';

export const purchaseService = {
    getNextPurchaseNo: () => apiClient.get('/purchases/next-purchase-no'),
    getAllPurchase: (params = {}) => apiClient.get('/purchases', { params: buildParams(params) }),
    getProductById: (id) => apiClient.get(`/products/${id}`),
    createpurchases: (data) => apiClient.post('/purchases', data),
    updatepurchases: (id, data) => apiClient.put(`/purchases/${id}`, data),
    updateProduct: (id, data) => apiClient.put(`/products/${id}`, data),
    deleteProduct: (id) => apiClient.delete(`/products/${id}`),
    deletepurchases: (id) => apiClient.delete(`/purchases/${id}`),
};
