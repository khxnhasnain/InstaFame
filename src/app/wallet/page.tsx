"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  PlusCircle,
  ArrowLeft,
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
  QrCode,
  Check,
  Upload,
  Eye,
  X,
  FileImage,
  Info,
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

interface DepositRecord {
  id: string;
  user_id: string;
  amount: number;
  utr: string;
  payment_screenshot: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
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
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [filterType, setFilterType] = useState<"all" | "credit" | "debit">("all");
  const [historyTab, setHistoryTab] = useState<"transactions" | "deposits">("transactions");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // UPI Deposit States
  const [depositAmount, setDepositAmount] = useState<string>("500");
  const [utr, setUtr] = useState<string>("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState<boolean>(false);
  const [depositSuccessMsg, setDepositSuccessMsg] = useState<string | null>(null);
  const [depositErrorMsg, setDepositErrorMsg] = useState<string | null>(null);
  const [isCheckingUtr, setIsCheckingUtr] = useState<boolean>(false);
  const [utrExistsError, setUtrExistsError] = useState<string | null>(null);

  // Dynamic QR States
  const [dynamicQrUrl, setDynamicQrUrl] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState<boolean>(false);
  const [previewScreenshotId, setPreviewScreenshotId] = useState<string | null>(null);

  const userEmail = session?.user?.email;

  // Load dynamic QR code whenever deposit amount changes
  useEffect(() => {
    const num = parseFloat(depositAmount);
    if (isNaN(num) || num < 100 || num > 50000) {
      setDynamicQrUrl(null);
      return;
    }

    let active = true;
    setIsLoadingQr(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/wallet/upi-qr?amount=${encodeURIComponent(num)}`);
        if (res.ok && active) {
          const data = await res.json();
          setDynamicQrUrl(data.qr_data_url || null);
        }
      } catch (err) {
        console.error("Failed to load dynamic QR:", err);
      } finally {
        if (active) setIsLoadingQr(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [depositAmount]);

  const fetchWalletData = async () => {
    if (!userEmail) return;
    setIsLoading(true);
    try {
      const ts = Date.now();
      const [walletRes, ordersRes, txnsRes, depositsRes] = await Promise.all([
        fetch(`/api/wallet?user_email=${encodeURIComponent(userEmail)}&t=${ts}`, { cache: "no-store" }),
        fetch(`/api/orders?user_email=${encodeURIComponent(userEmail)}&t=${ts}`, { cache: "no-store" }),
        fetch(`/api/wallet/transactions?user_email=${encodeURIComponent(userEmail)}&t=${ts}`, { cache: "no-store" }),
        fetch(`/api/wallet/deposits?t=${ts}`, { cache: "no-store" }),
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

      if (depositsRes.ok) {
        const dData = await depositsRes.json();
        if (dData && dData.data && Array.isArray(dData.data.items)) {
          setDeposits(dData.data.items);
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

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setDepositErrorMsg("Screenshot file size must be less than 5 MB.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setDepositErrorMsg("Screenshot must be an image (JPG, PNG, or WEBP).");
      return;
    }

    setDepositErrorMsg(null);
    setScreenshotFile(file);
    const url = URL.createObjectURL(file);
    setScreenshotPreview(url);
  };

  const handleUtrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strictly numeric digits only, max 12
    const clean = e.target.value.replace(/[^0-9]/g, "").slice(0, 12);
    setUtr(clean);
    if (clean.length !== 12) {
      setUtrExistsError(null);
    }
  };

  // Real-time UTR duplicate check strictly against wallet_deposits in database
  useEffect(() => {
    const cleanUtr = utr.trim();
    if (cleanUtr.length !== 12 || !/^[0-9]{12}$/.test(cleanUtr)) {
      setUtrExistsError(null);
      setIsCheckingUtr(false);
      return;
    }

    let isMounted = true;
    setIsCheckingUtr(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/wallet/deposits/check-utr?utr=${encodeURIComponent(cleanUtr)}`);
        const data = await res.json();
        if (isMounted) {
          if (data && data.exists) {
            setUtrExistsError(
              `This UTR / Transaction ID (${cleanUtr}) has already been submitted in wallet deposits. Duplicate submissions are strictly rejected and cannot be accepted for verification.`
            );
          } else {
            setUtrExistsError(null);
          }
        }
      } catch {
        // Fallback gracefully on network hiccup
      } finally {
        if (isMounted) {
          setIsCheckingUtr(false);
        }
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [utr]);

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositErrorMsg(null);
    setDepositSuccessMsg(null);

    if (!session || !userEmail) {
      setDepositErrorMsg("Please sign in to submit a wallet deposit.");
      return;
    }

    const num = parseFloat(depositAmount);
    if (isNaN(num) || num < 100 || num > 50000) {
      setDepositErrorMsg("Deposit amount must be between ₹100.00 and ₹50,000.00.");
      return;
    }

    if (!/^[0-9]{12}$/.test(utr.trim())) {
      setDepositErrorMsg("UTR / Transaction ID must be exactly 12 numeric digits.");
      return;
    }

    if (utrExistsError) {
      setDepositErrorMsg(utrExistsError);
      return;
    }

    if (!screenshotFile) {
      setDepositErrorMsg("Please upload your payment screenshot.");
      return;
    }

    setIsSubmittingDeposit(true);
    try {
      const formData = new FormData();
      formData.append("amount", num.toString());
      formData.append("utr", utr.trim());
      formData.append("screenshot", screenshotFile);

      const res = await fetch("/api/wallet/deposits", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDepositSuccessMsg(
          `Deposit request submitted! Status: Pending Admin Verification. Your wallet will be credited with ₹${num.toFixed(
            2
          )} once verified.`
        );
        setUtr("");
        setScreenshotFile(null);
        setScreenshotPreview(null);
        setUtrExistsError(null);
        setHistoryTab("deposits");
        await fetchWalletData();
      } else {
        // If rejected due to duplicate UTR or other reason
        setDepositErrorMsg(
          data.error || "Deposit rejected. This UTR already exists in the database or could not be processed."
        );
        if (data.error && data.error.toLowerCase().includes("already been submitted")) {
          setUtrExistsError(data.error);
        }
      }
    } catch (err: any) {
      setDepositErrorMsg(err?.message || "An unexpected error occurred while submitting deposit.");
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const successfulCreditsCount = transactions.filter(
    (t) => t.type === "credit" && t.status === "successful"
  ).length;

  const debitsCount = transactions.filter((t) => t.type === "debit").length;

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === "all") return true;
    if (filterType === "credit") {
      return t.type.toLowerCase() === "credit" && t.status === "successful";
    }
    if (filterType === "debit") {
      return t.type.toLowerCase() === "debit";
    }
    return true;
  });

