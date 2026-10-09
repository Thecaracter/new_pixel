import React, { useState, useRef } from 'react';

/**
 * Chat panel component with message display and input
 * Supports local message submission with Enter key
 * Accessible with proper labels and ARIA attributes
 */
export function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Trim and validate input
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: trimmedInput }]);
    setInputValue('');

    // Add assistant response after a brief delay
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        text: 'Hi there! How can I help you today?' 
      }]);
    }, 500);
  };

  const handleKeyDown = (e) => {
    // Enter submits, Shift+Enter creates newline (for textarea)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <section className="chat-panel">
      <div className="chat-container">
        {/* Messages area */}
        <div className="chat-messages" role="log" aria-live="polite" aria-label="Chat messages">
          {isEmpty && (
            <div className="chat-empty-state">
              <p>Start a conversation...</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`chat-message chat-message-${message.type}`}
              role="article"
            >
              <div className="chat-message-content">
                {message.text}
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="chat-form">
          <label htmlFor="chat-input" className="chat-label">
            Message
          </label>
          <div className="chat-input-wrapper">
            <textarea
              id="chat-input"
              className="chat-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              aria-describedby="chat-help"
              rows="2"
            />
            <button
              type="submit"
              className="chat-send-btn"
              aria-label="Send message"
              disabled={!inputValue.trim()}
            >
              Send
            </button>
          </div>
          <small id="chat-help" className="chat-help">
            Press Enter to send, Shift+Enter for new line
          </small>
        </form>
      </div>
    </section>
  );
}
