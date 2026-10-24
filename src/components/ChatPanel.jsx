import React, { useState, useRef, useEffect } from 'react';

// Clean, high-craft SVG icons replacing AI-slop emojis
function IconCoordinator() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}

function IconMessage() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconNodes() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="6" rx="1.5" />
      <rect x="2" y="16" width="6" height="6" rx="1.5" />
      <rect x="16" y="16" width="6" height="6" rx="1.5" />
      <path d="M5 16v-4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
      <line x1="12" y1="8" x2="12" y2="12" />
    </svg>
  );
}

function IconCpu() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

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
export function ChatPanel({ externalTeamMembers, onRefreshTeam } = {}) {
  const [mode, setMode] = useState('leader'); // 'leader' | 'chat' | 'orchestrator'
  const [chatMessages, setChatMessages] = useState([]);
  const [leaderMessages, setLeaderMessages] = useState([]);
  const [orchestratorMessages, setOrchestratorMessages] = useState([]);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [leaderSessionId, setLeaderSessionId] = useState(null);
  const [orchestratorSessionId, setOrchestratorSessionId] = useState(null);
  const [teamMembers, setTeamMembers] = useState(externalTeamMembers || DEFAULT_ROSTER);

  // Synchronize when external roster updates
  useEffect(() => {
    if (Array.isArray(externalTeamMembers) && externalTeamMembers.length > 0) {
      setTeamMembers(externalTeamMembers);
    }
  }, [externalTeamMembers]);

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedModel, setSelectedModel] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [currentModel, setCurrentModel] = useState(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState(null);

  // Stepper state for clarifying questions: { "msgIdx": currentStep }
  const [questionStep, setQuestionStep] = useState({});
  // Answers map: { "msgIdx-qIdx": "answer text" }
  const [questionAnswers, setQuestionAnswers] = useState({});

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const stepperInputRef = useRef(null);

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
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Backend mengembalikan format non-JSON (pastikan backend aktif: npm run dev)');
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
  const currentMessages = mode === 'leader' ? leaderMessages : mode === 'orchestrator' ? orchestratorMessages : chatMessages;

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

  const handleStepNext = (msgIndex, totalQuestions) => {
    const current = questionStep[msgIndex] || 0;
    const answerKey = `${msgIndex}-${current}`;
    if (!(questionAnswers[answerKey] || '').trim()) return;
    if (current < totalQuestions - 1) {
      setQuestionStep(prev => ({ ...prev, [msgIndex]: current + 1 }));
      setTimeout(() => stepperInputRef.current?.focus(), 50);
    }
  };

  const handleStepBack = (msgIndex) => {
    const current = questionStep[msgIndex] || 0;
    if (current > 0) {
      setQuestionStep(prev => ({ ...prev, [msgIndex]: current - 1 }));
      setTimeout(() => stepperInputRef.current?.focus(), 50);
    }
  };

  const handleSubmitAllAnswers = (msgIndex, questions) => {
    if (loading) return;
    const answers = questions.map((q, qIdx) => {
      const key = `${msgIndex}-${qIdx}`;
      return `${q}\n→ ${(questionAnswers[key] || '').trim()}`;
    });
    const fullMessage = `Menjawab pertanyaan klarifikasi:\n\n${answers.join('\n\n')}`;
    setQuestionAnswers(prev => {
      const next = { ...prev };
      questions.forEach((_, qIdx) => { delete next[`${msgIndex}-${qIdx}`]; });
      return next;
    });
    setQuestionStep(prev => {
      const next = { ...prev };
      delete next[msgIndex];
      return next;
    });
    handleSubmit(null, fullMessage);
  };

  const handleResetSession = () => {
    if (loading) return;
    if (mode === 'leader') {
      setLeaderSessionId(null);
      setLeaderMessages([]);
    } else if (mode === 'orchestrator') {
      setOrchestratorSessionId(null);
      setOrchestratorMessages([]);
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
    const isOrchestrator = currentMode === 'orchestrator';
    const activeSessionId = isLeader ? leaderSessionId : isOrchestrator ? orchestratorSessionId : chatSessionId;

    // Add user message to active thread
    const userMessage = { type: 'user', text: trimmedInput, mode: currentMode };
    if (isLeader) {
      setLeaderMessages(prev => [...prev, userMessage]);
    } else if (isOrchestrator) {
      setOrchestratorMessages(prev => [...prev, userMessage]);
    } else {
      setChatMessages(prev => [...prev, userMessage]);
    }

    setInputValue('');
    setError(null);
    setLoading(true);

    try {
      let endpoint = '/api/chat';
      const payload = {
        message: trimmedInput,
        sessionId: activeSessionId,
        model: selectedModel,
      };

      if (isLeader) {
        payload.mode = 'leader';
      } else if (isOrchestrator) {
        endpoint = '/api/orchestrate';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        let errMessage = 'Chat service error';
        if (contentType.includes('application/json')) {
          const data = await response.json().catch(() => ({}));
          errMessage = data.details || data.error || errMessage;
        } else {
          const text = await response.text().catch(() => '');
          errMessage = text.includes('<!DOCTYPE') ? 'Backend mengembalikan respons HTML (perlu restart backend: npm run dev)' : (text || `HTTP ${response.status}`);
        }
        throw new Error(errMessage);
      }

      const responseContentType = response.headers.get('content-type') || '';
      if (!responseContentType.includes('application/json')) {
        throw new Error('Backend tidak merespons JSON (pastikan backend direstart)');
      }

      const data = await response.json();

      // Maintain session continuity isolated per mode
      if (data.sessionId) {
        if (isLeader) {
          setLeaderSessionId(data.sessionId);
        } else if (isOrchestrator) {
          setOrchestratorSessionId(data.sessionId);
        } else {
          setChatSessionId(data.sessionId);
        }
      }

      if (data.model) {
        setCurrentModel(data.model);
      }

      // Append assistant response to appropriate mode
      if (isOrchestrator) {
        setOrchestratorMessages(prev => [
          ...prev,
          {
            type: 'assistant',
            mode: 'orchestrator',
            text: data.reply,
            phase: data.phase,
            questions: data.questions || [],
            plan: data.plan || null,
            confirmation_prompt: data.confirmation_prompt || null,
            delegations: data.delegations || [],
            agentResults: data.agentResults || [],
            discussions: data.discussions || [],
            next_steps: data.next_steps || [],
            roster: data.roster || teamMembers
          }
        ]);
      } else if (isLeader) {
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
          { type: 'assistant', mode: 'chat', text: data.reply }
        ]);
      }
    } catch (err) {
      const errorText = err instanceof Error
        ? err.message
        : 'Failed to connect to chat service';

      setError(errorText);

      const errorMessage = { type: 'error', text: `Error: ${errorText}` };

      if (isLeader) {
        setLeaderMessages(prev => [...prev, errorMessage]);
      } else if (isOrchestrator) {
        setOrchestratorMessages(prev => [...prev, errorMessage]);
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
              <span className="mode-tab-icon" aria-hidden="true"><IconCoordinator /></span>
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
              <span className="mode-tab-icon" aria-hidden="true"><IconMessage /></span>
              <span className="mode-tab-title">Chat Biasa</span>
            </button>
            <button
              type="button"
              role="tab"
              id="tab-orchestrator-mode"
              aria-selected={mode === 'orchestrator'}
              aria-controls="chat-messages-panel"
              className={`chat-mode-tab ${mode === 'orchestrator' ? 'active' : ''}`}
              onClick={() => setMode('orchestrator')}
              disabled={loading}
            >
              <span className="mode-tab-icon" aria-hidden="true"><IconNodes /></span>
              <span className="mode-tab-title">Multi-Agent</span>
              <span className="mode-tab-badge">MCP</span>
            </button>
          </div>

          <div className="chat-controls-right">
            {/* Model Selector */}
            <div className="chat-model-selector-inline">
              <label htmlFor="model-select" className="chat-model-label">
                <span className="model-label-icon" aria-hidden="true"><IconCpu /></span>
                <span>Model:</span>
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
              disabled={loading || (mode === 'leader' ? !leaderSessionId && leaderMessages.length === 0 : mode === 'orchestrator' ? !orchestratorSessionId && orchestratorMessages.length === 0 : !chatSessionId && chatMessages.length === 0)}
              title={`Mulai sesi baru untuk ${mode === 'leader' ? 'Leader Mode' : mode === 'orchestrator' ? 'Multi-Agent' : 'Chat Biasa'}`}
              aria-label="Mulai sesi baru"
            >
              <IconRefresh />
              <span>Sesi Baru</span>
            </button>
          </div>
        </div>

        {/* Mode Notification / Description */}
        <div className="chat-mode-banner">
          {mode === 'leader' ? (
            <div className="banner-leader">
              <span className="banner-mode-pill">Arif • Project Lead</span>
              <span className="banner-text">
                Mengoordinasikan tim, mengklarifikasi kebutuhan, membagi tugas ke anggota roster, dan meminta konfirmasi sebelum eksekusi.
              </span>
            </div>
          ) : mode === 'orchestrator' ? (
            <div className="banner-leader">
              <span className="banner-mode-pill">Multi-Agent • MCP</span>
              <span className="banner-text">
                Arif mendelegasikan tugas ke agent spesialis. Setiap agent memiliki keahlian tools sendiri dan dapat saling berdiskusi.
              </span>
            </div>
          ) : (
            <div className="banner-standard">
              <span className="banner-mode-pill">Direct Chat</span>
              <span className="banner-text">
                Percakapan umum langsung tanpa persona koordinasi Arif dan tanpa struktur tugas.
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
              <div className="empty-state-icon-badge" aria-hidden="true">
                <IconCoordinator />
              </div>
              <h3 className="empty-state-title">Koordinasi Tim Bersama Arif</h3>
              <p className="empty-state-subtitle">
                Instruksikan kebutuhan proyek atau penugasan anggota tim. Arif akan memvalidasi roster dan menyusun rencana tugas.
              </p>

              {/* Roster Quick Tags */}
              <div className="leader-roster-box">
                <span className="roster-box-title">Daftar Anggota Tim Aktif:</span>
                <div className="roster-tags-container">
                  {teamMembers.filter(m => m.active !== false).map((member) => (
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
                    <span className="suggestion-arrow"><IconArrowRight /></span>
                    <span>Tugaskan Sinta untuk membuat campaign peluncuran</span>
                  </button>
                  <button
                    type="button"
                    className="suggestion-chip"
                    onClick={() => handleQuickAction('Arif, buatkan rencana sprint redesign UI bersama Dimas dan Bayu')}
                  >
                    <span className="suggestion-arrow"><IconArrowRight /></span>
                    <span>Rencana sprint redesign antarmuka bersama Dimas dan Bayu</span>
                  </button>
                  <button
                    type="button"
                    className="suggestion-chip"
                    onClick={() => handleQuickAction('Arif, koordinasikan estimasi budget peluncuran produk dengan Rina')}
                  >
                    <span className="suggestion-arrow"><IconArrowRight /></span>
                    <span>Koordinasikan estimasi budget peluncuran produk dengan Rina</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {isEmpty && mode === 'chat' && (
            <div className="chat-empty-state standard-empty-state">
              <div className="empty-state-icon-badge" aria-hidden="true">
                <IconMessage />
              </div>
              <h3 className="empty-state-title">Chat Langsung OpenCode</h3>
              <p>Mulai percakapan langsung dengan model AI untuk bantuan kode atau tanya jawab umum.</p>
            </div>
          )}

          {isEmpty && mode === 'orchestrator' && (
            <div className="chat-empty-state leader-empty-state">
              <div className="empty-state-icon-badge" aria-hidden="true">
                <IconNodes />
              </div>
              <h3 className="empty-state-title">Multi-Agent Orchestration</h3>
              <p className="empty-state-subtitle">
                Berikan instruksi kompleks dan Arif akan mendelegasikan tugas ke agen spesialis. Mereka akan berkolaborasi untuk menyelesaikannya.
              </p>
              <div className="leader-suggestions-box">
                <span className="suggestions-title">Contoh Perintah:</span>
                <div className="suggestions-list">
                  <button type="button" className="suggestion-chip"
                    onClick={() => handleQuickAction('Buatkan rencana peluncuran produk baru termasuk budget, desain landing page, dan strategi marketing')}
                  >
                    <span className="suggestion-arrow"><IconArrowRight /></span>
                    <span>Rencana peluncuran produk (budget + desain + marketing)</span>
                  </button>
                  <button type="button" className="suggestion-chip"
                    onClick={() => handleQuickAction('Siapkan pitch deck untuk klien baru di industri fintech, termasuk riset klien dan estimasi harga')}
                  >
                    <span className="suggestion-arrow"><IconArrowRight /></span>
                    <span>Pitch deck & riset penawaran klien fintech</span>
                  </button>
                  <button type="button" className="suggestion-chip"
                    onClick={() => handleQuickAction('Buat timeline sprint 2 minggu untuk redesign halaman dashboard, libatkan Dimas dan Bayu')}
                  >
                    <span className="suggestion-arrow"><IconArrowRight /></span>
                    <span>Timeline sprint redesign dashboard bersama Dimas dan Bayu</span>
                  </button>
                </div>
              </div>
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
            const isLeaderMessage = message.mode === 'leader' || (message.mode !== 'orchestrator' && !!message.phase);
            const isOrchestratorMessage = message.mode === 'orchestrator';

            return (
              <div
                key={index}
                className={`chat-message chat-message-assistant ${isLeaderMessage ? 'chat-message-leader' : ''} ${isOrchestratorMessage ? 'chat-message-leader' : ''}`}
                role="article"
              >
                <div className={`chat-message-content ${(isLeaderMessage || isOrchestratorMessage) ? 'leader-message-wrapper' : ''}`}>
                  {isOrchestratorMessage ? (
                    <>
                      {/* Orchestrator Header */}
                      <div className="leader-card-header">
                        <div className="leader-identity">
                          <span className="leader-icon" aria-hidden="true"><IconNodes /></span>
                          <span className="leader-name">Multi-Agent</span>
                          <span className="leader-role-tag">MCP Orchestrator</span>
                        </div>
                        {message.phase && (
                          <span className={`leader-phase-pill phase-${message.phase}`}>
                            {message.phase === 'clarifying' && 'Klarifikasi'}
                            {message.phase === 'awaiting_confirmation' && 'Menunggu Konfirmasi'}
                            {message.phase === 'planned' && 'Rencana Selesai'}
                          </span>
                        )}
                      </div>

                      {/* Summary */}
                      <div className="leader-summary-text">{message.text}</div>

                      {/* Agent Delegations */}
                      {Array.isArray(message.delegations) && message.delegations.length > 0 && (
                        <div className="orchestrator-delegations">
                          <div className="panel-heading">
                            <strong>Delegasi ke Agent:</strong>
                          </div>
                          <div className="delegation-chips">
                            {message.delegations.map((d, dIdx) => (
                              <span key={dIdx} className="delegation-chip">
                                <span className="delegation-name">{d.agentName || d.agent_id}</span>
                                <span className="delegation-task">{d.task}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Agent Results */}
                      {Array.isArray(message.agentResults) && message.agentResults.length > 0 && (
                        <div className="orchestrator-results">
                          <div className="panel-heading">
                            <strong>Hasil Kerja Agent:</strong>
                          </div>
                          {message.agentResults.map((r, rIdx) => (
                            <div key={rIdx} className={`agent-result-card ${r.error ? 'agent-result-error' : ''}`}>
                              <div className="agent-result-header">
                                <strong>{r.agentName}</strong>
                                <span className="agent-result-role">{r.agentRole}</span>
                                {r.confidence && (
                                  <span className={`agent-confidence confidence-${r.confidence}`}>
                                    {r.confidence}
                                  </span>
                                )}
                                {r.isDiscussionReply && (
                                  <span className="agent-discussion-tag">diskusi</span>
                                )}
                              </div>
                              <div className="agent-result-body">
                                {r.error ? r.error : r.summary}
                              </div>
                              {r.toolResults && r.toolResults.length > 0 && (
                                <div className="agent-tools-used">
                                  Tools: {r.toolResults.map(t => t.tool).join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inter-Agent Discussions */}
                      {Array.isArray(message.discussions) && message.discussions.length > 0 && (
                        <div className="orchestrator-discussions">
                          <div className="panel-heading">
                            <strong>Diskusi Antar Agent:</strong>
                          </div>
                          {message.discussions.map((d, dIdx) => (
                            <div key={dIdx} className="discussion-item">
                              <span className="discussion-from">{d.from}</span>
                              <span className="discussion-arrow">→</span>
                              <span className="discussion-to">{d.to}</span>
                              <span className="discussion-question">"{d.question}"</span>
                              {d.answer && <div className="discussion-answer">↳ {d.answer}</div>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Stepper questions (reuse from leader) */}
                      {Array.isArray(message.questions) && message.questions.length > 0 && (() => {
                        const total = message.questions.length;
                        const step = questionStep[index] || 0;
                        const answerKey = `${index}-${step}`;
                        const currentAnswer = questionAnswers[answerKey] || '';
                        const currentFilled = currentAnswer.trim().length > 0;
                        const isLastStep = step === total - 1;
                        const allAnswered = message.questions.every((_, qIdx) =>
                          (questionAnswers[`${index}-${qIdx}`] || '').trim().length > 0
                        );
                        return (
                          <div className="leader-questions-panel">
                            <div className="panel-heading">
                              <span aria-hidden="true">❓</span>
                              <strong>Klarifikasi</strong>
                            </div>
                            <div className="stepper-dots">
                              {message.questions.map((_, dotIdx) => (
                                <span key={dotIdx} className={`stepper-dot${dotIdx === step ? ' active' : ''}${(questionAnswers[`${index}-${dotIdx}`] || '').trim() ? ' filled' : ''}`} />
                              ))}
                            </div>
                            <div className="stepper-card" key={step}>
                              <div className="stepper-question-label">Pertanyaan {step + 1} dari {total}</div>
                              <div className="stepper-question-text">{message.questions[step]}</div>
                              <input ref={stepperInputRef} type="text" className={`stepper-input ${currentFilled ? 'answered' : ''}`}
                                value={currentAnswer} onChange={(e) => handleAnswerChange(answerKey, e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && currentFilled) { e.preventDefault(); if (isLastStep && allAnswered) handleSubmitAllAnswers(index, message.questions); else handleStepNext(index, total); } }}
                                placeholder="Ketik jawaban Anda..." disabled={loading} autoFocus />
                            </div>
                            <div className="stepper-nav">
                              <button type="button" className="stepper-btn stepper-btn-back" onClick={() => handleStepBack(index)} disabled={step === 0}>← Sebelumnya</button>
                              {isLastStep && allAnswered
                                ? <button type="button" className="stepper-btn stepper-btn-submit" onClick={() => handleSubmitAllAnswers(index, message.questions)} disabled={loading}>📨 Kirim Semua Jawaban</button>
                                : <button type="button" className="stepper-btn stepper-btn-next" onClick={() => handleStepNext(index, total)} disabled={!currentFilled}>Selanjutnya →</button>
                              }
                            </div>
                          </div>
                        );
                      })()}

                      {/* Plan (reuse from leader) */}
                      {message.plan && (
                        <div className="leader-plan-panel">
                          <div className="plan-title-bar">
                            <span className="plan-icon" aria-hidden="true">📋</span>
                            <span className="plan-title">{message.plan.title || 'Rencana Proyek'}</span>
                          </div>
                          {message.plan.goal && (
                            <div className="plan-meta-row"><span className="meta-tag">🎯 Goal:</span><span className="meta-val">{message.plan.goal}</span></div>
                          )}
                          {message.plan.scope && (
                            <div className="plan-meta-row"><span className="meta-tag">📐 Scope:</span><span className="meta-val">{message.plan.scope}</span></div>
                          )}
                          {Array.isArray(message.plan.tasks) && message.plan.tasks.length > 0 && (
                            <div className="plan-tasks-block">
                              <span className="tasks-block-header">Pembagian Tugas ({message.plan.tasks.length} task):</span>
                              <div className="tasks-grid">
                                {message.plan.tasks.map((task, tIdx) => (
                                  <div key={tIdx} className="task-card">
                                    <div className="task-card-top">
                                      <span className="task-badge-id">{task.id}</span>
                                      <span className="task-badge-title">{task.title}</span>
                                      <span className={`task-badge-status status-${task.status}`}>{task.status}</span>
                                    </div>
                                    <div className="task-assignee-info">
                                      <span className="assignee-avatar" aria-hidden="true">👤</span>
                                      <strong>{task.assignee}</strong>
                                      <span className="assignee-role-sep">•</span>
                                      <span className="assignee-role">{task.role}</span>
                                    </div>
                                    {task.description && <div className="task-desc">{task.description}</div>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Next Steps */}
                      {Array.isArray(message.next_steps) && message.next_steps.length > 0 && (
                        <div className="orchestrator-next-steps">
                          <div className="panel-heading">
                            <span aria-hidden="true">➡️</span>
                            <strong>Langkah Selanjutnya:</strong>
                          </div>
                          <ul className="next-steps-list">
                            {message.next_steps.map((step, sIdx) => (
                              <li key={sIdx}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Confirmation */}
                      {message.confirmation_prompt && (
                        <div className="leader-confirmation-panel">
                          <div className="confirmation-header-line">
                            <strong>Persetujuan Rencana:</strong>
                          </div>
                          <p className="confirmation-body-text">{message.confirmation_prompt}</p>
                          <div className="confirmation-action-buttons">
                            <button type="button" className="confirm-btn confirm-btn-agree"
                              onClick={() => handleQuickAction('Setuju, lanjutkan eksekusi.')}>
                              <IconCheck />
                              <span>Setuju & Lanjutkan</span>
                            </button>
                            <button type="button" className="confirm-btn confirm-btn-revise"
                              onClick={() => handleQuickAction('Saya ingin merevisi: ')}>
                              <IconEdit />
                              <span>Beri Catatan Revisi</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : isLeaderMessage ? (
                    <>
                      {/* Persona Header & Phase Badge */}
                      <div className="leader-card-header">
                        <div className="leader-identity">
                          <span className="leader-icon" aria-hidden="true"><IconCoordinator /></span>
                          <span className="leader-name">Arif</span>
                          <span className="leader-role-tag">Project Lead</span>
                        </div>

                        {message.phase && (
                          <span className={`leader-phase-pill phase-${message.phase}`}>
                            {message.phase === 'clarifying' && 'Klarifikasi Kebutuhan'}
                            {message.phase === 'awaiting_confirmation' && 'Menunggu Konfirmasi'}
                            {message.phase === 'planned' && 'Rencana Disusun'}
                          </span>
                        )}
                      </div>

                      {/* Summary Text */}
                      <div className="leader-summary-text">
                        {message.text}
                      </div>

                      {/* Clarifying Questions Section */}
                      {Array.isArray(message.questions) && message.questions.length > 0 && (() => {
                        const total = message.questions.length;
                        const step = questionStep[index] || 0;
                        const answerKey = `${index}-${step}`;
                        const currentAnswer = questionAnswers[answerKey] || '';
                        const currentFilled = currentAnswer.trim().length > 0;
                        const isLastStep = step === total - 1;
                        const allAnswered = message.questions.every((_, qIdx) =>
                          (questionAnswers[`${index}-${qIdx}`] || '').trim().length > 0
                        );

                        return (
                          <div className="leader-questions-panel">
                            <div className="panel-heading">
                              <span aria-hidden="true">❓</span>
                              <strong>Klarifikasi</strong>
                            </div>

                            {/* Step dots */}
                            <div className="stepper-dots">
                              {message.questions.map((_, dotIdx) => {
                                const dotFilled = (questionAnswers[`${index}-${dotIdx}`] || '').trim().length > 0;
                                return (
                                  <span
                                    key={dotIdx}
                                    className={`stepper-dot${dotIdx === step ? ' active' : ''}${dotFilled ? ' filled' : ''}`}
                                    title={`Pertanyaan ${dotIdx + 1}`}
                                  />
                                );
                              })}
                            </div>

                            {/* Current question card */}
                            <div className="stepper-card" key={step}>
                              <div className="stepper-question-label">
                                Pertanyaan {step + 1} dari {total}
                              </div>
                              <div className="stepper-question-text">
                                {message.questions[step]}
                              </div>
                              <input
                                ref={stepperInputRef}
                                type="text"
                                className={`stepper-input ${currentFilled ? 'answered' : ''}`}
                                value={currentAnswer}
                                onChange={(e) => handleAnswerChange(answerKey, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && currentFilled) {
                                    e.preventDefault();
                                    if (isLastStep && allAnswered) {
                                      handleSubmitAllAnswers(index, message.questions);
                                    } else {
                                      handleStepNext(index, total);
                                    }
                                  }
                                }}
                                placeholder="Ketik jawaban Anda..."
                                disabled={loading}
                                autoFocus
                              />
                            </div>

                            {/* Navigation buttons */}
                            <div className="stepper-nav">
                              <button
                                type="button"
                                className="stepper-btn stepper-btn-back"
                                onClick={() => handleStepBack(index)}
                                disabled={step === 0}
                              >
                                ← Sebelumnya
                              </button>

                              {isLastStep && allAnswered ? (
                                <button
                                  type="button"
                                  className="stepper-btn stepper-btn-submit"
                                  onClick={() => handleSubmitAllAnswers(index, message.questions)}
                                  disabled={loading}
                                >
                                  📨 Kirim Semua Jawaban
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="stepper-btn stepper-btn-next"
                                  onClick={() => handleStepNext(index, total)}
                                  disabled={!currentFilled}
                                >
                                  Selanjutnya →
                                </button>
                              )}
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
                            <strong>Persetujuan Sebelum Eksekusi:</strong>
                          </div>
                          <p className="confirmation-body-text">{message.confirmation_prompt}</p>
                          <div className="confirmation-action-buttons">
                            <button
                              type="button"
                              className="confirm-btn confirm-btn-agree"
                              onClick={() => handleQuickAction('Setuju, rencana sudah sesuai. Silakan lanjutkan.')}
                            >
                              <IconCheck />
                              <span>Setuju & Lanjutkan</span>
                            </button>
                            <button
                              type="button"
                              className="confirm-btn confirm-btn-revise"
                              onClick={() => handleQuickAction('Saya ingin merevisi rencana ini: ')}
                            >
                              <IconEdit />
                              <span>Beri Catatan Revisi</span>
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
                <span>{mode === 'leader' ? 'Arif sedang mengoordinasikan tim...' : mode === 'orchestrator' ? 'Agen sedang bekerja dan berdiskusi...' : 'OpenCode sedang memproses...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="chat-form">
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
                  ? 'Instruksikan Arif (contoh: "Tugaskan Sinta untuk membuat campaign peluncuran")...'
                  : mode === 'orchestrator'
                  ? 'Berikan perintah untuk tim (contoh: "Buatkan rencana peluncuran produk lengkap")...'
                  : 'Ketik pesan untuk OpenCode...'
              }
              aria-describedby="chat-help"
              rows="2"
              disabled={loading}
            />
            <button
              type="submit"
              className="chat-send-btn"
              aria-label="Kirim instruksi"
              disabled={!inputValue.trim() || loading}
            >
              <IconSend />
              <span>{loading ? 'Mengirim...' : 'Kirim'}</span>
            </button>
          </div>
          <div className="chat-form-footer">
            <small id="chat-help" className="chat-help">
              <kbd>Enter</kbd> untuk kirim <span aria-hidden="true">•</span> <kbd>Shift+Enter</kbd> untuk baris baru
            </small>
            <span className="chat-mode-status-tag">
              {mode === 'leader' ? 'Arif (Project Lead)' : mode === 'orchestrator' ? 'Multi-Agent MCP' : 'OpenCode Chat'}
            </span>
          </div>

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
