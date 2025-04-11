import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model to represent a participant by seat number
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  seatNumber: integer("seat_number").notNull().unique(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  seatNumber: true,
});

// Game session model to represent a pairing between two users
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull(),
  user2Id: integer("user2_id").notNull(),
  isComplete: boolean("is_complete").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).pick({
  user1Id: true,
  user2Id: true,
  createdAt: true,
});

// Answer model to store a user's answers for a game session
export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  gameSessionId: integer("game_session_id").notNull(),
  userId: integer("user_id").notNull(),
  questionNumber: integer("question_number").notNull(),
  myAnswer: text("my_answer").notNull(),
  partnerGuess: text("partner_guess").notNull(),
});

export const insertAnswerSchema = createInsertSchema(answers).pick({
  gameSessionId: true,
  userId: true,
  questionNumber: true,
  myAnswer: true,
  partnerGuess: true,
});

// Validator schemas with additional constraints
export const seatNumberSchema = z.number().int().min(1).max(12);

export const gameSetupSchema = z.object({
  mySeatNumber: seatNumberSchema,
  partnerSeatNumber: seatNumberSchema,
}).refine(data => data.mySeatNumber !== data.partnerSeatNumber, {
  message: "Your seat number and partner's seat number must be different",
  path: ["partnerSeatNumber"],
});

export const answerSchema = z.object({
  myAnswer: z.string().min(1, "Your answer is required"),
  partnerGuess: z.string().min(1, "Your guess for your partner's answer is required"),
});

export const answerSubmissionSchema = z.object({
  gameSessionId: z.number(),
  userId: z.number(),
  answers: z.array(answerSchema).length(10),
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;

export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answers.$inferSelect;

export type GameSetup = z.infer<typeof gameSetupSchema>;
export type AnswerSubmission = z.infer<typeof answerSubmissionSchema>;

// Result types for client use
export type AnswerPair = {
  questionNumber: number;
  myAnswer: string;
  partnerGuess: string;
  actualPartnerAnswer: string;
  isCorrect: boolean;
};

export type GameResult = {
  gameSessionId: number;
  userId: number;
  partnerId: number;
  userSeatNumber: number;
  partnerSeatNumber: number;
  answerPairs: AnswerPair[];
  correctCount: number;
};
