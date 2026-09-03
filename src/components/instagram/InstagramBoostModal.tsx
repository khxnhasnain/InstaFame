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
  ShoppingBag,
  IndianRupee,
  Plus,
  Minus,
  Sliders,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { InstagramPost } from "@/lib/instagramData";
import { useCart } from "@/context/CartContext";

interface PackageItem {
  id?: string;
  amount: number;
  label: string;
  price?: number;
  popular?: boolean;
  tag?: string;
}

interface InstagramBoostModalProps {
  type: "followers" | "likes" | "views";
  targetUsername: string;
  avatarUrl: string;
  initialCount?: number;
  targetPost?: InstagramPost | null;
  onClose: () => void;
}

export default function InstagramBoostModal({
  type,
  targetUsername,
  avatarUrl,
  initialCount = 0,
  targetPost,
  onClose,
}: InstagramBoostModalProps) {
  const isFollowers = type === "followers";
  const isViews = type === "views";
  const { addOrder } = useCart();
  const { data: session } = useSession();

  // User wallet state
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [insufficientError, setInsufficientError] = useState<string | null>(null);

  // Base rate per 1,000 from database (fallback to ₹80 / ₹40 / ₹20)
  const [ratePer1k, setRatePer1k] = useState<number>(isFollowers ? 80.0 : isViews ? 20.0 : 40.0);

  // Preset packages: 1k, 10k, 100k, 1M
  const defaultFollowerPackages: PackageItem[] = [
    { id: "pkg_followers_1k", amount: 1000, label: "1K Followers", price: 80.0, popular: false, tag: "Starter Growth" },
    { id: "pkg_followers_10k", amount: 10000, label: "10K Followers", price: 760.0, popular: true, tag: "Most Popular" },
    { id: "pkg_followers_100k", amount: 100000, label: "100K Followers", price: 7200.0, popular: false, tag: "Pro Creator" },
    { id: "pkg_followers_1m", amount: 1000000, label: "1M Followers", price: 64000.0, popular: false, tag: "Celebrity Fame" },
  ];

  const defaultLikesPackages: PackageItem[] = [
    { id: "pkg_likes_1k", amount: 1000, label: "1K Likes", price: 40.0, popular: false, tag: "Starter Boost" },
    { id: "pkg_likes_10k", amount: 10000, label: "10K Likes", price: 380.0, popular: true, tag: "Most Popular" },
    { id: "pkg_likes_100k", amount: 100000, label: "100K Likes", price: 3600.0, popular: false, tag: "Viral Hit" },
    { id: "pkg_likes_1m", amount: 1000000, label: "1M Likes", price: 32000.0, popular: false, tag: "Explore Sensation" },
  ];

  const defaultViewsPackages: PackageItem[] = [
    { id: "pkg_views_1k", amount: 1000, label: "1K Reel Views", price: 20.0, popular: false, tag: "Starter Views" },
    { id: "pkg_views_10k", amount: 10000, label: "10K Reel Views", price: 190.0, popular: true, tag: "Most Popular" },
    { id: "pkg_views_100k", amount: 100000, label: "100K Reel Views", price: 1800.0, popular: false, tag: "Viral Reel" },
    { id: "pkg_views_1m", amount: 1000000, label: "1M Reel Views", price: 16000.0, popular: false, tag: "Explore Sensation" },
  ];

  const [packages, setPackages] = useState<PackageItem[]>(
    isFollowers ? defaultFollowerPackages : isViews ? defaultViewsPackages : defaultLikesPackages
  );
  const [selectedPackage, setSelectedPackage] = useState<PackageItem>(packages[1] || packages[0]);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customAmountInput, setCustomAmountInput] = useState<string>("5000");
  const [customError, setCustomError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Helper to calculate price for any quantity based on rate
  const calculatePriceForAmount = (amt: number, baseRate: number): number => {
    if (amt <= 0) return 0;
    const raw = (amt / 1000.0) * baseRate;
    // Apply bulk scaling discounts
    let discount = 1.0;
    if (amt >= 1000000) discount = 0.80; // 20% off for 1M+
    else if (amt >= 100000) discount = 0.90; // 10% off for 100k+
    else if (amt >= 10000) discount = 0.95; // 5% off for 10k+
    return Math.round(raw * discount * 100) / 100;
  };

  // Fetch dynamic packages, master rates, and user wallet
  useEffect(() => {
    async function loadDynamicPricing() {
      try {
        const userEmail = session?.user?.email;
        const [pkgsRes, ratesRes, walletRes] = await Promise.all([
          fetch(`/api/packages?type=${type}`, { cache: "no-store" }),
          fetch("/api/pricing/rates", { cache: "no-store" }),
          userEmail ? fetch(`/api/wallet?user_email=${encodeURIComponent(userEmail)}`, { cache: "no-store" }) : null,
        ]);

        let currentRate = isFollowers ? 80.0 : isViews ? 20.0 : 40.0;
        if (ratesRes && ratesRes.ok) {
          const ratesJson = await ratesRes.json();
          if (ratesJson?.data) {
            const r = isFollowers
              ? Number(ratesJson.data.rate_per_1000_followers) || 80.0
              : isViews
              ? Number(ratesJson.data.rate_per_1000_views) || 20.0
              : Number(ratesJson.data.rate_per_1000_likes) || 40.0;
            currentRate = r;
            setRatePer1k(r);
          }
        }

        if (pkgsRes && pkgsRes.ok) {
          const json = await pkgsRes.json();
          if (json && json.data && json.data.length > 0) {
            setPackages(json.data);
            const popular = json.data.find((p: PackageItem) => p.popular) || json.data[1] || json.data[0];
            setSelectedPackage(popular);
          }
        }

        if (walletRes && walletRes.ok) {
          const wData = await walletRes.json();
          if (wData && typeof wData.wallet_balance === "number") {
            setWalletBalance(wData.wallet_balance);
          }
        }
      } catch (e) {
        console.warn("Pricing DB notice:", e);
      }
    }
    loadDynamicPricing();
  }, [type, isFollowers, isViews, session?.user?.email]);


  // Handle custom manual input changes
  const handleCustomInputChange = (val: string) => {
    setCustomAmountInput(val);
    setInsufficientError(null);
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setCustomError("Please enter a valid number");
      return;
    }
    if (num < 1000) {
      setCustomError("Minimum order is 1,000 (1K)");
      return;
    }
    if (num % 1000 !== 0) {
      setCustomError("Amount must be in multiples of 1,000 (e.g. 2,000, 5,000, 15,000)");
      return;
    }
    setCustomError("");
  };

  const handleCustomQuickAdd = (increment: number) => {
    const current = parseInt(customAmountInput, 10) || 1000;
    const nextVal = Math.max(1000, current + increment);
    const rounded = Math.round(nextVal / 1000) * 1000;
    setCustomAmountInput(String(rounded));
    setCustomError("");
    setInsufficientError(null);
  };

  // Determine current active boost amount and price
  const parsedCustom = parseInt(customAmountInput, 10) || 1000;
  const isCustomValid = !isNaN(parsedCustom) && parsedCustom >= 1000 && parsedCustom % 1000 === 0;

  const currentBoostAmount = isCustomMode ? (isCustomValid ? parsedCustom : 1000) : selectedPackage.amount;
  const currentBoostPrice = isCustomMode
    ? calculatePriceForAmount(currentBoostAmount, ratePer1k)
    : (selectedPackage.price ?? calculatePriceForAmount(selectedPackage.amount, ratePer1k));
  const currentBoostLabel = isCustomMode
    ? `+${currentBoostAmount >= 1000000 ? `${(currentBoostAmount / 1000000).toFixed(1).replace(".0", "")}M` : currentBoostAmount >= 1000 ? `${(currentBoostAmount / 1000).toFixed(0)}K` : currentBoostAmount.toLocaleString()} ${isFollowers ? "Followers" : isViews ? "Reel Views" : "Likes"}`
    : selectedPackage.label;

  const baseCount = initialCount || (isFollowers ? 1200 : isViews ? 5000 : 350);
  const approxAfter = baseCount + currentBoostAmount;

  const handleStartBoost = async () => {
    if (isCustomMode && !isCustomValid) {
      setCustomError("Please enter a valid amount (minimum 1,000 in multiples of 1,000)");
      return;
    }

    setInsufficientError(null);
    setIsProcessing(true);

    // Call addOrder which executes database deduction first
    const res = await addOrder({
      type,
      username: targetUsername,
      avatarUrl,
      postThumbnail: targetPost?.imageUrl,
      postId: targetPost?.id,
      packageAmount: currentBoostAmount,
      packageLabel: currentBoostLabel,
      price: currentBoostPrice,
      initialCount: baseCount,
      approxAfterCount: approxAfter,
    });

    setIsProcessing(false);

    if (!res.success) {
      setInsufficientError(res.error || "Insufficient wallet balance to place this order.");
      return;
    }

    // Success: Modal closes and cart drawer starts increasing followers/likes/views
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 my-auto">
        {/* Top Header Background Banner */}
        <div className="bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-fit mb-2">
            <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>InstaFame AI Growth Booster</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">
            {isFollowers ? "Increase Instagram Followers" : isViews ? "Increase Reel Views" : "Increase Post & Reel Likes"}
          </h2>
          <p className="text-white/80 text-xs mt-1">
            {isFollowers
              ? `Boost genuine followers & organic reach for @${targetUsername}`
              : isViews
              ? `Boost genuine high-retention views on this reel for @${targetUsername}`
              : `Boost high-engagement likes on this media for @${targetUsername}`}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Target Media or Profile Card */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            {isFollowers ? (
              <img
                src={avatarUrl}
                alt={targetUsername}
                className="w-12 h-12 rounded-full object-cover border-2 border-instagram-pink flex-shrink-0"
              />
            ) : (
              <img
                src={targetPost?.imageUrl || avatarUrl}
                alt="Post Thumbnail"
                className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-500 flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  @{targetUsername}
                </p>
                <CheckCircle className="w-3.5 h-3.5 text-sky-500 fill-sky-500 text-white flex-shrink-0" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {isFollowers
                  ? `Current: ${initialCount.toLocaleString()} followers`
                  : isViews
                  ? `Current: ${initialCount.toLocaleString()} reel views`
                  : `Current: ${initialCount.toLocaleString()} likes`}
              </p>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secure 100%</span>
            </div>
          </div>


          {/* Section 1: Standard Preset Packages (1k, 10k, 100k, 1M) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Select {isFollowers ? "Followers" : "Likes"} Package
              </label>
              <span className="text-[11px] font-semibold text-indigo-500 dark:text-indigo-400">
                ₹{ratePer1k.toFixed(2)} / 1K Base Rate
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {packages.map((pkg) => {
                const isSelected = !isCustomMode && selectedPackage.amount === pkg.amount;
                return (
                  <button
                    key={pkg.amount}
                    type="button"
                    onClick={() => {
                      setIsCustomMode(false);
                      setSelectedPackage(pkg);
                    }}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-instagram-pink bg-pink-50/60 dark:bg-pink-950/30 ring-2 ring-instagram-pink/30 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2 right-3 text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-pink-500 to-indigo-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                        {pkg.tag || "Most Popular"}
                      </span>
                    )}
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-extrabold text-slate-900 dark:text-white text-base">
                        {pkg.label}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span>High Retention</span>
                      </p>
                      {typeof pkg.price === "number" && (
                        <span className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                          ₹{pkg.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Custom Manual Amount Option */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isCustomMode
                ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20"
                : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <label
                onClick={() => setIsCustomMode(true)}
                className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span>Or Enter Custom Quantity (Multiples of 1,000)</span>
              </label>

              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full cursor-pointer transition-all ${
                  isCustomMode
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                }`}
              >
                {isCustomMode ? "Active" : "Select Custom"}
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={customAmountInput}
                    onFocus={() => setIsCustomMode(true)}
                    onChange={(e) => handleCustomInputChange(e.target.value)}
                    placeholder="e.g. 5000, 15000, 50000"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-extrabold text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 shadow-inner"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                    {isFollowers ? "Followers" : isViews ? "Reel Views" : "Likes"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMode(true);
                      handleCustomQuickAdd(-1000);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
                    title="-1,000"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMode(true);
                      handleCustomQuickAdd(1000);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
                    title="+1,000"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Stepper Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[2000, 5000, 15000, 25000, 50000, 250000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => {
                      setIsCustomMode(true);
                      setCustomAmountInput(String(quick));
                      setCustomError("");
                    }}
                    className="text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                  >
                    +{quick >= 1000 ? `${quick / 1000}K` : quick}
                  </button>
                ))}
              </div>

              {customError ? (
                <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{customError}</span>
                </p>
              ) : isCustomMode ? (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Calculated Price for {parsedCustom.toLocaleString()} {isFollowers ? "followers" : isViews ? "reel views" : "likes"}:
                  </span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    ₹{calculatePriceForAmount(parsedCustom, ratePer1k).toFixed(2)}
                  </span>
                </div>
              ) : null}

            </div>
          </div>

          {/* Live Estimate Card: Initial -> Approx After */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Initial Count:</span>
              <strong className="font-bold text-slate-900 dark:text-white text-sm">
                {initialCount.toLocaleString()}
              </strong>
            </div>
            <div className="flex items-center gap-1 text-indigo-500">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Approx After:</span>
              <strong className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                {approxAfter.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* User Wallet Balance Summary */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-500">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Your Wallet Balance:</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm font-mono">
                  ₹{walletBalance !== null ? walletBalance.toFixed(2) : "50.00"}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Order Total:</span>
              <span className="font-black text-pink-600 dark:text-pink-400 text-sm font-mono">
                ₹{currentBoostPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Insufficient Balance Alert */}
          {insufficientError && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 text-xs text-red-600 dark:text-red-400 font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p>{insufficientError}</p>
                <p className="text-[11px] font-normal text-slate-600 dark:text-slate-400">
                  Please go to the <strong>Wallet</strong> tab in the navigation to top up your wallet.
                </p>
              </div>
            </div>
          )}

          {/* Action Button: Add to Cart & Start Boost */}
          <button
            type="button"
            onClick={handleStartBoost}
            disabled={isProcessing || (isCustomMode && !isCustomValid)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 text-white font-extrabold text-sm shadow-lg shadow-pink-500/25 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Adding to Cart & Launching...</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>
                  Order {currentBoostLabel} - ₹{currentBoostPrice.toFixed(2)} (Add to Cart)
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
