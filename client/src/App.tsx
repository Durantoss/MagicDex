import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "@/pages/home";
import RulesPage from "@/pages/rules";
import Dictionary from "@/pages/dictionary";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import { FoilTest } from "@/components/foil-test";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/rules" component={RulesPage} />
      <Route path="/dictionary" component={Dictionary} />
      <Route path="/profile" component={Profile} />
      <Route path="/foil-test" component={FoilTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
