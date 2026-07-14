import { NextFunction, Request, Response } from "express";
import { verifyToken } from "./auth";

export interface AuthRequest extends Request {
  user?: {
    email: string;
  };
}

export function verifyJWT(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token) as {
      email: string;
    };

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
}