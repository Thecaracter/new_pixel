import { executeCatalogTool } from './catalogRunner.js';
/**
 * MCP Server — handles tool discovery, execution, and resource management.
 * Single server instance that exposes all domain tools to agents.
 */

import { ALL_TOOLS, TOOLS_BY_DOMAIN, findTool, executeTool, getToolNamesForDomain } from './tools.js';

class MCPServer {
  constructor() {
    this.executionLog = [];
  }

  /**
   * List all available tools, optionally filtered by domain
   */
  listTools(domain = null) {
    const tools = domain ? (TOOLS_BY_DOMAIN[domain] || []) : ALL_TOOLS;
    return tools.map(t => ({
      name: t.name,
      description: t.description,
      domain: t.domain,
      parameters: t.parameters
    }));
  }

  /**
   * List available domains
   */
  listDomains() {
    return Object.keys(TOOLS_BY_DOMAIN);
  }

  /**
   * Get tool names for a specific domain
   */
  getToolsForDomain(domain) {
    return getToolNamesForDomain(domain);
  }

  /**
   * Execute a tool call from an agent
   * @param {string} agentId - Which agent is calling
   * @param {string} toolName - Tool to execute
   * @param {object} args - Tool arguments
   * @returns {Promise<{success: boolean, result?: any, error?: string}>}
   */
  async callTool(agentId, toolName, args) {
    const tool = findTool(toolName);
    if (!tool) {
      return { success: false, error: `Tool "${toolName}" not found` };
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      agentId,
      toolName,
      domain: tool.domain,
      args,
      result: null,
      error: null
    };

    try {
      const result = await executeTool(toolName, args);
      logEntry.result = result;
      this.executionLog.push(logEntry);
      return { success: true, result };
    } catch (err) {
      logEntry.error = err.message;
      this.executionLog.push(logEntry);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get execution history, optionally filtered
   */
  getExecutionLog(filter = {}) {
    let log = this.executionLog;
    if (filter.agentId) log = log.filter(e => e.agentId === filter.agentId);
    if (filter.domain) log = log.filter(e => e.domain === filter.domain);
    if (filter.limit) log = log.slice(-filter.limit);
    return log;
  }

  /**
   * Format tools as a description string for LLM system prompts
   */
  describeToolsForAgent(allowedDomains) {
    const tools = allowedDomains.flatMap(d => TOOLS_BY_DOMAIN[d] || []);
    if (tools.length === 0) return 'Tidak ada tools khusus yang tersedia.';

    return tools.map(t => {
      const params = t.parameters.properties
        ? Object.entries(t.parameters.properties)
            .map(([k, v]) => `  - ${k}: ${v.type}${v.description ? ` (${v.description})` : ''}`)
            .join('\n')
        : '  (no parameters)';
      return `🔧 ${t.name} [${t.domain}]\n   ${t.description}\n   Parameters:\n${params}`;
    }).join('\n\n');
  }
}

// Singleton instance
const mcpServer = new MCPServer();
export default mcpServer;
export { MCPServer };
