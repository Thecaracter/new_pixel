/**
 * MCP Tool Definitions — domain-specific tools available to agents.
 * Each tool has: name, description, domain, parameters schema, and execute function.
 */

// ─── Finance Tools (Rina) ───
const financeTools = [
  {
    name: 'calculate_budget',
    description: 'Menghitung estimasi budget berdasarkan item-item yang diberikan',
    domain: 'finance',
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'Daftar item budget',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              cost: { type: 'number' },
              quantity: { type: 'number', default: 1 }
            }
          }
        },
        currency: { type: 'string', default: 'IDR' }
      },
      required: ['items']
    },
    execute: async ({ items, currency = 'IDR' }) => {
      const breakdown = items.map(item => ({
        name: item.name,
        unitCost: item.cost,
        quantity: item.quantity || 1,
        subtotal: item.cost * (item.quantity || 1)
      }));
      const total = breakdown.reduce((sum, b) => sum + b.subtotal, 0);
      return { breakdown, total, currency };
    }
  },
  {
    name: 'generate_invoice_draft',
    description: 'Membuat draft invoice untuk klien',
    domain: 'finance',
    parameters: {
      type: 'object',
      properties: {
        client: { type: 'string', description: 'Nama klien' },
        items: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, amount: { type: 'number' } } } },
        due_days: { type: 'number', default: 30 }
      },
      required: ['client', 'items']
    },
    execute: async ({ client, items, due_days = 30 }) => {
      const total = items.reduce((sum, i) => sum + i.amount, 0);
      const dueDate = new Date(Date.now() + due_days * 86400000).toISOString().split('T')[0];
      return {
        invoice_number: `INV-${Date.now().toString(36).toUpperCase()}`,
        client,
        items,
        total,
        due_date: dueDate,
        status: 'draft'
      };
    }
  },
  {
    name: 'financial_report_summary',
    description: 'Membuat ringkasan laporan keuangan dari data yang diberikan',
    domain: 'finance',
    parameters: {
      type: 'object',
      properties: {
        income: { type: 'number' },
        expenses: { type: 'number' },
        period: { type: 'string', description: 'Periode laporan (misal: Q1 2026)' }
      },
      required: ['income', 'expenses']
    },
    execute: async ({ income, expenses, period = 'Current' }) => {
      const profit = income - expenses;
      const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : 0;
      return { period, income, expenses, profit, margin_percent: margin, status: profit >= 0 ? 'profit' : 'loss' };
    }
  }
];

// ─── Design Tools (Dimas) ───
const designTools = [
  {
    name: 'create_wireframe_spec',
    description: 'Membuat spesifikasi wireframe untuk halaman/fitur',
    domain: 'design',
    parameters: {
      type: 'object',
      properties: {
        page_name: { type: 'string' },
        components: { type: 'array', items: { type: 'string' }, description: 'Daftar komponen UI yang dibutuhkan' },
        user_flow: { type: 'string', description: 'Deskripsi alur pengguna' },
        platform: { type: 'string', default: 'web', description: 'web | mobile | both' }
      },
      required: ['page_name', 'components']
    },
    execute: async ({ page_name, components, user_flow, platform = 'web' }) => {
      return {
        wireframe_id: `WF-${Date.now().toString(36).toUpperCase()}`,
        page_name,
        platform,
        components: components.map((c, i) => ({ id: `comp-${i + 1}`, name: c, placement: 'TBD' })),
        user_flow: user_flow || 'To be defined',
        status: 'draft'
      };
    }
  },
  {
    name: 'define_design_system',
    description: 'Mendefinisikan elemen design system (warna, tipografi, spacing)',
    domain: 'design',
    parameters: {
      type: 'object',
      properties: {
        brand_name: { type: 'string' },
        primary_color: { type: 'string' },
        style: { type: 'string', description: 'modern | classic | playful | corporate' }
      },
      required: ['brand_name']
    },
    execute: async ({ brand_name, primary_color = '#3B82F6', style = 'modern' }) => {
      return {
        brand_name,
        style,
        colors: { primary: primary_color, secondary: '#10B981', accent: '#F59E0B', neutral: '#6B7280' },
        typography: { heading: 'Inter', body: 'Inter', mono: 'JetBrains Mono' },
        spacing_unit: 8,
        border_radius: style === 'playful' ? 16 : style === 'corporate' ? 4 : 8
      };
    }
  }
];

