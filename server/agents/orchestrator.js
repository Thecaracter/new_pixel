/**
 * Orchestrator — Arif's brain. Analyzes user requests, delegates to agents,
 * facilitates inter-agent discussion, and compiles final responses.
 *
 * Uses the existing opencode CLI for LLM calls, same as the current backend.
 */

import { getAgent, getAllAgents, getWorkerAgents } from './definitions.js';
import mcpServer from '../mcp/server.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __rootdir = path.resolve(__dirname, '..', '..');

/**
 * Session store for multi-agent conversations
 */
const agentSessions = new Map();

function getSession(sessionId) {
  if (!agentSessions.has(sessionId)) {
    agentSessions.set(sessionId, {
      id: sessionId,
      history: [],           // Full conversation history
      agentContexts: {},     // Per-agent conversation context
      delegations: [],       // Active delegations
      discussions: [],       // Inter-agent discussions
      toolResults: [],       // MCP tool execution results
      createdAt: new Date().toISOString()
    });
  }
  return agentSessions.get(sessionId);
}

/**
 * Call LLM via opencode CLI for a specific agent
 */
async function callLLM(opencodeBin, model, systemPrompt, userMessage, sessionId) {
  return new Promise((resolve, reject) => {
    const args = ['run', '--format', 'json'];
    if (model) args.push('--model', model);
    if (sessionId) args.push('--session', sessionId);
    args.push('-');

    const sanitizedUser = userMessage
      .replace(/\[\/?(?:SYSTEM INSTRUCTION|USER REQUEST|INSTRUCTION)\]/gi, '[REDACTED]');

    const fullPrompt = `[SYSTEM INSTRUCTION]\n${systemPrompt}\n[/SYSTEM INSTRUCTION]\n\n[USER REQUEST]\n${sanitizedUser}\n[/USER REQUEST]`;

    let stdout = '';
    let stderr = '';
    const textContent = [];
    let resolvedSessionId = null;

    const child = spawn(opencodeBin, args, {
      cwd: __rootdir,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    child.stdin.write(fullPrompt, 'utf8');
    child.stdin.end();

    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });

    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('Agent LLM call timeout (90s)'));
    }, 90000);

    child.on('close', code => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`LLM call failed (code ${code}): ${stderr}`));
        return;
      }
      if (!stdout.trim()) {
        reject(new Error('LLM returned empty response'));
        return;
      }

      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          if (!resolvedSessionId && event.sessionID) resolvedSessionId = event.sessionID;
          if (event.type === 'text' && event.part && event.part.text) {
            textContent.push(event.part.text);
          }
        } catch (_) {}
      }

      resolve({
        text: textContent.join('\n') || 'No response',
        sessionId: resolvedSessionId
      });
    });

    child.on('error', err => {
      clearTimeout(timeout);
      reject(new Error(`Failed to call LLM: ${err.message}`));
    });
  });
}

/**
 * Parse JSON from agent response (same logic as extractStructuredJson)
 */
function parseAgentResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch (_) {}
  }

  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(rawText.slice(firstBrace, lastBrace + 1)); } catch (_) {}
  }

  return null;
}

/**
 * Build context string describing available tools for an agent
 */
function buildAgentToolContext(agentDef) {
  const toolsDesc = mcpServer.describeToolsForAgent(agentDef.domains);
  return `\nTOOLS YANG TERSEDIA UNTUK ANDA:\n${toolsDesc}\n\nUntuk menggunakan tool, sertakan dalam response JSON:\n"tool_calls": [{"name": "tool_name", "args": {...}}]`;
}

/**
 * Execute an agent's task — call LLM with agent's system prompt + task context
 */
