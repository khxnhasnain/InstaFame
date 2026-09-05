import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || "instafame_internal_server_secret_7392817491028374";

async function ensureUserSynced(session: any, userId: string) {
  try {
    if (!session?.user?.email) return;
    await fetch(`${PYTHON_BACKEND_URL}/api/users/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userId,
        email: session.user.email,
        name: session.user.name || "",
        avatar_url: session.user.image || "",
        provider: "google",
        role: session.user.role || (session.user.isAdmin ? "admin" : "user"),
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Non-blocking sync attempt
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Identify user strictly by their authenticated unique user ID (NEVER by name)
    const userId = (session.user as any)?.id || session.user.email;
    if (!userId) {
      return NextResponse.json({ error: "Unable to determine authenticated user identity" }, { status: 401 });
    }

    await ensureUserSynced(session, userId);

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("page_size") || "20";

    const res = await fetch(
      `${PYTHON_BACKEND_URL}/api/wallet/deposits?page=${encodeURIComponent(page)}&page_size=${encodeURIComponent(pageSize)}`,
      {
        headers: {
          "X-Internal-Secret": INTERNAL_API_SECRET,
          "X-User-Id": userId,
          // NOTE: X-User-Email is deliberately omitted per security requirements
        },
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch user deposits" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any)?.id || session.user.email;
    if (!userId) {
      return NextResponse.json({ error: "Unable to determine authenticated user identity" }, { status: 401 });
    }

    // Proactively ensure authenticated NextAuth user is synced in backend database
    await ensureUserSynced(session, userId);

    const incomingFormData = await request.formData();
    const amountStr = incomingFormData.get("amount")?.toString() || "";
    const utr = incomingFormData.get("utr")?.toString()?.trim() || "";
    const screenshot = incomingFormData.get("screenshot") as File | null;

    // Validate 12-digit UTR strictly on Next.js server-side
    if (!/^[0-9]{12}$/.test(utr)) {
      return NextResponse.json(
        { error: "UTR / Transaction ID must be exactly 12 numeric digits (e.g. 123456789012)." },
        { status: 400 }
      );
    }

    const amountNum = parseFloat(amountStr);
    if (isNaN(amountNum) || amountNum < 100 || amountNum > 50000) {
      return NextResponse.json(
        { error: "Deposit amount must be between ₹100.00 and ₹50,000.00." },
        { status: 400 }
      );
    }

    if (!screenshot || !(screenshot instanceof Blob)) {
      return NextResponse.json({ error: "Payment screenshot file is required." }, { status: 400 });
    }

    // Forward formData directly to Python FastAPI backend
    const forwardFormData = new FormData();
    forwardFormData.append("amount", amountNum.toString());
    forwardFormData.append("utr", utr);
    forwardFormData.append("screenshot", screenshot, screenshot.name || "screenshot.png");

    const res = await fetch(`${PYTHON_BACKEND_URL}/api/wallet/deposits`, {
      method: "POST",
      headers: {
        "X-Internal-Secret": INTERNAL_API_SECRET,
        "X-User-Id": userId,
        // NOTE: X-User-Email is deliberately omitted per security requirements
      },
      body: forwardFormData,
      signal: AbortSignal.timeout(12000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || "Failed to submit wallet deposit" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error submitting deposit" }, { status: 500 });
  }
}
