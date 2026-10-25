import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import fs from 'fs';
import { orchestrate, clearSession } from './agents/orchestrator.js';
import mcpServer from './mcp/server.js';
import { getAllAgents } from './agents/definitions.js';
import {
  loadChatStore,
  saveChatMessage,
  saveChatMessageSafe,
  updateChatMessage,
  updateChatMessageSafe,
  getChatHistory,
  clearChatHistory,
  clearChatHistorySafe,
  setChatSessionId,
  getChatThreads,
  getChatThread,
  createChatThread,
  setActiveChatThread,
  deleteChatThread,
  updateChatThread,
  getKanbanTasks,
  loadKanbanStore,
  getKanbanProjects,
  createKanbanProject,
  deleteKanbanProject,
  approvePlan,
  approvePlanSafe,
  updateKanbanTaskSafe,
  deleteKanbanTaskSafe,
  createKanbanTaskSafe,
  STORAGE_LIMITS
} from './storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __rootdir = path.resolve(__dirname, '..');
const app = express();

// Find opencode executable path
let OPENCODE_BIN = 'opencode';
try {
  // Try to find opencode in PATH using the shell (cross-platform)
  let result = execSync(process.platform === 'win32' ? 'where opencode' : 'which opencode', {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore']
  }).trim();
  if (result) {
    // Clean up line endings and take first result
    result = result.split(/[\r\n]+/)[0];
    // On Windows, prefer .cmd over plain executable for Node spawn
    if (process.platform === 'win32' && !result.endsWith('.cmd')) {
      result = result + '.cmd';
    }
    OPENCODE_BIN = result;
    console.log(`Found OpenCode at: ${OPENCODE_BIN}`);
  }
} catch (e) {
  console.warn('Warning: Could not locate opencode executable, will try using PATH lookup');
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__rootdir, 'dist')));

// Store active session IDs and model across requests (isolated per mode, restored from storage)
const initialChatStore = loadChatStore();
let currentChatSessionId = initialChatStore.chat?.sessionId || null;
let currentLeaderSessionId = initialChatStore.leader?.sessionId || null;
let currentOrchestratorSessionId = initialChatStore.orchestrator?.sessionId || null;
let currentModel = null;

export function resetSessions(mode = null) {
  if (mode === 'leader') {
    currentLeaderSessionId = null;
  } else if (mode === 'chat') {
    currentChatSessionId = null;
  } else if (mode === 'orchestrator') {
    currentOrchestratorSessionId = null;
  } else {
    currentChatSessionId = null;
    currentLeaderSessionId = null;
    currentOrchestratorSessionId = null;
  }
}

const TEAM_FILE = path.join(__rootdir, 'data', 'team.json');

const DEFAULT_TEAM_MEMBERS = [
  { id: 'arif', name: 'Arif', role: 'Project Lead / Coordinator', description: 'Memimpin koordinasi sprint, requirement elicitation, dan breakdown tugas', active: true, model: null, shirtColor: '#4a5fc1', hairColor: '#2a2236', skinColor: '#f2c9a0', pantsColor: '#2f3558', isDefault: true },
  { id: 'rina', name: 'Rina', role: 'Finance / Accountant', description: 'Menghitung estimasi budget, invoice, dan laporan keuangan', active: true, model: null, shirtColor: '#2fa7a0', hairColor: '#3a2a24', skinColor: '#f2c9a0', pantsColor: '#3b4468', isDefault: true },
  { id: 'dimas', name: 'Dimas', role: 'UI/UX Designer', description: 'Membuat wireframe, desain antarmuka, mockup, dan aset visual', active: true, model: null, shirtColor: '#8a63d2', hairColor: '#1f1b2e', skinColor: '#d9a273', pantsColor: '#3b4468', isDefault: true },
  { id: 'bayu', name: 'Bayu', role: 'Product / Frontend Engineer', description: 'Implementasi antarmuka, user flow, dan integrasi fitur aplikasi', active: true, model: null, shirtColor: '#f26a5b', hairColor: '#2a2236', skinColor: '#d9a273', pantsColor: '#3b4468', isDefault: true },
  { id: 'sinta', name: 'Sinta', role: 'Marketing / Growth', description: 'Menyusun strategi campaign promosi, copy pemasaran, dan go-to-market', active: true, model: null, shirtColor: '#8a63d2', hairColor: '#5a3425', skinColor: '#f2c9a0', pantsColor: '#2f3558', isDefault: true },
  { id: 'mira', name: 'Mira', role: 'Sales / Client Relations', description: 'Komunikasi kebutuhan klien, pitching, dan relationship management', active: true, model: null, shirtColor: '#f2b84b', hairColor: '#4a2c2a', skinColor: '#f2c9a0', pantsColor: '#3b4468', isDefault: true },
  { id: 'eko', name: 'Eko', role: 'Operations / Admin Support', description: 'Manajemen operasional, kelengkapan administrasi, dan alur dokumen', active: true, model: null, shirtColor: '#2f9a92', hairColor: '#2a2236', skinColor: '#c68f64', pantsColor: '#3b4468', isDefault: true },
];

