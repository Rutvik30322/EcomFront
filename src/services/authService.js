import apiClient from './apiClient';

export const loginAdmin = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/admin/login', credentials);
    return response.data.data; // Return the data part which contains token and admin info
  } catch (error) {
    throw error;
  }
};

export const getMe = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const updateAdminProfile = async (data) => {
  try {
    const response = await apiClient.put('/auth/admin/profile', data);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const changeAdminPassword = async (currentPassword, newPassword) => {
  try {
    const response = await apiClient.put('/auth/admin/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const sendAdminOtp = async (mobile) => {
  try {
    const response = await apiClient.post('/auth/admin/forgot-password/send-otp', { mobile });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyAdminOtp = async (mobile, otp) => {
  try {
    const response = await apiClient.post('/auth/admin/forgot-password/verify-otp', { mobile, otp });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetAdminPassword = async (mobile, otp, newPassword) => {
  try {
    const response = await apiClient.post('/auth/admin/forgot-password/reset', {
      mobile,
      otp,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default apiClient;