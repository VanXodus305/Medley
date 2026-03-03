"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button, Spinner } from "@heroui/react";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useUserProfile } from "@/hooks/useUserProfile";
import Link from "next/link";

export default function VendorDashboard() {
  const router = useRouter();
  const {
    exists: isRegistered,
    userType,
    loading: userInfoLoading,
  } = useUserInfo();
  const { profile, loading: profileLoading } = useUserProfile();

  // Protect route - redirect if not registered or wrong user type
  useEffect(() => {
    if (!userInfoLoading) {
      if (!isRegistered) {
        router.push("/register");
      } else if (userType && userType !== "vendor") {
        router.push("/customer");
      }
    }
  }, [isRegistered, userType, userInfoLoading, router]);

  // Show loading while checking registration or fetching profile
  if (userInfoLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <Spinner color="success" size="lg" />
      </div>
    );
  }

  // Don't render if not registered
  if (!isRegistered || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">Medley</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{profile.name}</span>
            <Button
              color="danger"
              variant="flat"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-12 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome, {profile.name}! 👋
            </h2>
            <p className="text-gray-600 text-lg">
              You are logged in as a{" "}
              <span className="font-semibold text-green-600">Vendor</span>
            </p>

            <div className="pt-6 space-y-4">
              <p className="text-gray-700">
                This is your vendor dashboard. Here you can:
              </p>
              <ul className="text-left space-y-2 text-gray-600 bg-green-50 p-6 rounded-lg">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Manage your pharmacy
                  profile
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Add and update
                  medicines
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Set medicine prices
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> View customer orders
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Track inventory
                </li>
              </ul>
            </div>

            <Link href="/">
              <Button color="success" size="lg" className="w-full">
                Go to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
