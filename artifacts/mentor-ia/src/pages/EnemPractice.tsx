import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  Filter, Award, Clock, Target, RefreshCw, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const DISCIPLINE_LABELS: Record<string, string> = {
  "linguagens": "Linguagens",
  "ciencias-humanas": "Ciências Humanas",
  "ciencias-natureza": "Ciências da Natureza",
  "matematica": "Matemática",
};

const DISCIPLINE_COLORS: Record<string, string> = {
  "linguagens": "#7c6af5",
  "ciencias-humanas": "#f97316",
  "ciencias-natureza": "#3ecf8e",
  "matematica": "#fbbf24",
};

interface Exam { year: number; title: string; disciplines: { label: string; value: string }[] }
interface Alternative { letter: string; text: string; isCorrect: boolean; file?: string | null }
interface Question {
  index: number; year: number; title: string; discipline: string;
  context: string; alternativesIntroduction: string;
  alternatives: Alternative[]; correctAlternative: string;
  files: string[];
  practice?: { selectedAlternative: string; isCorrect: boolean } | null;
}
interface PracticeStats {
  total: number; correct: number; accuracy: number;
  byDiscipline: { discipline: string; total: number; correct: number; accuracy: number }[];
}

function renderMarkdown(text: string) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\n/g, "<br/>");
}

