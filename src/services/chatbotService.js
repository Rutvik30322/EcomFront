import apiClient from './apiClient';

/**
 * Chatbot service for admin panel
 * Uses backend API which analyzes admin data and provides intelligent responses
 */
export const chatbotService = {
  /**
   * Send message to chatbot
   * @param {string} message - User's message
   * @param {Array} conversationHistory - Previous messages for context
   * @returns {Promise<string>} AI response
   */
  async sendMessage(message, conversationHistory = []) {
    try {
      const response = await apiClient.post('/chatbot', {
        message,
        conversationHistory,
      });

      return response.data.data.response || 'Sorry, I could not process your request.';
    } catch (error) {
      console.error('Chatbot API Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get response';
      throw new Error(errorMessage);
    }
  },
};

export default chatbotService;
