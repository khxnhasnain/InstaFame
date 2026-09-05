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
  History,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";

interface Package {
  id: number | string;
  package_key?: string;
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
  id: number | string;
  auth_uid?: string;
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
  pending_deposits_count?: number;
  pending_deposits_amount?: number;
  approved_deposits_count?: number;
  approved_deposits_amount?: number;
  database_engine: string;
}

const isUserAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "khanhasnain2310@gmail.com,admin@viralora.com,admin@instafame.com")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return envAdmins.includes(clean) || clean.startsWith("admin@");
};


import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  ArrowLeft,
  FileImage,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  Copy,
} from "lucide-react";

const checkIsAdmin = (email?: string | null, sessionUser?: any): boolean => {
  if (sessionUser?.isAdmin || sessionUser?.role === "admin") return true;
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "khanhasnain2310@gmail.com,admin@viralora.com,admin@instafame.com")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return envAdmins.includes(clean) || clean.startsWith("admin@");
};

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pricing" | "users" | "deposits" | "orders" | "transactions">("orders");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderFilter, setOrderFilter] = useState<"all" | "active" | "completed">("all");
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [togglingOrderId, setTogglingOrderId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txnFilter, setTxnFilter] = useState<"all" | "debit" | "credit">("all");
  const [txnSearch, setTxnSearch] = useState<string>("");
  const [deposits, setDeposits] = useState<any[]>([]);
  const [depositFilter, setDepositFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [depositSearch, setDepositSearch] = useState<string>("");
  const [approveModalDeposit, setApproveModalDeposit] = useState<any | null>(null);
  const [rejectModalDeposit, setRejectModalDeposit] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [checklistConfirmed, setChecklistConfirmed] = useState<{ [key: string]: boolean }>({});
  const [isProcessingDeposit, setIsProcessingDeposit] = useState<boolean>(false);
  const [depositActionMsg, setDepositActionMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [previewDeposit, setPreviewDeposit] = useState<any | null>(null);
  const [receiptZoom, setReceiptZoom] = useState<number>(1);
  const [receiptRotation, setReceiptRotation] = useState<number>(0);
  const [isReceiptLoading, setIsReceiptLoading] = useState<boolean>(true);
  const [receiptLoadError, setReceiptLoadError] = useState<boolean>(false);
  const [copiedReceiptUtr, setCopiedReceiptUtr] = useState<boolean>(false);
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
      const [statsRes, pkgsRes, usersRes, ordersRes, depsRes, txnsRes] = await Promise.all([
        fetch(`/api/admin/stats?t=${ts}`, { cache: "no-store" }),
        fetch(`/api/packages?t=${ts}`, { cache: "no-store" }),
        fetch(`/api/users?t=${ts}`, { cache: "no-store" }),
        fetch(`/api/orders?t=${ts}`, { cache: "no-store" }),
        fetch(`/api/admin/deposits?t=${ts}`, { cache: "no-store" }),
        fetch(`/api/wallet/transactions?t=${ts}`, { cache: "no-store" }),
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
      if (depsRes?.ok) {
        const d = await depsRes.json();
        setDeposits(d.data?.items || []);
      }
      if (txnsRes?.ok) {
        const d = await txnsRes.json();
        setTransactions(d.data || []);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveDeposit = async () => {
    if (!approveModalDeposit) return;
    setIsProcessingDeposit(true);
    setDepositActionMsg(null);
    try {
      const res = await fetch(`/api/admin/deposits/${approveModalDeposit.id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDepositActionMsg({
          text: `Deposit ${approveModalDeposit.id} approved! Credited ₹${Number(approveModalDeposit.amount).toFixed(2)} to user wallet.`,
        });
        setApproveModalDeposit(null);
        setChecklistConfirmed({});
        await fetchData(true);
      } else {
        setDepositActionMsg({
          text: data.error || "Failed to approve deposit.",
          isError: true,
        });
      }
    } catch (err: any) {
      setDepositActionMsg({ text: err?.message || "Error processing approval", isError: true });
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const handleRejectDeposit = async () => {
    if (!rejectModalDeposit) return;
    if (rejectionReason.trim().length < 3) {
      setDepositActionMsg({
        text: "Please provide a valid rejection reason between 3 and 500 characters.",
        isError: true,
      });
      return;
    }
    setIsProcessingDeposit(true);
    setDepositActionMsg(null);
    try {
      const res = await fetch(`/api/admin/deposits/${rejectModalDeposit.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_reason: rejectionReason.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDepositActionMsg({
          text: `Deposit ${rejectModalDeposit.id} rejected. User wallet remains unchanged.`,
        });
        setRejectModalDeposit(null);
        setRejectionReason("");
        await fetchData(true);
      } else {
        setDepositActionMsg({
          text: data.error || "Failed to reject deposit.",
          isError: true,
        });
      }
    } catch (err: any) {
      setDepositActionMsg({ text: err?.message || "Error processing rejection", isError: true });
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const handleToggleOrderStatus = async (orderId: string, currentStatus: string) => {
    setTogglingOrderId(orderId);
    const newStatus = (currentStatus === "completed" || currentStatus === "successful") ? "ordered" : "completed";
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (res.ok) {
        setDepositActionMsg({
          text: `Order ${orderId} marked as ${newStatus === "completed" ? "Completed ✓" : "Ordered"}.`,
        });
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        await fetchData(true);
      } else {
        setDepositActionMsg({ text: "Failed to update order status.", isError: true });
      }
    } catch (err: any) {
      setDepositActionMsg({ text: err?.message || "Network error", isError: true });
    } finally {
      setTogglingOrderId(null);
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

    // Auto-poll every 10s so orders & debits reflect in real time without refreshing
    const pollInterval = setInterval(() => {
      if (!isInputFocused()) {
        fetchData();
      }
    }, 10000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(pollInterval);
    };
  }, []);

  const [isSavingAllPackages, setIsSavingAllPackages] = useState(false);
  const [saveAllSuccessMsg, setSaveAllSuccessMsg] = useState(false);

  const handlePriceChange = (id: string | number, field: keyof Package, value: any) => {
    const key = String(id);
    setEditingPackages((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
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
      const idStr = String(p.package_key || p.id || "");
      if (!map.has(p.amount) || idStr.startsWith("pkg_")) {
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
                  Viralora Database & Pricing Manager
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
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
              <span>Pending Deposits</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-400">
              {(stats?.pending_deposits_count ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-amber-400/80 font-medium">
              ₹{(stats?.pending_deposits_amount ?? 0).toFixed(2)} Awaiting Verification
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Approved Deposits</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400">
              {(stats?.approved_deposits_count ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-400/80 font-medium">
              ₹{(stats?.approved_deposits_amount ?? 0).toFixed(2)} Total Credited
            </p>
          </div>
        </div>

        {/* Action Message Alert */}
        {depositActionMsg && (
          <div
            className={`p-4 rounded-2xl text-xs font-extrabold flex items-center justify-between gap-3 animate-in fade-in ${
              depositActionMsg.isError
                ? "bg-rose-950/70 border border-rose-800 text-rose-300"
                : "bg-emerald-950/70 border border-emerald-800 text-emerald-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {depositActionMsg.isError ? (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
              <span>{depositActionMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setDepositActionMsg(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-wrap">
          <button
            onClick={() => setActiveTab("pricing")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-extrabold text-sm transition-all cursor-pointer ${
              activeTab === "pricing"
                ? "bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 text-white shadow-lg shadow-pink-500/20"
                : "text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-900 border border-slate-800"
            }`}
          >
            <IndianRupee className="w-4 h-4" />
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
            onClick={() => setActiveTab("deposits")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-extrabold text-sm transition-all cursor-pointer ${
              activeTab === "deposits"
                ? "bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 text-white shadow-lg shadow-pink-500/20"
                : "text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-900 border border-slate-800"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>UPI Wallet Deposits ({deposits.length})</span>
            {Boolean(stats?.pending_deposits_count && stats.pending_deposits_count > 0) && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse">
                {stats?.pending_deposits_count} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-extrabold text-sm transition-all cursor-pointer ${
              activeTab === "orders"
                ? "bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 text-white shadow-lg shadow-pink-500/20"
                : "text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-900 border border-slate-800"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Boost Orders ({orders.length})</span>
            {orders.filter((o) => o.status !== "completed" && o.status !== "successful").length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                {orders.filter((o) => o.status !== "completed" && o.status !== "successful").length} Active
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-extrabold text-sm transition-all cursor-pointer ${
              activeTab === "transactions"
                ? "bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600 text-white shadow-lg shadow-pink-500/20"
                : "text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-900 border border-slate-800"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Wallet Ledger / Transactions ({transactions.length})</span>
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
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white">{u.name || "User"}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">#{u.id}</span>
                              </div>
                            </div>
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
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setWalletModalUser(u);
                                  setAddAmount("500");
                                }}
                                className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Credit</span>
                              </button>
                              <button
                                onClick={() => {
                                  setTxnSearch(u.email);
                                  setTxnFilter("all");
                                  setActiveTab("transactions");
                                }}
                                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
                                title="View wallet debits & credits ledger for this user"
                              >
                                <History className="w-3.5 h-3.5 text-pink-400" />
                                <span>Ledger</span>
                              </button>
                            </div>
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

        {/* Tab 3: Manual UPI Wallet Deposits Management */}
        {activeTab === "deposits" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-pink-400" />
                  <span>Manual UPI Wallet Deposits Table (MySQL)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Verify actual bank account statement before approving. Approvals transactionally credit user wallets.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search ID, UTR, email, or name..."
                  value={depositSearch}
                  onChange={(e) => setDepositSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs font-semibold text-white focus:outline-hidden focus:border-pink-500"
                />
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { key: "all", label: "All Deposits" },
                { key: "pending", label: "Pending Verification" },
                { key: "approved", label: "Approved" },
                { key: "rejected", label: "Rejected" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setDepositFilter(f.key as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    depositFilter === f.key
                      ? "bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-black shadow-md shadow-pink-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {f.label} ({deposits.filter((d) => f.key === "all" || d.status === f.key).length})
                </button>
              ))}
            </div>

            {/* Deposits Table */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Deposit ID</th>
                      <th className="p-4">User</th>
                      <th className="p-4">Requested Amount</th>
                      <th className="p-4">12-Digit UTR</th>
                      <th className="p-4">Receipt</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {deposits
                      .filter((d) => {
                        if (depositFilter !== "all" && d.status !== depositFilter) return false;
                        if (depositSearch.trim()) {
                          const q = depositSearch.toLowerCase().trim();
                          return (
                            String(d.id || "").toLowerCase().includes(q) ||
                            String(d.utr || "").toLowerCase().includes(q) ||
                            String(d.user_email || "").toLowerCase().includes(q) ||
                            String(d.user_name || "").toLowerCase().includes(q)
                          );
                        }
                        return true;
                      })
                      .map((dep) => (
                        <tr key={dep.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-300">
                            {dep.deposit_id ? (
                              <div className="flex flex-col">
                                <span className="text-white font-extrabold text-xs">#{dep.id}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{dep.deposit_id}</span>
                              </div>
                            ) : (
                              dep.id
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-white">{dep.user_name || "User"}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{dep.user_email}</div>
                          </td>
                          <td className="p-4 font-black text-sm text-emerald-400">
                            ₹{Number(dep.amount).toFixed(2)}
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-300">{dep.utr}</td>
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewDeposit(dep);
                                setReceiptZoom(1);
                                setReceiptRotation(0);
                                setIsReceiptLoading(true);
                                setReceiptLoadError(false);
                                setCopiedReceiptUtr(false);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-pink-400" />
                              <span>View Receipt</span>
                            </button>
                          </td>
                          <td className="p-4">
                            {dep.status === "pending" && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </span>
                            )}
                            {dep.status === "approved" && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approved</span>
                              </span>
                            )}
                            {dep.status === "rejected" && (
                              <div className="space-y-0.5">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                                  <X className="w-3 h-3" />
                                  <span>Rejected</span>
                                </span>
                                {dep.rejection_reason && (
                                  <p className="text-[10px] text-rose-400 font-medium max-w-xs truncate" title={dep.rejection_reason}>
                                    {dep.rejection_reason}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-slate-500 whitespace-nowrap">
                            {new Date(dep.created_at).toLocaleString("en-IN", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="p-4 text-right">
                            {dep.status === "pending" ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setApproveModalDeposit(dep);
                                    setChecklistConfirmed({});
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectModalDeposit(dep);
                                    setRejectionReason("");
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-600/40 text-rose-300 hover:text-white font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : dep.status === "approved" ? (
                              <span className="text-[11px] text-slate-500 font-semibold">
                                Credited by {dep.approved_by || "Admin"}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-semibold">
                                Rejected
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Boost Orders Manager & Fulfillment */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Filters and Search Bar */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setOrderFilter("all")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      orderFilter === "all"
                        ? "bg-white text-slate-950 shadow-md"
                        : "bg-slate-800/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    All ({orders.length})
                  </button>
                  <button
                    onClick={() => setOrderFilter("active")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      orderFilter === "active"
                        ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                        : "bg-slate-800/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    Ordered / Active ({orders.filter((o) => o.status !== "completed" && o.status !== "successful").length})
                  </button>
                  <button
                    onClick={() => setOrderFilter("completed")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      orderFilter === "completed"
                        ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                        : "bg-slate-800/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    Completed ({orders.filter((o) => o.status === "completed" || o.status === "successful").length})
                  </button>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by ID, email, handle..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
              </div>

              {/* Orders Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
                      <th className="py-3 px-4">Admin Action</th>
                      <th className="py-3 px-4">Order ID & Date</th>
                      <th className="py-3 px-4">Customer Email</th>
                      <th className="py-3 px-4">Target Account / Post</th>
                      <th className="py-3 px-4">Package & Amount</th>
                      <th className="py-3 px-4">User Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {orders
                      .filter((ord) => {
                        const isDone = ord.status === "completed" || ord.status === "successful";
                        if (orderFilter === "active" && isDone) return false;
                        if (orderFilter === "completed" && !isDone) return false;
                        if (orderSearch.trim()) {
                          const q = orderSearch.toLowerCase();
                          return (
                            ord.id.toLowerCase().includes(q) ||
                            (ord.user_email && ord.user_email.toLowerCase().includes(q)) ||
                            (ord.target_username && ord.target_username.toLowerCase().includes(q)) ||
                            (ord.package_label && ord.package_label.toLowerCase().includes(q))
                          );
                        }
                        return true;
                      })
                      .map((ord) => {
                        const isDone = ord.status === "completed" || ord.status === "successful";
                        const isToggling = togglingOrderId === ord.id;

                        return (
                          <tr
                            key={ord.id}
                            className={`hover:bg-slate-800/30 transition-colors ${
                              isDone ? "bg-slate-950/30" : "bg-amber-950/5"
                            }`}
                          >
                            {/* Tick Button Action */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <button
                                type="button"
                                disabled={isToggling}
                                onClick={() => handleToggleOrderStatus(ord.id, ord.status)}
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer disabled:opacity-50 ${
                                  isDone
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                                    : "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110 shadow-md shadow-orange-500/20"
                                }`}
                                title={isDone ? "Click to revert to Ordered" : "Click to mark as Completed"}
                              >
                                {isToggling ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded border-2 border-slate-950 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-slate-950 opacity-0 group-hover:opacity-100" />
                                  </div>
                                )}
                                <span>{isDone ? "Completed ✓" : "Tick Completed"}</span>
                              </button>
                            </td>

                            {/* Order ID & Date */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-mono font-bold text-white text-xs">{ord.id}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {ord.created_at ? new Date(ord.created_at).toLocaleString() : "Recent"}
                              </div>
                            </td>

                            {/* Customer Email */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-mono text-slate-300 text-xs">{ord.user_email || "customer"}</span>
                            </td>

                            {/* Target Account */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 font-bold text-white">
                                <span>@{ord.target_username || "unknown"}</span>
                                {ord.target_post_url && (
                                  <a
                                    href={ord.target_post_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-pink-400 hover:underline text-[10px]"
                                  >
                                    [Post ↗]
                                  </a>
                                )}
                              </div>
                            </td>

                            {/* Package & Price */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-bold text-white">
                                {ord.package_label || `${ord.package_amount} ${ord.service_type}`}
                              </div>
                              <div className="text-[11px] text-emerald-400 font-extrabold">
                                ₹{Number(ord.price || 0).toFixed(2)}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {isDone ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Completed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-[11px] border border-amber-500/30">
                                  <Clock className="w-3 h-3" />
                                  Ordered
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Wallet Ledger & Transactions (Credits & Debits) */}
        {activeTab === "transactions" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Transactions</p>
                  <h3 className="text-2xl font-black text-white mt-1">{transactions.length}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Recorded in database</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <History className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-400">Total Spent on Boosts (Debits)</p>
                  <h3 className="text-2xl font-black text-rose-400 mt-1">
                    ₹{transactions
                      .filter((t) => t.type === "debit")
                      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
                      .toFixed(2)}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {transactions.filter((t) => t.type === "debit").length} order deductions
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <ArrowDownRight className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Total Top-Ups (Credits)</p>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">
                    ₹{transactions
                      .filter((t) => t.type === "credit" && t.status !== "rejected")
                      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
                      .toFixed(2)}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {transactions.filter((t) => t.type === "credit").length} credited transactions
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Filters and Search Bar */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setTxnFilter("all")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      txnFilter === "all"
                        ? "bg-white text-slate-950 shadow-md"
                        : "bg-slate-800/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    All ({transactions.length})
                  </button>
                  <button
                    onClick={() => setTxnFilter("debit")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      txnFilter === "debit"
                        ? "bg-rose-500 text-white font-black shadow-md shadow-rose-500/20"
                        : "bg-slate-800/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    Debits / Boosts ({transactions.filter((t) => t.type === "debit").length})
                  </button>
                  <button
                    onClick={() => setTxnFilter("credit")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      txnFilter === "credit"
                        ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                        : "bg-slate-800/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    Credits / Top-Ups ({transactions.filter((t) => t.type === "credit").length})
                  </button>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by email, order ID, description..."
                    value={txnSearch}
                    onChange={(e) => setTxnSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                  {txnSearch && (
                    <button
                      onClick={() => setTxnSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
                      <th className="py-3 px-4">Transaction ID & Date</th>
                      <th className="py-3 px-4">User Email</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Balance After</th>
                      <th className="py-3 px-4">Description & Reference</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {transactions
                      .filter((txn) => {
                        if (txnFilter !== "all" && txn.type !== txnFilter) return false;
                        if (txnSearch.trim()) {
                          const q = txnSearch.toLowerCase();
                          return (
                            (txn.id && String(txn.id).toLowerCase().includes(q)) ||
                            (txn.user_email && String(txn.user_email).toLowerCase().includes(q)) ||
                            (txn.description && String(txn.description).toLowerCase().includes(q)) ||
                            (txn.reference_id && String(txn.reference_id).toLowerCase().includes(q))
                          );
                        }
                        return true;
                      })
                      .map((txn) => {
                        const isDebit = txn.type === "debit";
                        return (
                          <tr key={txn.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-mono font-extrabold text-white text-xs">#{txn.id}</span>
                                {txn.transaction_id && (
                                  <span className="text-[10px] text-slate-400 font-mono">{txn.transaction_id}</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {txn.created_at ? new Date(txn.created_at).toLocaleString() : "Recent"}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-mono text-slate-300 text-xs">{txn.user_email}</span>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {isDebit ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 font-extrabold text-[11px] border border-rose-500/30">
                                  <ArrowDownRight className="w-3 h-3" />
                                  DEBIT
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[11px] border border-emerald-500/30">
                                  <ArrowUpRight className="w-3 h-3" />
                                  CREDIT
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`font-black text-sm ${
                                  isDebit ? "text-rose-400" : "text-emerald-400"
                                }`}
                              >
                                {isDebit ? "-" : "+"}₹{Number(txn.amount || 0).toFixed(2)}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-mono font-bold text-slate-200 text-xs">
                                ₹{Number(txn.balance_after || 0).toFixed(2)}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="text-white font-semibold text-xs max-w-sm truncate">
                                {txn.description}
                              </div>
                              {txn.reference_id && (
                                <span className="inline-block font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-sm mt-0.5">
                                  Ref: #{txn.reference_id}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                                  txn.status === "successful" || txn.status === "completed"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : txn.status === "rejected"
                                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                    : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                }`}
                              >
                                {txn.status || "completed"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Verification & Approval Modal */}
        {approveModalDeposit && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Approve UPI Deposit</h3>
                    <p className="text-xs text-slate-400">{approveModalDeposit.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setApproveModalDeposit(null)}
                  className="text-slate-500 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Deposit Overview */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">User Email:</span>
                  <span className="font-bold text-white font-mono">{approveModalDeposit.user_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Requested Amount:</span>
                  <span className="font-black text-emerald-400 text-sm">
                    ₹{Number(approveModalDeposit.amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">12-Digit UTR:</span>
                  <span className="font-mono font-bold text-pink-400">{approveModalDeposit.utr}</span>
                </div>
              </div>

              {/* Mandatory Checklist Before Approval */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Mandatory Verification Checklist
                </span>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={Boolean(checklistConfirmed["bank_checked"])}
                    onChange={(e) =>
                      setChecklistConfirmed((prev) => ({ ...prev, bank_checked: e.target.checked }))
                    }
                    className="mt-0.5 rounded text-pink-600 focus:ring-0"
                  />
                  <span>
                    I have checked our actual bank / Axis UPI statement and verified that funds have genuinely settled.
                  </span>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={Boolean(checklistConfirmed["amount_matches"])}
                    onChange={(e) =>
                      setChecklistConfirmed((prev) => ({ ...prev, amount_matches: e.target.checked }))
                    }
                    className="mt-0.5 rounded text-pink-600 focus:ring-0"
                  />
                  <span>
                    The received settlement amount is exactly{" "}
                    <strong className="text-emerald-400">₹{Number(approveModalDeposit.amount).toFixed(2)}</strong>.
                  </span>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={Boolean(checklistConfirmed["utr_matches"])}
                    onChange={(e) =>
                      setChecklistConfirmed((prev) => ({ ...prev, utr_matches: e.target.checked }))
                    }
                    className="mt-0.5 rounded text-pink-600 focus:ring-0"
                  />
                  <span>
                    The settlement transaction reference matches UTR{" "}
                    <strong className="text-pink-400 font-mono">{approveModalDeposit.utr}</strong>.
                  </span>
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setApproveModalDeposit(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApproveDeposit}
                  disabled={
                    isProcessingDeposit ||
                    !checklistConfirmed["bank_checked"] ||
                    !checklistConfirmed["amount_matches"] ||
                    !checklistConfirmed["utr_matches"]
                  }
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingDeposit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Locking &amp; Crediting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve &amp; Credit ₹{Number(approveModalDeposit.amount).toFixed(2)}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Rejection Modal */}
        {rejectModalDeposit && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <X className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Reject Deposit Request</h3>
                    <p className="text-xs text-slate-400">{rejectModalDeposit.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRejectModalDeposit(null)}
                  className="text-slate-500 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <p className="text-slate-400">
                  User: <span className="font-bold text-white">{rejectModalDeposit.user_email}</span>
                </p>
                <p className="text-slate-400">
                  Amount: <span className="font-bold text-white">₹{Number(rejectModalDeposit.amount).toFixed(2)}</span>
                </p>
                <p className="text-slate-400">
                  UTR: <span className="font-bold font-mono text-pink-400">{rejectModalDeposit.utr}</span>
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Rejection Reason (Required, 3-500 characters)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., UTR was not found in bank statement, or amount received was incorrect."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setRejectModalDeposit(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectDeposit}
                  disabled={isProcessingDeposit || rejectionReason.trim().length < 3}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingDeposit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>Confirm Rejection</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* High-Resolution Payment Receipt Viewer Modal */}
        {previewDeposit && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full flex flex-col max-h-[92vh] shadow-2xl overflow-hidden animate-in zoom-in-95">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                    <FileImage className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                      <span>Payment Receipt Verification</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        #{previewDeposit.deposit_id || previewDeposit.id}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{previewDeposit.user_email}</p>
                  </div>
                </div>

                {/* Top Action Toolbar */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 p-1 text-slate-300">
                    <button
                      type="button"
                      title="Zoom Out"
                      onClick={() => setReceiptZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                      className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Reset Zoom"
                      onClick={() => setReceiptZoom(1)}
                      className="px-2 py-1 text-xs font-mono font-bold hover:bg-slate-800 hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      {Math.round(receiptZoom * 100)}%
                    </button>
                    <button
                      type="button"
                      title="Zoom In"
                      onClick={() => setReceiptZoom((z) => Math.min(3.5, Number((z + 0.25).toFixed(2))))}
                      className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    title="Rotate 90°"
                    onClick={() => setReceiptRotation((r) => (r + 90) % 360)}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  <a
                    href={`/api/wallet/deposits/${previewDeposit.deposit_id || previewDeposit.id}/screenshot`}
                    target="_blank"
                    rel="noreferrer"
                    title="Open Full Image in New Tab"
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold"
                  >
                    <ExternalLink className="w-4 h-4 text-pink-400" />
                    <span className="hidden sm:inline">Open Full Tab</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setPreviewDeposit(null)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body: 2 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 overflow-hidden flex-1">
                {/* Left Area: High-Res Interactive Image Viewer */}
                <div className="lg:col-span-8 flex flex-col bg-slate-950 rounded-2xl border border-slate-800/90 relative overflow-hidden min-h-[380px] lg:min-h-[520px] max-h-[65vh]">
                  <div className="w-full h-full overflow-auto p-4 flex items-center justify-center relative">
                    {isReceiptLoading && (
                      <div className="absolute inset-0 z-10 bg-slate-950/80 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                        <RefreshCw className="w-7 h-7 text-pink-500 animate-spin" />
                        <span className="font-bold">Loading payment screenshot receipt...</span>
                      </div>
                    )}

                    {receiptLoadError ? (
                      <div className="p-6 text-center space-y-3 max-w-sm">
                        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-300">
                          Unable to render screenshot preview in browser.
                        </p>
                        <p className="text-[11px] text-slate-500">
                          The file may be in an alternate format or require direct access.
                        </p>
                        <a
                          href={`/api/wallet/deposits/${previewDeposit.deposit_id || previewDeposit.id}/screenshot`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-lg shadow-pink-600/20 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Image Directly</span>
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full h-full min-h-[360px]">
                        <img
                          src={`/api/wallet/deposits/${previewDeposit.deposit_id || previewDeposit.id}/screenshot`}
                          alt={`Payment Receipt for ${previewDeposit.deposit_id || previewDeposit.id}`}
                          onLoad={() => {
                            setIsReceiptLoading(false);
                            setReceiptLoadError(false);
                          }}
                          onError={() => {
                            setIsReceiptLoading(false);
                            setReceiptLoadError(true);
                          }}
                          style={{
                            transform: `scale(${receiptZoom}) rotate(${receiptRotation}deg)`,
                            transformOrigin: "center center",
                            transition: "transform 0.15s ease-out",
                          }}
                          className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-2xl"
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 bg-slate-900/80 border-t border-slate-800 text-center text-[11px] text-slate-400">
                    Use toolbar buttons above to zoom in or rotate. Scroll inside to inspect small UTR and transaction text.
                  </div>
                </div>

                {/* Right Area: Cross-Verification Metadata & Quick Actions */}
                <div className="lg:col-span-4 flex flex-col justify-between space-y-4 p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-2">
                      Verification Cross-Check
                    </span>

                    {/* Amount */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Requested Amount</span>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                        ₹{Number(previewDeposit.amount).toFixed(2)}
                      </div>
                    </div>

                    {/* 12-Digit UTR with 1-click Copy */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
                        <span>Submitted 12-Digit UTR</span>
                        <span className="text-pink-400">Bank Ref</span>
                      </span>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="font-mono font-black text-pink-400 text-sm tracking-wider">
                          {previewDeposit.utr}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(previewDeposit.utr);
                            setCopiedReceiptUtr(true);
                            setTimeout(() => setCopiedReceiptUtr(false), 2000);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          {copiedReceiptUtr ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Copy this UTR to search your Axis / bank settlement report.
                      </p>
                    </div>

                    {/* Customer */}
                    <div className="space-y-1 text-xs border-t border-slate-800 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">User:</span>
                        <span className="font-bold text-white">{previewDeposit.user_name || "User"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Email:</span>
                        <span className="font-mono text-slate-300 truncate max-w-[180px]">{previewDeposit.user_email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span
                          className={`font-black text-[10px] uppercase px-2 py-0.5 rounded-full ${
                            previewDeposit.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : previewDeposit.status === "rejected"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {previewDeposit.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                        <span>Submitted At:</span>
                        <span>{new Date(previewDeposit.created_at).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions inside modal if Pending */}
                  {previewDeposit.status === "pending" && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          const target = previewDeposit;
                          setPreviewDeposit(null);
                          setApproveModalDeposit(target);
                          setChecklistConfirmed({});
                        }}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Proceed to Approve (₹{Number(previewDeposit.amount).toFixed(2)})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const target = previewDeposit;
                          setPreviewDeposit(null);
                          setRejectModalDeposit(target);
                          setRejectionReason("");
                        }}
                        className="w-full py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-600/40 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject Deposit</span>
                      </button>
                    </div>
                  )}
                </div>
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

