import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { app } from './server.js';

describe('HTTP /api/chat Contract Integration Tests', () => {
  let testServer;
  let serverPort;

  before(async () => {
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
});
