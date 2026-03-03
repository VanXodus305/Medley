import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface UserInfo {
  exists: boolean;
  userType?: string;
  id?: string;
  loading: boolean;
  error?: string;
}

export function useUserInfo(): UserInfo {
  const { data: session, status } = useSession();
  const [userInfo, setUserInfo] = useState<UserInfo>({
    exists: false,
    loading: true,
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.email) {
      setUserInfo({ exists: false, loading: false });
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const response = await fetch(
          `/api/user/check?email=${encodeURIComponent(session.user.email!)}`,
        );
        const data = await response.json();
        setUserInfo({
          exists: data.exists,
          userType: data.userType,
          id: data.id,
          loading: false,
        });
      } catch (error) {
        setUserInfo({
          exists: false,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch user info",
        });
      }
    };

    fetchUserInfo();
  }, [session, status]);

  return userInfo;
}