// ─── Engineering Tools (Bayu) ───
const engineeringTools = [
  {
    name: 'scaffold_component',
    description: 'Membuat scaffold/template komponen React',
    domain: 'engineering',
    parameters: {
      type: 'object',
      properties: {
        component_name: { type: 'string' },
        props: { type: 'array', items: { type: 'string' }, description: 'Daftar props yang dibutuhkan' },
        has_state: { type: 'boolean', default: false },
        has_api: { type: 'boolean', default: false }
      },
      required: ['component_name']
    },
    execute: async ({ component_name, props = [], has_state = false, has_api = false }) => {
      return {
        component_name,
        file_path: `src/components/${component_name}.jsx`,
        props,
        features: { stateful: has_state, api_integration: has_api },
        status: 'scaffold_ready'
      };
    }
  },
  {
    name: 'analyze_tech_stack',
    description: 'Menganalisis dan merekomendasikan tech stack untuk fitur/project',
    domain: 'engineering',
    parameters: {
      type: 'object',
      properties: {
        feature: { type: 'string', description: 'Fitur yang akan dibangun' },
        constraints: { type: 'array', items: { type: 'string' }, description: 'Batasan teknis' }
      },
      required: ['feature']
    },
    execute: async ({ feature, constraints = [] }) => {
      return {
        feature,
        constraints,
        recommendation: {
          frontend: 'React + Vite',
          state: 'React useState/useReducer',
          styling: 'CSS Modules',
          api: 'Express REST'
        },
        status: 'analyzed'
      };
    }
  }
];

// ─── Marketing Tools (Sinta) ───
const marketingTools = [
  {
    name: 'draft_campaign',
    description: 'Membuat draft strategi campaign pemasaran',
    domain: 'marketing',
    parameters: {
      type: 'object',
      properties: {
        campaign_name: { type: 'string' },
        target_audience: { type: 'string' },
        channels: { type: 'array', items: { type: 'string' }, description: 'Channel pemasaran (social media, email, dll)' },
        budget_range: { type: 'string' },
        goal: { type: 'string' }
      },
      required: ['campaign_name', 'target_audience']
    },
    execute: async ({ campaign_name, target_audience, channels = ['social media'], budget_range, goal }) => {
      return {
        campaign_id: `CMP-${Date.now().toString(36).toUpperCase()}`,
        campaign_name,
        target_audience,
        channels,
        budget_range: budget_range || 'TBD',
        goal: goal || 'Brand awareness & conversion',
        phases: ['Research', 'Content Creation', 'Launch', 'Optimization'],
        status: 'draft'
      };
    }
  },
  {
    name: 'generate_copy',
    description: 'Membuat copy/teks pemasaran untuk berbagai kebutuhan',
    domain: 'marketing',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'tagline | social_post | email_subject | landing_page' },
        product: { type: 'string' },
        tone: { type: 'string', default: 'professional', description: 'professional | casual | urgent | friendly' }
      },
      required: ['type', 'product']
    },
    execute: async ({ type, product, tone = 'professional' }) => {
      return {
        copy_type: type,
        product,
        tone,
        placeholder: `[Copy ${type} untuk ${product} dengan tone ${tone} — akan di-generate oleh agent]`,
        status: 'needs_agent_generation'
      };
    }
  }
];

