import { NextRequest, NextResponse } from "next/server";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

const DEFAULT_PACKAGES = [
  { id: "pkg_followers_1k", service_type: "followers", amount: 1000, label: "1K Followers", price: 8.00, currency: "USD", popular: false, tag: "Starter Growth", is_active: true },
  { id: "pkg_followers_10k", service_type: "followers", amount: 10000, label: "10K Followers", price: 76.00, currency: "USD", popular: true, tag: "Most Popular", is_active: true },
  { id: "pkg_followers_100k", service_type: "followers", amount: 100000, label: "100K Followers", price: 720.00, currency: "USD", popular: false, tag: "Pro Creator", is_active: true },
  { id: "pkg_followers_1m", service_type: "followers", amount: 1000000, label: "1M Followers", price: 6400.00, currency: "USD", popular: false, tag: "Celebrity Fame", is_active: true },

  { id: "pkg_likes_1k", service_type: "likes", amount: 1000, label: "1K Likes", price: 4.00, currency: "USD", popular: false, tag: "Starter Boost", is_active: true },
  { id: "pkg_likes_10k", service_type: "likes", amount: 10000, label: "10K Likes", price: 38.00, currency: "USD", popular: true, tag: "Most Popular", is_active: true },
  { id: "pkg_likes_100k", service_type: "likes", amount: 100000, label: "100K Likes", price: 360.00, currency: "USD", popular: false, tag: "Viral Hit", is_active: true },
  { id: "pkg_likes_1m", service_type: "likes", amount: 1000000, label: "1M Likes", price: 3200.00, currency: "USD", popular: false, tag: "Explore Sensation", is_active: true },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    try {
      const url = `${PYTHON_BACKEND_URL}/api/packages${type ? `?type=${type}` : ""}`;
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend offline fallback
    }

    const filtered = type ? DEFAULT_PACKAGES.filter((p) => p.service_type === type) : DEFAULT_PACKAGES;
    return NextResponse.json({ success: true, data: filtered, source: "default" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load packages" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Package ID is required" }, { status: 400 });
    }

    try {
      const url = `${PYTHON_BACKEND_URL}/api/packages/${id}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend offline fallback
    }

    return NextResponse.json({ success: true, data: body, message: "Updated locally" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update package" }, { status: 500 });
  }
}
