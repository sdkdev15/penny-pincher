import { NextApiRequest, NextApiResponse, NextApiHandler } from "next";
import jwt from "jsonwebtoken";

// Extend NextApiRequest to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: { userId: number };
    }
  }
}

interface AuthenticatedRequest extends NextApiRequest {
  user?: { userId: number };
}

export function authMiddleware(handler: NextApiHandler) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // Extract the token from cookies
    const token = req.cookies.authToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided." });
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(500).json({ message: "JWT secret is not configured." });
      }

      // Verify the token
      const decoded = jwt.verify(token, jwtSecret) as { userId?: number };
      
      // Validate that userId exists in decoded token
      if (!decoded.userId) {
        return res.status(401).json({ message: "Unauthorized: Invalid token structure." });
      }

      req.user = { userId: decoded.userId };

      // Proceed to the next handler
      return handler(req, res);
    } catch (error) {
      // Differentiate between JWT errors
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ message: "Unauthorized: Token has expired." });
      } else if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: "Unauthorized: Invalid token." });
      }
      return res.status(401).json({ message: "Unauthorized: Authentication failed." });
    }
  };
}