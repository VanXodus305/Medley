import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F0F0F0",
        primary: "#1F2A37",
        secondary: { 100: "#A0C4FF", 200: "#03438E" },
        foreground: {
          100: "#6B7280",
          200: "#4B5563",
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};