// ─── Sales Tools (Mira) ───
const salesTools = [
  {
    name: 'create_pitch_deck_outline',
    description: 'Membuat outline pitch deck untuk presentasi ke klien',
    domain: 'sales',
    parameters: {
      type: 'object',
      properties: {
        client_name: { type: 'string' },
        product: { type: 'string' },
        pain_points: { type: 'array', items: { type: 'string' } },
        value_propositions: { type: 'array', items: { type: 'string' } }
      },
      required: ['client_name', 'product']
    },
    execute: async ({ client_name, product, pain_points = [], value_propositions = [] }) => {
      return {
        pitch_id: `PITCH-${Date.now().toString(36).toUpperCase()}`,
        client_name,
        product,
        slides: [
          { order: 1, title: 'Cover', content: `${product} — Solusi untuk ${client_name}` },
          { order: 2, title: 'Problem', content: pain_points.length > 0 ? pain_points : ['TBD'] },
          { order: 3, title: 'Solution', content: value_propositions.length > 0 ? value_propositions : ['TBD'] },
          { order: 4, title: 'Demo / How It Works', content: 'TBD' },
          { order: 5, title: 'Pricing', content: 'TBD' },
          { order: 6, title: 'Next Steps', content: 'TBD' }
        ],
        status: 'outline'
      };
    }
  },
  {
    name: 'client_research',
    description: 'Mengumpulkan informasi riset tentang calon klien',
    domain: 'sales',
    parameters: {
      type: 'object',
      properties: {
        client_name: { type: 'string' },
        industry: { type: 'string' },
        focus_areas: { type: 'array', items: { type: 'string' } }
      },
      required: ['client_name']
    },
    execute: async ({ client_name, industry, focus_areas = [] }) => {
      return {
        client_name,
        industry: industry || 'Unknown',
        focus_areas,
        research_notes: `[Riset klien ${client_name} — akan dilengkapi oleh agent]`,
        status: 'needs_agent_research'
      };
    }
  }
];

// ─── Operations Tools (Eko) ───
const operationsTools = [
  {
    name: 'create_project_timeline',
    description: 'Membuat timeline project dengan milestone',
    domain: 'operations',
    parameters: {
      type: 'object',
      properties: {
        project_name: { type: 'string' },
        start_date: { type: 'string' },
        milestones: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, duration_days: { type: 'number' } } } }
      },
      required: ['project_name', 'milestones']
    },
    execute: async ({ project_name, start_date, milestones }) => {
      const start = start_date ? new Date(start_date) : new Date();
      let currentDate = new Date(start);
      const timeline = milestones.map(m => {
        const begin = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + (m.duration_days || 7));
        return { name: m.name, start: begin.toISOString().split('T')[0], end: new Date(currentDate).toISOString().split('T')[0] };
      });
      return {
        project_name,
        start_date: start.toISOString().split('T')[0],
        end_date: currentDate.toISOString().split('T')[0],
        total_days: Math.ceil((currentDate - start) / 86400000),
        timeline,
        status: 'draft'
      };
    }
  },
  {
    name: 'generate_meeting_agenda',
    description: 'Membuat agenda rapat/meeting',
    domain: 'operations',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        attendees: { type: 'array', items: { type: 'string' } },
        topics: { type: 'array', items: { type: 'string' } },
        duration_minutes: { type: 'number', default: 60 }
      },
      required: ['title', 'topics']
    },
    execute: async ({ title, attendees = [], topics, duration_minutes = 60 }) => {
      const perTopic = Math.floor(duration_minutes / (topics.length + 1)); // +1 for opening
      return {
        meeting_id: `MTG-${Date.now().toString(36).toUpperCase()}`,
        title,
        attendees,
        duration_minutes,
        agenda: [
          { order: 0, topic: 'Opening & Check-in', duration: 5 },
          ...topics.map((t, i) => ({ order: i + 1, topic: t, duration: perTopic })),
          { order: topics.length + 1, topic: 'Wrap-up & Action Items', duration: 5 }
        ],
        status: 'draft'
      };
    }
  }
];

// ─── All tools combined ───
export const ALL_TOOLS = [
  ...financeTools,
  ...designTools,
  ...engineeringTools,
  ...marketingTools,
  ...salesTools,
  ...operationsTools
];

// Domain → tools mapping
export const TOOLS_BY_DOMAIN = {
  finance: financeTools,
  design: designTools,
  engineering: engineeringTools,
  marketing: marketingTools,
  sales: salesTools,
  operations: operationsTools
};

/**
 * Get tool names available for a specific domain
 */
export function getToolNamesForDomain(domain) {
  return (TOOLS_BY_DOMAIN[domain] || []).map(t => t.name);
}

/**
 * Find a tool by name
 */
export function findTool(name) {
  return ALL_TOOLS.find(t => t.name === name) || null;
}

/**
 * Execute a tool by name with given arguments
 */
export async function executeTool(name, args) {
  const tool = findTool(name);
  if (!tool) {
    throw new Error(`Tool "${name}" not found`);
  }
  return await tool.execute(args);
}
