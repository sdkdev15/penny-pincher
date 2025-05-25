import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middleware/authMiddleware";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = (req as any).user.userId; 
  const { id } = req.query;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: "Invalid category ID." });
  }

  const categoryId = parseInt(id);

  if (req.method === "GET") {
    // Get a single category for the logged-in user
    try {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId },
      });

      if (!category) {
        return res.status(404).json({ message: "Category not found." });
      }

      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category.", error: error });
    }
  } else if (req.method === "PUT") {
      const { name, budget } = req.body;

      try {
        // First, find the category to ensure it belongs to the user
        const existingCategory = await prisma.category.findFirst({
          where: { id: categoryId, userId },
        });

        if (!existingCategory) {
          return res.status(404).json({ message: "Category not found or not authorized." });
        }

        // Now safely update it
        const updatedCategory = await prisma.category.update({
          where: { id: categoryId, userId },
          data: {
            name,
            budget: budget !== undefined ? parseFloat(budget) : null,
          },
        });

        res.status(200).json(updatedCategory); // ✅ Return full updated object
      } catch (error) {
        res.status(500).json({ message: "Failed to update category.", error });
      }
  } else if (req.method === "DELETE") {
    // Delete a category for the logged-in user
    try {
      const deletedCategory = await prisma.category.deleteMany({
        where: { id: categoryId, userId },
      });

      if (deletedCategory.count === 0) {
        return res.status(404).json({ message: "Category not found or not authorized." });
      }

      res.status(200).json({ message: "Category deleted successfully." });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category.", error: error });
    }
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
}

export default authMiddleware(handler);