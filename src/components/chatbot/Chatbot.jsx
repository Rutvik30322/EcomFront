import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import LoadingOverlay from '../ui/LoadingOverlay';
import { chatbotService } from '../../services/chatbotService';
import dashboardStyles from '../../pages/dashboard/Dashboard.module.css';
import styles from './Chatbot.module.css';

const Chatbot = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! I\'m your admin assistant. I can help you with dashboard statistics, products, orders, users, and more. Ask me anything about your admin panel!', sender: 'bot' },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (inputText.trim() === '' || loading) return;

    const userMessage = inputText.trim();

    const newUserMessage = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setLoading(true);

    try {

      const conversationHistory = messages
        .filter(msg => msg.id !== '1') // Exclude initial greeting
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        }));

      const botResponseText = await chatbotService.sendMessage(userMessage, conversationHistory);

      const botResponse = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        text: error.message || 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={dashboardStyles.dashboardContainer}>
      <LoadingOverlay
        show={loading}
        message="Analyzing data and generating response..."
      />
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {}
      <main className={`${dashboardStyles.mainContent} ${!sidebarOpen ? dashboardStyles.mainContentExpanded : ''}`}>
        <Header
          title="AI Assistant"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className={dashboardStyles.dashboardContent}>
          <div className={styles.chatbotContainer}>
            {}
            <div className={styles.messagesContainer}>
              <div className={styles.messagesContent}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`${styles.messageBubble} ${message.sender === 'user' ? styles.userMessage : styles.botMessage
                      }`}
                  >
                    <div className={styles.messageHeader}>
                      {message.sender === 'bot' && (
                        <span className={styles.botIcon}>🤖</span>
                      )}
                      <span className={styles.messageSender}>
                        {message.sender === 'user' ? 'You' : 'AI Assistant'}
                      </span>
                    </div>
                    <div className={styles.messageText}>
                      {message.text.split('\n').map((line, idx) => (
                        <React.Fragment key={idx}>
                          {line}
                          {idx < message.text.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className={`${styles.messageBubble} ${styles.botMessage}`}>
                    <div className={styles.typingIndicator}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {}
            <div className={styles.inputContainer}>
              <textarea
                className={styles.textInput}
                placeholder="Ask about products, orders, users, statistics..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={1}
                disabled={loading}
              />
              <button
                className={styles.sendButton}
                onClick={handleSend}
                disabled={loading || inputText.trim() === ''}
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chatbot;