export function loadTeamMembersFromDisk() {
  try {
    if (fs.existsSync(TEAM_FILE)) {
      const content = fs.readFileSync(TEAM_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading data/team.json:', err.message);
  }
  return [...DEFAULT_TEAM_MEMBERS];
}

export function saveTeamMembersToDisk(members) {
  try {
    fs.mkdirSync(path.dirname(TEAM_FILE), { recursive: true });
    fs.writeFileSync(TEAM_FILE, JSON.stringify(members, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing data/team.json:', err.message);
  }
}

/**
 * Team members available in the virtual office (mutable reference)
 */
export const TEAM_MEMBERS = loadTeamMembersFromDisk();

/**
 * Dynamically builds system instruction prompt for Leader Mode (Arif - Project Lead)
 * reflecting active team members and their roles.
 */
export function buildLeaderSystemPrompt(customMembers = null) {
  if (!customMembers) {
    try {
      const disk = loadTeamMembersFromDisk();
      if (Array.isArray(disk) && disk.length > 0) {
        TEAM_MEMBERS.splice(0, TEAM_MEMBERS.length, ...disk);
      }
    } catch (_) {}
  }
  const members = customMembers || TEAM_MEMBERS.filter(m => m.active !== false);
  const rosterListing = members.map(m => `- ${m.name} (${m.role}): ${m.description || ''}`).join('\n');
  const allowedNames = members.map(m => m.name).join('/');
  const arifMember = members.find(m => m.id === 'arif');
  const customArifPrompt = arifMember?.systemPrompt ? `${arifMember.systemPrompt}\n\n---\n\n` : '';

  return `${customArifPrompt}Anda adalah Arif, Project Lead di Pixel Works Virtual Office.
Tugas utama Anda adalah menjadi Koordinator Tim yang bertanggung jawab, teliti, realistis, dan anti-halusinasi.
Selalu bertindak dan menjawab sebagai Arif (Project Lead), BUKAN sebagai OpenCode, model AI umum, atau asisten generik.

ATURAN UTAMA:
1. JANGAN PERNAH MENGARANG ATAU MENGASUMSIKAN DETAIL yang belum diberikan oleh user.
2. JANGAN PERNAH MENGEKSEKUSI TUGAS ATAU MEMANGGIL AGENT LAIN SECARA OTOMATIS.
3. JANGAN PERNAH MENGKLAIM BAHWA TUGAS SUDAH DIJALANKAN ATAU SELESAI DIEKSEKUSI.
4. JANGAN PERNAH MENOLAK IDENTITAS ANDA SEBAGAI ARIF. Dilarang merespons dengan kata-kata seperti "Saya opencode, bukan Arif". Anda adalah Arif.
5. PENGENALAN ROSTER TIM:
   - Kenali seluruh anggota tim yang ada di daftar ANGGOTA TIM YANG TERSEDIA di bawah.
   - Sinta adalah anggota tim yang bertanggung jawab atas Marketing / Growth (campaign promosi, go-to-market, copywriting).
   - Dimas adalah UI/UX Designer, Bayu adalah Frontend Engineer, Rina adalah Finance, Mira adalah Sales, Eko adalah Ops/Admin.
   - Jika user meminta menugaskan Sinta (contoh: "Arif, tugaskan Sinta untuk membuat campaign login"), akuilah Sinta sebagai anggota tim yang valid.
   - Hanya delegasikan tugas kepada anggota yang berstatus AKTIF di daftar di bawah.
6. ALUR KOORDINASI:
   - Jika user mengajukan ide, project, atau permintaan/penugasan:
     - Evaluasi apakah informasi project sudah lengkap (Tujuan/Goal, Scope/Ruang Lingkup, Deliverables/Output, Batasan/Tech Stack/Deadline).
     - JIKA BELUM CUKUP LENGKAP: Masuk fase "clarifying". Tanyakan poin-poin yang belum jelas secara spesifik (tujuan, batasan, target output, dsb). JANGAN membuat rencana final dulu.
     - JIKA SUDAH CUKUP LENGKAP: Masuk fase "planned" atau "awaiting_confirmation". Buat rencana kerja terstruktur dan pecah menjadi tugas-tugas spesifik untuk anggota tim yang relevan (${allowedNames}). Minta konfirmasi eksplisit dari user sebelum ada langkah eksekusi apapun.

ANGGOTA TIM YANG TERSEDIA:
${rosterListing}

FORMAT OUTPUT HARUS JSON VALID DALAM BLOK KODE \`\`\`json ... \`\`\` ATAU RAW JSON DENGAN STRUKTUR:
{
  "phase": "clarifying" | "planned" | "awaiting_confirmation",
  "summary": "Ringkasan status koordinasi dari Arif dalam 1-3 kalimat ramah profesional",
  "questions": [
    "Pertanyaan klarifikasi 1 (jika fase clarifying)"
  ],
  "plan": {
    "title": "Nama rencana project (jika fase planned/awaiting_confirmation)",
    "goal": "Tujuan project",
    "scope": "Ruang lingkup yang disepakati",
    "tasks": [
      {
        "id": "TASK-1",
        "title": "Judul tugas",
        "assignee": "Nama anggota tim (${allowedNames})",
        "role": "Peran anggota",
        "description": "Deskripsi tugas spesifik",
        "status": "pending"
      }
    ]
  },
  "confirmation_prompt": "Pertanyaan konfirmasi eksplisit ke user sebelum eksekusi (wajib jika planned/awaiting_confirmation)"
}

Catatan:
- Jika fase adalah "clarifying", "questions" wajib berisi daftar pertanyaan, "plan" boleh null atau draft parsial, dan "confirmation_prompt" null.
- Jika fase adalah "planned" atau "awaiting_confirmation", "questions" kosong [], "plan.tasks" wajib terstruktur, dan "confirmation_prompt" wajib meminta persetujuan user. Status setiap task wajib "pending", tidak boleh "done" atau "in_progress".`;
}

/**
 * Static system instruction prompt for Leader Mode (Arif - Project Lead) for test contracts
 */
export const LEADER_SYSTEM_PROMPT = buildLeaderSystemPrompt(DEFAULT_TEAM_MEMBERS);

/**
 * Extracts and parses structured JSON from model reply
 * @param {string} rawText 
 * @returns {object|null}
 */
export function extractStructuredJson(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  // 1. Try markdown code block ```json ... ```
  const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (_) {}
  }

  // 2. Try raw JSON substring { ... }
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = rawText.slice(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (_) {}
  }

  return null;
}

/**
 * Normalizes and validates leader structured response
 * @param {object|null} parsed 
 * @param {string} rawReply 
 * @returns {{ phase: string, summary: string, questions: string[], plan: object|null, confirmation_prompt: string|null, valid: boolean }}
 */
export function normalizeLeaderResponse(parsed, rawReply) {
  if (!parsed || typeof parsed !== 'object') {
    // Fallback when LLM failed to return structured JSON
    let fallbackSummary = (rawReply || '').trim();
    if (!fallbackSummary || fallbackSummary.toLowerCase().includes('opencode')) {
      fallbackSummary = 'Sebagai Arif (Project Lead), saya menerima arahan Anda. Mari kita diskusikan dan klarifikasi kebutuhan project ini bersama tim.';
    }

    return {
      phase: 'clarifying',
      summary: fallbackSummary,
      questions: [
        'Bisakah Anda menjelaskan tujuan utama dan hasil akhir yang diharapkan dari project ini?',
        'Siapa target pengguna dan apa saja batasan (waktu/teknologi) yang perlu diperhatikan?'
      ],
      plan: null,
      confirmation_prompt: null,
      valid: false
    };
  }

  let phase = parsed.phase;
  if (!['clarifying', 'planned', 'awaiting_confirmation'].includes(phase)) {
    if (parsed.plan && Array.isArray(parsed.plan.tasks) && parsed.plan.tasks.length > 0) {
      phase = 'awaiting_confirmation';
    } else if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      phase = 'clarifying';
    } else {
      phase = 'clarifying';
    }
  }

  const summary = typeof parsed.summary === 'string' && parsed.summary.trim()
    ? parsed.summary.trim()
    : (rawReply || 'Koordinasi rencana project bersama Arif.');

  const questions = Array.isArray(parsed.questions)
    ? parsed.questions.filter(q => typeof q === 'string' && q.trim()).map(q => q.trim())
    : [];

  let plan = null;
  if (parsed.plan && typeof parsed.plan === 'object') {
    const rawTasks = Array.isArray(parsed.plan.tasks) ? parsed.plan.tasks : [];
    const tasks = rawTasks.map((t, idx) => {
      const rawAssignee = (t.assignee || '').trim();
      const matchedMember = TEAM_MEMBERS.find(
        m => m.name.toLowerCase() === rawAssignee.toLowerCase() ||
             m.id.toLowerCase() === rawAssignee.toLowerCase()
      );
      return {
        id: t.id || `TASK-${idx + 1}`,
        title: t.title || `Tugas ${idx + 1}`,
        assignee: matchedMember ? matchedMember.name : (rawAssignee || 'Arif'),
        role: matchedMember ? matchedMember.role : (t.role || 'Team Member'),
        description: t.description || '',
        status: 'pending' // Enforce pending - MVP never auto-executes
      };
    });

    plan = {
      id: parsed.plan.id || `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: parsed.plan.title || 'Rencana Proyek',
      goal: parsed.plan.goal || '',
      scope: parsed.plan.scope || '',
      tasks
    };
  }

  // Ensure no fake execution status and enforce confirmation when planned
  let confirmationPrompt = typeof parsed.confirmation_prompt === 'string' && parsed.confirmation_prompt.trim()
    ? parsed.confirmation_prompt.trim()
    : null;

  if ((phase === 'planned' || phase === 'awaiting_confirmation') && !confirmationPrompt) {
    phase = 'awaiting_confirmation';
    confirmationPrompt = 'Apakah rencana di atas sudah sesuai? Balas "setuju" atau berikan catatan revisi sebelum tim mulai bekerja.';
  }

  // If in clarifying phase, ensure there are questions and no premature confirmation
  if (phase === 'clarifying') {
    confirmationPrompt = null;
    if (questions.length === 0) {
      questions.push('Apa tujuan utama, ruang lingkup, dan batasan project ini?');
    }
  }

  return {
    phase,
    summary,
    questions,
    plan,
    confirmation_prompt: confirmationPrompt,
    valid: true
  };
}

// Cache for available models (refresh every 5 minutes)
let modelsCache = null;
let modelsCacheTime = 0;
const MODELS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get available models from opencode CLI
 * Caches result for 5 minutes to avoid repeated shell calls
 */
function getAvailableModels() {
  const now = Date.now();
  
  // Return cached models if still valid
  if (modelsCache && (now - modelsCacheTime) < MODELS_CACHE_TTL) {
    return modelsCache;
  }
  
  // Check for env override first
  const envModels = process.env.OPENCODE_MODELS;
  if (envModels) {
    const models = envModels.split(',').map(m => m.trim()).filter(m => m);
    modelsCache = models;
    modelsCacheTime = now;
    return models;
  }
  
  try {
    // Execute opencode models command
    const output = execSync(`${OPENCODE_BIN} models`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 10000 // 10 second timeout
    });
    
    // Parse output - each line is already in provider/model format
    const models = output
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.includes('/')) // Filter valid provider/model lines
      .filter(line => !line.match(/^\d+\s+files\s+in/)); // Skip summary lines
    
    if (models.length > 0) {
      console.log(`Loaded ${models.length} models from opencode CLI`);
      modelsCache = models;
      modelsCacheTime = now;
      return models;
    }
  } catch (error) {
    console.error('ERROR: Failed to fetch models from opencode CLI:', error.message);
    console.error('Stack:', error.stack);
  }
  
  // No fallback - return empty array if command fails so error is visible
  console.error('WARNING: Returning empty models array');
  return [];
}

/**
 * GET /api/models
 * Returns available models for selection
 * Returns: { models: string[], defaultModel: string|null, currentModel: string|null }
 */
app.get('/api/models', (req, res) => {
  const availableModels = getAvailableModels();
  res.json({
    models: availableModels,
    defaultModel: availableModels[0] || null,
    currentModel: currentModel || availableModels[0] || null
  });
});

/**
 * POST /api/chat
 * Accepts: { 
 *   message: string, 
 *   sessionId?: string, 
 *   model?: string, 
 *   mode?: 'chat' | 'leader', 
 *   leader?: boolean 
 * }
 * Returns: { 
 *   reply: string, 
 *   sessionId: string, 
 *   model: string, 
 *   mode: 'chat' | 'leader', 
 *   phase: 'chat' | 'clarifying' | 'planned' | 'awaiting_confirmation',
 *   questions?: string[],
 *   plan?: { title: string, goal: string, scope: string, tasks: Array<{ id: string, title: string, assignee: string, role: string, description: string, status: 'pending' }> } | null,
 *   confirmation_prompt?: string | null,
 *   valid?: boolean
 * } or { error: string, details: string }
 */
app.post('/api/chat', async (req, res) => {
  const { message, sessionId, model, mode, leader, threadId } = req.body;

  // Validate input
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      error: 'Invalid request',
      details: 'message must be a non-empty string'
    });
  }

  const trimmedMessage = message.trim();

  // Determine mode: explicitly 'leader' or leader === true; otherwise 'chat'
  const isLeaderMode = mode === 'leader' || leader === true;
  const effectiveMode = isLeaderMode ? 'leader' : 'chat';
  
  // Validate and sanitize model selection
  // Validate only the model from the request body, not currentModel (already validated when set)
  if (model) {
    if (!/^[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_.@-]+)+$/.test(model)) {
      return res.status(400).json({
        error: 'Invalid model',
        details: 'model must be in format provider/model'
      });
    }
  }
  let selectedModel = model || currentModel;
  
  // If in leader mode and arif has an assigned model, prefer it unless user explicitly chose a model
  if (isLeaderMode && !model) {
    const arifMember = TEAM_MEMBERS.find(m => m.id === 'arif');
    if (arifMember && arifMember.model) {
      selectedModel = arifMember.model;
    }
  }

  // When model changes, reset session to avoid incompatibility
  let nextSessionId = sessionId;
  if (selectedModel && selectedModel !== currentModel) {
    console.log(`Model changed from ${currentModel} to ${selectedModel}, resetting session`);
    nextSessionId = null;
    currentChatSessionId = null;
    currentLeaderSessionId = null;
    currentOrchestratorSessionId = null;
    setChatSessionId('chat', null);
    setChatSessionId('leader', null);
    setChatSessionId('orchestrator', null);
    currentModel = selectedModel;
  } else {
    // Isolate sessions by mode and honor explicit null for fresh session
    if (sessionId !== undefined && sessionId !== null) {
      nextSessionId = sessionId;
    } else if (sessionId === null) {
      nextSessionId = null;
    } else {
      nextSessionId = isLeaderMode ? currentLeaderSessionId : currentChatSessionId;
    }
  }

  // Persist incoming user message to durable chat storage
  await saveChatMessageSafe(effectiveMode, {
    type: 'user',
    mode: effectiveMode,
    text: trimmedMessage
  }, nextSessionId || undefined, threadId || null);

  // Check if user is approving an existing pending plan in leader mode
  if (isLeaderMode) {
    const isAgreement = /^(setuju|oke\s+setuju|ok\s+setuju|setuju\s+lanjutkan|setuju\s+rencana|deal|sepakat|approve|lanjutkan|yes\s+setuju|lanjut\s+eksekusi)[\s.!,]*$/i.test(trimmedMessage);
    if (isAgreement) {
      const chatStore = loadChatStore();
      const targetThread = threadId ? chatStore.leader?.threads?.find(t => t.id === threadId) : null;
      const leaderMsgs = targetThread?.messages?.length ? targetThread.messages : (chatStore.leader?.messages || []);
      const pendingPlanMsg = [...leaderMsgs].reverse().find(
        m => m.type === 'assistant' && m.plan && (!m.approval || m.approval.status !== 'approved')
      );

      if (pendingPlanMsg && pendingPlanMsg.plan) {
        try {
          const approvalResult = await approvePlanSafe({
            plan: pendingPlanMsg.plan,
            planId: pendingPlanMsg.plan.id,
            idempotencyKey: pendingPlanMsg.plan.id,
            teamMembers: TEAM_MEMBERS
          });

          const approvalRecord = {
            status: 'approved',
            alreadyApproved: approvalResult.alreadyApproved,
            approvedAt: new Date().toISOString(),
            planId: approvalResult.planId,
            count: approvalResult.count,
            taskIds: approvalResult.tasks.map(t => t.id)
          };

          if (pendingPlanMsg.id) {
            await updateChatMessageSafe('leader', pendingPlanMsg.id, {
              approval: approvalRecord
            });
          }

          const replyText = `Terima kasih, konfirmasi sudah saya terima! Rencana "${pendingPlanMsg.plan.title || 'Proyek'}" telah disetujui dan ${approvalResult.count} tugas resmi dimasukkan ke Papan Kanban (Backlog/Pending). Anggota tim yang ditugaskan dapat langsung mulai mengerjakannya.`;

          const savedAssistantMsg = await saveChatMessageSafe('leader', {
            type: 'assistant',
            mode: 'leader',
            text: replyText,
            reply: replyText,
            phase: 'approved',
            plan: pendingPlanMsg.plan,
            approval: approvalRecord,
            confirmation_prompt: null,
            valid: true,
            kanbanCreated: true,
            tasks: approvalResult.tasks,
            model: selectedModel || currentModel || null
          }, nextSessionId || null, threadId || null);

          return res.json({
            id: savedAssistantMsg.id,
            reply: replyText,
            sessionId: nextSessionId || null,
            model: selectedModel || currentModel || null,
            mode: 'leader',
            phase: 'approved',
            plan: pendingPlanMsg.plan,
            approval: approvalRecord,
            tasks: approvalResult.tasks,
            kanbanCreated: true,
            valid: true,
            roster: TEAM_MEMBERS
          });
        } catch (approvalErr) {
          console.error('Auto-approval error on setuju:', approvalErr);
        }
      }
    }
  }

  try {
    // Build opencode command with JSON format for structured output
    const args = ['run', '--format', 'json'];
    
    // Add model if specified
    if (selectedModel) {
      args.push('--model', selectedModel);
    }
    
    if (nextSessionId) {
      args.push('--session', nextSessionId);
    }
    
    // Compose final prompt: inject leader system instructions if in leader mode
    let promptToSend = trimmedMessage;
    if (isLeaderMode) {
      // Sanitize user message against delimiter injection and enclose with delimiter tags
      const sanitizedUserMessage = trimmedMessage
        .replace(/\[\/?(?:SYSTEM INSTRUCTION|USER REQUEST|INSTRUCTION)\]/gi, '[REDACTED]');

      const dynamicLeaderPrompt = buildLeaderSystemPrompt();
      promptToSend = `[SYSTEM INSTRUCTION]\n${dynamicLeaderPrompt}\n[/SYSTEM INSTRUCTION]\n\n[USER REQUEST]\n${sanitizedUserMessage}\n[/USER REQUEST]`;
    }

    // Add '-' so opencode reads prompt from stdin
    args.push('-');

    // Execute opencode run — prompt sent via stdin, not as CLI arg
    const result = await executeOpencode(args, promptToSend);

    // Update session and model tracking
    if (result.sessionId) {
      nextSessionId = result.sessionId;
      if (isLeaderMode) {
        currentLeaderSessionId = result.sessionId;
        setChatSessionId('leader', result.sessionId);
      } else {
        currentChatSessionId = result.sessionId;
        setChatSessionId('chat', result.sessionId);
      }
    }
    
    if (!currentModel && selectedModel) {
      currentModel = selectedModel;
    }

    const rawOutput = result.output || '';

    if (!isLeaderMode) {
      // Standard chat response - 100% backward-compatible with legacy clients
      const savedChatMsg = await saveChatMessageSafe('chat', {
        type: 'assistant',
        mode: 'chat',
        text: rawOutput,
        reply: rawOutput,
        phase: 'chat',
        model: selectedModel || currentModel || null
      }, nextSessionId || null, threadId || null);

      return res.json({
        id: savedChatMsg.id,
        reply: rawOutput,
        sessionId: nextSessionId || null,
        model: selectedModel || currentModel || null,
        mode: 'chat',
        phase: 'chat'
      });
    }

    // Leader Mode: parse structured response with graceful fallback
    const parsedStructured = extractStructuredJson(rawOutput);
    const normalized = normalizeLeaderResponse(parsedStructured, rawOutput);

    if (normalized.plan && !normalized.plan.id) {
      normalized.plan.id = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }

    const savedLeaderMsg = await saveChatMessageSafe('leader', {
      type: 'assistant',
      mode: 'leader',
      text: normalized.summary,
      reply: normalized.summary,
      phase: normalized.phase,
      questions: normalized.questions,
      plan: normalized.plan,
      confirmation_prompt: normalized.confirmation_prompt,
      valid: normalized.valid,
      model: selectedModel || currentModel || null
    }, nextSessionId || null, threadId || null);

    const leaderResponse = {
      id: savedLeaderMsg.id,
      reply: normalized.summary,
      sessionId: nextSessionId || null,
      model: selectedModel || currentModel || null,
      mode: 'leader',
      phase: normalized.phase,
      questions: normalized.questions,
      plan: normalized.plan,
      confirmation_prompt: normalized.confirmation_prompt,
      valid: normalized.valid,
      roster: TEAM_MEMBERS
    };

    // Only expose raw output for debugging in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      leaderResponse.raw_reply = rawOutput;
    }

    return res.json(leaderResponse);
  } catch (error) {
    console.error('OpenCode execution error:', error);
    res.status(503).json({
      error: 'OpenCode service unavailable',
      details: error.message
    });
  }
});

/**
 * Execute opencode run command and capture output.
 * Prompt is written to stdin to avoid Windows 8191-char CLI arg length limit.
 * @param {string[]} args - Arguments excluding the prompt
 * @param {string} prompt - The prompt text, sent via stdin
 * @returns {Promise<{output: string, sessionId: string|null}>}
 */
function executeOpencode(args, prompt) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let sessionId = null;
    let textContent = [];

    // stdin: 'pipe' so we write the prompt without CLI arg length limits
    const child = spawn(OPENCODE_BIN, args, {
      cwd: __rootdir,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    // Send prompt via stdin and close so opencode knows input is done
    child.stdin.write(prompt, 'utf8');
    child.stdin.end();

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Timeout after 60 seconds
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('OpenCode request timeout (60s)'));
    }, 60000);

    child.on('close', (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        reject(new Error(`OpenCode failed with code ${code}: ${stderr}`));
      } else {
        if (!stdout.trim()) {
          reject(new Error('OpenCode returned empty response'));
          return;
        }

        // Parse JSON lines from stdout
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            
            // Extract session ID from first event
            if (!sessionId && event.sessionID) {
              sessionId = event.sessionID;
            }
            
            // Extract text content
            if (event.type === 'text' && event.part && event.part.text) {
              textContent.push(event.part.text);
            }
          } catch (e) {
            // Skip non-JSON lines (shouldn't happen with --format json)
            console.debug('Failed to parse JSON line:', line);
          }
        }

        const output = textContent.join('\n') || 'No text response from OpenCode';
        resolve({
          output,
          sessionId
        });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to start OpenCode: ${err.message}`));
    });
  });
}

