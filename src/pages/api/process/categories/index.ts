import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middleware/authMiddleware";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = (req as any).user.userId; 

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "GET") {
    // List all categories for the logged-in user
    try {
      const categories = await prisma.category.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories.", error: error });
    }
  } else if (req.method === "POST") {
    // Create a new category for the logged-in user
    const { name, budget, isDefault } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required." });
    }

    try {
      const category = await prisma.category.create({
        data: {
          name,
          budget: budget ? parseFloat(budget) : null,
          isDefault: isDefault || false,
          userId, // Associate the category with the logged-in user
        },
      });
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category.", error: error });
    }
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
}

export default authMiddleware(handler);