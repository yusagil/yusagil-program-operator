import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import QuestionPage from "@/pages/QuestionPage";
import WaitingPage from "@/pages/WaitingPage";
import ResultsPage from "@/pages/ResultsPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/game/:gameSessionId/:userId" component={QuestionPage} />
      <Route path="/game/:gameSessionId/:userId/waiting" component={WaitingPage} />
      <Route path="/game/:gameSessionId/:userId/results" component={ResultsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="max-w-md mx-auto px-4 py-8 bg-gray-50 min-h-screen">
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
