import apiClient, { buildParams } from './apiClient';

export const productService = {
    getAllProducts: (params = {}) => apiClient.get('/products', { params: buildParams(params) }),
    getProductById: (id) => apiClient.get(`/products/${id}`),
    createProduct: (data) => apiClient.post('/products', data),
    updateProduct: (id, data) => apiClient.put(`/products/${id}`, data),
    deleteProduct: (id) => apiClient.delete(`/products/${id}`),
};