/**
 * POST /api/orchestrate
 * Multi-agent orchestration endpoint — Arif delegates to agents, they discuss, compile results.
 * Accepts: { message: string, sessionId?: string, model?: string }
 * Returns: { phase, summary, delegations, agentResults, discussions, plan, questions, ... }
 */
app.post('/api/orchestrate', async (req, res) => {
  const { message, sessionId, model } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      error: 'Invalid request',
      details: 'message must be a non-empty string'
    });
  }

  const selectedModel = model || currentModel;

  // Persist user message to orchestrator history
  await saveChatMessageSafe('orchestrator', {
    type: 'user',
    mode: 'orchestrator',
    text: message.trim()
  }, sessionId || currentOrchestratorSessionId);

  try {
    console.log('\n🚀 Orchestration started...');
    const result = await orchestrate(OPENCODE_BIN, selectedModel, message.trim(), sessionId);

    if (result.sessionId) {
      currentOrchestratorSessionId = result.sessionId;
      setChatSessionId('orchestrator', result.sessionId);
    }

    if (result.plan && !result.plan.id) {
      result.plan.id = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }

    // Persist assistant response to orchestrator history
    const savedOrchMsg = await saveChatMessageSafe('orchestrator', {
      type: 'assistant',
      mode: 'orchestrator',
      text: result.summary,
      reply: result.summary,
      phase: result.phase,
      questions: result.questions || [],
      plan: result.plan || null,
      confirmation_prompt: result.confirmation_prompt || null,
      delegations: result.delegations || [],
      agentResults: result.agentResults || [],
      discussions: result.discussions || [],
      next_steps: result.next_steps || [],
      model: selectedModel || null
    }, result.sessionId || sessionId || currentOrchestratorSessionId);

    return res.json({
      ...result,
      id: savedOrchMsg.id,
      reply: result.summary,
      model: selectedModel || null,
      mode: 'orchestrator',
      roster: TEAM_MEMBERS
    });
  } catch (error) {
    console.error('Orchestration error:', error);
    res.status(503).json({
      error: 'Orchestration failed',
      details: error.message
    });
  }
});

