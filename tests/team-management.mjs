import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { app, TEAM_MEMBERS, buildLeaderSystemPrompt } from '../server/index.js';
import { getAgent, getAllAgents, getWorkerAgents } from '../server/agents/definitions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const teamJsonPath = path.join(__dirname, '..', 'data', 'team.json');

describe('Team & Agent Management Contract Tests', () => {
  let testServer;
  let serverPort;
  let originalTeamJson = '';

  before(async () => {
    try {
      originalTeamJson = fs.readFileSync(teamJsonPath, 'utf8');
    } catch (_) {}

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
    if (originalTeamJson) {
      try {
        fs.writeFileSync(teamJsonPath, originalTeamJson);
      } catch (_) {}
    }
  });

  function apiRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: serverPort,
          path,
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
              resolve({ status: res.statusCode, data: parsed });
            } catch (err) {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        }
      );
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  it('GET /api/team returns team members list', async () => {
    const res = await apiRequest('GET', '/api/team');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.members));
    assert(res.data.members.length >= 7);
  });

  it('POST /api/team adds a new agent with specific model', async () => {
    const newAgent = {
      name: 'Farhan',
      role: 'DevOps Engineer',
      description: 'Setup CI/CD and deployment',
      model: 'opencode/big-pickle',
      shirtColor: '#38bdf8'
    };
    const res = await apiRequest('POST', '/api/team', newAgent);
    assert.strictEqual(res.status, 201);
    assert(res.data.success);
    assert.strictEqual(res.data.member.name, 'Farhan');
    assert.strictEqual(res.data.member.role, 'DevOps Engineer');
    assert.strictEqual(res.data.member.model, 'opencode/big-pickle');
    assert.strictEqual(res.data.member.active, true);

    // Verify it is now present in getAgent
    const agentDef = getAgent(res.data.member.id);
    assert(agentDef);
    assert.strictEqual(agentDef.name, 'Farhan');
    assert.strictEqual(agentDef.model, 'opencode/big-pickle');
  });

  it('PUT /api/team/:id updates an agent status and model', async () => {
    // Update Rina's model and active status
    const res = await apiRequest('PUT', '/api/team/rina', {
      model: '9router/kr/claude-sonnet-4.5',
      active: true
    });
    assert.strictEqual(res.status, 200);
    assert(res.data.success);
    assert.strictEqual(res.data.member.model, '9router/kr/claude-sonnet-4.5');

    // Verify definitions.js picks up Rina's new model
    const rinaDef = getAgent('rina');
    assert.strictEqual(rinaDef.model, '9router/kr/claude-sonnet-4.5');
  });

  it('PUT /api/team/:id can deactivate an agent', async () => {
    const res = await apiRequest('PUT', '/api/team/dimas', {
      active: false
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.member.active, false);

    // Restore Dimas active status for future tests
    await apiRequest('PUT', '/api/team/dimas', { active: true });
  });

  it('DELETE /api/team/:id deactivates default member without removing', async () => {
    const res = await apiRequest('DELETE', '/api/team/sinta');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.action, 'deactivated');
    assert.strictEqual(res.data.member.active, false);

    // Restore Sinta for cleanliness
    await apiRequest('PUT', '/api/team/sinta', { active: true });
  });

  it('buildLeaderSystemPrompt reflects dynamic team members', () => {
    const customPrompt = buildLeaderSystemPrompt([
      { name: 'Arif', role: 'Project Lead', description: 'Lead', active: true },
      { name: 'Farhan', role: 'Cloud DevOps', description: 'Infra', active: true }
    ]);
    assert(customPrompt.includes('Farhan'));
    assert(customPrompt.includes('Cloud DevOps'));
  });
});
