import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Provider from "@/contexts/Provider";

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Medley",
  description: "Find The Medicine You need — Fast & Easy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background text-primary">
      <body className={`${inter.className} ${geistMono.className}`}>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
