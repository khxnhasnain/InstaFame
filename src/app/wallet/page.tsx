"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  PlusCircle,
  ArrowLeft,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Database,
  Filter,
} from "lucide-react";
import Navbar from "@/components/common/Navbar";

interface TransactionRecord {
  id: string;
  user_email: string;
  type: "credit" | "debit" | string;
  amount: number;
  balance_after?: number;
  service_type: string;
  description: string;
  reference_id?: string;
  status: string;
  created_at: string;
}

interface OrderRecord {
  id: string;
  user_email: string;
  service_type: string;
  target_username: string;
  target_post_url?: string;
  package_amount: number;
  package_label: string;
  price: number;
  status: string;
  created_at: string;
}

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Authentication Route Guard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const [walletBalance, setWalletBalance] = useState<number>(50.0);
  const [addAmount, setAddAmount] = useState<string>("500");
  const [isSubmittingFunds, setIsSubmittingFunds] = useState<boolean>(false);
  const [fundSuccessMsg, setFundSuccessMsg] = useState<string | null>(null);
  const [fundErrorMsg, setFundErrorMsg] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [filterType, setFilterType] = useState<"all" | "credit" | "debit">("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const userEmail = session?.user?.email;

  const fetchWalletData = async () => {
    if (!userEmail) return;
    setIsLoading(true);
    try {
      const ts = Date.now();
      const [walletRes, ordersRes, txnsRes] = await Promise.all([
        fetch(`/api/wallet?user_email=${encodeURIComponent(userEmail)}&t=${ts}`, { cache: "no-store" }),
        fetch(`/api/orders?user_email=${encodeURIComponent(userEmail)}&t=${ts}`, { cache: "no-store" }),
        fetch(`/api/wallet/transactions?user_email=${encodeURIComponent(userEmail)}&t=${ts}`, { cache: "no-store" }),
      ]);

      if (walletRes.ok) {
        const wData = await walletRes.json();
        if (wData && typeof wData.wallet_balance === "number") {
          setWalletBalance(wData.wallet_balance);
        }
      }

      let fetchedOrders: OrderRecord[] = [];
      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        if (oData && Array.isArray(oData.data)) {
          fetchedOrders = oData.data;
          setOrders(fetchedOrders);
        }
      }

      if (txnsRes.ok) {
        const tData = await txnsRes.json();
        if (tData && Array.isArray(tData.data) && tData.data.length > 0) {
          setTransactions(tData.data);
        } else if (fetchedOrders.length > 0) {
          // Fallback synthesize from orders if transactions table was just initialized
          const synthesized: TransactionRecord[] = fetchedOrders.map((o) => ({
            id: `TXN-${o.id}`,
            user_email: o.user_email,
            type: "debit",
            amount: o.price,
            service_type: o.service_type,
            description: `${o.service_type.toUpperCase()} Boost (${o.package_label}) for @${o.target_username}`,
            reference_id: o.id,
            status: o.status || "successful",
            created_at: o.created_at,
          }));
          setTransactions(synthesized);
        } else {
          setTransactions([]);
        }
      }
    } catch (err) {
      console.error("Failed to load wallet data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "loading") {
      fetchWalletData();
    }

    const handleWalletUpdated = (e: any) => {
      if (typeof e.detail?.balance === "number") {
        setWalletBalance(e.detail.balance);
      }
      fetchWalletData();
    };

    window.addEventListener("wallet_updated", handleWalletUpdated);
    return () => window.removeEventListener("wallet_updated", handleWalletUpdated);
  }, [userEmail, status]);

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    setFundErrorMsg(null);
    setFundSuccessMsg(null);

    if (!userEmail) {
      setFundErrorMsg("Please sign in to add funds to your wallet.");
      return;
    }

    const num = parseFloat(addAmount);
    if (isNaN(num) || num <= 0) {
      setFundErrorMsg("Please enter a valid amount greater than 0.");
      return;
    }

    setIsSubmittingFunds(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userEmail,
          amount: num,
          description: `Wallet Top-Up (+₹${num.toFixed(2)}) via Automated Recharge`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newBal = data?.data?.wallet_balance ?? (walletBalance + num);
        setWalletBalance(newBal);
        setFundSuccessMsg(`Successfully credited ₹${num.toFixed(2)} to your wallet balance!`);

        // Refresh transactions list
        await fetchWalletData();

        // Dispatch event for other components
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("wallet_updated", { detail: { balance: newBal } }));
        }

        setTimeout(() => {
          setFundSuccessMsg(null);
        }, 4000);
      } else {
        setFundErrorMsg("Failed to add funds. Please try again.");
      }
    } catch (err: any) {
      setFundErrorMsg(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmittingFunds(false);
    }
  };

  // Calculate total spent on orders & total deposited
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.price || 0), 0);
  const totalDeposited = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Filter transactions based on active tab
  const filteredTransactions = transactions.filter((t) => {
    if (filterType === "credit") return t.type === "credit";
    if (filterType === "debit") return t.type === "debit";
    return true;
  });

  const creditCount = transactions.filter((t) => t.type === "credit").length;
  const debitCount = transactions.filter((t) => t.type === "debit").length;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Header Title & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                InstaFame Digital Wallet
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Manage your balance, add funds, and view database transaction records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              <span>Back to Dashboard</span>
            </Link>

            <button
              onClick={fetchWalletData}
              disabled={isLoading}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl border border-slate-800 text-xs font-bold transition-all cursor-pointer"
              title="Refresh Balance & Database Records"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Top Balance Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/40 flex flex-col justify-between space-y-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Available Balance</span>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>DB Synchronized Wallet</span>
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Total Funds</span>
            <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight flex items-baseline gap-1">
              <span className="text-emerald-400 text-3xl sm:text-4xl font-bold">₹</span>
              <span>{walletBalance.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <div>
              <span className="block text-[11px] text-slate-500">Account Email</span>
              <span className="font-bold text-slate-300 font-mono">{userEmail || "Guest User"}</span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500">Total Spent on Boosts</span>
              <span className="font-bold text-rose-400 font-mono">₹{totalSpent.toFixed(2)}</span>
            </div>
            {totalDeposited > 0 && (
              <div>
                <span className="block text-[11px] text-slate-500">Total Recharged</span>
                <span className="font-bold text-emerald-400 font-mono">+₹{totalDeposited.toFixed(2)}</span>
              </div>
            )}
            <div>
              <span className="block text-[11px] text-slate-500">DB Transactions</span>
              <span className="font-bold text-white font-mono">{transactions.length} records</span>
            </div>
          </div>
        </div>

        {/* Section 2: Add Funds / Recharge Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>Add Funds / Recharge Wallet</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Top up money directly into your account — automatically logged to Database
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">Instant Automated Crediting</span>
          </div>

          {fundSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-extrabold text-sm flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{fundSuccessMsg}</span>
            </div>
          )}

          {fundErrorMsg && (
            <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 font-extrabold text-sm flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{fundErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAddFunds} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Enter Amount to Add (₹ INR)
              </label>
              <div className="relative max-w-md">
                <span className="absolute left-4 top-3 text-slate-400 font-black text-xl">₹</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="500"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-xl font-black text-white focus:outline-hidden focus:border-emerald-500 transition-colors shadow-inner"
                />
              </div>
            </div>

            {/* Quick Amount Select Buttons */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 block">Quick Top-Up Amounts</span>
              <div className="flex flex-wrap gap-2.5">
                {["100", "250", "500", "1000", "2500", "5000"].map((amt) => {
                  const isSelected = addAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAddAmount(amt)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black scale-105"
                          : "bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white"
                      }`}
                    >
                      +₹{amt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingFunds}
                className="max-w-md w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmittingFunds ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Saving to Database &amp; Crediting...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    <span>Add ₹{Number(addAmount || 0).toFixed(2)} to Wallet Balance</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Section 3: Transaction & Order History */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <span>Wallet Transactions &amp; Orders History</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete database log of funds credited and boost order debits
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterType === "all"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("credit")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  filterType === "credit"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                <span>Top-Ups ({creditCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType("debit")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  filterType === "debit"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ArrowUpRight className="w-3 h-3 text-rose-400" />
                <span>Boost Orders ({debitCount})</span>
              </button>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-slate-950/60 rounded-2xl border border-slate-800/60">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto text-slate-600">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-400">
                {filterType === "all"
                  ? "No transactions or boost orders recorded in database yet."
                  : filterType === "credit"
                  ? "No wallet top-up transactions found."
                  : "No boost order debit transactions found."}
              </p>
              <p className="text-xs text-slate-500">
                Top up funds above or launch an Instagram Boost to see records appear in real-time.
              </p>
              <Link
                href="/instagram"
                className="inline-flex items-center gap-2 mt-2 bg-gradient-to-r from-instagram-orange to-instagram-pink text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md"
              >
                <span>Launch First Boost</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Record / Ref ID</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Balance After</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Date &amp; Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredTransactions.map((t) => {
                    const isCredit = t.type === "credit";
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-indigo-400">
                          #{t.id}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase ${
                              isCredit
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {isCredit ? (
                              <>
                                <ArrowDownLeft className="w-3 h-3" />
                                <span>Credit (+ Top-Up)</span>
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="w-3 h-3" />
                                <span>Debit (- Order)</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-white max-w-xs truncate">
                          {t.description || (isCredit ? "Wallet Top-Up" : `${t.service_type} Boost`)}
                        </td>
                        <td className="p-3.5 font-black font-mono">
                          <span className={isCredit ? "text-emerald-400" : "text-rose-400"}>
                            {isCredit ? "+" : "-"}₹{Number(t.amount || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">
                          {typeof t.balance_after === "number" ? `₹${t.balance_after.toFixed(2)}` : "—"}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === "successful" || t.status === "completed"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : t.status === "ordered"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                            }`}
                          >
                            {t.status || "successful"}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono whitespace-nowrap">
                          {new Date(t.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
