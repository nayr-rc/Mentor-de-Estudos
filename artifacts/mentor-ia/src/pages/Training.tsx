import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Code2, CheckCircle, Clock, ExternalLink, Search,
  SlidersHorizontal, Trophy, Zap, Target, Circle,
  ChevronRight, BookOpen, Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Exercise {
  id: number;
  title: string;
  platform: string;
  platformId?: string;
  url?: string;
  category: string;
  difficulty: string;
  description?: string;
  tags?: string[];
  status: "pending" | "in_progress" | "solved" | "skipped";
  notes?: string;
  attempts: number;
  solvedAt?: string;
}

interface TrainingStats {
  total: number;
  solved: number;
  inProgress: number;
  pending: number;
  byCategory: { category: string; total: number; solved: number }[];
  byDifficulty: { difficulty: string; total: number; solved: number }[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#3ecf8e",
  medium: "#fbbf24",
  hard: "#f97316",
};
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Circle, color: "hsl(var(--muted-foreground))", label: "Pendente" },
  in_progress: { icon: Clock, color: "#fbbf24", label: "Em andamento" },
  solved: { icon: CheckCircle, color: "#3ecf8e", label: "Resolvido" },
  skipped: { icon: ChevronRight, color: "#6b7280", label: "Pulado" },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Arrays": Cpu,
  "Strings": BookOpen,
  "Recursão": Zap,
  "Algoritmos de Ordenação": SlidersHorizontal,
  "Estruturas de Dados": Code2,
  "Programação Dinâmica": Target,
  "Grafos": Target,
  "Matematica": Target,
  "Fundamentos": BookOpen,
};

