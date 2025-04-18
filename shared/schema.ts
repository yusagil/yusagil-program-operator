import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Game room model to manage different game sessions
export const gameRooms = pgTable("game_rooms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),  // Unique code for joining the room
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // Auto-expire after 24 hours
});

export const insertGameRoomSchema = createInsertSchema(gameRooms).pick({
  code: true,
  expiresAt: true,
});

// User model to represent a participant
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  gameRoomId: integer("game_room_id").notNull(), // Reference to the game room
  name: text("name").notNull(),
  seatNumber: integer("seat_number").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  gameRoomId: true,
  name: true,
  seatNumber: true,
});

// Game session model to represent a pairing between two users
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  gameRoomId: integer("game_room_id").notNull(), // Reference to the game room
  user1Id: integer("user1_id").notNull(),
  user2Id: integer("user2_id").notNull(),
  isComplete: boolean("is_complete").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).pick({
  gameRoomId: true,
  user1Id: true,
  user2Id: true,
});

// Answer model to store a user's answers for a game session
export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  gameSessionId: integer("game_session_id").notNull(),
  userId: integer("user_id").notNull(),
  questionNumber: integer("question_number").notNull(),
  myAnswer: text("my_answer").notNull(),
  partnerGuess: text("partner_guess").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAnswerSchema = createInsertSchema(answers).pick({
  gameSessionId: true,
  userId: true,
  questionNumber: true,
  myAnswer: true,
  partnerGuess: true,
});

// Admin credentials for game room management
export const adminCredentials = pgTable("admin_credentials", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAdminSchema = createInsertSchema(adminCredentials).omit({
  id: true,
  createdAt: true,
  passwordHash: true,
}).extend({
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
});

// Validator schemas with additional constraints
export const seatNumberSchema = z.number().int().min(1).max(12);

export const gameRoomJoinSchema = z.object({
  roomCode: z.string().min(1, "게임방 코드를 입력해주세요"),
  name: z.string().min(1, "이름을 입력해주세요"),
  seatNumber: seatNumberSchema,
});

export const gameSetupSchema = z.object({
  roomCode: z.string().min(1, "게임방 코드를 입력해주세요"),
  myName: z.string().min(1, "이름을 입력해주세요"),
  mySeatNumber: seatNumberSchema, 
  partnerSeatNumber: seatNumberSchema,
}).refine(data => data.mySeatNumber !== data.partnerSeatNumber, {
  message: "자리 번호가 같을 수 없습니다",
  path: ["partnerSeatNumber"],
});

export const adminLoginSchema = z.object({
  username: z.string().min(1, "사용자명을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export const createGameRoomSchema = z.object({
  expiryHours: z.number().int().min(1).max(72).default(24),
});

export const answerSchema = z.object({
  myAnswer: z.string().min(1, "답변을 입력해주세요"),
  partnerGuess: z.string().min(1, "짝궁의 답변을 예상해 입력해주세요"),
});

export const answerSubmissionSchema = z.object({
  gameRoomId: z.number().optional(),
  gameSessionId: z.number(),
  userId: z.number(),
  answers: z.array(answerSchema).length(10),
});

// Type definitions
export type InsertGameRoom = z.infer<typeof insertGameRoomSchema>;
export type GameRoom = typeof gameRooms.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;

export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answers.$inferSelect;

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof adminCredentials.$inferSelect;

export type GameRoomJoin = z.infer<typeof gameRoomJoinSchema>;
export type GameSetup = z.infer<typeof gameSetupSchema>;
export type AnswerSubmission = z.infer<typeof answerSubmissionSchema>;
export type AdminLogin = z.infer<typeof adminLoginSchema>;
export type CreateGameRoom = z.infer<typeof createGameRoomSchema>;

// Result types for client use
export type AnswerPair = {
  questionNumber: number;
  myAnswer: string;
  partnerGuess: string;
  actualPartnerAnswer: string;
  isCorrect: boolean;
};

export type GameResult = {
  gameRoomId: number;
  gameSessionId: number;
  userId: number;
  partnerId: number;
  userName: string;
  partnerName: string;
  userSeatNumber: number;
  partnerSeatNumber: number;
  answerPairs: AnswerPair[];
  correctCount: number;
};

// Admin view types
export type UserScoreSummary = {
  userId: number;
  name: string;
  seatNumber: number;
  partnerId: number;
  partnerName: string;
  partnerSeatNumber: number;
  correctCount: number;
  totalQuestions: number;
};
