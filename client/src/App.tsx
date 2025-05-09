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
import RankingTestPage from "@/pages/RankingTestPage";
import AdminLandingPage from "@/pages/admin/AdminLandingPage";
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
      
      {/* 테스트 라우트 */}
      <Route path="/ranking-test" component={RankingTestPage} />
      
      {/* Admin routes - separated from main user flow */}
      <Route path="/manage" component={AdminLandingPage} />
      <Route path="/manage/login" component={AdminLoginPage} />
      <Route path="/manage/dashboard" component={AdminDashboardPage} />
      <Route path="/manage/rooms/:roomId" component={AdminGameRoomPage} />
      
      {/* Legacy admin routes for backward compatibility */}
      <Route path="/admin" component={() => { window.location.href = "/manage"; return null; }} />
      <Route path="/admin/dashboard" component={() => { window.location.href = "/manage/dashboard"; return null; }} />
      <Route path="/admin/rooms/:roomId" component={(params) => { window.location.href = `/manage/rooms/${params.roomId}`; return null; }} />
      
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
