import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middleware/authMiddleware";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const userId = (req as any).user.userId; // Extracted from authMiddleware

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: "Invalid transaction ID." });
  }

  if (req.method === "GET") {
    // Get a single transaction
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: parseInt(id), userId },
        include: { category: true },
      });

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found." });
      }

      res.status(200).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transaction.", error: error });
    }
  } else if (req.method === "PUT") {
    // Update a transaction
    const { type, amount, categoryId, date, notes } = req.body;

    try {
      const updatedTransaction = await prisma.transaction.update({
        where: { id: parseInt(id), userId },
        data: {
          type,
          amount: parseFloat(amount),
          categoryId: parseInt(categoryId),
          date: new Date(date),
          notes,
        },
      });

      res.status(200).json(updatedTransaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to update transaction.", error: error });
    }
  } else if (req.method === "DELETE") {
    // Delete a transaction
    try {
      await prisma.transaction.delete({
        where: { id: parseInt(id), userId },
      });

      res.status(200).json({ message: "Transaction deleted successfully." });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transaction.", error: error });
    }
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
}

export default authMiddleware(handler);