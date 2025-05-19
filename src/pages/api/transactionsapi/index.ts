import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // List all transactions
    try {
      const transactions = await prisma.transaction.findMany({
        // include: { category: true }, // Include category details
        orderBy: { date: "asc" }, 
      });
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions.", error: error });
    }
  } else if (req.method === "POST") {
    // Create a new transaction
    const { type, amount, categoryId, date, notes } = req.body;

    if (!type || !amount || !categoryId || !date) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    try {
      const transaction = await prisma.transaction.create({
        data: {
          type,
          amount: parseFloat(amount),
          categoryId: parseInt(categoryId),
          date: new Date(date),
          notes,
        },
      });
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to create transaction.", error: error });
    }
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
}