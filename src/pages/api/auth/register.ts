import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma"; // Assuming you have a Prisma client setup

export default async function register(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { username, password, isAdmin } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long." });
  }

  try {
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "Username is already taken." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, isAdmin },
    });

    res.status(201).json({ message: "User registered successfully.", user: { id: user.id, username: user.username } });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong.", error: error });
  }
}