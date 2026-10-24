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
  leader: { sessionId: null, messages: [], threads: [], activeThreadId: null },
  chat: { sessionId: null, messages: [], threads: [], activeThreadId: null },
  orchestrator: { sessionId: null, messages: [], threads: [], activeThreadId: null }
};

export function loadChatStore() {
  const data = safeReadJsonSync(chatStoragePath, null);
  if (!data) {
    return JSON.parse(JSON.stringify(DEFAULT_CHAT_STORE));
  }
  const result = {
    leader: {
      sessionId: data.leader?.sessionId || null,
      messages: Array.isArray(data.leader?.messages) ? data.leader.messages : [],
      threads: Array.isArray(data.leader?.threads) ? data.leader.threads : [],
      activeThreadId: data.leader?.activeThreadId || null
    },
    chat: {
      sessionId: data.chat?.sessionId || null,
      messages: Array.isArray(data.chat?.messages) ? data.chat.messages : [],
      threads: Array.isArray(data.chat?.threads) ? data.chat.threads : [],
      activeThreadId: data.chat?.activeThreadId || null
    },
    orchestrator: {
      sessionId: data.orchestrator?.sessionId || null,
      messages: Array.isArray(data.orchestrator?.messages) ? data.orchestrator.messages : [],
      threads: Array.isArray(data.orchestrator?.threads) ? data.orchestrator.threads : [],
      activeThreadId: data.orchestrator?.activeThreadId || null
    }
  };

  // Ensure initial thread exists if there are messages but no threads
  ['leader', 'chat', 'orchestrator'].forEach(m => {
    const modeObj = result[m];
    if (modeObj.threads.length === 0 && modeObj.messages.length > 0) {
      const planMsg = modeObj.messages.find(msg => msg.plan);
      const title = planMsg?.plan?.title || modeObj.messages[0]?.text?.slice(0, 36) || 'Obrolan Utama';
      const initialThread = {
        id: `thread_${m}_initial`,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        planId: planMsg?.plan?.id || null,
        projectName: planMsg?.plan?.title || null,
        sessionId: modeObj.sessionId,
        messages: [...modeObj.messages]
      };
      modeObj.threads.push(initialThread);
      modeObj.activeThreadId = initialThread.id;
    }
  });

  return result;
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
      messages: store[mode].messages,
      threads: store[mode].threads || [],
      activeThreadId: store[mode].activeThreadId || null
    };
  }
  return store;
}

export function saveChatMessage(mode, messageData, sessionId = undefined, threadId = null) {
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

  const modeObj = store[mode];
  modeObj.messages.push(message);

  if (sessionId !== undefined) {
    modeObj.sessionId = sessionId;
  }

  // Manage threads
  const targetId = threadId || modeObj.activeThreadId;
  let targetThread = null;
  if (targetId) {
    targetThread = modeObj.threads.find(t => t.id === targetId);
  }

  if (!targetThread) {
    if (modeObj.threads.length > 0) {
      targetThread = modeObj.threads[0];
    } else {
      const planTitle = message.plan?.title || (message.text ? message.text.slice(0, 32) : 'Obrolan Baru');
      targetThread = {
        id: `thread_${mode}_${Date.now()}`,
        title: planTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        planId: message.plan?.id || null,
        projectName: message.plan?.title || null,
        sessionId: sessionId || modeObj.sessionId,
        messages: []
      };
      modeObj.threads.push(targetThread);
      modeObj.activeThreadId = targetThread.id;
    }
  }

  if (targetThread) {
    if (!targetThread.messages.some(m => m.id === message.id)) {
      targetThread.messages.push(message);
    }
    targetThread.updatedAt = new Date().toISOString();
    if (sessionId !== undefined) {
      targetThread.sessionId = sessionId;
    }
    if (message.plan) {
      targetThread.planId = message.plan.id;
      targetThread.projectName = message.plan.title;
      if (!targetThread.title || targetThread.title === 'Obrolan Baru' || targetThread.title === 'Obrolan Utama') {
        targetThread.title = message.plan.title;
      }
    }
  }

  saveChatStore(store);
  return message;
}

export async function saveChatMessageSafe(mode, messageData, sessionId = undefined, threadId = null) {
  return chatMutex.runExclusive(async () => {
    return saveChatMessage(mode, messageData, sessionId, threadId);
  });
}

