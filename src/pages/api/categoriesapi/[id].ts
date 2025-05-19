import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: "Invalid category ID." });
  }

  if (req.method === "GET") {
    // Get a single category
    try {
      const category = await prisma.category.findUnique({
        where: { id: parseInt(id) },
      });

      if (!category) {
        return res.status(404).json({ message: "Category not found." });
      }

      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category.", error: error.message });
    }
  } else if (req.method === "PUT") {
    // Update a category
    const { name, budget } = req.body;

    try {
      const updatedCategory = await prisma.category.update({
        where: { id: parseInt(id) },
        data: {
          name,
          budget: budget ? parseFloat(budget) : null,
        },
      });

      res.status(200).json(updatedCategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category.", error: error.message });
    }
  } else if (req.method === "DELETE") {
    // Delete a category
    try {
      await prisma.category.delete({
        where: { id: parseInt(id) },
      });

      res.status(200).json({ message: "Category deleted successfully." });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category.", error: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
}