import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from '../server/index.js';
import { setStoragePaths, resetStoragePaths } from '../server/storage.js';

describe('HTTP /api/chat Contract Integration Tests', () => {
  let testServer;
  let serverPort;
  const testChatFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.tmp_test_api_chat.json');

  before(async () => {
    setStoragePaths({ chatFile: testChatFile });
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
      if (fs.existsSync(testChatFile)) {
        fs.unlinkSync(testChatFile);
      }
    } catch (_) {}
  });

  function postChat(body) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify(body);
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: serverPort,
          path: '/api/chat',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        },
        (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve({ status: res.statusCode, data: parsed });
            } catch (err) {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        }
      );
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  function getTeam() {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: serverPort,
          path: '/api/team',
          method: 'GET'
        },
        (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve({ status: res.statusCode, data: parsed });
            } catch (err) {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        }
      );
      req.on('error', reject);
      req.end();
    });
  }

  it('rejects empty message with 400', async () => {
    const res = await postChat({ message: '   ' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.error, 'Invalid request');
  });

  it('rejects invalid model format with 400', async () => {
    const res = await postChat({ message: 'hello', model: 'invalid model name with spaces' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.error, 'Invalid model');
  });

  it('validates backward-compatible standard chat response shape', async () => {
    const res = await postChat({ message: 'halo' });
    if (res.status === 200) {
      assert(typeof res.data.reply === 'string');
      assert.strictEqual(res.data.mode, 'chat');
      assert.strictEqual(res.data.phase, 'chat');
    } else {
      assert.strictEqual(res.status, 503);
      assert.strictEqual(res.data.error, 'OpenCode service unavailable');
    }
  });

  it('validates leader mode contract structure when mode is leader or leader is true', async () => {
    const res = await postChat({ message: 'Tolong koordinasikan project baru kita', mode: 'leader' });
    if (res.status === 200) {
      assert.strictEqual(res.data.mode, 'leader');
      assert(['clarifying', 'planned', 'awaiting_confirmation'].includes(res.data.phase));
      assert(Array.isArray(res.data.questions));
      assert('plan' in res.data);
      assert('confirmation_prompt' in res.data);
      assert.strictEqual(typeof res.data.valid, 'boolean');
    } else {
      assert.strictEqual(res.status, 503);
      assert.strictEqual(res.data.error, 'OpenCode service unavailable');
    }
  });

  it('exposes GET /api/team with full team roster including Sinta and Arif', async () => {
    const res = await getTeam();
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.members));
    assert(res.data.members.some(m => m.id === 'sinta' && m.name === 'Sinta'));
    assert(res.data.members.some(m => m.id === 'arif' && m.name === 'Arif'));
  });

  it('processes delegation to Sinta in leader mode without claiming to be generic opencode', async () => {
    const res = await postChat({
      message: 'Arif, tugaskan Sinta untuk membuat campaign login',
      mode: 'leader'
    });

    if (res.status === 200) {
      assert.strictEqual(res.data.mode, 'leader');
      assert(['clarifying', 'planned', 'awaiting_confirmation'].includes(res.data.phase));
      assert(Array.isArray(res.data.roster));
      const sintaInRoster = res.data.roster.find(m => m.id === 'sinta');
      assert(sintaInRoster, 'Roster must contain Sinta');

      const replyLower = (res.data.reply || '').toLowerCase();
      assert(!replyLower.includes('saya opencode, bukan arif'), 'Must not claim to be generic opencode');
    } else {
      assert.strictEqual(res.status, 503);
      assert.strictEqual(res.data.error, 'OpenCode service unavailable');
    }
  });

  it('isolates sessions between leader mode and standard chat mode', async () => {
    const chatRes = await postChat({ message: 'halo ini chat biasa' });
    const leaderRes = await postChat({ message: 'Arif, mulai koordinasi sprint', mode: 'leader' });

    if (chatRes.status === 200 && leaderRes.status === 200) {
      assert.strictEqual(chatRes.data.mode, 'chat');
      assert.strictEqual(leaderRes.data.mode, 'leader');
      // If session IDs are generated, they should be independent
      if (chatRes.data.sessionId && leaderRes.data.sessionId) {
        assert.notStrictEqual(chatRes.data.sessionId, leaderRes.data.sessionId);
      }
    }
  });
});
