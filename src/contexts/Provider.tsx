"use client";

import { HeroUIProvider } from "@heroui/react";
// import { SessionProvider } from "next-auth/react";
import { PropsWithChildren } from "react";
import { useRouter } from "next/navigation";

const Provider = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  return (
    // <SessionProvider>
      <HeroUIProvider navigate={router.push}>{children}</HeroUIProvider>
    // </SessionProvider>
  );
};

export default Provider;
