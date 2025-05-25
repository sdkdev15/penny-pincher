import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middleware/authMiddleware";

async function deleteUser(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const loggedInUserId = (req as any).user.userId;
    const targetUserId = Number(req.query.id);

    // Optional: prevent deleting yourself unless that's intended
    if (Number(loggedInUserId) === targetUserId) {
      return res.status(400).json({ message: "You cannot delete yourself." });
    }

    await prisma.user.delete({
      where: { id: targetUserId },
    });

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Something went wrong.", error });
  }
}

export default authMiddleware(deleteUser);
