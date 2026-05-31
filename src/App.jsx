import { useEffect, useMemo, useState } from 'react';

const TASKS_STORAGE_KEY = 'manag.tasks.v2';
const THEME_STORAGE_KEY = 'manag.theme';

const statuses = ['À faire', 'En cours', 'Terminé'];
const priorities = ['Basse', 'Moyenne', 'Haute'];
const categories = ['Design', 'Produit', 'Growth', 'Opérations', 'Personnel'];

const emptyTaskForm = {
  title: '',
  project: '',
  category: 'Produit',
  priority: 'Moyenne',
  status: 'À faire',
  dueDate: new Date().toISOString().slice(0, 10),
  notes: '',
};

const initialTasks = [
  {
    id: 1,
    title: 'Finaliser la proposition client',
    project: 'Design system',
    category: 'Design',
    priority: 'Haute',
    status: 'En cours',
    dueDate: '2026-06-03',
    notes: 'Partager une version relue avec les parties prenantes.',
  },
  {
    id: 2,
    title: 'Préparer le sprint planning',
    project: 'Produit',
    category: 'Produit',
    priority: 'Moyenne',
    status: 'À faire',
    dueDate: '2026-06-05',
    notes: 'Clarifier les objectifs et les dépendances avant la réunion.',
  },
  {
    id: 3,
    title: 'Auditer le parcours d’inscription',
    project: 'Growth',
    category: 'Growth',
    priority: 'Haute',
    status: 'À faire',
    dueDate: '2026-06-07',
    notes: 'Identifier les points de friction sur mobile.',
  },
  {
    id: 4,
    title: 'Publier le compte-rendu hebdo',
    project: 'Opérations',
    category: 'Opérations',
    priority: 'Basse',
    status: 'Terminé',
    dueDate: '2026-05-30',
    notes: 'Inclure les décisions et les prochaines actions.',
  },
];

function getSavedTasks() {
  const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY);

  if (!savedTasks) {
    return initialTasks;
  }

  try {
    const parsedTasks = JSON.parse(savedTasks);
    return Array.isArray(parsedTasks) ? parsedTasks : initialTasks;
  } catch {
    return initialTasks;
  }
}

function getSavedTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || 'light';
}

