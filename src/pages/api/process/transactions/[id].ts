import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middleware/authMiddleware";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = (req as any).user.userId;
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid transaction ID." });
  }

  const transactionId = parseInt(id, 10);

  if (isNaN(transactionId)) {
    return res.status(400).json({ message: "Invalid transaction ID format." });
  }

  if (req.method === "GET") {
    // Get single transaction by ID
    try {
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId, // Ensure user owns the transaction
        },
        include: {
          category: true,
        },
      });

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found." });
      }

      res.status(200).json(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ message: "Failed to fetch transaction." });
    }
  } else if (req.method === "PUT") {
    // Update transaction by ID
    const { type, amount, categoryId, date, notes } = req.body;

    try {
      // First verify the transaction exists and belongs to user
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId,
        },
      });

      if (!existingTransaction) {
        return res.status(404).json({ message: "Transaction not found." });
      }

      const updatedTransaction = await prisma.transaction.update({
        where: {
          id: transactionId,
        },
        data: {
          ...(type && { type }),
          ...(amount !== undefined && { amount: parseFloat(amount) }),
          ...(categoryId !== undefined && { categoryId: parseInt(categoryId, 10) }),
          ...(date && { date: new Date(date) }),
          ...(notes !== undefined && { notes }),
        },
        include: {
          category: true,
        },
      });

      res.status(200).json(updatedTransaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Failed to update transaction." });
    }
  } else if (req.method === "DELETE") {
    // Delete transaction by ID
    try {
      // First verify the transaction exists and belongs to user
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId,
        },
      });

      if (!existingTransaction) {
        return res.status(404).json({ message: "Transaction not found." });
      }

      await prisma.transaction.delete({
        where: {
          id: transactionId,
        },
      });

      res.status(200).json({ message: "Transaction deleted successfully." });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction." });
    }
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
}

export default authMiddleware(handler);