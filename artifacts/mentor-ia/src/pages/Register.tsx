import { useState } from "react";
import { useCreateSession, useCreateOrUpdateHabit, getGetDashboardQueryKey, getListSessionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";

const ENEM_SUBJECTS = [
  { id: "biologia", label: "Biologia" },
  { id: "quimica", label: "Química" },
  { id: "fisica", label: "Física" },
  { id: "matematica", label: "Matemática" },
  { id: "redacao", label: "Redação" },
  { id: "ch", label: "Ciências Humanas" },
  { id: "lc", label: "Linguagens" },
];

const CODE_SUBJECTS = [
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "algoritmos", label: "Algoritmos" },
  { id: "estrutura-dados", label: "Estruturas de Dados" },
  { id: "leetcode", label: "LeetCode/Beecrowd" },
  { id: "projeto-pessoal", label: "Projeto Pessoal" },
];

const MOOD_LABELS = ["Péssimo", "Ruim", "Ok", "Bom", "Ótimo"];

export default function Register() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<"enem" | "programacao">("enem");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState(60);
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState("");
  const [sleepHours, setSleepHours] = useState(7);
  const [exercise, setExercise] = useState(false);
  const [meditation, setMeditation] = useState(false);
  const [water, setWater] = useState(2);
  const [mood, setMood] = useState(3);
  const [done, setDone] = useState(false);

  const createSession = useCreateSession();
  const createHabit = useCreateOrUpdateHabit();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const subjects = category === "enem" ? ENEM_SUBJECTS : CODE_SUBJECTS;

  async function handleSubmit() {
    if (!subject) { toast({ title: "Selecione uma matéria", variant: "destructive" }); return; }

    try {
      await createSession.mutateAsync({
        data: { subject, category, durationMinutes: duration, quality, notes: notes || null },
      });

      const today = new Date().toISOString().split("T")[0];
      await createHabit.mutateAsync({
        data: { date: today, sleepHours, exerciseDone: exercise, meditationDone: meditation, waterLiters: water, mood },
      });

      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
      setDone(true);
    } catch {
      toast({ title: "Erro ao salvar", description: "Verifique os dados e tente novamente.", variant: "destructive" });
    }
  }

  if (done) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-sm px-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, #7c6af520, #3ecf8e20)" }}
          >
            <CheckCircle2 size={40} style={{ color: "#3ecf8e" }} />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "Syne, sans-serif" }}>Sessão registrada!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {duration}min de <span className="font-semibold capitalize text-foreground">{subject}</span> registrados.
            Continue assim!
          </p>
          <div className="flex gap-3">
            <button
              data-testid="button-register-another"
              onClick={() => { setDone(false); setStep(1); setSubject(""); setNotes(""); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
            >
              Registrar mais
            </button>
            <a href="/" className="flex-1">
              <button
                data-testid="button-go-dashboard"
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                style={{ background: "#7c6af5" }}
              >
                Dashboard
              </button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Registrar Sessão</h1>
          <span className="text-sm text-muted-foreground">Passo {step} de 3</span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{ background: s <= step ? "#7c6af5" : "hsl(var(--muted))" }}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Subject */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">O que você estudou?</h2>
          <p className="text-sm text-muted-foreground mb-6">Selecione a categoria e a matéria</p>

          {/* Category toggle */}
          <div
            className="flex gap-1 p-1 rounded-xl mb-6"
            style={{ background: "hsl(var(--muted))" }}
          >
            {(["enem", "programacao"] as const).map((c) => (
              <button
                key={c}
                data-testid={`toggle-${c}`}
                onClick={() => { setCategory(c); setSubject(""); }}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: category === c ? "#7c6af5" : "transparent",
                  color: category === c ? "white" : "hsl(var(--muted-foreground))",
                }}
              >
                {c === "enem" ? "ENEM / Medicina" : "Programação"}
              </button>
            ))}
          </div>

          {/* Subjects */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {subjects.map((s) => (
              <button
                key={s.id}
                data-testid={`subject-${s.id}`}
                onClick={() => setSubject(s.id)}
                className="p-4 rounded-xl text-sm font-medium text-left transition-all card-hover"
                style={{
                  background: subject === s.id
                    ? (category === "enem" ? "#3ecf8e18" : "#f9731618")
                    : "hsl(var(--card))",
                  border: `1px solid ${subject === s.id
                    ? (category === "enem" ? "#3ecf8e40" : "#f9731640")
                    : "hsl(var(--card-border))"}`,
                  color: subject === s.id
                    ? (category === "enem" ? "#3ecf8e" : "#f97316")
                    : "hsl(var(--foreground))",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            data-testid="button-next-step1"
            onClick={() => { if (subject) setStep(2); else toast({ title: "Selecione uma matéria" }); }}
            className="mt-6 w-full py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2"
            style={{ background: "#7c6af5" }}
          >
            Próximo <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Step 2: Duration, quality, notes */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Como foi?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Registrando: <span className="text-foreground font-medium capitalize">{subject}</span>
          </p>

          {/* Duration */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Duração</label>
              <span className="text-sm font-bold" style={{ color: "#7c6af5" }}>
                {duration >= 60 ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}m` : ""}` : `${duration}min`}
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={240}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-[#7c6af5]"
              data-testid="slider-duration"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5min</span><span>4h</span>
            </div>
          </div>

          {/* Quality */}
          <div className="mb-6">
            <label className="text-sm font-medium block mb-3">Qualidade da sessão</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((q) => (
                <button
                  key={q}
                  data-testid={`quality-${q}`}
                  onClick={() => setQuality(q)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: quality >= q ? "#7c6af5" : "hsl(var(--muted))",
                    color: quality >= q ? "white" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="text-sm font-medium block mb-2">Anotações (opcional)</label>
            <textarea
              data-testid="textarea-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que você aprendeu? Dificuldades? Próximos passos..."
              rows={3}
              className="w-full rounded-xl text-sm p-3 outline-none resize-none"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--card-border))",
                color: "hsl(var(--foreground))",
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="py-3 px-6 rounded-xl font-medium flex items-center gap-2"
              style={{ background: "hsl(var(--muted))" }}
            >
              <ChevronLeft size={18} /> Voltar
            </button>
            <button
              data-testid="button-next-step2"
              onClick={() => setStep(3)}
              className="flex-1 py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2"
              style={{ background: "#7c6af5" }}
            >
              Próximo <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Habits */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Hábitos de hoje</h2>
          <p className="text-sm text-muted-foreground mb-6">Como foi seu dia até agora?</p>

          {/* Sleep */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Sono noite passada</label>
              <span className="text-sm font-bold" style={{ color: "#fbbf24" }}>{sleepHours}h</span>
            </div>
            <input
              type="range" min={0} max={12} step={0.5} value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className="w-full accent-[#fbbf24]"
              data-testid="slider-sleep"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0h</span><span>12h</span>
            </div>
          </div>

          {/* Water */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Água consumida</label>
              <span className="text-sm font-bold" style={{ color: "#3ecf8e" }}>{water}L</span>
            </div>
            <input
              type="range" min={0} max={4} step={0.25} value={water}
              onChange={(e) => setWater(Number(e.target.value))}
              className="w-full accent-[#3ecf8e]"
              data-testid="slider-water"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: "Exercitou hoje?", state: exercise, set: setExercise, testId: "toggle-exercise" },
              { label: "Meditou hoje?", state: meditation, set: setMeditation, testId: "toggle-meditation" },
            ].map(({ label, state, set, testId }) => (
              <button
                key={label}
                data-testid={testId}
                onClick={() => set(!state)}
                className="p-4 rounded-xl text-sm font-medium transition-all text-left"
                style={{
                  background: state ? "#3ecf8e18" : "hsl(var(--card))",
                  border: `1px solid ${state ? "#3ecf8e40" : "hsl(var(--card-border))"}`,
                  color: state ? "#3ecf8e" : "hsl(var(--muted-foreground))",
                }}
              >
                <div className="font-semibold mb-0.5">{state ? "Sim" : "Não"}</div>
                <div className="text-xs opacity-70">{label}</div>
              </button>
            ))}
          </div>

          {/* Mood */}
          <div className="mb-8">
            <label className="text-sm font-medium block mb-3">Humor geral</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((m) => (
                <button
                  key={m}
                  data-testid={`mood-${m}`}
                  onClick={() => setMood(m)}
                  className="flex-1 py-3 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: mood === m ? "#7c6af5" : "hsl(var(--muted))",
                    color: mood === m ? "white" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {MOOD_LABELS[m - 1]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="py-3 px-6 rounded-xl font-medium flex items-center gap-2"
              style={{ background: "hsl(var(--muted))" }}
            >
              <ChevronLeft size={18} /> Voltar
            </button>
            <button
              data-testid="button-submit-session"
              onClick={handleSubmit}
              disabled={createSession.isPending || createHabit.isPending}
              className="flex-1 py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: "#7c6af5" }}
            >
              {createSession.isPending ? "Salvando..." : "Confirmar sessão"}
              {!createSession.isPending && <CheckCircle2 size={18} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
