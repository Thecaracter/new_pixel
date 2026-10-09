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
  const [selectedModel, setSelectedModel] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [currentModel, setCurrentModel] = useState(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch available models on mount
  React.useEffect(() => {
    const fetchModels = async () => {
      try {
        setModelsLoading(true);
        const response = await fetch('/api/models');
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }
        const data = await response.json();
        setAvailableModels(data.models || []);
        setCurrentModel(data.currentModel);
        // Set selected model to current or first available
        setSelectedModel(data.currentModel || data.defaultModel);
        setModelsError(null);
      } catch (err) {
        console.error('Error fetching models:', err);
        setModelsError('Could not load available models');
        // Set a default if available
        setAvailableModels([]);
        setModelsLoading(false);
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, []);

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
      // Call backend endpoint with current session ID and model
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedInput,
          sessionId: sessionId,
          model: selectedModel,
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
      
      // Update current model if server reports one
      if (data.model) {
        setCurrentModel(data.model);
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
        {/* Model selector */}
        <div className="chat-model-selector">
          <label htmlFor="model-select" className="chat-model-label">
            Model:
          </label>
          <div className="chat-model-wrapper">
            {modelsLoading ? (
              <div className="chat-model-loading">Loading models...</div>
            ) : modelsError ? (
              <div className="chat-model-error" title={modelsError}>
                {modelsError}
              </div>
            ) : availableModels.length > 0 ? (
              <>
                <select
                  id="model-select"
                  className="chat-model-select"
                  value={selectedModel || ''}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={loading}
                  aria-label="Select AI model"
                >
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                {currentModel && currentModel !== selectedModel && (
                  <small className="chat-model-info">
                    (current: {currentModel})
                  </small>
                )}
              </>
            ) : (
              <div className="chat-model-error">No models available</div>
            )}
          </div>
        </div>

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
