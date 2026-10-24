import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __rootdir = path.resolve(__dirname, '..');

let chatStoragePath = process.env.CHAT_STORAGE_FILE || path.join(__rootdir, 'data', 'chat_history.json');
let kanbanStoragePath = process.env.KANBAN_STORAGE_FILE || path.join(__rootdir, 'data', 'kanban.json');

export const STORAGE_LIMITS = {
  MAX_PLAN_TITLE_LENGTH: 200,
  MAX_PLAN_GOAL_LENGTH: 1000,
  MAX_PLAN_SCOPE_LENGTH: 2000,
  MAX_TASKS_PER_PLAN: 50,
  MAX_TASK_TITLE_LENGTH: 200,
  MAX_TASK_DESCRIPTION_LENGTH: 2000,
  MAX_ASSIGNEE_LENGTH: 100,
  MAX_ROLE_LENGTH: 100
};

export class AsyncMutex {
  constructor() {
    this._locked = false;
    this._queue = [];
  }

  acquire() {
    return new Promise(resolve => {
      if (!this._locked) {
        this._locked = true;
        resolve(() => this.release());
      } else {
        this._queue.push(resolve);
      }
    });
  }

  release() {
    if (this._queue.length > 0) {
      const nextResolve = this._queue.shift();
      nextResolve(() => this.release());
    } else {
      this._locked = false;
    }
  }

