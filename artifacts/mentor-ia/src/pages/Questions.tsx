import { useState } from "react";
import {
  useListQuestions,
  useCreateQuestion,
  useGetQuestionStats,
  getListQuestionsQueryKey,
  getGetQuestionStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, SkipForward, ChevronLeft, ChevronRight } from "lucide-react";

const ALL_SUBJECTS = [
  "biologia","quimica","fisica","matematica","redacao","ch","lc",
  "python","javascript","typescript","algoritmos","estrutura-dados","leetcode",
];

export default function Questions() {
  const [subject, setSubject] = useState("biologia");
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | "skipped">("correct");
  const [difficulty, setDifficulty] = useState(3);
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterResult, setFilterResult] = useState("");

  const createQuestion = useCreateQuestion();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: questionsData, isLoading: loadingQ } = useListQuestions({
    page,
    limit: 15,
    subject: filterSubject || undefined,
    result: filterResult as "correct" | "wrong" | "skipped" | undefined,
  });

  const { data: stats } = useGetQuestionStats();

  async function handleRegister() {
    try {
      await createQuestion.mutateAsync({
        data: { subject, topic: topic || null, result, difficulty, source: source || null },
      });
      toast({ title: "Questão registrada!" });
      setTopic("");
      setSource("");
      queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetQuestionStatsQueryKey() });
    } catch {
      toast({ title: "Erro ao registrar", variant: "destructive" });
    }
  }

  const resultConfig = {
    correct: { label: "Acertei", color: "#3ecf8e", icon: CheckCircle2 },
    wrong: { label: "Errei", color: "#ef4444", icon: XCircle },
    skipped: { label: "Pulei", color: "#fbbf24", icon: SkipForward },
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "Syne, sans-serif" }}>
        Banco de Questões
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Register form */}
        <div
          className="rounded-2xl border p-6"
          style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
        >
          <h2 className="font-semibold mb-5 text-sm">Registrar Questão</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Matéria</label>
              <select
                data-testid="select-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl text-sm px-3 py-2.5 outline-none"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "none" }}
              >
                {ALL_SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Tópico (opcional)</label>
              <input
                data-testid="input-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="ex: Genética mendeliana"
                className="w-full rounded-xl text-sm px-3 py-2.5 outline-none"
                style={{ background: "hsl(var(--muted))", border: "none", color: "hsl(var(--foreground))" }}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Resultado</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.entries(resultConfig) as [keyof typeof resultConfig, typeof resultConfig[keyof typeof resultConfig]][]).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={key}
                      data-testid={`result-${key}`}
                      onClick={() => setResult(key)}
                      className="py-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all"
                      style={{
                        background: result === key ? `${cfg.color}20` : "hsl(var(--muted))",
                        color: result === key ? cfg.color : "hsl(var(--muted-foreground))",
                        border: `1px solid ${result === key ? `${cfg.color}40` : "transparent"}`,
                      }}
                    >
                      <Icon size={16} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs text-muted-foreground">Dificuldade</label>
                <span className="text-xs font-medium" style={{ color: "#7c6af5" }}>{difficulty}/5</span>
              </div>
              <input
                type="range" min={1} max={5} step={1} value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full accent-[#7c6af5]"
                data-testid="slider-difficulty"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Fonte (opcional)</label>
              <input
                data-testid="input-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="ex: ENEM 2023"
                className="w-full rounded-xl text-sm px-3 py-2.5 outline-none"
                style={{ background: "hsl(var(--muted))", border: "none", color: "hsl(var(--foreground))" }}
              />
            </div>

            <button
              data-testid="button-register-question"
              onClick={handleRegister}
              disabled={createQuestion.isPending}
              className="w-full py-3 rounded-xl font-medium text-white text-sm transition-all"
              style={{ background: "#7c6af5" }}
            >
              {createQuestion.isPending ? "Registrando..." : "Registrar"}
            </button>
          </div>
        </div>

        {/* Right: stats + history */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stats bars */}
          {(stats?.length ?? 0) > 0 && (
            <div
              className="rounded-2xl border p-5"
              style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
            >
              <h3 className="font-semibold text-sm mb-4">Taxa de Acerto por Matéria</h3>
              <div className="space-y-3">
                {stats?.map((s) => (
                  <div key={s.subject}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize">{s.subject}</span>
                      <span className="font-medium">{s.accuracyPercent}% ({s.total} questões)</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "hsl(var(--muted))" }}>
                      <div
                        className="h-full rounded-full progress-bar"
                        style={{
                          width: `${s.accuracyPercent}%`,
                          background: s.accuracyPercent >= 70 ? "#3ecf8e" : s.accuracyPercent >= 50 ? "#fbbf24" : "#ef4444",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History table */}
          <div
            className="rounded-2xl border"
            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
          >
            <div className="p-5 border-b border-border flex items-center gap-3">
              <h3 className="font-semibold text-sm flex-1">Histórico</h3>
              <select
                value={filterSubject}
                onChange={(e) => { setFilterSubject(e.target.value); setPage(1); }}
                className="text-xs rounded-lg px-2.5 py-1.5 outline-none"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
              >
                <option value="">Todas matérias</option>
                {ALL_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={filterResult}
                onChange={(e) => { setFilterResult(e.target.value); setPage(1); }}
                className="text-xs rounded-lg px-2.5 py-1.5 outline-none"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
              >
                <option value="">Todos resultados</option>
                <option value="correct">Acertei</option>
                <option value="wrong">Errei</option>
                <option value="skipped">Pulei</option>
              </select>
            </div>

            {loadingQ ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 skeleton rounded" />
                ))}
              </div>
            ) : (questionsData?.data?.length ?? 0) === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm">
                Nenhuma questão registrada ainda
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 pl-5 text-muted-foreground font-medium">Matéria</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Tópico</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Resultado</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Dif.</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questionsData?.data?.map((q) => {
                        const cfg = resultConfig[q.result as keyof typeof resultConfig];
                        const Icon = cfg?.icon ?? CheckCircle2;
                        return (
                          <tr key={q.id} className="border-b border-border last:border-0 hover:bg-accent transition-colors">
                            <td className="p-3 pl-5 capitalize font-medium">{q.subject}</td>
                            <td className="p-3 text-muted-foreground">{q.topic ?? "–"}</td>
                            <td className="p-3">
                              <span className="flex items-center gap-1" style={{ color: cfg?.color }}>
                                <Icon size={13} /> {cfg?.label}
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground">{q.difficulty ?? "–"}/5</td>
                            <td className="p-3 text-muted-foreground">
                              {new Date(q.createdAt).toLocaleDateString("pt-BR")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    {questionsData?.total ?? 0} questões no total
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40"
                      style={{ background: "hsl(var(--muted))" }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs py-1 px-2">{page}</span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * 15 >= (questionsData?.total ?? 0)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40"
                      style={{ background: "hsl(var(--muted))" }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
