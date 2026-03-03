"use client";

import { signIn, useSession } from "next-auth/react";
import { Button } from "@heroui/react";
import { useState } from "react";

export default function LoginPage() {
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", {
        redirect: true,
        callbackUrl: "/register",
      });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-lime-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-10 right-8 h-56 w-56 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="absolute bottom-16 -left-8 h-64 w-64 rounded-full bg-lime-200/50 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-4 py-12 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full bg-emerald-100/80 px-4 py-1 text-sm font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Trusted by neighborhood pharmacies
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">
              Medley makes medicine management feel effortless.
            </h1>
            <p className="text-lg text-slate-600">
              Search availability, compare nearby shops, and keep your purchases
              organized with a personalized dashboard.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-white/70 p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Instant availability
              </p>
              <p className="text-sm text-slate-600">
                Get updated stock insights in minutes.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white/70 p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Guided purchase
              </p>
              <p className="text-sm text-slate-600">
                Chat with Medley to plan your next visit.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md flex-1">
          <div className="rounded-3xl border border-emerald-100 bg-white/90 p-8 shadow-xl backdrop-blur">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-2xl text-white">
                  💊
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    Welcome back
                  </p>
                  <p className="text-sm text-slate-500">
                    Sign in to continue with Medley
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-5">
              <div className="rounded-2xl bg-emerald-50/60 p-4 text-sm text-emerald-900">
                Keep your profile, shop preferences, and orders in one place.
              </div>

              <Button
                onClick={handleGoogleSignIn}
                isLoading={isLoading}
                disabled={isLoading}
                className="w-full rounded-2xl bg-slate-900 py-6 text-base font-semibold text-white shadow-lg shadow-emerald-100 transition hover:bg-slate-800"
                size="lg"
              >
                {!isLoading && (
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Continue with Google
              </Button>

              <p className="text-center text-xs text-slate-500">
                Secure login powered by Google OAuth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
