import { 
  InsertUser, User, InsertGameSession, GameSession, 
  InsertAnswer, Answer, GameResult, AnswerPair 
} from "@shared/schema";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserBySeatNumber(seatNumber: number): Promise<User | undefined>;
  updateUserName(userId: number, name: string): Promise<User>;
  
  // Game session operations
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getGameSession(id: number): Promise<GameSession | undefined>;
  getGameSessionByUsers(user1Id: number, user2Id: number): Promise<GameSession | undefined>;
  markGameSessionComplete(id: number): Promise<GameSession>;
  
  // Answer operations
  saveAnswer(answer: InsertAnswer): Promise<Answer>;
  getAnswersByGameSession(gameSessionId: number): Promise<Answer[]>;
  getAnswersByGameSessionAndUser(gameSessionId: number, userId: number): Promise<Answer[]>;
  
  // Game results
  getGameResults(gameSessionId: number, userId: number): Promise<GameResult | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameSessions: Map<number, GameSession>;
  private answers: Map<number, Answer>;
  
  private userIdCounter: number;
  private gameSessionIdCounter: number;
  private answerIdCounter: number;

  constructor() {
    this.users = new Map();
    this.gameSessions = new Map();
    this.answers = new Map();
    
    this.userIdCounter = 1;
    this.gameSessionIdCounter = 1;
    this.answerIdCounter = 1;
  }

  // User operations
  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.userIdCounter++,
      ...user
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async getUserBySeatNumber(seatNumber: number): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.seatNumber === seatNumber);
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
    const newSession: GameSession = {
      id: this.gameSessionIdCounter++,
      ...session,
      isComplete: false,
    };
    this.gameSessions.set(newSession.id, newSession);
    return newSession;
  }

  async getGameSession(id: number): Promise<GameSession | undefined> {
    return this.gameSessions.get(id);
  }

  async getGameSessionByUsers(user1Id: number, user2Id: number): Promise<GameSession | undefined> {
    // Find the most recent active game session between these users
    const sessions = Array.from(this.gameSessions.values())
      .filter(session => 
        // Match regardless of which user is user1 or user2
        (session.user1Id === user1Id && session.user2Id === user2Id) || 
        (session.user1Id === user2Id && session.user2Id === user1Id)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
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
    const newAnswer: Answer = {
      id: this.answerIdCounter++,
      ...answer
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
  
  // Game results
  async getGameResults(gameSessionId: number, userId: number): Promise<GameResult | undefined> {
    const gameSession = await this.getGameSession(gameSessionId);
    if (!gameSession) {
      return undefined;
    }
    
    const partnerId = gameSession.user1Id === userId ? gameSession.user2Id : gameSession.user1Id;
    
    // Get both users to get their seat numbers
    const users = Array.from(this.users.values());
    const user = users.find(u => u.id === userId);
    const partner = users.find(u => u.id === partnerId);
    
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
    
    return {
      gameSessionId,
      userId,
      partnerId,
      userSeatNumber: user.seatNumber,
      partnerSeatNumber: partner.seatNumber,
      answerPairs,
      correctCount
    };
  }
}

export const storage = new MemStorage();
