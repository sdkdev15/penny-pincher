import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const RECEIPT_SCAN_SERVICE_URL = 
  process.env.RECEIPT_SCAN_SERVICE_URL || 
  (process.env.NODE_ENV === "production" 
    ? "http://receipt-scan:8000" 
    : "http://localhost:8000");

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image file." },
        { status: 400 }
      );
    }

    // Forward to Python OCR service
    const pythonFormData = new FormData();
    pythonFormData.append("file", file);

    const response = await fetch(`${RECEIPT_SCAN_SERVICE_URL}/scan`, {
      method: "POST",
      body: pythonFormData,
    });

    if (!response.ok) {
      throw new Error(`OCR service error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to process receipt" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });

  } catch (error: any) {
    console.error("Receipt scan error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process receipt" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}