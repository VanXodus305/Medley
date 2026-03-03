import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  image?: string;
  userType: "customer" | "vendor";
  phoneNumber?: string;
  address?: string;
  shopName?: string;
  licenseNumber?: string;
  createdAt?: string;
}

interface UseProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error?: string;
}

export function useUserProfile(): UseProfileResult {
  const { status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        setProfile(data);
        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch profile",
        );
        setLoading(false);
      }
    };

    fetchProfile();
  }, [status]);

  return { profile, loading, error };
}
