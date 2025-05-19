import { NextApiRequest, NextApiResponse } from "next";

export default function logout(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Invalidate the token on the client side (e.g., remove it from cookies or localStorage)
  res.status(200).json({ message: "Logout successful." });
}