  async runExclusive(fn) {
    const release = await this.acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

export const chatMutex = new AsyncMutex();
export const kanbanMutex = new AsyncMutex();

export function setStoragePaths({ chatFile, kanbanFile } = {}) {
  if (chatFile) chatStoragePath = chatFile;
  if (kanbanFile) kanbanStoragePath = kanbanFile;
}

export function resetStoragePaths() {
  chatStoragePath = process.env.CHAT_STORAGE_FILE || path.join(__rootdir, 'data', 'chat_history.json');
  kanbanStoragePath = process.env.KANBAN_STORAGE_FILE || path.join(__rootdir, 'data', 'kanban.json');
}

export function getStoragePaths() {
  return {
    chatFile: chatStoragePath,
    kanbanFile: kanbanStoragePath
  };
}

function safeWriteJsonSync(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const uniqueId = `${process.pid}.${Date.now()}.${crypto.randomBytes(6).toString('hex')}`;
  const tempFile = `${filePath}.tmp.${uniqueId}`;

  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[storage] Failed to write temporary file ${tempFile}:`, err);
    throw err;
  }

  let renamed = false;
  let lastErr = null;

  // Retry atomic rename to handle transient locks on Windows (e.g. indexing or scanner)
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      fs.renameSync(tempFile, filePath);
      renamed = true;
      break;
    } catch (err) {
      lastErr = err;
      if (err.code === 'EPERM' || err.code === 'EBUSY') {
        const waitTill = Date.now() + 15;
        while (Date.now() < waitTill) {
          // brief synchronous wait for lock release
        }
        continue;
      }
      break;
    }
  }

  if (!renamed) {
    try {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch (_) {}
    console.error(`[storage] Atomic rename failed for ${filePath}:`, lastErr);
    throw new Error(`Failed to write storage file atomically to ${filePath}: ${lastErr?.message || 'unknown error'}`);
  }
}

function safeReadJsonSync(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn(`[storage] Could not read ${filePath}: ${err.message}. Using fallback.`);
  }
  return fallback;
}

// ─────────────────────────────────────────────────────────────
// CHAT STORAGE
// ─────────────────────────────────────────────────────────────

const DEFAULT_CHAT_STORE = {
  leader: { sessionId: null, messages: [] },
  chat: { sessionId: null, messages: [] },
  orchestrator: { sessionId: null, messages: [] }
};

export function loadChatStore() {
  const data = safeReadJsonSync(chatStoragePath, null);
  if (!data) {
    return JSON.parse(JSON.stringify(DEFAULT_CHAT_STORE));
  }
  return {
    leader: {
      sessionId: data.leader?.sessionId || null,
      messages: Array.isArray(data.leader?.messages) ? data.leader.messages : []
    },
    chat: {
      sessionId: data.chat?.sessionId || null,
      messages: Array.isArray(data.chat?.messages) ? data.chat.messages : []
    },
    orchestrator: {
      sessionId: data.orchestrator?.sessionId || null,
      messages: Array.isArray(data.orchestrator?.messages) ? data.orchestrator.messages : []
    }
  };
}

export function saveChatStore(store) {
  safeWriteJsonSync(chatStoragePath, store);
}

export function getChatHistory(mode = null) {
  const store = loadChatStore();
  if (mode && ['leader', 'chat', 'orchestrator'].includes(mode)) {
    return {
      mode,
      sessionId: store[mode].sessionId,
      messages: store[mode].messages
    };
  }
  return store;
}

export function saveChatMessage(mode, messageData, sessionId = undefined) {
  if (!['leader', 'chat', 'orchestrator'].includes(mode)) {
    throw new Error(`Invalid mode for chat storage: ${mode}`);
  }

  const store = loadChatStore();
  const msgId = messageData.id || `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const timestamp = messageData.timestamp || Date.now();

  const message = {
    id: msgId,
    timestamp,
    ...messageData
  };

  store[mode].messages.push(message);

  if (sessionId !== undefined) {
    store[mode].sessionId = sessionId;
  }

  saveChatStore(store);
  return message;
}

export async function saveChatMessageSafe(mode, messageData, sessionId = undefined) {
  return chatMutex.runExclusive(async () => {
    return saveChatMessage(mode, messageData, sessionId);
  });
}

export function updateChatMessage(mode, messageId, updates) {
  if (!['leader', 'chat', 'orchestrator'].includes(mode)) {
    throw new Error(`Invalid mode for chat storage: ${mode}`);
  }

  const store = loadChatStore();
  const idx = store[mode].messages.findIndex(m => m.id === messageId);
  if (idx === -1) {
    return null;
  }

  store[mode].messages[idx] = {
    ...store[mode].messages[idx],
    ...updates
  };

  saveChatStore(store);
  return store[mode].messages[idx];
}

export async function updateChatMessageSafe(mode, messageId, updates) {
  return chatMutex.runExclusive(async () => {
    return updateChatMessage(mode, messageId, updates);
  });
}

export function setChatSessionId(mode, sessionId) {
  if (!['leader', 'chat', 'orchestrator'].includes(mode)) {
    throw new Error(`Invalid mode for chat storage: ${mode}`);
  }

  const store = loadChatStore();
  store[mode].sessionId = sessionId;
  saveChatStore(store);
}

export function clearChatHistory(mode = null) {
  const store = loadChatStore();
  if (mode && ['leader', 'chat', 'orchestrator'].includes(mode)) {
    store[mode] = { sessionId: null, messages: [] };
  } else {
    store.leader = { sessionId: null, messages: [] };
    store.chat = { sessionId: null, messages: [] };
    store.orchestrator = { sessionId: null, messages: [] };
  }
  saveChatStore(store);
  return store;
}

export async function clearChatHistorySafe(mode = null) {
  return chatMutex.runExclusive(async () => {
    return clearChatHistory(mode);
  });
}

// ─────────────────────────────────────────────────────────────
// KANBAN STORAGE
// ─────────────────────────────────────────────────────────────

const DEFAULT_KANBAN_STORE = {
  columns: [
    { id: 'backlog', name: 'Backlog', position: 1 },
    { id: 'in_progress', name: 'In Progress', position: 2 },
    { id: 'done', name: 'Done', position: 3 }
  ],
  approvedPlans: {},
  tasks: []
};

export function loadKanbanStore() {
  const data = safeReadJsonSync(kanbanStoragePath, null);
  if (!data) {
    return JSON.parse(JSON.stringify(DEFAULT_KANBAN_STORE));
  }
  return {
    columns: Array.isArray(data.columns) && data.columns.length > 0 ? data.columns : DEFAULT_KANBAN_STORE.columns,
    approvedPlans: data.approvedPlans && typeof data.approvedPlans === 'object' ? data.approvedPlans : {},
    tasks: Array.isArray(data.tasks) ? data.tasks : []
  };
}

export function saveKanbanStore(store) {
  safeWriteJsonSync(kanbanStoragePath, store);
}

export function getKanbanTasks() {
  const store = loadKanbanStore();
  return store.tasks;
}

export function approvePlan({ plan, planId, idempotencyKey, teamMembers = [] }) {
  if (!plan || typeof plan !== 'object') {
    throw new Error('plan must be a valid object');
  }

  const rawTitle = typeof plan.title === 'string' ? plan.title.trim() : '';
  if (!rawTitle) {
    throw new Error('plan.title is required');
  }
  if (rawTitle.length > STORAGE_LIMITS.MAX_PLAN_TITLE_LENGTH) {
    throw new Error(`plan.title exceeds maximum length of ${STORAGE_LIMITS.MAX_PLAN_TITLE_LENGTH} characters`);
  }

  if (plan.goal && typeof plan.goal === 'string' && plan.goal.length > STORAGE_LIMITS.MAX_PLAN_GOAL_LENGTH) {
    throw new Error(`plan.goal exceeds maximum length of ${STORAGE_LIMITS.MAX_PLAN_GOAL_LENGTH} characters`);
  }

  if (plan.scope && typeof plan.scope === 'string' && plan.scope.length > STORAGE_LIMITS.MAX_PLAN_SCOPE_LENGTH) {
    throw new Error(`plan.scope exceeds maximum length of ${STORAGE_LIMITS.MAX_PLAN_SCOPE_LENGTH} characters`);
  }

  if (!Array.isArray(plan.tasks) || plan.tasks.length === 0) {
    throw new Error('plan.tasks must be a non-empty array');
  }

  if (plan.tasks.length > STORAGE_LIMITS.MAX_TASKS_PER_PLAN) {
    throw new Error(`plan.tasks exceeds maximum allowed tasks (${STORAGE_LIMITS.MAX_TASKS_PER_PLAN})`);
  }

  for (let i = 0; i < plan.tasks.length; i++) {
    const t = plan.tasks[i];
    if (!t || typeof t !== 'object' || !t.title || typeof t.title !== 'string' || !t.title.trim()) {
      throw new Error(`Task at index ${i} is missing a valid title`);
    }
    if (t.title.trim().length > STORAGE_LIMITS.MAX_TASK_TITLE_LENGTH) {
      throw new Error(`Task at index ${i} title exceeds maximum length of ${STORAGE_LIMITS.MAX_TASK_TITLE_LENGTH} characters`);
    }
    if (t.description && typeof t.description === 'string' && t.description.length > STORAGE_LIMITS.MAX_TASK_DESCRIPTION_LENGTH) {
      throw new Error(`Task at index ${i} description exceeds maximum length of ${STORAGE_LIMITS.MAX_TASK_DESCRIPTION_LENGTH} characters`);
    }
    if (t.assignee && typeof t.assignee === 'string' && t.assignee.length > STORAGE_LIMITS.MAX_ASSIGNEE_LENGTH) {
      throw new Error(`Task at index ${i} assignee exceeds maximum length of ${STORAGE_LIMITS.MAX_ASSIGNEE_LENGTH} characters`);
    }
    if (t.role && typeof t.role === 'string' && t.role.length > STORAGE_LIMITS.MAX_ROLE_LENGTH) {
      throw new Error(`Task at index ${i} role exceeds maximum length of ${STORAGE_LIMITS.MAX_ROLE_LENGTH} characters`);
    }
  }

  const store = loadKanbanStore();

  // Create stable plan identifier & idempotency key
  const normalizedTitle = rawTitle;
  const titleHash = crypto.createHash('sha256').update(normalizedTitle).digest('hex').slice(0, 10);
  const derivedPlanId = planId || plan.id || `plan_${titleHash}_${plan.tasks.length}`;
  const key = idempotencyKey || derivedPlanId;

  // Idempotency check: if this key was already approved, return existing tasks without duplicates
  if (store.approvedPlans[key]) {
    const record = store.approvedPlans[key];
    const existingTasks = store.tasks.filter(
      t => t.planId === derivedPlanId || (record.taskIds && record.taskIds.includes(t.id))
    );

    return {
      success: true,
      alreadyApproved: true,
      planId: derivedPlanId,
      idempotencyKey: key,
      message: 'Plan has already been approved. Existing tasks preserved.',
      tasks: existingTasks,
      count: existingTasks.length
    };
  }

  // Map each task to Kanban Backlog/pending task with collision-proof IDs
  const createdTasks = plan.tasks.map((t, idx) => {
    let baseId = t.id && typeof t.id === 'string' && t.id.trim() ? t.id.trim() : `TASK-${idx + 1}`;
    let taskId = baseId;
    let collisionCount = 1;
    while (store.tasks.some(existing => existing.id === taskId)) {
      const salt = crypto.randomBytes(3).toString('hex');
      const planSuffix = derivedPlanId.replace(/[^a-zA-Z0-9_-]/g, '').slice(-6) || 'plan';
      taskId = `${baseId}-${planSuffix}-${idx + 1}-${collisionCount}-${salt}`;
      collisionCount++;
    }

    // Match assignee to active team roster if possible
    const rawAssignee = (t.assignee || '').trim();
    let assignedName = rawAssignee || 'Arif';
    let assignedRole = t.role || 'Team Member';

    if (Array.isArray(teamMembers) && teamMembers.length > 0) {
      const matched = teamMembers.find(
        m => m.name.toLowerCase() === rawAssignee.toLowerCase() ||
             m.id.toLowerCase() === rawAssignee.toLowerCase()
      );
      if (matched) {
        assignedName = matched.name;
        assignedRole = matched.role || assignedRole;
      }
    }

    return {
      id: taskId,
      planId: derivedPlanId,
      planTitle: normalizedTitle,
      title: t.title.trim(),
      description: (t.description || '').trim(),
      assignee: assignedName,
      role: assignedRole,
      status: 'pending',
      column: 'backlog',
      createdAt: new Date().toISOString()
    };
  });

  // Append new tasks to Kanban store
  store.tasks.push(...createdTasks);

  // Record approved plan for idempotency
  store.approvedPlans[key] = {
    approvedAt: new Date().toISOString(),
    planId: derivedPlanId,
    planTitle: normalizedTitle,
    taskIds: createdTasks.map(t => t.id),
    count: createdTasks.length
  };

  saveKanbanStore(store);

  return {
    success: true,
    alreadyApproved: false,
    planId: derivedPlanId,
    idempotencyKey: key,
    message: `Plan approved: ${createdTasks.length} tasks created in Kanban backlog.`,
    tasks: createdTasks,
    count: createdTasks.length
  };
}

export async function approvePlanSafe(params) {
  return kanbanMutex.runExclusive(async () => {
    return approvePlan(params);
  });
}

export function clearKanbanStore() {
  const store = JSON.parse(JSON.stringify(DEFAULT_KANBAN_STORE));
  saveKanbanStore(store);
  return store;
}

export async function clearKanbanStoreSafe() {
  return kanbanMutex.runExclusive(async () => {
    return clearKanbanStore();
  });
}
