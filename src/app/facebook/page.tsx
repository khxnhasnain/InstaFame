"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import FacebookHeader from "@/components/facebook/FacebookHeader";
import FacebookSidebar from "@/components/facebook/FacebookSidebar";
import FacebookFeed from "@/components/facebook/FacebookFeed";
import FacebookSkeleton from "@/components/facebook/FacebookSkeleton";
import { Search, Facebook, AlertCircle, RefreshCw } from "lucide-react";
import { FacebookProfile } from "@/lib/facebookData";

export default function FacebookPage() {
  const { status } = useSession();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [profile, setProfile] = useState<FacebookProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Posts");

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
      const res = await fetch(`/api/facebook?username=${encodeURIComponent(cleanUser)}`);
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

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-facebook-bg text-slate-900 flex flex-col font-sans">
      <Navbar />

      {/* Top Sticky Search Bar */}
      <section className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 py-3.5 px-4 shadow-sm">
        <div className="max-w-[1024px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Title Chip */}
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-facebook-blue p-1 flex items-center justify-center text-white">
              <Facebook className="w-5 h-5 fill-current" />
            </div>
            <span>Facebook Profile Viewer</span>
          </div>

          {/* Search Form (Side-by-side flex layout) */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Facebook username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 text-sm text-slate-900 pl-9 pr-4 py-2 rounded-xl border border-transparent focus:border-facebook-blue focus:outline-none placeholder:text-slate-400 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!searchTerm.trim()}
              className="bg-facebook-blue hover:bg-facebook-hoverBlue active:scale-95 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm flex-shrink-0 disabled:opacity-40"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-grow w-full pb-12">
        {loading ? (
          <FacebookSkeleton />
        ) : error ? (
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
              className="inline-flex items-center gap-2 bg-facebook-blue hover:bg-facebook-hoverBlue text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        ) : profile ? (
          <div className="animate-in fade-in duration-300">
            {/* Header & Tabs */}
            <FacebookHeader
              profile={profile}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            {/* Tab Body */}
            {activeTab === "Posts" ? (
              <div className="max-w-[1024px] mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Left Intro & Photos Sidebar */}
                <div className="md:col-span-5">
                  <FacebookSidebar profile={profile} />
                </div>

                {/* Right Post Stream */}
                <div className="md:col-span-7">
                  <FacebookFeed
                    posts={profile.posts}
                    authorAvatar={profile.avatarUrl}
                    authorName={profile.fullName}
                  />
                </div>
              </div>
            ) : (
              <div className="max-w-[1024px] mx-auto px-4 py-12">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                  <h2 className="text-xl font-bold text-slate-900">{activeTab} Section</h2>
                  <p className="text-slate-500 text-sm mt-1">Viewing detailed {activeTab.toLowerCase()} content for {profile.fullName}.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Initial Empty State (Prompt user to search) */
          <div className="max-w-md mx-auto my-20 px-6 text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-facebook-blue text-white p-4 shadow-lg flex items-center justify-center">
              <Facebook className="w-12 h-12 fill-current" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Facebook Profile Viewer</h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Type any Facebook username in the search bar above and press <strong>Search</strong> or <strong>Enter</strong> to view profiles & feed posts.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
