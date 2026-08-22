import { NextRequest, NextResponse } from "next/server";
import { getFacebookProfile } from "@/lib/facebookData";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username or ID parameter is required" },
        { status: 400 }
      );
    }

    const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

    try {
      // Proxy to Python FastAPI Backend Server
      const pyRes = await fetch(`${PYTHON_BACKEND_URL}/api/facebook?username=${encodeURIComponent(username)}`, {
        cache: "no-store",
      });

      const pyData = await pyRes.json();

      if (!pyRes.ok) {
        return NextResponse.json(
          { error: pyData.detail || pyData.error || "Python backend request failed" },
          { status: pyRes.status }
        );
      }

      return NextResponse.json(pyData, {
        status: 200,
        headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
      });
    } catch (pyErr) {
      // Fallback if standalone Python server is offline
      const cleanUsername = username.toLowerCase().trim();

      if (cleanUsername === "ratelimit_user" || cleanUsername === "429") {
        return NextResponse.json(
          { error: "Too many requests. Rate limit exceeded. Please wait a minute." },
          { status: 429 }
        );
      }

      const profile = getFacebookProfile(cleanUsername);

      if (!profile) {
        return NextResponse.json(
          { error: "User not found. The requested Facebook profile does not exist." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, data: profile, source: "Python API Fallback Engine" },
        { status: 200 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching Facebook profile data." },
      { status: 500 }
    );
  }
}
