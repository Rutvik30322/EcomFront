import apiClient from './apiClient';
import { UPLOAD_TIMEOUT_MS } from './config';

export const uploadService = {

    uploadProductImages: (files) => {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }
        return apiClient.post('/upload/product-images', formData, { timeout: UPLOAD_TIMEOUT_MS });
    },

    deleteProductImage: (publicId) => apiClient.delete(`/upload/product-image/${publicId}`),

    uploadProfilePicture: (file) => {
        const formData = new FormData();
        formData.append('profilePicture', file);
        return apiClient.post('/upload/profile-picture', formData, { timeout: UPLOAD_TIMEOUT_MS });
    },

    deleteProfilePicture: () => apiClient.delete('/upload/profile-picture'),
};
