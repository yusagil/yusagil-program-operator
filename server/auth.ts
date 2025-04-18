import { Request, Response, NextFunction } from "express";
import { compareSync, hashSync } from "bcrypt";
import { storage } from "./storage";
import session from "express-session";

// Extend the session type
declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
    adminUsername?: string;
  }
}

// Function to hash password
export function hashPassword(password: string): string {
  return hashSync(password, 10);
}

// Function to compare password with hash
export function comparePassword(password: string, hash: string): boolean {
  try {
    return compareSync(password, hash);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    // 해시가 bcrypt 형식이 아닌 경우, 텍스트 직접 비교
    return password === hash;
  }
}

// Middleware to require admin authentication
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({
      success: false,
      error: "관리자 로그인이 필요합니다"
    });
  }
  next();
}

// Initialize a default admin account if none exists
export async function initializeAdmin() {
  try {
    const adminExists = await storage.getAdminByUsername("yusagil");
    
    if (!adminExists) {
      console.log("Creating default admin account...");
      await storage.createAdmin({
        username: "yusagil",
        password: hashPassword("0528")
      });
      console.log("Default admin account created with username 'yusagil' and password '0528'");
    }
  } catch (error) {
    console.error("Error initializing admin account:", error);
  }
}