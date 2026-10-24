import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from '../server/index.js';
import {
  setStoragePaths,
  resetStoragePaths,
  loadChatStore,
  saveChatMessage,
  saveChatMessageSafe,
  getChatHistory,
  clearChatHistory,
  approvePlan,
  approvePlanSafe,
  loadKanbanStore,
  clearKanbanStore,
  STORAGE_LIMITS
} from '../server/storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testTempDir = path.join(__dirname, '..', '.tmp_test_storage');
const testChatFile = path.join(testTempDir, 'chat_history.test.json');
const testKanbanFile = path.join(testTempDir, 'kanban.test.json');

describe('TASK-023: Durable Chat and Kanban Approval Tests', () => {
  let testServer;
  let serverPort;

  before(async () => {
    fs.mkdirSync(testTempDir, { recursive: true });
    setStoragePaths({ chatFile: testChatFile, kanbanFile: testKanbanFile });

    await new Promise((resolve) => {
      testServer = app.listen(0, '127.0.0.1', () => {
        serverPort = testServer.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    if (testServer) {
      await new Promise(resolve => testServer.close(resolve));
    }
    resetStoragePaths();
    try {
      fs.rmSync(testTempDir, { recursive: true, force: true });
    } catch (_) {}
  });

  beforeEach(() => {
    clearChatHistory();
    clearKanbanStore();
  });

  function apiRequest(method, endpointPath, body = null) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: serverPort,
          path: endpointPath,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
          }
        },
        (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve({ status: res.statusCode, headers: res.headers, data: parsed });
            } catch (err) {
              resolve({ status: res.statusCode, headers: res.headers, raw: data });
            }
          });
        }
      );
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  describe('Durable Chat & Session Storage', () => {
    it('persists messages and survives simulated backend restart via disk read', () => {
      // 1. Save messages in leader and chat mode
      saveChatMessage('leader', { type: 'user', mode: 'leader', text: 'Halo Arif' }, 'ses_leader_1');
      saveChatMessage('leader', { type: 'assistant', mode: 'leader', text: 'Halo, saya Arif' }, 'ses_leader_1');
      saveChatMessage('chat', { type: 'user', mode: 'chat', text: 'Halo standard chat' }, 'ses_chat_2');

      // Verify file exists on disk
      assert(fs.existsSync(testChatFile), 'Storage file must be written to disk');

      // 2. Simulate complete backend restart by reading freshly from disk
      const restored = loadChatStore();
      assert.strictEqual(restored.leader.sessionId, 'ses_leader_1');
      assert.strictEqual(restored.leader.messages.length, 2);
      assert.strictEqual(restored.leader.messages[0].text, 'Halo Arif');
      assert.strictEqual(restored.leader.messages[1].text, 'Halo, saya Arif');

      assert.strictEqual(restored.chat.sessionId, 'ses_chat_2');
      assert.strictEqual(restored.chat.messages.length, 1);
      assert.strictEqual(restored.chat.messages[0].text, 'Halo standard chat');

      assert.strictEqual(restored.orchestrator.sessionId, null);
      assert.strictEqual(restored.orchestrator.messages.length, 0);
    });

    it('isolates conversation history and session IDs strictly per mode', async () => {
      saveChatMessage('leader', { type: 'user', mode: 'leader', text: 'Koordinasi leader' }, 'ses_leader_abc');
      saveChatMessage('chat', { type: 'user', mode: 'chat', text: 'Tanya umum standard' }, 'ses_chat_xyz');
      saveChatMessage('orchestrator', { type: 'user', mode: 'orchestrator', text: 'Delegasi multi-agent' }, 'ses_orch_789');

      // Fetch per mode via API
      const leaderRes = await apiRequest('GET', '/api/chat/history?mode=leader');
      assert.strictEqual(leaderRes.status, 200);
      assert.strictEqual(leaderRes.data.mode, 'leader');
      assert.strictEqual(leaderRes.data.sessionId, 'ses_leader_abc');
      assert.strictEqual(leaderRes.data.messages.length, 1);
      assert.strictEqual(leaderRes.data.messages[0].text, 'Koordinasi leader');

      const chatRes = await apiRequest('GET', '/api/chat/history?mode=chat');
      assert.strictEqual(chatRes.status, 200);
      assert.strictEqual(chatRes.data.mode, 'chat');
      assert.strictEqual(chatRes.data.sessionId, 'ses_chat_xyz');
      assert.strictEqual(chatRes.data.messages[0].text, 'Tanya umum standard');

      const orchRes = await apiRequest('GET', '/api/chat/history?mode=orchestrator');
      assert.strictEqual(orchRes.status, 200);
      assert.strictEqual(orchRes.data.mode, 'orchestrator');
      assert.strictEqual(orchRes.data.sessionId, 'ses_orch_789');
      assert.strictEqual(orchRes.data.messages[0].text, 'Delegasi multi-agent');

      // Fetch all modes
      const allRes = await apiRequest('GET', '/api/chat/history');
      assert.strictEqual(allRes.status, 200);
      assert(allRes.data.history.leader);
      assert(allRes.data.history.chat);
      assert(allRes.data.history.orchestrator);
    });

    it('resets history for a specific mode without affecting other modes', async () => {
      saveChatMessage('leader', { type: 'user', text: 'Pesan leader' }, 'ses_lead');
      saveChatMessage('chat', { type: 'user', text: 'Pesan chat' }, 'ses_chat');

      // Reset only leader mode
      const resetRes = await apiRequest('POST', '/api/chat/reset', { mode: 'leader' });
      assert.strictEqual(resetRes.status, 200);
      assert.strictEqual(resetRes.data.success, true);

      const leaderHistory = getChatHistory('leader');
      assert.strictEqual(leaderHistory.messages.length, 0);
      assert.strictEqual(leaderHistory.sessionId, null);

      const chatHistory = getChatHistory('chat');
      assert.strictEqual(chatHistory.messages.length, 1);
      assert.strictEqual(chatHistory.sessionId, 'ses_chat');
    });

    it('rejects invalid mode parameter with 400', async () => {
      const res = await apiRequest('GET', '/api/chat/history?mode=invalid_mode');
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.error, 'Invalid mode');
    });
  });

  describe('Leader Plan Gating & Kanban Approval', () => {
    const samplePlan = {
      id: 'plan_login_v1',
      title: 'Fitur Login & Autentikasi',
      goal: 'User dapat login dengan aman',
      scope: 'Halaman login, endpoint auth, validasi token',
      tasks: [
        {
          id: 'TASK-1',
          title: 'Desain Form Login',
          assignee: 'Dimas',
          role: 'UI/UX Designer',
          description: 'Mockup form dan flow responsif',
          status: 'pending'
        },
        {
          id: 'TASK-2',
          title: 'Implementasi Slicing & Form',
          assignee: 'Bayu',
          role: 'Product / Frontend Engineer',
          description: 'Komponen React form login',
          status: 'pending'
        },
        {
          id: 'TASK-3',
          title: 'Campaign Promosi Fitur',
          assignee: 'Sinta',
          role: 'Marketing / Growth',
          description: 'Copywriting materi rilis fitur',
          status: 'pending'
        }
      ]
    };

    it('unapproved plan does NOT create any task in Kanban', async () => {
      // Simulate plan proposed by leader in chat history
      saveChatMessage('leader', {
        type: 'assistant',
        mode: 'leader',
        phase: 'awaiting_confirmation',
        plan: samplePlan,
        confirmation_prompt: 'Apakah rencana sudah sesuai?'
      });

      // Query kanban
      const kanbanRes = await apiRequest('GET', '/api/kanban/tasks');
      assert.strictEqual(kanbanRes.status, 200);
      assert.strictEqual(kanbanRes.data.tasks.length, 0, 'No tasks should exist in Kanban before explicit approval');
    });

    it('rejects invalid approval payload with 400', async () => {
      const emptyPlanRes = await apiRequest('POST', '/api/chat/approve-plan', {});
      assert.strictEqual(emptyPlanRes.status, 400);

      const noTasksRes = await apiRequest('POST', '/api/chat/approve-plan', { plan: { title: 'No tasks', tasks: [] } });
      assert.strictEqual(noTasksRes.status, 400);

      const invalidTaskRes = await apiRequest('POST', '/api/chat/approve-plan', {
        plan: {
          title: 'Test',
          tasks: [{ title: '   ' }]
        }
      });
      assert.strictEqual(invalidTaskRes.status, 400);
      assert.strictEqual(invalidTaskRes.data.details, 'Task at index 0 is missing a valid title');
    });

    it('explicit approval creates Kanban tasks with status pending/Backlog and correct mappings', async () => {
      const res = await apiRequest('POST', '/api/chat/approve-plan', {
        plan: samplePlan,
        planId: samplePlan.id
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.alreadyApproved, false);
      assert.strictEqual(res.data.count, 3);
      assert.strictEqual(res.data.tasks.length, 3);

      // Verify each task mapping
      const [t1, t2, t3] = res.data.tasks;
      assert.strictEqual(t1.title, 'Desain Form Login');
      assert.strictEqual(t1.assignee, 'Dimas');
      assert.strictEqual(t1.status, 'pending');
      assert.strictEqual(t1.column, 'backlog');

      assert.strictEqual(t2.title, 'Implementasi Slicing & Form');
      assert.strictEqual(t2.assignee, 'Bayu');
      assert.strictEqual(t2.status, 'pending');
      assert.strictEqual(t2.column, 'backlog');

      assert.strictEqual(t3.title, 'Campaign Promosi Fitur');
      assert.strictEqual(t3.assignee, 'Sinta');
      assert.strictEqual(t3.status, 'pending');
      assert.strictEqual(t3.column, 'backlog');

      // Verify tasks persisted durably in Kanban store
      const kanbanRes = await apiRequest('GET', '/api/kanban/tasks');
      assert.strictEqual(kanbanRes.status, 200);
      assert.strictEqual(kanbanRes.data.tasks.length, 3);
      assert.strictEqual(kanbanRes.data.tasks[0].id, 'TASK-1');
    });

    it('approval retry is idempotent: preserves tasks without creating duplicates', async () => {
      // First approval
      const firstRes = await apiRequest('POST', '/api/chat/approve-plan', {
        plan: samplePlan,
        planId: samplePlan.id
      });
      assert.strictEqual(firstRes.status, 201);
      assert.strictEqual(firstRes.data.count, 3);

      // Second approval (retry with same planId / idempotency key)
      const secondRes = await apiRequest('POST', '/api/chat/approve-plan', {
        plan: samplePlan,
        planId: samplePlan.id
      });
      assert.strictEqual(secondRes.status, 200);
      assert.strictEqual(secondRes.data.success, true);
      assert.strictEqual(secondRes.data.alreadyApproved, true);
      assert.strictEqual(secondRes.data.count, 3);

      // Verify Kanban tasks count is STILL exactly 3, NOT 6!
      const kanbanRes = await apiRequest('GET', '/api/kanban/tasks');
      assert.strictEqual(kanbanRes.status, 200);
      assert.strictEqual(kanbanRes.data.tasks.length, 3);
    });

    it('updates chat message approval state when messageId is provided', async () => {
      const saved = saveChatMessage('leader', {
        type: 'assistant',
        mode: 'leader',
        phase: 'awaiting_confirmation',
        plan: samplePlan,
        confirmation_prompt: 'Setujui rencana?'
      });

      const res = await apiRequest('POST', '/api/chat/approve-plan', {
        plan: samplePlan,
        planId: samplePlan.id,
        messageId: saved.id,
        mode: 'leader'
      });

      assert.strictEqual(res.status, 201);

      // Verify message in chat history has approval state
      const history = getChatHistory('leader');
      const updatedMsg = history.messages.find(m => m.id === saved.id);
      assert(updatedMsg.approval, 'Message must have approval recorded');
      assert.strictEqual(updatedMsg.approval.status, 'approved');
      assert.strictEqual(updatedMsg.approval.count, 3);
    });

    it('does not leak internal credentials or provider secrets in responses', async () => {
      const historyRes = await apiRequest('GET', '/api/chat/history');
      const historyStr = JSON.stringify(historyRes.data);
      assert(!historyStr.includes('api_key'), 'Must not leak api_key');
      assert(!historyStr.includes('secret'), 'Must not leak secret');
      assert(!historyStr.includes('password'), 'Must not leak password');

      const kanbanRes = await apiRequest('GET', '/api/kanban/tasks');
      const kanbanStr = JSON.stringify(kanbanRes.data);
      assert(!kanbanStr.includes('api_key'), 'Must not leak api_key');
      assert(!kanbanStr.includes('secret'), 'Must not leak secret');
    });

    it('safely handles concurrent writes without lost updates or corruption', async () => {
      const writeCount = 20;
      const promises = [];

      for (let i = 0; i < writeCount; i++) {
        promises.push(
          saveChatMessageSafe('leader', {
            type: 'user',
            mode: 'leader',
            text: `Concurrent message ${i + 1}`,
            index: i
          })
        );
      }

      await Promise.all(promises);

      const history = getChatHistory('leader');
      assert.strictEqual(history.messages.length, writeCount, 'All concurrent messages must be preserved without loss');
    });

    it('handles concurrent approval requests idempotently with no duplicate tasks', async () => {
      const concurrentApprovals = 10;
      const requests = [];

      for (let i = 0; i < concurrentApprovals; i++) {
        requests.push(
          apiRequest('POST', '/api/chat/approve-plan', {
            plan: samplePlan,
            planId: samplePlan.id
          })
        );
      }

      const results = await Promise.all(requests);
      // All requests must succeed
      for (const res of results) {
        assert(res.status === 200 || res.status === 201);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.count, 3);
      }

      // Exactly 3 tasks in Kanban, no duplicates
      const kanbanRes = await apiRequest('GET', '/api/kanban/tasks');
      assert.strictEqual(kanbanRes.status, 200);
      assert.strictEqual(kanbanRes.data.tasks.length, 3, 'Concurrent approvals must not create duplicate tasks');
    });

    it('enforces DoS limits on plan titles, task counts, and task content', async () => {
      // 1. Title exceeding MAX_PLAN_TITLE_LENGTH
      const longTitle = 'A'.repeat(STORAGE_LIMITS.MAX_PLAN_TITLE_LENGTH + 5);
      const res1 = await apiRequest('POST', '/api/chat/approve-plan', {
        plan: {
          title: longTitle,
          tasks: [{ title: 'Valid task' }]
        }
      });
      assert.strictEqual(res1.status, 400);
      assert(res1.data.details.includes('plan.title exceeds maximum length'));

      // 2. Tasks count exceeding MAX_TASKS_PER_PLAN
      const tooManyTasks = Array.from({ length: STORAGE_LIMITS.MAX_TASKS_PER_PLAN + 1 }, (_, i) => ({
        title: `Task ${i + 1}`
      }));
      const res2 = await apiRequest('POST', '/api/chat/approve-plan', {
        plan: {
          title: 'Too many tasks plan',
          tasks: tooManyTasks
        }
      });
      assert.strictEqual(res2.status, 400);
      assert(res2.data.details.includes('exceeds maximum allowed tasks'));

      // 3. Task title exceeding MAX_TASK_TITLE_LENGTH
      const res3 = await apiRequest('POST', '/api/chat/approve-plan', {
        plan: {
          title: 'Long task title plan',
          tasks: [{ title: 'T'.repeat(STORAGE_LIMITS.MAX_TASK_TITLE_LENGTH + 1) }]
        }
      });
      assert.strictEqual(res3.status, 400);
      assert(res3.data.details.includes('title exceeds maximum length'));

      // 4. Task description exceeding MAX_TASK_DESCRIPTION_LENGTH
      const res4 = await apiRequest('POST', '/api/chat/approve-plan', {
        plan: {
          title: 'Long description plan',
          tasks: [{
            title: 'Task valid',
            description: 'D'.repeat(STORAGE_LIMITS.MAX_TASK_DESCRIPTION_LENGTH + 10)
          }]
        }
      });
      assert.strictEqual(res4.status, 400);
      assert(res4.data.details.includes('description exceeds maximum length'));
    });

    it('guarantees unique non-colliding task IDs across multiple distinct plans', async () => {
      const planA = {
        title: 'Plan Alpha',
        tasks: [{ id: 'TASK-1', title: 'Task in Plan Alpha' }]
      };
      const planB = {
        title: 'Plan Beta',
        tasks: [{ id: 'TASK-1', title: 'Task in Plan Beta with colliding ID' }]
      };

      const resA = await apiRequest('POST', '/api/chat/approve-plan', { plan: planA });
      assert.strictEqual(resA.status, 201);
      const resB = await apiRequest('POST', '/api/chat/approve-plan', { plan: planB });
      assert.strictEqual(resB.status, 201);

      const kanbanRes = await apiRequest('GET', '/api/kanban/tasks');
      assert.strictEqual(kanbanRes.status, 200);
      assert.strictEqual(kanbanRes.data.tasks.length, 2);

      const taskA = kanbanRes.data.tasks.find(t => t.title === 'Task in Plan Alpha');
      const taskB = kanbanRes.data.tasks.find(t => t.title === 'Task in Plan Beta with colliding ID');
      assert(taskA && taskB);
      assert.notStrictEqual(taskA.id, taskB.id, 'Task IDs must not collide even when original IDs are identical');
    });

    it('PATCH /api/kanban/tasks/:id moves task across columns and updates status', async () => {
      await apiRequest('POST', '/api/chat/approve-plan', { plan: samplePlan });

      const patchRes = await apiRequest('PATCH', '/api/kanban/tasks/TASK-1', { column: 'in_progress' });
      assert.strictEqual(patchRes.status, 200);
      assert.strictEqual(patchRes.data.task.column, 'in_progress');
      assert.strictEqual(patchRes.data.task.status, 'in_progress');

      const patchDoneRes = await apiRequest('PATCH', '/api/kanban/tasks/TASK-1', { column: 'done' });
      assert.strictEqual(patchDoneRes.status, 200);
      assert.strictEqual(patchDoneRes.data.task.column, 'done');
      assert.strictEqual(patchDoneRes.data.task.status, 'done');
    });

    it('DELETE /api/kanban/tasks/:id removes task from Kanban', async () => {
      await apiRequest('POST', '/api/chat/approve-plan', { plan: samplePlan });

      const delRes = await apiRequest('DELETE', '/api/kanban/tasks/TASK-1');
      assert.strictEqual(delRes.status, 200);
      assert.strictEqual(delRes.data.task.id, 'TASK-1');

      const kanbanRes = await apiRequest('GET', '/api/kanban/tasks');
      assert.strictEqual(kanbanRes.data.tasks.length, 2);
      assert(!kanbanRes.data.tasks.some(t => t.id === 'TASK-1'));
    });

    it('POST /api/kanban/tasks creates a new custom task', async () => {
      const createRes = await apiRequest('POST', '/api/kanban/tasks', {
        title: 'Task Tambahan Tim',
        assignee: 'Sinta',
        role: 'Marketing / Growth',
        column: 'backlog'
      });
      assert.strictEqual(createRes.status, 201);
      assert.strictEqual(createRes.data.task.title, 'Task Tambahan Tim');
      assert.strictEqual(createRes.data.task.assignee, 'Sinta');
      assert.strictEqual(createRes.data.task.column, 'backlog');
    });

    it('POST /api/chat with "setuju" auto-approves pending plan into Kanban', async () => {
      // 1. Leader proposed a plan
      saveChatMessage('leader', {
        type: 'assistant',
        mode: 'leader',
        phase: 'awaiting_confirmation',
        plan: samplePlan,
        confirmation_prompt: 'Apakah rencana sudah sesuai? Balas "setuju"'
      });

      // 2. User replies "setuju"
      const res = await apiRequest('POST', '/api/chat', {
        message: 'setuju',
        mode: 'leader'
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.phase, 'approved');
      assert.strictEqual(res.data.kanbanCreated, true);
      assert.strictEqual(res.data.approval.status, 'approved');
      assert(res.data.reply.includes('Terima kasih, konfirmasi sudah saya terima'));

      // Verify tasks in Kanban
      const kanbanRes = await apiRequest('GET', '/api/kanban/tasks');
      assert.strictEqual(kanbanRes.status, 200);
      assert.strictEqual(kanbanRes.data.tasks.length, 3);
      assert.strictEqual(kanbanRes.data.tasks[0].assignee, 'Dimas');
    });
  });
});
