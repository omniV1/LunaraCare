import React, { useState, useEffect } from 'react';

type Priority = 'HIGH' | 'MID' | 'LOW';

interface TodoItem {
  id: string;
  text: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  HIGH: { label: 'High', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  MID: { label: 'Mid', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  LOW: { label: 'Low', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
};

const STORAGE_KEY = 'lunara_provider_todos';

export const ProviderTodoList: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('MID');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setTodos(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const persist = (items: TodoItem[]) => {
    setTodos(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const item: TodoItem = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: newText.trim(),
      priority: newPriority,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    persist([item, ...todos]);
    setNewText('');
  };

  const toggleTodo = (id: string) => {
    persist(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTodo = (id: string) => {
    persist(todos.filter(t => t.id !== id));
  };

  const sorted = [...todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const order: Record<Priority, number> = { HIGH: 0, MID: 1, LOW: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
      <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
        <h2 className="text-lg font-medium text-dash-text-primary">Personal To-Do</h2>
        <p className="text-sm text-dash-text-secondary/60 mt-1">Track your tasks by priority.</p>
      </div>
      <div className="p-4 sm:p-6">
        <form onSubmit={addTodo} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="Add a task..."
            className="flex-1 px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4D37]/30 bg-transparent text-dash-text-primary placeholder:text-dash-text-secondary/40"
          />
          <select
            value={newPriority}
            onChange={e => setNewPriority(e.target.value as Priority)}
            className="px-2 py-2 text-xs border border-dash-border rounded-lg bg-transparent text-dash-text-secondary focus:outline-none"
          >
            <option value="HIGH">High</option>
            <option value="MID">Mid</option>
            <option value="LOW">Low</option>
          </select>
          <button
            type="submit"
            className="px-3 py-2 text-sm font-medium text-white bg-[#6B4D37] hover:bg-[#5a402e] rounded-lg transition-colors"
          >
            Add
          </button>
        </form>

        {sorted.length === 0 ? (
          <p className="text-sm text-dash-text-secondary/60 text-center py-4">No tasks yet.</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map(todo => {
              const cfg = PRIORITY_CONFIG[todo.priority];
              return (
                <li
                  key={todo.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    todo.completed
                      ? 'opacity-50 bg-[#EDE8E0]/30 border-dash-border'
                      : `${cfg.bg} ${cfg.border}`
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleTodo(todo.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      todo.completed
                        ? 'bg-[#6B4D37] border-[#6B4D37]'
                        : 'border-dash-border hover:border-[#6B4D37]'
                    }`}
                  >
                    {todo.completed && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={`flex-1 text-sm ${
                    todo.completed
                      ? 'line-through text-dash-text-secondary/60'
                      : 'text-dash-text-primary'
                  }`}>
                    {todo.text}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg} ${cfg.border} border`}>
                    {cfg.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeTodo(todo.id)}
                    className="text-dash-text-secondary/40 hover:text-red-500 transition-colors shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
