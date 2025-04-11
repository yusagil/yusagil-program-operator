import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { answerSubmissionSchema, gameSetupSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to start a game session between two users
  app.post("/api/game/start", async (req: Request, res: Response) => {
    try {
      // Validate input
      const { mySeatNumber, partnerSeatNumber } = gameSetupSchema.parse(req.body);
      
      // Get or create both users
      let user1 = await storage.getUserBySeatNumber(mySeatNumber);
      let user2 = await storage.getUserBySeatNumber(partnerSeatNumber);
      
      if (!user1) {
        user1 = await storage.createUser({ seatNumber: mySeatNumber });
      }
      
      if (!user2) {
        user2 = await storage.createUser({ seatNumber: partnerSeatNumber });
      }
      
      // Check if there's an active game session
      let gameSession = await storage.getGameSessionByUsers(user1.id, user2.id);
      
      if (!gameSession || gameSession.isComplete) {
        // Create a new game session
        gameSession = await storage.createGameSession({
          user1Id: user1.id,
          user2Id: user2.id,
          createdAt: new Date().toISOString()
        });
      }
      
      res.json({
        success: true,
        gameSession: {
          id: gameSession.id,
          userId: user1.id,
          seatNumber: mySeatNumber
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
        error: "Failed to start game session"
      });
    }
  });

  // API endpoint to submit answers
  app.post("/api/game/submit-answers", async (req: Request, res: Response) => {
    try {
      const { gameSessionId, userId, answers } = answerSubmissionSchema.parse(req.body);
      
      // Verify game session exists
      const gameSession = await storage.getGameSession(gameSessionId);
      if (!gameSession) {
        return res.status(404).json({
          success: false,
          error: "Game session not found"
        });
      }
      
      // Verify user is part of this game session
      if (gameSession.user1Id !== userId && gameSession.user2Id !== userId) {
        return res.status(403).json({
          success: false,
          error: "User is not part of this game session"
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
        message: "Answers submitted successfully"
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
        error: "Failed to submit answers"
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
          error: "Invalid game session ID or user ID"
        });
      }
      
      // Verify game session exists
      const gameSession = await storage.getGameSession(gameSessionId);
      if (!gameSession) {
        return res.status(404).json({
          success: false,
          error: "Game session not found"
        });
      }
      
      // Verify user is part of this game session
      if (gameSession.user1Id !== userId && gameSession.user2Id !== userId) {
        return res.status(403).json({
          success: false,
          error: "User is not part of this game session"
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
          error: "You haven't submitted all answers yet"
        });
      }
      
      if (partnerAnswers.length < 10) {
        return res.json({
          success: true,
          status: "waiting",
          message: "Waiting for your partner to complete their answers"
        });
      }
      
      // Both users have submitted all answers, calculate results
      const results = await storage.getGameResults(gameSessionId, userId);
      
      if (!results) {
        return res.status(500).json({
          success: false,
          error: "Failed to calculate results"
        });
      }
      
      // Mark game session as complete if not already
      if (!gameSession.isComplete) {
        await storage.markGameSessionComplete(gameSessionId);
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
        error: "Failed to get game results"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
