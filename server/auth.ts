import { Request, Response, NextFunction } from "express";
import { compareSync, hashSync } from "bcrypt";
import { storage } from "./storage";

// Function to hash password
export function hashPassword(password: string): string {
  return hashSync(password, 10);
}

// Function to compare password with hash
export function comparePassword(password: string, hash: string): boolean {
  return compareSync(password, hash);
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
    const adminExists = await storage.getAdminByUsername("admin");
    
    if (!adminExists) {
      console.log("Creating default admin account...");
      await storage.createAdmin({
        username: "admin",
        password: hashPassword("admin1234")
      });
      console.log("Default admin account created with username 'admin' and password 'admin1234'");
    }
  } catch (error) {
    console.error("Error initializing admin account:", error);
  }
}