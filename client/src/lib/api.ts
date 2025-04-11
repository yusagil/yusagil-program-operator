import { apiRequest } from "./queryClient";
import { GameSetup, GameResult } from "@shared/schema";

export type ApiResponse<T = any> = {
  success: boolean;
  error?: string;
} & T;

// Start a new game
export async function startGame(gameSetup: GameSetup): Promise<ApiResponse<{
  gameSession: {
    id: number;
    userId: number;
    userName: string;
    partnerName: string;
    seatNumber: number;
  }
}>> {
  const res = await apiRequest("POST", "/api/game/start", gameSetup);
  return await res.json();
}

// Submit answers for a game
export async function submitAnswers(data: {
  gameSessionId: number;
  userId: number;
  answers: Array<{ myAnswer: string; partnerGuess: string }>;
}): Promise<ApiResponse> {
  const res = await apiRequest("POST", "/api/game/submit-answers", data);
  return await res.json();
}

// Get game results
export async function getGameResults(
  gameSessionId: number,
  userId: number
): Promise<ApiResponse<{
  status: "waiting" | "complete";
  results?: GameResult;
}>> {
  const res = await fetch(`/api/game/${gameSessionId}/results/${userId}`, {
    credentials: "include",
  });
  
  return await res.json();
}
