import React, { useState, useEffect, useMemo, useCallback } from 'react';

// SVG Icons for Kanban Board
function IconBacklog() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconInProgress() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconDone() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

const DEFAULT_COLUMNS = [
  { id: 'backlog', name: 'Backlog (Antrean)', icon: IconBacklog, color: 'var(--amber-400, #f59e0b)' },
  { id: 'in_progress', name: 'In Progress (Dikerjakan)', icon: IconInProgress, color: 'var(--sky-400, #38bdf8)' },
  { id: 'done', name: 'Done (Selesai)', icon: IconDone, color: 'var(--emerald-400, #10b981)' }
];

export function KanbanBoard({
  teamMembers = [],
  onNavigateToChat,
  selectedProjectId = 'all',
  onSelectProjectId
}) {
  const [tasks, setTasks] = useState(() => {
    try {
      const cached = localStorage.getItem('kantor_virtual_kanban_cache');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return [];
  });
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(selectedProjectId || 'all');
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Sync external selectedProjectId if provided
  useEffect(() => {
    if (selectedProjectId) {
      setActiveProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Filters
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Modal create task
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Sinta');
  const [newTaskRole, setNewTaskRole] = useState('Marketing / Growth');
  const [newTaskPlan, setNewTaskPlan] = useState('');
  const [newTaskColumn, setNewTaskColumn] = useState('backlog');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');

  // Modal create project
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const showToast = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // Fetch tasks and projects from server
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/kanban/tasks');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.tasks)) {
        setTasks(data.tasks);
        try {
          localStorage.setItem('kantor_virtual_kanban_cache', JSON.stringify(data.tasks));
        } catch (_) {}
      }
      if (Array.isArray(data.projects)) {
        setProjects(data.projects);
      }
      if (Array.isArray(data.columns) && data.columns.length > 0) {
        setColumns(data.columns.map(c => {
          const matched = DEFAULT_COLUMNS.find(dc => dc.id === c.id);
          return {
            ...c,
            icon: matched?.icon || IconBacklog,
            color: matched?.color || '#38bdf8'
          };
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch Kanban tasks:', err);
      setError('Gagal memuat task dari server. Menampilkan data lokal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSelectProject = (pId) => {
    setActiveProjectId(pId);
    if (onSelectProjectId) onSelectProjectId(pId);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      const res = await fetch('/api/kanban/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDesc.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.project) {
          setProjects(prev => [...prev, data.project]);
          handleSelectProject(data.project.id);
          showToast(`Proyek "${data.project.name}" berhasil dibuat!`);
        }
      }
      setIsNewProjectModalOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
      fetchTasks();
    } catch (err) {
      console.error('Failed to create project:', err);
      showToast(`Gagal membuat proyek: ${err.message}`);
    }
  };

  const handleDeleteProject = async (pId) => {
    const proj = projects.find(p => p.id === pId);
    if (!window.confirm(`Hapus papan proyek "${proj?.name || pId}" dan seluruh task di dalamnya?`)) return;
    try {
      const res = await fetch(`/api/kanban/projects/${encodeURIComponent(pId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== pId));
        setTasks(prev => prev.filter(t => t.planId !== pId && t.projectId !== pId));
        handleSelectProject('all');
        showToast(`Proyek "${proj?.name || pId}" berhasil dihapus.`);
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
      showToast('Gagal menghapus proyek');
    }
  };

  // Move task to another column
  const handleMoveColumn = async (taskId, targetColumn) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.column === targetColumn) return;

    const oldColumn = task.column;
    const newStatus = targetColumn === 'done' ? 'done' : targetColumn === 'in_progress' ? 'in_progress' : 'pending';

    // Optimistic update
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, column: targetColumn, status: newStatus, updatedAt: new Date().toISOString() } : t
    );
    setTasks(updatedTasks);
    try {
      localStorage.setItem('kantor_virtual_kanban_cache', JSON.stringify(updatedTasks));
    } catch (_) {}

    try {
      const res = await fetch(`/api/kanban/tasks/${encodeURIComponent(taskId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column: targetColumn, status: newStatus })
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      showToast(`Task ${taskId} dipindahkan ke ${targetColumn.replace('_', ' ').toUpperCase()}`);
    } catch (err) {
      console.error('Failed to update task column on server:', err);
      // Revert on server error
      setTasks(tasks);
      showToast(`Gagal memindahkan task: ${err.message}`);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm(`Hapus task "${taskId}" dari Kanban?`)) return;

    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    try {
      localStorage.setItem('kantor_virtual_kanban_cache', JSON.stringify(updatedTasks));
    } catch (_) {}

    try {
      const res = await fetch(`/api/kanban/tasks/${encodeURIComponent(taskId)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(`Task ${taskId} berhasil dihapus`);
    } catch (err) {
      console.error('Failed to delete task:', err);
      setTasks(tasks);
      showToast('Gagal menghapus task di server');
    }
  };

  // Create manual task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const targetProjId = newTaskProjectId || (activeProjectId !== 'all' ? activeProjectId : null);
    const targetProj = projects.find(p => p.id === targetProjId);

    const payload = {
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      assignee: newTaskAssignee.trim(),
      role: newTaskRole.trim(),
      planTitle: newTaskPlan.trim() || targetProj?.name || 'Task Tambahan',
      projectId: targetProjId || null,
      projectName: targetProj?.name || null,
      column: newTaskColumn,
      status: newTaskColumn === 'done' ? 'done' : newTaskColumn === 'in_progress' ? 'in_progress' : 'pending'
    };

    try {
      const res = await fetch('/api/kanban/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.task) {
        const nextTasks = [...tasks, data.task];
        setTasks(nextTasks);
        try {
          localStorage.setItem('kantor_virtual_kanban_cache', JSON.stringify(nextTasks));
        } catch (_) {}
        showToast(`Task "${data.task.id}" berhasil ditambahkan ke Kanban!`);
      }
      setIsModalOpen(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskPlan('');
    } catch (err) {
      console.error('Failed to create task:', err);
      showToast(`Gagal menambahkan task: ${err.message}`);
    }
  };

  // Drag & drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      handleMoveColumn(taskId, colId);
    }
    setDraggedTaskId(null);
  };

  // Unique plans & assignees for filtering
  const availablePlans = useMemo(() => {
    const set = new Set();
    tasks.forEach(t => {
      if (t.planTitle) set.add(t.planTitle);
    });
    return Array.from(set);
  }, [tasks]);

  const availableAssignees = useMemo(() => {
    const set = new Set();
    tasks.forEach(t => {
      if (t.assignee) set.add(t.assignee);
    });
    return Array.from(set);
  }, [tasks]);

  // Filtered tasks scoped by active project
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Scope by project
      if (activeProjectId !== 'all') {
        const pId = t.planId || t.projectId;
        if (pId !== activeProjectId) return false;
      }
      if (filterAssignee !== 'all' && t.assignee !== filterAssignee) return false;
      if (filterPlan !== 'all' && t.planTitle !== filterPlan) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (t.title || '').toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchId = (t.id || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchId) return false;
      }
      return true;
    });
  }, [tasks, activeProjectId, filterAssignee, filterPlan, searchQuery]);

  const currentProject = projects.find(p => p.id === activeProjectId);

  // Counts scoped by active project
  const counts = useMemo(() => {
    const scopeTasks = activeProjectId === 'all'
      ? tasks
      : tasks.filter(t => (t.planId === activeProjectId || t.projectId === activeProjectId));
    const map = { total: scopeTasks.length, backlog: 0, in_progress: 0, done: 0 };
    scopeTasks.forEach(t => {
      const col = t.column || 'backlog';
      if (map[col] !== undefined) map[col]++;
      else map.backlog++;
    });
    return map;
  }, [tasks, activeProjectId]);

  return (
    <div className="kanban-page-root" role="region" aria-label="Papan Kanban Proyek">
      {/* Toast Notification */}
      {notification && (
        <div className="kanban-toast" role="status">
          <span className="toast-dot"></span>
          <span>{notification}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="kanban-header-bar">
        <div className="kanban-header-left">
          <div className="kanban-title-group">
            <h2 className="kanban-title">📋 Papan Kanban Proyek</h2>
            <p className="kanban-subtitle">
              Pantau tugas terencana dari Arif dan delegasi ke tim (Sinta, Bayu, Dimas, dll) secara langsung.
            </p>
          </div>

          <div className="kanban-stats-chips">
            <span className="kanban-stat-chip total" title="Total semua tugas">
              <strong>{counts.total}</strong> Total
            </span>
            <span className="kanban-stat-chip backlog" title="Tugas di antrean backlog">
              <span className="stat-indicator amber"></span>
              <strong>{counts.backlog}</strong> Backlog
            </span>
            <span className="kanban-stat-chip in-progress" title="Tugas yang sedang berjalan">
              <span className="stat-indicator sky"></span>
              <strong>{counts.in_progress}</strong> In Progress
            </span>
            <span className="kanban-stat-chip done" title="Tugas yang telah selesai">
              <span className="stat-indicator emerald"></span>
              <strong>{counts.done}</strong> Selesai
            </span>
          </div>
        </div>

        <div className="kanban-header-actions">
          <button
            type="button"
            className="kanban-btn kanban-btn-secondary"
            onClick={fetchTasks}
            disabled={loading}
            title="Muat ulang data Kanban"
          >
            <IconRefresh />
            <span>{loading ? 'Memuat...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            className="kanban-btn kanban-btn-primary"
            onClick={() => setIsModalOpen(true)}
            title="Tambah task baru secara manual"
          >
            <IconPlus />
            <span>Tambah Task</span>
          </button>

          {onNavigateToChat && (
            <button
              type="button"
              className="kanban-btn kanban-btn-accent"
              onClick={onNavigateToChat}
              title="Kembali berkoordinasi dengan Arif di Chat"
            >
              <span>💬 Koordinasi Arif</span>
            </button>
          )}
        </div>
      </div>

      {/* Project Switcher Bar ("Beda Proyek Beda Kanban") */}
      <div className="kanban-project-nav-bar" role="tablist" aria-label="Papan Proyek Kanban">
        <div className="project-nav-tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeProjectId === 'all'}
            className={`project-nav-tab ${activeProjectId === 'all' ? 'active' : ''}`}
            onClick={() => handleSelectProject('all')}
          >
            <span className="project-tab-icon">🏢</span>
            <span className="project-tab-name">Semua Proyek</span>
            <span className="project-tab-badge">{tasks.length}</span>
          </button>

          {projects.map(proj => {
            const count = tasks.filter(t => t.planId === proj.id || t.projectId === proj.id).length;
            const isSelected = activeProjectId === proj.id;
            return (
              <button
                key={proj.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`project-nav-tab ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectProject(proj.id)}
                title={proj.description || proj.name}
              >
                <span className="project-tab-icon">📁</span>
                <span className="project-tab-name">{proj.name}</span>
                <span className="project-tab-badge">{count}</span>
              </button>
            );
          })}

          <button
            type="button"
            className="project-nav-add-btn"
            onClick={() => setIsNewProjectModalOpen(true)}
            title="Tambah Papan Proyek Baru"
          >
            <IconPlus />
            <span>+ Proyek Baru</span>
          </button>
        </div>
      </div>

      {/* Project Banner for specific project view */}
      {activeProjectId !== 'all' && currentProject && (
        <div className="kanban-project-active-banner">
          <div className="project-banner-main">
            <div className="project-banner-tag">📁 Papan Kanban Proyek Terfokus</div>
            <h3 className="project-banner-title">{currentProject.name}</h3>
            {currentProject.description && (
              <p className="project-banner-desc">{currentProject.description}</p>
            )}
            <div className="project-banner-stats">
              <span className="banner-stat-chip total">Total: {counts.total} Task</span>
              <span className="banner-stat-chip backlog">Backlog: {counts.backlog}</span>
              <span className="banner-stat-chip in-progress">In Progress: {counts.in_progress}</span>
              <span className="banner-stat-chip done">Selesai: {counts.done}</span>
            </div>
          </div>
          <div className="project-banner-actions">
            <button
              type="button"
              className="btn-delete-project"
              onClick={() => handleDeleteProject(currentProject.id)}
              title="Hapus proyek ini dan tugas-tugasnya"
            >
              <IconTrash />
              <span>Hapus Papan Proyek</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="kanban-toolbar">
        <div className="kanban-search-box">
          <input
            type="text"
            className="kanban-search-input"
            placeholder="Cari task (judul, deskripsi, ID)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="kanban-search-clear"
              onClick={() => setSearchQuery('')}
              title="Bersihkan pencarian"
            >
              ×
            </button>
          )}
        </div>

        <div className="kanban-filter-group">
          <label className="kanban-filter-label" htmlFor="kanban-filter-assignee">Anggota:</label>
          <select
            id="kanban-filter-assignee"
            className="kanban-filter-select"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
          >
            <option value="all">Semua Anggota</option>
            {availableAssignees.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {availablePlans.length > 0 && (
          <div className="kanban-filter-group">
            <label className="kanban-filter-label" htmlFor="kanban-filter-plan">Rencana Proyek:</label>
            <select
              id="kanban-filter-plan"
              className="kanban-filter-select"
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
            >
              <option value="all">Semua Rencana</option>
              {availablePlans.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="kanban-error-banner" role="alert">
          <span>⚠️ {error}</span>
          <button type="button" onClick={fetchTasks} className="retry-link">Coba lagi</button>
        </div>
      )}

      {/* Kanban Board Columns Grid */}
      <div className="kanban-board-grid">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => (t.column || 'backlog') === col.id);
          const ColIcon = col.icon || IconBacklog;
          const isOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              className={`kanban-column ${col.id} ${isOver ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="kanban-column-header">
                <div className="column-title-box">
                  <span className="column-icon" style={{ color: col.color }} aria-hidden="true">
                    <ColIcon />
                  </span>
                  <h3 className="column-name">{col.name}</h3>
                </div>
                <span className="column-badge" title={`${colTasks.length} task di kolom ini`}>
                  {colTasks.length}
                </span>
              </div>

              <div className="kanban-task-list">
                {colTasks.length === 0 ? (
                  <div className="kanban-empty-column">
                    <p className="empty-column-text">Tidak ada task di kolom ini</p>
                    {col.id === 'backlog' && (
                      <p className="empty-column-hint">
                        Kirim rencana ke Arif di Chat lalu klik <strong>Setuju</strong> untuk otomatis mengisi Backlog.
                      </p>
                    )}
                  </div>
                ) : (
                  colTasks.map(task => (
                    <div
                      key={task.id}
                      className="kanban-task-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                    >
                      <div className="task-card-header">
                        <span className="task-card-id">{task.id}</span>
                        {(task.projectName || task.planTitle) && (
                          <span className="task-card-plan" title={`Proyek: ${task.projectName || task.planTitle}`}>
                            📁 {task.projectName || task.planTitle}
                          </span>
                        )}
                        <button
                          type="button"
                          className="task-delete-btn"
                          onClick={() => handleDeleteTask(task.id)}
                          title="Hapus task"
                        >
                          <IconTrash />
                        </button>
                      </div>

                      <h4 className="task-card-title">{task.title}</h4>

                      {task.description && (
                        <p className="task-card-desc">{task.description}</p>
                      )}

                      <div className="task-card-meta">
                        <div className="task-assignee-badge">
                          <span className="assignee-avatar" aria-hidden="true">
                            {task.assignee ? task.assignee.charAt(0).toUpperCase() : 'A'}
                          </span>
                          <div className="assignee-text-group">
                            <span className="assignee-name">{task.assignee || 'Belum Ditugaskan'}</span>
                            {task.role && <span className="assignee-role">{task.role}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="task-card-actions">
                        {col.id === 'backlog' && (
                          <button
                            type="button"
                            className="task-action-btn primary"
                            onClick={() => handleMoveColumn(task.id, 'in_progress')}
                            title="Mulai kerjakan task ini"
                          >
                            <span>Kerjakan</span>
                            <IconArrowRight />
                          </button>
                        )}

                        {col.id === 'in_progress' && (
                          <>
                            <button
                              type="button"
                              className="task-action-btn secondary"
                              onClick={() => handleMoveColumn(task.id, 'backlog')}
                              title="Kembalikan ke antrean Backlog"
                            >
                              <IconArrowLeft />
                              <span>Backlog</span>
                            </button>
                            <button
                              type="button"
                              className="task-action-btn success"
                              onClick={() => handleMoveColumn(task.id, 'done')}
                              title="Tandai task selesai"
                            >
                              <IconDone />
                              <span>Selesai</span>
                            </button>
                          </>
                        )}

                        {col.id === 'done' && (
                          <button
                            type="button"
                            className="task-action-btn secondary"
                            onClick={() => handleMoveColumn(task.id, 'in_progress')}
                            title="Buka kembali task ke In Progress"
                          >
                            <span>Buka Lagi</span>
                            <IconArrowLeft />
                          </button>
                        )}

                        <select
                          className="task-col-select"
                          value={task.column || 'backlog'}
                          onChange={(e) => handleMoveColumn(task.id, e.target.value)}
                          title="Pindahkan kolom langsung"
                        >
                          <option value="backlog">Pindah: Backlog</option>
                          <option value="in_progress">Pindah: In Progress</option>
                          <option value="done">Pindah: Done</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah Task */}
      {isModalOpen && (
        <div className="kanban-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="kanban-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-header">
              <h3 id="modal-title" className="modal-title">➕ Tambah Task Baru</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="modal-form">
              <div className="form-group">
                <label htmlFor="task-title" className="form-label">Judul Tugas *</label>
                <input
                  id="task-title"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Riset integrasi Google One x Jio..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="task-project" className="form-label">Papan Proyek</label>
                <select
                  id="task-project"
                  className="form-select"
                  value={newTaskProjectId || (activeProjectId !== 'all' ? activeProjectId : '')}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setNewTaskProjectId(selectedId);
                    const matchedProj = projects.find(p => p.id === selectedId);
                    if (matchedProj) {
                      setNewTaskPlan(matchedProj.name);
                    }
                  }}
                >
                  <option value="">(Umum / Tanpa Proyek)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="task-plan" className="form-label">Nama Rencana / Inisiatif</label>
                <input
                  id="task-plan"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Riset Pendaftaran Google One..."
                  value={newTaskPlan}
                  onChange={(e) => setNewTaskPlan(e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="task-assignee" className="form-label">Penanggung Jawab (Assignee)</label>
                  <select
                    id="task-assignee"
                    className="form-select"
                    value={newTaskAssignee}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewTaskAssignee(name);
                      const matched = teamMembers.find(m => m.name === name);
                      if (matched && matched.role) {
                        setNewTaskRole(matched.role);
                      }
                    }}
                  >
                    <option value="Sinta">Sinta (Marketing / Growth)</option>
                    <option value="Bayu">Bayu (Frontend Engineer)</option>
                    <option value="Dimas">Dimas (UI/UX Designer)</option>
                    <option value="Rina">Rina (Finance / Accountant)</option>
                    <option value="Mira">Mira (Sales / Client Relations)</option>
                    <option value="Eko">Eko (Operations / Admin)</option>
                    <option value="Arif">Arif (Project Lead)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="task-role" className="form-label">Peran</label>
                  <input
                    id="task-role"
                    type="text"
                    className="form-input"
                    value={newTaskRole}
                    onChange={(e) => setNewTaskRole(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="task-desc" className="form-label">Deskripsi & Ruang Lingkup Tugas</label>
                <textarea
                  id="task-desc"
                  className="form-textarea"
                  rows="3"
                  placeholder="Instruksi spesifik yang harus diselesaikan..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="task-column" className="form-label">Kolom Awal</label>
                <select
                  id="task-column"
                  className="form-select"
                  value={newTaskColumn}
                  onChange={(e) => setNewTaskColumn(e.target.value)}
                >
                  <option value="backlog">Backlog (Antrean Baru)</option>
                  <option value="in_progress">In Progress (Sedang Dikerjakan)</option>
                  <option value="done">Done (Selesai)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="kanban-btn kanban-btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="kanban-btn kanban-btn-primary"
                  disabled={!newTaskTitle.trim()}
                >
                  Simpan Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Proyek Baru */}
      {isNewProjectModalOpen && (
        <div className="kanban-modal-backdrop" onClick={() => setIsNewProjectModalOpen(false)}>
          <div
            className="kanban-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-project-title"
          >
            <div className="modal-header">
              <h3 id="modal-project-title" className="modal-title">📁 Buat Papan Proyek Baru</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsNewProjectModalOpen(false)}
                aria-label="Tutup"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="modal-form">
              <div className="form-group">
                <label htmlFor="project-name" className="form-label">Nama Proyek *</label>
                <input
                  id="project-name"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Redesign Website & UI Kit 2026..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="project-desc" className="form-label">Deskripsi / Sasaran (Goal)</label>
                <textarea
                  id="project-desc"
                  className="form-textarea"
                  rows="3"
                  placeholder="Sasaran utama, target deliverables, atau konteks proyek..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="kanban-btn kanban-btn-secondary"
                  onClick={() => setIsNewProjectModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="kanban-btn kanban-btn-primary"
                  disabled={!newProjectName.trim()}
                >
                  Buat Papan Proyek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default KanbanBoard;
