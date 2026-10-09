import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Find opencode executable path
let OPENCODE_BIN = 'opencode';
try {
  // Try to find opencode in PATH using the shell (cross-platform)
  let result = execSync(process.platform === 'win32' ? 'where opencode' : 'which opencode', {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore']
  }).trim();
  if (result) {
    // Clean up line endings and take first result
    result = result.split(/[\r\n]+/)[0];
    // On Windows, prefer .cmd over plain executable for Node spawn
    if (process.platform === 'win32' && !result.endsWith('.cmd')) {
      result = result + '.cmd';
    }
    OPENCODE_BIN = result;
    console.log(`Found OpenCode at: ${OPENCODE_BIN}`);
  }
} catch (e) {
  console.warn('Warning: Could not locate opencode executable, will try using PATH lookup');
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Store active session ID and model across requests
let currentSessionId = null;
let currentModel = null;

// Available models: can be configured via OPENCODE_MODELS env var (comma-separated)
// Format: "provider/model,provider/model" or use defaults
function getAvailableModels() {
  const envModels = process.env.OPENCODE_MODELS;
  if (envModels) {
    return envModels.split(',').map(m => m.trim()).filter(m => m);
  }
  // Default models (common providers)
  return [
    '9router/claude-haiku-4.5-thinking-agentic',
    '9router/claude-opus-4-1-latest',
    '9router/claude-sonnet-4-20250514'
  ];
}

/**
 * GET /api/models
 * Returns available models for selection
 * Returns: { models: string[], defaultModel: string|null, currentModel: string|null }
 */
app.get('/api/models', (req, res) => {
  const availableModels = getAvailableModels();
  res.json({
    models: availableModels,
    defaultModel: availableModels[0] || null,
    currentModel: currentModel || availableModels[0] || null
  });
});

/**
 * POST /api/chat
 * Accepts: { message: string, sessionId?: string, model?: string }
 * Returns: { reply: string, sessionId: string, model: string } or { error: string, details: string }
 */
app.post('/api/chat', async (req, res) => {
  const { message, sessionId, model } = req.body;

  // Validate input
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      error: 'Invalid request',
      details: 'message must be a non-empty string'
    });
  }

  const trimmedMessage = message.trim();
  
  // Validate and sanitize model selection
  let selectedModel = model || currentModel;
  if (selectedModel) {
    // Validate model format: should be provider/model
    if (!/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(selectedModel)) {
      return res.status(400).json({
        error: 'Invalid model',
        details: 'model must be in format provider/model'
      });
    }
  }
  
  // When model changes, reset session to avoid incompatibility
  let nextSessionId = sessionId;
  if (selectedModel && selectedModel !== currentModel) {
    console.log(`Model changed from ${currentModel} to ${selectedModel}, resetting session`);
    nextSessionId = null;
    currentModel = selectedModel;
  } else {
    nextSessionId = sessionId || currentSessionId;
  }

  try {
    // Build opencode command with JSON format for structured output
    const args = ['run', '--format', 'json'];
    
    // Add model if specified
    if (selectedModel) {
      args.push('--model', selectedModel);
    }
    
    if (nextSessionId) {
      args.push('--session', nextSessionId);
    }
    
    // Add the message as the final argument(s)
    args.push(trimmedMessage);

    // Execute opencode run
    const result = await executeOpencode(args);

    // Update session and model tracking
    if (result.sessionId) {
      nextSessionId = result.sessionId;
      currentSessionId = result.sessionId;
    }
    
    if (!currentModel && selectedModel) {
      currentModel = selectedModel;
    }

    res.json({
      reply: result.output,
      sessionId: nextSessionId || null,
      model: selectedModel || currentModel || null
    });
  } catch (error) {
    console.error('OpenCode execution error:', error);
    res.status(503).json({
      error: 'OpenCode service unavailable',
      details: error.message
    });
  }
});

/**
 * Execute opencode run command and capture output
 * Expects JSON format output with sessionID and text events
 * @param {string[]} args - Arguments to pass to opencode
 * @returns {Promise<{output: string, sessionId: string|null}>}
 */
function executeOpencode(args) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let sessionId = null;
    let textContent = [];

    // Use shell: true to handle PATH resolution on all platforms
    const child = spawn(OPENCODE_BIN, args, {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Timeout after 30 seconds
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('OpenCode request timeout (30s)'));
    }, 30000);

    child.on('close', (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        reject(new Error(`OpenCode failed with code ${code}: ${stderr}`));
      } else {
        if (!stdout.trim()) {
          reject(new Error('OpenCode returned empty response'));
          return;
        }

        // Parse JSON lines from stdout
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            
            // Extract session ID from first event
            if (!sessionId && event.sessionID) {
              sessionId = event.sessionID;
            }
            
            // Extract text content
            if (event.type === 'text' && event.part && event.part.text) {
              textContent.push(event.part.text);
            }
          } catch (e) {
            // Skip non-JSON lines (shouldn't happen with --format json)
            console.debug('Failed to parse JSON line:', line);
          }
        }

        const output = textContent.join('\n') || 'No text response from OpenCode';
        resolve({
          output,
          sessionId
        });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to start OpenCode: ${err.message}`));
    });
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404 fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start backend server
const BACKEND_PORT = process.env.BACKEND_PORT || 3001;
const server = app.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log(`✅ Backend server running on http://127.0.0.1:${BACKEND_PORT}`);
  console.log(`✅ Chat API available at http://127.0.0.1:${BACKEND_PORT}/api/chat`);
  console.log(`✅ Models endpoint available at http://127.0.0.1:${BACKEND_PORT}/api/models`);
  
  // Spawn Vite dev server after backend is ready
  console.log('\n📦 Starting Vite dev server...');
  const vite = spawn('npm', ['run', 'dev:frontend'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  vite.on('error', (err) => {
    console.error('❌ Failed to start Vite:', err);
  });
});
