import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middleware/authMiddleware";

interface AuthenticatedRequest extends NextApiRequest {
  user?: { userId: number };
}

async function deleteUser(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const loggedInUserId = req.user?.userId;
    
    if (!loggedInUserId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const targetUserId = Number(req.query.id);

    // Validate that targetUserId is a valid number
    if (isNaN(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    // Verify ownership: only admins or the user themselves can delete
    const loggedInUser = await prisma.user.findUnique({
      where: { id: Number(loggedInUserId) },
    });

    if (!loggedInUser) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    // Check if user is trying to delete someone else
    if (Number(loggedInUserId) !== targetUserId && !loggedInUser.isAdmin) {
      return res.status(403).json({ message: "You do not have permission to delete this user." });
    }

    // Prevent deleting yourself unless that's intended
    if (Number(loggedInUserId) === targetUserId) {
      return res.status(400).json({ message: "You cannot delete yourself." });
    }

    await prisma.user.delete({
      where: { id: targetUserId },
    });

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
}

export default authMiddleware(deleteUser);
