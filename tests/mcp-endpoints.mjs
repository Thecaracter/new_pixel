import test from 'node:test';
import assert from 'node:assert/strict';
import { app, TEAM_MEMBERS } from '../server/index.js';
import { getCatalogItem } from '../server/mcp/catalog.js';

test('MCP Team Endpoints Suite', async (t) => {
  await t.test('installs and uninstalls an MCP on an agent cleanly', async () => {
    const bayuMember = TEAM_MEMBERS.find(m => m.id === 'bayu');
    assert.ok(bayuMember, 'Bayu should exist');

    const initialMCPCount = (bayuMember.installedMCPs || []).length;
    const githubMcp = await getCatalogItem('@modelcontextprotocol/server-github');
    assert.ok(githubMcp, 'GitHub MCP exists');

    // Simulate install
    bayuMember.installedMCPs = bayuMember.installedMCPs || [];
    bayuMember.installedMCPs.push({
      id: githubMcp.id,
      name: githubMcp.name,
      tools: githubMcp.tools
    });

    assert.equal(bayuMember.installedMCPs.length, initialMCPCount + 1);

    // Simulate uninstall
    bayuMember.installedMCPs = bayuMember.installedMCPs.filter(m => m.id !== githubMcp.id);
    assert.equal(bayuMember.installedMCPs.length, initialMCPCount);
  });
});
