"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  X,
  Sparkles,
  Zap,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Plus,
  Minus,
  Sliders,
  AlertCircle,
  Wallet,
  Play,
  ThumbsUp,
  Users,
} from "lucide-react";
import { YouTubeVideo } from "@/lib/youtubeData";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

interface PackageItem {
  id?: string;
  amount: number;
  label: string;
  price?: number;
  popular?: boolean;
  tag?: string;
}

interface YouTubeBoostModalProps {
  type: "subscribers" | "views" | "likes";
  targetChannelTitle: string;
  targetHandle: string;
  avatarUrl: string;
  initialCount?: number;
  targetVideo?: YouTubeVideo | null;
  onClose: () => void;
}

export default function YouTubeBoostModal({
  type,
  targetChannelTitle,
  targetHandle,
  avatarUrl,
  initialCount = 0,
  targetVideo,
  onClose,
}: YouTubeBoostModalProps) {
  const isSubs = type === "subscribers";
  const isViews = type === "views";
  const isLikes = type === "likes";

  const { addOrder } = useCart();
  const { data: session } = useSession();

  // User wallet state
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [insufficientError, setInsufficientError] = useState<string | null>(null);

  // Base rate per 1,000 from database (fallback to ₹120 for subscribers, ₹30 for views, ₹40 for likes)
  const defaultRate = isSubs ? 120.0 : isViews ? 30.0 : 40.0;
  const [ratePer1k, setRatePer1k] = useState<number>(defaultRate);

  // Preset packages
  const defaultSubPackages: PackageItem[] = [
    { id: "yt_pkg_subs_1k", amount: 1000, label: "1K Subscribers", price: 120.0, popular: false, tag: "Starter Growth" },
    { id: "yt_pkg_subs_10k", amount: 10000, label: "10K Subscribers", price: 1100.0, popular: true, tag: "Most Popular" },
    { id: "yt_pkg_subs_100k", amount: 100000, label: "100K Subscribers (Silver Button)", price: 9900.0, popular: false, tag: "Viral Creator" },
    { id: "yt_pkg_subs_1m", amount: 1000000, label: "1M Subscribers (Gold Button)", price: 89000.0, popular: false, tag: "Mega Scale" },
  ];

  const defaultViewsPackages: PackageItem[] = [
    { id: "yt_pkg_views_1k", amount: 1000, label: "1K Video Views", price: 30.0, popular: false, tag: "Starter Boost" },
    { id: "yt_pkg_views_10k", amount: 10000, label: "10K Video Views", price: 270.0, popular: true, tag: "Recommended" },
    { id: "yt_pkg_views_100k", amount: 100000, label: "100K Video Views", price: 2400.0, popular: false, tag: "Algorithm Push" },
    { id: "yt_pkg_views_1m", amount: 1000000, label: "1M Video Views", price: 20000.0, popular: false, tag: "Trending #1" },
  ];

  const defaultLikesPackages: PackageItem[] = [
    { id: "yt_pkg_likes_1k", amount: 1000, label: "1K Video Likes", price: 40.0, popular: false, tag: "Starter Boost" },
    { id: "yt_pkg_likes_10k", amount: 10000, label: "10K Video Likes", price: 380.0, popular: true, tag: "High Engagement" },
    { id: "yt_pkg_likes_100k", amount: 100000, label: "100K Video Likes", price: 3600.0, popular: false, tag: "Viral Ratio" },
    { id: "yt_pkg_likes_1m", amount: 1000000, label: "1M Video Likes", price: 32000.0, popular: false, tag: "Mega Trend" },
  ];

  const basePackages = isSubs ? defaultSubPackages : isViews ? defaultViewsPackages : defaultLikesPackages;
  const [packages, setPackages] = useState<PackageItem[]>(basePackages);
  const [selectedPackage, setSelectedPackage] = useState<PackageItem>(packages[1] || packages[0]);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customAmount, setCustomAmount] = useState<number>(5000);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Fetch live wallet balance
  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/wallet?user_email=${encodeURIComponent(session.user.email)}`)
      .then((res) => res.json())
      .then((d) => {
        if (d && typeof d.wallet_balance === "number") {
          setWalletBalance(d.wallet_balance);
        }
      })
      .catch((err) => console.error(err));
  }, [session?.user?.email]);

  const currentBoostAmount = isCustomMode ? customAmount : selectedPackage.amount;
  const currentPrice = isCustomMode
    ? parseFloat(((customAmount / 1000) * ratePer1k).toFixed(2))
    : (selectedPackage.price ?? parseFloat(((selectedPackage.amount / 1000) * ratePer1k).toFixed(2)));

  const serviceLabel = isSubs
    ? "YouTube Subscribers"
    : isViews
    ? "YouTube Video Views"
    : "YouTube Video Likes";

  const targetIdentifier = targetVideo
    ? `Video: ${targetVideo.title}`
    : targetHandle || targetChannelTitle;

  const handleOrder = async () => {
    setInsufficientError(null);

    // Validate wallet balance
    if (walletBalance !== null && walletBalance < currentPrice) {
      setInsufficientError(
        `Insufficient wallet balance (₹${walletBalance.toFixed(2)}). You need ₹${currentPrice.toFixed(2)} to complete this YouTube boost.`
      );
      return;
    }

    setIsOrdering(true);

    try {
      const orderPayload = {
        user_email: session?.user?.email || "anonymous@instafame.com",
        service_type: isSubs ? "followers" : isViews ? "views" : "likes",
        target_username: targetHandle.replace(/^@/, ""),
        target_post_url: targetVideo ? `https://www.youtube.com/watch?v=${targetVideo.id}` : "",
        package_amount: currentBoostAmount,
        package_label: isCustomMode
          ? `${currentBoostAmount.toLocaleString()} ${serviceLabel} (Custom)`
          : `${selectedPackage.label} (YouTube)`,
        price: currentPrice,
        initial_count: initialCount,
        approx_after_count: initialCount + currentBoostAmount,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || "Failed to place order.");
      }

      // Add to local CartContext
      await addOrder({
        type: isSubs ? "followers" : isViews ? "views" : "likes",
        username: targetHandle.replace(/^@/, ""),
        avatarUrl: avatarUrl || "",
        packageAmount: currentBoostAmount,
        packageLabel: orderPayload.package_label,
        price: currentPrice,
        initialCount: initialCount,
        approxAfterCount: initialCount + currentBoostAmount,
        postId: targetVideo ? targetVideo.id : undefined,
        postThumbnail: targetVideo ? targetVideo.thumbnailUrl : undefined,
      });

      // Dispatch wallet balance update event
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("wallet_updated", {
            detail: { balance: (walletBalance || currentPrice) - currentPrice },
          })
        );
      }

      setOrderSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err: any) {
      setInsufficientError(err.message || "An unexpected error occurred while placing boost order.");
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/30">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase text-red-600 tracking-wider">
                YouTube Growth Booster
              </span>
              <h3 className="text-sm font-black text-slate-900 leading-tight">
                {isSubs
                  ? "Boost Channel Subscribers"
                  : isViews
                  ? "Boost YouTube Video Views"
                  : "Boost YouTube Video Likes"}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-grow">
          {/* Target Profile / Video Info Box */}
          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={targetChannelTitle}
                className="w-11 h-11 rounded-full object-cover border border-slate-300 flex-shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                YT
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-extrabold text-sm text-slate-900 truncate">
                {targetChannelTitle}
              </h4>
              <p className="text-xs text-slate-500 truncate font-mono">{targetIdentifier}</p>
            </div>
          </div>

          {/* Mode Switcher: Preset vs Custom */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setIsCustomMode(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                !isCustomMode
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Popular Packages
            </button>
            <button
              onClick={() => setIsCustomMode(true)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                isCustomMode
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Custom Amount Slider
            </button>
          </div>

          {/* Package Selection Cards */}
          {!isCustomMode ? (
            <div className="grid grid-cols-2 gap-3">
              {packages.map((pkg) => {
                const isSelected = selectedPackage.amount === pkg.amount;
                return (
                  <div
                    key={pkg.amount}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 relative ${
                      isSelected
                        ? "border-red-600 bg-red-50/40 shadow-md ring-2 ring-red-600/10"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2.5 right-3 bg-red-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-xs">
                        {pkg.tag || "Popular"}
                      </span>
                    )}
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">Quantity</span>
                      <span className="text-lg font-black text-slate-900">
                        +{pkg.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-600">
                        ₹{pkg.price?.toFixed(2)}
                      </span>
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 text-red-600 fill-red-600 text-white" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Custom Slider Mode */
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Select Desired Amount</span>
                <span className="text-lg font-black text-red-600 font-mono">
                  +{customAmount.toLocaleString()}
                </span>
              </div>

              <input
                type="range"
                min="500"
                max="500000"
                step="500"
                value={customAmount}
                onChange={(e) => setCustomAmount(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />

              <div className="flex justify-between text-[11px] text-slate-400 font-bold">
                <span>500 min</span>
                <span>500K max</span>
              </div>
            </div>
          )}

          {/* Wallet Balance & Insufficient Warning */}
          {session?.user && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-600 font-bold">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>Your Wallet Balance:</span>
              </div>
              <span className="font-extrabold font-mono text-emerald-600 text-sm">
                ₹{walletBalance !== null ? walletBalance.toFixed(2) : "--"}
              </span>
            </div>
          )}

          {insufficientError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">{insufficientError}</p>
                <Link
                  href="/wallet"
                  className="text-red-800 underline font-extrabold block text-[11px]"
                >
                  Click here to Top Up your Wallet ↗
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer Checkout CTA */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Price</span>
            <div className="text-2xl font-black text-emerald-600">₹{currentPrice.toFixed(2)}</div>
          </div>

          <button
            onClick={handleOrder}
            disabled={isOrdering || orderSuccess}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-black text-sm text-white shadow-lg transition-all active:scale-95 cursor-pointer ${
              orderSuccess
                ? "bg-emerald-600 shadow-emerald-500/30"
                : "bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:opacity-95 shadow-red-600/30 disabled:opacity-50"
            }`}
          >
            {orderSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Order Successful!</span>
              </>
            ) : isOrdering ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Boost Now</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
