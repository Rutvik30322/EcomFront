import apiClient from './apiClient';
import { PDF_TIMEOUT_MS, AI_TIMEOUT_MS } from './config';

const pdfForm = (pdfFile) => {
    const formData = new FormData();
    formData.append('pdfFile', pdfFile);
    return formData;
};

export const categoryService = {
    getAllCategories: (active = true) => apiClient.get('/categories', { params: active ? { active: true } : {} }),
    getCategoryById: (id) => apiClient.get(`/categories/${id}`),
    createCategory: (data) => apiClient.post('/categories', data),
    updateCategory: (id, data) => apiClient.put(`/categories/${id}`, data),
    deleteCategory: (id) => apiClient.delete(`/categories/${id}`),
    parsePdfForCategories: (pdfFile) => apiClient.post('/categories/parse-pdf', pdfForm(pdfFile), { headers: { 'Content-Type': 'multipart/form-data' }, timeout: PDF_TIMEOUT_MS }),
    parsePdfAndCreateProducts: (pdfFile) => apiClient.post('/categories/parse-pdf-create-products', pdfForm(pdfFile), { headers: { 'Content-Type': 'multipart/form-data' }, timeout: AI_TIMEOUT_MS }),
};
