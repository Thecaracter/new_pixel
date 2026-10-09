import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Store active session ID across requests
let currentSessionId = null;

/**
 * POST /api/chat
 * Accepts: { message: string, sessionId?: string }
 * Returns: { reply: string, sessionId: string } or { error: string, details: string }
 */
app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body;

  // Validate input
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      error: 'Invalid request',
      details: 'message must be a non-empty string'
    });
  }

  const trimmedMessage = message.trim();
  let nextSessionId = sessionId || currentSessionId;

  try {
    // Build opencode command
    // Use --session to continue an existing session if available
    const args = ['run'];
    
    if (nextSessionId) {
      args.push('--session', nextSessionId);
    }
    
    // Add the message as the final argument(s)
    args.push(trimmedMessage);

    // Execute opencode run
    const result = await executeOpencode(args);

    // Update session tracking
    if (result.sessionId) {
      nextSessionId = result.sessionId;
      currentSessionId = result.sessionId;
    }

    res.json({
      reply: result.output,
      sessionId: nextSessionId || null
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
 * @param {string[]} args - Arguments to pass to opencode
 * @returns {Promise<{output: string, sessionId: string|null}>}
 */
function executeOpencode(args) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const child = spawn('opencode', args, {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32'
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
        // Parse opencode output to extract session ID if available
        // For now, we'll just return the combined stdout
        const output = stdout.trim() || stderr.trim() || 'No response from OpenCode';
        resolve({
          output,
          sessionId: currentSessionId
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
app.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${BACKEND_PORT}`);
  console.log(`Chat API available at http://127.0.0.1:${BACKEND_PORT}/api/chat`);
  
  // Spawn Vite dev server
  console.log('\nStarting Vite dev server...');
  const vite = spawn('npm', ['run', 'dev:frontend'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  vite.on('error', (err) => {
    console.error('Failed to start Vite:', err);
  });
});
