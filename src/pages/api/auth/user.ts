import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middleware/authMiddleware";

async function getUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = (req as any).user.userId; // Extracted from authMiddleware

    // Fetch the user from the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, createdAt: true, updatedAt: true }, // Exclude sensitive fields like password
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong.", error: error });
  }
}

export default authMiddleware(getUser);