async function executeAgentTask(opencodeBin, model, agentId, task, context, session) {
  const agentDef = getAgent(agentId);
  if (!agentDef) throw new Error(`Agent "${agentId}" not found`);
  if (agentDef.active === false) {
    throw new Error(`Agent "${agentDef.name}" sedang non-aktif`);
  }

  const toolContext = buildAgentToolContext(agentDef);
  const fullSystemPrompt = agentDef.systemPrompt + toolContext;

  const taskMessage = context
    ? `TUGAS: ${task}\n\nKONTEKS TAMBAHAN:\n${context}`
    : `TUGAS: ${task}`;

  const agentSessionId = session.agentContexts[agentId]?.sessionId || null;
  const agentModel = agentDef.model || model;

  console.log(`  🤖 Agent ${agentDef.name} (${agentDef.role}) [Model: ${agentModel || 'global default'}] mulai mengerjakan...`);

  const result = await callLLM(opencodeBin, agentModel, fullSystemPrompt, taskMessage, agentSessionId);

  // Store agent session for continuity
  if (!session.agentContexts[agentId]) {
    session.agentContexts[agentId] = { sessionId: null, history: [] };
  }
  if (result.sessionId) {
    session.agentContexts[agentId].sessionId = result.sessionId;
  }
  session.agentContexts[agentId].history.push({
    task,
    response: result.text,
    timestamp: new Date().toISOString()
  });

  // Parse structured response
  const parsed = parseAgentResponse(result.text);

  // Execute any tool calls from the agent
  let toolResults = [];
  if (parsed && Array.isArray(parsed.tool_calls)) {
    for (const call of parsed.tool_calls) {
      const toolResult = await mcpServer.callTool(agentId, call.name, call.args || {});
      toolResults.push({ tool: call.name, ...toolResult });
    }
    session.toolResults.push(...toolResults.map(tr => ({ agentId, ...tr })));
  }

  return {
    agentId,
    agentName: agentDef.name,
    agentRole: agentDef.role,
    agentEmoji: agentDef.emoji,
    rawResponse: result.text,
    parsed,
    toolResults,
    needsInputFrom: parsed?.needs_input_from || [],
    summary: parsed?.summary || result.text,
    confidence: parsed?.confidence || 'medium'
  };
}

/**
 * Main orchestration flow:
 * 1. Arif analyzes the request
 * 2. Arif delegates to relevant agents
 * 3. Agents work (possibly requesting input from each other)
 * 4. Arif compiles final response
 */
