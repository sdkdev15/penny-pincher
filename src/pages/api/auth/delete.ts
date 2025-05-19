import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middleware/authMiddleware";

async function deleteUser(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const userId = (req as any).user.userId; // Extracted from authMiddleware

    // Delete the user
    await prisma.user.delete({ where: { id: userId } });

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong.", error: error });
  }
}

export default authMiddleware(deleteUser);