  const totalSpent = transactions
    .filter((t) => t.type === "debit" && t.status !== "rejected")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-pink-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Top Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5 tracking-tight">
              <span>My Wallet &amp; Balance</span>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                UPI Deposit
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Manage your wallet credits, scan amount-specific UPI QR, and track verified deposit history
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <button
              onClick={fetchWalletData}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-pink-400" : ""}`} />
              <span>Refresh Balance</span>
            </button>
          </div>
        </div>

        {/* Section 1: Balance Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Main Wallet Balance Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Available Balance</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                INR Live
              </span>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight flex items-baseline gap-1">
                <span className="text-emerald-400 font-normal">₹</span>
                <span>{walletBalance.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Secure Verification</span>
              </p>
            </div>
          </div>

          {/* Total Spent on Boosts */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-pink-400" />
              <span>Total Boost Orders Spent</span>
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-baseline gap-1">
              <span className="text-pink-400 font-normal">₹</span>
              <span>{totalSpent.toFixed(2)}</span>
            </div>
            <p className="text-xs text-slate-400">
              Used across {orders.length} growth booster {orders.length === 1 ? "order" : "orders"}
            </p>
          </div>
        </div>

        {/* Section 2: UPI Wallet Deposit System */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>Add Money via UPI QR Code</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan dynamic amount QR code, complete payment in your UPI app, and submit your 12-digit UTR
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Admin Verification</span>
              </span>
            </div>
          </div>

          {depositSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-bold text-sm flex items-start gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span>{depositSuccessMsg}</span>
                <p className="text-xs text-emerald-400/80 font-normal">
                  You can track the verification progress anytime under the <strong>Deposits History</strong> tab below.
                </p>
              </div>
            </div>
          )}

          {depositErrorMsg && (
            <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 font-bold text-sm flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{depositErrorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: QR Code & Payment Details */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-950 border border-slate-800/80 space-y-4 text-center">
              <div className="flex items-center justify-center w-full pb-2.5 border-b border-slate-800">
                <span className="text-sm sm:text-base font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-pink-400" />
                  <span>QR Code</span>
                </span>
              </div>

              {/* QR Code Container */}
              <div className="relative p-4 rounded-2xl bg-white shadow-2xl flex items-center justify-center min-w-[220px] min-h-[220px]">
                {isLoadingQr ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-2 text-slate-700">
                    <RefreshCw className="w-8 h-8 animate-spin text-pink-600" />
                    <span className="text-xs font-bold">Generating QR...</span>
                  </div>
                ) : dynamicQrUrl ? (
                  <img
                    src={dynamicQrUrl}
                    alt={`Dynamic UPI QR for ₹${depositAmount}`}
                    className="w-[200px] h-[200px] object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-xs text-slate-500 p-8">Enter a valid amount to generate QR</div>
                )}
              </div>

              {/* Amount Pre-fill Notice */}
              <div className="text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-200">
                  Scanning this QR code pre-fills <strong>₹{depositAmount || "0"}</strong> in your UPI app.
                </p>
                <p className="text-[11px] text-slate-500">
                  Supported apps: Google Pay, PhonePe, Paytm, BHIM, Axis UPI, etc.
                </p>
              </div>
            </div>

            {/* Right Column: Amount Selection, UTR & Screenshot Form */}
            <div className="lg:col-span-7">
              <form onSubmit={handleSubmitDeposit} className="space-y-5">
                {/* 1. Amount Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    1. Select or Enter Amount to Add (₹ INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400 font-black text-xl">₹</span>
                    <input
                      type="number"
                      min={100}
                      max={50000}
                      step="1"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="500"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-lg font-black text-white focus:outline-hidden focus:border-pink-500 transition-colors shadow-inner"
                    />
                  </div>

                  {/* Preset Amount Chips */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {["100", "500", "1000", "2000", "5000", "10000"].map((amt) => {
                      const isSelected = depositAmount === amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDepositAmount(amt)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-md shadow-pink-500/20 scale-105"
                              : "bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white"
                          }`}
                        >
                          ₹{amt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Strict 12-Digit Numeric UTR Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      2. Enter 12-Digit UTR / Transaction ID
                    </label>
                    <div className="flex items-center gap-2">
                      {isCheckingUtr && (
                        <span className="text-xs text-amber-400 flex items-center gap-1 font-bold">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Checking DB...
                        </span>
                      )}
                      {utr.length === 12 && !isCheckingUtr && !utrExistsError && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-bold">
                          <Check className="w-3 h-3" />
                          UTR Unique
                        </span>
                      )}
                      <span
                        className={`text-xs font-mono font-bold ${
                          utrExistsError
                            ? "text-rose-400 font-black"
                            : utr.length === 12
                            ? "text-emerald-400 font-black"
                            : "text-slate-500"
                        }`}
                      >
                        {utr.length} / 12 digits
                      </span>
                    </div>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    value={utr}
                    onChange={handleUtrChange}
                    placeholder="e.g. 123456789012"
                    className={`w-full bg-slate-950 border rounded-2xl px-4 py-3 text-base font-mono font-bold text-white placeholder:text-slate-600 focus:outline-hidden transition-colors shadow-inner ${
                      utrExistsError
                        ? "border-rose-500/80 focus:border-rose-500 bg-rose-950/20"
                        : "border-slate-800 focus:border-pink-500"
                    }`}
                  />
                  {utrExistsError ? (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-400 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">UTR Already Exists in Database</p>
                        <p className="text-[11px] mt-0.5 text-rose-300/90">{utrExistsError}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      Find this 12-digit numeric Reference / UTR in your payment confirmation inside Google Pay, PhonePe, or Paytm.
                    </p>
                  )}
                </div>

                {/* 3. Screenshot Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    3. Upload Payment Screenshot (Max 5 MB)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <label className="w-full sm:w-auto flex-1 cursor-pointer flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-950 border border-dashed border-slate-800 hover:border-pink-500/60 text-slate-300 hover:text-white transition-all text-xs font-bold">
                      <Upload className="w-4 h-4 text-pink-400" />
                      <span>{screenshotFile ? screenshotFile.name : "Select Screenshot (JPG, PNG, WEBP)"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleScreenshotChange}
                        className="hidden"
                      />
                    </label>

                    {screenshotPreview && (
                      <div className="relative group w-14 h-14 rounded-xl overflow-hidden border border-slate-800 flex-shrink-0">
                        <img src={screenshotPreview} alt="Screenshot Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshotFile(null);
                            setScreenshotPreview(null);
                          }}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingDeposit || isCheckingUtr || Boolean(utrExistsError) || utr.length !== 12 || !screenshotFile}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingDeposit ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Verifying &amp; Submitting Deposit...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Submit Deposit for Verification (₹{depositAmount})</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>Submitting does not credit wallet automatically. Admin verifies bank transaction.</span>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Section 3: History Tabs (Ledger & Deposit Requests) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHistoryTab("transactions")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  historyTab === "transactions"
                    ? "bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-md shadow-pink-500/20"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                Wallet Ledger Transactions ({transactions.length})
              </button>

              <button
                type="button"
                onClick={() => setHistoryTab("deposits")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  historyTab === "deposits"
                    ? "bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-md shadow-pink-500/20"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                Deposits History ({deposits.length})
              </button>
            </div>

            {historyTab === "transactions" && (
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterType === "all" ? "bg-slate-800 text-white font-black" : "text-slate-400 hover:text-white"
                  }`}
                >
                  All ({transactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("credit")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterType === "credit" ? "bg-emerald-600 text-white font-black" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Credits ({successfulCreditsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("debit")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterType === "debit" ? "bg-pink-600 text-white font-black" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Debits ({debitsCount})
                </button>
              </div>
            )}
          </div>

          {/* Tab Content A: Wallet Transactions Ledger */}
          {historyTab === "transactions" && (
            <div className="space-y-4">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  <Database className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-300">No Transactions Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Your wallet balance transactions will automatically appear here once credits or boost purchases occur.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider">
                        <th className="pb-3 px-3">Type / Status</th>
                        <th className="pb-3 px-3">Amount</th>
                        <th className="pb-3 px-3">Description</th>
                        <th className="pb-3 px-3">Balance After</th>
                        <th className="pb-3 px-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {filteredTransactions.map((txn) => {
                        const isDebit = txn.type === "debit";
                        const isRejected = txn.status === "rejected";
                        const isPending = txn.status === "pending";

                        return (
                          <tr key={txn.id} className="hover:bg-slate-850/50 transition-colors">
                            <td className="py-3.5 px-3">
                              {isRejected ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  <X className="w-3 h-3" />
                                  <span>Rejected</span>
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <Clock className="w-3 h-3" />
                                  <span>Pending</span>
                                </span>
                              ) : isDebit ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-pink-500/10 text-pink-400 border border-pink-500/20">
                                  <ArrowUpRight className="w-3 h-3" />
                                  <span>Debit</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <ArrowDownLeft className="w-3 h-3" />
                                  <span>Credit</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 font-black text-sm">
                              {isRejected ? (
                                <span className="text-rose-400/80 line-through">
                                  ₹{Number(txn.amount || 0).toFixed(2)}
                                </span>
                              ) : isPending ? (
                                <span className="text-amber-400 font-bold">
                                  ₹{Number(txn.amount || 0).toFixed(2)}{" "}
                                  <span className="text-[10px] text-amber-400/70 font-semibold">(Pending)</span>
                                </span>
                              ) : isDebit ? (
                                <span className="text-pink-400">
                                  -₹{Number(txn.amount || 0).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-emerald-400">
                                  +₹{Number(txn.amount || 0).toFixed(2)}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-slate-300 font-semibold">
                              <div>{txn.description}</div>
                              {isRejected && (
                                <div className="text-[11px] text-rose-400/80 font-normal mt-0.5">
                                  Deposit was rejected by admin. Wallet balance was not credited.
                                </div>
                              )}
                              {isPending && (
                                <div className="text-[11px] text-amber-400/80 font-normal mt-0.5">
                                  Verification in progress. Wallet will be credited once approved.
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-3 font-mono text-slate-400">
                              {txn.balance_after !== undefined ? `₹${Number(txn.balance_after).toFixed(2)}` : "-"}
                            </td>
                            <td className="py-3.5 px-3 text-slate-500">
                              {new Date(txn.created_at).toLocaleString("en-IN", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab Content B: Deposits History */}
          {historyTab === "deposits" && (
            <div className="space-y-4">
              {deposits.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  <Clock className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-300">No Deposits Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When you submit a UPI deposit with UTR and screenshot, its verification progress will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider">
                        <th className="pb-3 px-3">Deposit ID</th>
                        <th className="pb-3 px-3">Requested Amount</th>
                        <th className="pb-3 px-3">12-Digit UTR</th>
                        <th className="pb-3 px-3">Status</th>
                        <th className="pb-3 px-3">Screenshot</th>
                        <th className="pb-3 px-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {deposits.map((dep) => {
                        return (
                          <tr key={dep.id} className="hover:bg-slate-850/50 transition-colors">
                            <td className="py-3.5 px-3 font-mono font-bold text-slate-300">{dep.id}</td>
                            <td className="py-3.5 px-3 font-black text-sm text-white">₹{Number(dep.amount).toFixed(2)}</td>
                            <td className="py-3.5 px-3 font-mono text-slate-400 font-bold">{dep.utr}</td>
                            <td className="py-3.5 px-3">
                              {dep.status === "pending" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <Clock className="w-3 h-3" />
                                  <span>Pending Verification</span>
                                </span>
                              )}
                              {dep.status === "approved" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Approved &amp; Credited</span>
                                </span>
                              )}
                              {dep.status === "rejected" && (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    <X className="w-3 h-3" />
                                    <span>Rejected</span>
                                  </span>
                                  {dep.rejection_reason && (
                                    <p className="text-[11px] text-rose-400 font-semibold max-w-xs truncate">
                                      {dep.rejection_reason}
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              <button
                                type="button"
                                onClick={() => setPreviewScreenshotId(dep.id)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Receipt</span>
                              </button>
                            </td>
                            <td className="py-3.5 px-3 text-slate-500">
                              {new Date(dep.created_at).toLocaleString("en-IN", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Screenshot Preview Modal */}
      {previewScreenshotId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileImage className="w-4 h-4 text-pink-400" />
                <span>Payment Screenshot ({previewScreenshotId})</span>
              </h3>
              <button
                type="button"
                onClick={() => setPreviewScreenshotId(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center max-h-[480px]">
              <img
                src={`/api/wallet/deposits/${previewScreenshotId}/screenshot`}
                alt="Payment Screenshot Receipt"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