function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`));
}

function normalizeText(value) {
  return value.trim().toLowerCase();
}

function App() {
  const [tasks, setTasks] = useState(getSavedTasks);
  const [theme, setTheme] = useState(getSavedTheme);
  const [activeStatus, setActiveStatus] = useState('Tous');
  const [activeCategory, setActiveCategory] = useState('Toutes');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyTaskForm);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dropTargetStatus, setDropTargetStatus] = useState(null);

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return tasks.filter((task) => {
      const matchesStatus = activeStatus === 'Tous' || task.status === activeStatus;
      const matchesCategory = activeCategory === 'Toutes' || task.category === activeCategory;
      const matchesSearch =
        !normalizedSearch ||
        task.title.toLowerCase().includes(normalizedSearch) ||
        task.project.toLowerCase().includes(normalizedSearch) ||
        task.category.toLowerCase().includes(normalizedSearch) ||
        task.notes.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [activeCategory, activeStatus, search, tasks]);

  const metrics = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'Terminé').length;
    const inProgress = tasks.filter((task) => task.status === 'En cours').length;
    const highPriority = tasks.filter((task) => task.priority === 'Haute').length;
    const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

    return [
      { label: 'Tâches totales', value: tasks.length },
      { label: 'En cours', value: inProgress },
      { label: 'Priorité haute', value: highPriority },
      { label: 'Complétion', value: `${completionRate}%` },
    ];
  }, [tasks]);

  const tasksByStatus = useMemo(() => {
    return statuses.reduce((columns, status) => {
      columns[status] = filteredTasks.filter((task) => task.status === status);
      return columns;
    }, {});
  }, [filteredTasks]);

  const visibleStatuses = activeStatus === 'Tous' ? statuses : statuses.filter((status) => status === activeStatus);
  const activeTasksCount = tasks.filter((task) => task.status !== 'Terminé').length;
  const isEditing = editingTaskId !== null;

  function resetForm() {
    setForm(emptyTaskForm);
    setEditingTaskId(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.project.trim()) {
      return;
    }

    const normalizedForm = {
      ...form,
      title: form.title.trim(),
      project: form.project.trim(),
      notes: form.notes.trim(),
    };

    if (isEditing) {
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === editingTaskId ? { ...task, ...normalizedForm } : task)),
      );
    } else {
      setTasks((currentTasks) => [{ ...normalizedForm, id: Date.now() }, ...currentTasks]);
    }

    resetForm();
  }

  function startEditing(task) {
    setEditingTaskId(task.id);
    setForm({
      title: task.title,
      project: task.project,
      category: task.category,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      notes: task.notes,
    });
  }

  function deleteTask(taskId) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));

    if (editingTaskId === taskId) {
      resetForm();
    }
  }

  function moveTask(taskId, nextStatus) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)),
    );
  }

  function handleDrop(nextStatus) {
    if (draggedTaskId) {
      moveTask(draggedTaskId, nextStatus);
    }

    setDraggedTaskId(null);
    setDropTargetStatus(null);
  }

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }

  return (
    <main className="app-shell" data-theme={theme}>
      <section className="hero-card" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Tableau de bord productivité</p>
          <h1 id="page-title">Pilotez vos tâches avec un workflow complet.</h1>
          <p className="hero-copy">
            Créez, classez, éditez et déplacez vos tâches par glisser-déposer. Vos données et votre
            préférence de thème restent sauvegardées dans le navigateur.
          </p>
        </div>
        <div className="hero-side" aria-label="Actions rapides">
          <button className="theme-toggle" type="button" onClick={toggleTheme}>
            {theme === 'dark' ? '☀️ Mode clair' : '🌙 Mode sombre'}
          </button>
          <div className="hero-actions">
            <span className="pulse-dot" />
            <strong>{activeTasksCount}</strong>
            <span>tâches actives</span>
          </div>
        </div>
      </section>

      <section className="metrics-grid" aria-label="Indicateurs de tâches">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <div className="workspace-grid">
        <section className="panel board-panel" aria-labelledby="task-board-title">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Kanban interactif</p>
              <h2 id="task-board-title">Tableau des tâches</h2>
            </div>
            <label className="search-box">
              <span>Rechercher</span>
              <input
                type="search"
                placeholder="Projet, tâche, catégorie…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="filter-group" aria-label="Filtres par statut">
            {['Tous', ...statuses].map((status) => (
              <button
                className={activeStatus === status ? 'active' : ''}
                key={status}
                type="button"
                onClick={() => setActiveStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="filter-group category-filters" aria-label="Filtres par catégorie">
            {['Toutes', ...categories].map((category) => (
              <button
                className={activeCategory === category ? 'active' : ''}
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="kanban-board">
            {visibleStatuses.map((status) => (
              <section
                className={`kanban-column ${dropTargetStatus === status ? 'drop-target' : ''}`}
                key={status}
                onDragOver={(event) => event.preventDefault()}
                onDragEnter={() => setDropTargetStatus(status)}
                onDragLeave={() => setDropTargetStatus(null)}
                onDrop={() => handleDrop(status)}
                aria-label={`Colonne ${status}`}
              >
                <header className="column-header">
                  <h3>{status}</h3>
                  <span>{tasksByStatus[status].length}</span>
                </header>

                <div className="task-list">
                  {tasksByStatus[status].length > 0 ? (
                    tasksByStatus[status].map((task) => (
                      <article
                        className="task-card"
                        draggable
                        key={task.id}
                        onDragStart={() => setDraggedTaskId(task.id)}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDropTargetStatus(null);
                        }}
                      >
                        <div className="task-content">
                          <div>
                            <div className="task-badges">
                              <span className={`priority priority-${task.priority.toLowerCase()}`}>
                                {task.priority}
                              </span>
                              <span className="category-badge">{task.category}</span>
                            </div>
                            <h4>{task.title}</h4>
                            <p>{task.project}</p>
                          </div>
                          <time dateTime={task.dueDate}>{formatDate(task.dueDate)}</time>
                        </div>

                        {task.notes && <p className="task-notes">{task.notes}</p>}

                        <div className="task-footer">
                          <select value={task.status} onChange={(event) => moveTask(task.id, event.target.value)}>
                            {statuses.map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                          </select>
                          <div className="card-actions">
                            <button type="button" onClick={() => startEditing(task)}>
                              Éditer
                            </button>
                            <button className="danger-button" type="button" onClick={() => deleteTask(task.id)}>
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="empty-state">Déposez une tâche ici ou ajustez les filtres.</p>
                  )}
                </div>
              </section>
            ))}
          </div>
        </section>

        <aside className="panel form-panel" aria-labelledby="task-form-title">
          <p className="eyebrow">{isEditing ? 'Modification' : 'Nouvelle action'}</p>
          <h2 id="task-form-title">{isEditing ? 'Éditer la tâche' : 'Ajouter une tâche'}</h2>
          <form onSubmit={handleSubmit}>
            <label>
              Titre
              <input
                required
                type="text"
                placeholder="Ex. Relire les maquettes"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </label>

            <label>
              Projet
              <input
                required
                type="text"
                placeholder="Ex. Refonte mobile"
                value={form.project}
                onChange={(event) => setForm({ ...form, project: event.target.value })}
              />
            </label>

            <label>
              Notes
              <textarea
                placeholder="Contexte, checklist, prochaine action…"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </label>

            <div className="form-row">
              <label>
                Catégorie
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label>
                Priorité
                <select
                  value={form.priority}
                  onChange={(event) => setForm({ ...form, priority: event.target.value })}
                >
                  {priorities.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                Statut
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label>
                Échéance
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                />
              </label>
            </div>

            <button className="primary-button" type="submit">
              {isEditing ? 'Enregistrer' : 'Créer la tâche'}
            </button>
            {isEditing && (
              <button className="secondary-button" type="button" onClick={resetForm}>
                Annuler l’édition
              </button>
            )}
          </form>
        </aside>
      </div>
    </main>
  );
}

export default App;
