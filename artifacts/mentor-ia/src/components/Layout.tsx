import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  PlusCircle,
  HelpCircle,
  Calendar,
  BrainCircuit,
  BarChart3,
  Settings,
  Flame,
  GraduationCap,
  FileText,
  Code2,
} from "lucide-react";
import { useGetDashboard } from "@workspace/api-client-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/register", label: "Registrar", icon: PlusCircle },
  { path: "/questions", label: "Questões", icon: HelpCircle },
  { path: "/enem", label: "ENEM", icon: FileText },
  { path: "/training", label: "Programação", icon: Code2 },
  { path: "/habits", label: "Hábitos", icon: Calendar },
  { path: "/mentor", label: "Mentor IA", icon: BrainCircuit },
  { path: "/analytics", label: "Análises", icon: BarChart3 },
  { path: "/settings", label: "Configurações", icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: dashboard } = useGetDashboard();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className="w-[240px] flex-shrink-0 flex flex-col border-r border-border"
        style={{ background: "hsl(var(--sidebar))" }}
      >
        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c6af5, #3ecf8e)" }}
            >
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg" style={{ fontFamily: "Syne, sans-serif" }}>
              Mentor IA
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location === path;
            return (
              <Link
                key={path}
                href={path}
                data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? ""
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
                style={
                  isActive
                    ? {
                        background: "linear-gradient(135deg, #7c6af520, #7c6af508)",
                        color: "#7c6af5",
                        border: "1px solid #7c6af530",
                      }
                    : {}
                }
              >
                <Icon size={18} style={isActive ? { color: "#7c6af5" } : {}} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Streak card */}
        <div className="p-4">
          <div
            className="rounded-xl p-4 border"
            style={{ background: "#1e1a0a", borderColor: "#fbbf2440" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Flame size={18} style={{ color: "#fbbf24" }} />
              <span className="text-xs font-semibold" style={{ color: "#fbbf24" }}>
                Ofensiva
              </span>
            </div>
            <div className="text-3xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#fbbf24" }}>
              {dashboard?.streak ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {dashboard?.streak === 1 ? "dia consecutivo" : "dias consecutivos"}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
