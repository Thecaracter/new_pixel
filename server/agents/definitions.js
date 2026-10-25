import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEAM_FILE = path.resolve(__dirname, '..', '..', 'data', 'team.json');

function getDynamicTeamMembers() {
  try {
    if (fs.existsSync(TEAM_FILE)) {
      const content = fs.readFileSync(TEAM_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data)) return data;
    }
  } catch (_) {}
  return [];
}

/**
 * Lightweight metadata for each built-in agent.
 * All name, role, description, and systemPrompt are stored in data/team.json
 * and loaded at runtime via getAgent(). Edit team.json to change agent behaviour
 * without touching this file.
 */
const AGENT_METADATA = {
  arif:  { id: 'arif',  domains: ['operations'], emoji: '🧑‍💼' },
  bayu:  { id: 'bayu',  domains: ['engineering'], emoji: '💻' },
  dimas: { id: 'dimas', domains: ['design'], emoji: '🎨' },
  doni:  { id: 'doni',  domains: ['operations', 'general'], emoji: '🧪' },
  fajar: { id: 'fajar', domains: ['operations', 'general'], emoji: '🛠️' },
  rina:  { id: 'rina',  domains: ['finance'], emoji: '💰' },
  sinta: { id: 'sinta', domains: ['marketing'], emoji: '🚀' },
  mira:  { id: 'mira',  domains: ['sales'], emoji: '🤝' },
  eko:   { id: 'eko',   domains: ['operations'], emoji: '📋' },
};

/**
 * Get agent definition by ID.
 * Source of truth: data/team.json (name, role, description, systemPrompt, model, active).
 * Merged with lightweight metadata (domains, emoji) from AGENT_METADATA.
 * Custom agents from team.json that are not in AGENT_METADATA still work via
 * their own domains/emoji fields in the JSON, with a generated fallback systemPrompt.
 */
export function getAgent(agentId) {
  if (!agentId || typeof agentId !== 'string') return null;
  const normalizedId = agentId.toLowerCase().trim();
  const dynamicMembers = getDynamicTeamMembers();
  const member = dynamicMembers.find(m => m.id && m.id.toLowerCase() === normalizedId);

  if (!member) return null;

  const meta = AGENT_METADATA[normalizedId] || {};

  const fallbackSystemPrompt =
    `Anda adalah ${member.name}, ${member.role} di Pixel Works Virtual Office.\n` +
    `Keahlian Anda: ${member.description || member.role}.\n` +
    `Tugas Anda adalah menyelesaikan sub-task yang didelegasikan oleh Arif secara profesional, teliti, dan realistis.\n\n` +
    `FORMAT RESPONSE (JSON):\n` +
    `{\n  "summary": "Ringkasan hasil kerja ${member.name}",\n` +
    `  "result": {},\n  "needs_input_from": [],\n  "tools_used": [],\n` +
    `  "confidence": "high" | "medium" | "low"\n}`;

  return {
    id: member.id,
    name: member.name,
    role: member.role,
    emoji: meta.emoji || member.emoji || '👤',
    domains: meta.domains || member.domains || ['operations', 'general'],
    model: member.model || null,
    active: member.active !== false,
    description: member.description || `Membantu bidang ${member.role}`,
    systemPrompt: member.systemPrompt || fallbackSystemPrompt,
  };
}

/**
 * Get all agent definitions (including custom ones from team.json).
 * If activeOnly=true, agents with active=false are excluded.
 */
export function getAllAgents(activeOnly = true) {
  const dynamicMembers = getDynamicTeamMembers();
  const result = [];
  const seenIds = new Set();

  // team.json is the primary source — iterate in order declared there
  for (const m of dynamicMembers) {
    if (activeOnly && m.active === false) continue;
    const agent = getAgent(m.id);
    if (agent && !seenIds.has(agent.id)) {
      result.push(agent);
      seenIds.add(agent.id);
    }
  }

  // Safety fallback: include built-in agents not present in team.json
  for (const id of Object.keys(AGENT_METADATA)) {
    if (!seenIds.has(id)) {
      const agent = getAgent(id);
      if (agent) result.push(agent);
    }
  }

  return result;
}

/**
 * Get non-orchestrator agents (everyone except Arif).
 */
export function getWorkerAgents(activeOnly = true) {
  return getAllAgents(activeOnly).filter(a => a.id !== 'arif');
}

/**
 * Get agent IDs for a given domain.
 */
export function getAgentsForDomain(domain) {
  return getAllAgents(true)
    .filter(a => a.domains.includes(domain))
    .map(a => a.id);
}

export default AGENT_METADATA;
