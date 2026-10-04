import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ListTodo,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Tag,
  Search,
  ArrowRight,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface BacklogItem {
  id: string;
  title: string;
  description: string;
  category:
    | 'Smart Grid'
    | 'Digital Twin'
    | 'OZE & BESS'
    | 'E-Mobility'
    | 'Cybersecurity'
    | 'AI & ML';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedHours: number;
  status: 'todo' | 'in_progress' | 'done';
  createdAt: string;
}

const INITIAL_BACKLOG: BacklogItem[] = [
  {
    id: 'task-1',
    title: 'Integracja bezpośredniego strumieniowania SCADA IEC 60870-5-104',
    description:
      'Implementacja konektora protokołu telemetrycznego 104 do bezpośredniego odpytywania sterowników polowych w GPZ Gdańsk.',
    category: 'Smart Grid',
    priority: 'critical',
    estimatedHours: 48,
    status: 'in_progress',
    createdAt: '2026-10-01',
  },
  {
    id: 'task-2',
    title: 'Model symulacji rozładowania BESS Żarnowiec w Three.js',
    description:
      'Dodanie dynamicznych cząsteczek przepływu prądu i wskaźnika nagrzewania ogniw w Bliźniaku Cyfrowym 3D.',
    category: 'Digital Twin',
    priority: 'high',
    estimatedHours: 36,
    status: 'in_progress',
    createdAt: '2026-10-02',
  },
  {
    id: 'task-3',
    title: 'Algorytm predykcji generacji morskiego wiatru z Open-Meteo',
    description:
      'Wykorzystanie prognoz prędkości wiatru na 100m npm do estymacji produkcji farmy MFW Bałtyk Środkowy.',
    category: 'OZE & BESS',
    priority: 'high',
    estimatedHours: 28,
    status: 'todo',
    createdAt: '2026-10-03',
  },
  {
    id: 'task-4',
    title: 'Moduł rezerwacji slotów ładowania EV z protokołem OCPP 2.0.1',
    description:
      'Zarządzanie harmonogramem ładowania pojazdów w oparciu o profil cenowy energii na Pomorzu.',
    category: 'E-Mobility',
    priority: 'medium',
    estimatedHours: 40,
    status: 'todo',
    createdAt: '2026-10-04',
  },
  {
    id: 'task-5',
    title: 'Wdrożenie szyfrowania mTLS i audytu NIS2 dla połączeń API',
    description:
      'Weryfikacja certyfikatów klientów i wdrożenie tokenów JWT z rotacją kluczy asymetrycznych.',
    category: 'Cybersecurity',
    priority: 'critical',
    estimatedHours: 32,
    status: 'done',
    createdAt: '2026-09-28',
  },
  {
    id: 'task-6',
    title: 'Zainicjowanie Biome.js zamiast ESLint i Prettier',
    description:
      'Przyspieszenie sprawdzania składni i formatowania kodu projektu do ułamków sekund.',
    category: 'Smart Grid',
    priority: 'high',
    estimatedHours: 8,
    status: 'done',
    createdAt: '2026-10-04',
  },
];

const STORAGE_KEY = 'smartgrid_private_backlog_tasks';

