import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Register from "@/pages/Register";
import Questions from "@/pages/Questions";
import Habits from "@/pages/Habits";
import Mentor from "@/pages/Mentor";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import EnemPractice from "@/pages/EnemPractice";
import Training from "@/pages/Training";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/register" component={Register} />
        <Route path="/questions" component={Questions} />
        <Route path="/habits" component={Habits} />
        <Route path="/mentor" component={Mentor} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/settings" component={Settings} />
        <Route path="/enem" component={EnemPractice} />
        <Route path="/training" component={Training} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function KeyboardShortcuts() {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "n" || e.key === "N") window.location.href = "/register";
      if (e.key === "q" || e.key === "Q") window.location.href = "/questions";
      if (e.key === "m" || e.key === "M") window.location.href = "/mentor";
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <KeyboardShortcuts />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