export default function EnemPractice() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("");
  const [page, setPage] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const LIMIT = 10;

  const { data: exams = [] } = useQuery<Exam[]>({
    queryKey: ["enem-exams"],
    queryFn: () => fetch(`${BASE}/api/enem/exams`).then(r => r.json()),
  });

  const { data: questData, isFetching } = useQuery<{ questions: Question[]; metadata: any }>({
    queryKey: ["enem-questions", selectedYear, selectedDiscipline, page],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) });
      if (selectedDiscipline) params.set("discipline", selectedDiscipline);
      return fetch(`${BASE}/api/enem/exams/${selectedYear}/questions?${params}`).then(r => r.json());
    },
    enabled: !!selectedYear,
  });

  const { data: stats } = useQuery<PracticeStats>({
    queryKey: ["enem-stats"],
    queryFn: () => fetch(`${BASE}/api/enem/practice/stats`).then(r => r.json()),
  });

  const practice = useMutation({
    mutationFn: (body: any) =>
      fetch(`${BASE}/api/enem/practice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enem-stats"] });
      qc.invalidateQueries({ queryKey: ["enem-questions"] });
    },
  });

  const questions = questData?.questions ?? [];
  const total = questData?.metadata?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const q = questions[currentQ];

  useEffect(() => {
    setCurrentQ(0);
    setSelected(null);
    setRevealed(false);
    setStartTime(Date.now());
  }, [page, selectedDiscipline, selectedYear]);

  useEffect(() => {
    setSelected(null);
    setRevealed(false);
    setStartTime(Date.now());
  }, [currentQ]);

  function handleAnswer(letter: string) {
    if (revealed) return;
    setSelected(letter);
  }

  function handleReveal() {
    if (!selected || !q) return;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    setRevealed(true);
    practice.mutate({
      year: q.year,
      questionIndex: q.index,
      discipline: q.discipline,
      selectedAlternative: selected,
      correctAlternative: q.correctAlternative,
      timeSpentSeconds: timeSpent,
    });
  }

  function nextQuestion() {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
    } else if (page < totalPages - 1) {
      setPage(p => p + 1);
    }
  }

  function prevQuestion() {
    if (currentQ > 0) setCurrentQ(c => c - 1);
    else if (page > 0) { setPage(p => p - 1); setCurrentQ(LIMIT - 1); }
  }

  const globalIndex = page * LIMIT + currentQ + 1;
  const isPracticed = q?.practice != null;
  const isCorrect = selected === q?.correctAlternative;

  const availableYears = exams.map(e => e.year).sort((a, b) => b - a);
  const availableDisciplines = exams.find(e => e.year === selectedYear)?.disciplines ?? [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
              Questões do ENEM
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Questões reais dos exames de 2009 a 2023
            </p>
          </div>
          {stats && (
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 rounded-xl border border-border bg-card">
                <div className="text-xs text-muted-foreground">Respondidas</div>
                <div className="text-xl font-bold" style={{ color: "#7c6af5" }}>{stats.total}</div>
              </div>
              <div className="text-center px-4 py-2 rounded-xl border border-border bg-card">
                <div className="text-xs text-muted-foreground">Acertos</div>
                <div className="text-xl font-bold" style={{ color: "#3ecf8e" }}>{stats.accuracy}%</div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Filtros:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {availableYears.slice(0, 8).map(y => (
              <button
                key={y}
                onClick={() => { setSelectedYear(y); setPage(0); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                  selectedYear === y
                    ? "border-purple-500 text-purple-400 bg-purple-500/10"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-border" />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setSelectedDiscipline(""); setPage(0); }}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                !selectedDiscipline
                  ? "border-purple-500 text-purple-400 bg-purple-500/10"
                  : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              Todas
            </button>
            {availableDisciplines.map(d => (
              <button
                key={d.value}
                onClick={() => { setSelectedDiscipline(d.value); setPage(0); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                  selectedDiscipline === d.value
                    ? "border-purple-500 text-purple-400 bg-purple-500/10"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {DISCIPLINE_LABELS[d.value] ?? d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question area */}
        <div className="flex-1 overflow-y-auto p-6">
          {isFetching ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : !q ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <AlertCircle size={32} className="mb-2" />
              <p>Nenhuma questão encontrada</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {/* Question header */}
              <div className="flex items-center gap-3 mb-4">
                <Badge
                  className="text-xs font-semibold border-0"
                  style={{
                    background: `${DISCIPLINE_COLORS[q.discipline]}20`,
                    color: DISCIPLINE_COLORS[q.discipline],
                  }}
                >
                  {DISCIPLINE_LABELS[q.discipline] ?? q.discipline}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ENEM {q.year} — Questão {q.index}
                </span>
                {isPracticed && (
                  <Badge className="text-xs border-0 bg-emerald-500/10 text-emerald-400">
                    ✓ Respondida
                  </Badge>
                )}
              </div>

              {/* Context */}
              {q.context && (
                <div
                  className="p-4 rounded-xl border border-border bg-card/50 mb-4 text-sm leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(q.context) }}
                />
              )}

              {/* Introduction */}
              {q.alternativesIntroduction && (
                <p
                  className="text-sm font-medium mb-4 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(q.alternativesIntroduction) }}
                />
              )}

              {/* Alternatives */}
              <div className="space-y-2 mb-6">
                {q.alternatives.map(alt => {
                  const isSelected = selected === alt.letter;
                  const isRight = alt.letter === q.correctAlternative;
                  let style: React.CSSProperties = {};
                  let cls = "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all text-sm";

                  if (revealed) {
                    if (isRight) {
                      style = { borderColor: "#3ecf8e60", background: "#3ecf8e15" };
                      cls += " cursor-default";
                    } else if (isSelected && !isRight) {
                      style = { borderColor: "#ef444460", background: "#ef444415" };
                      cls += " cursor-default";
                    } else {
                      cls += " opacity-50 cursor-default border-border bg-card/30";
                    }
                  } else {
                    if (isSelected) {
                      style = { borderColor: "#7c6af560", background: "#7c6af515" };
                    } else {
                      cls += " border-border hover:border-muted-foreground bg-card/30 hover:bg-card/60";
                    }
                  }

                  return (
                    <div key={alt.letter} className={cls} style={style} onClick={() => handleAnswer(alt.letter)}>
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={
                          revealed && isRight
                            ? { background: "#3ecf8e", color: "#000" }
                            : revealed && isSelected && !isRight
                            ? { background: "#ef4444", color: "#fff" }
                            : isSelected
                            ? { background: "#7c6af5", color: "#fff" }
                            : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                        }
                      >
                        {alt.letter}
                      </span>
                      <span className="leading-relaxed">{alt.text}</span>
                      {revealed && isRight && <CheckCircle size={16} className="ml-auto flex-shrink-0 mt-0.5" style={{ color: "#3ecf8e" }} />}
                      {revealed && isSelected && !isRight && <XCircle size={16} className="ml-auto flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />}
                    </div>
                  );
                })}
              </div>

              {/* Reveal / Result */}
              {!revealed ? (
                <Button
                  onClick={handleReveal}
                  disabled={!selected || practice.isPending}
                  className="w-full"
                  style={{ background: selected ? "linear-gradient(135deg, #7c6af5, #5b52d4)" : undefined }}
                >
                  {practice.isPending ? "Registrando..." : "Confirmar Resposta"}
                </Button>
              ) : (
                <div
                  className="p-4 rounded-xl flex items-center gap-3 mb-2"
                  style={
                    isCorrect
                      ? { background: "#3ecf8e15", border: "1px solid #3ecf8e40" }
                      : { background: "#ef444415", border: "1px solid #ef444440" }
                  }
                >
                  {isCorrect ? (
                    <CheckCircle size={20} style={{ color: "#3ecf8e" }} />
                  ) : (
                    <XCircle size={20} style={{ color: "#ef4444" }} />
                  )}
                  <div>
                    <p className="font-semibold text-sm">
                      {isCorrect ? "Resposta correta!" : "Resposta incorreta"}
                    </p>
                    {!isCorrect && (
                      <p className="text-xs text-muted-foreground">
                        Alternativa correta: <strong>{q.correctAlternative}</strong>
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={nextQuestion}
                    className="ml-auto"
                    style={{ background: "linear-gradient(135deg, #7c6af5, #5b52d4)" }}
                  >
                    Próxima <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel — navigation + stats */}
        <div className="w-[240px] flex-shrink-0 border-l border-border p-4 overflow-y-auto space-y-4">
          {/* Navigation */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Questão {globalIndex} / {total}
            </p>
            <Progress value={total > 0 ? (globalIndex / total) * 100 : 0} className="h-1.5 mb-3" />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={prevQuestion}
                disabled={page === 0 && currentQ === 0}
                className="flex-1 h-8 text-xs"
              >
                <ChevronLeft size={12} /> Ant.
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={nextQuestion}
                disabled={page >= totalPages - 1 && currentQ >= questions.length - 1}
                className="flex-1 h-8 text-xs"
              >
                Próx. <ChevronRight size={12} />
              </Button>
            </div>
          </div>

          {/* Question list */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Nesta página
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((qi, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`h-7 w-full rounded text-xs font-medium transition-all ${
                    i === currentQ ? "ring-1 ring-purple-500" : ""
                  }`}
                  style={
                    qi.practice?.isCorrect
                      ? { background: "#3ecf8e20", color: "#3ecf8e" }
                      : qi.practice && !qi.practice.isCorrect
                      ? { background: "#ef444420", color: "#ef4444" }
                      : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                  }
                >
                  {page * LIMIT + i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Page navigation */}
          {totalPages > 1 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Páginas
              </p>
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: Math.min(totalPages, 12) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`h-7 rounded text-xs font-medium transition-all ${
                      page === i
                        ? "text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    style={page === i ? { background: "#7c6af5" } : {}}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats by discipline */}
          {stats && stats.byDiscipline.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Desempenho
              </p>
              <div className="space-y-2">
                {stats.byDiscipline.map(d => (
                  <div key={d.discipline}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-muted-foreground truncate">{DISCIPLINE_LABELS[d.discipline] ?? d.discipline}</span>
                      <span style={{ color: DISCIPLINE_COLORS[d.discipline] ?? "#7c6af5" }}>{d.accuracy}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${d.accuracy}%`,
                          background: DISCIPLINE_COLORS[d.discipline] ?? "#7c6af5",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
