import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  setStoragePaths,
  resetStoragePaths,
  getChatThreads,
  getChatThread,
  createChatThread,
  setActiveChatThread,
  deleteChatThread,
  updateChatThread,
  saveChatMessage,
  getKanbanProjects,
  createKanbanProject,
  deleteKanbanProject,
  getKanbanTasks,
  createKanbanTask
} from '../server/storage.js';

describe('Multi-Thread Chat & Project-Scoped Kanban Tests', () => {
  const tmpDir = path.dirname(fileURLToPath(import.meta.url));
  const testChatFile = path.join(tmpDir, '..', '.tmp_test_threads_chat.json');
  const testKanbanFile = path.join(tmpDir, '..', '.tmp_test_threads_kanban.json');

  before(() => {
    setStoragePaths({
      chatFile: testChatFile,
      kanbanFile: testKanbanFile
    });
  });

  after(() => {
    resetStoragePaths();
    try {
      if (fs.existsSync(testChatFile)) fs.unlinkSync(testChatFile);
      if (fs.existsSync(testKanbanFile)) fs.unlinkSync(testKanbanFile);
    } catch (_) {}
  });

  describe('Chat Thread Management', () => {
    it('creates a new thread and sets it as active', () => {
      const thread = createChatThread('leader', { title: 'Proyek Kampanye Q3' });
      assert.ok(thread.id, 'Thread should have an id');
      assert.equal(thread.title, 'Proyek Kampanye Q3');

      const threadsData = getChatThreads('leader');
      assert.ok(Array.isArray(threadsData.threads));
      assert.equal(threadsData.activeThreadId, thread.id);
    });

    it('isolates messages inside specific thread', () => {
      const thread1 = createChatThread('leader', { title: 'Thread 1 - Desain UI' });
      saveChatMessage('leader', { text: 'Pesan Desain 1', type: 'user' }, 'sess_1', thread1.id);

      const thread2 = createChatThread('leader', { title: 'Thread 2 - Backend API' });
      saveChatMessage('leader', { text: 'Pesan Backend 1', type: 'user' }, 'sess_2', thread2.id);

      const fetched1 = getChatThread('leader', thread1.id);
      const fetched2 = getChatThread('leader', thread2.id);

      assert.ok(fetched1.messages.some(m => m.text === 'Pesan Desain 1'));
      assert.ok(!fetched1.messages.some(m => m.text === 'Pesan Backend 1'));

      assert.ok(fetched2.messages.some(m => m.text === 'Pesan Backend 1'));
      assert.ok(!fetched2.messages.some(m => m.text === 'Pesan Desain 1'));
    });

    it('switches active thread safely', () => {
      const threadA = createChatThread('leader', { title: 'Sesi A' });
      const threadB = createChatThread('leader', { title: 'Sesi B' });

      assert.equal(getChatThreads('leader').activeThreadId, threadB.id);

      const updated = setActiveChatThread('leader', threadA.id);
      assert.equal(updated.id, threadA.id);
      assert.equal(getChatThreads('leader').activeThreadId, threadA.id);
    });

    it('deletes a thread without corrupting other threads', () => {
      const threadToDelete = createChatThread('leader', { title: 'Thread Dihapus' });
      const threadToKeep = createChatThread('leader', { title: 'Thread Bertahan' });

      assert.equal(getChatThreads('leader').activeThreadId, threadToKeep.id);

      const deleted = deleteChatThread('leader', threadToDelete.id);
      assert.ok(deleted);
      assert.equal(deleted.id, threadToDelete.id);

      const threadsData = getChatThreads('leader');
      assert.ok(!threadsData.threads.some(t => t.id === threadToDelete.id));
      assert.ok(threadsData.threads.some(t => t.id === threadToKeep.id));
    });
  });

  describe('Project-Scoped Kanban', () => {
    it('creates and retrieves separate projects', () => {
      const proj = createKanbanProject({
        name: 'Proyek Migrasi Database',
        description: 'Upgrade ke PostgreSQL 16'
      });

      assert.ok(proj.id);
      assert.equal(proj.name, 'Proyek Migrasi Database');

      const projects = getKanbanProjects();
      assert.ok(projects.some(p => p.id === proj.id));
    });

    it('filters kanban tasks strictly by projectId', () => {
      const projA = createKanbanProject({ name: 'Alpha Project' });
      const projB = createKanbanProject({ name: 'Beta Project' });

      createKanbanTask({
        title: 'Task Alpha 1',
        projectId: projA.id,
        assignee: 'Bayu',
        column: 'backlog'
      });

      createKanbanTask({
        title: 'Task Beta 1',
        projectId: projB.id,
        assignee: 'Sinta',
        column: 'in_progress'
      });

      const alphaTasks = getKanbanTasks(projA.id);
      const betaTasks = getKanbanTasks(projB.id);
      const allTasks = getKanbanTasks();

      assert.equal(alphaTasks.length, 1);
      assert.equal(alphaTasks[0].title, 'Task Alpha 1');

      assert.equal(betaTasks.length, 1);
      assert.equal(betaTasks[0].title, 'Task Beta 1');

      assert.ok(allTasks.length >= 2);
    });

    it('deletes project and its scoped tasks', () => {
      const proj = createKanbanProject({ name: 'Proyek Sementara' });
      createKanbanTask({
        title: 'Tugas Hapus',
        projectId: proj.id,
        assignee: 'Eko'
      });

      assert.equal(getKanbanTasks(proj.id).length, 1);

      const res = deleteKanbanProject(proj.id);
      assert.equal(res.success, true);

      assert.equal(getKanbanTasks(proj.id).length, 0);
      assert.ok(!getKanbanProjects().some(p => p.id === proj.id));
    });
  });
});
