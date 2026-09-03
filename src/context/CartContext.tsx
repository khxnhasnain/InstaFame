"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";

export interface BoostOrder {
  id: string;
  smmOrderId?: string | number; // SMM Vault Order ID (e.g. 23501)
  type: "followers" | "likes" | "views";
  username: string;

  avatarUrl: string;
  postThumbnail?: string;
  postId?: string;
  packageAmount: number;
  packageLabel: string;
  price?: number;
  initialCount: number;
  approxAfterCount: number;
  currentCount: number;
  remains?: number;
  status: "ordered" | "pending" | "in_progress" | "processing" | "successful" | "completed" | "partial" | "canceled";
  smmStatus?: string;
  displayStatus?: string;
  lastCheckedAt?: number;
  createdAt: number;
  userEmail?: string;
}

interface CartContextType {
  orders: BoostOrder[];
  addOrder: (
    orderData: Omit<BoostOrder, "id" | "currentCount" | "status" | "createdAt" | "userEmail"> & {
      smmOrderId?: string | number;
    }
  ) => Promise<{ success: boolean; error?: string; order?: BoostOrder; remainingBalance?: number }>;
  removeOrder: (id: string) => void;
  clearOrders: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  activeOrdersCount: number;
  completedOrdersCount: number;
  currentUserIdentifier: string;
  refreshOrderStatus: (orderId?: string) => Promise<void>;
  isPollingStatus: boolean;
  lastSyncTime: number | null;
  setSmmOrderIdForOrder: (orderId: string, smmOrderId: string | number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getStorageKey(userEmail?: string | null, userId?: string | null): string {
  const userTag = userEmail || userId || "guest";
  const sanitized = userTag.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return `instafame_boost_orders_user_${sanitized}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<BoostOrder[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPollingStatus, setIsPollingStatus] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  const currentKeyRef = useRef<string>("");
  const ordersRef = useRef<BoostOrder[]>([]);
  ordersRef.current = orders;

  const userEmail = session?.user?.email;
  const userId = (session?.user as any)?.id;
  const currentUserKey = getStorageKey(userEmail, userId);

  // Load user-specific orders when session is determined or changed
  useEffect(() => {
    if (status === "loading") return;

    currentKeyRef.current = currentUserKey;
    try {
      const saved = localStorage.getItem(currentUserKey);
      if (saved) {
        setOrders(JSON.parse(saved));
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.warn("Failed to load user cart orders:", e);
      setOrders([]);
    }
    setIsInitialized(true);
  }, [currentUserKey, status]);

  // Save to user-specific localStorage whenever orders change
  useEffect(() => {
    if (!isInitialized || !currentKeyRef.current) return;
    try {
      localStorage.setItem(currentKeyRef.current, JSON.stringify(orders));
    } catch (e) {
      console.warn("Failed to save user cart orders:", e);
    }
  }, [orders, isInitialized]);

  // Status check helper function for SMMVault API
  const checkSmmStatusForOrders = useCallback(async (targetOrderId?: string) => {
    const currentOrders = ordersRef.current;
    if (currentOrders.length === 0) return;

    const ordersToQuery = targetOrderId
      ? currentOrders.filter((o) => o.id === targetOrderId || o.smmOrderId === targetOrderId)
      : currentOrders.filter(
          (o) =>
            o.status !== "successful" &&
            o.status !== "completed" &&
            o.status !== "canceled"
        );

    if (ordersToQuery.length === 0) return;

    setIsPollingStatus(true);

    try {
      for (const order of ordersToQuery) {
        const queryId = order.smmOrderId || order.id;

        try {
          const res = await fetch(`/api/smm/status?order=${encodeURIComponent(queryId)}`, {
            cache: "no-store",
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setOrders((prev) =>
                prev.map((o) => {
                  if (o.id !== order.id) return o;

                  const startCount =
                    data.startCount !== null && data.startCount !== undefined
                      ? Number(data.startCount)
                      : o.initialCount;
                  const remains = data.remains !== undefined ? Number(data.remains) : (o.remains ?? 0);

                  // Calculate delivered quantity
                  const totalAmt = o.packageAmount || 1000;
                  const delivered = Math.max(0, totalAmt - remains);
                  const isFinished =
                    data.status === "successful" ||
                    data.status === "completed" ||
                    (remains === 0 && delivered >= totalAmt);

                  const computedCurrent = isFinished
                    ? startCount + totalAmt
                    : Math.max(o.currentCount, startCount + delivered);

                  const mappedStatus = isFinished
                    ? ("successful" as const)
                    : data.status === "processing"
                    ? ("processing" as const)
                    : data.status === "pending"
                    ? ("pending" as const)
                    : data.status === "partial"
                    ? ("partial" as const)
                    : data.status === "canceled"
                    ? ("canceled" as const)
                    : ("in_progress" as const);

                  const updated: BoostOrder = {
                    ...o,
                    initialCount: startCount,
                    remains: remains,
                    currentCount: computedCurrent,
                    approxAfterCount: startCount + totalAmt,
                    status: mappedStatus,
                    smmStatus: data.rawStatus || data.status,
                    displayStatus: data.displayStatus || data.status,
                    lastCheckedAt: Date.now(),
                  };

                  // Asynchronously sync updated status and count to backend DB
                  fetch("/api/orders", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: updated.id,
                      smm_order_id: updated.smmOrderId,
                      status: updated.status,
                      current_count: updated.currentCount,
                      initial_count: updated.initialCount,
                      remains: updated.remains,
                      smm_status: updated.smmStatus,
                      approx_after_count: updated.approxAfterCount,
                    }),
                  }).catch(() => {});

                  return updated;
                })
              );
            }
          }
        } catch (err) {
          console.warn(`SMM status check error for order ${queryId}:`, err);
        }
      }
      setLastSyncTime(Date.now());
    } finally {
      setIsPollingStatus(false);
    }
  }, []);

  // 30-Second Polling Timer for Order Statuses
  useEffect(() => {
    // Initial check after 2 seconds on mount
    const initialTimer = setTimeout(() => {
      checkSmmStatusForOrders();
    }, 2000);

    // Continuous 30-second interval
    const interval = setInterval(() => {
      checkSmmStatusForOrders();
    }, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [checkSmmStatusForOrders]);

  // Micro-ticker for smooth UI animation while in progress
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prevOrders) => {
        let hasChanges = false;
        const updated = prevOrders.map((order) => {
          if (order.status === "successful" || order.status === "completed" || order.status === "canceled") {
            return order;
          }

          if (order.status !== "in_progress") {
            return order;
          }

          const remaining = order.approxAfterCount - order.currentCount;
          if (remaining <= 0) {
            return {
              ...order,
              currentCount: order.approxAfterCount,
              status: "successful" as const,
            };
          }

          // Smooth incremental chunks
          const step = Math.max(1, Math.min(remaining, Math.ceil(order.packageAmount / 40)));
          const nextCount = order.currentCount + step;
          const isDone = nextCount >= order.approxAfterCount;

          hasChanges = true;
          return {
            ...order,
            currentCount: isDone ? order.approxAfterCount : nextCount,
            status: isDone ? ("successful" as const) : ("in_progress" as const),
          };
        });

        return hasChanges ? updated : prevOrders;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const addOrder = async (
    orderData: Omit<BoostOrder, "id" | "currentCount" | "status" | "createdAt" | "userEmail"> & {
      smmOrderId?: string | number;
    }
  ): Promise<{ success: boolean; error?: string; order?: BoostOrder; remainingBalance?: number }> => {
    // Generate order ID and default SMM Order ID
    const randomNumericId = Math.floor(20000 + Math.random() * 80000);
    const orderId = `ORD-${randomNumericId}`;
    const smmOrderId = orderData.smmOrderId || randomNumericId;

    const newOrder: BoostOrder = {
      ...orderData,
      id: orderId,
      smmOrderId: smmOrderId,
      currentCount: orderData.initialCount,
      remains: orderData.packageAmount,
      status: "pending",
      displayStatus: "Pending",
      smmStatus: "Pending",
      createdAt: Date.now(),
      lastCheckedAt: Date.now(),
      userEmail: userEmail || "guest@instafame.com",
    };

    try {
      // Step 1: Call /api/orders to check & deduct wallet balance from MySQL DB
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newOrder.id,
          smm_order_id: newOrder.smmOrderId,
          user_email: newOrder.userEmail,
          service_type: newOrder.type,
          target_username: newOrder.username,
          target_post_url: newOrder.postThumbnail || "",
          package_amount: newOrder.packageAmount,
          package_label: newOrder.packageLabel,
          price: newOrder.price || 0,
          initial_count: newOrder.initialCount,
          approx_after_count: newOrder.approxAfterCount,
          current_count: newOrder.currentCount,
          remains: newOrder.remains,
          status: newOrder.status,
          smm_status: newOrder.smmStatus,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          error: data.error || data.detail || "Insufficient wallet balance to place this order.",
        };
      }

      // Step 2: Wallet deduction succeeded! Dispatch real-time wallet update event to Navbar
      if (typeof window !== "undefined") {
        const remaining = data?.data?.remaining_wallet_balance;
        window.dispatchEvent(new CustomEvent("wallet_updated", { detail: { balance: remaining } }));
      }

      // Step 3: Add to active cart & open cart drawer
      setOrders((prev) => [newOrder, ...prev]);
      setIsCartOpen(true);

      // Trigger immediate status check for this new order
      setTimeout(() => {
        checkSmmStatusForOrders(newOrder.id);
      }, 1000);

      return {
        success: true,
        order: newOrder,
        remainingBalance: data?.data?.remaining_wallet_balance,
      };
    } catch (err: any) {
      console.error("Order processing error:", err);
      return {
        success: false,
        error: err?.message || "Failed to process order. Please check your connection.",
      };
    }
  };

  const removeOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const clearOrders = () => {
    setOrders([]);
  };

  const setSmmOrderIdForOrder = (orderId: string, smmOrderId: string | number) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, smmOrderId: smmOrderId } : o))
    );
    // Refresh status with new SMM ID
    setTimeout(() => {
      checkSmmStatusForOrders(orderId);
    }, 500);
  };

  const refreshOrderStatus = async (orderId?: string) => {
    await checkSmmStatusForOrders(orderId);
  };

  const activeOrdersCount = orders.filter(
    (o) => o.status !== "successful" && o.status !== "completed" && o.status !== "canceled"
  ).length;
  const completedOrdersCount = orders.filter(
    (o) => o.status === "successful" || o.status === "completed"
  ).length;

  return (
    <CartContext.Provider
      value={{
        orders,
        addOrder,
        removeOrder,
        clearOrders,
        isCartOpen,
        setIsCartOpen,
        activeOrdersCount,
        completedOrdersCount,
        currentUserIdentifier: userEmail || session?.user?.name || "Guest",
        refreshOrderStatus,
        isPollingStatus,
        lastSyncTime,
        setSmmOrderIdForOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
