import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import WelcomePage from "@/pages/WelcomePage";
import JoinRoomPage from "@/pages/JoinRoomPage";
import GameSetupPage from "@/pages/GameSetupPage";
import QuestionPage from "@/pages/QuestionPage";
import WaitingPage from "@/pages/WaitingPage";
import ResultsPage from "@/pages/ResultsPage";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminGameRoomPage from "@/pages/admin/AdminGameRoomPage";

function Router() {
  return (
    <Switch>
      {/* Main routes */}
      <Route path="/" component={WelcomePage} />
      <Route path="/join" component={JoinRoomPage} />
      <Route path="/room/:roomCode/setup" component={GameSetupPage} />
      
      {/* Game routes */}
      <Route path="/room/:roomCode/game/:gameSessionId/:userId" component={QuestionPage} />
      <Route path="/room/:roomCode/game/:gameSessionId/:userId/waiting" component={WaitingPage} />
      <Route path="/room/:roomCode/game/:gameSessionId/:userId/results" component={ResultsPage} />
      
      {/* Legacy routes for backward compatibility */}
      <Route path="/game/:gameSessionId/:userId" component={QuestionPage} />
      <Route path="/game/:gameSessionId/:userId/waiting" component={WaitingPage} />
      <Route path="/game/:gameSessionId/:userId/results" component={ResultsPage} />
      
      {/* Admin routes */}
      <Route path="/admin" component={AdminLoginPage} />
      <Route path="/admin/dashboard" component={AdminDashboardPage} />
      <Route path="/admin/rooms/:roomId" component={AdminGameRoomPage} />
      
      {/* Fallback route */}
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
