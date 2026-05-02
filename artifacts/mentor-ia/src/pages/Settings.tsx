import { useState, useEffect } from "react";
import { useGetUserConfig, useUpdateUserConfig, getGetUserConfigQueryKey, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

const ALL_SUBJECTS = [
  { id: "biologia", label: "Biologia", cat: "enem" },
  { id: "quimica", label: "Química", cat: "enem" },
  { id: "fisica", label: "Física", cat: "enem" },
  { id: "matematica", label: "Matemática", cat: "enem" },
  { id: "redacao", label: "Redação", cat: "enem" },
  { id: "ch", label: "Ciências Humanas", cat: "enem" },
  { id: "lc", label: "Linguagens", cat: "enem" },
  { id: "python", label: "Python", cat: "code" },
  { id: "javascript", label: "JavaScript", cat: "code" },
  { id: "algoritmos", label: "Algoritmos", cat: "code" },
  { id: "leetcode", label: "LeetCode/Beecrowd", cat: "code" },
];

export default function Settings() {
  const { data: config, isLoading } = useGetUserConfig();
  const updateConfig = useUpdateUserConfig();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [priorities, setPriorities] = useState<string[]>([]);

  useEffect(() => {
    if (config) {
      setName(config.name);
      setPriorities(config.prioritySubjects ?? []);
    }
  }, [config]);

  function togglePriority(id: string) {
    setPriorities((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function save() {
    if (!name.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    try {
      await updateConfig.mutateAsync({ data: { name: name.trim(), prioritySubjects: priorities } });
      queryClient.invalidateQueries({ queryKey: getGetUserConfigQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      toast({ title: "Configurações salvas!" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="skeleton h-8 w-48 mb-6 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "Syne, sans-serif" }}>Configurações</h1>

      <div
        className="rounded-2xl border p-6 mb-6"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
      >
        <h2 className="font-semibold mb-5">Perfil</h2>

        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">Seu nome</label>
          <input
            data-testid="input-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como o Mentor deve te chamar?"
            className="w-full rounded-xl text-sm px-4 py-3 outline-none"
            style={{
              background: "hsl(var(--muted))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
            }}
          />
        </div>

        <div className="mb-8">
          <label className="text-sm font-medium block mb-1">Matérias prioritárias</label>
          <p className="text-xs text-muted-foreground mb-4">
            O Mentor foca nessas matérias ao gerar insights e recomendações
          </p>

          <div className="mb-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">ENEM / Medicina</div>
            <div className="flex flex-wrap gap-2">
              {ALL_SUBJECTS.filter((s) => s.cat === "enem").map((s) => (
                <button
                  key={s.id}
                  data-testid={`priority-${s.id}`}
                  onClick={() => togglePriority(s.id)}
                  className="px-3 py-1.5 rounded-xl text-sm transition-all"
                  style={{
                    background: priorities.includes(s.id) ? "#3ecf8e20" : "hsl(var(--muted))",
                    color: priorities.includes(s.id) ? "#3ecf8e" : "hsl(var(--muted-foreground))",
                    border: `1px solid ${priorities.includes(s.id) ? "#3ecf8e40" : "transparent"}`,
                  }}
                >
                  {priorities.includes(s.id) && <CheckCircle2 size={12} className="inline mr-1" />}
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Programação</div>
            <div className="flex flex-wrap gap-2">
              {ALL_SUBJECTS.filter((s) => s.cat === "code").map((s) => (
                <button
                  key={s.id}
                  data-testid={`priority-${s.id}`}
                  onClick={() => togglePriority(s.id)}
                  className="px-3 py-1.5 rounded-xl text-sm transition-all"
                  style={{
                    background: priorities.includes(s.id) ? "#f9731620" : "hsl(var(--muted))",
                    color: priorities.includes(s.id) ? "#f97316" : "hsl(var(--muted-foreground))",
                    border: `1px solid ${priorities.includes(s.id) ? "#f9731640" : "transparent"}`,
                  }}
                >
                  {priorities.includes(s.id) && <CheckCircle2 size={12} className="inline mr-1" />}
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          data-testid="button-save-settings"
          onClick={save}
          disabled={updateConfig.isPending}
          className="w-full py-3 rounded-xl font-medium text-white text-sm transition-all"
          style={{ background: "#7c6af5" }}
        >
          {updateConfig.isPending ? "Salvando..." : "Salvar configurações"}
        </button>
      </div>

      {/* Keyboard shortcuts */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
      >
        <h3 className="font-semibold text-sm mb-4">Atalhos de Teclado</h3>
        <div className="space-y-2">
          {[
            ["N", "Abrir registro de sessão"],
            ["Q", "Abrir banco de questões"],
            ["M", "Abrir Mentor IA"],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-muted-foreground">{label}</span>
              <kbd
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
                style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
              >
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
