"use client";

import NavBar from "@/components/NavBar";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import ChatInput from "@/components/ChatInput";
import MedicineList from "@/components/MedicineList";
import ShopList from "@/components/ShopList";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

export default function HomePage() {
  useEffect(() => {
    // Ensure page stays at top on load
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <NavBar />
      <motion.main
        className="pt-20"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.section id="home" variants={fadeInUp}>
          <HeroSection />
        </motion.section>
        <motion.section id="chat" variants={fadeInUp}>
          <ChatInput />
        </motion.section>
        <motion.section id="medicines" variants={fadeInUp}>
          <MedicineList />
        </motion.section>
        <motion.section id="shops" variants={fadeInUp}>
          <ShopList />
        </motion.section>
        <motion.section id="contact" variants={fadeInUp}>
          <Footer />
        </motion.section>
      </motion.main>
    </>
  );
}