/**
 * GET /api/chat/history
 * Query: ?mode=leader|chat|orchestrator
 * Returns durable chat messages and session IDs isolated per mode
 */
app.get('/api/chat/history', (req, res) => {
  const { mode } = req.query;
  if (mode) {
    if (!['leader', 'chat', 'orchestrator'].includes(mode)) {
      return res.status(400).json({
        error: 'Invalid mode',
        details: 'mode must be one of: leader, chat, orchestrator'
      });
    }
    const history = getChatHistory(mode);
    return res.json(history);
  }
  const allHistory = getChatHistory();
  return res.json({ history: allHistory });
});

/**
 * POST /api/chat/reset
 * Body or Query: { mode?: 'leader' | 'chat' | 'orchestrator' | 'all' }
 * Resets durable session and history for a given mode or all modes
 */
app.post('/api/chat/reset', async (req, res) => {
  const mode = req.body?.mode || req.query?.mode || 'all';
  if (mode !== 'all' && !['leader', 'chat', 'orchestrator'].includes(mode)) {
    return res.status(400).json({
      error: 'Invalid mode',
      details: 'mode must be one of: leader, chat, orchestrator, all'
    });
  }

  const targetMode = mode === 'all' ? null : mode;
  await clearChatHistorySafe(targetMode);
  resetSessions(targetMode);

  res.json({ success: true, mode });
});

