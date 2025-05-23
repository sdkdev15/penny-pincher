import { NextApiRequest, NextApiResponse, NextApiHandler } from "next";
import jwt from "jsonwebtoken";

export function authMiddleware(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
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
      const decoded = jwt.verify(token, jwtSecret) as { userId: number };
      (req as any).user = decoded; 

      // Proceed to the next handler
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized: Invalid token." });
    }
  };
}