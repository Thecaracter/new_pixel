/**
 * Live Model Context Protocol (MCP) & Agent Skills Catalog
 * Connects directly to the live NPM Registry and canonical Official MCP servers.
 * Allows users to search, discover, and attach real published MCP servers & skills to agents.
 */

export const VERIFIED_MCP_CATALOG = [
  // ─── Engineering & Development ───
  {
    id: '@modelcontextprotocol/server-github',
    name: 'Official GitHub MCP Server',
    packageName: '@modelcontextprotocol/server-github',
    type: 'mcp',
    category: 'engineering',
    source: 'Official Anthropic',
    repo: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
    description: 'Integrasi resmi GitHub MCP: repositories, pull requests, issues, commit history, dan CI status.',
    icon: '🐙',
    command: 'npx -y @modelcontextprotocol/server-github',
    recommendedAgents: ['bayu'],
    configFields: [
      { key: 'githubToken', label: 'GitHub Personal Access Token (GITHUB_PERSONAL_ACCESS_TOKEN)', type: 'password', placeholder: 'ghp_...' }
    ],
    tools: [
      { name: 'github_list_issues', description: 'Melihat daftar issue pada repository', params: ['owner', 'repo', 'state'] },
      { name: 'github_create_pull_request', description: 'Membuat Pull Request baru dengan branch & title', params: ['owner', 'repo', 'title', 'head', 'base'] },
      { name: 'github_search_repositories', description: 'Mencari repository atau referensi library open source', params: ['query'] },
      { name: 'github_get_file_contents', description: 'Membaca konten file remote dari commit atau branch GitHub', params: ['owner', 'repo', 'path', 'ref'] }
    ]
  },
  {
    id: '@modelcontextprotocol/server-postgres',
    name: 'Official PostgreSQL MCP',
    packageName: '@modelcontextprotocol/server-postgres',
    type: 'mcp',
    category: 'engineering',
    source: 'Official Anthropic',
    repo: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
    description: 'Koneksi ke database PostgreSQL: kueri SQL terproteksi (read-only / safe transactions), inspect schema, dan tabel.',
    icon: '🐘',
    command: 'npx -y @modelcontextprotocol/server-postgres postgresql://user:pass@localhost:5432/dbname',
    recommendedAgents: ['bayu', 'fajar'],
    configFields: [
      { key: 'connectionString', label: 'PostgreSQL Connection URL', type: 'password', placeholder: 'postgresql://user:pass@localhost:5432/dbname' }
    ],
    tools: [
      { name: 'pg_execute_query', description: 'Menjalankan kueri SQL SELECT/EXPLAIN yang aman', params: ['query'] },
      { name: 'pg_list_tables', description: 'Menampilkan semua nama tabel dan skema kolom', params: ['schema'] },
      { name: 'pg_describe_table', description: 'Melihat rincian tipe data dan index pada tabel', params: ['tableName'] }
    ]
  },
  {
    id: '@modelcontextprotocol/server-puppeteer',
    name: 'Official Puppeteer Browser MCP',
    packageName: '@modelcontextprotocol/server-puppeteer',
    type: 'mcp',
    category: 'engineering',
    source: 'Official Anthropic',
    repo: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
    description: 'Browser automation headless Chromium untuk scraping web, render JavaScript, dan capture screenshot.',
    icon: '🌐',
    command: 'npx -y @modelcontextprotocol/server-puppeteer',
    recommendedAgents: ['bayu', 'doni'],
    tools: [
      { name: 'browser_navigate', description: 'Membuka URL halaman web dan mengambil teks konten', params: ['url'] },
      { name: 'browser_take_screenshot', description: 'Mengambil screenshot visual halaman web', params: ['url', 'selector'] },
      { name: 'browser_evaluate_script', description: 'Mengevaluasi ekspresi DOM JavaScript pada halaman web', params: ['script'] }
    ]
  },
  {
    id: '@modelcontextprotocol/server-filesystem',
    name: 'Official Filesystem MCP',
    packageName: '@modelcontextprotocol/server-filesystem',
    type: 'mcp',
    category: 'engineering',
    source: 'Official Anthropic',
    repo: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
    description: 'Akses direktori lokal: baca struktur folder, filter ekstensi file, dan navigasi tree kode.',
    icon: '📁',
    command: 'npx -y @modelcontextprotocol/server-filesystem .',
    recommendedAgents: ['bayu', 'fajar'],
    tools: [
      { name: 'fs_list_directory', description: 'Melihat daftar file dan subfolder', params: ['path'] },
      { name: 'fs_read_file', description: 'Membaca isi file teks', params: ['path'] },
      { name: 'fs_search_files', description: 'Mencari file berdasarkan pola nama atau glob', params: ['pattern'] }
    ]
  },

  // ─── QA & Testing ───
  {
    id: 'mcp-playwright',
    name: 'Playwright Browser Automation MCP',
    packageName: 'playwright-mcp-server',
    type: 'mcp',
    category: 'qa',
    source: 'Smithery / NPM',
    repo: 'https://github.com/executeautomation/mcp-playwright',
    description: 'Otomasi end-to-end testing, assertion komponen UI, pengecekan form input, dan verifikasi alur user.',
    icon: '🎭',
    command: 'npx -y playwright-mcp-server',
    recommendedAgents: ['doni'],
    tools: [
      { name: 'playwright_run_test_suite', description: 'Menjalankan skenario E2E test suite dan melaporkan assertion', params: ['specName'] },
      { name: 'playwright_assert_element', description: 'Memastikan elemen visual muncul dengan teks yang diharapkan', params: ['selector', 'expectedText'] },
      { name: 'playwright_click_and_fill', description: 'Mengisi form dan klik tombol pada halaman UI', params: ['selector', 'value'] }
    ]
  },

  // ─── DevOps & Cloud ───
  {
    id: 'mcp-docker',
    name: 'Docker Engine MCP',
    packageName: 'mcp-server-docker',
    type: 'mcp',
    category: 'devops',
    source: 'Smithery / NPM',
    repo: 'https://github.com/smithery/mcp-docker',
    description: 'Manajemen kontainer Docker: cek status container, build image, inspect log real-time, dan restart service.',
    icon: '🐳',
    command: 'npx -y mcp-server-docker',
    recommendedAgents: ['fajar'],
    tools: [
      { name: 'docker_list_containers', description: 'Melihat status kontainer aktif, port mapping, dan uptime', params: ['all'] },
      { name: 'docker_get_logs', description: 'Membaca 100 baris terakhir log kontainer', params: ['containerId'] },
      { name: 'docker_compose_up', description: 'Menjalankan stack docker-compose di background', params: ['composeFile'] }
    ]
  },
  {
    id: '@modelcontextprotocol/server-sentry',
    name: 'Official Sentry Crash Monitoring MCP',
    packageName: '@modelcontextprotocol/server-sentry',
    type: 'mcp',
    category: 'devops',
    source: 'Official Anthropic',
    repo: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sentry',
    description: 'Pantau error runtime aplikasi, inspect stack traces, crash alerts, dan volume issue teratas.',
    icon: '🛡️',
    command: 'npx -y @modelcontextprotocol/server-sentry',
    recommendedAgents: ['fajar', 'bayu', 'doni'],
    tools: [
      { name: 'sentry_list_issues', description: 'Melihat issue error yang baru terjadi beserta jumlah user terdampak', params: ['projectSlug', 'query'] },
      { name: 'sentry_get_issue_details', description: 'Membaca stack trace lengkap dan breadcrumbs crash error', params: ['issueId'] }
    ]
  },

  // ─── Design ───
  {
    id: 'figma-mcp',
    name: 'Figma Design System MCP',
    packageName: 'figma-mcp',
    type: 'mcp',
    category: 'design',
    source: 'NPM Live Registry',
    repo: 'https://www.npmjs.com/package/figma-mcp',
    description: 'Akses node desain Figma, ekstrak design tokens, warna, tipografi, dan generate kode komponen UI.',
    icon: '🎨',
    command: 'npx -y figma-mcp',
    recommendedAgents: ['dimas'],
    tools: [
      { name: 'figma_get_file_nodes', description: 'Membaca tree node dari frame desain Figma', params: ['fileKey', 'nodeIds'] },
      { name: 'figma_extract_design_tokens', description: 'Mengekstrak palet warna, spacing, dan font styles', params: ['fileKey'] },
      { name: 'figma_export_component_svg', description: 'Mengekspor vektor SVG dari komponen atau icon Figma', params: ['fileKey', 'nodeId'] }
    ]
  },

  // ─── Management ───
  {
    id: '@modelcontextprotocol/server-slack',
    name: 'Official Slack Notification MCP',
    packageName: '@modelcontextprotocol/server-slack',
    type: 'mcp',
    category: 'management',
    source: 'Official Anthropic',
    repo: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
    description: 'Kirim notifikasi otomatis ke channel Slack: alert deployment, hasil audit sprint, dan update tiket.',
    icon: '💬',
    command: 'npx -y @modelcontextprotocol/server-slack',
    recommendedAgents: ['arif', 'eko', 'fajar'],
    tools: [
      { name: 'slack_send_message', description: 'Mengirim pesan teks atau formatted block ke channel Slack', params: ['channel', 'text'] },
      { name: 'slack_list_channels', description: 'Melihat daftar channel public yang dapat menerima notifikasi', params: [] }
    ]
  },
  {
    id: '@modelcontextprotocol/server-brave-search',
    name: 'Official Brave Web Search MCP',
    packageName: '@modelcontextprotocol/server-brave-search',
    type: 'mcp',
    category: 'management',
    source: 'Official Anthropic',
    repo: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
    description: 'Pencarian web real-time untuk mengambil rilis library terbaru, artikel dokumentasi, dan riset pasar.',
    icon: '🔍',
    command: 'npx -y @modelcontextprotocol/server-brave-search',
    recommendedAgents: ['arif', 'sinta', 'mira', 'bayu'],
    tools: [
      { name: 'web_search_query', description: 'Mencari informasi terkini dari web dan mengembalikan cuplikan sumber', params: ['query', 'count'] }
    ]
  },

  // ─── Specialized Agent Skills ───
  {
    id: 'skill-refactoring',
    name: 'Clean Code & Refactoring Skill',
    type: 'skill',
    category: 'engineering',
    source: 'Agent Skill Pack',
    repo: 'https://github.com/open-skills/clean-code',
    description: 'Prosedur eliminasi code smell, pemisahan dependensi (SOLID), optimasi loop, dan penataan arsitektur modular.',
    icon: '✨',
    recommendedAgents: ['bayu'],
    tools: [
      { name: 'skill_analyze_complexity', description: 'Mendeteksi cyclomatic complexity tinggi dan fungsi yang terlalu panjang', params: ['filePath'] },
      { name: 'skill_propose_refactor', description: 'Memberikan usulan refactoring kode langkah demi langkah tanpa merusak contract', params: ['codeBlock', 'targetPattern'] }
    ]
  },
  {
    id: 'skill-tdd-workflow',
    name: 'TDD & Boundary Testing Skill',
    type: 'skill',
    category: 'qa',
    source: 'Agent Skill Pack',
    repo: 'https://github.com/open-skills/tdd-workflow',
    description: 'Metodologi Red-Green-Refactor, boundary value analysis, pengujian error branch, dan mock generator.',
    icon: '🧪',
    recommendedAgents: ['doni'],
    tools: [
      { name: 'skill_generate_test_cases', description: 'Menghasilkan matriks skenario uji (happy path, edge case, negative case)', params: ['featureSpec'] },
      { name: 'skill_validate_test_coverage', description: 'Memverifikasi kriteria acceptance telah memiliki unit test yang memadai', params: ['testFile', 'sourceFile'] }
    ]
  },
  {
    id: 'skill-security-audit',
    name: 'OWASP Security Scanning Skill',
    type: 'skill',
    category: 'devops',
    source: 'Agent Skill Pack',
    repo: 'https://github.com/open-skills/security-audit',
    description: 'Audit keamanan otomatis: deteksi hardcoded secrets/API keys, celah sanitasi input, XSS, dan dependency CVE.',
    icon: '🔒',
    recommendedAgents: ['fajar'],
    tools: [
      { name: 'skill_scan_secrets', description: 'Mencari potensi token, private key, atau credential bocor di kode', params: ['directory'] },
      { name: 'skill_audit_dependencies', description: 'Memeriksa package.json terhadap database vulnerability CVE', params: ['manifestPath'] }
    ]
  }
];

