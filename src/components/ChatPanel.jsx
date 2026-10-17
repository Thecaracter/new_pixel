import React, { useState, useRef, useEffect } from 'react';

/**
 * Team members roster fallback for Pixel Works Virtual Office
 */
const DEFAULT_ROSTER = [
  { id: 'arif', name: 'Arif', role: 'Project Lead / Coordinator', description: 'Memimpin koordinasi sprint, requirement elicitation, dan breakdown tugas' },
  { id: 'rina', name: 'Rina', role: 'Finance / Accountant', description: 'Menghitung estimasi budget, invoice, dan laporan keuangan' },
  { id: 'dimas', name: 'Dimas', role: 'UI/UX Designer', description: 'Membuat wireframe, desain antarmuka, mockup, dan aset visual' },
  { id: 'bayu', name: 'Bayu', role: 'Product / Frontend Engineer', description: 'Implementasi antarmuka, user flow, dan integrasi fitur aplikasi' },
  { id: 'sinta', name: 'Sinta', role: 'Marketing / Growth', description: 'Menyusun strategi campaign promosi, copy pemasaran, dan go-to-market' },
  { id: 'mira', name: 'Mira', role: 'Sales / Client Relations', description: 'Komunikasi kebutuhan klien, pitching, dan relationship management' },
  { id: 'eko', name: 'Eko', role: 'Operations / Admin Support', description: 'Manajemen operasional, kelengkapan administrasi, dan alur dokumen' },
];

/**
 * Chat panel component supporting both Leader Mode (Arif) and Standard Chat
 * Connects to local OpenCode backend via /api/chat endpoint
 * Keeps session state and message history completely isolated between modes
 */
