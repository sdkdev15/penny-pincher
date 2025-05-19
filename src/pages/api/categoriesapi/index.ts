import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // List all categories
    try {
      const categories = await prisma.category.findMany({
        orderBy: { createdAt: "asc" },
      });
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories.", error: error.message });
    }
  } else if (req.method === "POST") {
    // Create a new category
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
        },
      });
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category.", error: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
}