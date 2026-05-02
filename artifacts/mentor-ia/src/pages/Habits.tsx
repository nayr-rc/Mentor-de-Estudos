import { useState } from "react";
import { useListHabits, useCreateOrUpdateHabit, getListHabitsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";

function getMoodColor(mood: number | null | undefined) {
  if (!mood) return "#444458";
  if (mood >= 4) return "#3ecf8e";
  if (mood === 3) return "#fbbf24";
  return "#ef4444";
}

export default function Habits() {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: habits, isLoading } = useListHabits({ days: 60 });
  const createHabit = useCreateOrUpdateHabit();

  const habitMap = new Map(habits?.map((h) => [h.date, h]) ?? []);

  // Calendar
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = viewDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const calDays: (string | null)[] = [];
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    calDays.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }

  // Sleep trend data
  const sleepData = habits
    ?.filter((h) => h.sleepHours != null)
    .slice(0, 30)
    .reverse()
    .map((h) => ({
      date: h.date.slice(5),
      sleep: h.sleepHours,
      mood: h.mood,
    })) ?? [];

  const selectedHabit = selectedDay ? habitMap.get(selectedDay) : null;

  // Today's quick log
  const today = new Date().toISOString().split("T")[0];
  const [quickSleep, setQuickSleep] = useState(7);
  const [quickExercise, setQuickExercise] = useState(false);
  const [quickMed, setQuickMed] = useState(false);
  const [quickMood, setQuickMood] = useState(3);

  async function logToday() {
    try {
      await createHabit.mutateAsync({
        data: {
          date: today,
          sleepHours: quickSleep,
          exerciseDone: quickExercise,
          meditationDone: quickMed,
          mood: quickMood,
        },
      });
      toast({ title: "Hábitos de hoje salvos!" });
      queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "Syne, sans-serif" }}>Hábitos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div
            className="rounded-2xl border p-5"
            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
          >
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <h3 className="font-semibold capitalize">{monthName}</h3>
              <button
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map((d) => (
                <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {isLoading
                ? Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="h-9 skeleton rounded-lg" />
                  ))
                : calDays.map((dateStr, i) => {
                    if (!dateStr) return <div key={i} />;
                    const habit = habitMap.get(dateStr);
                    const isToday = dateStr === today;
                    const isSelected = dateStr === selectedDay;
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                        className="h-9 rounded-lg flex items-center justify-center text-xs font-medium transition-all hover:scale-110 relative"
                        style={{
                          background: isSelected
                            ? "#7c6af5"
                            : isToday
                            ? "#7c6af520"
                            : habit
                            ? `${getMoodColor(habit.mood)}18`
                            : "hsl(var(--muted))",
                          color: isSelected
                            ? "white"
                            : isToday
                            ? "#7c6af5"
                            : "hsl(var(--foreground))",
                          border: isToday && !isSelected ? "1px solid #7c6af5" : "none",
                        }}
                      >
                        {parseInt(dateStr.split("-")[2])}
                        {habit && !isSelected && (
                          <div
                            className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                            style={{ background: getMoodColor(habit.mood) }}
                          />
                        )}
                      </button>
                    );
                  })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-4 justify-end text-xs text-muted-foreground">
              {[["#3ecf8e", "Bom"], ["#fbbf24", "Ok"], ["#ef4444", "Difícil"]].map(([color, label]) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Selected day details */}
          {selectedDay && (
            <div
              className="rounded-2xl border p-5 mt-4"
              style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
            >
              <h3 className="font-semibold mb-4 text-sm">
                {new Date(selectedDay + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              {selectedHabit ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Sono</div>
                    <div className="font-bold text-lg">{selectedHabit.sleepHours ?? "–"}h</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Humor</div>
                    <div className="font-bold text-lg" style={{ color: getMoodColor(selectedHabit.mood) }}>
                      {selectedHabit.mood ?? "–"}/5
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedHabit.exerciseDone
                      ? <CheckCircle2 size={16} style={{ color: "#3ecf8e" }} />
                      : <XCircle size={16} className="text-muted-foreground" />
                    }
                    <span className="text-sm">Exercício</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedHabit.meditationDone
                      ? <CheckCircle2 size={16} style={{ color: "#3ecf8e" }} />
                      : <XCircle size={16} className="text-muted-foreground" />
                    }
                    <span className="text-sm">Meditação</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem registro para este dia.</p>
              )}
            </div>
          )}

          {/* Sleep trend */}
          {sleepData.length > 0 && (
            <div
              className="rounded-2xl border p-5 mt-4"
              style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
            >
              <h3 className="font-semibold text-sm mb-5">Tendência de Sono</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={sleepData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 12]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Line type="monotone" dataKey="sleep" stroke="#fbbf24" strokeWidth={2} dot={false} name="Sono (h)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Quick log panel */}
        <div>
          <div
            className="rounded-2xl border p-5"
            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
          >
            <h3 className="font-semibold text-sm mb-5">Registrar Hoje</h3>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-2 text-xs">
                  <span className="text-muted-foreground">Sono</span>
                  <span className="font-semibold" style={{ color: "#fbbf24" }}>{quickSleep}h</span>
                </div>
                <input
                  type="range" min={0} max={12} step={0.5} value={quickSleep}
                  onChange={(e) => setQuickSleep(Number(e.target.value))}
                  className="w-full accent-[#fbbf24]"
                />
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-2">Humor</div>
                <div className="flex gap-1.5">
                  {[1,2,3,4,5].map((m) => (
                    <button
                      key={m}
                      onClick={() => setQuickMood(m)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: quickMood === m ? getMoodColor(m) : "hsl(var(--muted))",
                        color: quickMood === m ? "white" : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { label: "Exercitou?", val: quickExercise, set: setQuickExercise },
                  { label: "Meditou?", val: quickMed, set: setQuickMed },
                ].map(({ label, val, set }) => (
                  <button
                    key={label}
                    onClick={() => set(!val)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all"
                    style={{
                      background: val ? "#3ecf8e18" : "hsl(var(--muted))",
                      border: `1px solid ${val ? "#3ecf8e40" : "transparent"}`,
                    }}
                  >
                    <span style={{ color: val ? "#3ecf8e" : "hsl(var(--foreground))" }}>{label}</span>
                    {val ? <CheckCircle2 size={16} style={{ color: "#3ecf8e" }} /> : <XCircle size={16} className="text-muted-foreground" />}
                  </button>
                ))}
              </div>

              <button
                data-testid="button-log-habits"
                onClick={logToday}
                disabled={createHabit.isPending}
                className="w-full py-3 rounded-xl font-medium text-white text-sm"
                style={{ background: "#7c6af5" }}
              >
                {createHabit.isPending ? "Salvando..." : "Salvar hoje"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
