"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import InstagramHeader from "@/components/instagram/InstagramHeader";
import InstagramHighlights from "@/components/instagram/InstagramHighlights";
import InstagramGrid from "@/components/instagram/InstagramGrid";
import InstagramSkeleton from "@/components/instagram/InstagramSkeleton";
import { Search, Instagram, AlertCircle, RefreshCw } from "lucide-react";
import { InstagramProfile, InstagramPost } from "@/lib/instagramData";

export default function InstagramPage() {
  const { status } = useSession();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authentication Route Guard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const executeSearch = async (username: string) => {
    const cleanUser = username.trim().replace(/^@/, "");
    if (!cleanUser) return;

    setActiveQuery(cleanUser);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/instagram?username=${encodeURIComponent(cleanUser)}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch profile");
      }

      setProfile(json.data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      executeSearch(searchTerm);
    }
  };

  // Fetch next page of posts (Pagination)
  const handleLoadMorePosts = async () => {
    if (!profile || !profile.paginationToken || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/instagram?username=${encodeURIComponent(profile.username)}&type=posts&pagination_token=${encodeURIComponent(profile.paginationToken)}`
      );
      const json = await res.json();
      if (res.ok && json.data && json.data.posts) {
        setProfile((prev) => {
          if (!prev) return json.data;
          const existingIds = new Set(prev.posts.map((p) => p.id));
          const newPosts = (json.data.posts || []).filter((p: InstagramPost) => !existingIds.has(p.id));
          return {
            ...prev,
            paginationToken: json.data.paginationToken,
            posts: [...prev.posts, ...newPosts],
          };
        });
      }
    } catch (err) {
      console.error("Failed to load more posts:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Fetch next page of reels (Pagination)
  const handleLoadMoreReels = async () => {
    if (!profile || loadingMore) return;
    setLoadingMore(true);
    try {
      const currentList = profile.reels && profile.reels.length > 0 ? profile.reels : (profile.posts || []).filter((p) => p.isVideo);
      const currentReelsCount = currentList.length;
      const targetLimit = Math.max(currentReelsCount + 12, 24);
      const res = await fetch(
        `/api/instagram?username=${encodeURIComponent(profile.username)}&type=reels&limit=${targetLimit}`
      );
      const json = await res.json();
      if (res.ok && json.data && (json.data.reels || json.data.posts)) {
        const incomingReels = json.data.reels || json.data.posts || [];
        setProfile((prev) => {
          if (!prev) return json.data;
          const baseReels = prev.reels && prev.reels.length > 0 ? prev.reels : prev.posts.filter((p) => p.isVideo);
          const existingIds = new Set(baseReels.map((p) => p.id));
          const newReels = incomingReels.filter((p: InstagramPost) => !existingIds.has(p.id));
          return {
            ...prev,
            reelsPaginationToken: String(targetLimit),
            reels: [...baseReels, ...newReels],
          };
        });
      }
    } catch (err) {
      console.error("Failed to load more reels:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-instagram-pink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      <Navbar />

      {/* Top Sticky Search Bar */}
      <section className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 py-3.5 px-4 shadow-sm">
        <div className="max-w-[935px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Title Chip */}
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg ig-gradient-border p-[1px] flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[7px] flex items-center justify-center">
                <Instagram className="w-4 h-4 text-instagram-pink" />
              </div>
            </div>
            <span>Instagram Profile Viewer</span>
          </div>

          {/* Search Form (Side-by-side flex layout) */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Instagram username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 text-sm text-slate-900 pl-9 pr-4 py-2 rounded-xl border border-transparent focus:border-instagram-pink focus:outline-none placeholder:text-slate-400 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!searchTerm.trim()}
              className="bg-instagram-pink hover:opacity-90 active:scale-95 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm flex-shrink-0 disabled:opacity-40 cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-grow w-full py-6">
        {loading ? (
          <InstagramSkeleton />
        ) : error ? (
          /* Error State Banner */
          <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Profile Request Error</h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => executeSearch(activeQuery)}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        ) : profile ? (
          /* Profile Replica */
          <div className="animate-in fade-in duration-300">
            <InstagramHeader profile={profile} />
            <InstagramHighlights highlights={profile.highlights} username={profile.username} />
            <InstagramGrid
              posts={profile.posts}
              reels={profile.reels}
              username={profile.username}
              avatarUrl={profile.avatarUrl}
              hasMorePosts={Boolean(profile.paginationToken)}
              hasMoreReels={Boolean(profile.reelsPaginationToken)}
              loadingMore={loadingMore}
              onLoadMorePosts={handleLoadMorePosts}
              onLoadMoreReels={handleLoadMoreReels}
            />
          </div>
        ) : (
          /* Initial Empty State (Prompt user to search) */
          <div className="max-w-md mx-auto my-20 px-6 text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-20 h-20 mx-auto rounded-3xl ig-gradient-border p-1 shadow-lg">
              <div className="w-full h-full bg-white rounded-[20px] flex items-center justify-center">
                <Instagram className="w-10 h-10 text-instagram-pink" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Instagram Profile Viewer</h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Type any Instagram username in the search bar above and press <strong>Search</strong> or <strong>Enter</strong> to view real profiles & media.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-500 space-y-3">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-medium">
          <span className="hover:underline cursor-pointer">Meta</span>
          <span className="hover:underline cursor-pointer">About</span>
          <span className="hover:underline cursor-pointer">Blog</span>
          <span className="hover:underline cursor-pointer">Jobs</span>
          <span className="hover:underline cursor-pointer">Help</span>
          <span className="hover:underline cursor-pointer">API</span>
          <span className="hover:underline cursor-pointer">Privacy</span>
          <span className="hover:underline cursor-pointer">Terms</span>
        </div>
      </footer>
    </div>
  );
}
