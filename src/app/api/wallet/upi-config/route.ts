import { NextResponse } from "next/server";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const res = await fetch(`${PYTHON_BACKEND_URL}/api/wallet/upi-config`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch UPI configuration from backend",
      },
      { status: res.status }
    );
  } catch (error: any) {
    // Graceful offline fallback with system defaults
    return NextResponse.json({
      success: true,
      data: {
        upi_id: process.env.UPI_ID || "8591365203@naviaxis",
        upi_display_name: process.env.UPI_DISPLAY_NAME || "Viralora Media",
        min_deposit: 100.0,
        max_deposit: 50000.0,
        fallback_qr_image: "/images/upi_qr.jpg",
        instructions: [
          "Open your preferred UPI app (Google Pay, PhonePe, Paytm, BHIM, Axis).",
          "Scan the amount-specific dynamic QR code or pay to UPI ID 8591365203@naviaxis.",
          "Complete the payment in your UPI app.",
          "Copy the 12-digit numeric UTR / Ref ID from your payment confirmation screen.",
          "Upload your payment screenshot and submit for admin verification.",
        ],
      },
    });
  }
}
