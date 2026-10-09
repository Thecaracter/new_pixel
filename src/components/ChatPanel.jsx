import React, { useState, useRef } from 'react';

/**
 * Chat panel component with message display and input
 * Connects to local OpenCode backend via /api/chat endpoint
 * Supports local message submission with Enter key
 * Accessible with proper labels and ARIA attributes
 */
export function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Trim and validate input
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || loading) return;

    // Add user message
    const userMessage = { type: 'user', text: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setError(null);
    setLoading(true);

    try {
      // Call backend endpoint with current session ID
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedInput,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.details || data.error || 'Chat service error');
      }

      const data = await response.json();
      
      // Update session ID for continuity
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
      
      // Add assistant message
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        text: data.reply 
      }]);
    } catch (err) {
      // Show error message to user
      const errorText = err instanceof Error 
        ? err.message 
        : 'Failed to connect to chat service';
      
      setError(errorText);
      
      // Add error message to chat
      setMessages(prev => [...prev, { 
        type: 'error', 
        text: `Error: ${errorText}` 
      }]);
    } finally {
      setLoading(false);
    }
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
              <p>Start a conversation with OpenCode...</p>
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

          {loading && (
            <div className="chat-message chat-message-loading" role="status" aria-label="Loading response">
              <div className="chat-message-content">
                <span className="chat-loading-spinner"></span>
                <span>OpenCode is thinking...</span>
              </div>
            </div>
          )}
          
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
              placeholder="Ask OpenCode something..."
              aria-describedby="chat-help"
              rows="2"
              disabled={loading}
            />
            <button
              type="submit"
              className="chat-send-btn"
              aria-label="Send message"
              disabled={!inputValue.trim() || loading}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
          <small id="chat-help" className="chat-help">
            Press Enter to send, Shift+Enter for new line
          </small>
          
          {error && (
            <div className="chat-error-message" role="alert">
              {error}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