export default function Training() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedEx, setSelectedEx] = useState<Exercise | null>(null);
  const [notes, setNotes] = useState("");

  const params = new URLSearchParams();
  if (filterCategory) params.set("category", filterCategory);
  if (filterDifficulty) params.set("difficulty", filterDifficulty);
  if (filterStatus) params.set("status", filterStatus);
  if (search) params.set("search", search);

  const { data: exercises = [], isFetching } = useQuery<Exercise[]>({
    queryKey: ["training-exercises", filterCategory, filterDifficulty, filterStatus, search],
    queryFn: () => fetch(`${BASE}/api/training/exercises?${params}`).then(r => r.json()),
  });

  const { data: stats } = useQuery<TrainingStats>({
    queryKey: ["training-stats"],
    queryFn: () => fetch(`${BASE}/api/training/stats`).then(r => r.json()),
  });

  const updateProgress = useMutation({
    mutationFn: ({ id, ...body }: { id: number; status?: string; notes?: string }) =>
      fetch(`${BASE}/api/training/exercises/${id}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["training-exercises"] });
      qc.invalidateQueries({ queryKey: ["training-stats"] });
      if (selectedEx?.id === data.id) setSelectedEx(data);
      toast({ title: "Progresso atualizado!", description: `${data.title} — ${DIFFICULTY_LABELS[data.difficulty]}` });
    },
  });

  function handleSelect(ex: Exercise) {
    setSelectedEx(ex);
    setNotes(ex.notes ?? "");
  }

  function handleStatusChange(status: string) {
    if (!selectedEx) return;
    updateProgress.mutate({ id: selectedEx.id, status });
  }

  function handleSaveNotes() {
    if (!selectedEx) return;
    updateProgress.mutate({ id: selectedEx.id, notes });
  }

  const categories = [...new Set(exercises.map(e => e.category))];
  const solvedPct = stats ? (stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0) : 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
              Treinos de Programação
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Exercícios curados do LeetCode e Beecrowd
            </p>
          </div>
          {stats && (
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 rounded-xl border border-border bg-card">
                <div className="text-xs text-muted-foreground">Resolvidos</div>
                <div className="text-xl font-bold" style={{ color: "#3ecf8e" }}>
                  {stats.solved}<span className="text-sm text-muted-foreground">/{stats.total}</span>
                </div>
              </div>
              <div className="text-center px-4 py-2 rounded-xl border border-border bg-card">
                <div className="text-xs text-muted-foreground">Conclusão</div>
                <div className="text-xl font-bold" style={{ color: "#7c6af5" }}>{solvedPct}%</div>
              </div>
            </div>
          )}
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar exercício..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs w-48 bg-card"
            />
          </div>
          <div className="flex gap-1.5">
            {["", "easy", "medium", "hard"].map(d => (
              <button
                key={d}
                onClick={() => setFilterDifficulty(d)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                  filterDifficulty === d
                    ? "border-purple-500 text-purple-400 bg-purple-500/10"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {d ? DIFFICULTY_LABELS[d] : "Todos"}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {["", "pending", "in_progress", "solved"].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                  filterStatus === s
                    ? "border-purple-500 text-purple-400 bg-purple-500/10"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {s ? STATUS_CONFIG[s]?.label : "Status"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto">
          {isFetching && exercises.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Carregando exercícios...
            </div>
          ) : exercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Code2 size={32} className="mb-2 opacity-40" />
              <p>Nenhum exercício encontrado</p>
              <p className="text-xs mt-1">Tente mudar os filtros</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {exercises.map(ex => {
                const StatusIcon = STATUS_CONFIG[ex.status]?.icon ?? Circle;
                const statusColor = STATUS_CONFIG[ex.status]?.color ?? "#6b7280";
                const isSelected = selectedEx?.id === ex.id;

                return (
                  <div
                    key={ex.id}
                    onClick={() => handleSelect(ex)}
                    className={`flex items-center gap-4 px-6 py-3.5 cursor-pointer transition-all hover:bg-accent/30 ${
                      isSelected ? "bg-purple-500/5 border-l-2 border-purple-500" : "border-l-2 border-transparent"
                    }`}
                  >
                    <StatusIcon size={16} style={{ color: statusColor, flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{ex.title}</span>
                        {ex.attempts > 0 && ex.status !== "solved" && (
                          <span className="text-xs text-muted-foreground">({ex.attempts}x)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{ex.category}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs font-medium" style={{ color: DIFFICULTY_COLORS[ex.difficulty] }}>
                          {DIFFICULTY_LABELS[ex.difficulty]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant="outline"
                        className="text-xs border-0 rounded-md px-2 py-0.5"
                        style={{ background: "#ffffff08", color: "#888" }}
                      >
                        {ex.platform === "leetcode" ? "LeetCode" : ex.platform === "beecrowd" ? "Beecrowd" : ex.platform}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedEx ? (
          <div className="w-[320px] flex-shrink-0 border-l border-border flex flex-col overflow-hidden">
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {/* Title & badges */}
              <div>
                <h2 className="font-bold text-base mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
                  {selectedEx.title}
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className="text-xs border-0"
                    style={{
                      background: `${DIFFICULTY_COLORS[selectedEx.difficulty]}20`,
                      color: DIFFICULTY_COLORS[selectedEx.difficulty],
                    }}
                  >
                    {DIFFICULTY_LABELS[selectedEx.difficulty]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {selectedEx.category}
                  </Badge>
                  {selectedEx.attempts > 0 && (
                    <span className="text-xs text-muted-foreground">{selectedEx.attempts} tentativa(s)</span>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedEx.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedEx.description}</p>
              )}

              {/* Tags */}
              {selectedEx.tags && selectedEx.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedEx.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "#7c6af515", color: "#7c6af5" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* External link */}
              {selectedEx.url && (
                <a
                  href={selectedEx.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-border hover:bg-accent/30 transition-all w-full"
                >
                  <ExternalLink size={12} />
                  Abrir no {selectedEx.platform === "leetcode" ? "LeetCode" : "Beecrowd"}
                  <ChevronRight size={12} className="ml-auto" />
                </a>
              )}

              {/* Status actions */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Atualizar Status
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(["in_progress", "solved", "pending", "skipped"] as const).map(s => {
                    const Icon = STATUS_CONFIG[s].icon;
                    const isActive = selectedEx.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        disabled={updateProgress.isPending}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          isActive ? "border-purple-500 bg-purple-500/10 text-purple-400" : "border-border hover:bg-accent/30"
                        }`}
                      >
                        <Icon size={12} style={{ color: STATUS_CONFIG[s].color }} />
                        {STATUS_CONFIG[s].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Anotações
                </p>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Suas notas sobre este exercício..."
                  className="text-xs resize-none h-24 bg-card"
                />
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={updateProgress.isPending || notes === (selectedEx.notes ?? "")}
                  className="w-full mt-2 h-8 text-xs"
                  style={{ background: "linear-gradient(135deg, #7c6af5, #5b52d4)" }}
                >
                  Salvar Anotações
                </Button>
              </div>

              {/* Solved at */}
              {selectedEx.solvedAt && (
                <p className="text-xs text-muted-foreground">
                  ✓ Resolvido em {new Date(selectedEx.solvedAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>

            {/* Progress bar */}
            {stats && (
              <div className="border-t border-border p-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Progresso total</span>
                  <span style={{ color: "#7c6af5" }}>{solvedPct}%</span>
                </div>
                <Progress value={solvedPct} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.solved} de {stats.total} exercícios resolvidos
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-[320px] flex-shrink-0 border-l border-border flex items-center justify-center">
            <div className="text-center text-muted-foreground p-6">
              <Code2 size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Selecione um exercício</p>
              <p className="text-xs mt-1 opacity-60">para ver detalhes e atualizar progresso</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
