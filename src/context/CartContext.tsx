"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export interface BoostOrder {
  id: string;
  type: "followers" | "likes";
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
  status: "ordered" | "in_progress" | "successful";
  createdAt: number;
  userEmail?: string;
}

interface CartContextType {
  orders: BoostOrder[];
  addOrder: (orderData: Omit<BoostOrder, "id" | "currentCount" | "status" | "createdAt" | "userEmail">) => BoostOrder;
  removeOrder: (id: string) => void;
  clearOrders: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  activeOrdersCount: number;
  completedOrdersCount: number;
  currentUserIdentifier: string;
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
  const currentKeyRef = useRef<string>("");

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

  // Live ticker: incrementally delivers in-progress orders
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prevOrders) => {
        let hasChanges = false;
        const updated = prevOrders.map((order) => {
          if (order.status === "successful") return order;

          hasChanges = true;
          const remaining = order.approxAfterCount - order.currentCount;

          if (remaining <= 0) {
            return {
              ...order,
              currentCount: order.approxAfterCount,
              status: "successful" as const,
            };
          }

          // Dynamic step: incremental chunks time to time
          const step = Math.max(1, Math.min(remaining, Math.ceil(order.packageAmount / 35)));
          const nextCount = order.currentCount + step;
          const isDone = nextCount >= order.approxAfterCount;

          return {
            ...order,
            currentCount: isDone ? order.approxAfterCount : nextCount,
            status: isDone ? ("successful" as const) : ("in_progress" as const),
          };
        });

        return hasChanges ? updated : prevOrders;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const addOrder = (orderData: Omit<BoostOrder, "id" | "currentCount" | "status" | "createdAt" | "userEmail">) => {
    const newOrder: BoostOrder = {
      ...orderData,
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      currentCount: orderData.initialCount,
      status: "ordered",
      createdAt: Date.now(),
      userEmail: userEmail || "guest",
    };

    // Async record to MySQL database
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: newOrder.id,
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
        status: newOrder.status,
      }),
    }).catch((err) => console.warn("Failed to sync order to database:", err));

    setOrders((prev) => [newOrder, ...prev]);
    setIsCartOpen(true);
    return newOrder;
  };

  const removeOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const clearOrders = () => {
    setOrders([]);
  };

  const activeOrdersCount = orders.filter((o) => o.status !== "successful").length;
  const completedOrdersCount = orders.filter((o) => o.status === "successful").length;

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
