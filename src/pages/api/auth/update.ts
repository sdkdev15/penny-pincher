import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middleware/authMiddleware";

async function updateUser(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required." });
  }

  try {
    const userId = (req as any).user.userId; // Extracted from authMiddleware

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong.", error: error });
  }
}

export default authMiddleware(updateUser);