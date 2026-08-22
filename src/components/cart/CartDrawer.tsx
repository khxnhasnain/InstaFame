"use client";

import React, { useState } from "react";
import { X, ShoppingBag, Zap, CheckCircle2, TrendingUp, Clock, Trash2, ArrowRight, Sparkles, Heart, Users, User, History } from "lucide-react";
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
  } = useCart();

  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "completed">("all");

  if (!isCartOpen) return null;

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === "active") return order.status !== "successful";
    if (activeFilter === "completed") return order.status === "successful";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 space-y-3">
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
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
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
                Past Records ({completedOrdersCount})
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
                      ? "Completed boosts will be saved here in your account's permanent history."
                      : "Click 'Increase Followers' on any profile or 'Increase Likes' on any post to start."}
                  </p>
                </div>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isFollowers = order.type === "followers";
                const isSuccessful = order.status === "successful";
                const delivered = Math.max(0, order.currentCount - order.initialCount);
                const progressPercent = Math.min(100, Math.round((delivered / order.packageAmount) * 100));
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
                        : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {/* Top Row: Package + Price + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
                          {order.packageLabel}
                        </span>
                        {typeof order.price === "number" && order.price > 0 && (
                          <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                            ${order.price.toFixed(2)}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">
                          #{order.id}
                        </span>
                      </div>

                      {/* Status Pill */}
                      {isSuccessful ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Successful</span>
                        </span>
                      ) : order.status === "ordered" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                          <Clock className="w-3 h-3" />
                          <span>Ordered</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
                          <Zap className="w-3 h-3 fill-indigo-500 text-indigo-500 animate-bounce" />
                          <span>Delivering ({progressPercent}%)</span>
                        </span>
                      )}
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
                          <span>{isFollowers ? "Profile Growth" : "Media Boost"}</span>
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

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-700 ease-out rounded-full ${
                            isSuccessful
                              ? "bg-emerald-500"
                              : "bg-gradient-to-r from-instagram-orange via-instagram-pink to-indigo-600"
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Count Metrics Box: Initial -> Live -> Approx After */}
                    <div className="grid grid-cols-3 gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 text-center">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Initial
                        </p>
                        <p className="font-bold text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                          {order.initialCount.toLocaleString()}
                        </p>
                      </div>

                      <div className="border-x border-slate-200 dark:border-slate-800 px-1">
                        <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider flex items-center justify-center gap-0.5">
                          <TrendingUp className="w-2.5 h-2.5" />
                          <span>Live</span>
                        </p>
                        <p className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {order.currentCount.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Approx After
                        </p>
                        <p className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">
                          {order.approxAfterCount.toLocaleString()}
                        </p>
                      </div>
                    </div>
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
                <span>Records are privately saved to your account.</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
