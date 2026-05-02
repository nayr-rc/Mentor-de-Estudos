import { useGetSessionStats, useGetQuestionStats } from "@workspace/api-client-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

const ENEM_SUBJECTS = ["biologia","quimica","fisica","matematica","redacao","ch","lc"];

export default function Analytics() {
  const { data: sessionStats, isLoading: loadingS } = useGetSessionStats({ days: 30 });
  const { data: questionStats, isLoading: loadingQ } = useGetQuestionStats();

  const barData = sessionStats?.last7Days?.map((d) => ({
    date: d.date.slice(5),
    horas: parseFloat((d.totalMinutes / 60).toFixed(1)),
  })) ?? [];

  const radarData = ENEM_SUBJECTS.map((s) => {
    const stat = questionStats?.find((q) => q.subject.toLowerCase() === s);
    return {
      subject: s.charAt(0).toUpperCase() + s.slice(1),
      value: stat?.accuracyPercent ?? 0,
    };
  });

  // By-subject breakdown for the past 30 days
  const subjectData = sessionStats?.bySubject
    ?.sort((a, b) => b.totalMinutes - a.totalMinutes)
    .map((s) => ({
      subject: s.subject.charAt(0).toUpperCase() + s.subject.slice(1),
      horas: parseFloat((s.totalMinutes / 60).toFixed(1)),
      categoria: s.category,
    })) ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "Syne, sans-serif" }}>Análises</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily hours bar chart */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
        >
          <h3 className="font-semibold text-sm mb-5">Horas de Estudo — Últimos 7 Dias</h3>
          {loadingS ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "#7c6af510" }}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                  formatter={(v) => [`${v}h`, "Horas"]}
                />
                <Bar dataKey="horas" fill="#7c6af5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Radar chart ENEM */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
        >
          <h3 className="font-semibold text-sm mb-5">Desempenho ENEM (Taxa de Acerto)</h3>
          {loadingQ ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : radarData.every((d) => d.value === 0) ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Registre questões para ver o radar
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Acerto %" dataKey="value" stroke="#3ecf8e" fill="#3ecf8e" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Subject breakdown */}
      <div
        className="rounded-2xl border p-5 mb-6"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
      >
        <h3 className="font-semibold text-sm mb-5">Horas por Matéria — Últimos 30 Dias</h3>
        {loadingS ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : subjectData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma sessão registrada ainda</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(150, subjectData.length * 36)}>
            <BarChart data={subjectData} layout="vertical" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={100} />
              <Tooltip
                cursor={{ fill: "#7c6af510" }}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                formatter={(v) => [`${v}h`, "Horas"]}
              />
              <Bar
                dataKey="horas"
                radius={[0, 6, 6, 0]}
                fill="#7c6af5"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table: subjects vs accuracy */}
      {(questionStats?.length ?? 0) > 0 && (
        <div
          className="rounded-2xl border"
          style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
        >
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-sm">Matérias × Taxa de Acerto × Questões</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Matéria", "Total", "Acertos", "Erros", "Pulei", "Taxa"].map((h) => (
                    <th key={h} className="text-left p-3 pl-5 text-xs text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {questionStats?.sort((a, b) => b.total - a.total).map((s) => (
                  <tr key={s.subject} className="border-b border-border last:border-0 hover:bg-accent transition-colors">
                    <td className="p-3 pl-5 capitalize font-medium">{s.subject}</td>
                    <td className="p-3 text-muted-foreground">{s.total}</td>
                    <td className="p-3" style={{ color: "#3ecf8e" }}>{s.correct}</td>
                    <td className="p-3" style={{ color: "#ef4444" }}>{s.wrong}</td>
                    <td className="p-3" style={{ color: "#fbbf24" }}>{s.skipped}</td>
                    <td className="p-3">
                      <span
                        className="px-2 py-0.5 rounded-md text-xs font-bold"
                        style={{
                          background: s.accuracyPercent >= 70 ? "#3ecf8e20" : s.accuracyPercent >= 50 ? "#fbbf2420" : "#ef444420",
                          color: s.accuracyPercent >= 70 ? "#3ecf8e" : s.accuracyPercent >= 50 ? "#fbbf24" : "#ef4444",
                        }}
                      >
                        {s.accuracyPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
