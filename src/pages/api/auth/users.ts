import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middleware/authMiddleware";

async function getAllUsers(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = (req as any).user.userId;

    // Check if the user is an admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access required." });
    }

    const users = await prisma.user.findMany({
      select: { id: true, username: true, isAdmin: true, createdAt: true, updatedAt: true },
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong.", error: error });
  }
}

export default authMiddleware(getAllUsers);