/**
 * DELETE /api/chat/history
 * Alias for resetting chat history
 */
app.delete('/api/chat/history', async (req, res) => {
  const mode = req.query?.mode || 'all';
  if (mode !== 'all' && !['leader', 'chat', 'orchestrator'].includes(mode)) {
    return res.status(400).json({
      error: 'Invalid mode',
      details: 'mode must be one of: leader, chat, orchestrator, all'
    });
  }

  const targetMode = mode === 'all' ? null : mode;
  await clearChatHistorySafe(targetMode);
  resetSessions(targetMode);

  res.json({ success: true, mode });
});

/**
 * Handler for plan approval into Kanban
 */
async function handleApprovePlan(req, res) {
  const { plan, planId, idempotencyKey, messageId, mode } = req.body || {};

  if (!plan || typeof plan !== 'object') {
    return res.status(400).json({
      error: 'Invalid request',
      details: 'plan must be a valid object'
    });
  }

  if (typeof plan.title !== 'string' || !plan.title.trim()) {
    return res.status(400).json({
      error: 'Invalid request',
      details: 'plan.title is required and cannot be empty'
    });
  }

  if (plan.title.trim().length > STORAGE_LIMITS.MAX_PLAN_TITLE_LENGTH) {
    return res.status(400).json({
      error: 'Invalid request',
      details: `plan.title exceeds maximum length of ${STORAGE_LIMITS.MAX_PLAN_TITLE_LENGTH} characters`
    });
  }

  if (!Array.isArray(plan.tasks) || plan.tasks.length === 0) {
    return res.status(400).json({
      error: 'Invalid request',
      details: 'plan.tasks must be a non-empty array'
    });
  }

  if (plan.tasks.length > STORAGE_LIMITS.MAX_TASKS_PER_PLAN) {
    return res.status(400).json({
      error: 'Invalid request',
      details: `plan.tasks exceeds maximum allowed tasks (${STORAGE_LIMITS.MAX_TASKS_PER_PLAN})`
    });
  }

  for (let i = 0; i < plan.tasks.length; i++) {
    const t = plan.tasks[i];
    if (!t || typeof t !== 'object' || !t.title || typeof t.title !== 'string' || !t.title.trim()) {
      return res.status(400).json({
        error: 'Invalid request',
        details: `Task at index ${i} is missing a valid title`
      });
    }
    if (t.title.trim().length > STORAGE_LIMITS.MAX_TASK_TITLE_LENGTH) {
      return res.status(400).json({
        error: 'Invalid request',
        details: `Task at index ${i} title exceeds maximum length of ${STORAGE_LIMITS.MAX_TASK_TITLE_LENGTH} characters`
      });
    }
    if (t.description && typeof t.description === 'string' && t.description.length > STORAGE_LIMITS.MAX_TASK_DESCRIPTION_LENGTH) {
      return res.status(400).json({
        error: 'Invalid request',
        details: `Task at index ${i} description exceeds maximum length of ${STORAGE_LIMITS.MAX_TASK_DESCRIPTION_LENGTH} characters`
      });
    }
  }

  try {
    const result = await approvePlanSafe({
      plan,
      planId,
      idempotencyKey,
      teamMembers: TEAM_MEMBERS
    });

    if (messageId) {
      const targetMode = mode && ['leader', 'orchestrator'].includes(mode) ? mode : 'leader';
      await updateChatMessageSafe(targetMode, messageId, {
        approval: {
          status: 'approved',
          alreadyApproved: result.alreadyApproved,
          approvedAt: new Date().toISOString(),
          planId: result.planId,
          count: result.count,
          taskIds: result.tasks.map(t => t.id)
        }
      });
    }

    return res.status(result.alreadyApproved ? 200 : 201).json(result);
  } catch (err) {
    console.error('Plan approval error:', err);
    return res.status(500).json({
      error: 'Plan approval failed',
      details: err.message
    });
  }
}