export function getChatThreads(mode) {
  if (!['leader', 'chat', 'orchestrator'].includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  const store = loadChatStore();
  const modeObj = store[mode];
  return {
    threads: (modeObj.threads || []).map(t => ({
      id: t.id,
      title: t.title,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      messageCount: t.messages?.length || 0,
      lastMessage: t.messages?.[t.messages.length - 1]?.text || '',
      planId: t.planId || null,
      projectName: t.projectName || null,
      sessionId: t.sessionId || null
    })),
    activeThreadId: modeObj.activeThreadId
  };
}

export function getChatThread(mode, threadId) {
  if (!['leader', 'chat', 'orchestrator'].includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  const store = loadChatStore();
  const thread = store[mode].threads.find(t => t.id === threadId);
  if (!thread) return null;
  return thread;
}

export function createChatThread(mode, { title = 'Obrolan Baru', planId = null, projectName = null } = {}) {
  if (!['leader', 'chat', 'orchestrator'].includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  const store = loadChatStore();
  const modeObj = store[mode];
  const newThread = {
    id: `thread_${mode}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    title: (title || 'Obrolan Baru').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    planId: planId || null,
    projectName: projectName || null,
    sessionId: null,
    messages: []
  };

  modeObj.threads.unshift(newThread);
  modeObj.activeThreadId = newThread.id;
  modeObj.messages = [];
  modeObj.sessionId = null;

  saveChatStore(store);
  return newThread;
}

export function setActiveChatThread(mode, threadId) {
  if (!['leader', 'chat', 'orchestrator'].includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  const store = loadChatStore();
  const modeObj = store[mode];
  const thread = modeObj.threads.find(t => t.id === threadId);
  if (!thread) {
    throw new Error(`Thread "${threadId}" not found in mode ${mode}`);
  }

  modeObj.activeThreadId = thread.id;
  modeObj.messages = [...(thread.messages || [])];
  modeObj.sessionId = thread.sessionId || null;

  saveChatStore(store);
  return thread;
}

export function deleteChatThread(mode, threadId) {
  if (!['leader', 'chat', 'orchestrator'].includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  const store = loadChatStore();
  const modeObj = store[mode];
  const idx = modeObj.threads.findIndex(t => t.id === threadId);
  if (idx === -1) {
    throw new Error(`Thread "${threadId}" not found in mode ${mode}`);
  }

  const [deleted] = modeObj.threads.splice(idx, 1);
  if (modeObj.activeThreadId === threadId) {
    if (modeObj.threads.length > 0) {
      modeObj.activeThreadId = modeObj.threads[0].id;
      modeObj.messages = [...(modeObj.threads[0].messages || [])];
      modeObj.sessionId = modeObj.threads[0].sessionId || null;
    } else {
      modeObj.activeThreadId = null;
      modeObj.messages = [];
      modeObj.sessionId = null;
    }
  }

  saveChatStore(store);
  return deleted;
}

export function updateChatThread(mode, threadId, updates) {
  if (!['leader', 'chat', 'orchestrator'].includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  const store = loadChatStore();
  const modeObj = store[mode];
  const thread = modeObj.threads.find(t => t.id === threadId);
  if (!thread) {
    throw new Error(`Thread "${threadId}" not found in mode ${mode}`);
  }

  if (updates.title !== undefined) thread.title = updates.title.trim();
  if (updates.planId !== undefined) thread.planId = updates.planId;
  if (updates.projectName !== undefined) thread.projectName = updates.projectName;
  thread.updatedAt = new Date().toISOString();

  saveChatStore(store);
  return thread;
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

  // Also update inside threads
  if (Array.isArray(store[mode].threads)) {
    store[mode].threads.forEach(t => {
      const tIdx = t.messages?.findIndex(m => m.id === messageId);
      if (tIdx !== -1 && tIdx !== undefined) {
        t.messages[tIdx] = {
          ...t.messages[tIdx],
          ...updates
        };
      }
    });
  }

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
  if (store[mode].activeThreadId) {
    const thread = store[mode].threads?.find(t => t.id === store[mode].activeThreadId);
    if (thread) thread.sessionId = sessionId;
  }
  saveChatStore(store);
}

export function clearChatHistory(mode = null) {
  const store = loadChatStore();
  if (mode && ['leader', 'chat', 'orchestrator'].includes(mode)) {
    store[mode] = { sessionId: null, messages: [], threads: [], activeThreadId: null };
  } else {
    store.leader = { sessionId: null, messages: [], threads: [], activeThreadId: null };
    store.chat = { sessionId: null, messages: [], threads: [], activeThreadId: null };
    store.orchestrator = { sessionId: null, messages: [], threads: [], activeThreadId: null };
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
// KANBAN STORAGE (PROJECT-SCOPED & GLOBAL)
// ─────────────────────────────────────────────────────────────

const DEFAULT_KANBAN_STORE = {
  columns: [
    { id: 'backlog', name: 'Backlog', position: 1 },
    { id: 'in_progress', name: 'In Progress', position: 2 },
    { id: 'done', name: 'Done', position: 3 }
  ],
  approvedPlans: {},
  projects: [],
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
    projects: Array.isArray(data.projects) ? data.projects : [],
    tasks: Array.isArray(data.tasks) ? data.tasks : []
  };
}

export function saveKanbanStore(store) {
  safeWriteJsonSync(kanbanStoragePath, store);
}

export function getKanbanTasks(projectId = null) {
  const store = loadKanbanStore();
  if (projectId && projectId !== 'all') {
    return store.tasks.filter(t => t.planId === projectId || t.projectId === projectId);
  }
  return store.tasks;
}

export function getKanbanProjects() {
  const store = loadKanbanStore();
  const projectsMap = {};

  if (Array.isArray(store.projects)) {
    store.projects.forEach(p => {
      if (p && p.id) {
        projectsMap[p.id] = {
          id: p.id,
          name: p.name || 'Proyek Tanpa Judul',
          description: p.description || '',
          goal: p.goal || '',
          scope: p.scope || '',
          createdAt: p.createdAt || new Date().toISOString()
        };
      }
    });
  }

  if (store.approvedPlans) {
    Object.entries(store.approvedPlans).forEach(([key, plan]) => {
      const pId = plan.planId || key;
      if (!projectsMap[pId]) {
        projectsMap[pId] = {
          id: pId,
          name: plan.planTitle || 'Proyek Terencana',
          description: '',
          goal: '',
          scope: '',
          createdAt: plan.approvedAt || new Date().toISOString()
        };
      }
    });
  }

  if (Array.isArray(store.tasks)) {
    store.tasks.forEach(t => {
      const pId = t.planId || t.projectId;
      if (pId && !projectsMap[pId]) {
        projectsMap[pId] = {
          id: pId,
          name: t.planTitle || t.projectName || 'Proyek',
          description: '',
          goal: '',
          scope: '',
          createdAt: t.createdAt || new Date().toISOString()
        };
      }
    });
  }

  return Object.values(projectsMap).map(project => {
    const projectTasks = store.tasks.filter(t => (t.planId === project.id || t.projectId === project.id));
    const backlog = projectTasks.filter(t => (t.column === 'backlog' || t.status === 'pending')).length;
    const in_progress = projectTasks.filter(t => t.column === 'in_progress').length;
    const done = projectTasks.filter(t => t.column === 'done').length;

    return {
      ...project,
      taskCount: projectTasks.length,
      backlog,
      in_progress,
      done
    };
  });
}

export function createKanbanProject({ name, goal = '', scope = '', description = '' }) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('Project name is required');
  }

  const store = loadKanbanStore();
  if (!Array.isArray(store.projects)) {
    store.projects = [];
  }

  const id = `proj_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const newProject = {
    id,
    name: name.trim(),
    goal: goal.trim(),
    scope: scope.trim(),
    description: description.trim(),
    createdAt: new Date().toISOString()
  };

  store.projects.push(newProject);
  saveKanbanStore(store);
  return newProject;
}

export function deleteKanbanProject(projectId) {
  const store = loadKanbanStore();
  if (Array.isArray(store.projects)) {
    const pIdx = store.projects.findIndex(p => p.id === projectId);
    if (pIdx !== -1) store.projects.splice(pIdx, 1);
  }
  if (store.approvedPlans && store.approvedPlans[projectId]) {
    delete store.approvedPlans[projectId];
  }

  store.tasks = store.tasks.filter(t => t.planId !== projectId && t.projectId !== projectId);
  saveKanbanStore(store);
  return { success: true, projectId };
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
      projectId: derivedPlanId,
      planTitle: normalizedTitle,
      projectName: normalizedTitle,
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

  // Ensure project is registered in store.projects
  if (!Array.isArray(store.projects)) store.projects = [];
  if (!store.projects.some(p => p.id === derivedPlanId)) {
    store.projects.push({
      id: derivedPlanId,
      name: normalizedTitle,
      goal: plan.goal || '',
      scope: plan.scope || '',
      createdAt: new Date().toISOString()
    });
  }

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

export function updateKanbanTask(taskId, updates) {
  if (!taskId || typeof taskId !== 'string') {
    throw new Error('taskId is required');
  }
  const store = loadKanbanStore();
  const idx = store.tasks.findIndex(t => t.id === taskId);
  if (idx === -1) {
    throw new Error(`Task "${taskId}" not found in Kanban store`);
  }

  const existing = store.tasks[idx];
  let column = updates.column !== undefined ? updates.column : existing.column;
  let status = updates.status !== undefined ? updates.status : existing.status;

  if (updates.column && !updates.status) {
    if (updates.column === 'backlog') status = 'pending';
    else if (updates.column === 'in_progress') status = 'in_progress';
    else if (updates.column === 'done') status = 'done';
  } else if (updates.status && !updates.column) {
    if (updates.status === 'pending') column = 'backlog';
    else if (updates.status === 'in_progress') column = 'in_progress';
    else if (updates.status === 'done') column = 'done';
  }

  store.tasks[idx] = {
    ...existing,
    ...(updates.title !== undefined && { title: updates.title.trim() }),
    ...(updates.description !== undefined && { description: updates.description.trim() }),
    ...(updates.assignee !== undefined && { assignee: updates.assignee.trim() }),
    ...(updates.role !== undefined && { role: updates.role.trim() }),
    column,
    status,
    updatedAt: new Date().toISOString()
  };

  saveKanbanStore(store);
  return store.tasks[idx];
}

export async function updateKanbanTaskSafe(taskId, updates) {
  return kanbanMutex.runExclusive(async () => {
    return updateKanbanTask(taskId, updates);
  });
}

export function deleteKanbanTask(taskId) {
  if (!taskId || typeof taskId !== 'string') {
    throw new Error('taskId is required');
  }
  const store = loadKanbanStore();
  const idx = store.tasks.findIndex(t => t.id === taskId);
  if (idx === -1) {
    throw new Error(`Task "${taskId}" not found in Kanban store`);
  }
  const deleted = store.tasks.splice(idx, 1)[0];
  saveKanbanStore(store);
  return deleted;
}

export async function deleteKanbanTaskSafe(taskId) {
  return kanbanMutex.runExclusive(async () => {
    return deleteKanbanTask(taskId);
  });
}

export function createKanbanTask(taskData) {
  if (!taskData || typeof taskData !== 'object') {
    throw new Error('taskData is required');
  }
  const title = (taskData.title || '').trim();
  if (!title) {
    throw new Error('Task title is required');
  }

  const store = loadKanbanStore();
  const baseId = taskData.id ? taskData.id.trim() : `TASK-${store.tasks.length + 1}`;
  let taskId = baseId;
  let counter = 1;
  while (store.tasks.some(t => t.id === taskId)) {
    taskId = `${baseId}-${counter++}`;
  }

  const column = taskData.column || 'backlog';
  const status = taskData.status || (column === 'done' ? 'done' : column === 'in_progress' ? 'in_progress' : 'pending');

  const newTask = {
    id: taskId,
    projectId: taskData.projectId || null,
    planId: taskData.planId || null,
    planTitle: (taskData.planTitle || '').trim() || 'Manual Task',
    title,
    description: (taskData.description || '').trim(),
    assignee: (taskData.assignee || 'Arif').trim(),
    role: (taskData.role || 'Team Member').trim(),
    column,
    status,
    createdAt: new Date().toISOString()
  };

  store.tasks.push(newTask);
  saveKanbanStore(store);
  return newTask;
}

export async function createKanbanTaskSafe(taskData) {
  return kanbanMutex.runExclusive(async () => {
    return createKanbanTask(taskData);
  });
}

