import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middleware/authMiddleware";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = (req as any).user.userId;
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid category ID." });
  }

  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) {
    return res.status(400).json({ message: "Invalid category ID format." });
  }

  if (req.method === "GET") {
    // Get single category by ID
    try {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          userId, // Ensure user owns the category
        },
        include: {
          transactions: {
            orderBy: { date: "desc" },
            take: 10,
          },
        },
      });

      if (!category) {
        return res.status(404).json({ message: "Category not found." });
      }

      res.status(200).json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category." });
    }
  } else if (req.method === "PUT") {
    // Update category by ID
    const { name, budget, isDefault } = req.body;

    try {
      // First verify the category exists and belongs to user
      const existingCategory = await prisma.category.findFirst({
        where: {
          id: categoryId,
          userId,
        },
      });

      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found." });
      }

      // Check if name is being changed to something that already exists
      if (name && name !== existingCategory.name) {
        const nameConflict = await prisma.category.findFirst({
          where: {
            name,
            userId,
            id: { not: categoryId },
          },
        });

        if (nameConflict) {
          return res.status(400).json({ message: "Category with this name already exists." });
        }
      }

      const updatedCategory = await prisma.category.update({
        where: {
          id: categoryId,
        },
        data: {
          ...(name && { name }),
          ...(budget !== undefined && { budget: budget !== null ? parseFloat(budget) : null }),
          ...(isDefault !== undefined && { isDefault }),
        },
      });

      res.status(200).json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category." });
    }
  } else if (req.method === "DELETE") {
    // Delete category by ID
    try {
      // First verify the category exists and belongs to user
      const existingCategory = await prisma.category.findFirst({
        where: {
          id: categoryId,
          userId,
        },
      });

      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found." });
      }

      // Check if category has transactions
      const transactionCount = await prisma.transaction.count({
        where: {
          categoryId,
        },
      });

      if (transactionCount > 0) {
        return res.status(400).json({ 
          message: "Cannot delete category with existing transactions. Please reassign or delete transactions first." 
        });
      }

      await prisma.category.delete({
        where: {
          id: categoryId,
        },
      });

      res.status(200).json({ message: "Category deleted successfully." });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category." });
    }
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
}

export default authMiddleware(handler);