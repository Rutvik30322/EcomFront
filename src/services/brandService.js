import apiClient from './apiClient';

export const brandService = {
    /**
     * Get all brands with optional filtering
     * @param {Object} params - Query parameters (search, isActive)
     */
    getAllBrands: (params = {}) => {
        return apiClient.get('/brands', { params });
    },

    /**
     * Get a single brand by ID
     * @param {string} id - Brand ID
     */
    getBrandById: (id) => {
        return apiClient.get(`/brands/${id}`);
    },

    /**
     * Create a new brand
     * @param {FormData|Object} brandData - Brand data to create
     */
    createBrand: (brandData) => {
        return apiClient.post('/brands', brandData, {
            headers: brandData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
        });
    },

    /**
     * Update an existing brand
     * @param {string} id - Brand ID
     * @param {FormData|Object} brandData - Brand data to update
     */
    updateBrand: (id, brandData) => {
        return apiClient.put(`/brands/${id}`, brandData, {
            headers: brandData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
        });
    },

    /**
     * Delete a brand
     * @param {string} id - Brand ID
     */
    deleteBrand: (id) => {
        return apiClient.delete(`/brands/${id}`);
    }
};
