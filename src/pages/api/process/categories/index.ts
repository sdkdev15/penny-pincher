import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middleware/authMiddleware";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = (req as any).user.userId;

  if (req.method === "GET") {
    // List all categories for the user
    try {
      const categories = await prisma.category.findMany({
        where: { userId },
        include: {
          _count: {
            select: {
              transactions: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      res.status(200).json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories." });
    }
  } else if (req.method === "POST") {
    // Create a new category
    const { name, budget, isDefault } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Category name is required." });
    }

    try {
      // Check if category with same name already exists for this user
      const existingCategory = await prisma.category.findFirst({
        where: {
          name,
          userId,
        },
      });

      if (existingCategory) {
        return res.status(400).json({ message: "Category with this name already exists." });
      }

      const category = await prisma.category.create({
        data: {
          name,
          budget: budget !== undefined ? parseFloat(budget) : null,
          isDefault: isDefault || false,
          userId,
        },
      });

      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category." });
    }
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
}

export default authMiddleware(handler);