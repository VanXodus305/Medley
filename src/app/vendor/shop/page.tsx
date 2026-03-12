"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";
import NavBar from "@/components/NavBar";

export default function ShopPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [form, setForm] = useState({
    name: "",
    phone: "",
    location: "",
    openingTime: "09:00",
    closingTime: "21:00",
  });

  useEffect(() => {
    fetch("/api/vendor/shop")
      .then((res) => {
        if (res.ok) return res.json();
        setIsNew(true);
        return null;
      })
      .then((data) => {
        if (data) {
          setForm({
            name: data.name || "",
            phone: data.phone || "",
            location: data.location || "",
            openingTime: data.openingTime || "09:00",
            closingTime: data.closingTime || "21:00",
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setIsNew(true);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await fetch("/api/vendor/shop", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMessage({
          text: "✓ Pharmacy profile saved successfully!",
          type: "success",
        });
        setIsNew(false);
      } else {
        const data = await res.json();
        setMessage({
          text: data.error || "Failed to save. Try again.",
          type: "error",
        });
      }
    } catch {
      setMessage({ text: "Network error. Try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-lime-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500" />
          <p className="text-slate-500 text-sm">Loading shop info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-lime-50">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-10 right-8 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute bottom-16 -left-8 h-72 w-72 rounded-full bg-lime-200/40 blur-3xl" />
      </div>

      {/* Navbar */}
      <NavBar />

      <div className="relative z-10 mx-auto max-w-3xl px-6 pb-10 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-7">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-4 py-1 text-sm font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Pharmacy Profile
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Manage Your Shop
            </h1>
            <p className="mt-1 text-slate-500 text-sm">
              Keep your pharmacy info up to date so customers can find you.
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-3xl border border-emerald-100 bg-white/90 p-8 shadow-xl backdrop-blur">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-2xl shadow-sm">
                🏪
              </div>
              <div>
                <p className="font-semibold text-slate-900">Shop Details</p>
                <p className="text-xs text-slate-500">
                  {isNew
                    ? "Create your pharmacy profile"
                    : "Update your pharmacy profile"}
                </p>
              </div>
            </div>

            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-5 flex items-center gap-2 rounded-2xl p-4 text-sm font-medium ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                <span>{message.type === "success" ? "✓" : "✕"}</span>
                {message.text}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Pharmacy / Shop Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  placeholder="e.g. Rungta Medical Store"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Phone Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  placeholder="e.g. +91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Location / Address <span className="text-rose-400">*</span>
                </label>
                <textarea
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none"
                  placeholder="e.g. Shop No. 5, MG Road, Bhubaneswar"
                  rows={2}
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    value={form.openingTime}
                    onChange={(e) =>
                      setForm({ ...form, openingTime: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    value={form.closingTime}
                    onChange={(e) =>
                      setForm({ ...form, closingTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button
                type="submit"
                isLoading={saving}
                disabled={saving}
                className="w-full rounded-2xl bg-slate-900 py-6 text-base font-semibold text-white shadow-lg transition hover:bg-slate-800"
                size="lg"
              >
                {isNew ? "Create Pharmacy Profile" : "Save Changes"}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