app.post('/api/chat/approve-plan', handleApprovePlan);
app.post('/api/kanban/approve-plan', handleApprovePlan);

/**
 * GET /api/kanban/tasks
 * Returns Kanban tasks (optionally filtered by projectId), columns, approved plans, and projects
 */
app.get('/api/kanban/tasks', (req, res) => {
  const { projectId, planId } = req.query;
  const targetProject = projectId || planId || null;
  const store = loadKanbanStore();
  const tasks = targetProject && targetProject !== 'all'
    ? store.tasks.filter(t => t.planId === targetProject || t.projectId === targetProject)
    : store.tasks;
  res.json({
    tasks,
    columns: store.columns,
    approvedPlans: store.approvedPlans,
    projects: getKanbanProjects()
  });
});

/**
 * PATCH /api/kanban/tasks/:id
 * Update task status, column, assignee, or details
 */
app.patch('/api/kanban/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await updateKanbanTaskSafe(id, req.body);
    res.json({ success: true, task: updated });
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 400).json({
      error: 'Failed to update task',
      details: err.message
    });
  }
});

app.put('/api/kanban/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await updateKanbanTaskSafe(id, req.body);
    res.json({ success: true, task: updated });
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 400).json({
      error: 'Failed to update task',
      details: err.message
    });
  }
});

