import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { CursorSparkles } from "./components/CursorSparkles";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useTheme } from "./contexts/ThemeContext";
import Home from "./pages/Home";

/**
 * Design Philosophy: Warm Minimalism with Personality
 * Using light theme as default for the warm cream aesthetic
 * Theme switching is enabled for user preference
 */

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isKawaii } = useTheme();

  return (
    <>
      {isKawaii && <CursorSparkles />}
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
