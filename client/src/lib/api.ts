import { apiRequest } from "./queryClient";
import { AdminLogin, CreateGameRoom, GameResult, GameRoomJoin, GameSetup } from "@shared/schema";

export type ApiResponse<T = any> = {
  success: boolean;
  error?: string;
} & T;

// Admin API
export async function adminLogin(credentials: AdminLogin): Promise<ApiResponse> {
  const res = await apiRequest("POST", "/api/admin/login", credentials);
  return await res.json();
}

export async function adminLogout(): Promise<ApiResponse> {
  const res = await apiRequest("POST", "/api/admin/logout", {});
  return await res.json();
}

export async function createGameRoom(data: CreateGameRoom): Promise<ApiResponse<{
  gameRoom: {
    id: number;
    code: string;
    expiresAt: Date;
  }
}>> {
  const res = await apiRequest("POST", "/api/admin/game-rooms", data);
  return await res.json();
}

export async function getActiveGameRooms(): Promise<ApiResponse<{
  gameRooms: Array<{
    id: number;
    code: string;
    createdAt: Date;
    expiresAt: Date;
  }>
}>> {
  const res = await apiRequest("GET", "/api/admin/game-rooms");
  return await res.json();
}

export async function getGameRoomUsers(gameRoomId: number): Promise<ApiResponse<{
  users: Array<{
    id: number;
    name: string;
    seatNumber: number;
  }>
}>> {
  const res = await apiRequest("GET", `/api/admin/game-rooms/${gameRoomId}/users`);
  return await res.json();
}

export async function getGameRoomResults(gameRoomId: number): Promise<ApiResponse<{
  results: Array<{
    userId: number;
    name: string;
    seatNumber: number;
    partnerId: number;
    partnerName: string;
    partnerSeatNumber: number;
    correctCount: number;
    totalQuestions: number;
  }>
}>> {
  const res = await apiRequest("GET", `/api/admin/game-rooms/${gameRoomId}/results`);
  return await res.json();
}

// Game Room API
export async function validateGameRoomCode(code: string): Promise<ApiResponse<{
  gameRoom: {
    id: number;
    code: string;
  }
}>> {
  const res = await apiRequest("GET", `/api/game-rooms/${code}/validate`);
  return await res.json();
}

export async function joinGameRoom(data: GameRoomJoin): Promise<ApiResponse<{
  user: {
    id: number;
    gameRoomId: number;
    name: string;
    seatNumber: number;
  }
}>> {
  const res = await apiRequest("POST", "/api/game-rooms/join", data);
  return await res.json();
}

// Game API
export async function startGame(gameSetup: GameSetup): Promise<ApiResponse<{
  gameSession: {
    id: number;
    gameRoomId: number;
    userId: number;
    userName: string;
    partnerName: string;
    partnerSeatNumber: number;
  }
}>> {
  const res = await apiRequest("POST", "/api/game/start", gameSetup);
  return await res.json();
}

// Submit answers for a game
export async function submitAnswers(data: {
  gameRoomId: number;
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
  const res = await apiRequest("GET", `/api/game/${gameSessionId}/results/${userId}`);
  return await res.json();
}
