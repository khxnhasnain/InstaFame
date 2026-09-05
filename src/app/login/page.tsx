"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, ShieldCheck, AlertCircle, HelpCircle, BarChart3, Users, Rocket, Lightbulb, Target, Clock, Headphones } from "lucide-react";

function LoginForm() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [showSetupHelp, setShowSetupHelp] = useState(false);

  const errorType = searchParams.get("error");

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleGoogleSignIn = () => {
    setLoadingGoogle(true);
    signIn("google", { callbackUrl: "/dashboard" });
  };

  let errorMessage = "";
  if (errorType === "OAuthCallback" || errorType === "OAuthSignin") {
    errorMessage = "Google OAuth authentication failed. Please make sure 'http://localhost:3000/api/auth/callback/google' is added to Authorized Redirect URIs in your Google Cloud Console.";
  } else if (errorType === "AccessDenied") {
    errorMessage = "Access was denied on the Google sign-in consent screen. Please try again.";
  } else if (errorType === "Configuration") {
    errorMessage = "Google OAuth configuration error. Please verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local.";
  } else if (errorType) {
    errorMessage = `Sign-in error (${errorType}). Please check your Google OAuth credentials.`;
  }

  return (
    <div className="w-full max-w-[670px] bg-white border border-slate-200/80 rounded-[34px] px-5 sm:px-7 py-7 sm:py-9 shadow-2xl relative z-10 space-y-5 sm:space-y-6 text-center">
      {/* Brand Icon & Name Header */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-center gap-2.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-instagram-orange via-instagram-pink to-purple-600 p-0.5 shadow-md">
            <div className="w-full h-full bg-white rounded-[12px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-instagram-pink" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-sans">
            Viralora
          </h1>
        </div>
        <p className="text-[11px] sm:text-xs font-extrabold tracking-widest text-instagram-pink uppercase pt-0.5">
          GROW YOUR PRESENCE
        </p>
        <p className="text-xs sm:text-sm font-medium text-slate-500">
          Pixel-Perfect Social Profile Viewer &amp; Explorer
        </p>
      </div>

      {/* 3 Step Feature Cards with Floating Node Connectors */}
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-2.5 md:gap-0 relative">
        {/* Card 1: Smart Analytics */}
        <div className="flex-1 bg-white border border-slate-100 rounded-[24px] p-3.5 sm:p-4 sm:py-5 shadow-md shadow-slate-100/80 text-center flex flex-col items-center">
          <div className="w-13 h-13 rounded-full bg-pink-100/70 flex items-center justify-center text-pink-500 mb-3 shrink-0 p-3">
            <BarChart3 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Smart Analytics</h3>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            We help you understand your profile performance with powerful insights.
          </p>
        </div>

        {/* Connector 1: Dashed Line with Floating Lightbulb */}
        <div className="hidden md:flex flex-col items-center justify-center w-7 shrink-0 self-center">
          <div className="w-[1.5px] h-8 border-l-2 border-dashed border-slate-300" />
          <div className="w-7 h-7 rounded-full bg-pink-50 border border-pink-200/90 shadow-xs flex items-center justify-center text-pink-500 shrink-0 my-1">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <div className="w-[1.5px] h-8 border-l-2 border-dashed border-slate-300" />
        </div>

        {/* Card 2: Grow & Connect */}
        <div className="flex-1 bg-white border border-slate-100 rounded-[24px] p-3.5 sm:p-4 sm:py-5 shadow-md shadow-slate-100/80 text-center flex flex-col items-center">
          <div className="w-13 h-13 rounded-full bg-indigo-100/70 flex items-center justify-center text-indigo-500 mb-3 shrink-0 p-3">
            <Users className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Grow &amp; Connect</h3>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            We help you build real connections and expand your social reach.
          </p>
        </div>

        {/* Connector 2: Dashed Line with Floating Target */}
        <div className="hidden md:flex flex-col items-center justify-center w-7 shrink-0 self-center">
          <div className="w-[1.5px] h-8 border-l-2 border-dashed border-slate-300" />
          <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200/90 shadow-xs flex items-center justify-center text-emerald-500 shrink-0 my-1">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div className="w-[1.5px] h-8 border-l-2 border-dashed border-slate-300" />
        </div>

        {/* Card 3: Your Growth Guide */}
        <div className="flex-1 bg-white border border-slate-100 rounded-[24px] p-3.5 sm:p-4 sm:py-5 shadow-md shadow-slate-100/80 text-center flex flex-col items-center">
          <div className="w-13 h-13 rounded-full bg-emerald-100/70 flex items-center justify-center text-emerald-500 mb-3 shrink-0 p-3">
            <Rocket className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Your Growth Guide</h3>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            We guide you with smart tools to grow faster on social platforms.
          </p>
        </div>
      </div>

      {/* Flow Pill with Curved Dashed Connectors */}
      <div className="relative flex items-center justify-center pt-0.5">
        <svg className="absolute inset-x-0 -top-4 w-full h-8 pointer-events-none hidden md:block overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 32">
          <defs>
            <marker id="arrow-left" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#6d28d9" />
            </marker>
            <marker id="arrow-right" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#6d28d9" />
            </marker>
          </defs>
          {/* Left curve towards bottom of Card 1 */}
          <path d="M 235 22 C 185 22, 145 14, 120 3" fill="none" stroke="#6d28d9" strokeWidth="1.5" strokeDasharray="3.5 3.5" markerEnd="url(#arrow-left)" />
          {/* Right curve towards bottom of Card 3 */}
          <path d="M 365 22 C 415 22, 455 14, 480 3" fill="none" stroke="#6d28d9" strokeWidth="1.5" strokeDasharray="3.5 3.5" markerEnd="url(#arrow-right)" />
        </svg>

        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-bold text-[11px] shadow-sm relative z-10">
          <span>✦</span>
          <span>View</span>
          <span>→</span>
          <span>Boost</span>
          <span>→</span>
          <span>Grow</span>
          <span>✦</span>
        </div>
      </div>

      {/* Trust & Features Bar */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3 sm:py-3 sm:px-4 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-2">
        {/* 100% Secure */}
        <div className="flex items-center gap-2.5 justify-start sm:justify-center">
          <div className="w-8 h-8 rounded-lg bg-purple-100/70 text-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-bold text-slate-900 leading-tight">100% Secure</p>
            <p className="text-[10px] text-slate-500">Your data is safe</p>
          </div>
        </div>

        {/* Instant Results */}
        <div className="flex items-center gap-2.5 justify-start sm:justify-center">
          <div className="w-8 h-8 rounded-lg bg-purple-100/70 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-bold text-slate-900 leading-tight">Instant Results</p>
            <p className="text-[10px] text-slate-500">See growth fast</p>
          </div>
        </div>

        {/* Trusted by Users */}
        <div className="flex items-center gap-2.5 justify-start sm:justify-center">
          <div className="w-8 h-8 rounded-lg bg-purple-100/70 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-bold text-slate-900 leading-tight">Trusted by Users</p>
            <p className="text-[10px] text-slate-500">Thousands trust us</p>
          </div>
        </div>

        {/* 24/7 Support */}
        <div className="flex items-center gap-2.5 justify-start sm:justify-center">
          <div className="w-8 h-8 rounded-lg bg-purple-100/70 text-indigo-600 flex items-center justify-center shrink-0">
            <Headphones className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-bold text-slate-900 leading-tight">24/7 Support</p>
            <p className="text-[10px] text-slate-500">We&apos;re always here</p>
          </div>
        </div>
      </div>

      {/* Error Banner if OAuth failed */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-left space-y-2 text-xs text-red-700 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed font-semibold">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSetupHelp(!showSetupHelp)}
            className="text-indigo-600 underline font-bold cursor-pointer text-[11px] block pl-6"
          >
            {showSetupHelp ? "Hide Google Setup Steps" : "How to fix Google Cloud Redirect URI in 1 minute?"}
          </button>
        </div>
      )}

      {/* Google Setup Guide */}
      {showSetupHelp && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs text-slate-700 space-y-2.5 animate-in fade-in">
          <p className="font-bold text-slate-900 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-indigo-500" />
            <span>Google Cloud Console Settings:</span>
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600">
            <li>Open <strong>Google Cloud Console</strong> &gt; <strong>APIs &amp; Services</strong> &gt; <strong>Credentials</strong>.</li>
            <li>Click on your <strong>OAuth 2.0 Client ID</strong>.</li>
            <li>Under <strong>Authorized redirect URIs</strong>, add:</li>
            <li className="font-mono text-indigo-600 bg-indigo-50 p-1.5 rounded-md select-all text-[11px]">
              http://localhost:3000/api/auth/callback/google
            </li>
            <li>Under <strong>Authorized JavaScript origins</strong>, add:</li>
            <li className="font-mono text-indigo-600 bg-indigo-50 p-1.5 rounded-md select-all text-[11px]">
              http://localhost:3000
            </li>
            <li>Click <strong>Save</strong>.</li>
          </ol>
        </div>
      )}

      {/* Google OAuth Login Button */}
      <div className="pt-1">
        <button
          onClick={handleGoogleSignIn}
          disabled={loadingGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-bold py-4 px-6 rounded-2xl border border-slate-300 shadow-sm transition-all transform active:scale-[0.99] disabled:opacity-50 cursor-pointer text-sm sm:text-base"
        >
          {loadingGoogle ? (
            <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Sign in with Google</span>
        </button>
      </div>

      {/* Footer Note */}
      <div className="pt-1 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Secure Google OAuth 2.0 Authentication</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden font-sans">
      {/* Background Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-instagram-pink/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
