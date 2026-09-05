"use client";

import React, { useState } from "react";
import {
  X,
  ShoppingBag,
  Zap,
  CheckCircle2,
  TrendingUp,
  Clock,
  Trash2,
  Sparkles,
  User,
  History,
  RefreshCw,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  Radio,
  Package,
} from "lucide-react";
import { useCart, BoostOrder } from "@/context/CartContext";

export default function CartDrawer() {
  const {
    orders,
    isCartOpen,
    setIsCartOpen,
    removeOrder,
    clearOrders,
    activeOrdersCount,
    completedOrdersCount,
    currentUserIdentifier,
    refreshOrderStatus,
    isPollingStatus,
    lastSyncTime,
  } = useCart();

  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "completed">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [refreshingOrderId, setRefreshingOrderId] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const filteredOrders = orders.filter((order) => {
    const isDone = order.status === "successful" || order.status === "completed";
    if (activeFilter === "active") return !isDone;
    if (activeFilter === "completed") return isDone;
    return true;
  });

  const handleCopyId = (id: string | number) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(String(id));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRefreshSingle = async (orderId: string) => {
    setRefreshingOrderId(orderId);
    await refreshOrderStatus(orderId);
    setTimeout(() => setRefreshingOrderId(null), 800);
  };

  const formatTime = (ts?: number) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-lg bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-instagram-orange via-instagram-pink to-indigo-600 p-0.5 flex items-center justify-center shadow-sm">
                  <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[9px] flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-instagram-pink" />
                  </div>
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                    My Boost Cart & Records
                  </h2>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <User className="w-3 h-3 text-indigo-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                      {currentUserIdentifier}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {orders.length > 0 && (
                  <button
                    onClick={clearOrders}
                    title="Clear history"
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Live Order Status Bar */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Live Order Tracker
                </span>
                {lastSyncTime && (
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    • {formatTime(lastSyncTime)}
                  </span>
                )}
              </div>

              <button
                onClick={() => refreshOrderStatus()}
                disabled={isPollingStatus}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-[10px] border border-slate-200 dark:border-slate-600 cursor-pointer disabled:opacity-50 transition-all shadow-2xs"
                title="Refresh order status from database"
              >
                <RefreshCw className={`w-3 h-3 ${isPollingStatus ? "animate-spin text-indigo-600" : ""}`} />
                <span>{isPollingStatus ? "Checking..." : "Refresh"}</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveFilter("all")}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeFilter === "all"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                All ({orders.length})
              </button>
              <button
                onClick={() => setActiveFilter("active")}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeFilter === "active"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Active ({activeOrdersCount})
              </button>
              <button
                onClick={() => setActiveFilter("completed")}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeFilter === "completed"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Completed ({completedOrdersCount})
              </button>
            </div>
          </div>

          {/* Orders Body List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  {activeFilter === "completed" ? (
                    <History className="w-8 h-8" />
                  ) : (
                    <ShoppingBag className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {activeFilter === "completed"
                      ? "No Past Completed Records"
                      : activeFilter === "active"
                      ? "No Active Boosts in Progress"
                      : "Your Boost Cart is Empty"}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-xs">
                    {activeFilter === "completed"
                      ? "Completed boosts will appear here once finalized by admin."
                      : "Click 'Increase Followers' on any profile or 'Increase Likes' on any post to start."}
                  </p>
                </div>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isFollowers = order.type === "followers";
                const isSuccessful = order.status === "successful" || order.status === "completed";
                const isCanceled = order.status === "canceled";

                const smmId = order.smmOrderId || order.id.replace(/\D/g, "") || order.id;

                const formattedDate = new Date(order.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={order.id}
                    className={`rounded-2xl border transition-all shadow-xs p-4 space-y-3.5 ${
                      isSuccessful
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50"
                        : isCanceled
                        ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50"
                        : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {/* Top Row: Package + Price + Order ID + Status Badge */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
                          {order.packageLabel}
                        </span>
                        {typeof order.price === "number" && order.price > 0 && (
                          <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                            ₹{order.price.toFixed(2)}
                          </span>
                        )}

                        {/* Order ID Badge */}
                        <button
                          type="button"
                          onClick={() => handleCopyId(smmId)}
                          className="flex items-center gap-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/60 cursor-pointer transition-colors"
                          title="Click to copy Order ID"
                        >
                          <span>#{smmId}</span>
                          {copiedId === String(smmId) ? (
                            <Check className="w-2.5 h-2.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 opacity-60" />
                          )}
                        </button>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-1.5">
                        {isSuccessful ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </span>
                        ) : isCanceled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Canceled</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Ordered</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Target Information */}
                    <div className="flex items-center gap-3">
                      {isFollowers ? (
                        <img
                          src={order.avatarUrl}
                          alt={order.username}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                        />
                      ) : (
                        <img
                          src={order.postThumbnail || order.avatarUrl}
                          alt="Post Thumbnail"
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          @{order.username}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>
                            {order.type === "followers"
                              ? "Profile Growth"
                              : order.type === "views"
                              ? "Reel Views Boost"
                              : "Likes Boost"}
                          </span>
                          <span>•</span>
                          <span>{formattedDate}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeOrder(order.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Turnaround Timeline Card */}
                    {isSuccessful ? (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Order Status
                          </p>
                          <p className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                            Completed &amp; Delivered
                          </p>
                        </div>
                      </div>
                    ) : isFollowers ? (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                            Estimated Turnaround
                          </p>
                          <p className="text-xs font-extrabold text-indigo-950 dark:text-white">
                            Takes 6-7 working days
                          </p>
                        </div>
                        <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md">
                          Ordered
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500/20" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Estimated Turnaround
                          </p>
                          <p className="text-xs font-extrabold text-amber-950 dark:text-white">
                            Within 24 hrs
                          </p>
                        </div>
                        <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md">
                          Ordered
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          {orders.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center text-xs text-slate-500">
              <p className="flex items-center justify-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-instagram-pink" />
                <span>Orders are securely recorded &amp; tracked in real-time.</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
