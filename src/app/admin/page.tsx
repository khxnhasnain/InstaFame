"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  IndianRupee,
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
  Wallet,
  PlusCircle,
  Play,
  Eye,
} from "lucide-react";

interface Package {
  id: string;
  service_type: "followers" | "likes" | "views";
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
  wallet_balance?: number;
  last_login: string;
  created_at: string;
}

interface OrderRecord {
  id: string;
  user_email: string;
  service_type: "followers" | "likes" | "views";
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
  total_wallet_balance?: number;
  total_followers_boosted: number;
  total_likes_boosted: number;
  total_views_boosted?: number;
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

  // Editable package states
  const [editingPackages, setEditingPackages] = useState<{ [id: string]: Package }>({});

  // Admin Credit Wallet State
  const [walletModalUser, setWalletModalUser] = useState<UserRecord | null>(null);
  const [addAmount, setAddAmount] = useState<string>("500");
  const [isAddingFunds, setIsAddingFunds] = useState<boolean>(false);
  const [fundSuccessMsg, setFundSuccessMsg] = useState<string | null>(null);

  const handleCreditWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletModalUser || !addAmount) return;
    const num = parseFloat(addAmount);
    if (isNaN(num) || num <= 0) return;

    setIsAddingFunds(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: walletModalUser.email, amount: num }),
      });
      if (res.ok) {
        setFundSuccessMsg(`Successfully credited ₹${num.toFixed(2)} to ${walletModalUser.email}`);
        setTimeout(() => {
          setFundSuccessMsg(null);
          setWalletModalUser(null);
          fetchData(true);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingFunds(false);
    }
  };

  const isInputFocused = () => {
    if (typeof document === "undefined") return false;
    const active = document.activeElement;
    return active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
  };

  const fetchData = async (force: boolean = false) => {
    setIsLoading(true);
    try {
      const ts = Date.now();
      const [statsRes, pkgsRes, usersRes, ordersRes] = await Promise.all([
        fetch(`/api/admin/stats?t=${ts}`, { cache: "no-store" }),
        fetch(`/api/packages?t=${ts}`, { cache: "no-store" }),
        fetch(`/api/users?t=${ts}`, { cache: "no-store" }),
        fetch(`/api/orders?t=${ts}`, { cache: "no-store" }),
      ]);

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.data);
      }

      // Only update editable inputs if the user is not actively typing/focused, or if explicitly forced
      if (!isInputFocused() || force) {
        if (pkgsRes.ok) {
          const d = await pkgsRes.json();
          setPackages(d.data || []);
          const map: { [id: string]: Package } = {};
          (d.data || []).forEach((p: Package) => {
            map[p.id] = { ...p };
          });
          setEditingPackages(map);
        }
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
    fetchData(true);

    // Auto-sync when returning to the tab (if user is not actively typing)
    const handleFocus = () => {
      if (!isInputFocused()) {
        fetchData();
      }
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const [isSavingAllPackages, setIsSavingAllPackages] = useState(false);
  const [saveAllSuccessMsg, setSaveAllSuccessMsg] = useState(false);

  const handlePriceChange = (id: string, field: keyof Package, value: any) => {
    setEditingPackages((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSaveAllPackages = async () => {
    const allPackagesToSave = [
      ...followerPackages,
      ...likePackages,
      ...viewsPackages,
    ];
    if (!allPackagesToSave.length) return;

    setIsSavingAllPackages(true);
    setSaveAllSuccessMsg(false);

    try {
      await Promise.all(
        allPackagesToSave.map((pkg) =>
          fetch("/api/packages", {
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
          })
        )
      );

      setSaveAllSuccessMsg(true);
      setPackages((prev) => {
        const next = [...prev];
        allPackagesToSave.forEach((pkg) => {
          const idx = next.findIndex((p) => p.id === pkg.id);
          if (idx >= 0) next[idx] = { ...pkg };
          else next.push({ ...pkg });
        });
        return next;
      });

      setTimeout(() => setSaveAllSuccessMsg(false), 3500);
    } catch (err) {
      console.error("Failed to save all packages:", err);
    } finally {
      setIsSavingAllPackages(false);
    }
  };

  // Helper to ensure clean deduplicated packages by service type & amount (prioritizing pkg_ prefix)
  const getUniquePackages = (pkgs: Package[], service: "followers" | "likes" | "views") => {
    const list = pkgs.filter((p) => p.service_type === service);
    const map = new Map<number, Package>();
    list.forEach((p) => {
      if (!map.has(p.amount) || p.id.startsWith("pkg_")) {
        map.set(p.amount, p);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.amount - b.amount);
  };

  const followerPackages = getUniquePackages(Object.values(editingPackages), "followers");
  const likePackages = getUniquePackages(Object.values(editingPackages), "likes");
  const viewsPackages = getUniquePackages(Object.values(editingPackages), "views");

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
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-extrabold px-4 py-2.5 rounded-2xl transition-all border border-slate-700 hover:border-pink-500/40 hover:shadow-lg hover:shadow-pink-500/10 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-pink-400" />
              <span>Back to Dashboard</span>
            </Link>

            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{stats?.database_engine || "MySQL Engine: Active"}</span>
            </div>

            <button
              onClick={() => fetchData(true)}
              disabled={isLoading}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all border border-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Revenue</span>
              <IndianRupee className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">
              ₹{(stats?.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

          <div className="bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Likes Boosted</span>
              <Heart className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-black text-white">
              +{(stats?.total_likes_boosted || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-rose-400 font-medium">Total Likes Added</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Reel Views Boosted</span>
              <Play className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white">
              +{(stats?.total_views_boosted || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-purple-400 font-medium">Total Reel Views Added</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("pricing")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-extrabold text-sm transition-all cursor-pointer ${activeTab === "pricing"
              ? "bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 text-white shadow-lg shadow-pink-500/20"
              : "text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-900 border border-slate-800"
              }`}
          >
            <IndianRupee className="w-4 h-4" />
            <span>Manage Pricing &amp; Rates</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-extrabold text-sm transition-all cursor-pointer ${activeTab === "users"
              ? "bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 text-white shadow-lg shadow-pink-500/20"
              : "text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-900 border border-slate-800"
              }`}
          >
            <Users className="w-4 h-4" />
            <span>Login Users Database ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("records")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-extrabold text-sm transition-all cursor-pointer ${activeTab === "records"
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
            {/* Individual Follower Packages Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1">
                <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Instagram Followers Packages</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {followerPackages.map((pkg) => {
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
                            Package
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
                            Price (₹ INR)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-500 font-bold">₹</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={pkg.price}
                              onChange={(e) =>
                                handlePriceChange(pkg.id, "price", e.target.value)
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-base font-extrabold text-emerald-400 focus:outline-hidden focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual Likes Packages Section */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 pb-1">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Post &amp; Reel Likes Packages</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {likePackages.map((pkg) => {
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
                            Package
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
                            Price (₹ INR)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-500 font-bold">₹</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={pkg.price}
                              onChange={(e) =>
                                handlePriceChange(pkg.id, "price", e.target.value)
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-base font-extrabold text-emerald-400 focus:outline-hidden focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual Reel Views Packages Section */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 pb-1">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Play className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Instagram Reel Views Packages</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {viewsPackages.map((pkg) => {
                  return (
                    <div
                      key={pkg.id}
                      className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-5 rounded-3xl space-y-4 relative transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-slate-400">{pkg.id}</span>
                        {pkg.popular && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            {pkg.tag || "Popular"}
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                            Package
                          </label>
                          <input
                            type="text"
                            value={pkg.label}
                            onChange={(e) => handlePriceChange(pkg.id, "label", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-hidden focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                            Price (₹ INR)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-500 font-bold">₹</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={pkg.price}
                              onChange={(e) =>
                                handlePriceChange(pkg.id, "price", e.target.value)
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-base font-extrabold text-emerald-400 focus:outline-hidden focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Single Unified Save All Packages Button */}
            <div className="pt-6 pb-4 flex items-center justify-center border-t border-slate-800">
              <button
                type="button"
                onClick={handleSaveAllPackages}
                disabled={isSavingAllPackages}
                className={`w-full sm:w-auto min-w-[320px] py-4 px-8 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xl active:scale-98 ${
                  saveAllSuccessMsg
                    ? "bg-emerald-600 text-white shadow-emerald-500/25"
                    : "bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 hover:opacity-95 text-white shadow-pink-500/25 hover:shadow-pink-500/40"
                }`}
              >
                {isSavingAllPackages ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Saving All Packages to Database...</span>
                  </>
                ) : saveAllSuccessMsg ? (
                  <>
                    <Check className="w-5 h-5 text-white animate-bounce" />
                    <span>All Package Prices Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save All Packages</span>
                  </>
                )}
              </button>
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
                      <th className="p-4">Wallet Balance</th>
                      <th className="p-4">Total Boosts</th>
                      <th className="p-4">Provider</th>
                      <th className="p-4">Last Login</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
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
                            <div className="flex items-center gap-1.5 font-black text-emerald-400 font-mono text-sm bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-xl w-fit">
                              <Wallet className="w-3.5 h-3.5" />
                              <span>₹{Number(u.wallet_balance ?? 50.0).toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-extrabold text-pink-400">
                              {u.total_orders_count || 0} orders
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold text-[11px] uppercase">
                              {u.provider}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">
                            {new Date(u.last_login).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => {
                                setWalletModalUser(u);
                                setAddAmount("500");
                              }}
                              className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Credit Wallet</span>
                            </button>
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
                              className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${o.service_type === "followers"
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
                            ₹{Number(o.price || 0).toFixed(2)}
                          </td>
                          <td className="p-4 text-slate-400">
                            <span>{o.initial_count}</span>
                            <span className="text-pink-500 mx-1">→</span>
                            <span className="font-bold text-white">{o.approx_after_count}</span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${o.status === "successful"
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

        {/* Admin Credit Wallet Modal */}
        {walletModalUser && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Credit User Wallet</h3>
                    <p className="text-xs text-slate-400">{walletModalUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setWalletModalUser(null)}
                  className="text-slate-500 hover:text-white font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              {fundSuccessMsg ? (
                <div className="bg-emerald-950/60 border border-emerald-800 p-4 rounded-2xl text-emerald-400 text-xs font-extrabold text-center flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{fundSuccessMsg}</span>
                </div>
              ) : (
                <form onSubmit={handleCreditWallet} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Current Wallet Balance
                    </label>
                    <div className="text-xl font-black text-emerald-400 font-mono">
                      ₹{Number(walletModalUser.wallet_balance ?? 50.0).toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Amount to Add (₹ INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400 font-bold">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={addAmount}
                        onChange={(e) => setAddAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-base font-extrabold text-white focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {["100", "500", "1000", "5000"].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAddAmount(amt)}
                        className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl py-1.5 text-xs font-bold text-slate-300 cursor-pointer"
                      >
                        +₹{amt}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setWalletModalUser(null)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingFunds}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
                    >
                      {isAddingFunds ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Crediting...</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Confirm Top-up</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