export function ChatPanel() {
  const [mode, setMode] = useState('leader'); // 'leader' | 'chat'
  const [chatMessages, setChatMessages] = useState([]);
  const [leaderMessages, setLeaderMessages] = useState([]);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [leaderSessionId, setLeaderSessionId] = useState(null);
  const [teamMembers, setTeamMembers] = useState(DEFAULT_ROSTER);

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedModel, setSelectedModel] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [currentModel, setCurrentModel] = useState(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState(null);

  // Answers map: { "msgIdx-qIdx": "answer text" }
  const [questionAnswers, setQuestionAnswers] = useState({});

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch available models and team roster on mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setModelsLoading(true);
        setModelsError(null);
        const response = await fetch('/api/models');
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
        }
        const data = await response.json();
        setAvailableModels(data.models || []);
        setCurrentModel(data.currentModel);
        setSelectedModel(data.currentModel || data.defaultModel);
        setModelsError(null);
      } catch (err) {
        console.error('Error fetching models:', err);
        let errorMsg = 'Could not load available models';
        if (err instanceof TypeError && err.message.includes('fetch')) {
          errorMsg = 'Backend not running — start with: npm run dev';
        } else if (err instanceof SyntaxError) {
          errorMsg = 'Invalid response from backend';
        } else if (err.message) {
          errorMsg = `Error: ${err.message}`;
        }
        setModelsError(errorMsg);
        setAvailableModels([]);
      } finally {
        setModelsLoading(false);
      }
    };

    const fetchTeam = async () => {
      try {
        const response = await fetch('/api/team');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.members) && data.members.length > 0) {
            setTeamMembers(data.members);
          }
        }
      } catch (e) {
        // Fallback roster is already set
      }
    };

    fetchModels();
    fetchTeam();
  }, []);

  // Active messages based on mode
  const currentMessages = mode === 'leader' ? leaderMessages : chatMessages;

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, loading]);

  const handleQuickAction = (text) => {
    setInputValue(text);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleAnswerChange = (key, value) => {
    setQuestionAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmitAllAnswers = (msgIndex, questions) => {
    if (loading) return;
    const answers = questions.map((q, qIdx) => {
      const key = `${msgIndex}-${qIdx}`;
      return `${q}\n→ ${(questionAnswers[key] || '').trim()}`;
    });
    const fullMessage = `Menjawab pertanyaan klarifikasi:\n\n${answers.join('\n\n')}`;
    // Clear answers for this message
    setQuestionAnswers(prev => {
      const next = { ...prev };
      questions.forEach((_, qIdx) => { delete next[`${msgIndex}-${qIdx}`]; });
      return next;
    });
    handleSubmit(null, fullMessage);
  };

  const handleResetSession = () => {
    if (loading) return;
    if (mode === 'leader') {
      setLeaderSessionId(null);
      setLeaderMessages([]);
    } else {
      setChatSessionId(null);
      setChatMessages([]);
    }
    setError(null);
  };

  const handleSubmit = async (e, directMessage) => {
    if (e) e.preventDefault();

    const trimmedInput = directMessage || inputValue.trim();
    if (!trimmedInput || loading) return;

    const currentMode = mode;
    const isLeader = currentMode === 'leader';
    const activeSessionId = isLeader ? leaderSessionId : chatSessionId;

    // Add user message to active thread
    const userMessage = { type: 'user', text: trimmedInput, mode: currentMode };
    if (isLeader) {
      setLeaderMessages(prev => [...prev, userMessage]);
    } else {
      setChatMessages(prev => [...prev, userMessage]);
    }

    setInputValue('');
    setError(null);
    setLoading(true);

    try {
      const payload = {
        message: trimmedInput,
        sessionId: activeSessionId,
        model: selectedModel,
      };

      // Explicitly send mode: "leader" when in Leader Mode, omit or chat otherwise
      if (isLeader) {
        payload.mode = 'leader';
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.details || data.error || 'Chat service error');
      }

      const data = await response.json();

      // Maintain session continuity isolated per mode
      if (data.sessionId) {
        if (isLeader) {
          setLeaderSessionId(data.sessionId);
        } else {
          setChatSessionId(data.sessionId);
        }
      }

      // Update current model if server reports one
      if (data.model) {
        setCurrentModel(data.model);
      }

      // Append assistant response to appropriate mode
      if (isLeader) {
        setLeaderMessages(prev => [
          ...prev,
          {
            type: 'assistant',
            mode: 'leader',
            text: data.reply,
            phase: data.phase,
            questions: data.questions || [],
            plan: data.plan || null,
            confirmation_prompt: data.confirmation_prompt || null,
            valid: data.valid,
            roster: data.roster || teamMembers
          }
        ]);
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            type: 'assistant',
            mode: 'chat',
            text: data.reply
          }
        ]);
      }
    } catch (err) {
      const errorText = err instanceof Error
        ? err.message
        : 'Failed to connect to chat service';

      setError(errorText);

      const errorMessage = {
        type: 'error',
        text: `Error: ${errorText}`
      };

      if (isLeader) {
        setLeaderMessages(prev => [...prev, errorMessage]);
      } else {
        setChatMessages(prev => [...prev, errorMessage]);
      }
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

  const isEmpty = currentMessages.length === 0;

  return (
    <section className="chat-panel" aria-label="Virtual Office Chat & Coordination">
      <div className="chat-container">
        {/* Header Controls: Mode Selector Tabs, Model Selector & Reset */}
        <div className="chat-controls-bar">
          <div className="chat-mode-tabs" role="tablist" aria-label="Pilih Mode Chat">
            <button
              type="button"
              role="tab"
              id="tab-leader-mode"
              aria-selected={mode === 'leader'}
              aria-controls="chat-messages-panel"
              className={`chat-mode-tab ${mode === 'leader' ? 'active' : ''}`}
              onClick={() => setMode('leader')}
              disabled={loading}
            >
              <span className="mode-tab-icon" aria-hidden="true">🧑‍💼</span>
              <span className="mode-tab-title">Leader Mode</span>
              <span className="mode-tab-badge">Arif</span>
            </button>
            <button
              type="button"
              role="tab"
              id="tab-standard-mode"
              aria-selected={mode === 'chat'}
              aria-controls="chat-messages-panel"
              className={`chat-mode-tab ${mode === 'chat' ? 'active' : ''}`}
              onClick={() => setMode('chat')}
              disabled={loading}
            >
              <span className="mode-tab-icon" aria-hidden="true">💬</span>
              <span className="mode-tab-title">Chat Biasa</span>
            </button>
          </div>

          <div className="chat-controls-right">
            {/* Model Selector */}
            <div className="chat-model-selector-inline">
              <label htmlFor="model-select" className="chat-model-label">
                Model:
              </label>
              {modelsLoading ? (
                <span className="chat-model-loading">Loading...</span>
              ) : modelsError ? (
                <span className="chat-model-error" title={modelsError}>
                  Error
                </span>
              ) : availableModels.length > 0 ? (
                <select
                  id="model-select"
                  className="chat-model-select"
                  value={selectedModel || ''}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={loading}
                  aria-label="Select AI model"
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="chat-model-error">None</span>
              )}
            </div>

            {/* Reset Session Button */}
            <button
              type="button"
              className="chat-reset-button"
              onClick={handleResetSession}
              disabled={loading || (mode === 'leader' ? !leaderSessionId && leaderMessages.length === 0 : !chatSessionId && chatMessages.length === 0)}
              title={`Mulai sesi baru untuk ${mode === 'leader' ? 'Leader Mode' : 'Chat Biasa'}`}
              aria-label="Mulai sesi baru"
            >
              🔄 Sesi Baru
            </button>
          </div>
        </div>

        {/* Mode Notification / Description */}
        <div className="chat-mode-banner">
          {mode === 'leader' ? (
            <div className="banner-leader">
              <span>
                <strong>🧑‍💼 Arif (Project Lead):</strong> Mengoordinasikan tim, mengklarifikasi kebutuhan, membagi tugas ke anggota roster, dan meminta konfirmasi sebelum eksekusi.
              </span>
            </div>
          ) : (
            <div className="banner-standard">
              <span>
                <strong>💬 OpenCode Chat:</strong> Percakapan umum langsung tanpa persona koordinasi Arif dan tanpa struktur tugas.
              </span>
            </div>
          )}
        </div>

        {/* Messages Display Area */}
        <div
          id="chat-messages-panel"
          className="chat-messages"
          role="log"
          aria-live="polite"
          aria-label={mode === 'leader' ? 'Leader Mode conversation' : 'Standard chat messages'}
        >
          {isEmpty && mode === 'leader' && (
            <div className="chat-empty-state leader-empty-state">
              <div className="empty-state-avatar" aria-hidden="true">🧑‍💼</div>
              <h3 className="empty-state-title">Koordinasi Tim Bersama Arif</h3>
              <p className="empty-state-subtitle">
                Instruksikan kebutuhan proyek atau penugasan anggota tim. Arif akan memvalidasi roster dan menyusun rencana tugas.
              </p>

              {/* Roster Quick Tags */}
              <div className="leader-roster-box">
                <span className="roster-box-title">Daftar Anggota Tim (Roster):</span>
                <div className="roster-tags-container">
                  {teamMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      className="roster-tag-chip"
                      onClick={() => handleQuickAction(`Arif, tugaskan ${member.name} untuk `)}
                      title={`${member.name} (${member.role}): ${member.description}`}
                    >
                      <span className="roster-chip-name">{member.name}</span>
                      <span className="roster-chip-role">{member.role.split('/')[0].trim()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Suggestions */}
              <div className="leader-suggestions-box">
                <span className="suggestions-title">Contoh Perintah Koordinasi:</span>
                <div className="suggestions-list">
                  <button
                    type="button"
                    className="suggestion-chip"
                    onClick={() => handleQuickAction('Arif, tugaskan Sinta untuk membuat campaign login')}
                  >
                    🚀 Arif, tugaskan Sinta untuk membuat campaign login
                  </button>
                  <button
                    type="button"
                    className="suggestion-chip"
                    onClick={() => handleQuickAction('Arif, buatkan rencana sprint redesign UI bersama Dimas dan Bayu')}
                  >
                    🎨 Rencana sprint redesign UI bersama Dimas dan Bayu
                  </button>
                  <button
                    type="button"
                    className="suggestion-chip"
                    onClick={() => handleQuickAction('Arif, koordinasikan estimasi budget peluncuran produk dengan Rina')}
                  >
                    💰 Estimasi budget peluncuran dengan Rina
                  </button>
                </div>
              </div>
            </div>
          )}

          {isEmpty && mode === 'chat' && (
            <div className="chat-empty-state standard-empty-state">
              <div className="empty-state-icon" aria-hidden="true">💬</div>
              <p>Mulai percakapan santai dengan OpenCode...</p>
            </div>
          )}

          {/* Render Messages */}
          {currentMessages.map((message, index) => {
            if (message.type === 'user') {
              return (
                <div key={index} className="chat-message chat-message-user" role="article">
                  <div className="chat-message-content">
                    {message.text}
                  </div>
                </div>
              );
            }

            if (message.type === 'error') {
              return (
                <div key={index} className="chat-message chat-message-error" role="alert">
                  <div className="chat-message-content">
                    {message.text}
                  </div>
                </div>
              );
            }

            // Assistant Message
            const isLeaderMessage = message.mode === 'leader' || !!message.phase;

            return (
              <div
                key={index}
                className={`chat-message chat-message-assistant ${isLeaderMessage ? 'chat-message-leader' : ''}`}
                role="article"
              >
                <div className={`chat-message-content ${isLeaderMessage ? 'leader-message-wrapper' : ''}`}>
                  {isLeaderMessage ? (
                    <>
                      {/* Persona Header & Phase Badge */}
                      <div className="leader-card-header">
                        <div className="leader-identity">
                          <span className="leader-icon" aria-hidden="true">🧑‍💼</span>
                          <span className="leader-name">Arif</span>
                          <span className="leader-role-tag">Project Lead</span>
                        </div>

                        {message.phase && (
                          <span className={`leader-phase-pill phase-${message.phase}`}>
                            {message.phase === 'clarifying' && '🔍 Klarifikasi Kebutuhan'}
                            {message.phase === 'awaiting_confirmation' && '⏳ Menunggu Konfirmasi'}
                            {message.phase === 'planned' && '📋 Rencana Disusun'}
                          </span>
                        )}
                      </div>

                      {/* Summary Text */}
                      <div className="leader-summary-text">
                        {message.text}
                      </div>

                      {/* Clarifying Questions Section */}
                      {Array.isArray(message.questions) && message.questions.length > 0 && (() => {
                        const allAnswered = message.questions.every((_, qIdx) => {
                          const key = `${index}-${qIdx}`;
                          return (questionAnswers[key] || '').trim().length > 0;
                        });
                        const answeredCount = message.questions.filter((_, qIdx) =>
                          (questionAnswers[`${index}-${qIdx}`] || '').trim().length > 0
                        ).length;

                        return (
                          <div className="leader-questions-panel">
                            <div className="panel-heading">
                              <span aria-hidden="true">❓</span>
                              <strong>Poin Klarifikasi yang Diperlukan:</strong>
                              <span className="questions-progress">
                                {answeredCount}/{message.questions.length} terjawab
                              </span>
                            </div>
                            <ul className="questions-items-list">
                              {message.questions.map((q, qIdx) => {
                                const answerKey = `${index}-${qIdx}`;
                                const answerVal = questionAnswers[answerKey] || '';
                                const isFilled = answerVal.trim().length > 0;
                                return (
                                  <li key={qIdx} className="question-item-wrapper">
                                    <div className="question-item">
                                      <span className={`question-status-dot ${isFilled ? 'filled' : ''}`}>
                                        {isFilled ? '✓' : (qIdx + 1)}
                                      </span>
                                      <span className="question-text">{q}</span>
                                    </div>
                                    <div className="question-inline-reply">
                                      <input
                                        type="text"
                                        className={`question-reply-input ${isFilled ? 'answered' : ''}`}
                                        value={answerVal}
                                        onChange={(e) => handleAnswerChange(answerKey, e.target.value)}
                                        placeholder="Ketik jawaban Anda..."
                                        disabled={loading}
                                      />
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                            <div className="questions-submit-bar">
                              <span className="questions-submit-hint">
                                {allAnswered
                                  ? '✅ Semua pertanyaan sudah dijawab'
                                  : `⏳ Jawab semua pertanyaan dulu (${answeredCount}/${message.questions.length})`
                                }
                              </span>
                              <button
                                type="button"
                                className="questions-submit-btn"
                                onClick={() => handleSubmitAllAnswers(index, message.questions)}
                                disabled={!allAnswered || loading}
                              >
                                📨 Kirim Semua Jawaban
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Planned Tasks Section */}
                      {message.plan && (
                        <div className="leader-plan-panel">
                          <div className="plan-title-bar">
                            <span className="plan-icon" aria-hidden="true">📋</span>
                            <span className="plan-title">{message.plan.title || 'Rencana Proyek'}</span>
                          </div>

                          {message.plan.goal && (
                            <div className="plan-meta-row">
                              <span className="meta-tag">🎯 Goal:</span>
                              <span className="meta-val">{message.plan.goal}</span>
                            </div>
                          )}

                          {message.plan.scope && (
                            <div className="plan-meta-row">
                              <span className="meta-tag">📐 Scope:</span>
                              <span className="meta-val">{message.plan.scope}</span>
                            </div>
                          )}

                          {Array.isArray(message.plan.tasks) && message.plan.tasks.length > 0 && (
                            <div className="plan-tasks-block">
                              <span className="tasks-block-header">
                                Pembagian Tugas ({message.plan.tasks.length} task):
                              </span>
                              <div className="tasks-grid">
                                {message.plan.tasks.map((task, tIdx) => (
                                  <div key={tIdx} className="task-card">
                                    <div className="task-card-top">
                                      <span className="task-badge-id">{task.id}</span>
                                      <span className="task-badge-title">{task.title}</span>
                                      <span className={`task-badge-status status-${task.status}`}>
                                        {task.status}
                                      </span>
                                    </div>
                                    <div className="task-assignee-info">
                                      <span className="assignee-avatar" aria-hidden="true">👤</span>
                                      <strong>{task.assignee}</strong>
                                      <span className="assignee-role-sep">•</span>
                                      <span className="assignee-role">{task.role}</span>
                                    </div>
                                    {task.description && (
                                      <div className="task-desc">{task.description}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Confirmation Prompt Section */}
                      {message.confirmation_prompt && (
                        <div className="leader-confirmation-panel">
                          <div className="confirmation-header-line">
                            <span aria-hidden="true">⚠️</span>
                            <strong>Persetujuan Sebelum Eksekusi:</strong>
                          </div>
                          <p className="confirmation-body-text">{message.confirmation_prompt}</p>
                          <div className="confirmation-action-buttons">
                            <button
                              type="button"
                              className="confirm-btn confirm-btn-agree"
                              onClick={() => handleQuickAction('Setuju, rencana sudah sesuai. Silakan lanjutkan.')}
                            >
                              ✅ Setuju & Lanjutkan
                            </button>
                            <button
                              type="button"
                              className="confirm-btn confirm-btn-revise"
                              onClick={() => handleQuickAction('Saya ingin merevisi rencana ini: ')}
                            >
                              ✏️ Beri Catatan Revisi
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>{message.text}</div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="chat-message chat-message-loading" role="status" aria-label="Loading response">
              <div className="chat-message-content">
                <span className="chat-loading-spinner"></span>
                <span>{mode === 'leader' ? 'Arif sedang mengoordinasikan tim...' : 'is thinking...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="chat-form">
          <label htmlFor="chat-input" className="chat-label">
            {mode === 'leader' ? 'Instruksi untuk Arif (Project Lead)' : 'Message OpenCode'}
          </label>
          <div className="chat-input-wrapper">
            <textarea
              id="chat-input"
              ref={inputRef}
              className="chat-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'leader'
                  ? 'Contoh: "Arif, tugaskan Sinta untuk membuat campaign login"...'
                  : 'Ask OpenCode something...'
              }
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
              {loading ? 'Mengirim...' : 'Kirim'}
            </button>
          </div>
          <small id="chat-help" className="chat-help">
            Tekan Enter untuk mengirim, Shift+Enter untuk baris baru.
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

export default ChatPanel;
