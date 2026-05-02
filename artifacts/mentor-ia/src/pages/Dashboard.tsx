import { useGetDashboard, useGetMentorInsight, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import {
  Clock, Target, TrendingUp, Code2, Moon, Zap, ArrowRight, RefreshCw, BookOpen,
  CheckCircle2, AlertCircle, Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function StatCard({
  label, value, sub, icon: Icon, color
}: {
  label: string; value: string | number; sub?: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl border p-5 card-hover cursor-default"
      style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <div className="text-3xl font-bold mb-1" style={{ fontFamily: "Syne, sans-serif" }}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {sub && <div className="text-xs mt-1 font-medium" style={{ color }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground capitalize">{label}</span>
        <span className="font-medium">{Math.round(value / 60)}h</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "hsl(var(--muted))" }}>
        <div
          className="h-full rounded-full progress-bar"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

const SUBJECT_COLORS: Record<string, string> = {
  biologia: "#3ecf8e",
  quimica: "#3ecf8e",
  fisica: "#3ecf8e",
  matematica: "#3ecf8e",
  redacao: "#3ecf8e",
  ch: "#3ecf8e",
  lc: "#3ecf8e",
  python: "#f97316",
  algoritmos: "#f97316",
  javascript: "#f97316",
  typescript: "#f97316",
  leetcode: "#f97316",
  programacao: "#f97316",
};

function getSubjectColor(subject: string, category?: string) {
  const lower = subject.toLowerCase();
  return SUBJECT_COLORS[lower] ?? (category === "programacao" ? "#f97316" : "#7c6af5");
}

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetDashboard();
  const getMentorInsight = useGetMentorInsight();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [insightText, setInsightText] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  const greeting = () => {
    const h = new Date().getHours();
    const name = dashboard?.userName ?? "Estudante";
    if (h < 12) return `Bom dia, ${name}`;
    if (h < 18) return `Boa tarde, ${name}`;
    return `Boa noite, ${name}`;
  };

  async function requestInsight() {
    setIsLoadingInsight(true);
    try {
      const result = await getMentorInsight.mutateAsync();
      setInsightText(result.insight);
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    } catch {
      toast({ title: "Erro", description: "Não foi possível gerar insight.", variant: "destructive" });
    } finally {
      setIsLoadingInsight(false);
    }
  }

  const insight = insightText ?? dashboard?.latestInsight;
  const weekSubjects = dashboard?.sessionStats?.bySubject ?? [];
  const maxMinutes = Math.max(...weekSubjects.map((s) => s.totalMinutes), 1);
  const recentSession = dashboard?.recentSessions?.[0];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-64 mb-2" />
            ) : (
              <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
                {greeting()}
              </h1>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          {/* Score bar */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Medicina</div>
              <div className="text-2xl font-bold" style={{ color: "#3ecf8e", fontFamily: "Syne, sans-serif" }}>
                {isLoading ? "–" : `${dashboard?.medicineIndex ?? 0}%`}
              </div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Código</div>
              <div className="text-2xl font-bold" style={{ color: "#f97316", fontFamily: "Syne, sans-serif" }}>
                {isLoading ? "–" : `${dashboard?.codeIndex ?? 0}%`}
              </div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Consistência</div>
              <div className="text-2xl font-bold" style={{ color: "#7c6af5", fontFamily: "Syne, sans-serif" }}>
                {isLoading ? "–" : `${dashboard?.sessionStats?.consistencyPercent ?? 0}%`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Horas hoje"
              value={`${Math.round((dashboard?.sessionStats?.totalMinutesToday ?? 0) / 60 * 10) / 10}h`}
              icon={Clock}
              color="#7c6af5"
            />
            <StatCard
              label="Questões (7 dias)"
              value={dashboard?.questionStats?.reduce((s, q) => s + q.total, 0) ?? 0}
              icon={HelpCircle}
              color="#3ecf8e"
              sub={`${Math.round(
                ((dashboard?.questionStats?.reduce((s, q) => s + q.correct, 0) ?? 0) /
                  Math.max(dashboard?.questionStats?.reduce((s, q) => s + q.total, 0) ?? 1, 1)) * 100
              )}% acertos`}
            />
            <StatCard
              label="Taxa de acerto"
              value={`${Math.round(
                ((dashboard?.questionStats?.reduce((s, q) => s + q.correct, 0) ?? 0) /
                  Math.max(dashboard?.questionStats?.reduce((s, q) => s + q.total, 0) ?? 1, 1)) * 100
              )}%`}
              icon={Target}
              color="#3ecf8e"
            />
            <StatCard
              label="Código (semana)"
              value={`${Math.round((dashboard?.sessionStats?.bySubject?.filter(s => s.category === "programacao").reduce((s, b) => s + b.totalMinutes, 0) ?? 0) / 60 * 10) / 10}h`}
              icon={Code2}
              color="#f97316"
            />
            <StatCard
              label="Sono médio (7d)"
              value={`${(dashboard as any)?.avgSleep ?? "–"}h`}
              icon={Moon}
              color="#fbbf24"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mentor insight */}
        <div className="lg:col-span-2">
          <div
            className="rounded-2xl border p-6 mb-6"
            style={{
              background: "linear-gradient(135deg, #7c6af512, #3ecf8e08)",
              borderColor: "#7c6af540"
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={18} style={{ color: "#7c6af5" }} />
                <span className="font-semibold text-sm" style={{ color: "#7c6af5" }}>Mentor Agora</span>
              </div>
              <button
                data-testid="button-new-insight"
                onClick={requestInsight}
                disabled={isLoadingInsight}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ background: "#7c6af520", color: "#7c6af5", border: "1px solid #7c6af530" }}
              >
                <RefreshCw size={12} className={isLoadingInsight ? "animate-spin" : ""} />
                {isLoadingInsight ? "Analisando..." : "Nova análise"}
              </button>
            </div>
            {isLoading || isLoadingInsight ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-foreground">
                {insight ?? "Clique em 'Nova análise' para receber um insight personalizado do seu mentor."}
              </p>
            )}
          </div>

          {/* Weekly progress */}
          <div
            className="rounded-2xl border p-6"
            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Activity size={16} className="text-muted-foreground" />
              <h3 className="font-semibold text-sm">Progresso Semanal por Matéria</h3>
            </div>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 rounded" />)}
              </div>
            ) : weekSubjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Sem sessões esta semana. Registre uma!</p>
                <Link href="/register" className="text-xs mt-2 inline-block" style={{ color: "#7c6af5" }}>
                  Registrar sessão →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {weekSubjects.map((s) => (
                  <ProgressBar
                    key={s.subject}
                    label={s.subject}
                    value={s.totalMinutes}
                    max={maxMinutes}
                    color={getSubjectColor(s.subject, s.category)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Recent session */}
          {recentSession && (
            <div
              className="rounded-2xl border p-5"
              style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Última sessão</span>
                <Link href="/register" className="text-xs flex items-center gap-1" style={{ color: "#7c6af5" }}>
                  Continuar <ArrowRight size={12} />
                </Link>
              </div>
              <div className="font-semibold capitalize">{recentSession.subject}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {recentSession.durationMinutes}min · Qualidade {recentSession.quality}/5
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(recentSession.createdAt).toLocaleDateString("pt-BR")}
              </div>
            </div>
          )}

          {/* Goals */}
          <div
            className="rounded-2xl border p-5"
            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Metas da Semana</span>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
              </div>
            ) : (dashboard?.goals?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sem metas definidas</p>
            ) : (
              <div className="space-y-3">
                {dashboard?.goals?.map((g) => (
                  <div key={g.id} className="flex items-center gap-3">
                    {g.achieved ? (
                      <CheckCircle2 size={18} style={{ color: "#3ecf8e" }} />
                    ) : (
                      <AlertCircle size={18} className="text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm capitalize truncate">{g.subject ?? "Geral"}</div>
                      <div className="text-xs text-muted-foreground">
                        {g.actualMinutes}m / {g.targetMinutes}m
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/register"
              data-testid="button-quick-register"
              className="rounded-xl p-4 text-center text-xs font-medium transition-all card-hover block"
              style={{ background: "#7c6af512", border: "1px solid #7c6af530", color: "#7c6af5" }}
            >
              <TrendingUp size={20} className="mx-auto mb-1.5" />
              Registrar
            </Link>
            <Link
              href="/mentor"
              data-testid="button-quick-mentor"
              className="rounded-xl p-4 text-center text-xs font-medium transition-all card-hover block"
              style={{ background: "#3ecf8e12", border: "1px solid #3ecf8e30", color: "#3ecf8e" }}
            >
              <Zap size={20} className="mx-auto mb-1.5" />
              Mentor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpCircle({ size, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}
