"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, ShieldCheck, Instagram, Facebook, AlertCircle, HelpCircle } from "lucide-react";

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
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative z-10 space-y-8 text-center">
      {/* Brand Icon Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-instagram-orange via-instagram-pink to-facebook-blue p-0.5 shadow-md">
          <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-instagram-pink animate-pulse" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
          InstaFame
        </h1>
        <p className="text-sm font-medium text-slate-500">
          Pixel-Perfect Social Profile Viewer & Explorer
        </p>
      </div>

      {/* Interactive Platform Badge Links */}
      <div className="flex items-center justify-center gap-3 py-1">
        <Link
          href="/instagram"
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-full border border-slate-200 transition-colors"
        >
          <Instagram className="w-4 h-4 text-instagram-pink flex-shrink-0" />
          <span>Instagram UI</span>
        </Link>
        <Link
          href="/facebook"
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-full border border-slate-200 transition-colors"
        >
          <Facebook className="w-4 h-4 text-facebook-blue flex-shrink-0" />
          <span>Facebook UI</span>
        </Link>
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
      <div className="pt-2">
        <button
          onClick={handleGoogleSignIn}
          disabled={loadingGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-bold py-4 px-4 rounded-2xl border border-slate-300 shadow-sm transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer text-sm"
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
      <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
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
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-facebook-blue/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
