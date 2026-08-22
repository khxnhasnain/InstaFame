"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import Loader from "@/components/common/Loader";
import { Instagram, Facebook, ArrowRight, Sparkles, Layers, ShieldCheck, Search } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Authentication Route Guard: Redirect unauthenticated users to /login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Hero Welcome Banner */}
        <section className="relative bg-white rounded-3xl p-8 md:p-12 overflow-hidden border border-slate-200 shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-instagram-pink/10 to-facebook-blue/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-instagram-pink border border-slate-200">
              <Sparkles className="w-3.5 h-3.5" />
              Welcome to InstaFame Hub
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Explore Profiles with{" "}
              <span className="bg-gradient-to-r from-instagram-orange via-instagram-pink to-facebook-blue bg-clip-text text-transparent">
                InstaFame
              </span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Hello, <strong className="text-slate-900">{session?.user?.name || "Explorer"}</strong>! Welcome to InstaFame, We're so excited to help you grow your Instagram and Facebook presence.
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
                    Tired of stuck at 500 followers? InstaFame is the secret weapon that thousands use to gain 1000+ followers daily and increase their likes and reach
                    We connect securely with your Instagram account, We never store your password.
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

            {/* Facebook Card */}
            <Link
              href="/facebook"
              className="group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-facebook-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-facebook-blue p-0.5 shadow-md group-hover:scale-110 transition-transform">
                    <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                      <Facebook className="w-7 h-7 text-facebook-blue" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-facebook-blue transition-colors">
                    Facebook Profile Viewer
                  </h3>
                  <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                    Tired of stuck at 500 followers? InstaFame is the secret weapon that thousands use to gain 1000+ followers daily and increase their likes and reach.
                    We connect securely with your Facebook account, We never store your password
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-1 text-facebook-blue font-bold group-hover:translate-x-1 transition-transform">
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
          <div className="space-y-2">
            <Search className="w-6 h-6 text-sky-500 mx-auto sm:mx-0" />
            <h4 className="font-bold text-slate-900 text-base">Debounced Search</h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              500ms smart input debouncing for smooth API queries and responsive user typing.
            </p>
          </div>

          <div className="space-y-2">
            <Sparkles className="w-6 h-6 text-instagram-pink mx-auto sm:mx-0" />
            <h4 className="font-bold text-slate-900 text-base">Pixel-Perfect Replica</h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              Carefully matched spacing, fonts, icon badges, and light mode color tokens.
            </p>
          </div>

          <div className="space-y-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto sm:mx-0" />
            <h4 className="font-bold text-slate-900 text-base">Protected Auth Routes</h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              Full NextAuth authentication guard ensuring profile viewers are accessible post-login.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>InstaFame &copy; 2026 — Built with Next.js, React, Tailwind CSS & NextAuth.js</p>
      </footer>
    </div>
  );
}