/**
 * DELETE /api/kanban/tasks/:id
 * Remove task from Kanban
 */
app.delete('/api/kanban/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await deleteKanbanTaskSafe(id);
    res.json({ success: true, task: deleted });
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 400).json({
      error: 'Failed to delete task',
      details: err.message
    });
  }
});

/**
 * POST /api/kanban/tasks
 * Create manual task in Kanban
 */
app.post('/api/kanban/tasks', async (req, res) => {
  try {
    const created = await createKanbanTaskSafe(req.body);
    res.status(201).json({ success: true, task: created });
  } catch (err) {
    res.status(400).json({
      error: 'Failed to create task',
      details: err.message
    });
  }
});

/**
 * POST /api/chat/save
 * Explicit chat message persistence/sync endpoint
 */
app.post('/api/chat/save', async (req, res) => {
  const { mode = 'leader', message, sessionId, threadId } = req.body;
  if (!message || typeof message !== 'object') {
    return res.status(400).json({ error: 'message object is required' });
  }
  try {
    const saved = await saveChatMessageSafe(mode, message, sessionId, threadId);
    res.status(201).json({ success: true, message: saved });
  } catch (err) {
    res.status(400).json({ error: 'Failed to save message', details: err.message });
  }
});

/**
 * Kanban Projects Management API
 */
app.get('/api/kanban/projects', (req, res) => {
  res.json({ projects: getKanbanProjects() });
});

app.post('/api/kanban/projects', (req, res) => {
  try {
    const project = createKanbanProject(req.body);
    res.status(201).json({ success: true, project });
  } catch (err) {
    res.status(400).json({ error: 'Failed to create project', details: err.message });
  }
});

app.delete('/api/kanban/projects/:id', (req, res) => {
  try {
    const result = deleteKanbanProject(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete project', details: err.message });
  }
});

/**
 * Multi-Thread Chat Management API
 */
app.get('/api/chat/threads', (req, res) => {
  const { mode = 'leader' } = req.query;
  try {
    const data = getChatThreads(mode);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: 'Failed to get threads', details: err.message });
  }
});

app.post('/api/chat/threads', (req, res) => {
  const { mode = 'leader', title, planId, projectName } = req.body;
  try {
    const thread = createChatThread(mode, { title, planId, projectName });
    res.status(201).json({ success: true, thread });
  } catch (err) {
    res.status(400).json({ error: 'Failed to create thread', details: err.message });
  }
});

app.get('/api/chat/threads/:id', (req, res) => {
  const { mode = 'leader' } = req.query;
  try {
    const thread = getChatThread(mode, req.params.id);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    res.json({ thread });
  } catch (err) {
    res.status(400).json({ error: 'Failed to get thread', details: err.message });
  }
});

app.put('/api/chat/threads/:id/active', (req, res) => {
  const { mode = 'leader' } = req.body;
  try {
    const thread = setActiveChatThread(mode, req.params.id);
    res.json({ success: true, thread });
  } catch (err) {
    res.status(400).json({ error: 'Failed to set active thread', details: err.message });
  }
});

app.delete('/api/chat/threads/:id', (req, res) => {
  const { mode = 'leader' } = req.query;
  try {
    const deleted = deleteChatThread(mode, req.params.id);
    res.json({ success: true, thread: deleted });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete thread', details: err.message });
  }
});

app.patch('/api/chat/threads/:id', (req, res) => {
  const { mode = 'leader', title, planId, projectName } = req.body;
  try {
    const updated = updateChatThread(mode, req.params.id, { title, planId, projectName });
    res.json({ success: true, thread: updated });
  } catch (err) {
    res.status(400).json({ error: 'Failed to update thread', details: err.message });
  }
});

/**
 * GET /api/agents
 * Returns available agents and their capabilities
 */
app.get('/api/agents', (req, res) => {
  const agents = getAllAgents().map(a => ({
    id: a.id,
    name: a.name,
    role: a.role,
    emoji: a.emoji,
    domains: a.domains,
    description: a.description,
    tools: a.domains.flatMap(d => mcpServer.getToolsForDomain(d))
  }));
  res.json({ agents });
});

/**
 * GET /api/mcp/tools
 * Returns all available MCP tools, optionally filtered by domain
 */
