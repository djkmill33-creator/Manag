import { useMemo, useState } from 'react';

const initialTasks = [
  {
    id: 1,
    title: 'Finaliser la proposition client',
    project: 'Design system',
    priority: 'Haute',
    status: 'En cours',
    dueDate: '2026-06-03',
  },
  {
    id: 2,
    title: 'Préparer le sprint planning',
    project: 'Produit',
    priority: 'Moyenne',
    status: 'À faire',
    dueDate: '2026-06-05',
  },
  {
    id: 3,
    title: 'Auditer le parcours d’inscription',
    project: 'Growth',
    priority: 'Haute',
    status: 'À faire',
    dueDate: '2026-06-07',
  },
  {
    id: 4,
    title: 'Publier le compte-rendu hebdo',
    project: 'Opérations',
    priority: 'Basse',
    status: 'Terminé',
    dueDate: '2026-05-30',
  },
];

const statuses = ['À faire', 'En cours', 'Terminé'];
const priorities = ['Basse', 'Moyenne', 'Haute'];

function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`));
}

function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeStatus, setActiveStatus] = useState('Tous');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    title: '',
    project: '',
    priority: 'Moyenne',
    status: 'À faire',
    dueDate: new Date().toISOString().slice(0, 10),
  });

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesStatus = activeStatus === 'Tous' || task.status === activeStatus;
      const matchesSearch =
        !normalizedSearch ||
        task.title.toLowerCase().includes(normalizedSearch) ||
        task.project.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [activeStatus, search, tasks]);

  const metrics = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'Terminé').length;
    const inProgress = tasks.filter((task) => task.status === 'En cours').length;
    const highPriority = tasks.filter((task) => task.priority === 'Haute').length;

    return [
      { label: 'Tâches totales', value: tasks.length },
      { label: 'En cours', value: inProgress },
      { label: 'Priorité haute', value: highPriority },
      { label: 'Terminées', value: completed },
    ];
  }, [tasks]);

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.project.trim()) {
      return;
    }

    setTasks((currentTasks) => [
      {
        ...form,
        id: Date.now(),
        title: form.title.trim(),
        project: form.project.trim(),
      },
      ...currentTasks,
    ]);

    setForm({
      title: '',
      project: '',
      priority: 'Moyenne',
      status: 'À faire',
      dueDate: new Date().toISOString().slice(0, 10),
    });
  }

  function updateTaskStatus(taskId, nextStatus) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)),
    );
  }

  function deleteTask(taskId) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  }

  return (
    <main className="app-shell">
      <section className="hero-card" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Tableau de bord productivité</p>
          <h1 id="page-title">Organisez les tâches d’équipe avec élégance.</h1>
          <p className="hero-copy">
            Priorisez, filtrez et suivez l’avancement de vos projets dans une interface claire,
            rapide et pensée pour l’action.
          </p>
        </div>
        <div className="hero-actions" aria-label="Résumé rapide">
          <span className="pulse-dot" />
          <strong>{tasks.filter((task) => task.status !== 'Terminé').length}</strong>
          <span>tâches actives</span>
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
        <section className="panel task-panel" aria-labelledby="task-list-title">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Vue Kanban légère</p>
              <h2 id="task-list-title">Liste des tâches</h2>
            </div>
            <label className="search-box">
              <span>Rechercher</span>
              <input
                type="search"
                placeholder="Projet ou tâche…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="status-tabs" role="tablist" aria-label="Filtrer par statut">
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

          <div className="task-list">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <article className="task-card" key={task.id}>
                  <div className="task-content">
                    <div>
                      <span className={`priority priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                      <h3>{task.title}</h3>
                      <p>{task.project}</p>
                    </div>
                    <time dateTime={task.dueDate}>{formatDate(task.dueDate)}</time>
                  </div>

                  <div className="task-footer">
                    <label>
                      <span>Statut</span>
                      <select
                        value={task.status}
                        onChange={(event) => updateTaskStatus(task.id, event.target.value)}
                      >
                        {statuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                    <button type="button" onClick={() => deleteTask(task.id)}>
                      Supprimer
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-state">Aucune tâche ne correspond à ce filtre.</p>
            )}
          </div>
        </section>

        <aside className="panel form-panel" aria-labelledby="new-task-title">
          <p className="eyebrow">Nouvelle action</p>
          <h2 id="new-task-title">Ajouter une tâche</h2>
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

            <div className="form-row">
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
              <label>
                Échéance
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                />
              </label>
            </div>

            <label>
              Statut
              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>

            <button className="primary-button" type="submit">
              Créer la tâche
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}

export default App;
