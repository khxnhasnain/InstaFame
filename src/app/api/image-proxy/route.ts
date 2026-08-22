import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");
    const isDownload = searchParams.get("download") === "true";
    const customFilename = searchParams.get("filename") || (imageUrl?.includes(".mp4") ? "instagram-video.mp4" : "instagram-photo.jpg");

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing image url" }, { status: 400 });
    }

    const targetUrl = decodeURIComponent(imageUrl);

    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Referer": "https://www.instagram.com/",
    };

    const mediaRes = await fetch(targetUrl, {
      headers,
      cache: "no-store",
    });

    if (!mediaRes.ok) {
      const DEFAULT_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#cbd5e1"><circle cx="12" cy="12" r="10" fill="#f1f5f9"/><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#94a3b8"/></svg>`;
      return new NextResponse(DEFAULT_AVATAR_SVG, {
        status: 200,
        headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
      });
    }

    const contentType = mediaRes.headers.get("content-type") || (targetUrl.includes(".mp4") ? "video/mp4" : "image/jpeg");
    const mediaBuffer = await mediaRes.arrayBuffer();

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
    };

    if (isDownload) {
      responseHeaders["Content-Disposition"] = `attachment; filename="${encodeURIComponent(customFilename)}"`;
    }

    return new NextResponse(mediaBuffer, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    const DEFAULT_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#cbd5e1"><circle cx="12" cy="12" r="10" fill="#f1f5f9"/><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#94a3b8"/></svg>`;
    return new NextResponse(DEFAULT_AVATAR_SVG, {
      status: 200,
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
    });
  }
}
