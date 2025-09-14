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
        background: "#F9F9FA",
        primary: "#1F2A37",
        secondary: { 100: "#4FAA84", 200: "#3C7168" },
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