"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useEffect } from "react";
import { Spinner } from "@heroui/react";

const actions = [
  {
    icon: "🏪",
    label: "Manage Pharmacy Profile",
    sub: "Update shop info & hours",
    href: "/vendor/shop",
    gradient: "from-emerald-400 to-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    text: "text-emerald-700",
  },
  {
    icon: "💊",
    label: "Add / Update Medicines",
    sub: "Manage your medicine catalogue",
    href: "/vendor/medicines",
    gradient: "from-sky-400 to-blue-600",
    bg: "bg-sky-50",
    border: "border-sky-100",
    text: "text-sky-700",
  },
  {
    icon: "📦",
    label: "Track Inventory",
    sub: "Monitor stock levels",
    href: "/vendor/inventory",
    gradient: "from-violet-400 to-purple-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    text: "text-violet-700",
  },
  {
    icon: "📋",
    label: "View Customer Orders",
    sub: "See what customers need",
    href: "/vendor/orders",
    gradient: "from-orange-400 to-rose-500",
    bg: "bg-orange-50",
    border: "border-orange-100",
    text: "text-orange-700",
  },
];

const features = [
  "Manage your pharmacy profile",
  "Add and update medicines",
  "Set medicine prices",
  "View customer orders",
  "Track inventory",
];

export default function VendorDashboard() {
  const router = useRouter();
  const { exists: isRegistered, userType, loading: userInfoLoading } = useUserInfo();
  const { profile, loading: profileLoading } = useUserProfile();

  useEffect(() => {
    if (!userInfoLoading) {
      if (!isRegistered) router.push("/register");
      else if (userType && userType !== "vendor") router.push("/customer");
    }
  }, [isRegistered, userType, userInfoLoading, router]);

  if (userInfoLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-lime-50">
        <Spinner color="success" size="lg" />
      </div>
    );
  }

  if (!isRegistered || !profile) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-lime-50">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-10 right-8 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute bottom-16 -left-8 h-72 w-72 rounded-full bg-lime-200/40 blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-emerald-100 bg-white/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Fraunces, serif' }}>Medley</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden sm:block">{profile.name}</span>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-10">
        {/* Welcome header */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-4 py-1 text-sm font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Vendor Dashboard
          </div>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Welcome, {profile.name}! 👋
          </h1>
          <p className="mt-2 text-slate-500">
            You are logged in as a{" "}
            <span className="font-semibold text-emerald-600">Vendor</span>
          </p>
        </motion.div>

        {/* Feature list card */}
        <motion.div
          className="mb-8 rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm backdrop-blur"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">From this dashboard</p>
          <ul className="grid sm:grid-cols-2 gap-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-slate-700 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Action grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {actions.map((action, i) => (
            <motion.button
              key={action.href}
              onClick={() => router.push(action.href)}
              className={`group flex items-center gap-4 rounded-2xl border ${action.border} ${action.bg} p-5 text-left transition-all hover:shadow-md`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${action.gradient} text-2xl shadow-sm`}>
                {action.icon}
              </div>
              <div>
                <p className={`font-semibold ${action.text}`}>{action.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{action.sub}</p>
              </div>
              <span className={`ml-auto text-lg ${action.text} opacity-40 group-hover:opacity-80 transition-opacity`}>→</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}