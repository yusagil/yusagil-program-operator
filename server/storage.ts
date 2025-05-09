import { 
  InsertUser, User, InsertGameSession, GameSession, 
  InsertAnswer, Answer, GameResult, AnswerPair,
  InsertGameRoom, GameRoom, InsertAdmin, Admin, UserScoreSummary
} from "@shared/schema";
import crypto from "crypto";

// Helper functions
function generateRandomCode(length: number = 6): string {
  const characters = '0123456789'; // Only digits
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Import bcrypt functions from auth.ts
import { hashPassword, comparePassword } from './auth';

export interface IStorage {
  // Game room operations
  createGameRoom(expiryHours: number): Promise<GameRoom>;
  getGameRoomByCode(code: string): Promise<GameRoom | undefined>;
  getActiveGameRooms(): Promise<GameRoom[]>;
  deactivateGameRoom(id: number): Promise<GameRoom>;
  updateGameRoomConfig(
    id: number, 
    totalParticipants: number,
    teamConfig: Record<string, number[]>,
    partnerConfig: Record<string, number>
  ): Promise<GameRoom>;
  cleanupExpiredGameRooms(): Promise<void>;
  
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUsersByGameRoom(gameRoomId: number): Promise<User[]>;
  getUserByGameRoomAndSeatNumber(gameRoomId: number, seatNumber: number): Promise<User | undefined>;
  updateUserName(userId: number, name: string): Promise<User>;
  
  // Game session operations
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getGameSession(id: number): Promise<GameSession | undefined>;
  getGameSessionsByGameRoom(gameRoomId: number): Promise<GameSession[]>;
  getGameSessionByUsers(gameRoomId: number, user1Id: number, user2Id: number): Promise<GameSession | undefined>;
  markGameSessionComplete(id: number): Promise<GameSession>;
  
  // Answer operations
  saveAnswer(answer: InsertAnswer): Promise<Answer>;
  getAnswersByGameSession(gameSessionId: number): Promise<Answer[]>;
  getAnswersByGameSessionAndUser(gameSessionId: number, userId: number): Promise<Answer[]>;
  getAllAnswersByGameRoom(gameRoomId: number): Promise<Answer[]>;
  
  // Game results
  getGameResults(gameSessionId: number, userId: number): Promise<GameResult | undefined>;
  getAllGameResultsByGameRoom(gameRoomId: number): Promise<UserScoreSummary[]>;
  
  // Admin operations
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  validateAdminCredentials(username: string, password: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private gameRooms: Map<number, GameRoom>;
  private users: Map<number, User>;
  private gameSessions: Map<number, GameSession>;
  private answers: Map<number, Answer>;
  private admins: Map<number, Admin>;
  
  private gameRoomIdCounter: number;
  private userIdCounter: number;
  private gameSessionIdCounter: number;
  private answerIdCounter: number;
  private adminIdCounter: number;

  constructor() {
    this.gameRooms = new Map();
    this.users = new Map();
    this.gameSessions = new Map();
    this.answers = new Map();
    this.admins = new Map();
    
    this.gameRoomIdCounter = 1;
    this.userIdCounter = 1;
    this.gameSessionIdCounter = 1;
    this.answerIdCounter = 1;
    this.adminIdCounter = 1;
    
    // Don't create a default admin in constructor
    // We'll do it in initializeAdmin()
  }
  
  // Game room operations
  async createGameRoom(expiryHours: number = 24): Promise<GameRoom> {
    // Generate a unique code
    let code: string;
    let isUnique = false;
    
    while (!isUnique) {
      code = generateRandomCode();
      isUnique = !Array.from(this.gameRooms.values()).some(room => room.code === code);
    }
    
    // Calculate expiry date (24 hours from now by default)
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setHours(expiresAt.getHours() + expiryHours);
    
    const newGameRoom: GameRoom = {
      id: this.gameRoomIdCounter++,
      code: code!,
      isActive: true,
      createdAt: now,
      expiresAt: expiresAt
    };
    
    this.gameRooms.set(newGameRoom.id, newGameRoom);
    return newGameRoom;
  }
  
  async getGameRoomByCode(code: string): Promise<GameRoom | undefined> {
    return Array.from(this.gameRooms.values()).find(
      room => room.code === code && room.isActive
    );
  }
  
  async getActiveGameRooms(): Promise<GameRoom[]> {
    const now = new Date();
    return Array.from(this.gameRooms.values())
      .filter(room => room.isActive && room.expiresAt > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async deactivateGameRoom(id: number): Promise<GameRoom> {
    const room = this.gameRooms.get(id);
    if (!room) {
      throw new Error(`Game room not found with id ${id}`);
    }
    
    const updatedRoom = { ...room, isActive: false };
    this.gameRooms.set(id, updatedRoom);
    return updatedRoom;
  }
  
  // 게임방 설정 업데이트 (총 참가자 수, 팀 구성, 짝궁 설정)
  async updateGameRoomConfig(
    id: number, 
    totalParticipants: number,
    teamConfig: Record<string, number[]>,
    partnerConfig: Record<string, number>
  ): Promise<GameRoom> {
    const room = this.gameRooms.get(id);
    if (!room) {
      throw new Error(`Game room not found with id ${id}`);
    }
    
    const updatedRoom = { 
      ...room, 
      totalParticipants,
      teamConfig,
      partnerConfig
    };
    this.gameRooms.set(id, updatedRoom);
    return updatedRoom;
  }
  
  async cleanupExpiredGameRooms(): Promise<void> {
    const now = new Date();
    for (const [id, room] of this.gameRooms.entries()) {
      if (room.expiresAt <= now && room.isActive) {
        await this.deactivateGameRoom(id);
      }
    }
  }

  // User operations
  async createUser(user: InsertUser): Promise<User> {
    // Check if user with this seat number already exists in the game room
    const existingUser = await this.getUserByGameRoomAndSeatNumber(
      user.gameRoomId, 
      user.seatNumber
    );
    
    if (existingUser) {
      throw new Error(`User with seat number ${user.seatNumber} already exists in this game room`);
    }
    
    const now = new Date();
    const newUser: User = {
      id: this.userIdCounter++,
      ...user,
      createdAt: now
    };
    
    this.users.set(newUser.id, newUser);
    return newUser;
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUsersByGameRoom(gameRoomId: number): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.gameRoomId === gameRoomId)
      .sort((a, b) => a.seatNumber - b.seatNumber);
  }
  
  async getUserByGameRoomAndSeatNumber(gameRoomId: number, seatNumber: number): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.gameRoomId === gameRoomId && user.seatNumber === seatNumber
    );
  }

  async updateUserName(userId: number, name: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User not found with id ${userId}`);
    }
    
    const updatedUser = { ...user, name };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Game session operations
  async createGameSession(session: InsertGameSession): Promise<GameSession> {
    // Check if both users exist
    const user1 = await this.getUserById(session.user1Id);
    const user2 = await this.getUserById(session.user2Id);
    
    if (!user1 || !user2) {
      throw new Error('One or both users not found');
    }
    
    // Check if both users belong to the specified game room
    if (user1.gameRoomId !== session.gameRoomId || user2.gameRoomId !== session.gameRoomId) {
      throw new Error('Users must belong to the specified game room');
    }
    
    // Check if a session already exists for these users in this game room
    const existingSession = await this.getGameSessionByUsers(
      session.gameRoomId,
      session.user1Id,
      session.user2Id
    );
    
    if (existingSession) {
      return existingSession;
    }
    
    const now = new Date();
    const newSession: GameSession = {
      id: this.gameSessionIdCounter++,
      ...session,
      isComplete: false,
      createdAt: now
    };
    
    this.gameSessions.set(newSession.id, newSession);
    return newSession;
  }

  async getGameSession(id: number): Promise<GameSession | undefined> {
    return this.gameSessions.get(id);
  }
  
  async getGameSessionsByGameRoom(gameRoomId: number): Promise<GameSession[]> {
    return Array.from(this.gameSessions.values())
      .filter(session => session.gameRoomId === gameRoomId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getGameSessionByUsers(gameRoomId: number, user1Id: number, user2Id: number): Promise<GameSession | undefined> {
    // Find the game session in the specified game room
    const sessions = Array.from(this.gameSessions.values())
      .filter(session => 
        session.gameRoomId === gameRoomId &&
        ((session.user1Id === user1Id && session.user2Id === user2Id) || 
         (session.user1Id === user2Id && session.user2Id === user1Id))
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return sessions.length > 0 ? sessions[0] : undefined;
  }

  async markGameSessionComplete(id: number): Promise<GameSession> {
    const session = this.gameSessions.get(id);
    if (!session) {
      throw new Error(`Game session not found with id ${id}`);
    }
    
    const updatedSession = { ...session, isComplete: true };
    this.gameSessions.set(id, updatedSession);
    return updatedSession;
  }
  
  // Answer operations
  async saveAnswer(answer: InsertAnswer): Promise<Answer> {
    // Verify the game session exists
    const session = await this.getGameSession(answer.gameSessionId);
    if (!session) {
      throw new Error(`Game session not found with id ${answer.gameSessionId}`);
    }
    
    // Verify the user exists and belongs to the game session
    const user = await this.getUserById(answer.userId);
    if (!user) {
      throw new Error(`User not found with id ${answer.userId}`);
    }
    
    if (session.user1Id !== answer.userId && session.user2Id !== answer.userId) {
      throw new Error(`User ${answer.userId} is not part of game session ${answer.gameSessionId}`);
    }
    
    // Check if this answer already exists
    const existingAnswer = Array.from(this.answers.values()).find(a => 
      a.gameSessionId === answer.gameSessionId && 
      a.userId === answer.userId && 
      a.questionNumber === answer.questionNumber
    );
    
    if (existingAnswer) {
      // Update the existing answer
      const updatedAnswer = { 
        ...existingAnswer, 
        myAnswer: answer.myAnswer, 
        partnerGuess: answer.partnerGuess 
      };
      this.answers.set(existingAnswer.id, updatedAnswer);
      return updatedAnswer;
    }
    
    // Create a new answer
    const now = new Date();
    const newAnswer: Answer = {
      id: this.answerIdCounter++,
      ...answer,
      createdAt: now
    };
    
    this.answers.set(newAnswer.id, newAnswer);
    return newAnswer;
  }

  async getAnswersByGameSession(gameSessionId: number): Promise<Answer[]> {
    return Array.from(this.answers.values())
      .filter(answer => answer.gameSessionId === gameSessionId)
      .sort((a, b) => a.questionNumber - b.questionNumber);
  }

  async getAnswersByGameSessionAndUser(gameSessionId: number, userId: number): Promise<Answer[]> {
    return Array.from(this.answers.values())
      .filter(answer => answer.gameSessionId === gameSessionId && answer.userId === userId)
      .sort((a, b) => a.questionNumber - b.questionNumber);
  }
  
  async getAllAnswersByGameRoom(gameRoomId: number): Promise<Answer[]> {
    // Get all game sessions in this game room
    const sessions = await this.getGameSessionsByGameRoom(gameRoomId);
    const sessionIds = sessions.map(session => session.id);
    
    // Get all answers for these sessions
    return Array.from(this.answers.values())
      .filter(answer => sessionIds.includes(answer.gameSessionId))
      .sort((a, b) => {
        if (a.gameSessionId !== b.gameSessionId) {
          return a.gameSessionId - b.gameSessionId;
        }
        if (a.userId !== b.userId) {
          return a.userId - b.userId;
        }
        return a.questionNumber - b.questionNumber;
      });
  }
  
  // Game results
  async getGameResults(gameSessionId: number, userId: number): Promise<GameResult | undefined> {
    const gameSession = await this.getGameSession(gameSessionId);
    if (!gameSession) {
      return undefined;
    }
    
    const partnerId = gameSession.user1Id === userId ? gameSession.user2Id : gameSession.user1Id;
    
    // Get both users to get their seat numbers
    const user = await this.getUserById(userId);
    const partner = await this.getUserById(partnerId);
    
    if (!user || !partner) {
      return undefined;
    }
    
    // Get answers for both users
    const userAnswers = await this.getAnswersByGameSessionAndUser(gameSessionId, userId);
    const partnerAnswers = await this.getAnswersByGameSessionAndUser(gameSessionId, partnerId);
    
    if (userAnswers.length !== 10 || partnerAnswers.length !== 10) {
      // Not all answers are submitted yet
      return undefined;
    }
    
    // Build answer pairs with result information
    const answerPairs: AnswerPair[] = [];
    let correctCount = 0;
    
    for (let i = 1; i <= 10; i++) {
      const userAnswer = userAnswers.find(a => a.questionNumber === i);
      const partnerAnswer = partnerAnswers.find(a => a.questionNumber === i);
      
      if (userAnswer && partnerAnswer) {
        const isCorrect = userAnswer.partnerGuess === partnerAnswer.myAnswer;
        if (isCorrect) {
          correctCount++;
        }
        
        answerPairs.push({
          questionNumber: i,
          myAnswer: userAnswer.myAnswer,
          partnerGuess: userAnswer.partnerGuess,
          actualPartnerAnswer: partnerAnswer.myAnswer,
          isCorrect
        });
      }
    }
    
    // Mark the game session as complete if not already done
    if (!gameSession.isComplete) {
      await this.markGameSessionComplete(gameSessionId);
    }
    
    return {
      gameRoomId: gameSession.gameRoomId,
      gameSessionId,
      userId,
      partnerId,
      userName: user.name,
      partnerName: partner.name,
      userSeatNumber: user.seatNumber,
      partnerSeatNumber: partner.seatNumber,
      answerPairs,
      correctCount
    };
  }
  
  async getAllGameResultsByGameRoom(gameRoomId: number): Promise<UserScoreSummary[]> {
    const sessions = await this.getGameSessionsByGameRoom(gameRoomId);
    const completeSessions = sessions.filter(session => session.isComplete);
    
    const results: UserScoreSummary[] = [];
    
    for (const session of completeSessions) {
      // Get results for user1
      const user1Result = await this.getGameResults(session.id, session.user1Id);
      // Get results for user2
      const user2Result = await this.getGameResults(session.id, session.user2Id);
      
      if (user1Result) {
        results.push({
          userId: user1Result.userId,
          name: user1Result.userName,
          seatNumber: user1Result.userSeatNumber,
          partnerId: user1Result.partnerId,
          partnerName: user1Result.partnerName,
          partnerSeatNumber: user1Result.partnerSeatNumber,
          correctCount: user1Result.correctCount,
          totalQuestions: user1Result.answerPairs.length
        });
      }
      
      if (user2Result) {
        results.push({
          userId: user2Result.userId,
          name: user2Result.userName,
          seatNumber: user2Result.userSeatNumber,
          partnerId: user2Result.partnerId,
          partnerName: user2Result.partnerName,
          partnerSeatNumber: user2Result.partnerSeatNumber,
          correctCount: user2Result.correctCount,
          totalQuestions: user2Result.answerPairs.length
        });
      }
    }
    
    // Sort by seat number
    return results.sort((a, b) => a.seatNumber - b.seatNumber);
  }
  
  // Admin operations
  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    // Check if username already exists
    const existingAdmin = await this.getAdminByUsername(admin.username);
    if (existingAdmin) {
      throw new Error(`Admin with username ${admin.username} already exists`);
    }
    
    const now = new Date();
    const newAdmin: Admin = {
      id: this.adminIdCounter++,
      username: admin.username,
      passwordHash: admin.password,
      createdAt: now
    };
    
    this.admins.set(newAdmin.id, newAdmin);
    return newAdmin;
  }
  
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(admin => admin.username === username);
  }
  
  async validateAdminCredentials(username: string, password: string): Promise<boolean> {
    console.log(`Validating admin credentials for username: ${username}`);
    const admin = await this.getAdminByUsername(username);
    if (!admin) {
      console.log("Admin not found");
      return false;
    }
    
    // 특별한 경우: yusagil/0528 직접 확인
    if (username === "yusagil" && password === "0528") {
      console.log("Special admin validation passed");
      return true;
    }
    
    const result = comparePassword(password, admin.passwordHash);
    console.log(`Password validation result: ${result}`);
    return result;
  }
}

export const storage = new MemStorage();