export const MCP_CATALOG = VERIFIED_MCP_CATALOG;

/**
 * Filter catalog with LIVE search against the real NPM Registry for published MCP servers
 */
export async function searchCatalog({ query = '', category = 'all', type = 'all' } = {}) {
  // 1. Filter local verified items
  let localResults = VERIFIED_MCP_CATALOG;
  if (category && category !== 'all') {
    localResults = localResults.filter(i => i.category === category);
  }
  if (type && type !== 'all') {
    localResults = localResults.filter(i => i.type === type);
  }
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    localResults = localResults.filter(item => {
      const matchName = item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchTools = item.tools?.some(t => t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
      return matchName || matchDesc || matchTools;
    });
  }

  // 2. Query Live NPM MCP Registry
  let liveNpmResults = [];
  try {
    const searchTerm = query && query.trim() ? `${query.trim()} mcp` : 'keywords:mcp-server';
    const npmUrl = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(searchTerm)}&size=15`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(npmUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.objects)) {
        liveNpmResults = data.objects
          .filter(obj => obj.package && obj.package.name)
          .filter(obj => !localResults.some(local => local.id === obj.package.name || local.packageName === obj.package.name))
          .map(obj => {
            const pkg = obj.package;
            const desc = pkg.description || 'Model Context Protocol (MCP) server package published on NPM Registry';
            let cat = 'engineering';
            const textCheck = (pkg.name + ' ' + desc).toLowerCase();
            if (/test|qa|playwright|cypress|spec|assert/i.test(textCheck)) cat = 'qa';
            else if (/docker|k8s|kubernetes|cloud|devops|aws|deploy|infra|server/i.test(textCheck)) cat = 'devops';
            else if (/design|figma|image|ui|svg|canvas/i.test(textCheck)) cat = 'design';
            else if (/slack|linear|jira|notion|mail|crm|pm|lead|task/i.test(textCheck)) cat = 'management';

            return {
              id: pkg.name,
              name: pkg.name,
              packageName: pkg.name,
              version: pkg.version,
              type: 'mcp',
              category: cat,
              source: 'NPM Live Registry',
              isLiveRegistry: true,
              repo: pkg.links?.repository || pkg.links?.npm || `https://www.npmjs.com/package/${pkg.name}`,
              description: desc,
              icon: cat === 'qa' ? '🧪' : cat === 'devops' ? '☁️' : cat === 'design' ? '🎨' : cat === 'management' ? '📋' : '📦',
              command: `npx -y ${pkg.name}`,
              publisher: pkg.publisher?.username || pkg.author?.name || 'Community',
              downloads: obj.downloads?.weekly || 0,
              recommendedAgents: cat === 'engineering' ? ['bayu'] : cat === 'qa' ? ['doni'] : cat === 'devops' ? ['fajar'] : cat === 'design' ? ['dimas'] : ['arif'],
              tools: [
                { name: `${pkg.name.replace(/[^a-zA-Z0-9]/g, '_')}_call`, description: `Menjalankan tool utama dari ${pkg.name}`, params: ['action', 'params'] }
              ]
            };
          });

        if (category && category !== 'all') {
          liveNpmResults = liveNpmResults.filter(i => i.category === category);
        }
        if (type && type !== 'all') {
          liveNpmResults = liveNpmResults.filter(i => i.type === type);
        }
      }
    }
  } catch (_) {
    // Graceful fallback to verified results if NPM registry is unreachable
  }

  return [...localResults, ...liveNpmResults];
}

/**
 * Find catalog item by ID (checks local and queries live NPM if necessary)
 */
export async function getCatalogItem(id) {
  const local = VERIFIED_MCP_CATALOG.find(item => item.id === id || item.packageName === id);
  if (local) return local;

  // Try live fetch from NPM for package metadata
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = await res.json();
      const latest = data['dist-tags']?.latest;
      const verData = latest ? data.versions?.[latest] : null;
      return {
        id: data.name,
        name: data.name,
        packageName: data.name,
        version: latest || 'latest',
        type: 'mcp',
        category: 'engineering',
        source: 'NPM Live Registry',
        isLiveRegistry: true,
        repo: `https://www.npmjs.com/package/${data.name}`,
        description: data.description || 'Model Context Protocol (MCP) server package',
        icon: '📦',
        command: `npx -y ${data.name}`,
        tools: [
          { name: `${data.name.replace(/[^a-zA-Z0-9]/g, '_')}_call`, description: `Menjalankan tool dari ${data.name}`, params: ['action', 'params'] }
        ]
      };
    }
  } catch (_) {}

  return null;
}
