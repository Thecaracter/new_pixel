import test from 'node:test';
import assert from 'node:assert/strict';
import { MCP_CATALOG, searchCatalog, getCatalogItem } from '../server/mcp/catalog.js';
import { executeCatalogTool } from '../server/mcp/catalogRunner.js';

test('MCP Catalog & Search Suite', async (t) => {
  await t.test('catalog should contain curated MCP servers and skills', () => {
    assert.ok(MCP_CATALOG.length >= 8, 'Catalog should have at least 8 curated tools');
    const github = MCP_CATALOG.find(i => i.id.includes('github'));
    assert.ok(github, 'GitHub MCP must exist');
    assert.equal(github.type, 'mcp');
    assert.equal(github.category, 'engineering');
    assert.ok(github.tools.length >= 2, 'GitHub MCP must expose tools');
  });

  await t.test('searchCatalog filters and queries live packages correctly', async () => {
    const playwrightResults = await searchCatalog({ query: 'playwright' });
    assert.ok(playwrightResults.length >= 1, 'Should find Playwright packages');
    assert.ok(playwrightResults.some(r => r.name.toLowerCase().includes('playwright')));

    const engineeringResults = await searchCatalog({ category: 'engineering' });
    assert.ok(engineeringResults.length >= 3);
    assert.ok(engineeringResults.every(e => e.category === 'engineering'));
  });

  await t.test('executeCatalogTool executes web search and testing tools', async () => {
    const searchRes = await executeCatalogTool('web_search_query', { query: 'Three.js' });
    assert.equal(searchRes.query, 'Three.js');
    assert.ok(searchRes.results.length > 0);

    const testRes = await executeCatalogTool('playwright_run_test_suite', { specName: 'login' });
    assert.equal(testRes.status, 'PASSED');
    assert.equal(testRes.specName, 'login');
  });
});
