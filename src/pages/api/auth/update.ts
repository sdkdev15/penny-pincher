import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middleware/authMiddleware";

async function updateUser(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { password, userId: targetUserId } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required." });
  }

  try {
    const user = (req as any).user; // { userId, isAdmin, ... }

    // Only admins can reset passwords
    // if (!user.isAdmin) {
    //   return res.status(403).json({ message: "Forbidden: Admins only." });
    // }

    // Determine which user to reset
    const resetUserId = targetUserId || user.userId;

    const existingUser = await prisma.user.findUnique({
      where: { id: resetUserId },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: resetUserId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong.", error });
  }
}

export default authMiddleware(updateUser);
