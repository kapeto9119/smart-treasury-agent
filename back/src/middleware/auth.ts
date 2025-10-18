import { Request, Response, NextFunction } from "express";
import { WorkOS } from "@workos-inc/node";
import { config } from "../config/env.js";

const workos = new WorkOS(config.workos.apiKey);

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // For development, allow requests without auth
      if (config.nodeEnv === "development") {
        req.user = {
          id: "dev-user",
          email: "dev@example.com",
          role: "treasurer",
        };
        return next();
      }

      return res.status(401).json({
        success: false,
        error: "No authorization token provided",
      });
    }

    const token = authHeader.substring(7);

    // Verify token with WorkOS
    try {
      const session = await workos.userManagement.authenticateWithCode({
        code: token,
        clientId: config.workos.clientId,
      });

      req.user = {
        id: session.user.id,
        email: session.user.email,
        role: "treasurer", // Default role, should be fetched from database
      };

      next();
    } catch (error) {
      // For development, allow requests with any token
      if (config.nodeEnv === "development") {
        req.user = {
          id: "dev-user",
          email: "dev@example.com",
          role: "treasurer",
        };
        return next();
      }

      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }
  } catch (error: any) {
    console.error("Authentication error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
      return;
    }

    next();
  };
}