export function PrivateBacklog() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<BacklogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse backlog from localStorage', e);
    }
    return INITIAL_BACKLOG;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<BacklogItem['category']>('Smart Grid');
  const [newPriority, setNewPriority] = useState<BacklogItem['priority']>('high');
  const [newHours, setNewHours] = useState(16);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save backlog to localStorage', e);
    }
  }, [tasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: BacklogItem = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Brak dodatkowego opisu zadania.',
      category: newCategory,
      priority: newPriority,
      estimatedHours: Number(newHours) || 8,
      status: 'todo',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setTasks((prev) => [newTask, ...prev]);
    setIsAddingNew(false);
    setNewTitle('');
    setNewDesc('');
    toast({
      title: 'Dodano zadanie do backlogu',
      description: `Utworzono: "${newTask.title}" (${newTask.estimatedHours} RBH).`,
    });
  };

  const moveTask = (taskId: string, newStatus: BacklogItem['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast({
      title: 'Zadanie usunięte',
      description: 'Zadanie zostało usunięte z prywatnego backlogu.',
    });
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress');
  const doneTasks = filteredTasks.filter((t) => t.status === 'done');

  const totalRbh = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const doneRbh = tasks
    .filter((t) => t.status === 'done')
    .reduce((sum, t) => sum + t.estimatedHours, 0);
  const progressPct = totalRbh > 0 ? Math.round((doneRbh / totalRbh) * 100) : 0;

  return (
    <Card className="border shadow-md">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ListTodo className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl font-bold">
                Prywatny Backlog Projektu Smart Grid
              </CardTitle>
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                Tablica Kanban & RBH
              </Badge>
            </div>
            <CardDescription className="mt-1 text-sm">
              Zarządzaj planowanymi funkcjonalnościami, priorytetami wdrożenia i szacunkami
              roboczogodzin.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              Postęp prac: {progressPct}% ({doneRbh} / {totalRbh} RBH)
            </Badge>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingNew ? 'Anuluj' : 'Dodaj Zadanie'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* NEW TASK FORM */}
        {isAddingNew && (
          <form onSubmit={handleAddTask} className="p-4 bg-muted/40 border rounded-lg space-y-3">
            <div className="font-bold text-sm text-foreground">Dodaj nowe zadanie do wdrożenia</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Tytuł zadania (np. Obsługa protokołu DNP3)..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="text-xs bg-background"
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="bg-background border rounded px-2 text-xs"
                >
                  <option value="Smart Grid">Smart Grid</option>
                  <option value="Digital Twin">Digital Twin</option>
                  <option value="OZE & BESS">OZE & BESS</option>
                  <option value="E-Mobility">E-Mobility</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="AI & ML">AI & ML</option>
                </select>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="bg-background border rounded px-2 text-xs"
                >
                  <option value="critical">Krytyczny</option>
                  <option value="high">Wysoki</option>
                  <option value="medium">Średni</option>
                  <option value="low">Niski</option>
                </select>
                <Input
                  type="number"
                  placeholder="RBH"
                  value={newHours}
                  onChange={(e) => setNewHours(Number(e.target.value))}
                  min={1}
                  className="text-xs bg-background"
                />
              </div>
            </div>
            <Input
              placeholder="Krótki opis techniczny zadania..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="text-xs bg-background"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddingNew(false)}
                className="text-xs h-8"
              >
                Anuluj
              </Button>
              <Button type="submit" size="sm" className="text-xs h-8">
                Zapisz w Backlogu
              </Button>
            </div>
          </form>
        )}

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="w-full sm:w-72 relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Filtruj zadania w backlogu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground mr-1 text-[11px] uppercase">Kategoria:</span>
            {['all', 'Smart Grid', 'Digital Twin', 'OZE & BESS', 'E-Mobility', 'Cybersecurity'].map(
              (cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === 'all' ? 'Wszystkie' : cat}
                </Button>
              )
            )}
          </div>
        </div>

        {/* KANBAN BOARD (3 COLUMNS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* COLUMN 1: TO DO */}
          <div className="p-3 bg-muted/20 border rounded-lg space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Do Wdrożenia ({todoTasks.length})
              </div>
              <Badge variant="outline" className="text-[10px]">
                {todoTasks.reduce((s, t) => s + t.estimatedHours, 0)} RBH
              </Badge>
            </div>

            <div className="space-y-2.5">
              {todoTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onMove={(newStatus) => moveTask(task.id, newStatus)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
              {todoTasks.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Brak zadań w kolejce
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: IN PROGRESS */}
          <div className="p-3 bg-muted/20 border rounded-lg space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-primary" />W Trakcie Prac (
                {inProgressTasks.length})
              </div>
              <Badge variant="outline" className="text-[10px]">
                {inProgressTasks.reduce((s, t) => s + t.estimatedHours, 0)} RBH
              </Badge>
            </div>

            <div className="space-y-2.5">
              {inProgressTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onMove={(newStatus) => moveTask(task.id, newStatus)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
              {inProgressTasks.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Brak aktywnych zadań
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: DONE */}
          <div className="p-3 bg-muted/20 border rounded-lg space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="font-bold text-xs uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Zakończone ({doneTasks.length})
              </div>
              <Badge variant="outline" className="text-[10px]">
                {doneTasks.reduce((s, t) => s + t.estimatedHours, 0)} RBH
              </Badge>
            </div>

            <div className="space-y-2.5">
              {doneTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onMove={(newStatus) => moveTask(task.id, newStatus)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
              {doneTasks.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Brak ukończonych zadań
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskCard({
  task,
  onMove,
  onDelete,
}: {
  task: BacklogItem;
  onMove: (status: BacklogItem['status']) => void;
  onDelete: () => void;
}) {
  const priorityColor = () => {
    if (task.priority === 'critical') return 'text-red-500 border-red-500/30 bg-red-500/10';
    if (task.priority === 'high') return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
    return 'text-blue-500 border-blue-500/30 bg-blue-500/10';
  };

  return (
    <div className="p-3 bg-card border rounded-lg shadow-sm space-y-2 text-xs">
      <div className="flex justify-between items-start gap-2">
        <Badge variant="outline" className={`text-[9px] uppercase font-bold ${priorityColor()}`}>
          {task.priority}
        </Badge>
        <span className="font-mono text-[10px] text-muted-foreground">
          {task.estimatedHours} RBH
        </span>
      </div>

      <div className="font-bold text-foreground text-xs leading-snug">{task.title}</div>
      <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
        {task.description}
      </p>

      <div className="flex items-center justify-between pt-1 border-t text-[10px] text-muted-foreground">
        <span>{task.category}</span>
        <div className="flex items-center gap-1">
          {task.status !== 'todo' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onMove(task.status === 'done' ? 'in_progress' : 'todo')}
              title="Cofnij"
            >
              <ArrowLeft className="w-3 h-3" />
            </Button>
          )}
          {task.status !== 'done' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-primary"
              onClick={() => onMove(task.status === 'todo' ? 'in_progress' : 'done')}
              title="Przesuń dalej"
            >
              <ArrowRight className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-500 hover:text-red-600"
            onClick={onDelete}
            title="Usuń"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