export async function orchestrate(opencodeBin, model, userMessage, sessionId) {
  const session = getSession(sessionId || `session-${Date.now()}`);

  session.history.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString()
  });

  // Step 1: Arif analyzes and decides delegation
  console.log('📋 Step 1: Arif menganalisis permintaan...');
  const arifDef = getAgent('arif');
  const arifModel = arifDef?.model || model;
  const workerList = getWorkerAgents(true)
    .map(a => `- ${a.name} (${a.role}) [${a.emoji}]: ${a.description}`)
    .join('\n');

  const analysisPrompt = `${arifDef.systemPrompt}

DAFTAR AGENT YANG BISA DIDELEGASIKAN:
${workerList}

TOOLS YANG TERSEDIA DI SISTEM:
${mcpServer.listTools().map(t => `- ${t.name} [${t.domain}]: ${t.description}`).join('\n')}

Analisis permintaan user berikut dan tentukan:
1. Agent mana yang perlu dilibatkan
2. Task spesifik untuk masing-masing agent
3. Apakah ada yang perlu diklarifikasi dulu

PENTING: Jika informasi sudah cukup, langsung delegasikan. Jika belum, tanyakan klarifikasi.`;

  const arifResult = await callLLM(
    opencodeBin, arifModel, analysisPrompt, userMessage,
    session.agentContexts.arif?.sessionId || null
  );

  if (!session.agentContexts.arif) session.agentContexts.arif = { sessionId: null, history: [] };
  if (arifResult.sessionId) session.agentContexts.arif.sessionId = arifResult.sessionId;

  const arifParsed = parseAgentResponse(arifResult.text);

  // If Arif needs clarification, return questions
  if (arifParsed?.action === 'clarify' || (!arifParsed?.delegations?.length && arifParsed?.questions?.length)) {
    const response = {
      phase: 'clarifying',
      summary: arifParsed?.summary || arifResult.text,
      questions: arifParsed?.questions || [],
      delegations: [],
      agentResults: [],
      discussions: [],
      plan: null,
      confirmation_prompt: null,
      sessionId: session.id
    };
    session.history.push({ role: 'orchestrator', content: response, timestamp: new Date().toISOString() });
    return response;
  }

  // Step 2: Execute delegations
  const delegations = arifParsed?.delegations || [];
  const agentResults = [];

  if (delegations.length > 0) {
    console.log(`📋 Step 2: Mendelegasikan ke ${delegations.length} agent...`);

    for (const delegation of delegations) {
      try {
        const result = await executeAgentTask(
          opencodeBin, model,
          delegation.agent_id,
          delegation.task,
          delegation.context || '',
          session
        );
        agentResults.push(result);

        // Step 3: Handle inter-agent discussions if needed
        if (result.needsInputFrom && result.needsInputFrom.length > 0) {
          console.log(`  💬 ${result.agentName} butuh input dari agent lain...`);

          for (const inputReq of result.needsInputFrom) {
            const targetAgentId = inputReq.agent_id;
            const question = inputReq.question;

            try {
              const discussionResult = await executeAgentTask(
                opencodeBin, model,
                targetAgentId,
                `${result.agentName} bertanya: "${question}"`,
                `Konteks: ${result.agentName} sedang mengerjakan: ${delegation.task}`,
                session
              );

              session.discussions.push({
                from: result.agentId,
                to: targetAgentId,
                question,
                answer: discussionResult.summary,
                timestamp: new Date().toISOString()
              });

              agentResults.push({
                ...discussionResult,
                isDiscussionReply: true,
                replyTo: result.agentId,
                originalQuestion: question
              });
            } catch (err) {
              console.error(`  ❌ Diskusi gagal: ${err.message}`);
            }
          }
        }
      } catch (err) {
        console.error(`  ❌ Agent ${delegation.agent_id} gagal: ${err.message}`);
        agentResults.push({
          agentId: delegation.agent_id,
          agentName: delegation.agent_id,
          error: err.message,
          summary: `Error: ${err.message}`
        });
      }
    }
  }

  // Step 4: Arif compiles final response
  console.log('📋 Step 4: Arif menyusun laporan akhir...');

  const agentResultsSummary = agentResults.map(r => {
    if (r.error) return `❌ ${r.agentName}: Error - ${r.error}`;
    const toolInfo = r.toolResults?.length > 0
      ? `\n   Tools used: ${r.toolResults.map(t => t.tool).join(', ')}`
      : '';
    const discussionTag = r.isDiscussionReply
      ? ` (menjawab pertanyaan dari ${r.replyTo})`
      : '';
    return `${r.agentEmoji} ${r.agentName} (${r.agentRole})${discussionTag}:\n   ${r.summary}${toolInfo}`;
  }).join('\n\n');

  const compilationPrompt = `Anda adalah Arif, Project Lead. Kompilasi hasil kerja tim berikut menjadi laporan terstruktur untuk user.

HASIL KERJA AGENT:
${agentResultsSummary}

DISKUSI ANTAR AGENT:
${session.discussions.length > 0
    ? session.discussions.map(d => `${d.from} → ${d.to}: "${d.question}" → "${d.answer}"`).join('\n')
    : 'Tidak ada diskusi antar agent.'}

Buat ringkasan yang jelas dan terstruktur. Sertakan:
1. Summary keseluruhan
2. Hasil dari masing-masing agent
3. Rekomendasi next steps

FORMAT RESPONSE (JSON):
{
  "summary": "Ringkasan keseluruhan dari Arif",
  "plan": {
    "title": "Judul rencana",
    "goal": "Tujuan",
    "scope": "Ruang lingkup",
    "tasks": [
      {
        "id": "TASK-1",
        "title": "Judul tugas",
        "assignee": "Nama agent",
        "role": "Peran",
        "description": "Deskripsi + hasil",
        "status": "completed" | "pending"
      }
    ]
  },
  "discussions": [{"from": "agent", "to": "agent", "topic": "..."}],
  "next_steps": ["..."],
  "confirmation_prompt": "Pertanyaan ke user jika perlu konfirmasi"
}`;

  const finalResult = await callLLM(
    opencodeBin, arifModel, compilationPrompt,
    `Kompilasi hasil kerja tim untuk permintaan: "${userMessage}"`,
    session.agentContexts.arif?.sessionId || null
  );

  const finalParsed = parseAgentResponse(finalResult.text);

  const response = {
    phase: finalParsed?.confirmation_prompt ? 'awaiting_confirmation' : 'planned',
    summary: finalParsed?.summary || finalResult.text,
    questions: [],
    delegations: delegations.map(d => ({
      agent_id: d.agent_id,
      task: d.task,
      agentName: getAgent(d.agent_id)?.name || d.agent_id,
      agentEmoji: getAgent(d.agent_id)?.emoji || '🤖'
    })),
    agentResults: agentResults.map(r => ({
      agentId: r.agentId,
      agentName: r.agentName,
      agentRole: r.agentRole,
      agentEmoji: r.agentEmoji,
      summary: r.summary,
      confidence: r.confidence,
      toolResults: r.toolResults || [],
      isDiscussionReply: r.isDiscussionReply || false,
      error: r.error || null
    })),
    discussions: session.discussions.slice(-10),
    plan: finalParsed?.plan || null,
    confirmation_prompt: finalParsed?.confirmation_prompt || null,
    next_steps: finalParsed?.next_steps || [],
    sessionId: session.id
  };

  session.history.push({ role: 'orchestrator', content: response, timestamp: new Date().toISOString() });

  return response;
}

/**
 * Clear a session
 */
export function clearSession(sessionId) {
  agentSessions.delete(sessionId);
}

/**
 * Get session info
 */
export function getSessionInfo(sessionId) {
  return agentSessions.get(sessionId) || null;
}
