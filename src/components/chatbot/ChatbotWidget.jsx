import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Lottie from 'lottie-react';
import LoadingOverlay from '../ui/LoadingOverlay';
import { chatbotService } from '../../services/chatbotService';
import styles from './ChatbotWidget.module.css';
import aiAnimation from '../../assets/ai animation Flow 1.json';

const ChatbotWidget = () => {
  const { isAuthenticated } = useSelector(state => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! I\'m your admin assistant. I can help you with dashboard statistics, products, orders, users, and more. Ask me anything about your admin panel!', sender: 'bot' },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

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

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <LoadingOverlay
        show={loading}
        message="Analyzing data and generating response..."
      />

      {}
      <button
        className={styles.chatButton}
        onClick={handleToggle}
        aria-label="Open AI Assistant"
      >
        {isOpen ? (
          <span className={styles.closeIcon}>✕</span>
        ) : (
          <Lottie
            animationData={aiAnimation}
            loop
            autoplay
            style={{ width: 52, height: 52, pointerEvents: 'none' }}
          />
        )}
      </button>

      {}
      {isOpen && (
        <div className={styles.chatPopup}>
          <div className={styles.chatHeader}>
            <div className={styles.headerContent}>
              <Lottie
                animationData={aiAnimation}
                loop
                autoplay
                style={{ width: 40, height: 40, flexShrink: 0 }}
              />
              <div>
                <h3 className={styles.headerTitle}>AI Assistant</h3>
                <p className={styles.headerSubtitle}>Ask me anything about your admin panel</p>
              </div>
            </div>
            <button
              className={styles.closeButton}
              onClick={handleClose}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

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
                      <Lottie
                        animationData={aiAnimation}
                        loop
                        autoplay
                        style={{ width: 22, height: 22, flexShrink: 0 }}
                      />
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

          <div className={styles.inputContainer}>
            <textarea
              ref={inputRef}
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
              {loading ? (
                <span className={styles.loadingSpinner}>⏳</span>
              ) : (
                <span>➤</span>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