app.get('/api/mcp/tools', (req, res) => {
  const { domain } = req.query;
  const tools = mcpServer.listTools(domain || null);
  res.json({ tools, domains: mcpServer.listDomains() });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Team Roster Management API (CRUD)
 */

// GET /api/team — List all team members
app.get('/api/team', (req, res) => {
  try {
    const diskMembers = loadTeamMembersFromDisk();
    TEAM_MEMBERS.splice(0, TEAM_MEMBERS.length, ...diskMembers);
  } catch (_) {}
  const { active } = req.query;
  if (active === 'true') {
    return res.json({ members: TEAM_MEMBERS.filter(m => m.active !== false) });
  }
  res.json({ members: TEAM_MEMBERS });
});

// POST /api/team — Add new agent / team member
app.post('/api/team', (req, res) => {
  const { name, role, description, model, active, shirtColor, hairColor, skinColor, pantsColor, systemPrompt } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Validation error', details: 'name is required' });
  }
  if (!role || typeof role !== 'string' || !role.trim()) {
    return res.status(400).json({ error: 'Validation error', details: 'role is required' });
  }

  // Validate model format if specified
  if (model && !/^[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_.@-]+)+$/.test(model)) {
    return res.status(400).json({
      error: 'Invalid model',
      details: 'model must be in format provider/model'
    });
  }

  // Generate unique ID based on name
  let baseId = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  if (!baseId) baseId = 'agent';
  let candidateId = baseId;
  let counter = 1;
  while (TEAM_MEMBERS.some(m => m.id === candidateId)) {
    candidateId = `${baseId}_${counter++}`;
  }

  const newMember = {
    id: candidateId,
    name: name.trim(),
    role: role.trim(),
    description: description && typeof description === 'string' ? description.trim() : `Bertanggung jawab atas ${role.trim()}`,
    ...(systemPrompt && typeof systemPrompt === 'string' && { systemPrompt: systemPrompt.trim() }),
    active: active !== undefined ? Boolean(active) : true,
    model: model && typeof model === 'string' && model.trim() ? model.trim() : null,
    shirtColor: shirtColor || '#38bdf8',
    hairColor: hairColor || '#1e293b',
    skinColor: skinColor || '#f2c9a0',
    pantsColor: pantsColor || '#334155',
    isDefault: false
  };

  TEAM_MEMBERS.push(newMember);
  saveTeamMembersToDisk(TEAM_MEMBERS);

  res.status(201).json({ success: true, member: newMember });
});

// PUT /api/team/:id — Update existing agent (status active/non-aktif, model, details)
app.put('/api/team/:id', (req, res) => {
  const { id } = req.params;
  const index = TEAM_MEMBERS.findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Not found', details: `Team member "${id}" not found` });
  }

  const existing = TEAM_MEMBERS[index];
  const { name, role, description, model, active, shirtColor, hairColor, skinColor, pantsColor, systemPrompt } = req.body;

  // Validate model format if specified
  if (model !== undefined && model !== null && model !== '') {
    if (!/^[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_.@-]+)+$/.test(model)) {
      return res.status(400).json({
        error: 'Invalid model',
        details: 'model must be in format provider/model'
      });
    }
  }

  const updatedMember = {
    ...existing,
    ...(name !== undefined && { name: name.trim() }),
    ...(role !== undefined && { role: role.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(systemPrompt !== undefined && { systemPrompt: typeof systemPrompt === 'string' ? systemPrompt.trim() : null }),
    ...(model !== undefined && { model: model && model.trim() ? model.trim() : null }),
    ...(active !== undefined && { active: Boolean(active) }),
    ...(shirtColor !== undefined && { shirtColor }),
    ...(hairColor !== undefined && { hairColor }),
    ...(skinColor !== undefined && { skinColor }),
    ...(pantsColor !== undefined && { pantsColor }),
  };

  TEAM_MEMBERS[index] = updatedMember;
  saveTeamMembersToDisk(TEAM_MEMBERS);

  res.json({ success: true, member: updatedMember });
});

// DELETE /api/team/:id — Deactivate or remove agent
app.delete('/api/team/:id', (req, res) => {
  const { id } = req.params;
  const index = TEAM_MEMBERS.findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Not found', details: `Team member "${id}" not found` });
  }

  const member = TEAM_MEMBERS[index];
  const isDefault = member.isDefault || ['arif', 'rina', 'dimas', 'bayu', 'sinta', 'mira', 'eko'].includes(member.id);

  if (isDefault) {
    // For default members, set active = false to preserve system integrity
    member.active = false;
    saveTeamMembersToDisk(TEAM_MEMBERS);
    return res.json({ success: true, action: 'deactivated', member });
  }

  // For custom members, delete from roster
  TEAM_MEMBERS.splice(index, 1);
  saveTeamMembersToDisk(TEAM_MEMBERS);
  res.json({ success: true, action: 'deleted', id });
});

// Any unmatched /api/* route returns JSON 404, never HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// 404 fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__rootdir, 'dist', 'index.html'));
});

// Start backend server only if this file is run directly (not imported as a module in tests)
const isMainModule = process.argv[1] && (
  process.argv[1] === fileURLToPath(import.meta.url) ||
  process.argv[1].endsWith('server/index.js') ||
  process.argv[1].endsWith('server\\index.js')
);

let server = null;
if (isMainModule) {
  const BACKEND_PORT = process.env.BACKEND_PORT || 3001;
  server = app.listen(BACKEND_PORT, '127.0.0.1', () => {
    console.log(`✅ Backend server running on http://127.0.0.1:${BACKEND_PORT}`);
    console.log(`✅ Chat API available at http://127.0.0.1:${BACKEND_PORT}/api/chat`);
    console.log(`✅ Models endpoint available at http://127.0.0.1:${BACKEND_PORT}/api/models`);
    
    // Spawn Vite dev server after backend is ready
    console.log('\n📦 Starting Vite dev server...');
    const vite = spawn('npm', ['run', 'dev:frontend'], {
      cwd: __rootdir,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    vite.on('error', (err) => {
      console.error('❌ Failed to start Vite:', err);
    });
  });
}

export {
  app,
  server,
  loadChatStore,
  saveChatMessage,
  updateChatMessage,
  getChatHistory,
  clearChatHistory,
  setChatSessionId,
  getKanbanTasks,
  loadKanbanStore,
  approvePlan,
  updateKanbanTaskSafe,
  deleteKanbanTaskSafe,
  createKanbanTaskSafe
};
