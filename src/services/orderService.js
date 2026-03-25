import apiClient from './apiClient';

export const orderService = {

    getAllOrders: (status, page = 1) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        params.append('page', page.toString());
        return apiClient.get(`/orders?${params.toString()}`);
    },

    getOrderById: (id) => apiClient.get(`/orders/${id}`),

    updateOrderStatus: (id, orderStatus) =>
        apiClient.put(`/orders/${id}/status`, { orderStatus }),

    updateOrderPayment: (id, isPaid, paymentResult) =>
        apiClient.put(`/orders/${id}/payment`, { isPaid, paymentResult }),

    getDashboardStats: () => apiClient.get('/orders/admin/stats'),

    deleteOrder: (id) => apiClient.delete(`/orders/${id}`),
};
