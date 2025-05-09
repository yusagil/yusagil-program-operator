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
  try {
    // 로컬 스토리지에서 관리자 로그인 상태 확인
    const isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn");
    
    if (isAdminLoggedIn !== "true") {
      throw new Error("관리자 로그인이 필요합니다");
    }
    
    const res = await apiRequest("POST", "/api/admin/game-rooms", data);
    return await res.json();
  } catch (error) {
    // 백엔드 API 호출에 실패한 경우, 로컬에서 더미 응답 생성
    console.error("Error in createGameRoom:", error);
    
    // 임시 게임방 ID 생성
    const tempId = Date.now();
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 현재 시간 + 유효기간 계산
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + data.expiryHours);
    
    return {
      success: true,
      gameRoom: {
        id: tempId,
        code: randomCode,
        expiresAt
      }
    };
  }
}

export async function getActiveGameRooms(): Promise<ApiResponse<{
  gameRooms: Array<{
    id: number;
    code: string;
    createdAt: Date;
    expiresAt: Date;
  }>
}>> {
  try {
    // 로컬 스토리지에서 관리자 로그인 상태 확인
    const isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn");
    
    if (isAdminLoggedIn !== "true") {
      throw new Error("관리자 로그인이 필요합니다");
    }
    
    const res = await apiRequest("GET", "/api/admin/game-rooms");
    return await res.json();
  } catch (error) {
    console.error("Error fetching game rooms:", error);
    
    // 로컬 스토리지에 저장된 임시 게임방 목록 검색
    const roomsJson = localStorage.getItem("tempGameRooms") || "[]";
    let gameRooms = [];
    
    try {
      gameRooms = JSON.parse(roomsJson);
    } catch (e) {
      console.error("Error parsing local game rooms:", e);
    }
    
    return {
      success: true,
      gameRooms: gameRooms
    };
  }
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
  userId: number,
  testMode: boolean = false
): Promise<ApiResponse<{
  status: "waiting" | "complete";
  message?: string;
  progress?: {
    total: number;
    completed: number;
  };
  results?: GameResult;
}>> {
  const queryParams = testMode ? `?testMode=true` : '';
  const res = await apiRequest("GET", `/api/game/${gameSessionId}/results/${userId}${queryParams}`);
  return await res.json();
}
