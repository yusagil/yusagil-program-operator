import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  adminLoginSchema, 
  answerSubmissionSchema, 
  createGameRoomSchema, 
  gameRoomJoinSchema, 
  gameSetupSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { requireAdmin, comparePassword } from "./auth";

// Schedule cleanup of expired game rooms (runs every hour)
function setupCleanupSchedule() {
  setInterval(async () => {
    try {
      await storage.cleanupExpiredGameRooms();
      console.log("Expired game rooms cleanup completed");
    } catch (error) {
      console.error("Error cleaning up expired game rooms:", error);
    }
  }, 60 * 60 * 1000); // Every hour
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup cleanup schedule
  setupCleanupSchedule();
  
  // Temporary endpoint for testing - create a game room without admin auth
  app.get("/api/test/create-game-room", async (req: Request, res: Response) => {
    try {
      const gameRoom = await storage.createGameRoom(24);
      res.json({
        success: true,
        gameRoom: {
          id: gameRoom.id,
          code: gameRoom.code,
          createdAt: gameRoom.createdAt,
          expiresAt: gameRoom.expiresAt
        }
      });
    } catch (error) {
      console.error("Error creating test game room:", error);
      res.status(500).json({
        success: false,
        error: "게임방 생성 중 오류가 발생했습니다"
      });
    }
  });
  
  // API endpoint for admin login
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = adminLoginSchema.parse(req.body);
      
      const isValid = await storage.validateAdminCredentials(username, password);
      
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: "잘못된 사용자명 또는 비밀번호입니다"
        });
      }
      
      // Set session as admin
      if (req.session) {
        req.session.isAdmin = true;
        req.session.adminUsername = username;
      }
      
      res.json({
        success: true,
        message: "로그인 성공"
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          success: false,
          error: validationError.message
        });
      }
      
      console.error("Error during admin login:", error);
      res.status(500).json({
        success: false,
        error: "로그인 처리 중 오류가 발생했습니다"
      });
    }
  });
  
  // API endpoint for admin logout
  app.post("/api/admin/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({
            success: false,
            error: "로그아웃 처리 중 오류가 발생했습니다"
          });
        }
        
        res.json({
          success: true,
          message: "로그아웃 성공"
        });
      });
    } else {
      res.json({
        success: true,
        message: "로그아웃 성공"
      });
    }
  });
  
  // API endpoint to create a new game room (admin only)
  app.post("/api/admin/game-rooms", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { expiryHours } = createGameRoomSchema.parse(req.body);
      
      const gameRoom = await storage.createGameRoom(expiryHours);
      
      res.json({
        success: true,
        gameRoom: {
          id: gameRoom.id,
          code: gameRoom.code,
          expiresAt: gameRoom.expiresAt
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          success: false,
          error: validationError.message
        });
      }
      
      console.error("Error creating game room:", error);
      res.status(500).json({
        success: false,
        error: "게임방 생성 중 오류가 발생했습니다"
      });
    }
  });
  
  // API endpoint to get all active game rooms (admin only)
  app.get("/api/admin/game-rooms", requireAdmin, async (req: Request, res: Response) => {
    try {
      const gameRooms = await storage.getActiveGameRooms();
      
      res.json({
        success: true,
        gameRooms: gameRooms.map(room => ({
          id: room.id,
          code: room.code,
          createdAt: room.createdAt,
          expiresAt: room.expiresAt
        }))
      });
    } catch (error) {
      console.error("Error getting game rooms:", error);
      res.status(500).json({
        success: false,
        error: "게임방 목록을 가져오는 중 오류가 발생했습니다"
      });
    }
  });
  
  // API endpoint to get all users in a game room (admin only)
  app.get("/api/admin/game-rooms/:gameRoomId/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const gameRoomId = parseInt(req.params.gameRoomId, 10);
      
      if (isNaN(gameRoomId)) {
        return res.status(400).json({
          success: false,
          error: "유효하지 않은 게임방 ID입니다"
        });
      }
      
      const users = await storage.getUsersByGameRoom(gameRoomId);
      
      res.json({
        success: true,
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          seatNumber: user.seatNumber
        }))
      });
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({
        success: false,
        error: "사용자 목록을 가져오는 중 오류가 발생했습니다"
      });
    }
  });
  
  // API endpoint to get all results in a game room (admin only)
  app.get("/api/admin/game-rooms/:gameRoomId/results", requireAdmin, async (req: Request, res: Response) => {
    try {
      const gameRoomId = parseInt(req.params.gameRoomId, 10);
      
      if (isNaN(gameRoomId)) {
        return res.status(400).json({
          success: false,
          error: "유효하지 않은 게임방 ID입니다"
        });
      }
      
      const results = await storage.getAllGameResultsByGameRoom(gameRoomId);
      
      res.json({
        success: true,
        results
      });
    } catch (error) {
      console.error("Error getting results:", error);
      res.status(500).json({
        success: false,
        error: "결과를 가져오는 중 오류가 발생했습니다"
      });
    }
  });
  
  // API endpoint to validate a game room code
  app.get("/api/game-rooms/:code/validate", async (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      
      const gameRoom = await storage.getGameRoomByCode(code);
      
      if (!gameRoom) {
        return res.status(404).json({
          success: false,
          error: "존재하지 않는 게임방 코드입니다"
        });
      }
      
      res.json({
        success: true,
        gameRoom: {
          id: gameRoom.id,
          code: gameRoom.code
        }
      });
    } catch (error) {
      console.error("Error validating game room code:", error);
      res.status(500).json({
        success: false,
        error: "게임방 코드 확인 중 오류가 발생했습니다"
      });
    }
  });
  
  // API endpoint to join a game room with a seat number
  app.post("/api/game-rooms/join", async (req: Request, res: Response) => {
    try {
      const { roomCode, name, seatNumber } = gameRoomJoinSchema.parse(req.body);
      
      // Find the game room
      const gameRoom = await storage.getGameRoomByCode(roomCode);
      
      if (!gameRoom) {
        return res.status(404).json({
          success: false,
          error: "존재하지 않는 게임방 코드입니다"
        });
      }
      
      // Check if seat number is already taken
      const existingUser = await storage.getUserByGameRoomAndSeatNumber(gameRoom.id, seatNumber);
      
      if (existingUser) {
        if (existingUser.name === name) {
          // Return the existing user if name matches
          return res.json({
            success: true,
            user: {
              id: existingUser.id,
              gameRoomId: existingUser.gameRoomId,
              name: existingUser.name,
              seatNumber: existingUser.seatNumber
            }
          });
        }
        
        return res.status(400).json({
          success: false,
          error: `${seatNumber}번 자리는 이미 사용 중입니다`
        });
      }
      
      // Create a new user
      const user = await storage.createUser({
        gameRoomId: gameRoom.id,
        name,
        seatNumber
      });
      
      res.json({
        success: true,
        user: {
          id: user.id,
          gameRoomId: user.gameRoomId,
          name: user.name,
          seatNumber: user.seatNumber
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          success: false,
          error: validationError.message
        });
      }
      
      console.error("Error joining game room:", error);
      res.status(500).json({
        success: false,
        error: "게임방 참여 중 오류가 발생했습니다"
      });
    }
  });
  
  // API endpoint to start a game session between two users in a game room
  app.post("/api/game/start", async (req: Request, res: Response) => {
    try {
      // Validate input
      const { roomCode, myName, mySeatNumber, partnerSeatNumber } = gameSetupSchema.parse(req.body);
      
      // Find the game room
      const gameRoom = await storage.getGameRoomByCode(roomCode);
      
      if (!gameRoom) {
        return res.status(404).json({
          success: false,
          error: "존재하지 않는 게임방 코드입니다"
        });
      }
      
      // Get or create the user
      let user = await storage.getUserByGameRoomAndSeatNumber(gameRoom.id, mySeatNumber);
      
      if (!user) {
        user = await storage.createUser({
          gameRoomId: gameRoom.id,
          name: myName,
          seatNumber: mySeatNumber
        });
      } else if (user.name !== myName) {
        // Update name if it has changed
        user = await storage.updateUserName(user.id, myName);
      }
      
      // Find the partner by seat number
      const partner = await storage.getUserByGameRoomAndSeatNumber(gameRoom.id, partnerSeatNumber);
      
      if (!partner) {
        return res.status(404).json({
          success: false,
          error: `${partnerSeatNumber}번 자리에 참가자가 없습니다`
        });
      }
      
      // Check if there's an active game session
      let gameSession = await storage.getGameSessionByUsers(
        gameRoom.id, 
        user.id, 
        partner.id
      );
      
      if (!gameSession || gameSession.isComplete) {
        // Create a new game session
        gameSession = await storage.createGameSession({
          gameRoomId: gameRoom.id,
          user1Id: user.id,
          user2Id: partner.id
        });
      }
      
      res.json({
        success: true,
        gameSession: {
          id: gameSession.id,
          gameRoomId: gameRoom.id,
          userId: user.id,
          userName: user.name,
          partnerName: partner.name,
          partnerSeatNumber: partner.seatNumber
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          success: false,
          error: validationError.message
        });
      }
      
      console.error("Error starting game:", error);
      res.status(500).json({
        success: false,
        error: "게임 세션 시작 중 오류가 발생했습니다"
      });
    }
  });

  // API endpoint to submit answers
  app.post("/api/game/submit-answers", async (req: Request, res: Response) => {
    try {
      // For backward compatibility with newer API structure
      let parsedBody;
      try {
        parsedBody = answerSubmissionSchema.parse(req.body);
      } catch (e) {
        // If the schema validation fails, try with a simplified schema
        parsedBody = {
          gameSessionId: req.body.gameSessionId, 
          userId: req.body.userId, 
          answers: req.body.answers
        };
      }
      
      const { gameSessionId, userId, answers } = parsedBody;
      
      // Verify game session exists
      const gameSession = await storage.getGameSession(gameSessionId);
      if (!gameSession) {
        return res.status(404).json({
          success: false,
          error: "게임 세션을 찾을 수 없습니다"
        });
      }
      
      // Verify user is part of this game session
      if (gameSession.user1Id !== userId && gameSession.user2Id !== userId) {
        return res.status(403).json({
          success: false,
          error: "이 게임 세션에 속한 사용자가 아닙니다"
        });
      }
      
      // Save each answer
      for (let i = 0; i < answers.length; i++) {
        await storage.saveAnswer({
          gameSessionId,
          userId,
          questionNumber: i + 1,
          myAnswer: answers[i].myAnswer,
          partnerGuess: answers[i].partnerGuess
        });
      }
      
      res.json({
        success: true,
        message: "답변이 성공적으로 제출되었습니다"
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          success: false,
          error: validationError.message
        });
      }
      
      console.error("Error submitting answers:", error);
      res.status(500).json({
        success: false,
        error: "답변 제출 중 오류가 발생했습니다"
      });
    }
  });

  // API endpoint to check game status and get results
  app.get("/api/game/:gameSessionId/results/:userId", async (req: Request, res: Response) => {
    try {
      const gameSessionId = parseInt(req.params.gameSessionId, 10);
      const userId = parseInt(req.params.userId, 10);
      
      if (isNaN(gameSessionId) || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: "유효하지 않은 게임 세션 ID 또는 사용자 ID입니다"
        });
      }
      
      // Verify game session exists
      const gameSession = await storage.getGameSession(gameSessionId);
      if (!gameSession) {
        return res.status(404).json({
          success: false,
          error: "게임 세션을 찾을 수 없습니다"
        });
      }
      
      // Verify user is part of this game session
      if (gameSession.user1Id !== userId && gameSession.user2Id !== userId) {
        return res.status(403).json({
          success: false,
          error: "이 게임 세션에 속한 사용자가 아닙니다"
        });
      }
      
      // Get the partner's ID
      const partnerId = gameSession.user1Id === userId ? gameSession.user2Id : gameSession.user1Id;
      
      // Check if both users have submitted all answers
      const userAnswers = await storage.getAnswersByGameSessionAndUser(gameSessionId, userId);
      const partnerAnswers = await storage.getAnswersByGameSessionAndUser(gameSessionId, partnerId);
      
      if (userAnswers.length < 10) {
        return res.status(400).json({
          success: false,
          error: "아직 모든 답변을 제출하지 않았습니다"
        });
      }
      
      if (partnerAnswers.length < 10) {
        return res.json({
          success: true,
          status: "waiting",
          message: "짝궁이 답변을 완료할 때까지 기다리고 있습니다"
        });
      }
      
      // Both users have submitted all answers, calculate results
      const results = await storage.getGameResults(gameSessionId, userId);
      
      if (!results) {
        return res.status(500).json({
          success: false,
          error: "결과 계산 중 오류가 발생했습니다"
        });
      }
      
      res.json({
        success: true,
        status: "complete",
        results
      });
    } catch (error) {
      console.error("Error getting game results:", error);
      res.status(500).json({
        success: false,
        error: "게임 결과를 가져오는 중 오류가 발생했습니다"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
