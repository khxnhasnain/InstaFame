"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Instagram, Facebook, LayoutDashboard, LogOut, Menu, X, Sparkles, User, ShoppingBag, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";

const checkIsAdmin = (email?: string | null, sessionUser?: any): boolean => {
  if (sessionUser?.isAdmin || sessionUser?.role === "admin") return true;
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "khanhasnain2310@gmail.com,admin@instafame.com")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return envAdmins.includes(clean) || clean.startsWith("admin@");
};

interface NavItem {
  name: string;
  href: string;
  icon: any;
  isAdminOnly?: boolean;
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { setIsCartOpen, orders, activeOrdersCount } = useCart();

  const isAdmin = checkIsAdmin(session?.user?.email, session?.user);

  const baseNavLinks: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Instagram Viewer", href: "/instagram", icon: Instagram },
    { name: "Facebook Viewer", href: "/facebook", icon: Facebook },
  ];

  const navLinks: NavItem[] = isAdmin
    ? [...baseNavLinks, { name: "Pricing & DB", href: "/admin", icon: ShieldCheck, isAdminOnly: true }]
    : baseNavLinks;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-instagram-orange via-instagram-pink to-facebook-blue p-0.5 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-instagram-pink" />
              </div>
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-instagram-pink via-purple-600 to-facebook-blue bg-clip-text text-transparent">
              InstaFame
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-slate-100 text-slate-900 shadow-sm border border-slate-200"
                      : link.isAdminOnly
                      ? "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/70 border border-transparent hover:border-indigo-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? "text-instagram-pink"
                        : link.isAdminOnly
                        ? "text-indigo-600"
                        : "text-slate-500"
                    }`}
                  />
                  <span>{link.name}</span>
                  {link.isAdminOnly && (
                    <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-md">
                      Admin
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side Cart, User info & Logout */}
          <div className="hidden md:flex items-center gap-3">
            {/* Boost Orders Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
              title="View Boost Cart & Live Orders"
            >
              <ShoppingBag className="w-4 h-4 text-instagram-pink" />
              <span>Cart</span>
              {orders.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold text-white ${
                    activeOrdersCount > 0
                      ? "bg-gradient-to-r from-instagram-orange to-instagram-pink animate-pulse"
                      : "bg-emerald-500"
                  }`}
                >
                  {orders.length}
                </span>
              )}
            </button>

            {session?.user ? (
              <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User Avatar"}
                    className="w-7 h-7 rounded-full object-cover border border-slate-300"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 max-w-[130px] truncate leading-tight">
                    {session.user.name || "User"}
                  </span>
                  {isAdmin && (
                    <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">
                      Administrator
                    </span>
                  )}
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  title="Sign Out"
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-semibold text-white bg-slate-900 px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu toggle & Cart button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              title="Cart"
            >
              <ShoppingBag className="w-5 h-5 text-instagram-pink" />
              {orders.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-instagram-pink text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {orders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2 shadow-lg">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                  isActive
                    ? "bg-slate-100 text-slate-900 border border-slate-200"
                    : link.isAdminOnly
                    ? "text-indigo-600 bg-indigo-50/50"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-5 h-5 ${link.isAdminOnly ? "text-indigo-600" : "text-instagram-pink"}`} />
                <span>{link.name}</span>
                {link.isAdminOnly && (
                  <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full ml-auto">
                    Admin
                  </span>
                )}
              </Link>
            );
          })}

          {session?.user && (
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User Avatar"}
                    className="w-9 h-9 rounded-full object-cover border border-slate-300"
                  />
                )}
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate max-w-[180px]">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
