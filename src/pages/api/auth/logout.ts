import { NextApiRequest, NextApiResponse } from "next";

export default function logout(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Clear the authToken cookie
  res.setHeader(
    "Set-Cookie",
    "authToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure"
  );

  res.status(200).json({ message: "Logout successful." });
}