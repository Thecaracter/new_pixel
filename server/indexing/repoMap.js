import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..', '..');

let cachedMap = null;
let lastScanTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds

/**
 * Scan directory recursively and extract concise file tree with exported symbols.
 */
function scanDir(dir, relPath = '', maxDepth = 4, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  const entries = [];
  const ignored = new Set(['node_modules', 'dist', '.git', '.sokudo', 'build', 'coverage']);

  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (ignored.has(item.name) || item.name.startsWith('.')) continue;

      const fullPath = path.join(dir, item.name);
      const relative = relPath ? `${relPath}/${item.name}` : item.name;

      if (item.isDirectory()) {
        const sub = scanDir(fullPath, relative, maxDepth, currentDepth + 1);
        if (sub.length > 0) {
          entries.push({ type: 'dir', path: relative, children: sub });
        }
      } else if (item.isFile() && /\.(jsx?|mjs|tsx?|json)$/i.test(item.name)) {
        const exports = extractExports(fullPath);
        entries.push({ type: 'file', path: relative, exports });
      }
    }
  } catch (_) {}

  return entries;
}

/**
 * Extract exported symbols using lightweight regex to save tokens
 */
function extractExports(filePath) {
  if (filePath.endsWith('.json')) return [];
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const exports = [];
    const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+([A-Za-z0-9_]+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
      if (exports.length >= 5) break; // Keep concise
    }
    return exports;
  } catch (_) {
    return [];
  }
}

/**
 * Format the scanned tree into a compact markdown representation (~300-500 tokens)
 */
function formatTreeToMarkdown(entries, indent = 0) {
  let md = '';
  const prefix = '  '.repeat(indent);

  for (const item of entries) {
    if (item.type === 'dir') {
      md += `${prefix}📁 ${path.basename(item.path)}/\n`;
      md += formatTreeToMarkdown(item.children, indent + 1);
    } else {
      const expStr = item.exports.length > 0 ? ` (exports: ${item.exports.join(', ')})` : '';
      md += `${prefix}📄 ${path.basename(item.path)}${expStr}\n`;
    }
  }

  return md;
}

/**
 * Get or refresh the compact codebase map
 */
export function getCodebaseMap(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedMap && (now - lastScanTime) < CACHE_TTL_MS) {
    return cachedMap;
  }

  const srcDir = path.join(ROOT_DIR, 'src');
  const serverDir = path.join(ROOT_DIR, 'server');

  const srcEntries = fs.existsSync(srcDir) ? scanDir(srcDir, 'src') : [];
  const serverEntries = fs.existsSync(serverDir) ? scanDir(serverDir, 'server') : [];

  let output = '=== CODEBASE INDEX (REPO-MAP) ===\n';
  output += 'src/\n' + formatTreeToMarkdown(srcEntries, 1);
  output += 'server/\n' + formatTreeToMarkdown(serverEntries, 1);

  cachedMap = output.trim();
  lastScanTime = now;
  return cachedMap;
}

export default { getCodebaseMap };
