"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import Loader from "@/components/common/Loader";
import { Instagram, ArrowRight, Sparkles, Layers, ShieldCheck, Search, Play, BarChart3, Users, Rocket } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showRetry, setShowRetry] = useState(false);

  // Fallback safety timeout if NextAuth session verification stalls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === "loading") {
        setShowRetry(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [status]);

  // Authentication Route Guard: Redirect unauthenticated users to /login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <Loader text="Verifying your Google session..." />
        {showRetry && (
          <div className="flex flex-col items-center gap-2 animate-in fade-in">
            <p className="text-xs text-slate-500">Taking longer than expected?</p>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100 transition-all cursor-pointer"
            >
              Go to Login →
            </button>
          </div>
        )}
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Hero Welcome Banner */}
        <section className="relative bg-white rounded-3xl p-8 md:p-12 overflow-hidden border border-slate-200 shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-instagram-pink/10 to-red-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-instagram-pink border border-slate-200">
              <Sparkles className="w-3.5 h-3.5" />
              Welcome to Viralora Hub
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Explore Profiles with{" "}
              <span className="bg-gradient-to-r from-instagram-orange via-instagram-pink to-red-600 bg-clip-text text-transparent">
                Viralora
              </span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Hello, <strong className="text-slate-900">{session?.user?.name || "Explorer"}</strong>! Welcome to Viralora, We're so excited to help you grow your Instagram and YouTube presence.
            </p>
          </div>
        </section>

        {/* Platform Selection Cards Grid */}
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-instagram-pink" />
            Select Profile Viewer Platform
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Instagram Card */}
            <Link
              href="/instagram"
              className="group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-instagram-orange/5 via-instagram-pink/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-instagram-orange via-instagram-pink to-instagram-purple p-0.5 shadow-md group-hover:scale-110 transition-transform">
                    <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                      <Instagram className="w-7 h-7 text-instagram-pink" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-instagram-pink transition-colors">
                    Instagram Profile Viewer
                  </h3>
                  <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                    Tired of being stuck at 500 followers? Viralora is the secret weapon that thousands use to gain 1000+ followers daily, explore reels, and increase organic reach.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-1 text-instagram-pink font-bold group-hover:translate-x-1 transition-transform">
                    <span>Open Viewer</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>

            {/* YouTube Card */}
            <Link
              href="/youtube"
              className="group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 p-0.5 shadow-md shadow-red-500/20 group-hover:scale-110 transition-transform">
                    <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
                          fill="#FF0000"
                        />
                        <polygon points="9.545,15.568 15.818,12 9.545,8.432" fill="#FFFFFF" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-red-600 transition-colors">
                    YouTube Profile & Video Viewer
                  </h3>
                  <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                    Explore YouTube channels, play videos directly inside the in-app player without redirecting, and boost subscribers, views, and likes instantly.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-1 text-red-600 font-bold group-hover:translate-x-1 transition-transform">
                    <span>Open Viewer</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-500 mx-auto sm:mx-0 shadow-2xs">
              <BarChart3 className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Smart Analytics</h4>
              <p className="text-slate-500 text-xs leading-relaxed mt-1">
                We help you understand your profile performance with powerful insights.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 mx-auto sm:mx-0 shadow-2xs">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Grow & Connect</h4>
              <p className="text-slate-500 text-xs leading-relaxed mt-1">
                We help you build real connections and expand your social reach.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mx-auto sm:mx-0 shadow-2xs">
              <Rocket className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Your Growth Guide</h4>
              <p className="text-slate-500 text-xs leading-relaxed mt-1">
                We guide you with smart tools to grow faster on social platforms.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>Viralora &copy; 2026 — Built with Next.js, React, Tailwind CSS & NextAuth.js</p>
      </footer>
    </div>
  );
}
