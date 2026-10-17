import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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

// Store active session IDs and model across requests (isolated per mode)
let currentChatSessionId = null;
let currentLeaderSessionId = null;
let currentModel = null;

export function resetSessions() {
  currentChatSessionId = null;
  currentLeaderSessionId = null;
}

/**
 * Team members available in the virtual office
 */
export const TEAM_MEMBERS = [
  { id: 'arif', name: 'Arif', role: 'Project Lead / Coordinator', description: 'Memimpin koordinasi sprint, requirement elicitation, dan breakdown tugas' },
  { id: 'rina', name: 'Rina', role: 'Finance / Accountant', description: 'Menghitung estimasi budget, invoice, dan laporan keuangan' },
  { id: 'dimas', name: 'Dimas', role: 'UI/UX Designer', description: 'Membuat wireframe, desain antarmuka, mockup, dan aset visual' },
  { id: 'bayu', name: 'Bayu', role: 'Product / Frontend Engineer', description: 'Implementasi antarmuka, user flow, dan integrasi fitur aplikasi' },
  { id: 'sinta', name: 'Sinta', role: 'Marketing / Growth', description: 'Menyusun strategi campaign promosi, copy pemasaran, dan go-to-market' },
  { id: 'mira', name: 'Mira', role: 'Sales / Client Relations', description: 'Komunikasi kebutuhan klien, pitching, dan relationship management' },
  { id: 'eko', name: 'Eko', role: 'Operations / Admin Support', description: 'Manajemen operasional, kelengkapan administrasi, dan alur dokumen' },
];

/**
 * System instruction prompt for Leader Mode (Arif - Project Lead)
 */
export const LEADER_SYSTEM_PROMPT = `Anda adalah Arif, Project Lead di Pixel Works Virtual Office.
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
6. ALUR KOORDINASI:
   - Jika user mengajukan ide, project, atau permintaan/penugasan:
     - Evaluasi apakah informasi project sudah lengkap (Tujuan/Goal, Scope/Ruang Lingkup, Deliverables/Output, Batasan/Tech Stack/Deadline).
     - JIKA BELUM CUKUP LENGKAP: Masuk fase "clarifying". Tanyakan poin-poin yang belum jelas secara spesifik (tujuan, batasan, target output, dsb). JANGAN membuat rencana final dulu.
     - JIKA SUDAH CUKUP LENGKAP: Masuk fase "planned" atau "awaiting_confirmation". Buat rencana kerja terstruktur dan pecah menjadi tugas-tugas spesifik untuk anggota tim yang relevan (Arif, Rina, Dimas, Bayu, Sinta, Mira, Eko). Minta konfirmasi eksplisit dari user sebelum ada langkah eksekusi apapun.

ANGGOTA TIM YANG TERSEDIA:
- Arif (Project Lead / Coordinator): koordinasi, requirement, breakdown
- Rina (Finance / Accountant): estimasi biaya, budget, laporan keuangan
- Dimas (UI/UX Designer): wireframe, visual design, mockup, design system
- Bayu (Product / Frontend Engineer): implementasi UI, kode fitur, integrasi sistem
- Sinta (Marketing / Growth): strategi pemasaran, materi promosi, go-to-market
- Mira (Sales / Client Relations): penawaran klien, riset pasar/klien
- Eko (Operations / Admin Support): operasional, alur dokumen, logistik

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
        "assignee": "Nama anggota tim (Arif/Rina/Dimas/Bayu/Sinta/Mira/Eko)",
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
  const { message, sessionId, model, mode, leader } = req.body;

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
  
  // When model changes, reset session to avoid incompatibility
  let nextSessionId = sessionId;
  if (selectedModel && selectedModel !== currentModel) {
    console.log(`Model changed from ${currentModel} to ${selectedModel}, resetting session`);
    nextSessionId = null;
    currentChatSessionId = null;
    currentLeaderSessionId = null;
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

      promptToSend = `[SYSTEM INSTRUCTION]\n${LEADER_SYSTEM_PROMPT}\n[/SYSTEM INSTRUCTION]\n\n[USER REQUEST]\n${sanitizedUserMessage}\n[/USER REQUEST]`;
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
      } else {
        currentChatSessionId = result.sessionId;
      }
    }
    
    if (!currentModel && selectedModel) {
      currentModel = selectedModel;
    }

    const rawOutput = result.output || '';

    if (!isLeaderMode) {
      // Standard chat response - 100% backward-compatible with legacy clients
      return res.json({
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

    const leaderResponse = {
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Team roster endpoint
app.get('/api/team', (req, res) => {
  res.json({ members: TEAM_MEMBERS });
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

export { app, server };
