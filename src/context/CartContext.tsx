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
      userEmail?: string;
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
  return `viralora_boost_orders_user_${sanitized}`;
}

function getLegacyStorageKey(userEmail?: string | null, userId?: string | null): string {
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
  const legacyUserKey = getLegacyStorageKey(userEmail, userId);

  // Load user-specific orders when session is determined or changed
  useEffect(() => {
    if (status === "loading") return;

    currentKeyRef.current = currentUserKey;
    try {
      const saved = localStorage.getItem(currentUserKey) || localStorage.getItem(legacyUserKey);
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
  }, [currentUserKey, legacyUserKey, status]);

  // Save to user-specific localStorage whenever orders change
  useEffect(() => {
    if (!isInitialized || !currentKeyRef.current) return;
    try {
      localStorage.setItem(currentKeyRef.current, JSON.stringify(orders));
    } catch (e) {
      console.warn("Failed to save user cart orders:", e);
    }
  }, [orders, isInitialized]);

  // Sync orders with database (/api/orders) to check if admin marked them as completed
  const syncOrdersFromDatabase = useCallback(async () => {
    const activeEmail = userEmail || session?.user?.email;
    if (!activeEmail) return;
    setIsPollingStatus(true);
    try {
      const res = await fetch(`/api/orders?user_email=${encodeURIComponent(activeEmail)}&t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const dbOrders: any[] = json.data;
          setOrders((prevOrders) => {
            const dbMap = new Map<string, any>();
            dbOrders.forEach((item) => {
              if (item.id) dbMap.set(String(item.id), item);
              if (item.smm_order_id) dbMap.set(String(item.smm_order_id), item);
            });

            // Filter out old orphan local orders (>45s) that do not exist in MySQL database
            const isFreshLocal = (local: BoostOrder) => Date.now() - (local.createdAt || 0) < 45000;
            const validLocals = prevOrders.filter(
              (local) => dbMap.has(local.id) || (local.smmOrderId && dbMap.has(String(local.smmOrderId))) || isFreshLocal(local)
            );

            // 1. Update existing orders with database status
            const updated = validLocals.map((local) => {
              const matched = dbMap.get(local.id) || (local.smmOrderId && dbMap.get(String(local.smmOrderId)));
              if (!matched) return local;

              const isCompleted = matched.status === "completed" || matched.status === "successful";
              return {
                ...local,
                id: matched.id || local.id,
                status: isCompleted ? ("completed" as const) : ("ordered" as const),
                price: typeof matched.price === "number" ? matched.price : parseFloat(matched.price || String(local.price || 0)),
                packageLabel: matched.package_label || local.packageLabel,
                lastCheckedAt: Date.now(),
              };
            });

            // 2. Also import any orders in the database that might not be in local state yet
            const existingIds = new Set(updated.map((o) => o.id));
            dbOrders.forEach((dbO) => {
              if (!existingIds.has(dbO.id)) {
                const isCompleted = dbO.status === "completed" || dbO.status === "successful";
                updated.unshift({
                  id: dbO.id,
                  smmOrderId: dbO.smm_order_id || undefined,
                  type: (dbO.service_type || "followers") as "followers" | "likes" | "views",
                  username: dbO.target_username || "user",
                  avatarUrl: "/images/default_avatar.jpg",
                  packageAmount: dbO.package_amount || 1000,
                  packageLabel: dbO.package_label || "+1000",
                  price: typeof dbO.price === "number" ? dbO.price : parseFloat(dbO.price || "0"),
                  initialCount: dbO.initial_count || 0,
                  approxAfterCount: dbO.approx_after_count || 0,
                  currentCount: dbO.current_count || dbO.initial_count || 0,
                  status: isCompleted ? "completed" : "ordered",
                  createdAt: dbO.created_at ? new Date(dbO.created_at).getTime() : Date.now(),
                  userEmail: dbO.user_email || activeEmail,
                });
              }
            });

            return updated;
          });
        }
      }
      setLastSyncTime(Date.now());
    } catch (err) {
      console.warn("Error syncing orders from database:", err);
    } finally {
      setIsPollingStatus(false);
    }
  }, [userEmail, session?.user?.email]);

  // Sync on mount and periodically every 15s
  useEffect(() => {
    if (!isInitialized || !userEmail) return;

    syncOrdersFromDatabase();
    const interval = setInterval(syncOrdersFromDatabase, 15000);
    return () => clearInterval(interval);
  }, [isInitialized, userEmail, syncOrdersFromDatabase]);

  // Sync immediately whenever user opens cart drawer
  useEffect(() => {
    if (isCartOpen && userEmail) {
      syncOrdersFromDatabase();
    }
  }, [isCartOpen, userEmail, syncOrdersFromDatabase]);

  const addOrder = async (
    orderData: Omit<BoostOrder, "id" | "currentCount" | "status" | "createdAt" | "userEmail"> & {
      smmOrderId?: string | number;
      userEmail?: string;
    }
  ): Promise<{ success: boolean; error?: string; order?: BoostOrder; remainingBalance?: number }> => {
    const effectiveEmail = (orderData.userEmail || userEmail || session?.user?.email || "").trim();
    if (!effectiveEmail || effectiveEmail === "guest@viralora.com" || effectiveEmail.startsWith("guest")) {
      return {
        success: false,
        error: "Please sign in to your account with Google before placing a boost order.",
      };
    }

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
      status: "ordered",
      displayStatus: "Ordered",
      createdAt: Date.now(),
      lastCheckedAt: Date.now(),
      userEmail: effectiveEmail,
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

      // Step 2: Wallet deduction succeeded! Dispatch real-time wallet update event
      const remaining = data?.data?.remaining_wallet_balance;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("wallet_updated", { detail: { balance: remaining } }));
      }

      // Confirmed database record
      const confirmedOrder: BoostOrder = {
        ...newOrder,
        id: data?.data?.id || newOrder.id,
        price: typeof data?.data?.price === "number" ? data.data.price : newOrder.price,
        smmOrderId: data?.data?.smm_order_id || newOrder.smmOrderId,
      };

      // Step 3: Add to active cart & open cart drawer
      setOrders((prev) => [confirmedOrder, ...prev.filter((o) => o.id !== confirmedOrder.id)]);
      setIsCartOpen(true);

      // Trigger immediate sync from database
      setTimeout(() => {
        syncOrdersFromDatabase();
      }, 500);

      return {
        success: true,
        order: confirmedOrder,
        remainingBalance: remaining,
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
  };

  const refreshOrderStatus = async () => {
    await syncOrdersFromDatabase();
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
