"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Database,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Search,
  Filter,
  Shield,
  Clock,
  ArrowRight,
  Heart,
  Instagram,
  Check,
  Zap,
  Sliders,
} from "lucide-react";

interface Package {
  id: string;
  service_type: "followers" | "likes";
  amount: number;
  label: string;
  price: number;
  currency: string;
  popular: boolean;
  tag: string;
  is_active: boolean;
}

interface UserRecord {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: string;
  role: string;
  total_orders_count: number;
  last_login: string;
  created_at: string;
}

interface OrderRecord {
  id: string;
  user_email: string;
  service_type: "followers" | "likes";
  target_username: string;
  target_post_url?: string;
  package_amount: number;
  package_label: string;
  price: number;
  initial_count: number;
  approx_after_count: number;
  current_count: number;
  status: string;
  created_at: string;
}

interface AdminStats {
  total_users: number;
  total_orders: number;
  total_revenue: number;
  total_followers_boosted: number;
  total_likes_boosted: number;
  database_engine: string;
}

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";

const checkIsAdmin = (email?: string | null, sessionUser?: any): boolean => {
  if (sessionUser?.isAdmin || sessionUser?.role === "admin") return true;
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "khanhasnain2310@gmail.com,admin@instafame.com")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return envAdmins.includes(clean) || clean.startsWith("admin@");
};

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pricing" | "users" | "records">("pricing");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ id: string; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Master rate per 1,000 states
  const [rateFollowers1k, setRateFollowers1k] = useState<number>(8.00);
  const [rateLikes1k, setRateLikes1k] = useState<number>(4.00);
  const [isSavingRates, setIsSavingRates] = useState(false);
  const [ratesSuccessMsg, setRatesSuccessMsg] = useState(false);

  // Editable package states
  const [editingPackages, setEditingPackages] = useState<{ [id: string]: Package }>({});

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, pkgsRes, usersRes, ordersRes, ratesRes] = await Promise.all([
        fetch("/api/admin/stats", { cache: "no-store" }),
        fetch("/api/packages", { cache: "no-store" }),
        fetch("/api/users", { cache: "no-store" }),
        fetch("/api/orders", { cache: "no-store" }),
        fetch("/api/pricing/rates", { cache: "no-store" }),
      ]);

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.data);
      }
      if (ratesRes.ok) {
        const d = await ratesRes.json();
        if (d?.data) {
          setRateFollowers1k(Number(d.data.rate_per_1000_followers) || 8.00);
          setRateLikes1k(Number(d.data.rate_per_1000_likes) || 4.00);
        }
      }
      if (pkgsRes.ok) {
        const d = await pkgsRes.json();
        setPackages(d.data || []);
        const map: { [id: string]: Package } = {};
        (d.data || []).forEach((p: Package) => {
          map[p.id] = { ...p };
        });
        setEditingPackages(map);
      }
      if (usersRes.ok) {
        const d = await usersRes.json();
        setUsers(d.data || []);
      }
      if (ordersRes.ok) {
        const d = await ordersRes.json();
        setOrders(d.data || []);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveMasterRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRates(true);
    setRatesSuccessMsg(false);

    try {
      const res = await fetch("/api/pricing/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rate_per_1000_followers: rateFollowers1k,
          rate_per_1000_likes: rateLikes1k,
          auto_update_packages: true,
        }),
      });

      if (res.ok) {
        setRatesSuccessMsg(true);
        await fetchData();
        setTimeout(() => setRatesSuccessMsg(false), 3500);
      }
    } catch (err) {
      console.error("Failed to save master rates:", err);
    } finally {
      setIsSavingRates(false);
    }
  };

  const handlePriceChange = (id: string, field: keyof Package, value: any) => {
    setEditingPackages((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSavePackage = async (id: string) => {
    const pkg = editingPackages[id];
    if (!pkg) return;

    setIsSaving(id);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/packages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pkg.id,
          price: parseFloat(String(pkg.price)),
          amount: parseInt(String(pkg.amount)),
          label: pkg.label,
          tag: pkg.tag,
          popular: pkg.popular,
          is_active: pkg.is_active,
        }),
      });

      if (res.ok) {
        setSaveMessage({ id, text: "Price Saved to Database!" });
        setPackages((prev) => prev.map((p) => (p.id === id ? { ...pkg } : p)));
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ id, text: "Failed to save" });
      }
    } catch {
      setSaveMessage({ id, text: "Error saving" });
    } finally {
      setIsSaving(null);
    }
  };

  const followerPackages = Object.values(editingPackages).filter((p) => p.service_type === "followers");
  const likePackages = Object.values(editingPackages).filter((p) => p.service_type === "likes");

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.target_username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAdmin = checkIsAdmin(session?.user?.email, session?.user);

  // If loading session
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not logged in or not admin
  if (status === "unauthenticated" || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto flex items-center justify-center text-red-400">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Administrator Access Only</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              The Pricing &amp; Database Management area is restricted. Please sign in with an authorized admin account ({session?.user?.email ? `Current: ${session.user.email}` : "Not logged in"}).
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg transition-all hover:opacity-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-instagram-orange via-instagram-pink to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-pink-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Database className="w-5 h-5 text-instagram-pink" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  InstaFame Database & Pricing Manager
                </h1>
                <p className="text-xs text-slate-400">
                  Manage price per 1,000 followers and likes, view registered users, and track booster transactions.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{stats?.database_engine || "MySQL Engine: Active"}</span>
            </div>

            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all border border-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">
              ${(stats?.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-emerald-400 font-medium">From Boost Orders</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Users</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-white">
              {(stats?.total_users || users.length).toLocaleString()}
            </p>
            <p className="text-[11px] text-indigo-400 font-medium">Login Users Database</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Orders</span>
              <ShoppingBag className="w-4 h-4 text-pink-400" />
            </div>
            <p className="text-2xl font-black text-white">
              {(stats?.total_orders || orders.length).toLocaleString()}
            </p>
            <p className="text-[11px] text-pink-400 font-medium">Boosts Executed</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Followers Boosted</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl font-black text-white">
              +{(stats?.total_followers_boosted || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-sky-400 font-medium">Total Followers Added</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-1 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Likes Boosted</span>
              <Heart className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-black text-white">
              +{(stats?.total_likes_boosted || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-rose-400 font-medium">Total Likes Added</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("pricing")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-extrabold text-sm transition-all cursor-pointer ${
              activeTab === "pricing"
                ? "bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 text-white shadow-lg shadow-pink-500/20"
                : "text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-900 border border-slate-800"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Manage Pricing &amp; Rates</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-extrabold text-sm transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 text-white shadow-lg shadow-pink-500/20"
                : "text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-900 border border-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Login Users Database ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("records")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-extrabold text-sm transition-all cursor-pointer ${
              activeTab === "records"
                ? "bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 text-white shadow-lg shadow-pink-500/20"
                : "text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-900 border border-slate-800"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Growth Booster Records ({orders.length})</span>
          </button>
        </div>

        {/* Tab 1: Pricing & Amount Manager */}
        {activeTab === "pricing" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* MASTER 1,000 RATE CONTROLLER CARD */}
            <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-purple-950/60 border-2 border-indigo-500/40 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/30">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <span>Rate Controller: Price per 1,000 Followers &amp; Likes</span>
                      <span className="text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                        Master Database Rates
                      </span>
                    </h2>
                    <p className="text-xs text-slate-300">
                      Change the base rate for 1,000 followers or 1,000 likes here. It automatically calculates and updates all packages in the frontend UI in real-time!
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveMasterRates} className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                {/* Rate Per 1,000 Followers */}
                <div className="space-y-2 bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                  <label className="block text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Price per 1,000 Followers ($ USD)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-lg">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.10"
                      value={rateFollowers1k}
                      onChange={(e) => setRateFollowers1k(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2.5 text-lg font-black text-white focus:outline-hidden focus:border-pink-500 shadow-inner"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    1K = ${(rateFollowers1k).toFixed(2)} | 10K = ${(rateFollowers1k * 10 * 0.95).toFixed(2)} | 100K = ${(rateFollowers1k * 100 * 0.90).toFixed(2)} | 1M = ${(rateFollowers1k * 1000 * 0.80).toFixed(2)}
                  </p>
                </div>

                {/* Rate Per 1,000 Likes */}
                <div className="space-y-2 bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5" />
                    <span>Price per 1,000 Likes ($ USD)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-lg">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.10"
                      value={rateLikes1k}
                      onChange={(e) => setRateLikes1k(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2.5 text-lg font-black text-white focus:outline-hidden focus:border-indigo-500 shadow-inner"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    1K = ${(rateLikes1k).toFixed(2)} | 10K = ${(rateLikes1k * 10 * 0.95).toFixed(2)} | 100K = ${(rateLikes1k * 100 * 0.90).toFixed(2)} | 1M = ${(rateLikes1k * 1000 * 0.80).toFixed(2)}
                  </p>
                </div>

                {/* Save Master Rates Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isSavingRates}
                    className={`w-full py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 ${
                      ratesSuccessMsg
                        ? "bg-emerald-600 text-white shadow-emerald-500/25"
                        : "bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 hover:opacity-95 text-white shadow-pink-500/25"
                    }`}
                  >
                    {isSavingRates ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Updating MySQL Database...</span>
                      </>
                    ) : ratesSuccessMsg ? (
                      <>
                        <Check className="w-5 h-5 text-white animate-bounce" />
                        <span>Rates &amp; Packages Updated!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save &amp; Update All Prices in UI</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Individual Follower Packages Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Instagram Followers Packages (MySQL Table)</h2>
                  <p className="text-xs text-slate-400">
                    You can also override individual package amounts or prices below.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {followerPackages.map((pkg) => {
                  const isSavingThis = isSaving === pkg.id;
                  const isSavedThis = saveMessage?.id === pkg.id;

                  return (
                    <div
                      key={pkg.id}
                      className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-5 rounded-3xl space-y-4 relative transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-slate-400">{pkg.id}</span>
                        {pkg.popular && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
                            {pkg.tag || "Popular"}
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                            Followers Amount
                          </label>
                          <input
                            type="number"
                            value={pkg.amount}
                            onChange={(e) =>
                              handlePriceChange(pkg.id, "amount", parseInt(e.target.value) || 0)
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-hidden focus:border-pink-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                            Package Label
                          </label>
                          <input
                            type="text"
                            value={pkg.label}
                            onChange={(e) => handlePriceChange(pkg.id, "label", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-hidden focus:border-pink-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                            Price ($ USD)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-500 font-bold">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={pkg.price}
                              onChange={(e) =>
                                handlePriceChange(pkg.id, "price", parseFloat(e.target.value) || 0)
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-base font-extrabold text-emerald-400 focus:outline-hidden focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSavePackage(pkg.id)}
                        disabled={isSavingThis}
                        className={`w-full py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSavedThis
                            ? "bg-emerald-600 text-white"
                            : "bg-gradient-to-r from-instagram-orange to-instagram-pink hover:opacity-90 text-white"
                        }`}
                      >
                        {isSavingThis ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : isSavedThis ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{saveMessage?.text}</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Item Price</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual Likes Packages Section */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Post &amp; Reel Likes Packages (MySQL Table)</h2>
                  <p className="text-xs text-slate-400">
                    Individual packages for media and reel boost orders.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {likePackages.map((pkg) => {
                  const isSavingThis = isSaving === pkg.id;
                  const isSavedThis = saveMessage?.id === pkg.id;

                  return (
                    <div
                      key={pkg.id}
                      className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-5 rounded-3xl space-y-4 relative transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-slate-400">{pkg.id}</span>
                        {pkg.popular && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            {pkg.tag || "Popular"}
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                            Likes Amount
                          </label>
                          <input
                            type="number"
                            value={pkg.amount}
                            onChange={(e) =>
                              handlePriceChange(pkg.id, "amount", parseInt(e.target.value) || 0)
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                            Package Label
                          </label>
                          <input
                            type="text"
                            value={pkg.label}
                            onChange={(e) => handlePriceChange(pkg.id, "label", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                            Price ($ USD)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-500 font-bold">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={pkg.price}
                              onChange={(e) =>
                                handlePriceChange(pkg.id, "price", parseFloat(e.target.value) || 0)
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-base font-extrabold text-emerald-400 focus:outline-hidden focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSavePackage(pkg.id)}
                        disabled={isSavingThis}
                        className={`w-full py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSavedThis
                            ? "bg-emerald-600 text-white"
                            : "bg-gradient-to-r from-indigo-600 to-pink-600 hover:opacity-90 text-white"
                        }`}
                      >
                        {isSavingThis ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : isSavedThis ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{saveMessage?.text}</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Item Price</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Login Users Database */}
        {activeTab === "users" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Login Users Database Table (MySQL)</h2>
                <p className="text-xs text-slate-400">
                  Records of all users authenticated via Google OAuth.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search user by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs font-semibold text-white focus:outline-hidden focus:border-pink-500"
                />
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Provider</th>
                      <th className="p-4">Total Boosts</th>
                      <th className="p-4">Last Login</th>
                      <th className="p-4">Registered On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No user records found in database.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 flex items-center gap-3">
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-700"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                                {(u.name || u.email).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-bold text-white">{u.name || "User"}</span>
                          </td>
                          <td className="p-4 text-slate-300 font-mono">{u.email}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold text-[11px] uppercase">
                              {u.provider}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-extrabold text-pink-400">
                              {u.total_orders_count || 0} orders
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">
                            {new Date(u.last_login).toLocaleString()}
                          </td>
                          <td className="p-4 text-slate-500">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Growth Booster Records */}
        {activeTab === "records" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Growth Booster Records Table (MySQL)</h2>
                <p className="text-xs text-slate-400">
                  Full historical records of users who increased followers or likes.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search orders, emails, or usernames..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs font-semibold text-white focus:outline-hidden focus:border-pink-500"
                />
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Order ID</th>
                      <th className="p-4">User Email</th>
                      <th className="p-4">Service</th>
                      <th className="p-4">Target Account</th>
                      <th className="p-4">Quantity</th>
                      <th className="p-4">Amount Paid</th>
                      <th className="p-4">Growth Metrics</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-500">
                          No growth boost records found in database.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-mono font-bold text-pink-400">#{o.id}</td>
                          <td className="p-4 text-slate-300 font-mono">{o.user_email}</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                                o.service_type === "followers"
                                  ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                                  : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                              }`}
                            >
                              {o.service_type}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-white">@{o.target_username}</td>
                          <td className="p-4 font-extrabold text-white">+{o.package_amount.toLocaleString()}</td>
                          <td className="p-4 font-extrabold text-emerald-400">
                            ${Number(o.price || 0).toFixed(2)}
                          </td>
                          <td className="p-4 text-slate-400">
                            <span>{o.initial_count}</span>
                            <span className="text-pink-500 mx-1">→</span>
                            <span className="font-bold text-white">{o.approx_after_count}</span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                o.status === "successful"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : o.status === "ordered"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                              }`}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">
                            {new Date(o.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
